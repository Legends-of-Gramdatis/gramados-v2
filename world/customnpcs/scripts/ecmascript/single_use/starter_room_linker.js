load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js');

function interact(event) {
    var player = event.player;
    var world = player.getWorld();

    if (!player) {
        return;
    }

    // If clicking on a sign block, write owner name of selected region to line 2 and link it
    // var blk = event.block;
    var blk = player.rayTraceBlock(16,false,false).getBlock();

    tellPlayer(player, "&e(blk at " + blk.getX() + "," + blk.getY() + "," + blk.getZ() + ": " + blk.getName() + ")");

    if (blk && blk.getName().toLowerCase().indexOf("sign") !== -1) {
        tellPlayer(player, "&eIt's a sign block.");
        var te = blk.getTileEntityNBT();
        tellPlayer(player, "&e(blk TE: " + te.toJsonString() + ")");
        // Heuristic: a sign has string keys Text1..Text4
        try {
            tellPlayer(player, "&eSign line 2 before: " + te.getString("Text2"));
            var item = event.item;
            var sd = item ? item.getStoreddata() : null;
            var selected = sd ? sd.get("current_region_name") : null;
            if (!selected) {
                tellPlayer(player, "&eNo selected region on this item. Attack to cycle/select first.");
                return;
            }
            var ownerName = getRegionOwnerName(selected);
            setSignLineAt(blk.getX(), blk.getY(), blk.getZ(), 2, ownerName);
            addRegionOwnerSign(selected, { x: blk.getX(), y: blk.getY(), z: blk.getZ(), line: 2 });
            tellPlayer(player, "&aOwner sign updated for &b" + selected + "&a: &f" + ownerName);
            return;
        } catch (e) {
            tellPlayer(player, "&cError reading/modifying sign TE: " + e);
            return;
        }
    } else {
        tellPlayer(player, "&eNot a sign block. Right-click a sign to link the selected region's owner.");
    }

    // Fallback: show the regions the player is currently standing in
    var cuboids = getPlayerCuboids(player) || [];
    if (cuboids.length === 0) {
        tellPlayer(player, "&eYou are not inside any cuboid.");
    } else {
        tellPlayer(player, "&aYou are in &e" + cuboids.length + "&a cuboid(s): &b" + cuboids.join(", "));
    }
}

function attack(event) {
    var player = event.player;
    var item = event.item;
    if (!player || !item) {
        return;
    }

    var cuboids = getPlayerCuboids(player) || [];
    if (cuboids.length === 0) {
        tellPlayer(player, "&eYou are not inside any cuboid to select.");
        return;
    }

    var sd = item.getStoreddata();
    // Start from the previously selected region index/name if still valid
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

    // Move to next region cyclically
    idx = (idx + 1) % cuboids.length;
    var selected = cuboids[idx];

    // Persist selection on the item
    sd.put("current_region_index", String(idx));
    sd.put("current_region_name", selected);

    tellPlayer(player, "&aSelected region: &b" + selected + " &7(" + (idx + 1) + "/" + cuboids.length + ")");
}