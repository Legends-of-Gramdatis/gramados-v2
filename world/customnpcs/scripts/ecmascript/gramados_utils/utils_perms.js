load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');

var PERMISSION_KEY_PREFIX = 'permission_';

/**
 * Normalizes a permission id by removing the `permission_` prefix when present.
 * @param {string} permissionId
 * @returns {string}
 */
function normalizePermissionId(permissionId) {
    if (permissionId == null) return '';
    var id = String(permissionId);
    if (id.indexOf(PERMISSION_KEY_PREFIX) === 0) {
        return id.substring(PERMISSION_KEY_PREFIX.length);
    }
    return id;
}

/**
 * Converts a permission id to its world-data key.
 * @param {string} permissionId
 * @returns {string}
 */
function permissionKey(permissionId) {
    return PERMISSION_KEY_PREFIX + normalizePermissionId(permissionId);
}

/**
 * Creates a new default permission payload.
 * @returns {{enabled:boolean,teams:Array<string>,players:Array<string>,jobs:Array<string>,meta:Object}}
 */
function createDefaultPermissionData() {
    return {
        enabled: true,
        teams: ['Owner', 'Developer'],
        players: [],
        jobs: [],
        meta: {}
    };
}

/**
 * Safely parses a JSON string.
 * @param {string} raw
 * @returns {Object|null}
 */
