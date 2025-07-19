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


def update_global_prices(market_data, global_prices_path):
    """
    Updates the global prices JSON file with items from the market JSON data.
    Prompts the user if an item already exists.
    """
    # Load the existing global prices
    if os.path.exists(global_prices_path):
        with open(global_prices_path, 'r') as file:
            global_prices = json.load(file)
    else:
        global_prices = {}

    # Iterate over the items in TraderSold
    for i, item in enumerate(market_data['TraderSold']['NpcMiscInv']):
        # Append Damage value to item_id, defaulting to 0 if not present
        damage = item.get('Damage', 0)
        item_id = f"{item['id']}:{damage}"
        count = item['Count']

        # Skip if no price data in the current item
        if not item.get('id'):
            continue

        # Get the corresponding items from TraderCurrency
        slot1 = market_data['TraderCurrency']['NpcMiscInv'][i]
        slot2 = market_data['TraderCurrency']['NpcMiscInv'][i + 18] if i + 18 < len(market_data['TraderCurrency']['NpcMiscInv']) else None

        # Extract prices from the slots
        price1 = 0
        if 'tag' in slot1 and 'display' in slot1['tag'] and 'Lore' in slot1['tag']['display']:
            price1 = convert_price_to_cents(slot1['tag']['display']['Lore'][0])

        price2 = 0
        if slot2 and 'tag' in slot2 and 'display' in slot2['tag'] and 'Lore' in slot2['tag']['display']:
            price2 = convert_price_to_cents(slot2['tag']['display']['Lore'][0])

        # Total price for the item
        total_price = price1 + price2

        # Divide the total price by count to get the per item price
        price_in_cents = total_price // count

        # Print the extracted data for debugging
        print(f"Item {item_id} price extracted: {price_in_cents} cents")

        # Ask the user if the item already exists in global prices
        if item_id in global_prices:
            old_price = global_prices[item_id]['value']
            print(f"Item {item_id} found with existing price: {old_price} cents")
            print(f"New calculated price: {price_in_cents} cents")
            # Ask for confirmation
            choice = input(f"Do you want to keep the new price for {item_id}? (y/n): ").strip().lower()
            if choice != 'y':
                print(f"Keeping the old price for {item_id}.")
                continue

        # Update the global prices with the new price
        global_prices[item_id] = {
            'value': price_in_cents
        }

    # Save the updated global prices
    with open(global_prices_path, 'w') as file:
        json.dump(global_prices, file, indent=4)

    print(f"Global prices updated and saved to {global_prices_path}.")


# Example usage:
if __name__ == "__main__":
    # Path to the Minecraft broken market JSON
    input_json_path = [
        "/home/mouette/gramados-v2/world/customnpcs/markets/paint_shop p1.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/paint_shop p2.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/paint_shop p3.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/paint_shop p4.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/paint_shop p5.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/paint_shop p6.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/paint_shop p7.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/paint_shop p8.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/paint_shop p9.json"
    ]
    # Path to the global prices file
    global_prices_path = "/home/mouette/gramados-v2/tools/output_global_prices.json"

    # # Load and clean the market JSON
    # market_data = load_mc_json(input_json_path)

    # # Print the loaded and cleaned market data for debugging
    # print(f"Loaded market data: {market_data}")

    # # Update global prices with the items from the market
    # update_global_prices(market_data, global_prices_path)

    for path in input_json_path:
        market_data = load_mc_json(path)
        print(f"Loaded market data from {path}: {market_data}")
        update_global_prices(market_data, global_prices_path)
    print("All market data processed and global prices updated.")
