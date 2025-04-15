load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");

var API = Java.type('noppes.npcs.api.NpcAPI').Instance()

function pullLootTable(lootTablePath, player) {
    var loot_table_json = loadJson("world/loot_tables/" + lootTablePath);
    if (loot_table_json == null) {
        tellPlayer(player, "&cFailed to load loot table: " + lootTablePath);
        return null;
    }

    var pools = loot_table_json["pools"];
    var generatedLoot = [];

    for (var poolIdx = 0; poolIdx < pools.length; poolIdx++) {
        var pool = pools[poolIdx];
        var rolls;

        if (typeof pool.rolls === "number") {
            rolls = pool.rolls;
            // tellPlayer(player, "&eUsing " + rolls + " rolls.");
        } else if (typeof pool.rolls === "object") {
            rolls = rrandom_range(pool.rolls.min, pool.rolls.max);
            // tellPlayer(player, "&eUsing rrandom_range for rolls: " + rolls);
        }

        var entries = pool.entries;
        // tellPlayer(player, "&eProcessing loot pool " + (poolIdx + 1) + " with " + rolls + " rolls.");

        for (var r = 0; r < rolls; r++) {
            // Preprocess weights, especially for "auto"
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                if (entry.weight === "auto") {
                    if (entry.type === "loot_table" && entry.path) {
                        var subLootJson = loadJson("world/loot_tables/" + entry.path);
                        if (subLootJson && subLootJson.pools) {
                            var subEntryCount = 0;
                            for (var p = 0; p < subLootJson.pools.length; p++) {
                                subEntryCount += subLootJson.pools[p].entries.length;
                            }
                            entry.weight = subEntryCount > 0 ? subEntryCount : 1;
                            // tellPlayer(player, "&7Auto-weight resolved to " + entry.weight + " for: " + entry.path);
                        } else {
                            entry.weight = 1;
                            tellPlayer(player, "&cFailed to load sub-loot-table for auto-weight: " + entry.path);
                        }
                    } else {
                        entry.weight = 1;
                        tellPlayer(player, "&c'auto' weight used on non-loot_table entry. Defaulting to 1.");
                    }
                }
            }

            // Now that all weights are resolved, pick one
            var selected = weightedRandom(entries);


            // ✅ Check for sub-loot-table entry type
            if (selected.type === "loot_table" && selected.path) {
                // tellPlayer(player, "&7Pulling from sub-loot table: " + selected.path);
                var subLoot = pullLootTable(selected.path, player);
                if (subLoot != null) {
                    generatedLoot = generatedLoot.concat(subLoot);
                }
                continue;
            }

            // Default item entry
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
function generateItemStackFromLootEntry(entry, world, player) {
    var itemstack = world.createItem(
        entry.id,
        entry.damage || 0,
        entry.count || 1
    );
    if (entry.nbt) {
        var nbt = API.stringToNbt(entry.nbt);
        // set nbt to itemstack
        itemstack = setNbtToItemStack(itemstack, nbt, player);
    }
    return itemstack;
}

// function to set nbt
function setNbtToItemStack(itemstack, nbt, player) {
    var world = player.getWorld();
    var item_nbt = itemstack.getItemNbt();
    item_nbt.setCompound("tag", nbt);
    // tellPlayer(player, "&7Setting NBT: " + item_nbt.toJsonString());
    return world.createItemFromNbt(item_nbt);
}