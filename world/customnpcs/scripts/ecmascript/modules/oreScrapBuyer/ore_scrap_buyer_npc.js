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
var PRESETS_PATH = 'world/customnpcs/scripts/ecmascript/modules/oreScrapBuyer/presets.json';

// Crate/backpack IDs managed via utils_crate

var npc;
var world;
var PRESETS_DATA = {};
var CURRENT_PRESET = null; // null = no preset selected (requires admin to set)

function init(event) {
    npc = event.npc;
    world = npc.getWorld();
    // Load presets (create default file if missing was done earlier when committing preset file)
    PRESETS_DATA = loadJson(PRESETS_PATH);

    // Restore stored preset if present
    var sd = npc.getStoreddata();
    if (sd.has('ore_scrap_preset')) {
        var stored = sd.get('ore_scrap_preset');
        if (stored && stored !== '') {
            CURRENT_PRESET = stored;
            // Friendly RP-ready confirmation
            var presetPretty = (PRESETS_DATA && PRESETS_DATA.presets && PRESETS_DATA.presets[CURRENT_PRESET] && PRESETS_DATA.presets[CURRENT_PRESET].display_name) ? PRESETS_DATA.presets[CURRENT_PRESET].display_name : CURRENT_PRESET;
            npc.say('&aAll set - I have my instructions. I will accept: ' + presetPretty + '. Hold a crate and I shall appraise it.');
        } else {
            CURRENT_PRESET = null;
            npc.say("&eI'm terribly sorry - I haven't been given my orders. My supervisor never told me which metals to accept. Please ask the server's superiors (admins) to set my preset.");
        }
    } else {
        CURRENT_PRESET = null;
        npc.say("&eAh, my ledger is empty - I don't know which ores I'm allowed to buy. Please have a superior (an admin) set my preset.");
    }
}

