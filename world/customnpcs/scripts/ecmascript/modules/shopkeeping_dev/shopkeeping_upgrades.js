/**
 * Loads the list of upgrades and events from a JSON file.
 * @param {Object} player - The player object.
 * @returns {Object} The JSON object containing upgrades and events.
 */
function loadUpgradesAndEvents(player) {
    var jsonUpgrades = loadJson(UPGRADES_JSON_PATH);
    if (!jsonUpgrades) {
        tellPlayer(player, "&4No upgrades found! Contact an admin!");
    }

    return jsonUpgrades;
}

/**
 * Displays a formatted list of all upgrades to the player.
 * @param {Object} player - The player object.
 */
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

/**
 * Displays a formatted list of all events to the player.
 * @param {Object} player - The player object.
 */
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

/**
 * Displays a formatted list of upgrades with availability for a specific shop.
 * @param {Object} player - The player object.
 * @param {string} shopId - The ID of the shop.
 * @param {Object} playerShops - The JSON object containing all player shops.
 */
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

    if (!shop.upgrades) {
        shop.upgrades = [];
        playerShops[shopId] = shop;
        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    }

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

/**
 * Displays a formatted list of events with availability for a specific shop.
 * @param {Object} player - The player object.
 * @param {string} shopId - The ID of the shop.
 * @param {Object} playerShops - The JSON object containing all player shops.
 */
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

    if (!shop.events) {
        shop.events = [];
        playerShops[shopId] = shop;
        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    }

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

/**
 * Determines if a shop can take a specific upgrade.
 * @param {Object} player - The player object.
 * @param {string} shopId - The ID of the shop.
 * @param {Object} upgrade - The upgrade object.
 * @returns {Object} An object containing a boolean 'canTake' and an array of 'messages'.
 */
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

/**
 * Determines if a shop can start a specific event.
 * @param {string} shopId - The ID of the shop.
 * @param {Object} playerShops - The JSON object containing all player shops.
 * @param {Object} event - The event object.
 * @returns {Object} An object containing a boolean 'canTake' and an array of 'messages'.
 */
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

/**
 * Checks if a shop has the required dependent upgrades for a specific upgrade.
 * @param {Object} player - The player object.
 * @param {Object} upgrade - The upgrade object.
 * @param {Array} availableUpgrades - The list of available upgrades.
 * @returns {boolean} True if all dependent upgrades are satisfied, otherwise false.
 */
function hasDependentUpgrades(player, upgrade, availableUpgrades) {
    if (!upgrade.requires) {
        return true;
    }
    var dependency_count = upgrade.requires.length;
    var dependencies = upgrade.requires;

    for (var i = 0; i < dependency_count; i++) {
        var dependency = dependencies[i];
        if (!includes(availableUpgrades, dependency)) {
            return false;
        }
    }

    return true;
}

/**
 * Applies a specific upgrade to a shop.
 * @param {Object} player - The player object.
 * @param {string} shopId - The ID of the shop.
 * @param {string} upgradeId - The ID of the upgrade.
 * @param {Object} playerShops - The JSON object containing all player shops.
 */
function takeShopUpgrade(player, shopId, upgradeId, playerShops) {
    var shop = playerShops[shopId];
    if (!shop) {
        tellPlayer(player, "&cShop with ID &e" + shopId + " &cnot found!");
        return;
    }
    if (!hasPermission(player.getName(), shop, PERMISSION_TAKE_UPGRADE)) {
        tellPlayer(player, "&cYou don't have permission to take upgrades for this shop!");
        return;
    }
    var upgrades = loadUpgradesAndEvents(player).upgrades;
    var upgrade = findJsonEntry(upgrades, "id", upgradeId);

    if (!upgrade) {
        tellPlayer(player, "&cUpgrade not found: &e" + upgradeId);
        return;
    }

    if (includes(shop.upgrades, upgradeId)) {
        tellPlayer(player, "&cUpgrade already taken: &e" + upgradeId);
        return;
    }

    var canTake = canShopTakeUpgrade(player, shopId, upgrade);
    if (!canTake.canTake) {
        tellPlayer(player, "&cCannot take upgrade: &e" + upgradeId);
        for (var i = 0; i < canTake.messages.length; i++) {
            tellPlayer(player, "&c- " + canTake.messages[i]);
        }
        return;
    }

    if (shop.finances.stored_cash < upgrade.cost) {
        tellPlayer(player, "&cNot enough money in the shop's cash register!");
        return;
    }

    shop.upgrades.push(upgradeId);
    shop.finances.stored_cash -= upgrade.cost;
    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    tellPlayer(player, "&aSuccessfully applied upgrade: &e" + upgrade.name);

    // Update storage room size if the upgrade affects storage capacity
    if (upgrade.modules && upgrade.modules.storage_capacity) {
        shop.property.stock_room_size = calculateStockRoomSize(player, shopId, playerShops);
        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aStorage room size updated!");
    }
}

/**
 * Starts a specific event for a shop.
 * @param {Object} player - The player object.
 * @param {string} shopId - The ID of the shop.
 * @param {string} eventId - The ID of the event.
 * @param {Object} playerShops - The JSON object containing all player shops.
 */
function takeShopEvent(player, shopId, eventId, playerShops) {
    var shop = playerShops[shopId];
    if (!shop) {
        tellPlayer(player, "&cShop with ID &e" + shopId + " &cnot found!");
        return;
    }
    if (!hasPermission(player.getName(), shop, PERMISSION_TAKE_EVENT)) {
        tellPlayer(player, "&cYou don't have permission to take events for this shop!");
        return;
    }
    var events = loadUpgradesAndEvents(player).events;
    var event = findJsonEntry(events, "id", eventId);

    if (!event) {
        tellPlayer(player, "&cEvent not found: &e" + eventId);
        return;
    }

    // if shop has no event entry, create one
    if (!shop.events) {
        shop.events = [];
    }

    if (findJsonSubEntry(shop.events, "id", eventId)) {
        tellPlayer(player, "&cEvent already running: &e" + eventId);
        return;
    }

    var canTake = canShopStartEvent(shopId, playerShops, event);
    if (!canTake.canTake) {
        tellPlayer(player, "&cCannot start event: &e" + eventId);
        for (var i = 0; i < canTake.messages.length; i++) {
            tellPlayer(player, "&c- " + canTake.messages[i]);
        }
        return;
    }

    if (shop.finances.stored_cash < event.cost) {
        tellPlayer(player, "&cNot enough money in the shop's cash register!");
        return;
    }

    var serverTickCount = world.getTotalTime();
    shop.events.push({
        id: eventId,
        start_date: serverTickCount,
        duration: event.repeatable.lasts_for
    });
    shop.finances.stored_cash -= event.cost;
    saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
    tellPlayer(player, "&aSuccessfully started event: &e" + event.name);
    tellPlayer(player, "&aCost: &r:money:&e" + getAmountCoin(event.cost));
}