var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

var SERVER_SHOPS_JSON_PATH = "world/customnpcs/scripts/under_dev/server_shops.json";
var SHOP_CATEGORIES_JSON_PATH = "world/customnpcs/scripts/under_dev/shop_categories.json";
var REGIONAL_DEMAND_JSON_PATH = "world/customnpcs/scripts/under_dev/regional_demand.json";

var STOCK_EXCHANGE_DATA_JSON_PATH = "world/customnpcs/scripts/stock_exchange_data.json"
var NPC_MARKET_DATA_JSON_PATH = "world/customnpcs/markets/"

var PERMISSION_OPEN_CLOSE_SHOP = "open_close_shop";
var PERMISSION_SET_PRICES = "set_prices";
var PERMISSION_MANAGE_PERMISSIONS = "manage_permissions";
var PERMISSION_TAKE_MONEY = "take_money";
var PERMISSION_MANAGE_STOCK = "manage_stock";

var world = API.getIWorld(0);

function init(event) {
    // world.broadcast("(Under dev) Shopkeeper OS initialized!");
}

function chat(event) {
    var player = event.player;
    var message = event.message;
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);

    if (!playerShops) {
        player.message("No shops found!");
        return;
    }

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
                        addStockRoom(player, shopId, playerShops, value.value);
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
                        if (!removeStockRoom(player, shopId, playerShops, value.value)) {
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
            openShop(player, shopId, playerShops);
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
    } else if (message.startsWith("$shop stock add")) {
        var args = message.split(" ");
        var shopId = parseInt(args[3]);
        if (args.length === 4) {
            player.message("Running $shop stock add " + shopId);
            getHandItems(player);
            getAvailableItems(player, getShopFromID(shopId).shop.type);
        } else if (args.length === 5) {
            player.message("Running $shop stock add " + shopId + " " + args[4]);
        } else {
            player.message("Invalid command! Usage: $shop stock add <ID> or $shop stock add <ID> all");
        }
        
    } else if (message.startsWith("$shop stock remove")) {
        var args = message.split(" ");
        if (args.length === 4) {
            var item = args[3];
            removeStock(player, item);
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
function openShop(player, shopId, serverShops) {
    // Check integrity
    if (
        ensureShopExists(player, shopId, serverShops) &&
        ensureShopDataComplete(player, shopId, serverShops, true).valid
    ) {
        var shopData = serverShops[shopId];

        // Check if player is the owner
        if (shopData.roles.owner !== player.getName()) {
            player.message("You don't own this shop!");
            return false;
        }

        // Check if shop is closed
        if (shopData.shop.is_open) {
            player.message("Shop is already open!");
            return false;
        }

        // Check if player has another shop of similar type and region/subregion open
        var playerShops = listShops(player, serverShops);
        if (playerShops.length === 0) {
            player.message("You don't have any shops!");
            return false;
        }
        for (var i = 0; i < playerShops.length; i++) {
            var otherShopId = playerShops[i];
            var otherShop = serverShops[otherShopId];
            if (
                otherShop.shop.is_open &&
                otherShop.shop.type === shopData.shop.type &&
                otherShop.property.region === shopData.property.region &&
                otherShop.property.sub_region === shopData.property.sub_region
            ) {
                player.message("You already have another shop of similar type and region/subregion open!");
                return false;
            }
        }

        shopData.shop.is_open = true;
        saveJson(serverShops, SERVER_SHOPS_JSON_PATH);
        player.message("Shop opened!");
        return true;
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
    if (ensureShopExists(player, shopId, serverShops)) {
        var shopData = serverShops[shopId];

        // Check if player is the owner
        if (shopData.roles.owner !== player.getName()) {
            player.message("You don't own this shop!");
            return false;
        }

        // Check if shop is open
        if (!shopData.shop.is_open) {
            player.message("Shop is already closed!");
            return false;
        }

        shopData.shop.is_open = false;
        saveJson(serverShops, SERVER_SHOPS_JSON_PATH);
        player.message("Shop closed!");
        return true;
    } else {
        player.message("Shop cannot be closed!");
        return false;
    }
}

// ------------------------------------------------------------------------------------------------------------
// Create a shop
// ------------------------------------------------------------------------------------------------------------
function createShop(player, type, region, sub_region, display_name, money) {
    var serverShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!serverShops) {
        player.message("No shop data found! Contact an admin!");
        return;
    }

    var shopId = 1;
    while (serverShops[shopId]) {
        // world.broadcast("Shop ID " + shopId + " already exists!");
        shopId++;
        // world.broadcast("Trying ID " + shopId + "...");
    }

    // world.broadcast("Creating shop with ID " + shopId + "...");

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
            stock_room: [],
            main_room: [],
            region: region,
            sub_region: sub_region,
            stock_room_size: 0
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
            value = value.replace(/_/g, " ");
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

    var shopCategories = loadJson(SHOP_CATEGORIES_JSON_PATH);
    if (!shopCategories) {
        player.message("Shop categories not found!");
        return;
    }

    var validType = shopCategories["entries"].some(entry => entry.name === type);

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

    var shopDemand = loadJson(REGIONAL_DEMAND_JSON_PATH)["Local Demands"];
    if (!shopDemand) {
        player.message("Shop demand not found!");
        return;
    }

    var regionParts = region.split("-");
    var mainRegion = regionParts[0];
    var subRegion = regionParts[1];

    if (!shopDemand[mainRegion] || !shopDemand[mainRegion][subRegion]) {
        player.message("Invalid region or sub-region!");
        return;
    }

    var shop = playerShops[shopId];
    shop.region = mainRegion;
    shop.sub_region = subRegion;
    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    player.message("Shop region set!");
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

    var shopDemand = loadJson(REGIONAL_DEMAND_JSON_PATH)["Local Demands"];
    var region = shopDemand[getShopFromID(shopId).region];
    if (!region || !region[subRegion]) {
        player.message("Invalid sub-region!");
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
        if (playerShops[shopId].roles.owner === player.getName()) {
            return shopId;
        }
    }

    return null;
}

// function to convert price
function convertPrice(price) {
    var grons = price.split("g")[0];
    var cents = price.split("g")[1];
    cents = parseInt(cents.split("c")[0]);
    return parseInt(grons) * 100 + cents;
}

// function to get shop info from ID
function getShopFromID(shopId) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    return playerShops ? playerShops[shopId] : null;
}

// function to check if item is valid according to shop type
function isValidItem(shopType, item) {
    var shopCategories = loadJson(SHOP_CATEGORIES_JSON_PATH);
    if (!shopCategories) {
        return false;
    }

    return shopCategories["entries"].some(entry => entry.name === shopType && entry.items.some(i => i.id === item));
}

// Function to check ownership of a shop to a player
function isOwner(player, shopId) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops || !playerShops[shopId]) {
        player.message("Shop not found!");
        listShops(player);
        return false;
    }

    return playerShops[shopId].roles.owner === player.getName();
}

