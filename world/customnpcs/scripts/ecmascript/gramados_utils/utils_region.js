load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");

var REGIONAL_DEMAND_JSON_PATH = "world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/regional_demand.json";

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var world = API.getIWorld(0);

/**
 * Retrieves the price of a region.
 * @param {string} region - The region name.
 * @param {IPlayer} player - The player.
 * @returns {number} The price of the region.
 */
function getRegionPrice(region, player) {
    var worldData = getWorldData();
    var region_json = JSON.parse(worldData.get(["region_" + region]));
    if (region_json
        && region_json.saleType
        && region_json.saleType === "buy"
        && region_json.salePrice) {
        return region_json.salePrice;
    }
    // tellPlayer(player, "&cRegion value not found for: " + region);
    // If region_json.saleType === "rent", then let player know price is not considered.
    if (region_json.saleType === "rent") {
        tellPlayer(player, "&eRegion " + region + " is sat for rent. Region price is not counted.");
        return 0;
    }
    return 0;
}

/**
 * Transfers a region from one player to another.
 * @param {IPlayer} player - The player initiating the transfer.
 * @param {string} region - The region name.
 * @param {string} target - The target player.
 */
function transferRegion(player, region, target) {
    var worldData = getWorldData();
    var region_json = JSON.parse(worldData.get(["region_" + region]));
    if (region_json) {
        var regionOwner = region_json.owner;
        region_json.owner = target;
        worldData.put(["region_" + region], JSON.stringify(region_json));
        // tellPlayer(player, "&aRegion transferred to " + region_json.owner + ".");
        // Best-effort notify the target if it's an IPlayer, otherwise skip
        // try { if (target && target.getName) { tellPlayer(target, "&aRegion transferred from " + regionOwner + "."); } } catch (e) {}
        // Update any linked owner signs for this region
        updateRegionOwnerSigns(region);
    } else {
        tellPlayer(player, "&4[ERROR] &cRegion not found: " + region + ". &ePlease contact an admin.");
    }
}

/**
 * Returns a normalized owner display name for a region, or "Available" when not owned.
 * @param {string} region - Region name without the prefix.
 * @returns {string}
 */
function getRegionOwnerName(region) {
    var worldData = getWorldData();
    var dataStr = worldData.get("region_" + region);
    if (!dataStr) return "Available";
    var data;
    try { data = JSON.parse(dataStr); } catch (e) { return "Available"; }
    var owner = data ? data.owner : null;
    return _normalizeOwnerName(owner);
}

function _normalizeOwnerName(owner) {
    if (owner === undefined || owner === null) return "Available";
    var s = String(owner).trim();
    if (s.length === 0) return "Available";
    var low = s.toLowerCase();
    if (low === "none" || low === "null" || low === "undefined") return "Available";
    return s;
}

/**
 * Reads a sign line text at the given coordinates.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} line - 1..4
 * @returns {string|null}
 */
function getSignLineAt(x, y, z, line) {
    var blk = world.getBlock(x | 0, y | 0, z | 0);
    if (!blk || !blk.getTileEntity) return null;
    var te = blk.getTileEntity();
    if (!te) return null;
    var li = parseInt(line, 10);
    if (isNaN(li) || li < 1) li = 1; if (li > 4) li = 4;
    var key = "Text" + li;
    var raw = te.getString(key);
    if (!raw) return "";
    try {
        var obj = JSON.parse(raw);
        if (obj && typeof obj.text === "string") return obj.text;
    } catch (e) { }
    return raw;
}

/**
 * Sets a sign line text at the given coordinates.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} line - 1..4
 * @param {string} text - Plain text to display
 * @returns {boolean} true if set attempted
 */
