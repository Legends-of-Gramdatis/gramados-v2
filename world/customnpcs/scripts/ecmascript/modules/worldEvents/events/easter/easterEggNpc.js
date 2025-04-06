// Load utility modules
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

var npc;
var world;

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

    if (!npc.getStoreddata().has("active_type")) {
        regenerate(npc);
    }

    // get player hand item
    var player = event.player;
    var item = player.getMainhandItem();
    var item_name = item.getName();

    // If player uses a command block to interact with the NPC
    if (item_name == "minecraft:command_block") {
        // regenerate the NPC
        regenerate(npc);
        // tell the player that the NPC has been regenerated
        tellPlayer(player, "&6The NPC has been regenerated!");
    } else if (npc.getStoreddata().get("active_mode") == "True") {
        if (item_name == "forestry:scoop") {
            // tell the player that they can't use the egg
            tellPlayer(player, "&6You can't pick up the egg with a scoop yet!");
        }
    } else {
        npc.getStoreddata().put("active_mode", "True");
        setupActiveMode(npc);
        tellPlayer(player, "&6The egg is now active!");
    }

    // tell the current active type
    var active_type = npc.getStoreddata().get("active_type");
    var active_mode = npc.getStoreddata().get("active_mode");
    var tries = npc.getStoreddata().get("tries");
    var rarity = npc.getStoreddata().get("rarity");
    var egg_name = npc.getDisplay().getName();
    tellPlayer(player, "&6Current egg name: " + egg_name);
    tellPlayer(player, "&6Current egg rarity: " + rarity);
    tellPlayer(player, "&6Current egg size: " + npc.getDisplay().getSize());
    tellPlayer(player, "&6Current active type: " + active_type);
    tellPlayer(player, "&6Current active mode: " + active_mode);
    tellPlayer(player, "&6Current tries: " + tries);

    // npc.damage(100);
}

// sets up random type
function setRandomType(npc) {
    var stored_data = npc.getStoreddata();
    var active_types = ["run", "fly", "teleport"];
    var random_index = Math.floor(Math.random() * active_types.length);
    var EGG_TYPE = active_types[random_index];
    stored_data.put("active_type", EGG_TYPE);
    stored_data.put("active_mode", "False");
}

// Sets random size
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
    var tries = Math.max(1, 1 + Math.floor(random_size/4));
    npc.getStoreddata().put("tries", tries);
}

// function to set egg type rarity
function setEggTypeRarity(npc) {
    // Spring egg are common, chromashell are uncommon, encrypted are rare
    // 5% chance for a rare egg, 40% chance for an uncommon egg, and 55% chance for a common egg
    var random_type = Math.floor(Math.random() * 100);
    var rarity = "spring";
    if (random_type < 5) {
        rarity = "encrypted";
    } else if (random_type < 45) {
        rarity = "chromashell";
    } else {
        rarity = "spring";
    }
    // store the rarity in the NPC's data
    npc.getStoreddata().put("rarity", rarity);
    getRandomEasterEggSkin(npc, rarity);
}

// Regenerate the NPC by resetting its data
function regenerate(npc) {
    // Reset the NPC's data
    npc.getStoreddata().remove("active_type");
    npc.getStoreddata().remove("active_mode");
    npc.getStoreddata().remove("tries");
    npc.getStoreddata().remove("rarity");
    // Set a new random size
    setRandomType(npc);
    setRandomSize(npc);
    setEggTypeRarity(npc);
    applyEggName(npc);

    setupInactiveMode(npc);

    // APply random rotation (0 to 260)
    var random_rotation = Math.floor(Math.random() * 360);
    npc.setRotation(random_rotation);
}

// Get a random easter egg skin
function getRandomEasterEggSkin(npc, rarity) {
    var egg_skins = [];
    var egg_skin_url = "https://legends-of-gramdatis.com/gramados_skins/easter_eggs/easter_egg_";
    var egg_skin_ext = ".png";

    switch (rarity) {
        case "spring":
            egg_skins = [6,16,20,21,22,23,24,25,26,27,28,29,30];
            break;
        case "chromashell":
            egg_skins = [1,2,3,5,7,9,10,12,13];
            break;
        case "encrypted":
            egg_skins = [31,32,33,34];
            break;
        default:
            egg_skins = [4,8,11,14,15,17,18,19];
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

// apply the correct name to teh egg
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

// Function to setup the active mode
function setupActiveMode(npc) {
    // Switch on active type
    var ai_interface = npc.getAi();
    var active_type = npc.getStoreddata().get("active_type");
    switch (active_type) {
        case "run":
            ai_interface.setNavigationType(0);
            ai_interface.setWanderingRange(50);
            ai_interface.setStopOnInteract(false);
            ai_interface.setWalkingSpeed(10);
            ai_interface.setInteractWithNPCs(false);
            ai_interface.setMovingType(1);
            ai_interface.setRetaliateType(1);
            ai_interface.setStandingType(1);
            break;
        case "fly":
            ai_interface.setNavigationType(1);
            ai_interface.setWanderingRange(10);
            ai_interface.setStopOnInteract(false);
            ai_interface.setWalkingSpeed(5);
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
            break;
        default:
            npc.getStoreddata().put("active_mode", "False");
            break;
    }
}