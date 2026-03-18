load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_spawning.js");

var fishCloneName = "AprilFools Fish Rain";

function run_aprilfools_event(player) {
    var playerName = player.getName();
    var success_spawns = spawnFishSwarm(player, 5, 3);
    var logline = "Spawned " + success_spawns + " Fish Rain clones around " + playerName + ".";
    logToFile("events", logline);

    playerLastSpawnTime[playerName] = new Date().getTime();
    playerSpawnIntervals[playerName] = getRandomSpawnInterval();
}

function spawnFishSwarm(player, size, radius) {
    var world = player.getWorld();

    var playerPos = player.getPos();

    var min = size*0.9;
    var max = size*1.1;
    var cloneCount = rrandom_range(min, max);
    var pos = {x: playerPos.getX(), y: playerPos.getY() + 3, z: playerPos.getZ()};

    return spawnClonesInArea(world, fishCloneName, 2, cloneCount, pos, radius);
}