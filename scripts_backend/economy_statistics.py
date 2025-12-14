import json
import os
import argparse  # Added for argument parsing
from collections import defaultdict
from datetime import datetime

def load_data(filepath, ignore_prebalance):
    with open(filepath, 'r') as file:
        data = json.load(file)
    if ignore_prebalance:
        for player, transactions in data.items():
            data[player] = [t for t in transactions if not t.get("prebalance", False)]
    return data

def calculate_statistics(data):
    player_totals = defaultdict(float)
    market_totals = defaultdict(float)
    player_market_proportions = defaultdict(lambda: defaultdict(float))
    player_market_trade_proportions = defaultdict(lambda: defaultdict(float))
    player_market_money_proportions = defaultdict(lambda: defaultdict(float))
    player_market_trade_counts = defaultdict(lambda: defaultdict(int))
    market_trade_counts = defaultdict(int)  # Track the number of trades per market
    market_average_revenue = {}  # Store average revenue per trade for each market
    top_trades = []
    bottom_trades = []  # Track the worst trades
    player_trade_counts = defaultdict(int)  # Track the total number of trades per player
    player_item_counts = defaultdict(int)  # Track total item count per player
    market_item_counts = defaultdict(int)  # Track total item count per market
    player_average_items = {}  # Store average item count per trade for each player
    market_average_items = {}  # Store average item count per trade for each market
    player_market_daily_totals = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))  # Track daily earnings per market per player
    player_market_days = defaultdict(lambda: defaultdict(set))  # Track unique days of activity per market per player
    gem_mafia_totals = defaultdict(float)  # Track totals for gem_mafia_purchase

    for player, transactions in data.items():
        for transaction in transactions:
            if transaction.get("type") == "gem_mafia_purchase":
                gem_mafia_totals[player] += transaction.get("estimated_value", 0) / 100  # Convert to grons
                player_market_proportions[player]["Gem Mafia Purchase"] += transaction.get("estimated_value", 0) / 100
                continue  # Skip further processing for gem_mafia_purchase

            earnings = transaction.get("totalEarnings", 0) / 100  # Convert to grons, default to 0 if missing
            region = transaction.get("region", "Unknown")  # Ensure region defaults to "Unknown"
            if not region:  # Handle cases where region might be an empty string
                region = "Unknown"

            # Update player totals
            player_totals[player] += earnings

            # Update market totals
            market_totals[region] += earnings

            # Update player market proportions
            player_market_proportions[player][region] += earnings

            # Update player market trade counts
            player_market_trade_counts[player][region] += 1

            # Update market trade counts
            market_trade_counts[region] += 1

            # Track top trades
            top_trades.append((player, region, earnings))

            # Track bottom trades
            bottom_trades.append((player, region, earnings))

            # Update player trade counts
            player_trade_counts[player] += 1

            # Update item counts
            item_count = sum(item.get("count", 0) for item in transaction.get("delivery", {}).get("generic", {}).values())
            player_item_counts[player] += item_count
            market_item_counts[region] += item_count

            # Update daily totals
            date_str = transaction.get("date", "Unknown")
            if date_str != "Unknown":
                try:
                    date = datetime.strptime(date_str.split(" ")[0], "%a %b %d %Y")
                    player_market_daily_totals[player][region][date] += earnings
                    player_market_days[player][region].add(date)
                except ValueError:
                    continue  # Skip invalid date formats

    # Normalize player market proportions
    for player, markets in player_market_proportions.items():
        total_money = sum(markets.values())
        total_trades = sum(player_market_trade_counts[player].values())
        for market in markets:
            player_market_money_proportions[player][market] = (markets[market] / total_money) * 100 if total_money > 0 else 0
            player_market_trade_proportions[player][market] = (player_market_trade_counts[player][market] / total_trades) * 100 if total_trades > 0 else 0

    # Calculate average revenue per trade for each market
    for market, total_revenue in market_totals.items():
        market_average_revenue[market] = total_revenue / market_trade_counts[market] if market_trade_counts[market] > 0 else 0

    # Calculate average item count per trade for each player
    for player, total_items in player_item_counts.items():
        player_average_items[player] = total_items / player_trade_counts[player] if player_trade_counts[player] > 0 else 0

    # Calculate average item count per trade for each market
    for market, total_items in market_item_counts.items():
        market_average_items[market] = total_items / market_trade_counts[market] if market_trade_counts[market] > 0 else 0

    # Sort and keep only the top 10 trades
    top_trades = sorted(top_trades, key=lambda x: x[2], reverse=True)[:10]

    # Sort and keep only the bottom 10 trades
    bottom_trades = sorted(bottom_trades, key=lambda x: x[2])[:10]

    return player_totals, market_totals, player_market_money_proportions, player_market_trade_proportions, top_trades, bottom_trades, market_average_revenue, player_trade_counts, player_average_items, market_average_items, gem_mafia_totals

