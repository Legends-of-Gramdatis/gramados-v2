import json

# Load stock market JSON (replace with your actual file)
stock_market_path = "/home/mouette/gramados-v2/world/customnpcs/scripts/stock_exchange.json"
global_prices_path = "/home/mouette/gramados-v2/tools/output_global_prices.json"

with open(stock_market_path, "r") as file:
    stock_market_data = json.load(file)

global_prices = {}

# Iterate through all markets and their items
for market, items in stock_market_data.items():
    print(f"Converting market: {market}")
    # Ignore specific markets
    if market not in ["Monsalac Milk", "Region Generals"]:
        for item_id, item_data in items.items():
            new_value = item_data["reference_price"]

            # If item already exists, keep the lowest price and update market
            if item_id in global_prices:
                if new_value < global_prices[item_id]["value"]:
                    global_prices[item_id]["value"] = new_value
                    global_prices[item_id]["based_on_stock"] = market
            else:
                # Otherwise, add new item entry
                global_prices[item_id] = {
                    "display_name": item_data["display_name"],
                    "value": new_value,  # Convert price to cents
                    "allow_market_override": True,  # Allows price to change per market
                    "based_on_stock": market  # Tracks the original market source
                }

# Save the output to output_global_prices.json
with open(global_prices_path, "w") as file:
    json.dump(global_prices, file, indent=4)

print(f"Conversion completed. Saved as {global_prices_path}")
