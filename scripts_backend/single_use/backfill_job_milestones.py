#!/usr/bin/env python3
"""One-time migration of historical market earnings into job milestone progress.

Dry-run by default. Use --apply to write per-UUID progress files.

The old economy log does not contain the configured job/tag ID, so this script
infers a subject from jobs_data.json -> Jobs[*].Markets. Markets that resolve to
zero or multiple jobs are skipped unless an explicit override mapping is given.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ECONOMY = ROOT / "world/customnpcs/scripts/logs/economy.json"
DEFAULT_JOBS_CONFIG = ROOT / "world/customnpcs/scripts/data/jobs_data.json"
DEFAULT_JOBS_DATA = ROOT / "world/customnpcs/scripts/data_auto/jobs.json"
DEFAULT_PROGRESS_DIR = ROOT / "world/customnpcs/scripts/data_auto/job_progress"
MIGRATION_ID = "economy_log_backfill_v1"


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def dump_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=4)
        handle.write("\n")


def progression_key_for_job(job: dict[str, Any]) -> str:
    return str(
        job.get("ProgressionKey")
        or job.get("JobName")
        or job.get("Title")
        or job.get("JobID")
        or job.get("JobId")
        or ""
    )


def progression_key_for_tag(tag_name: str, tag_def: dict[str, Any] | None) -> str:
    if tag_def and tag_def.get("ProgressionKey"):
        return str(tag_def["ProgressionKey"])
    return str(tag_name)


def build_market_subject_map(config: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    market_subjects: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for job in config.get("Jobs", []) or []:
        for market in job.get("Markets", []) or []:
            market_subjects[str(market)].append({"Type": "Jobs", "Definition": job})

    for tag_name, tag_def in (config.get("Tags", {}) or {}).items():
        for market in tag_def.get("Markets", []) or []:
            market_subjects[str(market)].append({
                "Type": "Tags",
                "Name": str(tag_name),
                "Definition": tag_def,
            })

    return dict(market_subjects)


def load_override_map(path: Path | None) -> dict[str, Any]:
    if path is None:
        return {}
    raw = load_json(path, {})
    if not isinstance(raw, dict):
        raise ValueError("Override map must be a JSON object keyed by market name")
    return raw


def resolve_market_subject(
    market: str,
    market_subjects: dict[str, list[dict[str, Any]]],
    overrides: dict[str, Any],
    jobs_config: dict[str, Any],
) -> tuple[str, str, list[str]] | None:
    """Return (type, progression_key, propagated_tag_keys).

    Overrides accept either:
      "Market": {"Type": "job", "Key": "Fisherman", "Tags": ["Fisherman"]}
      "Market": {"JobID": 59}
      "Market": {"Tag": "Mechanic"}
    """

    tag_defs = jobs_config.get("Tags", {}) or {}
    jobs = jobs_config.get("Jobs", []) or []

    override = overrides.get(market)
    if override:
        if isinstance(override, str):
            return ("Jobs", override, [])

        if "JobID" in override:
            wanted = str(override["JobID"])
            for job in jobs:
                jid = job.get("JobID", job.get("JobId"))
                if str(jid) == wanted:
                    key = progression_key_for_job(job)
                    tags = [
                        progression_key_for_tag(str(tag), tag_defs.get(str(tag)))
                        for tag in (job.get("Tags", []) or [])
                    ]
                    return ("Jobs", key, list(dict.fromkeys(tags)))
            return None

        if "Tag" in override:
            tag_name = str(override["Tag"])
            return ("Tags", progression_key_for_tag(tag_name, tag_defs.get(tag_name)), [])

        subject_type = str(override.get("Type", "job")).lower()
        key = str(override.get("Key", ""))
        if not key:
            return None
        tags = [str(tag) for tag in override.get("Tags", []) or []]
        return ("Tags" if subject_type == "tag" else "Jobs", key, tags)

    candidates = market_subjects.get(market, [])
    if len(candidates) != 1:
        return None

    candidate = candidates[0]
    if candidate["Type"] == "Tags":
        tag_name = candidate["Name"]
        return ("Tags", progression_key_for_tag(tag_name, candidate["Definition"]), [])

    job = candidate["Definition"]
    key = progression_key_for_job(job)
    tags = [
        progression_key_for_tag(str(tag), tag_defs.get(str(tag)))
        for tag in (job.get("Tags", []) or [])
    ]
    return ("Jobs", key, list(dict.fromkeys(tags)))


def build_name_uuid_map(jobs_data: dict[str, Any]) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for uuid, record in (jobs_data or {}).items():
        if not isinstance(record, dict):
            continue
        name = record.get("Name")
        if name:
            mapping[str(name).lower()] = str(uuid)
    return mapping


def ensure_subject(progress: dict[str, Any], namespace: str, key: str) -> dict[str, Any]:
    progress.setdefault(namespace, {})
    subject = progress[namespace].setdefault(
        key,
        {"Stats": {}, "Markets": {}, "Unlocked": {}},
    )
    subject.setdefault("Stats", {})
    subject.setdefault("Markets", {})
    subject.setdefault("Unlocked", {})
    return subject


def add_market_stats(
    progress: dict[str, Any],
    namespace: str,
    key: str,
    market: str,
    earnings: int,
) -> None:
    subject = ensure_subject(progress, namespace, key)
    stats = subject["Stats"]
    stats["market_earnings"] = int(stats.get("market_earnings", 0)) + earnings
    stats["market_transactions"] = int(stats.get("market_transactions", 0)) + 1

    market_stats = subject["Markets"].setdefault(market, {})
    market_stats["market_earnings"] = int(market_stats.get("market_earnings", 0)) + earnings
    market_stats["market_transactions"] = int(market_stats.get("market_transactions", 0)) + 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--economy", type=Path, default=DEFAULT_ECONOMY)
    parser.add_argument("--jobs-config", type=Path, default=DEFAULT_JOBS_CONFIG)
    parser.add_argument("--jobs-data", type=Path, default=DEFAULT_JOBS_DATA)
    parser.add_argument("--progress-dir", type=Path, default=DEFAULT_PROGRESS_DIR)
    parser.add_argument(
        "--market-map",
        type=Path,
        default=None,
        help="Optional JSON overrides for markets that cannot be inferred unambiguously",
    )
    parser.add_argument("--apply", action="store_true", help="Write files. Without this flag, only report.")
    parser.add_argument("--force", action="store_true", help="Re-apply even when the migration marker already exists")
    args = parser.parse_args()

    economy = load_json(args.economy, {})
    jobs_config = load_json(args.jobs_config, {"Jobs": [], "Tags": {}})
    jobs_data = load_json(args.jobs_data, {})
    overrides = load_override_map(args.market_map)

    market_subjects = build_market_subject_map(jobs_config)
    name_to_uuid = build_name_uuid_map(jobs_data)

    pending: dict[str, dict[str, Any]] = {}
    unmatched_players: set[str] = set()
    unmatched_markets: defaultdict[str, int] = defaultdict(int)
    ambiguous_markets: dict[str, list[str]] = {}
    migrated_transactions = 0
    migrated_earnings = 0
    skipped_already_migrated = 0

    for player_name, transactions in (economy or {}).items():
        uuid = name_to_uuid.get(str(player_name).lower())
        if not uuid:
            unmatched_players.add(str(player_name))
            continue

        progress_path = args.progress_dir / f"{uuid}.json"
        progress = pending.get(uuid)
        if progress is None:
            progress = load_json(
                progress_path,
                {
                    "Version": 1,
                    "UUID": uuid,
                    "Name": player_name,
                    "Jobs": {},
                    "Tags": {},
                    "Migrations": {},
                },
            )
            progress.setdefault("Version", 1)
            progress["UUID"] = uuid
            progress["Name"] = player_name
            progress.setdefault("Jobs", {})
            progress.setdefault("Tags", {})
            progress.setdefault("Migrations", {})

            if progress["Migrations"].get(MIGRATION_ID) and not args.force:
                skipped_already_migrated += 1
                continue

            pending[uuid] = progress

        for transaction in transactions or []:
            if not isinstance(transaction, dict):
                continue
            if "totalEarnings" not in transaction:
                continue

            market = transaction.get("region") or transaction.get("market")
            if not market:
                unmatched_markets["<missing>"] += 1
                continue
            market = str(market)

            subject = resolve_market_subject(market, market_subjects, overrides, jobs_config)
            if subject is None:
                candidates = market_subjects.get(market, [])
                unmatched_markets[market] += 1
                if len(candidates) > 1:
                    labels = []
                    for candidate in candidates:
                        if candidate["Type"] == "Tags":
                            labels.append(f"Tag {candidate['Name']}")
                        else:
                            job = candidate["Definition"]
                            labels.append(
                                f"{job.get('Title') or job.get('JobName')} "
                                f"(ID {job.get('JobID', job.get('JobId'))})"
                            )
                    ambiguous_markets[market] = labels
                continue

            try:
                earnings = int(round(float(transaction.get("totalEarnings", 0))))
            except (TypeError, ValueError):
                continue

            namespace, key, propagated_tags = subject
            add_market_stats(progress, namespace, key, market, earnings)
            if namespace == "Jobs":
                for tag_key in propagated_tags:
                    add_market_stats(progress, "Tags", tag_key, market, earnings)

            migrated_transactions += 1
            migrated_earnings += earnings

    print(f"Transactions to migrate: {migrated_transactions}")
    print(f"Earnings to migrate: {migrated_earnings} cents")
    print(f"Player files affected: {len(pending)}")
    if skipped_already_migrated:
        print(f"Players skipped because migration is already marked: {skipped_already_migrated}")

    if unmatched_players:
        print(f"Players without UUID mapping: {len(unmatched_players)}")
        for name in sorted(unmatched_players):
            print(f"  - {name}")

    if unmatched_markets:
        print("Skipped/unresolved markets:")
        for market, count in sorted(unmatched_markets.items(), key=lambda item: (-item[1], item[0])):
            suffix = ""
            if market in ambiguous_markets:
                suffix = " -> ambiguous: " + ", ".join(ambiguous_markets[market])
            print(f"  - {market}: {count} transaction(s){suffix}")

    if not args.apply:
        print("DRY RUN: no files written. Re-run with --apply after reviewing the report.")
        return 0

    from datetime import datetime, timezone

    applied_at = datetime.now(timezone.utc).isoformat()
    for uuid, progress in pending.items():
        progress.setdefault("Migrations", {})[MIGRATION_ID] = {
            "AppliedAt": applied_at,
            "Source": str(args.economy),
        }
        dump_json(args.progress_dir / f"{uuid}.json", progress)

    print(f"Wrote {len(pending)} progress file(s) to {args.progress_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
