
var tollTickCounter = 0;
var lock_counter = false;
var tolltype = "quarterly"; // "quarterly" or "hourly"

function initToll(type) {
    if (!lock_counter) {
        tollTickCounter = 1;
        tolltype = type;
        lock_counter = true;
    }

    logToFile("events", "Toll was initialized with type: " + type);
}

function resetToll() {
    tollTickCounter = 0;
    lock_counter = false;
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
    } else {
        lock_counter = false;
    }
}

function everyHours(second_delay) {
    var date = new Date();
    if (second_delay == null) {
        second_delay = 0;
    }
    return (date.getMinutes() == 0 && date.getSeconds() == second_delay);
}

function everyQuarterHours(second_delay) {
    var date = new Date();
    if (second_delay == null) {
        second_delay = 0;
    }
    return (
        (date.getMinutes() == 15 && date.getSeconds() == second_delay)
        || (date.getMinutes() == 30 && date.getSeconds() == second_delay)
        || (date.getMinutes() == 45 && date.getSeconds() == second_delay)
    );
}

function getCurrentlyInMinutelySecond() {
    var date = new Date();
    return (date.getSeconds() == 0);
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