load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");

var CONTAINERS_CONFIG = "world/customnpcs/scripts/data/containers.json";

function isContainerItem(itemStack) {
    if (!itemStack || itemStack.isEmpty()) {
        return false;
    }
    var itemId = itemStack.getName();
    var containerItems = getAllContainers();

    return includes(containerItems, itemId);
}

function getAllCrates(tier, containersConfig) {
    var allCrateItems = [];

    var crates = containersConfig.container_types.crate.tiers;
    for (var tierName in crates) {
        if (tierName === tier) {
            var tierData = crates[tierName];
            var items = tierData.items;
            allCrateItems = allCrateItems.concat(items);
        }
    }

    return allCrateItems;
}

function getAllBarrels(tier, containersConfig) {
    var allBarrelItems = [];

    var barrels = containersConfig.container_types.barrel.tiers;
    for (var tierName in barrels) {
        if (tierName === tier) {
            var tierData = barrels[tierName];
            var items = tierData.items;
            allBarrelItems = allBarrelItems.concat(items);
        }
    }

    return allBarrelItems;
}

function getAllCrateTiers(containersConfig) {
    var crateTiers = [];

    var crates = containersConfig.container_types.crate.tiers;
    for (var tierName in crates) {
        crateTiers.push(tierName);
    }

    return crateTiers;
}

function getAllBarrelTiers(containersConfig) {
    var barrelTiers = [];

    var barrels = containersConfig.container_types.barrel.tiers;
    for (var tierName in barrels) {
        barrelTiers.push(tierName);
    }

    return barrelTiers;
}

function getAllContainers() {
    var allItems = [];

    var containersConfig = loadJson(CONTAINERS_CONFIG);
    var crate_tiers = getAllCrateTiers(containersConfig);
    var barrel_tiers = getAllBarrelTiers(containersConfig);

    var crates = [];
    for (var i = 0; i < crate_tiers.length; i++) {
        var tier = crate_tiers[i];
        var tierCrates = getAllCrates(tier, containersConfig);
        crates = crates.concat(tierCrates);
    }

    var barrels = [];
    for (var j = 0; j < barrel_tiers.length; j++) {
        var tier = barrel_tiers[j];
        var tierBarrels = getAllBarrels(tier, containersConfig);
        barrels = barrels.concat(tierBarrels);
    }

    return allItems.concat(crates, barrels);
}

function getContainerDisplayName(itemStack) {
    if (!itemStack || itemStack.isEmpty()) {
        return false;
    }
    var itemId = itemStack.getName();
    var containersConfig = loadJson(CONTAINERS_CONFIG);

    var crateTiers = getAllCrateTiers(containersConfig);
    for (var i = 0; i < crateTiers.length; i++) {
        var tier = crateTiers[i];
        var tierCrates = getAllCrates(tier, containersConfig);
        if (includes(tierCrates, itemId)) {
            return containersConfig.container_types.crate.tiers[tier].display_name;
        }
    }

    var barrelTiers = getAllBarrelTiers(containersConfig);
    for (var j = 0; j < barrelTiers.length; j++) {
        var tier = barrelTiers[j];
        var tierBarrels = getAllBarrels(tier, containersConfig);
        if (includes(tierBarrels, itemId)) {
            return containersConfig.container_types.barrel.tiers[tier].display_name;
        }
    }

    return null;
}

/**
 * Returns the raw NBT entries stored in a crate.
 *
 * Counts in the NBT are per container. total_count represents the effective
 * amount across the complete stack of identical containers.
 */
function getCrateContentEntries(itemStack) {
    var inventoryCompound = itemStack.getNbt().getCompound("inventory");
    var items = inventoryCompound.getList("Items", 10);
    var containerStackSize = itemStack.getStackSize();
    var entries = [];

    for (var i = 0; i < items.length; i++) {
        var entryNbt = items[i];
        var countPerContainer = Number(entryNbt.getByte("Count"));

        entries.push({
            "nbt": entryNbt,
            "item_id": String(entryNbt.getString("id")),
            "damage": Number(entryNbt.getShort("Damage")),
            "count_per_container": countPerContainer,
            "total_count": countPerContainer * containerStackSize
        });
    }

    return entries;
}

/**
 * Replaces the crate inventory using raw NBT entries.
 *
 * This preserves lore, tags, custom names and any other item-specific data.
 */
function setCrateContentEntries(itemStack, entries) {
    var inventoryCompound = itemStack.getNbt().getCompound("inventory");
    var rebuiltItemsList = [];

    for (var i = 0; i < entries.length; i++) {
        if (entries[i] && entries[i].nbt) {
            rebuiltItemsList.push(entries[i].nbt);
        }
    }

    inventoryCompound.setList("Items", rebuiltItemsList);
}

function getBarrelContents(itemStack) {
    var tankData = itemStack.getNbt().getCompound("tank");
    var fluidLevelPerBarrel = Number(tankData.getDouble("fluidLevel"));
    var currentFluid = String(tankData.getString("currentFluid"));
    var contents = {};

    if (fluidLevelPerBarrel <= 0 || !currentFluid) {
        return contents;
    }

    contents["liquid:" + currentFluid] =
        fluidLevelPerBarrel * itemStack.getStackSize();

    return contents;
}

