// count_nearby_crates.js
// Single-use debug tool: counts nearby IV crates, including stacked crates within parts of parts.
// How it works:
// - Scans entities within a radius (default 20 blocks)
// - For each entity named 'entity.mts_entity.name', reads its NBT (INbt)
// - Recursively traverses all keys part_0..part_31 on the root and on each part compound
// - For every part compound, builds an item id: `mts:<packID>.<systemName><subName>`
// - Uses isItemInLootTable(lootTablePath, itemId) to decide if this part is a crate from the configured loot table
// - Reports total count and breakdown per crate id

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');

var ONBOARDING_CONFIG_PATH = 'world/customnpcs/scripts/ecmascript/modules/onboarding/onboarding_config.json';

function interact(event) {
    var player = event.player; if (!player) return;
    var world = player.getWorld(); if (!world) return;

    var radius = 20;
    var pos = player.getPos();
    var entities = world.getNearbyEntities(pos, radius, 0); // 0 = any

    // Resolve loot table path from onboarding config when available; if missing, explicitly fall back.
    var lootTablePath = null;
    try {
        var cfg = loadJson(ONBOARDING_CONFIG_PATH);
        if (cfg && cfg.phases && cfg.phases['3'] && cfg.phases['3'].stages && cfg.phases['3'].stages.stage1 && cfg.phases['3'].stages.stage1.crate) {
            lootTablePath = cfg.phases['3'].stages.stage1.crate.loot_table_path;
        }
        // lootTablePath = 'storage/crates_iav.json';
    } catch (e) {
        // We'll message the player below; debug tools may run outside the onboarding module lifecycle.
        logToFile('dev', '[crate-scan] Failed to read onboarding_config.json: ' + e);
    }
    if (!lootTablePath || typeof lootTablePath !== 'string') {
        lootTablePath = 'storage/crates_generic_27.json';
        tellPlayer(player, '&6[crate-scan] Using default loot table: &e' + lootTablePath + ' &7(config not found)');
    } else {
        tellPlayer(player, '&6[crate-scan] Loot table: &e' + lootTablePath);
    }

    // Accumulators
    var totalCrates = 0;
    var perId = {}; // id -> count
    var scannedMts = 0;

    for (var i = 0; i < entities.length; i++) {
        var ent = entities[i];
        if (!ent) continue;
        var name = ent.getName();
        if (name !== 'entity.mts_entity.name') continue; // only IV entities
        scannedMts++;

        var nbt;
        try { nbt = ent.getEntityNbt(); } catch (nbtErr) { continue; }
        if (!nbt) continue;

        // Recursively collect candidate crate item ids from this entity's NBT
        var ids = [];
        _collectCrateIdsFromNbt(nbt, ids);

        // Filter against the loot table and count
        for (var j = 0; j < ids.length; j++) {
            var id = ids[j];
            try {
                if (isItemInLootTable(lootTablePath, id)) {
                    totalCrates++;
                    perId[id] = (perId[id] || 0) + 1;
                }
            } catch (chkErr) {
                // If the util throws (e.g., bad path), surface once and stop further checks
                tellPlayer(player, '&c[crate-scan] Error checking loot table membership for ' + id + ': ' + chkErr);
                logToFile('dev', '[crate-scan] isItemInLootTable error: ' + chkErr);
                // continue scanning others in best-effort
            }
        }
    }

    // Report summary
    tellPlayer(player, '&e[Crate Scan] Radius ' + radius + ' blocks. MTS entities: ' + scannedMts + '.');
    tellPlayer(player, (totalCrates > 0 ? '&a' : '&6') + 'Crates matching loot table: &6' + totalCrates);

    // Provide a short breakdown per crate id (max 10 lines to avoid chat spam)
    var keys = Object.keys(perId);
    keys.sort();
    var maxLines = 10;
    for (var k = 0; k < keys.length && k < maxLines; k++) {
        var cid = keys[k];
        tellPlayer(player, '&7- ' + cid + ' &8x' + perId[cid]);
    }
    if (keys.length > maxLines) {
        tellPlayer(player, '&7… and ' + (keys.length - maxLines) + ' more types');
    }
}

// Recursively traverse an INbt compound to collect crate item ids from any part_* compound.
function _collectCrateIdsFromNbt(nbt, out) {
    if (!nbt) return;
    // Scan expected part_* keys (0..31) on this level
    for (var i = 0; i < 64; i++) {
        var pkey = 'part_' + i;
        try {
            if (nbt.has(pkey)) {
                var part = nbt.getCompound(pkey);
                _maybeAddCrateId(part, out);
                // Recurse into this part for nested stacks
                _collectCrateIdsFromNbt(part, out);
            }
        } catch (e) {
            // ignore malformed slots
        }
    }
}

// If the part looks like a MTS part with a pack/system, build an item id and append to out.
function _maybeAddCrateId(partNbt, out) {
    if (!partNbt) return;
    try {
        var packID = partNbt.getString('packID') || '';
        var systemName = partNbt.getString('systemName') || '';
        var subName = partNbt.getString('subName') || '';
        if (!packID || !systemName) return;
        // Compose: mts:<packID>.<systemName><subName>
        var itemId = 'mts:' + packID + '.' + systemName + (subName || '');
        out.push(itemId);
    } catch (e) {
        // ignore
    }
}

function getTooltip(e) {
    e.add('&6Nearby Crate Counter');
    e.add('&7Right-click to count IV crates within 20 blocks.');
}
