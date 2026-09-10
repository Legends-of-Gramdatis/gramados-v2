load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region_access.js');

var DEVLAND_REGION = 'Devland';

function tick(event) {
    var player = event.player;
    if (!player) return;
    // if player name in list, return
    var excludedPlayers = ['TheOddlySeagull', 'Peter_Gramados'];
    if (includes(excludedPlayers, player.name)) {
        return;
    }

    if (excludePlayerFromRegion(player, DEVLAND_REGION)) {
        tellPlayer(player, "&c:cross_mark: Devland is a restricted development area. If you'd like a tour, ask a staff member and they can show you around.");
    }
}
