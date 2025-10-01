import json
import os
import argparse
from collections import defaultdict, Counter
from datetime import datetime, timezone
import time
from typing import Optional, Tuple
import nbtlib
try:
    # Python 3.9+
    from zoneinfo import ZoneInfo  # type: ignore
except Exception:  # pragma: no cover - runtime fallback
    ZoneInfo = None


# File paths (adjustable via CLI if needed)
CONFIG_PATH = "/home/mouette/gramados-v2/world/customnpcs/scripts/ecmascript/modules/jobs/config.json"
DATA_PATH = "/home/mouette/gramados-v2/world/customnpcs/scripts/data_auto/jobs.json"
OUTPUT_PATH = "/home/mouette/gramados-v2/reports/player_jobs_report.md"
LEVEL_DAT_PATH = "/home/mouette/gramados-v2/world/level.dat"


def load_json(path):
    with open(path, "r") as f:
        return json.load(f)


def ticks_to_human(ticks):
    # 20 ticks = 1 second
    try:
        seconds = int(ticks) / 20
    except Exception:
        return "unknown"
    days, rem = divmod(int(seconds), 86400)
    hours, rem = divmod(rem, 3600)
    minutes, seconds = divmod(rem, 60)
    parts = []
    if days:
        parts.append(f"{days}d")
    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes}m")
    if not parts:
        parts.append(f"{seconds}s")
    return " ".join(parts)


def load_world_clock(level_dat_path: str) -> Tuple[Optional[int], Optional[int], str]:
    """Return (world_time_ticks, last_played_ms, anchor_source) from level.dat if available.
    anchor_source describes where the wall-clock anchor came from.
    """
    try:
        nbt = nbtlib.load(level_dat_path)
        data = nbt["Data"]
        # Vanilla 1.12 layout stores as long
        world_time = int(data.get("Time", 0))
        # Try to get an absolute anchor in ms since epoch. Some server worlds don't store LastPlayed in level.dat.
        last_played = None
        anchor_source = "unknown"
        try:
            if "LastPlayed" in data:
                last_played = int(data.get("LastPlayed", 0))
                anchor_source = "level.dat:LastPlayed"
            elif "lastPlayed" in data:
                last_played = int(data.get("lastPlayed", 0))
                anchor_source = "level.dat:lastPlayed"
        except Exception:
            last_played = None

        # Fallback: approximate anchor from filesystem times when NBT doesn't provide one.
        # Preference: session.lock mtime (updated while the server is running), otherwise level.dat mtime.
        if not last_played or last_played <= 0:
            try:
                world_dir = os.path.dirname(level_dat_path)
                lock_path = os.path.join(world_dir, "session.lock")
                if os.path.exists(lock_path):
                    last_played = int(os.path.getmtime(lock_path) * 1000)
                    anchor_source = "session.lock mtime"
                else:
                    last_played = int(os.path.getmtime(level_dat_path) * 1000)
                    anchor_source = "level.dat mtime"
            except Exception:
                # As a last resort, leave it None; callers will gracefully degrade to duration-only output.
                last_played = None

        # As an absolute last resort, use the system clock so that we can still show dates (approximate)
        if not last_played or last_played <= 0:
            last_played = int(time.time() * 1000)
            anchor_source = "system clock (approx)"

        return world_time, last_played, anchor_source
    except Exception:
        return None, None, "error"


def human_since_start(start_ticks: Optional[int], now_ticks: Optional[int]) -> str:
    if start_ticks is None:
        return "unknown"
    if now_ticks is None:
        # Fallback to absolute formatting of start_ticks
        return ticks_to_human(start_ticks)
    try:
        dur = int(now_ticks) - int(start_ticks)
        if dur < 0:
            return "0s"
        return ticks_to_human(dur)
    except Exception:
        return "unknown"


