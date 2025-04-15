load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

function interact(event) {
    var npc = event.npc;
    var world = npc.getWorld();

    // get player hand item
    var player = event.player;
    var item = player.getMainhandItem().copy();
    var nbt = item.getItemNbt();

    tellPlayer(player, "&aItem: " + item.getName());
    tellPlayer(player, "&aNBT: " + nbt.toJsonString())
}