load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/modules/junkyard/utils_junkyard_crates.js");

var config = loadJson("world/customnpcs/scripts/ecmascript/modules/junkyard/config.json");
var junkyards = loadJson("world/customnpcs/scripts/ecmascript/modules/junkyard/junkyards.json");

var JUNKER_CRATE_TYPE = "junker";
var JUNKER_CRATE_DISPLAY_NAME = "Junker Vehicle Crate";
var JUNKER_CLOSED_SKIN_URL = "https://legends-of-gramdatis.com/gramados_skins/crates/Gramados_slime_crate_junker.png";
var JUNKER_OPEN_SKIN_URL = "https://legends-of-gramdatis.com/gramados_skins/crates/Gramados_slime_crate_junker_open.png";

function init(event) {
    var npc = event.npc;

    if (!isCrateLinkedToJunkyard(npc)) {
        if (!linkCrateToJunkyard(npc)) {
            applyJunkerCrateSkin(npc, false);
            npc.say(parseEmotes("&c:cross_mark: This Junker crate is not in a Junkyard region and cannot be linked. Report to an admin."));
            return;
        }
    }

    var junkyardId = getLinkedJunkyardId(npc);

    if (
        isJunkerCrateReady(junkyardId) &&
        canUseLootTable(config.JUNKER_CRATE_LOOT_TABLE)
    ) {
        applyJunkerCrateSkin(npc, true);
        return;
    }

    applyJunkerCrateSkin(npc, false);
}

function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var offhand = player.getOffhandItem();
    var mainhand = player.getMainhandItem();

    if (isAdmin(offhand)) {
        showJunkerCrateAdminInfo(npc, player);
        return;
    }

    var junkyardId = getLinkedJunkyardId(npc);

    if (junkyardId == null || !junkyards[junkyardId]) {
        tellPlayer(player, "&c:cross_mark: This Junker crate is not linked to a Junkyard and cannot be opened.");
        return;
    }

    if (
        !isJunkerCrateReady(junkyardId) ||
        !canUseLootTable(config.JUNKER_CRATE_LOOT_TABLE) ||
        npc.getDisplay().getSkinUrl() == JUNKER_OPEN_SKIN_URL
    ) {
        applyJunkerCrateSkin(npc, false);
        tellPlayer(player, "&c:cross_mark: This Junker crate is not currently available.");
        return;
    }

    if (isJunkyardPhone(mainhand)) {
        displayJunkerCratePhoneData(player);
        playJunkyardCrateSound(npc, "ivv:computer.old.on");
        return;
    }

    var crowbars = mainhand.copy();

    if (!isValidJunkyardCrowbar(crowbars)) {
        tellPlayer(player, "&c:cross_mark: You need a stack of " + config.JUNKER_CRATE_CROWBAR_COST + " Junkyard crowbars to open this crate.");
        playJunkyardCrateSound(npc, "minecraft:entity.zombie.attack_door_wood");
        return;
    }

    if (crowbars.getStackSize() < config.JUNKER_CRATE_CROWBAR_COST) {
        tellPlayer(
            player,
            "&c:cross_mark: You need " + config.JUNKER_CRATE_CROWBAR_COST + " matching Junkyard crowbars in your main hand."
        );
        playJunkyardCrateSound(npc, "minecraft:entity.zombie.attack_door_wood");
        return;
    }

    var loot = pullJunkerCrateLoot(player);

    if (loot == null || loot.length == 0) {
        tellPlayer(player, "&c:cross_mark: This Junker crate failed to produce loot. Your crowbars were not consumed.");
        return;
    }

    dropLoot(npc, loot);
    playJunkyardCrateSound(npc, "minecraft:entity.zombie.break_door_wood");

    crowbars.setStackSize(crowbars.getStackSize() - config.JUNKER_CRATE_CROWBAR_COST);
    player.setMainhandItem(crowbars);

    recordJunkerCrateOpen(junkyardId);

    if (learnCrateType(player, JUNKER_CRATE_TYPE)) {
        playJunkyardCrateSound(npc, "minecraft:entity.player.levelup");
        tellPlayer(
            player,
            "&6:star: You have learned to recognize &e" + JUNKER_CRATE_DISPLAY_NAME + "&6."
        );
    }

    applyJunkerCrateSkin(npc, false);

    logToFile(
        "mechanics",
        player.getName() + " opened a Junker Vehicle Crate in " + junkyards[junkyardId].DisplayName + "."
    );
}

