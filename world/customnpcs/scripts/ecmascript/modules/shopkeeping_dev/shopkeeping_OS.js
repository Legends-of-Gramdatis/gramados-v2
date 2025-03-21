var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

var SERVER_SHOPS_JSON_PATH = "world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/server_shops.json";
var SHOP_CATEGORIES_JSON_PATH = "world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shop_categories.json";
var REGIONAL_DEMAND_JSON_PATH = "world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/regional_demand.json";
var UPGRADES_JSON_PATH = "world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shop_upgrades.json";

var STOCK_EXCHANGE_DATA_JSON_PATH = "world/customnpcs/scripts/stock_exchange.json"
var NPC_MARKET_DATA_JSON_PATH = "world/customnpcs/markets/"

var world = API.getIWorld(0);

load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shopkeeping_utils.js")
load("world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shopkeeping_stockroom.js")
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js")
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js")
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js');
load("world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shopkeeping_grading.js")
load("world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shopkeeping_upgrades.js")
load("world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shopkeeping_permissions.js")
load("world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shopkeeping_world.js")
load("world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shopkeeping_attributes.js")

/**
 * Initializes the shopkeeping system.
 * @param {Object} event - The event object.
 */
function init(event) {
    var player = event.player;
    if (!checkFileExists(SERVER_SHOPS_JSON_PATH)) {
        world.broadcast("&cNo shop data found! Contact an admin!");
        return;
    }
    updateStockrooms(player);
}

/**
 * Handles chat commands related to shopkeeping.
 * @param {Object} event - The chat event object.
 */
function chat(event) {
    var player = event.player;
    var message = event.message;
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);

    if (!playerShops) {
        world.broadcast("&cAn error occurred while loading shop data! Contact an admin!");
        return;
    }

    if (message.startsWith("$shop")) {
        handleShopCommand(player, message, playerShops);
    }
}

/**
 * Handles shopkeeping commands.
 * @param {Object} player - The player.
 * @param {string} message - The chat message.
 * @param {Object} playerShops - The player shops data.
 */
function handleShopCommand(player, message, playerShops) {
    var parts = message.split(" ");
    var command = parts[1];
    var shopId = parseInt(parts[2]);

    if (shopId === undefined || isNaN(shopId)) {
        tellPlayer(player, "&cInvalid shop ID: " + parts[2]);
        return;
    }

    var specified_shop = playerShops[shopId];
    if (!specified_shop) {
        tellPlayer(player, "&cShop with ID &e" + shopId + " &cnot found!");
        return;
    }

    switch (command) {
        case "attribute":
            switch (parts[3]) {
                case "set":
                    if (parts.length < 5) {
                        tellPlayer(player, "&cYou must specify an attribute to set!");
                        tellPlayer(player, "&eUsage: $shop attribute <ID> set [name=<name>] [type=<type>] [region=<region>] [sub_region=<sub_region>] [money=<money>]");
                        tellPlayer(player, "&7Use \"_\" for spaces for the name attribute.");
                        return;
                    }
                    for (var i = 4; i < parts.length; i++) {
                        var property = getProperty(parts[i]);
                        switch (property.propertyName) {
                            case "name":
                                setShopName(player, specified_shop, property.value);
                                break;
                            case "type":
                                setShopType(player, specified_shop, property.value);
                                break;
                            case "region":
                                setShopRegion(player, specified_shop, property.value);
                                break;
                            case "sub_region":
                                setShopSubRegion(player, specified_shop, property.value);
                                break;
                            case "money":
                                setShopMoney(player, specified_shop, property.value);
                                break;
                            default:
                                tellPlayer(player, "&cInvalid attribute: " + property.propertyName);
                                tellPlayer(player, "&eUsage: $shop attribute <ID> set [name=<name>] [type=<type>] [region=<region>] [sub_region=<sub_region>] [money=<money>]");
                                tellPlayer(player, "&7Use \"_\" for spaces for the name attribute.");
                        }
                    }
                    break;
                case "add":
                    if (parts.length < 5) {
                        tellPlayer(player, "&cYou must specify a room type to set!");
                        tellPlayer(player, "&eUsage: $shop attribute <ID> add [stock_room=<stock_room>] [main_room=<main_room>]");
                        return;
                    }
                    for (var i = 4; i < parts.length; i++) {
                        var property = getProperty(parts[i]);
                        switch (property.propertyName) {
                            case "stock_room":
                                addRoom(player, specified_shop, "stock_room", property.value);
                                break;
                            case "main_room":
                                addRoom(player, specified_shop, "main_room", property.value);
                                break;
                            default:
                                tellPlayer(player, "&cInvalid room type: " + property.propertyName);
                                tellPlayer(player, "&eUsage: $shop attribute <ID> add [stock_room=<stock_room>] [main_room=<main_room>]");
                        }
                    }
                    break;
                case "remove":
                    if (parts.length < 5) {
                        tellPlayer(player, "&cYou must specify a room type to remove cuboid from!");
                        tellPlayer(player, "&eUsage: $shop attribute <ID> remove [stock_room=<stock_room_index_or_name>] [main_room=<main_room_index_or_name>]");
                        return;
                    }
                    for (var i = 4; i < parts.length; i++) {
                        var property = getProperty(parts[i]);
                        if (property.propertyName === "stock_room" || property.propertyName === "main_room") {
                            removeRoom(player, specified_shop, property.propertyName, property.value);
                        } else {
                            tellPlayer(player, "&cInvalid room type: " + property.propertyName);
                            tellPlayer(player, "&eUsage: $shop attribute <ID> remove [stock_room=<stock_room_index_or_name>] [main_room=<main_room_index_or_name>]");
                        }
                    }
                    break;
                case undefined:
                    tellPlayer(player, "&cYou must specify a attribute command!");
                    tellPlayer(player, "&eUsage: $shop attribute <set|add|remove> <attributename=value>");
                    break;
                default:
                    tellPlayer(player, "&cInvalid attribute command: " + parts[3]);
            }
            break;
        default:
            tellPlayer(player, "&cInvalid shop command: " + command);
    }

    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);

}

