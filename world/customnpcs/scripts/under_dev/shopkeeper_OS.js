var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

var SERVER_SHOPS_JSON_PATH = "world/customnpcs/scripts/under_dev/server_shops.json";
var SHOP_CATEGORIES_JSON_PATH = "world/customnpcs/scripts/under_dev/shop_categories.json";
var REGIONAL_DEMAND_JSON_PATH = "world/customnpcs/scripts/under_dev/regional_demand.json";

var PERMISSION_OPEN_CLOSE_SHOP = "open_close_shop";
var PERMISSION_SET_PRICES = "set_prices";
var PERMISSION_MANAGE_PERMISSIONS = "manage_permissions";
var PERMISSION_TAKE_MONEY = "take_money";
var PERMISSION_MANAGE_STOCK = "manage_stock";

var world = API.getIWorld(0);

function init(event) {
    world.broadcast("(Under dev) Shopkeeper OS initialized!");
}

function chat(event) {
    var player = event.player;
    var message = event.message;
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);

    if (!playerShops) {
        player.message("No shops found!");
        return;
    }

    /*
    List of shop commands (for dev purposes):

    $shop open <ID> - Open the shop
    $shop close <ID> - Close the shop
    $shop create <type> - Create a new shop
    $shop set <property> <value> - Set a shop property
    $shop help - Show available commands
    $shop help properties - Show available properties
    $shop info - Show shop info
    $shop add stock <price> - Add hand held itemstack to shop stock with price per item
    $shop remove stock <item> - Remove item from shop stock (using item name)
    $shop list stock - List all items in shop stock
    $shop list available items - List all items in player inventory that can be sold in the shop
    $shop list - list all teh shops the player has
    $shop property remove <ID> [stock_room=<index_or_name>] [main_room=<index_or_name>]
    */

    if (message.startsWith("$shop create")) {
        var args = message.split(" ");
        var name = null;
        var type = null;
        var region = null;
        var sub_region = null;
        var money = 0;

        if (args.length > 2) {
            for (var i = 2; i < args.length; i++) {
                var value = getProperty(args[i]);
                switch (value.propertyName) {
                    case "name":
                        name = value.value;
                        break;
                    case "type":
                        type = value.value;
                        break;
                    case "region":
                        region = value.value;
                        break;
                    case "sub_region":
                        sub_region = value.value;
                        break;
                    case "money":
                        money = parseInt(value.value) || 0;
                        break;
                }
            }
        }

        createShop(player, type, region, sub_region, convertUnderscore(name), money);
    } else if (message.startsWith("$shop delete")) {    
        var args = message.split(" ");
        if (args.length === 3) {
            var shopId = parseInt(args[2]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                player.message("Invalid shop ID: " + args[2]);
                return;
            }
            deleteShop(player, shopId);
        } else {
            player.message("Invalid command! Usage: $shop delete <ID>");
        }
    } else if (message.startsWith("$shop property set")) {
        var args = message.split(" ");
        if (args.length < 4) {
            player.message("Invalid command! Usage: $shop property set <ID> [name=<name>] [type=<type>] [region=<region>] [sub_region=<sub_region>] [money=<money>]");
            return;
        }

        var shopId = parseInt(args[3]);
        if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
            player.message("Invalid shop ID: " + args[3]);
            player.message("Use \"_\" for spaces in the values");
            return;
        }

        var shop = playerShops[shopId];

        var name = shop.shop.display_name || null;
        var type = shop.shop.type || null;
        var region = shop.property.region || null;
        var sub_region = shop.property.sub_region || null;
        var money = shop.inventory.stored_cash || 0;

        if (args.length > 4) {
            for (var i = 4; i < args.length; i++) {
                var value = getProperty(args[i]);
                switch (value.propertyName) {
                    case "name":
                        name = value.value;
                        break;
                    case "type":
                        type = value.value;
                        break;
                    case "region":
                        if (!checkRegionExists(value.value)) {
                            player.message("Invalid region: " + value.value);
                            return;
                        }
                        region = value.value;
                        break;
                    case "sub_region":
                        if (!checkSubRegionExists(region, value.value)) {
                            player.message("Invalid sub-region: " + value.value);
                            return;
                        }
                        sub_region = value.value;
                        break;
                    case "money":
                        money = parseInt(value.value) || 0;
                        break;
                    default:
                        player.message("Unknown property: " + value.propertyName);
                        return;
                }
            }
        } else {
            player.message("Invalid command! Usage: $shop property set <ID> [name=<name>] [type=<type>] [region=<region>] [sub_region=<sub_region>] [money=<money>]");
            player.message("Use \"_\" for spaces in the values");
        }

        shop.shop.display_name = convertUnderscore(name);
        shop.shop.type = type;
        shop.property.region = region;
        shop.property.sub_region = sub_region;
        shop.inventory.stored_cash = money;

        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        player.message("Shop properties updated!");
    } else if (message.startsWith("$shop property add")) {
        var args = message.split(" ");
        if (args.length < 4) {
            player.message("Invalid command! Usage: $shop property add <ID> [stock_room=<region>] [main_room=<region>]");
            return;
        }

        var shopId = parseInt(args[3]);
        if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
            player.message("Invalid shop ID: " + args[3]);
            return;
        }

        var shop = playerShops[shopId];
        if (args.length > 4) {
            for (var i = 4; i < args.length; i++) {
                var value = getProperty(args[i]);
                switch (value.propertyName) {
                    case "stock_room":
                        shop.property.stock_room.push(value.value);
                        break;
                    case "main_room":
                        shop.property.main_room.push(value.value);
                        break;
                }
            }
        }

        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        player.message("Shop properties updated!");
    } else if (message.startsWith("$shop property remove")) {
        var args = message.split(" ");
        if (args.length < 4) {
            player.message("Invalid command! Usage: $shop property remove <ID> [stock_room=<index_or_name>] [main_room=<index_or_name>]");
            return;
        }

        var shopId = parseInt(args[3]);
        if (isNaN(shopId)) {
            player.message("Invalid command! Usage: $shop property remove <ID> [stock_room=<index_or_name>] [main_room=<index_or_name>]");
            return;
        }

        var shop = playerShops[shopId];
        if (args.length > 4) {
            for (var i = 4; i < args.length; i++) {
                var value = getProperty(args[i]);
                switch (value.propertyName) {
                    case "stock_room":
                        if (!removeRoom(shop.property.stock_room, value.value)) {
                            player.message("Region " + value.value + " not found in stock_room!");
                            player.message("Available regions: " + shop.property.stock_room.join(", "));
                        }
                        break;
                    case "main_room":
                        if (!removeRoom(shop.property.main_room, value.value)) {
                            player.message("Region " + value.value + " not found in main_room!");
                            player.message("Available regions: " + shop.property.main_room.join(", "));
                        }
                        break;
                }
            }
        }

        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        player.message("Shop properties updated!");
    } else if (message.startsWith("$shop open")) {
        var args = message.split(" ");
        if (args.length === 3) {
            var shopId = parseInt(args[2]);
            openShop(player, shopId);
        } else {
            player.message("Invalid command! Usage: $shop open <ID>");
        }
    } else if (message.startsWith("$shop close")) {
        var args = message.split(" ");
        if (args.length === 3) {
            var shopId = parseInt(args[2]);
            closeShop(player, shopId);
        } else {
            player.message("Invalid command! Usage: $shop close <ID>");
        }
    } else if (message === "$shop help") {
        player.message("Available commands:");
        player.message("$shop open - Open the shop");
        player.message("$shop close - Close the shop");
        player.message("$shop create - Create a new shop");
        player.message("$shop set <property> <value> - Set a shop property");
        player.message("$shop info - Show shop info");
        player.message("$shop help properties - Show available properties");
        player.message("$shop add stock <price> - Add hand held itemstack to shop stock with price per item");
        player.message("$shop remove stock <item> - Remove item from shop stock (using item name)");
        player.message("$shop list stock - List all items in shop stock");
        player.message("$shop list items - List all items in player inventory");
        player.message("$shop list available items - List all items in player inventory that can be sold in the shop");
    } else if (message === "$shop help properties") {
        player.message("Available properties:");
        player.message("type - The type of the shop");
        player.message("region - The region of the shop");
    } else if (message.startsWith("$shop info")) {
        var args = message.split(" ");
        if (args.length === 3) {
            var shopId = parseInt(args[2]);
            if (isOwner(player, shopId)) {
                shopInfo(player, shopId);
            } else {
                player.message("You can only get info from shops you own!");
            }
        } else {
            player.message("Invalid command! Usage: $shop info <ID>");
        }
    } else if (message.startsWith("$shop add stock")) {
        var args = message.split(" ");
        if (args.length === 4) {
            var price = parseInt(args[3]);
            addStock(player, price);
        }

        addStock(player, price);
    } else if (message.startsWith("$shop remove stock")) {
        var args = message.split(" ");
        if (args.length === 4) {
            var item = args[3];
            removeStock(player, item);
        }
    } else if (message === "$shop list stock") {
        listStock(player);
    } else if (message === "$shop list items") {
        listItems(player);
    } else if (message === "$shop list available items") {
        listAvailableItems(player);
    } else if (message === "$shop list") {
        listShops(player);
    } else if (message.startsWith("$shop")) {
        player.message("Invalid command! Type $shop help for available commands.");
    }
}

