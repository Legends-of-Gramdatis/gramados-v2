load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region_gadgets.js');

/**
 * Prevents a player from remaining inside the specified region.
 * If the player is inside one of the region's sub-cuboids, they are moved just outside
 * the nearest horizontal face of that cuboid.
 *
 * @param {IPlayer} player
 * @param {string} regionName Region identifier without the 'region_' prefix.
 * @returns {boolean} true if the player was moved outside; false otherwise.
 */
function excludePlayerFromRegion(player, regionName) {
    if (!player || !regionName) return false;

    var worldData;
    try { worldData = getWorldData(); } catch (e) { return false; }
    if (!worldData) return false;

    var dataStr;
    try { dataStr = worldData.get('region_' + regionName); } catch (e2) { return false; }
    if (!dataStr) return false;

    var data;
    try { data = JSON.parse(dataStr); } catch (e3) { return false; }
    if (!data || !data.positions || !data.positions.length) return false;

    var p = getPlayerPos(player);
    var containing = null;

    for (var i = 0; i < data.positions.length; i++) {
        var sub = data.positions[i];
        if (!sub || !sub.xyz1 || !sub.xyz2) continue;
        if (isWithinAABB(p, sub.xyz1, sub.xyz2)) {
            containing = sub;
            break;
        }
    }

    if (!containing) return false;

    var x1 = Math.min(containing.xyz1[0], containing.xyz2[0]);
    var x2 = Math.max(containing.xyz1[0], containing.xyz2[0]);
    var z1 = Math.min(containing.xyz1[2], containing.xyz2[2]);
    var z2 = Math.max(containing.xyz1[2], containing.xyz2[2]);

    var exits = [
        { distance: p.x - x1, x: x1 - 0.5, z: p.z },
        { distance: x2 - p.x, x: x2 + 1.5, z: p.z },
        { distance: p.z - z1, x: p.x, z: z1 - 0.5 },
        { distance: z2 - p.z, x: p.x, z: z2 + 1.5 }
    ];

    exits.sort(function(a, b) {
        return a.distance - b.distance;
    });

    for (var e = 0; e < exits.length; e++) {
        var target = exits[e];
        var targetPos = {
            x: target.x,
            y: p.y,
            z: target.z
        };
        var stillInside = false;

        for (var j = 0; j < data.positions.length; j++) {
            var check = data.positions[j];
            if (!check || !check.xyz1 || !check.xyz2) continue;
            if (isWithinAABB(targetPos, check.xyz1, check.xyz2)) {
                stillInside = true;
                break;
            }
        }

        if (stillInside) continue;

        try {
            player.setPosition(target.x, p.y, target.z);
            return true;
        } catch (tpErr) {
            return false;
        }
    }

    return false;
}
