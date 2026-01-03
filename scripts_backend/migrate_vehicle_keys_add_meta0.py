#!/usr/bin/env python3

import argparse
import json
import os
import shutil
import sys
from datetime import datetime
from typing import Any, Dict, Tuple


def migrate_keys_add_meta0(
    data: Dict[str, Any], *, key_prefix: str, meta_suffix: str
) -> Tuple[Dict[str, Any], int, int]:
    renamed = 0
    skipped = 0

    new_data: Dict[str, Any] = {}

    for key, entry in data.items():
        if not isinstance(key, str):
            new_data[key] = entry
            skipped += 1
            continue

        if not key.startswith(key_prefix):
            new_data[key] = entry
            continue

        # We only want to add a meta suffix to keys that look like:
        #   mts:<pack>.<item>
        # i.e. they have only the namespace colon, and no existing ":<meta>".
        # If there's a tag payload ("|{...}"), leave it untouched.
        if "|" in key:
            new_data[key] = entry
            skipped += 1
            continue

        # Example target:
        #   mts:iv_tcp_v3_civil.trin_bultizorg_comfort_electricblue_g:0
        # Namespace already contributes one colon; meta adds a second colon.
        if key.count(":") != 1:
            new_data[key] = entry
            skipped += 1
            continue

        new_key = f"{key}{meta_suffix}"

        if new_key in new_data:
            # Collision inside this migration run (unlikely, but guard anyway).
            raise ValueError(f"Key collision while migrating: {key} -> {new_key}")

        new_data[new_key] = entry
        renamed += 1

    return new_data, renamed, skipped


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Append ':0' to keys starting with a prefix (e.g. mts:iv_tcp_v3*) when they have no meta suffix yet."
        )
    )
    parser.add_argument(
        "--file",
        default="world/customnpcs/scripts/globals/global_prices.json",
        help="Path to global_prices.json (default: world/customnpcs/scripts/globals/global_prices.json)",
    )
    parser.add_argument(
        "--prefix",
        default="mts:iv_tcp_v3",
        help="Key prefix to migrate (default: mts:iv_tcp_v3)",
    )
    parser.add_argument(
        "--suffix",
        default=":0",
        help="Suffix to append to keys (default: :0)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would change, but don't write anything.",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Do not create a timestamped .bak copy before writing.",
    )

    args = parser.parse_args()

    json_path = os.path.abspath(args.file)
    if not os.path.exists(json_path):
        print(f"ERROR: File not found: {json_path}", file=sys.stderr)
        return 2

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict):
        print(f"ERROR: Root JSON must be an object/dict in {json_path}", file=sys.stderr)
        return 2

    new_data, renamed, skipped = migrate_keys_add_meta0(
        data, key_prefix=args.prefix, meta_suffix=args.suffix
    )

    print(
        f"Prefix: {args.prefix}\n"
        f"Suffix: {args.suffix}\n"
        f"Renamed entries: {renamed}\n"
        f"Skipped entries (already had meta/tag/non-string): {skipped}"
    )

    if args.dry_run:
        print("Dry-run: no files written")
        return 0

    if renamed == 0:
        print("Nothing to do")
        return 0

    if not args.no_backup:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"{json_path}.{ts}.bak"
        shutil.copy2(json_path, backup_path)
        print(f"Backup created: {backup_path}")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(new_data, f, ensure_ascii=False, indent=4, sort_keys=False)
        f.write("\n")

    # Re-load to ensure it's valid JSON after write.
    with open(json_path, "r", encoding="utf-8") as f:
        json.load(f)

    print("Done")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