function setSignLineAt(x, y, z, line, text) {
    var blk = world.getBlock(x | 0, y | 0, z | 0);
    if (!blk || !blk.getTileEntityNBT) return false;
    var te = blk.getTileEntityNBT();
    if (!te) return false;
    var li = parseInt(line, 10);
    if (isNaN(li) || li < 1) li = 1; if (li > 4) li = 4;
    var key = "Text" + li;
    var safe = text == null ? "" : String(text);
    var json = JSON.stringify({ text: safe });
    te.setString(key, json);
    blk.setTileEntityNBT(te);
    // Force block update to reflect changes visually
    try { if (blk.update) blk.update(); } catch (e) { }
    return true;
}

/**
 * Adds or updates a region's linked owner sign list with a new sign reference.
 * Avoids duplicates by (x,y,z,line).
 * @param {string} region - Region name without prefix
 * @param {{x:number,y:number,z:number,line?:number}} sign
 * @returns {boolean}
 */
function addRegionOwnerSign(region, sign) {
    var worldData = getWorldData();
    var key = "region_" + region;
    var str = worldData.get(key);
    if (!str) return false;
    var data;
    try { data = JSON.parse(str); } catch (e) { return false; }
    if (!data.ownerSigns) data.ownerSigns = [];
    var sx = sign.x | 0, sy = sign.y | 0, sz = sign.z | 0; var sl = (sign.line != null ? (sign.line | 0) : 2);
    var exists = false;
    for (var i = 0; i < data.ownerSigns.length; i++) {
        var s = data.ownerSigns[i];
        if (s && (s.x | 0) === sx && (s.y | 0) === sy && (s.z | 0) === sz && ((s.line != null ? (s.line | 0) : 2) === sl)) {
            exists = true; break;
        }
    }
    if (!exists) data.ownerSigns.push({ x: sx, y: sy, z: sz, line: sl });
    worldData.put(key, JSON.stringify(data));
    return true;
}

/**
 * Writes the current owner name to all linked owner signs for a region.
 * @param {string} region - Region name without prefix
 * @returns {boolean}
 */
function updateRegionOwnerSigns(region) {
    var worldData = getWorldData();
    var key = "region_" + region;
    var str = worldData.get(key);
    if (!str) return false;
    var data;
    try { data = JSON.parse(str); } catch (e) { return false; }
    if (!data.ownerSigns || !data.ownerSigns.length) return false;
    var ownerName = getRegionOwnerName(region);
    for (var i = 0; i < data.ownerSigns.length; i++) {
        var s = data.ownerSigns[i];
        if (!s) continue;
        var line = (s.line != null ? s.line : 2);
        setSignLineAt(s.x, s.y, s.z, line, ownerName);
    }
    return true;
}

/**
 * Calculates the size (air blocks) of a cuboid.
 * @param {IPlayer} player - The player.
 * @param {string} cuboid - The cuboid name.
 * @param {string} [subCuboidId] - The optional ID of the sub-cuboid.
 * @returns {number} The total size (air blocks) of the region.
 */
function calculateCuboidSize(player, cuboid, subCuboidId) {
    var worldData = getWorldData();
    cuboid = "region_" + cuboid;
    var cuboidData = JSON.parse(worldData.get(cuboid));
    if (!cuboidData) {
        tellPlayer(player, "&cRegion data not found for: " + cuboid);
        return 0;
    }

    if (!cuboidData.positions) {
        tellPlayer(player, "&cNo sub-cuboids found for: " + cuboid);
        return 0;
    }

    var totalAirBlocks = 0;
    var processedBlocks = {};
    var subCuboids = cuboidData.positions;

    if (subCuboidId) {
        // Handle single ID or list of IDs
        var subCuboidIds = Array.isArray(subCuboidId) ? subCuboidId : [subCuboidId];
        for (var i = 0; i < subCuboidIds.length; i++) {
            var subCuboid = subCuboids[subCuboidIds[i]];
            if (!subCuboid) {
                throw new Error("Sub-cuboid with ID " + subCuboidIds[i] + " not found in cuboid " + cuboid);
            }
            totalAirBlocks += calculateSubCuboidSize(subCuboid, processedBlocks);
        }
    } else {
        for (var i = 0; i < subCuboids.length; i++) {
            totalAirBlocks += calculateSubCuboidSize(subCuboids[i], processedBlocks);
        }
    }

    return totalAirBlocks;
}

