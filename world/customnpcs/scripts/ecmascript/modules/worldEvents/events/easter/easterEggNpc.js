// Load utility modules
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

load('world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js');

var egg_activation_lines = [
    "&6Uh oh... it woke up.",
    "&6The egg opens one eye. It has seen things. It chooses violence.",
    "&6This egg just clocked in for cardio. Good luck.",
    "&6Initiating Operation: Eggscape.",
    "&6The egg stares into your soul. Then bolts.",
    "&6You touched the egg. The egg touched back—with legs.",
    "&6Awakened. Confused. Angry. Egg.",
    "&6This egg just gained sentience and immediately decided you're a threat.",
]

var egg_missed_attempt_lines = [
    "&7You almost had it! But this egg trained with Sonic.",
    "&7Slippery little yolker, isn't it?",
    "&7Nope. It laughed. You heard it, right?",
    "&7Egg evasion level: 9000.",
    "&7You missed again. The egg is doing donuts around your dignity.",
    "&7Close! But the egg just hit you with a metaphorical dodge roll.",
    "&7This egg has Ultra Instinct. You're gonna need to focus up.",
    "&7Why is this egg so... buttery?"
]

var egg_wrong_tool_lines = [
    "&7You try to grab the flying egg with your hands. It scoffs mid-air.",
    "&7Your hands are not FAA approved. Use a scoop!",
    "&7Clapping at the egg won't work. It wants tools, not applause.",
    "&7This is not Pokémon. Hands are not effective against airborne eggs.",
    "&7The egg just did a barrel roll around your dignity. Scoop up, soldier!",
    "&7You try to grab the egg. It gently floats away while judging you.",
    "&7Catch the egg with a scoop, not your dreams and bare hands.",
    "&7NEWSFLASH: Flying eggs require scoops. This message was brought to you by common sense."
]

var egg_success_lines = [
    "&2You caught it! The egg accepts its new overlord.",
    "&2Victory! You are now slightly more eggcellent.",
    "&2Gotcha! Somewhere, a chicken sheds a single proud tear.",
    "&2The egg is yours. Legend says it whispered 'gg'.",
    "&2Captured! You now own a mildly cursed ovoid anomaly.",
    "&2You caught the egg. It is unclear whether this is a win or a warning.",
    "&2The egg has been detained. Proceed to scramble responsibly.",
    "&2Egg secured. You are now on someone's watchlist."
]
var click_cooldown = 20;

/**
 * Initializes the NPC when it is spawned or loaded.
 * @param {Object} event - The event object containing the NPC instance.
 */
function init(event) {
    var npc = event.npc;

    if (!npc.getStoreddata().has("active_type")) {
        regenerate(npc);
    }
}

/**
 * Handles player interaction with the NPC.
 * @param {Object} event - The event object containing the player instance.
 */