def generate_report(player_totals, market_totals, player_market_money_proportions, player_market_trade_proportions, top_trades, bottom_trades, market_average_revenue, player_trade_counts, player_average_items, market_average_items, gem_mafia_totals, output_filepath):
    with open(output_filepath, 'w') as report:
        report.write("# Economy Statistics Report\n\n")

        # Start with the most important statistics
        report.write("## Player Total Earnings (in grons)\n")
        for player, total in sorted(player_totals.items(), key=lambda x: x[1], reverse=True):
            report.write(f"- **{player}**: {total:,.2f} Grons\n")
        report.write("\n")

        report.write("## Total Number of Trades Per Player\n")
        for player, trade_count in sorted(player_trade_counts.items(), key=lambda x: x[1], reverse=True):
            report.write(f"- **{player}**: {trade_count} trades\n")
        report.write("\n")

        report.write("## Most Profitable Markets\n")
        for market, total in sorted(market_totals.items(), key=lambda x: x[1], reverse=True):
            report.write(f"- **{market}**: {total:,.2f} Grons\n")
        report.write("\n")

        report.write("## Average Revenue Per Trade by Market\n")
        for market, average_revenue in sorted(market_average_revenue.items(), key=lambda x: x[1], reverse=True):
            report.write(f"- **{market}**: {average_revenue:,.2f} Grons\n")
        report.write("\n")

        report.write("## Top 10 Biggest Gains in a Single Trade\n")
        for rank, (player, region, earnings) in enumerate(top_trades, start=1):
            report.write(f"{rank}. **{player}** in **{region}**: {earnings:,.2f} Grons\n")
        report.write("\n")

        report.write("## Worst 10 Gains in a Single Trade\n")
        for rank, (player, region, earnings) in enumerate(bottom_trades, start=1):
            report.write(f"{rank}. **{player}** in **{region}**: {earnings:,.2f} Grons\n")
        report.write("\n")

        report.write("## Average Item Count Per Trade (by Player)\n")
        for player, avg_items in sorted(player_average_items.items(), key=lambda x: x[1], reverse=True):
            report.write(f"- **{player}**: {avg_items:.2f} items per trade\n")
        report.write("\n")

        report.write("## Average Item Count Per Trade (by Market)\n")
        for market, avg_items in sorted(market_average_items.items(), key=lambda x: x[1], reverse=True):
            report.write(f"- **{market}**: {avg_items:.2f} items per trade\n")
        report.write("\n")

        report.write("## Gem Mafia Purchase Totals (in grons)\n")
        for player, total in sorted(gem_mafia_totals.items(), key=lambda x: x[1], reverse=True):
            report.write(f"- **{player}**: {total:,.2f} Grons\n")
        report.write("\n")

        # End with detailed breakdowns
        report.write("## Player Market Proportions (by Money Gain)\n")
        for player, markets in player_market_money_proportions.items():
            report.write(f"### {player}\n")
            for market, proportion in sorted(markets.items(), key=lambda x: x[1], reverse=True):
                report.write(f"- **{market}**: {proportion:.2f}%\n")
            report.write("\n")

        report.write("## Player Market Proportions (by Trade Count)\n")
        for player, markets in player_market_trade_proportions.items():
            report.write(f"### {player}\n")
            for market, proportion in sorted(markets.items(), key=lambda x: x[1], reverse=True):
                if proportion > 0:  # Exclude 0% entries
                    report.write(f"- **{market}**: {proportion:.2f}%\n")
            report.write("\n")

def main():
    parser = argparse.ArgumentParser(description="Generate economy statistics report.")
    parser.add_argument("--include-prebalance", action="store_true", help="Include transactions marked as prebalance.")
    args = parser.parse_args()

    filepath = "/home/mouette/gramados-v2/world/customnpcs/scripts/logs/economy.json"
    output_filepath = "/home/mouette/gramados-v2/scripts_backend/reports/economy_report.md"
    ignore_prebalance = not args.include_prebalance  # Default to ignoring prebalance
    data = load_data(filepath, ignore_prebalance)
    player_totals, market_totals, player_market_money_proportions, player_market_trade_proportions, top_trades, bottom_trades, market_average_revenue, player_trade_counts, player_average_items, market_average_items, gem_mafia_totals = calculate_statistics(data)
    os.makedirs(os.path.dirname(output_filepath), exist_ok=True)
    generate_report(player_totals, market_totals, player_market_money_proportions, player_market_trade_proportions, top_trades, bottom_trades, market_average_revenue, player_trade_counts, player_average_items, market_average_items, gem_mafia_totals, output_filepath)
    print(f"Report generated successfully. You can view it here: {output_filepath}")

if __name__ == "__main__":
    main()
