import os
import csv
import json
from datetime import datetime
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator

# Define the path to the JSON file and the output directory for CSVs and plots
json_file_path = '/home/mouette/minecraft/gramados-v2/world/customnpcs/scripts/stock_exchange_data.json'
output_dir = '/home/mouette/website/www/html/legends-of-gramdatis/img/gramados_stocks/'

# Function to read the JSON data
def read_json(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

# Function to update the CSV with new stock data, adding the current price for a new timestamp
def update_csv(region, data, enable_plot):
    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Define the CSV file path for the region
    csv_file = os.path.join(output_dir, f'{region}.csv')
    
    # Get the current timestamp (to use as a new column header)
    timestamp = datetime.now().strftime("%d-%m-%Y %H:%M:%S")
    
    # Check if the file already exists
    file_exists = os.path.exists(csv_file)

    # Read existing data if the file already exists
    if file_exists:
        with open(csv_file, 'r') as file:
            reader = list(csv.reader(file))
            header = reader[0]
            rows = reader[1:]
    else:
        header = ['Item', 'Display Name', 'Reference Price', 'Min Price', 'Max Price', 'Quantity Sold']
        rows = []

    # Add the new timestamp as a new column in the header
    header.append(timestamp)

    # Create a dictionary for quick access to existing rows
    row_dict = {row[0]: row for row in rows}  # Keyed by 'Item'

    # Update or create rows based on the JSON data
    for item_id, item_data in data.items():
        if item_id in row_dict:
            # Append the new current price to the existing row
            row_dict[item_id].append(item_data.get('current_price'))
        else:
            # Create a new row if the item doesn't already exist
            new_row = [
                item_id,
                item_data.get('display_name'),
                item_data.get('reference_price'),
                item_data.get('min_price'),
                item_data.get('max_price'),
                item_data.get('quantity_sold')
            ]
            # Fill previous columns with empty values
            new_row.extend([''] * (len(header) - len(new_row) - 1))
            # Add the current price
            new_row.append(item_data.get('current_price'))
            row_dict[item_id] = new_row

    # Write the updated data back to the CSV
    with open(csv_file, 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(header)
        for row in row_dict.values():
            # If the row is missing data for some timestamps, fill it with empty values
            while len(row) < len(header):
                row.append('')
            writer.writerow(row)

    # After updating the CSV, create a single plot for the entire region if enabled
    if enable_plot:
        generate_region_plot(region, csv_file)

# Function to generate a single plot for all items in a region
def generate_region_plot(region, csv_file):
    # Read the CSV file to get stock data
    with open(csv_file, 'r') as file:
        reader = list(csv.reader(file))
        header = reader[0]  # The first row is the header
        rows = reader[1:]   # The rest are data rows

    # Extract timestamps (all columns after the first 6) and items
    timestamps = header[6:]  # Timestamps start from the 7th column (index 6)
    
    plt.figure(figsize=(12, 8))  # Create a new figure for the region
    
    # To keep track of the maximum price encountered
    max_price = 0
    
    # Collect prices and labels for sorting
    plot_data = []

    # Generate a line for each item in the region
    for row in rows:
        item_id = row[0]
        display_name = row[1]

        # Extract stock prices (starting from the 7th element onward)
        prices = row[6:]
        prices = [float(p) if p else None for p in prices]  # Convert to float, handle empty values
        
        # Update max_price if the current item's max price is greater
        item_max_price = max((p for p in prices if p is not None), default=0)
        if item_max_price > max_price:
            max_price = item_max_price
            
        # Plot only if there are valid prices for this item
        if any(p is not None for p in prices):
            # Get the latest (most recent) price
            current_price = next((p for p in reversed(prices) if p is not None), None)

            # The price display is the current_price, divided by 100 rounded to 2 decimals
            display_price = round(current_price / 100, 2) if current_price else 'N/A'
            
            # Collect the data for sorting
            plot_data.append((current_price, timestamps, prices, display_name, display_price))

    # Sort the plot data by current price in descending order
    plot_data.sort(reverse=True, key=lambda x: x[0] if x[0] is not None else -1)

    # Plot the sorted data
    for _, timestamps, prices, display_name, display_price in plot_data:
        plt.plot(timestamps, prices, marker='o', linestyle='-', label=f'{display_name} (Current: {display_price}g)')

    # Formatting the plot
    plt.title(f'Stock Prices of {region} Over Time')
    plt.xlabel('Time')
    plt.ylabel('Price')
    plt.xticks(rotation=45, ha='right')
    plt.grid(True)

    # Set y-axis limit: minimum of 1000 or the max price + 10% for extra space
    plt.ylim(0, max(100, max_price * 1.1))

    # Limit the number of X-axis labels
    plt.gca().xaxis.set_major_locator(MaxNLocator(nbins=10))

    # Position the legend outside the plot (to the right)
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', borderaxespad=0.)

    # Save the plot as an image
    plot_file = os.path.join(output_dir, f'{region}_price_plot.png')
    plt.tight_layout()
    plt.savefig(plot_file, bbox_inches='tight')
    plt.close()

# Main function to handle the processing
def main(enable_csv_update=True, enable_plot_creation=True):
    # Load the JSON data
    data = read_json(json_file_path)

    # Process each region in the JSON
    for region, stock_data in data.items():
        if region == "Region Generals":  # Skip 'Region Generals'
            continue
        if enable_csv_update:
            update_csv(region, stock_data, enable_plot_creation)

if __name__ == '__main__':
    # Set the boolean values for enabling/disabling CSV update and plot creation
    enable_csv_update = True
    enable_plot_creation = True
    
    main(enable_csv_update, enable_plot_creation)