// Utilities for interacting with crate/backpack item stacks that contain internal inventories in NBT.
// Mirrors the logic used in stock exchange scripts.

// Supported container IDs
var _CRATE_IDS = [
    'mts:unuparts.unuparts_part_unu_crate_wooden',
    'mts:unuparts.unuparts_part_unu_crate_metal',
    'mts:iv_tpp.trin_crate1',
    'mts:iv_tpp.trin_crate2',
    'mts:iv_tpp.trin_crate1_wooden',
    'mts:iv_tpp.trin_crate1_metal',
    'mts:ivv.backpack_red',
    'mts:ivv.backpack_blue',
    'mts:ivv.backpack_green',
    'mts:ivv.backpack_black',
    'mts:ivv.backpack_brown',
    'mts:ivv.backpack_white',
    'mts:ivv.backpack_yellow',
    'mts:ivv.crate_metallic',
    'mts:ivv.crate',
    'mts:ivv.box',
    'mts:ivv.chest',
    'mts:iav.iav_storage_l_crate_2',
    'mts:iav.iav_storage_l_crate_3',
    'mts:iav.iav_storage_l_crate_5',
    'mts:iav.iav_storage_l_crate_6',
    'mts:iv_tpp.trin_stacked_boxes_ornate_gold',
    'mts:iv_tpp.trin_stacked_boxes_sculpted_light',
    'mts:iv_tpp.trin_stacked_boxes_ornate_marble',
    'mts:iv_tpp.trin_stacked_boxes_cardboard_2',
    'mts:iv_tpp.trin_stacked_boxes_cardboard'
];

function crate_listSupportedIds() { return _CRATE_IDS; }

function crate_isSupported(id) {
    for (var i = 0; i < _CRATE_IDS.length; i++) {
        if (_CRATE_IDS[i] == id) return true;
    }
    return false;
}

// Returns an array of entries { id, damage, count, nbt }
function crate_readEntries(crateItem) {
    var out = [];
    var nbt = crateItem.getNbt();
    if (!nbt || !nbt.has('inventory')) return out;
    var inv = nbt.getCompound('inventory').getList('Items', 10);
    for (var i = 0; i < inv.length; i++) {
        var c = inv[i];
        var id = c.getString('id');
        var dmg = c.getShort('Damage');
        var cnt = c.getByte('Count');
        if (cnt > 0 && id) {
            out.push({ id: id, damage: dmg, count: cnt, nbt: c });
        }
    }
    return out;
}

// Clears or reduces items in a crate using a sold map: { 'modid:item:meta': count }
function crate_clearSold(crateItem, soldMap) {
    var invList = crateItem.getNbt().getCompound('inventory').getList('Items', 10);
    for (var i = 0; i < invList.length; i++) {
        var c = invList[i];
        var key = c.getString('id') + ':' + c.getShort('Damage');
        if (soldMap.hasOwnProperty(key)) {
            var current = c.getByte('Count');
            var sold = soldMap[key];
            if (current <= sold) {
                c.setByte('Count', 0);
            } else {
                c.setByte('Count', current - sold);
            }
        }
    }
    // Repack non-empty
    var kept = [];
    for (var j = 0; j < invList.length; j++) {
        if (invList[j].getByte('Count') > 0) {
            kept.push(invList[j]);
        }
    }
    crateItem.getNbt().getCompound('inventory').setList('Items', kept);
}
