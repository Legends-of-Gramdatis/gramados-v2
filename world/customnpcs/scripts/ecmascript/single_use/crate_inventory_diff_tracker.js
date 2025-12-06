// crate_inventory_diff_tracker.js
// Single-use scripted item: on each use, scans nearby IV crates and tracks their inventory UUIDs.
// - First use: saves baseline set of crate inventory UUIDs into the item's NBT.
// - Next uses: compares current set with previous baseline, prints NEW and GONE UUIDs, then updates baseline.
// - Detection digs into IV "mts:mts_entity" NBT and recurses all part_* compounds to catch stacked crates.
// - Only stores state on the item NBT; no files or global data are used.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');

var ONBOARDING_CONFIG_PATH = 'world/customnpcs/scripts/ecmascript/modules/onboarding/onboarding_config.json';

function interact(event) {
    var player = event.player; if (!player) return;
    var world = player.getWorld(); if (!world) return;
    var item = event.item ? event.item : player.getMainhandItem();
    if (!item) { tellPlayer(player, '&c[crate-diff] No item in hand.'); return; }

    var radius = 20;
    var lootTablePath = _resolveCrateLootTable(player);

    // Build current set of crate inventory UUIDs
    var currSet = _scanNearbyCrateInventoryUUIDs(world, player.getPos(), radius, lootTablePath);

    // Read previous baseline from item NBT
    var inbt = item.getNbt();
    var prevJson = '';
    try { prevJson = inbt.getString('crateScanPrev'); } catch (e) {}
    var prevList = [];
    if (prevJson && typeof prevJson === 'string') {
        try { prevList = JSON.parse(String(prevJson)); } catch (e2) { prevList = []; }
    }
    var prevSet = {};
    for (var i = 0; i < prevList.length; i++) prevSet[prevList[i]] = true;

    // Compare
    if (prevList.length === 0) {
        // First scan
        _saveBaseline(inbt, currSet);
        var count = Object.keys(currSet).length;
        tellPlayer(player, '&6[crate-diff] Baseline saved. Found &e' + count + '&6 crate inventory UUID' + (count === 1 ? '' : 's') + '.');
        return;
    }

    var added = [];
    var removed = [];
    // Added: in curr but not in prev
    for (var k in currSet) { if (!prevSet[k]) added.push(k); }
    // Removed: in prev but not in curr
    for (var j = 0; j < prevList.length; j++) { var u = prevList[j]; if (!currSet[u]) removed.push(u); }

    // Report
    var currCount = Object.keys(currSet).length;
    tellPlayer(player, '&e[Crate Diff] Radius ' + radius + ' blocks. Now: &6' + currCount + '&e UUIDs. Added: &a' + added.length + '&e, Removed: &c' + removed.length + '&e.');
    if (added.length > 0) _printList(player, '&a+ ', added);
    if (removed.length > 0) _printList(player, '&c- ', removed);

    // Update baseline
    _saveBaseline(inbt, currSet);
}

function _printList(player, prefix, arr) {
    var maxLines = 8;
    for (var i = 0; i < arr.length && i < maxLines; i++) {
        tellPlayer(player, prefix + arr[i]);
    }
    if (arr.length > maxLines) {
        tellPlayer(player, '&7… and ' + (arr.length - maxLines) + ' more');
    }
}

function _saveBaseline(inbt, setObj) {
    var list = Object.keys(setObj);
    try { inbt.setString('crateScanPrev', JSON.stringify(list)); } catch (e) {}
}

function _resolveCrateLootTable(player) {
    var path = null;
    try {
        var cfg = loadJson(ONBOARDING_CONFIG_PATH);
        if (cfg && cfg.phases && cfg.phases['3'] && cfg.phases['3'].stages && cfg.phases['3'].stages.stage1 && cfg.phases['3'].stages.stage1.crate) {
            path = cfg.phases['3'].stages.stage1.crate.loot_table_path;
        }
    } catch (e) {
        logToFile('dev', '[crate-diff] Failed read of onboarding_config.json: ' + e);
    }
    if (!path || typeof path !== 'string') {
        path = 'storage/crates_generic_27.json';
        tellPlayer(player, '&6[crate-diff] Using default loot table: &e' + path);
    }
    return path;
}

function _scanNearbyCrateInventoryUUIDs(world, pos, radius, lootTablePath) {
    var entities = world.getNearbyEntities(pos, radius, 0);
    var uuids = {};
    for (var i = 0; i < entities.length; i++) {
        var ent = entities[i]; if (!ent) continue;
        if (ent.getName() !== 'entity.mts_entity.name') continue;
        var nbt; try { nbt = ent.getEntityNbt(); } catch (e) { continue; }
        if (!nbt) continue;
        _collectCrateInventoryUUIDsFromNbt(nbt, uuids, lootTablePath);
    }
    return uuids;
}

// Recursively traverse part_* compounds and capture inventory.uniqueUUID for crates
function _collectCrateInventoryUUIDsFromNbt(nbt, outMap, lootTablePath) {
    if (!nbt) return;
    for (var i = 0; i < 64; i++) {
        var key = 'part_' + i;
        try {
            if (!nbt.has(key)) continue;
            var part = nbt.getCompound(key);
            // Determine if this part is a crate
            var packID = '' + (part.getString('packID') || '');
            var systemName = '' + (part.getString('systemName') || '');
            var subName = '' + (part.getString('subName') || '');
            var itemId = 'mts:' + packID + '.' + systemName + (subName || '');

            var looksLikeCrate = false;
            if (systemName && systemName.indexOf('crate') !== -1) {
                looksLikeCrate = true;
            } else {
                try { looksLikeCrate = isItemInLootTable(lootTablePath, itemId); } catch (e) { /* ignore */ }
            }

            if (looksLikeCrate && part.has('inventory')) {
                try {
                    var inv = part.getCompound('inventory');
                    var uid = '' + (inv.getString('uniqueUUID') || '');
                    if (uid) outMap[uid] = true;
                } catch (invErr) { /* ignore */ }
            }

            // Recurse into nested parts
            _collectCrateInventoryUUIDsFromNbt(part, outMap, lootTablePath);
        } catch (e2) { /* ignore malformed */ }
    }
}

function getTooltip(e) {
    e.add('&6Crate Inventory Diff Tracker');
    e.add('&7Use to save baseline, then use again to see added/removed crates in 20 blocks.');
}
