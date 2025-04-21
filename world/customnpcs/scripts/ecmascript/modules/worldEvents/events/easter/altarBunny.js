// Load utility modules
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js')

var TIMER_DURATION = 20; // 10 seconds = 20 "tick" calls (every tick call is 0.5 seconds)
var OFFERING_TIMER = 0;
var TICK_COUNTER = 0;
var SLEEP_MODE_DURATION = 240; // 2 minutes in ticks
var SLEEP_MODE_TIMER = 0;

var EVENT_DATA_JSON = "world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/easterBossFight.json";

/**
 * Initializes the altar bunny NPC.
 * @param {Object} event - The event object containing the NPC instance.
 */
function init(event) {
    var npc = event.npc;

    npc.getStoreddata().put("spring_yolktype", 0);
    npc.getStoreddata().put("chromashell_yolktype", 0);
    npc.getStoreddata().put("encrypted_yolktype", 0);
    npc.getStoreddata().put("mode", 0);
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
    var mode = npc.getStoreddata().get("mode") || 0;

    if (itemName === "minecraft:command_block") {
        displayYolkmarkStatus(npc, player);
        return;
    } else if (itemName === "minecraft:paper") {
        addRecipeLoreToPaper(item, player);
        return;
    }

    // Prevent interaction during sleep mode
    if (mode === 3) {
        tellPlayer(player, "&bThe altar bunny is &l&9resting&r&b and cannot accept items right now. Please wait.");
        npc.executeCommand("/playsound minecraft:block.lava.pop block @a ~ ~ ~ 1 1");
        return;
    } else if (mode === 0) {
        tellPlayer(player, "&7The altar is &l&8inactive&r&7. Offerings are not being accepted at this time.");
        npc.executeCommand("/playsound minecraft:block.lava.pop block @a ~ ~ ~ 1 1");
        return;
    } else if (mode === 1 || mode === 2) {
        var yolkmarks = processOffering(npc, item, player);
        if (yolkmarks > 0) {
            playHappyFeedback(npc, player, yolkmarks, item.getDisplayName());
        } else {
            playConfusedFeedback(npc, player);
        }
        return;
    }
}

/**
 * Adds lore to a paper item listing the recipes by yolkmark and name.
 * @param {IItemStack} paper - The paper item to modify.
 * @param {IPlayer} player - The player interacting with the altar.
 */
function addRecipeLoreToPaper(paper, player) {
    var bossFightData = loadJson(EVENT_DATA_JSON);
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
    var bossFightData = loadJson(EVENT_DATA_JSON);

    updateAltarAppearance(npc);
    handleSleepMode(npc);
    handleRunningRecipes(npc, bossFightData);
    handleOfferingTimer(npc, bossFightData);
    handleInactiveMode(npc, bossFightData);
    applyModifiersAndEvents(npc, bossFightData);

    saveJson(bossFightData, EVENT_DATA_JSON);
}

function updateAltarAppearance(npc) {
    var mode = npc.getStoreddata().get("mode") || 0;
    var currentSkinUrl = npc.getDisplay().getSkinUrl();
    var targetSkinUrl;
    var targetBlock;

    switch (mode) {
        case 0: // Inactive
            targetSkinUrl = "https://legends-of-gramdatis.com/gramados_skins/tmp/rabbit_altar_inactive.png";
            targetBlock = "chisel:blockinvar";
            break;
        case 1: // Active
            targetSkinUrl = "https://legends-of-gramdatis.com/gramados_skins/tmp/rabbit_altar_active.png";
            targetBlock = "chisel:blockgold";
            break;
        case 2: // Busy
            targetSkinUrl = "https://legends-of-gramdatis.com/gramados_skins/tmp/rabbit_altar_busy.png";
            targetBlock = "chisel:blockcopper";
            break;
        case 3: // Sleeping
            targetSkinUrl = "https://legends-of-gramdatis.com/gramados_skins/tmp/rabbit_altar_sleep.png";
            targetBlock = "chisel:blockcobalt";
            break;
        default:
            targetSkinUrl = currentSkinUrl;
            targetBlock = null;
    }

    if (currentSkinUrl !== targetSkinUrl) {
        npc.getDisplay().setSkinUrl(targetSkinUrl);
    }

    if (targetBlock) {
        var blockX = Math.floor(npc.getX());
        var blockY = Math.floor(npc.getY() - 1);
        var blockZ = Math.floor(npc.getZ());
        npc.getWorld().setBlock(blockX, blockY, blockZ, targetBlock, 5);
    }
}

