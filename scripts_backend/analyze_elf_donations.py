#!/usr/bin/env python3
"""
Analyzes Christmas elf donations and groups items by type with counts.
Creates a JSON file with unique item types and their total donation counts.
"""

import json
import os

# Paths
DONATIONS_PATH = 'world/customnpcs/scripts/data_auto/christmas_elf_donations.json'
OUTPUT_PATH = 'scripts_backend/reports/christmas_elf_grouped_items.json'

def item_signature(item):
    """Create a unique signature for an item based on id, meta, and nbt."""
    nbt_str = json.dumps(item.get('nbt'), sort_keys=True) if item.get('nbt') else 'null'
    return f"{item['id']}|{item['meta']}|{nbt_str}"

def analyze_donations():
    """Analyze all donations and group items by type."""
    # Load donations data
    with open(DONATIONS_PATH, 'r', encoding='utf-8') as f:
        donations = json.load(f)
    
    # Dictionary to store unique items: signature -> (item_data, count)
    item_groups = {}
    
    # Iterate through all players and their donations
    for player_name, player_data in donations.items():
        items = player_data.get('items', [])
        
        for item in items:
            sig = item_signature(item)
            
            if sig in item_groups:
                # Increment count for existing item type
                item_groups[sig]['count'] += item.get('count', 1)
            else:
                # New item type - store the item data and count
                item_groups[sig] = {
                    'id': item['id'],
                    'meta': item['meta'],
                    'nbt': item.get('nbt'),
                    'displayName': item.get('displayName', item['id']),
                    'count': item.get('count', 1)
                }
    
    # Convert to numbered array format
    grouped_items = {
        'totalUniqueTypes': len(item_groups),
        'totalItemsGiven': sum(data['count'] for data in item_groups.values()),
        'items': []
    }
    
    # Add items with numeric IDs
    for idx, (signature, item_data) in enumerate(item_groups.items()):
        grouped_items['items'].append({
            'id': idx,
            'item': {
                'id': item_data['id'],
                'meta': item_data['meta'],
                'nbt': item_data['nbt'],
                'displayName': item_data['displayName']
            },
            'totalCount': item_data['count']
        })
    
    # Sort by count descending for easier viewing
    grouped_items['items'].sort(key=lambda x: x['totalCount'], reverse=True)
    
    # Re-assign IDs after sorting
    for idx, item_entry in enumerate(grouped_items['items']):
        item_entry['id'] = idx
    
    # Save to file
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(grouped_items, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Analysis complete!")
    print(f"  Total unique item types: {grouped_items['totalUniqueTypes']}")
    print(f"  Total items given: {grouped_items['totalItemsGiven']}")
    print(f"  Output saved to: {OUTPUT_PATH}")
    
    # Show top 10 most donated items
    print("\nTop 10 most donated items:")
    for i, entry in enumerate(grouped_items['items'][:10], 1):
        print(f"  {i}. {entry['item']['displayName']} x{entry['totalCount']}")

if __name__ == '__main__':
    analyze_donations()
