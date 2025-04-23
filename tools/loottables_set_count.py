import os
import json

# CONFIGURATION
LOOT_TABLE_DIR = '/home/mouette/gramados-v2/world/loot_tables/automobile/wheels'
TARGET_COUNT = 4
OVERWRITE_EXISTING_COUNT = False

def update_loot_table(path):
    with open(path, 'r', encoding='utf-8') as file:
        try:
            data = json.load(file)
        except json.JSONDecodeError:
            print(f"❌ Failed to parse JSON: {path}")
            return

    changed = False

    for pool in data.get('pools', []):
        for entry in pool.get('entries', []):
            if entry.get('type') != 'item':
                continue

            functions = entry.get('functions', [])
            found_set_count = False

            for func in functions:
                if func.get('function') == 'set_count':
                    found_set_count = True
                    if isinstance(func.get('count'), int):
                        if func['count'] != TARGET_COUNT:
                            if OVERWRITE_EXISTING_COUNT:
                                func['count'] = TARGET_COUNT
                                changed = True
                    else:
                        if OVERWRITE_EXISTING_COUNT:
                            func['count'] = TARGET_COUNT
                            changed = True
                    break

            if not found_set_count:
                functions.append({
                    "function": "set_count",
                    "count": TARGET_COUNT
                })
                entry['functions'] = functions
                changed = True

    if changed:
        with open(path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4)
        print(f"✅ Updated: {path}")
    else:
        print(f"➖ No change: {path}")


def process_all_loot_tables(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.json'):
                full_path = os.path.join(root, file)
                update_loot_table(full_path)


if __name__ == '__main__':
    process_all_loot_tables(LOOT_TABLE_DIR)
