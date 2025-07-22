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

        # Get the corresponding items from TraderCurrency by matching Slot values
        slot1 = next((item for item in market_data['TraderCurrency']['NpcMiscInv'] if item.get('Slot') == i), None)
        slot2 = next((item for item in market_data['TraderCurrency']['NpcMiscInv'] if item.get('Slot') == i + 18), None)

        # Extract prices from the slots
        price1 = 0
        if slot1 and 'tag' in slot1 and 'display' in slot1['tag'] and 'Lore' in slot1['tag']['display']:
            try:
                price1 = convert_price_to_cents(slot1['tag']['display']['Lore'][0]) * slot1.get('Count', 1)
            except ValueError:
                print(f"Skipping invalid price in slot1: {slot1['tag']['display']['Lore'][0]}")

        price2 = 0
        if slot2 and 'tag' in slot2 and 'display' in slot2['tag'] and 'Lore' in slot2['tag']['display']:
            try:
                price2 = convert_price_to_cents(slot2['tag']['display']['Lore'][0]) * slot2.get('Count', 1)
            except ValueError:
                print(f"Skipping invalid price in slot2: {slot2['tag']['display']['Lore'][0]}")

        # Total price for the item
        total_price = price1 + price2

        # Divide the total price by count to get the per item price
        price_in_cents = total_price // count

        # Print the extracted data for debugging
        print(f"Item {item_id} price extracted: {price_in_cents} cents")

        # Handle duplicates based on force_replace
        if item_id in global_prices:
            old_price = global_prices[item_id]['value']
            print(f"Item {item_id} found with existing price: {old_price} cents")
            print(f"New calculated price: {price_in_cents} cents")
            if old_price == price_in_cents:
                print(f"Price for {item_id} is identical to the existing price. Skipping update.")
                continue
            if not force_replace:
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
        "/home/mouette/gramados-v2/world/customnpcs/markets/ivl_dealership_randomness_p0.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/ivl_dealership_randomness_p1.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/ivl_dealership_randomness_p3.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/can_engines_alicemotors_ev.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/can_engines_random_p0.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/car_engine_ivl_p0.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/car_engines_trin_p0.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/car_gauges_iav_unu_p0.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/car_gauges_ivv_p0.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/car_gauges_trin_p0.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/car_gearboxes_transmissions_p0.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/car_wheels_general_p0.json",
        "/home/mouette/gramados-v2/world/customnpcs/markets/car_wheels_trin_generic_p0.json"
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
        print(f"Loaded market data from {path}: {market_data}")
        update_global_prices(market_data, global_prices_path, force_replace=False)
    print("All market data processed and global prices updated.")
