var GLOBAL_PRICES_JSON_PATH = "world/customnpcs/scripts/globals/global_prices.json";
var STOCK_EXCHANGE_DATA_JSON_PATH = "world/customnpcs/scripts/globals/stock_exchange_data.json";

/**
 * Gets the price of an item by its ID and NBT.
 * @param {string} itemId - The item ID.
 * @param {Object} itemTag - The item NBT.
 * @param {number} defaultPrice - The default price to return if no price is found.
 * @returns {number} - The price of the item.
 */
function getPrice(itemId, defaultPrice, itemTag, ignoreNBT) {

    // if item id doesn't fit with regex modid:itemid:damage (aka missing the :damage)
    if (!/^.+:.+:\d+$/.test(itemId)) {
        itemId += ":0";
    }

    var globalPrices = loadJson(GLOBAL_PRICES_JSON_PATH);

    if (!globalPrices || !globalPrices[itemId]) {
        return defaultPrice;
    }

    
    var itemData = globalPrices[itemId];

    if (itemData.tag && !ignoreNBT) {
        if (JSON.stringify(itemData.tag) === JSON.stringify(itemTag)) {
            if (itemData.stock_link) {
                var stockPrices = loadJson(STOCK_EXCHANGE_DATA_JSON_PATH);
                if (stockPrices[itemData.stock_link]) {
                    return stockPrices[itemData.stock_link].current_price;
                }
            }
            return itemData.value;
        }
    } else {
        if (itemData.stock_link) {
            var stockPrices = loadJson(STOCK_EXCHANGE_DATA_JSON_PATH);
            if (stockPrices[itemData.stock_link]) {
                return stockPrices[itemData.stock_link].current_price;
            }
        }
        return itemData.value;
    }

    return defaultPrice;
}

/**
 * Gets the price of an item stack by its ID and NBT.
 * @param {IItemStack} stack - The item stack.
 * @param {number} defaultPrice - The default price to return if no price is found.
 * @param {boolean} ignoreNBT - Whether to ignore the NBT data when checking the price.
 * @returns {number} - The price of the item stack.
 */
function getPriceFromItemStack(stack, defaultPrice, ignoreNBT) {
    var itemId = stack.getName();
    if (stack.hasNbt()) {
        var itemTag = stack.getNbt();
        if (itemTag) {
            itemTag = itemTag.getCompound("tag");
        }
    } else {
        var itemTag = null; // No NBT data
    }
    var value = getPrice(itemId, defaultPrice, itemTag, ignoreNBT);
    return value;
}

/**
 * Gets the name of an item by its ID and NBT.
 * @param {string} itemId - The item ID.
 * @param {Object} itemTag - The item NBT.
 * @returns {string} - The name of the item.
 */
function getName(itemId, itemTag) {
    var globalPrices = loadJson(GLOBAL_PRICES_JSON_PATH);
    if (!globalPrices) {
        return "";
    }

    for (var i = 0; i < globalPrices.length; i++) {
        if (globalPrices[i].id === itemId) {
            if (globalPrices[i].tag) {
                if (JSON.stringify(globalPrices[i].tag) === JSON.stringify(itemTag)) {
                    return globalPrices[i].name;
                }
            } else {
                return globalPrices[i].name;
            }
        }
    }

    return "";
}
