// spooktoberGhostNpc.js - Script for Spooktober Ghost NPC behavior
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js');
load('world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js');
load('world/customnpcs/scripts/ecmascript/modules/worldEvents/events/spooktober/spooktoberEvent.js');

/**
 * Plays the ghost vanish particle effects at the NPC's position and despawns it.
 */
function despawnWithGhostParticles(npc) {
    var pos = npc.getPos();
    npc.executeCommand("/particle largesmoke " + pos.getX() + " " + pos.getY() + " " + pos.getZ() +
                       " 0.5 0.5 0.5 0.1 20");
    npc.executeCommand("/particle witchMagic " + pos.getX() + " " + pos.getY() + " " + pos.getZ() +
                       " 0.5 0.5 0.5 0.1 30");
    
    // Scary sound to nearby players (within 16 blocks). Slight pitch variation for variety.
    var pitch = (0.85 + Math.random() * 0.3).toFixed(2);
    npc.executeCommand("/playsound minecraft:entity.skeleton_horse.death player @a[r=16] ~ ~ ~ 1 " + pitch + " 0.2");

    npc.despawn();
}

/**
 * Initializes the ghost NPC on spawn or load.
 * Assigns random skin/size and dialog lines if not already done, 
 * or despawns immediately if the event has ended.
 */
function init(event) {
    var npc = event.npc;
    
    // If event already ended, despawn ghost in a particle cloud
    if (!isEventActive("Spooktober")) {
        despawnWithGhostParticles(npc);
        return;
    }

    // Randomize appearance & data on init
    var config = SPOOKTOBER_CONFIG;
    // Determine ghost type from NPC's clone name (assuming clone name indicates type)
    var ghostType = "classicGhost";
    var name = npc.getDisplay().getName() || npc.getName();
    if (name.toLowerCase().contains("aggressive")) {
        ghostType = "aggressiveGhost";
    }
    // Random skin from config list
    var skins = config[ghostType].skins;
    if (skins && skins.length > 0) {
        var skinUrl = skins[Math.floor(Math.random() * skins.length)];
        npc.getDisplay().setSkinUrl(skinUrl);
    }
    // Random size between minSize and maxSize
    var minS = config[ghostType].minSize || 5;
    var maxS = config[ghostType].maxSize || 5;
    var size = Math.floor(Math.random() * (maxS - minS + 1)) + minS;
    npc.getDisplay().setSize(size);
    // Store lines and type for use in interactions
    npc.getStoreddata().put("ghost_type", ghostType);
    // tellNearbyPlayers(npc, "[DEBUG] Assigned ghost type: " + npc.getStoreddata().get("ghost_type"), 20);
    // Save spawn time and formatted date
    var now = new Date();
    npc.getStoreddata().put("spawn_time", now.getTime());
    npc.getStoreddata().put("spawn_date_str", now.getDate() + "/" + (now.getMonth()+1) + "/" + now.getFullYear());
    // tellNearbyPlayers(npc, "[DEBUG] Spawned on: " + npc.getStoreddata().get("spawn_date_str"), 20);
    // Save event end date (for reference)
    var endDate = getEventEndDate("Spooktober");
    if (endDate) {
        npc.getStoreddata().put("event_end", endDate.month + "/" + endDate.day);
    }
    // logToFile("events", "Spawned a ghost NPC (" + ghostType + ") at " + npc.getPos() + 
    //             " on " + npc.getStoreddata().get("spawn_date_str"));
}

/**
 * Handles player interactions with the ghost.
 * - Admin (with Seagull ID card in offhand): special commands.
 * - Regular player: ghost delivers a random line from its stored interact lines.
 */
function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var mainItem = player.getMainhandItem().getName();
    var offItem = player.getOffhandItem().getName();
    
    // Admin debug interactions require the Seagull ID card in offhand
    var isAdmin = (offItem == "mts:ivv.idcard_seagull");
    if (isAdmin) {
        if (mainItem == "minecraft:command_block") {
            // Reroll ghost appearance/attributes
            npc.executeCommand("/playsound ivv:computer.gaming.deleted player @a");
            rerollGhost(npc);
            tellPlayer(player, "&6&l[ADMIN]&6 Ghost has been rerolled with a new form.");
            return;
        }
        if (mainItem == "minecraft:barrier") {
            // Force-despawn the ghost with effects
            despawnWithGhostParticles(npc);
            tellPlayer(player, "&6&l[ADMIN]&6 Ghost forcibly despawned.");
            return;
        }
    }
    // Normal player interaction: ghost "speaks" a random line
    var config = SPOOKTOBER_CONFIG;
    var ghostType = npc.getStoreddata().get("ghost_type") || "classicGhost";
    var interact_lines = config[ghostType]["interactLines"];
    if (interact_lines && interact_lines.length > 0) {
        tellRandomMessage(player, interact_lines);
        npc.executeCommand("/playsound minecraft:entity.skeleton_horse.ambient player @a[r=16] ~ ~ ~ 0.5 0.8 0.1");
    }
}

/**
 * Called on each tick. Used to handle automatic despawning after timeout or event end.
 */
