load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_spawning.js");

var fishCloneName = "AprilFools Fish Rain";


function spawnFishSwarm(player, size, radius) {
    var world = player.getWorld();

    var playerPos = player.getPos();

    var min = size*0.9;
    var max = size*1.1;
    var cloneCount = rrandom_range(min, max);
    var pos = {x: playerPos.getX(), y: playerPos.getY() + 3, z: playerPos.getZ()};

    return spawnClonesInArea(world, fishCloneName, 2, cloneCount, pos, radius);
}