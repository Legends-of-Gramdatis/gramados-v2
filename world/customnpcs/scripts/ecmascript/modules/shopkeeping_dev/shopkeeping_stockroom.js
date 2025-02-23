/**
 * Adds a stock room to the player's shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player's shops.
 * @param {string} value - The stock room value.
 */
function addStockRoom(player, shopId, playerShops, value) {
    playerShops[shopId].property.stock_room.push(value);
    playerShops[shopId].property.stock_room_size = calculateStockRoomSize(player, shopId, playerShops);
}

/**
 * Removes a stock room from the player's shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player's shops.
 * @param {string} value - The stock room value.
 * @returns {boolean} True if the stock room was removed, false otherwise.
 */
function removeStockRoom(player, shopId, playerShops, value) {
    if (removeRoom(playerShops[shopId].property.stock_room, value)) {
        playerShops[shopId].property.stock_room_size = calculateStockRoomSize(player, shopId, playerShops);
        return true;
    }
    return false;
}

/**
 * Adds stock to the player's shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player's shops.
 * @param {string} item - The item to add.
 * @param {number} count - The number of items to add.
 * @param {string} tag - The item tag.
 * @returns {number} The number of items left in the player's inventory.
 */
function addStock(player, shopId, playerShops, item, count, tag) {
    var stockRoomLeft = getStockRoomLeft(player, shopId, playerShops);
    if (stockRoomLeft > 0) {
        for (var i = 0; i < playerShops[shopId].inventory.stock.length; i++) {
            if (playerShops[shopId].inventory.stock[i].item === item) {
                if (playerShops[shopId].inventory.stock[i].count + count <= stockRoomLeft) {
                    playerShops[shopId].inventory.stock[i].count += count;
                    return 0;
                } else {
                    var left = playerShops[shopId].inventory.stock[i].count + count - stockRoomLeft;
                    playerShops[shopId].inventory.stock[i].count = stockRoomLeft;
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
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player's shops.
 * @returns {number} The remaining space in the stock room.
 */
function getStockRoomLeft(player, shopId, playerShops) {
    var shop = playerShops[shopId];
    var stock = shop.inventory.stock;
    var stockRoomUsed = 0;
    var stockRoomSize = shop.property.stock_room_size;

    for (var i = 0; i < shop.upgrades.length; i++) {
        var modules = shop.upgrades[i].modules;
        if (shop.upgrades[i].modules.stock_space) {
            stockRoomSize *= (1 + shop.upgrades[i].modules.stock_space);
        }
    }
    stockRoomSize = Math.floor(stockRoomSize * 64);

    for (var key in stock) {
        stockRoomUsed += stock[key].count;
    }

    var unsalableItems = shop.inventory.unsalable_items;
    for (var key in unsalableItems) {
        stockRoomUsed += unsalableItems[key].count;
    }

    tellPlayer(player, "&aStock room size: &e" + stockRoomSize);
    tellPlayer(player, "&aStock room used: &e" + stockRoomUsed);
    tellPlayer(player, "&aStock room left: &e" + (stockRoomSize - stockRoomUsed));

    return stockRoomSize - stockRoomUsed;
}

/**
 * Initializes the stock room for the player's shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player's shops.
 */
function initStockRoom(player, shopId, playerShops) {
    var shop = playerShops[shopId];
    var stock = shop.inventory.stock;
    var unsalableItems = shop.inventory.unsalable_items || {};

    for (var itemId in stock) {
        if (stock[itemId].count > 0) {
            unsalableItems[itemId] = stock[itemId];
        }
        delete stock[itemId];
    }

    var availableItems = getAvailableItems(player, shop.shop.type);
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

    shop.inventory.unsalable_items = unsalableItems;

    tellPlayer(player, "&aStock room initialised!");
    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
}

/**
 * Updates the stock rooms for all shops.
 * @param {IPlayer} player - The player.
 */
function updateStockrooms(player) {
    var serverShops = loadJson(SERVER_SHOPS_JSON_PATH);
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
    var availableItems = getAvailableItems(player, shopType);
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
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player's shops.
 */
function addStockFromHand(player, shopId, playerShops) {
    var itemstack = player.getMainhandItem();
    if (itemstack.isEmpty()) {
        tellPlayer(player, "&cYou are not holding any item!");
        return;
    }

    var itemstock = getHandItems(player);
    var shop = playerShops[shopId];

    if (!isValidItem(getAvailableItems(player, shop.shop.type), itemstock)) {
        tellPlayer(player, "&cItem is not valid for this shop type!");
        return;
    }

    var stockRoomLeft = getStockRoomLeft(player, shopId, playerShops);
    if (stockRoomLeft <= 0) {
        tellPlayer(player, "&cNo room left in the stock room!");
        return;
    }

    var itemId = itemstock.item;
    var itemCount = itemstock.count;
    var itemTag = itemstock.tag ? JSON.stringify(API.stringToNbt(itemstock.tag)) : null;

    if (!shop.inventory.stock[itemId]) {
        shop.inventory.stock[itemId] = { count: 0 };
        if (itemTag) {
            shop.inventory.stock[itemId].tag = itemTag;
        }
    }

    var stockItem = shop.inventory.stock[itemId];
    if (itemTag && !API.stringToNbt(stockItem.tag).isEqual(API.stringToNbt(itemTag))) {
        tellPlayer(player, "&cItem NBT does not match existing stock!");
        tellPlayer(player, "&cItem NBT: &e" + itemTag);
        tellPlayer(player, "&cStock NBT: &e" + stockItem.tag);
        return;
    }

    var roomForItems = Math.min(stockRoomLeft, itemCount);
    stockItem.count += roomForItems;
    itemstack.setStackSize(itemCount - roomForItems);

    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    tellPlayer(player, "&aAdded &e" + roomForItems + " &aitems to the shop stock.");
}

/**
 * Adds all stock from the player's inventory to the shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player's shops.
 */
function addAllStockFromInventory(player, shopId, playerShops) {
    tellPlayer(player, "&aAdding all items to the shop stock...");
    var inventory = player.getInventory().getItems();
    var shop = playerShops[shopId];
    var availableItems = getAvailableItems(player, shop.shop.type);

    tellPlayer(player, "&aInventory size: &e" + inventory.length);

    for (var i = 0; i < inventory.length; i++) {
        var itemstack = inventory[i];
        if (itemstack && !itemstack.isEmpty()) {
            var itemstock = getHandItemsFromStack(itemstack);

            if (isValidItem(availableItems, itemstock)) {
                var stockRoomLeft = getStockRoomLeft(player, shopId, playerShops);
                if (stockRoomLeft <= 0) {
                    tellPlayer(player, "&cNo room left in the stock room!");
                    return;
                }

                var itemId = itemstock.item;
                var itemCount = itemstock.count;
                var itemTag = itemstock.tag ? JSON.stringify(API.stringToNbt(itemstock.tag)) : null;

                if (!shop.inventory.stock[itemId]) {
                    shop.inventory.stock[itemId] = { count: 0 };
                    if (itemTag) {
                        shop.inventory.stock[itemId].tag = itemTag;
                    }
                }

                var stockItem = shop.inventory.stock[itemId];
                if (itemTag && !API.stringToNbt(stockItem.tag).isEqual(API.stringToNbt(itemTag))) {
                    tellPlayer(player, "&cItem NBT does not match existing stock!");
                    tellPlayer(player, "&cItem NBT: &e" + itemTag);
                    tellPlayer(player, "&cStock NBT: &e" + stockItem.tag);
                    continue;
                }

                var roomForItems = Math.min(stockRoomLeft, itemCount);
                stockItem.count += roomForItems;
                itemstack.setStackSize(itemCount - roomForItems);

                tellPlayer(player, "&aAdded &e" + roomForItems + " &aitems to the shop stock.");
            }
        }
    }

    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
}

/**
 * Removes stock from the player's shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {string} itemId - The item ID.
 * @param {number} count - The number of items to remove.
 * @param {Object} playerShops - The player's shops.
 */
function removeStock(player, shopId, itemId, count, playerShops) {
    var shop = playerShops[shopId];
    var stock = shop.inventory.stock;
    var unsalableItems = shop.inventory.unsalable_items;

    if (!stock[itemId] && !unsalableItems[itemId]) {
        tellPlayer(player, "&cItem not found in stock or unsalable items!");
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
        tellPlayer(player, "&cNot enough items in stock!");
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

    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    tellPlayer(player, "&aRemoved &e" + count + " &aitems from the shop stock.");
}

/**
 * Adds a stock room to the player's shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player's shops.
 * @param {string} value - The stock room value.
 */
function addStockRoom(player, shopId, playerShops, value) {
    playerShops[shopId].property.stock_room.push(value);
    playerShops[shopId].property.stock_room_size = calculateStockRoomSize(player, shopId, playerShops);
}

/**
 * Removes a stock room from the player's shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player's shops.
 * @param {string} value - The stock room value.
 * @returns {boolean} True if the stock room was removed, false otherwise.
 */
function removeStockRoom(player, shopId, playerShops, value) {
    if (removeRoom(playerShops[shopId].property.stock_room, value)) {
        playerShops[shopId].property.stock_room_size = calculateStockRoomSize(player, shopId, playerShops);
        return true;
    }
    return false;
}
// Function to add item to stock. Returns the number of items left in player inventory
function addStock(player, shopId, playerShops, item, count, tag) {
    
    // Check if enopugh room in stock room
    var stockRoomLeft = getStockRoomLeft(player, shopId, playerShops);
    if (stockRoomLeft > 0) {
        // Check if the item is already registered in stock
        for (var i = 0; i < playerShops[shopId].inventory.stock.length; i++) {
            // Chheck if any items even exist in stock
            if (playerShops[shopId].inventory.stock[i].item === item) {
                // Check if there is enough room for the entire stack
                if (playerShops[shopId].inventory.stock[i].count + count <= stockRoomLeft) {
                    playerShops[shopId].inventory.stock[i].count += count;
                    return 0;
                } else {
                    var left = playerShops[shopId].inventory.stock[i].count + count - stockRoomLeft;
                    playerShops[shopId].inventory.stock[i].count = stockRoomLeft;
                    return left;
                }
            }
        }
    }
    player.message("Stock room is full!");
    return count;
}

// Function that returns the left over space in the stock room
function getStockRoomLeft(player, shopId, playerShops) {
    var shop = playerShops[shopId];
    var stock = shop.inventory.stock;
    var stockRoomUsed = 0;

    var stockRoomSize = shop.property.stock_room_size;
    // Get room upgrades if any
    for (var i = 0; i < shop.upgrades.length; i++) {
        // If the upgrade has a "module" called "stock_space" (module being a dictionary)
        player.message("Upgrade: " + JSON.stringify(shop.upgrades[i]));
        var modules = shop.upgrades[i].modules;
        player.message("Modules: " + JSON.stringify(modules));
        if (shop.upgrades[i].modules.stock_space) {
            player.message("Stock space: " + shop.upgrades[i].modules.stock_space);
            stockRoomSize *= (1 + shop.upgrades[i].modules.stock_space);
        }
    }
    stockRoomSize = Math.floor(stockRoomSize *  64);
    // Can store 64 items per 1 cubic meter, before upgrades
    

    for (var key in stock) {
        stockRoomUsed += stock[key].count;
    }

    // Check for any unsalable items
    var unsalableItems = shop.inventory.unsalable_items;
    for (var key in unsalableItems) {
        stockRoomUsed += unsalableItems[key].count;
    }

    player.message("Stock room size: " + stockRoomSize);
    player.message("Stock room used: " + stockRoomUsed);
    player.message("Stock room left: " + (stockRoomSize - stockRoomUsed));

    return stockRoomSize - stockRoomUsed;
}

// Function to initialise the stock room
function initStockRoom(player, shopId, playerShops) {
    var shop = playerShops[shopId];
    var stock = shop.inventory.stock;
    var unsalableItems = shop.inventory.unsalable_items || {};

    // Move existing stock to unsalable items if not in the new available items list
    for (var itemId in stock) {
        if (stock[itemId].count > 0) {
            unsalableItems[itemId] = stock[itemId];
        }
        delete stock[itemId];
    }

    // Initialize stock with all available items, at count 0
    var availableItems = getAvailableItems(player, shop.shop.type);
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

    shop.inventory.unsalable_items = unsalableItems;

    player.message("Stock room initialised!");
    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
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

function updateStockrooms(player) {
    var serverShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!serverShops) {
        world.broadcast("No shop data found! Contact an admin!");
        return;
    }

    var shopCategories = loadJson(SHOP_CATEGORIES_JSON_PATH);
    if (!shopCategories) {
        world.broadcast("Shop categories not found! Contact an admin!");
        return;
    }

    for (var shopId in serverShops) {
        updateShopStockroom(player, serverShops, shopId);
    }

    saveJson(serverShops, SERVER_SHOPS_JSON_PATH);
}

function updateShopStockroom(player, serverShops, shopId) {
    var shop = serverShops[shopId];
    var shopType = shop.shop.type;
    var availableItems = getAvailableItems(player, shopType);
    var stock = shop.inventory.stock;
    var unsalableItems = shop.inventory.unsalable_items || {};

    addNewEntries(stock, availableItems, unsalableItems);
    moveUnsalableItems(stock, availableItems, unsalableItems);

    shop.inventory.unsalable_items = unsalableItems;
}

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

function addStockFromHand(player, shopId, playerShops) {
    var itemstack = player.getMainhandItem();
    if (itemstack.isEmpty()) {
        player.message("You are not holding any item!");
        return;
    }

    var itemstock = getHandItems(player);
    var shop = playerShops[shopId];

    // Check if item is valid
    if (!isValidItem(getAvailableItems(player, shop.shop.type), itemstock)) {
        player.message("Item is not valid for this shop type!");
        return;
    }

    var stockRoomLeft = getStockRoomLeft(player, shopId, playerShops);
    if (stockRoomLeft <= 0) {
        player.message("No room left in the stock room!");
        return;
    }

    var itemId = itemstock.item;
    var itemCount = itemstock.count;
    var itemTag = itemstock.tag ? JSON.stringify(API.stringToNbt(itemstock.tag)) : null;

    if (!shop.inventory.stock[itemId]) {
        shop.inventory.stock[itemId] = { count: 0 };
        if (itemTag) {
            shop.inventory.stock[itemId].tag = itemTag;
        }
    }

    var stockItem = shop.inventory.stock[itemId];
    if (itemTag && !API.stringToNbt(stockItem.tag).isEqual(API.stringToNbt(itemTag))) {
        player.message("Item NBT does not match existing stock!");
        player.message("Item NBT: " + itemTag);
        player.message("Stock NBT: " + stockItem.tag);
        return;
    }

    var roomForItems = Math.min(stockRoomLeft, itemCount);
    stockItem.count += roomForItems;
    itemstack.setStackSize(itemCount - roomForItems);

    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    player.message("Added " + roomForItems + " items to the shop stock.");
}

function addAllStockFromInventory(player, shopId, playerShops) {
    player.message("Adding all items to the shop stock...");
    var inventory = player.getInventory().getItems();
    var shop = playerShops[shopId];
    var availableItems = getAvailableItems(player, shop.shop.type);

    player.message("Inventory size: " + inventory.length);

    for (var i = 0; i < inventory.length; i++) {
        var itemstack = inventory[i];
        if (itemstack && !itemstack.isEmpty()) {
            var itemstock = getHandItemsFromStack(itemstack);

            // Check if item is valid
            if (isValidItem(availableItems, itemstock)) {
                var stockRoomLeft = getStockRoomLeft(player, shopId, playerShops);
                if (stockRoomLeft <= 0) {
                    player.message("No room left in the stock room!");
                    return;
                }

                var itemId = itemstock.item;
                var itemCount = itemstock.count;
                var itemTag = itemstock.tag ? JSON.stringify(API.stringToNbt(itemstock.tag)) : null;

                if (!shop.inventory.stock[itemId]) {
                    shop.inventory.stock[itemId] = { count: 0 };
                    if (itemTag) {
                        shop.inventory.stock[itemId].tag = itemTag;
                    }
                }

                var stockItem = shop.inventory.stock[itemId];
                if (itemTag && !API.stringToNbt(stockItem.tag).isEqual(API.stringToNbt(itemTag))) {
                    player.message("Item NBT does not match existing stock!");
                    player.message("Item NBT: " + itemTag);
                    player.message("Stock NBT: " + stockItem.tag);
                    continue;
                }

                var roomForItems = Math.min(stockRoomLeft, itemCount);
                stockItem.count += roomForItems;
                itemstack.setStackSize(itemCount - roomForItems);

                player.message("Added " + roomForItems + " items to the shop stock.");
            }
        }
    }

    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
}

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

function removeStock(player, shopId, itemId, count, playerShops) {
    var shop = playerShops[shopId];
    var stock = shop.inventory.stock;
    var unsalableItems = shop.inventory.unsalable_items;

    if (!stock[itemId] && !unsalableItems[itemId]) {
        player.message("Item not found in stock or unsalable items!");
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
        player.message("Not enough items in stock!");
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

    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    player.message("Removed " + count + " items from the shop stock.");
}


// function to calculate stock room size
function calculateStockRoomSize(player, shopId, playerShops) {
    var world_data = getWorldData();
    // check if shop has stock room
    if (playerShops[shopId].property.stock_room.length === 0) {
        tellPlayer(player, "&cShop has no stock room!");
        return 0;
    } else {
        var stock_rooms = playerShops[shopId].property.stock_room;
        var total_size = 0;
        for (var i = 0; i < stock_rooms.length; i++) {
            // split "stock_room" on ":" to get the cuboid name and the sub-cuboid
            var cuboid = stock_rooms[i].split(":")[0];
            var sub_cuboid = stock_rooms[i].split(":")[1];
            tellPlayer(player, "&eStock room: &a" + cuboid + " - " + sub_cuboid);
            // get the cuboid
            var cuboid_data = JSON.parse(world_data.get("region_" + cuboid));
            if (!cuboid_data) {
                tellPlayer(player, "&cCuboid &e" + cuboid + " &cnot found!");
                return 0;
            } else {
                // tellPlayer(player, "Cuboid " + cuboid + " found!");
                // tellPlayer(player, "Cuboid data: " + JSON.stringify(cuboid_data));
                // Check if the cuboid has sub-cuboids
                if (!cuboid_data.positions) {
                    tellPlayer(player, "&cCuboid &e" + cuboid + " &chas no sub-cuboids!");
                    // tellPlayer(player, "Cuboid data: " + JSON.stringify(cuboid_data));
                    return 0;
                } else {
                    // get the sub-cuboid (a cuboid has an array of "positions" which are the sub-cuboids)
                    var sub_cuboid_data = cuboid_data.positions[sub_cuboid];
                    // tellPlayer(player, "Sub-cuboid " + sub_cuboid + " found!");
                    // get "xyz1" and "xyz2" from the sub-cuboid data
                    var xyz1 = sub_cuboid_data.xyz1;
                    var xyz2 = sub_cuboid_data.xyz2;
                    // tellPlayer(player, "Sub-cuboid data: " + JSON.stringify(sub_cuboid_data));
                    // tellPlayer(player, "xyz1: " + xyz1);
                    // tellPlayer(player, "xyz2: " + xyz2);
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
                    // tellPlayer(player, "x1: " + x1 + ", y1: " + y1 + ", z1: " + z1);
                    // tellPlayer(player, "x2: " + x2 + ", y2: " + y2 + ", z2: " + z2);
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
                    // tellPlayer(player, "Stock room size: " + count + " blocks");
                    total_size += count;
                }
            }
        }
        tellPlayer(player, "&aTotal stock room size: &e" + total_size + " &ablocks");
        return total_size;
    }
}
