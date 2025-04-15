load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");

var tollTickCounter = 0;
var tolltype = "quarterly";

var lock_toll = false;
var lock_counter_hour = false;
var lock_counter_quarter = false;
var lock_counter_minute = false;

function initToll(type) {
    if (!lock_toll) {
        tollTickCounter = 1;
        tolltype = type;
        lock_toll = true;
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
    if (everyQuarterHours(2)) {
        initToll("quarterly");
    } else if (everyHours(2)) {
        initToll("hourly");
    }

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

function everyHours(second_delay) {
    var date = new Date();
    if (second_delay == null) {
        second_delay = 0;
    }
    if (!lock_counter_hour && date.getMinutes() == 0 && date.getSeconds() == second_delay) {
        lock_counter_hour = true;
        return true;
    }
    else {
        lock_counter_hour = false;
        return false;
    }
}

function everyQuarterHours(second_delay) {
    var date = new Date();
    if (second_delay == null) {
        second_delay = 0;
    }
    if (
        (!lock_counter_quarter && (
           (date.getMinutes() == 15 && date.getSeconds() == second_delay)
        || (date.getMinutes() == 30 && date.getSeconds() == second_delay)
        || (date.getMinutes() == 45 && date.getSeconds() == second_delay)
    ))) {
        lock_counter_quarter = true;
        return true;
    } else {
        lock_counter_quarter = false;
        return false;
    }
}

function everyMinutes() {
    var date = new Date();
    if (!lock_counter_minute && date.getSeconds() == 0) {
            lock_counter_minute = true;
            return true;
    } else {
        lock_counter_minute = false;
        return false;
    }
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