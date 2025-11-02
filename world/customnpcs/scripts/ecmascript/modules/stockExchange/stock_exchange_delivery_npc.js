// Load utility modules
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_emotes.js')

// Define JSON paths as constants
var STOCK_FILE_PATH = "world/customnpcs/scripts/stock_exchange.json";
var DOMAIN_FILE_PATH = "world/customnpcs/scripts/ecmascript/modules/winemaking/domains.json";
var SPY_DATA_FILE_PATH = "world/customnpcs/scripts/json_spy/stock_spying.json";
var SPY_LOG_FILE_PATH = "world/customnpcs/scripts/json_spy/stock_spying.log";

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
    "mts:ivv.chest",
    "mts:iav.iav_storage_l_crate_2",
    "mts:iav.iav_storage_l_crate_3",
    "mts:iav.iav_storage_l_crate_5",
    "mts:iav.iav_storage_l_crate_6",
    "mts:iv_tpp.trin_stacked_boxes_ornate_gold",
    "mts:iv_tpp.trin_stacked_boxes_sculpted_light",
    "mts:iv_tpp.trin_stacked_boxes_ornate_marble",
    "mts:iv_tpp.trin_stacked_boxes_cardboard_2",
    "mts:iv_tpp.trin_stacked_boxes_cardboard"
];
var barrels_ids = [
    "mts:unuparts.unuparts_part_unu_barrel_wooden",
    "mts:unuparts.unuparts_part_unu_barrel_metal_yellow",
    "mts:unuparts.unuparts_part_unu_barrel_metal_blue",
    "mts:unuparts.unuparts_part_unu_barrel_metal_red",
    "mts:unuparts.unuparts_part_unu_barrel_metal_grey"
];


var _REGIONS = []; // List of available regions
var NPC_REGION = "Gramados Farming"; // Default NPC region
var region_specifics = {}; // Region-specific settings
var stock_exchange_instance; // Stock exchange data for the current region
var stock_exchange_generals; // General stock exchange data
var _PRICE_EVOLUTION_FACTOR = 0.001; // Price evolution factor (0.1% increase or decrease)

var npc;
var world;

/**
 * Retrieves the list of available regions from the stock exchange JSON file.
 */
function listRegions() {
    var data = load_data();
    _REGIONS = Object.keys(data).filter(function (key) {
        return key !== "Region Generals";
    });
}

/**
 * Initializes the NPC when it is spawned or loaded.
 * @param {Object} event - The event object containing the NPC instance.
 */
