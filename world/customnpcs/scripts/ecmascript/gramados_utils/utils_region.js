load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_perms.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region_gadgets.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region_data.js');

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var world = API.getIWorld(0);

/**
 * Sets the owner of a region, regardless of any other ownership or permission settings.
 * @param {string} region - The region name (without the 'region_' prefix).
 * @param {string} owner - The owner name.
 * @param {boolean} maintainTrusted - Whether to keep the existing trusted players list.
 * @returns {boolean} True if the owner was set, false otherwise.
 */
function setRegionOwner(region, owner, maintainTrusted) {
    var region_json = loadRegionData(region);
    if (region_json) {
        region_json.owner = owner;
        if (!maintainTrusted) {
            region_json.trusted = [];
        }
        return saveRegionData(region, region_json);
    }
    return false;
}

/**
 * Removes the owner of a region, making it unowned/available.
 * @param {string} region - The region name (without the 'region_' prefix).
 * @returns {boolean} True if the owner was removed, false otherwise.
 */
function removeRegionOwner(region) {
    return setRegionOwner(region, null, true);
}

/**
 * Adds a player to the trusted list of a region, allowing them access without being the owner.
 * @param {string} region - The region name (without the 'region_' prefix).
 * @param {string} playerName - The player name to add.
 * @returns {boolean} True if the player was added or is already trusted, false otherwise.
*/
function addRegionTrustedPlayer(region, playerName) {
    var region_trusted = getRegionTrustedPlayers(region);
    if (!includes(region_trusted, playerName)) {
        region_trusted.push(playerName);
        return setRegionTrustedPlayers(region, region_trusted);
    }
    return includes(region_trusted, playerName);
}

/**
 * Adds multiple players to the trusted list of a region, allowing them access without being the owner.
 * @param {string} region - The region name (without the 'region_' prefix).
 * @param {Array<string>} playerNames - The list of player names to add.
 * @returns {boolean} True if the players were added, false otherwise.
*/
function addRegionTrustedPlayers(region, playerNames) {
    var region_trusted = getRegionTrustedPlayers(region);
    for (var i = 0; i < playerNames.length; i++) {
        if (!includes(region_trusted, playerNames[i])) {
            region_trusted.push(playerNames[i]);
        }
    }
    return setRegionTrustedPlayers(region, region_trusted);
}

/**
 * Removes a player from the trusted list of a region.
 * @param {string} region - The region name (without the 'region_' prefix).
 * @param {string} playerName - The player name to remove.
 * @returns {boolean} True if the player was removed, false otherwise.
*/
function removeRegionTrustedPlayer(region, playerName) {
    var region_trusted = getRegionTrustedPlayers(region);
    region_trusted = array_remove(region_trusted, playerName)
    return setRegionTrustedPlayers(region, region_trusted);
}

/**
 * Removes multiple players from the trusted list of a region.
 * @param {string} region - The region name (without the 'region_' prefix).
 * @param {Array<string>} playerNames - The list of player names to remove.
 * @returns {boolean} True if the players were removed, false otherwise.
 */
function removeRegionTrustedPlayers(region, playerNames) {
    var region_trusted = getRegionTrustedPlayers(region);
    for (var i = 0; i < playerNames.length; i++) {
        region_trusted = array_remove(region_trusted, playerNames[i]);
    }
    return setRegionTrustedPlayers(region, region_trusted);
}

/** 
 * Removes all players from the trusted list of a region.
 * @param {string} region - The region name (without the 'region_' prefix).
 * @returns {boolean} True if the trusted list was cleared, false otherwise.
*/
function removeAllRegionTrustedPlayers(region) {
    return setRegionTrustedPlayers(region, []);
}

/**
 * Retrieves the list of trusted players for a region.
 * @param {string} region - The region name (without the 'region_' prefix).
 * @returns {Array<string>} An array of player names who are trusted for the region.
*/
function getRegionTrustedPlayers(region) {
    var region_json = loadRegionData(region);
    if (region_json && region_json.trusted) {
        return region_json.trusted;
    }
    return [];
}

/**
 * Sets the list of trusted players for a region.
 * @param {string} region - The region name (without the 'region_' prefix).
 * @param {Array<string>} playerNames - The list of player names to set as trusted.
 * @returns {boolean} True if the list was set successfully, false otherwise.
*/
function setRegionTrustedPlayers(region, playerNames) {
    var region_json = loadRegionData(region);
    if (region_json) {
        region_json.trusted = playerNames;
        return saveRegionData(region, region_json);
    }
    return false;
}

