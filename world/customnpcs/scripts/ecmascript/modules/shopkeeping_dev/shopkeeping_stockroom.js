/**
 * Adds stock to the player's shop.
 * @param {IPlayer} player - The player.
 * @param {Object} shopData - The shop data.
 * @param {string} item - The item to add.
 * @param {number} count - The number of items to add.
 * @param {string} tag - The item tag.
 * @returns {number} The number of items left in the player's inventory.
 */
function addStock(player, shopData, item, count, tag) {
    var stockRoomLeft = getStockRoomLeft(player, shopData);
    if (stockRoomLeft > 0) {
        for (var i = 0; i < shopData.inventory.stock.length; i++) {
            if (shopData.inventory.stock[i].item === item) {
                if (shopData.inventory.stock[i].count + count <= stockRoomLeft) {
                    shopData.inventory.stock[i].count += count;
                    return 0;
                } else {
                    var left = shopData.inventory.stock[i].count + count - stockRoomLeft;
                    shopData.inventory.stock[i].count = stockRoomLeft;
                    return left;
                }
            }
        }
    }
    tellPlayer(player, "&cStock room is full!");
    return count;
}

/**
 * Returns the remaining space in the stock room.
 * @param {IPlayer} player - The player.
 * @param {Object} shopData - The shop data.
 * @returns {number} The remaining space in the stock room.
 */
function getStockRoomLeft(player, shopData) {
    var stock = shopData.inventory.stock;
    var stockRoomUsed = 0;

    var upgrades = loadJson(UPGRADES_JSON_PATH).upgrades;
    if (!upgrades) {
        world.broadcast("&cShop upgrades not found! Contact an admin!");
        return;
    }

    for (var key in stock) {
        stockRoomUsed += stock[key].count;
    }

    var unsalableItems = shopData.inventory.unsalable_items;
    for (var key in unsalableItems) {
        stockRoomUsed += unsalableItems[key].count;
    }

    return getStockRoomSize(player, shopData) - stockRoomUsed;
}

/**
 * Returns the stock room size for the player's shop.
 * @param {IPlayer} player - The player.
 * @param {Object} shopData - The shop data.
 * @returns {number} The stock room size.
 */
function getStockRoomSize(player, shopData) {
    var stockRoomSize = shopData.property.stock_room_size;
    stockRoomSize = Math.floor(stockRoomSize * 64);
    return stockRoomSize;
}

/**
 * Initializes the stock room for the player's shop.
 * @param {IPlayer} player - The player.
 * @param {Object} shopData - The shop data.
 */
function initStockRoom(player, shopData) {
    var stock = shopData.inventory.stock || {};
    var unsalableItems = shopData.inventory.unsalable_items || {};

    for (var itemId in stock) {
        if (stock[itemId].count > 0) {
            unsalableItems[itemId] = stock[itemId];
        }
        delete stock[itemId];
    }

    var availableItems = getAvailableItems(player, shopData.shop.type);
    for (var i = 0; i < availableItems.length; i++) {
        var itemId = availableItems[i].id;
        if (unsalableItems[itemId]) {
            stock[itemId] = unsalableItems[itemId];
            delete unsalableItems[itemId];
        } else {
            stock[itemId] = { count: 0 };
            if (availableItems[i].tag) {
                stock[itemId].tag = availableItems[i].tag;
            }
        }
    }

    shopData.inventory.unsalable_items = unsalableItems;

    tellPlayer(player, "&aStock room initialised!");
    // saveJson(shopData, SERVER_SHOPS_JSON_PATH);
}

/**
 * Updates the stock rooms for all shops.
 * @param {IPlayer} player - The player.
 */
function updateStockrooms(player) {
    var serverShops = loadJson(SERVER_SHOPS_JSON_PATH);
    tellPlayer(player, "&aUpdating stock rooms for all shops...");
    if (!serverShops) {
        world.broadcast("&cNo shop data found! Contact an admin!");
        return;
    }

    var shopCategories = loadJson(SHOP_CATEGORIES_JSON_PATH);
    if (!shopCategories) {
        world.broadcast("&cShop categories not found! Contact an admin!");
        return;
    }

    for (var shopId in serverShops) {
        tellPlayer(player, "&aUpdating stock room for shop ID: &e" + shopId);
        updateShopStockroom(player, serverShops, shopId);
    }

    saveJson(serverShops, SERVER_SHOPS_JSON_PATH);
}

/**
 * Updates the stock room for a specific shop.
 * @param {IPlayer} player - The player.
 * @param {Object} serverShops - The server shops.
 * @param {number} shopId - The shop ID.
 */
