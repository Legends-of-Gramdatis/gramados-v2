// list_nearby_entities.js
// Single-use debug tool: right-click with this scripted item to list entities within 20 blocks.
// Prints each entity name; if name === 'entity.mts_entity.name', also prints full NBT.
// Intended to help identify crate entity naming/structure for Phase 3 onboarding.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

function interact(event) {
    var player = event.player; if (!player) return;
    var world = player.getWorld(); if (!world) return;
    var radius = 20;
    var pos = player.getPos();
    var entities = world.getNearbyEntities(pos, radius, 0); // type 0 = any
    tellPlayer(player, '&e[Entity Scan] Radius ' + radius + ' blocks. Found ' + entities.length + ' entities.');
    var outPath = 'world/customnpcs/scripts/logs/entity_scan_' + player.getName() + '_' + Date.now() + '.txt';
    writeToFile(outPath, '[Entity Scan] Player=' + player.getName() + ' radius=' + radius + ' count=' + entities.length);
    for (var i = 0; i < entities.length; i++) {
        var ent = entities[i];
        if (!ent) continue;
        var name = ent.getName();
        tellPlayer(player, '&7- ' + name);
        writeToFile(outPath, '- ' + name);
        if (name === 'entity.mts_entity.name') {
            // Save NBT for MTS vehicles or crates to file (not chat)
            try {
                var nbt = ent.getEntityNbt();
                if (nbt) {
                    var j = nbt.toJsonString();
                    writeToFile(outPath, '  NBT: ' + j);
                } else {
                    writeToFile(outPath, '  NBT: <unavailable>');
                }
            } catch (nbtErr) {
                logToFile('dev', '[entity-scan] NBT read error: ' + nbtErr);
                writeToFile(outPath, '  NBT error: ' + nbtErr);
            }
        }
    }
    tellPlayer(player, '&aSaved MTS entity NBT (if any) to &6' + outPath);
}

function getTooltip(e) {
    e.add('&6Nearby Entity Scanner');
    e.add('&7Right-click to list entities within 20 blocks.');
}
