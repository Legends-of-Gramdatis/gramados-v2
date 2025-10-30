load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js');

function createTrade(npc, priceitem1, priceitem2, resultitem) {
    var trade_data = {}
    trade_data.input1 = priceitem1;
    trade_data.input2 = priceitem2;
    trade_data.output = resultitem;
    return trade_data;
}

function getTradeFromSlot(npc, column, line) {
    var trade_data = {}

    var slot_base = line * 3 + column

    trade_data.input1 = npc.getCompound("TraderCurrency").getList("NpcMiscInv", 10)[slot_base + 18]
    trade_data.input2 = npc.getCompound("TraderCurrency").getList("NpcMiscInv", 10)[slot_base]
    trade_data.output = npc.getCompound("TraderSold").getList("NpcMiscInv", 10)[slot_base]
}

function clearTrade(npc, column, line) {
    var slot_base = line * 3 + column

    npc.getCompound("TraderCurrency").getList("NpcMiscInv", 10).set(slot_base + 18, null)
    npc.getCompound("TraderCurrency").getList("NpcMiscInv", 10).set(slot_base, null)
    npc.getCompound("TraderSold").getList("NpcMiscInv", 10).set(slot_base, null)
}

/**
 * Populates a trader NPC's trades based on a loot table.
 * @param {ICustomNpc} npc - The trader NPC instance.
 * @param {string} lootTablePath - The path to the loot table.
 * @param {number} maxTrades - The maximum number of trades to populate.
 */
function populateTradesFromLootTable(npc, lootTablePath, maxTrades) {
    var world = npc.getWorld();
    var trades = []
    var loot = multiplePullLootTable(lootTablePath, null, maxTrades);
    for (var i = 0; i < loot.length; i++) {
        trades.push(
            generateItemStackFromLootEntry(loot[i], world)
        );
    }
}

/**
 * Reads all trades from a trader NPC.
 * @param {ICustomNpc} npc - The trader NPC instance.
 * @returns {Array<Object>} - An array of trade data.
 */
function readAllTrades(npc) {
    var trades = [];
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 6; j++) {
            var trade = getTradeFromSlot(npc, i, j);
            if (trade) {
                trades.push(trade);
            }
        }
    }
    return trades;
}

/**
 * Clears all trades from a trader NPC.
 * @param {ICustomNpc} npc - The trader NPC instance.
 */
function clearAllTrades(npc) {
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 6; j++) {
            clearTrade(npc, i, j);
        }
    }
}

/**
 * Reads a saved market JSON (NBT-as-JSON) from world/customnpcs/markets and returns
 * the list of items offered by the market (TraderSold entries), excluding any item
 * named exactly "§2§lMoney§r".
 *
 * The file uses NBT-style numeric suffixes (e.g., 1b, 0s), so we must use loadJavaJson.
 *
 * @param {string} marketNameOrPath - Market filename (e.g., 'food_state_hotel' or 'food_state_hotel.json')
 *                                    or a full/relative path. If only a name is provided, the file is
 *                                    read from 'world/customnpcs/markets/<name>.json'.
 * @returns {Array<Object>} Array of normalized item objects: { id, count, damage, name, raw }
 */
function readMarketItems(marketNameOrPath) {
    if (!marketNameOrPath || typeof marketNameOrPath !== 'string') return [];

    // Build file path
    var filePath = marketNameOrPath;
    var hasSlash = filePath.indexOf('/') >= 0 || filePath.indexOf('\\') >= 0;
    if (!hasSlash) {
        if (filePath.slice(-5).toLowerCase() !== '.json') filePath = filePath + '.json';
        filePath = 'world/customnpcs/markets/' + filePath;
    }

    var json = loadJavaJson(filePath);
    if (!json || !json.TraderSold || !json.TraderSold.NpcMiscInv) return [];

    var list = json.TraderSold.NpcMiscInv;
    var result = [];

    for (var i = 0; i < list.length; i++) {
        var it = list[i];
        if (!it || typeof it !== 'object') continue;

        var id = it.id || null;
        if (!id) continue;

        // Try to extract a display name if present
        var name = null;
        if (it.tag && it.tag.display && (it.tag.display.Name || it.tag.display.name)) {
            name = it.tag.display.Name || it.tag.display.name;
        } else if (it.display && (it.display.Name || it.display.name)) {
            name = it.display.Name || it.display.name;
        } else if (it.tag && (it.tag.Name || it.tag.name)) {
            name = it.tag.Name || it.tag.name;
        }

        // Exclude money placeholder items explicitly by name
        if (name === '§2§lMoney§r') continue;

        var count = (typeof it.Count !== 'undefined' && it.Count !== null) ? Number(it.Count) : 1;
        var damage = (typeof it.Damage !== 'undefined' && it.Damage !== null) ? Number(it.Damage) : 0;

        result.push({ id: String(id), count: count, damage: damage, name: name || null, raw: it });
    }

    return result;
}
