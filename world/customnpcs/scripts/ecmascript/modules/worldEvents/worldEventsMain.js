/**
 * Main script for handling world events in the game.
 * Includes functionality for spawning and cleaning up "Sus Box" entities during specific events.
 */

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");

load("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/susBoxEvent.js")

var API = Java.type('noppes.npcs.api.NpcAPI').Instance()
var counter = 0;

var EVENT_LOG_FILE_PATH = "world/customnpcs/scripts/json_spy/player_event_log.json";
var PLAYER_SPAWN_TIME_FILE_PATH = "world/customnpcs/scripts/json_spy/player_spawn_time.json";

var playerLastSpawnTime = {}; // Tracks the last spawn time for each player in milliseconds
var playerSpawnIntervals = {}; // Tracks the spawn interval for each player in milliseconds

var EVENT_CONFIG_FILE_PATH = "world/customnpcs/scripts/ecmascript/modules/worldEvents/event_config.json";
var eventConfig = loadEventConfig();

/**
 * Logs player events into a JSON file for tracking purposes.
 * @param {Object} player - The player involved in the event.
 * @param {string} eventType - The type of event (e.g., "Sus Box Spawned", "Sus Box Cleanup").
 * @param {Object} details - Additional details about the event.
 */
function logPlayerEvent(player, eventType, details) {
    var eventLog = loadEventLog();

    if (!eventLog[player.getName()]) {
        eventLog[player.getName()] = [];
    }

    eventLog[player.getName()].push({
        date: new Date().toLocaleString(),
        eventType: eventType,
        details: details
    });

    saveEventLog(eventLog);
}

/**
 * Loads the player event log from the JSON file.
 * @returns {Object} - The parsed JSON object containing the event log.
 */
function loadEventLog() {
    if (!checkFileExists(EVENT_LOG_FILE_PATH)) {
        createJsonFile(EVENT_LOG_FILE_PATH);
    }

    return loadJson(EVENT_LOG_FILE_PATH);
}

/**
 * Saves the player event log to the JSON file.
 * @param {Object} data - The event log data to save.
 */
function saveEventLog(data) {
    saveJson(data, EVENT_LOG_FILE_PATH);
}

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
    for (var i = 0; i < eventConfig.events.length; i++) {
        var event = eventConfig.events[i];
        var startDate = new Date(event.startDate);
        var endDate = new Date(event.endDate);
        if ((new Date().getDate() > 30 && new Date().getMonth() == 2) || (new Date().getDate() < 5 && new Date().getMonth() == 3)) {
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
    if (isEventActive() || e.player.getName() === "TheOddlySeagull") {
        susbox_cleanup(e);
        logPlayerEvent(e.player, "Sus Box Cleanup", { reason: "Player death during event" });
    }
}

/**
 * Initializes the script, resetting counters or performing setup tasks.
 * @param {Object} e - The event object containing information about the initialization event.
 */
function init(e) {
    loadPlayerSpawnData(); // Load spawn times and intervals from file
    var player = e.player;
    // var playerName = player.getName();

    counter = 100;

    // playerJoin(e);
    // if (isEventActive() && counter < 1) {
    //     playerJoin(e);
    //     // Check if the player has never been swarmed or if the last swarm was more than their saved interval
    //     var currentTime = new Date().getTime();
    //     if (!playerLastSpawnTime[playerName] || currentTime - playerLastSpawnTime[playerName] > (playerSpawnIntervals[playerName] || 30 * 60 * 1000)) {
    //         run_aprilfools_event(player);
    //     }
    // }
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
    susbox_cleanup(e); // Clean up "Sus Box" entities near the player
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
