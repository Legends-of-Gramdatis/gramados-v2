load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");

var API = Java.type('noppes.npcs.api.NpcAPI').Instance()

/**
 * Simulates pulling items from a loot table.
 * Iterates through pools and rolls to generate loot based on the loot table's configuration.
 * @param {string} lootTablePath - The path to the loot table file.
 * @param {IPlayer} player - The player interacting with the loot table.
 * @returns {Array} - An array of items generated from the loot table.
 */
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

        if (pool.rolls === undefined) {
            rolls = 1; // default to 1 roll
        } else if (typeof pool.rolls === "number") {
            rolls = pool.rolls;
        } else if (typeof pool.rolls === "object") {
            rolls = rrandom_range(pool.rolls.min, pool.rolls.max);
        }        

        var entries = pool.entries;
        // tellPlayer(player, "&eProcessing loot pool " + (poolIdx + 1) + " with " + rolls + " rolls.");

        for (var r = 0; r < rolls; r++) {
            // Preprocess weights, especially for "auto" and "autorec"
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                
                if (entry.weight === "auto" || entry.weight === "autorec") {
                    if (entry.type === "loot_table" && entry.path) {
                        var subWeight = (entry.weight === "auto")
                            ? resolveDirectWeight(entry.path)
                            : resolveRecursiveWeight(entry.path);

                        entry.weight = subWeight > 0 ? subWeight : 1;
                    } else {
                        entry.weight = 1;
                        tellPlayer(player, "&c'" + entry.weight + "' weight used on non-loot_table entry. Defaulting to 1.");
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
                        item.damage = (typeof func.data === "object")
                            ? rrandom_range(func.data.min, func.data.max)
                            : func.data;
                    }

                    if (func.function === "set_nbt") {
                        item.nbt = func.tag;
                    }
                }
            }

            generatedLoot.push(item);
        }
    }

    logToFile("loot_tables", "Loot table pulled: " + lootTablePath);

    return generatedLoot;
}

/**
 * Performs multiple pulls from a loot table and aggregates the results.
 * @param {string} lootTablePath - The path to the loot table file.
 * @param {IPlayer} player - The player interacting with the loot table.
 * @param {number} lootCount - The number of times to pull from the loot table.
 * @returns {Array} - An array containing all items generated from the multiple pulls.
 */
function multiplePullLootTable(lootTablePath, player, lootCount) {
    var full_loot = [];
    for (var i = 0; i < lootCount; i++) {
        var loot = pullLootTable(lootTablePath, player);
        // loot is an array, concatenate it to full_loot
        if (loot != null) {
            full_loot = full_loot.concat(loot);
        }
    }
    logToFile("loot_tables", "Loot table pulled: " + lootTablePath + " x" + lootCount);

    return full_loot;
}

/**
 * Selects an entry from a list based on weighted probabilities.
 * @param {Array} entries - An array of objects, each containing a `weight` property that determines its probability of being selected.
 * @returns {Object} - The selected entry based on the weighted random calculation.
 * @throws {Error} - If no entries are provided or if the total weight is zero.
 */
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

/**
 * Generates an item stack from a loot table entry.
 * @param {Object} entry - The loot table entry containing item details.
 * @param {IWorld} world - The world object to create the item in.
 * @returns {Object} - The generated item stack.
 */
function generateItemStackFromLootEntry(entry, world) {
    var itemstack = world.createItem(
        entry.id,
        entry.damage || 0,
        entry.count || 1
    );
    if (entry.nbt) {
        var nbt = API.stringToNbt(entry.nbt);
        // set nbt to itemstack
        itemstack = setNbtToItemStack(itemstack, nbt, world);
    }
    return itemstack;
}

/**
 * Sets NBT data to an item stack.
 * @param {Object} itemstack - The item stack to modify.
 * @param {INbt} nbt - The NBT data to set on the item stack.
 * @param {IPlayer} player - The player interacting with the item stack.
 * @returns {Object} - The modified item stack with the NBT data applied.
 */
function setNbtToItemStack(itemstack, nbt, world) {
    var item_nbt = itemstack.getItemNbt();
    item_nbt.setCompound("tag", nbt);
    // tellPlayer(player, "&7Setting NBT: " + item_nbt.toJsonString());
    return world.createItemFromNbt(item_nbt);
}

/**
 * Resolves the direct weight of a loot table by counting its entries.
 * @param {string} path - The path to the loot table file.
 * @returns {number} - The total weight of the loot table entries.
 */
function resolveDirectWeight(path) {
    var lootJson = loadJson("world/loot_tables/" + path);
    if (!lootJson || !lootJson.pools) return 1;

    var count = 0;
    for (var i = 0; i < lootJson.pools.length; i++) {
        count += lootJson.pools[i].entries.length;
    }
    return count;
}

/**
 * Resolves the recursive weight of a loot table, including nested loot tables.
 * Prevents circular loops by tracking visited paths.
 * @param {string} path - The path to the loot table file.
 * @param {Array} [visited] - An array of visited paths to prevent circular references.
 * @returns {number} - The total recursive weight of the loot table.
 */
function resolveRecursiveWeight(path, visited) {
    visited = visited || [];
    if (visited.indexOf(path) !== -1) return 0; // prevent circular loops
    visited.push(path);

    var lootJson = loadJson("world/loot_tables/" + path);
    if (!lootJson || !lootJson.pools) return 0;

    var total = 0;
    for (var p = 0; p < lootJson.pools.length; p++) {
        var entries = lootJson.pools[p].entries;
        for (var e = 0; e < entries.length; e++) {
            var entry = entries[e];
            if (entry.type === "loot_table" && entry.path) {
                total += resolveRecursiveWeight(entry.path, visited);
            } else {
                total += 1;
            }
        }
    }
    return total;
}

/**
 * Checks if an item is part of a specified loot table.
 * @param {string} lootTablePath - The path to the loot table file.
 * @param {string} itemId - The ID of the item to check.
 * @returns {boolean} - True if the item is in the loot table, false otherwise.
 */
function isItemInLootTable(lootTablePath, itemId) {
    var lootTable = loadJson(lootTablePath);
    if (!lootTable || !lootTable.pools) {
        return false;
    }

    for (var i = 0; i < lootTable.pools.length; i++) {
        var pool = lootTable.pools[i];
        if (pool.entries) {
            for (var j = 0; j < pool.entries.length; j++) {
                var entry = pool.entries[j];
                if (entry.name === itemId) {
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Retrieves the weight of an item from a loot table.
 * @param {Object} lootTable - The loot table JSON object.
 * @param {string} itemId - The ID of the item.
 * @returns {number|null} - The weight of the item, or null if not found.
 */
function getItemWeightFromLootTable(lootTable, itemId) {
    if (!lootTable || !lootTable.pools) {
        return null;
    }

    for (var i = 0; i < lootTable.pools.length; i++) {
        var pool = lootTable.pools[i];
        if (pool.entries) {
            for (var j = 0; j < pool.entries.length; j++) {
                var entry = pool.entries[j];
                if (entry.name === itemId) {
                    return entry.weight || null;
                }
            }
        }
    }

    return null;
}