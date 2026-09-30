#!/usr/bin/env python3
"""One-time migration of casino runtime data to per-casino and per-player files.

The old source is:
    world/customnpcs/scripts/data_auto/casinos.json

The new layout is:
    world/customnpcs/scripts/data_auto/casinos/<casino_id>.json
    world/customnpcs/scripts/data_auto/casinos/gamblers/<uuid>.json

Dry-run by default. Use --apply to write the migrated files.
The legacy source file is left untouched for manual backup/removal after verification.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT / "world/customnpcs/scripts/data_auto/casinos.json"
DEFAULT_CASINO_CONFIG = (
    ROOT / "world/customnpcs/scripts/ecmascript/modules/casino/casinos.json"
)
DEFAULT_OUTPUT_DIR = ROOT / "world/customnpcs/scripts/data_auto/casinos"


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


def to_timestamp(value: Any) -> int:
    """Convert old ISO timestamps to Unix milliseconds when possible."""
    if value is None:
        return 0

    if isinstance(value, (int, float)):
        return int(value)

    text = str(value).strip()
    if not text:
        return 0

    try:
        return int(float(text))
    except ValueError:
        pass

    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return int(parsed.timestamp() * 1000)
    except ValueError:
        return 0


def migrate(
    old_data: dict[str, Any],
    casino_config: dict[str, Any],
) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    casinos: dict[str, dict[str, Any]] = {}
    gamblers: dict[str, dict[str, Any]] = {}

    for casino_id, old_casino in old_data.items():
        if not isinstance(old_casino, dict):
            continue

        definition = casino_config.get(casino_id, {})
        casino_name = (
            definition.get("DisplayName")
            or old_casino.get("Name")
            or casino_id
        )

        opened = old_casino.get("CratesOpened") or {}
        rewards = old_casino.get("RewardsDistributed") or {}

        casinos[casino_id] = {
            "Version": 1,
            "Casino": casino_id,
            "Name": casino_name,
            "Timestamp": to_timestamp(old_casino.get("LastOpenedAt")),
            "CratesOpened": {
                "Total": int(opened.get("Total", 0) or 0),
                "ByType": dict(opened.get("ByType") or {}),
                # Kept intentionally in YYYY-MM-DD form.
                "ByDate": dict(opened.get("ByDate") or {}),
            },
            "loot_box_rewards": {
                "TotalStacks": int(rewards.get("TotalStacks", 0) or 0),
                "TotalItems": int(rewards.get("TotalItems", 0) or 0),
                "ByItem": dict(rewards.get("ByItem") or {}),
            },
        }

        for uuid, old_player in (old_casino.get("Players") or {}).items():
            if not isinstance(old_player, dict):
                continue

            uuid = str(uuid)
            name = str(old_player.get("Name") or "")
            gambler = gamblers.setdefault(
                uuid,
                {
                    "Version": 1,
                    "UUID": uuid,
                    "Name": name,
                    "Games": {
                        "loot_crates": {},
                    },
                },
            )
            if name:
                gambler["Name"] = name

            player_opened = old_player.get("CratesOpened") or {}
            gambler["Games"]["loot_crates"][casino_id] = {
                "Timestamp": to_timestamp(old_player.get("LastOpenedAt")),
                "CratesOpened": {
                    "Total": int(player_opened.get("Total", 0) or 0),
                    "ByType": dict(player_opened.get("ByType") or {}),
                },
            }

    return casinos, gamblers


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--casino-config", type=Path, default=DEFAULT_CASINO_CONFIG)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write migrated files. Without this flag, only report what would be written.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Allow overwriting target casino/gambler files if they already exist.",
    )
    args = parser.parse_args()

    if not args.source.exists():
        print(f"Source file not found: {args.source}")
        return 1

    old_data = load_json(args.source, {})
    casino_config = load_json(args.casino_config, {})
    if not isinstance(old_data, dict):
        print("Source casino data is not a JSON object.")
        return 2

    casinos, gamblers = migrate(old_data, casino_config)

    print(f"Casinos to migrate: {len(casinos)}")
    print(f"Gamblers to migrate: {len(gamblers)}")
    print(f"Output directory: {args.output_dir}")

    targets: list[tuple[Path, dict[str, Any]]] = []
    for casino_id, data in casinos.items():
        targets.append((args.output_dir / f"{casino_id}.json", data))
    for uuid, data in gamblers.items():
        targets.append((args.output_dir / "gamblers" / f"{uuid}.json", data))

    existing = [path for path, _ in targets if path.exists()]
    if existing and not args.force:
        print("Refusing to overwrite existing migrated files:")
        for path in existing:
            print(f"  - {path}")
        print("Re-run with --force only if overwriting them is intended.")
        return 3

    if not args.apply:
        print("DRY RUN: no files written. Re-run with --apply after reviewing this report.")
        return 0

    for path, data in targets:
        dump_json(path, data)

    print(f"Wrote {len(targets)} migrated file(s).")
    print(f"Legacy source left untouched: {args.source}")
    print("The new JavaScript code no longer reads the legacy file.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
