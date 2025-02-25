var UPGRADES_JSON_PATH = "world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/shop_upgrades.json";

// function that gets the list of upgrades from json
function loadUpgradesAndEvents(player) {
    var jsonUpgrades = loadJson(UPGRADES_JSON_PATH);
    if (!jsonUpgrades) {
        tellPlayer(player, "&4No upgrades found! Contact an admin!");
    }

    return jsonUpgrades;
}

// function to display a formatted list of upgrades
function listAllUpgrades(player) {
    var upgrades = loadUpgradesAndEvents(player);

    var messageUpgrades = [];

    for (var i = 0; i < upgrades.upgrades.length; i++) {
        var upgrade = upgrades.upgrades[i];


        var entry = "&3:arrow_r:" + upgrade.name + ": \n&7" + upgrade.description + "\n&6Cost: &r:money:&e" + getAmountCoin(upgrade.cost) + "&6, Min Reputation: &e:sun:" + (upgrade.min_reputation || 0) + "\n&b-----------------------------------------";
        messageUpgrades.push(entry);
    }

    tellPlayer(player, "&b=========================================\n&bUpgrades: \n&b=========================================");
    storytellPlayer(player, messageUpgrades);
}

// function to display a formatted list of events
function listAllEvents(player) {
    var events = loadUpgradesAndEvents(player);

    var messageEvents = [];

    for (var i = 0; i < events.events.length; i++) {
        var event = events.events[i];
        var entry = "&3:arrow_r:" + event.name + ": \n&7" + event.description + "\n&6Cost: &r:money:&e" + getAmountCoin(event.cost) + "&6, Min Reputation: &e:sun:" + (event.min_reputation || 0) + "\n&b-----------------------------------------";
        messageEvents.push(entry);
    }
    tellPlayer(player, "&b=========================================\n&bEvents: \n&b=========================================");
    storytellPlayer(player, messageEvents);
}

// function to display a formatted list of upgrades with availability for a shop
function listShopUpgrades(player, shopId) {
    var upgrades = loadUpgradesAndEvents(player);

    var messageUpgrades = [];
    var proportion = 0;

    for (var i = 0; i < upgrades.upgrades.length; i++) {
        var upgrade = upgrades.upgrades[i];
        var canTakeUpgrade = canShopTakeUpgrade(player, shopId, upgrade);

        if (canTakeUpgrade.canTake) {
            var entry = "&2:check: &a" + upgrade.name + ": \n&7" + upgrade.description + "\n&6Cost: &r:money:&e" + getAmountCoin(upgrade.cost) + "\n&a:thumbsup: Shop can take this upgrade!\n&b-----------------------------------------";
            messageUpgrades.push(entry);
            proportion++;
        } else {
            var entry = "&4:cross: &c" + upgrade.name + ":" + "\n &c- " + canTakeUpgrade.messages.join("\n &c- ") + "\n &7" + upgrade.description + "\n&6Cost: &r:money:&e" + getAmountCoin(upgrade.cost) + "\n&c:thumbsdown: Shop can't take this upgrade! \n&b-----------------------------------------";
            messageUpgrades.push(entry);
        }
    }

    // make a proportion of available upgrades (x/y)
    var availableUpgrades = "&a" + proportion + "&b/" + upgrades.upgrades.length;
    tellPlayer(player, "&b=========================================\n&bPossible Upgrades: " + availableUpgrades + "\n&b=========================================");
    storytellPlayer(player, messageUpgrades);
}

// function to display a formatted list of events with availability for a shop
function listShopEvents(player, shopId) {
    var upgrades = loadUpgradesAndEvents(player);

    var messageEvents = [];
    var proportion = 0;

    for (var i = 0; i < upgrades.events.length; i++) {
        var event = upgrades.events[i];
        var canTakeUpgrade = canShopTakeUpgrade(player, shopId, event);

        if (canTakeUpgrade.canTake) {
            var entry = "&2:check: &a" + event.name + ": \n&7" + event.description + "\n&6Cost: &r:money:&e" + getAmountCoin(event.cost) + "\n&a:thumbsup: Shop can start this event!\n&b-----------------------------------------";
            messageEvents.push(entry);
            proportion++;
        } else {
            var entry = "&4:cross: &c" + event.name + ":" + "\n &c- " + canTakeUpgrade.messages.join("\n &c- ") + "\n &7" + event.description + "\n&6Cost: &r:money:&e" + getAmountCoin(event.cost) + "\n&c:thumbsdown: Shop can't start this event! \n&b-----------------------------------------";
            messageEvents.push(entry);
        }
    }

    // make a proportion of available events (x/y)
    var availableEvents = "&a" + proportion + "&b/" + upgrades.events.length;

    tellPlayer(player, "&b=========================================\n&bPossible Events: " + availableEvents + "\n&b=========================================");
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
        }
        if (upgrade.max_reputation && shopData.reputation_data.reputation > upgrade.max_reputation) {
            result.canTake = false;
            result.messages.push("Shop has too much reputation!");
        }
    }

    // if upgrade has "requires" key, check if the shop has the required upgrades
    if (!hasDependentUpgrades(player, upgrade, shopData.upgrades)) {
        result.canTake = false;
        result.messages.push("Shop doesn't have the required upgrades!");
    }

    // if upgrade cost is superior to the shop's money
    if (upgrade.cost > shopData.finances.stored_cash) {
        result.canTake = false;
        result.messages.push("Shop doesn't have enough money!");
    }

    return result;
}

function canShopStartEvent(player, shopId, event) {
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

    if (!shopData.events) {
        shopData.events = [];
    }

    // if event has "min_reputation" key, check if the shop has the required reputation
    if (event.min_reputation) {
        var requiredReputation = event.min_reputation;
        if (shopData.reputation_data.reputation < requiredReputation) {
            result.canTake = false;
            result.messages.push("Shop doesn't have the required reputation!");
        }
        if (event.max_reputation && shopData.reputation_data.reputation > event.max_reputation) {
            result.canTake = false;
            result.messages.push("Shop has too much reputation!");
        }
    }

    // if event has "requires" key, check if the shop has the required upgrades
    if (!hasDependentUpgrades(player, event, shopData.upgrades)) {
        result.canTake = false;
        result.messages.push("Shop doesn't have the required upgrades!");
    }

    // if event cost is superior to the shop's money
    if (event.cost > shopData.finances.stored_cash) {
        result.canTake = false;
        result.messages.push("Shop doesn't have enough money!");
    }

    return result;
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
            // tellPlayer(player, "&cShop doesn't have the required upgrades!");
            return false;
        }
    }

    // tellPlayer(player, "&aShop has the required upgrades!");

    return true;
}