function init(event) {
    npc = event.npc;
    world = npc.getWorld();

    var stored_data = npc.getStoreddata();

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

/**
 * Switches the NPC's region and updates region-specific settings.
 */
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

/**
 * Handles player interaction with the NPC.
 * @param {Object} event - The event object containing the player instance.
 */
function interact(event) {
    var player = event.player;

    if (player.getMainhandItem().getName() == "minecraft:command_block") {
        var commandBlockName = player.getMainhandItem().getDisplayName();

        if (_REGIONS.indexOf(commandBlockName) > -1) {
            NPC_REGION = commandBlockName;
            switch_region();
            npc.getStoreddata().put("region", NPC_REGION);
            npc.say("Region set to: " + NPC_REGION);
        } else {
            npc.say("Invalid region name. Valid regions: " + _REGIONS.join(", "));
        }
    } else {

        if (!player.hasReadDialog(region_specifics.jobId)) {
            npc.say(region_specifics.helloPhrase);
            return;
        }

        var item = player.getMainhandItem();
        var stackSize = item.getStackSize();

        stock_exchange_instance = load_data()[NPC_REGION];
        stock_exchange_generals = load_data()["Region Generals"];

        // Check if the player is holding one of the valid crates
        for (var i = 0; i < crates_ids.length; i++) {
            if (item.getName() == crates_ids[i]) {
                npc.say("Let me see what you have in that crate...");

                // Read the contents of the crate
                var delivery = read_crate_delivery(item, stackSize); // Pass stack size to read_delivery

                // If the crate is empty or contains items not in the exchange
                if (Object.keys(delivery).length === 0) {
                    npc.say("This crate doesn't have items I can accept.");
                    return;
                } else if (NPC_REGION.toLowerCase().indexOf('lumber') > -1) {
                    grantBadgeAndEmotes(player, "Lumberjack", ["mossy_log", "log", "log2", "wood", "wooden_axe", "stone_axe"]);
                }

                // Calculate total earnings before updating stock prices
                var totalEarnings = calculateEarnings(delivery, NPC_REGION);

                // Spy data to log the delivery
                var spy_data = {}
                spy_data["date"] = new Date().toLocaleString();
                spy_data["delivery"] = delivery;
                spy_data["totalEarnings"] = totalEarnings;
                add_spy_data(spy_data, player);

                // Update the stock exchange data with the crate's contents
                updateStockPrices(NPC_REGION, delivery, player);

                // Clear only the sold items from the crate after processing
                clear_crate(item, delivery);

                // Generate money items for the player
                generateMoneyForPlayer(player.getWorld(), totalEarnings, player);

                return; // End interaction
            }
        }

        // Check if the player is holding one of the valid barrels
        for (var i = 0; i < barrels_ids.length; i++) {
            if (item.getName() == barrels_ids[i]) {
                npc.say("Let me see what you have in that barrel...");

                var delivery = read_barrel_delivery(item);

                // If the barrel is empty or contains items not in the exchange
                if (Object.keys(delivery).length === 0) {
                    npc.say("This barrel doesn't have any fluids I can accept.");
                    return;
                }

                // Calculate total earnings before updating stock prices
                var totalEarnings = calculateEarnings(delivery, NPC_REGION);

                // Spy data to log the delivery
                var spy_data = {}
                spy_data["date"] = new Date().toLocaleString();
                spy_data["delivery"] = delivery;
                spy_data["totalEarnings"] = totalEarnings;
                add_spy_data(spy_data, player);

                // Update the stock exchange data with the barrel's contents
                updateStockPrices(NPC_REGION, delivery, player);

                // Clear only the sold content from the barrel after processing
                clear_barrel(item, delivery);

                // Generate money items for the player
                generateMoneyForPlayer(player.getWorld(), totalEarnings, player);

                return;
            }
        }

        // If the player isn't holding a valid crate
        npc.say("Hello there! I only accept deliveries in crates or barrels. Please hold a crate or barrel in your hand.");
    }
}

/**
 * Calculates the total earnings from a delivery based on the region and item types.
 * @param {Object} delivery - The delivery data containing item counts and types.
 * @param {string} region - The region name.
 * @returns {number} The total earnings in the region's currency.
 */
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

    // If there are fluids in the delivery
    if (delivery["fluid"]) {
        for (var fluid in delivery["fluid"]) {
            totalEarnings += delivery["fluid"][fluid]["count"] * stock_exchange_instance[fluid]["current_price"];
            if (stock_exchange_generals[region] && stock_exchange_generals[region]["variety_bonus"]) {
                earningsMultiplier += stock_exchange_generals[region]["variety_bonus"];
            }
        }
    }

    // npc.say("Total Earnings: " + getAmountCoin(totalEarnings) + ", Earnings Multiplier: " + earningsMultiplier + ", Total Earnings after Multiplier: " + getAmountCoin(totalEarnings * earningsMultiplier));

    return totalEarnings * earningsMultiplier;
}

/**
 * Calculates earnings for generic items in a delivery.
 * @param {Object} generic_delivery_item - The delivery item data.
 * @param {string} item_key - The item key in the stock exchange data.
 * @returns {number} The earnings for the generic item.
 */
function calculateGenericEarnings(generic_delivery_item, item_key) {
    var totalEarnings = 0;
    var quantity = generic_delivery_item["count"];
    var price = stock_exchange_instance[item_key]["current_price"];

    // npc.say("Generic Item: " + JSON.stringify(generic_delivery_item) + ", Quantity: " + quantity + ", Price: " + price);

    totalEarnings += quantity * price;

    return totalEarnings;
}

