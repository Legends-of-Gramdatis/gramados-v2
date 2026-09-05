load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");

var CONFIG_PATH = "world/customnpcs/scripts/ecmascript/modules/npc_scripts/engineMechanicNPC_config.json";
var LOOT_TABLE_ROOT = "world/loot_tables/";
var PRESET_STORED_KEY = "engine_mechanic_preset";
var ADMIN_CARD_ID = "mts:ivv.idcard_seagull";
var RESET_ITEM_ID = "minecraft:barrier";
var SUCCESS_SOUND = "minecraft:block.anvil.use";
var FAILURE_SOUND = "minecraft:block.anvil.land";

var ENGINE_MECHANIC_CONFIG = loadJson(CONFIG_PATH);

function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var mainhand = player.getMainhandItem().copy();
    var offhand = player.getOffhandItem().copy();

    if (isAdmin(offhand)) {
        handleAdminInteraction(npc, player, mainhand);
        return;
    }

    var preset = getConfiguredPreset(npc);
    if (!preset) {
        tellPlayer(player, "&eThis mechanic has not been configured yet. Please ask an administrator for help.");
        return;
    }

    if (mainhand.isEmpty()) {
        tellPlayer(player, "&eHello! Hold an engine in your main hand and I will see if it needs repairing.");
        return;
    }

    repairEngine(npc, player, mainhand, preset);
}

function isAdmin(item) {
    return item && !item.isEmpty() && item.getName() == ADMIN_CARD_ID;
}

function handleAdminInteraction(npc, player, mainhand) {
    if (!ENGINE_MECHANIC_CONFIG || !ENGINE_MECHANIC_CONFIG.Presets) {
        tellPlayer(player, "&c[Admin] Engine mechanic config could not be loaded.");
        return;
    }

    if (!mainhand.isEmpty() && mainhand.getName() == RESET_ITEM_ID) {
        npc.getStoreddata().remove(PRESET_STORED_KEY);
        tellPlayer(player, "&a[Admin] Engine mechanic configuration was cleared.");
        return;
    }

    if (!mainhand.isEmpty() && mainhand.getName() == ENGINE_MECHANIC_CONFIG.PresetSwitchItem) {
        var preset = cyclePreset(npc);
        if (preset) {
            tellPlayer(player, "&a[Admin] Engine mechanic preset set to: " + preset.DisplayName);
        }
        return;
    }

    showAdminConfiguration(npc, player);
}

function getConfiguredPreset(npc) {
    if (!ENGINE_MECHANIC_CONFIG || !ENGINE_MECHANIC_CONFIG.Presets) {
        return null;
    }

    var storeddata = npc.getStoreddata();
    if (!storeddata.has(PRESET_STORED_KEY)) {
        return null;
    }

    var presetId = String(storeddata.get(PRESET_STORED_KEY));
    return ENGINE_MECHANIC_CONFIG.Presets[presetId] || null;
}

function cyclePreset(npc) {
    var presetIds = Object.keys(ENGINE_MECHANIC_CONFIG.Presets);
    if (presetIds.length == 0) {
        return null;
    }

    var storeddata = npc.getStoreddata();
    var currentId = storeddata.has(PRESET_STORED_KEY) ? String(storeddata.get(PRESET_STORED_KEY)) : null;
    var currentIndex = presetIds.indexOf(currentId);
    var nextId = presetIds[(currentIndex + 1) % presetIds.length];

    storeddata.put(PRESET_STORED_KEY, nextId);
    return ENGINE_MECHANIC_CONFIG.Presets[nextId];
}

function showAdminConfiguration(npc, player) {
    var preset = getConfiguredPreset(npc);
    var presetNames = [];
    var presetIds = Object.keys(ENGINE_MECHANIC_CONFIG.Presets);
    for (var i = 0; i < presetIds.length; i++) {
        presetNames.push(ENGINE_MECHANIC_CONFIG.Presets[presetIds[i]].DisplayName);
    }

    var lines = [
        "&6[Admin Setup] Engine Mechanic",
        "&7Preset: &f" + (preset ? preset.DisplayName : "Not configured")
    ];
    if (preset) {
        lines.push("&7Loot Table: &f" + preset.LootTable);
        lines.push("&7Unsupported Engine Text: &f" + preset.UnsupportedText);
    }
    lines.push("&7Available Presets: &f" + presetNames.join(", "));
    lines.push("&7Controls:");
    lines.push("&eDiamond Coin &7-> &aswitch preset");
    lines.push("&eBarrier &7-> &cclear configuration");
    storytellPlayer(player, lines);
}

function repairEngine(npc, player, heldItem, preset) {
    var itemNbt = heldItem.getNbt();
    if (!itemNbt || !itemNbt.has("hours")) {
        tellPlayer(player, "&cI specialize in fixing engines. Please hold an engine with runtime hours and try again.");
        playRepairSound(npc, player, FAILURE_SOUND);
        return;
    }

    var hours = itemNbt.getDouble("hours");
    if (hours <= 20) {
        tellPlayer(player, "&aYour engine looks good, mate. It does not need repairing.");
        return;
    }

    var itemId = heldItem.getName();
    if (!isItemInLootTable(preset.LootTable, itemId)) {
        tellPlayer(player, "&c" + preset.UnsupportedText);
        playRepairSound(npc, player, FAILURE_SOUND);
        return;
    }

    var lootTable = loadJson(resolveLootTablePath(preset.LootTable));
    var weight = getItemWeightFromLootTable(lootTable, itemId);
    if (weight === null) {
        tellPlayer(player, "&cI could not determine the repair cost for this engine.");
        playRepairSound(npc, player, FAILURE_SOUND);
        return;
    }

    var maxWeight = getMaxWeightFromLootTable(lootTable);
    var hoursToFix = hours - 20;
    var cost = Math.round(hoursToFix * (maxWeight + 1 - weight)) * 300;

    if (!extractMoneyFromPouch(player, cost)) {
        tellPlayer(player, "&cYou do not have enough money to fix this engine. Cost: " + getAmountCoin(cost));
        playRepairSound(npc, player, FAILURE_SOUND);
        return;
    }

    itemNbt.setDouble("hours", 20);
    player.setMainhandItem(heldItem);
    tellPlayer(player, "&aYour engine has been fixed for " + getAmountCoin(cost) + "&a.");
    playRepairSound(npc, player, SUCCESS_SOUND);

    var logline = "Player " + player.getName() + " fixed an engine with " + hours + " runtime hours for " + getAmountCoin(cost) + ".";
    logToFile("mechanics", logline);
}

function resolveLootTablePath(relativePath) {
    if (relativePath.indexOf(LOOT_TABLE_ROOT) == 0) {
        return relativePath;
    }
    return LOOT_TABLE_ROOT + relativePath;
}

function playRepairSound(npc, player, soundId) {
    npc.executeCommand("/playsound " + soundId + " player " + player.getName() + " " + player.getX() + " " + player.getY() + " " + player.getZ() + " 0.7 1");
}
