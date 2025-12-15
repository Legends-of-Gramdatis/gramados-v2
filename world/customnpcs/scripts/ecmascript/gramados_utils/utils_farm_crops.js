// Utilities for crop and farmland helpers
// Nashorn + CustomNPCs API (MC 1.12.2)

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_inventory.js');

var SEED_TO_CROP_MAP = null;

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
