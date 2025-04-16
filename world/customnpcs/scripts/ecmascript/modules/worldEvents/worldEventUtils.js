load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

var PLAYER_EVENT_DATA = "world/customnpcs/scripts/ecmascript/modules/worldEvents/player_event_data.json";

/**
 * Loads the player event data from a JSON file.
 * @param {string} event_name - The name of the event.
 * @param {string} player_name - The name of the player.
 * @returns {Object} - The player event data.
 */
function loadPlayerEventData(event_name, player_name) {
    if (checkFileExists(PLAYER_EVENT_DATA)) {
        var all_data = loadJson(PLAYER_EVENT_DATA);

        if (all_data[event_name] && all_data[event_name][player_name]) {
            return all_data[event_name][player_name];
        } else {
            return {};
        }
    } else {
        return {};
    }
}

/**
 * Saves the player event data to a JSON file.
 * @param {string} event_name - The name of the event.
 * @param {string} player_name - The name of the player.
 * @param {Object} data - The data to save.
 */
function savePlayerEventData(event_name, player_name, data) {
    if (checkFileExists(PLAYER_EVENT_DATA)) {
        var all_data = loadJson(PLAYER_EVENT_DATA);
    } else {
        var all_data = {};
    }

    if (!all_data[event_name]) {
        all_data[event_name] = {};
    }

    all_data[event_name][player_name] = data;

    saveJson(all_data, PLAYER_EVENT_DATA);
}

/**
 * Checks if the current date falls within the specified event's date range.
 * @param {string} eventName - The name of the event to check.
 * @returns {boolean} - True if the current date is within the event range, false otherwise.
 */
function isEventActive(eventName) {
    for (var i = 0; i < allEventConfig.events.length; i++) {
        var eventConfig = allEventConfig.events[i];
        if (isDateBetween(
            eventConfig.startDate.day,
            eventConfig.startDate.month,
            eventConfig.endDate.day,
            eventConfig.endDate.month
        ) && eventConfig.name === eventName) {
            return true;
        }
    }
    return false;
}

/**
 * Checks if any event is currently active.
 * @returns {boolean} - True if any event is active, false otherwise.
 */
function isAnyEventActive() {
    for (var i = 0; i < allEventConfig.events.length; i++) {
        var eventConfig = allEventConfig.events[i];
        if (isDateBetween(
            eventConfig.startDate.day,
            eventConfig.startDate.month,
            eventConfig.endDate.day,
            eventConfig.endDate.month
        )) {
            return true;
        }
    }
    return false;
}

/**
 * Retrieves a list of currently active events.
 * @returns {Array<string>} - A list of active event names.
 */
function getActiveEventList() {
    var activeEvents = [];
    for (var i = 0; i < allEventConfig.events.length; i++) {
        var eventConfig = allEventConfig.events[i];
        if (isDateBetween(
            eventConfig.startDate.day,
            eventConfig.startDate.month,
            eventConfig.endDate.day,
            eventConfig.endDate.month
        )) {
            activeEvents.push(eventConfig.name);
        }
    }
    return activeEvents;
}

/**
 * Initiates a timer for a player in a specific event.
 * If no timer exists for the player, it sets the current time as the start time.
 * @param {IPlayer} player - The player object.
 * @param {string} EventName - The name of the event.
 */
function initiateTimer(player, EventName) {
    var event_player_data = loadPlayerEventData(EventName, player.getName());
    if (event_player_data.playerLastSpawnTime == null) {
        event_player_data.playerLastSpawnTime = new Date().getTime();
        savePlayerEventData(EventName, player.getName(), event_player_data);
        logToFile("events", "Player " + player.getName() + " started the timer for " + EventName);
    }
}

/**
 * Checks if the cooldown period for a player in a specific event is over.
 * @param {IPlayer} player - The player object.
 * @param {string} EventName - The name of the event.
 * @returns {boolean} - True if the cooldown is over, false otherwise.
 */
function GetIfCooldownOver(player, EventName) {
    var event_player_data = loadPlayerEventData(EventName, player.getName());
    if (event_player_data.playerLastSpawnTime != null) {
        var currentTime = new Date().getTime();
        var timeElapsed = currentTime - event_player_data.playerLastSpawnTime;
        var cooldownTime = getCooldownTime(EventName);
        if (timeElapsed >= cooldownTime) {
            return true;
        }
    }
    return false;
}

/**
 * Retrieves the cooldown time for a specific event.
 * @param {string} EventName - The name of the event.
 * @returns {number} - The cooldown time in milliseconds.
 */
function getCooldownTime(EventName) {
    for (var i = 0; i < allEventConfig.events.length; i++) {
        var eventConfig = allEventConfig.events[i];
        if (eventConfig.name === EventName) {
            return eventConfig.cooldownTime;
        }
    }
    return 0;
}

/**
 * Sets the cooldown time for a player in a specific event.
 * @param {IPlayer} player - The player object.
 * @param {string} EventName - The name of the event.
 * @param {number} countMinutes - The number of minutes to set as cooldown.
 */
function setCooldownTime(player, EventName, countMinutes) {
    var event_player_data = loadPlayerEventData(EventName, player.getName());
    if (event_player_data.playerLastSpawnTime != null) {
        var currentTime = new Date().getTime();
        event_player_data.playerLastSpawnTime = currentTime + (countMinutes * 60 * 1000);
        savePlayerEventData(EventName, player.getName(), event_player_data);
    }
}