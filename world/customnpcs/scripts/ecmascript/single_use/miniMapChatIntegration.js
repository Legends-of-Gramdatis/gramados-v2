load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

function interact(event) {
    var player = event.player;
    var msg = ':map:&6{facility_ferrous} &bis located at the North-East of Gramados City, near the junkyard. Click here to open it on the Minimap: [name:"Gramados Junkyard", x:-1115, y:75, z:-94]';

    // Preferred: use global helper if your environment provides it
    if (typeof tellPlayer === 'function') {
        tellPlayer(player, msg);
        return;
    }
}