// ############################################################################################################
// SHOP COMMANDS
// ############################################################################################################

// ------------------------------------------------------------------------------------------------------------
// Open the shop
// ------------------------------------------------------------------------------------------------------------
function openShop(player, shopId) {

    var serverShops = loadJson(SERVER_SHOPS_JSON_PATH);

    // Check integrity
    if (
        ensureShopExists(player, shopId, serverShops) &&
        ensureShopDataComplete(player, shopId, serverShops, true).valid
    ) {
        var shopData = serverShops[shopId];

        // check permissions
        if (checkPermissions(player, shopId, serverShops, PERMISSION_OPEN_CLOSE_SHOP)) {
            shopData.shop.is_open = true;
            saveJson(serverShops, SERVER_SHOPS_JSON_PATH);
            player.message("Shop opened!");
            return true;
        } else {
            player.message("You don't have permission to open this shop!");
            return false;
        }
    } else {
        player.message("Shop cannot be opened!");
        return false;
    }
}

// ------------------------------------------------------------------------------------------------------------
// Close the shop
// ------------------------------------------------------------------------------------------------------------
function closeShop(player, shopId) {
    var serverShops = loadJson(SERVER_SHOPS_JSON_PATH);

    // Check integrity
    if (
        ensureShopExists(player, shopId, serverShops) &&
        ensureShopDataComplete(player, shopId, serverShops, true).valid
    ) {
        var shopData = serverShops[shopId];

        // check permissions
        if (checkPermissions(player, shopId, serverShops, PERMISSION_OPEN_CLOSE_SHOP)) {
            shopData.shop.is_open = false;
            saveJson(serverShops, SERVER_SHOPS_JSON_PATH);
            player.message("Shop closed!");
            return true;
        } else {
            player.message("You don't have permission to close this shop!");
            return false;
        }
    } else {
        player.message("Shop cannot be closed!");
        return false;
    }
}