function updateShopStockroom(player, serverShops, shopId) {
    var shop = serverShops[shopId];
    var shopType = shop.shop.type;
    var availableItems = getAvailableItems(player, shopType) || [];
    var stock = shop.inventory.stock;
    var unsalableItems = shop.inventory.unsalable_items || {};

    addNewEntries(stock, availableItems, unsalableItems);
    moveUnsalableItems(stock, availableItems, unsalableItems);

    shop.inventory.unsalable_items = unsalableItems;
}

/**
 * Adds new entries to the stock.
 * @param {Object} stock - The stock.
 * @param {Array} availableItems - The available items.
 * @param {Object} unsalableItems - The unsalable items.
 */
function addNewEntries(stock, availableItems, unsalableItems) {
    for (var i = 0; i < availableItems.length; i++) {
        var itemId = availableItems[i].id;
        if (unsalableItems[itemId]) {
            stock[itemId] = unsalableItems[itemId];
            delete unsalableItems[itemId];
        } else if (!stock[itemId]) {
            stock[itemId] = { count: 0 };
            if (availableItems[i].tag) {
                stock[itemId].tag = availableItems[i].tag;
            }
        }
    }
}

/**
 * Moves unsalable items to the unsalable items list.
 * @param {Object} stock - The stock.
 * @param {Array} availableItems - The available items.
 * @param {Object} unsalableItems - The unsalable items.
 */
function moveUnsalableItems(stock, availableItems, unsalableItems) {
    for (var itemId in stock) {
        for (var i = 0; i < availableItems.length; i++) {
            if (itemId === availableItems[i].id) {
                break;
            }
            if (i === availableItems.length - 1) {
                if (stock[itemId].count > 0) {
                    unsalableItems[itemId] = stock[itemId];
                }
                delete stock[itemId];
            }
        }
    }
}

/**
 * Adds stock from the player's hand to the shop.
 * @param {IPlayer} player - The player.
 * @param {Object} shopData - The shop data.
 */
function addStockFromHand(player, shopData) {

    if (!hasPermission(player.getName(), shopData, PERMISSION_MANAGE_STOCK)) {
        tellPlayer(player, "&cYou don't have permission to add stock to this shop!");
        return;
    }

    var itemstack = player.getMainhandItem();
    if (itemstack.isEmpty()) {
        tellPlayer(player, "&cYou are not holding any item!");
        return;
    }

    var itemstock = getHandItems(player);

    if (!isValidItem(getAvailableItems(player, shopData.shop.type), itemstock)) {
        tellPlayer(player, "&cItem is not valid for this shop type!");
        return;
    }

    var stockRoomLeft = getStockRoomLeft(player, shopData);
    if (stockRoomLeft <= 0) {
        tellPlayer(player, "&cNo room left in the stock room!");
        return;
    }

    var itemId = itemstock.item;
    var itemCount = itemstock.count;
    var itemTag = itemstock.tag ? JSON.stringify(API.stringToNbt(itemstock.tag)) : null;

    if (!shopData.inventory.stock[itemId]) {
        shopData.inventory.stock[itemId] = { count: 0 };
        if (itemTag) {
            shopData.inventory.stock[itemId].tag = itemTag;
        }
    }

    var stockItem = shopData.inventory.stock[itemId];
    if (itemTag && !API.stringToNbt(stockItem.tag).isEqual(API.stringToNbt(itemTag))) {
        tellPlayer(player, "&cItem NBT does not match existing stock!");
        // tellPlayer(player, "&cItem NBT: &e" + itemTag);
        // tellPlayer(player, "&cStock NBT: &e" + stockItem.tag);
        return;
    }

    var roomForItems = Math.min(stockRoomLeft, itemCount);
    stockItem.count += roomForItems;
    itemstack.setStackSize(itemCount - roomForItems);

    var stockRoomLeft = getStockRoomLeft(player, shopData);
    var stockRoomTotal = getStockRoomSize(player, shopData);
    var stockRoomUsed = stockRoomTotal - stockRoomLeft;
    var percentageFilled = (stockRoomUsed / stockRoomTotal) * 100;
    tellPlayer(player, "&aAdded &e" + roomForItems + " &aitems to the shop stock. &aRoom left: &e" + stockRoomLeft + " &a(" + percentageFilled.toFixed(2) + "% filled).");
}

/**
 * Adds all stock from the player's inventory to the shop.
 * @param {IPlayer} player - The player.
 * @param {Object} shopData - The shop data.
 */
