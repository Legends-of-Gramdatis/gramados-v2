load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_region_gadgets.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js");

// Load module configuration
var config = loadJson("world/customnpcs/scripts/ecmascript/modules/junkyard/config.json") || {};
var CROWBAR_PRICE_CENTS = config.CROWBAR_PRICE_CENTS;
var CROWBAR_COOLDOWN_MINUTES = config.CROWBAR_COOLDOWN_MINUTES;
var jsonFilePath = "world/customnpcs/scripts/data_auto/junkyard_purchases.json";
var MECHANIC_JOB_ID = 66;

function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var world = npc.getWorld();
    var playerName = player.getName();

    // Require Mechanic job
    if (!playerHasJobWithTag(player, "Mechanic")) {
        npc.say("§fThis stall is guild stock only. Get yourself signed in with the §6Mechanics' Union§f, then we talk tools.");
        return;
    }

    // Load JSON cooldown data
    var purchaseData = checkFileExists(jsonFilePath) ? loadJson(jsonFilePath) : {};

    // Current real-world timestamp (ms)
    var now = Date.now();
    var cooldownMinutes = getAdjustedCrowbarCooldownMinutes(player);
    var cooldownMs = cooldownMinutes * 60 * 1000;

    // === Phone check (info only)
    if (!player.getMainhandItem().isEmpty() && isItemInLootTable("world/loot_tables/" + _LOOTTABLE_CELLPHONES, player.getMainhandItem().getName())) {
        if (purchaseData[playerName] && now < purchaseData[playerName]) {
            var msLeft = purchaseData[playerName] - now;
            var ticksLeft = Math.floor(msLeft / 50); // convert ms to ticks
            npc.say("§fYour next crowbar clears in §e" + TicksToHumanReadable(ticksLeft, true) + "§f. No exceptions.");
            maybeSayGarageHint(npc);
        } else {
            npc.say("§fYou're clear. I can sell you a fresh crowbar right now.");
        }
        return;
    }

    // === Cooldown check
    if (purchaseData[playerName] && now < purchaseData[playerName]) {
        var msLeft = purchaseData[playerName] - now;
        var ticksLeft = Math.floor(msLeft / 50);
        npc.say("§fEasy there. You're still on cooldown for §e" + TicksToHumanReadable(ticksLeft, true) + "§f.");
        maybeSayGarageHint(npc);
        return;
    }

    // === Payment and crowbar delivery
    if (extractMoneyFromPouch(player, CROWBAR_PRICE_CENTS)) {
        var loot = pullLootTable(_LOOTTABLE_JUNKYARD_CRATE_CROWBAR, player);
        var crowbar = setupCrowbarNameLore(loot[0], world);
        player.giveItem(crowbar);

        npc.say("§fDeal made. §6One crowbar, one crate§f. Make the pull count.");
        npc.say("§8The stacks behind the fence still hide good metal if you know where to pry.");
        logToFile("mechanics", playerName + " purchased a Junkyard Crate Crowbar for " + getAmountCoin(CROWBAR_PRICE_CENTS));

        // Save cooldown end time (now + cooldownMs)
        purchaseData[playerName] = now + cooldownMs;
        saveJson(purchaseData, jsonFilePath);

    } else {
        npc.say("§fPrice is §6" + getAmountCoin(CROWBAR_PRICE_CENTS) + "§f. Come back when your pouch is heavier.");
        return;
    }
}

function maybeSayGarageHint(npc) {
    if (Math.random() < 0.23) {
        npc.say("§8Between us? Bigger mechanic coverage means shorter cooldowns. Expand your garage footprint and I'll clear you faster.");
    }
}

function getAdjustedCrowbarCooldownMinutes(player) {
    var grantedReasons = getRegionNameThatGrantedJob(player, MECHANIC_JOB_ID);
    var allRegionPrices = 0;

    for (var i = 0; i < grantedReasons.length; i++) {
        allRegionPrices += getRegionPrice(grantedReasons[i], player);
    }

    var cooldownMinutes = CROWBAR_COOLDOWN_MINUTES;
    if (allRegionPrices > 30000000) {
        var diff = allRegionPrices - 30000000;
        var lessMinutes = Math.floor(diff / 5000000);
        cooldownMinutes = Math.max(2, cooldownMinutes - lessMinutes);
    }

    return cooldownMinutes;
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
