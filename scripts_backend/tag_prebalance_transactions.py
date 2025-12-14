import json
import argparse
from datetime import datetime

# Mapping of JavaScript month names to month numbers
MONTH_MAP = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
}

def parse_js_date(js_date):
    """Parse a JavaScript date string or a simple date string into a datetime object."""
    try:
        parts = js_date.split(" ")
        if len(parts) == 3:  # Handle simple format like "Mar 11 2025"
            month = MONTH_MAP[parts[0]]
            day = int(parts[1])
            year = int(parts[2])
        elif len(parts) >= 4:  # Handle JavaScript-style format
            month = MONTH_MAP[parts[1]]
            day = int(parts[2])
            year = int(parts[3])
        else:
            raise ValueError
        return datetime(year, month, day)
    except (IndexError, KeyError, ValueError):
        raise ValueError(f"Invalid date format: {js_date}")

def tag_prebalance(filepath, market, min_date, max_date):
    """Tag transactions as prebalance based on market and date range."""
    with open(filepath, 'r') as file:
        data = json.load(file)

    min_date = parse_js_date(min_date) if min_date != "ever" else datetime.min
    max_date = parse_js_date(max_date) if max_date != "ever" else datetime.max

    total_entries = 0
    edited_entries = 0

    for player, transactions in data.items():
        for transaction in transactions:
            if transaction["region"] == market:
                total_entries += 1
                transaction_date = parse_js_date(transaction["date"])
                if min_date <= transaction_date <= max_date:
                    transaction["prebalance"] = True
                    edited_entries += 1

    print(f"Edited {edited_entries} out of {total_entries} entries for market/region '{market}'.")

    with open(filepath, 'w') as file:
        json.dump(data, file, indent=4)

def main():
    parser = argparse.ArgumentParser(description="Tag transactions as prebalance in economy.json.")
    parser.add_argument("--market", required=True, help="Market/region to filter transactions (e.g., 'Gramados Industrial Terracotta').")
    parser.add_argument("--min-date", default="ever", help="Minimum date (e.g., 'Mar 01 2025') or 'ever' for no limit.")
    parser.add_argument("--max-date", default="ever", help="Maximum date (e.g., 'Mar 11 2025') or 'ever' for no limit.")
    args = parser.parse_args()

    filepath = "/home/mouette/gramados-v2/world/customnpcs/scripts/logs/economy.json"
    tag_prebalance(filepath, args.market, args.min_date, args.max_date)

if __name__ == "__main__":
    main()
