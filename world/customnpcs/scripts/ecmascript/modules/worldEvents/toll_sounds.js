load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");

var tollTickCounter = 0;
var tolltype = "quarterly";

var lock_toll = false;
var lock_counter_hour = false;
var lock_counter_quarter = false;
var lock_counter_minute = false;
var lock_counter_30seconds = 0;

var hour_trigger_state = {};
var quarter_trigger_state = {};
var minute_trigger_state = {};
var second30_trigger_slot = null;

function initToll(type) {
    if (!lock_toll) {
        tollTickCounter = 1;
        tolltype = type;
        lock_toll = true;
    } else {
        lock_toll = false;
    }

    // logToFile("events", "Toll was initialized with type: " + type);
}

function resetToll() {
    tollTickCounter = 0;
    lock_toll = false;
    tolltype = "quarterly";
}

function runToll(event) {
    var player = event.player;
    var world = player.getWorld();

    switch (tolltype) {
        case "quarterly":
            tollTickCounter = playQuarterlySound(event, world, tollTickCounter);
            break;
        case "hourly":
            tollTickCounter = playHourlySound(event, world, tollTickCounter);
            break;
        default:
            break;
    }

    if (tollTickCounter > 0) {
        tollTickCounter++;
    }
}

/**
 * Checks if the current time is the start of an hour and ensures it only returns true once per hour.
 * @param {number} second_delay - The delay in seconds.
 * @returns {boolean} - True if it's the start of the hour and hasn't been executed yet.
 */
function everyHours(second_delay) {
    var date = new Date();
    if (second_delay == null) {
        second_delay = 0;
    }
    var delayKey = "" + second_delay;
    var hourKey = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours();

    if (date.getMinutes() === 0 && date.getSeconds() >= second_delay) {
        if (hour_trigger_state[delayKey] !== hourKey) {
            hour_trigger_state[delayKey] = hourKey;
            lock_counter_hour = true;
            return true;
        }
    }

    lock_counter_hour = false;
    return false;
}

/**
 * Checks if the current time is the start of a quarter-hour and ensures it only returns true once per quarter-hour.
 * @param {number} second_delay - The delay in seconds.
 * @returns {boolean} - True if it's the start of the quarter-hour and hasn't been executed yet.
 */
function everyQuarterHours(second_delay) {
    var date = new Date();
    if (second_delay == null) {
        second_delay = 0;
    }
    var delayKey = "" + second_delay;
    var quarterIndex = Math.floor(date.getMinutes() / 15);
    var quarterKey = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + " Q" + quarterIndex;

    if (date.getMinutes() % 15 === 0 && date.getSeconds() >= second_delay) {
        if (quarter_trigger_state[delayKey] !== quarterKey) {
            quarter_trigger_state[delayKey] = quarterKey;
            lock_counter_quarter = true;
            return true;
        }
    }

    lock_counter_quarter = false;
    return false;
}

/**
 * Checks if the current time is the start of a minute and ensures it only returns true once per minute.
 * @returns {boolean} - True if it's the start of the minute and hasn't been executed yet.
 */
function everyMinutes(second_delay) {
    var date = new Date();
    if (second_delay == null) {
        second_delay = 0;
    }
    var delayKey = "" + second_delay;
    var minuteKey = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes();

    if (date.getSeconds() >= second_delay) {
        if (minute_trigger_state[delayKey] !== minuteKey) {
            minute_trigger_state[delayKey] = minuteKey;
            lock_counter_minute = true;
            return true;
        }
    }

    lock_counter_minute = false;
    return false;
}

/**
 * Checks if the current time is at a 30-second interval and ensures it only returns true once per interval.
 * @returns {boolean} - True if it's a 30-second interval and hasn't been executed yet.
 */
function every30Seconds() {
    var currentTimestamp = new Date().getTime();
    var slot = Math.floor(currentTimestamp / 30000);
    if (second30_trigger_slot !== slot) {
        second30_trigger_slot = slot;
        lock_counter_30seconds = currentTimestamp;
        return true;
    }
    return false;
}

function revealLock(player) {
    tellPlayer(player, "&7Hour Counter Lock: " + lock_counter_hour);
    tellPlayer(player, "&7Quarter Counter Lock: " + lock_counter_quarter);
    tellPlayer(player, "&7Minute Counter Lock: " + lock_counter_minute);
    tellPlayer(player, "&7Toll Lock: " + lock_toll);
}

function playQuarterlySound(event, world, tollTickCounter) {
    switch (tollTickCounter) {
        case 1:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 10.0);
            // event.player.message("Playing sound 1 at tick " + tollTickCounter);
            break;
        case 3:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.8, 10.0);
            // event.player.message("Playing sound 2 at tick " + tollTickCounter);
            break;
        case 5:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.6, 10.0);
            // event.player.message("Playing sound 3 at tick " + tollTickCounter);
            break;
        case 8:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 10.0);
            // event.player.message("Playing sound 4 at tick " + tollTickCounter);
            break;
        case 10:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.8, 10.0);
            // event.player.message("Playing sound 5 at tick " + tollTickCounter);
            break;
        case 12:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.6, 10.0);
            // event.player.message("Playing sound 6 at tick " + tollTickCounter);
            break;
        case 20:
            tollTickCounter = 0;
            // event.player.message("Resetting tick count to 0");
            break;
    }

    return tollTickCounter;
}

function playHourlySound(event, world, tollTickCounter) {
    switch (tollTickCounter) {
        case 1:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 1.0);
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 0.2);
            break;
        case 5:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 1.0);
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 0.2);
            break;
        case 9:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 1.0);
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 0.2);
            break;
        case 13:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 1.0);
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 0.2);
            break;
        case 17:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 1.0);
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 0.2);
            break;
        case 21:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 1.0);
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 0.2);
            break;
        
        case 2:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 10.0);
            break;
        case 4:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.8, 10.0);
            break;
        case 6:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.6, 10.0);
            break;
        case 14:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 10.0);
            break;
        case 16:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.8, 10.0);
            break;
        case 18:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.6, 10.0);
            break;

        case 25:
            tollTickCounter = 0;
            // event.player.message("Resetting tick count to 0");
            break;
    }

    return tollTickCounter;
}