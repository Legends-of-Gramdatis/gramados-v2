// Utilities for fruit tree/fruit block helpers (Pam's HarvestCraft, etc)
// Nashorn + CustomNPCs API (MC 1.12.2)

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

var SAPLING_TO_TREE_JSON_PATH = 'world/customnpcs/scripts/data/sapling_to_tree.json';

var FRUIT_MAX_STAGE_MAP = null;

function loadFruitMaxStageMap() {
	if (FRUIT_MAX_STAGE_MAP !== null) {
		return FRUIT_MAX_STAGE_MAP;
	}

	var raw = loadJson(SAPLING_TO_TREE_JSON_PATH);
	var out = {};

	if (!raw) {
		FRUIT_MAX_STAGE_MAP = out;
		return FRUIT_MAX_STAGE_MAP;
	}

	var keys = Object.keys(raw);
	for (var i = 0; i < keys.length; i++) {
		var saplingId = keys[i];
		var entry = raw[saplingId];
		if (!entry || !entry.fruit_block) {
			continue;
		}
		var fruitBlock = entry.fruit_block.block;
		var stage = entry.fruit_block.stage;
		if (typeof fruitBlock !== 'string' || fruitBlock.length === 0) {
			continue;
		}
		if (typeof stage !== 'number') {
			continue;
		}
		out[fruitBlock] = stage;
	}

	FRUIT_MAX_STAGE_MAP = out;
	return FRUIT_MAX_STAGE_MAP;
}

function getMaxStageForFruit(fruitBlockId) {
	var map = loadFruitMaxStageMap();
	if (!map) return null;
	return (typeof map[fruitBlockId] === 'number') ? map[fruitBlockId] : null;
}

function spawnGrowthParticles(world, x, y, z) {
	try {
		var base = x + ' ' + (y + 1) + ' ' + z;
		API.executeCommand(world, '/particle happyVillager ' + base + ' 0.4 0.6 0.4 0 10');
		API.executeCommand(world, '/particle reddust ' + base + ' 0.5 0.3 0.5 0.01 12');
	} catch (ignored) {}
}

function spawnRotParticles(world, x, y, z) {
	try {
		var base = x + ' ' + (y + 1) + ' ' + z;
		API.executeCommand(world, '/particle smoke ' + base + ' 0.6 0.6 0.6 0.02 14');
		API.executeCommand(world, '/particle angryVillager ' + base + ' 0.4 0.6 0.4 0 8');
	} catch (ignored) {}
}

function adjustSingleFruitStage(world, x, y, z, delta, forceToValue, withParticles, isRotting) {
	var block = world.getBlock(x, y, z);
	if (!block || typeof block.getName !== 'function') return false;
	var blockId = block.getName();
	var maxStage = getMaxStageForFruit(blockId);
	if (maxStage === null) return false;

	var current = (typeof block.getMetadata === 'function') ? block.getMetadata() : 0;
	var target;
	if (typeof forceToValue === 'number') {
		target = forceToValue;
	} else {
		target = current + delta;
	}

	if (target < 0) target = 0;
	if (target > maxStage) target = maxStage;
	if (target === current) return false;

	world.setBlock(x, y, z, blockId, target);

	if (withParticles === true) {
		if (isRotting === true) spawnRotParticles(world, x, y, z);
		else spawnGrowthParticles(world, x, y, z);
	}

	return true;
}

/**
 * Grow all nearby fruit blocks to their maximum stage.
 * Uses stage info from sapling_to_tree.json entries' fruit_block.stage.
 * @returns {number} Number of fruit blocks changed.
 */
function growFruitsToMax(world, center, radius) {
	var c = (center && typeof center.getX === 'function') ? iposToPos(center) : {
		x: Math.floor(center.x),
		y: Math.floor(center.y),
		z: Math.floor(center.z)
	};

	var r2 = radius * radius;
	var changed = 0;
	for (var dx = -radius; dx <= radius; dx++) {
		for (var dy = -radius; dy <= radius; dy++) {
			for (var dz = -radius; dz <= radius; dz++) {
				if (dx*dx + dy*dy + dz*dz > r2) continue;
				var block = world.getBlock(c.x + dx, c.y + dy, c.z + dz);
				if (!block || typeof block.getName !== 'function') continue;
				var blockId = block.getName();
				var maxStage = getMaxStageForFruit(blockId);
				if (maxStage === null) continue;
				if (adjustSingleFruitStage(world, c.x + dx, c.y + dy, c.z + dz, 0, maxStage, true, false)) changed++;
			}
		}
	}
	return changed;
}

/**
 * Reset all nearby fruit blocks to stage 0.
 * @returns {number} Number of fruit blocks changed.
 */
function resetFruitsToZero(world, center, radius) {
	var c = (center && typeof center.getX === 'function') ? iposToPos(center) : {
		x: Math.floor(center.x),
		y: Math.floor(center.y),
		z: Math.floor(center.z)
	};

	var r2 = radius * radius;
	var changed = 0;
	for (var dx = -radius; dx <= radius; dx++) {
		for (var dy = -radius; dy <= radius; dy++) {
			for (var dz = -radius; dz <= radius; dz++) {
				if (dx*dx + dy*dy + dz*dz > r2) continue;
				var block = world.getBlock(c.x + dx, c.y + dy, c.z + dz);
				if (!block || typeof block.getName !== 'function') continue;
				var blockId = block.getName();
				var maxStage = getMaxStageForFruit(blockId);
				if (maxStage === null) continue;
				if (adjustSingleFruitStage(world, c.x + dx, c.y + dy, c.z + dz, 0, 0, true, true)) changed++;
			}
		}
	}
	return changed;
}

// Exports
var exports_utils_farm_fruits = {
	loadFruitMaxStageMap: loadFruitMaxStageMap,
	getMaxStageForFruit: getMaxStageForFruit,
	growFruitsToMax: growFruitsToMax,
	resetFruitsToZero: resetFruitsToZero
};
