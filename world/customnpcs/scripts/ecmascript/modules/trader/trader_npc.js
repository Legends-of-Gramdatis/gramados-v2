load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

var _LOOTTABLE_BANKVAULT_SAFE = "treasures/treasures_jewelry.json"
var MAX_TRADES = 10;

/**
 * Handles player interaction with the trader NPC.
 * @param {Object} event - The event object containing the player instance.
 */
function interact(event) {
    var npc = event.npc;

    // Example: Log current trades to the player
    var nbt = npc.getEntityNbt();
    // var nbtstring = nbt.toJsonString();

    var tradeResult = nbt.getCompound("TraderSold");
    var traderCurrency = nbt.getCompound("TraderCurrency");

    tradeResult = tradeResult.getList("NpcMiscInv", 10);
    traderCurrency = traderCurrency.getList("NpcMiscInv", 10);

    var index = 1;


    var nbtstring = tradeResult.length + " trades found.\n";
    var trade0 = tradeResult[index];
    nbtstring += "Trade 0: " + trade0.toJsonString() + "\n";
    var trade0_p1 = traderCurrency[index];
    var trade0_p2 = traderCurrency[index + 18];
    nbtstring += "Trade 0 price1: " + trade0_p1.toJsonString() + "\n";
    nbtstring += "Trade 0 price2: " + trade0_p2.toJsonString() + "\n";



    npc.say("Current nbt: " + nbtstring);
}
