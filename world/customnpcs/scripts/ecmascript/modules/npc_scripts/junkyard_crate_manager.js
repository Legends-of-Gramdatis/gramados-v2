load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");


function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var world = npc.getWorld();
    var playerName = player.getName();
    var jsonFilePath = "world/customnpcs/scripts/data/junkyard_purchases.json";

    // Check if the player has a job with the tag "Mechanic"
    if (!playerHasJobWithTag(player, "Mechanic")) {
        tellPlayer(player, "&c:cross: Sorry, only Mechanics are authorized to purchase a Junkyard Crate Crowbar. If you are interested, consider taking up the Mechanic job.");
        return;
    }

    // Load or create the JSON file
    var purchaseData = checkFileExists(jsonFilePath) ? loadJson(jsonFilePath) : {};

    // Get the current Minecraft day
    var currentDay = Math.floor(world.getTotalTime() / 24000);

    // Check if the player has already purchased a crowbar today
    if (purchaseData[playerName] && purchaseData[playerName] >= currentDay) {
        tellPlayer(player, "&c:cross: You have already purchased a crowbar today. Please come back tomorrow to buy another one.");
        return;
    }

    if (getMoneyFromPlayerPouch(player, 250000)) {
        var loot = pullLootTable(_LOOTTABLE_JUNKYARD_CRATE_CROWBAR, player);
        var crowbar = setupCrowbarNameLore(loot[0], world);
        player.giveItem(crowbar);
        tellPlayer(player, "&a:check: Thank you for your purchase! Here is your Junkyard Crate Crowbar. Use it to pry open sealed parts crates and discover valuable items inside.");

        // Update the purchase data and save it
        purchaseData[playerName] = currentDay;
        saveJson(purchaseData, jsonFilePath);
    } else {
        tellPlayer(player, "&c:cross: You need 2500g to buy the crowbar. Make sure you have enough money in your pouch before trying again.");
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