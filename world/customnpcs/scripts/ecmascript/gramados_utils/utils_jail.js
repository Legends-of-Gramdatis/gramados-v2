load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');

var JAILS_DATA_PATH = "world/customnpcs/scripts/ecmascript/modules/jail_system/jails_data.json";

/**
 * Gets the number of available jail spaces in a region.
 * @returns {number} The number of available jail spaces.
 */
function getAvailableJailSpaces() {
    var jailsData = loadJson(JAILS_DATA_PATH);
    if (!jailsData) return 0;

    var availableSpaces = 0;
    for (var i = 0; i < jailsData.jails.length; i++) {
        var jail = jailsData.jails[i];
        availableSpaces += jail.capacity - (jail.jail_times || []).length;
    }
    return availableSpaces;
}

/**
 * Gets the remaining jail time for a player.
 * @param {string} playerName - The name of the player.
 * @returns {number|null} The remaining time in ticks, or null if the player is not jailed.
 */
function getPlayerJailTimeLeft(playerName) {
    var jailsData = loadJson(JAILS_DATA_PATH);
    if (!jailsData) return null;

    for (var i = 0; i < jailsData.jails.length; i++) {
        var jail = jailsData.jails[i];
        for (var j = 0; j < jail.jail_times.length; j++) {
            if (jail.jail_times[j].name === playerName) {
                return jail.jail_times[j].timeleft;
            }
        }
    }
    return null;
}

/**
 * Gets the total time a player has spent in jail by reading the jail log JSON.
 * @param {string} playerName - The name of the player.
 * @returns {number} The total time spent in ticks.
 */
function getPlayerJailTimeSpent(playerName) {
    var jailLog = loadJson("world/customnpcs/scripts/logs/jail.json");
    if (!jailLog || !jailLog[playerName]) return 0;

    return jailLog[playerName].reduce((total, entry) => total + entry.timeSpent, 0);
}

/**
 * Jails a player in the specified region and logs the event.
 * @param {IPlayer} player - The player to jail.
 * @param {string} reason - The reason for jailing the player.
 * @param {number} time - The jail time in ticks.
 */
function jailPlayer(player, reason, time) {
    var jailsData = loadJson(JAILS_DATA_PATH);
    if (!jailsData) {
        jailsData = { jails: [] };
    }

    var jail = null;
    for (var i = 0; i < jailsData.jails.length; i++) {
        if (jailsData.jails[i].capacity > (jailsData.jails[i].jail_times || []).length) {
            jail = jailsData.jails[i];
            break;
        }
    }

    if (!jail) {
        tellPlayer(player, "&cNo available jail cells. Contact an admin.");
        return;
    }

    var jailRegion = jail.regionname[0];
    var jailPos = getRegionCenter(jailRegion);
    player.setPos(jailPos.getX(), jailPos.getY(), jailPos.getZ());

    var jailEntry = {
        name: player.getName(),
        timeleft: time,
        reason: reason
    };
    jail.jail_times.push(jailEntry);

    saveJson(jailsData, JAILS_DATA_PATH);

    // Log the jailing event
    logToJson("jail", player.getName(), {
        action: "jailed",
        reason: reason,
        time: time,
        timestamp: new Date().toISOString()
    });
    logToFile("jail", `Player ${player.getName()} jailed for: ${reason}, time: ${time} ticks`);

    tellPlayer(player, "&cYou have been jailed for: " + reason);
}

/**
 * Releases a player from jail when their time is up and logs the event.
 * @param {string} playerName - The name of the player to release.
 */
function releasePlayer(playerName) {
    var player = API.getIWorld(0).getPlayer(playerName);
    if (player) {
        player.message("&aYou have been released from jail.");
        player.setPos(0, 64, 0); // Default release position
    }

    // Log the release event
    logToJson("jail", playerName, {
        action: "released",
        timestamp: new Date().toISOString()
    });
    logToFile("jail", `Player ${playerName} released from jail.`);
}

/**
 * Handles the jail system tick to decrement jail times and release players.
 */
function handleJailTick() {
    var jailsData = loadJson(JAILS_DATA_PATH);
    if (!jailsData) return;

    for (var i = 0; i < jailsData.jails.length; i++) {
        var jail = jailsData.jails[i];
        for (var j = jail.jail_times.length - 1; j >= 0; j--) {
            var jailTime = jail.jail_times[j];
            jailTime.timeleft--;

            if (jailTime.timeleft <= 0) {
                releasePlayer(jailTime.name);

                // Log the time spent in jail
                logToJson("jail", jailTime.name, {
                    action: "time_spent",
                    timeSpent: 6000, // Assuming full time served
                    timestamp: new Date().toISOString()
                });

                jail.jail_times.splice(j, 1);
            }
        }
    }

    saveJson(jailsData, JAILS_DATA_PATH);
}
