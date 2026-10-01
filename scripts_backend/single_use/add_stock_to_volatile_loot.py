#!/usr/bin/env python3
"""One-time migration: add stock=1 to every existing volatile loot-table entry.

This script updates JSON files in world/loot_tables in place.
Entries that already have a stock value are left unchanged.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
LOOT_TABLE_DIR = ROOT / "world" / "loot_tables"


def add_stock(node: Any) -> int:
    changed = 0

    if isinstance(node, dict):
        if node.get("volatile") is True and "stock" not in node:
            node["stock"] = 1
            changed += 1

        for value in node.values():
            changed += add_stock(value)

    elif isinstance(node, list):
        for value in node:
            changed += add_stock(value)

    return changed


def main() -> int:
    files_changed = 0
    entries_changed = 0

    for path in sorted(LOOT_TABLE_DIR.rglob("*.json")):
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)

        changed = add_stock(data)
        if changed == 0:
            continue

        with path.open("w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False, indent=4)
            handle.write("\n")

        files_changed += 1
        entries_changed += changed
        print(f"{path.relative_to(ROOT)}: added stock to {changed} volatile entr{'y' if changed == 1 else 'ies'}")

    print()
    print(f"Updated {entries_changed} volatile entries across {files_changed} loot tables.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
