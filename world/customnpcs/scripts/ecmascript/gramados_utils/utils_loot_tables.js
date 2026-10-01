load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_modifier_items.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_item_ownership.js');

var API = Java.type('noppes.npcs.api.NpcAPI').Instance()

/**
 * Returns the stock attached to a volatile entry.
 *
 * null means the entry uses the legacy one-pull volatile behaviour.
 * A defined stock must be a non-negative integer.
 */
function getVolatileEntryStock(entry) {
    if (
        !entry ||
        entry.volatile !== true ||
        entry.stock === undefined ||
        entry.stock === null
    ) {
        return null;
    }

    var stock = Number(entry.stock);
    if (!isFinite(stock) || stock < 0 || Math.floor(stock) !== stock) {
        throw new Error(
            "Volatile loot stock must be a non-negative integer: " +
            JSON.stringify(entry)
        );
    }

    return stock;
}

/**
 * Stable identity for a stock-backed volatile entry.
 * Stock is deliberately excluded because concurrent commits may decrement it.
 * Weight remains part of the identity and is independent from stock.
 */
function getVolatileEntryIdentityJson(entry) {
    var copy = JSON.parse(JSON.stringify(entry));
    delete copy.stock;
    return JSON.stringify(copy);
}

function _prepareLootTablePull(
    lootTablePath,
    player,
    context
) {
    var fullPath = lootTablePath;

    if (!fullPath.startsWith("world/loot_tables/")) {
        fullPath = "world/loot_tables/" + fullPath;
    }

    var lootTableJson = loadJson(fullPath);

    if (lootTableJson == null) {
        tellPlayer(
            player,
            "&cFailed to load loot table: " + lootTablePath
        );
        return null;
    }

    var pools = lootTableJson.pools;
    var generatedLoot = [];

    for (var poolIdx = 0; poolIdx < pools.length; poolIdx++) {
        var pool = pools[poolIdx];

        var rolls;

        if (pool.rolls === undefined) {
            rolls = 1;
        } else if (typeof pool.rolls === "number") {
            rolls = pool.rolls;
        } else if (typeof pool.rolls === "object") {
            rolls = rrandom_range(
                pool.rolls.min,
                pool.rolls.max
            );
        }

        var entries = pool.entries;

        for (var r = 0; r < rolls; r++) {

            // Build an available-entry list.
            var availableEntries = [];

            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];

                var key =
                    fullPath +
                    ":" +
                    poolIdx +
                    ":" +
                    i;

                // Volatile entries without stock retain the historical
                // one-pull behaviour. Stock-backed entries can be selected
                // repeatedly in the same transaction up to their available stock.
                if (entry.volatile === true) {
                    var reservedCount = Number(context.reserved[key] || 0);
                    var availableStock = getVolatileEntryStock(entry);
                    var capacity = availableStock === null ? 1 : availableStock;

                    if (reservedCount >= capacity) {
                        continue;
                    }
                }

                // Resolve automatic weights on a copy so we do not
                // modify the original loaded entry.
                var candidate =
                    JSON.parse(JSON.stringify(entry));

                candidate._sourceIndex = i;

                if (
                    candidate.weight === "auto" ||
                    candidate.weight === "autorec"
                ) {
                    if (
                        candidate.type === "loot_table" &&
                        candidate.path
                    ) {
                        var subWeight =
                            candidate.weight === "auto"
                                ? resolveDirectWeight(candidate.path)
                                : resolveRecursiveWeight(candidate.path);

                        candidate.weight =
                            subWeight > 0 ? subWeight : 1;
                    } else {
                        candidate.weight = 1;
                    }
                }

                availableEntries.push(candidate);
            }

            // No eligible entry remains for this roll.
            if (availableEntries.length === 0) {
                continue;
            }

            var selected =
                weightedRandom(availableEntries);

            var sourceIndex =
                selected._sourceIndex;

            delete selected._sourceIndex;

            var sourceEntry =
                entries[sourceIndex];

            // Reserve volatile entry, but DO NOT delete it yet.
            if (sourceEntry.volatile === true) {
                var claimKey =
                    fullPath +
                    ":" +
                    poolIdx +
                    ":" +
                    sourceIndex;

                context.reserved[claimKey] =
                    Number(context.reserved[claimKey] || 0) + 1;

                var sourceStock = getVolatileEntryStock(sourceEntry);

                context.claims.push({
                    lootTablePath: fullPath,
                    poolIndex: poolIdx,
                    entryIndex: sourceIndex,
                    entryJson: JSON.stringify(sourceEntry),
                    entryIdentityJson: getVolatileEntryIdentityJson(sourceEntry),
                    usesStock: sourceStock !== null
                });
            }

            // Nested loot table
            if (
                selected.type === "loot_table" &&
                selected.path
            ) {
                var subLoot = _prepareLootTablePull(
                    selected.path,
                    player,
                    context
                );

                if (subLoot != null) {
                    generatedLoot =
                        generatedLoot.concat(subLoot);
                }

                continue;
            }

            // Normal item
            var item = {
                id: selected.name || "minecraft:air",
                count: 1,
                damage: 0,
                nbt: null,
                bindOwnerToPlayer: false
            };

            if (selected.functions) {
                for (
                    var f = 0;
                    f < selected.functions.length;
                    f++
                ) {
                    var func =
                        selected.functions[f];

                    if (func.function === "set_count") {
                        item.count =
                            typeof func.count === "object"
                                ? rrandom_range(
                                    func.count.min,
                                    func.count.max
                                )
                                : func.count;
                    }

                    if (func.function === "set_data") {
                        item.damage =
                            typeof func.data === "object"
                                ? rrandom_range(
                                    func.data.min,
                                    func.data.max
                                )
                                : func.data;
                    }

                    if (func.function === "set_nbt") {
                        item.nbt = func.tag;
                    }

                    if (func.function === "set_owner") {
                        if (func.owner !== "player") {
                            logToFile("loot_tables", "Unsupported set_owner target in " + fullPath);
                            return null;
                        }
                        item.bindOwnerToPlayer = true;
                    }

                    if (func.function === "set_modifier") {
                        var modifierClass =
                            func.modifier_class ||
                            func.modifierClass ||
                            "orb";

                        var modifierType =
                            func.modifier_type ||
                            func.modifierType ||
                            null;

                        var modifierEffect =
                            func.type ||
                            func.modifier_effect ||
                            func.modifierEffect;

                        var resolvedRadius =
                            resolve_modifier_value(
                                func.radius
                            );

                        var resolvedDurationMinutes =
                            resolve_modifier_value(
                                func.durationMinutes !== undefined
                                    ? func.durationMinutes
                                    : func.duration_minutes
                            );

                        var resolvedMultiplier =
                            resolve_modifier_value(
                                func.multiplier
                            );

                        if (
                            modifierClass === "orb" &&
                            !modifierType
                        ) {
                            modifierType =
                                (
                                    resolvedDurationMinutes !== null ||
                                    resolvedMultiplier !== null
                                )
                                    ? "passive"
                                    : "active";
                        }

                        if (
                            modifierClass === "consumable"
                        ) {
                            modifierType = null;
                        }

                        item.modifier = {
                            modifierClass:
                                modifierClass,
                            modifierType:
                                modifierType,
                            modifierEffect:
                                modifierEffect,
                            radius:
                                resolvedRadius,
                            durationMinutes:
                                resolvedDurationMinutes,
                            multiplier:
                                resolvedMultiplier,
                            modifierUse:
                                func.modifier_use ||
                                func.modifierUse,
                            overrideItemId: func.itemId || func.item_id,
                            crateType: func.crate_type || func.crateType,
                            keyName: func.key_name || func.keyName,
                            keyDescription: func.key_description || func.keyDescription
                        };
                    }
                }
            }

            generatedLoot.push(item);
        }
    }

    return generatedLoot;
}

