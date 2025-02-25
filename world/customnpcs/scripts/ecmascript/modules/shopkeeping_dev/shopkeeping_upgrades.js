var UPGRADES_JSON_PATH = "world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shop_upgrades.json";

// function that gets the list of upgrades from json
function loadUpgrades(player) {
    var result = {
        "upgrades" : [],
        "events" : []
    }

    var jsonUpgrades = loadJson(UPGRADES_JSON_PATH);
    if (!jsonUpgrades) {
        tellPlayer(player, "&4No upgrades found! Contact an admin!");
    }
    // tellPlayer(player, "&6Upgrades found: " + jsonUpgrades.upgrades.length);

    for (var i = 0; i < jsonUpgrades.upgrades.length; i++) {
        var upgrade = jsonUpgrades.upgrades[i];
        // tellPlayer(player, "&6Checking upgrade " + upgrade["name"]);
        if (isUpgradeRepeatable(player, upgrade)) {
            result.events.push(upgrade);
            // tellPlayer(player, "&6Upgrade " + upgrade.name + " is repeatable!");
        } else {
            result.upgrades.push(upgrade);
            // tellPlayer(player, "&6Upgrade " + upgrade.name + " is not repeatable!");
        }
    }

    return result;
}

// function to get if an upgrade is repeatable or not
function isUpgradeRepeatable(player, upgrade) {
    // tellPlayer(player, "Checking upgrade " + upgrade.name);
    // If it has an "repeatable" key, return true
    return upgrade.repeatable;
}

// function to display a formatted list of upgrades and events
function listUpgrades(player) {
    var upgrades = loadUpgrades(player);

    var messageUpgrades = [];
    var messageEvents = [];

    for (var i = 0; i < upgrades.upgrades.length; i++) {
        var upgrade = upgrades.upgrades[i];


        var entry = "&6" + upgrade.name + "&f: \n &7" + upgrade.description + "\n &6Cost: &r:money:&e" + getAmountCoin(upgrade.cost);
        messageUpgrades.push(entry);
    }

    for (var i = 0; i < upgrades.events.length; i++) {
        var event = upgrades.events[i].name;
        messageEvents.push(event);
    }

    tellPlayer(player, "&bUpgrades: ");
    storytellPlayer(player, messageUpgrades);
    tellPlayer(player, "&bEvents: ");
    storytellPlayer(player, messageEvents);
}

// function to display a formatted list of upgrades and events for a shop
function listShopUpgrades(player, shopId) {
    var upgrades = loadUpgrades(player);
    var shopUpgrades = getShopUpgrades(player, shopId);

    var messageUpgrades = [];
    var messageEvents = [];

    for (var i = 0; i < upgrades.upgrades.length; i++) {
        tellPlayer(player, "&6Checking if shop can take upgrade " + upgrades.upgrades[i].name);
        // Check if the shop has the upgrades if this upgrade is dependent on another
        var upgrade = upgrades.upgrades[i];
        var canTakeUpgrade = canShopTakeUpgrade(player, shopId, upgrade);

        if (canTakeUpgrade.canTake) {
            var entry = "&6" + upgrade.name + "&f: \n &7" + upgrade.description + "\n &6Cost: &r:money:&e" + getAmountCoin(upgrade.cost);
            messageUpgrades.push(entry);
        } else {
            var entry = "&6" + upgrade.name + "&f: \n &7" + upgrade.description + "\n &6Cost: &r:money:&e" + getAmountCoin(upgrade.cost) + "\n &4" + canTakeUpgrade.messages.join("\n &4");
            messageUpgrades.push(entry);
        }
    }

    for (var i = 0; i < upgrades.events.length; i++) {
        var event = upgrades.events[i].name;
        messageEvents.push(event);
    }

    tellPlayer(player, "&bUpgrades: ");
    storytellPlayer(player, messageUpgrades);
    tellPlayer(player, "&bEvents: ");
    storytellPlayer(player, messageEvents);
}



// function to tell if yes or no the shop can take taht upgrade
function canShopTakeUpgrade(player, shopId, upgrade) {
    var result = {
        "canTake" : true,
        "messages" : []
    }
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    var shopData = playerShops[shopId];
    if (!shopData) {
        result.canTake = false;
        result.messages.push("Shop data not found!");
        return result;
    }

    if (!shopData.upgrades) {
        shopData.upgrades = [];
    }

    // if upgrade has "min_reputation" key, check if the shop has the required reputation
    if (upgrade.min_reputation) {
        var requiredReputation = upgrade.min_reputation;
        if (shopData.reputation_data.reputation < requiredReputation) {
            result.canTake = false;
            result.messages.push("Shop doesn't have the required reputation!");
            return result;
        }
        if (upgrade.max_reputation && shopData.reputation_data.reputation > upgrade.max_reputation) {
            result.canTake = false;
            result.messages.push("Shop has too much reputation!");
            return result;
        }
    }

    // if upgrade has "requires" key, check if the shop has the required upgrades
    if (!hasDependentUpgrades(player, upgrade, shopData.upgrades)) {
        result.canTake = false;
        result.messages.push("Shop doesn't have the required upgrades!");
        return result;
    }

    // if ungrade cost is inferior to the shop's money, return true
    if (upgrade.cost <= shopData.finances.stored_cash) {
        return result;
    }
}

// function to get shop's current upgrades (list of ids)
function getShopUpgrades(player, shopId) {
    var playerShops = loadJson(SERVER_SHOPS_JSON_PATH);
    var shopData = playerShops[shopId];
    // tellPlayer(player, "Shop data: " + JSON.stringify(shopData));

    // tellPlayer(player, "Shop data: " + shopData.upgrades);

    return shopData.upgrades;
}

// Function to see if one upgarde has dependent upgrades and if they are satisfied
function hasDependentUpgrades(player, upgrade, availableUpgrades) {
    if (!upgrade.requires) {
        return true;
    }
    var dependency_count = upgrade.requires.length;
    var dependencies = upgrade.requires;

    for (var i = 0; i < dependency_count; i++) {
        var dependency = dependencies[i];
        if (!includes(availableUpgrades, dependency)) {
            tellPlayer(player, "&cShop doesn't have the required upgrades!");
            return false;
        }
    }

    tellPlayer(player, "&aShop has the required upgrades!");

    return true;
}
