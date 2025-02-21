// Function to sanitize a string (if "", set to null)
function sanitizeString(string) {
    return string === "" ? null : string;
}

// function to check "player_shops.json" data integrity
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

// Function to get a list of all shops a given player owns
function listShops(player, serverShops) {
    var shops = [];
    for (var shopId in serverShops) {
        if (serverShops[shopId].roles.owner === player.getName()) {
            shops.push(shopId);
        }
    }

    if (shops.length === 0) {
        player.message("No shops found for " + player.getName() + "!");
    } else {
        player.message("Shops you own: " + shops.join(", "));
    }

    return shops;
}

// Function to check if a shop with given ID exists or not
function shopExists(shopId, playerShops) {
    return !!playerShops[shopId];
}

// Function to check ownership of a shop to a player
function isOwner(player, shopId) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    if (!playerShops || !playerShops[shopId]) {
        player.message("Shop not found!");
        listShops(player);
        return false;
    }

    return playerShops[shopId].roles.owner === player.getName();
}

// function to check if a shop instance isn't missing any data (update proof)
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

// Function to get the list of permissions a player has in a shop
function getPermissions(player, playerShops, shopID) {
    var permissions = [];

    if (playerShops[shopID].roles.owner === player.getName()) {
        permissions.push(PERMISSION_OPEN_CLOSE_SHOP);
        permissions.push(PERMISSION_SET_PRICES);
        permissions.push(PERMISSION_MANAGE_PERMISSIONS);
        permissions.push(PERMISSION_TAKE_MONEY);
        permissions.push(PERMISSION_MANAGE_STOCK);
    } else if (playerShops[shopID].roles.managers.includes(player.getName())) {
        permissions.push(PERMISSION_OPEN_CLOSE_SHOP);
        permissions.push(PERMISSION_SET_PRICES);
        permissions.push(PERMISSION_MANAGE_PERMISSIONS);
        permissions.push(PERMISSION_TAKE_MONEY);
        permissions.push(PERMISSION_MANAGE_STOCK);
    } else if (playerShops[shopID].roles.cashiers.includes(player.getName())) {
        permissions.push(PERMISSION_OPEN_CLOSE_SHOP);
        permissions.push(PERMISSION_TAKE_MONEY);
    } else if (playerShops[shopID].roles.stock_keepers.includes(player.getName())) {
        permissions.push(PERMISSION_OPEN_CLOSE_SHOP);
        permissions.push(PERMISSION_MANAGE_STOCK);
    } else if (playerShops[shopID].roles.assistants.includes(player.getName())) {
        permissions.push(PERMISSION_OPEN_CLOSE_SHOP);
    }

    return permissions;
}

// Function to get permissions of a player in a shop
function checkPermissions(player, shopID, playerShops, permission) {
    var permissions = getPermissions(player, playerShops, shopID);
    return permissions.includes(permission);
}