// ------------------------------------------------------------------------------------------------------------
// Create a shop
// ------------------------------------------------------------------------------------------------------------
// Create a new shop instance with first available ID
function createShop(player, type, region, sub_region, display_name, money) {
    var serverShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!serverShops) {
        player.message("No shop data found! Contact an admin!");
        return;
    }

    var shopId = 1;
    while (serverShops[shopId]) {
        world.broadcast("Shop ID " + shopId + " already exists!");
        shopId++;
        world.broadcast("Trying ID " + shopId + "...");
    }

    world.broadcast("Creating shop with ID " + shopId + "...");

    serverShops[shopId] = {
        roles: {
            enabled: false,
            owner: player.getName(),
            managers: [],
            cashiers: [],
            stock_keepers: [],
            assistants: []
        },
        inventory: {
            stock: {},
            listed_items: [],
            stored_cash: money || 0
        },
        property: {
            location: {
                x: Math.floor(player.getX()),
                y: Math.floor(player.getY()),
                z: Math.floor(player.getZ())
            },
            stock_room: [
            ],
            main_room: [
            ],
            region: region,
            sub_region: sub_region
        },
        shop: {
            display_name: display_name,
            type: type,
            is_open: false,
            is_for_sale: false
        },
        reputation_data: {
            reputation: 0,
            reputation_history: []
        }
    };

    saveJson(serverShops, SERVER_SHOPS_JSON_PATH);
    // player.message("Shop created with ID: " + shopId);
}

