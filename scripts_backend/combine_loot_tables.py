import json
import os

def read_json_files_from_folder(folder_path):
    """Read all .json files from a folder and return their relative paths."""
    json_files = []
    for filename in os.listdir(folder_path):
        if filename.endswith('.json'):
            json_files.append(filename)
    return sorted(json_files)

def generate_combined_loot_table(json_files, folder_path, base_path=""):
    """
    Generate a combined loot table from multiple JSON files.
    
    Args:
        json_files: List of JSON filenames
        folder_path: Path to the folder containing the JSON files
        base_path: Optional base path prefix for all loot_table paths
    """
    entries = []
    for json_file in json_files:
        # Construct the path for the loot_table entry
        if base_path:
            relative_path = os.path.join(base_path, json_file)
        else:
            relative_path = json_file
        
        entry = {
            "type": "loot_table",
            "path": relative_path,
            "weight": 5
        }
        entries.append(entry)
    
    return {
        "pools": [
            {
                "rolls": 1,
                "entries": entries
            }
        ]
    }

def write_loot_table_to_file(loot_table, output_filename):
    """Write the loot table to a JSON file."""
    with open(output_filename, "w") as file:
        json.dump(loot_table, file, indent=4)

if __name__ == "__main__":
    input_folder = "/home/mouette/gramados-v2/world/loot_tables/automobile/vehicles/trin/cars"
    output_file = "/home/mouette/gramados-v2/world/loot_tables/automobile/vehicles/trin/cars/cars_trincol_common.json"
    base_path = ""  # Set this if you want a prefix for all paths (e.g., "automobile/vehicles")
    
    json_files = read_json_files_from_folder(input_folder)
    
    if not json_files:
        print(f"No JSON files found in {input_folder}")
    else:
        loot_table = generate_combined_loot_table(json_files, input_folder, base_path)
        write_loot_table_to_file(loot_table, output_file)
        print(f"Combined loot table with {len(json_files)} entries written to {output_file}")