/**
 * Calculates the size (air blocks) of a single sub-cuboid.
 * @param {Object} subCuboid - The sub-cuboid data.
 * @param {Object} processedBlocks - The set of already processed blocks.
 * @returns {number} The size (air blocks) of the sub-cuboid.
 */
function calculateSubCuboidSize(subCuboid, processedBlocks) {
    var totalAirBlocks = 0;

    var minX = Math.min(subCuboid.xyz1[0], subCuboid.xyz2[0]);
    var maxX = Math.max(subCuboid.xyz1[0], subCuboid.xyz2[0]);
    var minY = Math.min(subCuboid.xyz1[1], subCuboid.xyz2[1]);
    var maxY = Math.max(subCuboid.xyz1[1], subCuboid.xyz2[1]);
    var minZ = Math.min(subCuboid.xyz1[2], subCuboid.xyz2[2]);
    var maxZ = Math.max(subCuboid.xyz1[2], subCuboid.xyz2[2]);

    for (var x = minX; x <= maxX; x++) {
        for (var y = minY; y <= maxY; y++) {
            for (var z = minZ; z <= maxZ; z++) {
                var blockKey = x + "," + y + "," + z;
                if (!processedBlocks[blockKey] && world.getBlock(x, y, z).isAir()) {
                    processedBlocks[blockKey] = true;
                    totalAirBlocks++;
                }
            }
        }
    }

    return totalAirBlocks;
}

/**
 * Calculates the floor space (2D area) of a cuboid.
 * @param {IPlayer} player - The player.
 * @param {string} cuboid - The cuboid name.
 * @param {string} [subCuboidId] - The optional ID of the sub-cuboid.
 * @returns {number} The total floor space of the region.
 */
function calculateCuboidFloorSpace(player, cuboid, subCuboidId) {
    var worldData = getWorldData();
    cuboid = "region_" + cuboid;
    var cuboidData = JSON.parse(worldData.get(cuboid));
    tellPlayer(player, "&aCalculating floor space for: " + cuboid);
    if (!cuboidData) {
        tellPlayer(player, "&cRegion data not found for: " + cuboid);
        return 0;
    }

    if (!cuboidData.positions) {
        tellPlayer(player, "&cNo sub-cuboids found for: " + cuboid);
        return 0;
    }

    var totalFloorSpace = 0;
    var processedBlocks = {};
    var subCuboids = cuboidData.positions;

    if (subCuboidId) {
        var subCuboid = subCuboids[subCuboidId];
        if (!subCuboid) {
            throw new Error("Sub-cuboid with ID " + subCuboidId + " not found in cuboid " + cuboid);
        }
        totalFloorSpace += calculateSubCuboidFloorSpace(subCuboid, processedBlocks);
    } else {
        for (var i = 0; i < subCuboids.length; i++) {
            totalFloorSpace += calculateSubCuboidFloorSpace(subCuboids[i], processedBlocks);
        }
    }

    return totalFloorSpace;
}

/**
 * Calculates the floor space (2D area) of a single sub-cuboid.
 * @param {Object} subCuboid - The sub-cuboid data.
 * @param {Object} processedBlocks - The set of already processed blocks.
 * @returns {number} The floor space of the sub-cuboid.
 */