/**
 * Pulls loot from a loot table.
 *
 * Volatile entries selected during the pull are automatically
 * consumed before the result is returned.
 *
 * For transactional use, call prepareLootTablePull() directly
 * and commit manually.
 *
 * @param {string} lootTablePath
 * @param {IPlayer} player
 * @returns {Array|null}
 */
function pullLootTable(lootTablePath, player) {
    var pullResult = prepareLootTablePull(
        lootTablePath,
        player
    );

    if (pullResult == null) {
        return null;
    }

    if (!commitLootTablePull(pullResult)) return null;

    return pullResult.loot;
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
    // logToFile("loot_tables", "Loot table pulled: " + lootTablePath + " x" + lootCount);

    return full_loot;
}

/**
 * Prepares a loot-table pull without modifying volatile entries.
 *
 * @param {string} lootTablePath
 * @param {IPlayer} player
 * @returns {Object|null}
 */
function prepareLootTablePull(lootTablePath, player) {
    var context = {
        claims: [],
        reserved: {}
    };

    var loot = _prepareLootTablePull(
        lootTablePath,
        player,
        context
    );

    if (loot == null) {
        return null;
    }

    // logToFile("loot_tables", "Prepared loot-table pull: " + lootTablePath + " for player: " + player.getName() + ". Loot: " + JSON.stringify(loot));

    return {
        loot: loot,
        volatileClaims: context.claims
    };
}

