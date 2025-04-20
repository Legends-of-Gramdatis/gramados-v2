// Load utility modules
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");

var TIMER_DURATION = 20; // 10 seconds = 20 "tick" calls (every tick call is 0.5 seconds)
var OFFERING_TIMER = 0;
var TICK_COUNTER = 0;
var SLEEP_MODE_DURATION = 240; // 2 minutes in ticks
var SLEEP_MODE_TIMER = 0;

/**
 * Initializes the altar bunny NPC.
 * @param {Object} event - The event object containing the NPC instance.
 */
function init(event) {
    var npc = event.npc;

    npc.getStoreddata().put("spring_yolktype", 0);
    npc.getStoreddata().put("chromashell_yolktype", 0);
    npc.getStoreddata().put("encrypted_yolktype", 0);
}

/**
 * Handles player interaction with the altar bunny.
 * @param {Object} event - The event object containing the player instance.
 */
function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var item = player.getMainhandItem().copy();
    var itemName = item.getName();

    // Prevent interaction during sleep mode
    if (SLEEP_MODE_TIMER > 0) {
        tellPlayer(player, "&cThe altar bunny is resting and cannot accept items right now.");
        return;
    }

    // Handle paper interaction to list recipes
    if (itemName === "minecraft:paper") {
        addRecipeLoreToPaper(item, player);
        return;
    }

    // Load isEggMode from easterBossFight.json
    var bossFightData = loadJson("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/easterBossFight.json");
    if (bossFightData.isEggMode) {
        tellPlayer(player, "&cThe altar is inactive. Offerings are not being accepted at this time.");
        return;
    }

    if (itemName === "minecraft:command_block") {
        displayYolkmarkStatus(npc, player);
        return;
    }

    var yolkmarks = processOffering(npc, item, player);
    if (yolkmarks > 0) {
        playHappyFeedback(npc, player, yolkmarks, item.getDisplayName());
    } else {
        playConfusedFeedback(npc, player);
    }
}

/**
 * Adds lore to a paper item listing the recipes by yolkmark and name.
 * @param {IItemStack} paper - The paper item to modify.
 * @param {IPlayer} player - The player interacting with the altar.
 */
function addRecipeLoreToPaper(paper, player) {
    var bossFightData = loadJson("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/easterBossFight.json");
    var allRecipes = bossFightData.discovered_recipes || [];

    if (allRecipes.length === 0) {
        tellPlayer(player, "&cNo recipes have been discovered yet.");
        return;
    }

    var lore = [];
    for (var i = 0; i < allRecipes.length; i++) {
        var recipe = allRecipes[i];
        lore.push(ccs("&6" + recipe.name + ": &e" +
            "Spring: " + recipe.spring_yolktype + ", " +
            "Chromashell: " + recipe.chromashell_yolktype + ", " +
            "Encrypted: " + recipe.encrypted_yolktype));
    }

    paper.setCustomName(ccs("&bDiscovered Recipes"));
    paper.setLore(lore);

    tellPlayer(player, "&aThe recipes have been written onto the paper.");
    player.setMainhandItem(paper);
}

/**
 * Handles the altar bunny's tick updates.
 * @param {Object} event - The event object containing the NPC instance.
 */
function tick(event) {
    var npc = event.npc;

    // Handle sleep mode timer
    if (SLEEP_MODE_TIMER > 0) {
        SLEEP_MODE_TIMER--;
    }

    // Handle running recipes
    var bossFightData = loadJson("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/easterBossFight.json");
    var runningRecipes = bossFightData.running_recipes || [];
    for (var i = runningRecipes.length - 1; i >= 0; i--) {
        runningRecipes[i].duration--;
        if (runningRecipes[i].duration <= 0) {
            runningRecipes.splice(i, 1); // Remove expired recipes
        }
    }
    bossFightData.running_recipes = runningRecipes;
    saveJson(bossFightData, "world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/easterBossFight.json");

    if (OFFERING_TIMER > 0) {
        OFFERING_TIMER--;
        TICK_COUNTER++;

        if (TICK_COUNTER % 2 === 0) {
            npc.executeCommand("/playsound minecraft:block.note.hat block @a ~ ~ ~ 10 1");
        }

        if (OFFERING_TIMER <= 0) {
            TICK_COUNTER = 0; // Reset the counter
            npc.executeCommand("/playsound minecraft:block.end_portal.spawn block @a ~ ~ ~ 10 1");

            // Process recipes
            processRecipes(npc);

            // Reset yolkmarks in storage when the timer is over IMPORTANT
            npc.getStoreddata().put("spring_yolktype", 0);
            npc.getStoreddata().put("chromashell_yolktype", 0);
            npc.getStoreddata().put("encrypted_yolktype", 0);

            // Start sleep mode
            SLEEP_MODE_TIMER = SLEEP_MODE_DURATION;
            tellNearbyPlayers(npc, "&6&l[Altar Status] &eThe altar bunny is now resting and will not accept items for 2 minutes.");
        }
    }
}

