// spooktoberEvent.js - Main script for the Spooktober ghost world event
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js');
load('world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js');

var CONFIG_PATH = "world/customnpcs/scripts/ecmascript/modules/worldEvents/events/spooktober/spooktober_config.json";
var SPOOKTOBER_CONFIG = loadJson(CONFIG_PATH);

/**
 * Spawns a swarm of ghosts around a nearby non-ghost NPC near the player.
 * Returns number of ghosts spawned.
 */
function spawnGhostSwarm(player, world, count, swarmRadius) {
    var playerPos = player.getPos();
    // Count NPCs (exclude ghosts) near the player
    var nearbyEntities = world.getNearbyEntities(playerPos, SPOOKTOBER_CONFIG.spawnRadius, 2);  // type=2 for NPCs
    var potentialTargets = [];
    for (var i = 0; i < nearbyEntities.length; i++) {
        var ent = nearbyEntities[i];
        if (ent.getName && !ent.getName().contains("Ghost")) {
            potentialTargets.push(ent);
        }
    }
    // Abort if too many NPCs around (to prevent lag/overcrowding)
    if (potentialTargets.length > SPOOKTOBER_CONFIG.maxNearbyNPCs) {
        var tooManyMsg = [
            "&eThe area is too crowded with life for ghosts to appear right now.",
            "&eThe spirits shy away... too many living beings nearby.",
            "&eNo new ghostly presence - perhaps it's too busy here."
        ];
        tellRandomMessage(player, tooManyMsg);
        logToFile("events", player.getName() + " skipped ghost spawn (too many NPCs nearby).");
        return 0;
    }
    if (potentialTargets.length === 0) {
        // No anchor NPC found near player
        logToFile("events", player.getName() + " found no NPC for ghosts to haunt.");
        return 0;
    }
    // Choose a random NPC as the haunt target
    var targetNpc = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
    var targetPos = targetNpc.getPos();
    var spawned = 0;
    for (var i = 0; i < count; i++) {
        // Pick a random spot around the target NPC within swarmRadius
        var x = Math.floor(targetPos.getX() + Math.random() * (swarmRadius * 2) - swarmRadius);
        var z = Math.floor(targetPos.getZ() + Math.random() * (swarmRadius * 2) - swarmRadius);
        var y = Math.floor(targetPos.getY());
        // Find ground by dropping down
        var dropCount = 0;
        while (world.getBlock(x, y, z).isAir() && dropCount < 30) {
            y--;
            dropCount++;
        }
        if (!world.getBlock(x, y, z).isAir() && world.getBlock(x, y+1, z).isAir()) {
            // Determine ghost type by weight and spawn the appropriate clone
            var totalW = SPOOKTOBER_CONFIG.classicGhost.weight + SPOOKTOBER_CONFIG.aggressiveGhost.weight;
            var roll = Math.floor(Math.random() * totalW);
            var cloneName = "Ghost Passive";
            if (roll < SPOOKTOBER_CONFIG.aggressiveGhost.weight) {
                cloneName = "Ghost Aggressive";
            }
            world.spawnClone(x, y+1, z, 2, cloneName);
            spawned++;
        }
    }
    if (spawned > 0) {
        var hauntMsgs = [
            "&5A cold breeze whispers past... something stirs nearby.",
            "&5You feel a sudden chill. Ghostly figures begin to appear...",
            "&5The veil thins; restless spirits gather around " + targetNpc.getName() + "!",
            "&5An eerie presence floods the area... ghosts emerge from the shadows."
        ];
        tellRandomMessage(player, hauntMsgs);
        logToFile("events", "Spawned " + spawned + " ghost(s) around " + targetNpc.getName() + 
                          " for player " + player.getName() + ".");
    }
    // Track total ghosts spawned per player for Spooktober
    try {
        var pdata = loadPlayerEventData("Spooktober", player.getName());
        pdata.ghostsSpawned = (pdata.ghostsSpawned || 0) + spawned;
        savePlayerEventData("Spooktober", player.getName(), pdata);
    } catch (err) {
        // ignore persistence issues to avoid interrupting gameplay
    }
    return spawned;
}

/**
 * Attempts to spawn a ghost swarm for the player, respecting cooldown.
 */
function run_spooktober_event(player) {
    var playerName = player.getName();
    var world = player.getWorld();
    // Determine how many ghosts to spawn this wave
    var min = SPOOKTOBER_CONFIG.minGhosts, max = SPOOKTOBER_CONFIG.maxGhosts;
    var count = Math.floor(Math.random() * (max - min + 1)) + min;
    var spawned = spawnGhostSwarm(player, world, count, SPOOKTOBER_CONFIG.swarmRadius);
    // Update player's last spawn time in persistent data (even if none spawned, to apply cooldown)
    var data = loadPlayerEventData("Spooktober", playerName);
    data.playerLastSpawnTime = new Date().getTime();
    savePlayerEventData("Spooktober", playerName, data);
}

/**
 * Helper to fetch an event's end date from the global config (for storing in NPC data).
 */
function getEventEndDate(eventName) {
    for (var i = 0; i < allEventConfig.events.length; i++) {
        var ev = allEventConfig.events[i];
        if (ev.name === eventName) {
            return ev.endDate;
        }
    }
    return null;
}
