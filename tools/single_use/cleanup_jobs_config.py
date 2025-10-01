#!/usr/bin/env python3
"""
Cleanup script for jobs config.json.
- Sort Region_Job_Limits alphabetically by region name; and inside each region sort job types alphabetically.
- Order Jobs by Region > Type > JobName > Title.
- Sort AutoAssignPerms alphabetically if present.
- Sort Tags arrays alphabetically if present.
- Preserve other fields and make a timestamped backup before writing.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from datetime import datetime
from typing import Any, Dict, List, Tuple

DEFAULT_PATH = "/home/mouette/gramados-v2/world/customnpcs/scripts/ecmascript/modules/jobs/config.json"

TYPE_ORDER = {
    "Starter": 0,
    "Advanced": 1,
    "Prestige": 2,
}


def _type_sort_key(t: str) -> Tuple[int, str]:
    # Primary by known order, fallback to alpha for unknown types
    return (TYPE_ORDER.get(t, 99), t)


def load_json(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def backup_file(path: str) -> str:
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = f"{path}.{ts}.bak"
    shutil.copy2(path, backup)
    return backup


def sort_region_job_limits(data: Dict[str, Any]) -> None:
    rjl = data.get("Region_Job_Limits")
    if not isinstance(rjl, dict):
        return

    # Sort inner job type limits alphabetically by type key for determinism
    sorted_regions: Dict[str, Any] = {}
    for region in sorted(rjl.keys(), key=lambda s: s.lower()):
        types = rjl.get(region)
        if isinstance(types, dict):
            sorted_types = {k: types[k] for k in sorted(types.keys(), key=lambda s: s.lower())}
            sorted_regions[region] = sorted_types
        else:
            sorted_regions[region] = types

    data["Region_Job_Limits"] = sorted_regions


def normalize_and_sort_jobs(data: Dict[str, Any]) -> None:
    jobs = data.get("Jobs")
    if not isinstance(jobs, list):
        return

    def job_key(job: Dict[str, Any]):
        region = str(job.get("Region", ""))
        jtype = str(job.get("Type", ""))
        name = str(job.get("JobName", ""))
        title = str(job.get("Title", ""))
        return (
            region.lower(),
            _type_sort_key(jtype),
            name.lower(),
            title.lower(),
        )

    # Normalize list fields and then sort
    for job in jobs:
        # Sort AutoAssignPerms if present
        perms = job.get("AutoAssignPerms")
        if isinstance(perms, list):
            job["AutoAssignPerms"] = sorted((str(p) for p in perms), key=lambda s: s.lower())

        # Sort Tags if present
        tags = job.get("Tags")
        if isinstance(tags, list):
            job["Tags"] = sorted((str(t) for t in tags), key=lambda s: s.lower())

    jobs.sort(key=job_key)


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser(description="Cleanup and sort jobs config.json")
    parser.add_argument(
        "path",
        nargs="?",
        default=DEFAULT_PATH,
        help="Path to config.json (defaults to repo's jobs config)",
    )
    parser.add_argument(
        "--backup",
        action="store_true",
        help="Create a timestamped .bak file",
    )
    parser.add_argument(
        "--indent",
        type=int,
        default=4,
        help="Indentation for JSON output (default: 4)",
    )

    args = parser.parse_args(argv)

    path = os.path.abspath(args.path)
    if not os.path.isfile(path):
        print(f"Error: file not found: {path}", file=sys.stderr)
        return 1

    try:
        data = load_json(path)
    except json.JSONDecodeError as e:
        print(f"Error: invalid JSON in {path}: {e}", file=sys.stderr)
        return 2

    # Backup
    if args.backup:
        backup = backup_file(path)
        print(f"Backup written to {backup}")

    # Apply transforms
    sort_region_job_limits(data)
    normalize_and_sort_jobs(data)

    # Write back with deterministic key order at top-level to preserve human grouping
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=args.indent, ensure_ascii=False)
        f.write("\n")

    print(f"Updated {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