function interact(event) {
    var npc = event.npc;

    // get player hand item
    var player = event.player;
    var item = player.getMainhandItem();
    var item_name = item.getName();

    // If player uses a command block to interact with the NPC
    if (!item_name != "customnpcs:npcmobcloner") {
        if (!npc.getStoreddata().has("active_type")) {
            regenerate(npc);
            return;
        }
        
        if (item_name == "minecraft:command_block") {
            npc.executeCommand("/playsound ivv:computer.gaming.deleted player @a");
            // regenerate the NPC
            regenerate(npc);
            // tell the player that the NPC has been regenerated
            tellPlayer(player, "&6The NPC has been regenerated!");
        } else if (item_name == "minecraft:barrier") {
            // Clear any stored data
            npc.getStoreddata().remove("active_type");
            npc.getStoreddata().remove("active_mode");
            npc.getStoreddata().remove("tries");
            npc.getStoreddata().remove("rarity");
            npc.getStoreddata().remove("last_interraction");

            var egg_skin_url = "https://legends-of-gramdatis.com/gramados_skins/easter_eggs/easter_egg_0.png";
            npc.getDisplay().setSkinUrl(egg_skin_url);
            npc.getDisplay().setName("Easter Egg");
            npc.getDisplay().setSize(4);

            npc.executeCommand("/playsound ivv:computer.gaming.error player @a");

            tellPlayer(player, "&6The NPC has been cleared!");
        } else if (getTimer(npc) > click_cooldown) {
            if (npc.getStoreddata().get("active_mode") == "True") {
                var attempt_success = false;
                if (npc.getStoreddata().get("tries") > 0) {
                    switch (npc.getStoreddata().get("active_type")) {
                        case "run":
                            attempt_success = true;
                            npc.executeCommand("/playsound variedcommodities:misc.swosh neutral @a");
                            break;
                        case "fly":
                            if (item_name == "forestry:scoop") {
                                attempt_success = true;
                                npc.executeCommand("/playsound minecraft:block.dispenser.launch neutral @a");
                            } else {
                                tellRandomMessage(player, egg_wrong_tool_lines);
                            }
                            break;
                        case "teleport":
                            teleportEgg(player, npc);
                            attempt_success = true;
                            break;
                        default:
                            break;
                    }
                    if (attempt_success) {
                        var tries = npc.getStoreddata().get("tries");
                        tries = Math.max(0, tries - 1);
                        npc.getStoreddata().put("tries", tries);
                        tellRandomMessage(player, egg_missed_attempt_lines);
                        saveInteractionTime(npc);
                    }

                } else {
                    // tellPlayer(player, "&6You have successfully captured the egg!");
                    tellRandomMessage(player, egg_success_lines);
                    npc.executeCommand("/playsound minecraft:block.slime.break neutral @a");
                    npc.executeCommand("/playsound immersiveengineering:birthdayparty player @a");
                    // summon particle effect at the egg location
                    var command = "/summon area_effect_cloud " + npc.getX() + " " + (npc.getY()+0.5) + " " + npc.getZ() + " {Particle:\"witchMagic\",Radius:3f,Duration:10,Color:6521855,Motion:[0.0,1.5,0.0]}";
                    npc.executeCommand(command);

                    var egg_item = generateEggItem(npc.getWorld(), npc);
                    player.giveItem(egg_item);

                    incremendEggTypeCounter(player, npc.getStoreddata().get("rarity"));

                    // regenerate(npc);
                    npc.despawn();
                }
            } else {
                npc.getStoreddata().put("active_mode", "True");
                setupActiveMode(player, npc);
                tellRandomMessage(player, egg_activation_lines);
            }
        }
    }
}

/**
 * Sets a random type for the NPC's behavior.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function setRandomType(npc) {
    var stored_data = npc.getStoreddata();
    var active_types = ["run", "fly", "teleport"];
    var random_index = Math.floor(Math.random() * active_types.length);
    var EGG_TYPE = active_types[random_index];
    stored_data.put("active_type", EGG_TYPE);
    stored_data.put("active_mode", "False");
}

/**
 * Sets a random size for the NPC and determines the number of tries required to capture it.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function setRandomSize(npc) {
    // There is a chance for the egg to be a giant egg
    var random_type = Math.floor(Math.random() * 10);


    if (random_type == 0) {
        var random_size = Math.floor(Math.random() * (10 - 4 + 1)) + 4;
        npc.getDisplay().setSize(random_size);
    } else {
        var random_size = Math.floor(Math.random() * (6 - 3 + 1)) + 3;
        npc.getDisplay().setSize(random_size);
    }
    

    // Get how many tries it may take to capture this NPC
    var tries = Math.max(1, Math.round(random_size - 2));
    npc.getStoreddata().put("tries", tries);
}

/**
 * Sets the rarity of the egg type and applies a corresponding skin.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function setEggTypeRarity(npc) {
    // Spring egg are common, chromashell are uncommon, encrypted are rare
    // 5% chance for a rare egg, 40% chance for an uncommon egg, and 55% chance for a common egg
    var random_type = Math.floor(Math.random() * 100);
    var rarity = "spring";
    if (random_type < 10) {
        rarity = "encrypted";
    } else if (random_type < 50) {
        rarity = "chromashell";
    } else {
        rarity = "spring";
    }
    // store the rarity in the NPC's data
    npc.getStoreddata().put("rarity", rarity);
    getRandomEasterEggSkin(npc, rarity);
}

/**
 * Resets the NPC's data and regenerates its attributes.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function regenerate(npc) {
    // Reset the NPC's data
    npc.getStoreddata().remove("active_type");
    npc.getStoreddata().remove("active_mode");
    npc.getStoreddata().remove("tries");
    npc.getStoreddata().remove("rarity");
    npc.getStoreddata().remove("last_interraction");
    // Set a new random size
    setRandomType(npc);
    setRandomSize(npc);
    setEggTypeRarity(npc);
    applyEggName(npc);

    setupInactiveMode(npc);

    saveInteractionTime(npc);

    // Apply random rotation (0 to 260)
    var random_rotation = Math.floor(Math.random() * 360);
    npc.setRotation(random_rotation);

    // npc.executeCommand("/playsound ivv:computer.gaming.deleted player @a");
    npc.executeCommand("/playsound minecraft:entity.egg.throw neutral @a");
}

/**
 * Assigns a random skin to the NPC based on its rarity.
 * @param {ICustomNpc} npc - The NPC instance.
 * @param {string} rarity - The rarity of the egg (e.g., "spring", "chromashell", "encrypted").
 */
