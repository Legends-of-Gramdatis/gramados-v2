#!/usr/bin/env python3
"""
cleanup_elf_donations.py - Deduplicate Christmas elf donation data

This script consolidates duplicate item entries in the christmas_elf_donations.json file
by stacking items with identical id, meta, and NBT data.

Usage:
    python3 cleanup_elf_donations.py
"""

import json
import os
from pathlib import Path

# Path to the donations JSON file
DONATIONS_PATH = Path(__file__).parent.parent / "world/customnpcs/scripts/data_auto/christmas_elf_donations.json"
BACKUP_PATH = DONATIONS_PATH.with_suffix('.json.backup')


def item_signature(item):
    """
    Create a unique signature for an item based on id, meta, and NBT.
    
    Args:
        item (dict): Item dictionary with id, meta, nbt, displayName, count
        
    Returns:
        tuple: (id, meta, nbt_string) as a hashable signature
    """
    item_id = item.get('id', '')
    meta = item.get('meta', 0)
    nbt = item.get('nbt', None)
    
    # Convert NBT to a stable string representation
    nbt_str = json.dumps(nbt, sort_keys=True) if nbt else ''
    
    return (item_id, meta, nbt_str)


def deduplicate_player_items(items):
    """
    Deduplicate a list of items by stacking identical entries.
    
    Args:
        items (list): List of item dictionaries
        
    Returns:
        list: Deduplicated list with counts stacked
    """
    item_map = {}
    
    for item in items:
        sig = item_signature(item)
        
        if sig in item_map:
            # Stack the count
            item_map[sig]['count'] += item.get('count', 1)
        else:
            # First occurrence - ensure count is set
            item_copy = item.copy()
            if 'count' not in item_copy:
                item_copy['count'] = 1
            item_map[sig] = item_copy
    
    # Return as list
    return list(item_map.values())


def main():
    """Main function to process and deduplicate donations."""
    if not DONATIONS_PATH.exists():
        print(f"❌ Error: Donations file not found at {DONATIONS_PATH}")
        return 1
    
    print(f"📂 Loading donations from: {DONATIONS_PATH}")
    
    # Load the JSON data
    with open(DONATIONS_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Create backup
    print(f"💾 Creating backup at: {BACKUP_PATH}")
    with open(BACKUP_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    
    # Process each player
    total_before = 0
    total_after = 0
    
    for player_name, player_data in data.items():
        if 'items' not in player_data:
            continue
        
        items = player_data['items']
        before_count = len(items)
        total_before += before_count
        
        # Deduplicate
        deduplicated = deduplicate_player_items(items)
        after_count = len(deduplicated)
        total_after += after_count
        
        # Update the data
        player_data['items'] = deduplicated
        
        if before_count != after_count:
            saved = before_count - after_count
            print(f"  👤 {player_name}: {before_count} → {after_count} entries (-{saved})")
    
    # Save the cleaned data
    print(f"\n💾 Saving cleaned data...")
    with open(DONATIONS_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    
    total_saved = total_before - total_after
    print(f"\n✅ Done!")
    print(f"   Total entries: {total_before} → {total_after} (-{total_saved})")
    print(f"   Backup saved at: {BACKUP_PATH}")
    
    return 0


if __name__ == '__main__':
    exit(main())