/**
 * Retrieves the price of a region.
 * @param {string} region - The region name.
 * @param {IPlayer} player - The player.
 * @returns {number} The price of the region.
 */
function getRegionPrice(region, player) {
    var worldData = getWorldData();
    var region_json = loadRegionData(region);
    if (region_json
        && region_json.saleType
        && region_json.saleType === "buy"
        && region_json.salePrice) {
        return region_json.salePrice;
    }
    if (region_json.saleType === "rent") {
        tellPlayer(player, "&eRegion " + region + " is sat for rent. Region price is not counted.");
        return 0;
    }
    return 0;
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
    var s = owner.trim();
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
    var blk = world.getBlock(x, y, z);
    if (!blk || !blk.getTileEntity) return null;
    var te = blk.getTileEntity();
    if (!te) return null;
    var li = parseInt(line, 10);
    if (isNaN(li) || li < 1) li = 1; if (li > 4) li = 4;
    var key = "Text" + li;
    var raw = te.getString(key);
    if (!raw) return "";
    var obj = JSON.parse(raw);
    if (obj && typeof obj.text === "string") return obj.text;
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
    var safe = text == null ? "" : ("" + text);
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
 * @param {string} regionName - The region/cuboid name (without the `region_` prefix).
 * @returns {boolean} True if the player is inside the region, false otherwise.
 */
function isPlayerInRegion(player, regionName) {

    var data = loadRegionData(regionName);

    if (!data || !data.positions || !data.positions.length) {
        return false;
    }

    var player_position = getPlayerPos(player);

    for (var i = 0; i < data.positions.length; i++) {
        var sub = data.positions[i];
        if (isWithinAABB(player_position, sub.xyz1, sub.xyz2)) {
            return true;
        }
    }
    return false;
}

function getRegionPriority(region) {
    var data = loadRegionData(region);
    var p = parseInt(data.priority, 10);
    return isNaN(p) ? 0 : p;
}

function getAllRegionsAtPosition(pos) {
    var region_names = getAllRegions();
    var res = [];
    for (var i = 0; i < region_names.length; i++) {
        var name = region_names[i];
        var data = loadRegionData(name);
        if (!data || !data.positions || !data.positions.length) continue;
        for (var j = 0; j < data.positions.length; j++) {
            var sub = data.positions[j];
            if (isWithinAABB(pos, sub.xyz1, sub.xyz2)) {
                res.push(name);
                break;
            }
        }
    }
    return res;
}

/**
 * Checks whether a player's current position lies within ANY sub-cuboid of a region.
 * @param {IPlayer} player - The player instance.
 * @param {string} regionName - The region/cuboid name (without the `region_` prefix).
 * @returns {boolean} True if the player is inside the region, false otherwise.
*/
function getRegionAtPosition(pos) {
    var region_names = getAllRegions();
    var prior_region = null;
    var prior_priority = -Infinity;
    for (var i = 0; i < region_names.length; i++) {
        var name = region_names[i];
        var data = loadRegionData(name);
        if (!data || !data.positions || !data.positions.length) continue;
        for (var j = 0; j < data.positions.length; j++) {
            var sub = data.positions[j];
            if (isWithinAABB(pos, sub.xyz1, sub.xyz2)) {
                var prio = getRegionPriority(name);
                if (prio > prior_priority) {
                    prior_priority = prio;
                    prior_region = name;
                }
            }
        }
    }
    return prior_region;
}

/**
 * Returns a list of region names for which the player's current position is inside any sub-cuboid.
 * @param {IPlayer} player - The player instance.
 * @returns {Array<string>} Array of region names (without the `region_` prefix).
 */
function getAllRegionsAtPlayerPos(player) {
    return getAllRegionsAtPosition(getPlayerPos(player));
}

/**
 * Filters a list of cuboid/region names by substring match.
 * @param {Array<string>} regionNameList
 * @param {string} needle
 * @returns {Array<string>}
*/
function filterRegionsByString(regionNameList, needle) {
    var out = [];
    for (var i = 0; i < regionNameList.length; i++) {
        if (regionNameList[i].indexOf(needle) !== -1) {
            out.push(regionNameList[i]);
        }
    }
    return out;
}
