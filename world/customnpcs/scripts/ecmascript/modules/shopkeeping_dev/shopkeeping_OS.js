var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

var SERVER_SHOPS_JSON_PATH = "world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/server_shops.json";
var SHOP_CATEGORIES_JSON_PATH = "world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shop_categories.json";
var REGIONAL_DEMAND_JSON_PATH = "world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/regional_demand.json";

var STOCK_EXCHANGE_DATA_JSON_PATH = "world/customnpcs/scripts/stock_exchange_data.json"
var NPC_MARKET_DATA_JSON_PATH = "world/customnpcs/markets/"

var PERMISSION_OPEN_CLOSE_SHOP = "open_close_shop";
var PERMISSION_SET_PRICES = "set_prices";
var PERMISSION_MANAGE_PERMISSIONS = "manage_permissions";
var PERMISSION_TAKE_MONEY = "take_money";
var PERMISSION_MANAGE_STOCK = "manage_stock";

var world = API.getIWorld(0);

load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shopkeeping_utils.js")
load("world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shopkeeping_stockroom.js")
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js")
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js")
load("world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shopkeeping_grading.js")

function init(event) {
    var player = event.player;
    if (!checkFileExists(SERVER_SHOPS_JSON_PATH)) {
        world.broadcast("&cNo shop data found! Contact an admin!");
        return;
    }
    updateStockrooms(player);
}

