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

    if (message.startsWith("$shopop")) {
        handleShopOPCommand(player, message, playerShops);
    } else if (message.startsWith("$shop")) {
        handleShopCommand(player, message, playerShops);
    }
}

/**
 * Handles OP shopkeeping commands.
 * @param {IPlayer} player - The player.
 * @param {string} message - The chat message.
 * @param {Object} playerShops - The player shops data.
 */
function handleShopOPCommand(player, message, playerShops) {
    var parts = message.split(" ");
    var command = parts[1];

    switch (command) {
        // $shopop delete <ID>
        // $shopop create name=<name> type=<type> region=<region> sub_region=<sub_region> [money=<money>]
        case "create":
            var name = null;
            var type = null;
            var region = null;
            var sub_region = null;
            var money = null;

            for (var i = 2; i < parts.length; i++) {
                var property = getProperty(parts[i]);
                switch (property.propertyName) {
                    case "name":
                        name = property.value;
                        break;
                    case "type":
                        type = property.value;
                        break;
                    case "region":
                        region = property.value;
                        break;
                    case "sub_region":
                        sub_region = property.value;
                        break;
                    case "money":
                        money = parseInt(property.value);
                        break;
                    default:
                        tellPlayer(player, "&cInvalid property: " + property.propertyName);
                        tellPlayer(player, "&eUsage: $shopop create name=<name> type=<type> region=<region> sub_region=<sub_region> [money=<money>]");
                }
            }

            createShop(player, playerShops, type, region, sub_region, name, money);
            tellPlayer(player, "&aShop created!");
            break;
        case "delete":
            var shopId = parseInt(parts[2]);
            deleteShop(player, shopId, playerShops);
            break;

        default:
            tellPlayer(player, "&cInvalid shopop command: " + command);
    }

    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
}

/**
 * Handles shopkeeping commands.
 * @param {IPlayer} player - The player.
 * @param {string} message - The chat message.
 * @param {Object} playerShops - The player shops data.
 */
