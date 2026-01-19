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

/**
 * Buys a shop.
 * @param {IPlayer} player - The player.
 * @param {object} shopData - The shop data.
 * @param {string} buyerName - The name of the buyer.
 */
function buyShop(player, shopData, buyerName) {

    if (!shopData.real_estate.is_for_sale) {
        tellPlayer(player, "&cShop &e" + shopData.shop.display_name + " &cis not for sale!");
        return;
    }

    if (shopData.roles.owner === buyerName) {
        tellPlayer(player, "&cYou can't buy a shop you are selling!");
        return;
    }

    var seller = shopData.roles.owner;

    var salePrice = shopData.real_estate.sale_price;
    var buyer = world.getPlayer(buyerName);
    if (!buyer) {
        tellPlayer(player, "&cBuyer &e" + buyerName + " &cis not online!");
        return;
    }

    if (!extractMoneyFromPouch(buyer, salePrice)) {
        tellPlayer(player, "&cBuyer &e" + buyerName + " &cdoes not have enough money! Sale price: &r:money:&e" + getAmountCoin(salePrice));
        return;
    }

    try {
        var player_name = player.getName();
    }
    catch (error) {
        var player_name = "Gramados";
    }

    // Transfer ownership of regions
    var regions = getShopRegions(player, array_merge(shopData.property.stock_room, shopData.property.main_room));
    for (var i = 0; i < regions.length; i++) {
        transferRegion(player, regions[i], buyerName);
    }

    // Give money to the seller
    addMoneyToPlayerPouchByName(seller, salePrice);

    // log shop reputation in history
    addReputationHistoryEntry(shopData, "Shop sold to " + buyerName, -(shopData.reputation_data.reputation * 0.1));

    // Decrease reputation by 10%
    shopData.reputation_data.reputation *= 0.9;

    shopData.roles.owner = buyerName;
    shopData.real_estate.is_for_sale = false;
    shopData.real_estate.last_sold_date = world.getTotalTime();
    shopData.real_estate.commercial_premises_value = getPremisesValue(player, regions);

    tellPlayer(player, "&aShop &e" + shopData.shop.display_name + " &ahas been sold to &e" + buyerName);
    tellPlayer(buyer, "&aYou have bought shop &e" + shopData.shop.display_name + " &afor &r:money:&e" + getAmountCoin(salePrice));
    tellPlayer(buyer, "&7Note: The shop's reputation has decreased by &e10%&7.");
}

/**
 * Sells a shop.
 * @param {IPlayer} player - The player.
 * @param {object} shopData - The shop data.
 * @param {string} salePrice - The sale price of the shop.
 */
function setShopForSale(player, shopData, salePrice) {

    if (!salePrice) {
        tellPlayer(player, "&cPlease specify a sale price for the shop!");
        return;
    }
    salePrice = getCoinAmount(salePrice);

    if (!hasPermission(player.getDisplayName(), shopData, PERMISSION_SELL_SHOP)) {
        tellPlayer(player, "&cYou don't have permission to sell this shop!");
        return;
    }

    var regionValue = getPremisesValue(player, getShopRegions(player, array_merge(shopData.property.stock_room, shopData.property.main_room)));
    if (salePrice < (regionValue + shopData.finances.stored_cash)) {
        tellPlayer(player, "&cSale price must be at least &r:money:&e" + getAmountCoin(regionValue + shopData.finances.stored_cash));
        if (shopData.finances.stored_cash > 0) {
            tellPlayer(player, "&cCurrent stored cash in shop: &r:money:&e" + getAmountCoin(shopData.finances.stored_cash));
        }
        tellPlayer(player, "&cCurrent premises value: &r:money:&e" + getAmountCoin(regionValue));
        return;
    }

    var currentTime = world.getTotalTime();
    if (currentTime - shopData.real_estate.last_sold_date < 7 * 24 * 60 * 60 * 20) {
        tellPlayer(player, "&cYou cannot sell this shop within 1 week of buying it!");
        return;
    }

    shopData.real_estate.sale_price = salePrice;
    shopData.real_estate.is_for_sale = true;
    tellPlayer(player, "&aShop &e" + shopData.shop.display_name + " &ais now for sale at &r:money:&e" + getAmountCoin(salePrice));
    tellPlayer(player, "&7Note: If a player buys this shop, its reputation will &edecrease &7by &e10%&7.");
}

/**
 * Function to cancel a shop sale
 * @param {IPlayer} player - The player.
 * @param {object} shopData - The shop data.
 */
function cancelShopSale(player, shopData) {
    if (!hasPermission(player.getName(), shopData, PERMISSION_SELL_SHOP)) {
        tellPlayer(player, "&cYou don't have permission to sell this shop!");
        return;
    }

    if (shopData.real_estate.is_for_sale) {
        shopData.real_estate.is_for_sale = false;
        tellPlayer(player, "&aShop &e" + shopData.shop.display_name + " &ais no longer for sale.");
    } else {
        tellPlayer(player, "&cShop &e" + shopData.shop.display_name + " &cis not for sale!");
    }
}

/**
 * Function to get the sale info of a shop
 * @param {IPlayer} player - The player.
 * @param {object} shopData - The shop data.
 */
function getShopSaleInfo(player, shopData) {
    if (shopData.real_estate.is_for_sale) {
        tellPlayer(player, "&aShop &e" + shopData.shop.display_name + " &ais for sale at &r:money:&e" + getAmountCoin(shopData.real_estate.sale_price));
    } else {
        tellPlayer(player, "&cShop &e" + shopData.shop.display_name + " &cis not for sale!");
    }
}