function chat(event) {
    var player = event.player;
    var message = event.message;
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);

    if (!playerShops) {
        world.broadcast("&cAn error occurred while loading shop data! Contact an admin!");
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
                tellPlayer(player, "&cInvalid shop ID: &e" + args[2]);
                return;
            }
            deleteShop(player, shopId);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop delete <ID>");
        }
    } else if (message.startsWith("$shop property set")) {
        var args = message.split(" ");
        if (args.length < 4) {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop property set <ID> [name=<name>] [type=<type>] [region=<region>] [sub_region=<sub_region>] [money=<money>]");
            return;
        }

        var shopId = parseInt(args[3]);
        if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
            tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
            tellPlayer(player, "&cUse \"_\" for spaces in the values");
            return;
        }

        var shop = playerShops[shopId];

        var name = shop.shop.display_name || null;
        var type = shop.shop.type || null;
        var region = shop.property.region || null;
        var sub_region = shop.property.sub_region || null;
        var money = shop.finances.stored_cash || 0;

        if (args.length > 4) {
            for (var i = 4; i < args.length; i++) {
                var value = getProperty(args[i]);
                switch (value.propertyName) {
                    case "name":
                        shop.shop.display_name = convertUnderscore(value.value);
                        break;
                    case "type":
                        shop.shop.type = value.value;
                        initStockRoom(player, shopId, playerShops);
                        removeOutdatedListedItems(player, shop, value.value);
                        break;
                    case "region":
                        if (!checkRegionExists(value.value)) {
                            tellPlayer(player, "&cInvalid region: &e" + value.value);
                            return;
                        }
                        shop.property.region = value.value;
                        break;
                    case "sub_region":
                        if (!checkSubRegionExists(region, value.value)) {
                            tellPlayer(player, "&cInvalid sub-region: &e" + value.value);
                            return;
                        }
                        shop.property.sub_region = value.value;
                        break;
                    case "money":
                        shop.finances.stored_cash = parseInt(value.value) || 0;
                        break;
                    default:
                        tellPlayer(player, "&cUnknown property: &e" + value.propertyName);
                        return;
                }
            }
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop property set <ID> [name=<name>] [type=<type>] [region=<region>] [sub_region=<sub_region>] [money=<money>]");
            tellPlayer(player, "&cUse \"_\" for spaces in the values");
        }

        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aShop properties updated!");
    } else if (message.startsWith("$shop property add")) {
        var args = message.split(" ");
        if (args.length < 4) {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop property add <ID> [stock_room=<region>] [main_room=<region>]");
            return;
        }

        var shopId = parseInt(args[3]);
        if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
            tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
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
        tellPlayer(player, "&aShop properties updated!");
    } else if (message.startsWith("$shop property remove")) {
        var args = message.split(" ");
        if (args.length < 4) {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop property remove <ID> [stock_room=<index_or_name>] [main_room=<index_or_name>]");
            return;
        }

        var shopId = parseInt(args[3]);
        if (isNaN(shopId)) {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop property remove <ID> [stock_room=<index_or_name>] [main_room=<index_or_name>]");
            return;
        }

        var shop = playerShops[shopId];
        if (args.length > 4) {
            for (var i = 4; i < args.length; i++) {
                var value = getProperty(args[i]);
                switch (value.propertyName) {
                    case "stock_room":
                        if (!removeStockRoom(player, shopId, playerShops, value.value)) {
                            tellPlayer(player, "&cRegion &e" + value.value + " &cnot found in stock_room!");
                            tellPlayer(player, "&cAvailable regions: &e" + shop.property.stock_room.join(", "));
                        }
                        break;
                    case "main_room":
                        if (!removeRoom(shop.property.main_room, value.value)) {
                            tellPlayer(player, "&cRegion &e" + value.value + " &cnot found in main_room!");
                            tellPlayer(player, "&cAvailable regions: &e" + shop.property.main_room.join(", "));
                        }
                        break;
                }
            }
        }

        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aShop properties updated!");
    } else if (message.startsWith("$shop open")) {
        var args = message.split(" ");
        if (args.length === 3) {
            var shopId = parseInt(args[2]);
            openShop(player, shopId, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop open <ID>");
        }
    } else if (message.startsWith("$shop close")) {
        var args = message.split(" ");
        if (args.length === 3) {
            var shopId = parseInt(args[2]);
            closeShop(player, shopId);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop close <ID>");
        }
    } else if (message.startsWith("$shop stock add")) {
        var args = message.split(" ");
        if (args.length === 4) {
            var shopId = parseInt(args[3]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            addStockFromHand(player, shopId, playerShops);
        } else if (args.length === 5 && args[4] === "all") {
            var shopId = parseInt(args[3]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            addAllStockFromInventory(player, shopId, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop stock add <ID> or $shop stock add <ID> all");
        }
    } else if (message.startsWith("$shop stock remove")) {
        var args = message.split(" ");
        if (args.length >= 4) {
            var shopId = parseInt(args[3]);
            var itemIdOrIndex = args[4];
            var count = args.length === 6 ? parseInt(args[5]) : 64;
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            var shop = playerShops[shopId];
            var itemId = itemIdOrIndex;
            if (!isNaN(itemIdOrIndex)) {
                var index = parseInt(itemIdOrIndex);
                var keys = Object.keys(shop.inventory.stock);
                if (index >= 0 && index < keys.length) {
                    itemId = keys[index];
                } else {
                    tellPlayer(player, "&cInvalid item index: &e" + itemIdOrIndex);
                    return;
                }
            }
            removeStock(player, shopId, itemId, count, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop stock remove <ID> <Item ID or index> [number]");
        }
    } else if (message.startsWith("$shop stock eval")) {
        evalHandItem(player);
    } else if (message.startsWith("$shop price set")) {
        var args = message.split(" ");
        if (args.length < 5) {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop price set <shopID> <itemID OR item index> <profit>");
            return;
        }

        var shopId = parseInt(args[3]);
        var itemIdOrIndex = args[4];
        var profit = args[5];

        if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
            tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
            return;
        }

        if (profit === "default") {
            var shop = playerShops[shopId];
            if (!shop.finances.default_margin) {
                tellPlayer(player, "&cNo default margin set for this shop!");
                return;
            }
            profit = shop.finances.default_margin * 100 + "%";
        }

        setPrice(player, shopId, itemIdOrIndex, profit, playerShops);
    } else if (message.startsWith("$shop price default")) {
        var args = message.split(" ");
        if (args.length < 4) {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop price default <shopID> <percentage>");
            return;
        }

        // Replace any % with ⁒
        for (var i = 0; i < args.length; i++) {
            args[i] = args[i].replace("%", "⁒");
        }

        var shopId = parseInt(args[3]);
        var defaultMargin = args[4];

        if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
            tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
            return;
        }

        if (!defaultMargin) {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop price default <shopID> <percentage>");
            return;
        }

        if (!defaultMargin.endsWith("⁒")) {
            tellPlayer(player, "&cInvalid percentage format! Use a percentage value (e.g., 10⁒)");
            return;
        }

        var percent = parseFloat(defaultMargin.slice(0, -1));
        if (isNaN(percent)) {
            tellPlayer(player, "&cInvalid percentage value!");
            return;
        }

        var shop = playerShops[shopId];
        shop.finances.default_margin = percent / 100;
        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aDefault margin set to &e" + percent + "⁒ &afor shop &e" + shopId);
    } else if (message.startsWith("$shop money put pouch")) {
        var args = message.split(" ");
        if (args.length === 6) {
            var shopId = parseInt(args[4]);
            var value = getCoinAmount(args[5]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[4]);
                return;
            }
            putMoneyInShopFromPouch(player, shopId, value, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop money put pouch <ID> <value>");
        }
    } else if (message.startsWith("$shop money take pouch")) {
        var args = message.split(" ");
        if (args.length === 6) {
            var shopId = parseInt(args[4]);
            var value = getCoinAmount(args[5]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[4]);
                return;
            }
            takeMoneyFromShopToPouch(player, shopId, value, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop money take pouch <ID> <value>");
        }
    } else if (message.startsWith("$shop money put")) {
        var args = message.split(" ");
        if (args.length === 4) {
            var shopId = parseInt(args[3]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            putMoneyInShop(player, shopId, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop money put <ID>");
        }
    } else if (message.startsWith("$shop money take")) {
        var args = message.split(" ");
        if (args.length === 5) {
            var shopId = parseInt(args[3]);
            var value = getCoinAmount(args[4]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            takeMoneyFromShop(player, shopId, value, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop money take <ID> <value>");
        }
    } else if (message.startsWith("$shop reputation add")) {
        var args = message.split(" ");
        if (args.length === 5) {
            var shopId = parseInt(args[3]);
            var amount = parseInt(args[4]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            if (isNaN(amount)) {
                tellPlayer(player, "&cInvalid amount: &e" + args[4]);
                return;
            }
            addShopReputation(player, shopId, amount, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop reputation add <ID> <Amount>");
        }
    } else if (message.startsWith("$shop reputation remove")) {
        var args = message.split(" ");
        if (args.length === 5) {
            var shopId = parseInt(args[3]);
            var amount = parseInt(args[4]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            if (isNaN(amount)) {
                tellPlayer(player, "&cInvalid amount: &e" + args[4]);
                return;
            }
            addShopReputation(player, shopId, -amount, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop reputation remove <ID> <Amount>");
        }
    } else if (message.startsWith("$shop reputation log")) {
        var args = message.split(" ");
        if (args.length === 4 || args.length === 5) {
            var shopId = parseInt(args[3]);
            var hours = args.length === 5 ? parseInt(args[4]) : 24;
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            if (isNaN(hours)) {
                tellPlayer(player, "&cInvalid time: &e" + args[4]);
                return;
            }
            logShopReputation(player, shopId, hours, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop reputation log <ID> [time]");
        }
    } else if (message.startsWith("$shop reputation eval")) {
        var args = message.split(" ");
        if (args.length === 4) {
            var shopId = parseInt(args[3]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            // evalShopReputation(player, shopId, playerShops);
            calculateShopScore(player, shopId, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop reputation eval <ID>");
        }
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
            tellPlayer(player, "&cYou don't own this shop!");
            return false;
        }

        // Check if shop is closed
        if (shopData.shop.is_open) {
            tellPlayer(player, "&cShop is already open!");
            return false;
        }

        // Check if player has another shop of similar type and region/subregion open
        var playerShops = listShops(player, serverShops);
        if (playerShops.length === 0) {
            tellPlayer(player, "&cYou don't have any shops!");
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
                tellPlayer(player, "&cYou already have another shop of similar type and region/subregion open!");
                return false;
            }
        }

        shopData.shop.is_open = true;
        saveJson(serverShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aShop opened!");
        return true;
    } else {
        tellPlayer(player, "&cShop cannot be opened!");
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
            tellPlayer(player, "&cYou don't own this shop!");
            return false;
        }

        // Check if shop is open
        if (!shopData.shop.is_open) {
            tellPlayer(player, "&cShop is already closed!");
            return false;
        }

        shopData.shop.is_open = false;
        saveJson(serverShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aShop closed!");
        return true;
    } else {
        tellPlayer(player, "&cShop cannot be closed!");
        return false;
    }
}

// ------------------------------------------------------------------------------------------------------------
// Create a shop
// ------------------------------------------------------------------------------------------------------------
function createShop(player, type, region, sub_region, display_name, money) {
    var serverShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!serverShops) {
        tellPlayer(player, "&cNo shop data found! Contact an admin!");
        return;
    }

    var shopId = 1;
    while (serverShops[shopId]) {
        shopId++;
    }

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
            listed_items: {},
            unsalable_items: {}
        },
        finances: {
            stored_cash: money || 0,
            default_margin: null
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
        },
        upgrades: []
    };

    saveJson(serverShops, SERVER_SHOPS_JSON_PATH);

    // Initialize stock room if type is specified
    if (type) {
        initStockRoom(player, shopId, serverShops);
    }
}

// ------------------------------------------------------------------------------------------------------------
// Delete a shop
// ------------------------------------------------------------------------------------------------------------
function deleteShop(player, shopId) {
    var serverShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!serverShops) {
        tellPlayer(player, "&cNo shop data found! Contact an admin!");
        return;
    }

    delete serverShops[shopId];
    saveJson(serverShops, SERVER_SHOPS_JSON_PATH);
    tellPlayer(player, "&aShop deleted!");
}

// ------------------------------------------------------------------------------------------------------------
// Set a shop property
// ------------------------------------------------------------------------------------------------------------
function setShopProperty(player, property, value) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        tellPlayer(player, "&cNo shops found!");
        return;
    }

    var shopId = getShopId(player);
    if (!shopId) {
        tellPlayer(player, "&cNo shop found!");
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
            tellPlayer(player, "&aShop display name set!");
            break;
        default:
            tellPlayer(player, "&cInvalid property!");
    }
}

// Set the region of the shop
function setShopRegion(player, region) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        tellPlayer(player, "&cNo shops found!");
        return;
    }

    var shopId = getShopId(player);
    if (!shopId) {
        tellPlayer(player, "&cNo shop found!");
        return;
    }

    var shopDemand = loadJson(REGIONAL_DEMAND_JSON_PATH)["Local Demands"];
    if (!shopDemand) {
        tellPlayer(player, "&cShop demand not found!");
        return;
    }

    var regionParts = region.split("-");
    var mainRegion = regionParts[0];
    var subRegion = regionParts[1];

    if (!shopDemand[mainRegion] || !shopDemand[mainRegion][subRegion]) {
        tellPlayer(player, "&cInvalid region or sub-region!");
        return;
    }

    var shop = playerShops[shopId];
    shop.region = mainRegion;
    shop.sub_region = subRegion;
    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    tellPlayer(player, "&aShop region set!");
}

// Set the sub-region of the shop
function setShopSubRegion(player, subRegion) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        tellPlayer(player, "&cNo shops found!");
        return;
    }

    var shopId = getShopId(player);
    if (!shopId) {
        tellPlayer(player, "&cNo shop found!");
        return;
    }

    var shopDemand = loadJson(REGIONAL_DEMAND_JSON_PATH)["Local Demands"];
    var region = shopDemand[getShopFromID(shopId).region];
    if (!region || !region[subRegion]) {
        tellPlayer(player, "&cInvalid sub-region!");
        return;
    }

    var shop = playerShops[shopId];
    shop.sub_region = subRegion;
    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    tellPlayer(player, "&aShop sub-region set!");
}

// ------------------------------------------------------------------------------------------------------------
// Shop info
// ------------------------------------------------------------------------------------------------------------
function shopInfo(player, shopId) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops) {
        tellPlayer(player, "&cNo shops found!");
        return;
    }

    var shop = playerShops[shopId];
    for (var property in shop) {
        tellPlayer(player, property + ": " + shop[property]);
    }
}