// ------------------------------------------------------------------------------------------------------------
// Delete a shop
// ------------------------------------------------------------------------------------------------------------
function deleteShop(player, shopId) {
    var serverShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!serverShops) {
        player.message("No shop data found! Contact an admin!");
        return;
    }

    delete serverShops[shopId];
    saveJson(serverShops, SERVER_SHOPS_JSON_PATH);
    player.message("Shop deleted!");
}

// ------------------------------------------------------------------------------------------------------------
// Set a shop property
// ------------------------------------------------------------------------------------------------------------
// function that will set multiple properties from a list of arguments
function setShopProperties(player, shopId, args) {
    // navigate through all arguments
    for (var i = 0; i < args.length; i++) {
        player.message("Setting property " + args[i]);
        setShopProperty(player, shopId, args[i]);
    }
}

function setShopProperty(player, property, value) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        player.message("No shops found!");
        return;
    }

    var shopId = getShopId(player);
    if (!shopId) {
        player.message("No shop found!");
        return;
    }

    switch (property) {
        case "type":
            setShopType(player, value);
            break;
        case "region":
            setShopRegion(player, value);
            break;
        case "sub_region":
            setShopSubRegion(player, value);
            break;
        case "display_name":
            var shop = playerShops[shopId];
            // replace "_" with " " in the display name
            value = value.replace(/_/g, " ");
            // replace """ with "" in the display name
            value = value.replace(/""/g, "\"");
            shop.display_name = value;
            saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
            player.message("Shop display name set!");
            break;
        default:
            player.message("Invalid property!");
    }
}
// Set the type of the shop
function setShopType(player, type) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        player.message("No shops found!");
        return;
    }

    var shopId = getShopId(player);
    if (!shopId) {
        player.message("No shop found!");
        return;
    }

    // Check if shop type is valid (if one of teh entries in shop_categories.json has the "name" tag equal to the type)
    var shopCategories = loadJson(SHOP_CATEGORIES_JSON_PATH);
    if (!shopCategories) {
        player.message("Shop categories not found!");
        return;
    }

    var validType = false;
    for (var i = 0; i < shopCategories["entries"].length; i++) {
        if (shopCategories["entries"][i].name === type) {
            validType = true;
            break;
        }
    }

    if (!validType) {
        player.message("Invalid shop type!");
        return;
    } else {
        var shop = playerShops[shopId];
        shop.type = type;
        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        player.message("Shop type set!");
    }
}
// Set the region of the shop
function setShopRegion(player, region) {
    // The "region" argument is composed of two parts: the region name and the sub-region.
    // Example: "Solterra-Countryside" or "Gramados-Gramados_City"
    // We need to check the main region and its sub region exist in teh shop demand json

    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        player.message("No shops found!");
        return;
    }

    var shopId = getShopId(player);
    if (!shopId) {
        player.message("No shop found!");
        return;
    }

    var shopDemand = loadJson(REGIONAL_DEMAND_JSON_PATH);
    shopDemand = shopDemand["Local Demands"];
    if (!shopDemand) {
        player.message("Shop demand not found!");
        return;
    }

    var regionParts = region.split("-");
    var mainRegion = regionParts[0];
    var subRegion = regionParts[1];

    if (!shopDemand[mainRegion]) {
        player.message("Invalid main region! Available main regions: " + Object.keys(shopDemand).join(", "));
        return;
    } else if (!shopDemand[mainRegion][subRegion]) {
        player.message("Invalid sub region! Available sub regions: " + Object.keys(shopDemand[mainRegion]).join(", "));
        return;
    } else {
        var shop = playerShops[shopId];
        shop.region = mainRegion;
        shop.sub_region = subRegion;
        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        player.message("Shop region set!");
    }


}

// Set the sub-region of the shop
function setShopSubRegion(player, subRegion) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        player.message("No shops found!");
        return;
    }

    var shopId = getShopId(player);
    if (!shopId) {
        player.message("No shop found!");
        return;
    }

    // check validity of sub-region
    var shopDemand = loadJson(REGIONAL_DEMAND_JSON_PATH);
    shopDemand = shopDemand["Local Demands"];
    var region = shopDemand[getShopFromID(shopId).region];
    if (!region) {
        player.message("Invalid region!");
        return;
    }

    if (!region[subRegion]) {
        player.message("Invalid sub-region! Available sub-regions: " + Object.keys(region).join(", "));
        return;
    }

    var shop = playerShops[shopId];
    shop.sub_region = subRegion;
    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    player.message("Shop sub-region set!");
}

