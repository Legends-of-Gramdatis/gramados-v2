// Dev tool: Fruit Stage Tools (Pam's HarvestCraft fruit blocks)
// Attach to a scripted item; right-click to run in the current mode, attack to cycle modes.
// Modes:
// 0: Grow nearby fruit blocks to max stage
// 1: Reset nearby fruit blocks to stage 0 (rot)

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_fruits.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

var TOOL_MODE = 0; // 0..1
var RADIUS = 20;    // default radius in blocks

function interact(event) {
	var player = event.player; if (!player) return;
	var world = player.getWorld(); if (!world) return;

	var pos = getPlayerPos(player);
	// Slightly bias down so the sphere covers ground-level fruit blocks on slopes.
	pos.y = pos.y - 1;

	var changed = 0;
	if (TOOL_MODE === 0) {
		tellPlayer(player, '&e[FruitTool] Grow fruits to max within radius ' + RADIUS);
		changed = growFruitsToMax(world, pos, RADIUS);
	} else if (TOOL_MODE === 1) {
		tellPlayer(player, '&e[FruitTool] Reset fruits to 0 within radius ' + RADIUS);
		changed = resetFruitsToZero(world, pos, RADIUS);
	}

	tellPlayer(player, '&aChanged &6' + changed + ' &afruit blocks.');
}

function attack(event) {
	var player = event.player; if (!player) return;
	TOOL_MODE = (TOOL_MODE + 1) % 2;
	var names = [
		'&aGrow To Max',
		'&cReset To 0 (Rot)'
	];
	tellPlayer(player, '&e[FruitTool] Mode ' + TOOL_MODE + ': ' + names[TOOL_MODE]);
}

function getTooltip(e) {
	e.add('&aDev: Fruit Stage Tools (' + RADIUS + ')');
	e.add('&7Right-click: run mode | Attack: cycle mode');
	e.add('&eMode 0: &7Grow nearby fruit blocks to max');
	e.add('&eMode 1: &7Reset nearby fruit blocks to 0 (rot)');
}
