load("world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shopkeeping_utils.js")
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js")

/**
 * Function to get the shop name
 * @param {IPlayer} player - The player.
 * @param {object} shopData - The shop data.
 * @returns {string} - The new shop name.
 */
function setShopName(player, shopData, name) {
    shopData.shop.display_name = convertUnderscore(name);
    tellPlayer(player, "&aShop name set to: &e" + shopData.shop.display_name);
}

/**
 * Function to get the shop type
 * @param {IPlayer} player - The player.
 * @param {object} shopData - The shop data.
 * @returns {string} - The new shop type.
 */
function setShopType(player, shopData, type) {
    shopData.shop.type = type;
    initStockRoom(player, shopData);
    removeOutdatedListedItems(player, shopData, type);
    tellPlayer(player, "&aShop type set to: &e" + type);
}

/**
 * Function to get the shop region
 * @param {IPlayer} player - The player.
 * @param {object} shopData - The shop data.
 * @returns {string} - The new shop region.
 */
function setShopRegion(player, shopData, region) {
    if (!checkRegionExists(region)) {
        tellPlayer(player, "&cInvalid region: &e" + region);
        return;
    }
    shopData.property.region = region;
    tellPlayer(player, "&aShop region set to: &e" + region);
}

/**
 * Function to get the shop sub-region
 * @param {IPlayer} player - The player.
 * @param {object} shopData - The shop data.
 * @returns {string} - The new shop sub-region.
 */
function setShopSubRegion(player, shopData, subRegion) {
    if (!checkSubRegionExists(shopData.property.region, subRegion)) {
        tellPlayer(player, "&cInvalid sub-region: &e" + subRegion);
        return;
    }
    shopData.property.sub_region = subRegion;
    tellPlayer(player, "&aShop sub-region set to: &e" + subRegion);
}

/**
 * Function to set the shop money
 * @param {IPlayer} player - The player.
 * @param {object} shopData - The shop data.
 * @param {string} money - The new shop money.
 */
function setShopMoney(player, shopData, money) {
    shopData.finances.stored_cash = getCoinAmount(money);
    tellPlayer(player, "&aShop now has &r:money:&e" + money + "&r&a in store.");
}

// /**
//  * Adds a stock room to the player's shop.
//  * @param {IPlayer} player - The player.
//  * @param {Object} shopData - The shop data.
//  * @param {string} value - The stock room value.
//  */
// function addStockRoom(player, shopData, value) {
//     shopData.property.stock_room.push(value);
//     shopData.property.stock_room_size = calculateStockRoomSize(player, shopData);
// }



/**
 * Function to add a stock or main room to the shop
 * @param {IPlayer} player - The player.
 * @param {object} shopData - The shop data.
 * @param {string} roomType - The room type. Either "stock_room" or "main_room".
 * @param {string} roomValue - The room cuboid name and id.
 */
function addRoom(player, shopData, roomType, roomValue) {
    if (roomType !== "stock_room" && roomType !== "main_room") {
        tellPlayer(player, "&cInvalid room type: &e" + roomType);
        tellPlayer(player, "&cValid room types: &estock_room, main_room");
        return;
    }
    if (!shopData.property[roomType]) {
        shopData.property[roomType] = [];
    }
    shopData.property[roomType].push(roomValue);

    var size = 0;
    if (roomType === "stock_room") {
        size = calculateStockRoomSize(player, shopData);
        shopData.property.stock_room_size = size;
        tellPlayer(player, "&aStock room size: &e" + size + " air blocks");
    } else {
        var size = 0;
        for (var i = 0; i < shopData.property.main_room.length; i++) {
            var cuboid = shopData.property.main_room[i]
            var decomposed_cuboid_name = cuboid.split(":");
            var cuboid_name = decomposed_cuboid_name[0];
            var sub_cuboid_id = decomposed_cuboid_name[1];
            size += calculateCuboidSize(player, cuboid_name, [sub_cuboid_id]);
        }
        tellPlayer(player, "&aMain room size: &e" + size + " air blocks");
    }

    tellPlayer(player, "&aRoom added to shop: &e" + roomValue);
}

/**
 * Removes a room from the specified room type in the shop.
 * @param {IPlayer} player - The player.
 * @param {Object} shopData - The shop data.
 * @param {string} roomType - The type of room ("stock_room" or "main_room").
 * @param {string|number} roomValue - The room index or name.
 * @returns {boolean} - True if the room was removed, false otherwise.
 */
function removeRoom(player, shopData, roomType, roomValue) {
    if (!shopData.property || !shopData.property[roomType]) {
        tellPlayer(player, "&cNo rooms of type &e" + roomType + "&c found in the shop.");
        return false; // Room type doesn't exist in the shop data
    }
    
    var roomArray = shopData.property[roomType];
    var index = parseInt(roomValue);
    
    if (!isNaN(index)) {
        if (index >= 0 && index < roomArray.length) {
            roomArray.splice(index, 1);
            tellPlayer(player, "&aRoom removed from shop: &e" + roomValue);
        } else {
            tellPlayer(player, "&cInvalid room index: &e" + index);
            return false; // Index out of bounds
        }
    } else {
        var roomIndex = roomArray.indexOf(roomValue);
        if (roomIndex !== -1) {
            roomArray.splice(roomIndex, 1);
            tellPlayer(player, "&aRoom removed from shop: &e" + roomValue);
        } else {
            tellPlayer(player, "&cRoom not found in shop: &e" + roomValue);
            return false; // Room not found
        }
    }
    
    if (roomType === "stock_room") {
        shopData.property.stock_room_size = calculateStockRoomSize(player, shopData);
        tellPlayer(player, "&aStock room size: &e" + shopData.property.stock_room_size + " air blocks");
    }

    // tellPlayer(player, "&aRoom removed from shop: &e" + roomValue);
    
    return true;
}

// getDefaultMargin
/**
 * Function to get the shop's default margin
 * @param {IPlayer} player - The player.
 * @param {object} shopData - The shop data.
 * @returns {number} - The shop's default margin.
 */
function getShopDefaultMarginPercent(player, shopData) {
    if (!shopData.finances.default_margin) {
        tellPlayer(player, "&cNo default margin set for this shop! Using 20% as default.");
        return "20%";
    }
    return shopData.finances.default_margin * 100 + "%";
}

/**
 * Function to set the shop's default margin
 * @param {IPlayer} player - The player.
 * @param {object} shopData - The shop data.
 * @param {number} margin - The new default margin.
 */
function setShopDefaultMarginPercent(player, shopData, margin) {
    if (!hasPermission(player.getName(), shopData, PERMISSION_SET_PRICES)) {
        tellPlayer(player, "&cYou don't have permission to set prices for this shop!");
        return;
    }

    if (!margin) {
        tellPlayer(player, "&cInvalid command! Usage: &e$shop price <shopID> default <percentage>");
        return;
    }

    if (!margin.endsWith("%")) {
        tellPlayer(player, "&cInvalid percentage format! Use a percentage value (e.g., 10%)");
        return;
    }

    var percent = parseFloat(margin.slice(0, -1));
    if (isNaN(percent)) {
        tellPlayer(player, "&cInvalid percentage value!");
        return;
    }
    shopData.finances.default_margin = percent / 100;
    tellPlayer(player, "&aDefault margin set to &e" + margin + " &afor shop &e" + shopData.shop.display_name);
}