// ------------------------------------------------------------------------------------------------------------
// Shop info
// ------------------------------------------------------------------------------------------------------------
function shopInfo(player, shopId) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        player.message("No shops found!");
        return;
    }

    var shop = playerShops[shopId];
    for (var property in shop) {
        player.message(property + ": " + shop[property]);
    }
}



// ############################################################################################################
// UTILITIES
// ############################################################################################################

// Get the shop ID of the player
function getShopId(player) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        return null;
    }

    for (var shopId in playerShops) {
        if (playerShops[shopId].owner === player.getName()) {
            return shopId;
        }
    }

    return null;
}

// function to convert price
function convertPrice(price) {
    // price is for example 6g5c for 6 grons and 5 cents. It should return 605
    var priceParts = price.split("g");
    var grons = parseInt(priceParts[0]);
    var cents = priceParts[1].split("c");
    cents = parseInt(cents[0]);
    return grons * 100 + cents;
}

// function to get shop info from ID
function getShopFromID(shopId) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        return null;
    }

    return playerShops[shopId];
}

// function to check if item is valid according to shop type
function isValidItem(shopType, item) {
    var shopCategories = loadJson(SHOP_CATEGORIES_JSON_PATH);
    if (!shopCategories) {
        return false;
    }

    for (var i = 0; i < shopCategories["entries"].length; i++) {
        if (shopCategories["entries"][i].name === shopType) {
            var items = shopCategories["entries"][i].items;
            for (var j = 0; j < items.length; j++) {
                if (items[j]["id"] === item) {
                    return true;
                }
            }
        }
    }

    return false;
}

// Function to check ownership of a shop to a player
function isOwner(player, shopId) {
    // player.message("Checking ownership of " + shopId);
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        return false;
    }

    // check if shop exists
    if (!playerShops[shopId]) {
        player.message("Shop not found!");
        listShops(player);
        return false;
    }

    if (playerShops[shopId].owner === player.getName()) {
        return true;
    }

    return false;
}

// Function to check ownership of a shop to a player
function isOwner2(player, shopId, playerShops) {
    // check if shop exists
    if (!playerShops[shopId]) {
        player.message("Shop not found!");
        listShops(player);
        return false;
    }

    if (playerShops[shopId].owner === player.getName()) {
        return true;
    }

    return false;
}

// function to check if a shop instance isn't missing any data (update proof)
function ensureShopDataComplete(player, shopID, playerShops, log) {
    var valid = true;
    var critical = false;
    var missing = [];
    var shopData = playerShops[shopID];

    // Ensure shopData exists
    if (!shopData) {
        if (log) player.message("Shop ID " + shopID + " is missing!");
        return { valid: false, critical: true, missing: ["shopData"] };
    }

    // Critical properties (delete shop if missing)
    if (!shopData.property || !shopData.property.location ||
        shopData.property.location.x == null ||
        shopData.property.location.y == null ||
        shopData.property.location.z == null) {

        missing.push("location");
        critical = true;
        valid = false;
    }

    // Non-critical but required properties (set to null if missing)
    if (!shopData.roles || !shopData.roles.owner) {
        missing.push("owner");
        valid = false;
        shopData.roles = shopData.roles || {};
        shopData.roles.owner = null;
    }
    if (!shopData.shop || !shopData.shop.type) {
        missing.push("type");
        valid = false;
        shopData.shop = shopData.shop || {};
        shopData.shop.type = null;
    }
    if (!shopData.property || !shopData.property.region) {
        missing.push("region");
        valid = false;
        shopData.property = shopData.property || {};
        shopData.property.region = null;
    }
    if (!shopData.property || !shopData.property.sub_region) {
        missing.push("sub_region");
        valid = false;
        shopData.property = shopData.property || {};
        shopData.property.sub_region = null;
    }
    if (!shopData.shop || !shopData.shop.display_name) {
        missing.push("display_name");
        valid = false;
        shopData.shop = shopData.shop || {};
        shopData.shop.display_name = null;
    }

    // Other properties (set defaults)
    shopData.roles = shopData.roles || {
        enabled: false,
        owner: null,
        managers: [],
        cashiers: [],
        stock_keepers: [],
        assistants: []
    };

    shopData.inventory = shopData.inventory || {
        stock: {},
        listed_items: [],
        stored_cash: 0
    };

    shopData.property.stock_room = shopData.property.stock_room || [];
    shopData.property.main_room = shopData.property.main_room || [];

    shopData.shop.is_open = shopData.shop.is_open || false;
    shopData.shop.is_for_sale = shopData.shop.is_for_sale || false;

    shopData.reputation_data = shopData.reputation_data || {
        reputation: 0,
        reputation_history: []
    };

    // Log errors and handle missing data
    if (!valid) {
        if (critical) {
            delete playerShops[shopID];
            saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
            if (log) {
                player.message("⚠️ Shop " + shopID + " is missing critical data and has been removed!");
                player.message("Missing: " + missing.join(", "));
            }
        } else if (log) {
            player.message("⚠️ Shop is missing required data: " + missing.join(", "));
        }
    }

    return { valid: valid, critical: critical, missing: missing };
}