function getRandomEasterEggSkin(npc, rarity) {
    var egg_skins = [];
    var egg_skin_url = "https://legends-of-gramdatis.com/gramados_skins/easter_eggs/easter_egg_";
    var egg_skin_ext = ".png";

    switch (rarity) {
        case "spring":
            egg_skins = [6,16,20,21,22,23,24,25,26,27,28,29,30];
            break;
        case "chromashell":
            egg_skins = [1,2,3,5,7,9,10,12,13,17,18];
            break;
        case "encrypted":
            egg_skins = [31,32,33,34,35];
            break;
        default:
            egg_skins = [4,8,11,14,15,19];
            break;
    }
    // Get a random egg skin from the list
    var random_index = Math.floor(Math.random() * egg_skins.length);
    var random_skin = egg_skins[random_index];
    // Set the skin URL
    var skin_url = egg_skin_url + random_skin + egg_skin_ext;
    // Set the skin to the NPC
    npc.getDisplay().setSkinUrl(skin_url);
}

/**
 * Applies a name to the NPC based on its rarity.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function applyEggName(npc) {
    var rarity = npc.getStoreddata().get("rarity");
    var egg_name = "Easter Egg";
    switch (rarity) {
        case "spring":
            egg_name = "Spring Egg";
            break;
        case "chromashell":
            egg_name = "Chromashell Egg";
            break;
        case "encrypted":
            egg_name = "Encrypted Egg";
            break;
        default:
            egg_name = "Easter Egg";
            break;
    }
    // Set the name to the NPC
    npc.getDisplay().setName(egg_name);
}

/**
 * Configures the NPC's AI for inactive mode.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function setupInactiveMode(npc) {
    // Switch off active type
    var ai_interface = npc.getAi();
    ai_interface.setNavigationType(0);
    ai_interface.setWanderingRange(1);
    ai_interface.setStopOnInteract(false);
    ai_interface.setWalkingSpeed(0);
    ai_interface.setInteractWithNPCs(false);
    ai_interface.setMovingType(0);
    ai_interface.setRetaliateType(1);
    ai_interface.setStandingType(1);
}

/**
 * Configures the NPC's AI for active mode based on its type.
 * @param {IPlayer} player - The player interacting with the NPC.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function setupActiveMode(player, npc) {
    // Switch on active type
    var ai_interface = npc.getAi();
    var active_type = npc.getStoreddata().get("active_type");
    switch (active_type) {
        case "run":
            ai_interface.setNavigationType(0);
            ai_interface.setWanderingRange(50);
            ai_interface.setStopOnInteract(false);
            ai_interface.setWalkingSpeed(7);
            ai_interface.setInteractWithNPCs(false);
            ai_interface.setMovingType(1);
            ai_interface.setRetaliateType(1);
            ai_interface.setStandingType(1);
            break;
        case "fly":
            ai_interface.setNavigationType(1);
            ai_interface.setWanderingRange(4);
            ai_interface.setStopOnInteract(false);
            ai_interface.setWalkingSpeed(10);
            ai_interface.setInteractWithNPCs(false);
            ai_interface.setMovingType(1);
            ai_interface.setRetaliateType(1);
            ai_interface.setStandingType(1);
            break;
        case "teleport":
            ai_interface.setNavigationType(0);
            ai_interface.setWanderingRange(1);
            ai_interface.setStopOnInteract(false);
            ai_interface.setWalkingSpeed(0);
            ai_interface.setInteractWithNPCs(false);
            ai_interface.setMovingType(0);
            ai_interface.setRetaliateType(1);
            ai_interface.setStandingType(1);
            teleportEgg(player, npc);
            break;
        default:
            npc.getStoreddata().put("active_mode", "False");
            break;
    }
}

/**
 * Teleports the NPC to a random location within a 10-block radius.
 * @param {IPlayer} player - The player interacting with the NPC.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function teleportEgg(player, npc) {
    while (true) {
        var x = Math.floor(Math.random() * 20) - 10;
        var y = Math.floor(Math.random() * 20) - 10;
        var z = Math.floor(Math.random() * 20) - 10;
        var new_x = npc.getX() + x;
        var new_y = npc.getY() + y;
        var new_z = npc.getZ() + z;

        // check if the new coordinates are valid
        if (isValidTeleportLocation(npc, new_x, new_y, new_z)) {
            npc.setPosition(new_x, new_y, new_z);
            break;
        }
    }
    // tellPlayer(player, "&6The egg has been teleported to a random location!");
    // tellPlayer(player, "&6New coordinates: " + npc.getX() + ", " + npc.getY() + ", " + npc.getZ());

    var command = "/summon area_effect_cloud " + npc.getX() + " " + (npc.getY()+0.5) + " " + npc.getZ() + " {Particle:\"mobSpellAmbient\",Radius:1.5f,Duration:10,Color:16713909,Motion:[0.0,1.5,0.0]}";
    npc.executeCommand(command);
    var sound = "entity.endermen.teleport";
    var sound_command = "/playsound " + sound + " master @a";
    npc.executeCommand(sound_command);
}

/**
 * Checks if a given location is valid for teleportation.
 * @param {ICustomNpc} npc - The NPC instance.
 * @param {number} x - The X-coordinate of the location.
 * @param {number} y - The Y-coordinate of the location.
 * @param {number} z - The Z-coordinate of the location.
 * @returns {boolean} - True if the location is valid, false otherwise.
 */