// function to check if a shop instance isn't missing any data (update proof)
function ensureShopDataComplete(player, shopID, playerShops, log) {
    var valid = true;
    var critical = false;
    var missing = [];
    var shopData = playerShops[shopID];

    if (!shopData) {
        if (log) player.message("Shop ID " + shopID + " is missing!");
        return { valid: false, critical: true, missing: ["shopData"] };
    }

    if (!shopData.property || !shopData.property.location ||
        shopData.property.location.x == null ||
        shopData.property.location.y == null ||
        shopData.property.location.z == null) {

        missing.push("location");
        critical = true;
        valid = false;
    }

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
function listShops(player, serverShops) {
    var shops = [];
    for (var shopId in serverShops) {
        if (serverShops[shopId].roles.owner === player.getName()) {
            shops.push(shopId);
        }
    }

    if (shops.length === 0) {
        player.message("No shops found for " + player.getName() + "!");
    } else {
        player.message("Shops you own: " + shops.join(", "));
    }

    return shops;
}

// Function to check if a shop with given ID exists or not
function shopExists(shopId, playerShops) {
    return !!playerShops[shopId];
}

// Function to convert a "_" separated string to a " " separated string
function convertUnderscore(string) {
    return string ? string.replace(/_/g, " ") : null;
}

// Function to check if region / sub_region are compatible
function checkRegionSubRegion(region, subRegion) {
    var shopDemand = loadJson(REGIONAL_DEMAND_JSON_PATH)["Local Demands"];
    if (!shopDemand) {
        return false;
    }

    if (region === "unspecified" || subRegion === "unspecified") {
        return true;
    }

    return shopDemand[region] && shopDemand[region][subRegion];
}

// Function to check if a shop has this name already
function checkShopName(name) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        return false;
    }

    return Object.values(playerShops).some(shop => shop.display_name === name);
}

