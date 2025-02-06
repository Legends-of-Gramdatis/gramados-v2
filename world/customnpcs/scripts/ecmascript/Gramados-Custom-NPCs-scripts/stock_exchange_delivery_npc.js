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
    "mts:iv_tpp.trin_crate1_metal",
    "mts:ivv.backpack_red",
    "mts:ivv.backpack_blue",
    "mts:ivv.backpack_green",
    "mts:ivv.backpack_black",
    "mts:ivv.backpack_brown",
    "mts:ivv.backpack_white",
    "mts:ivv.backpack_yellow",
    "mts:ivv.crate_metallic",
    "mts:ivv.crate",
    "mts:ivv.box",
    "mts:iav.iav_storage_l_crate_2",
    "mts:iav.iav_storage_l_crate_3",
    "mts:iav.iav_storage_l_crate_5",
    "mts:iav.iav_storage_l_crate_6"
];

var _REGIONS = [];

var NPC_REGION = "Gramados Farming";
var region_specifics = {};
var stock_exchange_instance;
var stock_exchange_generals;

var _PRICE_EVOLUTION_FACTOR = 0.01; // 1% price increase or decrease
var STOCK_FILE_PATH = "world/customnpcs/scripts/stock_exchange_data.json"; // Path to the JSON file

var npc; // Global variable to store the NPC instance
var world; // Get the world where the NPC is located

// Function to get the list of available regions from json
function listRegions() {
    // Load the stock exchange data
    var data = load_data();
    // Get the list of keys from "Region Generals" object
    _REGIONS = Object.keys(data).filter(function (key) {
        return key !== "Region Generals";
    });
}


// Load the stock exchange data when the NPC is initialized
function init(event) {
    npc = event.npc;
    world = npc.getWorld();

    // get stored data
    var stored_data = npc.getStoreddata();
    // npc.say("Stored Data: " + stored_data);

    if (stored_data.has("region")) {
        NPC_REGION = stored_data.get("region");
        switch_region();
    } else {
        listRegions();
        npc.say("I am not set up yet. Please use a command block renamed to the stock I manage.");
        npc.say("Valid names: " + _REGIONS.join(", "));
        switch_region();
    }
}

function switch_region() {
    if (NPC_REGION == "Gramados Farming") {
        region_specifics = {
            helloPhrase: "Hello there! I'm the local stock exchange manager. I only deal with players who have the Gramados Farmer job.",
            jobId: 342
        }
    } else if (NPC_REGION == "Gramados Lumber") {
        region_specifics = {
            helloPhrase: "Hello there! I'm the local stock exchange manager. I only deal with players who have the Gramados Lumberjack job.",
            jobId: 59
        }
    } else if (NPC_REGION == "Gramados Industrial Concrete") {
        region_specifics = {
            helloPhrase: "Hello there! I'm the local stock exchange manager. I only deal with players who have the Gramados Concrete Factory Worker job.",
            jobId: 54
        }
    } else if (NPC_REGION == "Gramados Industrial Terracotta") {
        region_specifics = {
            helloPhrase: "Hello there! I'm the local stock exchange manager. I only deal with players who have the Gramados Terracotta Factory Worker job.",
            jobId: 61
        }
    } else if (NPC_REGION == "Greenfield Farming") {
        region_specifics = {
            helloPhrase: "Hello there! I'm the local stock exchange manager. I only deal with players who have the Greenfield Farmer job.",
            jobId: 51
        }
    } else if (NPC_REGION == "Greenfield Brewing") {
        region_specifics = {
            helloPhrase: "Hello there! I'm the local stock exchange manager. I only deal with players who have the Greenfield Farmer job.",
            jobId: 51
        }
    } else if (NPC_REGION == "Greenfield Lumber") {
        region_specifics = {
            helloPhrase: "Hello there! I'm the local stock exchange manager. I only deal with players who have the Greenfield Lumberjack job.",
            jobId: 56
        }
    } else if (NPC_REGION == "Farmiston") {
        region_specifics = {
            helloPhrase: "Hello there! I'm the local stock exchange manager. I only deal with players who have the Farmiston Farmer job.",
            jobId: 154
        }
    } else if (NPC_REGION == "Allenis") {
        region_specifics = {
            helloPhrase: "Hello there! I'm the local stock exchange manager. I only deal with players who have the Allenis Farmer job.",
            jobId: 233
        }
    } else if (NPC_REGION == "Monsalac Cheesemaking") {
        region_specifics = {
            helloPhrase: "Hello there! I'm the local stock exchange manager. I only deal with players who have the Monsalac Farmer job.",
            jobId: 211
        }
    } else if (NPC_REGION == "Monsalac Milk") {
        region_specifics = {
            helloPhrase: "Hello there! I'm the local stock exchange manager. I only deal with players who have the Monsalac Farmer job.",
            jobId: 211
        }
    } else {
        region_specifics = {
            helloPhrase: "I am currently not set up to trade in any region. Call the admin to set me up.",
            jobId: 230
        }
        return;
    }
    npc.say("I am ready to trade! Please hold a crate in your hand to begin.");
}

