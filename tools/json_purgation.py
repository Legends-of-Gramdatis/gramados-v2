import json
import re
import os
import tempfile

def clean_minecraft_json(content):
    """
    Cleans up Minecraft-style broken JSON, fixing values like Damage: 0s by removing the trailing 's'.
    Also removes any unnecessary Minecraft-specific data type characters like `b`, `L`, etc.
    """
    # Remove trailing 's' from numeric values (e.g., "Damage": 0s -> "Damage": 0)
    content = re.sub(r'(\d+)[s]\b', r'\1', content)

    # Remove 'b' and 'L' from boolean and number types (e.g., "Slot": 1b -> "Slot": 1)
    content = re.sub(r'(\d+)[bL]\b', r'\1', content)

    # If there are other Minecraft-specific suffixes, add them here as needed.
    
    # Return the cleaned content
    return content

def purgate_json(input_path, output_path=None):
    """
    Purges a Minecraft broken JSON file by cleaning up the invalid values.
    
    :param input_path: Path to the broken JSON file.
    :param output_path: Path where the cleaned-up JSON file will be saved. If None, saves to a temporary directory.
    :return: Path to the cleaned-up JSON file.
    """
    # Read the content of the broken JSON file
    with open(input_path, 'r') as file:
        raw_content = file.read()

    # Clean the broken JSON content
    cleaned_content = clean_minecraft_json(raw_content)

    # If no output path is provided, create a temporary directory and save the cleaned file there
    if not output_path:
        # Create a temporary file
        temp_dir = tempfile.mkdtemp()
        output_path = os.path.join(temp_dir, 'cleaned_minecraft.json')

    # Save the cleaned JSON content into the output file
    with open(output_path, 'w') as file:
        file.write(cleaned_content)

    # Return the path to the cleaned file
    return output_path

def loadMCjson(input_path):
    """
    Loads and cleans a Minecraft-style broken JSON file, returning the cleaned JSON data as a dictionary.
    
    :param input_path: Path to the broken JSON file.
    :return: Python dictionary containing the cleaned JSON data.
    """
    # Read the content of the broken JSON file
    with open(input_path, 'r') as file:
        raw_content = file.read()

    # Clean the broken JSON content
    cleaned_content = clean_minecraft_json(raw_content)

    # Return the cleaned JSON data as a dictionary
    return json.loads(cleaned_content)

# Example usage:
if __name__ == "__main__":
    # Path to the broken Minecraft JSON
    input_json_path = "/home/mouette/gramados-v2/world/customnpcs/markets/paint_shop p4.json"
    
    # Use the loadMCjson function to load the cleaned JSON data directly
    cleaned_json_data = loadMCjson(input_json_path)

    # save in file
    output_path = "/home/mouette/gramados-v2/tools/cleaned_paint_shop.json"
    with open(output_path, 'w') as file:
        json.dump(cleaned_json_data, file, indent=4)

    # Print the cleaned JSON data (or use it for further processing)
    print("Cleaned JSON data loaded:")
    print(cleaned_json_data)
