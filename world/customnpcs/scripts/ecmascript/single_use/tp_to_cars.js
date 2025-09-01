load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");

function interact(event) {
    var player = event.player;
    var world = player.getWorld();
    var localEntities = world.getNearbyEntities(player.getPos(), 50, 0);
    for (var i = 0; i < localEntities.length; i++) {
        if (localEntities[i].getName() === "entity.mts_entity.name") {
            // tell player coordinates
            var coords_x = localEntities[i].getPos().getX();
            var coords_y = localEntities[i].getPos().getY();
            var coords_z = localEntities[i].getPos().getZ();
            tellPlayer(player, "Entity coordinates: " + coords_x + ", " + coords_y + ", " + coords_z);
            tellPlayer(player, "You can use these coordinates to teleport to the entity.");
        }
    }
}