// When a player interacts with the NPC
function interact(event) {
    var player = event.player;

    // If player is holding a command block, let the player change the NPC's region
    if (player.getMainhandItem().getName() == "minecraft:command_block") {
        // Get how the command block is renamed
        var commandBlockName = player.getMainhandItem().getDisplayName();
        // npc.say("Command Block Name: " + commandBlockName);

        // Check if the command block is renamed to a valid region
        if (_REGIONS.indexOf(commandBlockName) > -1) {
            NPC_REGION = commandBlockName;
            switch_region();
            npc.getStoreddata().put("region", NPC_REGION);
            npc.say("Region set to: " + NPC_REGION);
        } else {
            npc.say("Invalid region name. Valid regions: " + _REGIONS.join(", "));
        }
    } else {

        // If player has read the hire dialogue
        if (!player.hasReadDialog(region_specifics.jobId)) {
            npc.say(region_specifics.helloPhrase);
            return;
        }

        var item = player.getMainhandItem();
        var stackSize = item.getStackSize(); // Get the number of stacked crates

        // Load the stock exchange data for this NPC region
        stock_exchange_instance = load_data()[NPC_REGION];
        stock_exchange_generals = load_data()["Region Generals"];

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
                var totalEarnings = calculateEarnings(delivery, NPC_REGION);

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
        npc.say("Hello there! I only accept deliveries in crates. Please hold a crate in your hand.");
    }
}

// Function to calculate total earnings from delivered items
function calculateEarnings(delivery, region) {
    var totalEarnings = 0;
    var earningsMultiplier = 1;

    // If there are generic items in the delivery
    if (delivery["generic"]) {
        for (var item in delivery["generic"]) {
            totalEarnings += parseInt(calculateGenericEarnings(delivery["generic"][item], item));
            if (stock_exchange_generals[region] && stock_exchange_generals[region]["variety_bonus"]) {
                earningsMultiplier += stock_exchange_generals[region]["variety_bonus"];
            }
        }
    }

    // If there are ageable booze items in the delivery
    if (delivery["ageable_booze"]) {
        for (var item in delivery["ageable_booze"]) {
            // npc.say("Current earnings: " + getAmountCoin(totalEarnings));
            totalEarnings += calculateAgeableBoozeEarnings(delivery["ageable_booze"][item], item);
            if (stock_exchange_generals[region] && stock_exchange_generals[region]["variety_bonus"]) {
                earningsMultiplier += stock_exchange_generals[region]["variety_bonus"];

            }
        }
    }

    // npc.say("Total Earnings: " + getAmountCoin(totalEarnings) + ", Earnings Multiplier: " + earningsMultiplier + ", Total Earnings after Multiplier: " + getAmountCoin(totalEarnings * earningsMultiplier));

    return totalEarnings * earningsMultiplier;
}

// Function to calculate generic earnings
function calculateGenericEarnings(generic_delivery_item, item_key) {
    var totalEarnings = 0;
    var quantity = generic_delivery_item["count"];
    var price = stock_exchange_instance[item_key]["current_price"];

    // npc.say("Generic Item: " + JSON.stringify(generic_delivery_item) + ", Quantity: " + quantity + ", Price: " + price);

    totalEarnings += quantity * price;

    return totalEarnings;
}

