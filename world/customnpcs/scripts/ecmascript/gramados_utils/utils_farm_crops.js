// Utilities for crop and farmland helpers
// Nashorn + CustomNPCs API (MC 1.12.2)

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_inventory.js');

var SEED_TO_CROP_MAP = null;
var CROP_MAX_STAGE_MAP = null;

/**
 * Fertilize (soak) dry farmland in a circle at a given Y level.
 * Scans all blocks within a radius on the horizontal plane and sets
 * minecraft:farmland with metadata 0 (dry) to metadata 7 (fully wet).
 *
 * Note: This operates strictly at the Y level of `center`. If you want to
 * target ground under a player, pass a center with y-1.
 *
 * @param {IWorld} world - CustomNPCs world instance.
 * @param {{x:number,y:number,z:number}|IPos} center - Center position (floored).
 * @param {number} radius - Circle radius in blocks.
 * @returns {number} Number of farmland blocks changed.
 */
function fertilize_farmland_circle(world, center, radius) {
	var c;
	if (center && typeof center.getX === 'function') {
		c = iposToPos(center);
	} else {
		c = {
			x: Math.floor(center.x),
			y: Math.floor(center.y),
			z: Math.floor(center.z)
		};
	}

	var r2 = radius * radius;
	var changed = 0;

	for (var dx = -radius; dx <= radius; dx++) {
		for (var dz = -radius; dz <= radius; dz++) {
			if (dx * dx + dz * dz > r2) continue; // outside circle
			var x = c.x + dx;
			var z = c.z + dz;
			var block = world.getBlock(x, c.y, z);
			if (!block) continue;
			if (typeof block.getName === 'function' && block.getName() === 'minecraft:farmland') {
				var meta = (typeof block.getMetadata === 'function') ? block.getMetadata() : 0;
				if (meta === 0) {
					world.setBlock(x, c.y, z, 'minecraft:farmland', 7);
					changed++;
				}
			}
		}
	}

	return changed;
}

/**
 * Fertilize (soak) dry farmland within a spherical radius.
 * Scans all blocks with distance <= radius from center (3D) and sets
 * minecraft:farmland with metadata 0 (dry) to metadata 7 (fully wet).
 *
 * @param {IWorld} world - CustomNPCs world instance.
 * @param {{x:number,y:number,z:number}|IPos} center - Center position (floored or IPos).
 * @param {number} radius - Sphere radius in blocks.
 * @returns {number} Number of farmland blocks changed.
 */
function fertilize_farmland_sphere(world, center, radius) {
	var c;
	if (center && typeof center.getX === 'function') {
		c = iposToPos(center);
	} else {
		c = {
			x: Math.floor(center.x),
			y: Math.floor(center.y),
			z: Math.floor(center.z)
		};
	}

	var r2 = radius * radius;
	var changed = 0;

	for (var dx = -radius; dx <= radius; dx++) {
		for (var dy = -radius; dy <= radius; dy++) {
			for (var dz = -radius; dz <= radius; dz++) {
				if (dx*dx + dy*dy + dz*dz > r2) continue;
				var x = c.x + dx;
				var y = c.y + dy;
				var z = c.z + dz;
				var block = world.getBlock(x, y, z);
				if (!block) continue;
				if (typeof block.getName === 'function' && block.getName() === 'minecraft:farmland') {
					var meta = (typeof block.getMetadata === 'function') ? block.getMetadata() : 0;
					if (meta === 0) {
						world.setBlock(x, y, z, 'minecraft:farmland', 7);
						changed++;
					}
				}
			}
		}
	}

	return changed;
}

/**
 * Load the seed-to-crop mapping from JSON (lazy-loaded).
 * @returns {object} The seed-to-crop mapping object.
 */
function loadSeedToCropMap() {
	if (SEED_TO_CROP_MAP === null) {
		SEED_TO_CROP_MAP = loadJson('world/customnpcs/scripts/data/seed_to_crop.json');
	}
	return SEED_TO_CROP_MAP;
}

/**
 * Build and cache a map of crop block id -> max growth stage.
 * Derived from seed_to_crop.json entries' "crop" and "stage".
 * @returns {object} Map of crop block id to max stage (number).
 */
function loadCropMaxStageMap() {
	if (CROP_MAX_STAGE_MAP === null) {
		CROP_MAX_STAGE_MAP = {};
		var seedMap = loadSeedToCropMap();
		if (seedMap) {
			for (var seedId in seedMap) {
				var entry = seedMap[seedId];
				if (!entry) continue;
				var cropId = entry.crop;
				var stage = entry.stage;
				if (typeof cropId === 'string' && typeof stage === 'number') {
					// First entry wins; avoid accidental overrides
					if (typeof CROP_MAX_STAGE_MAP[cropId] === 'undefined') {
						CROP_MAX_STAGE_MAP[cropId] = stage;
					}
				}
			}
		}
	}
	return CROP_MAX_STAGE_MAP;
}