// ------------------------------------------------------------------------------------------------------------
// Set price of an item in the shop
// ------------------------------------------------------------------------------------------------------------
function setPrice(player, shopId, itemIdOrIndex, profit, playerShops) {
    var shop = playerShops[shopId];
    var item = null;
    var itemTag = null;

    if (isNaN(itemIdOrIndex)) {
        item = shop.inventory.stock[itemIdOrIndex];
    } else {
        var index = parseInt(itemIdOrIndex);
        var keys = Object.keys(shop.inventory.stock);
        if (index >= 0 && index < keys.length) {
            item = shop.inventory.stock[keys[index]];
            itemIdOrIndex = keys[index];
            itemTag = item.tag;
        }
    }

    if (!item) {
        tellPlayer(player, "&cInvalid item ID or index: &e" + itemIdOrIndex);
        return;
    }

    var referencePrice = getReferencePrice(player, itemIdOrIndex, itemTag, shop.shop.type);
    var price = calculatePrice(referencePrice, profit);

    shop.inventory.listed_items[itemIdOrIndex] = {
        price: price,
        reference_price: referencePrice,
        discount: 0,
        sale_count: 0
    };

    if (itemTag) {
        shop.inventory.listed_items[itemIdOrIndex].tag = itemTag;
    }

    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    tellPlayer(player, "&aSuccessfully set price for item &e" + itemIdOrIndex + " &ato &r:money:&e" + getAmountCoin(price));
    // tellPlayer(player, "Reference price: " + referencePrice);
    // tellPlayer(player, "Price: " + price);
}

