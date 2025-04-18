var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

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
var regen_cooldown = 40000;
// var regen_cooldown = 100;

var tickCounter = 0;

function init(event) {
    var npc = event.npc;
    var npcPos = npc.getPos();
    var banksData = loadJson("world/customnpcs/scripts/ecmascript/modules/bankVault/banks_data.json");

    for (var i = 0; i < banksData.length; i++) {
        var bank = banksData[i];
        var pos1 = bank.pos1;
        var pos2 = bank.pos2;

        if (isWithinZone(npcPos, pos1, pos2)) { // Use the utility function
            npc.getStoreddata().put("bank_name", bank.bankName);
            break;
        }
    }

    if (!npc.getStoreddata().has("safe_type") || !npc.getStoreddata().has("fill_level")) {
        regenerate(npc);
    } else {
        var current_time = npc.getWorld().getTotalTime();
        var last_interaction_time = npc.getStoreddata().get("last_interraction") || 0;
        var elapsed_time = current_time - last_interaction_time;

        var refill_steps = Math.floor(elapsed_time / regen_cooldown);
        if (refill_steps > 0) {
            var fill_level = npc.getStoreddata().get("fill_level");
            var credit_refill = npc.getStoreddata().get("credit_refill") || 0;

            fill_level = Math.min(fill_level + refill_steps + credit_refill, 4);
            npc.getStoreddata().put("fill_level", fill_level);

            npc.getStoreddata().put("credit_refill", 0);

            saveInteractionTime(npc);
            updateSkinURL(npc);
        }
    }
}

function tick(event) {
    var npc = event.npc;
    tickCounter++;

    if (tickCounter >= 10) {
        tickCounter = 0;
        checkAndApplyFillCredit(npc);
    }

    var fill_level = npc.getStoreddata().get("fill_level");

    if (fill_level < 4) {
        var current_time = npc.getWorld().getTotalTime();
        var last_interaction_time = npc.getStoreddata().get("last_interraction") || 0;

        if (current_time - last_interaction_time >= regen_cooldown) {
            var credit_refill = npc.getStoreddata().get("credit_refill") || 0;
            npc.getStoreddata().put("credit_refill", credit_refill + 1);
            saveInteractionTime(npc);
        }
    }
}

function checkAndApplyFillCredit(npc) {
    var bankName = npc.getStoreddata().get("bank_name");
    if (!bankName) return;

    var banksData = loadJson("world/customnpcs/scripts/ecmascript/modules/bankVault/banks_data.json");
    var bank = null;

    // Find the bank by name
    for (var i = 0; i < banksData.length; i++) {
        if (banksData[i].bankName === bankName) {
            bank = banksData[i];
            break;
        }
    }

    if (!bank) return;

    var pos1 = bank.pos1;
    var pos2 = bank.pos2;
    var position = API.getIPos((pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2, (pos1.z + pos2.z) / 2);
    var nearbyPlayers = npc.getWorld().getNearbyEntities(position, Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y), Math.abs(pos1.z - pos2.z)), 1);

    var fill_level = npc.getStoreddata().get("fill_level");
    var credit_refill = npc.getStoreddata().get("credit_refill") || 0;

    if (nearbyPlayers.length === 0 && fill_level < 4 && credit_refill > 0 && !bank.isVaultGateOpened) {
        var newFillLevel = Math.min(fill_level + credit_refill, 4);
        npc.getStoreddata().put("fill_level", newFillLevel);
        npc.getStoreddata().put("credit_refill", 0);
        saveJson(banksData, "world/customnpcs/scripts/ecmascript/modules/bankVault/banks_data.json");
        updateSkinURL(npc);
    }
}