/**
 * Get the crop block ID for a given seed item.
 * 
 * @param {string} seedItemId - Seed item ID (e.g., 'minecraft:wheat_seeds').
 * @param {number} [damage=0] - Item damage/meta.
 * @returns {string|null} Crop block ID (e.g., 'minecraft:wheat') or null if not found.
 */
function getCropBlockForSeed(seedItemId, damage) {
	if (typeof damage === 'undefined' || damage === null) damage = 0;
	
	var map = loadSeedToCropMap();
	if (!map || !map[seedItemId]) return null;
	
	var entry = map[seedItemId];
	// Check if damage matches (if damage is specified in map)
	if (typeof entry.damage !== 'undefined' && entry.damage !== damage) return null;
	
	return entry.crop || null;
}

/**
 * Get maximum stage for the given crop block id.
 * Returns null if the crop id is unknown (not present in config JSON).
 * @param {string} cropBlockId
 * @returns {number|null}
 */
function getMaxStageForCrop(cropBlockId) {
	var map = loadCropMaxStageMap();
	if (!map) return null;
	return (typeof map[cropBlockId] === 'number') ? map[cropBlockId] : null;
}

/**
 * Spawn a simple particle effect at a position (growth-themed).
 * Uses server /particle command via API for consistency.
 */
function spawnGrowthParticles(world, x, y, z) {
	try {
		var base = x + ' ' + (y + 1) + ' ' + z;
		API.executeCommand(world, '/particle happyVillager ' + base + ' 0.4 0.6 0.4 0 10');
		API.executeCommand(world, '/particle reddust ' + base + ' 0.5 0.3 0.5 0.01 12');
	} catch (ignored) {}
}

/**
 * Spawn a rotting-themed particle effect at a position.
 */
function spawnRotParticles(world, x, y, z) {
	try {
		var base = x + ' ' + (y + 1) + ' ' + z;
		API.executeCommand(world, '/particle smoke ' + base + ' 0.6 0.6 0.6 0.02 14');
		API.executeCommand(world, '/particle angryVillager ' + base + ' 0.4 0.6 0.4 0 8');
	} catch (ignored) {}
}

/**
 * Internal helper to adjust a single crop block's stage, clamped to [0, max].
 * Returns true if a change was made.
 */
function adjustSingleCropStage(world, x, y, z, delta, forceToValue, withParticles, isRotting) {
	var block = world.getBlock(x, y, z);
	if (!block || typeof block.getName !== 'function') return false;
	var blockId = block.getName();
	var maxStage = getMaxStageForCrop(blockId);
	if (maxStage === null) return false; // unknown crop type; do nothing

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
 * Add +1 stage to all nearby crops (within spherical radius).
 * Does not exceed max stages from JSON.
 * @returns {number} Number of crops changed.
 */
function growCropsByOne(world, center, radius) {
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
				if (adjustSingleCropStage(world, c.x + dx, c.y + dy, c.z + dz, 1, null, false, false)) changed++;
			}
		}
	}
	return changed;
}

/**
 * Apply a random growth (+1..+3) to nearby crops with particles.
 * @returns {number} Number of crops changed.
 */
function randomGrowCrops(world, center, radius) {
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
				var delta = 1 + Math.floor(Math.random() * 3); // 1..3
				if (adjustSingleCropStage(world, c.x + dx, c.y + dy, c.z + dz, delta, null, true, false)) changed++;
			}
		}
	}
	return changed;
}

/**
 * Grow all nearby crops to their maximum stage with particles.
 * @returns {number} Number of crops changed.
 */
function growCropsToMax(world, center, radius) {
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
				var maxStage = getMaxStageForCrop(blockId);
				if (maxStage === null) continue;
				if (adjustSingleCropStage(world, c.x + dx, c.y + dy, c.z + dz, 0, maxStage, true, false)) changed++;
			}
		}
	}
	return changed;
}

/**
 * Reset all nearby crops to stage 0 (rotting particles).
 * @returns {number} Number of crops changed.
 */
function resetCropsToZero(world, center, radius) {
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
				var maxStage = getMaxStageForCrop(blockId);
				if (maxStage === null) continue;
				if (adjustSingleCropStage(world, c.x + dx, c.y + dy, c.z + dz, 0, 0, true, true)) changed++;
			}
		}
	}
	return changed;
}

/**
 * Lower nearby crops by a random amount (1..3) with rotting particles.
 * @returns {number} Number of crops changed.
 */
