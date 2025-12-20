// Dev tool: Farmland helper (radius 5)
// Attach to a scripted item; right-click to run current mode, attack to cycle.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_crops.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

var TOOL_MODE = 0; // 0 = fertilize sphere, 1 = till surface, 2 = till+clear vegetation

function interact(event) {
    var player = event.player; if (!player) return;
    var world = player.getWorld(); if (!world) return;

    var pos = getPlayerPos(player);
    // Bias center slightly down to better cover nearby ground on slopes
    pos.y = pos.y - 1;

    var RADIUS = 5;
    var changed = 0;
    if (TOOL_MODE === 0) {
        changed = fertilize_farmland_sphere(world, pos, RADIUS);
        tellPlayer(player, '&aFertilized &6' + changed + ' &afarmland blocks within &6' + RADIUS + '&a blocks.');
    } else if (TOOL_MODE === 1) {
        changed = tillSurfaceToFarmland(world, pos, RADIUS, false);
        tellPlayer(player, '&aTilled &6' + changed + ' &asurface blocks to farmland within &6' + RADIUS + '&a.');
    } else if (TOOL_MODE === 2) {
        changed = tillSurfaceToFarmland(world, pos, RADIUS, true);
        tellPlayer(player, '&aTilled &6' + changed + ' &asurface blocks and cleared vegetation within &6' + RADIUS + '&a.');
    }
}

function attack(event) {
    var player = event.player; if (!player) return;
    TOOL_MODE = (TOOL_MODE + 1) % 3;
    var names = ['&aFertilize Farmland', '&aTill Surface', '&aTill + Clear Vegetation'];
    tellPlayer(player, '&e[FarmlandTool] Mode ' + TOOL_MODE + ': ' + names[TOOL_MODE]);
}

function getTooltip(e) {
    e.add('&aDev: Farmland Helper (5)');
    e.add('&7Right-click: run | Attack: cycle mode');
    e.add('&eMode 0: &7Fertilize dry farmland in a sphere');
    e.add('&eMode 1: &7Till surface (grass/dirt -> farmland)');
    e.add('&eMode 2: &7Till + clear vegetation above');
}
