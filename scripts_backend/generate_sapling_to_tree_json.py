#!/usr/bin/env python3

import argparse
import json
import re
from pathlib import Path


def parse_harvestcraft_blocks(crafttweaker_log_text: str) -> set[str]:
    # Example line: <block:harvestcraft:pamavocado>, Avocado
    block_line_re = re.compile(r"^<block:harvestcraft:([a-z0-9_]+)>,\s*(.*)$")
    block_ids: set[str] = set()

    for line in crafttweaker_log_text.splitlines():
        m = block_line_re.match(line.strip())
        if not m:
            continue
        block_ids.add(f"harvestcraft:{m.group(1)}")

    return block_ids


def parse_harvestcraft_saplings(crafttweaker_log_text: str) -> list[tuple[str, str]]:
    # Example line: <block:harvestcraft:avocado_sapling>, Avocado Sapling
    sapling_line_re = re.compile(r"^<block:harvestcraft:([a-z0-9_]+_sapling)>,\s*(.*)$")

    saplings: list[tuple[str, str]] = []
    for line in crafttweaker_log_text.splitlines():
        m = sapling_line_re.match(line.strip())
        if not m:
            continue
        sapling_block = f"harvestcraft:{m.group(1)}"
        display_name = m.group(2)
        saplings.append((sapling_block, display_name))

    # Deduplicate while preserving order
    seen: set[str] = set()
    out: list[tuple[str, str]] = []
    for sapling_block, display_name in saplings:
        if sapling_block in seen:
            continue
        seen.add(sapling_block)
        out.append((sapling_block, display_name))
    return out


def build_sapling_to_tree_config(
    saplings: list[tuple[str, str]],
    available_blocks: set[str],
) -> tuple[dict, list[str]]:
    config: dict[str, dict] = {}
    missing_fruit_blocks: list[str] = []

    for sapling_block, _display_name in saplings:
        # sapling_block is e.g. harvestcraft:avocado_sapling
        sapling_name = sapling_block.split(":", 1)[1]
        fruit_name = sapling_name.removesuffix("_sapling")
        fruit_block_id = f"harvestcraft:pam{fruit_name}"

        if fruit_block_id not in available_blocks:
            missing_fruit_blocks.append(f"{sapling_block} -> {fruit_block_id}")
            continue

        # Keep it in the same style as seed_to_crop.json: map key -> object, minimal fields.
        # Pam's fruit blocks have 3 stages (0..2) and use damage 0.
        config[sapling_block] = {
            "damage": 0,
            "log": None,
            "leaves": None,
            "fruit_block": {
                "block": fruit_block_id,
                "fruit": fruit_name,
                "stage": 2,
            },
        }

    # Sort keys for stable diffs
    config = dict(sorted(config.items(), key=lambda kv: kv[0]))
    return config, missing_fruit_blocks


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Generates world/customnpcs/scripts/data/sapling_to_tree.json by parsing crafttweaker.log. "
            "HarvestCraft is prioritized; each sapling maps to its pam<fruit> fruit block (stage 2)."
        )
    )
    parser.add_argument(
        "--log",
        default="/home/mouette/gramados-v2/crafttweaker.log",
        help="Path to crafttweaker.log",
    )
    parser.add_argument(
        "--out",
        default="/home/mouette/gramados-v2/world/customnpcs/scripts/data/sapling_to_tree.json",
        help="Output JSON path",
    )
    args = parser.parse_args()

    log_path = Path(args.log)
    out_path = Path(args.out)

    log_text = log_path.read_text(encoding="utf-8", errors="replace")

    available_blocks = parse_harvestcraft_blocks(log_text)
    saplings = parse_harvestcraft_saplings(log_text)

    config, missing = build_sapling_to_tree_config(saplings, available_blocks)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Wrote {len(config)} entries to {out_path}")
    if missing:
        print(f"Missing fruit blocks for {len(missing)} saplings:")
        for item in missing:
            print(f"  - {item}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
