var GLOBAL_PRICES_JSON_PATH = "world/customnpcs/scripts/globals/global_prices.json";

/**
 * Function to sanitize a string (if "", set to null)
 * @param {string} string - The string to sanitize.
 * @returns {string|null} - The sanitized string or null.
 */
function sanitizeString(string) {
    return string === "" ? null : string;
}

/**
 * Function to check "player_shops.json" data integrity
 * @param {IPlayer} player - The player.
 * @param {string} shopId - The ID of the shop.
 * @param {object} playerShops - The player shops data.
 * @returns {boolean} - True if the shop exists, false otherwise.
 */
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

/**
 * Function to get a list of all shops a given player owns
 * @param {IPlayer} player - The player.
 * @param {string} ownername - The name of the shop owner.
 * @param {object} serverShops - The server shops data.
 * @returns {Array} - A list of shop IDs owned by the player.
 */
function listShops(player, ownername, serverShops) {
    var shops = [];
    for (var shopId in serverShops) {
        if (serverShops[shopId].roles.owner === ownername) {
            shops.push(shopId);
        }
    }

    if (shops.length === 0) {
        player.message("No shops found for " + ownername + "!");
    } /*else {
        player.message("Shops you own: " + shops.join(", "));
    }*/

    return shops;
}

/**
 * Function to check if a shop with given ID exists or not
 * @param {string} shopId - The ID of the shop.
 * @param {object} playerShops - The player shops data.
 * @returns {boolean} - True if the shop exists, false otherwise.
 */
function shopExists(shopId, playerShops) {
    return !!playerShops[shopId];
}

/**
 * Function to check if a shop instance isn't missing any data (update proof)
 * @param {IPlayer} player - The player.
 * @param {string} shopID - The ID of the shop.
 * @param {object} playerShops - The player shops data.
 * @param {boolean} log - Whether to log messages to the player.
 * @returns {object} - An object containing validity, critical status, and missing data.
 */
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

/**
 * Function to convert underscores to spaces in a string
 * @param {string} str - The string to convert.
 * @returns {string} - The converted string.
 */
function convertUnderscore(str) {
    return str.replace(/_/g, " ");
}

/**
 * Function to get shop category json from type
 * @param {string} shopType - The type of the shop.
 * @returns {object|null} - The shop category entry or null if not found.
 */
function getCategoryJson(shopType) {
    var shop_categories = loadJson(SHOP_CATEGORIES_JSON_PATH);
    var shop_entry = null;
    for (var i = 0; i < shop_categories["entries"].length; i++) {
        var entry = shop_categories["entries"][i];
        if (entry.name === shopType) {
            shop_entry = entry;
            return shop_entry;
        }
    }
    return shop_entry;
}

// /**
//  * Retrieves shop type data from "shop_categories.json".
//  * @param {string} shopType - The type of the shop.
//  * @returns {Object|null} An object containing shop type data or null if not found.
//  */
// function getShopTypeData(shopType) {
//     var shopCategories = loadJson(SHOP_CATEGORIES_JSON_PATH);
//     if (!shopCategories) {
//         throw new Error("Shop categories not found! Contact an admin.");
//     }

//     for (var i = 0; i < shopCategories.entries.length; i++) {
//         var entry = shopCategories.entries[i];
//         if (entry.name === shopType) {
//             return {
//                 base_markup: entry.general_ref.base_markup || 0,
//                 item_variety_per_visit: entry.general_ref.item_variety_per_visit || 0,
//                 item_variety_variance: entry.general_ref.item_variety_variance || 0,
//                 items_per_type: entry.general_ref.items_per_type || 0,
//                 items_per_type_variance: entry.general_ref.items_per_type_variance || 0
//             };
//         }
//     }

//     return null;
// }

/**
 * Gets the reference price of an item.
 * @param {IPlayer} player - The player.
 * @param {string} itemId - The item ID.
 * @param {Object} itemTag - The item tag.
 * @returns {number} - The reference price of the item.
 */
function getReferencePrice(player, itemId, itemTag) {
    // tellPlayer(player, "&cGetting reference price for " + itemId + ", loading json from " + GLOBAL_PRICES_JSON_PATH);
    var globalPrices = loadJson(GLOBAL_PRICES_JSON_PATH);
    if (!globalPrices) {
        tellPlayer(player, "&cGlobal prices not found!");
        return 0;
    }

    // global price a json object. Every key is the item id and the value is a json object with "value", "display_name", and sometimes (optionnal) "tag"
    if (globalPrices[itemId]) {
        var item = globalPrices[itemId];
        if (item.tag) {
            if (JSON.stringify(item.tag) === JSON.stringify(itemTag)) {
                return item.value;
            }
        } else {
            return item.value;
        }
    }

    return 0;
}