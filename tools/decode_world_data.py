import json

def decode_world_data(input_filepath, output_filepath):
    """Decode the JSON strings in world_data.json into proper JSON objects."""
    with open(input_filepath, 'r') as file:
        data = json.load(file)

    decoded_data = {}
    for key, value in data.items():
        try:
            decoded_data[key] = json.loads(value)
        except (json.JSONDecodeError, TypeError):
            decoded_data[key] = value  # Keep non-JSON strings as-is

    with open(output_filepath, 'w') as file:
        json.dump(decoded_data, file, indent=4)

    print(f"Decoded data written to {output_filepath}")

if __name__ == "__main__":
    input_file = "/home/mouette/gramados-v2/world/customnpcs/scripts/world_data.json"
    output_file = "/home/mouette/gramados-v2/tools/decoded_world_data.json"
    decode_world_data(input_file, output_file)
