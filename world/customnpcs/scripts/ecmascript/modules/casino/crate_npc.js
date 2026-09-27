load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_item_ownership.js');
var CASINO_CRATES_CONFIG = 'world/customnpcs/scripts/ecmascript/modules/casino/crates.json';
var CASINO_CRATE_TYPE_KEY = 'casino_crate_type';
function interact(event) {
    var player = event.player, npc = event.npc;
    var cfg = loadJson(CASINO_CRATES_CONFIG);
    if (!cfg || !cfg.crates) { tellPlayer(player, '&cCrate configuration unavailable.'); return; }
    var main = player.getMainhandItem(), off = player.getOffhandItem();
    if (!off.isEmpty() && off.getName() === 'mts:ivv.idcard_seagull' &&
        !main.isEmpty() && main.getName() === 'minecraft:paper') {
        var types = Object.keys(cfg.crates);
        if (!types.length) return;
        var current = String(npc.getStoreddata().get(CASINO_CRATE_TYPE_KEY) || '');
        var next = types[(types.indexOf(current) + 1) % types.length];
        npc.getStoreddata().put(CASINO_CRATE_TYPE_KEY, next);
        tellPlayer(player, '&aCrate type set to: &e' + next);
        return;
    }
    var crateType = String(npc.getStoreddata().get(CASINO_CRATE_TYPE_KEY) || '');
    var crate = cfg.crates[crateType];
    if (!crate || !crate.loot_table) { tellPlayer(player, '&cThis crate is not configured.'); return; }
    if (!isCrateKeyModifier(main)) { tellPlayer(player, '&eHold a matching crate key in your main hand.'); return; }
    if (!isItemOwnedBy(main, player)) { tellPlayer(player, '&cThis key belongs to another player or is unbound.'); return; }
    if (!canPlayerOpenCrateWithKey(main, player, crateType)) { tellPlayer(player, '&cWrong key for this crate.'); return; }
    if (!canUseLootTable(crate.loot_table)) { tellPlayer(player, '&cThis crate is currently empty.'); return; }
    var prepared = prepareLootTablePull(crate.loot_table, player);
    if (!prepared || !prepared.loot || !prepared.loot.length) {
        tellPlayer(player, '&cUnable to prepare a reward. Your key was not consumed.'); return;
    }
    var rewards = [];
    for (var i = 0; i < prepared.loot.length; i++) {
        var item = generateItemStackFromLootEntry(prepared.loot[i], player.getWorld(), player);
        if (!item || item.isEmpty()) { tellPlayer(player, '&cReward generation failed. Your key was not consumed.'); return; }
        rewards.push(item);
    }
    if (!commitLootTablePull(prepared)) { tellPlayer(player, '&cReward pool changed. Try again.'); return; }
    var remaining = main.copy();
    remaining.setStackSize(main.getStackSize() - 1);
    player.setMainhandItem(remaining);
    for (var j = 0; j < rewards.length; j++) {
        if (!player.giveItem(rewards[j])) player.dropItem(rewards[j]);
    }
    tellPlayer(player, '&a:check_mark: Crate opened!');
}
