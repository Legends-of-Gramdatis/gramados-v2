load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");

var API = Java.type("noppes.npcs.api.NpcAPI").Instance();

/**
 * Handles NPC interaction to fix engine runtime hours.
 * @param {IPlayer} player - The player interacting with the NPC.
 * @param {INpc} npc - The NPC being interacted with.
 */
function interact(event) {
    var player = event.player;
    var npc = event.npc;

    var stored_data = npc.getStoreddata();
    var heldItem = player.getMainhandItem();

    if (heldItem.getName() == "minecraft:command_block") {
        var commandBlockName = heldItem.getDisplayName();
        commandBlockName = "world/loot_tables/" + commandBlockName;
        stored_data.put("loot_table", commandBlockName);
        npc.say("Loot table set to: " + commandBlockName);
        return;
    }

    if (heldItem.getName() == "minecraft:barrier") {
        stored_data.clear();
        npc.say("All stored data has been cleared.");
        return;
    }

    if (!stored_data.has("loot_table")) {
        npc.say("I am not set up yet. Please ask an Administrator to set me up with a loot table.");
        return;
    }

    if (!heldItem || heldItem.isEmpty()) {
        npc.say("Hello! I can fix engines for you. Just hold an engine item in your hand and interact with me.");
        return;
    }

    var itemId = heldItem.getName();
    var itemNbt = heldItem.getNbt();

    if (!itemNbt || !itemNbt.has("hours")) {
        npc.say("I specialize in fixing engines. Please hold an engine item with runtime hours in your hand and try again.");
        return;
    }

    var hours = itemNbt.getDouble("hours");
    if (hours <= 20) {
        npc.say("Your engine looks good, mate.");
        return;
    }

    var lootTablePath = stored_data.get("loot_table");

    if (!lootTablePath || !isItemInLootTable(lootTablePath, itemId)) {
        npc.say("This engine cannot be fixed by me.");
        return;
    }

    var lootTable = loadJson(lootTablePath);
    var weight = getItemWeightFromLootTable(lootTable, itemId);
    if (weight === null) {
        npc.say("Failed to determine the engine's weight.");
        return;
    }

    var maxWeight = getMaxWeightFromLootTable(lootTable);
    var hoursToFix = hours - 20;
    var cost = Math.round(hoursToFix * (maxWeight + 1 - weight)) * 300;

    if (!getMoneyFromPlayerPouch(player, cost)) {
        npc.say("You don't have enough money to fix this engine. Cost: " + getAmountCoin(cost));
        return;
    }

    itemNbt.setDouble("hours", 20);
    npc.say("Your engine has been fixed for " + getAmountCoin(cost) + ".");
}
