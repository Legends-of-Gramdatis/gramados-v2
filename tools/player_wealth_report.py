import json
from collections import defaultdict

def calculate_player_wealth_details(decoded_data):
    """Calculate the wealth details of each player."""
    player_wealth_details = defaultdict(lambda: {
        "total": 0, "pouch": 0, "regions": 0, "banks": 0, "real_estate": []
    })

    # Add money from player entries
    for key, value in decoded_data.items():
        if key.startswith("player_"):
            player_name = key.split("_", 1)[1]
            money = value.get("money", 0)
            player_wealth_details[player_name]["pouch"] += money
            player_wealth_details[player_name]["total"] += money

    # Add net worth of regions owned by players
    for key, value in decoded_data.items():
        if key.startswith("region_"):
            owner = value.get("owner")
            if owner:
                sale_price = value.get("salePrice", 0)
                player_wealth_details[owner]["regions"] += sale_price
                player_wealth_details[owner]["total"] += sale_price
                player_wealth_details[owner]["real_estate"].append({
                    "name": value.get("displayName", key),
                    "value": sale_price / 100  # Convert to Grons
                })

    # Add bank balances
    for key, value in decoded_data.items():
        if key.startswith("bank_"):
            owner = value.get("owner")
            if owner:
                amount = value.get("amount", 0)
                player_wealth_details[owner]["banks"] += amount
                player_wealth_details[owner]["total"] += amount

    # Convert cents to Grons and sort real estate by value
    for player, details in player_wealth_details.items():
        for key in ["total", "pouch", "regions", "banks"]:
            details[key] /= 100
        details["real_estate"].sort(key=lambda x: x["value"], reverse=True)

    return player_wealth_details

def generate_wealth_report(player_wealth_details, decoded_data, output_filepath):
    """Generate a detailed report of player wealth."""
    with open(output_filepath, 'w') as report:
        report.write("# Player Wealth Report\n\n")
        report.write("## Wealth of Each Player (in Grons)\n\n")

        moneyless_players = []
        for player, details in sorted(player_wealth_details.items(), key=lambda x: x[1]["total"], reverse=True):
            if details["total"] == 0:
                moneyless_players.append(player)
                continue

            report.write(f"- **{player}**: {details['total']:,.2f} Grons\n")
            report.write(f"  - From Pouch: {details['pouch']:,.2f} Grons\n")
            report.write(f"  - From Regions: {details['regions']:,.2f} Grons\n")
            report.write(f"  - From Banks: {details['banks']:,.2f} Grons\n")

            if details["real_estate"]:
                report.write("  - Real Estate (sorted by value):\n")
                for estate in details["real_estate"]:
                    report.write(f"    - {estate['name']}: {estate['value']:,.2f} Grons\n")

        if moneyless_players:
            report.write("\n## Moneyless Players\n\n")
            for player in moneyless_players:
                report.write(f"- **{player}**\n")

        # Add a section for all regions and their values, sorted by price
        report.write("\n## All Regions and Their Values (sorted by price)\n\n")
        regions = [
            (value.get("displayName", key), value.get("salePrice", 0) / 100, value.get("owner", "Unowned"))
            for key, value in decoded_data.items() if key.startswith("region_")
        ]
        for region_name, sale_price, owner in sorted(regions, key=lambda x: x[1], reverse=True):
            report.write(f"- {region_name}: {sale_price:,.2f} Grons (Owner: {owner})\n")

        # Add a section for regions for sale
        report.write("\n## Regions for Sale\n\n")
        regions_for_sale = [
            (value.get("displayName", key), value.get("salePrice", 0) / 100, value.get("owner", "Unowned"))
            for key, value in decoded_data.items() 
            if key.startswith("region_") and value.get("forSale", False) and value.get("saleType") == "buy"
        ]
        for region_name, sale_price, owner in sorted(regions_for_sale, key=lambda x: x[0]):
            report.write(f"- {region_name}: {sale_price:,.2f} Grons (Owner: {owner})\n")

        # Add a section for regions for rent
        report.write("\n## Regions for Rent\n\n")
        regions_for_rent = [
            (value.get("displayName", key), value.get("salePrice", 0) / 100, value.get("owner", "Unowned"))
            for key, value in decoded_data.items() 
            if key.startswith("region_") and value.get("forSale", False) and value.get("saleType") == "rent"
        ]
        for region_name, sale_price, owner in sorted(regions_for_rent, key=lambda x: x[0]):
            report.write(f"- {region_name}: {sale_price:,.2f} Grons (Owner: {owner})\n")

    print(f"Wealth report written to {output_filepath}")

if __name__ == "__main__":
    input_file = "/home/mouette/gramados-v2/reports/output_decoded_world_data.json"
    output_file = "/home/mouette/gramados-v2/reports/player_wealth_report.md"

    with open(input_file, 'r') as file:
        decoded_data = json.load(file)

    player_wealth_details = calculate_player_wealth_details(decoded_data)
    generate_wealth_report(player_wealth_details, decoded_data, output_file)