def human_duration_between(start_ticks: Optional[int], end_ticks: Optional[int]) -> str:
    if start_ticks is None or end_ticks is None:
        return ""
    try:
        dur = int(end_ticks) - int(start_ticks)
        if dur < 0:
            return ""
        return ticks_to_human(dur)
    except Exception:
        return ""


def tick_to_datetime(tick: Optional[int], now_ticks: Optional[int], last_played_ms: Optional[int], tzinfo=None) -> Optional[datetime]:
    """Convert a world tick value to a UTC datetime using the current world clock.
    Assumes `now_ticks` corresponds to the UTC time `last_played_ms` from level.dat.
    """
    if tick is None or now_ticks is None or last_played_ms is None:
        return None
    try:
        dt_seconds = (last_played_ms / 1000.0) - ((int(now_ticks) - int(tick)) / 20.0)
        return datetime.fromtimestamp(dt_seconds, tzinfo or timezone.utc)
    except Exception:
        return None


def tick_to_dt_str(tick: Optional[int], now_ticks: Optional[int], last_played_ms: Optional[int], tzinfo=None) -> str:
    dt = tick_to_datetime(tick, now_ticks, last_played_ms, tzinfo=tzinfo)
    if not dt:
        return ""
    # Requested format: DD/MM/YYYY - HH:MM
    return dt.strftime("%d/%m/%Y - %H:%M")


def safe_get(dct, *keys, default=None):
    cur = dct
    for k in keys:
        if not isinstance(cur, dict) or k not in cur:
            return default
        cur = cur[k]
    return cur


def build_job_index(config):
    jobs = config.get("Jobs", []) or []
    by_id = {}
    by_id_str = {}
    for job in jobs:
        jid = job.get("JobID")
        if jid is None:
            continue
        by_id[jid] = job
        by_id_str[str(jid)] = job
    return by_id, by_id_str


