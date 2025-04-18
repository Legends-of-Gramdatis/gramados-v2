load("world/customnpcs/scripts/ecmascript/gramados_sounds/toll_sounds.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/easterEggHuntEvent.js");

function tick(event) {
    runToll(event);
    var player = event.player;

    if (everyMinutes(0)) {
        revealLock(event.player);
        tellPlayer(event.player, "&aEvery minute event triggered.");
        // with spawnEggSwarm, spawn a small swarm of eggs
        var egg_attempt_count = Math.round(Math.random() * 1) + 1;
        spawnEggSwarm(player, player.getWorld(), egg_attempt_count, 5, true);
        // initToll("quarterly");
    } else if (everyMinutes(2)) {
        initToll("quarterly");
    }
}

function interact(event) {
    var player = event.player;
    var date = new Date();
    tellPlayer(player, "Current time: " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
    var world_time = event.player.getWorld().getTime()
    tellPlayer(player, "World time: " + world_time);
    
    revealLock(player);

}