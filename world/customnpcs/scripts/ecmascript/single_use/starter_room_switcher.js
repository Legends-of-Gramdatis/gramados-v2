load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js');

// Debug helper: Select region with attack (same keys as the linker),
// then interact to transfer that selected region to TheOddlySeagull.

function interact(event) {
    var player = event.player;
    var item = event.item;
    if (!player) return;

    if (!item) {
        tellPlayer(player, "&eHold the switcher item to use it.");
        return;
    }

    var sd = item.getStoreddata();
    var selected = sd ? sd.get("current_region_name") : null;
    if (!selected) {
        tellPlayer(player, "&eNo selected region on this item. Attack to cycle/select first.");
        return;
    }

    // Transfer selected region ownership to the named player (store as string for JSON safety)
    var targetName = "Colt_44_magnum";
    transferRegion(player, selected, targetName);
}

function attack(event) {
    var player = event.player;
    var item = event.item;
    if (!player || !item) return;

    var cuboids = getPlayerCuboids(player) || [];
    if (cuboids.length === 0) {
        tellPlayer(player, "&eYou are not inside any cuboid to select.");
        return;
    }

    var sd = item.getStoreddata();
    var savedName = sd.get("current_region_name");
    var idxStr = sd.get("current_region_index");
    var idx = 0;

    if (savedName && cuboids.indexOf(savedName) !== -1) {
        idx = cuboids.indexOf(savedName);
    } else if (typeof idxStr === 'string' && idxStr.length > 0) {
        var parsed = parseInt(idxStr, 10);
        if (!isNaN(parsed)) {
            idx = Math.max(0, Math.min(parsed, cuboids.length - 1));
        }
    }

    // Cycle to next
    idx = (idx + 1) % cuboids.length;
    var selected = cuboids[idx];

    // Persist on the item
    sd.put("current_region_index", String(idx));
    sd.put("current_region_name", selected);

    tellPlayer(player, "&aSelected region: &b" + selected + " &7(" + (idx + 1) + "/" + cuboids.length + ")");
}
