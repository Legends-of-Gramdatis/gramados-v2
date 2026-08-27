load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");

var CRATE_SKIN_BASE_URL = "https://legends-of-gramdatis.com/gramados_skins/crates/Gramados_slime_crate_";

var config = loadJson("world/customnpcs/scripts/ecmascript/modules/junkyard/config.json");
var crates = loadJson("world/customnpcs/scripts/ecmascript/modules/junkyard/crates.json");

var CRATE_RARITY_WEIGHTS = config.JUNKYARD_CRATE_RARITY_WEIGHTS;


/**
 * Temporarily regenerates the crate every time a player interacts
 * with it.
 *
 * Later, this function can instead be called from init/timer logic.
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

    // Useful while testing.
    tellPlayer(
        player,
        "&a:check_mark: Generated &e" +
        result.type +
        "&a crate with rarity &e" +
        result.rarity +
        "&a."
    );
}


/**
 * Generates a new crate type and rarity, stores them on the NPC,
 * and applies the corresponding skin.
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
        CRATE_RARITY_WEIGHTS,
        function(weight) {
            return weight;
        }
    );
}


/**
 * Selects a random key from an object using arbitrary numeric weights.
 *
 * Example:
 *
 * {
 *     "common": 70,
 *     "uncommon": 25,
 *     "rare": 5
 * }
 *
 * does not require weights to total 100.
 *
 * @param {Object} weightedObject
 * @param {Function} weightGetter
 * @returns {string|null}
 */
function getWeightedRandomKey(weightedObject, weightGetter) {
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
 * Format:
 *
 * Gramados_slime_crate_<type>_<rarity>.png
 *
 * Example:
 *
 * Gramados_slime_crate_powertrain_rare.png
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
