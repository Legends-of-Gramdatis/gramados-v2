// Load utility modules
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js')
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js')

load('world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js');

var safe_type = [
    "Gold Rack",
    "Bill Rack",
    "Safe"
]
var click_cooldown = 60;
var regen_cooldown = 20000;
// var regen_cooldown = 100;

function init(event) {
    var npc = event.npc;

    if (!npc.getStoreddata().has("safe_type") || !npc.getStoreddata().has("fill_level")) {
        regenerate(npc);
    } else {
        var current_time = npc.getWorld().getTotalTime();
        var last_interaction_time = npc.getStoreddata().get("last_interraction") || 0;
        var elapsed_time = current_time - last_interaction_time;

        var refill_steps = Math.floor(elapsed_time / regen_cooldown);
        if (refill_steps > 0) {
            var fill_level = npc.getStoreddata().get("fill_level");
            fill_level = Math.min(fill_level + refill_steps, 4);
            npc.getStoreddata().put("fill_level", fill_level);
            saveInteractionTime(npc);
            updateSkinURL(npc);
        }
    }
}

// function tick(event) {
//     var npc = event.npc;
//     var fill_level = npc.getStoreddata().get("fill_level");
    
//     // if fill level is 0, then it's empty
//     if (fill_level < 4) {
//         var current_time = npc.getWorld().getTotalTime();
//         var last_interaction_time = npc.getStoreddata().get("last_interraction");
//         // check if the cooldown is over
//         if (current_time - last_interaction_time >= regen_cooldown) {
//             refill(event);
//         }
//     }
// }

function refill(event) {
    var npc = event.npc;
    var player = event.player;
    // entity types:
    // 0: CustomNPC
    // 1: Player

    var nearby_players = npc.getWorld().getNearbyEntities(npc.getPos(), 100, 1);
    if (nearby_players.length > 0) {
        tellPlayer(player, "&7The vault will not refill while players are nearby.");
        npc.executeCommand("/playsound ivv:computer.gaming.error blobk @a");
        saveInteractionTime(npc);
        return;
    }
    var fill_level = npc.getStoreddata().get("fill_level");
    if (fill_level < 4) {
        fill_level = Math.min(fill_level + 1, 4);
        npc.getStoreddata().put("fill_level", fill_level);
        saveInteractionTime(npc);
        updateSkinURL(npc);
    }
}

function interact(event) {
    var npc = event.npc;

    // get player hand item
    var player = event.player;
    var item = player.getMainhandItem();
    var item_name = item.getName();
    var fill_level = npc.getStoreddata().get("fill_level");

    if (item_name == "minecraft:command_block") {
        npc.executeCommand("/playsound ivv:computer.gaming.deleted player @a");
        var new_type = regenerate(npc);

        tellPlayer(player, "&6The rack has been regenerated to: &l" + new_type);
    } else if (fill_level > 0) {

        if (getTimer(npc) > click_cooldown) {
            npc.executeCommand("/playsound minecraft:block.shulker_box.open block @a");
            // tellPlayer(player, "&6You have successfully opened the rack!");
            loot_safe(event);
        } else {
            // tellPlayer(player, "&6Cooldown: " + click_cooldown + " ticks");
            // tellPlayer(player, "&6Fill Level: " + npc.getStoreddata().get("fill_level"));
            // tellPlayer(player, "&6Current Type: " + npc.getStoreddata().get("safe_type"));
            npc.executeCommand("/playsound minecraft:block.anvil.hit block @a");
        }
    } else {
        // if player holds a clock
        if (item_name == "minecraft:clock") {
            tellPlayer(player, "&7This vault is empty! Come back in about " + Math.floor((regen_cooldown - getTimer(npc)) / 20 / 60) + " minutes.");
        } else {
            if (rrandom_range(0, 50) == 1) {
                tellPlayer(player, "&7This vault is empty! Come back later. &o&8(tip: use a clock to check the time).");
            } else {
                tellPlayer(player, "&7This vault is empty! Come back later.");
            }
        }
        npc.executeCommand("/playsound chisel:block.metal.hit block @a");
    }
}