// function to check "player_shops.json" data integrity
function ensureShopExists(player, shopId, playerShops) {
    if (!playerShops) {
        player.message("No shop data found! Contact an admin!");
        return false;
    } else if (!shopExists(shopId, playerShops)) {
        player.message("Shop of ID " + shopId + " not found! Check your shop ID!");
        return false;
    } else {
        return true;
    }
}

// Function to get a list of all shops a given player owns
function listShops(player) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        player.message("No shops found!");
        return;
    }

    var shops = [];
    for (var shopId in playerShops) {
        if (playerShops[shopId].owner === player.getName()) {
            shops.push(shopId);
        }
    }

    if (shops.length === 0) {
        player.message("No shops found!");
    } else {
        player.message("Shops you own: " + shops.join(", "));
    }

    return shops;
}

// Function to check if a shop with given ID exists or not
function shopExists(shopId, playerShops) {

    if (playerShops[shopId]) {
        // world.broadcast("Shop " + shopId + " exists!");
        return true;
    }

    world.broadcast("Shop " + shopId + " does not exist!");
    return false;
}

// Function to convert a "_" separated string to a " " separated string
function convertUnderscore(string) {
    if (!string) {
        return null;
    }
    return string.replace(/_/g, " ");
}

// Function to check if region / sub_region are compatible
function checkRegionSubRegion(region, subRegion) {
    var shopDemand = loadJson(REGIONAL_DEMAND_JSON_PATH);
    shopDemand = shopDemand["Local Demands"];
    if (!shopDemand) {
        return false;
    }

    // If region or sub_region are "unspecified", return true
    if (region === "unspecified" || subRegion === "unspecified") {
        return true;
    }

    if (!shopDemand[region]) {
        return false;
    }

    if (!shopDemand[region][subRegion]) {
        return false;
    }

    return true;
}

// Function to check if a shop has this name already
function checkShopName(name) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        return false;
    }

    for (var shopId in playerShops) {
        if (playerShops[shopId].display_name === name) {
            return true;
        }
    }

    return false;
}

// Function to check is a player already owns a shop of this type in this region
function checkShopTypeRegion(player, type, region, subRegion) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        return false;
    }

    for (var shopId in playerShops) {
        var shop = playerShops[shopId];
        if (shop.owner === player.getName() && shop.type === type && shop.region === region && shop.sub_region === subRegion) {
            return true;
        }
    }

    return false;
}

// Function to edit region property
function editRegionProperty(playerShops, shopID, region) {
    //  Check if shop of this ID exists
    if (!shopExists(shopID, playerShops)) {
        return;
    }

    // Check if region is compatible with sub_region
    var subRegion = playerShops[shopID].sub_region;
    if (!checkRegionSubRegion(region, subRegion)) {
        player.message("Invalid region / sub-region combination!");
        return;
    }
}

// Function to edit sub-region property
function editSubRegionProperty(playerShops, shopID, subRegion) {
    //  Check if shop of this ID exists
    if (!shopExists(shopID, playerShops)) {
        return;
    }

    // Check if region is compatible with sub_region
    var region = playerShops[shopID].region;
    if (!checkRegionSubRegion(region, subRegion)) {
        player.message("Invalid region / sub-region combination!");
        return;
    }
}

