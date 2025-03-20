load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");

/**
 * Calculates the number of consumers visiting a shop in one IRL day (24 hours).
 * @param {number} shopRating - The rating of the shop (0 to 100).
 * @param {number} publicSpaceSize - The size of the shop's public space (main room).
 * @param {number} customerFlowMultiplier - The multiplier for customer flow from upgrades or events.
 * @returns {number} The estimated number of consumers.
 */
function calculateDailyConsumers(shopRating, publicSpaceSize, customerFlowMultiplier) {
    // Base multiplier for shop rating (higher rating attracts more consumers)
    var ratingMultiplier = shopRating / 100;

    // Base multiplier for public space size (larger public spaces attract more consumers)
    var sizeMultiplier = log10(publicSpaceSize + 1);

    // Base number of consumers per day
    var baseConsumers = 50;

    // Calculate the total number of consumers with the customer flow multiplier
    var totalConsumers = Math.round(baseConsumers * ratingMultiplier * sizeMultiplier * customerFlowMultiplier);

    return totalConsumers;
}

/**
 * Calculates the number of NPCs visiting a shop in one day.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player shops data.
 * @returns {number} The estimated number of NPCs visiting the shop in one day.
 */
function getDailyConsumersForShop(player, shopId, playerShops) {
    if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
        throw new Error("Invalid shop ID: " + shopId);
    }

    var shop = playerShops[shopId];
    var mainRooms = shop.property.main_room || [];
    var totalPublicSpaceSize = getCuboidListSize(player, mainRooms);

    var shopRating = calculateShopScore(player, shopId, playerShops, false);
    var customerFlowMultiplier = getModuleValue(shop, "customer_flow") || 1;
    var dailyConsumers = calculateDailyConsumers(shopRating, totalPublicSpaceSize, customerFlowMultiplier);

    return dailyConsumers;
}