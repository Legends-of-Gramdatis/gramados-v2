
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js");

// Load config like in gem_expertise.js
var config = loadJson("world/customnpcs/scripts/ecmascript/modules/item_expertise/gem_config.json");

var FACTION_ID_MAFIA = 9;

function interact(event) {
    var player = event.player;

    if (!player.hasReadDialog(565)) {
        return;
    }

    var world = player.getWorld();
    var npc = event.npc;
    var item = player.getMainhandItem();

    if (item.isEmpty()) {
        tellPlayer(player, "§c:cross_mark: You're not holding anything.");
        npc.executeCommand("/playsound minecraft:block.anvil.land block @a ~ ~ ~ 1 1");
        return;
    }

    var lore = item.getLore();
    if (!lore || lore.length === 0 || lore[0].toLowerCase().indexOf("[expertised]") === -1) {
        tellPlayer(player, "§c:cross_mark: I only deal with properly expertised materials.");
        npc.executeCommand("/playsound minecraft:block.anvil.land block @a ~ ~ ~ 1 1");
        return;
    }

    // Check if item is already marked for mafia sale
    var markedForSale = false;
    for (var i = 0; i < lore.length; i++) {
        if (lore[i].toLowerCase().indexOf("mafia interest registered") !== -1) {
            markedForSale = true;
            break;
        }
    }

    // FIRST INTERACTION: mark item
    if (!markedForSale) {
        var NewLore = [];
        for (var j = 0; j < lore.length; j++) {
            NewLore.push(lore[j]);
        }
        NewLore.push("§8Mafia interest registered. Interact again to finalize transaction.");
        item.setLore(NewLore);
        tellPlayer(player, "§7Mmh. That piece has... potential. Come back to me if you're serious about selling.");
        npc.executeCommand("/playsound minecraft:entity.villager.yes block @a ~ ~ ~ 1 1");
        return;
    }

    // SECOND INTERACTION: finalize sale
    var vars = {
        purity: null,
        clarity: null,
        weight: null,
        color_grade: null,
        lightness: null,
        resonance: null
    };

    for (var j = 0; j < lore.length; j++) {
        var raw = lore[j].replace(/§[0-9a-fklmnor]/gi, '').toLowerCase().trim();
        var match = raw.match(/^(\w+):\s([\d.]+)$/);
        if (match) {
            var key = match[1];
            var val = parseFloat(match[2]);
            if (vars.hasOwnProperty(key)) {
                vars[key] = val;
            }
        }
    }

    // Check if we have at least one variable
    var hasValid = false;
    for (var key in vars) {
        if (vars[key] !== null) {
            hasValid = true;
            break;
        }
    }

    if (!hasValid) {
        tellPlayer(player, "§c:cross_mark: I can't make sense of this item's markings. Something's off.");
        npc.executeCommand("/playsound minecraft:block.anvil.land block @a ~ ~ ~ 1 1");
        return;
    }

    // Calculate value (Python-logic version)
    var base = getPrice(item.getName(), 55000, null, true); // fallback = 55000 cents (550g)
    var q_score = 0;
    var weight_total = 0;

    if (vars.purity !== null)     { q_score += vars.purity;        weight_total += 0.2; }
    if (vars.clarity !== null)    { q_score += vars.clarity;       weight_total += 5; }
    if (vars.weight !== null)     { q_score += vars.weight;        weight_total += 4; }
    if (vars.color_grade !== null){ q_score += vars.color_grade;   weight_total += 0.25; }
    if (vars.lightness !== null)  { q_score += vars.lightness;     weight_total += 20; }
    if (vars.resonance !== null)  { q_score += vars.resonance;     weight_total += 20; }

    q_score = q_score / weight_total;

    var swing = (Math.random() < 0.9) ? (Math.random() * 0.4 + 0.8) : (Math.random() * 1.0 + 0.5);
    swing = Math.round(swing * 1000) / 1000;

    var estimated = Math.round(base * q_score * swing); // in cents

    // Reduce item stack by 1 (always)
    var reducedStack = item.copy();
    var itemname = item.getName();
    reducedStack.setStackSize(reducedStack.getStackSize() - 1);
    player.setMainhandItem(reducedStack);

    // Give money
    var stacks = generateMoney(world, estimated);
    for (var s = 0; s < stacks.length; s++) {
        player.giveItem(stacks[s]);
    }


    // Give mafia reputation (if < 2000)
    var mafia_rep_per_cents = (config && config.mafia_rep_per_cents) ? config.mafia_rep_per_cents : 30000;
    var repGain = 0;
    if (player.getFactionPoints(FACTION_ID_MAFIA) < 2000) {
        repGain = Math.floor(estimated / mafia_rep_per_cents); // configurable value
        if (repGain > 0) {
            player.addFactionPoints(FACTION_ID_MAFIA, repGain);
        }
        if (repGain > 20) {
            repGain = 20; // cap reputation gain to 20
        }
    }

    logToFile("economy", player.getName() + " sold expertised item " + itemname + " to Mafia for " + getAmountCoin(estimated) + ", and gained " + repGain + " reputation.");
    logToJson("economy", player.getName(), {
        type: "gem_mafia_purchase",
        item: itemname,
        estimated_value: estimated,
        reputation_gain: repGain,
        swing: swing,
        quality_score: q_score,
        variables: vars
    });

    tellPlayer(player, "§aPleasure doing business. Discreetly, of course.");
    npc.executeCommand("/playsound minecraft:entity.experience_orb.pickup block @a ~ ~ ~ 1 1");
}
