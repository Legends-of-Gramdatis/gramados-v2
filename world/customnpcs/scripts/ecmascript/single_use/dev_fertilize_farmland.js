// Dev tool: Fertilize dry farmland around the player within 5 blocks
// Attach to a scripted item; right-click to run.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_crops.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

function interact(event) {
    var player = event.player; if (!player) return;
    var world = player.getWorld(); if (!world) return;

    var pos = getPlayerPos(player);
    // Bias center slightly down to better cover nearby ground on slopes
    pos.y = pos.y - 1;

    var RADIUS = 5;
    var changed = fertilize_farmland_sphere(world, pos, RADIUS);

    tellPlayer(player, '&aFertilized &6' + changed + ' &afarmland blocks within &6' + RADIUS + '&a blocks.');
}

function getTooltip(e) {
    e.add('&aDev: Fertilize Farmland (5)');
    e.add('&7Right-click: wets dry farmland in a 5-block sphere.');
}
