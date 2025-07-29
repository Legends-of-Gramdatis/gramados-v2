import json

# List of mod IDs to clean up
MOD_IDS_TO_REMOVE = [
    "projectred-illumination",
    "mtsseagulltrinpartpack"
]

# Path to the global prices JSON file
GLOBAL_PRICES_PATH = "/home/mouette/gramados-v2/world/customnpcs/scripts/globals/global_prices.json"

def cleanup_global_prices(mod_ids, file_path):
    """
    Removes entries from the global prices JSON file based on specified mod IDs.

    :param mod_ids: List of mod IDs to remove.
    :param file_path: Path to the global prices JSON file.
    """
    try:
        # Load the global prices JSON file
        with open(file_path, 'r') as file:
            global_prices = json.load(file)

        # Filter out entries with specified mod IDs
        cleaned_prices = {
            key: value
            for key, value in global_prices.items()
            if not any(key.startswith(mod_id + ":") for mod_id in mod_ids)
        }

        # Sort the cleaned prices alphabetically by key
        cleaned_prices = dict(sorted(cleaned_prices.items()))

        # Save the cleaned global prices back to the file
        with open(file_path, 'w') as file:
            json.dump(cleaned_prices, file, indent=4)

        print(f"✅ Cleanup complete. Removed entries with mod IDs: {mod_ids}")
    except Exception as e:
        print(f"❌ An error occurred during cleanup: {e}")

if __name__ == "__main__":
    cleanup_global_prices(MOD_IDS_TO_REMOVE, GLOBAL_PRICES_PATH)
