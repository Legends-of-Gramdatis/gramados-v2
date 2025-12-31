// Utilities for pickpocket-like effects on nearby CustomNPCs
// Nashorn + CustomNPCs API (MC 1.12.2)

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');

/**
 * Forces nearby NPCs to drop their RNG death inventory items, with extra rolls:
 * - 1/3 chance: also drop items from `_LOOTTABLE_NPCTYPE_HUMAN`
 * - 1/3 chance: also drop 1-50 grons of cash
 *
 * @param {IPlayer} player Center player.
 * @param {number} radius Radius in blocks.
 * @returns {{affected:number, droppedNpcLoot:number, droppedHumanLoot:number, droppedCash:number}}
 */
function pickpocket_npcs_in_radius(player, radius) {
    var world = player.getWorld();
    var pos = player.getPos();

    var npcs = world.getNearbyEntities(pos, radius, 2); // 2 = NPCs

    var affected = 0;
    var droppedNpcLoot = 0;
    var droppedHumanLoot = 0;
    var droppedCash = 0;

    for (var i = 0; i < npcs.length; i++) {
        var npc = npcs[i];
        if (!npc) continue;

        if (npc.getType && npc.getType() !== 2) continue;
        affected++;

        // 1) Drop NPC inventory RNG drops (what it would drop on death)
        var inv = (npc.getInventory && npc.getInventory()) || null;
        if (inv && typeof inv.getItemsRNG === 'function') {
            var rngItems = inv.getItemsRNG();
            if (rngItems && rngItems.length) {
                for (var ri = 0; ri < rngItems.length; ri++) {
                    var stack = rngItems[ri];
                    if (!stack) continue;
                    if (typeof stack.isEmpty === 'function' && stack.isEmpty()) continue;
                    if (typeof stack.getStackSize === 'function' && stack.getStackSize() <= 0) continue;
                    drop_item_near_entity(world, npc, stack);
                    droppedNpcLoot++;
                }
            }
        }

        // 2) Extra 1/3 roll: human loot table
        if (Math.random() < (1 / 3)) {
            var loot = pullLootTable(_LOOTTABLE_NPCTYPE_HUMAN, player) || [];
            for (var li = 0; li < loot.length; li++) {
                var lootStack = generateItemStackFromLootEntry(loot[li], world);
                if (!lootStack) continue;
                drop_item_near_entity(world, npc, lootStack);
                droppedHumanLoot++;
            }
        }

        // 3) Extra 1/3 roll: money (1-50 grons)
        if (Math.random() < (1 / 3)) {
            var moneyItems = generateMoney(world, rrandom_range(10, 1000));
            for (var mi = 0; mi < moneyItems.length; mi++) {
                var moneyStack = moneyItems[mi];
                if (!moneyStack) continue;
                drop_item_near_entity(world, npc, moneyStack);
                droppedCash++;
            }
        }
    }

    return {
        affected: affected,
        droppedNpcLoot: droppedNpcLoot,
        droppedHumanLoot: droppedHumanLoot,
        droppedCash: droppedCash
    };
}

function drop_item_near_entity(world, entity, stack) {
    if (!stack) return;
    if (typeof stack.isEmpty === 'function' && stack.isEmpty()) return;

    if (entity && typeof entity.dropItem === 'function') {
        entity.dropItem(stack);
        return;
    }

    if (world && typeof world.dropItem === 'function' && entity && typeof entity.getPos === 'function') {
        world.dropItem(entity.getPos(), stack);
    }
}

// Exports
var exports_utils_pickpocket = {
    pickpocket_npcs_in_radius: pickpocket_npcs_in_radius
};
