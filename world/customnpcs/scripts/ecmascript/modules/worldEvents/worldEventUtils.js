load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');

var EVENT_CONFIG_FILE_PATH = "world/customnpcs/scripts/ecmascript/modules/worldEvents/event_config.json";
var PLAYER_EVENT_DATA = "world/customnpcs/scripts/ecmascript/modules/worldEvents/player_event_data.json";
var allEventConfig = loadEventConfig();
var DEBUG_MODE = false;


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
 * Loads the player event data from a JSON file.
 * @param {string} eventId - The event ID (or configured name, which is normalized to ID).
 * @param {string} player_name - The name of the player.
 * @returns {Object} - The player event data.
 */
function loadPlayerEventData(eventId, player_name) {
    var all_data = loadJson(PLAYER_EVENT_DATA);
    var canonicalEventId = nameToID(eventId);

    if (all_data[canonicalEventId] && all_data[canonicalEventId][player_name]) {
        return all_data[canonicalEventId][player_name];
    }

    return {};
}

/**
 * Saves the player event data to a JSON file.
 * @param {string} event_name - The event ID (or configured name, which is normalized to ID).
 * @param {string} player_name - The name of the player.
 * @param {Object} data - The data to save.
 */
function savePlayerEventData(event_name, player_name, data) {
    var canonicalEventId = nameToID(event_name);
    if (checkFileExists(PLAYER_EVENT_DATA)) {
        var all_data = loadJson(PLAYER_EVENT_DATA);
    } else {
        var all_data = {};
    }

    if (!all_data[canonicalEventId]) {
        all_data[canonicalEventId] = {};
    }

    all_data[canonicalEventId][player_name] = data;

    saveJson(all_data, PLAYER_EVENT_DATA);
}

function nameToID(name) {
    for (var i = 0; i < allEventConfig.events.length; i++) {
        var eventConfig = allEventConfig.events[i];
        if (eventConfig.name === name) {
            return eventConfig.id;
        }
    }
    return name; // Return original name if not found
}

/**
 * Checks if the current date falls within the specified event's date range.
 * @param {string} eventName - The name of the event to check.
 * @returns {boolean} - True if the current date is within the event range, false otherwise.
 */
function isEventActive(eventName) {
    if (DEBUG_MODE) {
        return true;
    }
    eventName = nameToID(eventName);
    for (var i = 0; i < allEventConfig.events.length; i++) {
        var eventConfig = allEventConfig.events[i];
        if (isDateBetween(
            eventConfig.startDate.day,
            eventConfig.startDate.month,
            eventConfig.endDate.day,
            eventConfig.endDate.month
        ) && eventConfig.id === eventName) {
            return true;
        }
    }
    return false;
}

/**
 * Checks if an event is active for a specific player.
 * The event must be active globally and not skipped by the player.
 * @param {string} eventName - The name or ID of the event.
 * @param {IPlayer} player - The player to check against.
 * @returns {boolean} - True if the event is active and not skipped by the player.
 */
function isEventActiveForPlayer(eventName, player) {
    var eventID = nameToID(eventName);
    if (!isEventActive(eventID)) {
        return false;
    }

    return !hasPlayerSkippedEvent(player, eventID);
}

/**
 * Checks if any event is currently active.
 * @returns {boolean} - True if any event is active, false otherwise.
 */
function isAnyEventActive() {
    if (DEBUG_MODE) {
        return true;
    }
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
 * Updates the list of players who have skipped events, clearing it for events that are no longer active.
 */
function updateSkippersList() {
    for (var i = 0; i < allEventConfig.events.length; i++) {
        var eventConfig = allEventConfig.events[i];
        if (!isDateBetween(
            eventConfig.startDate.day,
            eventConfig.startDate.month,
            eventConfig.endDate.day,
            eventConfig.endDate.month
        )) {
            // Event is not active, clear skippers list
            var all_data = loadJson(PLAYER_EVENT_DATA);
            if (all_data[eventConfig.id]) {
                for (var playerName in all_data[eventConfig.id]) {
                    if (all_data[eventConfig.id][playerName].skipped) {
                        all_data[eventConfig.id][playerName].skipped = false;
                    }
                }
                saveJson(all_data, PLAYER_EVENT_DATA);
            }
        }
    }
}

function loadPlayerSpecificEventData(player_name) {
    var all_data = loadJson(PLAYER_EVENT_DATA);
    if (all_data.player_data && all_data.player_data[player_name]) {
        return all_data.player_data[player_name];
    } else {
        return {
            skipping_events: []
        };
    }
}

function savePlayerSpecificEventData(player_name, data) {
    var all_data = loadJson(PLAYER_EVENT_DATA);
    all_data.player_data[player_name] = data;
    saveJson(all_data, PLAYER_EVENT_DATA);
}

function hasPlayerSkippedEvent(player, eventID) {
    var event_player_data = loadPlayerSpecificEventData(player.getName());
    return includes(event_player_data.skipping_events, eventID);
}

function setPlayerSkippedEvent(player, EventName) {
    var event_player_data = loadPlayerSpecificEventData(player.getName());
    if (!includes(event_player_data.skipping_events, EventName)) {
        event_player_data.skipping_events.push(EventName);
        savePlayerSpecificEventData(player.getName(), event_player_data);
    }
}

function setPlayerParticipatingInEvent(player, eventID) {
    var event_player_data = loadPlayerSpecificEventData(player.getName());
    if (hasPlayerSkippedEvent(player, eventID)) {
        array_remove(event_player_data.skipping_events, eventID);
        savePlayerSpecificEventData(player.getName(), event_player_data);
    }
}

function setShowSkipMessage(player, show) {
    show = (show.toLowerCase() === "true");
    var event_player_data = loadPlayerSpecificEventData(player.getName());
    event_player_data.show_skip_message = show;
    savePlayerSpecificEventData(player.getName(), event_player_data);
    return show;
}

function shouldShowSkipMessage(player) {
    var event_player_data = loadPlayerSpecificEventData(player.getName());
    return event_player_data.show_skip_message !== false; // Default to true if not set
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
            activeEvents.push({ id: eventConfig.id, name: eventConfig.name });
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
    var eventID = nameToID(EventName);
    for (var i = 0; i < allEventConfig.events.length; i++) {
        var eventConfig = allEventConfig.events[i];
        if (eventConfig.id === eventID) {
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