/**
 * Calculates earnings for ageable booze items in a delivery.
 * @param {Object} booze_delivery_item - The delivery item data.
 * @param {string} item_key - The item key in the stock exchange data.
 * @returns {number} The earnings for the ageable booze item.
 */
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

/**
 * Reads the contents of a crate and returns the delivery data.
 * @param {IItemStack} item - The crate item.
 * @param {number} stackSize - The stack size of the crate.
 * @returns {Object} The delivery data.
 */
function read_crate_delivery(item, stackSize) {
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

/**
 * Reads the contents of a barrel and returns the delivery data.
 * @param {IItemStack} item - The barrel item.
 * @returns {Object} The delivery data.
 */
function read_barrel_delivery(item) {

    // Read the fluid type from the barrel's inventory
    var tankdata = item.getNbt().getCompound("tank");
    var quantity = tankdata.getDouble("fluidLevel") / 1000;
    var fluid = tankdata.getString("currentFluid");

    // Get the number of items (stacked barrels)
    var stackSize = item.getStackSize();
    // npc.say("Stack Size: " + stackSize);

    // add liquid: to the fluid name
    fluid = "liquid:" + fluid;

    if (quantity == 0) {
        // npc.say("The barrel is empty.");
        return {};
    }

    // npc.say("The " + stackSize + " barrel(s) contain " + quantity + " buckets of " + fluid + " (each).");

    var delivery = {};

    // Check if the fluid is part of the stock exchange instance
    if (stock_exchange_instance[fluid]) {
        delivery["fluid"] = {};
        delivery["fluid"][fluid] = {
            "count": quantity * stackSize
        };
    }

    npc.say("You have successfully sold " + quantity * stackSize + " buckets of " + stock_exchange_instance[fluid]["display_name"] + "!");

    return delivery;
}

/**
 * Updates stock prices based on the delivery data and region.
 * @param {string} region - The region name.
 * @param {Object} delivery - The delivery data.
 * @param {IPlayer} player - The player instance.
 */
function updateStockPrices(region, delivery, player) {
    var currentTime = world.getTotalTime();

    // npc.say("Updating stock prices: delivery: " + JSON.stringify(delivery));

    for (var types in delivery) {

        if (types == "generic" || types == "fluid") {

            for (var item in delivery[types]) {

                if (!stock_exchange_instance[item]) {
                    npc.say("The item " + item + " is not part of the stock exchange.");
                    continue;
                }

                stock_exchange_instance[item].quantity_sold += delivery[types][item]["count"];
                stock_exchange_instance[item].last_sold_time = currentTime;

                var proportion = delivery[types][item]["count"] / stock_exchange_instance[item].quantity_factor;
                var _PRICE_EVOLUTION = proportion * _PRICE_EVOLUTION_FACTOR;
                var newPrice = stock_exchange_instance[item].current_price * (1 - (_PRICE_EVOLUTION * stock_exchange_generals[region]["stock_flexibility"]));

                newPrice = Math.round(newPrice);

                if (newPrice < stock_exchange_instance[item].min_price) {
                    stock_exchange_instance[item].current_price = stock_exchange_instance[item].min_price;
                } else if (newPrice > stock_exchange_instance[item].max_price) {
                    stock_exchange_instance[item].current_price = stock_exchange_instance[item].max_price;
                } else {
                    stock_exchange_instance[item].current_price = newPrice;
                }

            }
        } else if (types == "ageable_booze") {

            // Load Domain Data
            var allenis_data = loadJson(DOMAIN_FILE_PATH);

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

                    stock_exchange_instance[generic_id].current_price = Math.round(
                        Math.max(
                            newPrice,
                            stock_exchange_instance[generic_id].min_price
                        )
                    );
                    stock_exchange_instance[generic_id].last_sold_time = currentTime;
                }

            }


            saveJson(allenis_data, DOMAIN_FILE_PATH);
        } else {
            npc.say("Invalid delivery type: " + types);
        }
    }
    save_data(stock_exchange_instance);
}

