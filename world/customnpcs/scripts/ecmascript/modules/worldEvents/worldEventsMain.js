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
var max_counter = 10000;

var EVENT_LOG_FILE_PATH = "world/customnpcs/scripts/json_spy/player_event_log.json";
var PLAYER_SPAWN_TIME_FILE_PATH = "world/customnpcs/scripts/json_spy/player_spawn_time.json";

var playerLastSpawnTime = {}; // Tracks the last spawn time for each player in milliseconds
var playerSpawnIntervals = {}; // Tracks the spawn interval for each player in milliseconds

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
 * Triggered when an entity dies. Cleans up "Sus Box" entities on April 1st.
 * @param {Object} e - The event object containing information about the death event.
 */
function died(e) {
    if (new Date().getDate() == 1 && new Date().getMonth() == 3) {
        susbox_cleanup(e);
        logPlayerEvent(e.player, "Sus Box Cleanup", { reason: "Player death on April 1st" });
    }
}

/**
 * Initializes the script, resetting counters or performing setup tasks.
 * @param {Object} e - The event object containing information about the initialization event.
 */
function init(e) {
    loadPlayerSpawnData(); // Load spawn times and intervals from file
    var player = e.player;
    var playerName = player.getName();
    counter = 0;

    if (new Date().getDate() == 1 && new Date().getMonth() == 3) {
        playerJoin(e);
        // Check if the player has never been swarmed or if the last swarm was more than their saved interval
        var currentTime = new Date().getTime();
        if (!playerLastSpawnTime[playerName] || currentTime - playerLastSpawnTime[playerName] > (playerSpawnIntervals[playerName] || 30 * 60 * 1000)) {
            spawnSusBoxSwarmForPlayer(e, player);
        }
    }
}

/**
 * Called on every tick. Handles spawning "Sus Box" entities on April 1st.
 * @param {Object} e - The event object containing information about the tick event.
 */
function tick(e) {
    var player = e.player;
    var playerName = player.getName();
    var currentTime = new Date().getTime();

    if (new Date().getDate() == 1 && new Date().getMonth() == 3) {
        // Check if it's time to spawn a new swarm (30 to 40 minutes interval)
        if (playerLastSpawnTime[playerName] && currentTime - playerLastSpawnTime[playerName] >= getRandomSpawnInterval()) {
            spawnSusBoxSwarmForPlayer(e, player);
        }
    }

    if (counter > max_counter) {
        counter = 0;
    }
    counter++;
}

/**
 * Spawns a swarm of "Sus Boxes" for the player and logs the event.
 * @param {Object} e - The event object.
 * @param {Object} player - The player for whom the swarm is spawned.
 */
function spawnSusBoxSwarmForPlayer(e, player) {
    var playerName = player.getName();
    var randomCount = Math.floor(Math.random() * 10) + 1; // Random number between 1 and 10
    spawn_susbox_swarm(e, player, player.world, randomCount, 10, 5);
    logPlayerEvent(player, "Sus Box Spawned", { count: randomCount });

    // Update the last spawn time and generate a new interval for the player
    playerLastSpawnTime[playerName] = new Date().getTime();
    playerSpawnIntervals[playerName] = getRandomSpawnInterval();
}

/**
 * Returns a random spawn interval between 30 and 40 minutes in milliseconds.
 * @returns {number} - The random spawn interval in milliseconds.
 */
function getRandomSpawnInterval() {
    return (30 * 60 * 1000) + Math.floor(Math.random() * (10 * 60 * 1000)); // 30 to 40 minutes
}

/**
 * Triggered when a player leaves the game. Saves their last spawn time and interval to a JSON file.
 * @param {Object} e - The event object containing information about the player leaving.
 */
function logout(e) {
    savePlayerSpawnData();
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
        spawnSusBoxSwarmForPlayer(e, player);
    }
}