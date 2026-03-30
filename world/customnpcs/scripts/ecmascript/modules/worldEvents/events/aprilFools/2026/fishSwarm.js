load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_spawning.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js");
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/aprilFools/2026/fishUtils.js");

var fishCloneName = "AprilFools Fish Rain";

function getFishRainSpawnMessages() {
    return [
        "&b&l[Fish Rain] &fA shoal bursts from the clouds and splashes around you!",
        "&3&l[Fish Rain] &bScales in the sky! Keep your bucket ready!",
        "&9&l[Fish Rain] &fA wave of airborne fish just swept through this block!",
        "&1&l[Fish Rain] &bThe sea has chosen this spot for a sudden downpour."
    ];
}

function playFishRainSpawnEffects(player) {
    var pos = player.getPos();
    var x = pos.getX();
    var y = pos.getY() + 1;
    var z = pos.getZ();
    var base = x + " " + y + " " + z;

    executeCommand(player, "/particle waterdrop " + base + " 2 1 2 0.03 40 force @a[r=24]");
    executeCommand(player, "/particle splash " + base + " 2 0.8 2 0.05 30 force @a[r=24]");
    executeCommand(player, "/particle cloud " + base + " 1.2 0.3 1.2 0.01 12 force @a[r=24]");

    executeCommand(player, "/playsound minecraft:entity.bobber.splash master @a[r=24] " + base + " 0.9 1.2");
    executeCommand(player, "/playsound minecraft:weather.rain.above master @a[r=24] " + base + " 0.4 1.0");
}

function run_aprilfools_event(player, eventData) {
    var playerName = player.getName();
    var success_spawns = spawnFishSwarm(player, 5, 3);
    tellRandomMessage(player, getFishRainSpawnMessages());
    playFishRainSpawnEffects(player);

    var logline = "Spawned " + success_spawns + " Fish Rain clones around " + playerName + ".";
    logToFile("events", logline);

    eventData.playerLastSpawnTime = new Date().getTime();
    eventData.playerSpawnIntervals = getRandomSpawnIntervalMinutes(5, 10);
    savePlayerEventData("april_fools", playerName, eventData);
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

function catchNearbyFishSwarm(player, radius) {
    var world = player.getWorld();
    var nearbyNpcs = world.getNearbyEntities(player.getPos(), radius, 2);
    var caughtCount = 0;

    for (var i = 0; i < nearbyNpcs.length; i++) {
        var npc = nearbyNpcs[i];
        if (!npc || npc.getName() !== "Fish") {
            continue;
        }

        npc.executeCommand("/playsound minecraft:block.note.bell master @a ~ ~ ~ 1 1");

        var fishLoot = generate_fish_catch_loot(player);
        for (var j = 0; j < fishLoot.length; j++) {
            player.dropItem(fishLoot[j]);
        }

        npc.despawn();
        caughtCount++;
    }

    logToFile("events", player.getName() + " caught " + caughtCount + " fish from the Fish Swarm consumable modifier!");

    return caughtCount;
}
