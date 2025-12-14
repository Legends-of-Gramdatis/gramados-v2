import re
from collections import defaultdict

def parse_grons(value):
    """Convert a formatted value like '4K266G1C' into a float representing grons."""
    match = re.match(r"(?:(\d+)K)?(?:(\d+)G)?(?:(\d+)C)?", value)
    if not match:
        return 0.0

    thousands = int(match.group(1)) if match.group(1) else 0
    grons = int(match.group(2)) if match.group(2) else 0
    cents = int(match.group(3)) if match.group(3) else 0

    return thousands * 1000 + grons + cents / 100

def decode_bank_robbery_log(input_filepath, output_filepath):
    """Decode the bank_robbery.log file and generate a clean report."""
    player_totals = defaultdict(float)
    total_robbed = 0.0
    criminality_totals = defaultdict(int)
    gold_rack_totals = defaultdict(lambda: defaultdict(int))  # Player -> Item -> Count
    safe_totals = defaultdict(lambda: defaultdict(int))  # Player -> Item -> Count
    overall_item_totals = defaultdict(int)  # Item -> Total Count
    player_item_values = defaultdict(float)  # Player -> Total Value of Items

    # Dictionary for item values (in grons)
    item_values = {
        # Example: "variedcommodities:ring:0": 1000,  # 1000g
        "forestry:apatite:0": 50,
        "immersiveengineering:metal:3": 300,
        "variedcommodities:ingot_bronze:0": 100,
        "variedcommodities:gem_sapphire:0": 100,
        "variedcommodities:gem_amethyst:0": 100,
        "variedcommodities:gem_ruby:0": 100,
        "minecraft:diamond:0": 500,
        "variedcommodities:crystal:0": 50,
        "minecraft:emerald:0": 100,
        "variedcommodities:ingot_demonic:0": 3000,
        "variedcommodities:ingot_mithril:0": 3000,
        # Add your item values here
    }

    with open(input_filepath, 'r') as file:
        for line_number, line in enumerate(file, start=1):
            # Parse bill rack robbing
            match = re.search(r"^(?:\[.*?\]) (\w+) .*? received (.*?) at the cost of (\d+) criminality", line)
            if match:
                player = match.group(1)
                value = match.group(2)
                criminality = int(match.group(3))

                grons = parse_grons(value)
                player_totals[player] += grons
                total_robbed += grons
                criminality_totals[player] += criminality

            # Parse gold rack robbing
            match = re.search(r"^(?:\[.*?\]) (\w+) opened a Gold Rack and received: (.+)", line)
            if match:
                player = match.group(1)
                items = match.group(2).split(", ")
                for item in items:
                    item_name, _, count = item.rpartition(" x")
                    count = int(count) if count.isdigit() else 1
                    gold_rack_totals[player][item_name] += count
                    overall_item_totals[item_name] += count

                    # Calculate item value
                    if item_name == "minecraft:gold_ingot:0":
                        gold_value = 500 if line_number > 370 else 50000
                        player_item_values[player] += count * gold_value
                    else:
                        player_item_values[player] += count * item_values.get(item_name, 0)

            # Parse safe robbing
            match = re.search(r"^(?:\[.*?\]) (\w+) broke open a Safe and received: (.+)", line)
            if match:
                player = match.group(1)
                items = match.group(2).split(", ")
                for item in items:
                    item_name, _, count = item.rpartition(" x")
                    count = int(count) if count.isdigit() else 1
                    safe_totals[player][item_name] += count
                    overall_item_totals[item_name] += count

                    # Calculate item value
                    if item_name == "minecraft:gold_ingot:0":
                        gold_value = 500 if line_number > 370 else 50000
                        player_item_values[player] += count * gold_value
                    else:
                        player_item_values[player] += count * item_values.get(item_name, 0)

    # Calculate total worth of items
    total_worth = sum(player_item_values.values())

    with open(output_filepath, 'w') as report:
        report.write("# Bank Robbery Report\n\n")
        report.write(f"## Total Value Robbed Overall: {total_robbed + total_worth:.2f} grons\n")
        report.write(f"## Total Money Robbed: {total_robbed:.2f} grons\n")
        report.write(f"## Total Items Robbed: {total_worth:.2f} grons\n\n")

        report.write("## Player Earnings\n")
        for player, total in sorted(player_totals.items(), key=lambda x: x[1] + player_item_values[x[0]], reverse=True):
            total_earnings = total + player_item_values[player]
            report.write(f"- {player}: {total_earnings:.2f} grons\n")

        report.write("\n### Breakdown by Type\n")
        report.write("#### Money\n")
        for player, total in sorted(player_totals.items(), key=lambda x: x[1], reverse=True):
            report.write(f"- {player}: {total:.2f} grons\n")

        report.write("\n#### Item Worth\n")
        for player, value in sorted(player_item_values.items(), key=lambda x: x[1], reverse=True):
            report.write(f"- {player}: {value:.2f} grons\n")

        report.write("\n## Player Criminality\n")
        for player, total_criminality in sorted(criminality_totals.items(), key=lambda x: x[1], reverse=True):
            report.write(f"- {player}: {total_criminality} criminality points\n")

        report.write("\n## Gold Rack Items\n")
        for player, items in gold_rack_totals.items():
            report.write(f"- {player}:\n")
            for item, count in items.items():
                report.write(f"  - {item}: {count}\n")

        report.write("\n## Safe Items\n")
        for player, items in safe_totals.items():
            report.write(f"- {player}:\n")
            for item, count in items.items():
                report.write(f"  - {item}: {count}\n")

        report.write("\n## Overall Item Totals\n")
        for item, total in sorted(overall_item_totals.items(), key=lambda x: x[1], reverse=True):
            report.write(f"- {item}: {total}\n")

    print(f"Report generated successfully: {output_filepath}")

if __name__ == "__main__":
    input_file = "/home/mouette/gramados-v2/world/customnpcs/scripts/logs/bank_robbery.log"
    output_file = "/home/mouette/gramados-v2/scripts_backend/reports/bank_robbery_report.md"
    decode_bank_robbery_log(input_file, output_file)