/**
 * Opens a shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop to open.
 * @param {Object} serverShops - The server shops data.
 * @returns {boolean} - True if the shop was opened successfully, false otherwise.
 */
function openShop(player, shopId, serverShops) {
    var shop = serverShops[shopId];
    if (!shop) {
        tellPlayer(player, "&cShop with ID &e" + shopId + " &cnot found!");
        return false;
    }

    if (!hasPermission(player.getName(), shop, PERMISSION_OPEN_CLOSE_SHOP)) {
        tellPlayer(player, "&cYou don't have permission to open this shop!");
        tellPlayer(player, "&7Your current roles: &e" + getPlayerRolesFromShop(player.getName(), shop));
        return false;
    }
    // Check integrity
    if (
        ensureShopExists(player, shopId, serverShops) &&
        ensureShopDataComplete(player, shopId, serverShops, true).valid
    ) {
        var shopData = serverShops[shopId];

        // Check if shop is closed
        if (shopData.shop.is_open) {
            tellPlayer(player, "&cShop is already open!");
            return false;
        }

        // Check if player has another shop of similar type and region/subregion open
        var playerShops = listShops(player, shopData.roles.owner, serverShops);
        if (playerShops.length === 0) {
            tellPlayer(player, "&cShop owner doesn't have any shops!");
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
                tellPlayer(player, "&cThe owner already has a shop of the same type and region/subregion open!");
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

/**
 * Closes a shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop to close.
 * @returns {boolean} - True if the shop was closed successfully, false otherwise.
 */
function closeShop(player, shopId) {
    var serverShops = loadJson(SERVER_SHOPS_JSON_PATH);
    var shop = serverShops[shopId];
    if (!shop) {
        tellPlayer(player, "&cShop with ID &e" + shopId + " &cnot found!");
        return false;
    }
    
    if (!hasPermission(player.getName(), shop, PERMISSION_OPEN_CLOSE_SHOP)) {
        tellPlayer(player, "&cYou don't have permission to close this shop!");
        return false;
    }
    // Check integrity
    if (ensureShopExists(player, shopId, serverShops)) {
        var shopData = serverShops[shopId];

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

/**
 * Creates a new shop.
 * @param {IPlayer} player - The player.
 * @param {string} type - The type of the shop.
 * @param {string} region - The region of the shop.
 * @param {string} sub_region - The sub-region of the shop.
 * @param {string} display_name - The display name of the shop.
 * @param {number} money - The initial money for the shop.
 */
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
            owner: [player.getName()]
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
        upgrades: [],
        real_estate: {
            sale_price: 0,
            is_for_sale: false,
            last_sold_date: 0,
            commercial_premises_value: 0
        }
    };

    saveJson(serverShops, SERVER_SHOPS_JSON_PATH);

    // Initialize stock room if type is specified
    if (type) {
        initStockRoom(player, shopId, serverShops);
    }
}

/**
 * Deletes a shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop to delete.
 */
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

/**
 * Displays information about a shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop.
 */
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

/**
 * Sets the price of an item in the shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop.
 * @param {string|number} itemIdOrIndex - The item ID or index.
 * @param {string} profit - The profit margin.
 * @param {Object} playerShops - The player shops data.
 */
function setPrice(player, shopId, itemIdOrIndex, profit, playerShops) {
    var shop = playerShops[shopId];
    if (!shop) {
        tellPlayer(player, "&cShop with ID &e" + shopId + " &cnot found!");
        return;
    }

    if (!hasPermission(player.getName(), shop, PERMISSION_SET_PRICES)) {
        tellPlayer(player, "&cYou don't have permission to set prices for this shop!");
        return;
    }
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

    var referencePrice = getReferencePrice(player, itemIdOrIndex, itemTag);
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

/**
 * Gets shop information from the ID.
 * @param {number} shopId - The ID of the shop.
 * @returns {Object|null} - The shop data or null if not found.
 */
function getShopFromID(shopId) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    return playerShops ? playerShops[shopId] : null;
}

/**
 * Parses a property string into an object.
 * @param {string} string - The property string (propertyname=value).
 * @returns {Object} - The parsed property object.
 */
function getProperty(string) {
    var parts = string.split("=");
    var propertyName = parts[0];
    var value = sanitizeString(parts[1]);
    return { propertyName: propertyName, value: value };
}

/**
 * Gets the items held in the player's hand.
 * @param {IPlayer} player - The player.
 * @returns {Object} - The item stack data.
 */
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

/**
 * Gets the list of available items for a shop type.
 * @param {IPlayer} player - The player.
 * @param {string} shopType - The type of the shop.
 * @returns {Array} - The list of available items.
 */
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

                    var basedOnMarketItems = getBasedOnMarketItems(player, entry.based_on_market[j], shopType);
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

/**
 * Gets the possible items for a shop type.
 * @param {IPlayer} player - The player.
 * @param {string} shopType - The type of the shop.
 * @returns {number} - The number of possible items.
 */
function getPossibleItemsForShopType(player, shopType) {
    var items = getAvailableItems(player, shopType);
    return items.length;
}

/**
 * Checks if an item is valid.
 * @param {Array} items - The list of items.
 * @param {Object} itemstock - The item stock data.
 * @returns {boolean} - True if the item is valid, false otherwise.
 */
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

/**
 * Gets the list of items for a "based_on_market" item list type.
 * @param {IPlayer} player - The player.
 * @param {string} marketName - The market name.
 * @param {string} shopType - The type of the shop.
 * @returns {Array} - The list of items.
 */
function getBasedOnMarketItems(player, marketName, shopType) {
    var pathToJson = NPC_MARKET_DATA_JSON_PATH + marketName + ".json";
    var market = loadJavaJson(pathToJson);
    if (!market) {
        tellPlayer(player, "&cMarket not found!");
        return;
    }

    var shop_category = getCategoryJson(shopType)
    var markup = shop_category.general_ref.base_markup;
    markup = markup / 100;
    // tellPlayer(player, "&6In getBasedOnMarketItems, markup: " + markup + ", shopType: " + shopType + ", marketName: " + marketName);

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

    var globalPrices = loadJson(GLOBAL_PRICES_JSON_PATH);
    if (!globalPrices) {
        tellPlayer(player, "&cGlobal prices not found!");
        return;
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
        final_value /= count;
        // tellPlayer(player, "&6Final value: " + final_value + ", after markup");
        final_value /= (1 + markup);
        // tellPlayer(player, "&6Final value: " + final_value + ", before markup: Fabrication cost");

        if (final_value > 0) {
            final_item.id = id;
            final_item.value = final_value;

            items.push(final_item);

            // Update global prices if the item is not already present
            if (!globalPrices[final_item.id]) {
                globalPrices[final_item.id] = {
                    display_name: final_item.id.split(":")[1],
                    value: Math.floor(final_item.value)
                };
            }
        }
    }

    // Save the updated global prices
    saveJson(globalPrices, GLOBAL_PRICES_JSON_PATH);

    return items;
}

/**
 * Evaluates the item held in the player's hand.
 * @param {IPlayer} player - The player.
 */
function evalHandItem(player) {
    var itemstack = player.getMainhandItem();
    if (itemstack.isEmpty()) {
        tellPlayer(player, "&cYou are not holding any item!");
        return;
    }

    tellPlayer(player, "Itemstack data: " + itemstack.getItemNbt().toJsonString());
}

/**
 * Puts money into a shop from the player's inventory.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop.
 * @param {Object} playerShops - The player shops data.
 */
function putMoneyInShop(player, shopId, playerShops) {
    var shop = playerShops[shopId];
    if (!shop) {
        tellPlayer(player, "&cShop with ID &e" + shopId + " &cnot found!");
        return;
    }
    if (!hasPermission(player.getName(), shop, PERMISSION_TAKE_MONEY)) {
        tellPlayer(player, "&cYou don't have permission to put money in this shop!");
        return;
    }
    tellPlayer(player, "&aPutting money in shop &e" + shopId);
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

/**
 * Takes money from a shop and gives it to the player.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop.
 * @param {number} value - The amount of money to take.
 * @param {Object} playerShops - The player shops data.
 */
function takeMoneyFromShop(player, shopId, value, playerShops) {
    var shop = playerShops[shopId];
    if (!shop) {
        tellPlayer(player, "&cShop with ID &e" + shopId + " &cnot found!");
        return;
    }
    if (!hasPermission(player.getName(), shop, PERMISSION_TAKE_MONEY)) {
        tellPlayer(player, "&cYou don't have permission to take money from this shop!");
        return;
    }
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

/**
 * Puts money into a shop from the player's pouch.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop.
 * @param {number} value - The amount of money to put.
 * @param {Object} playerShops - The player shops data.
 */
function putMoneyInShopFromPouch(player, shopId, value, playerShops) {
    var shop = playerShops[shopId];
    if (!shop) {
        tellPlayer(player, "&cShop with ID &e" + shopId + " &cnot found!");
        return;
    }
    if (!hasPermission(player.getName(), shop, PERMISSION_TAKE_MONEY)) {
        tellPlayer(player, "&cYou don't have permission to put money in this shop!");
        return;
    }
    if (getMoneyFromPlayerPouch(player, value)) {
        shop.finances.stored_cash += value;
        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aSuccessfully added &r:money:&e" + getAmountCoin(value) + " &ato shop &e" + shopId);
    } else {
        tellPlayer(player, "&cNot enough money in your pouch!");
    }
}

/**
 * Takes money from a shop and puts it into the player's pouch.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop.
 * @param {number} value - The amount of money to take.
 * @param {Object} playerShops - The player shops data.
 */
function takeMoneyFromShopToPouch(player, shopId, value, playerShops) {
    var shop = playerShops[shopId];
    if (!shop) {
        tellPlayer(player, "&cShop with ID &e" + shopId + " &cnot found!");
        return;
    }
    if (!hasPermission(player.getName(), shop, PERMISSION_TAKE_MONEY)) {
        tellPlayer(player, "&cYou don't have permission to take money from this shop!");
        return;
    }
    var shop = playerShops[shopId];
    if (shop.finances.stored_cash < value) {
        tellPlayer(player, "&cNot enough money in the shop's inventory!");
        return;
    }

    shop.finances.stored_cash -= value;
    if (addMoneyToCurrentPlayerPouch(player, value)) {
        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aSuccessfully took &r:money:&e" + getAmountCoin(value) + " &afrom shop &e" + shopId);
    } else {
        tellPlayer(player, "&cFailed to add money to your pouch!");
    }
}

/**
 * Adds reputation to a shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop.
 * @param {number} amount - The amount of reputation to add.
 * @param {Object} playerShops - The player shops data.
 */
function addShopReputation(player, shopId, amount, playerShops) {
    var shop = playerShops[shopId];
    shop.reputation_data.reputation += amount;
    addReputationHistoryEntry(shop, amount > 0 ? "Reputation added through command" : "Reputation removed through command", amount);
    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    tellPlayer(player, "&aShop reputation updated!");
}

/**
 * Adds a reputation history entry to a shop.
 * @param {Object} shop - The shop data.
 * @param {string} reason - The reason for the reputation change.
 * @param {number} amount - The amount of reputation change.
 */
function addReputationHistoryEntry(shop, reason, amount) {
    var entry = {
        time: new Date().toISOString(),
        reason: reason,
        amount: amount,
        reputation: shop.reputation_data.reputation
    };
    shop.reputation_data.reputation_history.push(entry);
}

/**
 * Logs the reputation of a shop over a period of time.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop.
 * @param {number} hours - The number of hours to log.
 * @param {Object} playerShops - The player shops data.
 */
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

/**
 * Gets the reputation of a shop from a certain time ago.
 * @param {IPlayer} player - The player.
 * @param {Object} shop - The shop data.
 * @param {number} hours - The number of hours ago.
 * @returns {number|null} - The reputation from the specified time ago, or null if not found.
 */
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

/**
 * Calculates the percentage change in reputation.
 * @param {number} oldReputation - The old reputation value.
 * @param {number} newReputation - The new reputation value.
 * @returns {number} - The percentage change in reputation.
 */
function calculateReputationChangePercent(oldReputation, newReputation) {
    return Math.round(((newReputation - oldReputation) / oldReputation) * 10000) / 100;
}

/**
 * Buys a shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop.
 * @param {string} buyerName - The name of the buyer.
 * @param {Object} playerShops - The player shops data.
 */
function buyShop(player, shopId, buyerName, playerShops) {
    if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
        tellPlayer(player, "&cInvalid shop ID: &e" + shopId);
        return;
    }

    var shop = playerShops[shopId];
    if (!shop.real_estate.is_for_sale) {
        tellPlayer(player, "&cShop &e" + shopId + " &cis not for sale!");
        return;
    }

    if (shop.roles.owner === buyerName) {
        tellPlayer(player, "&cYou can't buy a shop you are selling!");
        return;
    }

    var seller = shop.roles.owner;

    var salePrice = shop.real_estate.sale_price;
    var buyer = world.getPlayer(buyerName);
    if (!buyer) {
        tellPlayer(player, "&cBuyer &e" + buyerName + " &cis not online!");
        return;
    }

    if (!getMoneyFromPlayerPouch(buyer, salePrice)) {
        tellPlayer(player, "&cBuyer &e" + buyerName + " &cdoes not have enough money! Sale price: &r:money:&e" + getAmountCoin(salePrice));
        return;
    }

    // Transfer ownership of regions
    var regions = getShopRegions(player, array_merge(shop.property.stock_room, shop.property.main_room));
    for (var i = 0; i < regions.length; i++) {
        transferRegion(player.getName(), regions[i], buyerName);
    }

    // Give money to the seller
    addMoneyToPlayerPouchByName(seller, salePrice);

    // Decrease reputation by 10%
    var originalReputation = 100;
    var currentReputation = shop.reputation_data.reputation;
    var reputationDecrease = (currentReputation - originalReputation) * 0.1;
    shop.reputation_data.reputation -= reputationDecrease;

    shop.roles.owner = buyerName;
    shop.real_estate.is_for_sale = false;
    shop.real_estate.last_sold_date = world.getTotalTime();
    shop.real_estate.commercial_premises_value = getPremisesValue(player, regions);
    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);

    tellPlayer(player, "&aShop &e" + shopId + " &ahas been sold to &e" + buyerName);
    tellPlayer(buyer, "&aYou have bought shop &e" + shopId + " &afor &r:money:&e" + getAmountCoin(salePrice));
    tellPlayer(buyer, "&7Note: The shop's reputation has decreased by &e10%&7.");
}

/**
 * Sells a shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop.
 * @param {string} salePrice - The sale price of the shop.
 * @param {Object} playerShops - The player shops data.
 */
function sellShop(player, shopId, salePrice, playerShops) {
    if (!hasPermission(player.getName(), shop, PERMISSION_SELL_SHOP)) {
        tellPlayer(player, "&cYou don't have permission to sell this shop!");
        return;
    }

    if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
        tellPlayer(player, "&cInvalid shop ID: &e" + args[2]);
        return;
    }

    var shop = playerShops[shopId];
    if (shop.real_estate.is_for_sale) {
        if (salePrice.toLowerCase() === "cancel") {
            shop.real_estate.is_for_sale = false;
            saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
            tellPlayer(player, "&aShop &e" + shopId + " &ais no longer for sale.");
            return;
        } else if (salePrice.toLowerCase() === "info") {
            tellPlayer(player, "&aShop &e" + shopId + " &ais for sale at &r:money:&e" + getAmountCoin(shop.real_estate.sale_price));
            return;
        }
    }

    var regionValue = getPremisesValue(player, getShopRegions(player, array_merge(shop.property.stock_room, shop.property.main_room)));
    if (salePrice < (regionValue + shop.finances.stored_cash)) {
        tellPlayer(player, "&cSale price must be at least &r:money:&e" + getAmountCoin(regionValue + shop.finances.stored_cash));
        if (shop.finances.stored_cash > 0) {
            tellPlayer(player, "&cCurrent stored cash in shop: &r:money:&e" + getAmountCoin(shop.finances.stored_cash));
        }
        return;
    }

    var currentTime = world.getTotalTime();
    if (currentTime - shop.real_estate.last_sold_date < 7 * 24 * 60 * 60 * 20) {
        tellPlayer(player, "&cYou cannot sell this shop within 1 week of buying it!");
        return;
    }

    shop.real_estate.sale_price = getCoinAmount(salePrice);
    shop.real_estate.is_for_sale = true;
    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    tellPlayer(player, "&aShop &e" + shopId + " &ais now for sale at &r:money:&e" + getAmountCoin(salePrice));
    tellPlayer(player, "&7Note: If a player buys this shop, its reputation will &edecrease &7by &e10%&7.");
}

/**
 * Handles the "$shop stat consumer flow" command.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player shops data.
 */
function handleShopStatConsumerFlow(player, shopId, playerShops) {
    try {
        var consumerData = getDailyConsumersForShop(player, shopId, playerShops);

        tellPlayer(player, "&aShop ID: &e" + consumerData.shopId);
        tellPlayer(player, "&aMain Room Size: &e" + consumerData.mainRoomSize + " m²");
        tellPlayer(player, "&aShop Rating: &e" + consumerData.shopRating + "/100");
        tellPlayer(player, "&aCustomer Flow Multiplier: &e" + consumerData.customerFlowMultiplier.toFixed(2));
        tellPlayer(player, "&aExpected NPCs in 1 day: &e" + consumerData.dailyConsumers);

        if (consumerData.contributingFactors.length > 0) {
            tellPlayer(player, "&aContributing Factors:");
            for (var i = 0; i < consumerData.contributingFactors.length; i++) {
                var factor = consumerData.contributingFactors[i];
                tellPlayer(player, "&e- " + factor.type + ": &a" + factor.name + " &e(Value: " + factor.value + ")");
            }
        } else {
            tellPlayer(player, "&aNo upgrades or events are currently affecting customer flow.");
        }
    } catch (error) {
        tellPlayer(player, "&c" + error.message);
    }
}

/**
 * Handles the "$shop stat consumer money" command.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player shops data.
 */
function handleShopStatConsumerMoney(player, shopId, playerShops) {
    try {
        tellPlayer(player, "&aShop ID: &e" + shopId);
    } catch (error) {
        tellPlayer(player, "&c" + error.message);
    }
}