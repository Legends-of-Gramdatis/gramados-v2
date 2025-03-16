var GLOBAL_PRICES_JSON_PATH = "world/customnpcs/scripts/globals/global_prices.json";

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
                    return globalPrices[i].price;
                }
            } else {
                return globalPrices[i].price;
            }
        }
    }

    return 0;
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