function getReferencePrice(player, itemId, itemTag, shopType) {
    // tellPlayer(player, "Getting reference price for item: " + itemId);
    var shopCategories = getAvailableItems(player, shopType);
    // tellPlayer(player, "Shop categories: " + JSON.stringify(shopCategories));

    for (var i = 0; i < shopCategories.length; i++) {
        // tellPlayer(player, "Checking item: " + shopCategories[i].id + " - " + shopCategories[i].value);
        if (shopCategories[i].id === itemId) {
            // tellPlayer(player, "Item found!");
            if (shopCategories[i].tag) {
                // tellPlayer(player, "Item has tag: " + shopCategories[i].tag);
                // tellPlayer(player, "Item tag: " + itemTag);
                if (JSON.stringify(shopCategories[i].tag) === JSON.stringify(itemTag)) {
                    return shopCategories[i].value;
                }
            } else {
                // tellPlayer(player, "No tag found!");
                return shopCategories[i].value;
            }
        }
    }

    return 0;
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

// function to get shop info from ID
function getShopFromID(shopId) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    return playerShops ? playerShops[shopId] : null;
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

// function to get hand held items
function getHandItems(player) {
    var itemstack = player.getMainhandItem();
    var edititemstack = itemstack.copy();
    var count = edititemstack.getStackSize();
    edititemstack.setStackSize(1);
    var item = edititemstack.getItemNbt();
    var fullItem = item.getString("id") + ":" + item.getShort("Damage");

    var itemstock = {
        item: fullItem,
        count: count
    };

    // If tag exists, add it to the itemstock
    if (edititemstack.hasNbt()) {
        itemstock.tag = edititemstack.getNbt().toJsonString();
    }

    return itemstock;
}

// function to get the list oif available items from a shop type
function getAvailableItems(player, shopType) {
    var shopCategories = loadJson(SHOP_CATEGORIES_JSON_PATH);
    if (!shopCategories) {
        tellPlayer(player, "&cShop categories not found!");
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
                tellPlayer(player, "&eBased on stocks: ");
                for (var j = 0; j < entry.based_on_stocks.length; j++) {
                    tellPlayer(player, "&e" + entry.based_on_stocks[j]);

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
                // tellPlayer(player, "&eBased on market: ");
                for (var j = 0; j < entry.based_on_market.length; j++) {
                    // tellPlayer(player, "&e" + entry.based_on_market[j]);

                    var basedOnMarketItems = getBasedOnMarketItems(player, entry.based_on_market[j]);
                    if (basedOnMarketItems) {
                        for (var k = 0; k < basedOnMarketItems.length; k++) {
                            items.push(basedOnMarketItems[k]);
                        }
                    }
                }
            }

            return items;
        }
    }
}