function handleSleepMode(npc) {
    if (SLEEP_MODE_TIMER > 0) {
        SLEEP_MODE_TIMER--;
        if (SLEEP_MODE_TIMER === 0) {
            npc.getStoreddata().put("mode", 1); // Transition to active mode
            tellNearbyPlayers(npc, "&6&l[Altar Status] &bThe altar bunny is ready to accept offerings again!");
        }
    }
}

function handleRunningRecipes(npc, bossFightData) {
    var runningRecipes = bossFightData.running_recipes || [];
    for (var i = runningRecipes.length - 1; i >= 0; i--) {
        runningRecipes[i].duration--;
        if (runningRecipes[i].duration <= 0) {
            runningRecipes.splice(i, 1); // Remove expired recipes
        }
    }
    bossFightData.running_recipes = runningRecipes;
}

function handleOfferingTimer(npc, bossFightData) {
    if (OFFERING_TIMER > 0) {
        OFFERING_TIMER--;
        TICK_COUNTER++;

        if (TICK_COUNTER % 2 === 0) {
            npc.executeCommand("/playsound minecraft:block.note.hat block @a ~ ~ ~ 10 1");
        }

        if (OFFERING_TIMER <= 0) {
            TICK_COUNTER = 0; // Reset the counter
            npc.executeCommand("/playsound minecraft:block.end_portal.spawn block @a ~ ~ ~ 10 1");

            processRecipes(npc, bossFightData);

            // Reset yolkmarks in storage when the timer is over
            npc.getStoreddata().put("spring_yolktype", 0);
            npc.getStoreddata().put("chromashell_yolktype", 0);
            npc.getStoreddata().put("encrypted_yolktype", 0);

            // Start sleep mode (mode 3)
            SLEEP_MODE_TIMER = SLEEP_MODE_DURATION;
            npc.getStoreddata().put("mode", 3);
            tellNearbyPlayers(npc, "&6&l[Altar Status] &bThe altar bunny is now resting and will not accept items for 2 minutes.");
        }
    }
}

function handleInactiveMode(npc, bossFightData) {
    if (bossFightData.isEggMode) {
        npc.getStoreddata().put("mode", 0);
    } else {
        if (OFFERING_TIMER > 0) {
            npc.getStoreddata().put("mode", 2); // Busy
        } else if (SLEEP_MODE_TIMER > 0) {
            npc.getStoreddata().put("mode", 3); // Sleeping
        } else {
            npc.getStoreddata().put("mode", 1); // Active
        }
    }
}

function applyModifiersAndEvents(npc, bossFightData) {
    if (!bossFightData.isEggMode) {
        if (bossFightData.running_recipes.length > 0) {
            for (var i = 0; i < bossFightData.running_recipes.length; i++) {
                var recipe = bossFightData.running_recipes[i];
                switch (recipe.name) {
                    case "Chocolate Rain":
                        if (rrandom_range(0, 5) == 1) {
                            makeChocolateRain(npc, recipe, bossFightData);
                        }
                        break;
                    case "Bunny Bounce":
                        applyBunnyBounceEffect(npc, recipe, bossFightData);
                        break;
                    case "Zap Gamble":
                        triggerZapOrbEvent(npc, recipe, bossFightData);
                        break;
                    default:
                        break;
                }
            }
        }
    }
}

/**
 * Processes recipes based on the current yolkmarks in storage.
 * @param {ICustomNpc} npc - The altar bunny NPC instance.
 */
