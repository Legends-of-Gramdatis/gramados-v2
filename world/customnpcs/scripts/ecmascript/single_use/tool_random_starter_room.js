// Tool: Random Unowned Starter Hotel Room Finder
// Attach this script to a CustomNPCs scripted item. On right-click it tells the player
// the name of a random unowned Starter Hotel room region (by naming pattern).
// Requires the region utility functions previously added: getStarterHotelRegions, getRandomUnownedRegion.
// Safe fallback: if all rooms owned, falls back to a configured default region name.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js');

// Configuration
var STARTER_HOTEL_FALLBACK_ROOM = 'Gramados_GramadosCity_StarterHotel_301'; // Used if none unowned
var SHOW_COUNTS = true; // Adds extra debug info (counts of total / unowned)
// Runtime state (per script instance). Stores chosen room per player.
var _starterHotelAssignedRooms = {}; // playerName -> regionName

function interact(event) {
    var player = event.player; if(!player) return;
    try {
        var regions = getStarterHotelRegions(); // [{name,data}]
        if(!regions || !regions.length){
            tellPlayer(player, '&cNo starter hotel regions found.');
            return;
        }
        // Determine fallback dynamically if constant not present among regions
        var fallback = STARTER_HOTEL_FALLBACK_ROOM;
        var hasFallback = false;
        for(var i=0;i<regions.length;i++){ if(regions[i].name === fallback){ hasFallback=true; break; } }
        if(!hasFallback) fallback = regions[0].name; // first region becomes fallback

        // Count unowned
        var unownedNames = [];
        for(var j=0;j<regions.length;j++) {
            var d = regions[j].data || {};
            var owner = d.owner || d.ownerName || (d.meta && d.meta.owner) || null;
            if(!owner) unownedNames.push(regions[j].name);
        }

        var chosen = getRandomUnownedRegion(regions, fallback);
        if(!chosen){
            tellPlayer(player, '&cUnable to select a room.');
            return;
        }
        _starterHotelAssignedRooms[player.getName()] = chosen;
        var wasFallback = unownedNames.indexOf(chosen) === -1; // if not in unowned list, it is fallback
        var msg = '&aRandom starter hotel room: &e' + chosen + (wasFallback ? ' &7(fallback)' : '');
        tellPlayer(player, msg);
        if(SHOW_COUNTS){
            tellPlayer(player, '&7Rooms total: ' + regions.length + ' | Unowned: ' + unownedNames.length);
        }
        logToFile('onboarding', '[room-tool] ' + player.getName() + ' fetched random room: ' + chosen + (wasFallback?' (fallback)':''));
    } catch (e) {
        tellPlayer(player, '&cError selecting room: ' + e);
        logToFile('onboarding', '[room-tool-error] ' + e);
    }
}

function getTooltip(event){
    event.add('&6Starter Hotel Room Tool');
    event.add('&7Right-click for a random unowned room.');
}

// Tick: enforce confinement if a room is assigned.
function tick(event){
    var player = event.player; if(!player) return;
    var room = _starterHotelAssignedRooms[player.getName()];
    if(!room) return; // nothing to confine yet
    var corrected = confinePlayerToRegion(player, room);
    // Light reminder every 40 ticks (~2s) only if a correction happened OR periodic gentle ping every 600 ticks
    if(corrected || (player.ticksExisted % 600 === 0)){
        tellPlayer(player, '&eYou are assigned to room &6' + room + '&e. Stay inside until setup completes.');
    }
}
