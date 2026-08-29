load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/modules/junkyard/utils_junkyard_crates.js");

var config = loadJson("world/customnpcs/scripts/ecmascript/modules/junkyard/config.json");
var crates = loadJson("world/customnpcs/scripts/ecmascript/modules/junkyard/crates.json");
var junkyards = loadJson("world/customnpcs/scripts/ecmascript/modules/junkyard/junkyards.json");

var CRATE_STATE_CLOSED = "closed";
var CRATE_STATE_OPENED = "opened";

function init(event) {
    var npc = event.npc;

    if (!isCrateLinkedToJunkyard(npc)) {
        if (!linkCrateToJunkyard(npc)) {
            npc.say(parseEmotes("&c:cross_mark: This crate is not in a Junkyard region and cannot be linked. Report to an admin."));
            return;
        }
    }

    if (!isCrateInitialized(npc)) {
        regenerateCrate(npc);
        return;
    }

    if (getCrateState(npc) == CRATE_STATE_CLOSED) {
        applyCrateSkin(npc);
        return;
    }

    if (isCrateReadyToRegenerate(npc)) {
        regenerateCrate(npc);
        return;
    }

    applyCrateSkin(npc);
}

function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var offhand = player.getOffhandItem();
    var mainhand = player.getMainhandItem();

    if (isAdmin(offhand)) {
        handleAdminInteraction(npc, player, mainhand);
        return;
    }

    var junkyardId = getLinkedJunkyardId(npc);

    if (junkyardId == null || !junkyards[junkyardId]) {
        tellPlayer(player, "&c:cross_mark: This crate is not linked to a Junkyard and cannot be opened.");
        return;
    }

    if (!isCrateInitialized(npc)) {
        tellPlayer(player, "&c:cross_mark: This Junkyard crate is not initialized.");
        return;
    }

    if (isJunkyardPhone(mainhand)) {
        displayCratePhoneData(player, npc);
        playJunkyardCrateSound(npc, "ivv:computer.old.on");
        return;
    }

    if (getCrateState(npc) == CRATE_STATE_OPENED) {
        tellPlayer(player, "&c:cross_mark: This crate has already been opened.");
        playJunkyardCrateSound(npc, "minecraft:entity.zombie.attack_door_wood");
        return;
    }

    var crowbar = player.getMainhandItem().copy();

    if (!isValidJunkyardCrowbar(crowbar)) {
        tellPlayer(player, "&c:cross_mark: You need a Junkyard crowbar to open this crate.");
        playJunkyardCrateSound(npc, "minecraft:entity.zombie.attack_door_wood");
        return;
    }

    var storedData = npc.getStoreddata();

    var crateType = storedData.get("crate_type");
    var rarity = storedData.get("crate_rarity");

    var opened = lootCrate(player, npc, crateType, rarity, junkyardId);

    if (opened) {
        playJunkyardCrateSound(npc, "minecraft:entity.zombie.break_door_wood");

        crowbar.setStackSize(crowbar.getStackSize() - 1);
        player.setMainhandItem(crowbar);

        setCrateState(npc, CRATE_STATE_OPENED);
        npc.getStoreddata().put("crate_opened_at", new Date().getTime());
        applyCrateSkin(npc);
        recordJunkyardCrateOpen(junkyardId, crateType);

        if (learnCrateType(player, crateType)) {
            playJunkyardCrateSound(npc, "minecraft:entity.player.levelup");
            tellPlayer(
                player,
                "&6:star: You have learned to recognize &e" + crates[crateType].DisplayName + "&6."
            );
        }

        if (learnCrateRarity(player, rarity)) {
            playJunkyardCrateSound(npc, "minecraft:entity.player.levelup");
            tellPlayer(
                player,
                "&6:star: You have learned to recognize &e" + rarity + "&6 Junkyard crates."
            );
        }
    }
}

