load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_emotes.js')
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js')


var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var FileUtils = Java.type('java.nio.file.Files');
var Paths = Java.type('java.nio.file.Paths');

var config = loadJson("world/customnpcs/scripts/ecmascript/modules/item_expertise/gem_config.json");

function interact(event) {
    var player = event.player;
    var npc = event.npc;

    if (!player.hasReadDialog(560)) {
        return;
    }

    if (player.getExpLevel() < config.expertise_exp) {
        tellPlayer(player, "§c:cross: You do not have enough levels to proceed with this interaction.");
        npc.executeCommand("/playsound minecraft:block.anvil.land block @a ~ ~ ~ 10 1");
        return;
    }

    var heldItem = player.getMainhandItem();

    if (heldItem.isEmpty()) {
        tellPlayer(player, "§c:cross: You must hold an item in your main hand to use this expertise.");
        npc.executeCommand("/playsound minecraft:block.anvil.land block @a ~ ~ ~ 10 1");
        return;
    }
    
    var possible_items = config.items;
    var heldItemTxt = heldItem.getName() + ":" + heldItem.getItemDamage();

    if (getJsonValue(possible_items, heldItemTxt) == null) {
        tellPlayer(player, "§c:cross: This item cannot be enhanced with gem expertise.");
        npc.executeCommand("/playsound minecraft:block.anvil.land block @a ~ ~ ~ 10 1");
        return;
    }

    var lore = heldItem.getLore();
    if (lore && lore.length > 0) {
        for (var i = 0; i < lore.length; i++) {
            if (lore[0].toLowerCase().indexOf("[appraisal notice]") > -1) {
                expertiseItem(npc, heldItem, player, world);
                return;
            } else if (lore[0].toLowerCase().indexOf("[expertised]") > -1) {
                tellPlayer(player, "§c:cross: This item has already been expertised and cannot be enhanced further.");
                npc.executeCommand("/playsound minecraft:block.anvil.land block @a ~ ~ ~ 10 1");
                return;
            }

            tellPlayer(player, "§c:cross: This item cannot be enhanced with gem expertise.");
            npc.executeCommand("/playsound minecraft:block.anvil.land block @a ~ ~ ~ 10 1");
            return;
        }
    }

    npc.executeCommand("/playsound minecraft:entity.experience_orb.pickup master @a ~ ~ ~ 1 1");
    player.giveItem(generateExpertisableItem(heldItem, player));
}

function generateExpertisableItem(heldItem, player) {
    var itemStack = heldItem.copy();
    var itemName = itemStack.getName();
    var enhancedItem = world.createItem(itemStack.getName(), itemStack.getItemDamage(), 1);
    itemStack.setStackSize(itemStack.getStackSize() - 1); // Reduce the count by 1
    player.setMainhandItem(itemStack);

    enhancedItem.setLore([
        "§7[Appraisal Notice]",
        parseEmotes("§8Estimated fee: §r:money:§6" + getAmountCoin(getPrice(itemName, 50000, null, true) * config.expertise_rate)),
        "§8Evaluation pending. Expert review required."
    ]);
    return enhancedItem;
}

function expertiseItem(npc, itemStack, player, world) {
    var lore = itemStack.getLore();
    var expertiseLine = lore[1]; // e.g. "Estimated fee: §r:money:§6Xg"
    var feeString = expertiseLine.replace(/§[0-9a-fklmnor]/gi, '').match(/Estimated fee:.*?(\d+(\.\d+)?)/);
    
    if (!feeString || !feeString[1]) {
        tellPlayer(player, "§cSomething's wrong with the appraisal tag on this item.");
        npc.executeCommand("/playsound minecraft:block.anvil.land block @a ~ ~ ~ 10 1");
        return;
    }

    var fee = parseFloat(feeString[1]) * 100; // Convert to cents
    if (!getMoneyFromPlayerPouch(player, fee)) {
        tellPlayer(player, "§c:cross: You don't have enough to pay the expertise fee.");
        npc.executeCommand("/playsound minecraft:block.anvil.land block @a ~ ~ ~ 10 1");
        return;
    }

    var fullId = itemStack.getName() + ":" + itemStack.getItemDamage();
    var variables = config.items[fullId];
    if (!variables) {
        tellPlayer(player, "§cThis item can no longer be evaluated.");
        npc.executeCommand("/playsound minecraft:block.anvil.land block @a ~ ~ ~ 10 1");
        return;
    }

    npc.executeCommand("/playsound minecraft:entity.player.levelup block @a ~ ~ ~ 1 1");
    logToFile("economy", player.getName() + " paid " + getAmountCoin(fee) + " for expertise of item: " + fullId);

    // Reduce stack and isolate one item
    var reducedStack = itemStack.copy();
    var expertisedItem = world.createItem(itemStack.getName(), itemStack.getItemDamage(), 1);
    reducedStack.setStackSize(reducedStack.getStackSize() - 1);
    player.setMainhandItem(reducedStack);

    // Generate expertise values
    var qualityScore = 0;
    var weightSum = 0;
    var displayLines = [];
    var swing = (Math.random() < 0.9) ? (Math.random() * 0.4 + 0.8) : (Math.random() * 1.0 + 0.5);
    swing = Math.round(swing * 1000) / 1000;

    for (var i = 0; i < variables.length; i++) {
        var v = variables[i];
        var val = 0;
        var score = 0;
        var weight = 0;

        if (v === "purity") {
            val = Math.round((Math.random() * 0.75 + 0.25) * 100) / 100;
            score = val;
            weight = 0.2;
        } else if (v === "clarity") {
            val = Math.round((Math.random() * 9 + 1) * 10) / 10;
            score = val;
            weight = 5;
        } else if (v === "weight") {
            val = Math.round((Math.random() * 9 + 1) * 10) / 10;
            score = val;
            weight = 4;
        } else if (v === "color_grade") {
            val = Math.round((Math.random() * 0.5 + 0.5) * 100) / 100;
            score = val;
            weight = 0.25;
        } else if (v === "lightness") {
            val = Math.round((Math.random() * 99 + 1) * 100) / 100;
            score = val;
            weight = 20;
        } else if (v === "resonance") {
            val = Math.round((Math.random() * 99 + 1) * 100) / 100;
            score = val;
            weight = 20;
        }

        qualityScore += score;
        weightSum += weight;

        displayLines.push("§8" + v.charAt(0).toUpperCase() + v.slice(1) + ": §7" + val);
    }

    qualityScore = qualityScore / weightSum;
    qualityScore = Math.min(Math.max(qualityScore, 0.6), 1.25);

    // Do NOT show estimated value anymore
    var newLore = [];
    newLore.push("§7[Expertised]");
    Array.prototype.push.apply(newLore, displayLines);
    newLore.push("§8Valuation sealed by expert authority.");

    expertisedItem.setLore(newLore);
    player.giveItem(expertisedItem);

    tellPlayer(player, "§aYour item has been carefully expertised.");
    npc.executeCommand("/playsound minecraft:block.note_block.pling block @a ~ ~ ~ 10 1");
}
