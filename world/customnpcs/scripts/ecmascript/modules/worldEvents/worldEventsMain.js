load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js");
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js");

load("world/customnpcs/scripts/ecmascript/gramados_sounds/toll_sounds.js");

load("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/aprilFools/susBoxEvent.js");
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/easterEggHuntEvent.js");

var API = Java.type('noppes.npcs.api.NpcAPI').Instance()

var playerLastSpawnTime = {}; // Tracks the last spawn time for each player in milliseconds
var playerSpawnIntervals = {}; // Tracks the spawn interval for each player in milliseconds

var EVENT_CONFIG_FILE_PATH = "world/customnpcs/scripts/ecmascript/modules/worldEvents/event_config.json";

/**
 * Triggered when an entity dies. Cleans up "Sus Box" entities on April 1st.
 * @param {Object} e - The event object containing information about the death event.
 */
function died(e) {
    if (isEventActive("April Fools")) {
        susbox_cleanup(e);
        var logline = e.player.getName() + " died. Nearby Sus Box despawned.";
        logToFile("events", logline);
    }
}

/**
 * Initializes the script, resetting counters or performing setup tasks.
 * @param {Object} e - The event object containing information about the initialization event.
 */
function init(e) {
    var player = e.player;
    var activeEvents = getActiveEventList();

    if (activeEvents.length > 0 || (player.getName() == "TheOddlySeagull" && player.getMainhandItem().getName() == "minecraft:command_block")) {

        if (activeEvents.length > 0) {
            tellPlayer(player, "&6&l[&e&lEvent&6&l] &eActive Events: &a" + activeEvents.join(", &a") + " &6&l[&e&lEvent&6&l]");
        }

        if (isEventActive("Easter Egg Hunt") || (player.getName() == "TheOddlySeagull" && player.getMainhandItem().getName() == "minecraft:command_block")) {
            spawnEasterStarterPack(player);
            resetToll();
        }
    }
}


/**
 * Called on every tick. Handles spawning "Sus Box" entities on April 1st.
 * @param {Object} e - The event object containing information about the tick event.
 */
function tick(e) {
    var player = e.player;
    if (isAnyEventActive() || (player.getName() == "TheOddlySeagull" && player.getMainhandItem().getName() == "minecraft:command_block")) {
        
        var playerName = player.getName();
        // var currentTime = new Date().getTime();		

        if (isEventActive("April Fools")) {
            var event_player_data = loadPlayerEventData("April Fools", playerName);
            playerLastSpawnTime = event_player_data.playerLastSpawnTime;
            playerSpawnIntervals = event_player_data.playerSpawnIntervals;
            // Check if it's time to spawn a new swarm (30 to 40 minutes interval)
            var currentTime = new Date().getTime();
            if (!playerLastSpawnTime || currentTime - playerLastSpawnTime > (playerSpawnIntervals || 30 * 60 * 1000)) {
                run_aprilfools_event(player);
            }
        }

        if (isEventActive("Easter Egg Hunt") || (player.getName() == "TheOddlySeagull" && player.getMainhandItem().getName() == "minecraft:command_block")) {
            runToll(e);

            if (everyHours(0)) {
                var egg_attempt_count = Math.round(Math.random() * 15) + 10;
                spawnEggSwarm(player, player.getWorld(), egg_attempt_count, 100, true);
            } else if (everyQuarterHours(0)) {
                var egg_attempt_count = Math.round(Math.random() * 7) + 4;
                spawnEggSwarm(player, player.getWorld(), egg_attempt_count, 75, true);
            } else if (everyHours(2)) {
                initToll("hourly");
            } else if (everyQuarterHours(2)) {
                initToll("quarterly");
            }
        }
    }
}

/**
 * Returns a random spawn interval between 10 and 15 minutes in milliseconds.
 * @returns {number} - The random spawn interval in milliseconds.
 */
function getRandomSpawnInterval() {
    return (10 * 60 * 1000) + Math.floor(Math.random() * (20 * 60 * 1000)); // 10 to 30 minutes
}

/**
 * Triggered when a player leaves the game. Saves their last spawn time and interval to a JSON file.
 * Also cleans up "Sus Box" entities near the player.
 * @param {Object} e - The event object containing information about the player leaving.
 */
function logout(e) {

    if (isEventActive("April Fools")) {
        susbox_cleanup(e);
        var logline = e.player.getName() + " left the game. Nearby Sus Box despawned.";
        logToFile("events", logline);
    }
}

/**
 * Triggered when a player joins the game. Checks if a swarm should spawn based on saved data.
 * @param {Object} e - The event object containing information about the player joining.
 */
function playerJoin(e) {

    if (isEventActive("April Fools")) {
        var player = e.player;
        var currentTime = new Date().getTime();

        var event_player_data = loadPlayerEventData("April Fools", player.getName());
        playerLastSpawnTime = event_player_data.playerLastSpawnTime;
        playerSpawnIntervals = event_player_data.playerSpawnIntervals;
        if (!playerLastSpawnTime || currentTime - playerLastSpawnTime > (playerSpawnIntervals || 30 * 60 * 1000)) {
            run_aprilfools_event(player);
        }
    }

    if (isEventActive("Easter Egg Hunt") || player.getName() == "TheOddlySeagull") {
        var player = e.player;
        var event_player_data = loadPlayerEventData("Easter Egg Hunt", player.getName());
    }
}
