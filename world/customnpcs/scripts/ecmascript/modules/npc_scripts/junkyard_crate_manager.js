load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");

var crowbarPrice = 150000; // Price of the crowbar in grams


function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var world = npc.getWorld();
    var playerName = player.getName();
    var jsonFilePath = "world/customnpcs/scripts/data/junkyard_purchases.json";

    // Check if the player has a job with the tag "Mechanic"
    if (!playerHasJobWithTag(player, "Mechanic")) {
        storytellPlayer(player, ["&7[&c✖&7] &fHey — this isn't a tourist trap. &cOnly certified mechanics are allowed to buy crowbars around here.","&r&8(If you're serious, maybe consider taking up the Mechanic job.)"]);
        return;
    }

    // Load or create the JSON file
    var purchaseData = checkFileExists(jsonFilePath) ? loadJson(jsonFilePath) : {};

    // Get the current Minecraft day
    var currentDay = Math.floor(world.getTotalTime() / 24000);

    // Check if the player has already purchased a crowbar today
    if (purchaseData[playerName] && purchaseData[playerName] >= currentDay) {
        storytellPlayer(player, ["&7[&c✖&7] &fWoah there, no double-dipping.","&r&fYou've already had your daily crate pull. Come back tomorrow, alright?"]);
        return;
    }

    if (getMoneyFromPlayerPouch(player, crowbarPrice)) {
        var loot = pullLootTable(_LOOTTABLE_JUNKYARD_CRATE_CROWBAR, player);
        var crowbar = setupCrowbarNameLore(loot[0], world);
        player.giveItem(crowbar);
        storytellPlayer(player, ["&7[&a✔&7] &fDeal's done. Here's your crowbar — one-use only, so make it count.","&8Check the crates behind the fence. You never know what you'll find."]);
        logToFile("mechanics", playerName + " purchased a Junkyard Crate Crowbar for " + getAmountCoin(crowbarPrice));

        // Update the purchase data and save it
        purchaseData[playerName] = currentDay;
        saveJson(purchaseData, jsonFilePath);
    } else {
        storytellPlayer(player, ["&7[&c✖&7] &fSorry, pal. &cThat crowbar costs " + getAmountCoin(crowbarPrice) + ".","&r&8Check your pouch and try again when you've got the funds."]);
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