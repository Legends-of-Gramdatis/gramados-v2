// Define the raw color codes and effects for formatting text
var _RAWCOLORS = {
    '0': 'black',
    '1': 'dark_blue',
    '2': 'dark_green',
    '3': 'dark_aqua',
    '4': 'dark_red',
    '5': 'dark_purple',
    '6': 'gold',
    '7': 'gray',
    '8': 'dark_gray',
    '9': 'blue',
    'a': 'green',
    'b': 'aqua',
    'c': 'red',
    'd': 'light_purple',
    'e': 'yellow',
    'f': 'white',
};
var _RAWEFFECTS = {
    'o': 'italic',
    'l': 'bold',
    'k': 'magic',
    'm': 'strike',
    'n': 'underline',
    'r': 'reset'
}
// Define the constants for coin denominations and their values
var _COINTABLE = {
    'c': 1,
    'g': 100,
    'k': 100000,
    'm': 100000000,
    'b': 100000000000,
    't': 100000000000000,
    'q': 100000000000000000,
    's': 100000000000000000000
};
var _COINITEMS = {
    '1c': 'variedcommodities:coin_iron',
    '5c': 'variedcommodities:coin_iron',
    '10c': 'variedcommodities:coin_iron',
    '20c': 'variedcommodities:coin_iron',
    '50c': 'variedcommodities:coin_iron',
    '1g': 'variedcommodities:coin_iron',
    '2g': 'variedcommodities:coin_iron',
    '5g': 'variedcommodities:money',
    '10g': 'variedcommodities:money',
    '20g': 'variedcommodities:money',
    '50g': 'variedcommodities:money',
    '100g': 'variedcommodities:money',
    '200g': 'variedcommodities:money',
    '500g': 'variedcommodities:money',
    '1k': 'variedcommodities:plans',
    '10k': 'variedcommodities:plans',
    '100k': 'variedcommodities:plans',
    '1m': 'variedcommodities:plans',
};

// Initialize variables and constants for the stock exchange
var crates_ids = [
    "mts:unuparts.unuparts_part_unu_crate_wooden",
    "mts:unuparts.unuparts_part_unu_crate_metal",
    "mts:iv_tpp.trin_crate2",
    "mts:iv_tpp.trin_crate1_wooden",
    "mts:iv_tpp.trin_crate1_metal"
];

var NPC_REGION = "Allenis";
var stock_exchange_instance;

var MIN_PRICE = 10; // Minimum price threshold to prevent prices going too low
var TIME_THRESHOLD = 72000; // 1 hour in ticks (72000 ticks = 60 min in Minecraft)
var PRICE_INCREASE_FACTOR = 0.1; // 10% price increase if item hasn't been sold in a while
var STOCK_FILE_PATH = "world/customnpcs/scripts/stock_exchange_data.json"; // Path to the JSON file

var npc; // Global variable to store the NPC instance
var world; // Get the world where the NPC is located


// Load the stock exchange data when the NPC is initialized
function init(event) {
    npc = event.npc;
    world = npc.getWorld();
}

// When a player interacts with the NPC
function interact(event) {
    var player = event.player;
    var item = player.getMainhandItem();
    var stackSize = item.getStackSize(); // Get the number of stacked crates

    // Load the stock exchange data for this NPC region
    stock_exchange_instance = load_data()[NPC_REGION];

    // Check if the player is holding one of the valid crates
    for (var i = 0; i < crates_ids.length; i++) {
        if (item.getName() == crates_ids[i]) {
            npc.say("Let me see what you have in that crate...");

            // Read the contents of the crate
            var delivery = read_delivery(item, stackSize); // Pass stack size to read_delivery

            // If the crate is empty or contains items not in the exchange
            if (Object.keys(delivery).length === 0) {
                npc.say("This crate doesn't have items I can accept.");
                return;
            }

            // Calculate total earnings before updating stock prices
            var totalEarnings = calculateEarnings(delivery);

            // Update the stock exchange data with the crate's contents
            updateStockPrices(NPC_REGION, delivery, player);

            // Clear only the sold items from the crate after processing
            clear_crate(item, delivery);

            // Generate money items for the player
            generateMoneyForPlayer(player.getWorld(), totalEarnings, player);

            return; // End interaction
        }
    }

    // If the player isn't holding a valid crate
    npc.say("Please hold a valid filled crate to sell items.");
}