/**
 * Clears sold items from a crate after processing the delivery.
 * @param {IItemStack} item - The crate item.
 * @param {Object} delivery - The delivery data.
 */
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

/**
 * Clears sold fluids from a barrel after processing the delivery.
 * @param {IItemStack} item - The barrel item.
 * @param {Object} delivery - The delivery data.
 */
function clear_barrel(item, delivery) {
    var fluid = item.getNbt().getCompound("tank").getString("currentFluid");
    fluid = "liquid:" + fluid;

    // npc.say("Clearing " + fluid + " from the barrel whose NBt is: " + item.getNbt().getCompound("tank").toJsonString());
    // npc.say("Delivery: " + JSON.stringify(delivery));

    // var liquid_name = item.getNbt().getCompound("tank").getString("currentFluid");
    // npc.say("You have successfully sold " + delivery["fluid"][fluid]["count"] + " buckets of " + liquid_name + "!");

    if (delivery["fluid"]) {
        if (delivery["fluid"][fluid]) {
            // npc.say("Clearing " + fluid + " from the barrel.");
            item.getNbt().getCompound("tank").setDouble("fluidLevel", 0);
            item.getNbt().getCompound("tank").setString("currentFluid", "");
        }
    }
}

/**
 * Loads stock exchange data from the JSON file.
 * @returns {Object} The stock exchange data.
 */
function load_data() {
    // Check if the file exists, if not, create it
    if (!checkFileExists(STOCK_FILE_PATH)) {
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

/**
 * Checks if a file exists at the specified path.
 * @param {string} file_path - The file path.
 * @returns {boolean} True if the file exists, false otherwise.
 */
function checkFileExists(file_path) {
    var file = new java.io.File(file_path);
    return file.exists();
}

/**
 * Creates an empty JSON file at the specified path.
 * @param {string} file_path - The file path.
 */
function create_json_file(file_path) {
    var fileWriter = new java.io.FileWriter(file_path);
    fileWriter.write("{}"); // Create an empty JSON object
    fileWriter.close();
}

/**
 * Saves stock exchange data to the JSON file.
 * @param {Object} data - The stock exchange data to save.
 */
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

/**
 * Reads ageable booze item data from the item's NBT.
 * @param {Object} item_data - The item data.
 * @returns {Object} The parsed ageable booze data.
 */
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

/**
 * Retrieves the domain multiplier for a specific domain.
 * @param {string} domain_name - The domain name.
 * @returns {number} The domain multiplier.
 */
function getDomainMultiplier(domain_name) {
    var multiplier = 1;

    var allenis_data = loadJson(DOMAIN_FILE_PATH);

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

    saveJson(allenis_data, DOMAIN_FILE_PATH);

    // npc.say("Domain Multiplier: " + multiplier);

    return multiplier;
}

/**
 * Adds delivery data to the spy log and JSON file.
 * @param {Object} data - The delivery data.
 * @param {IPlayer} player - The player instance.
 */
function add_spy_data(data, player) {
    var playerName = player.getName();
    var total_item_count = 0;
    var delivery_keys = getJsonKeys(data.delivery["generic"]);
    for (var item in delivery_keys) {
        total_item_count += data.delivery["generic"][delivery_keys[item]]["count"];
    }
    var logEntry = {
        date: new Date().toLocaleString(),
        region: NPC_REGION,
        delivery: data.delivery,
        totalEarnings: data.totalEarnings
    };
    var logline = playerName + " sold " + total_item_count + " items of " + delivery_keys.length + " different types to " + NPC_REGION + " for " + getAmountCoin(data.totalEarnings);

    logToJson("economy", playerName, logEntry);
    logToFile("economy", logline);
}

function generateMoneyForPlayer(world, totalCents, player) {
    // Generate the money items based on total cents
    var moneyItems = generateMoney(world, totalCents);

    // Drop the generated money items at the player's location
    for (var i = 0; i < moneyItems.length; i++) {
        player.dropItem(moneyItems[i]);
    }

    // Inform the player about the money generated
    tellPlayer(player, "&aYou received your payment! Total: &r:money:&e" + getAmountCoin(totalCents));
}