def calculate_player_views(data, config, tzinfo=None):
    job_by_id, job_by_id_str = build_job_index(config)
    region_limits = config.get("Region_Job_Limits", {})
    now_ticks, last_played_ms, anchor_source = load_world_clock(LEVEL_DAT_PATH)

    players_summary = []
    players_with_no_jobs = []

    # Global aggregations
    global_region_type_counts = defaultdict(lambda: defaultdict(int))  # region -> type -> count
    job_active_counts = Counter()  # job_id_str -> count
    tag_counts = Counter()  # tag name -> active players count

    for uuid, record in (data or {}).items():
        name = record.get("Name", uuid)
        active = record.get("ActiveJobs", {}) or {}
        history = record.get("JobHistory", {}) or {}

        # Per-player aggregations
        per_region_type = defaultdict(lambda: defaultdict(int))
        player_tags = set()
        player_active_jobs = []

        # Active jobs
        for jid_str, j in active.items():
            job_def = job_by_id_str.get(jid_str, {})
            job_name = j.get("JobName") or job_def.get("JobName", f"Job {jid_str}")
            j_region = j.get("Region") or job_def.get("Region", "Unknown")
            j_type = j.get("Type") or job_def.get("Type", "Unknown")
            start_ticks = j.get("StartTime")

            player_active_jobs.append({
                "id": jid_str,
                "name": job_name,
                "region": j_region,
                "type": j_type,
                "start_ticks": start_ticks,
                # Keep duration internally, but we won't render it when dates-only is desired
                "since": human_since_start(start_ticks, now_ticks),
                "since_dt": tick_to_dt_str(start_ticks, now_ticks, last_played_ms, tzinfo=tzinfo),
            })

            per_region_type[j_region][j_type] += 1
            global_region_type_counts[j_region][j_type] += 1
            job_active_counts[jid_str] += 1

            # Tags from job definition
            for t in job_def.get("Tags", []) or []:
                player_tags.add(t)

        # Count tags by number of players having at least one job with that tag
        for t in player_tags:
            tag_counts[t] += 1

        # Prepare per-player limits vs usage
        limits_check = []
        # Only check regions the player is involved in to keep output compact
        for region, type_counts in per_region_type.items():
            region_limit_map = region_limits.get(region, {})
            row = {"region": region, "types": []}
            for jtype, cnt in type_counts.items():
                limit = region_limit_map.get(jtype)
                exceeded = (limit is not None and cnt > limit)
                row["types"].append({
                    "type": jtype,
                    "count": cnt,
                    "limit": limit,
                    "exceeded": exceeded,
                })
            limits_check.append(row)

    # History (sorted by EndTime desc if present)
        history_items = []
        for jid_str, h in history.items():
            job_def = job_by_id_str.get(jid_str, {})
            job_name = h.get("JobName") or job_def.get("JobName", f"Job {jid_str}")
            j_region = h.get("Region") or job_def.get("Region", "Unknown")
            j_type = h.get("Type") or job_def.get("Type", "Unknown")
            start_ticks = h.get("StartTime")
            end_ticks = h.get("EndTime")
            history_items.append({
                "id": jid_str,
                "name": job_name,
                "region": j_region,
                "type": j_type,
                "start_ticks": start_ticks,
                "end_ticks": end_ticks,
                "duration": human_duration_between(start_ticks, end_ticks),
                "start_dt": tick_to_dt_str(start_ticks, now_ticks, last_played_ms, tzinfo=tzinfo),
                "end_dt": tick_to_dt_str(end_ticks, now_ticks, last_played_ms, tzinfo=tzinfo),
            })

        history_items.sort(key=lambda x: (x.get("end_ticks") or 0), reverse=True)

        # Aggregate totals (in ticks)
        total_active_ticks = 0
        if now_ticks is not None:
            for j in player_active_jobs:
                st = j.get("start_ticks")
                try:
                    if st is not None:
                        dt = int(now_ticks) - int(st)
                        if dt > 0:
                            total_active_ticks += dt
                except Exception:
                    pass

        total_history_ticks = 0
        for h in history_items:
            st = h.get("start_ticks")
            et = h.get("end_ticks")
            try:
                if st is not None and et is not None:
                    dt = int(et) - int(st)
                    if dt > 0:
                        total_history_ticks += dt
            except Exception:
                pass

        total_ticks = total_active_ticks + total_history_ticks

        # If no active jobs
        if not player_active_jobs:
            players_with_no_jobs.append(name)

        players_summary.append({
            "uuid": uuid,
            "name": name,
            "active_jobs": player_active_jobs,
            "limits_check": limits_check,
            "tags": sorted(player_tags),
            "history": history_items,
            "total_ticks_active": total_active_ticks,
            "total_ticks_history": total_history_ticks,
            "total_ticks_total": total_ticks,
        })

    # Build global popular jobs list by job id
    job_popularity = []
    for jid_str, count in job_active_counts.most_common():
        job_def = job_by_id_str.get(jid_str, {})
        job_name = job_def.get("JobName", f"Job {jid_str}")
        region = job_def.get("Region", "Unknown")
        jtype = job_def.get("Type", "Unknown")
        job_popularity.append({
            "id": jid_str,
            "name": job_name,
            "region": region,
            "type": jtype,
            "count": count,
        })

    # Prepare region capacity overview
    region_capacity_rows = []
    for region, types in (region_limits or {}).items():
        row = {"region": region, "types": []}
        for jtype, limit in types.items():
            used = global_region_type_counts[region].get(jtype, 0)
            remaining = limit - used
            row["types"].append({
                "type": jtype,
                "limit": limit,
                "used": used,
                "remaining": remaining,
            })
        # Keep a stable type order Starter, Advanced, Prestige if present
        order = {"Starter": 0, "Advanced": 1, "Prestige": 2}
        row["types"].sort(key=lambda x: order.get(x["type"], 99))
        region_capacity_rows.append(row)

    region_capacity_rows.sort(key=lambda r: r["region"])  # alpha order

    return {
        "now_ticks": now_ticks,
        "last_played_ms": last_played_ms,
        "anchor_source": anchor_source,
        "tz_name": getattr(tzinfo, "key", None) if tzinfo is not None else "UTC",
        "players_summary": players_summary,
        "players_with_no_jobs": sorted(players_with_no_jobs),
        "job_popularity": job_popularity,
        "global_region_type_counts": global_region_type_counts,
        "region_capacity_rows": region_capacity_rows,
        "tag_counts": tag_counts,
    }


