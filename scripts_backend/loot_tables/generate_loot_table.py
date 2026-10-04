import json
import re
import os

def read_items_from_file(filename):
    with open(filename, "r") as file:
        # Strip whitespace and angle brackets
        return [line.strip().strip('<>"') for line in file if line.strip()]

def generate_loot_table(items):
    loot_entries = []
    for item in items:
        match = re.match(r"(.+):(\d+)$", item)  # Match items with damage values
        if match:
            name, damage = match.groups()
            loot_entries.append({
                "type": "item",
                "name": name,
                "weight": 5,
                "functions": [
                    {
                        "function": "set_data",
                        "data": int(damage)
                    }
                ]
            })
        else:
            loot_entries.append({
                "type": "item",
                "name": item,
                "weight": 5
            })

    return {
        "pools": [
            {
                "rolls": 1,
                "entries": loot_entries
            }
        ]
    }

def write_loot_table_to_file(loot_table, output_filename):
    with open(output_filename, "w") as file:
        json.dump(loot_table, file, indent=4)

if __name__ == "__main__":
    input_folder = "/home/mouette/gramados-v2/scripts_backend/loot_tables"
    
    # List all .txt files in the folder
    txt_files = [f for f in os.listdir(input_folder) if f.endswith('.txt')]
    
    for txt_file in txt_files:
        input_path = os.path.join(input_folder, txt_file)
        output_filename = txt_file.replace('.txt', '.json')
        output_path = os.path.join(input_folder, output_filename)
        
        items = read_items_from_file(input_path)
        loot_table = generate_loot_table(items)
        write_loot_table_to_file(loot_table, output_path)
        
        print(f"Loot table with {len(items)} items written to {output_path}")