function interact(event) {
    var npc = event.npc;

    var player = event.player;
    var item = player.getMainhandItem();
    var item_name = item.getName();
    var fill_level = npc.getStoreddata().get("fill_level");
    var credit_refill = npc.getStoreddata().get("credit_refill") || 0;
    var bank_name = npc.getStoreddata().get("bank_name") || "Unknown Bank";
    var vault_type = npc.getStoreddata().get("safe_type") || "Unknown Type";

    if (item_name == "minecraft:command_block") {
        npc.executeCommand("/playsound ivv:computer.gaming.deleted player @a");
        var new_type = regenerate(npc);

        tellPlayer(player, "&6The rack has been regenerated to: &l" + new_type);
    } else if (item_name == "minecraft:clock") {
        var current_time = npc.getWorld().getTotalTime();
        var last_interaction_time = npc.getStoreddata().get("last_interraction") || 0;
        var time_since_last = current_time - last_interaction_time;

        var time_until_next_fill = Math.max(0, regen_cooldown - (time_since_last % regen_cooldown));
        var steps_to_full = 4 - fill_level;
        var time_until_full = steps_to_full > 0 ? steps_to_full * regen_cooldown - time_since_last : 0;

        npc.executeCommand("/playsound minecraft:block.note.hat player @a");
        tellPlayer(player, "&7Time until next refill: &e" + (time_until_next_fill / 20 / 60).toFixed(1) + " minutes.");
        tellPlayer(player, "&7Time until fully refilled: &e" + (time_until_full / 20 / 60).toFixed(1) + " minutes.");
    } else if (item_name == "variedcommodities:crowbar") {
        npc.executeCommand("/playsound minecraft:entity.zombie.attack_iron_door player @a");
        tellPlayer(player, "&7Vault Status:");
        tellPlayer(player, "&7- Fill Level: &e" + fill_level + "/4");
        tellPlayer(player, "&7- Credit Refill: &e" + credit_refill);
    } else if (item_name == "variedcommodities:phone") {
        npc.executeCommand("/playsound ivv:phone.modern.error player @a");
        tellPlayer(player, "&7Vault owned by: &e" + bank_name);
        tellPlayer(player, "&7Vault type: &e" + vault_type);
    } else if (item_name == "customnpcs:npcsoulstoneempty") {
        tellPlayer(player, "&7Picked up vault with soulstone. No data changed.");
    } else if (fill_level > 0) {
        if (getTimer(npc) > click_cooldown) {
            npc.executeCommand("/playsound minecraft:block.shulker_box.open block @a");
            loot_safe(event);
        } else {
            npc.executeCommand("/playsound minecraft:block.anvil.hit block @a");
        }
    } else {
        // Display tips with varying rarity
        if (item_name !== "minecraft:clock" && rrandom_range(0, 50) == 1) {
            tellPlayer(player, "&7This vault is empty! Come back later. &o&8(tip: use a clock to check the time).");
        } else if (item_name !== "variedcommodities:crowbar" && rrandom_range(0, 100) == 1) {
            tellPlayer(player, "&7This vault is empty! Come back later. &o&8(tip: use a crowbar to check the vault status).");
        } else if (item_name !== "variedcommodities:phone" && rrandom_range(0, 150) == 1) {
            tellPlayer(player, "&7This vault is empty! Come back later. &o&8(tip: use a phone to check the bank ownership and vault type).");
        } else {
            tellPlayer(player, "&7This vault is empty! Come back later.");
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
    var criminalityIncrease = rrandom_range(10, 20);
    player.addFactionPoints(6, criminalityIncrease);

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
            logline += " at the cost of " + criminalityIncrease + " criminality.";
            logToFile("economy", logline);
            break;
        case "Bill Rack":
            var money = rrandom_range(10000, 500000);
            var moneyItems = generateMoney(world, money);
            for (var i = 0; i < moneyItems.length; i++) {
                player.dropItem(moneyItems[i]);
            }
            var logline = player.getName() + " opened a Bill Rack and received " + getAmountCoin(money);
            logline += " at the cost of " + criminalityIncrease + " criminality.";
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
            logline += " at the cost of " + criminalityIncrease + " criminality.";
            logToFile("economy", logline);
            break;
    }

    tellPlayer(player, "&cYour criminality has increased by " + criminalityIncrease + " points!");
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