function isValidTeleportLocation(npc, x, y, z) {
    var world = npc.getWorld();
    // Check if the location is within the world bounds
    if (x < -30000000 || x > 30000000 || y < 0 || y > 256 || z < -30000000 || z > 30000000) {
        return false;
    }
    // Check if the location is solid
    var block = world.getBlock(x, y, z);
    if (!block.isAir()) {
        return false;
    }
    // Check if the location is air
    var block_below = world.getBlock(x, y - 1, z);
    if (block_below.isAir()) {
        return false;
    }
    return true;
}

/**
 * Saves the current world tick count as the last interaction time for the NPC.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function saveInteractionTime(npc) {
    var current_time = npc.getWorld().getTotalTime();
    npc.getStoreddata().put("last_interraction", current_time);
}

/**
 * Calculates the elapsed time since the last interaction with the NPC.
 * @param {ICustomNpc} npc - The NPC instance.
 * @returns {number} - The elapsed time in ticks.
 */
function getTimer(npc) {
    var current_time = npc.getWorld().getTotalTime();
    var last_interaction_time = npc.getStoreddata().get("last_interraction");
    if (last_interaction_time == null) {
        return 0;
    }
    var elapsed_time = current_time - last_interaction_time;
    return elapsed_time;
}

/**
 * Generates an item variant of the egg based on the NPC's attributes.
 * @param {IWorld} world - The world instance.
 * @param {ICustomNpc} npc - The NPC instance.
 * @returns {Object} - The generated egg item.
 */