function handleAdminInteraction(npc, player, mainhand) {
    if (!mainhand || mainhand.isEmpty()) {
        showCrateAdminInfo(npc, player);
        return;
    }

    var storedData = npc.getStoreddata();

    switch (mainhand.getName()) {
        case "minecraft:barrier":
            storedData.remove("junkyard_id");
            storedData.remove("crate_type");
            storedData.remove("crate_rarity");
            storedData.remove("crate_state");
            storedData.remove("crate_opened_at");

            tellPlayer(player, "&a[Admin] Cleared all Junkyard crate data. It will relink and regenerate on its next initialization.");
            return;

        case "variedcommodities:coin_diamond":
            if (!isCrateLinkedToJunkyard(npc)) {
                tellPlayer(player, "&c[Admin] This crate must initialize and link to a valid Junkyard before it can regenerate.");
                return;
            }

            var generated = regenerateCrate(npc);
            var rarityDisplay = generated.rarity.charAt(0).toUpperCase() + generated.rarity.slice(1);

            tellPlayer(
                player,
                "&a[Admin] Regenerated crate as &e" + rarityDisplay + " " + crates[generated.type].DisplayName + "&a."
            );
            return;

        case "variedcommodities:coin_emerald":
            if (!isCrateInitialized(npc)) {
                tellPlayer(player, "&c[Admin] This Junkyard crate is not initialized.");
                return;
            }

            setCrateState(npc, CRATE_STATE_CLOSED);
            storedData.remove("crate_opened_at");
            applyCrateSkin(npc);

            tellPlayer(player, "&a[Admin] Reset this crate to the closed state without rerolling it.");
            return;

        default:
            showCrateAdminInfo(npc, player);
            return;
    }
}

function showCrateAdminInfo(npc, player) {
    var storedData = npc.getStoreddata();

    var junkyardId = storedData.has("junkyard_id")
        ? storedData.get("junkyard_id")
        : null;

    var junkyardDisplay = junkyardId != null && junkyards[junkyardId]
        ? junkyards[junkyardId].DisplayName + " &7(" + junkyardId + ")"
        : "Not linked";

    var crateType = storedData.has("crate_type")
        ? storedData.get("crate_type")
        : null;

    var typeDisplay = crateType != null && crates[crateType]
        ? crates[crateType].DisplayName
        : "Not set";

    var rarityDisplay = storedData.has("crate_rarity")
        ? storedData.get("crate_rarity")
        : "Not set";

    var stateDisplay = storedData.has("crate_state")
        ? storedData.get("crate_state")
        : "Not set";

    var openedAtDisplay = storedData.has("crate_opened_at")
        ? storedData.get("crate_opened_at")
        : "Not set";

    tellPlayer(player, "&6&lJunkyard Crate Admin");
    tellPlayer(player, "&7Junkyard: &e" + junkyardDisplay);
    tellPlayer(player, "&7Type: &e" + typeDisplay);
    tellPlayer(player, "&7Rarity: &e" + rarityDisplay);
    tellPlayer(player, "&7State: &e" + stateDisplay);
    tellPlayer(player, "&7Opened At: &e" + openedAtDisplay);
    tellPlayer(player, "&7Barrier &8-> &fClear all crate data");
    tellPlayer(player, "&7Diamond Coin &8-> &fRegenerate crate");
    tellPlayer(player, "&7Emerald Coin &8-> &fReset to closed");
}

function displayCratePhoneData(player, npc) {
    var storedData = npc.getStoreddata();

    var crateType = storedData.get("crate_type");
    var rarity = storedData.get("crate_rarity");
    var state = storedData.get("crate_state");

    var typeDisplay = playerKnowsCrateType(player, crateType)
        ? crates[crateType].DisplayName
        : "Unidentified";

    var rarityDisplay = playerKnowsCrateRarity(player, rarity)
        ? rarity.charAt(0).toUpperCase() + rarity.slice(1)
        : "Unidentified";

    var statusDisplay = state == CRATE_STATE_CLOSED
        ? "&aSealed"
        : "&cOpened";

    tellPlayer(player, "&6&lJunkyard Crate Scan");
    tellPlayer(player, "&7Type: &f" + typeDisplay);
    tellPlayer(player, "&7Rarity: &f" + rarityDisplay);
    tellPlayer(player, "&7Status: " + statusDisplay);
}

