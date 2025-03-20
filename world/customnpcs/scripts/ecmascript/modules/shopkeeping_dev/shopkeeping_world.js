load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");

/**
 * Calculates the number of consumers visiting a shop in one IRL day (24 hours).
 * @param {number} shopRating - The rating of the shop (0 to 100).
 * @param {number} stockRoomSize - The size of the shop's stockroom.
 * @returns {number} The estimated number of consumers.
 */
function calculateDailyConsumers(shopRating, stockRoomSize) {
    // Base multiplier for shop rating (higher rating attracts more consumers)
    var ratingMultiplier = shopRating / 100;

    // Base multiplier for stockroom size (larger stockrooms can serve more consumers)
    var sizeMultiplier = log10(stockRoomSize + 1);

    // Base number of consumers per day
    var baseConsumers = 50;

    // Calculate the total number of consumers
    var totalConsumers = Math.round(baseConsumers * ratingMultiplier * sizeMultiplier);

    return totalConsumers;
}

/**
 * Calculates the number of NPCs visiting a shop in one day.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player shops data.
 * @returns {Object} An object containing the total room size and daily consumers.
 */
function getDailyConsumersForShop(player, shopId, playerShops) {
    if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
        throw new Error("Invalid shop ID: " + shopId);
    }

    var shop = playerShops[shopId];
    var mainRooms = shop.property.main_room || [];
    var totalRoomSize = 0;

    for (var i = 0; i < mainRooms.length; i++) {
        var room = mainRooms[i];
        var parts = room.split(":");
        var cuboidId = parts[0];
        var subCuboidId = parts.length > 1 ? parts[1] : null;

        try {
            totalRoomSize += calculateCuboidFloorSpace(player, cuboidId, subCuboidId);
        } catch (error) {
            throw new Error("Error calculating size for room: " + room + " - " + error.message);
        }
    }

    var shopRating = calculateShopScore(player, shopId, playerShops, false);
    var dailyConsumers = calculateDailyConsumers(shopRating, totalRoomSize);

    var result = {
        totalRoomSize: totalRoomSize,
        dailyConsumers: dailyConsumers
    };

    return result;
}