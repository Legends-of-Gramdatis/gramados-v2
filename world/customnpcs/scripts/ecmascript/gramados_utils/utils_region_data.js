load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_perms.js");
var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var world = API.getIWorld(0);

/**
 * Saves the data of a region to world data.
 * @param {string} region - The region name (without the 'region_' prefix).
 * @param {Object} data - The region data object to save.
 * @returns {boolean} True if the data was saved successfully, false otherwise.
*/
function saveRegionData(region, data) {
    var worldData = getWorldData();
    worldData.put(["region_" + region], JSON.stringify(data));
    syncRegionPermission(region, data);
    updateRegionSigns(region);
    return true;
}

function removeRegionData(region) {
    var worldData = getWorldData();
    worldData.remove(["region_" + region]);
    syncRegionPermission(region, null);
    return true;
}

function createRegionData(region) {
    var worldData = getWorldData();
    var worldAge = new Date().getTime();
    var region_json = {
        displayName: region,
        positions: [],
        created: worldAge,
        updated: worldAge,
        owner: null,
        rentedAt: new Date().getTime(),
        rentTimeCredit: 0,
        maxRentTime: getStringTime('6mon'),
        rentTime: getStringTime('1w'),
        forSale: false,
        saleType: "buy",
        priority: 0,
        salePrice: 0,
        rentPrice: 0,
        flags: {
            noFallDamage: false,
        },
        allInteract: false,
        allBuild: false,
        allAttack: false,
        trusted: [],
    };
    worldData.put(["region_" + region], JSON.stringify(region_json));
    syncRegionPermission(region, region_json);
    return region_json;
}

/**
 * Synchronizes the corresponding region permission entry with region ownership/trusted data.
 *
 * Permission id convention follows CST Region+Permittable domain: `regions.<regionName>`.
 * This helper keeps a managed list of region-derived players in
 * `perm.meta._regionManagedPlayers` so manual permission players are preserved.
 *
 * @param {string} region - Region name without `region_` prefix.
 * @param {Object} regionData - Region payload saved in world data.
 * @returns {boolean}
 */
function syncRegionPermission(region, regionData) {
    if (!region) return false;

    var permissionId = 'regions.' + region;
    var now = new Date().getTime();

    var perm = loadPermissionData(permissionId);
    if (!perm) {
        perm = createDefaultPermissionData();
        perm.created = now;
    }

    if (typeof perm.enabled !== 'boolean') perm.enabled = !!perm.enabled;
    if (!perm.teams) perm.teams = [];
    if (!perm.players) perm.players = [];
    if (!perm.jobs) perm.jobs = [];
    if (!perm.meta) perm.meta = {};

    var previousManaged = perm.meta._regionManagedPlayers || [];
    var players = perm.players;

    // Remove previous auto-managed players before re-adding current owner/trusted.
    for (var i = 0; i < previousManaged.length; i++) {
        players = array_remove(players, previousManaged[i]);
    }

    var nextManaged = [];
    if (regionData) {
        var owner = regionData.owner;
        if (owner != null) {
            owner = owner.trim();
            if (owner.length > 0) nextManaged.push(owner);
        }

        var trusted = regionData.trusted || [];
        for (var t = 0; t < trusted.length; t++) {
            var tr = trusted[t];
            if (tr == null) continue;
            tr = tr.trim();
            if (tr.length > 0 && !includes(nextManaged, tr)) {
                nextManaged.push(tr);
            }
        }
    }

    for (var j = 0; j < nextManaged.length; j++) {
        if (!includes(players, nextManaged[j])) {
            players.push(nextManaged[j]);
        }
    }

    perm.players = players;
    perm.meta._regionManagedPlayers = nextManaged;
    perm.updated = now;

    return savePermissionData(permissionId, perm);
}

/**
 * Loads the data of a region from world data.
 * @param {string} region - The region name (without the 'region_' prefix).
 * @returns {Object|null} The region data object, or null if not found or on error.
*/
function loadRegionData(region) {
    var dataStr = getWorldData().get(["region_" + region]);
    if (dataStr) {
        return JSON.parse(dataStr);
    }
    return null;
}

/**
 * Returns an array of all region names stored in world data.
 * @returns {Array<string>} An array of region names (without the 'region_' prefix).
*/
function getAllRegions() {
    var region_names = [];
    var keys = getWorldData().getKeys();
    for (var i = 0; i < keys.length; i++) {
        var k = '' + keys[i];
        if (k.indexOf('region_') === 0) {
            region_names.push(k.substring('region_'.length));
        }
    }
    return region_names;
}

