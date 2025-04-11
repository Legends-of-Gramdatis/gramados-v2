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