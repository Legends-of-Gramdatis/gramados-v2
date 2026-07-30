function readCrateDelivery(item, stackSize) {
    var delivery = {};
    var inventoryCompound = item.getNbt().getCompound("inventory");
    var items = inventoryCompound.getList("Items", 10);

    for (var i = 0; i < items.length; i++) {
        var itemId = items[i].getString("id");
        var itemDamage = items[i].getShort("Damage");
        var itemCount = items[i].getByte("Count");
        var key = itemId + ":" + itemDamage;
        var totalCount = itemCount * stackSize;
        var marketEntry = activeMarketData[key];

        if (!marketEntry) {
            continue;
        }

        if (marketEntry.type === "ageable_booze") {
            if (marketEntry.expects_tag === true) {
                var requiredTag = items[i].getCompound("tag");

                if (!requiredTag || requiredTag.toJsonString() === "{}") {
                    continue;
                }
            }

            var boozeInfo = readAgeableBooze(items[i]);

            if (!boozeInfo) {
                continue;
            }

            if (!delivery.ageable_booze) {
                delivery.ageable_booze = {};
            }

            if (!delivery.ageable_booze[boozeInfo.key]) {
                delivery.ageable_booze[boozeInfo.key] = {
                    "count": totalCount,
                    "extra_data": boozeInfo.data
                };
            } else {
                delivery.ageable_booze[boozeInfo.key].count += totalCount;
            }

            continue;
        }

        if (!delivery.generic) {
            delivery.generic = {};
        }

        if (!delivery.generic[key]) {
            delivery.generic[key] = { "count": totalCount };
        } else {
            delivery.generic[key].count += totalCount;
        }
    }

    return delivery;
}

function readBarrelDelivery(item) {
    var tankData = item.getNbt().getCompound("tank");
    var fluidLevel = Number(tankData.getDouble("fluidLevel"));
    var currentFluid = String(tankData.getString("currentFluid"));

    if (fluidLevel <= 0 || !currentFluid) {
        return {};
    }

    var fluidKey = "liquid:" + currentFluid;

    if (!activeMarketData[fluidKey]) {
        return {};
    }

    var quantity = (fluidLevel / 1000) * item.getStackSize();
    var delivery = { "fluid": {} };

    delivery.fluid[fluidKey] = {
        "count": quantity
    };

    npc.say(
        ccs(
            "&aYou have sold &e" + quantity
            + " bucket(s) of "
            + (activeMarketData[fluidKey].display_name || currentFluid)
            + "&a."
        )
    );

    return delivery;
}

function clearCrate(item, delivery) {
    var inventoryCompound = item.getNbt().getCompound("inventory");
    var inventory = inventoryCompound.getList("Items", 10);

    for (var i = 0; i < inventory.length; i++) {
        var itemId = inventory[i].getString("id");
        var itemDamage = inventory[i].getShort("Damage");
        var genericKey = itemId + ":" + itemDamage;
        var shouldRemove = false;

        if (delivery.generic && delivery.generic[genericKey]) {
            shouldRemove = true;
        }

        if (!shouldRemove && delivery.ageable_booze) {
            for (var specialKey in delivery.ageable_booze) {
                if (specialKey.indexOf(genericKey + ":") === 0) {
                    shouldRemove = true;
                    break;
                }
            }
        }

        if (shouldRemove) {
            inventory[i].setByte("Count", 0);
        }
    }

    var remaining = [];

    for (var j = 0; j < inventory.length; j++) {
        if (inventory[j].getByte("Count") > 0) {
            remaining.push(inventory[j]);
        }
    }

    inventoryCompound.setList("Items", remaining);
}

function clearBarrel(item, delivery) {
    if (!delivery.fluid) {
        return;
    }

    var tankData = item.getNbt().getCompound("tank");
    var currentFluid = String(tankData.getString("currentFluid"));
    var fluidKey = "liquid:" + currentFluid;

    if (delivery.fluid[fluidKey]) {
        tankData.setDouble("fluidLevel", 0);
        tankData.setString("currentFluid", "");
    }
}