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
 * Calculates the number of NPCs visiting a shop in one day and provides detailed feedback data.
 * @param {IPlayer} player - The player.
 * @param {Object} shopData - The shop data.
 * @param {Object} playerShops - The server shops data.
 * @returns {Object} A JSON object containing detailed feedback data.
 */
function getDailyConsumersForShop(player, shopData, playerShops) {
    var mainRooms = shopData.property.main_room || [];
    // tellPlayer(player, "&6Calculating daily consumers for shop with main rooms: " + mainRooms.join(", "));
    var totalPublicSpaceSize = calculateCuboidGroupSize(player, generateCuboidGroup(player, mainRooms)).floor_space;

    var shopRating = calculateShopScore(player, shopData, playerShops, false).toFixed(2);
    var customerFlowMultiplier = getModuleValue(shopData, "customer_flow") || 1;
    var dailyConsumers = calculateDailyConsumers(shopRating, totalPublicSpaceSize, customerFlowMultiplier);

    // Gather details about upgrades and events affecting customer flow
    var upgradesData = loadJson(UPGRADES_JSON_PATH);
    var currentTime = world.getTotalTime();
    var contributingFactors = [];

    // Check upgrades
    for (var i = 0; i < shopData.upgrades.length; i++) {
        var upgrade = findJsonEntry(upgradesData.upgrades, "id", shopData.upgrades[i]);
        if (upgrade && upgrade.modules && upgrade.modules.customer_flow) {
            contributingFactors.push({
                name: upgrade.name,
                type: "Upgrade",
                value: upgrade.modules.customer_flow
            });
        }
    }

    // Check running events
    for (var i = 0; i < shopData.events.length; i++) {
        var event = shopData.events[i];
        var eventData = findJsonEntry(upgradesData.events, "id", event.id);
        if (eventData && isEventRunning(event, currentTime) && eventData.modules && eventData.modules.customer_flow) {
            contributingFactors.push({
                name: eventData.name,
                type: "Event",
                value: eventData.modules.customer_flow
            });
        }
    }

    return {
        mainRoomSize: totalPublicSpaceSize,
        shopRating: shopRating,
        customerFlowMultiplier: customerFlowMultiplier,
        dailyConsumers: dailyConsumers,
        contributingFactors: contributingFactors
    };
}