function pullJunkerCrateLoot(player) {
    if (canUseLootTable(config.JUNKER_CRATE_LOOT_TABLE)) {
        var pullResult = prepareLootTablePull(
            config.JUNKER_CRATE_LOOT_TABLE,
            player
        );

        if (
            pullResult != null &&
            pullResult.loot.length > 0 &&
            commitLootTablePull(pullResult)
        ) {
            return pullResult.loot;
        }
    }

    return pullLootTable(
        config.JUNKER_CRATE_COMPENSATION_LOOT_TABLE,
        player
    );
}

function applyJunkerCrateSkin(npc, isAvailable) {
    npc.getDisplay().setSkinUrl(
        isAvailable ? JUNKER_CLOSED_SKIN_URL : JUNKER_OPEN_SKIN_URL
    );
}

function isJunkerCrateReady(junkyardId) {
    var data = loadJson(JUNKYARDS_DATA_PATH);

    if (!data[junkyardId] || !data[junkyardId].JunkerCrate) {
        return true;
    }

    var lastOpenedAt = data[junkyardId].JunkerCrate.LastOpenedAt;
    var regenMs = config.JUNKER_CRATE_REGEN_MINUTES * 60 * 1000;

    return new Date().getTime() - lastOpenedAt >= regenMs;
}

function recordJunkerCrateOpen(junkyardId) {
    var data = loadJson(JUNKYARDS_DATA_PATH);

    if (!data[junkyardId]) {
        data[junkyardId] = {};
    }

    if (!data[junkyardId].JunkerCrate) {
        data[junkyardId].JunkerCrate = {
            LastOpenedAt: 0,
            TotalOpened: 0
        };
    }

    data[junkyardId].JunkerCrate.LastOpenedAt = new Date().getTime();
    data[junkyardId].JunkerCrate.TotalOpened++;

    saveJson(data, JUNKYARDS_DATA_PATH);
}

function displayJunkerCratePhoneData(player) {
    var typeDisplay = playerKnowsCrateType(player, JUNKER_CRATE_TYPE)
        ? JUNKER_CRATE_DISPLAY_NAME
        : "Unidentified";

    tellPlayer(player, "&6&lJunkyard Crate Scan");
    tellPlayer(player, "&7Type: &f" + typeDisplay);
    tellPlayer(player, "&7Status: &aAvailable");
}

function showJunkerCrateAdminInfo(npc, player) {
    var junkyardId = getLinkedJunkyardId(npc);
    var data = loadJson(JUNKYARDS_DATA_PATH);

    var junkyardDisplay = junkyardId != null && junkyards[junkyardId]
        ? junkyards[junkyardId].DisplayName + " &7(" + junkyardId + ")"
        : "Not linked";

    var volatileAvailable = canUseLootTable(config.JUNKER_CRATE_LOOT_TABLE);
    var lastOpenedAt = "Not set";
    var cooldownDisplay = "Ready";

    if (
        junkyardId != null &&
        data[junkyardId] &&
        data[junkyardId].JunkerCrate
    ) {
        lastOpenedAt = data[junkyardId].JunkerCrate.LastOpenedAt;

        var regenMs = config.JUNKER_CRATE_REGEN_MINUTES * 60 * 1000;
        var remainingMs = regenMs - (new Date().getTime() - lastOpenedAt);

        if (remainingMs > 0) {
            cooldownDisplay = Math.ceil(remainingMs / 60000) + " minute(s) remaining";
        }
    }

    var skinState = npc.getDisplay().getSkinUrl() == JUNKER_OPEN_SKIN_URL
        ? "Open"
        : "Closed";

    tellPlayer(player, "&6&lJunker Vehicle Crate Admin");
    tellPlayer(player, "&7Junkyard: &e" + junkyardDisplay);
    tellPlayer(player, "&7Volatile loot available: " + (volatileAvailable ? "&aYes" : "&cNo"));
    tellPlayer(player, "&7Last Opened At: &e" + lastOpenedAt);
    tellPlayer(player, "&7Cooldown: &e" + cooldownDisplay);
    tellPlayer(player, "&7Skin state: &e" + skinState);
}
