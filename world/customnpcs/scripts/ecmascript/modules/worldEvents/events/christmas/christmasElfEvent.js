// christmasElfEvent.js - Spawns and manages a personal elf NPC per player during Christmas event
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

// Config-driven clone and follow interval
var CHRISTMAS_CFG_PATH = 'world/customnpcs/scripts/ecmascript/modules/worldEvents/events/christmas/christmas_config.json';
var CHRISTMAS_CFG = (checkFileExists(CHRISTMAS_CFG_PATH) ? loadJson(CHRISTMAS_CFG_PATH) : { cloneTab: 2, cloneName: 'Christmas Elf', rehomeIntervalMs: 5000, offlineCleanupEnabled: true, offlineCleanupRadius: 96, selfDespawnEnabled: true, selfDespawnRadius: 32 });
var CLONE_TAB = CHRISTMAS_CFG.cloneTab;
var CLONE_NAME = CHRISTMAS_CFG.cloneName;
var OWNER_KEY = 'christmas_owner';
var _lastRehomeMs = {}; // per-player throttle

/**
 * Spawn an elf clone near the player, assign ownership, and set initial home.
 * Logs to dev when spawned and assigned.
 */
function christmas_onPlayerJoin(player) {
    try {
        // Skip creative mode players
        if (player.getGamemode() != 0) {
            return;
        }
        var world = player.getWorld();
        var pos = player.getPos();
        // Guard: if an elf for this player already exists nearby, despawn it to avoid duplicates
        _christmas_despawnNearbyElves(world, pos, player.getName(), 32);
        var x = Math.floor(pos.getX());
        var y = Math.floor(pos.getY()) + 1;
        var z = Math.floor(pos.getZ());
        var elf = world.spawnClone(x, y, z, CLONE_TAB, CLONE_NAME);
        if (elf) {
            // Tag ownership on storeddata and adjust display name
            elf.getStoreddata().put(OWNER_KEY, player.getName());
            elf.getDisplay().setName('§aElf of ' + player.getName());
            // Optional: set initial home to player's current position
            elf.setHome(pos.getX(), pos.getY(), pos.getZ());
                _christmas_spawnEffects(elf);
            logToFile('dev', '[christmas] Elf spawned for ' + player.getName() + ' at ' + x + ',' + y + ',' + z);
            logToFile('dev', '[christmas] Elf assigned to player ' + player.getName());
        } else {
            logToFile('dev', '[christmas] Failed to spawn elf clone for ' + player.getName());
        }
    } catch (err) {
        logToFile('dev', '[christmas] Error on join for ' + player.getName() + ': ' + err);
    }
}

/**
 * Despawn the player's elf on logout. Searches around the player's last position.
 * Logs to dev when despawned.
 */
function christmas_onPlayerLogout(player) {
    try {
        var world = player.getWorld();
        var pos = player.getPos();
        var count = _christmas_despawnNearbyElves(world, pos, player.getName(), 64);
        if (count > 0) {
            logToFile('dev', '[christmas] Elf despawned for ' + player.getName() + ' (count=' + count + ')');
        } else {
            logToFile('dev', '[christmas] No elf found to despawn for ' + player.getName() + '');
        }
    } catch (err) {
        logToFile('dev', '[christmas] Error on logout for ' + player.getName() + ': ' + err);
    }
}

/**
 * Find and despawn any elf NPCs near a position that are owned by playerName.
 * @returns {number} number of elves despawned
 */
function _christmas_despawnNearbyElves(world, pos, playerName, radius) {
    var despawned = 0;
    var npcs = world.getNearbyEntities(pos, radius, 2); // 2 = NPCs
    for (var i = 0; i < npcs.length; i++) {
        var npc = npcs[i];
        var stored = npc.getStoreddata();
        var owner = stored ? stored.get(OWNER_KEY) : null;
        var name = npc.getDisplay ? (npc.getDisplay().getName() || npc.getName()) : npc.getName();
        var isElf = (name && String(name).toLowerCase().indexOf('elf') >= 0) || (npc.getName() && String(npc.getName()).toLowerCase().indexOf('elf') >= 0);
        if (isElf && owner === playerName) {
                _christmas_despawnWithEffects(npc);
            despawned++;
        }
    }
    return despawned;
}

/**
 * Optional future: call periodically to re-home elves to their owners.
 * For now, kept here for later step where follow logic is implemented.
 */
function christmas_tickFollow(ownerPlayer) {
    // Despawn elf if player enters creative mode
    if (ownerPlayer.getGamemode() != 0) {
        var world = ownerPlayer.getWorld();
        var pos = ownerPlayer.getPos();
        _christmas_despawnNearbyElves(world, pos, ownerPlayer.getName(), 64);
        return;
    } 
    var world = ownerPlayer.getWorld();
    var pos = ownerPlayer.getPos();
    // Throttle re-home using configurable interval
    var now = Date.now();
    var pname = ownerPlayer.getName();
    var last = _lastRehomeMs[pname] || 0;
    var interval = CHRISTMAS_CFG.rehomeIntervalMs;
    if ((now - last) < interval) {
        return;
    }
    // tellPlayer(ownerPlayer, "&aYour Christmas Elf adjusts its position to stay close to you!");
    var npcs = world.getNearbyEntities(pos, 48, 2);
    for (var i = 0; i < npcs.length; i++) {
        var npc = npcs[i];
        var owner = (npc.getStoreddata && npc.getStoreddata().get(OWNER_KEY)) || null;
        if (owner === ownerPlayer.getName()) {
            npc.setHome(pos.getX(), pos.getY(), pos.getZ());
        }
    }
    _lastRehomeMs[pname] = now;

    // Cleanup: despawn elves whose owners are offline
    if (CHRISTMAS_CFG.offlineCleanupEnabled) {
        var onlineNames = _christmas_getOnlineNameSet(world);
        var radius = (typeof CHRISTMAS_CFG.offlineCleanupRadius === 'number') ? CHRISTMAS_CFG.offlineCleanupRadius : 96;
        _christmas_despawnOfflineElves(world, pos, onlineNames, radius);
    }

    // Respawn missing elf if none nearby for this player
    _christmas_respawnIfMissing(world, pos, ownerPlayer.getName());
}