function processRecipes(npc, bossFightData) {
    var allRecipes = bossFightData.all_recipes || [];
    var discoveredRecipes = bossFightData.discovered_recipes || [];
    var runningRecipes = bossFightData.running_recipes || [];

    var springYolk = npc.getStoreddata().get("spring_yolktype") || 0;
    var chromashellYolk = npc.getStoreddata().get("chromashell_yolktype") || 0;
    var encryptedYolk = npc.getStoreddata().get("encrypted_yolktype") || 0;

    var triggeredRecipes = []; // Use an array to track triggered recipes

    for (var i = 0; i < allRecipes.length; i++) {
        var recipe = allRecipes[i];
        if (springYolk >= recipe.spring_yolktype &&
            chromashellYolk >= recipe.chromashell_yolktype &&
            encryptedYolk >= recipe.encrypted_yolktype &&
            !includes(triggeredRecipes, recipe.name)) { // Check if recipe is already triggered
            
            // Debugging logs
            // npc.say("&6Processing recipe: " + recipe.name);
            // npc.say("&6Yolkmarks - Spring: " + springYolk + ", Chromashell: " + chromashellYolk + ", Encrypted: " + encryptedYolk);

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
            runningRecipes.push({ name: recipe.name, duration: recipe.duration, first_trigger: false });

            // Mark recipe as triggered
            triggeredRecipes.push(recipe.name);
        }
    }

    // Update yolkmarks in storage
    npc.getStoreddata().put("spring_yolktype", springYolk);
    npc.getStoreddata().put("chromashell_yolktype", chromashellYolk);
    npc.getStoreddata().put("encrypted_yolktype", encryptedYolk);

    // Save updated data
    bossFightData.discovered_recipes = discoveredRecipes;
    bossFightData.running_recipes = runningRecipes;

    // Notify players
    tellNearbyPlayers(npc, "&6&l[Altar Status] &eRecipes activated!", 50);
    for (var j = 0; j < runningRecipes.length; j++) {
        tellNearbyPlayers(npc, "&eRunning Recipe: &a" + runningRecipes[j].name + " &7(Duration: " + Math.round(runningRecipes[j].duration / 2) + " seconds)", 50);
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
    var mode = npc.getStoreddata().get("mode") || 0;

    var modeText;
    switch (mode) {
        case 0:
            modeText = "&7Inactive";
            break;
        case 1:
            modeText = "&eActive";
            break;
        case 2:
            modeText = "&6Busy";
            break;
        case 3:
            modeText = "&bSleeping";
            break;
        default:
            modeText = "&7Unknown";
    }

    tellPlayer(player, "&6&l[Altar Status]");
    tellPlayer(player, "&eYolkmarks in storage:");
    tellPlayer(player, "  &7Spring Yolkmarks: &a" + spring);
    tellPlayer(player, "  &7Chromashell Yolkmarks: &a" + chromashell);
    tellPlayer(player, "  &7Encrypted Yolkmarks: &a" + encrypted);
    tellPlayer(player, "&eCurrent Mode: " + modeText);
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
    // tellPlayer(player, "&cThe bunny doesn't know what to do with that.");
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

function makeChocolateRain(npc, recipe, bossFightData) {
    if (recipe.first_trigger == false) {
        recipe.first_trigger = true;
        tellNearbyPlayers(npc, findJsonSubEntry(bossFightData.all_recipes, "name", recipe.name).description, 50);
    }

    var arenaType = bossFightData["use_arena"] || "debug"; // Get arena type from JSON
    var arena = bossFightData.Arena[arenaType];
    var pos1 = arena.pos1;
    var pos2 = arena.pos2;
    var startY = Math.max(pos1.y, pos2.y); // Use the highest Y value

    var world = npc.getWorld();

    // Spawn random items
    var items = pullLootTable("food/chocolate_table.json");
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var itemCount = item.count;
        var itemName = item.id;
        var itemDamage = item.damage;
        var itemX = Math.floor(Math.random() * (pos2.x - pos1.x + 1)) + pos1.x;
        var itemY = startY; // Use the highest Y value
        var itemZ = Math.floor(Math.random() * (pos2.z - pos1.z + 1)) + pos1.z;

        var command = "/summon item " + itemX + " " + itemY + " " + itemZ + " {Item:{id:\"" + itemName + "\",Count:" + itemCount + ",Damage:" + itemDamage + "}}";
        npc.executeCommand(command);

        // Play the sound and particle effects
        npc.executeCommand("/playsound minecraft:block.note.chime block @a " + itemX + " " + itemY + " " + itemZ + " 3 1");
        npc.executeCommand("/particle blockcrack " + itemX + " " + itemY + " " + itemZ + " 1 1 1 0.5 10 force @a 3");
    }
}

function applyBunnyBounceEffect(npc, recipe, bossFightData) {
    if (recipe.first_trigger == false) {
        recipe.first_trigger = true;

        var arenaType = bossFightData["use_arena"] || "debug"; // Get arena type from JSON
        var arena = bossFightData.Arena[arenaType];
        var pos1 = arena.pos1;
        var pos2 = arena.pos2;

        var world = npc.getWorld();
        var nearbyPlayers = world.getNearbyEntities(npc.getPos(), 50, 1); // Get players within a radius

        for (var i = 0; i < nearbyPlayers.length; i++) {
            var player = nearbyPlayers[i];
            var playerPos = player.getPos();

            // Check if the player is within the arena bounds using isWithinZone
            if (isWithinZone(iposToPos(playerPos), pos1, pos2)) {
                // Apply effects: Slow Falling and Jump Boost
                player.addPotionEffect(25, 5, 1, true); // Levitation (ID 25), duration 5 seconds, amplifier 2
                player.addPotionEffect(8, 60, 1, true);  // Jump Boost (ID 8), duration 60 seconds, amplifier 2
                player.addPotionEffect(1, 60, 2, true);  // Speed (ID 1), duration 60 seconds, amplifier 3
            }
        }

        // Notify players in the arena
        tellNearbyPlayers(npc, findJsonSubEntry(bossFightData.all_recipes, "name", recipe.name).description, 50);
    }
}

/**
 * Handles the "Zap Orb" event with a 50/50 gamble.
 * @param {ICustomNpc} npc - The NPC instance.
 * @param {Object} bossFightData - The boss fight data.
 */
function triggerZapOrbEvent(npc, recipe, bossFightData) {
    if (recipe.first_trigger == false) {
        recipe.first_trigger = true;
        var zapOrbDuration = 120; // Duration in seconds
        var zapOrbName = "Zap Orb"; // Name of the NPC to spawn
        var zapOrbPos = npc.getPos(); // Spawn position based on the altar bunny's position

        // 50/50 gamble
        if (Math.random() < 0.5) {
            // Good effects for nearby players
            var players = npc.getWorld().getNearbyEntities(zapOrbPos, 50, 1); // Radius of 50 blocks
            for (var i = 0; i < players.length; i++) {
                var player = players[i];
                player.addPotionEffect(1, 120, 2, true); // Speed III
                player.addPotionEffect(5, 120, 1, true); // Strength II
                player.addPotionEffect(11, 120, 1, true); // Resistance II
            }

            // Notify players about the good effects
            tellNearbyPlayers(npc, "&aYou feel a surge of power coursing through you!", 50);
        } else {
            // Spawn the Zap Orb NPC
            var zapOrb = npc.getWorld().spawnClone(zapOrbPos.x, zapOrbPos.y + 1, zapOrbPos.z, 2, zapOrbName);
            if (zapOrb) {
                zapOrb.getTimers().start(1, zapOrbDuration * 20, false); // Despawn after 120 seconds
            }

            // Notify players about the Zap Orb
            tellNearbyPlayers(npc, "&eA Zap Orb has appeared! Harness its power!", 50);
        }
    }
}