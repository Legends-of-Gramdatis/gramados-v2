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

function updateStockrooms() {
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
        updateShopStockroom(serverShops, shopId);
    }

    saveJson(serverShops, SERVER_SHOPS_JSON_PATH);
}

function updateShopStockroom(serverShops, shopId) {
    var shop = serverShops[shopId];
    var shopType = shop.shop.type;
    var availableItems = getAvailableItems(null, shopType);
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