// Function to calculate total earnings from delivered items
function calculateEarnings(delivery) {
    var totalEarnings = 0;

    for (var item in delivery) {
        var quantityDelivered = delivery[item];

        // Ensure the item exists in the stock exchange
        if (stock_exchange_instance[item]) {
            var itemPrice = stock_exchange_instance[item].current_price;
            totalEarnings += itemPrice * quantityDelivered; // Calculate total earnings
        }

        // In case of ageable items, check if the item is part of stock exchanged, stripped of age data
        var strippedItem = item.split(":")[0] + ":" + item.split(":")[1] + ":" + item.split(":")[2];
        npc.say(strippedItem);
    }

    return totalEarnings; // Return total earnings in cents
}

// Function to generate money items for the player
function generateMoneyForPlayer(world, totalCents, player) {
    // Generate the money items based on total cents
    var moneyItems = genMoney(world, totalCents);

    // Drop the generated money items at the player's location
    for (var i = 0; i < moneyItems.length; i++) {
        player.dropItem(moneyItems[i]);
    }

    // Inform the player about the money generated
    npc.say("&aYou received your payment!");
}

// Function to read the contents of the crate, accounting for stack size
function read_delivery(item, stackSize) {
    var delivery = {};

    // Read the items from the crate's inventory
    var items = item.getNbt().getCompound("inventory").getList("Items", 10);

    for (var i = 0; i < items.length; i++) {
        var item_id = items[i].getString("id");
        var item_damage = items[i].getShort("Damage");
        var item_count = items[i].getByte("Count");
        var age_data = {};

        var key = item_id + ":" + item_damage;

        // Check if the item is part of the stock exchange instance
        if (stock_exchange_instance[key]) {
            // Multiply item count by stack size (to account for multiple crates)
            var totalCount = item_count * stackSize;

            npc.say("Item data: " + items[i].toJsonString());

            // If Item has a "type" key
            if (items[i].getString("type") != "" && items[i].getString("type") != null) {
                // If "type": "ageable_item"
                if (items[i].getString("type") == "ageable_item") {
                    age_data = readAgeableItem(items[i]);
                }
            }

            // Format the item as a key
            if (age_data["Domain"]) {
                var key = item_id + ":" + item_damage + ":" + age_data["Domain"] + ":" + age_data["Age"];
            }

            // Add the item to the delivery, combining quantities if the same item exists
            if (delivery[key]) {
                delivery[key] += totalCount;
            } else {
                delivery[key] = totalCount;
            }
        }
    }

    return delivery;
}

// Function to calculate price changes based on supply and time since last sale
function updateStockPrices(region, delivery, player) {
    var currentTime = world.getTotalTime(); // Get the current world time in ticks

    // Iterate through the delivered items
    for (var item in delivery) {
        var quantityDelivered = delivery[item];

        // Ensure the item exists in the stock exchange
        if (!stock_exchange_instance[item]) {
            npc.say("The item " + item + " is not part of the stock exchange.");
            continue;
        }

        // Update the quantity sold
        stock_exchange_instance[item].quantity_sold += quantityDelivered;

        // Calculate the new price based on the quantity delivered
        var decreaseFactor = 0.05; // 5% price reduction per large delivery
        var newPrice = stock_exchange_instance[item].current_price - (decreaseFactor * quantityDelivered);

        // Ensure the price doesn't drop below the minimum threshold
        stock_exchange_instance[item].current_price = Math.max(newPrice, MIN_PRICE);

        // Update the last sold time to the current time
        stock_exchange_instance[item].last_sold_time = currentTime;

        npc.say("You sold " + quantityDelivered + " of " + stock_exchange_instance[item].display_name + ", earning " + getAmountCoin(stock_exchange_instance[item].current_price * quantityDelivered) + " ! (" + getAmountCoin(stock_exchange_instance[item].current_price) + " each)");
    }

    // Now, adjust prices for items not sold recently
    for (var item in stock_exchange_instance) {
        if (!delivery[item]) {
            var timeSinceLastSale = currentTime - stock_exchange_instance[item].last_sold_time;

            // If the item hasn't been sold in a while, increase its price
            if (timeSinceLastSale > TIME_THRESHOLD) {
                var timeMultiplier = Math.floor(timeSinceLastSale / TIME_THRESHOLD);
                var priceIncrease = PRICE_INCREASE_FACTOR * timeMultiplier * stock_exchange_instance[item].current_price;
                stock_exchange_instance[item].current_price += priceIncrease;

                npc.say(item + " price increased due to rarity. New price: " + stock_exchange_instance[item].current_price);
            }
        }
    }

    // Save the updated stock exchange data back to the JSON file
    save_data(stock_exchange_instance);
}

