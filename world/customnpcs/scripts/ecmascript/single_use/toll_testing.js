load("world/customnpcs/scripts/ecmascript/gramados_sounds/toll_sounds.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");

function tick(event) {
    runToll(event);

    if (everyMinutes(0)) {
        revealLock(event.player);
        tellPlayer(event.player, "&aEvery minute event triggered.");
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