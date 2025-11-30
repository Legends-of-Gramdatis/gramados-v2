// Ore Scrap Buyer NPC
// Dynamically prices items based on ore composition using globals:
// - global_prices.json (item entries, optionally with `ore` and `value`)
// - ore_market.json (current metal prices per material)

// Utilities
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_crate.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js'); // provides getPrice & getScrapValue

// Constants
var GLOBAL_PRICES_PATH = 'world/customnpcs/scripts/globals/global_prices.json';
var ORE_MARKET_PATH = 'world/customnpcs/scripts/globals/ore_market.json';

// Crate/backpack IDs managed via utils_crate

var npc;
var world;

function init(event) {
    npc = event.npc;
    world = npc.getWorld();
    npc.say('Scrap Buyer ready. Hold a crate to sell.');
}

function interact(event) {
    var player = event.player;
    var held = player.getMainhandItem();
    if (!held || !held.getName) {
        npc.say('Please hold a crate/backpack to sell scrap.');
        return;
    }
    if (!crate_isSupported(held.getName())) {
        npc.say('Unsupported container. Hold a valid crate/backpack.');
        return;
    }

    // Pricing data loaded internally by getPrice; we retain legacy load for existence check fallback
    var pricingData = loadJsonSafe(GLOBAL_PRICES_PATH, {});

    var totalCents = 0;
    var soldMap = {};

    var entries = crate_readEntries(held);
    var crateStack = held.getStackSize();

    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var key = entry.id + ':' + entry.damage;
        var unitCents = getScrapValue(key, entry.tag, false);
        if (unitCents > 0) {
            var qty = entry.count * crateStack;
            totalCents += unitCents * qty;
            if (!soldMap[key]) { soldMap[key] = 0; }
            soldMap[key] += qty;
        }
    }

    if (totalCents <= 0) {
        npc.say('Nothing in this crate can be purchased by ore value.');
        return;
    }

    // Pay to pouch and clear purchased items
    addMoneyToCurrentPlayerPouch(player, totalCents);
    crate_clearSold(held, soldMap);

    npc.say(ccs('&aPurchased scrap for &6' + getAmountCoin(totalCents) + '&a; paid to your pouch.'));
}

function loadJsonSafe(path, def) {
    try {
        return loadJson(path);
    } catch (e) {
        logToFile('ore_scrap_buyer', 'Failed to load ' + path + ' :: ' + e);
        return def;
    }
}