// Ensure the owner has an elf nearby; if not, spawn one at player position
function _christmas_respawnIfMissing(world, pos, playerName) {
    try {
        // Get player to check gamemode
        var players = world.getAllPlayers();
        for (var p = 0; p < players.length; p++) {
            if (players[p].getName() === playerName && players[p].getGamemode() != 0) {
                return; // Skip creative mode players
            }
        }
        var npcs = world.getNearbyEntities(pos, 32, 2);
        var hasElf = false;
        for (var i = 0; i < npcs.length; i++) {
            var npc = npcs[i];
            var owner = (npc.getStoreddata && npc.getStoreddata().get(OWNER_KEY)) || null;
            var name = npc.getDisplay ? (npc.getDisplay().getName() || npc.getName()) : npc.getName();
            var isElf = (name && String(name).toLowerCase().indexOf('elf') >= 0) || (npc.getName() && String(npc.getName()).toLowerCase().indexOf('elf') >= 0);
            if (isElf && owner === playerName) {
                hasElf = true;
                break;
            }
        }
        if (!hasElf) {
            var x = Math.floor(pos.getX());
            var y = Math.floor(pos.getY()) + 1;
            var z = Math.floor(pos.getZ());
            var elf = world.spawnClone(x, y, z, CLONE_TAB, CLONE_NAME);
            if (elf) {
                elf.getStoreddata().put(OWNER_KEY, playerName);
                elf.getDisplay().setName('§aElf of ' + playerName);
                elf.setHome(pos.getX(), pos.getY(), pos.getZ());
                    _christmas_spawnEffects(elf);
                logToFile('dev', '[christmas] Respawned missing elf for ' + playerName + ' at ' + x + ',' + y + ',' + z);
            } else {
                logToFile('dev', '[christmas] Failed to respawn elf for ' + playerName);
            }
        }
    } catch (err) {
        logToFile('dev', '[christmas] Error in respawn check for ' + playerName + ': ' + err);
    }
}

// Build a set of online player names in this world
function _christmas_getOnlineNameSet(world) {
    var names = {};
    var players = world.getAllPlayers ? world.getAllPlayers() : [];
    for (var i = 0; i < players.length; i++) {
        names[players[i].getName()] = true;
    }
    return names;
}

// Despawn any elves in radius whose owner is offline/missing
function _christmas_despawnOfflineElves(world, pos, onlineNames, radius) {
    var npcs = world.getNearbyEntities(pos, radius, 2);
    for (var i = 0; i < npcs.length; i++) {
        var npc = npcs[i];
        var stored = npc.getStoreddata ? npc.getStoreddata() : null;
        var owner = stored ? stored.get(OWNER_KEY) : null;
        var name = npc.getDisplay ? (npc.getDisplay().getName() || npc.getName()) : npc.getName();
        var isElf = (name && String(name).toLowerCase().indexOf('elf') >= 0) || (npc.getName() && String(npc.getName()).toLowerCase().indexOf('elf') >= 0);
        if (isElf && owner && !onlineNames[owner]) {
            _christmas_despawnWithEffects(npc);
            logToFile('dev', '[christmas] Despawned elf of offline player ' + owner);
        }
    }
}

// Cosmetic: particles/sounds on spawn
function _christmas_spawnEffects(npc) {
    var pos = npc.getPos();
    var cmdBase = pos.getX() + ' ' + pos.getY() + ' ' + pos.getZ();
    npc.executeCommand('/particle snowshovel ' + cmdBase + ' 0.5 0.8 0.5 0 30');
    npc.executeCommand('/particle fireworksSpark ' + cmdBase + ' 0.5 0.8 0.5 0 20');
    npc.executeCommand('/playsound minecraft:entity.firework.launch player @a[r=12] ' + cmdBase + ' 0.7 1.2');
}

// Cosmetic despawn with gentle poof and logging
function _christmas_despawnWithEffects(npc) {
    var stored = npc.getStoreddata ? npc.getStoreddata() : null;
    var owner = stored ? stored.get(OWNER_KEY) : 'unknown';
    logToFile('dev', '[christmas] Elf despawn effects for owner ' + owner);
    var pos = npc.getPos();
    var cmdBase = pos.getX() + ' ' + pos.getY() + ' ' + pos.getZ();
    npc.executeCommand('/particle snowshovel ' + cmdBase + ' 0.6 0.9 0.6 0 25');
    npc.executeCommand('/particle happyVillager ' + cmdBase + ' 0.4 0.6 0.4 0 15');
    npc.executeCommand('/playsound minecraft:entity.chicken.egg player @a[r=12] ' + cmdBase + ' 0.8 1.8');
    npc.despawn();
}
