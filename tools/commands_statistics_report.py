#!/usr/bin/env python3
"""
Command Usage Statistics Report

Parses CustomServerTools command history files and generates a Markdown report
with the following sections:

- Overall top 10 commands (including admins)
- Overall top 10 commands (excluding admins: TheOddlySeagull, Runonstof)
- Global totals: how many times each command was run (ignoring parameters)
- Per-player totals and average per active year
- For each player: most-used command (total, average/year, per-year breakdown)
- For each player: oldest and most recent command executed (players ordered by last seen)

Assumptions and notes:
- History files are named like: commandhistory_D-M-YYYY.txt (leading zeros optional)
- Lines follow the format: [HH:MM:SS] [Username] Issued command: <command and optional params>
- "Ignore parameters" means we only count the first token of the command string, case-insensitive.

Output path defaults to /home/mouette/gramados-v2/reports/command_usage_report.md
"""

from __future__ import annotations

import argparse
import glob
import os
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Set


HISTORY_DIR = "/home/mouette/gramados-v2/CustomServerTools/history"
OUTPUT_PATH = "/home/mouette/gramados-v2/reports/command_usage_report.md"
CUSTOM_SERVER_TOOLS_JS = "/home/mouette/gramados-v2/world/customnpcs/scripts/ecmascript/CustomServerTools.js"

ADMIN_USERNAMES = {"TheOddlySeagull", "Runonstof"}


FILENAME_RE = re.compile(r"^commandhistory_(\d{1,2})-(\d{1,2})-(\d{4})\.txt$")
LINE_RE = re.compile(
    r"^\[(?P<h>\d{2}):(?P<m>\d{2}):(?P<s>\d{2})\]\s+\[(?P<user>[^\]]+)\]\s+Issued command:\s+(?P<cmd>.+?)\s*$"
)


@dataclass
class Event:
    user: str
    dt: datetime
    cmd_raw: str
    cmd_base: str


def parse_filename_date(path: str) -> Optional[Tuple[int, int, int]]:
    """Return (year, month, day) from the filename, or None if not matched."""
    name = os.path.basename(path)
    m = FILENAME_RE.match(name)
    if not m:
        return None
    day = int(m.group(1))
    month = int(m.group(2))
    year = int(m.group(3))
    return year, month, day


def parse_line(line: str) -> Optional[Tuple[int, int, int, str, str]]:
    """Return (h, m, s, user, cmd_raw) if matched."""
    m = LINE_RE.match(line)
    if not m:
        return None
    h = int(m.group("h"))
    mi = int(m.group("m"))
    s = int(m.group("s"))
    user = m.group("user").strip()
    cmd_raw = m.group("cmd").strip()
    return h, mi, s, user, cmd_raw


def base_command(cmd_raw: str) -> str:
    """Normalize to the first token, lowercased. Keeps leading prefix like ! or /."""
    token = cmd_raw.split()[0] if cmd_raw else ""
    # Use casefold for robust case-insensitive matching
    return token.casefold()