function getPossibleItemsForShopType(player, shopType) {
    var items = getAvailableItems(player, shopType);
    return items.length;
}

// Function to check if an item is a valid item
function isValidItem(items, itemstock) {
    var item = itemstock.item;
    for (var i = 0; i < items.length; i++) {
        if (items[i].id === item) {
            // tellPlayer(player, "Item: " + item + " is valid!");
            return true;
        }
    }
    // tellPlayer(player, "Item: " + item + " is not valid!");
    return false;
}

// Function to get a list of items for "based_on_market" item list types
function getBasedOnMarketItems(player, marketName) {
    var pathToJson = NPC_MARKET_DATA_JSON_PATH + marketName + ".json";
    // tellPlayer(player, "Path to json: " + pathToJson);
    var market = loadJavaJson(pathToJson);
    if (!market) {
        tellPlayer(player, "&cMarket not found!");
        return;
    }

    // tellPlayer(player, "Market: " + marketName);

    var items = [];

    // Get the "TraderCurrency" object
    var traderCurrency = market["TraderCurrency"]["NpcMiscInv"];
    var TraderSold = market["TraderSold"]["NpcMiscInv"];
    var extracted_data = {};

    for (var i = 0; i < 18; i++) {
        // tellPlayer(player, "Scanning item " + i + " in market " + marketName);
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
        // tellPlayer(player, "input 1: " + item_1);
        // tellPlayer(player, "input 2: " + item_2);
        // tellPlayer(player, "output: " + JSON.stringify(item_3));

        extracted_data[i] = {
            item_1: item_1,
            mult_1: mult_1,
            item_2: item_2,
            mult_2: mult_2,
            item_3: item_3
        };

        // tellPlayer(player, "Extracted data: " + JSON.stringify(extracted_data));
    }

    // loop through the "extracted_data" object
    for (var key in extracted_data) {
        var final_item = {};

        // tellPlayer(player, "Key from extracted data: " + key);

        var item = extracted_data[key];
        if (item.item_3) {
            var id = item.item_3.id + ":" + item.item_3.Damage;
            var count = item.item_3.Count;

            // in "tag"
            if (item.item_3.tag) {
                final_item.tag = item.item_3.tag;
            }

            // tellPlayer(player, "Item: " + id + ", Count: " + count);
        }

        var value_1 = 0;
        var value_2 = 0;
        if (item.item_1) {
            // tellPlayer(player, "Item input 1 is currency: " + JSON.stringify(item.item_1));
            value_1 = item.item_1;
            value_1 = value_1.replace(/§e/g, "");
            if (value_1.indexOf("G") !== -1) {
                value_1 = value_1.replace("G", "");
                // tellPlayer(player, "Value 1: " + value_1);
                // convert to int
                value_1 = parseInt(value_1);
                value_1 *= 100;
            } else if (value_1.indexOf("C") !== -1) {
                value_1 = value_1.replace("C", "");
                // tellPlayer(player, "Value 1: " + value_1);
                // convert to int
                value_1 = parseInt(value_1);
            }
            value_1 *= item.mult_1;
            // tellPlayer(player, "Value 1: " + value_1);
        }
        if (item.item_2) {
            // tellPlayer(player, "Item input 2 is currency: " + JSON.stringify(item.item_2));
            value_2 = item.item_2;
            value_2 = value_2.replace(/§e/g, "");
            if (value_2.indexOf("G") !== -1) {
                value_2 = value_2.replace("G", "");
                // tellPlayer(player, "Value 2: " + value_2);
                // convert to int
                value_2 = parseInt(value_2);
                value_2 *= 100;
            } else if (value_2.indexOf("C") !== -1) {
                value_2 = value_2.replace("C", "");
                // tellPlayer(player, "Value 2: " + value_2);
                // convert to int
                value_2 = parseInt(value_2);
            }
            value_2 *= item.mult_2;
            // tellPlayer(player, "Value 2: " + value_2);
        }

        var final_value = value_1 + value_2;
        final_value = final_value / count;

        if (final_value > 0) {
            final_item.id = id;
            final_item.value = final_value;

            items.push(final_item);

            // tellPlayer(player, "Item: " + final_item.id + ", Value: " + final_item.value);
        }
    }

    return items;
}