/**
 * Processes recipes based on the current yolkmarks in storage.
 * @param {ICustomNpc} npc - The altar bunny NPC instance.
 */
function processRecipes(npc) {
    var bossFightData = loadJson("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/easterBossFight.json");
    var allRecipes = bossFightData.all_recipes || [];
    var discoveredRecipes = bossFightData.discovered_recipes || [];
    var runningRecipes = bossFightData.running_recipes || [];

    var springYolk = npc.getStoreddata().get("spring_yolktype") || 0;
    var chromashellYolk = npc.getStoreddata().get("chromashell_yolktype") || 0;
    var encryptedYolk = npc.getStoreddata().get("encrypted_yolktype") || 0;

    for (var i = 0; i < allRecipes.length; i++) {
        var recipe = allRecipes[i];
        if (springYolk >= recipe.spring_yolktype &&
            chromashellYolk >= recipe.chromashell_yolktype &&
            encryptedYolk >= recipe.encrypted_yolktype) {
            
            // Deduct yolkmarks
            springYolk -= recipe.spring_yolktype;
            chromashellYolk -= recipe.chromashell_yolktype;
            encryptedYolk -= recipe.encrypted_yolktype;

            // Add to discovered recipes if not already present
            var alreadyDiscovered = false;
            for (var j = 0; j < discoveredRecipes.length; j++) {
                if (discoveredRecipes[j].name === recipe.name) {
                    alreadyDiscovered = true;
                    break;
                }
            }
            if (!alreadyDiscovered) {
                discoveredRecipes.push(recipe);
            }

            // Add to running recipes
            runningRecipes.push({ name: recipe.name, duration: recipe.duration });
        }
    }

    // Update yolkmarks in storage
    npc.getStoreddata().put("spring_yolktype", springYolk);
    npc.getStoreddata().put("chromashell_yolktype", chromashellYolk);
    npc.getStoreddata().put("encrypted_yolktype", encryptedYolk);

    // Save updated data
    bossFightData.discovered_recipes = discoveredRecipes;
    bossFightData.running_recipes = runningRecipes;
    saveJson(bossFightData, "world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/easterBossFight.json");

    // Notify players
    tellNearbyPlayers(npc, "&6&l[Altar Status] &eRecipes activated!", 50);
    for (var j = 0; j < runningRecipes.length; j++) {
        tellNearbyPlayers(npc, "&eRunning Recipe: &a" + runningRecipes[j].name + " &7(Duration: " + runningRecipes[j].duration + " ticks)", 50);
    }
}

/**
 * Processes an offering made by the player.
 * @param {ICustomNpc} npc - The altar bunny NPC instance.
 * @param {IItemStack} item - The item being offered.
 * @param {IPlayer} player - The player offering the item.
 * @returns {number} - The yolkmark value of the item.
 */
function processOffering(npc, item, player) {
    var validEggItems = ["minecraft:egg", "animania:brown_egg", "animania:peacock_egg_blue"];
    if (validEggItems.indexOf(item.getName()) !== -1) {
        var itemLore = item.getLore();
        if (itemLore.length < 4) {
            return 0;
        }
        var yolkmarks = parseYolkmarksFromLore(itemLore[3]);
        if (yolkmarks > 0) {
            incrementYolkmark(npc, item, yolkmarks);
            item.setStackSize(item.getStackSize() - 1);
            player.setMainhandItem(item);
            OFFERING_TIMER = TIMER_DURATION;
            return yolkmarks;
        }
    }
    return 0;
}

