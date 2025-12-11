import os
import json
import re

# Define the directory containing the dialogue JSON files
DIALOGUES_DIR = "/home/mouette/gramados-v2/world/customnpcs/dialogs"
OUTPUT_FILE = "/home/mouette/gramados-v2/scripts_backend/reports/decoded_dialogues.json"

def clean_json_content(content):
    """
    Cleans up invalid JSON values and replaces real line breaks inside strings with \\n.
    """
    # Replace `0b` and `1b` with `false` and `true`
    content = re.sub(r'\b0b\b', 'false', content)
    content = re.sub(r'\b1b\b', 'true', content)

    # Remove trailing `L` and `s` from numbers
    content = re.sub(r'(\d+)[Ls]\b', r'\1', content)

    # Replace real newlines inside string values with \\n
    def replace_newlines_in_strings(match):
        inner = match.group(0)
        # Only replace real newlines
        inner = inner.replace('\n', '\\n')
        return inner

    content = re.sub(r'"(.*?)"', replace_newlines_in_strings, content, flags=re.DOTALL)

    # Replace fancy apostrophe with normal one
    content = content.replace('’', "'")

    return content



def decode_dialogues():
    # Group dialogues by folder
    dialogues_by_folder = {}
    for root, _, files in os.walk(DIALOGUES_DIR):
        folder_name = os.path.relpath(root, DIALOGUES_DIR)
        folder_dialogues = {}
        for filename in files:
            if filename.endswith(".json"):
                filepath = os.path.join(root, filename)
                with open(filepath, "r", encoding="utf-8") as file:
                    try:
                        # Read and clean the JSON content
                        raw_content = file.read()
                        cleaned_content = clean_json_content(raw_content)

                        # Parse the cleaned JSON
                        data = json.loads(cleaned_content)
                        dialog_id = data.get("DialogId", -1)
                        title = data.get("DialogTitle", "Unknown Title")
                        text = data.get("DialogText", "")
                        options = []

                        # Parse options to find linked dialogues
                        for option in data.get("Options", []):
                            option_data = option.get("Option", {})
                            linked_dialog = option_data.get("Dialog", -1)
                            option_title = option_data.get("Title", "No Title")
                            options.append({
                                "title": option_title,
                                "linked_dialog": linked_dialog
                            })

                        # Preserve metadata
                        metadata = {k: v for k, v in data.items() if k not in ["DialogId", "DialogTitle", "DialogText", "Options"]}

                        folder_dialogues[dialog_id] = {
                            "title": title,
                            "text": text,
                            "options": options,
                            "metadata": metadata
                        }
                    except json.JSONDecodeError as e:
                        print(f"Error decoding JSON in file: {filepath}: {e}")
        if folder_dialogues:
            dialogues_by_folder[folder_name] = dict(sorted(folder_dialogues.items()))

    # Write the grouped dialogues to the output file
    sorted_dialogues_by_folder = dict(sorted(dialogues_by_folder.items()))
    with open(OUTPUT_FILE, "w", encoding="utf-8") as output_file:  # Specify UTF-8 encoding
        json.dump(sorted_dialogues_by_folder, output_file, indent=4, ensure_ascii=False)  # Preserve non-ASCII characters
    print(f"Decoded dialogues saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    decode_dialogues()