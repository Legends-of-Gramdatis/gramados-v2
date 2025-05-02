load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js");

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

/*
    for (var i = 0; i < 18; i++) {
        // tellPlayer(player, "Scanning item " + i + " in market " + marketName);
        var item_1 = null;
        var item_2 = null;
        var item_3 = null;
        var mult_1 = 1;
        var mult_2 = 1;
        if (traderCurrency[i] && traderCurrency[i].tag && traderCurrency[i].tag.display && traderCurrency[i].tag.display.Lore) {
            item_1 = traderCurrency[i].tag.display.Lore[0];
            mult_1 = traderCurrency[i].Count;
        }
        if (traderCurrency[i + 18] && traderCurrency[i + 18].tag && traderCurrency[i + 18].tag.display && traderCurrency[i + 18].tag.display.Lore) {
            item_2 = traderCurrency[i + 18].tag.display.Lore[0];
            mult_2 = traderCurrency[i + 18].Count;
        }
        if (TraderSold[i] && 
            !(  TraderSold[i].tag && 
                TraderSold[i].tag.display && 
                TraderSold[i].tag.display.Name && 
                TraderSold[i].tag.display.Name === "§2§lMoney§r"
            )
        ) {
            item_3 = TraderSold[i];
        }
        // tellPlayer(player, "input 1: " + item_1);
        // tellPlayer(player, "input 2: " + item_2);
        // tellPlayer(player, "output: " + JSON.stringify(item_3));

        extracted_data[i] = {
            item_1: item_1,
            mult_1: mult_1,
            item_2: item_2,
            mult_2: mult_2,
            item_3: item_3
        };

        // tellPlayer(player, "Extracted data: " + JSON.stringify(extracted_data));
    }
*/

















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