/**
 * Permanently consumes all volatile entries selected by a prepared pull.
 *
 * @param {Object} pullResult
 * @returns {boolean}
 */
function commitLootTablePull(pullResult) {
    if (!pullResult) return false;
    var claims = pullResult.volatileClaims || [];
    if (claims.length === 0) return true;

    var groupedClaims = {};
    for (var i = 0; i < claims.length; i++) {
        var claim = claims[i];
        if (!groupedClaims[claim.lootTablePath]) {
            groupedClaims[claim.lootTablePath] = [];
        }
        groupedClaims[claim.lootTablePath].push(claim);
    }

    // Validate and stage EVERY claimed consumption before changing any loot file.
    var stagedTables = {};

    for (var path in groupedClaims) {
        if (!groupedClaims.hasOwnProperty(path)) continue;

        var lootTable = loadJson(path);
        if (!lootTable || !lootTable.pools) return false;

        // Collapse repeated claims for the same source entry. A stock-backed
        // entry can legitimately be selected more than once in one pull.
        var claimGroupsByKey = {};
        var pathClaims = groupedClaims[path];

        for (var c = 0; c < pathClaims.length; c++) {
            var currentClaim = pathClaims[c];
            var groupKey =
                currentClaim.poolIndex + ":" +
                currentClaim.entryIndex + ":" +
                currentClaim.entryIdentityJson + ":" +
                (currentClaim.usesStock ? "stock" : "single");

            if (!claimGroupsByKey[groupKey]) {
                claimGroupsByKey[groupKey] = {
                    poolIndex: currentClaim.poolIndex,
                    entryIndex: currentClaim.entryIndex,
                    entryJson: currentClaim.entryJson,
                    entryIdentityJson: currentClaim.entryIdentityJson,
                    usesStock: currentClaim.usesStock === true,
                    count: 0
                };
            }

            claimGroupsByKey[groupKey].count++;
        }

        var claimGroups = [];
        for (var groupName in claimGroupsByKey) {
            if (claimGroupsByKey.hasOwnProperty(groupName)) {
                claimGroups.push(claimGroupsByKey[groupName]);
            }
        }

        // Highest indexes first to avoid index shifts when entries are removed.
        claimGroups.sort(function(a, b) {
            if (a.poolIndex !== b.poolIndex) return b.poolIndex - a.poolIndex;
            return b.entryIndex - a.entryIndex;
        });

        for (var g = 0; g < claimGroups.length; g++) {
            var group = claimGroups[g];
            var pool = lootTable.pools[group.poolIndex];
            if (!pool || !pool.entries) return false;

            function matchesClaim(entry) {
                if (!entry) return false;

                if (group.usesStock) {
                    return getVolatileEntryIdentityJson(entry) ===
                        group.entryIdentityJson;
                }

                return JSON.stringify(entry) === group.entryJson;
            }

            var index = group.entryIndex;
            if (!matchesClaim(pool.entries[index])) {
                index = -1;

                for (var e = 0; e < pool.entries.length; e++) {
                    if (matchesClaim(pool.entries[e])) {
                        index = e;
                        break;
                    }
                }
            }

            if (index === -1) {
                logToFile(
                    "loot_tables",
                    "Volatile reward no longer available in " +
                    path + ". Pull cancelled."
                );
                return false;
            }

            if (group.usesStock) {
                var currentStock = getVolatileEntryStock(pool.entries[index]);

                if (currentStock === null || currentStock < group.count) {
                    logToFile(
                        "loot_tables",
                        "Not enough volatile stock remains in " +
                        path + ". Pull cancelled."
                    );
                    return false;
                }

                var remainingStock = currentStock - group.count;
                if (remainingStock === 0) {
                    pool.entries.splice(index, 1);
                } else {
                    pool.entries[index].stock = remainingStock;
                }
            } else {
                // Legacy volatile entries represent exactly one available copy.
                if (group.count !== 1) return false;
                pool.entries.splice(index, 1);
            }
        }

        stagedTables[path] = lootTable;
    }

    // Only write once every claim, including nested-table claims, is valid.
    // File I/O errors intentionally propagate.
    for (var savePath in stagedTables) {
        if (stagedTables.hasOwnProperty(savePath)) {
            saveJson(stagedTables[savePath], savePath);
        }
    }

    logToFile(
        "loot_tables",
        "Consumed " + claims.length + " volatile reward(s)."
    );
    return true;
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
function generateItemStackFromLootEntry(entry, world, player) {
    var itemstack = world.createItem(
        entry.id,
        entry.damage || 0,
        entry.count || 1
    );

    if (entry.nbt) {
        var nbt = API.stringToNbt(entry.nbt);
        itemstack = setNbtToItemStack(itemstack, nbt, world);
    }

    if (entry.modifier) {
        itemstack = create_modifier_item_stack(world, itemstack, entry.modifier);
        if (entry.modifier.modifierClass === "key" && !isCrateKeyModifier(itemstack)) {
            throw new Error("Failed to create crate-key modifier from loot entry: " + JSON.stringify(entry));
        }
    }

    if (entry.bindOwnerToPlayer) {
        if (!player || typeof player.getUUID !== "function") {
            throw new Error("set_owner requires a player in generateItemStackFromLootEntry: " + JSON.stringify(entry));
        }
        itemstack = bindItemToPlayer(itemstack, player);
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
    // if it doesn't start with "world/loot_tables/", add it
    if (!lootTablePath.startsWith("world/loot_tables/")) {
        lootTablePath = "world/loot_tables/" + lootTablePath;
    }
    var lootTable = loadJson(lootTablePath);
    if (!lootTable || !lootTable.pools) {
        return false;
    }

    for (var i = 0; i < lootTable.pools.length; i++) {
        var pool = lootTable.pools[i];
        if (pool.entries) {
            for (var j = 0; j < pool.entries.length; j++) {
                var entry = pool.entries[j];
                if (entry.type === "loot_table" && entry.path) {
                    if (isItemInLootTable(entry.path, itemId)) {
                        return true;
                    }
                } else if (entry.name === itemId) {
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

/**
 * Retrieves the maximum weight from a loot table.
 * @param {Object} lootTable - The loot table JSON object.
 * @returns {number} - The maximum weight found in the loot table, or 0 if no weights are found.
 */
function getMaxWeightFromLootTable(lootTable) {
    if (!lootTable || !lootTable.pools) {
        return 0;
    }

    var maxWeight = 0;
    for (var i = 0; i < lootTable.pools.length; i++) {
        var pool = lootTable.pools[i];
        if (pool.entries) {
            for (var j = 0; j < pool.entries.length; j++) {
                var entry = pool.entries[j];
                if (entry.weight && entry.weight > maxWeight) {
                    maxWeight = entry.weight;
                }
            }
        }
    }

    return maxWeight;
}

/**
 * Checks if a loot table exists at the specified path.
 * @param {string} lootTablePath - The path to the loot table file.
 * @returns {boolean} - True if the loot table exists, false otherwise.
 */
function doesLootTableExist(lootTablePath) {
    // if it doesn't start with "world/loot_tables/", add it
    if (!lootTablePath.startsWith("world/loot_tables/")) {
        lootTablePath = "world/loot_tables/" + lootTablePath;
    }
    var lootTable = loadJson(lootTablePath);
    return lootTable != null;
}

/**
 * Adds an entry to a loot table pool.
 *
 * The entry may be of any supported type:
 * item, loot_table, or future custom types.
 *
 * @param {string} lootTablePath
 * @param {Object} entry
 * @param {number} [poolIndex=0]
 * @param {boolean} [makeVolatile=false]
 * @returns {Object|null} The inserted entry, or null on failure.
 */
function addEntryToLootTable(lootTablePath, entry, poolIndex, makeVolatile) {
    if (poolIndex === undefined || poolIndex === null) {
        poolIndex = 0;
    }

    if (makeVolatile === undefined || makeVolatile === null) {
        makeVolatile = false;
    }

    var fullPath = lootTablePath;

    if (!fullPath.startsWith("world/loot_tables/")) {
        fullPath = "world/loot_tables/" + fullPath;
    }

    var lootTable = loadJson(fullPath);

    if (
        !lootTable ||
        !lootTable.pools ||
        !lootTable.pools[poolIndex] ||
        !lootTable.pools[poolIndex].entries
    ) {
        return null;
    }

    // Do not mutate the object supplied by the caller.
    var entryCopy = JSON.parse(JSON.stringify(entry));

    if (makeVolatile) {
        entryCopy.volatile = true;
    }

    lootTable.pools[poolIndex].entries.push(entryCopy);

    saveJson(lootTable, fullPath);

    logToFile("loot_tables", "Added entry to loot table: " + fullPath + " in pool index: " + poolIndex + ". Entry: " + JSON.stringify(entryCopy));

    return entryCopy;
}

function addVolatileEntryToLootTable(lootTablePath, entry, poolIndex) {
    return addEntryToLootTable(
        lootTablePath,
        entry,
        poolIndex,
        true
    );
}

/**
 * Checks whether a loot table can currently produce any loot.
 *
 * This works with volatile loot tables naturally: once all volatile
 * entries have been consumed and removed, the table becomes unavailable.
 *
 * Nested loot tables are checked recursively.
 * Circular references are protected against.
 *
 * @param {string} lootTablePath - Relative or full loot table path.
 * @param {Array<string>} [visited] - Internal recursion stack.
 * @returns {boolean} True if the loot table can produce loot.
 */
function canUseLootTable(lootTablePath, visited) {
    visited = visited || [];

    var fullPath = lootTablePath;

    if (!fullPath.startsWith("world/loot_tables/")) {
        fullPath = "world/loot_tables/" + fullPath;
    }

    // Prevent circular loot-table references.
    if (visited.indexOf(fullPath) !== -1) {
        return false;
    }

    if (!checkFileExists(fullPath)) {
        return false;
    }

    var lootTable = loadJson(fullPath);

    if (!lootTable || !lootTable.pools) {
        return false;
    }

    visited.push(fullPath);

    for (var p = 0; p < lootTable.pools.length; p++) {
        var pool = lootTable.pools[p];

        // A pool which can never roll cannot produce loot.
        if (pool.rolls === 0) {
            continue;
        }

        if (
            typeof pool.rolls === "object" &&
            pool.rolls.max !== undefined &&
            pool.rolls.max <= 0
        ) {
            continue;
        }

        if (!pool.entries || pool.entries.length === 0) {
            continue;
        }

        for (var e = 0; e < pool.entries.length; e++) {
            var entry = pool.entries[e];

            // A stock-backed volatile entry with no remaining stock cannot
            // currently produce loot. Legacy volatile entries have no stock field.
            if (entry.volatile === true) {
                var entryStock = getVolatileEntryStock(entry);
                if (entryStock !== null && entryStock <= 0) {
                    continue;
                }
            }

            // Nested table: usable only if something below it is usable.
            if (
                entry.type === "loot_table" &&
                entry.path
            ) {
                if (canUseLootTable(entry.path, visited)) {
                    visited.pop();
                    return true;
                }

                continue;
            }

            // Any ordinary entry can currently be selected.
            visited.pop();
            return true;
        }
    }

    visited.pop();
    return false;
}