// Function to clear only sold items from the crate's contents
function clear_crate(item, delivery) {
    var inventory = item.getNbt().getCompound("inventory").getList("Items", 10);

    for (var i = 0; i < inventory.length; i++) {
        var item_id = inventory[i].getString("id");
        var item_damage = inventory[i].getShort("Damage");
        var key = item_id + ":" + item_damage;

        // Check if this item was in the delivery (i.e., it was sold)
        if (delivery[key]) {
            var item_count = inventory[i].getByte("Count");
            var sold_quantity = delivery[key];

            // If the crate has exactly the sold quantity, clear it; otherwise reduce the count
            if (item_count <= sold_quantity) {
                inventory[i].setByte("Count", 0); // Remove the item completely
            } else {
                inventory[i].setByte("Count", item_count - sold_quantity); // Reduce the item count
            }

            // Log for debugging
            //player.message("Removed " + sold_quantity + " of " + key + " from the crate.");
        }
    }

    // scan again to remove empty slots
    var left_over = [];
    for (var i = 0; i < inventory.length; i++) {
        var item_count = inventory[i].getByte("Count");
        if (item_count > 0) {
            left_over.push(inventory[i]);
        }
    }
    item.getNbt().getCompound("inventory").setList("Items", left_over);
}


// Function to load data from a specified JSON file
function load_data() {
    // Check if the file exists, if not, create it
    if (!check_file_exists(STOCK_FILE_PATH)) {
        create_json_file(STOCK_FILE_PATH);
        player.message("File created at: " + STOCK_FILE_PATH);
    }

    // Read the file and parse it as JSON
    var ips = new java.io.FileInputStream(STOCK_FILE_PATH);
    var fileReader = new java.io.InputStreamReader(ips, "UTF-8");
    var readFile = fileReader.read();
    var data;
    var start = "";
    while (readFile != -1) {
        data = String.fromCharCode(readFile);
        start = start + data;
        readFile = fileReader.read();
    }
    fileReader.close();
    ips.close();

    // Parse the data as JSON
    var json_data = JSON.parse(start);

    return json_data;
}

// Function to check if a file exists
function check_file_exists(file_path) {
    var file = new java.io.File(file_path);
    return file.exists();
}

// Function to create an empty JSON file
function create_json_file(file_path) {
    var fileWriter = new java.io.FileWriter(file_path);
    fileWriter.write("{}"); // Create an empty JSON object
    fileWriter.close();
}

// Function to save data to a specified JSON file
function save_data(data) {
    // Load the existing json data
    var json_data = load_data();

    // Update the region-specific data
    json_data[NPC_REGION] = data;

    // Write the updated data back to the file
    var fileWriter = new java.io.FileWriter(STOCK_FILE_PATH);
    fileWriter.write(JSON.stringify(json_data, null, 4)); // Pretty-print JSON with 4 spaces
    fileWriter.close();
}