// Function to calculate ageable booze earnings
function calculateAgeableBoozeEarnings(booze_delivery_item, item_key) {

    // npc.say("Calculating earnings for ageable booze: " + JSON.stringify(booze_delivery_item));
    var quantity = booze_delivery_item["count"];

    // Get the base value of the item (only keep the first 3 parts of the key, and get the price from the stock exchange)
    var key = item_key.split(":").slice(0, 3).join(":");
    // npc.say("Key: " + key);
    var stackValue = stock_exchange_instance[key]["current_price"];

    // npc.say("Base (generic) Price: " + getAmountCoin(stackValue));

    // 8640000 ticks = 1 minecraft year
    // price increase by 10g per IRL day
    stackValue += (booze_delivery_item["extra_data"]["Age"] / 8640000) * 4000;

    stackValue = Math.max(stackValue);

    // npc.say("Price after aging bonus: " + getAmountCoin(stackValue));

    stackValue *= getDomainMultiplier(booze_delivery_item["extra_data"]["Domain"]);

    stackValue *= quantity;

    stackValue = Math.max(stackValue);

    // npc.say("Ageable Booze Stack Value: " + getAmountCoin(stackValue));

    return stackValue;
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
    npc.say("&aYou received your payment! Total: &r" + getAmountCoin(totalCents));
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
        var type = "generic";

        var key = item_id + ":" + item_damage;

        // Check if the item is part of the stock exchange instance
        if (stock_exchange_instance[key]) {
            // Multiply item count by stack size (to account for multiple crates)
            var totalCount = item_count * stackSize;

            //npc.say("Item data: " + items[i].toJsonString());

            // If Item has a "type" key
            if (stock_exchange_instance[key]["type"]) {
                if (stock_exchange_instance[key]["type"] == "ageable_booze") {

                    // npc.say("Old key: " + key);

                    var item_info = readAgeableBooze(items[i]);

                    // npc.say("New key: " + item_info["key"]);

                    key = item_info["key"];
                    type = item_info["type"];
                    age_data = item_info["data"];
                }
            }

            // npc.say("I see " + totalCount + " of " + key + " in the crate. It's type is: " + type);

            if (type == "ageable_booze") {

                // If delivery has no "ageable_booze" key, create it
                if (!delivery["ageable_booze"]) {
                    delivery["ageable_booze"] = {};
                    // npc.say("Created ageable_booze key");
                }

                if (!delivery["ageable_booze"][key]) {

                    delivery["ageable_booze"][key] = {
                        "count": totalCount,
                        "extra_data": age_data
                    };
                } else {
                    delivery["ageable_booze"][key]["count"] += totalCount;
                }
            } else {
                // If delivery has no "generic" key, create it
                if (!delivery["generic"]) {
                    delivery["generic"] = {};
                }

                if (!delivery["generic"][key]) {
                    delivery["generic"][key] = {
                        "count": totalCount
                    };
                } else {
                    delivery["generic"][key]["count"] += totalCount;
                }
            }
        }
    }

    // npc.say("Delivery: " + JSON.stringify(delivery));

    return delivery;
}

