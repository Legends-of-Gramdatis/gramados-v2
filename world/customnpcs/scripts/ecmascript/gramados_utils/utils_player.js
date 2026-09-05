load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js');

function getPlayerMetaKey(player) {
    return 'player_' + player.getName();
}

function loadPlayerMeta(player){
    return JSON.parse(getWorldData().get(getPlayerMetaKey(player)));
}

/**
 * Saves the player's legacy metadata object back into world stored data.
 * This is the object serialized as `player_<name>` in world_data.json.
 *
 * @param {IPlayer} player
 * @param {Object} data
 * @returns {boolean} True when data was saved.
 */
function savePlayerMeta(player, data) {
    if (!player || !data) return false;

    data.updated = new Date().getTime();
    getWorldData().put(getPlayerMetaKey(player), JSON.stringify(data));
    return true;
}

/**
    * Loads and parses the player's homes metadata from world data.
    * @param {Object} player - The player object.
    * @returns {Object} An object containing homes, maxHomes, names, and count.
    
    * homes: mapping of home names to coordinates  
    * maxHomes: maximum number of homes allowed  
    * names: array of home names  
    * count: number of homes  
**/
function loadPlayerHomesMeta(player){
    var parsed = loadPlayerMeta(player);
    var homes = (parsed && parsed.homes) ? parsed.homes : {};
    var maxHomes = (parsed && typeof parsed.maxHomes === 'number') ? parsed.maxHomes : 2;
    var names = [];
    for (var k in homes){ if (homes.hasOwnProperty(k)) { names.push(k); } }
    return { homes: homes, maxHomes: maxHomes, names: names, count: names.length };
}