// Function to check is a player already owns a shop of this type in this region
function checkShopTypeRegion(player, type, region, subRegion) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        return false;
    }

    return Object.values(playerShops).some(shop => shop.owner === player.getName() && shop.type === type && shop.region === region && shop.sub_region === subRegion);
}

// Function to get the list of permissions a player has in a shop
function getPermissions(player, playerShops, shopID) {
    var permissions = [];

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
    return permissions.includes(permission);
}

// Function to sanitize a string (if "", set to null)
function sanitizeString(string) {
    return string === "" ? null : string;
}

// Function to get a property from a string (propertyname=value)
function getProperty(string) {
    var parts = string.split("=");
    var propertyName = parts[0];
    var value = sanitizeString(parts[1]);
    return { propertyName: propertyName, value: value };
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

// function to calculate stock room size
function calculateStockRoomSize(player, shopId, playerShops) {
    var world_data = getWorldData();
    // check if shop has stock room
    if (playerShops[shopId].property.stock_room.length === 0) {
        player.message("Shop has no stock room!");
        return 0;
    } else {
        var stock_rooms = playerShops[shopId].property.stock_room;
        var total_size = 0;
        for (var i = 0; i < stock_rooms.length; i++) {
            // split "stock_room" on ":" to get the cuboid name and the sub-cuboid
            var cuboid = stock_rooms[i].split(":")[0];
            var sub_cuboid = stock_rooms[i].split(":")[1];
            player.message("Stock room: " + cuboid + " - " + sub_cuboid);
            // get the cuboid
            var cuboid_data = JSON.parse(world_data.get("region_" + cuboid));
            if (!cuboid_data) {
                player.message("Cuboid " + cuboid + " not found!");
                return 0;
            } else {
                // player.message("Cuboid " + cuboid + " found!");
                // player.message("Cuboid data: " + JSON.stringify(cuboid_data));
                // Check if the cuboid has sub-cuboids
                if (!cuboid_data.positions) {
                    player.message("Cuboid " + cuboid + " has no sub-cuboids!");
                    // player.message("Cuboid data: " + JSON.stringify(cuboid_data));
                    return 0;
                } else {
                    // get the sub-cuboid (a cuboid has an array of "positions" which are the sub-cuboids)
                    var sub_cuboid_data = cuboid_data.positions[sub_cuboid];
                    // player.message("Sub-cuboid " + sub_cuboid + " found!");
                    // get "xyz1" and "xyz2" from the sub-cuboid data
                    var xyz1 = sub_cuboid_data.xyz1;
                    var xyz2 = sub_cuboid_data.xyz2;
                    // player.message("Sub-cuboid data: " + JSON.stringify(sub_cuboid_data));
                    // player.message("xyz1: " + xyz1);
                    // player.message("xyz2: " + xyz2);
                    // divide the coordinates into x1, y1, z1 and x2, y2, z2
                    var x1 = xyz1[0];
                    var y1 = xyz1[1];
                    var z1 = xyz1[2];
                    var x2 = xyz2[0];
                    var y2 = xyz2[1];
                    var z2 = xyz2[2];
                    // Be sure to start from the smallest coordinate
                    var temp;
                    if (x1 > x2) {
                        temp = x1;
                        x1 = x2;
                        x2 = temp;
                    }
                    if (y1 > y2) {
                        temp = y1;
                        y1 = y2;
                        y2 = temp;
                    }
                    if (z1 > z2) {
                        temp = z1;
                        z1 = z2;
                        z2 = temp;
                    }
                    // player.message("x1: " + x1 + ", y1: " + y1 + ", z1: " + z1);
                    // player.message("x2: " + x2 + ", y2: " + y2 + ", z2: " + z2);
                    // loop through the cuboid and count the number of air blocks
                    var count = 0;
                    for (var x = x1; x <= x2; x++) {
                        for (var y = y1; y <= y2; y++) {
                            for (var z = z1; z <= z2; z++) {
                                if (world.getBlock(x, y, z).isAir()) {
                                    count++;
                                }
                            }
                        }
                    }
                    // player.message("Stock room size: " + count + " blocks");
                    total_size += count;
                }
            }
        }
        player.message("Total stock room size: " + total_size + " blocks");
        return total_size;
    }
}

function addStockRoom(player, shopId, playerShops, value) {
    playerShops[shopId].property.stock_room.push(value);
    playerShops[shopId].property.stock_room_size = calculateStockRoomSize(player, shopId, playerShops);
}

function removeStockRoom(player, shopId, playerShops, value) {
    if (removeRoom(playerShops[shopId].property.stock_room, value)) {
        playerShops[shopId].property.stock_room_size = calculateStockRoomSize(player, shopId, playerShops);
        return true;
    }
    return false;
}

// function to get hand held items
function getHandItems(player) {
    var itemstack = player.getMainhandItem();
    var edititemstack = itemstack.copy();
    var count = edititemstack.getStackSize();
    edititemstack.setStackSize(1);
    var item = edititemstack.getItemNbt();

    var itemstock = {
        item: item,
        count: count
    };

    player.message("Item: " + itemstock.item.toJsonString());
    player.message("Count: " + itemstock.count);

    return itemstock;
}

// function to get the list oif available items from a shop type
function getAvailableItems(player, shopType) {
    var shopCategories = loadJson(SHOP_CATEGORIES_JSON_PATH);
    if (!shopCategories) {
        player.message("Shop categories not found!");
        return;
    }

    var items = [];

    for (var i = 0; i < shopCategories["entries"].length; i++) {
        var entry = shopCategories["entries"][i];
        if (entry.name === shopType) {
            if (entry.items) {
                for (var j = 0; j < entry.items.length; j++) {

                    var item = {
                        id: entry.items[j].id,
                        value: entry.items[j].price
                    };

                    if (entry.items[j].tag) {
                        item.tag = entry.items[j].tag
                    }

                    items.push(item);
                }
            }
            // If shop entry has "based_on_stocks" list:
            if (entry.based_on_stocks) {
                player.message("Based on stocks: ");
                for (var j = 0; j < entry.based_on_stocks.length; j++) {
                    player.message(entry.based_on_stocks[j]);

                    var basedOnStocksItems = getBasedOnStocksItems(player, entry.based_on_stocks[j]);
                    if (basedOnStocksItems) {
                        for (var k = 0; k < basedOnStocksItems.length; k++) {
                            items.push(basedOnStocksItems[k]);
                        }
                    }
                }
            }
            // if shop entry has "based_on_market" list:
            if (entry.based_on_market) {
                player.message("Based on market: ");
                for (var j = 0; j < entry.based_on_market.length; j++) {
                    player.message(entry.based_on_market[j]);

                    var basedOnMarketItems = getBasedOnMarketItems(player, entry.based_on_market[j]);
                    if (basedOnMarketItems) {
                        for (var k = 0; k < basedOnMarketItems.length; k++) {
                            items.push(basedOnMarketItems[k]);
                        }
                    }
                }
            }

            for (var j = 0; j < items.length; j++) {
                player.message("Item: " + items[j].id + ", Price: " + items[j].value);
            }
            return;
        }
    }
}

// Function to get a list of items for "based_on_stocks" item list types
function getBasedOnStocksItems(player, stockName) {
    var stocks = loadJson(STOCK_EXCHANGE_DATA_JSON_PATH);
    if (!stocks) {
        player.message("Stocks not found!");
        return;
    }

    var items = [];

    var stock = stocks[stockName];
    // each keys of "stock" is a ressource. There are multiple types of ressources that exist, if the ressource has "type" key specified, it is not a generic type.
    // Generic ressources are items: the key is the item id. Spit the key on ":", the first value is modid, second value is itemid, third value is meta.
    // If the ressource has "type" key specified, ignore it
    for (var ressource in stock) {
        if (stock[ressource].type) {
            continue;
        }

        var item = {
            id: ressource,
            value: stock[ressource].current_price
        };

        items.push(item);
    }

    return items;
}

// Function to get a list of items for "based_on_market" item list types
function getBasedOnMarketItems(player, marketName) {
    var pathToJson = NPC_MARKET_DATA_JSON_PATH + marketName + ".json";
    // player.message("Path to json: " + pathToJson);
    var market = loadJavaJson(player, pathToJson);
    if (!market) {
        player.message("Market not found!");
        return;
    }

    // player.message("Market: " + marketName);

    var items = [];

    // Get the "TraderCurrency" object
    var traderCurrency = market["TraderCurrency"]["NpcMiscInv"];
    var TraderSold = market["TraderSold"]["NpcMiscInv"];
    var extracted_data = {};

    for (var i = 0; i < 18; i++) {
        // player.message("Scanning item " + i + " in market " + marketName);
        var item_1 = null;
        var item_2 = null;
        var item_3 = null;
        var mult_1 = 1;
        var mult_2 = 1;
        if (traderCurrency[i] && traderCurrency[i].tag && traderCurrency[i].tag.display && traderCurrency[i].tag.display.Lore) {
            item_1 = traderCurrency[i].tag.display.Lore[0];
            mult_1 = traderCurrency[i].Count;
        }
        if (traderCurrency[i + 18] && traderCurrency[i + 18].tag && traderCurrency[i + 18].tag.display && traderCurrency[i + 18].tag.display.Lore) {
            item_2 = traderCurrency[i + 18].tag.display.Lore[0];
            mult_2 = traderCurrency[i + 18].Count;
        }
        if (TraderSold[i] && 
            !(  TraderSold[i].tag && 
                TraderSold[i].tag.display && 
                TraderSold[i].tag.display.Name && 
                TraderSold[i].tag.display.Name === "§2§lMoney§r"
            )
        ) {
            item_3 = TraderSold[i];
        }
        // player.message("input 1: " + item_1);
        // player.message("input 2: " + item_2);
        // player.message("output: " + JSON.stringify(item_3));

        extracted_data[i] = {
            item_1: item_1,
            mult_1: mult_1,
            item_2: item_2,
            mult_2: mult_2,
            item_3: item_3
        };

        // player.message("Extracted data: " + JSON.stringify(extracted_data));
    }

    // loop through the "extracted_data" object
    for (var key in extracted_data) {
        var final_item = {};

        // player.message("Key from extracted data: " + key);

        var item = extracted_data[key];
        if (item.item_3) {
            var id = item.item_3.id + ":" + item.item_3.Damage;
            var count = item.item_3.Count;

            // in "tag"
            if (item.item_3.tag) {
                final_item.tag = item.item_3.tag;
            }

            // player.message("Item: " + id + ", Count: " + count);
        }

        var value_1 = 0;
        var value_2 = 0;
        if (item.item_1) {
            // player.message("Item input 1 is currency: " + JSON.stringify(item.item_1));
            value_1 = item.item_1;
            value_1 = value_1.replace(/§e/g, "");
            if (value_1.indexOf("G") !== -1) {
                value_1 = value_1.replace("G", "");
                // player.message("Value 1: " + value_1);
                // convert to int
                value_1 = parseInt(value_1);
                value_1 *= 100;
            } else if (value_1.indexOf("C") !== -1) {
                value_1 = value_1.replace("C", "");
                // player.message("Value 1: " + value_1);
                // convert to int
                value_1 = parseInt(value_1);
            }
            value_1 *= item.mult_1;
            // player.message("Value 1: " + value_1);
        }
        if (item.item_2) {
            // player.message("Item input 2 is currency: " + JSON.stringify(item.item_2));
            value_2 = item.item_2;
            value_2 = value_2.replace(/§e/g, "");
            if (value_2.indexOf("G") !== -1) {
                value_2 = value_2.replace("G", "");
                // player.message("Value 2: " + value_2);
                // convert to int
                value_2 = parseInt(value_2);
                value_2 *= 100;
            } else if (value_2.indexOf("C") !== -1) {
                value_2 = value_2.replace("C", "");
                // player.message("Value 2: " + value_2);
                // convert to int
                value_2 = parseInt(value_2);
            }
            value_2 *= item.mult_2;
            // player.message("Value 2: " + value_2);
        }

        var final_value = value_1 + value_2;
        final_value = final_value / count;

        if (final_value > 0) {
            final_item.id = id;
            final_item.value = final_value;

            items.push(final_item);

            // player.message("Item: " + final_item.id + ", Value: " + final_item.value);
        }
    }

    return items;
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

function getWorldData() {
    return world.getStoreddata();
}

// Function to decode java formated json
function loadJavaJson(player, filePath) {
    var file = new java.io.File(filePath);
    if (!file.exists()) {
        return null;
    }

    // player.message("Loading json file: " + filePath);

    var reader = new java.io.FileReader(file);
    var jsonString = org.apache.commons.io.IOUtils.toString(reader);
    reader.close();

    // Remove letters at the end of number values
    jsonString = jsonString.replace(/(\d+)[bBsSlLfFdD]/g, '$1');

    var json = JSON.parse(jsonString);
    return json;
}