// Function to calculate price changes based on supply and time since last sale
function updateStockPrices(region, delivery, player) {
    var currentTime = world.getTotalTime();

    for (var types in delivery) {

        if (types == "generic") {

            for (var item in delivery[types]) {

                if (!stock_exchange_instance[item]) {
                    npc.say("The item " + item + " is not part of the stock exchange.");
                    continue;
                }

                var quantityDelivered = delivery[types][item]["count"];

                stock_exchange_instance[item].quantity_sold += quantityDelivered;
                stock_exchange_instance[item].last_sold_time = currentTime;

                /*
                    Calculate the price multiplier based on the quantity delivered.
                    for each quantity_factor units sold, the price will decrease by 5%.
                    If less than quantity_factor units are sold, the price will not decrease.
                    So we divide the quantity delivered by the quantity factor to get the number of times the price should decrease by 5%.
                    We then multiply the output by 5% to get the total price decrease.

                    We then subtract this value from 1 to get the multiplier.

                    If the stock has a stock_flexibility value, we multiply the multiplier by this value.

                    We then multiply the current price by this multiplier to get the new price.
                */
                var valueMultiplier = 1
                
                if (quantityDelivered >= stock_exchange_instance[item].quantity_factor) {
                    valueMultiplier = valueMultiplier - (_PRICE_EVOLUTION_FACTOR * (quantityDelivered / stock_exchange_instance[item].quantity_factor));
                }

                if (stock_exchange_generals[region] && stock_exchange_generals[region]["stock_flexibility"]) {
                    valueMultiplier *= stock_exchange_generals[region]["stock_flexibility"];
                }

                stock_exchange_instance[item].current_price *= valueMultiplier;

                // Round the price to the nearest integer
                stock_exchange_instance[item].current_price = Math.floor(
                    stock_exchange_instance[item].current_price
                );

                stock_exchange_instance[item].current_price = Math.max(
                    stock_exchange_instance[item].min_price,
                    Math.min(
                        stock_exchange_instance[item].current_price,
                        stock_exchange_instance[item].max_price
                    )
                );

            }
        } else if (types == "ageable_booze") {

            // Load Domain Data
            var allenis_data = load_json("world/customnpcs/scripts/allenis_north_region.json");

            for (var item in delivery[types]) {

                var quantityDelivered = delivery[types][item]["count"];

                var generic_id = item.split(":").slice(0, 3).join(":");
                var domain = delivery[types][item]["extra_data"]["Domain"];

                // If the id is not in the Domain variety, add it
                for (var it_domain in allenis_data.domains) {
                    var domain_data = allenis_data.domains[it_domain];
                    if (domain_data["display_name"] == domain) {
                        if (domain_data["bottle_variety"].indexOf(generic_id) == -1) {
                            domain_data["bottle_variety"].push(generic_id);
                        }
                    }
                }


                // npc.say("Item: " + item + ", Quantity: " + quantityDelivered);

                if (!stock_exchange_instance[generic_id]) {
                    npc.say("The item " + item + " is not part of the stock exchange.");
                    continue;
                }

                stock_exchange_instance[generic_id].quantity_sold += quantityDelivered;

                // npc.say("Quantity Sold: " + stock_exchange_instance[generic_id].quantity_sold);

                for (var i = 0; i < quantityDelivered; i += stock_exchange_instance[generic_id].quantity_factor) {
                    var newPrice = stock_exchange_instance[generic_id].current_price * ((1 - _PRICE_EVOLUTION_FACTOR) * stock_exchange_generals[region]["stock_flexibility"]);

                    stock_exchange_instance[generic_id].current_price = Math.floor(
                        Math.max(
                            newPrice,
                            stock_exchange_instance[generic_id].min_price
                        )
                    );
                    stock_exchange_instance[generic_id].last_sold_time = currentTime;
                }

            }


            save_json(allenis_data, "world/customnpcs/scripts/allenis_north_region.json");
        }
    }
    save_data(stock_exchange_instance);
}


