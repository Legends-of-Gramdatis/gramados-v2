// Single-use admin tool: generate a basic loot table JSON from a chest.
// Attach this script to a scripted item and right-click while looking at a chest.
// NBT is intentionally ignored; weights are based on stack sizes.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

var OUTPUT_DIR = 'world/customnpcs/scripts/data_auto/loot_tables';

function interact(event) {
    var player = event.player;
    if (!player) return;

    var trace = player.rayTraceBlock(5, true, false);
    var block = trace ? trace.getBlock() : null;

    if (!block || !block.getName || block.getName() !== 'minecraft:chest') {
        tellPlayer(player, '&e[LootTableGen] Look at a chest and right-click with this item.');
        return;
    }

    var container = block.getContainer();
    if (!container) {
        tellPlayer(player, '&c[LootTableGen] Could not access the chest container.');
        return;
    }

    var slotCount = container.getSize();
    var aggregated = {};

    for (var slot = 0; slot < slotCount; slot++) {
        var slotItem = container.getSlot(slot);
        if (slotItem.isEmpty()) {
            continue;
        }

        var itemName = slotItem.getName();
        var meta = _lootTableGen_getMeta(slotItem);
        var stackSize = slotItem.getStackSize();
        if (stackSize <= 0) {
            continue;
        }

        var key = itemName + '|' + meta;
        if (!aggregated[key]) {
            aggregated[key] = {
                item: itemName,
                meta: meta,
                weight: 0
            };
        }
        aggregated[key].weight += stackSize;
    }

    var entries = [];
    var keys = Object.keys(aggregated);
    for (var i = 0; i < keys.length; i++) {
        entries.push(aggregated[keys[i]]);
    }

    if (entries.length === 0) {
        tellPlayer(player, '&e[LootTableGen] Chest is empty; no loot table created.');
        return;
    }

    // Highest weights first so the file is easier to inspect manually.
    entries.sort(function (a, b) {
        if (b.weight !== a.weight) return b.weight - a.weight;
        if (a.item < b.item) return -1;
        if (a.item > b.item) return 1;
        return a.meta - b.meta;
    });

    _lootTableGen_ensureDir(OUTPUT_DIR);

    var world = player.getWorld();
    var pos = player.getPos();
    var now = new Date();
    var stamp = ''
        + now.getFullYear()
        + _lootTableGen_pad2(now.getMonth() + 1)
        + _lootTableGen_pad2(now.getDate())
        + '_'
        + _lootTableGen_pad2(now.getHours())
        + _lootTableGen_pad2(now.getMinutes())
        + _lootTableGen_pad2(now.getSeconds());

    var filePath = OUTPUT_DIR + '/loot_table_' + stamp + '.json';

    var lootTable = {
        generatedAt: now.toISOString(),
        source: {
            world: world.getName(),
            chestPos: {
                x: block.getX(),
                y: block.getY(),
                z: block.getZ()
            },
            usedBy: player.getName(),
            usedAtPos: {
                x: Math.floor(pos.getX()),
                y: Math.floor(pos.getY()),
                z: Math.floor(pos.getZ())
            }
        },
        rules: {
            nbtIgnored: true,
            weightBasedOnStackSize: true
        },
        entries: entries
    };

    saveJson(lootTable, filePath);

    tellPlayer(player, '&a[LootTableGen] Loot table created with &e' + entries.length + '&a entries.');
    tellPlayer(player, '&a[LootTableGen] JSON path: &f' + filePath);
}

function getTooltip(e) {
    e.add('&aBasic Loot Table Generator');
    e.add('&7Right-click while looking at a chest.');
    e.add('&7Creates JSON from chest items.');
    e.add('&7NBT is ignored; weight = stack size.');
}

function _lootTableGen_getMeta(itemStack) {
    if (!itemStack) return 0;
    if (typeof itemStack.getItemDamage === 'function') return itemStack.getItemDamage();
    if (typeof itemStack.getDamage === 'function') return itemStack.getDamage();
    return 0;
}

function _lootTableGen_ensureDir(path) {
    var dir = new java.io.File(path);
    if (!dir.exists()) {
        dir.mkdirs();
    }
}

function _lootTableGen_pad2(n) {
    return n < 10 ? '0' + n : '' + n;
}
