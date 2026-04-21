load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_perms.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_region_gadgets.js");

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var world = API.getIWorld(0);

/**
 * Convenience helper specifically for Starter Hotel regions.
 * Uses naming pattern: "Gramados_GramadosCity_StarterHotel_".
 * @returns {Array<{name:string,data:Object}>}
 */
function getStarterHotelRegions() {
    return getRegionsByNameContains('Gramados_GramadosCity_StarterHotel_');
}

/**
 * Selects a random region (object or string acceptable) from a provided list that has no owner.
 * A region is considered unowned if data.owner / data.ownerName / data.meta.owner are falsy.
 * If none are unowned, returns the fallback (defaultTo) region name provided.
 * @param {Array<{name:string,data:Object}>} regions
 * @param {string} defaultTo Region name to fallback to when none unowned
 * @returns {string|null} Selected region name or null if both list & fallback invalid
 */
function getRandomUnownedRegion(regions, defaultTo) {
    if (!regions || !regions.length) return defaultTo || null;
    var candidates = [];
    for (var i = 0; i < regions.length; i++) {
        var r = regions[i];
        var data = r.data || {};
        var owner = data.owner || data.ownerName || (data.meta && data.meta.owner) || null;
        if (!owner) candidates.push(r.name);
    }
    if (!candidates.length) return defaultTo || null;
    var idx = Math.floor(Math.random() * candidates.length);
    return candidates[idx];
}

/**
 * Ensures the player remains within the specified region (any of its sub-cuboids).
 * If the player is outside all sub-cuboids, finds the nearest point on/in the union of all
 * sub-cuboids and teleports the player there (slightly centered on block with +0.5 offsets for X/Z).
 * @param {IPlayer} player
 * @param {string} regionName Region identifier without the 'region_' prefix.
 * @returns {boolean} true if a corrective teleport occurred; false otherwise.
 */
function confinePlayerToRegion(player, regionName) {
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
    // First, if inside ANY sub-cuboid, nothing to do.
    for (var i = 0; i < data.positions.length; i++) {
        var sub = data.positions[i];
        if (!sub || !sub.xyz1 || !sub.xyz2) continue;
        if (isWithinAABB(p, sub.xyz1, sub.xyz2)) return false; // already inside
    }

    // Compute nearest point across all sub-cuboids AND choose a safe Y with 2-block air clearance.
    var best = null; // {distSq,x,y,z,y1,y2}
    for (var j = 0; j < data.positions.length; j++) {
        var s = data.positions[j];
        if (!s || !s.xyz1 || !s.xyz2) continue;
        var x1 = Math.min(s.xyz1[0], s.xyz2[0]);
        var x2 = Math.max(s.xyz1[0], s.xyz2[0]);
        var y1 = Math.min(s.xyz1[1], s.xyz2[1]);
        var y2 = Math.max(s.xyz1[1], s.xyz2[1]);
        var z1 = Math.min(s.xyz1[2], s.xyz2[2]);
        var z2 = Math.max(s.xyz1[2], s.xyz2[2]);
        // Clamp player position into this AABB (for distance metric)
        var cx = (p.x < x1 ? x1 : (p.x > x2 ? x2 : p.x));
        var cy = (p.y < y1 ? y1 : (p.y > y2 ? y2 : p.y));
        var cz = (p.z < z1 ? z1 : (p.z > z2 ? z2 : p.z));
        var dx = p.x - cx; var dy = p.y - cy; var dz = p.z - cz;
        var distSq = dx * dx + dy * dy + dz * dz;
        if (best === null || distSq < best.distSq) {
            best = { distSq: distSq, x: cx, y: cy, z: cz, y1: y1, y2: y2 };
        }
    }
    if (!best) return false;
    var tx = Math.floor(best.x) + 0.5;
    var tz = Math.floor(best.z) + 0.5;
    // Search for a safe Y (two consecutive air blocks) strictly within the sub-cuboid vertical bounds.
    var bx = Math.floor(best.x), bz = Math.floor(best.z);
    var lowY = Math.floor(best.y1), highY = Math.floor(best.y2);
    if (highY < lowY) { var tmpY = highY; highY = lowY; lowY = tmpY; }
    var startY = Math.min(Math.max(Math.floor(best.y), lowY), highY); // clamp starting point inside bounds
    function isAirPair(y) {
        if (y < lowY || y + 1 > highY) return false; // both blocks must be inside region vertical span
        try {
            var b1 = world.getBlock(bx, y, bz);
            var b2 = world.getBlock(bx, y + 1, bz);
            return b1 && b2 && b1.isAir() && b2.isAir();
        } catch (e) { return false; }
    }
    var safeY = null;
    // Upwards search
    for (var uy = startY; uy <= highY - 1; uy++) { // need y+1 inside so <= highY-1
        if (isAirPair(uy)) { safeY = uy; break; }
    }
    // Downwards search
    if (safeY === null) {
        for (var dy = startY - 1; dy >= lowY; dy--) {
            if (isAirPair(dy)) { safeY = dy; break; }
        }
    }
    if (safeY === null) {
        // Fallback: choose a Y inside region; ensure feet+head inside if possible
        safeY = startY;
        if (safeY + 1 > highY) safeY = Math.max(lowY, highY - 1); // adjust so y+1 inside when possible
    }
    var ty = safeY; // final base Y
    try { player.setPosition(tx, ty, tz); } catch (tpErr) { return false; }
    return true;
}