function addStockFromInventory(player, shopData) {
    
    if (!hasPermission(player.getName(), shopData, PERMISSION_MANAGE_STOCK)) {
        tellPlayer(player, "&cYou don't have permission to add stock to this shop!");
        return;
    }
    // tellPlayer(player, "&aAdding all items to the shop stock...");
    var inventory = player.getInventory().getItems();
    var availableItems = getAvailableItems(player, shopData.shop.type);

    // tellPlayer(player, "&aInventory size: &e" + inventory.length);

    for (var i = 0; i < inventory.length; i++) {
        var itemstack = inventory[i];
        if (itemstack && !itemstack.isEmpty()) {
            var itemstock = getHandItemsFromStack(itemstack);

            if (isValidItem(availableItems, itemstock)) {
                var stockRoomLeft = getStockRoomLeft(player, shopData);
                if (stockRoomLeft <= 0) {
                    tellPlayer(player, "&cNo room left in the stock room!");
                    return;
                }

                var itemId = itemstock.item;
                var itemCount = itemstock.count;
                var itemTag = itemstock.tag ? JSON.stringify(API.stringToNbt(itemstock.tag)) : null;

                if (!shopData.inventory.stock[itemId]) {
                    shopData.inventory.stock[itemId] = { count: 0 };
                    if (itemTag) {
                        shopData.inventory.stock[itemId].tag = itemTag;
                    }
                }

                var stockItem = shopData.inventory.stock[itemId];
                if (itemTag && !API.stringToNbt(stockItem.tag).isEqual(API.stringToNbt(itemTag))) {
                    tellPlayer(player, "&cItem NBT does not match existing stock!");
                    // tellPlayer(player, "&cItem NBT: &e" + itemTag);
                    // tellPlayer(player, "&cStock NBT: &e" + stockItem.tag);
                    continue;
                }

                var roomForItems = Math.min(stockRoomLeft, itemCount);
                stockItem.count += roomForItems;
                itemstack.setStackSize(itemCount - roomForItems);

                var stockRoomLeft = getStockRoomLeft(player, shopData);
                var stockRoomTotal = getStockRoomSize(player, shopData);
                var stockRoomUsed = stockRoomTotal - stockRoomLeft;
                var percentageFilled = (stockRoomUsed / stockRoomTotal) * 100;
                tellPlayer(player, "&aAdded &e" + roomForItems + " &aitems to the shop stock. &aRoom left: &e" + stockRoomLeft + " &a(" + percentageFilled.toFixed(2) + "% filled).");
            }
        }
    }
}

/**
 * Removes stock from the player's shop.
 * @param {IPlayer} player - The player.
 * @param {Object} shopData - The shop data.
 * @param {string} itemId - The item ID.
 * @param {number} count - The number of items to remove.
 */
function removeStockedItem(player, shopData, itemId, count) {
    var stock = shopData.inventory.stock;
    var unsalableItems = shopData.inventory.unsalable_items;

    if (!stock[itemId] && !unsalableItems[itemId]) {
        tellPlayer(player, "&cItem not found in stock or unsalable items!");
        tellPlayer(player, "&cAvailable items: &e" + Object.keys(stock).join(", "));
        return;
    }

    var stockItem = stock[itemId] || unsalableItems[itemId];

    var id = itemId.split(":")[0] + ":" + itemId.split(":")[1];

    var nbt = {
        id: id,
        Count: count,
        Damage: itemId.split(":")[2]
    }
    if (stockItem.tag) {
        nbt.tag = stockItem.tag;
    }

    var itemstack = world.createItemFromNbt(API.stringToNbt(JSON.stringify(nbt)));
    var maxStackSize = itemstack.getMaxStackSize();
    count = Math.min(count, maxStackSize);
    itemstack.setStackSize(count);

    if (stockItem.count < count) {
        tellPlayer(player, "&cNot enough items in stock! There are less than &e" + count + " &citems in stock.");
        return;
    }

    stockItem.count -= count;
    if (stockItem.count === 0) {
        if (stock[itemId]) {
            delete stock[itemId];
        } else {
            delete unsalableItems[itemId];
        }
    }

    player.giveItem(itemstack);
    tellPlayer(player, "&aRemoved &e" + count + " &aitems from the shop stock.");
}

/**
 * Removes stock from the player's shop.
 * @param {IPlayer} player - The player.
 * @param {Object} shopData - The shop data.
 * @param {string|number} item_or_index - The item ID or index.
 * @param {number} count - The number of items to remove.
 */
