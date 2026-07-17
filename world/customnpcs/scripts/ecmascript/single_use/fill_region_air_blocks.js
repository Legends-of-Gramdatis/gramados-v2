// Single-use tool: fills all air blocks inside a region with a chosen block.
// Set REGION_NAME and BLOCK_ID below, then interact with the scripted item.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var WORLD = API.getIWorld(0);

// ── Configuration ──────────────────────────────────────────────────────────────
var REGION_NAME = 'Gramados_GramadosCity_CarpoStreet_6_BrickhallGarage_Garage';  // region name without the 'region_' prefix
var BLOCK_ID    = 'minecraft:stained_glass_pane';        // block id to place (e.g. 'minecraft:planks')
var BLOCK_META  = 6;                        // block metadata / damage value
// ───────────────────────────────────────────────────────────────────────────────

function interact(event) {
    var player = event.player;
    if (!player) return;

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

    for (var i = 0; i < subCuboids.length; i++) {
        var sub = subCuboids[i];

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

                    if (WORLD.getBlock(x, y, z).isAir()) {
                        WORLD.setBlock(x, y, z, BLOCK_ID, BLOCK_META);
                        filled++;
                    }
                }
            }
        }
    }

    tellPlayer(player, '&6[FillAir] &aDone. Filled &e' + filled + '&a air block(s) in region &e' + REGION_NAME + '&a with &e' + BLOCK_ID + '&7 (meta ' + BLOCK_META + ')&a.');
}
