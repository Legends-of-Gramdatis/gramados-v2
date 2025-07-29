import json

# Path to the global prices JSON file
GLOBAL_PRICES_PATH = "/home/mouette/gramados-v2/world/customnpcs/scripts/globals/global_prices.json"

def add_prices_to_loot_table(loot_table_path, global_prices_path):
    """
    Adds prices to items in a loot table that are not present in the global prices JSON file.

    :param loot_table_path: Path to the loot table JSON file.
    :param global_prices_path: Path to the global prices JSON file.
    """
    try:
        # Load the global prices JSON file
        with open(global_prices_path, 'r') as file:
            global_prices = json.load(file)

        # Load the loot table JSON file
        with open(loot_table_path, 'r') as file:
            loot_table = json.load(file)

        # Iterate over items in the loot table
        for pool in loot_table.get("pools", []):
            for entry in pool.get("entries", []):
                if entry.get("type") == "item":
                    item_name = entry.get("name")

                    # Check if the item is already in global prices
                    if item_name not in global_prices:
                        print(f"🔴  Item {item_name} is not in global prices.")
                        price = input(f"Enter a price for {item_name}: ").strip()

                        try:
                            price = int(price)
                            global_prices[item_name] = {"value": price}
                            print(f"✔️   Added {item_name} with price {price} to global prices.")
                        except ValueError:
                            print(f"❌ Invalid price entered for {item_name}. Skipping.")

        # Save the updated global prices back to the file
        with open(global_prices_path, 'w') as file:
            json.dump(global_prices, file, indent=4)

        print(f"✅ Global prices updated successfully.")
    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    loot_table_path = input("Enter the path to the loot table JSON file: ").strip()
    add_prices_to_loot_table(loot_table_path, GLOBAL_PRICES_PATH)