def extract_valid_commands(js_path: str) -> Set[str]:
    """Extract valid base commands from CustomServerTools.js.
    Heuristic: quoted strings starting with ! or / and containing no whitespace.
    Returns a set of lowercased command tokens (e.g., "!withdraw").
    """
    valid: Set[str] = set()
    try:
        with open(js_path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
        # Match strings that START with a command token inside quotes, but allow extra text after it
        # Example: '!player unlock <player> <unlock>' -> captures '!player'
        # Example: "!eval [...code]" -> captures '!eval'
        token_re = re.compile(r"^([!/])[A-Za-z][A-Za-z0-9_]*$")
        pattern = re.compile(r"(['\"])\s*([!/][A-Za-z][A-Za-z0-9_]*)\b[\s\S]*?\1")
        for m in pattern.finditer(text):
            raw_token = m.group(2).strip()
            cmd = raw_token.split()[0]
            if not cmd:
                continue
            if not token_re.match(cmd):
                continue
            valid.add(cmd.casefold())
    except Exception:
        pass
    return valid


def iter_history_events(history_dir: str, valid_commands: Optional[Set[str]] = None) -> List[Event]:
    events: List[Event] = []
    paths = sorted(glob.glob(os.path.join(history_dir, "commandhistory_*.txt")))
    for path in paths:
        ymd = parse_filename_date(path)
        if not ymd:
            continue
        year, month, day = ymd
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                for line in f:
                    line = line.rstrip("\n")
                    if not line.strip():
                        continue
                    pl = parse_line(line)
                    if not pl:
                        continue
                    h, mi, s, user, cmd_raw = pl
                    try:
                        dt = datetime(year, month, day, h, mi, s)
                    except Exception:
                        # Skip ill-formed timestamps
                        continue
                    cmd_base_tok = base_command(cmd_raw)
                    # Filter by valid commands if provided and non-empty
                    if valid_commands:
                        if cmd_base_tok not in valid_commands:
                            continue
                    events.append(
                        Event(
                            user=user,
                            dt=dt,
                            cmd_raw=cmd_raw,
                            cmd_base=cmd_base_tok,
                        )
                    )
        except FileNotFoundError:
            continue
    return events


def group_stats(events: List[Event]):
    # Global totals (all users)
    global_counts = Counter(e.cmd_base for e in events)

    # Global totals excluding admins
    global_counts_non_admin = Counter(e.cmd_base for e in events if e.user not in ADMIN_USERNAMES)

    # Per-player aggregations
    per_player_events: Dict[str, List[Event]] = defaultdict(list)
    for e in events:
        per_player_events[e.user].append(e)

    per_player_summary = {}
    for user, evs in per_player_events.items():
        # Sort events by datetime
        evs_sorted = sorted(evs, key=lambda x: x.dt)
        first = evs_sorted[0]
        last = evs_sorted[-1]

        # Counts per command
        counts = Counter(e.cmd_base for e in evs_sorted)
        # Active years (at least one command in that year)
        years_active = sorted({e.dt.year for e in evs_sorted})
        n_years_active = max(1, len(years_active))

        # Total per player and average per active year
        total_cmds = len(evs_sorted)
        avg_per_year = total_cmds / n_years_active

        # Most-used command for player
        most_used_cmd: Optional[str] = counts.most_common(1)[0][0] if counts else None
        most_used_total = counts.get(most_used_cmd, 0) if most_used_cmd else 0

        # By-year breakdown for that most-used command
        by_year = defaultdict(int)
        if most_used_cmd:
            for e in evs_sorted:
                if e.cmd_base == most_used_cmd:
                    by_year[e.dt.year] += 1

        most_used_avg_per_year = (most_used_total / n_years_active) if n_years_active else 0.0

        per_player_summary[user] = {
            "first": first,
            "last": last,
            "counts": counts,
            "years_active": years_active,
            "total_cmds": total_cmds,
            "avg_per_year": avg_per_year,
            "most_used_cmd": most_used_cmd,
            "most_used_total": most_used_total,
            "most_used_avg_per_year": most_used_avg_per_year,
            "most_used_by_year": dict(sorted(by_year.items())),
        }

    return global_counts, global_counts_non_admin, per_player_summary


def human_dt(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def write_report(
    output_path: str,
    events: List[Event],  # filtered to valid commands
    global_counts: Counter,
    global_counts_non_admin: Counter,
    per_player_summary: Dict[str, dict],
    *,
    all_events: Optional[List[Event]] = None,
    valid_commands: Optional[Set[str]] = None,
):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("# Command Usage Report\n\n")
        f.write(f"Generated on: {now_str}\n\n")

        # Overall Top 10 (including admins)
        f.write("## Top 10 Commands (including admins)\n\n")
        top10_incl = global_counts.most_common(10)
        if not top10_incl:
            f.write("No data found.\n\n")
        else:
            for i, (cmd, cnt) in enumerate(top10_incl, 1):
                f.write(f"{i}. `{cmd}` — {cnt}\n")
            f.write("\n")

        # Overall Top 10 (excluding admins)
        f.write("## Top 10 Commands (excluding admins)\n\n")
        top10 = global_counts_non_admin.most_common(10)
        if not top10:
            f.write("No data found.\n\n")
        else:
            for i, (cmd, cnt) in enumerate(top10, 1):
                f.write(f"{i}. `{cmd}` — {cnt}\n")
            f.write("\n")

        # Global totals
        f.write("## Global Totals (all players, command base only)\n\n")
        for cmd, cnt in global_counts.most_common():
            f.write(f"- `{cmd}` — {cnt}\n")
        f.write("\n")

        # Most popular command by year
        f.write("## Most Popular Command by Year\n\n")
        # Overall
        per_year_overall: Dict[int, Counter] = defaultdict(Counter)
        per_year_non_admin: Dict[int, Counter] = defaultdict(Counter)
        for e in events:
            per_year_overall[e.dt.year][e.cmd_base] += 1
            if e.user not in ADMIN_USERNAMES:
                per_year_non_admin[e.dt.year][e.cmd_base] += 1
        years = sorted(per_year_overall.keys())
        if years:
            f.write("### Overall\n\n")
            for y in years:
                if per_year_overall[y]:
                    top3 = per_year_overall[y].most_common(3)
                    rank_str = "; ".join([f"{i+1}. `{c}` — {n}" for i, (c, n) in enumerate(top3)])
                    f.write(f"- {y}: {rank_str}\n")
            f.write("\n")
        years_non_admin = sorted(per_year_non_admin.keys())
        if years_non_admin:
            f.write("### Excluding admins\n\n")
            for y in years_non_admin:
                if per_year_non_admin[y]:
                    top3 = per_year_non_admin[y].most_common(3)
                    rank_str = "; ".join([f"{i+1}. `{c}` — {n}" for i, (c, n) in enumerate(top3)])
                    f.write(f"- {y}: {rank_str}\n")
            f.write("\n")

        # Legacy/Removed commands (appear in history but not in JS), threshold >= 3
        if all_events is not None and valid_commands is not None:
            legacy_counts = Counter()
            for e in all_events:
                if e.cmd_base not in valid_commands:
                    legacy_counts[e.cmd_base] += 1
            legacy_pop = [(cmd, cnt) for cmd, cnt in legacy_counts.most_common() if cnt >= 3]
            if legacy_pop:
                f.write("## Legacy/Removed Commands (not in CustomServerTools.js, used ≥ 3 times)\n\n")
                for cmd, cnt in legacy_pop:
                    f.write(f"- `{cmd}` — {cnt}\n")
                f.write("\n")

        # Per-player totals and averages
        f.write("## Per-Player Totals and Average per Active Year\n\n")
        # Order players by last seen desc
        players_ordered = sorted(per_player_summary.items(), key=lambda kv: kv[1]["last"].dt, reverse=True)
        for user, s in players_ordered:
            f.write(f"- **{user}**\n")
            f.write(f"  - Total: {s['total_cmds']}\n")
            f.write(f"  - Years active: {len(s['years_active'])}\n")
            f.write(f"  - Average/year: {s['avg_per_year']:.2f}\n")
        f.write("\n")

        # Per-player most-used command details
        f.write("## Per-Player Most-Used Command\n\n")
        f.write(
            "For each player: most-used command base, with total count, average per active year, and per-year breakdown.\n\n"
        )
        for user, s in players_ordered:
            muc = s.get("most_used_cmd")
            if not muc:
                f.write(f"- **{user}** — no commands recorded\n")
                continue
            f.write(
                f"- **{user}** — `{muc}`: total {s['most_used_total']}, "
                f"avg/year {s['most_used_avg_per_year']:.2f}, by year: "
            )
            by_year = s.get("most_used_by_year", {})
            if by_year:
                parts = [f"{y}: {c}" for y, c in by_year.items()]
                f.write(", ".join(parts) + "\n")
            else:
                f.write("(no yearly data)\n")
        f.write("\n")

        # Per-player first/last
        f.write("## Per-Player First and Last Commands (ordered by last seen)\n\n")
        for user, s in players_ordered:
            first: Event = s["first"]
            last: Event = s["last"]
            f.write(f"- **{user}**\n")
            f.write(f"  - First: {human_dt(first.dt)} — `{first.cmd_base}` (raw: {first.cmd_raw})\n")
            f.write(f"  - Last:  {human_dt(last.dt)} — `{last.cmd_base}` (raw: {last.cmd_raw})\n")
        f.write("\n")

        # Footer
        f.write("Report generated from CustomServerTools command history files.\n")

        # Matrix: Commands x Years (confirmed commands only)
        try:
            f.write("\n## Command Usage Matrix (confirmed commands)\n\n")
            # Build per-year counters from filtered events (confirmed commands)
            matrix_years = sorted({e.dt.year for e in events})
            per_year_counts: Dict[int, Counter] = defaultdict(Counter)
            for e in events:
                per_year_counts[e.dt.year][e.cmd_base] += 1

            # Order commands by total usage desc (confirmed only)
            total_counts = Counter(e.cmd_base for e in events)
            ordered_cmds = [cmd for cmd, _ in total_counts.most_common()]

            # Header
            header = "| Command | " + " | ".join(str(y) for y in matrix_years) + " |\n"
            sep = "| --- " + "| " * len(matrix_years) + "\n"
            # Make separator with correct number of columns
            sep = "| --- |" + " ".join([" --- |" for _ in matrix_years]) + "\n"
            f.write(header)
            f.write(sep)

            # Rows
            for cmd in ordered_cmds:
                row_vals = [str(per_year_counts[y].get(cmd, 0)) for y in matrix_years]
                f.write(f"| `{cmd}` | " + " | ".join(row_vals) + " |\n")
            f.write("\n")
        except Exception:
            # Don't fail report if matrix rendering stumbles
            pass

        # Command usage matrix (confirmed commands only)
        # X-axis: years; Y-axis: commands (sorted by total usage desc)
        years_sorted = sorted({e.dt.year for e in events})
        cmd_totals = Counter(e.cmd_base for e in events)
        cmds_sorted = [cmd for cmd, _ in cmd_totals.most_common()]

        # Build a mapping year -> cmd -> count
        year_cmd_counts: Dict[int, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        for e in events:
            year_cmd_counts[e.dt.year][e.cmd_base] += 1

        # Build 2D matrix rows=len(cmds_sorted), cols=len(years_sorted)
        matrix = []
        for cmd in cmds_sorted:
            row = []
            for y in years_sorted:
                row.append(year_cmd_counts[y].get(cmd, 0))
            matrix.append(row)

        # f.write("\n## Command Usage Matrix (confirmed commands only)\n\n")
        # f.write("This section provides a machine-friendly 2D array: X=years (columns), Y=commands (rows), values are counts.\n\n")
        # # JSON-like payload for programmatic use
        # import json as _json
        # payload = {
        #     "years": years_sorted,
        #     "commands": cmds_sorted,
        #     "matrix": matrix,
        # }
        # f.write("```json\n")
        # f.write(_json.dumps(payload, ensure_ascii=False))
        # f.write("\n`````\n")


def main():
    parser = argparse.ArgumentParser(description="Generate command usage report from history files.")
    parser.add_argument(
        "--history-dir",
        default=HISTORY_DIR,
        help="Path to the CustomServerTools/history directory",
    )
    parser.add_argument(
        "--output",
        default=OUTPUT_PATH,
        help="Path to write the markdown report",
    )
    parser.add_argument(
        "--commands-js",
        default=CUSTOM_SERVER_TOOLS_JS,
        help="Path to CustomServerTools.js to extract valid commands",
    )
    args = parser.parse_args()

    valid_cmds = extract_valid_commands(args.commands_js)
    events_all = iter_history_events(args.history_dir, valid_commands=None)
    events = iter_history_events(args.history_dir, valid_commands=valid_cmds if valid_cmds else None)
    if not events:
        # Still write an empty report for consistency
        with open(args.output, "w", encoding="utf-8") as f:
            f.write("# Command Usage Report\n\nNo command history found.\n")
        print(f"Report written (empty): {args.output}")
        return

    global_counts, global_counts_non_admin, per_player_summary = group_stats(events)
    write_report(
        args.output,
        events,
        global_counts,
        global_counts_non_admin,
        per_player_summary,
        all_events=events_all,
        valid_commands=valid_cmds,
    )
    print(f"Report written: {args.output}")


if __name__ == "__main__":
    main()
