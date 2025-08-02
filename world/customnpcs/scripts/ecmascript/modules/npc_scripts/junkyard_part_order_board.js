load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");

function interact(event) {
    var player = event.player;
    var npc = event.npc;


    tellPlayer(player, "§c:cross: This board is Deprecated, call an Administrator to fix it.");
    tellPlayer(player, "§c:cross: No orders can be processed here anymore.");
    npc.executeCommand("/playsound minecraft:block.anvil.land block @a ~ ~ ~ 10 1");
}