function setBarrelContents(itemStack, newContents) {
    var tankData = itemStack.getNbt().getCompound("tank");
    var fluidKeys = Object.keys(newContents || {});

    if (fluidKeys.length === 0) {
        tankData.setString("currentFluid", "");
        tankData.setDouble("fluidLevel", 0);
        return;
    }

    var fluidKey = fluidKeys[0];
    var aggregateAmount = Number(newContents[fluidKey] || 0);

    if (aggregateAmount <= 0) {
        tankData.setString("currentFluid", "");
        tankData.setDouble("fluidLevel", 0);
        return;
    }

    var stackSize = Math.max(1, itemStack.getStackSize());
    var amountPerBarrel = aggregateAmount / stackSize;

    tankData.setString(
        "currentFluid",
        fluidKey.replace("liquid:", "")
    );

    tankData.setDouble(
        "fluidLevel",
        amountPerBarrel
    );
}


function takeFromBarrelContents(itemStack, fluidKey, amountToTake) {
    var contents = getBarrelContents(itemStack);

    if (contents[fluidKey] !== undefined) {
        var remainingAmount = contents[fluidKey] - amountToTake;
        if (remainingAmount <= 0) {
            delete contents[fluidKey];
        } else {
            contents[fluidKey] = remainingAmount;
        }
    }

    return contents;
}

function readCrateDelivery(item) {
    var delivery = {};
    var entries = getCrateContentEntries(item);

    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var genericKey = entry.item_id + ":" + entry.damage;
        var marketEntry = activeMarketData[genericKey];

        if (!marketEntry) {
            continue;
        }

        if (marketEntry.type === "ageable_booze") {
            if (marketEntry.expects_tag === true) {
                var itemTag = entry.nbt.getCompound("tag");

                if (!itemTag || itemTag.toJsonString() === "{}") {
                    continue;
                }
            }

            var boozeInfo = readAgeableBooze(entry.nbt);

            if (!boozeInfo) {
                continue;
            }

            if (!delivery.ageable_booze) {
                delivery.ageable_booze = {};
            }

            if (!delivery.ageable_booze[boozeInfo.key]) {
                delivery.ageable_booze[boozeInfo.key] = {
                    "count": entry.total_count,
                    "extra_data": boozeInfo.data
                };
            } else {
                delivery.ageable_booze[boozeInfo.key].count +=
                    entry.total_count;
            }

            continue;
        }

        if (!delivery.generic) {
            delivery.generic = {};
        }

        if (!delivery.generic[genericKey]) {
            delivery.generic[genericKey] = {
                "count": entry.total_count
            };
        } else {
            delivery.generic[genericKey].count +=
                entry.total_count;
        }
    }

    return delivery;
}

function readBarrelDelivery(item) {
    var contents = getBarrelContents(item);
    var fluidKeys = Object.keys(contents);

    if (fluidKeys.length === 0) {
        return {};
    }

    var fluidKey = fluidKeys[0];
    var aggregateMillibuckets = Number(contents[fluidKey]);

    if (!activeMarketData[fluidKey] || aggregateMillibuckets <= 0) {
        return {};
    }

    var quantityInBuckets = aggregateMillibuckets / 1000;

    var delivery = {
        "fluid": {}
    };

    delivery.fluid[fluidKey] = {
        "count": quantityInBuckets
    };

    npc.say(
        ccs(
            "&aYou have sold &e"
            + quantityInBuckets
            + " bucket(s) of "
            + (
                activeMarketData[fluidKey].display_name
                || fluidKey.replace("liquid:", "")
            )
            + "&a."
        )
    );

    return delivery;
}

function clearCrate(item, delivery) {
    var entries = getCrateContentEntries(item);
    var remainingEntries = [];

    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var genericKey = entry.item_id + ":" + entry.damage;
        var sold = false;

        if (
            delivery.generic
            && delivery.generic[genericKey]
        ) {
            sold = true;
        }

        if (
            !sold
            && delivery.ageable_booze
        ) {
            var boozeInfo = readAgeableBooze(entry.nbt);

            if (
                boozeInfo
                && delivery.ageable_booze[boozeInfo.key]
            ) {
                sold = true;
            }
        }

        if (!sold) {
            remainingEntries.push(entry);
        }
    }

    setCrateContentEntries(item, remainingEntries);
}

function clearBarrel(item, delivery) {
    if (!delivery || !delivery.fluid) {
        return;
    }

    var contents = getBarrelContents(item);
    var fluidKeys = Object.keys(contents);

    if (fluidKeys.length === 0) {
        return;
    }

    var fluidKey = fluidKeys[0];

    if (!delivery.fluid[fluidKey]) {
        return;
    }

    delete contents[fluidKey];

    setBarrelContents(
        item,
        contents
    );
}