// This function converts a numeric amount into a coin denomination string.
// It uses a predefined _COINTABLE, which must be ordered from the lowest ('c') to the highest ('s') value.
function getAmountCoin(amount) {
    // Initialize an empty result string to store the final coin breakdown.
    var result = '';

    // Determine the sign of the amount (positive or negative).
    var signOfAmount = sign(amount);

    // If the amount is negative, prepend a minus sign.
    if (signOfAmount == -1) {
        result = '-';
    }

    // Use absolute value for further processing, ignoring whether it's negative or positive.
    amount = Math.abs(amount);

    // Get the coin types from _COINTABLE (assuming the table is already in ascending order).
    var coinKeys = Object.keys(_COINTABLE);

    // Iterate from the highest denomination down to the lowest.
    for (var i = coinKeys.length - 1; i >= 0; i--) {
        var coinCount = 0;
        var coinValue = _COINTABLE[coinKeys[i]];

        // Calculate how many coins of this type can fit into the amount.
        if (amount >= coinValue) {
            coinCount = Math.floor(amount / coinValue); // Determine the number of coins.
            amount -= coinCount * coinValue;           // Subtract the equivalent value from the amount.
        }

        // If any of this coin type is used, append it to the result string.
        if (coinCount > 0) {
            result += coinCount.toString() + coinKeys[i].toUpperCase();
        }
    }

    // If no coins were appended, default to "0C" (0 copper).
    if (result === '' || result === '-') {
        result += '0C'; // Even for negative amounts, add 0C (e.g., -0C for no value)
    }

    return result;
}

function sign(num) {
    if (typeof (num) == typeof (undefined) || num === null) { num = 0; }
    if (num > 0) { return 1; }
    if (num < 0) { return -1; }
    return 0;
}

function ccs(str, af) {
    if (typeof (af) == typeof (undefined) || af === null) { af = null; }
    return colorCodeString(str, af);
}

function colorCodeString(str, allowed_formats) {
    if (typeof (allowed_formats) == typeof (undefined) || allowed_formats === null) { allowed_formats = null; }
    if (allowed_formats == null) {
        allowed_formats = Object.keys(_RAWCOLORS).concat(Object.keys(_RAWEFFECTS));
    }
    allowed_formats = removeFromArray(allowed_formats, ['x', 'y']);
    return str.replace(new RegExp("&([" + allowed_formats.join("") + "])", 'g'), '\u00A7$1').replace(/&\\/g, '&');
}

function removeFromArray(arr, vals) {
	if(typeof(vals) == 'string') { vals = [vals]; }
	var a = [];
	arr.forEach(function(el){a.push(el);});//Copy array
	for(var v in vals) {
		var i = arr.indexOf(vals[v]);
		if(i > -1) {
			a.splice(i, 1);
		}
	}
	
	return a;
}

// Existing code for genMoney remains unchanged
function genMoney(w, amount) {
    var am = amount;
    var coinams = Object.keys(_COINITEMS);

    var nmItems = [];
    for (var i = coinams.length - 1; i >= 0; i--) {
        var coincount = 0;
        var coinval = getCoinAmount(coinams[i]);
        if (coinval > 0) {
            while (am >= coinval) {
                coincount++;
                am -= coinval;
            }
        }
        if (coincount > 0) {
            var coinitem = w.createItem(_COINITEMS[coinams[i]], 0, coincount);
            coinitem.setCustomName(ccs('&2&lMoney&r'));
            coinitem.setLore([
                ccs('&e' + coinams[i].toUpperCase())
            ]);
            nmItems.push(coinitem);
        }
    }

    return nmItems;
}

function getCoinAmount(str) {
    var arx = /([\d]+)([a-zA-Z]+)/g;
    var amounts = str.match(arx) || [];
    var amount = 0;

    for (var a in amounts) {
        var _am = amounts[a];
        var _amnum = parseInt(_am.replace(arx, '$1'));
        var _amunit = _am.replace(arx, '$2').toLowerCase();
        var coinkeys = Object.keys(_COINTABLE);
        if (coinkeys.indexOf(_amunit) > -1) {
            amount += _amnum * _COINTABLE[_amunit];
        }
    }
    return amount;
}

//function to read an "ageable_item"
function readAgeableItem(item) {
    var data = {};
    // Get the lore of the item
    var lore = item.getLore();
    // Process the lore to get the bottle age and bottling date
    for (var i = 0; i < lore.length; i++) {
        if (lore[i].contains("Bottling Date")) {
            var bottling_date = lore[i].split(": ");
            data["Bottling Date"] = bottling_date[1];
        }
        if (lore[i].contains("Age (in ticks)")) {
            var age_ticks = lore[i].split(": ");
            data["Age"], age_ticks[1];
        }
        if (lore[i].contains("Domain")) {
            var domain = lore[i].split(": ");
            data["Domain"] = domain[1];
        }
    }

    return data;
}
