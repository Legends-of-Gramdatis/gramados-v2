/**
 * Spawns a given amount of NPC clones in a specified area.
 * @param {IWorld} world - The world object.
 * @param {string} cloneName - The name of the clone to spawn.
 * @param {number} tab - The tab index for the clone (e.g., 9 for global, 2 for Easter eggs, etc.).
 * @param {number} amount - The number of clones to spawn.
 * @param {object} center - The center position {x, y, z}.
 * @param {number} radius - The radius around the center to spawn in.
 * @param {number} [maxTries=30] - Max attempts to find a valid spot per clone.
 * @returns {number} - The number of successful spawns.
 */
function spawnClonesInArea(world, cloneName, tab, amount, center, radius, maxTries) {
    if (typeof maxTries === "undefined" || maxTries === null) maxTries = 30;
    var spawned = 0;
    for (var i = 0; i < amount; i++) {
        var pos = findValidSpawnPosition(world, center, radius, maxTries);
        if (pos) {
            world.spawnClone(pos.x, pos.y, pos.z, tab, cloneName);
            spawned++;
        }
    }
    return spawned;
}

/**
 * Finds a valid spawn position (on ground, not in air) within a radius of a center.
 * @param {IWorld} world - The world object.
 * @param {object} center - The center position {x, y, z}.
 * @param {number} radius - The radius to search within.
 * @param {number} maxTries - Maximum attempts to find a valid spot.
 * @returns {object|null} - The valid position {x, y, z} or null if not found.
 */
function findValidSpawnPosition(world, center, radius, maxTries) {
    for (var tries = 0; tries < maxTries; tries++) {
        var x = Math.floor(center.x + (Math.random() * radius * 2) - radius);
        var z = Math.floor(center.z + (Math.random() * radius * 2) - radius);
        var y = Math.floor(center.y);
        // Go down until we find ground (not air), but not below y=1
        var yTest = y;
        var abandon = 0;
        while (world.getBlock(x, yTest, z).isAir() && yTest > 1 && abandon < 20) {
            yTest--;
            abandon++;
        }
        // Only spawn if block below is solid and block above is air
        if (!world.getBlock(x, yTest, z).isAir() && world.getBlock(x, yTest + 1, z).isAir()) {
            return { x: x, y: yTest + 1, z: z };
        }
    }
    return null;
}

/**
 * Spawns a clone at a valid position near a given point.
 * @param {IWorld} world - The world object.
 * @param {string} cloneName - The name of the clone to spawn.
 * @param {number} tab - The tab index for the clone.
 * @param {object} near - The center position {x, y, z}.
 * @param {number} radius - The radius to search within.
 * @returns {boolean} - True if spawned, false otherwise.
 */
function spawnCloneAtValidPosition(world, cloneName, tab, near, radius) {
    var pos = findValidSpawnPosition(world, near, radius, 30);
    if (pos) {
        world.spawnClone(pos.x, pos.y, pos.z, tab, cloneName);
        return true;
    }
    return false;
}

/**
 * Despawns all clones of a given name within a radius of a position.
 * @param {IWorld} world - The world object.
 * @param {string} cloneName - The name of the clone to despawn (partial match allowed).
 * @param {object} center - The center position {x, y, z}.
 * @param {number} radius - The radius to search within.
 * @returns {number} - The number of despawned entities.
 */
function despawnNearbyClones(world, cloneName, center, radius) {
    var count = 0;
    var entities = world.getNearbyEntities(center, radius, 0); // 0 = all entities
    for (var i = 0; i < entities.length; i++) {
        var ent = entities[i];
        if (ent.getName && ent.getName().contains(cloneName)) {
            ent.despawn();
            count++;
        }
    }
    return count;
}

/**
 * Counts the number of clones of a given name within a radius of a position.
 * @param {IWorld} world - The world object.
 * @param {string} cloneName - The name of the clone to count (partial match allowed).
 * @param {object} center - The center position {x, y, z}.
 * @param {number} radius - The radius to search within.
 * @returns {number} - The number of matching entities.
 */
function countNearbyClones(world, cloneName, center, radius) {
    var count = 0;
    var entities = world.getNearbyEntities(center, radius, 0);
    for (var i = 0; i < entities.length; i++) {
        var ent = entities[i];
        if (ent.getName && ent.getName().contains(cloneName)) {
            count++;
        }
    }
    return count;
}
