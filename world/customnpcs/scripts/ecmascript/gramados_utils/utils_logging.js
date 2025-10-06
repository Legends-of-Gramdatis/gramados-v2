load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");

var LOG_FILES = {
    economy: {
        json: "world/customnpcs/scripts/logs/economy.json",
        log: "world/customnpcs/scripts/logs/economy.log"
    },
    events: {
        json: "world/customnpcs/scripts/logs/events.json",
        log: "world/customnpcs/scripts/logs/events.log"
    },
    mafia: {
        json: "world/customnpcs/scripts/logs/mafia.json",
        log: "world/customnpcs/scripts/logs/mafia.log"
    },
    bank_robbery: {
        json: "world/customnpcs/scripts/logs/bank_robbery.json",
        log: "world/customnpcs/scripts/logs/bank_robbery.log"
    }, 
    loot_tables: {
        json: "world/customnpcs/scripts/logs/loot_tables.json",
        log: "world/customnpcs/scripts/logs/loot_tables.log"
    }, 
    mechanics: {
        json: "world/customnpcs/scripts/logs/mechanics.json",
        log: "world/customnpcs/scripts/logs/mechanics.log"
    }, 
    dev: {
        json: "world/customnpcs/scripts/logs/dev.json",
        log: "world/customnpcs/scripts/logs/dev.log"
    },
    onboarding: {
        json: "world/customnpcs/scripts/logs/onboarding.json",
        log: "world/customnpcs/scripts/logs/onboarding.log"
    }
};

/**
 * Logs data to a JSON file.
 * @param {string} logType - The type of log (e.g., "economy", "events").
 * @param {string} key - The key under which the data will be stored.
 * @param {Object} data - The data to log.
 */
function logToJson(logType, key, data) {
    if (!LOG_FILES[logType] || !LOG_FILES[logType].json) {
        tellPlayer("Invalid log type: " + logType);
    }

    var filePath = LOG_FILES[logType].json;
    var logData = checkFileExists(filePath) ? loadJson(filePath) : {};

    if (!logData[key]) {
        logData[key] = [];
    }

    logData[key].push(data);
    saveJson(logData, filePath);
}

/**
 * Logs a message to a standard log file.
 * @param {string} logType - The type of log (e.g., "economy", "events").
 * @param {string} message - The message to log.
 */
function logToFile(logType, message) {
    if (!LOG_FILES[logType] || !LOG_FILES[logType].log) {
        tellPlayer("Invalid log type: " + logType);
    }

    var filePath = LOG_FILES[logType].log;
    var logEntry = "[" + new Date().toLocaleString() + "] " + message + "\n";

    var fileWriter = new java.io.FileWriter(filePath, true); // 'true' for appending
    fileWriter.write(logEntry);
    fileWriter.close();
}
