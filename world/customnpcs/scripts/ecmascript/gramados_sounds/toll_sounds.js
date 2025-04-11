function runToll(event) {
    var player = event.player;
    var world = player.getWorld();

    if (getCurrentlyInHourlyMinutes()) {
        playHourlySound(event, world);
    } else if (getCurrentlyInQuarterlyMinutes()) {
        playQuarterlySound(event, world);
    }
}

function getCurrentlyInHourlyMinutes() {
    var date = new Date();
    return (date.getMinutes() >= 0 && date.getMinutes() <= 1);
}

function getCurrentlyInQuarterlyMinutes() {
    var date = new Date();
    return (
        (date.getMinutes() >= 14 && date.getMinutes() <= 15)
        || (date.getMinutes() >= 29 && date.getMinutes() <= 30)
        || (date.getMinutes() >= 44 && date.getMinutes() <= 45)
    );
}

function playQuarterlySound(event, world) {
    var time = world.getTime() % 4000;
    switch (time) {
        case 1:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 10.0);
            break;
        case 21:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.8, 10.0);
            break;
        case 41:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.6, 10.0);
            break;
        case 71:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 10.0);
            break;
        case 91:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.8, 10.0);
            break;
        case 111:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.6, 10.0);
            break;
    }
}

function playHourlySound(event, world) {
    var time = world.getTime() % 4000;
    switch (time) {
        case 1:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 1.0);
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 0.2);
            break;
        case 41:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 1.0);
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 0.2);
            break;
        case 81:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 1.0);
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 0.2);
            break;
        case 121:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 1.0);
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 0.2);
            break;
        case 161:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 1.0);
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 0.2);
            break;
        case 201:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 1.0);
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 0.2);
            break;
        
        case 11:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 10.0);
            break;
        case 31:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.8, 10.0);
            break;
        case 51:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.6, 10.0);
            break;
        case 131:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 1.0, 10.0);
            break;
        case 151:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.8, 10.0);
            break;
        case 171:
            world.playSoundAt(event.player.getPos(), "ivv:toll", 0.6, 10.0);
            break;
    }
}