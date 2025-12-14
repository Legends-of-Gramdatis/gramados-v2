// crate_focus_inspector.js
// Single-use item to focus on a newly appeared crate and inspect its contents across punches.
// Workflow:
// 1st punch: record baseline crate inventory UUIDs (no output beyond count).
// 2nd punch: diff vs baseline; if exactly one NEW UUID -> focus that crate; else report inability to focus.
// Later punches: if focused UUID still present -> read its inventory.Items list and print counts of each item (id+damage+tag signature) without raw NBT; if gone -> clear focus and inform.
// Edge case: crates may contain vehicles or nested crates; only count direct Items in the crate's inventory.Items list.
// All state stored in the item's own NBT: focus UUID and last UUID set JSON.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');

var ONBOARDING_CONFIG_PATH = 'world/customnpcs/scripts/ecmascript/modules/onboarding/onboarding_config.json';

function interact(event){
    var player = event.player; if (!player) return;
    var world = player.getWorld(); if (!world) return;
    var item = event.item ? event.item : player.getMainhandItem(); if (!item){ tellPlayer(player, '&c[crate-focus] No item in hand.'); return; }

    var radius = 20;
    var lootTablePath = _resolveCrateLootTable();
    var currentCrates = _scanNearbyCrateParts(world, player.getPos(), radius, lootTablePath); // map uuid -> part compound

    var inbt = item.getNbt();
    var prevJson = inbt.getString('focusPrevSet') || '';
    var prevList = [];
    if (prevJson){ try { prevList = JSON.parse(String(prevJson)); } catch(e){ prevList = []; } }
    var focusUUID = inbt.getString('focusUUID') || '';

    // Convert current keys to list
    var currKeys = Object.keys(currentCrates);

    if (prevList.length === 0){
        // First punch
        _savePrevSet(inbt, currKeys);
        tellPlayer(player, '&6[crate-focus] Baseline captured: &e' + currKeys.length + ' crate UUID' + (currKeys.length===1?'':'s') + '. Punch again to attempt focus.');
        return;
    }

    // If we already have a focus
    if (focusUUID){
        if (!currentCrates[focusUUID]){
            // Focus crate disappeared
            inbt.setString('focusUUID', '');
            _savePrevSet(inbt, currKeys); // reset baseline to new environment
            tellPlayer(player, '&c[crate-focus] Focused crate is gone. Focus cleared. Baseline reset (' + currKeys.length + ' crates).');
            return;
        }
        // Focus still present -> inspect contents
        _inspectFocusedCrate(player, currentCrates[focusUUID]);
        _savePrevSet(inbt, currKeys); // update baseline after inspection (allows detection of new crates later if focus cleared)
        return;
    }

    // No focus yet -> diff prev vs current
    var prevSetMap = {}; for (var i=0;i<prevList.length;i++) prevSetMap[prevList[i]] = true;
    var added = []; var removed = [];
    for (var k=0;k<currKeys.length;k++){ var key=currKeys[k]; if (!prevSetMap[key]) added.push(key); }
    for (var j=0;j<prevList.length;j++){ var pk=prevList[j]; if (!currentCrates[pk]) removed.push(pk); }

    if (added.length === 1){
        // Acquire focus
        focusUUID = added[0];
        inbt.setString('focusUUID', focusUUID);
        tellPlayer(player, '&a[crate-focus] Focus locked on new crate UUID: &6' + focusUUID + '&a. Punch again to inspect contents.');
        _savePrevSet(inbt, currKeys); // baseline updated including focused crate
        return;
    }
    // Could not lock focus (0 or >1 additions)
    tellPlayer(player, '&e[crate-focus] Added: ' + added.length + ', Removed: ' + removed.length + '. Need exactly 1 new crate to focus.');
    if (added.length > 0){
        var maxLines = 5;
        for (var a=0; a<added.length && a<maxLines; a++){ tellPlayer(player, '&7+ ' + added[a]); }
        if (added.length > maxLines) tellPlayer(player, '&7… +' + (added.length - maxLines) + ' more');
    }
    _savePrevSet(inbt, currKeys);
}

