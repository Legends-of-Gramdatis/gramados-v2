load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js');

function loadPlayerMeta(player){
    return JSON.parse(getWorldData().get('player_' + player.getName()));
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
    var worldData = getWorldData();
    var parsed = JSON.parse(worldData.get('player_' + player.getName()));
    var homes = (parsed && parsed.homes) ? parsed.homes : {};
    var maxHomes = (parsed && typeof parsed.maxHomes === 'number') ? parsed.maxHomes : 2;
    var names = [];
    for (var k in homes){ if (homes.hasOwnProperty(k)) { names.push(k); } }
    return { homes: homes, maxHomes: maxHomes, names: names, count: names.length };
}