function randomLowerCrops(world, center, radius) {
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
				var delta = 1 + Math.floor(Math.random() * 3); // 1..3
				if (adjustSingleCropStage(world, c.x + dx, c.y + dy, c.z + dz, -delta, null, true, true)) changed++;
			}
		}
	}
	return changed;
}

/**
 * Harvest nearby crops by breaking them with setblock air destroy.
 * Filters to known crop ids.
 * @returns {number} Number of crops harvested.
 */
function harvestCropsBreak(world, center, radius) {
	var c = (center && typeof center.getX === 'function') ? iposToPos(center) : {
		x: Math.floor(center.x),
		y: Math.floor(center.y),
		z: Math.floor(center.z)
	};

	var r2 = radius * radius;
	var harvested = 0;
	for (var dx = -radius; dx <= radius; dx++) {
		for (var dy = -radius; dy <= radius; dy++) {
			for (var dz = -radius; dz <= radius; dz++) {
				if (dx*dx + dy*dy + dz*dz > r2) continue;
				var x = c.x + dx;
				var y = c.y + dy;
				var z = c.z + dz;
				var block = world.getBlock(x, y, z);
				if (!block || typeof block.getName !== 'function') continue;
				var blockId = block.getName();
				if (getMaxStageForCrop(blockId) === null) continue; // not a known crop
				API.executeCommand(world, '/setblock ' + x + ' ' + y + ' ' + z + ' air 0 destroy');
				harvested++;
			}
		}
	}
	return harvested;
}

/**
 * Break nearby crops (air destroy), then replant the same crop block at stage 0.
 * Filters to known crop ids. Returns number processed.
 */
function harvestCropsBreakAndReset(world, center, radius) {
	var c = (center && typeof center.getX === 'function') ? iposToPos(center) : {
		x: Math.floor(center.x),
		y: Math.floor(center.y),
		z: Math.floor(center.z)
	};

	var r2 = radius * radius;
	var harvested = 0;
	for (var dx = -radius; dx <= radius; dx++) {
		for (var dy = -radius; dy <= radius; dy++) {
			for (var dz = -radius; dz <= radius; dz++) {
				if (dx*dx + dy*dy + dz*dz > r2) continue;
				var x = c.x + dx;
				var y = c.y + dy;
				var z = c.z + dz;
				var block = world.getBlock(x, y, z);
				if (!block || typeof block.getName !== 'function') continue;
				var blockId = block.getName();
				if (getMaxStageForCrop(blockId) === null) continue; // not a known crop
				// Break to drop items, then replant at stage 0
				API.executeCommand(world, '/setblock ' + x + ' ' + y + ' ' + z + ' air 0 destroy');
				world.setBlock(x, y, z, blockId, 0);
				harvested++;
			}
		}
	}
	return harvested;
}

/**
 * Till nearby surface blocks (grass/dirt) into farmland.
 * If clearVegetation=true, removes grass/flowers/tallgrass above before tilling.
 * Only acts when the block above is air or vegetation (for clear mode).
 * @returns {number} Number of blocks converted to farmland.
 */
function tillSurfaceToFarmland(world, center, radius, clearVegetation) {
	if (typeof clearVegetation === 'undefined' || clearVegetation === null) clearVegetation = false;
	var c = (center && typeof center.getX === 'function') ? iposToPos(center) : {
		x: Math.floor(center.x),
		y: Math.floor(center.y),
		z: Math.floor(center.z)
	};

	var vegetationIds = {
		"minecraft:tallgrass": true,
		"minecraft:red_flower": true,
		"minecraft:yellow_flower": true,
		"minecraft:double_plant": true,
		"minecraft:deadbush": true
	};

	var r2 = radius * radius;
	var converted = 0;
	for (var dx = -radius; dx <= radius; dx++) {
		for (var dy = -radius; dy <= radius; dy++) {
			for (var dz = -radius; dz <= radius; dz++) {
				if (dx*dx + dy*dy + dz*dz > r2) continue;
				var x = c.x + dx;
				var y = c.y + dy;
				var z = c.z + dz;
				var block = world.getBlock(x, y, z);
				if (!block || typeof block.getName !== 'function') continue;
				var id = block.getName();
				if (id !== 'minecraft:dirt' && id !== 'minecraft:grass') continue;

				var above = world.getBlock(x, y + 1, z);
				if (!above) continue;
				var aboveIsAir = typeof above.isAir === 'function' && above.isAir();
				var aboveIsVeg = false;
				if (!aboveIsAir && typeof above.getName === 'function') {
					var aboveId = above.getName();
					aboveIsVeg = !!vegetationIds[aboveId];
				}

				if (!aboveIsAir && !(clearVegetation && aboveIsVeg)) continue;

				if (clearVegetation && aboveIsVeg) {
					// Clear the vegetation above (and potential double plant top)
					world.setBlock(x, y + 1, z, 'minecraft:air', 0);
					var above2 = world.getBlock(x, y + 2, z);
					if (above2 && typeof above2.getName === 'function' && above2.getName() === 'minecraft:double_plant') {
						world.setBlock(x, y + 2, z, 'minecraft:air', 0);
					}
				}

				// Convert to farmland (dry, stage 0)
				world.setBlock(x, y, z, 'minecraft:farmland', 0);
				converted++;
			}
		}
	}
	return converted;
}

