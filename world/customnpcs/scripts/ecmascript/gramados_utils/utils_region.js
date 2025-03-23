load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
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
        && region_json.salePrice) 
        {
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
        tellPlayer(player, "&aRegion transferred to " + region_json.owner + ".");
        tellPlayer(target, "&aRegion transferred from " + regionOwner + ".");
    } else {
        tellPlayer(player, "&cRegion not found.");
    }
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