function removeStock(player, shopData, item_or_index, count) {
    if (!hasPermission(player.getName(), shopData, PERMISSION_MANAGE_STOCK)) {
        tellPlayer(player, "&cYou don't have permission to remove stock from this shop!");
        return;
    }
    if (!isNaN(item_or_index)) {
        var index = parseInt(item_or_index);
        var keys = Object.keys(shopData.inventory.stock);
        if (index >= 0 && index < keys.length) {
            item_or_index = keys[index];
        } else {
            tellPlayer(player, "&cInvalid item index: &e" + item_or_index);
            return;
        }
    }

    removeStockedItem(player, shopData, item_or_index, count);
}

function removeAllStock(player, shopData) {
    if (!hasPermission(player.getName(), shopData, PERMISSION_MANAGE_STOCK)) {
        tellPlayer(player, "&cYou don't have permission to remove stock from this shop!");
        return;
    }

    var stock = shopData.inventory.stock;
    var unsalableItems = shopData.inventory.unsalable_items;

    for (var itemId in stock) {
        var count = stock[itemId].count;
        removeStockedItem(player, shopData, itemId, count);
    }

    for (var itemId in unsalableItems) {
        var count = unsalableItems[itemId].count;
        removeStockedItem(player, shopData, itemId, count);
    }
}

/**
 * Gets a list of items for "based_on_stocks" item list types.
 * @param {IPlayer} player - The player.
 * @param {string} stockName - The stock name.
 * @returns {Array} The list of items.
 */
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

/**
 * Gets hand items from the item stack.
 * @param {ItemStack} itemstack - The item stack.
 * @returns {Object} The hand items.
 */
function getHandItemsFromStack(itemstack) {
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
 * Calculates the stock room size.
 * @param {IPlayer} player - The player.
 * @param {Object} shopData - The shop data.
 * @returns {number} The stock room size.
 */
function calculateStockRoomSize(player, shopData) {
    var worldData = getWorldData();
    if (shopData.property.stock_room.length === 0) {
        tellPlayer(player, "&cNo stock rooms defined for this shop!");
        return 0;
    }

    var totalSize = 0;
    for (var i = 0; i < shopData.property.stock_room.length; i++) {
        var stockRoom = shopData.property.stock_room[i];
        var parts = stockRoom.split(":");
        var cuboidId = parts[0];
        var subCuboidId = parts.length > 1 ? parts[1] : null;

        try {
            totalSize += calculateCuboidSize(worldData, cuboidId, subCuboidId);
        } catch (error) {
            tellPlayer(player, "&cError calculating size for stock room: &e" + stockRoom + " &c- " + error.message);
        }
    }

    // Apply upgrades to stock room size
    var upgradeStockRoomSize = getModuleValue(shopData, "storage_capacity");
    tellPlayer(player, "&aStock room size upgrade level: &e" + upgradeStockRoomSize);
    totalSize *= upgradeStockRoomSize;

    totalSize = Math.floor(totalSize);
    tellPlayer(player, "&aTotal stock room size: &e" + totalSize * 64 + " slots");
    return totalSize;
}

/**
 * Removes all items no longer available from the listed items.
 * @param {IPlayer} player - The player.
 * @param {Object} shop - The shop.
 * @param {string} newType - The new shop type.
 * @returns {boolean} True if the items were removed, false otherwise.
 */
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

    return true;
}

/**
 * Removes an item from the listed items.
 * @param {IPlayer} player - The player.
 * @param {Object} shopData - The shop data.
 * @param {string|number} itemIdOrIndex - The item ID or index.
 * @param {Object} playerShops - The player shops.
 * @returns {boolean} True if the item was removed, false otherwise.
 */
function removeListedItem(player, shopData, itemIdOrIndex) {

    if (!hasPermission(player.getName(), shopData, PERMISSION_SET_PRICES)) {
        tellPlayer(player, "&cYou don't have permission to remove items from the listed items!");
        return;
    }
    var itemId = itemIdOrIndex;

    if (!isNaN(itemIdOrIndex)) {
        var index = parseInt(itemIdOrIndex);
        var keys = Object.keys(shopData.inventory.listed_items);
        if (index >= 0 && index < keys.length) {
            itemId = keys[index];
        } else {
            tellPlayer(player, "&cInvalid item index: &e" + itemIdOrIndex);
            return false;
        }
    }

    if (shopData.inventory.listed_items[itemId]) {
        delete shopData.inventory.listed_items[itemId];
        tellPlayer(player, "&aSuccessfully removed item &e" + itemId + " &afrom the listed items.");
        return true;
    } else {
        tellPlayer(player, "&cItem &e" + itemId + " &cis not listed in the shop.");
        return false;
    }
}