def generate_markdown(report_data, output_path):
    players_summary = report_data["players_summary"]
    players_with_no_jobs = report_data["players_with_no_jobs"]
    job_popularity = report_data["job_popularity"]
    region_capacity_rows = report_data["region_capacity_rows"]
    tag_counts = report_data["tag_counts"]
    now_ticks = report_data.get("now_ticks")
    last_played_ms = report_data.get("last_played_ms")
    anchor_source = report_data.get("anchor_source")
    tz_name = report_data.get("tz_name") or "UTC"

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w") as f:
        f.write("# Player Jobs Report\n\n")
        if now_ticks is not None:
            f.write(f"_World tick_: {now_ticks} (20 ticks = 1s)\n\n")
        if last_played_ms is not None and last_played_ms > 0:
            try:
                # We render header as per tz_name already applied upstream when computing strings
                tz = timezone.utc if tz_name == "UTC" else (ZoneInfo(tz_name) if ZoneInfo else timezone.utc)
                dt = datetime.fromtimestamp(last_played_ms / 1000.0, tz)
                f.write(f"_Last played ({tz_name})_: {dt.strftime('%d/%m/%Y - %H:%M')}\n\n")
            except Exception:
                pass
        if anchor_source:
            f.write(f"_Time anchor source_: {anchor_source}\n\n")

        # High-level summaries first
        # Limits are per-player, not global; show only players exceeding their limits
        violators = []
        for p in players_summary:
            rows = []
            for r in p.get("limits_check", []):
                exceeded_types = [t for t in r.get("types", []) if t.get("exceeded")]
                if exceeded_types:
                    rows.append({
                        "region": r["region"],
                        "types": exceeded_types,
                    })
            if rows:
                violators.append({"name": p["name"], "rows": rows})

        f.write("## Per-Player Limit Issues\n\n")
        if not violators:
            f.write("No players are exceeding their per-player job limits.\n\n")
        else:
            for v in sorted(violators, key=lambda x: x["name"].lower()):
                f.write(f"- **{v['name']}**\n")
                for r in v["rows"]:
                    pieces = []
                    order = {"Starter": 0, "Advanced": 1, "Prestige": 2}
                    for t in sorted(r["types"], key=lambda x: order.get(x["type"], 99)):
                        lim = t.get("limit")
                        cnt = t.get("count", 0)
                        if lim is None:
                            pieces.append(f"{t['type']} {cnt}/n.a.")
                        else:
                            pieces.append(f"{t['type']} {cnt}/{lim}")
                    f.write(f"  - {r['region']}: " + ", ".join(pieces) + "\n")
            f.write("\n")

        if job_popularity:
            f.write("## Most Popular Active Jobs\n\n")
            for j in job_popularity[:20]:
                f.write(
                    f"- {j['name']} — {j['region']} ({j['type']}): {j['count']} active\n"
                )
            f.write("\n")

        if tag_counts:
            f.write("## Tags (players with at least one job under the tag)\n\n")
            for tag in sorted(tag_counts.keys(), key=lambda s: s.lower()):
                f.write(f"- {tag}: {tag_counts[tag]}\n")
            f.write("\n")

        # Defer 'Players With No Active Jobs' to the end of the report

        # Per-player detailed sections
        f.write("## Players (sorted by total time spent in jobs)\n\n")
        # Sort players by name
        players_summary = sorted(
            players_summary,
            key=lambda p: (p.get("total_ticks_total") or 0),
            reverse=True,
        )

        for p in players_summary:
            total_ticks = p.get("total_ticks_total") or 0
            # Skip empty players (no active jobs and no time), to avoid noisy '0s' and 'none' sections
            if not p.get("active_jobs") and total_ticks == 0:
                continue
            total_human = ticks_to_human(total_ticks) if total_ticks else "0s"
            f.write(f"### {p['name']}\n\n")
            f.write(f"- Total time in jobs: {total_human}\n")

            # Active jobs
            if p["active_jobs"]:
                f.write("- Active Jobs:\n")
                for j in sorted(p["active_jobs"], key=lambda x: (x["region"], x["type"], x["name"])):
                    since_dt = j.get("since_dt")
                    tail = f"since {since_dt}" if since_dt else ""
                    f.write(
                        f"  - {j['name']} — {j['region']} ({j['type']}); {tail}\n"
                    )
            else:
                f.write("- Active Jobs: none\n")

            # Limits vs usage
            if p["limits_check"]:
                f.write("- Usage vs Limits by Region:\n")
                for r in sorted(p["limits_check"], key=lambda x: x["region"]):
                    f.write(f"  - {r['region']}: ")
                    pieces = []
                    # Prefer Starter, Advanced, Prestige ordering
                    order = {"Starter": 0, "Advanced": 1, "Prestige": 2}
                    for t in sorted(r["types"], key=lambda x: order.get(x["type"], 99)):
                        lim = t["limit"]
                        if lim is None:
                            pieces.append(f"{t['type']} {t['count']}/n.a.")
                        else:
                            suffix = "!" if t["exceeded"] else ""
                            pieces.append(f"{t['type']} {t['count']}/{lim}{suffix}")
                    f.write(", ".join(pieces) + "\n")

            # Tags
            if p["tags"]:
                f.write("- Tags: " + ", ".join(p["tags"]) + "\n")

            # Recent history (last 10)
            if p["history"]:
                f.write("- Recent Job History (latest 10):\n")
                for h in p["history"][:10]:
                    start_dt = h.get("start_dt")
                    end_dt = h.get("end_dt")
                    period = ""
                    if start_dt and end_dt:
                        period = f" {start_dt} → {end_dt}"
                    elif start_dt:
                        period = f" {start_dt}"
                    elif end_dt:
                        period = f" {end_dt}"
                    f.write(
                        f"  - {h['name']} — {h['region']} ({h['type']}){period}\n"
                    )

            f.write("\n")

        # Players with no active jobs listed at the end
        if players_with_no_jobs:
            f.write("## Players With No Active Jobs\n\n")
            for name in players_with_no_jobs:
                f.write(f"- {name}\n")
            f.write("\n")

    return output_path


def main():
    parser = argparse.ArgumentParser(description="Generate player jobs markdown report.")
    parser.add_argument("--config", default=CONFIG_PATH, help="Path to jobs config.json")
    parser.add_argument("--data", default=DATA_PATH, help="Path to jobs.json (dynamic data)")
    parser.add_argument(
        "--output", default=OUTPUT_PATH, help="Output markdown path"
    )
    parser.add_argument(
        "--tz",
        default="UTC",
        help="IANA timezone name (e.g., UTC, Europe/Paris). Defaults to UTC.",
    )
    args = parser.parse_args()

    # Resolve timezone
    def _resolve_tz(name: str):
        if not name or name.upper() == "UTC":
            return timezone.utc
        if ZoneInfo is not None:
            try:
                return ZoneInfo(name)
            except Exception:
                return timezone.utc
        return timezone.utc

    tzinfo = _resolve_tz(args.tz)

    config = load_json(args.config)
    data = load_json(args.data)
    report_data = calculate_player_views(data, config, tzinfo=tzinfo)
    out = generate_markdown(report_data, args.output)
    print(f"Player jobs report written to {out}")


if __name__ == "__main__":
    main()