function regenerate(npc) {
    var current_type = npc.getStoreddata().get("safe_type");
    var current_index = safe_type.indexOf(current_type);
    var next_index = (current_index + 1) % safe_type.length;
    var next_type = safe_type[next_index];
    npc.getDisplay().setName(next_type);

    npc.getStoreddata().put("safe_type", next_type);
    npc.getStoreddata().put("fill_level", 4);

    saveInteractionTime(npc);

    updateSkinURL(npc);

    return next_type;
}

function saveInteractionTime(npc) {
    var current_time = npc.getWorld().getTotalTime();
    npc.getStoreddata().put("last_interraction", current_time);
}

function loot_safe(event) {
    var npc = event.npc;
    var player = event.player;

    var fill_level = npc.getStoreddata().get("fill_level");

    fill_level = Math.max(0, fill_level - 1);
    npc.getStoreddata().put("fill_level", fill_level);
    saveInteractionTime(npc);

    updateSkinURL(npc);
    generateLoot(npc.getWorld(), npc, player);
}

function getTimer(npc) {
    var current_time = npc.getWorld().getTotalTime();
    var last_interaction_time = npc.getStoreddata().get("last_interraction");
    if (last_interaction_time == null) {
        return 0;
    }
    var elapsed_time = current_time - last_interaction_time;
    return elapsed_time;
}

function generateLoot(world, npc, player) {
    var full_loot = [];

    switch (npc.getStoreddata().get("safe_type")) {
        case "Gold Rack":
            var full_loot = pullLootTable(_LOOTTABLE_BANKVAULT_GOLDRACK, player);
            for (var i = 0; i < full_loot.length; i++) {
                player.giveItem(
                    generateItemStackFromLootEntry(full_loot[i], world, player)
                );
            }
            var logline = player.getName() + " opened a Gold Rack and received: ";
            for (var i = 0; i < full_loot.length; i++) {
                logline += full_loot[i].id + ":" + full_loot[i].damage + " x" + full_loot[i].count;
                if (i < full_loot.length - 1) {
                    logline += ", ";
                }
            }
            logToFile("economy", logline);
            break;
        case "Bill Rack":
            var money = rrandom_range(10000, 500000);
            var moneyItems = generateMoney(world, money);
            for (var i = 0; i < moneyItems.length; i++) {
                player.dropItem(moneyItems[i]);
            }
            var logline = player.getName() + " opened a Bill Rack and received " + getAmountCoin(money);
            logToFile("economy", logline);
            break;
        case "Safe":
            var full_loot = pullLootTable(_LOOTTABLE_BANKVAULT_SAFE, player);
            for (var i = 0; i < full_loot.length; i++) {
                player.giveItem(
                    generateItemStackFromLootEntry(full_loot[i], world, player)
                );
            }
            var logline = player.getName() + " broke open a Safe and received: ";
            for (var i = 0; i < full_loot.length; i++) {
                logline += full_loot[i].id + ":" + full_loot[i].damage + " x" + full_loot[i].count;
                if (i < full_loot.length - 1) {
                    logline += ", ";
                }
            }
            logToFile("economy", logline);
            break;
    }
}

function updateSkinURL(npc) {
    var current_type = npc.getStoreddata().get("safe_type");
    var fill_level = npc.getStoreddata().get("fill_level");

    var skin_url = "https://legends-of-gramdatis.com/gramados_skins/bank_safe/Gramados_slime_banksafe_";

    switch (current_type) {
        case "Gold Rack":
            skin_url = skin_url + "goldrack_" + fill_level + ".png";
            break;
        case "Bill Rack":
            skin_url = skin_url + "billrack_" + fill_level + ".png";
            break;
        case "Safe":
            skin_url = skin_url + "safe_" + fill_level + ".png";
            break;
    }

    npc.getDisplay().setSkinUrl(skin_url);
}