function evalHandItem(player) {
    var itemstack = player.getMainhandItem();
    if (itemstack.isEmpty()) {
        tellPlayer(player, "&cYou are not holding any item!");
        return;
    }

    tellPlayer(player, "Itemstack data: " + itemstack.getItemNbt().toJsonString());
}

function putMoneyInShop(player, shopId, playerShops) {
    tellPlayer(player, "&aPutting money in shop &e" + shopId);
    var shop = playerShops[shopId];
    var totalMoney = 0;

    totalMoney += getMoneyFromPlayerInventory(player, world);

    if (totalMoney > 0) {
        shop.finances.stored_cash += totalMoney;
        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aSuccessfully added &r:money:&e" + getAmountCoin(totalMoney) + " &ato shop &e" + shopId);
    } else {
        tellPlayer(player, "&cNo money found in your inventory!");
    }
}

function takeMoneyFromShop(player, shopId, value, playerShops) {
    var shop = playerShops[shopId];
    if (shop.finances.stored_cash < value) {
        tellPlayer(player, "&cNot enough money in the shop's inventory!");
        return;
    }

    shop.finances.stored_cash -= value;
    var moneyItems = generateMoney(world, value, "money");
    for (var i = 0; i < moneyItems.length; i++) {
        player.giveItem(moneyItems[i]);
    }

    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    tellPlayer(player, "&aSuccessfully took &r:money:&e" + getAmountCoin(value) + " &afrom shop &e" + shopId);
}

