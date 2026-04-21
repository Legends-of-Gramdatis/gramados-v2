load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_perms.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region_data.js');

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var world = API.getIWorld(0);

/**
 * Returns an array of all region entries stored in world data.
 * Each entry: { name: string, data: Object }
 * Safe against malformed JSON; such entries are skipped.
*/
function getAllRegionEntries() {
    var all = [];
    var worldData = getWorldData();
    if (!worldData) return all;
    var keys;
    try { keys = worldData.getKeys(); } catch (e) { return all; }
    if (!keys) return all;
    for (var i = 0; i < keys.length; i++) {
        var k = '' + keys[i];
        if (k.indexOf('region_') !== 0) continue;
        var dataStr;
        try { dataStr = worldData.get(k); } catch (e2) { continue; }
        if (!dataStr) continue;
        var parsed;
        try { parsed = JSON.parse(dataStr); } catch (jsonErr) { continue; }
        all.push({ name: k.substring('region_'.length), data: parsed });
    }
    return all;
}

/**
 * Returns all region objects whose name contains a given substring (case-sensitive).
 * @param {string} needle
 * @returns {Array<{name:string,data:Object}>}
*/
function getRegionsByNameContains(needle) {
    if (!needle) return [];
    var regions = getAllRegionEntries();
    var out = [];
    for (var i = 0; i < regions.length; i++) {
        if (regions[i].name.indexOf(needle) !== -1) out.push(regions[i]);
    }
    return out;
}

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

/**
 * Returns the list of regions owned by a player (case-insensitive name match).
 * Scans CustomNPCs world data entries named `region_*` and checks common owner fields:
 *  - owner, ownerName, meta.owner (string)
 *  - owners[], meta.owners[] (array of strings)
 *
 * @param {IPlayer|string} playerOrName - Player instance or exact player name.
 * @param {Object} [options]
 * @param {boolean} [options.includeData=false] - When true, returns array of {name,data} objects instead of names.
 * @param {string}  [options.filterContains]    - If set, only include regions whose name contains this substring.
 * @param {boolean} [options.returnDetails=false] - When true, returns an object with { regions, parseErrors, totalScanned }.
 * @returns {Array<string>|Array<{name:string,data:Object}>|{regions:Array,parseErrors:number,totalScanned:number}}
 */
function getOwnedRegions(playerOrName, options) {
    var opts = options || {};
    var includeData = !!opts.includeData;
    var filterContains = (typeof opts.filterContains === 'string' && opts.filterContains.length > 0) ? opts.filterContains : null;
    var returnDetails = !!opts.returnDetails;

    var pname = (typeof playerOrName === 'string') ? playerOrName
        : (playerOrName && playerOrName.getName ? playerOrName.getName() : null);
    if (!pname) return returnDetails ? { regions: [], parseErrors: 0, totalScanned: 0 } : [];
    var pnameLc = pname.toLowerCase();

    var worldData;
    try { worldData = getWorldData(); } catch (e) { worldData = null; }
    if (!worldData) return returnDetails ? { regions: [], parseErrors: 0, totalScanned: 0 } : [];

    var keys;
    try { keys = worldData.getKeys(); } catch (e2) { keys = []; }
    if (!keys || !keys.length) return returnDetails ? { regions: [], parseErrors: 0, totalScanned: 0 } : [];

    var out = [];
    var parseErrors = 0;
    var scanned = 0;

    for (var i = 0; i < keys.length; i++) {
        var key = '' + keys[i];
        if (key.indexOf('region_') !== 0) continue;
        var regionName = key.substring('region_'.length);
        if (filterContains && regionName.indexOf(filterContains) === -1) continue;
        scanned++;

        var dataStr;
        try { dataStr = worldData.get(key); } catch (gErr) { continue; }
        if (!dataStr) continue;

        var data;
        try { data = JSON.parse(dataStr); } catch (e3) { parseErrors++; continue; }
        if (!data) continue;

        var isOwner = false;
        var owner = data.owner || data.ownerName || (data.meta && data.meta.owner) || null;
        if (owner && owner.toLowerCase() === pnameLc) {
            isOwner = true;
        }
        if (!isOwner) {
            var owners = data.owners || (data.meta && data.meta.owners) || null;
            if (owners && owners.length) {
                for (var j = 0; j < owners.length; j++) {
                    var o = owners[j];
                    if (o && o.toLowerCase() === pnameLc) { isOwner = true; break; }
                }
            }
        }

        if (isOwner) {
            if (includeData) out.push({ name: regionName, data: data });
            else out.push(regionName);
        }
    }

    if (returnDetails) return { regions: out, parseErrors: parseErrors, totalScanned: scanned };
    return out;
}
