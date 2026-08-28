load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js");

var CRATE_SKIN_BASE_URL = "https://legends-of-gramdatis.com/gramados_skins/crates/Gramados_slime_crate_";

var config = loadJson("world/customnpcs/scripts/ecmascript/modules/junkyard/config.json");
var crates = loadJson("world/customnpcs/scripts/ecmascript/modules/junkyard/crates.json");

/**
 * Temporarily regenerates and opens the crate every time
 * the player interacts with it.
 *
 * Later, regeneration and opening will become separate events.
 *
 * @param {Object} event
 */
function interact(event) {
    var npc = event.npc;
    var player = event.player;

    var result = regenerateCrate(npc);

    if (!result) {
        tellPlayer(
            player,
            "&c:cross_mark: Failed to generate the Junkyard crate."
        );
        return;
    }

    tellPlayer(
        player,
        "&a:check_mark: Generated &e" +
        result.type +
        "&a crate with rarity &e" +
        result.rarity +
        "&a."
    );

    lootCrate(
        player,
        npc,
        result.type,
        result.rarity
    );
}


/**
 * Generates a new crate type, rarity, and size.
 * Stores type/rarity on the NPC and applies its skin.
 *
 * @param {ICustomNpc} npc
 * @returns {Object|null}
 */
function regenerateCrate(npc) {
    var crateType = getRandomCrateType();

    if (crateType == null) {
        logToFile(
            "mechanics",
            "[Junkyard Crate] Failed to select a crate type."
        );

        return null;
    }

    var rarity = getRandomCrateRarity();

    if (rarity == null) {
        logToFile(
            "mechanics",
            "[Junkyard Crate] Failed to select a crate rarity."
        );

        return null;
    }

    var storedData = npc.getStoreddata();

    storedData.put("crate_type", crateType);
    storedData.put("crate_rarity", rarity);

    setRandomCrateSize(npc);

    applyCrateSkin(
        npc,
        crateType,
        rarity
    );

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
    var size = Math.floor(Math.random() * 3) + 7;

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
 */
function lootCrate(
    player,
    npc,
    crateType,
    rarity
) {
    var crateConfig = crates[crateType];

    var pullCount = getRarityPullCount(rarity);

    var mainLoot = [];

    for (var i = 0; i < pullCount; i++) {
        var lootPart = pullLootTable(
            crateConfig.LootTable,
            player
        );

        appendLootEntries(
            mainLoot,
            lootPart
        );
    }

    var secondaryResult =
        pullSecondaryLoot(
            crateConfig,
            player
        );

    var loot = [];

    appendLootEntries(
        loot,
        mainLoot
    );

    appendLootEntries(
        loot,
        secondaryResult.loot
    );

    dropLoot(
        npc,
        loot
    );

    logToFile(
        "mechanics",
        player.getName() +
        " opened a " +
        rarity +
        " " +
        crateType +
        " Junkyard Crate (" +
        pullCount +
        " main loot pull" +
        (pullCount == 1 ? "" : "s") +
        ", " +
        mainLoot.length +
        " main item" +
        (mainLoot.length == 1 ? "" : "s") +
        ", secondary scrap: " +
        (
            secondaryResult.triggered
                ? secondaryResult.loot.length +
                  " item" +
                  (secondaryResult.loot.length == 1 ? "" : "s")
                : "none"
        ) +
        ")."
    );
}


/**
 * Attempts to pull the secondary scrap loot table configured
 * for a crate.
 *
 * ScrapChance is interpreted as a value between 0 and 1.
 *
 * The secondary loot table is pulled at most once.
 * Any rolls inside that loot table are handled by the
 * loot-table system itself.
 *
 * @param {Object} crateConfig
 * @param {IPlayer} player
 * @returns {Object}
 */
function pullSecondaryLoot(
    crateConfig,
    player
) {
    var result = {
        triggered: false,
        loot: []
    };

    if (!crateConfig.ScrapLootTable) {
        return result;
    }

    var scrapChance = crateConfig.ScrapChance;

    if (
        scrapChance < 1 &&
        Math.random() >= scrapChance
    ) {
        return result;
    }

    result.triggered = true;

    var scrapLoot = pullLootTable(
        crateConfig.ScrapLootTable,
        player
    );

    appendLootEntries(
        result.loot,
        scrapLoot
    );

    return result;
}


/**
 * Appends loot entries from one array into another.
 *
 * Safely ignores null or invalid loot results.
 *
 * @param {Array} target
 * @param {Array} entries
 */
function appendLootEntries(
    target,
    entries
) {
    for (var i = 0; i < entries.length; i++) {
        target.push(entries[i]);
    }
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
        var itemStack =
            generateItemStackFromLootEntry(
                loot[i],
                world
            );

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
    return getWeightedRandomKey(
        crates,
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
    return getWeightedRandomKey(
        config.JUNKYARD_CRATE_RARITY_WEIGHTS,
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
function getWeightedRandomKey(
    weightedObject,
    weightGetter
) {
    if (!weightedObject) {
        return null;
    }

    var keys = Object.keys(weightedObject);
    var totalWeight = 0;

    for (var i = 0; i < keys.length; i++) {
        var value =
            weightedObject[keys[i]];

        var weight =
            Number(weightGetter(value));

        if (
            isNaN(weight) ||
            weight <= 0
        ) {
            continue;
        }

        totalWeight += weight;
    }

    if (totalWeight <= 0) {
        return null;
    }

    var random =
        Math.random() * totalWeight;

    for (var j = 0; j < keys.length; j++) {
        var key =
            keys[j];

        var entry =
            weightedObject[key];

        var entryWeight =
            Number(weightGetter(entry));

        if (
            isNaN(entryWeight) ||
            entryWeight <= 0
        ) {
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
 * Gramados_slime_crate_<type>_<rarity>.png
 *
 * @param {ICustomNpc} npc
 * @param {string} crateType
 * @param {string} rarity
 */
function applyCrateSkin(
    npc,
    crateType,
    rarity
) {
    var skinUrl =
        CRATE_SKIN_BASE_URL +
        crateType +
        "_" +
        rarity +
        ".png";

    npc.getDisplay().setSkinUrl(
        skinUrl
    );
}