/**
 * Calculates the total value of the premises based on the regions.
 * @param {IPlayer} player - The player.
 * @param {Array} regions - The list of regions.
 * @returns {number} The total value of the premises.
 */
function getPremisesValue(player, regions) {
    var value = 0
    for (var i = 0; i < regions.length; i++) {
        value += getRegionPrice(regions[i], player);
    }

    return value;
}

/**
 * Retrieves the unique regions from the given entries.
 * @param {IPlayer} player - The player.
 * @param {Array} entries - The list of entries.
 * @returns {Array} The list of unique regions.
 */
function getShopRegions(player, entries) {
    var regions = [];
    for (var i = 0; i < entries.length; i++) {
        var region = entries[i].split(":")[0];
        if (regions.indexOf(region) === -1) {
            regions.push(region);
        }
    }

    return regions;
}

/**
 * Lists the stock information for a shop.
 * @param {IPlayer} player - The player.
 * @param {Object} shopData - The shop data.
 * @param {boolean} showItems - Whether to show the list of stocked items.
 */
function listShopStock(player, shopData, showItems) {
    var stockRoomSize = getStockRoomSize(player, shopData);
    var stockRoomLeft = getStockRoomLeft(player, shopData);
    var stockRoomUsed = stockRoomSize - stockRoomLeft;
    var percentageFilled = (stockRoomUsed / stockRoomSize) * 100;

    tellPlayer(player, "&aStock Room Info for Shop: &e" + shopData.shop.display_name);
    tellPlayer(player, "&aTotal Stock Room Size: &e" + stockRoomSize);
    tellPlayer(player, "&aStock Room Used: &e" + stockRoomUsed);
    tellPlayer(player, "&aStock Room Left: &e" + stockRoomLeft);
    tellPlayer(player, "&aPercentage Filled: &e" + percentageFilled.toFixed(2) + "%");

    if (showItems) {
        tellPlayer(player, "&aStocked Items:");
        for (var itemId in shopData.inventory.stock) {
            var item = shopData.inventory.stock[itemId];
            tellPlayer(player, "&e" + itemId + ": &a" + item.count);
        }
        tellPlayer(player, "&aUnsalable Items:");
        for (var itemId in shopData.inventory.unsalable_items) {
            var item = shopData.inventory.unsalable_items[itemId];
            tellPlayer(player, "&e" + itemId + ": &a" + item.count);
        }
    }
}

/**
 * Lists the prices of all listed items and their stock, and unlisted items with their Wholesale Values.
 * @param {IPlayer} player - The player.
 * @param {object} shopData - The shop data.
 */
function listShopPrices(player, shopData) {

    var listedItems = shopData.inventory.listed_items;
    var stockItems = shopData.inventory.stock;
    var availableItems = getAvailableItems(player, shopData.shop.type);

    tellPlayer(player, "&aListed Items for Shop: &e" + shopData.shop.display_name);
    for (var itemId in listedItems) {
        var listedItem = listedItems[itemId];
        var stockCount = stockItems[itemId] ? stockItems[itemId].count : 0;
        tellPlayer(player, "&e" + itemId + ": &aPrice: &r:money:&e" + getAmountCoin(listedItem.price) + " &aStock: &e" + stockCount);
    }

    tellPlayer(player, "&aUnlisted Items with Wholesale Values:");
    for (var i = 0; i < availableItems.length; i++) {
        var item = availableItems[i];
        if (!listedItems[item.id]) {
            var stockCount = stockItems[item.id] ? stockItems[item.id].count : 0;
            tellPlayer(player, "&e" + item.id + ": &aWholesale Value: &r:money:&e" + getAmountCoin(item.value) + " &aStock: &e" + stockCount);
        }
    }
}

/**
 * Displays a full recap of the shop.
 * @param {IPlayer} player - The player.
 * @param {object} shopData - The shop data.
 * @param {boolean} extended - Whether to show extended information.
 */
