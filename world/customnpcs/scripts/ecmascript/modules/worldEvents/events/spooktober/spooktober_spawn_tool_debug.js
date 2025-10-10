// ghostSummonerItem.js - Scripted item to force a ghost swarm spawn
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/spooktober/spooktoberEvent.js");

function interact(event) {
    var player = event.player;
    tellPlayer(player, "&7[Debug] Forcing a Spooktober ghost swarm...");
    run_spooktober_event(player);
}
