load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js')
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js')
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");

function died(event) {
    var npc = event.npc;
    var world = npc.getWorld();

    var moneyItems = generateMoney(world, rrandom_range(0, 200));
    for (var i = 0; i < moneyItems.length; i++) {
        npc.dropItem(moneyItems[i]);
    }

    var loot = pullLootTable(_LOOTTABLE_NPCTYPE_HUMAN, event.player);
    for (var i = 0; i < loot.length; i++) {
        npc.dropItem(
            generateItemStackFromLootEntry(loot[i], world)
        );
    }
}