function calculateSubCuboidFloorSpace(subCuboid, processedBlocks) {
    var totalFloorSpace = 0;

    var minX = Math.min(subCuboid.xyz1[0], subCuboid.xyz2[0]);
    var maxX = Math.max(subCuboid.xyz1[0], subCuboid.xyz2[0]);
    var minZ = Math.min(subCuboid.xyz1[2], subCuboid.xyz2[2]);
    var maxZ = Math.max(subCuboid.xyz1[2], subCuboid.xyz2[2]);
    var y = Math.min(subCuboid.xyz1[1], subCuboid.xyz2[1]); // Use the lowest Y level as the floor

    for (var x = minX; x <= maxX; x++) {
        for (var z = minZ; z <= maxZ; z++) {
            var blockKey = x + "," + y + "," + z;
            if (!processedBlocks[blockKey] && world.getBlock(x, y, z).isAir()) {
                processedBlocks[blockKey] = true;
                totalFloorSpace++;
            }
        }
    }

    return totalFloorSpace;
}

/**
 * Checks if a region exists.
 * @param {string} region - The region name.
 * @returns {boolean} - True if the region exists, false otherwise.
 */
function checkRegionExists(region) {
    var shopDemand = loadJson(REGIONAL_DEMAND_JSON_PATH);
    shopDemand = shopDemand["Local Demands"];
    return shopDemand && shopDemand[region];
}

/**
 * Checks if a sub-region exists within a region.
 * @param {string} region - The region name.
 * @param {string} subRegion - The sub-region name.
 * @returns {boolean} - True if the sub-region exists, false otherwise.
 */
function checkSubRegionExists(region, subRegion) {
    var shopDemand = loadJson(REGIONAL_DEMAND_JSON_PATH);
    shopDemand = shopDemand["Local Demands"];
    return shopDemand && shopDemand[region] && shopDemand[region][subRegion];
}

/**
 * Calculates the total size and floor space of a cuboid group.
 * @param {IPlayer} player - The player.
 * @param {Object} cuboidGroup - The cuboid group data.
 * @returns {Object} An object containing the total size and floor space.
 */
function calculateCuboidGroupSize(player, cuboidGroup) {
    var totalSize = 0;
    var floorSpace = 0;
    var visitedBlocks = {}; // Use an object instead of Set

    for (var cuboidId in cuboidGroup) {
        // tellPlayer(player, "&aCalculating size for cuboid: &e" + cuboidId);
        var subCuboids = cuboidGroup[cuboidId];
        for (var i = 0; i < subCuboids.length; i++) {
            var subCuboidId = subCuboids[i];
            var cuboidData = getCuboidData(cuboidId, subCuboidId);
            // tellPlayer(player, "&aCalculating size for sub-cuboid: &e" + JSON.stringify(cuboidData));

            if (!cuboidData) {
                continue;
            }

            var xyz1 = cuboidData.xyz1;
            var xyz2 = cuboidData.xyz2;
            var x1 = xyz1[0], y1 = xyz1[1], z1 = xyz1[2];
            var x2 = xyz2[0], y2 = xyz2[1], z2 = xyz2[2];

            for (var x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
                for (var y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                    for (var z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) {
                        var blockKey = x + "," + y + "," + z;
                        if (!visitedBlocks[blockKey]) {
                            visitedBlocks[blockKey] = true; // Mark block as visited
                            var block = world.getBlock(x, y, z);

                            if (block.isAir()) {
                                totalSize++;
                            }

                            if (y === Math.min(y1, y2)) {
                                floorSpace++;
                            }
                        }
                    }
                }
            }
        }
    }

    // tellPlayer(player, "&aTotal size: &e" + totalSize);
    // tellPlayer(player, "&aFloor space: &e" + floorSpace);

    return {
        total_size: totalSize,
        floor_space: floorSpace
    };
}

/**
 * Retrieves the data of a cuboid.
 * @param {string} cuboid - The cuboid name.
 * @param {string} subCuboidId - The sub-cuboid ID.
 * @returns {Object} - The cuboid data.
 */
function getCuboidData(cuboid, subCuboidId) {
    var worldData = getWorldData();
    var cuboidData = JSON.parse(worldData.get(["region_" + cuboid]));
    if (!cuboidData) {
        return null;
    }

    var subCuboids = cuboidData.positions;
    return subCuboids[subCuboidId];
}