function displayShopInfo(player, shopData, extended) {

    var stockRoomSize = getStockRoomSize(player, shopData);
    var stockRoomLeft = getStockRoomLeft(player, shopData);
    var stockRoomUsed = stockRoomSize - stockRoomLeft;
    var percentageFilled = (stockRoomUsed / stockRoomSize) * 100;

    tellPlayer(player, "&b=========================================");
    tellPlayer(player, "&bShop Info for Shop : &e" + shopData.shop.display_name);
    tellPlayer(player, "&b=========================================");
    tellPlayer(player, "&aDisplay Name: &e" + shopData.shop.display_name);
    tellPlayer(player, "&aType: &e" + shopData.shop.type);
    tellPlayer(player, "&aRegion: &e" + shopData.property.region);
    tellPlayer(player, "&aSub-Region: &e" + shopData.property.sub_region);
    tellPlayer(player, "&aLocation: &e(" + shopData.property.location.x + ", " + shopData.property.location.y + ", " + shopData.property.location.z + ")");
    tellPlayer(player, "&aOwner: &e" + shopData.roles.owner);
    if (shopData.roles.managers) {
        tellPlayer(player, "&aManagers: &e" + shopData.roles.managers.join(", "));
    }
    if (shopData.roles.cashiers) {
        tellPlayer(player, "&aCashiers: &e" + shopData.roles.cashiers.join(", "));
    }
    if (shopData.roles.stock_keepers) {
        tellPlayer(player, "&aStock Keepers: &e" + shopData.roles.stock_keepers.join(", "));
    }
    if (shopData.roles.assistants) {
        tellPlayer(player, "&aAssistants: &e" + shopData.roles.assistants.join(", "));
    }
    tellPlayer(player, "&aReputation: &e" + shopData.reputation_data.reputation);
    tellPlayer(player, "&aStored Cash: &e" + getAmountCoin(shopData.finances.stored_cash));
    tellPlayer(player, "&aDefault Margin: &e" + (shopData.finances.default_margin * 100) + "%");
    tellPlayer(player, "&aStock Room Size: &e" + stockRoomSize);
    tellPlayer(player, "&aStock Room Used: &e" + stockRoomUsed);
    tellPlayer(player, "&aStock Room Left: &e" + stockRoomLeft);
    tellPlayer(player, "&aPercentage Filled: &e" + percentageFilled.toFixed(2) + "%");

    tellPlayer(player, "&aUpgrades:");
    for (var i = 0; i < shopData.upgrades.length; i++) {
        tellPlayer(player, "&e- " + shopData.upgrades[i]);
    }

    tellPlayer(player, "&aEvents:");
    for (var i = 0; i < shopData.events.length; i++) {
        var event = shopData.events[i];
        tellPlayer(player, "&e- " + event.id + " (Start Date: " + event.start_date + ", Duration: " + event.duration + ")");
    }

    if (extended) {

        tellPlayer(player, "&aStocked Items:");
        for (var itemId in shopData.inventory.stock) {
            var item = shopData.inventory.stock[itemId];
            tellPlayer(player, "&e" + itemId + ": &a" + item.count);
        }

        tellPlayer(player, "&aUnsalable Items:");
        for (var itemId in shopData.inventory.unsalable_items) {
            var item = shopData.inventory.unsalable_items[itemId];
            tellPlayer(player, "&e" + itemId + ": &a" + item.count);
        }

        tellPlayer(player, "&aListed Items:");
        for (var itemId in shopData.inventory.listed_items) {
            var listedItem = shopData.inventory.listed_items[itemId];
            tellPlayer(player, "&e" + itemId + ": &aPrice: &r:money:&e" + getAmountCoin(listedItem.price) + " &aStock: &e" + (shopData.inventory.stock[itemId] ? shopData.inventory.stock[itemId].count : 0));
        }
    }

    tellPlayer(player, "&b=========================================");
}

/**
 * Generates a cuboid group from a list of cuboids.
 * @param {IPlayer} player - The player.
 * @param {Array} cuboidList - The list of cuboids.
 * @returns {Object} The cuboid group.
 */
function generateCuboidGroup(player, cuboidList) {
    var cuboids = {};

    // tellPlayer(player, "&aGenerating cuboid group from " + cuboidList.join(", "));

    for (var i = 0; i < cuboidList.length; i++) {
        var room = cuboidList[i];
        var parts = room.split(":");
        var cuboidId = parts[0];
        var subCuboidId = parts.length > 1 ? parseInt(parts[1]) : null;

        // In cuboids, check if entry exists
        if (!cuboids[cuboidId]) {
            cuboids[cuboidId] = [];
        }

        // add subcuboid to cuboid
        cuboids[cuboidId].push(subCuboidId);
    }

    // tellPlayer(player, "&aGenerated cuboid group: &e" + JSON.stringify(cuboids));

    return cuboids;
}