function interact(event) {
    var player = event.player;
    var offItem = player.getOffhandItem();
    var mainItem = player.getMainhandItem();

    // Admin controls: when admin holds Seagull ID card in offhand
    if (offItem && !offItem.isEmpty() && offItem.getName && offItem.getName() == 'mts:ivv.idcard_seagull') {
        // Cycle presets with a command block in main hand
        if (mainItem && !mainItem.isEmpty() && mainItem.getName && mainItem.getName() == 'minecraft:command_block') {
            var presetNames = ['none'].concat(Object.keys((PRESETS_DATA && PRESETS_DATA.presets) ? PRESETS_DATA.presets : {}));
            var currentKey = CURRENT_PRESET ? CURRENT_PRESET : 'none';
            var idx = presetNames.indexOf(currentKey);
            var next = presetNames[(idx + 1) % presetNames.length];
            if (next === 'none') {
                CURRENT_PRESET = null;
                npc.getStoreddata().put('ore_scrap_preset', '');
                npc.say('&c[Admin] Preset cleared; NPC will not buy any ores until configured.');
            } else {
                CURRENT_PRESET = next;
                npc.getStoreddata().put('ore_scrap_preset', CURRENT_PRESET);
                npc.say('&6[Admin] Preset set to: ' + CURRENT_PRESET);
            }
            return; // don't process sale when admin is cycling config
        }

        // Remove preset (unset) when barrier block is held in mainhand
        if (mainItem && !mainItem.isEmpty() && mainItem.getName && mainItem.getName() == 'minecraft:barrier') {
            CURRENT_PRESET = null;
            npc.getStoreddata().put('ore_scrap_preset', '');
            npc.say('&c[Admin] Preset removed; NPC will not buy any ores until configured.');
            return;
        }
    }

    var held = player.getMainhandItem();
    if (!held || !held.getName) {
        npc.say("&eIf you'd like me to appraise scrap, hold a crate or backpack in your hand and I'll take a look.");
        return;
    }
    if (!crate_isSupported(held.getName())) {
        npc.say("That item doesn't look like one of my approved containers. Please hold a proper crate or backpack.");
        return;
    }

    // Pricing data loaded internally by getPrice; we retain legacy load for existence check and ore components
    var pricingData = loadJson(GLOBAL_PRICES_PATH);

    // Validate preset: if no preset selected, refuse service
    if (!CURRENT_PRESET) {
        npc.say("I can't take ores right now - my manager hasn't provided instructions. Please ask a superior (an admin) to configure me before I can buy scrap.");
        return;
    }

    var presetObj = (PRESETS_DATA && PRESETS_DATA.presets && PRESETS_DATA.presets[CURRENT_PRESET]) ? PRESETS_DATA.presets[CURRENT_PRESET] : null;
    var allowedOres = [];
    if (presetObj && presetObj.ores && presetObj.ores.length > 0) {
        allowedOres = presetObj.ores.slice(); // array of strings like 'ore:iron'
    }

    var totalEarnings = 0;
    var soldMap = {};
    var detailMap = {}; // key -> { qty, unitCents }

    var entries = crate_readEntries(held);
    var crateStack = held.getStackSize();

    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var key = entry.id + ':' + entry.damage;
        // Attempt to inspect the global_prices entry to determine ore components
        var uniqueKey = (entry.tag ? (key + '|' + JSON.stringify(entry.tag)) : key);
        var entryData = null;
        if (pricingData.hasOwnProperty(uniqueKey)) {
            entryData = pricingData[uniqueKey];
        } else if (pricingData.hasOwnProperty(key)) {
            entryData = pricingData[key];
        }

        // if no ore data is available in the pricing entry, try getScrapValue directly but still require ore components
        var hasOreComponents = false;
        var comps = [];
        if (entryData && entryData.ore && typeof entryData.ore === 'object') {
            hasOreComponents = true;
            for (var c in entryData.ore) { if (entryData.ore.hasOwnProperty(c)) comps.push('ore:' + c); }
        }

        if (!hasOreComponents) {
            // No ore composition available in price table -> skip
            continue;
        }

        // Require that all components are allowed by the current preset
        var allAllowed = true;
        for (var ci = 0; ci < comps.length; ci++) {
            if (allowedOres.indexOf(comps[ci]) === -1) {
                allAllowed = false;
                break;
            }
        }
        if (!allAllowed) { continue; }

        var unitCents = getScrapValue(key, entry.tag, false);
        if (unitCents && unitCents > 0) {
            var qty = entry.count * crateStack;
            totalEarnings += unitCents * qty;
            if (!soldMap[key]) { soldMap[key] = 0; }
            soldMap[key] += qty;
            if (!detailMap[key]) { detailMap[key] = { qty: 0, unitCents: unitCents }; }
            detailMap[key].qty += qty;
        }
    }

    if (totalEarnings <= 0) {
        npc.say("I took a good look, but there's nothing here I can buy for ore value. Perhaps your manager kept the good stuff?");
        return;
    }
    var presetPretty = (presetObj && presetObj.display_name) ? presetObj.display_name : (CURRENT_PRESET || 'none');
    add_scrap_log(player, held.getName(), detailMap, totalEarnings, CURRENT_PRESET, presetPretty);

    addMoneyToCurrentPlayerPouch(player, totalEarnings);
    crate_clearSold(held, soldMap);

    npc.say(ccs('&aPleasure doing business - I paid you &6' + getAmountCoin(totalEarnings) + '&a to your pouch.'));
}

// Logs a concise line to economy.log and a detailed per-player entry to economy.json
function add_scrap_log(player, containerName, detailMap, totalEarnings, presetKey, presetDisplay) {
    var playerName = player.getName();
    var keys = [];
    var totalCount = 0;
    for (var k in detailMap) {
        if (!detailMap.hasOwnProperty(k)) continue;
        keys.push(k);
        totalCount += (detailMap[k].qty || 0);
    }
    var logline = playerName + ' sold ' + totalCount + ' items of ' + keys.length + ' types as scrap (' + presetDisplay + ') for ' + getAmountCoin(totalEarnings);
    logToFile('economy', logline);

    // Build detailed JSON entry
    var items = [];
    for (var i = 0; i < keys.length; i++) {
        var id = keys[i];
        var d = detailMap[id];
        items.push({
            id: id,
            qty: d.qty,
            unitCents: d.unitCents,
            subtotalEarnings: d.unitCents * d.qty
        });
    }
    var entry = {
        date: new Date().toLocaleString(),
        type: 'scrap_sale',
        preset: presetKey,
        preset_display: presetDisplay,
        container: containerName,
        items: items,
        totalEarnings: totalEarnings,
        totalHuman: getAmountCoin(totalEarnings)
    };
    logToJson('economy', playerName, entry);
}