/**
 * Main script for handling world events in the game.
 * Includes functionality for spawning and cleaning up "Sus Box" entities during specific events.
 */

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");

load("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/susBoxEvent.js")

var API = Java.type('noppes.npcs.api.NpcAPI').Instance()
var counter = 0;

var PLAYER_SPAWN_TIME_FILE_PATH = "world/customnpcs/scripts/json_spy/player_spawn_time.json";

var playerLastSpawnTime = {}; // Tracks the last spawn time for each player in milliseconds
var playerSpawnIntervals = {}; // Tracks the spawn interval for each player in milliseconds

var EVENT_CONFIG_FILE_PATH = "world/customnpcs/scripts/ecmascript/modules/worldEvents/event_config.json";
var allEventConfig = loadEventConfig();

/**
 * Saves the playerLastSpawnTime and playerSpawnIntervals data to a JSON file.
 */
function savePlayerSpawnData() {
    saveJson({ lastSpawnTime: playerLastSpawnTime, spawnIntervals: playerSpawnIntervals }, PLAYER_SPAWN_TIME_FILE_PATH);
}

/**
 * Loads the playerLastSpawnTime and playerSpawnIntervals data from a JSON file.
 */
function loadPlayerSpawnData() {
    if (checkFileExists(PLAYER_SPAWN_TIME_FILE_PATH)) {
        var data = loadJson(PLAYER_SPAWN_TIME_FILE_PATH);
        playerLastSpawnTime = data.lastSpawnTime || {};
        playerSpawnIntervals = data.spawnIntervals || {};
    } else {
        playerLastSpawnTime = {};
        playerSpawnIntervals = {};
    }
}

/**
 * Loads the event configuration from the JSON file.
 * @returns {Object} - The parsed JSON object containing the event configuration.
 */
function loadEventConfig() {
    if (!checkFileExists(EVENT_CONFIG_FILE_PATH)) {
        throw new Error("Event configuration file not found: " + EVENT_CONFIG_FILE_PATH);
    }
    return loadJson(EVENT_CONFIG_FILE_PATH);
}

/**
 * Checks if the current date falls within the event's date range.
 * @returns {boolean} - True if the current date is within the event range, false otherwise.
 */
function isEventActive() {
    var currentDate = new Date();
    for (var i = 0; i < allEventConfig.events.length; i++) {
        var eventConfig = allEventConfig.events[i];
        if (
            (currentDate.getDate() > eventConfig.startDate.day
            && currentDate.getMonth() == eventConfig.startDate.month)
            || (currentDate.getDate() < eventConfig.endDate.day
            && currentDate.getMonth() == eventConfig.endDate.month)) {
                return true;
        }
    }
    return false;
}

/**
 * Triggered when an entity dies. Cleans up "Sus Box" entities on April 1st.
 * @param {Object} e - The event object containing information about the death event.
 */
function died(e) {
    if (isEventActive()) {
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
    loadPlayerSpawnData(); // Load spawn times and intervals from file
    var player = e.player;

    counter = 100;

    // Notify the player about active events
    var activeEvents = [];
    var currentDate = new Date();
    for (var i = 0; i < allEventConfig.events.length; i++) {
        var eventConfig = allEventConfig.events[i];
        if (
            (currentDate.getDate() > eventConfig.startDate.day
            && currentDate.getMonth() == eventConfig.startDate.month)
            || (currentDate.getDate() < eventConfig.endDate.day
            && currentDate.getMonth() == eventConfig.endDate.month)) {
                activeEvents.push(eventConfig.name);
        }
    }

    if (activeEvents.length > 0) {
        tellPlayer(player, "&6Active Events: &e" + activeEvents.join(", "));
    }
}

/**
 * Called on every tick. Handles spawning "Sus Box" entities on April 1st.
 * @param {Object} e - The event object containing information about the tick event.
 */
function tick(e) {
    var player = e.player;
    var playerName = player.getName();
    // var currentTime = new Date().getTime();		

    if (isEventActive() && counter < 1) {
        // Check if it's time to spawn a new swarm (30 to 40 minutes interval)
        var currentTime = new Date().getTime();
        if (!playerLastSpawnTime[playerName] || currentTime - playerLastSpawnTime[playerName] > (playerSpawnIntervals[playerName] || 30 * 60 * 1000)) {
            run_aprilfools_event(player);
        }
    }

    if (counter > 0) {
        counter--;
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
    savePlayerSpawnData();
    susbox_cleanup(e);

    var logline = e.player.getName() + " left the game. Nearby Sus Box despawned.";
    logToFile("events", logline);
}

/**
 * Triggered when a player joins the game. Checks if a swarm should spawn based on saved data.
 * @param {Object} e - The event object containing information about the player joining.
 */
function playerJoin(e) {
    var player = e.player;
    var playerName = player.getName();
    var currentTime = new Date().getTime();

    // Debug message: Time left before the next swarm
    // if (playerLastSpawnTime[playerName]) {
    //     var timeLeft = (playerSpawnIntervals[playerName] || 30 * 60 * 1000) - (currentTime - playerLastSpawnTime[playerName]);
    //     if (timeLeft > 0) {
    //         tellPlayer(player, "&7Time left before next swarm: &e" + Math.ceil(timeLeft / 1000 / 60) + " minutes");
    //     }
    // }

    // Check if the player has never been swarmed or if the last swarm was more than their saved interval
    if (!playerLastSpawnTime[playerName] || currentTime - playerLastSpawnTime[playerName] > (playerSpawnIntervals[playerName] || 30 * 60 * 1000)) {
        run_aprilfools_event(player);
    }
}