function isCrateInitialized(npc) {
    var storedData = npc.getStoreddata();

    return storedData.has("junkyard_id") &&
        storedData.has("crate_type") &&
        storedData.has("crate_rarity") &&
        storedData.has("crate_state");
}

function getCrateState(npc) {
    return npc.getStoreddata().get("crate_state");
}

function setCrateState(npc, state) {
    npc.getStoreddata().put("crate_state", state);
}

function isCrateReadyToRegenerate(npc) {
    var openedAt = npc.getStoreddata().get("crate_opened_at");
    var regenMs = config.JUNKYARD_CRATE_REGEN_MINUTES * 60 * 1000;

    return new Date().getTime() - openedAt >= regenMs;
}

function regenerateCrate(npc) {
    var junkyardId = getLinkedJunkyardId(npc);

    var crateType = getRandomCrateType(junkyardId);
    var rarity = getRandomCrateRarity(junkyardId);

    var storedData = npc.getStoreddata();

    storedData.put("crate_type", crateType);
    storedData.put("crate_rarity", rarity);
    storedData.put("crate_state", CRATE_STATE_CLOSED);
    storedData.remove("crate_opened_at");

    setRandomCrateSize(npc);
    applyCrateSkin(npc);

    return {
        type: crateType,
        rarity: rarity
    };
}

/**
 * Gives the crate a random size between 7 and 9 inclusive.
 *
 * @param {ICustomNpc} npc
 */
function setRandomCrateSize(npc) {
    var size = rrandom_range(7, 9);

    npc.getDisplay().setSize(size);
}

/**
 * Pulls main loot and optional secondary scrap loot
 * configured for the crate type.
 *
 * Rarity determines the number of MAIN loot-table pulls:
 * common   -> 1
 * uncommon -> 2
 * rare     -> 3
 *
 * Secondary loot is independent from rarity.
 * ScrapChance determines whether ScrapLootTable is pulled once.
 *
 * @param {IPlayer} player
 * @param {ICustomNpc} npc
 * @param {string} crateType
 * @param {string} rarity
 * @param {string} junkyardId
 * @returns {boolean} True if the crate was successfully opened.
 */
function lootCrate(player, npc, crateType, rarity, junkyardId) {
    var crateConfig = crates[crateType];
    var pullCount = getRarityPullCount(rarity);
    var loot = [];

    for (var i = 0; i < pullCount; i++) {
        var mainLoot = pullLootTable(crateConfig.LootTable, player);
        loot = loot.concat(mainLoot);
    }

    var mainLootCount = loot.length;

    var triggered = (crateConfig.ScrapChance > 0 && Math.random() < crateConfig.ScrapChance)

    if (triggered) {
        var secondaryLoot = pullLootTable(crateConfig.ScrapLootTable, player);
        loot = loot.concat(secondaryLoot);
    }

    dropLoot(npc, loot);

    logToFile(
        "mechanics",
        player.getName() +
        " opened a " +
        rarity +
        " " +
        crateType +
        " Junkyard Crate in " +
        junkyards[junkyardId].DisplayName +
        " (" +
        pullCount +
        " main loot pull" +
        (
            pullCount == 1
                ? ""
                : "s"
        ) +
        ", " +
        mainLootCount +
        " main item" +
        (
            mainLootCount == 1
                ? ""
                : "s"
        ) +
        ", secondary scrap: " +
        (
            triggered
                ? secondaryLoot.length +
                  " item" +
                  (
                      secondaryLoot.length == 1
                          ? ""
                          : "s"
                  )
                : "none"
        ) +
        ")."
    );

    return true;
}

/**
 * Returns the number of main loot pulls associated with a rarity.
 *
 * @param {string} rarity
 * @returns {number}
 */