function _inspectFocusedCrate(player, partNbt){
    if (!partNbt){ tellPlayer(player, '&c[crate-focus] Part NBT missing.'); return; }
    if (!partNbt.has('inventory')){ tellPlayer(player, '&6[crate-focus] Focus crate has no inventory node.'); return; }
    var inv = partNbt.getCompound('inventory');
    var itemsList = null;
    try { itemsList = inv.getList('Items', inv.getListType('Items')); } catch(e){ itemsList = null; }
    if (!itemsList || itemsList.length === 0){ tellPlayer(player, '&6[crate-focus] Crate inventory empty (0 items).'); return; }

    // Aggregate counts by signature: id|damage|tagSimplified
    var counts = {};
    for (var i=0;i<itemsList.length;i++){
        try {
            var it = itemsList[i]; if (!it) continue;
            // Standard MC item NBT layout: id, Damage (or damage), tag compound (optional)
            var id = it.getString('id') || it.getString('Item') || 'unknown';
            var dmg = '' + (it.has('Damage') ? it.getShort('Damage') : (it.has('damage') ? it.getShort('damage') : 0));
            var tagSig = '';
            if (it.has('tag')){
                // Build a lightweight signature without full JSON spam
                var tag = it.getCompound('tag');
                // Use display.Name or first 16 chars of toJsonString as fallback
                if (tag && tag.has('display')){
                    var disp = tag.getCompound('display');
                    if (disp && disp.has('Name')) tagSig = disp.getString('Name');
                }
                if (!tagSig){
                    try { var raw = tag.toJsonString(); tagSig = raw.substring(0, 32); if (raw.length > 32) tagSig += '…'; } catch(e2) {}
                }
            }
            var sig = id + '|' + dmg + (tagSig ? ('|' + tagSig) : '');
            counts[sig] = (counts[sig] || 0) + (it.has('Count') ? it.getByte('Count') : 1);
        } catch(inner){ /* skip malformed item */ }
    }
    var keys = Object.keys(counts); keys.sort();
    tellPlayer(player, '&b[crate-focus] Crate contains &6' + keys.length + '&b distinct item type' + (keys.length===1?'':'s') + '.');
    var maxLines = 12;
    for (var k=0; k<keys.length && k<maxLines; k++){
        var sig = keys[k];
        tellPlayer(player, '&7- ' + sig + ' &8x' + counts[sig]);
    }
    if (keys.length > maxLines){ tellPlayer(player, '&7… and ' + (keys.length - maxLines) + ' more types'); }
}

function _savePrevSet(inbt, arr){
    try { inbt.setString('focusPrevSet', JSON.stringify(arr)); } catch(e) {}
}

function _resolveCrateLootTable(){
    var path = null;
    try {
        var cfg = loadJson(ONBOARDING_CONFIG_PATH);
        if (cfg && cfg.phases && cfg.phases['3'] && cfg.phases['3'].stages && cfg.phases['3'].stages.stage1 && cfg.phases['3'].stages.stage1.crate){
            path = cfg.phases['3'].stages.stage1.crate.loot_table_path;
        }
    } catch(e){ /* ignore */ }
    if (!path || typeof path !== 'string') path = 'storage/crates_generic_27.json';
    return path;
}

function _scanNearbyCrateParts(world, pos, radius, lootTablePath){
    var entities = world.getNearbyEntities(pos, radius, 0);
    var map = {}; // uuid -> part compound
    for (var i=0;i<entities.length;i++){
        var ent = entities[i]; if (!ent) continue;
        if (ent.getName() !== 'entity.mts_entity.name') continue;
        var nbt; try { nbt = ent.getEntityNbt(); } catch(e){ continue; }
        if (!nbt) continue;
        _collectCrateParts(nbt, map, lootTablePath);
    }
    return map;
}

function _collectCrateParts(nbt, outMap, lootTablePath){
    if (!nbt) return;
    for (var i=0;i<64;i++){
        var key = 'part_' + i;
        if (!nbt.has(key)) continue;
        try {
            var part = nbt.getCompound(key);
            var packID = part.getString('packID') || '';
            var systemName = part.getString('systemName') || '';
            var subName = part.getString('subName') || '';
            var itemId = 'mts:' + packID + '.' + systemName + (subName||'');
            var looksCrate = false;
            if (systemName.indexOf('crate') !== -1) looksCrate = true; else {
                try { looksCrate = isItemInLootTable(lootTablePath, itemId); } catch(e2){ looksCrate = false; }
            }
            if (looksCrate && part.has('inventory')){
                try {
                    var inv = part.getCompound('inventory');
                    var uid = inv.getString('uniqueUUID') || '';
                    if (uid) outMap[uid] = part;
                } catch(invErr){ /* ignore */ }
            }
            // Recurse
            _collectCrateParts(part, outMap, lootTablePath);
        } catch(e){ /* ignore single part error */ }
    }
}

function getTooltip(e){
    e.add('&6Crate Focus Inspector');
    e.add('&7Punch: baseline -> focus -> inspect focused crate contents.');
}