function parsePermissionJson(raw) {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

/**
 * Loads permission data from world data.
 * @param {string} permissionId
 * @returns {Object|null}
 */
function loadPermissionData(permissionId) {
    var worldData = getWorldData();
    var raw = worldData.get(permissionKey(permissionId));
    return parsePermissionJson(raw);
}

/**
 * Saves permission data into world data.
 * Ensures canonical fields exist.
 * @param {string} permissionId
 * @param {Object} data
 * @returns {boolean}
 */
function savePermissionData(permissionId, data) {
    if (!data) return false;
    var worldData = getWorldData();

    if (typeof data.enabled !== 'boolean') data.enabled = !!data.enabled;
    if (!data.teams) data.teams = [];
    if (!data.players) data.players = [];
    if (!data.jobs) data.jobs = [];
    if (!data.meta) data.meta = {};

    worldData.put(permissionKey(permissionId), JSON.stringify(data));
    return true;
}

/**
 * Returns true when the permission entry exists.
 * @param {string} permissionId
 * @returns {boolean}
 */
function permissionExists(permissionId) {
    var worldData = getWorldData();
    return worldData.get(permissionKey(permissionId)) != null;
}

/**
 * Creates a permission if it does not exist.
 * @param {string} permissionId
 * @param {Object} [seed]
 * @returns {boolean}
 */
function createPermission(permissionId, seed) {
    if (!normalizePermissionId(permissionId)) return false;
    if (permissionExists(permissionId)) return false;

    var data = createDefaultPermissionData();
    if (seed) {
        if (typeof seed.enabled !== 'undefined') data.enabled = !!seed.enabled;
        if (seed.teams) data.teams = seed.teams;
        if (seed.players) data.players = seed.players;
        if (seed.jobs) data.jobs = seed.jobs;
        if (seed.meta) data.meta = seed.meta;
    }

    return savePermissionData(permissionId, data);
}

/**
 * Removes a permission entry from world data.
 * @param {string} permissionId
 * @returns {boolean}
 */
function removePermission(permissionId) {
    var worldData = getWorldData();
    var key = permissionKey(permissionId);
    if (worldData.get(key) == null) return false;
    worldData.remove(key);
    return true;
}

/**
 * Enables or disables a permission.
 * @param {string} permissionId
 * @param {boolean} enabled
 * @returns {boolean}
 */
function setPermissionEnabled(permissionId, enabled) {
    var data = loadPermissionData(permissionId);
    if (!data) return false;
    data.enabled = !!enabled;
    return savePermissionData(permissionId, data);
}

/**
 * Gets all permission entries.
 * @returns {Array<{id:string,data:Object}>}
 */
function getAllPermissions() {
    var worldData = getWorldData();
    var keys = worldData.getKeys();
    var out = [];

    if (!keys) return out;

    for (var i = 0; i < keys.length; i++) {
        var key = '' + keys[i];
        if (key.indexOf(PERMISSION_KEY_PREFIX) !== 0) continue;

        var raw = worldData.get(key);
        if (!raw) continue;

        var data = parsePermissionJson(raw);
        if (!data) continue;
        out.push({
            id: key.substring(PERMISSION_KEY_PREFIX.length),
            data: data
        });
    }

    return out;
}

/**
 * Gets all permission entries whose id contains a substring.
 * @param {string} needle
 * @returns {Array<{id:string,data:Object}>}
 */
function getPermissionsByNameContains(needle) {
    if (!needle) return [];
    var all = getAllPermissions();
    var out = [];

    for (var i = 0; i < all.length; i++) {
        if (all[i].id.indexOf(needle) !== -1) {
            out.push(all[i]);
        }
    }

    return out;
}

/**
 * Adds a team/player/job to a permission list.
 * Valid list keys: teams, players, jobs.
 * @param {string} permissionId
 * @param {'teams'|'players'|'jobs'} listKey
 * @param {string} value
 * @returns {boolean}
 */
function addPermissionSubject(permissionId, listKey, value) {
    if (!value) return false;
    if (listKey !== 'teams' && listKey !== 'players' && listKey !== 'jobs') return false;

    var data = loadPermissionData(permissionId);
    if (!data) return false;

    if (!data[listKey]) data[listKey] = [];
    if (!includes(data[listKey], value)) {
        data[listKey].push(value);
    }

    return savePermissionData(permissionId, data);
}

/**
 * Removes a team/player/job from a permission list.
 * Valid list keys: teams, players, jobs.
 * @param {string} permissionId
 * @param {'teams'|'players'|'jobs'} listKey
 * @param {string} value
 * @returns {boolean}
 */
function removePermissionSubject(permissionId, listKey, value) {
    if (!value) return false;
    if (listKey !== 'teams' && listKey !== 'players' && listKey !== 'jobs') return false;

    var data = loadPermissionData(permissionId);
    if (!data) return false;

    if (!data[listKey]) data[listKey] = [];
    data[listKey] = array_remove(data[listKey], value);

    return savePermissionData(permissionId, data);
}

/**
 * Checks whether a subject is present in a permission list.
 * Valid list keys: teams, players, jobs.
 * @param {string} permissionId
 * @param {'teams'|'players'|'jobs'} listKey
 * @param {string} value
 * @returns {boolean}
 */
function permissionHasSubject(permissionId, listKey, value) {
    if (!value) return false;
    if (listKey !== 'teams' && listKey !== 'players' && listKey !== 'jobs') return false;

    var data = loadPermissionData(permissionId);
    if (!data || !data[listKey]) return false;

    return includes(data[listKey], value);
}

/**
 * Convenience wrappers for teams.
 */
function addPermissionTeam(permissionId, teamName) {
    return addPermissionSubject(permissionId, 'teams', teamName);
}

function removePermissionTeam(permissionId, teamName) {
    return removePermissionSubject(permissionId, 'teams', teamName);
}

/**
 * Convenience wrappers for players.
 */
function addPermissionPlayer(permissionId, playerName) {
    return addPermissionSubject(permissionId, 'players', playerName);
}

function removePermissionPlayer(permissionId, playerName) {
    return removePermissionSubject(permissionId, 'players', playerName);
}

/**
 * Convenience wrappers for jobs.
 */
function addPermissionJob(permissionId, jobName) {
    return addPermissionSubject(permissionId, 'jobs', jobName);
}

function removePermissionJob(permissionId, jobName) {
    return removePermissionSubject(permissionId, 'jobs', jobName);
}
