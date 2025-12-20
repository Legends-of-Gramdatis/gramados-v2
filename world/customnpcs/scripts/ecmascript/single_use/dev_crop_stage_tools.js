// Dev tool: Crop Stage Tools
// Attach to a scripted item; right-click to run in the current mode, attack to cycle modes.
// Modes:
// 0: +1 stage to all nearby crops (no particles)
// 1: Random grow (+1..+3) with growth particles
// 2: Grow all to max stage with growth particles
// 3: Reset all to stage 0 with rotting particles
// 4: Random lower (-1..-3) with rotting particles

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_crops.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

var TOOL_MODE = 0; // current mode (0..4)
var RADIUS = 5;    // default radius in blocks

function interact(event) {
    var player = event.player; if (!player) return;
    var world = player.getWorld(); if (!world) return;

    var pos = getPlayerPos(player);
    // Slightly bias down so the sphere covers ground and crops on slopes
    pos.y = pos.y - 1;

    var changed = 0;
    if (TOOL_MODE === 0) {
        tellPlayer(player, '&e[CropTool] +1 stage within radius ' + RADIUS);
        changed = growCropsByOne(world, pos, RADIUS);
    } else if (TOOL_MODE === 1) {
        tellPlayer(player, '&e[CropTool] Random grow (+1..+3) within radius ' + RADIUS);
        changed = randomGrowCrops(world, pos, RADIUS);
    } else if (TOOL_MODE === 2) {
        tellPlayer(player, '&e[CropTool] Grow to max within radius ' + RADIUS);
        changed = growCropsToMax(world, pos, RADIUS);
    } else if (TOOL_MODE === 3) {
        tellPlayer(player, '&e[CropTool] Reset to 0 within radius ' + RADIUS);
        changed = resetCropsToZero(world, pos, RADIUS);
    } else if (TOOL_MODE === 4) {
        tellPlayer(player, '&e[CropTool] Random lower (-1..-3) within radius ' + RADIUS);
        changed = randomLowerCrops(world, pos, RADIUS);
    }

    tellPlayer(player, '&aChanged &6' + changed + ' &acrops.');
}

function attack(event) {
    var player = event.player; if (!player) return;
    TOOL_MODE = (TOOL_MODE + 1) % 5;
    var names = [
        '&a+1 Stage',
        '&aRandom Grow (+1..+3)',
        '&aGrow To Max',
        '&cReset To 0 (Rot)',
        '&cRandom Lower (Rot)'
    ];
    tellPlayer(player, '&e[CropTool] Mode ' + TOOL_MODE + ': ' + names[TOOL_MODE]);
}

function getTooltip(e) {
    e.add('&aDev: Crop Stage Tools (' + RADIUS + ')');
    e.add('&7Right-click: run mode | Attack: cycle mode');
    e.add('&eMode 0: &7+1 stage to all nearby crops');
    e.add('&eMode 1: &7Random grow (+1..+3) with particles');
    e.add('&eMode 2: &7Grow all to max with particles');
    e.add('&eMode 3: &7Reset all to 0 with rot particles');
    e.add('&eMode 4: &7Random lower (-1..-3) with rot particles');
}
