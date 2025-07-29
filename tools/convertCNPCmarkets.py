import json
import os
import re
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from json_purgation import clean_minecraft_json


def load_mc_json(input_path):
    """
    Loads a Minecraft-style broken JSON file, cleans it, and returns it as a dictionary.
    """
    with open(input_path, 'r') as file:
        raw_content = file.read()

    # Clean the broken JSON content
    cleaned_content = clean_minecraft_json(raw_content)

    # Return the cleaned JSON data as a dictionary
    return json.loads(cleaned_content)


def convert_price_to_cents(price_str):
    """
    Converts a price string (e.g., "50G", "200C", or "1K") to an integer representing the price in cents.
    """
    if 'K' in price_str:
        price_str = price_str.replace('K', '').replace('§e', '').strip()
        return int(price_str) * 100000  # Convert to cents (1K = 1000G = 100000 cents)
    elif 'G' in price_str:
        price_str = price_str.replace('G', '').replace('§e', '').strip()
        return int(price_str) * 100  # Convert to cents (1G = 100 cents)
    elif 'C' in price_str:
        price_str = price_str.replace('C', '').replace('§e', '').strip()
        return int(price_str)  # Convert to cents (1C = 1 cent)
    return 0


def update_global_prices(market_data, global_prices_path, force_replace=False):
    """
    Updates the global prices JSON file with items from the market JSON data.
    Prompts the user if an item already exists unless force_replace is set to True.
    Skips confirmation if the new price is identical to the old price.
    """
    # Load the existing global prices
    if os.path.exists(global_prices_path):
        with open(global_prices_path, 'r') as file:
            global_prices = json.load(file)
    else:
        global_prices = {}

    # Iterate over the items in TraderSold
    for item in market_data['TraderSold']['NpcMiscInv']:
        i = item.get('Slot')
        # Append Damage value to item_id, defaulting to 0 if not present
        damage = item.get('Damage', 0)
        item_id = f"{item['id']}:{damage}"
        count = item['Count']

        # Skip if no price data in the current item
        if not item.get('id'):
            continue

        # Skip items with a display Name of '§2§lMoney§r'
        if 'tag' in item and 'display' in item['tag'] and item['tag']['display'].get('Name') == '§2§lMoney§r':
            print(f"ℹ️  Skipping item {item_id} with display Name '§2§lMoney§r'.")
            continue

        # Get the corresponding items from TraderCurrency by matching Slot values
        slot1 = next((item for item in market_data['TraderCurrency']['NpcMiscInv'] if item.get('Slot') == i), None)
        slot2 = next((item for item in market_data['TraderCurrency']['NpcMiscInv'] if item.get('Slot') == i + 18), None)

        # Extract prices from the slots
        price1 = 0
        if slot1 and 'tag' in slot1 and 'display' in slot1['tag'] and 'Lore' in slot1['tag']['display']:
            try:
                price1 = convert_price_to_cents(slot1['tag']['display']['Lore'][0]) * slot1.get('Count', 1)
            except ValueError:
                print(f"ℹ️  Skipping invalid price in slot1: {slot1['tag']['display']['Lore'][0]}")

        price2 = 0
        if slot2 and 'tag' in slot2 and 'display' in slot2['tag'] and 'Lore' in slot2['tag']['display']:
            try:
                price2 = convert_price_to_cents(slot2['tag']['display']['Lore'][0]) * slot2.get('Count', 1)
            except ValueError:
                print(f"ℹ️  Skipping invalid price in slot2: {slot2['tag']['display']['Lore'][0]}")

        # Handle non-money items in TraderCurrency
        if slot1 and slot1['id'] != 'minecraft:barrier':
            if not ('tag' in slot1 and 'display' in slot1['tag'] and slot1['tag']['display'].get('Name') == '§2§lMoney§r'):
                # Check if the item has a set price in global prices
                slot1_key = f"{slot1['id']}:{slot1.get('Damage', 0)}"
                slot1_tag = json.dumps(slot1.get('tag', {}), sort_keys=True)
                slot1_unique_key = f"{slot1_key}|{slot1_tag}" if slot1_tag != '{}' else slot1_key
                if slot1_unique_key in global_prices:
                    price1 += global_prices[slot1_unique_key]['value'] * slot1.get('Count', 1)

        if slot2 and slot2['id'] != 'minecraft:barrier':
            if not ('tag' in slot2 and 'display' in slot2['tag'] and slot2['tag']['display'].get('Name') == '§2§lMoney§r'):
                # Check if the item has a set price in global prices
                slot2_key = f"{slot2['id']}:{slot2.get('Damage', 0)}"
                slot2_tag = json.dumps(slot2.get('tag', {}), sort_keys=True)
                slot2_unique_key = f"{slot2_key}|{slot2_tag}" if slot2_tag != '{}' else slot2_key
                if slot2_unique_key in global_prices:
                    price2 += global_prices[slot2_unique_key]['value'] * slot2.get('Count', 1)

        # Ignore minecraft:barrier items and only associate money value
        if slot1 and slot1['id'] == 'minecraft:barrier':
            price1 = 0
        if slot2 and slot2['id'] == 'minecraft:barrier':
            price2 = 0

        # Total price for the item
        total_price = price1 + price2

        # Divide the total price by count to get the per item price
        price_in_cents = total_price // count

        # Print the extracted data for debugging
        print(f"⏏️   Item {item_id} price extracted: {price_in_cents} cents")

        # Generate a unique key combining item_id and serialized tag
        item_tag = json.dumps(item.get('tag', {}), sort_keys=True)  # Serialize the tag with sorted keys
        unique_key = f"{item_id}|{item_tag}" if item_tag != '{}' else item_id

        # If the item has NBT, prompt the user for action
        if item_tag != '{}':
            print(f"⚠️  Item {item_id} has NBT data: {item_tag}")
            choice = input(f"🔴  How would you like to handle this item? 🔴\nOptions: [r] Remove NBT, [k] Keep NBT, [i] Ignore item\nYour choice: ").strip().lower()
            if choice == 'r':
                print(f"✔️   Removing NBT from item {item_id}.")
                unique_key = item_id  # Remove NBT by using only the item_id as the key
            elif choice == 'k':
                print(f"✔️   Keeping NBT for item {item_id}.")
            elif choice == 'i':
                print(f"✔️   Ignoring item {item_id}.")
                continue
            else:
                print(f"❌   Invalid choice. Ignoring item {item_id}.")
                continue

        # Skip adding items with a value of 0 to the global prices list
        if price_in_cents == 0:
            print(f"⚠️  Item {item_id} has a value of 0 and will not be added to the global prices list.")
            continue

        # Handle duplicates based on force_replace
        if unique_key in global_prices:
            old_price = global_prices[unique_key]['value']
            print(f"⚠️   Item {unique_key} found with existing price: {old_price} cents")
            print(f"🔄  New calculated price: {price_in_cents} cents")
            if old_price == price_in_cents:
                print(f"✔️   Price for {unique_key} is identical to the existing price. Skipping update.")
                continue
            if not force_replace:
                # Ask for confirmation
                choice = input(f"🔴  Do you want to keep the new price for {unique_key}? 🔴 (y/n): ").strip().lower()
                if choice != 'y':
                    print(f"✔️   Keeping the old price for {unique_key}.")
                    continue

        # Update the global prices with the new price and tag, excluding empty tags
        global_prices[unique_key] = {
            'value': price_in_cents
        }
        if item_tag != '{}':
            global_prices[unique_key]['tag'] = item_tag

    # Save the updated global prices
    with open(global_prices_path, 'w') as file:
        json.dump(global_prices, file, indent=4)

    print(f"✅  Global prices updated and saved to {global_prices_path}.")


# Example usage:
if __name__ == "__main__":
    # Path to the Minecraft broken market JSON
    input_json_path = [
        "/home/mouette/gramados-v2/world/customnpcs/markets/herborist.json"
    ]
    # Path to the global prices file
    global_prices_path = "/home/mouette/gramados-v2/world/customnpcs/scripts/globals/global_prices.json"

    # # Load and clean the market JSON
    # market_data = load_mc_json(input_json_path)

    # # Print the loaded and cleaned market data for debugging
    # print(f"Loaded market data: {market_data}")

    # # Update global prices with the items from the market
    # update_global_prices(market_data, global_prices_path)

    for path in input_json_path:
        market_data = load_mc_json(path)
        # print(f"Loaded market data from {path}: {market_data}")
        update_global_prices(market_data, global_prices_path, force_replace=False)
    print("✅  All market data processed and global prices updated.")
