// Dev tool: Harvest nearby crops
// Attach to a scripted item. Right-click runs current mode; attack cycles modes.
// Modes: 0 = break with setblock air destroy, 1 = break then replant stage 0 of the same crop.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_crops.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

var HARVEST_MODE = 0; // 0..1
var RADIUS = 5;

function interact(event) {
    var player = event.player; if (!player) return;
    var world = player.getWorld(); if (!world) return;

    var pos = getPlayerPos(player);
    pos.y = pos.y - 1; // bias down to cover farmland level on slopes

    var changed = 0;
    if (HARVEST_MODE === 0) {
        tellPlayer(player, '&e[CropHarvest] Break crops within ' + RADIUS + ' blocks');
        changed = harvestCropsBreak(world, pos, RADIUS);
    } else {
        tellPlayer(player, '&e[CropHarvest] Break + reset to stage 0 within ' + RADIUS + ' blocks');
        changed = harvestCropsBreakAndReset(world, pos, RADIUS);
    }

    tellPlayer(player, '&aHarvested &6' + changed + ' &acrop blocks.');
}

function attack(event) {
    var player = event.player; if (!player) return;
    HARVEST_MODE = (HARVEST_MODE + 1) % 2;
    var names = ['&cBreak (air destroy)', '&aBreak + Replant (stage 0)'];
    tellPlayer(player, '&e[CropHarvest] Mode ' + HARVEST_MODE + ': ' + names[HARVEST_MODE]);
}

function getTooltip(e) {
    e.add('&aDev: Harvest Crops (' + RADIUS + ')');
    e.add('&7Right-click: run | Attack: cycle mode');
    e.add('&eMode 0: &7Break crops (setblock air destroy)');
    e.add('&eMode 1: &7Break then replant stage 0');
}
