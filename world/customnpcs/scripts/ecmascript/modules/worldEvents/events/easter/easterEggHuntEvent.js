load('world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

var NearbyEggSpawnedLines = []

/**
 * Counts the number of nearby eggs around the player.
 * @param {Object} player - The player around whom eggs are counted.
 * @param {Object} world - The world object where the player is located.
 * @returns {number} - The number of nearby eggs.
 */
function countNearbyEggs(player, world) {
    var egg_count = 0;
    var radius = 20;

    var nearby_gentity_list = world.getNearbyEntities(player.getPos(), radius, 0);
    for (var i = 0; i < nearby_gentity_list.length; i++) {
        var entity = nearby_gentity_list[i];
        if (entity.getName().contains("Egg")) {
            egg_count++;
        }
    }

    return egg_count;
}

/**
 * Spawns a single egg at the specified coordinates.
 * @param {number} x - The x-coordinate for spawning the egg.
 * @param {number} y - The y-coordinate for spawning the egg.
 * @param {number} z - The z-coordinate for spawning the egg.
 * @param {Object} world - The world object where the egg will be spawned.
 */
function spawnEgg(x, y, z, world) {
    world.spawnClone(x, y, z, 2, "Easter Egg");
}

/**
 * Spawns a swarm of eggs around the player.
 * @param {Object} player - The player around whom the eggs will spawn.
 * @param {Object} world - The world object where the eggs will be spawned.
 * @param {number} count - The number of eggs to spawn.
 * @param {number} group_radius - The radius within which eggs will spawn in a group.
 * @param {boolean} display_message - Whether to display a message to the player.
 * @returns {number} - The number of successfully spawned eggs.
 */
function spawnEggSwarm(player, world, count, group_radius, display_message) {
    var successfull_spawns = 0;

    if (countNearbyEggs(player, world) > 5) {
        var tooManyNearbyEggsLines = [
            "&e Too many eggs nearby! Clean up a few before more can appear.",
            "&e The Egg Council has declared this area \"sufficiently egged.\"",
            "&e No new eggs until some of these get scooped up!",
            "&e Your scoop is slacking - collect those eggs before more arrive!",
            "&e Egg Overload! You'll need to make space before the hunt continues.",
            "&e The Spring Rabbit refuses to drop more eggs in this mess.",
            "&e Tip: Gather the nearby eggs so fresh ones can spawn!",
            "&e You're in an egg-rich zone. Pick some up before new ones spawn!"
        ];
        tellRandomMessage(player, tooManyNearbyEggsLines);
        var logline = e.player.getName() + " tried to spawn eggs but there were too many nearby.";
        logToFile("events", logline);
    } else {
        var abandon_counter = 0;

        for (var i = 0; i < count; i++) {
            // Generate random coordinates within group_radius around the player
            var x = Math.floor(player.getX() + Math.random() * group_radius - (group_radius / 2));
            var y = player.getY();
            var z = Math.floor(player.getZ() + Math.random() * group_radius - (group_radius / 2));

            // Adjust y-coordinate to find a valid spawn location
            while (world.getBlock(x, y, z).isAir() && abandon_counter < 30) {
                y--;
                abandon_counter++;
            }

            if (!world.getBlock(x, y, z).isAir()) {
                spawnEgg(x, y + 1, z, world);
                successfull_spawns++;
            }
        }
    }

    if (successfull_spawns > 0 && display_message) {
        var spawn_message = [
            "&dA distant bell chimes... The Rabbit has blessed this land with eggs.",
            "&eYou hear a bell ring... Something colorful just arrived nearby.",
            "&bThe Spring Rabbit stirs... You feel its presence-and see its trail!",
            "&aThe seasonal veil ripples. Something odd and egg-shaped is nearby...",
            "&dA magical chime echoes through the air... Eggs have appeared!",
            "&6Bell tolls? That means egg rolls. Look around!",
            "&fA whimsical wind and a ringing bell... Eggs have spawned around you.",
            "&eSomething twinkles in the grass. A chime guides your way...",
            "&aThat bell wasn't just in your head-fresh eggs are near!",
            "&bThe Egg Transmission has begun. Scanners show activity nearby!"
        ];
        tellRandomMessage(player, spawn_message);
        logToFile("events", e.player.getName() + " spawned " + successfull_spawns + " eggs.");
    }

    return successfull_spawns;
}

/**
 * Spawns the Easter starter pack for the player.
 * @param {Object} player - The player receiving the starter pack.
 */
function spawnEasterStarterPack(player) {
    // Load player event data
    var playerName = player.getName();
    var event_player_data = loadPlayerEventData("Easter Egg Hunt", playerName);
    // If no "has starter pack" data, create it
    if (!event_player_data.hasOwnProperty("has_starter_pack")) {
        event_player_data.has_starter_pack = true;
        savePlayerEventData("Easter Egg Hunt", playerName, event_player_data);

        // Spawn the starter pack
        var story_message = [
            "&l[=================================]",
            "&6&l:trophy: Welcome to the Great Egg Hunt! &r",
            "&7Reality might be cracking, but hey-at least there's chocolate.",
            "&fYou've been granted your very own &eEaster Starter Pack&r&f:",
            "  &6:sun: Delicious* Chocolate &8(*not actually nutritious)",
            "  &6:sun: Certified &lScoop&r &7(to catch those... flying eggs?)",
            "&fStart hunting, scoop fast, and remember:",
            "&dThe bigger the egg, the weirder the prize. &8&o(That's a good thing. Probably.)",
            "&e:star: Good luck, and welcome to the egg party! &r"
        ];

        storytellPlayer(player, story_message);

        // Give the player the items
        var world = player.getWorld();

        var scoopItem = world.createItem("forestry:scoop", 0, 1);
        scoopItem.setCustomName(ccs("&aCertified &lScoop"));
        scoopItem.setLore([
            ccs("&7Crafted by the Bureau of Egg Retrieval & Tactical Scooping (B.E.R.T.S.)."),
            ccs("&8Ideal for catching airborne anomalies. Or pudding."),
            ccs("&dCollected during: &fThe Great Egg Hunt (Easter)"),
        ]);

        var chocolateItem = world.createItem("harvestcraft:chocolatebaritem", 0, 3);
        chocolateItem.setCustomName(ccs("&6Delicious Chocolate"));
        chocolateItem.setLore([
            ccs("&7A rich, sweet treat straight from the Spring Rabbit's stash."),
            ccs("&8*Technically edible. Spiritually fulfilling."),
            ccs("&dCollected during: &fThe Great Egg Hunt (Easter)"),
        ]);

        // Give the items to the player
        player.giveItem(scoopItem);
        player.giveItem(chocolateItem);

        
        world.playSoundAt(player.getPos(), "ivv:toll", 1.0, 1.0);

        spawnEggSwarm(player, world, 3, 5, false);

        var logline = e.player.getName() + " has received the Easter Starter Pack.";
        logToFile("events", logline);
    }
}