function getRarityPullCount(rarity) {
    switch (rarity) {
        case "rare":
            return 3;

        case "uncommon":
            return 2;

        case "common":
        default:
            return 1;
    }
}

function getRandomCrateType(junkyardId) {
    var weightedTypes = [];
    var typeMultipliers = junkyards[junkyardId].CrateTypeMultipliers;

    for (var crateType in crates) {
        var weight = crates[crateType].Weight;

        if (typeMultipliers[crateType] !== undefined) {
            weight *= typeMultipliers[crateType];
        }

        weightedTypes.push({
            value: crateType,
            weight: weight
        });
    }

    return getWeightedRandom(weightedTypes);
}

function getRandomCrateRarity(junkyardId) {
    var weightedRarities = [];
    var rarityMultipliers = junkyards[junkyardId].RarityMultipliers;

    for (var rarity in config.JUNKYARD_CRATE_RARITY_WEIGHTS) {
        var weight = config.JUNKYARD_CRATE_RARITY_WEIGHTS[rarity];

        if (rarityMultipliers[rarity] !== undefined) {
            weight *= rarityMultipliers[rarity];
        }

        weightedRarities.push({
            value: rarity,
            weight: weight
        });
    }

    return getWeightedRandom(weightedRarities);
}

function getWeightedRandom(entries) {
    var totalWeight = 0;

    for (var i = 0; i < entries.length; i++) {
        totalWeight += entries[i].weight;
    }

    if (totalWeight <= 0) {
        return null;
    }

    var random = Math.random() * totalWeight;

    for (var j = 0; j < entries.length; j++) {
        random -= entries[j].weight;

        if (random < 0) {
            return entries[j].value;
        }
    }

    return null;
}

/**
 * Generates and applies the crate skin URL.
 *
 * Format: https://legends-of-gramdatis.com/gramados_skins/crates/Gramados_slime_crate_<type>_<rarity>[_open].png
 *
 * @param {ICustomNpc} npc
 */
function applyCrateSkin(npc) {
    var storedData = npc.getStoreddata();

    var crateType = storedData.get("crate_type");
    var rarity = storedData.get("crate_rarity");
    var state = storedData.get("crate_state");

    var skinUrl = "https://legends-of-gramdatis.com/gramados_skins/crates/Gramados_slime_crate_" + crateType + "_" + rarity

    if (state == CRATE_STATE_OPENED) {
        skinUrl += "_open";
    }

    skinUrl += ".png";

    npc.getDisplay().setSkinUrl(skinUrl);
}

/**
 * Ensures the expected statistics structure exists for a Junkyard.
 *
 * @param {Object} data
 * @param {string} junkyardId
 * @returns {boolean} True if the data object was modified.
 */
function ensureJunkyardDataStructure(data, junkyardId) {
    var changed = false;

    if (!data[junkyardId]) {
        data[junkyardId] = {};
        changed = true;
    }

    var junkyardData = data[junkyardId];

    if (!junkyardData.CratesOpened) {
        junkyardData.CratesOpened = {
            Total: 0,
            ByType: {}
        };

        changed = true;
    }

    var byType = junkyardData.CratesOpened.ByType;

    for (var crateType in crates) {
        if (typeof byType[crateType] === "undefined") {
            byType[crateType] = 0;
            changed = true;
        }
    }

    return changed;
}

/**
 * Records one successfully opened crate for a Junkyard.
 *
 * Updates both the total counter and the counter for the
 * specific crate type.
 *
 * @param {string} junkyardId
 * @param {string} crateType
 */
function recordJunkyardCrateOpen(junkyardId, crateType) {
    var data = loadJson(JUNKYARDS_DATA_PATH);

    ensureJunkyardDataStructure(data, junkyardId);

    var opened = data[junkyardId].CratesOpened;

    opened.Total++;

    if (!opened.ByType[crateType]) {
        opened.ByType[crateType] = 0;
    }

    opened.ByType[crateType]++;

    saveJson(data, JUNKYARDS_DATA_PATH);
}
