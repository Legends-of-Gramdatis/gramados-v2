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
 * @param {object} player - The player object.
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
 * @param {object} player - The player object.
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
 * @param {object} player - The player object.
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