function generateEggItem(world, npc) {

    // get egg varient
    npc.getStoreddata().get("active_type");
    npc.getStoreddata().get("active_mode");
    npc.getStoreddata().get("tries");
    var egg_varient = npc.getStoreddata().get("rarity");
    npc.getStoreddata().get("last_interraction");

    var egg_item = "animania:peacock_egg_white";
    var egg_name = "&bEaster Egg&r";
    var egg_lore_1 = "&eA mysterious egg of undefined rarity. Its shell shifts colors slightly, as if unsure of its purpose. Useful for testing, or when reality forgets how to classify eggs.";
    var egg_lore_2 = "&o&aDebug item - may be replaced by Spring, Chromashell, or Encrypted variants in final spawns.";
    var egg_lore_5 = "&f&oOpening Method:";
    var egg_lore_6 = "&7- Delivered to:";
    var egg_lore_7 = "&7- Found in:";
    var egg_lore_8 = "&7- Note:";

    var egg_size = npc.getDisplay().getSize();
    if (egg_size > 6) {
        var egg_lore_4 = "&d&oApproximately " + npc.getDisplay().getSize() + " yolkmarks in diameter - &lthis is a jumbo egg!&r";
    } else {
        var egg_lore_4 = "&d&oApproximately &l" + npc.getDisplay().getSize() + "&r&d&o yolkmarks in diameter!&r";
    }

    switch (egg_varient) {
        case "spring":
            egg_item = "minecraft:egg";
            egg_name = '&bSpring Egg&r';
            egg_lore_1 = "&eA cheerful, lightly speckled egg radiating seasonal joy. It feels warm to the touch - like it's been basking in sunshine and silliness.";
            egg_lore_2 = "&o&aDeliver it to a licensed Eggcrack Confectioner to open it.";
            egg_lore_5 = "&f&oOpening Method:";
            egg_lore_6 = "&7- Delivered to: &lEggcrack Confectioner";
            egg_lore_7 = "&7- Found in: &oChocolate shops, bakeries, and seasonal food stalls";
            egg_lore_8 = "&7- Note: &oThese Sweetsmiths specialize in handling soft-shell seasonal eggs using confectionery-based techniques.";
            break;
        case "chromashell":
            egg_item = "animania:brown_egg";
            egg_name = '&bChromashell Egg&r';
            egg_lore_1 = "&eThe surface ripples with changing colors like sunlight through a prism. Tiny runes shimmer under the surface — this one's been touched by a painter's magic.";
            egg_lore_2 = "&o&aCan only be safely opened by an Aetheric Botanist.";
            egg_lore_5 = "&f&oOpening Method:"
            egg_lore_6 = "&7- Delivered to: &lAetheric Botanist";
            egg_lore_7 = "&7- Found in: &oGreenhouses, herbalist huts, overgrown ruins, or nature sanctuaries";
            egg_lore_8 = "&7- Note: &oThese biophiles study strange biological patterns and naturally occurring anomalies. They understand the living shells of these eggs.";
            break;
        case "encrypted":
            egg_item = "animania:peacock_egg_blue";
            egg_name = '&bEncrypted Egg&r';
            egg_lore_1 = "&eA strange, humming egg with encrypted data patterns embedded into its surface. It occasionally emits a mechanical chirp and smells faintly like ozone and marshmallows.";
            egg_lore_2 = "&o&aCan be hacked open by a certified Eggcryption Technician... for a price.";
            egg_lore_5 = "&f&oOpening Method:"
            egg_lore_6 = "&7- Delivered to: &lEggcryption Technician";
            egg_lore_7 = "&7- Found in: &oTech shops, digital salvage labs, underground cybermarket outposts";
            egg_lore_8 = "&7- Note: &oThese Technologists require an Arcade Token to decrypt the egg's contents. Advanced scanning and hacking methods used.";
            break;
        default:
            break;
    }

    var eggItem = world.createItem(egg_item, 0, 1);
    eggItem.setCustomName(ccs(egg_name));
    eggItem.setLore([
        ccs(egg_lore_1),
        ccs(egg_lore_2),
        ccs("&e&oCollected during the Easter 2025 event: The Great Eggcryption"),
        ccs(egg_lore_4),
        ccs(egg_lore_5),
        ccs(egg_lore_6),
        ccs(egg_lore_7),
        ccs(egg_lore_8),
    ]);
    return eggItem;
}

/**
 * Increments the player's and global counters for the specified egg type.
 * @param {IPlayer} player - The player who captured the egg.
 * @param {string} egg_type - The type of egg captured (e.g., "spring", "chromashell", "encrypted").
 */
function incremendEggTypeCounter(player, egg_type) {
    var event_global_data = loadPlayerEventData("Easter Egg Hunt", "Global Data");
    var event_player_data = loadPlayerEventData("Easter Egg Hunt", player.getName());

    // In player data, see if there is an entry for the egg type
    if (!event_player_data.egg_types) {
        event_player_data.egg_types = {};
    }
    if (!event_player_data.egg_types[egg_type])
    {
        event_player_data.egg_types[egg_type] = {egg_count: 0};
    }
    
    var egg_type_data = event_player_data.egg_types[egg_type];
    egg_type_data.egg_count++;
    event_player_data.egg_types[egg_type] = egg_type_data;

    // In player data, get the total egg count
    var egg_count = event_player_data.egg_count;
    var global_egg_count = event_global_data.egg_count;
    if (egg_count == null) {
        egg_count = 0;
    }
    if (global_egg_count == null) {
        global_egg_count = 0;
    }
    // Increment the egg count
    egg_count++;
    global_egg_count++;
    event_player_data.egg_count = egg_count;
    event_global_data.egg_count = global_egg_count;
    tellPlayer(player, "&e&oYou have collected &l&6" + egg_count + "&r&e&o eggs out of &l&6" + global_egg_count + "&r&e&o eggs in the world!");
    savePlayerEventData("Easter Egg Hunt", player.getName(), event_player_data);
    savePlayerEventData("Easter Egg Hunt", "Global Data", event_global_data);
    savePlayerEventData("Easter Egg Hunt", player.getName(), event_player_data);
    savePlayerEventData("Easter Egg Hunt", "Global Data", event_global_data);
    var logline = player.getName() + " just caught an " + egg_type + " egg! (" + egg_count + " eggs total)";
    logToFile("events", logline);
}