#!/usr/bin/env python3
"""
Distributes Christmas event rewards to participating players.
Each player (except Kitsunami_) receives (total_item_count / 6) random items
from the donation pool.
"""

import json
import random
import os

# Paths
DONATIONS_PATH = 'world/customnpcs/scripts/data_auto/christmas_elf_donations.json'
GROUPED_ITEMS_PATH = 'scripts_backend/reports/christmas_elf_grouped_items.json'
OUTPUT_PATH = 'scripts_backend/reports/christmas_elf_rewards.json'

EXCLUDED_PLAYERS = ['Kitsunami_']

def load_json(path):
    """Load JSON file."""
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, path):
    """Save JSON file."""
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def build_weighted_item_pool(grouped_items):
    """
    Build a weighted pool where each item appears according to its count.
    Returns a list of item IDs that can be randomly drawn from.
    """
    pool = []
    for entry in grouped_items['items']:
        item_id = entry['id']
        count = entry['totalCount']
        # Add this item ID 'count' times to the pool
        pool.extend([item_id] * count)
    return pool

def distribute_rewards():
    """Distribute rewards to participating players."""
    # Load data
    donations = load_json(DONATIONS_PATH)
    grouped_items = load_json(GROUPED_ITEMS_PATH)
    
    # Get list of participating players (exclude specified players)
    participants = [p for p in donations.keys() if p not in EXCLUDED_PLAYERS]
    
    if not participants:
        print("No eligible participants found!")
        return
    
    print(f"Distributing rewards to {len(participants)} players...")
    print(f"Total items in pool: {grouped_items['totalItemsGiven']}")
    
    # Build weighted item pool
    item_pool = build_weighted_item_pool(grouped_items)
    total_items = len(item_pool)
    
    # Calculate items per player - distribute evenly with no remainder
    base_items_per_player = total_items // len(participants)
    remainder = total_items % len(participants)
    print(f"Total items: {total_items}, Players: {len(participants)}")
    print(f"Base items per player: {base_items_per_player}, Extra items to distribute: {remainder}")
    
    # Shuffle the pool for randomness
    random.shuffle(item_pool)
    
    # Track what items were distributed
    rewards = {}
    item_lookup = {entry['id']: entry['item'] for entry in grouped_items['items']}
    
    # Distribute items to each player
    for idx, player_name in enumerate(participants):
        player_rewards = []
        
        # First 'remainder' players get one extra item
        items_for_this_player = base_items_per_player + (1 if idx < remainder else 0)
        
        for _ in range(items_for_this_player):
            if not item_pool:
                print(f"Error: Item pool exhausted!")
                break
            
            # Draw a random item from the pool
            drawn_item_id = item_pool.pop(random.randint(0, len(item_pool) - 1))
            
            # Get the actual item data
            item_data = item_lookup[drawn_item_id].copy()
            
            # Check if we already have this item in player's rewards
            found = False
            for reward_item in player_rewards:
                if (reward_item['id'] == item_data['id'] and 
                    reward_item['meta'] == item_data['meta'] and
                    json.dumps(reward_item.get('nbt'), sort_keys=True) == 
                    json.dumps(item_data.get('nbt'), sort_keys=True)):
                    reward_item['count'] = reward_item.get('count', 1) + 1
                    found = True
                    break
            
            if not found:
                item_data['count'] = 1
                player_rewards.append(item_data)
        
        rewards[player_name] = {
            'totalItems': items_for_this_player,
            'items': player_rewards
        }
        
        print(f"  ✓ {player_name}: {len(player_rewards)} unique item types ({items_for_this_player} total items)")
    
    # Save rewards
    save_json(rewards, OUTPUT_PATH)
    
    print(f"\n✓ Rewards distributed!")
    print(f"  Output saved to: {OUTPUT_PATH}")
    if item_pool:
        print(f"  ERROR: {len(item_pool)} items remaining in pool!")
    else:
        print(f"  ✓ All items distributed (0 remaining)")
    
    # Show summary for each player
    print("\n=== Reward Summary ===")
    for player_name, player_data in rewards.items():
        print(f"\n{player_name}:")
        # Show top 5 items by count
        sorted_items = sorted(player_data['items'], key=lambda x: x.get('count', 1), reverse=True)
        for i, item in enumerate(sorted_items[:5], 1):
            print(f"  {i}. {item['displayName']} x{item.get('count', 1)}")
        if len(sorted_items) > 5:
            print(f"  ... and {len(sorted_items) - 5} more item types")

if __name__ == '__main__':
    # Set random seed for reproducibility (optional - remove for true randomness)
    # random.seed(42)
    
    distribute_rewards()