function removeOutdatedListedItems(player, shop, newType) {
    var availableItems = getAvailableItems(player, newType);

    for (var itemId in shop.inventory.listed_items) {
        var found = false;
        for (var i = 0; i < availableItems.length; i++) {
            if (itemId === availableItems[i].id) {
                found = true;
                break;
            }
        }
        if (!found) {
            delete shop.inventory.listed_items[itemId];
        }
    }
}

function putMoneyInShopFromPouch(player, shopId, value, playerShops) {
    if (getMoneyFromPlayerPouch(player, value)) {
        var shop = playerShops[shopId];
        shop.finances.stored_cash += value;
        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aSuccessfully added &r:money:&e" + getAmountCoin(value) + " &ato shop &e" + shopId);
    } else {
        tellPlayer(player, "&cNot enough money in your pouch!");
    }
}

function takeMoneyFromShopToPouch(player, shopId, value, playerShops) {
    var shop = playerShops[shopId];
    if (shop.finances.stored_cash < value) {
        tellPlayer(player, "&cNot enough money in the shop's inventory!");
        return;
    }

    shop.finances.stored_cash -= value;
    if (addMoneyToPlayerPouch(player, value)) {
        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aSuccessfully took &r:money:&e" + getAmountCoin(value) + " &afrom shop &e" + shopId);
    } else {
        tellPlayer(player, "&cFailed to add money to your pouch!");
    }
}

function addShopReputation(player, shopId, amount, playerShops) {
    var shop = playerShops[shopId];
    shop.reputation_data.reputation += amount;
    addReputationHistoryEntry(shop, amount > 0 ? "Reputation added through command" : "Reputation removed through command", amount);
    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    tellPlayer(player, "&aShop reputation updated!");
}

function addReputationHistoryEntry(shop, reason, amount) {
    var entry = {
        time: new Date().toISOString(),
        reason: reason,
        amount: amount,
        reputation: shop.reputation_data.reputation
    };
    shop.reputation_data.reputation_history.push(entry);
}

function logShopReputation(player, shopId, hours, playerShops) {
    var shop = playerShops[shopId];
    var currentReputation = shop.reputation_data.reputation;
    var reputationAgo = getReputationAgo(player, shop, hours);

    if (reputationAgo === null) {
        tellPlayer(player, "&cShop not old enough to have data.");
        return;
    }

    var changePercent = calculateReputationChangePercent(reputationAgo, currentReputation);
    tellPlayer(player, "&aCurrent reputation: &e" + currentReputation);
    tellPlayer(player, "&aReputation change in the last " + hours + " hours: &e" + changePercent + "%");
}

function getReputationAgo(player, shop, hours) {
    var now = new Date();
    var timeAgo = new Date(now.getTime() - hours * 60 * 60 * 1000);

    for (var i = shop.reputation_data.reputation_history.length - 1; i >= 0; i--) {
        var entry = shop.reputation_data.reputation_history[i];
        var entryTime = new Date(entry.time);
        if (entryTime <= timeAgo) {
            // tellPlayer(player, "&cEntry time: " + entryTime);
            // tellPlayer(player, "&cTime ago: " + timeAgo);
            // tellPlayer(player, "&cEntry reputation: " + entry.reputation);
            return entry.reputation;
        }
    }

    return null;
}

function calculateReputationChangePercent(oldReputation, newReputation) {
    return Math.round(((newReputation - oldReputation) / oldReputation) * 10000) / 100;
}