function tick(event) {
    var npc = event.npc;
    var stored = npc.getStoreddata();
    // If event ended while this ghost is still around, vanish it
    if (!isEventActive("Spooktober")) {
        despawnWithGhostParticles(npc); 
        return;
    }

    // Aggressive ghosts should target the closest nearby player
    try {
        var ghostType = stored.get("ghost_type");
        if (!ghostType) {
            var nm = (npc.getDisplay().getName() || npc.getName()).toLowerCase();
            ghostType = nm.contains("aggressive") ? "aggressiveGhost" : "classicGhost";
        }
        if (ghostType === "aggressiveGhost") {
            var world = npc.getWorld();
            var radius = (typeof SPOOKTOBER_CONFIG !== 'undefined' && SPOOKTOBER_CONFIG.spawnRadius) ? SPOOKTOBER_CONFIG.spawnRadius : 20;
            var players = world.getNearbyEntities(npc.getPos(), radius, 1); // 1 = players
            if (players && players.length > 0) {
                // Find closest player
                var npos = npc.getPos();
                var closest = players[0];
                var bestD2 = Math.pow(closest.getPos().getX() - npos.getX(), 2) + Math.pow(closest.getPos().getY() - npos.getY(), 2) + Math.pow(closest.getPos().getZ() - npos.getZ(), 2);
                for (var i = 1; i < players.length; i++) {
                    var ppos = players[i].getPos();
                    var d2 = Math.pow(ppos.getX() - npos.getX(), 2) + Math.pow(ppos.getY() - npos.getY(), 2) + Math.pow(ppos.getZ() - npos.getZ(), 2);
                    if (d2 < bestD2) {
                        bestD2 = d2;
                        closest = players[i];
                    }
                }
                if (closest) {
                    npc.setAttackTarget(closest);
                }
            }
        }
    } catch (err) {
        // Swallow errors to avoid spamming logs on tick
    }
    // If alive longer than despawnTimeMs, vanish automatically
    if (npc.getStoreddata().has("spawn_time")) {
        var lifespan = new Date().getTime() - npc.getStoreddata().get("spawn_time");
        if (lifespan >= SPOOKTOBER_CONFIG.despawnTimeMs) {
            despawnWithGhostParticles(npc);
        }
    }
}

/**
 * Triggered when the ghost takes damage (e.g. player hits it).
 * Drops a custom marshmallow item with special name/lore.
 */
function damaged(event) {
    var npc = event.npc;
    var world = npc.getWorld();
    // Create the marshmallow loot item
    var drop = world.createItem("harvestcraft:marshmellowsitem", 0, 1);
    drop.setCustomName(ccs("&f&lMarshmallow of the &5Lost Soul"));
    drop.setLore([
        ccs("&7A sugary puff left behind by a vanquished specter."),
        ccs("&8Some say it contains a hint of ectoplasm..."),
        ccs("&dCollected during: &fSpooktober Event"),
        ccs("&8Spawned on: &7" + (npc.getStoreddata().get("spawn_date_str") || "Unknown"))
    ]);
    // Give to player if hit by a player, otherwise drop on ground
    if (event.source && event.source.getType() == 1) {  // 1 = Player type
        // Increment player's ghostsHunted counter
        try {
            var hunter = event.source;
            var pdata = loadPlayerEventData("Spooktober", hunter.getName());
            pdata.ghostsHunted = (pdata.ghostsHunted || 0) + 1;
            savePlayerEventData("Spooktober", hunter.getName(), pdata);
        } catch (err) {
            // ignore persistence errors
        }
        event.source.giveItem(drop);
    } else {
        world.dropItem(npc.getPos(), drop);
    }
    // Send a random death message to nearby players (20-block radius)
    var config = SPOOKTOBER_CONFIG;
    var ghostType = npc.getStoreddata().get("ghost_type") || "classicGhost";
    var deathLines = config[ghostType]["deathLines"];
    if (deathLines && deathLines.length > 0) {
        tellNearbyPlayers(npc, deathLines[Math.floor(Math.random() * deathLines.length)], 20);
    }

    despawnWithGhostParticles(npc);
}

/**
 * Admin utility: Reroll the ghost's skin, size, and lines (type remains same).
 */
function rerollGhost(npc) {
    var stored = npc.getStoreddata();
    var config = SPOOKTOBER_CONFIG;
    var ghostType = npc.getStoreddata().get("ghost_type") || "classicGhost";
    // New random skin
    var skins = config[ghostType].skins;
    if (skins && skins.length > 0) {
        var newSkin = skins[Math.floor(Math.random() * skins.length)];
        npc.getDisplay().setSkinUrl(newSkin);
    }
    // New random size
    var minS = config[ghostType].minSize, maxS = config[ghostType].maxSize;
    var newSize = Math.floor(Math.random() * (maxS - minS + 1)) + minS;
    npc.getDisplay().setSize(newSize);
    // Update stored lines
    npc.getStoreddata().put("interact_lines", config[ghostType].interactLines);
    npc.getStoreddata().put("death_lines", config[ghostType].deathLines);
    // Reset spawn time to now (treat as fresh spawn)
    var now = new Date();
    npc.getStoreddata().put("spawn_time", now.getTime());
    npc.getStoreddata().put("spawn_date_str", now.getDate() + "/" + (now.getMonth()+1) + "/" + now.getFullYear());
}