function handleShopCommand(player, message, playerShops) {
    var parts = message.split(" ");
    var command = parts[1];
    var shopId = parseInt(parts[2]);

    if (command === undefined) {
        tellPlayer(player, "&cYou must specify a shop command!");
        tellPlayer(player, "&eUsage: $shop <ID> [open|close|attribute|stock|price|money|reputation|upgrade|event|sell|buy|info|stat]");
        return;
    }

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
        case "open":
            openShop(player, shopId, playerShops);
            break;
        case "close":
            closeShop(player, shopId, playerShops);
            break;
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
        case "stock":
            switch (parts[3]) {
                case "add":
                    // Usage: $shop stock <ID> add or $shop stock <ID> add all
                    // shop stock <ID> add add item from hotbar
                    // shop stock <ID> add all add all items from inventory

                    switch (parts[4]) {
                        case "all":
                            addStockFromInventory(player, specified_shop);
                            break;
                        default:
                            addStockFromHand(player, specified_shop);
                    }
                    break;
                case "remove":
                    // Usage: $shop stock <ID> remove <itemID> or $shop stock <ID> remove <itemIndex> or $shop stock <ID> remove all
                    // shop stock <ID> remove <itemID> remove item by ID
                    // shop stock <ID> remove <itemIndex> remove item by index
                    // shop stock <ID> remove all remove all items
                    switch (parts[4]) {
                        case "all":
                            removeAllStock(player, specified_shop);
                            break;
                        default:
                            removeStock(player, specified_shop, parts[4], parts.length === 6 ? parseInt(parts[5]) : 64);
                    }
                    break;
                case "info":
                    switch (parts[4]) {
                        case "items":
                            listShopStock(player, specified_shop, true);
                            break;
                        default:
                            listShopStock(player, specified_shop, false);
                    }
                    break;
                // case "eval":
                //     evalHandItem(player);
                //     break;
                default:
                    tellPlayer(player, "&cInvalid stock command: " + parts[3]);
                    tellPlayer(player, "&eUsage: $shop stock <ID> [add|remove|info]");
            }
            break;
        case "price":
            // $shop price <ID> set <itemID OR item index> <profit>
            // $shop price <ID> list
            // $shop price <ID> remove <itemID OR item index>
            // $shop price <ID> default <percentage>
            switch (parts[3]) {
                case "set":
                    // $shop price <ID> set <itemID OR item index> <profit|"default">
                    switch (parts[5]) {
                        case "default":
                            setPrice(player, specified_shop, parts[4], getShopDefaultMarginPercent(player, specified_shop));
                            break;
                        default:
                            setPrice(player, specified_shop, parts[4], parts[5]);
                    }
                    break;
                case "list":
                    listShopPrices(player, specified_shop);
                    break;
                case "remove":
                    removeListedItem(player, specified_shop, parts[4]);
                    break;
                case "default":
                    // $shop price default <shopID> <percentage>
                    setShopDefaultMarginPercent(player, specified_shop, parts[4]);
                    break;
                default:
                    tellPlayer(player, "&cInvalid price command: " + parts[3]);
                    tellPlayer(player, "&eUsage: $shop price <ID> [set|list|remove|default]");
            }
            break;
        case "money":
            // $shop money <ID> put
            // $shop money <ID> take <amount>
            // $shop money <ID> put pouch <amount>
            // $shop money <ID> take pouch <amount>
            switch (parts[3]) {
                case "put":
                    switch (parts[4]) {
                        case "pouch":
                            putMoneyInShopFromPouch(player, specified_shop, parts[5]);
                            break;
                        default:
                            putMoneyInShop(player, specified_shop);
                    }
                    break;
                case "take":
                    switch (parts[4]) {
                        case "pouch":
                            takeMoneyFromShopToPouch(player, specified_shop, parts[5]);
                            break;
                        default:
                            takeMoneyFromShop(player, specified_shop);
                    }
                    break;
                default:
                    tellPlayer(player, "&cInvalid money command: " + parts[3]);
                    tellPlayer(player, "&eUsage: $shop money <ID> [put|take] [pouch <amount>]");
            }
            break;
        case "reputation":
            // $shop reputation <ID> add <reputation>
            // $shop reputation <ID> remove <reputation>
            // $shop reputation <ID> log
            // $shop reputation <ID> expertise
            switch (parts[3]) {
                case "add":
                    addShopReputation(player, specified_shop, parseInt(parts[4]));
                    break;
                case "remove":
                    addShopReputation(player, specified_shop, parseInt(-parts[4]));
                    break;
                case "log":
                    logShopReputation(player, specified_shop);
                    break;
                case "expertise":
                    calculateShopScore(player, specified_shop, playerShops, true);
                    break;
                default:
                    tellPlayer(player, "&cInvalid reputation command: " + parts[3]);
                    tellPlayer(player, "&eUsage: $shop reputation <ID> [add|remove|log|expertise]");
            }
            break;
        case "type":
            // $shop type <ID> switch <type>
            switch (parts[3]) {
                case "switch":
                    setShopType(player, specified_shop, parts[4]);
                    break;
                default:
                    tellPlayer(player, "&cInvalid type command: " + parts[3]);
                    tellPlayer(player, "&eUsage: $shop type <ID> switch <type>");
            }
            break;
        case "upgrade":
            // $shop upgrade <ID> list all : lists all upgrades from teh server (no shop ID needed)
            // $shop upgrade <ID> list : lists all upgrades and their availability for the shop
            // $shop upgrade <ID> take <upgradeID>
            // $shop upgrade <ID> remove <upgradeID>
            switch (parts[3]) {
                case "list":
                    if (parts[4] === "all") {
                        listAllUpgrades(player);
                    } else {
                        listShopUpgrades(player, specified_shop);
                    }
                    break;
                case "take":
                    takeShopUpgrade(player, specified_shop, parts[4]);
                    break;
                case "remove":
                    removeShopUpgrade(player, specified_shop, parts[4]);
                    break;
                default:
                    tellPlayer(player, "&cInvalid upgrade command: " + parts[3]);
                    tellPlayer(player, "&eUsage: $shop upgrade <ID> [list|take|remove]");
            }
            break;
        case "event":
            // $shop event <ID> list all : lists all events from the server (no shop ID needed)
            // $shop event <ID> list : lists all events and their availability for the shop
            // $shop event <ID> take <eventID>
            // $shop event <ID> remove <eventID>
            switch (parts[3]) {
                case "list":
                    if (parts[4] === "all") {
                        listAllEvents(player);
                    } else {
                        listShopEvents(player, specified_shop);
                    }
                    break;
                case "take":
                    takeShopEvent(player, specified_shop, parts[4]);
                    break;
                case "remove":
                    removeShopEvent(player, specified_shop, parts[4]);
                    break;
                default:
                    tellPlayer(player, "&cInvalid event command: " + parts[3]);
                    tellPlayer(player, "&eUsage: $shop event <ID> [list|take|remove]");
            }
            break;
        case "sell":
            // Sets a shop for sale
            // $shop sell <ID> <price>
            // $shop sell <ID> cancel
            // $shop sell <ID> info
            switch (parts[3]) {
                case "cancel":
                    cancelShopSale(player, specified_shop);
                    break;
                case "info":
                    getShopSaleInfo(player, specified_shop);
                    break;
                default:
                    setShopForSale(player, specified_shop, parts[3]);
            }
            break;
        case "buy":
            // $shop buy <ID> : you buy shop
            // $shop buy <ID> [buyer] : buyer buys shop
            switch (parts[3]) {
                case undefined:
                    buyShop(player, specified_shop, player.getName());
                    break;
                default:
                    buyShop(player, specified_shop, parts[3]);
            }
            break;
        case "info":
            // $shop info <ID>
            // $shop info <ID> item
            switch (parts[3]) {
                case "item":
                    displayShopInfo(player, specified_shop, true);
                    break;
                default:
                    displayShopInfo(player, specified_shop, false);
            }
            break;
        case "stat":
            // $shop stat <ID> daily_consumers
            switch (parts[3]) {
                case "daily_consumers":
                    handleShopStatConsumerFlow(player, specified_shop, playerShops);
                    break;
                default:
                    tellPlayer(player, "&cInvalid stat command: " + parts[3]);
                    tellPlayer(player, "&eUsage: $shop stat <ID> [daily_consumers]");
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
function closeShop(player, shopId, serverShops) {
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
function createShop(player, serverShops, type, region, sub_region, display_name, money) {
    if (!serverShops) {
        tellPlayer(player, "&cNo shop data found! Contact an admin!");
        return;
    }

    var shopId = 1;
    while (serverShops[shopId]) {
        shopId++;
    }

    display_name = convertUnderscore(display_name);

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
            reputation: 100,
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

    // Initialize stock room if type is specified
    if (type) {
        initStockRoom(player, serverShops[shopId]);
    }
}

/**
 * Deletes a shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop to delete.
 */
function deleteShop(player, shopId, serverShops) {
    if (!serverShops) {
        tellPlayer(player, "&cNo shop data found! Contact an admin!");
        return;
    }

    if (!serverShops[shopId]) {
        tellPlayer(player, "&cShop with ID &e" + shopId + " &cnot found!");
        tellPlayer(player, "&eUsage: $shopop delete <ID>");
        return;
    }

    delete serverShops[shopId];
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
 * @param {IPlayer} player - Thea player.
 * @param {number} shopId - The ID of the shop.
 * @param {string|number} itemIdOrIndex - The item ID or index.
 * @param {string} profit - The profit margin.
 * @param {Object} playerShops - The player shops data.
 */
function setPrice(player, shopData, itemIdOrIndex, profit) {

    if (!hasPermission(player.getName(), shopData, PERMISSION_SET_PRICES)) {
        tellPlayer(player, "&cYou don't have permission to set prices for this shop!");
        return;
    }
    var item = null;
    var itemTag = null;

    if (isNaN(itemIdOrIndex)) {
        item = shopData.inventory.stock[itemIdOrIndex];
    } else {
        var index = parseInt(itemIdOrIndex);
        var keys = Object.keys(shopData.inventory.stock);
        if (index >= 0 && index < keys.length) {
            item = shopData.inventory.stock[keys[index]];
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

    shopData.inventory.listed_items[itemIdOrIndex] = {
        price: price,
        reference_price: referencePrice,
        discount: 0,
        sale_count: 0
    };

    if (itemTag) {
        shopData.inventory.listed_items[itemIdOrIndex].tag = itemTag;
    }
    tellPlayer(player, "&aSuccessfully set price for item &e" + itemIdOrIndex + " &ato &r:money:&e" + getAmountCoin(price));
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
                // tellPlayer(player, "&eBased on stocks: ");
                for (var j = 0; j < entry.based_on_stocks.length; j++) {
                    // tellPlayer(player, "&e" + entry.based_on_stocks[j]);

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
function putMoneyInShop(player, shopData) {
    if (!hasPermission(player.getName(), shopData, PERMISSION_TAKE_MONEY)) {
        tellPlayer(player, "&cYou don't have permission to put money in this shop!");
        return;
    }
    tellPlayer(player, "&aPutting money in shop &e" + shopData.shop.display_name);
    var totalMoney = 0;

    totalMoney += getMoneyFromPlayerInventory(player, world);

    if (totalMoney > 0) {
        shopData.finances.stored_cash += totalMoney;
        tellPlayer(player, "&aSuccessfully added &r:money:&e" + getAmountCoin(totalMoney) + " &ato shop &e" + shopData.shop.display_name);
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
function takeMoneyFromShop(player, shopData, value) {

    if (!hasPermission(player.getName(), shopData, PERMISSION_TAKE_MONEY)) {
        tellPlayer(player, "&cYou don't have permission to take money from this shop!");
        return;
    }

    if (shopData.finances.stored_cash < value) {
        tellPlayer(player, "&cNot enough money in the shop's inventory!");
        return;
    }

    shopData.finances.stored_cash -= value;
    var moneyItems = generateMoney(world, value, "money");
    for (var i = 0; i < moneyItems.length; i++) {
        player.giveItem(moneyItems[i]);
    }

    tellPlayer(player, "&aSuccessfully took &r:money:&e" + getAmountCoin(value) + " &afrom shop &e" + shopData.shop.display_name);
}

/**
 * Puts money into a shop from the player's pouch.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop.
 * @param {number} value - The amount of money to put.
 * @param {Object} playerShops - The player shops data.
 */
function putMoneyInShopFromPouch(player, shopData, value) {
    if (!hasPermission(player.getName(), shopData, PERMISSION_TAKE_MONEY)) {
        tellPlayer(player, "&cYou don't have permission to put money in this shop!");
        return;
    }
    if (getMoneyFromPlayerPouch(player, getCoinAmount(value))) {
        shopData.finances.stored_cash += getCoinAmount(value);
        tellPlayer(player, "&aSuccessfully added &r:money:&e" + value + " &ato shop &e" + shopData.shop.display_name);
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
function takeMoneyFromShopToPouch(player, shopData, value) {
    if (!hasPermission(player.getName(), shopData, PERMISSION_TAKE_MONEY)) {
        tellPlayer(player, "&cYou don't have permission to take money from this shop!");
        return;
    }

    if (shopData.finances.stored_cash < getCoinAmount(value)) {
        tellPlayer(player, "&cNot enough money in the shop's inventory!");
        return;
    }

    shopData.finances.stored_cash -= getCoinAmount(value);
    if (addMoneyToCurrentPlayerPouch(player, parseInt(getCoinAmount(value)))) {
        tellPlayer(player, "&aSuccessfully took &r:money:&e" + value + " &afrom shop &e" + shopData.shop.display_name);
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
function addShopReputation(player, shopData, amount) {
    shopData.reputation_data.reputation += parseInt(amount);
    addReputationHistoryEntry(shopData, amount > 0 ? "Reputation added through command" : "Reputation removed through command", amount);
    tellPlayer(player, "&aShop reputation updated!");
}

/**
 * Logs the reputation of a shop over a period of time.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The ID of the shop.
 * @param {number} hours - The number of hours to log.
 * @param {Object} playerShops - The player shops data.
 */
function logShopReputation(player, shopData, hours) {
    var currentReputation = shopData.reputation_data.reputation;
    var reputationAgo = getReputationAgo(player, shopData, hours);

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
 * Handles the "$shop stat consumer flow" command.
 * @param {IPlayer} player - The player.
 * @param {Object} shopData - The shop data.
 * @param {Object} playerShops - The player shops data.
 */
function handleShopStatConsumerFlow(player, shopData, playerShops) {
    var consumerData = getDailyConsumersForShop(player, shopData, playerShops);

    tellPlayer(player, "&aShop Name: &e" + shopData.shop.display_name);
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