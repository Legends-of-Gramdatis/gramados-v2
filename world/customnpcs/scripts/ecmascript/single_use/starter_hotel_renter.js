load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

// Item script: On interact, convert all regions with names containing
// "StarterHotel" to rentable (saleType = "rent"). Minimal, additive changes only.

function interact(event) {
    var player = event.player;
    if (!player) return;

    var worldData = getWorldData();
    var keys = worldData.getKeys();
    if (!keys || keys.length === 0) {
        tellPlayer(player, "&cNo world data keys found.");
        return;
    }

    var matched = 0;
    var changed = 0;
    var errors = 0;

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (!key || key.indexOf('region_') !== 0) continue;
        var regionName = key.substring('region_'.length);
        if (regionName.indexOf('StarterHotel') === -1) continue;

        matched++;
        var str = worldData.get(key);
        if (!str) continue;
        var data;
        try {
            data = JSON.parse(str);
        } catch (e) {
            errors++;
            continue;
        }

        if (!data) continue;

        // Ensure rent type, and if unowned but not for sale, set forSale=true.
        var didChange = false;

        if (data.saleType !== 'rent') {
            data.saleType = 'rent';
            didChange = true;
        }

        var hasOwner = !!(data.owner && String(data.owner).length > 0);
        if (data.forSale === false && !hasOwner) {
            data.forSale = true;
            didChange = true;
        }

        if (didChange) {
            worldData.put(key, JSON.stringify(data));
            changed++;
        }
    }

    if (matched === 0) {
        tellPlayer(player, "&eNo regions matched 'StarterHotel'.");
    } else {
        tellPlayer(player, "&aStarterHotel regions scanned: &e" + matched + "&a, updated to rent: &b" + changed + (errors ? " &c(errors:" + errors + ")" : ""));
    }
}

function attack(event) {
    // No-op; interaction performs the conversion.
}
