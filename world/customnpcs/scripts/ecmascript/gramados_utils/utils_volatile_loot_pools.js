load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');

var VOLATILE_LOOT_POOL_CONFIG_PATH = 'world/customnpcs/scripts/data/volatile_loot_pools.json';

/**
 * Loads the volatile loot pool alias configuration.
 *
 * @returns {Object|null} Config object, or null if unavailable.
 */
function loadVolatileLootPoolConfig() {
    if (!checkFileExists(VOLATILE_LOOT_POOL_CONFIG_PATH)) {
        return null;
    }

    return loadJson(VOLATILE_LOOT_POOL_CONFIG_PATH);
}

/**
 * Resolves a volatile loot pool alias case-insensitively.
 *
 * @param {string} alias - Configured pool alias.
 * @returns {Object|null} Resolved pool config with its canonical alias.
 */
function getVolatileLootPoolConfig(alias) {
    var config = loadVolatileLootPoolConfig();
    if (!config || alias === undefined || alias === null) {
        return null;
    }

    var wantedAlias = alias.toLowerCase();

    for (var configuredAlias in config) {
        if (configuredAlias.toLowerCase() === wantedAlias) {
            var poolConfig = config[configuredAlias] || {};

            if (!poolConfig.LootTablePath) {
                return null;
            }

            return {
                Alias: configuredAlias,
                LootTablePath: poolConfig.LootTablePath,
                WhitelistLootTable: poolConfig.WhitelistLootTable || null,
                PoolIndex: poolConfig.PoolIndex === undefined ? 0 : poolConfig.PoolIndex
            };
        }
    }

    return null;
}

/**
 * Compacts an NBT JSON string while preserving whitespace inside quoted strings.
 *
 * @param {string} nbtString - NBT JSON produced by INbt#toJsonString().
 * @returns {string} Compact NBT JSON.
 */
function compactVolatileLootNbtString(nbtString) {
    if (!nbtString || typeof nbtString !== 'string') {
        return nbtString;
    }

    var result = '';
    var inString = false;
    var escaped = false;

    for (var i = 0; i < nbtString.length; i++) {
        var c = nbtString.charAt(i);

        if (inString) {
            result += c;

            if (escaped) {
                escaped = false;
            } else if (c === '\\') {
                escaped = true;
            } else if (c === '"') {
                inString = false;
            }

            continue;
        }

        if (c === '"') {
            inString = true;
            result += c;
            continue;
        }

        if (c === ' ' || c === '\t' || c === '\r' || c === '\n') {
            continue;
        }

        result += c;
    }

    return result;
}

/**
 * Returns an ItemStack's metadata/damage value across supported API variants.
 *
 * @param {IItemStack} itemStack
 * @returns {number}
 */
function getVolatileLootItemDamage(itemStack) {
    if (!itemStack) {
        return 0;
    }

    if (typeof itemStack.getItemDamage === 'function') {
        return itemStack.getItemDamage();
    }

    if (typeof itemStack.getDamage === 'function') {
        return itemStack.getDamage();
    }

    return 0;
}

/**
 * Creates a conventional loot-table item entry from one ItemStack instance.
 * The stack count is deliberately ignored: one submitted item creates one entry.
 *
 * @param {IItemStack} itemStack
 * @param {number} weight
 * @returns {Object}
 */
function createVolatileLootEntryFromItemStack(itemStack, weight) {
    var entry = {
        type: 'item',
        name: itemStack.getName(),
        weight: weight,
        volatile: true
    };

    var functions = [];
    var damage = getVolatileLootItemDamage(itemStack);

    if (damage !== 0) {
        functions.push({
            function: 'set_data',
            data: damage
        });
    }

    if (itemStack.hasNbt()) {
        functions.push({
            function: 'set_nbt',
            tag: compactVolatileLootNbtString(itemStack.getNbt().toJsonString())
        });
    }

    if (functions.length > 0) {
        entry.functions = functions;
    }

    return entry;
}

/**
 * Adds an entry to a configured volatile loot table without producing a verbose
 * NBT log. Higher-level callers should log the human-facing alias/item context.
 *
 * @param {Object} poolConfig - Result from getVolatileLootPoolConfig().
 * @param {Object} entry - Conventional loot-table entry.
 * @returns {Object|null} Inserted entry, or null on failure.
 */
function injectEntryIntoVolatileLootPool(poolConfig, entry) {
    var fullPath = poolConfig.LootTablePath;

    if (!fullPath.startsWith('world/loot_tables/')) {
        fullPath = 'world/loot_tables/' + fullPath;
    }

    if (!checkFileExists(fullPath)) {
        return null;
    }

    var lootTable = loadJson(fullPath);
    var poolIndex = poolConfig.PoolIndex;

    if (
        !lootTable ||
        !lootTable.pools ||
        !lootTable.pools[poolIndex] ||
        !lootTable.pools[poolIndex].entries
    ) {
        return null;
    }

    var entryCopy = JSON.parse(JSON.stringify(entry));
    entryCopy.volatile = true;

    lootTable.pools[poolIndex].entries.push(entryCopy);

    try {
        saveJson(lootTable, fullPath);
    } catch (e) {
        return null;
    }

    return entryCopy;
}

/**
 * Validates and inserts one ItemStack instance into a configured volatile pool.
 * This function never changes the player's inventory.
 *
 * @param {string} alias - Configured volatile loot pool alias.
 * @param {IItemStack} itemStack - Item instance to serialize.
 * @param {number} weight - Conventional loot-table weight.
 * @returns {Object} Result object with Success/Reason/Alias/Entry fields.
 */
function addItemStackToVolatileLootPool(alias, itemStack, weight) {
    var numericWeight = Number(weight);

    if (!isFinite(numericWeight) || numericWeight <= 0) {
        return {
            Success: false,
            Reason: 'invalid_weight'
        };
    }

    if (!itemStack || itemStack.isEmpty()) {
        return {
            Success: false,
            Reason: 'empty_hand'
        };
    }

    var poolConfig = getVolatileLootPoolConfig(alias);

    if (!poolConfig) {
        return {
            Success: false,
            Reason: 'unknown_alias'
        };
    }

    if (poolConfig.WhitelistLootTable) {
        if (!doesLootTableExist(poolConfig.WhitelistLootTable)) {
            return {
                Success: false,
                Reason: 'invalid_whitelist',
                Alias: poolConfig.Alias
            };
        }

        if (!isItemInLootTable(poolConfig.WhitelistLootTable, itemStack.getName())) {
            return {
                Success: false,
                Reason: 'not_whitelisted',
                Alias: poolConfig.Alias
            };
        }
    }

    var entry = createVolatileLootEntryFromItemStack(itemStack, numericWeight);
    var insertedEntry = injectEntryIntoVolatileLootPool(poolConfig, entry);

    if (!insertedEntry) {
        return {
            Success: false,
            Reason: 'write_failed',
            Alias: poolConfig.Alias
        };
    }

    return {
        Success: true,
        Reason: null,
        Alias: poolConfig.Alias,
        Entry: insertedEntry
    };
}
