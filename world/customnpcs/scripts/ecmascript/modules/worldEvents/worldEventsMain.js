load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js");
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js");

load("world/customnpcs/scripts/ecmascript/modules/worldEvents/toll_sounds.js");

// load("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/aprilFools/2025/susBoxEvent.js");
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/aprilFools/2026/fishSwarm.js");
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/easterEggHuntEvent.js");
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/spooktober/spooktoberEvent.js");
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/christmas/christmasElfEvent.js");

var API = Java.type('noppes.npcs.api.NpcAPI').Instance()

var playerLastSpawnTime = {}; // Tracks the last spawn time for each player in milliseconds
var playerSpawnIntervals = {}; // Tracks the spawn interval for each player in milliseconds

var EVENT_CONFIG_FILE_PATH = "world/customnpcs/scripts/ecmascript/modules/worldEvents/event_config.json";
var ONBOARDING_DATA_PATH = 'world/customnpcs/scripts/data_auto/onboarding_data.json';

var tick_counter = 0;
var max_tick_count = 100;

/**
 * Checks if a player is in onboarding phases 0-1 (should not receive events)
 * @param {IPlayer} player - The player to check
 * @returns {boolean} - True if player is in phases 0-1, false otherwise or if onboarding data unavailable
 */
function isPlayerInEarlyOnboarding(player) {
    if (!checkFileExists(ONBOARDING_DATA_PATH)) {
        return false; // No onboarding data = events enabled
    }
    try {
        var onboardingData = loadJson(ONBOARDING_DATA_PATH);
        if (!onboardingData) return false;
        var playerName = player.getName();
        var playerData = onboardingData[playerName];
        if (!playerData) return false; // No player entry = not in onboarding
        var phase = playerData.phase;
        // Phases 0 and 1 = early onboarding, no events
        return (phase === 0 || phase === 1);
    } catch (e) {
        // If error reading data, allow events (fail open)
        return false;
    }
}

/**
 * Triggered when an entity dies. Cleans up "Sus Box" entities on April 1st.
 * @param {Object} e - The event object containing information about the death event.
 */
// function died(e) {
//     if (isEventActiveForPlayer("april_fools", e.player)) {
//         susbox_cleanup(e);
//         var logline = e.player.getName() + " died. Nearby Sus Box despawned.";
//         logToFile("events", logline);
//     }
// }

/**
 * Initializes the script, resetting counters or performing setup tasks.
 * @param {Object} e - The event object containing information about the initialization event.
 */
function init(e) {
    tick_counter = 0;
    var player = e.player;
    
    // Skip events for players in onboarding phases 0-1
    if (isPlayerInEarlyOnboarding(player)) {
        return;
    }
    
    var activeEvents = getActiveEventList();

    if (activeEvents.length > 0) {

        if (activeEvents.length > 0) {
            var activeEventsNames = [];
            for (var i = 0; i < activeEvents.length; i++) {
                activeEventsNames.push(activeEvents[i].name);
            }
            tellPlayer(player, "&6&l[&e&lEvent&6&l] &eActive Events: &a" + activeEventsNames.join("&a, &r") + " &6&l[&e&lEvent&6&l]");
        }

        for (var i = 0; i < activeEvents.length; i++) {
            var eventID = activeEvents[i].id;
            if (!hasPlayerSkippedEvent(player, eventID) && shouldShowSkipMessage(player)) {
                var skipMessage = "&7If you don't want to participate in the '" + eventID + "' event, you can &9[Skip]{run_command:!event skip " + eventID + "|show_text:$aClick to skip the " + eventID + " event}&r &7this event.";
                skipMessage += " &9[Hide]{run_command:!event showSkipMessage false|show_text:$aClick to stop seeing this message}&r";
                tellPlayer(player, skipMessage);
            }
        }

        if (isEventActiveForPlayer("Easter Egg Hunt", player)) {
            spawnEasterStarterPack(player);
            resetToll();
        }
    }

    updateSkippersList();

    if (isEventActiveForPlayer("Christmas", player)) {
        christmas_onPlayerJoin(player);
    }
}


