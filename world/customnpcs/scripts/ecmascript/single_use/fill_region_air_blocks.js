// Single-use tool: fills all air blocks inside a region with a chosen block.
// Set REGION_NAME and BLOCK_ID below, then interact with the scripted item.
// Block meta is derived from each sub-cuboid's `type` using CustomServerTools/settings.json.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var WORLD = API.getIWorld(0);

// ── Configuration ──────────────────────────────────────────────────────────────
var REGION_NAME = 'Foreval_PortAuxHuîtresSurBellecôte_RouteDePortAuxHuîtres_IodockGarage_Garage';  // region name without the 'region_' prefix
var BLOCK_ID    = 'variedcommodities:placeholder';        // block id to place (e.g. 'minecraft:planks')
// ───────────────────────────────────────────────────────────────────────────────

var SETTINGS_PATH = 'CustomServerTools/settings.json';

function interact(event) {
    var player = event.player;
    if (!player) return;

    var regionTypeMetaMap = getRegionTypeMetaMap();

    var worldData = getWorldData();
    var key = 'region_' + REGION_NAME;
    var rawData = worldData.get(key);

    if (!rawData) {
        tellPlayer(player, '&c[FillAir] Region not found: &e' + REGION_NAME);
        return;
    }

    var regionData = JSON.parse(rawData);

    if (!regionData.positions || regionData.positions.length === 0) {
        tellPlayer(player, '&c[FillAir] No sub-cuboids defined for region: &e' + REGION_NAME);
        return;
    }

    var subCuboids = regionData.positions;
    var filled = 0;
    var processedBlocks = {};

    // tell how many sub-cuboids we are processing
    tellPlayer(player, '&6[FillAir] Processing &e' + subCuboids.length + '&6 sub-cuboid(s) in region &e' + REGION_NAME + '&6...');

    for (var i = 0; i < subCuboids.length; i++) {
        var sub = subCuboids[i];
        var blockMeta = getSubCuboidMeta(sub, regionTypeMetaMap);

        var minX = Math.min(sub.xyz1[0], sub.xyz2[0]);
        var maxX = Math.max(sub.xyz1[0], sub.xyz2[0]);
        var minY = Math.min(sub.xyz1[1], sub.xyz2[1]);
        var maxY = Math.max(sub.xyz1[1], sub.xyz2[1]);
        var minZ = Math.min(sub.xyz1[2], sub.xyz2[2]);
        var maxZ = Math.max(sub.xyz1[2], sub.xyz2[2]);

        for (var x = minX; x <= maxX; x++) {
            for (var y = minY; y <= maxY; y++) {
                for (var z = minZ; z <= maxZ; z++) {
                    var blockKey = x + ',' + y + ',' + z;
                    if (processedBlocks[blockKey]) continue;
                    processedBlocks[blockKey] = true;

                    if (WORLD.getBlock(x, y, z).isAir() && !can_be_broken(WORLD.getBlock(x, y-1, z))) {
                        WORLD.setBlock(x, y, z, BLOCK_ID, blockMeta);
                        filled++;
                    }
                }
            }
        }
    }

    tellPlayer(player, '&6[FillAir] &aDone. Filled &e' + filled + '&a air block(s) in region &e' + REGION_NAME + '&a with &e' + BLOCK_ID + '&a using sub-cuboid type metadata.');
}

function getRegionTypeMetaMap() {
    var settings = loadJson(SETTINGS_PATH);
    var regionTypes = settings && settings.REGION_TYPES ? settings.REGION_TYPES : {};
    var regionTypeNames = Object.keys(regionTypes);
    var metaMap = {};

    for (var i = 0; i < regionTypeNames.length; i++) {
        metaMap[regionTypeNames[i]] = i + 1;
    }

    return metaMap;
}

function getSubCuboidMeta(subCuboid, regionTypeMetaMap) {
    if (!subCuboid || !subCuboid.type) {
        return 0;
    }

    if (typeof regionTypeMetaMap[subCuboid.type] === 'number') {
        return regionTypeMetaMap[subCuboid.type];
    }

    return 0;
}

function can_be_broken(block) {
    // If the block can be changed due to block placing above (path)
    var blockid = block.getName();
    if (includes(["minecraft:grass_path", "minecraft:farmland"], blockid)) {
        return true;
    }
    return false;
}
