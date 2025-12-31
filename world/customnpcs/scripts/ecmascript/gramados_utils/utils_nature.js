// Utilities for nature/terrain effects (grass, flowers, etc.)
// Nashorn + CustomNPCs API (MC 1.12.2)

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');

/**
 * Grows grass, tall grass, and flowers on bare dirt/grass blocks within a sphere.
 * Converts dirt → grass blocks, then places tall grass/flowers on top.
 * Particularly useful for cattle farms where animals eat vegetation.
 *
 * @param {IWorld} world CustomNPCs world instance.
 * @param {{x:number,y:number,z:number}|IPos} center Center position.
 * @param {number} radius Sphere radius in blocks.
 * @returns {{converted:number, planted:number}} Blocks converted and vegetation planted.
 */
function grow_grass_and_flowers(world, center, radius) {
    var c;
    if (center && typeof center.getX === 'function') {
        c = { x: Math.floor(center.getX()), y: Math.floor(center.getY()), z: Math.floor(center.getZ()) };
    } else {
        c = { x: Math.floor(center.x), y: Math.floor(center.y), z: Math.floor(center.z) };
    }

    var r2 = radius * radius;
    var converted = 0;
    var planted = 0;

    // Scan sphere
    for (var dx = -radius; dx <= radius; dx++) {
        for (var dy = -radius; dy <= radius; dy++) {
            for (var dz = -radius; dz <= radius; dz++) {
                var dist2 = dx * dx + dy * dy + dz * dz;
                if (dist2 > r2) continue;

                var x = c.x + dx;
                var y = c.y + dy;
                var z = c.z + dz;

                var block = world.getBlock(x, y, z);
                if (!block) continue;

                var blockName = block.getName();
                var blockAbove = world.getBlock(x, y + 1, z);
                var blockAboveName = blockAbove.getName();

                // Convert dirt to grass
                if (blockName === 'minecraft:dirt') {
                    world.setBlock(x, y, z, 'minecraft:grass', 0);
                    converted++;
                    blockName = 'minecraft:grass';
                }

                // Plant vegetation on grass blocks (if air above)
                if (blockName === 'minecraft:grass' && blockAboveName === 'minecraft:air') {
                    // 80% tall grass, 20% flowers
                    if (Math.random() < 0.8) {
                        // Tall grass (metadata 1) or fern (metadata 2)
                        var grassMeta = (Math.random() < 0.8) ? 1 : 2;
                        world.setBlock(x, y + 1, z, 'minecraft:tallgrass', grassMeta);
                        planted++;
                    } else {
                        // Flowers
                        var flowerChoice = Math.random();
                        if (flowerChoice < 0.3) {
                            // Yellow flower (dandelion)
                            world.setBlock(x, y + 1, z, 'minecraft:yellow_flower', 0);
                        } else {
                            // Red flower variants (poppy, tulips, etc.)
                            var flowerMeta = Math.floor(Math.random() * 9); // 0-8
                            world.setBlock(x, y + 1, z, 'minecraft:red_flower', flowerMeta);
                        }
                        planted++;
                    }
                }
            }
        }
    }

    return { converted: converted, planted: planted };
}

/**
 * Spawns decorative flower patterns on grass blocks within a sphere.
 * Only places flowers (no tall grass) for aesthetic appeal.
 *
 * @param {IWorld} world CustomNPCs world instance.
 * @param {{x:number,y:number,z:number}|IPos} center Center position.
 * @param {number} radius Sphere radius in blocks.
 * @returns {number} Number of flowers planted.
 */
function spawn_flower_pattern(world, center, radius) {
    var c;
    if (center && typeof center.getX === 'function') {
        c = { x: Math.floor(center.getX()), y: Math.floor(center.getY()), z: Math.floor(center.getZ()) };
    } else {
        c = { x: Math.floor(center.x), y: Math.floor(center.y), z: Math.floor(center.z) };
    }

    var r2 = radius * radius;
    var planted = 0;

    // Scan sphere
    for (var dx = -radius; dx <= radius; dx++) {
        for (var dy = -radius; dy <= radius; dy++) {
            for (var dz = -radius; dz <= radius; dz++) {
                var dist2 = dx * dx + dy * dy + dz * dz;
                if (dist2 > r2) continue;

                var x = c.x + dx;
                var y = c.y + dy;
                var z = c.z + dz;

                var block = world.getBlock(x, y, z);
                if (!block) continue;

                var blockName = (typeof block.getName === 'function') ? block.getName() : '';
                var blockAbove = world.getBlock(x, y + 1, z);
                var blockAboveName = (blockAbove && typeof blockAbove.getName === 'function') ? blockAbove.getName() : '';

                // Only place flowers on grass blocks with air above
                if (blockName === 'minecraft:grass' && blockAboveName === 'minecraft:air') {
                    // Create decorative pattern: alternate flower types based on position
                    var pattern = (Math.abs(dx) + Math.abs(dz)) % 3;
                    
                    // 50% chance to place flower (creates gaps for pattern)
                    if (Math.random() < 0.5) {
                        if (pattern === 0) {
                            // Yellow flowers (dandelions)
                            world.setBlock(x, y + 1, z, 'minecraft:yellow_flower', 0);
                            planted++;
                        } else if (pattern === 1) {
                            // Red/pink flowers (poppies, tulips)
                            var pinkFlowers = [0, 4, 5, 7]; // poppy, red tulip, orange tulip, pink tulip
                            var meta = pinkFlowers[Math.floor(Math.random() * pinkFlowers.length)];
                            world.setBlock(x, y + 1, z, 'minecraft:red_flower', meta);
                            planted++;
                        } else {
                            // Blue/white flowers (orchid, allium, azure bluet, white tulip, oxeye daisy)
                            var coolFlowers = [1, 2, 3, 6, 8];
                            var meta = coolFlowers[Math.floor(Math.random() * coolFlowers.length)];
                            world.setBlock(x, y + 1, z, 'minecraft:red_flower', meta);
                            planted++;
                        }
                    }
                }
            }
        }
    }

    return planted;
}

// Exports
var exports_utils_nature = {
    grow_grass_and_flowers: grow_grass_and_flowers,
    spawn_flower_pattern: spawn_flower_pattern
};