function evalShopReputation(player, shopId, playerShops) {
    var shop = playerShops[shopId];
    var currentReputation = shop.reputation_data.reputation;
    tellPlayer(player, "&aCurrent reputation: &e" + currentReputation);

    var region = shop.property.region;
    var subRegion = shop.property.sub_region;
    var shopType = shop.shop.type;

    var demandMultiplier = getRegionalDemandMultiplier(region, subRegion);
    var shopTypeDemand = getDemandForShopType(region, subRegion, shopType);
    var wealthLevel = getWealthLevel(region, subRegion);
    var competitorCount = getCompetitorShopCount(region, subRegion, shopType, playerShops);
    var bulkMultiplier = getBulkPurchaseMultiplier(region, subRegion);

    tellPlayer(player, "&aRegional demand multiplier: &e" + demandMultiplier);
    tellPlayer(player, "&aDemand for shop type: &e" + shopTypeDemand);
    tellPlayer(player, "&aWealth level of the region: &e" + wealthLevel);
    tellPlayer(player, "&aCompetitor shop count: &e" + competitorCount);
    tellPlayer(player, "&aBulk purchase multiplier: &e" + bulkMultiplier);

    var listedItems = shop.inventory.listed_items;
    for (var itemId in listedItems) {
        var listedItem = listedItems[itemId];
        var referencePrice = getReferencePrice(player, itemId, listedItem.tag, shop.shop.type);
        var referencePriceAtListing = listedItem.reference_price;
        var margin = calculateMargin(referencePrice, listedItem.price);
        var stockCount = shop.inventory.stock[itemId] ? shop.inventory.stock[itemId].count : 0;

        tellPlayer(player, "&aItem: &e" + itemId);
        tellPlayer(player, "&aReference price: &e" + getAmountCoin(referencePrice));
        tellPlayer(player, "&aReference price at listing: &e" + getAmountCoin(referencePriceAtListing));
        tellPlayer(player, "&aListed price: &e" + getAmountCoin(listedItem.price));
        tellPlayer(player, "&aMargin: &e" + margin + "%");
        tellPlayer(player, "&aStock count: &e" + stockCount);
    }
}

function calculateShopScore(player, shopId, playerShops) {
    var shop = playerShops[shopId];
    var currentReputation = shop.reputation_data.reputation;

    // Logarithmic Reputation Scaling
    var scaledReputation = 500 / (Math.log(currentReputation + 10) / Math.log(2));

    // Regional Factors
    var region = shop.property.region;
    var subRegion = shop.property.sub_region;
    var shopType = shop.shop.type;

    var demandMultiplier = getRegionalDemandMultiplier(region, subRegion);
    var shopTypeDemand = getDemandForShopType(region, subRegion, shopType);
    var wealthLevel = getWealthLevel(region, subRegion);
    var competitorCount = getCompetitorShopCount(region, subRegion, shopType, playerShops);

    // Pricing Score Calculation
    var totalPricingScore = 0;
    var totalItems = 0;

    var listedItems = shop.inventory.listed_items;
    var totalStockValue = 0;
    var expectedStockValue = 0; // Placeholder for an ideal value per shop type

    for (var itemId in listedItems) {
        var listedItem = listedItems[itemId];
        var referencePrice = getReferencePrice(player, itemId, listedItem.tag, shop.shop.type);
        var listedPrice = listedItem.price;
        var stockCount = shop.inventory.stock[itemId] ? shop.inventory.stock[itemId].count : 0;

        // Pricing Score
        var priceRatio = listedPrice / referencePrice;
        var itemPricingScore = Math.max(0, 100 - Math.abs(priceRatio - 1) * 100);

        totalPricingScore += itemPricingScore;
        totalItems++;

        // Bulk value can be removed now, moving on to item count
        totalStockValue += stockCount * listedPrice;
    }

    var pricingScore = totalItems > 0 ? totalPricingScore / totalItems : 50; // Default to 50 if no items listed

    // **New Proportion of Listed Items Score** (replaces bulkValueScore)
    var possibleItemsCount = getPossibleItemsForShopType(shopType); // Returns max items that could be listed for the shop type
    var listedItemProportion = totalItems / possibleItemsCount;
    var listItemProportionScore = Math.min(100, listedItemProportion * 100); // Ensures the score caps at 100%

    // Regional Demand Score
    var demandScore = (shopTypeDemand * wealthLevel * demandMultiplier) / (competitorCount || 1);

    // Weighted Score Calculation
    var W1 = 0.4, W2 = 0.3, W3 = 0.2, W4 = 0.1; // Weights for each factor
    var shopScore = (W1 * scaledReputation) + (W2 * pricingScore) + (W3 * listItemProportionScore) + (W4 * demandScore);

    // Feedback Message
    var feedback = "";
    if (shopScore > 80) feedback = "Your shop is thriving! Keep up the great work!";
    else if (shopScore > 60) feedback = "Your shop is doing well, but there's room for optimization.";
    else if (shopScore > 40) feedback = "Your shop is struggling. Check pricing and stock variety.";
    else feedback = "Your shop is failing! Consider adjusting prices, stock, and reputation strategies.";

    // Display Results
    tellPlayer(player, "&aShop Score: &e" + shopScore.toFixed(2));
    tellPlayer(player, "&aFeedback: &e" + feedback);
}



