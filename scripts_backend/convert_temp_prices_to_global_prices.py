#!/usr/bin/env python3
"""Convert temp_price.txt entries into global_prices.json entries.

Rules:
- Parse lines like: "<mod:item>" 12345
- Extract item id between <...>, then append ':0' => key.
- Store value as-is (cents) in global_prices.json as {"value": <int>}.
- Ignore lines without a numeric value.
- Remove processed (priced) lines from temp_price.txt; keep the others.

Paths are hardcoded to match the repo layout.
"""

from __future__ import annotations

import json
import re
from pathlib import Path


TEMP_PRICE_PATH = Path("/home/mouette/gramados-v2/scripts_backend/inputs/temp_price.txt")
GLOBAL_PRICES_PATH = Path("/home/mouette/gramados-v2/world/customnpcs/scripts/globals/global_prices.json")


LINE_RE = re.compile(r'^\s*"?<([^>]+)>"?\s+(\d+)\s*$')


def main() -> int:
    if not TEMP_PRICE_PATH.exists():
        raise FileNotFoundError(str(TEMP_PRICE_PATH))
    if not GLOBAL_PRICES_PATH.exists():
        raise FileNotFoundError(str(GLOBAL_PRICES_PATH))

    raw_lines = TEMP_PRICE_PATH.read_text(encoding="utf-8").splitlines(True)

    to_apply: dict[str, int] = {}
    kept_lines: list[str] = []

    for line in raw_lines:
        m = LINE_RE.match(line)
        if not m:
            kept_lines.append(line)
            continue

        item_id = m.group(1).strip()
        value_cents = int(m.group(2))
        key = f"{item_id}:0"
        to_apply[key] = value_cents

    if not to_apply:
        print("No priced lines found; nothing to do.")
        return 0

    # Load + update global prices
    with GLOBAL_PRICES_PATH.open("r", encoding="utf-8") as f:
        global_prices = json.load(f)

    updated = 0
    created = 0
    for key, value in to_apply.items():
        if key in global_prices:
            updated += 1
        else:
            created += 1
        global_prices[key] = {"value": value}

    # Save global prices (keep stable formatting; no key sorting)
    with GLOBAL_PRICES_PATH.open("w", encoding="utf-8") as f:
        json.dump(global_prices, f, indent=4, ensure_ascii=False)
        f.write("\n")

    # Rewrite temp file with only unpriced lines
    TEMP_PRICE_PATH.write_text("".join(kept_lines), encoding="utf-8")

    print(f"Applied {len(to_apply)} entries to global_prices.json ({created} created, {updated} updated).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