// Function to get the list of permissions a player has in a shop
function getPermissions(player, playerShops, shopID) {
    /*
    Reminder:
    open / close shop: allowed to owner, mlanager, cashier, stock keeper, assistant
    set prices: allowed to owner, manager
    manage permissions: allowed to owner, manager
    take money from cash register: allowed to owner, manager, cashier
    manage stock: allowed to owner, manager, stock keeper

    this function will return the list of permission a player has depending on their role in the shop
    */

    var permissions = [];

    // Check if player is owner
    if (playerShops[shopID].roles.owner === player.getName()) {
        permissions.push(PERMISSION_OPEN_CLOSE_SHOP);
        permissions.push(PERMISSION_SET_PRICES);
        permissions.push(PERMISSION_MANAGE_PERMISSIONS);
        permissions.push(PERMISSION_TAKE_MONEY);
        permissions.push(PERMISSION_MANAGE_STOCK);
    } else if (playerShops[shopID].roles.managers.includes(player.getName())) {
        permissions.push(PERMISSION_OPEN_CLOSE_SHOP);
        permissions.push(PERMISSION_SET_PRICES);
        permissions.push(PERMISSION_MANAGE_PERMISSIONS);
        permissions.push(PERMISSION_TAKE_MONEY);
        permissions.push(PERMISSION_MANAGE_STOCK);
    } else if (playerShops[shopID].roles.cashiers.includes(player.getName())) {
        permissions.push(PERMISSION_OPEN_CLOSE_SHOP);
        permissions.push(PERMISSION_TAKE_MONEY);
    } else if (playerShops[shopID].roles.stock_keepers.includes(player.getName())) {
        permissions.push(PERMISSION_OPEN_CLOSE_SHOP);
        permissions.push(PERMISSION_MANAGE_STOCK);
    } else if (playerShops[shopID].roles.assistants.includes(player.getName())) {
        permissions.push(PERMISSION_OPEN_CLOSE_SHOP);
    }

    return permissions;
}

// Function to get permissions of a player in a shop
function checkPermissions(player, shopID, playerShops, permission) {
    var permissions = getPermissions(player, playerShops, shopID);
    for (var i = 0; i < permissions.length; i++) {
        if (permissions[i] === permission) {
            return true;
        }
    }

    return false;
}

// Function to sanitize a string (if "", set to null)
function sanitizeString(string) {
    if (string === "") {
        return null;
    } else {
        return string;
    }
}

// Function to get a property from a string (propertyname=value)
function getProperty(string) {
    
    var parts = string.split("=");

    var propertyName = parts[0];
    var value = sanitizeString(parts[1]);

    return { propertyName: propertyName, value: value };
}

// ############################################################################################################
// FILE OPERATIONS
// ############################################################################################################

function loadJson(filePath) {
    var file = new java.io.File(filePath);
    if (!file.exists()) {
        return null;
    }

    var reader = new java.io.FileReader(file);
    var json = JSON.parse(org.apache.commons.io.IOUtils.toString(reader));
    reader.close();

    return json;
}

function saveJson(data, filePath) {
    var writer = new java.io.FileWriter(filePath);
    writer.write(JSON.stringify(data, null, 4));
    writer.close();
}

function checkFileExists(filePath) {
    var file = new java.io.File(filePath);
    return file.exists();
}

function removeRoom(roomArray, value) {
    var index = parseInt(value);
    if (!isNaN(index)) {
        if (index >= 0 && index < roomArray.length) {
            roomArray.splice(index, 1);
            return true;
        }
    } else {
        var roomIndex = roomArray.indexOf(value);
        if (roomIndex !== -1) {
            roomArray.splice(roomIndex, 1);
            return true;
        }
    }
    return false;
}

function checkRegionExists(region) {
    var shopDemand = loadJson(REGIONAL_DEMAND_JSON_PATH);
    shopDemand = shopDemand["Local Demands"];
    return shopDemand && shopDemand[region];
}

function checkSubRegionExists(region, subRegion) {
    var shopDemand = loadJson(REGIONAL_DEMAND_JSON_PATH);
    shopDemand = shopDemand["Local Demands"];
    return shopDemand && shopDemand[region] && shopDemand[region][subRegion];
}