/**
 * Plant crops on farmland blocks within a spherical radius.
 * If count is -1, plants unlimited (ignores player inventory).
 * Otherwise, consumes seeds from player inventory and plants up to count crops.
 * 
 * @param {IWorld} world - CustomNPCs world instance.
 * @param {{x:number,y:number,z:number}|IPos} center - Center position.
 * @param {number} radius - Sphere radius in blocks.
 * @param {string} seedItemId - Seed item ID (e.g., 'minecraft:wheat_seeds').
 * @param {number} count - Number of crops to plant. -1 = unlimited (no inventory check).
 * @param {IPlayer|null} [player=null] - Player to consume seeds from. Required if count != -1.
 * @param {number} [damage=0] - Seed item damage.
 * @returns {number} Leftover count (0 if all planted, or remaining if not enough farmland/seeds).
 */
function plantCropsOnFarmland(world, center, radius, seedItemId, count, player, damage) {
	if (typeof damage === 'undefined' || damage === null) damage = 0;
	if (typeof player === 'undefined') player = null;
	
	var c;
	if (center && typeof center.getX === 'function') {
		c = iposToPos(center);
	} else {
		c = {
			x: Math.floor(center.x),
			y: Math.floor(center.y),
			z: Math.floor(center.z)
		};
	}
	
	// Get crop block for this seed
	var cropBlock = getCropBlockForSeed(seedItemId, damage);
	if (!cropBlock) return count; // Unknown seed type
	
	// Check player inventory if limited count
	var availableSeeds = -1;
	if (count !== -1) {
		if (!player) return count; // Need player for inventory check
		availableSeeds = countItemInInventory(player, seedItemId, damage, null);
		if (availableSeeds === 0) return count; // No seeds
	}
	
	// Determine max plantable
	var maxPlantable = count;
	if (count === -1) {
		maxPlantable = 999999; // Effectively unlimited
	} else {
		maxPlantable = Math.min(count, availableSeeds);
	}
	
	var planted = 0;
	var r2 = radius * radius;
	
	// Scan sphere for farmland blocks
	for (var dx = -radius; dx <= radius && planted < maxPlantable; dx++) {
		for (var dy = -radius; dy <= radius && planted < maxPlantable; dy++) {
			for (var dz = -radius; dz <= radius && planted < maxPlantable; dz++) {
				if (dx*dx + dy*dy + dz*dz > r2) continue;
				
				var x = c.x + dx;
				var y = c.y + dy;
				var z = c.z + dz;
				
				// Check if this block is farmland
				var blockBelow = world.getBlock(x, y, z);
				if (!blockBelow) continue;
				if (typeof blockBelow.getName !== 'function' || blockBelow.getName() !== 'minecraft:farmland') continue;
				
				// Check if block above is air
				var blockAbove = world.getBlock(x, y + 1, z);
				if (!blockAbove || !blockAbove.isAir()) continue;
				
				// Plant the crop
				world.setBlock(x, y + 1, z, cropBlock, 0);
				planted++;
			}
		}
	}
	
	// Remove seeds from player inventory if applicable
	if (count !== -1 && planted > 0 && player) {
		removeItemsFromInventory(player, seedItemId, planted, damage, null);
	}
	
	// Return leftover count
	if (count === -1) return 0; // Unlimited mode
	return count - planted;
}

// Exports
var exports_utils_farm_crops = {
	loadSeedToCropMap: loadSeedToCropMap,
	loadCropMaxStageMap: loadCropMaxStageMap,
	getCropBlockForSeed: getCropBlockForSeed,
	getMaxStageForCrop: getMaxStageForCrop,
	fertilize_farmland_circle: fertilize_farmland_circle,
	fertilize_farmland_sphere: fertilize_farmland_sphere,
	plantCropsOnFarmland: plantCropsOnFarmland,
	growCropsByOne: growCropsByOne,
	randomGrowCrops: randomGrowCrops,
	growCropsToMax: growCropsToMax,
	resetCropsToZero: resetCropsToZero,
	randomLowerCrops: randomLowerCrops,
	harvestCropsBreak: harvestCropsBreak,
	harvestCropsBreakAndReset: harvestCropsBreakAndReset
,
	tillSurfaceToFarmland: tillSurfaceToFarmland
};
