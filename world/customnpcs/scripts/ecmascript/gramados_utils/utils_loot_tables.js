load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");

function pullLootTable(lootTablePath, player) {
    var loot_table_json = loadJson(lootTablePath);
    if (loot_table_json == null) {
        return null;
    }

    var pools = loot_table_json["pools"];
    var generatedLoot = [];

    for (var poolIdx = 0; poolIdx < pools.length; poolIdx++) {
        var pool = pools[poolIdx];
        // if rolls is simply a number, use it directly
        if (typeof pool.rolls === "number") {
            tellPlayer(player, "&eUsing " + pool.rolls + " rolls.");
            var rolls = pool.rolls;
        }
        // if rolls is an object, use rrandom_range
        else if (typeof pool.rolls === "object") {
            tellPlayer(player, "&eUsing rrandom_range for rolls.");
            var rolls = rrandom_range(pool.rolls.min, pool.rolls.max);
        }
        var entries = pool.entries;

        tellPlayer(player, "&eProcessing loot pool " + (poolIdx + 1) + " with " + rolls + " rolls.");

        for (var r = 0; r < rolls; r++) {
            var selected = weightedRandom(entries);

            var item = {
                id: selected.name || "minecraft:air",
                count: 1,
                damage: 0,
                nbt: null
            };

            if (selected.functions) {
                for (var f = 0; f < selected.functions.length; f++) {
                    var func = selected.functions[f];

                    if (func.function === "set_count") {
                        item.count = (typeof func.count === "object")
                            ? rrandom_range(func.count.min, func.count.max)
                            : func.count;
                    }

                    if (func.function === "set_data") {
                        item.damage = func.data;
                    }

                    if (func.function === "set_nbt") {
                        item.nbt = func.tag;
                    }
                }
            }

            generatedLoot.push(item);
        }
    }

    return generatedLoot;
}

function multiplePullLootTable(lootTablePath, player, lootCount) {
    var full_loot = [];
    for (var i = 0; i < lootCount; i++) {
        var loot = pullLootTable(lootTablePath, player);
        // loot is an array, concatenate it to full_loot
        if (loot != null) {
            full_loot = full_loot.concat(loot);
        }
    }
    return full_loot;
}

function weightedRandom(entries) {
    var totalWeight = 0;
    for (var i = 0; i < entries.length; i++) {
        totalWeight += entries[i].weight || 1;
    }

    var rnd = Math.random() * totalWeight;
    for (var i = 0; i < entries.length; i++) {
        var weight = entries[i].weight || 1;
        if (rnd < weight) return entries[i];
        rnd -= weight;
    }

    return entries[0]; // fallback
}

// function to generate an itemstack out of a loot table entry
function generateItemStackFromLootEntry(entry, world) {
    var itemstack = world.createItem(
        entry.id,
        entry.damage || 0,
        entry.count || 1
    );
    return itemstack;
}