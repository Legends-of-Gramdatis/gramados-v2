var JUNKYARDS_DATA_PATH = "world/customnpcs/scripts/data_auto/junkyards.json";
var JUNKYARD_KNOWLEDGE_DATA_PATH = "world/customnpcs/scripts/data_auto/junkyard_knowledge.json";

function playJunkyardCrateSound(npc, sound) {
    npc.getWorld().playSoundAt(npc.getPos(), sound, 1, 1);
}

function isAdmin(offhandItem) {
    return offhandItem
        && !offhandItem.isEmpty()
        && offhandItem.getName() == "mts:ivv.idcard_seagull";
}

function isJunkyardPhone(item) {
    return !item.isEmpty() &&
        isItemInLootTable(
            "world/loot_tables/" + _LOOTTABLE_CELLPHONES,
            item.getName()
        );
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

function ensurePlayerJunkyardKnowledge(player) {
    var data = loadJson(JUNKYARD_KNOWLEDGE_DATA_PATH);
    var uuid = player.getUUID();
    var changed = false;

    if (!data[uuid]) {
        data[uuid] = {
            Name: player.getName(),
            Types: [],
            Rarities: []
        };

        changed = true;
    }

    if (data[uuid].Name != player.getName()) {
        data[uuid].Name = player.getName();
        changed = true;
    }

    if (changed) {
        saveJson(data, JUNKYARD_KNOWLEDGE_DATA_PATH);
    }

    return data[uuid];
}

function playerKnowsCrateType(player, crateType) {
    var knowledge = ensurePlayerJunkyardKnowledge(player);

    return includes(knowledge.Types, crateType);
}

function playerKnowsCrateRarity(player, rarity) {
    var knowledge = ensurePlayerJunkyardKnowledge(player);

    return includes(knowledge.Rarities, rarity);
}

function learnCrateType(player, crateType) {
    if (playerKnowsCrateType(player, crateType)) {
        return false;
    }

    var data = loadJson(JUNKYARD_KNOWLEDGE_DATA_PATH);
    var uuid = player.getUUID();

    data[uuid].Types.push(crateType);
    saveJson(data, JUNKYARD_KNOWLEDGE_DATA_PATH);

    return true;
}

function learnCrateRarity(player, rarity) {
    if (playerKnowsCrateRarity(player, rarity)) {
        return false;
    }

    var data = loadJson(JUNKYARD_KNOWLEDGE_DATA_PATH);
    var uuid = player.getUUID();

    data[uuid].Rarities.push(rarity);
    saveJson(data, JUNKYARD_KNOWLEDGE_DATA_PATH);

    return true;
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