// Function to clear only sold items from the crate's contents
function clear_crate(item, delivery) {
    var inventory = item.getNbt().getCompound("inventory").getList("Items", 10);

    for (var i = 0; i < inventory.length; i++) {
        var item_id = inventory[i].getString("id");
        var item_damage = inventory[i].getShort("Damage");
        var key = item_id + ":" + item_damage;

        if (delivery["generic"]) {
            if (delivery["generic"][key]) {
                var item_count = inventory[i].getByte("Count");
                var sold_quantity = delivery["generic"][key]["count"];

                // If the crate has exactly the sold quantity, clear it; otherwise reduce the count
                if (item_count <= sold_quantity) {
                    inventory[i].setByte("Count", 0); // Remove the item completely
                } else {
                    inventory[i].setByte("Count", item_count - sold_quantity); // Reduce the item count
                }
            }
        }
        if (delivery["ageable_booze"]) {
            for (var special_key in delivery["ageable_booze"]) {
                if (special_key.contains(key)) {
                    var new_key = special_key;
                    // npc.say("Key: " + new_key);
                    if (delivery["ageable_booze"][new_key]) {
                        // npc.say("Key: " + new_key);
                        var item_count = inventory[i].getByte("Count");
                        var sold_quantity = delivery["ageable_booze"][new_key]["count"];

                        // If the crate has exactly the sold quantity, clear it; otherwise reduce the count
                        if (item_count <= sold_quantity) {
                            inventory[i].setByte("Count", 0); // Remove the item completely
                        } else {
                            inventory[i].setByte("Count", item_count - sold_quantity); // Reduce the item count
                        }
                    }
                }
            }
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
    if (typeof (vals) == 'string') { vals = [vals]; }
    var a = [];
    arr.forEach(function (el) { a.push(el); });//Copy array
    for (var v in vals) {
        var i = arr.indexOf(vals[v]);
        if (i > -1) {
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

//function to read an "ageable_booze"
function readAgeableBooze(item_data) {

    // npc.say("Reading Ageable Booze: " + item_data.toJsonString());

    var item_id = item_data.getString("id");
    var item_damage = item_data.getShort("Damage");
    var item_tag = item_data.getCompound("tag");

    // npc.say("Item Id: " + item_id + ", Damage: " + item_damage + ", Tag: " + item_tag.toJsonString());

    // If the tag is null, return an empty object
    if (!item_tag) {
        return {};
    }

    var data = {};

    var age_data = item_tag.getCompound("display").getList("Lore", 8);

    // npc.say("Ageable Booze Lore: " + age_data);


    if (age_data.length == 0) {
        //npc.say("No age data found!");
        return { "key": item_id + ":" + item_damage, "type": "generic" };
    }

    for (var it_key in age_data) {
        if (age_data[it_key].contains("Age (in ticks):")) {
            var age = age_data[it_key].replace("Age (in ticks): ", "");
            data["Age"] = age;
            //npc.say("Age: " + age);
        } else if (age_data[it_key].contains("Domain:")) {
            var domain = age_data[it_key].replace("Domain: ", "");
            data["Domain"] = domain;
            //npc.say("Domain: " + domain);
        }
    }

    // npc.say("Data: " + JSON.stringify(data));

    var key = item_id + ":" + item_damage + ":" + data["Domain"] + ":" + data["Age"];

    // npc.say("Key: " + key);

    var return_data = {
        "key": key,
        "type": "ageable_booze",
        "data": data
    }

    return return_data;
}

// Function to get domain multiplier
function getDomainMultiplier(domain_name) {
    var multiplier = 1;

    var allenis_data = load_json("world/customnpcs/scripts/allenis_north_region.json");

    // npc.say("Region data: " + JSON.stringify(allenis_data));

    for (var it_domain in allenis_data.domains) {

        var domain = allenis_data.domains[it_domain];

        if (domain["display_name"] == domain_name) {
            multiplier = domain["reputation"];

            // update last_sale_date
            domain["last_sale_date"] = world.getTotalTime();

            // npc.say("Domains last sale date: " + domain["last_sale_date"]);

            break;
        }

        allenis_data.domains[it_domain] = domain;
    }

    save_json(allenis_data, "world/customnpcs/scripts/allenis_north_region.json");

    // npc.say("Domain Multiplier: " + multiplier);

    return multiplier;
}

// function to load domain data
function load_json(data_file_path) {
    // Check if the file exists, and create it if it doesn't
    if (!check_file_exists(data_file_path)) {
        npc.say("ERROR: Domain Data is inexistant!");
        return null;
    } else {
        var ips = new java.io.FileInputStream(data_file_path);
        var fileReader = new java.io.InputStreamReader(ips, "UTF-8");
        var readFile = fileReader.read();
        var data;
        var start = "";
        while (readFile != -1) {
            data = String.fromCharCode(readFile);
            start = start + data;
            readFile = fileReader.read();
        }

        var json_data = JSON.parse(start);

        // npc.say("Loaded data: " + JSON.stringify(json_data));

        return json_data;
    }
}

// Function to save domain data
function save_json(data, data_file_path) {
    var fileWriter = new java.io.FileWriter(data_file_path);
    fileWriter.write(JSON.stringify(data, null, 4)); // Pretty-print JSON with 4 spaces
    fileWriter.close();
}

// function to check if a file exists
function check_file_exists(file_path) {
    var file = new java.io.File(file_path);
    return file.exists();
}