/**
 * Checks whether a player's current position lies within ANY sub-cuboid of a region.
 * @param {IPlayer} player - The player instance.
 * @param {string} cuboid - The region/cuboid name (without the `region_` prefix).
 * @returns {boolean} True if the player is inside the region, false otherwise.
 */
function isPlayerInCuboid(player, cuboid) {
    var worldData = getWorldData();
    var dataStr = worldData.get("region_" + cuboid);
    if (!dataStr) {
        return false;
    }
    var data = JSON.parse(dataStr);
    if (!data || !data.positions || !data.positions.length) {
        return false;
    }
    var p = getPlayerPos(player);

    for (var i = 0; i < data.positions.length; i++) {
        var sub = data.positions[i];
        if (!sub || !sub.xyz1 || !sub.xyz2) continue;
        if (isWithinAABB(p, sub.xyz1, sub.xyz2)) return true;
    }
    return false;
}

/**
 * Checks whether a player's current position lies within a specific sub-cuboid of a region.
 * @param {IPlayer} player - The player instance.
 * @param {string} cuboid - The region/cuboid name (without the `region_` prefix).
 * @param {number|string} subCuboidId - Index of the sub-cuboid within the region's `positions` array.
 * @returns {boolean} True if the player is inside the specific sub-cuboid, false otherwise.
 */
function isPlayerInSubCuboid(player, cuboid, subCuboidId) {
    var worldData = getWorldData();
    var dataStr = worldData.get("region_" + cuboid);
    if (!dataStr) {
        return false;
    }
    var data = JSON.parse(dataStr);
    if (!data || !data.positions || !data.positions.length) {
        return false;
    }

    var idx = parseInt(subCuboidId, 10);
    if (isNaN(idx) || idx < 0 || idx >= data.positions.length) {
        return false;
    }

    var sub = data.positions[idx];
    if (!sub || !sub.xyz1 || !sub.xyz2) {
        return false;
    }

    var p = getPlayerPos(player);
    return isWithinAABB(p, sub.xyz1, sub.xyz2);
}

/**
 * Returns a list of region names for which the player's current position is inside any sub-cuboid.
 * @param {IPlayer} player - The player instance.
 * @returns {Array<string>} Array of region names (without the `region_` prefix).
 */
function getPlayerCuboids(player) {
    var regions = getAllRegions();
    var res = [];
    var p = getPlayerPos(player);
    for (var i = 0; i < regions.length; i++) {
        var r = regions[i];
        var data = r.data;
        if (!data || !data.positions || !data.positions.length) continue;
        // Owner lookup (side-effect readiness for future filtering / room assignment)
        var owner = null;
        try {
            owner = data.owner || data.ownerName || (data.meta && data.meta.owner) || null;
        } catch (e) { owner = null; }
        for (var j = 0; j < data.positions.length; j++) {
            var sub = data.positions[j];
            if (!sub || !sub.xyz1 || !sub.xyz2) continue;
            if (isWithinAABB(p, sub.xyz1, sub.xyz2)) {
                res.push(r.name); // Keep original contract: array of names only
                break;
            }
        }
    }
    return res;
}

/**
 * Returns an array of all region entries stored in world data.
 * Each entry: { name: string, data: Object }
 * Safe against malformed JSON; such entries are skipped.
 */
function getAllRegions() {
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
    var regions = getAllRegions();
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
    var pnameLc = String(pname).toLowerCase();

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
        if (owner && String(owner).toLowerCase() === pnameLc) {
            isOwner = true;
        }
        if (!isOwner) {
            var owners = data.owners || (data.meta && data.meta.owners) || null;
            if (owners && owners.length) {
                for (var j = 0; j < owners.length; j++) {
                    var o = owners[j];
                    if (o && String(o).toLowerCase() === pnameLc) { isOwner = true; break; }
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