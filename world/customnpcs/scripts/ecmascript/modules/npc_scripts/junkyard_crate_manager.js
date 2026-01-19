load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js");

var crowbarPrice = 50000; // in cents (500g)
var COOLDOWN_MINUTES = 10;   // purchase cooldown in IRL minutes
var jsonFilePath = "world/customnpcs/scripts/data_auto/junkyard_purchases.json";

function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var world = npc.getWorld();
    var playerName = player.getName();

    // Require Mechanic job
    if (!playerHasJobWithTag(player, "Mechanic")) {
        storytellPlayer(player, [
            "&7[&c✖&7] &fHey — this isn't a tourist trap. &cOnly certified mechanics are allowed to buy crowbars around here.",
            "&r&8(If you're serious, maybe consider taking up the Mechanic job.)"
        ]);
        return;
    }

    // Load JSON cooldown data
    var purchaseData = checkFileExists(jsonFilePath) ? loadJson(jsonFilePath) : {};

    // Current real-world timestamp (ms)
    var now = Date.now();
    var cooldownMs = COOLDOWN_MINUTES * 20 * 60 * 60;

    // === Phone check (info only)
    if (!player.getMainhandItem().isEmpty() && isItemInLootTable("world/loot_tables/" + _LOOTTABLE_CELLPHONES, player.getMainhandItem().getName())) {
        if (purchaseData[playerName] && now < purchaseData[playerName]) {
            var msLeft = purchaseData[playerName] - now;
            var ticksLeft = Math.floor(msLeft / 50); // convert ms to ticks
            storytellPlayer(player, [
                "&7[&c✖&7] &fHold on, champ. You need to wait &e" + TicksToHumanReadable(ticksLeft) + "&f before you can buy another crowbar."
            ]);
        } else {
            storytellPlayer(player, ["&7[&a✔&7] &fYou're good to go! You can buy a crowbar now."]);
        }
        return;
    }

    // === Cooldown check
    if (purchaseData[playerName] && now < purchaseData[playerName]) {
        var msLeft = purchaseData[playerName] - now;
        var ticksLeft = Math.floor(msLeft / 50);
        storytellPlayer(player, [
            "&7[&c✖&7] &fWoah there, no double-dipping.",
        ]);
        return;
    }

    // === Payment and crowbar delivery
    if (extractMoneyFromPouch(player, crowbarPrice)) {
        var loot = pullLootTable(_LOOTTABLE_JUNKYARD_CRATE_CROWBAR, player);
        var crowbar = setupCrowbarNameLore(loot[0], world);
        player.giveItem(crowbar);

        storytellPlayer(player, [
            "&7[&a✔&7] &fDeal's done. Here's your crowbar — one-use only, so make it count.",
            "&8Check the crates behind the fence. You never know what you'll find."
        ]);
        logToFile("mechanics", playerName + " purchased a Junkyard Crate Crowbar for " + getAmountCoin(crowbarPrice));

        // Save cooldown end time (now + cooldownMs)
        purchaseData[playerName] = now + cooldownMs;
        saveJson(purchaseData, jsonFilePath);

    } else {
        storytellPlayer(player, [
            "&7[&c✖&7] &fSorry, pal. &cThat crowbar costs " + getAmountCoin(crowbarPrice) + ".",
            "&r&8Check your pouch and try again when you've got the funds."
        ]);
        return;
    }
}

function setupCrowbarNameLore(loot_entry, world) {
    var item = generateItemStackFromLootEntry(loot_entry, world);
    item.setCustomName("§6Junkyard Crate Crowbar");
    item.setLore([
        "§7One-use crowbar to pry open a sealed parts crate.",
        "§8Marked by the Junkyard Authority.",
        "§2§o\"Snap it, loot it, toss it.\""
    ]);
    return item;
}
