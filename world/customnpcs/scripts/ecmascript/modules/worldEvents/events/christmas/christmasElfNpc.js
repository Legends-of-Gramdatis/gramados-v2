// christmasElfNpc.js - Attach to the elf NPC itself
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

var CHRISTMAS_CFG_PATH = 'world/customnpcs/scripts/ecmascript/modules/worldEvents/events/christmas/christmas_config.json';
var OWNER_KEY = 'christmas_owner';
var SELF_CFG = (checkFileExists(CHRISTMAS_CFG_PATH) ? loadJson(CHRISTMAS_CFG_PATH) : { selfDespawnEnabled: true, selfDespawnRadius: 32 });

function init(event) {
    _christmas_playSpawnEffects(event.npc);
}

function tick(event) {
    if (!SELF_CFG.selfDespawnEnabled) return;
    var npc = event.npc;
    var owner = npc.getStoreddata().get(OWNER_KEY);
    if (!owner) return;
    var world = npc.getWorld();
    var radius = (typeof SELF_CFG.selfDespawnRadius === 'number') ? SELF_CFG.selfDespawnRadius : 32;
    var nearbyPlayers = world.getNearbyEntities(npc.getPos(), radius, 1); // 1 = players
    var ownerNearby = false;
    for (var i = 0; i < nearbyPlayers.length; i++) {
        if (nearbyPlayers[i].getName() === owner) {
            ownerNearby = true;
            break;
        }
    }
    if (!ownerNearby) {
        logToFile('dev', '[christmas] Elf self-despawn: owner ' + owner + ' not nearby.');
        _christmas_selfDespawnEffects(npc);
    }
}

function _christmas_selfDespawnEffects(npc) {
    _christmas_playDespawnEffects(npc);
    npc.despawn();
}

function _christmas_playSpawnEffects(npc) {
    try {
        var pos = npc.getPos();
        var cmdBase = pos.getX() + ' ' + pos.getY() + ' ' + pos.getZ();
        npc.executeCommand('/particle snowshovel ' + cmdBase + ' 0.5 0.8 0.5 0 30');
        npc.executeCommand('/particle fireworksSpark ' + cmdBase + ' 0.5 0.8 0.5 0 20');
        npc.executeCommand('/playsound minecraft:entity.firework.launch player @a[r=12] ' + cmdBase + ' 0.8 1.2');
        npc.executeCommand('/playsound minecraft:entity.experience_orb.pickup player @a[r=12] ' + cmdBase + ' 0.6 1.5');
    } catch (err) {
        logToFile('dev', '[christmas] Error playing spawn effects: ' + err);
    }
}

function _christmas_playDespawnEffects(npc) {
    try {
        var pos = npc.getPos();
        var cmdBase = pos.getX() + ' ' + pos.getY() + ' ' + pos.getZ();
        npc.executeCommand('/particle snowshovel ' + cmdBase + ' 0.6 0.9 0.6 0 25');
        npc.executeCommand('/particle happyVillager ' + cmdBase + ' 0.4 0.6 0.4 0 15');
        npc.executeCommand('/playsound minecraft:entity.chicken.egg player @a[r=12] ' + cmdBase + ' 0.8 1.8');
        npc.executeCommand('/playsound minecraft:entity.bat.takeoff player @a[r=12] ' + cmdBase + ' 0.6 1.6');
    } catch (err) {
        logToFile('dev', '[christmas] Error playing despawn effects: ' + err);
    }
}
