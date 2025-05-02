var GLOBAL_PRICES_JSON_PATH = "world/customnpcs/scripts/globals/global_prices.json";
var STOCK_EXCHANGE_DATA_JSON_PATH = "world/customnpcs/scripts/globals/stock_exchange_data.json";

/**
 * Gets the price of an item by its ID and NBT.
 * @param {string} itemId - The item ID.
 * @param {Object} itemTag - The item NBT.
 * @returns {number} - The price of the item.
 */
function getPrice(itemId, itemTag) {
    var globalPrices = loadJson(GLOBAL_PRICES_JSON_PATH);
    if (!globalPrices) {
        return 0;
    }

    for (var i = 0; i < globalPrices.length; i++) {
        if (globalPrices[i].id === itemId) {
            if (globalPrices[i].tag) {
                if (JSON.stringify(globalPrices[i].tag) === JSON.stringify(itemTag)) {
                    if (globalPrices[i].stock_link) {
                        var stockPrices = loadJson(STOCK_EXCHANGE_DATA_JSON_PATH);
                        if (stockPrices[globalPrices[i].stock_link]) {
                            return stockPrices[globalPrices[i].stock_link].current_price;
                        }
                    }
                    return globalPrices[i].price;
                }
            } else {
                if (globalPrices[i].stock_link) {
                    var stockPrices = loadJson(STOCK_EXCHANGE_DATA_JSON_PATH);
                    if (stockPrices[globalPrices[i].stock_link]) {
                        return stockPrices[globalPrices[i].stock_link].current_price;
                    }
                }
                return globalPrices[i].price;
            }
        }
    }

    return 0;
}

/**
 * Gets the price of an item stack by its ID and NBT.
 * @param {IItemStack} stack - The item stack.
 * @returns {number} - The price of the item stack.
 */
function getPriceFromItemStack(stack) {
    var itemId = stack.getItemId();
    var itemTag = stack.getItemNbt();
    if (itemTag) {
        itemTag = itemTag.getCompound("tag");
    }
    return getPrice(itemId, itemTag);
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
