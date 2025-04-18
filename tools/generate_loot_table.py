import json

def read_items_from_file(filename):
    with open(filename, "r") as file:
        # Strip whitespace and angle brackets
        return [line.strip().strip('<>"') for line in file if line.strip()]

def generate_loot_table(items):
    return {
        "pools": [
            {
                "rolls": 1,
                "entries": [
                    {"type": "item", "name": item, "weight": 5}
                    for item in items
                ]
            }
        ]
    }

def write_loot_table_to_file(loot_table, output_filename):
    with open(output_filename, "w") as file:
        json.dump(loot_table, file, indent=4)

if __name__ == "__main__":
    input_file = "/home/mouette/gramados-v2/tools/items.txt"             # Make sure this matches your .txt file
    output_file = "/home/mouette/gramados-v2/tools/loot_table.json"      # Output loot table JSON

    items = read_items_from_file(input_file)
    loot_table = generate_loot_table(items)
    write_loot_table_to_file(loot_table, output_file)

    print(f"Loot table with {len(items)} items written to {output_file}")
