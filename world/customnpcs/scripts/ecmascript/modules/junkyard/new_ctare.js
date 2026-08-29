load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");

var JUNKYARDS_DATA_PATH = "world/customnpcs/scripts/data_auto/junkyards.json";

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

    regenerateCrate(npc);
}

function interact(event) {
    var npc = event.npc;
    var player = event.player;

    var junkyardId = getLinkedJunkyardId(npc);

    if (junkyardId == null || !junkyards[junkyardId]) {
        tellPlayer(player, "&c:cross_mark: This crate is not linked to a Junkyard and cannot be opened.");
        return;
    }

    if (!isCrateInitialized(npc)) {
        tellPlayer(player, "&c:cross_mark: This Junkyard crate is not initialized.");
        return;
    }

    if (getCrateState(npc) == CRATE_STATE_OPENED) {
        tellPlayer(player, "&c:cross_mark: This crate has already been opened.");
        return;
    }

    var crowbar = player.getMainhandItem().copy();

    if (!isValidJunkyardCrowbar(crowbar)) {
        tellPlayer(player, "&c:cross_mark: You need a Junkyard crowbar to open this crate.");
        return;
    }

    var storedData = npc.getStoreddata();

    var crateType = storedData.get("crate_type");
    var rarity = storedData.get("crate_rarity");

    var opened = lootCrate(player, npc, crateType, rarity, junkyardId);

    if (opened) {
        crowbar.setStackSize(crowbar.getStackSize() - 1);
        player.setMainhandItem(crowbar);

        setCrateState(npc, CRATE_STATE_OPENED);
        applyCrateSkin(npc);
        recordJunkyardCrateOpen(junkyardId, crateType);
    }
}

function isOldJunkyardCrowbar(item) {
    if (item.getName() != "growthcraft:crowbar") {
        return false;
    }

    var lore = item.getLore();

    return lore.length == 3 &&
        lore[0] == "§7One-use crowbar to pry open a sealed parts crate." &&
        lore[1] == "§8Marked by the Junkyard Authority." &&
        lore[2] == "§2§o\"Snap it, loot it, toss it.\"";
}

function isValidJunkyardCrowbar(item) {
    var nbt = item.getItemNbt();

    if (nbt.has("tag")) {
        var tag = nbt.getCompound("tag");

        if (tag.has("Gramados")) {
            var gramados = tag.getCompound("Gramados");

            if (gramados.has("ToolCapabilities")) {
                var toolCapabilities = gramados.getCompound("ToolCapabilities");

                if (
                    toolCapabilities.has("OpenJunkyardCrate") &&
                    toolCapabilities.getBoolean("OpenJunkyardCrate")
                ) {
                    return true;
                }
            }
        }
    }

    return isOldJunkyardCrowbar(item);
}

function isCrateLinkedToJunkyard(npc) {
    var storedData = npc.getStoreddata();

    if(storedData.has("junkyard_id")) {
        var regionId = storedData.get("junkyard_id");
        return includes(getJsonKeys(junkyards), regionId);
    }
    return false;
}

function linkCrateToJunkyard(npc) {
    var storedData = npc.getStoreddata();

    var regionId = getRegionAtEntity(npc);

    // if region ID is defined in junkyards.json, link the crate to it
    if (includes(getJsonKeys(junkyards), regionId)) {
        storedData.put("junkyard_id", regionId);
        return true;
    }

    storedData.remove("junkyard_id");
    return false;
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

/**
 * Returns the Junkyard region ID linked to this crate.
 *
 * @param {ICustomNpc} npc
 * @returns {string|null}
 */
function getLinkedJunkyardId(npc) {
    var junkyardId = npc.getStoreddata().get("junkyard_id");

    if (junkyardId == null) {
        return null;
    }

    return junkyardId;
}

function regenerateCrate(npc) {
    var crateType = getRandomCrateType();

    if (crateType == null) {
        logToFile("mechanics", "[Junkyard Crate] Failed to select a crate type.");
        return null;
    }

    var rarity = getRandomCrateRarity();

    var storedData = npc.getStoreddata();

    storedData.put("crate_type", crateType);
    storedData.put("crate_rarity", rarity);
    storedData.put("crate_state", CRATE_STATE_CLOSED);

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
 * Generates ItemStacks from loot entries and drops them
 * at the crate NPC.
 *
 * @param {ICustomNpc} npc
 * @param {Array} loot
 */
function dropLoot(
    npc,
    loot
) {
    var world = npc.getWorld();

    for (var i = 0; i < loot.length; i++) {
        var itemStack = generateItemStackFromLootEntry(loot[i], world);

        npc.dropItem(itemStack);
    }
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

/**
 * Selects a crate type using the Weight property from crates.json.
 *
 * @returns {string|null}
 */
function getRandomCrateType() {
    return getWeightedRandomKey(crates,
        function(crateConfig) {
            return crateConfig.Weight;
        }
    );
}

/**
 * Selects a rarity using JUNKYARD_CRATE_RARITY_WEIGHTS
 * from junkyard/config.json.
 *
 * @returns {string|null}
 */
function getRandomCrateRarity() {
    return getWeightedRandomKey(config.JUNKYARD_CRATE_RARITY_WEIGHTS,
        function(weight) {
            return weight;
        }
    );
}

/**
 * Selects a random key from an object using arbitrary numeric weights.
 *
 * @param {Object} weightedObject
 * @param {Function} weightGetter
 * @returns {string|null}
 */
function getWeightedRandomKey(weightedObject, weightGetter) {
    var keys = getJsonKeys(weightedObject);
    var totalWeight = 0;

    for (var i = 0; i < keys.length; i++) {
        var value = weightedObject[keys[i]];
        var weight = weightGetter(value)
        if (isNaN(weight) || weight <= 0) {
            continue;
        }
        totalWeight += weight;
    }

    if (totalWeight <= 0) {
        return null;
    }

    var random = Math.random() * totalWeight;

    for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var entry = weightedObject[key];
        var entryWeight = weightGetter(entry)

        if (isNaN(entryWeight) || entryWeight <= 0) {
            continue;
        }

        random -= entryWeight;

        if (random < 0) {
            return key;
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