/**
 * Parses the yolkmark value from the item's lore.
 * @param {string} loreLine - The lore line containing the yolkmark value.
 * @returns {number} - The parsed yolkmark value.
 */
function parseYolkmarksFromLore(loreLine) {
    var yolkmarks = loreLine.split(" ")[1].trim();
    return parseInt(yolkmarks.replace("§l", "").replace("§r§d§o", "")) || 0;
}

/**
 * Increments the yolkmark count for the appropriate egg type.
 * @param {ICustomNpc} npc - The altar bunny NPC instance.
 * @param {IItemStack} item - The item being offered.
 * @param {number} yolkmarks - The yolkmark value to increment.
 */
function incrementYolkmark(npc, item, yolkmarks) {
    var eggType = getEggType(item);
    if (eggType !== "unknown") {
        var currentYolkmarks = npc.getStoreddata().get(eggType) || 0;
        npc.getStoreddata().put(eggType, currentYolkmarks + yolkmarks);
    }
}

/**
 * Displays the current yolkmark status to the player.
 * @param {ICustomNpc} npc - The altar bunny NPC instance.
 * @param {IPlayer} player - The player interacting with the altar.
 */
function displayYolkmarkStatus(npc, player) {
    var spring = npc.getStoreddata().get("spring_yolktype") || 0;
    var chromashell = npc.getStoreddata().get("chromashell_yolktype") || 0;
    var encrypted = npc.getStoreddata().get("encrypted_yolktype") || 0;

    tellPlayer(player, "&6&l[Altar Status]");
    tellPlayer(player, "&eYolkmarks in storage:");
    tellPlayer(player, "  &7Spring Yolkmarks: &a" + spring);
    tellPlayer(player, "  &7Chromashell Yolkmarks: &a" + chromashell);
    tellPlayer(player, "  &7Encrypted Yolkmarks: &a" + encrypted);
}

/**
 * Plays happy feedback when a valid offering is made.
 * @param {ICustomNpc} npc - The altar bunny NPC instance.
 * @param {IPlayer} player - The player making the offering.
 * @param {number} yolkmarks - The yolkmark value of the offering.
 * @param {string} itemName - The name of the item being offered.
 */
function playHappyFeedback(npc, player, yolkmarks, itemName) {
    npc.executeCommand("/playsound minecraft:block.end_portal_frame.fill block @a ~ ~ ~ 1 1");
    var command = "/particle happyVillager " + npc.getX() + " " + (npc.getY() + 1) + " " + npc.getZ() +
        " 0.5 0.5 0.5 0.1 10";
    npc.executeCommand(command);
    tellPlayer(player, "&aThe bunny is happy with your offering of a &b&l" + yolkmarks + "&r&a-yolkmark " + itemName + "&r&a.");
}

/**
 * Plays confused feedback when an invalid offering is made.
 * @param {ICustomNpc} npc - The altar bunny NPC instance.
 * @param {IPlayer} player - The player making the offering.
 */
function playConfusedFeedback(npc, player) {
    npc.executeCommand("/playsound minecraft:block.glass.break block @a ~ ~ ~ 1 1");
    var command = "/particle angryVillager " + npc.getX() + " " + (npc.getY() + 1) + " " + npc.getZ() +
        " 0.5 0.5 0.5 0.1 10";
    npc.executeCommand(command);
    tellPlayer(player, "&cThe bunny doesn't know what to do with that.");
}

/**
 * Gets the type of an egg.
 * @param {IItemStack} item - The egg item.
 * @returns {string} - The type of the egg (spring_yolktype, chromashell_yolktype, or encrypted_yolktype).
 */
function getEggType(item) {
    switch (item.getName()) {
        case "minecraft:egg":
            return "spring_yolktype";
        case "animania:brown_egg":
            return "chromashell_yolktype";
        case "animania:peacock_egg_blue":
            return "encrypted_yolktype";
        default:
            return "unknown";
    }
}