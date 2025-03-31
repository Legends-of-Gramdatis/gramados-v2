// load("world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventInitial.js")

/**
 * Spawns a swarm of "Sus Boxes" for the player and logs the event.
 * @param {Object} e - The event object.
 * @param {Object} player - The player for whom the swarm is spawned.
 */
function runEvent(e, player) {
    var playerName = player.getName();
    var randomCount = Math.floor(Math.random() * 10) + 1; // Random number between 1 and 10
    spawn_susbox_swarm(e, player, player.world, randomCount, 10, 5);
    logPlayerEvent(player, "Sus Box Spawned", { count: randomCount });

    // Update the last spawn time and generate a new interval for the player
    playerLastSpawnTime[playerName] = new Date().getTime();
    playerSpawnIntervals[playerName] = getRandomSpawnInterval();
}

/**
 * Spawns a swarm of "Sus Box" entities around the player.
 * @param {Object} event - The event triggering the spawn.
 * @param {Object} player - The player around whom the entities will spawn.
 * @param {Object} world - The world object where entities will be spawned.
 * @param {number} count - The number of entities to spawn.
 * @param {number} distance_from_player - The maximum distance from the player to spawn entities.
 * @param {number} group_radius - The radius within which entities will spawn in a group.
 * @returns {boolean} - Returns true if at least one entity was successfully spawned.
 */
function spawn_susbox_swarm(event, player, world, count, distance_from_player, group_radius) {

    var abandon_counter = 0;
    var x = Math.floor(player.getX() + Math.random() * distance_from_player - (distance_from_player / 2));
    var y = player.getY();
    var z = Math.floor(player.getZ() + Math.random() * distance_from_player - (distance_from_player / 2));
    var success = false;

    for (var i = 0; i < count; i++) {
        // Chage the coordinates to a random value, in 5 blocks radius
        x = x + Math.floor(Math.random() * group_radius) - (group_radius / 2);
        y += 10;
        z = z + Math.floor(Math.random() * group_radius) - (group_radius / 2);

        // floor the coordinates to the nearest block
        x = Math.floor(x);
        y = Math.floor(y);
        z = Math.floor(z);


        // fine an available y coordinate
        while (world.getBlock(x, y, z).isAir() && abandon_counter < 30) {
            y--;
            abandon_counter++;
        }

        if (!world.getBlock(x, y, z).isAir()) {
            spawn_susbox(x, y + 1, z, world);
            success = true;
            tellPlayer(player, generateWarningMessage());
        }
    }

    return success;
}

/**
 * Generates a random warning message about the "Sus Box" event.
 * @returns {string} - A random warning message.
 */
function generateWarningMessage() {
    var messages = [
        "&6ALERT! Wild Sus Boxes have appeared! Stay calm... or don't.",
        "&6Warning: Reality has been compromised. A Sus Box is watching you.",
        "&6A highly suspicious entity has materialized! Proceed with extreme curiosity.",
        "&6You feel an unsettling presence... A Sus Box is lurking nearby.",
        "&6Something questionable is approaching. You should probably fight it. Or worship it. Your call.",
        "&6Interdimensional Rift Detected! A Sus Box has slipped into our world.",
        "&6Emergency Meeting! A Sus Box has entered the chat.",
        "&6They see you. They know. And they disapprove.",
        "&6You were not prepared for this level of SUS.",
        "&6This is NOT a drill! The Sus Box has breached containment!",
        "&6Insert Coin to Continue... Oh wait, the Sus Box took the coins.",
        "&6Reality.exe has encountered a problem... A Sus Box has loaded in."
    ];
    var randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
}

/**
 * Spawns a single "Sus Box" entity at the specified coordinates.
 * @param {number} x - The x-coordinate for spawning the entity.
 * @param {number} y - The y-coordinate for spawning the entity.
 * @param {number} z - The z-coordinate for spawning the entity.
 * @param {Object} world - The world object where the entity will be spawned.
 */
function spawn_susbox(x, y, z, world) {
    world.spawnClone(x, y, z, 2, "Sus Box");
}

/**
 * Cleans up "Sus Box" entities near the player if the player is arrested.
 * @param {Object} event - The event triggering the cleanup.
 */
function susbox_cleanup(event) {
    if (arrest_plugin_arrested_player_name == event.player.getDisplayName()) {
        var player = event.player;
        var world = player.world;
        var nearby_gentity_list = world.getNearbyEntities(player.getPos(), 50, 0);

        tellPlayer(player, "&aNearby entities: &e" + nearby_gentity_list.length);

        for (var i = 0; i < nearby_gentity_list.length; i++) {
            var removal_test_entity = nearby_gentity_list[i];
            tellPlayer(player, "&aEntity: &e" + removal_test_entity.getName());
            if (removal_test_entity.getName().contains("Sus Box")) {
                removal_test_entity.despawn();
            }
        }
    }
}
