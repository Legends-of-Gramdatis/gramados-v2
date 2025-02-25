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
function listShopUpgrades(player, shopId, playerShops) {
    var upgrades = loadUpgradesAndEvents(player);

    var shop = playerShops[shopId];
    if (!shop) {
        tellPlayer(player, "&4Shop not found! Contact an admin!");
        return;
    }

    var messageUpgrades1 = [];
    var messageUpgrades2 = [];
    var messageUpgrades3 = [];
    var proportion = 0;

    for (var i = 0; i < upgrades.upgrades.length; i++) {
        var upgrade = upgrades.upgrades[i];
        var canTakeUpgrade = canShopTakeUpgrade(player, shopId, upgrade);

        if (!includes(shop.upgrades, upgrade.id)) {
            if (canTakeUpgrade.canTake) {
                var entry = "&2:check: &a" + upgrade.name + " &8(ID: " + upgrade.id + ")&a : \n&7" + upgrade.description + "\n&6Cost: &r:money:&e" + getAmountCoin(upgrade.cost) + "\n&a:thumbsup: Shop can take this upgrade!\n&b-----------------------------------------";
                messageUpgrades2.push(entry);
                proportion++;
            } else {
                var entry = "&4:cross: &c" + upgrade.name + " &8(ID: " + upgrade.id + ")&a : \n &c- " + canTakeUpgrade.messages.join("\n &c- ") + "\n &7" + upgrade.description + "\n&6Cost: &r:money:&e" + getAmountCoin(upgrade.cost) + "\n&c:thumbsdown: Shop can't take this upgrade! \n&b-----------------------------------------";
                messageUpgrades3.push(entry);
            }
        } else {
            var entry = "&7:sun: &7" + upgrade.name + " &8(ID: " + upgrade.id + ")&7 : \n &7- Shop already has this upgrade! \n&7" + upgrade.description + "\n&7:thumbsup: Shop already has this upgrade! \n&b-----------------------------------------";
            messageUpgrades1.push(entry);
        }
    }

    var availableUpgrades = "&o&7" + shop.upgrades.length + " Owned &b&o, &c&o" + (upgrades.upgrades.length - shop.upgrades.length - proportion) + " Unavailable &b&o, &a&o" + proportion + " Available";
    tellPlayer(player, "&b=========================================\n&o&bUpgrades: " + availableUpgrades + "\n&b=========================================");
    
    // concatenate the messages in the right order
    var messageUpgrades = messageUpgrades1.concat(messageUpgrades3).concat(messageUpgrades2);
    storytellPlayer(player, messageUpgrades);
    tellPlayer(player, "&o&bUpgrades: " + availableUpgrades + "\n&b-----------------------------------------");
}

// function to display a formatted list of events with availability for a shop
function listShopEvents(player, shopId, playerShops) {
    var upgrades = loadUpgradesAndEvents(player);

    var shop = playerShops[shopId];
    if (!shop) {
        tellPlayer(player, "&4Shop not found! Contact an admin!");
        return;
    }

    var messageEvents1 = [];
    var messageEvents2 = [];
    var messageEvents3 = [];
    var proportion = 0;

    var running = shop.events.length;

    for (var i = 0; i < upgrades.events.length; i++) {
        var event = upgrades.events[i];
        var canStartEvent = canShopStartEvent(shopId, playerShops, event);

        if (!findJsonSubEntry(shop.events, "id", event.id)) {
            if (canStartEvent.canTake) {
                var entry = "&2:check: &a" + event.name + " &8(ID: " + event.id + ")&a : \n&7" + event.description + "\n&6Cost: &r:money:&e" + getAmountCoin(event.cost) + "\n&a:thumbsup: Shop can start this event!\n&b-----------------------------------------";
                messageEvents2.push(entry);
                proportion++;
            } else {
                var entry = "&4:cross: &c" + event.name + " &8(ID: " + event.id + ")&c : \n &c- " + canStartEvent.messages.join("\n &c- ") + "\n &7" + event.description + "\n&6Cost: &r:money:&e" + getAmountCoin(event.cost) + "\n&c:thumbsdown: Shop can't start this event! \n&b-----------------------------------------";
                messageEvents3.push(entry);
            }
        } else {
            if (canStartEvent.messages[0].startsWith("Event already running")) {
                var entry = "&7:sun: &7" + event.name + " &8(ID: " + event.id + ")&7 :\n &7" + event.description + "\n&7:thumbsup: Shop is currently running this event! \n&b-----------------------------------------";
                messageEvents1.push(entry);
            } else {
                var entry = "&4:cross: &c" + event.name + " &8(ID: " + event.id + ")&c :\n &7" + event.description + "\n&c:thumbsdown: Shop ran this event too recently! \n&b-----------------------------------------";
                messageEvents1.push(entry);
                running--;
            }
        }

    }

    var availableEvents = "&o&7" + running + " Running &b&o, &c&o" + (upgrades.events.length - running - proportion) + " Unavailable &b&o, &a&o" + proportion + " Available";

    tellPlayer(player, "&b=========================================\n&bEvents: " + availableEvents + "\n&b=========================================");
    
    // concatenate the messages in the right order
    var messageEvents = messageEvents1.concat(messageEvents3).concat(messageEvents2);
    storytellPlayer(player, messageEvents);
    tellPlayer(player, "&o&bEvents: " + availableEvents + "\n&b-----------------------------------------");
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

function canShopStartEvent(shopId, playerShops, event) {
    var shop = playerShops[shopId];
    var currentTime = world.getTotalTime();
    var messages = [];

    // Check if the event is already running
    for (var i = 0; i < shop.events.length; i++) {
        var runningEvent = shop.events[i];
        var eventEndTime = runningEvent.start_date + (runningEvent.duration * 72000);
        if (runningEvent.id === event.id) {
            if (currentTime < eventEndTime) {
                messages.push("Event already running: " + event.name);
                return { canTake: false, messages: messages };
            } else {
                messages.push("Event has been ran too recently: " + event.name);
            }
        }
    }

    // Check if the shop has enough cash
    if (shop.finances.stored_cash < event.cost) {
        messages.push("Not enough cash to start the event: " + event.name);
    }

    // Check if the shop meets the minimum reputation requirement
    if (event.min_reputation && shop.reputation_data.reputation < event.min_reputation) {
        messages.push("Not enough reputation to start the event: " + event.name);
    }

    return { canTake: messages.length === 0, messages: messages };
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