/**
 * Called on every tick. Handles spawning "Sus Box" entities on April 1st.
 * @param {Object} e - The event object containing information about the tick event.
 */
function tick(e) {
    var player = e.player;
    
    // Skip events for players in onboarding phases 0-1
    if (isPlayerInEarlyOnboarding(player)) {
        return;
    }
    
    if (tick_counter > max_tick_count) {
        if (isAnyEventActive()) {

            var playerName = player.getName();
            // var currentTime = new Date().getTime();		

            if (isEventActiveForPlayer("april_fools", player)) {
                // tellPlayer(player, "&6&l[&e&lEvent&6&l] &eThe Fish Rain event is active! Try catching fish with a bucket! &6&l[&e&lEvent&6&l]");
                var event_player_data = loadPlayerEventData("april_fools", playerName);
                playerLastSpawnTime = event_player_data.playerLastSpawnTime || 0;
                playerSpawnIntervals = event_player_data.playerSpawnIntervals || 2 * 60 * 1000; // Default to 2 minutes if not set
                // Check if it's time to spawn a new swarm (30 to 40 minutes interval)
                var currentTime = new Date().getTime();
                if (currentTime - playerLastSpawnTime > playerSpawnIntervals) {
                    run_aprilfools_event(player, event_player_data);
                }
            }

            if (isEventActiveForPlayer("Easter Egg Hunt", player)) {
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

            if (isEventActiveForPlayer("Spooktober", player)) {
                var playerName = player.getName();
                var pdata = loadPlayerEventData("Spooktober", playerName);
                var lastTime = pdata.playerLastSpawnTime || 0;
                if (new Date().getTime() - lastTime >= SPOOKTOBER_CONFIG.spawnIntervalMs) {
                    run_spooktober_event(player);
                }
            }
        }

        tick_counter = 0;
    }
    tick_counter++;

    if (isEventActiveForPlayer("Christmas", player)) {
        christmas_tickFollow(player);
    }
}

/**
 * Returns a random spawn interval between 10 and 15 minutes in milliseconds.
 * @returns {number} - The random spawn interval in milliseconds.
 */
function getRandomSpawnInterval() {
    return (10 * 60 * 1000) + Math.floor(Math.random() * (20 * 60 * 1000)); // 10 to 30 minutes
}

function getRandomSpawnIntervalMinutes(minutes_min, minutes_max) {
    return (minutes_min * 60 * 1000) + Math.floor(Math.random() * ((minutes_max - minutes_min) * 60 * 1000));
}

/**
 * Triggered when a player leaves the game. Saves their last spawn time and interval to a JSON file.
 * Also cleans up "Sus Box" entities near the player.
 * @param {Object} e - The event object containing information about the player leaving.
 */
function logout(e) {

    // if (isEventActiveForPlayer("april_fools", e.player)) {
    //     susbox_cleanup(e);
    //     var logline = e.player.getName() + " left the game. Nearby Sus Box despawned.";
    //     logToFile("events", logline);
    // }

    if (isEventActiveForPlayer("Christmas", e.player)) {
        christmas_onPlayerLogout(e.player);
    }
}

/**
 * Triggered when a player joins the game. Checks if a swarm should spawn based on saved data.
 * @param {Object} e - The event object containing information about the player joining.
 */
function playerJoin(e) {
    var player = e.player;

    if (isEventActiveForPlayer("april_fools", player)) {
        var currentTime = new Date().getTime();

        var event_player_data = loadPlayerEventData("april_fools", player.getName());
        playerLastSpawnTime = event_player_data.playerLastSpawnTime;
        playerSpawnIntervals = event_player_data.playerSpawnIntervals;
        if (!playerLastSpawnTime || currentTime - playerLastSpawnTime > (playerSpawnIntervals || 30 * 60 * 1000)) {
            run_aprilfools_event(player, event_player_data);
        }
    }

    if (isEventActiveForPlayer("Easter Egg Hunt", player)) {
        var event_player_data = loadPlayerEventData("Easter Egg Hunt", player.getName());
    }
}
