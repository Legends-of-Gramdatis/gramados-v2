load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js");
// load("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/easterEggNpc.js");

var BUNNY_LIVES = 4;
var PARTICLE_RADIUS = 10;
var PARTICLE_COLOR = 16711935; // Pink
var PARTICLE_DURATION = 20;
var PARTICLE_MOTION = [0.0, 1.0, 0.0];
var EGG_SPAWN_COUNT = 10;

/**
 * Initializes the Easter Bunny Boss NPC.
 * @param {Object} event - The event object containing the NPC instance.
 */
function init(event) {
    var npc = event.npc;

    if (!npc.getStoreddata().has("lives")) {
        npc.getStoreddata().put("lives", BUNNY_LIVES);
    }

    updateHealthBar(npc);
    updateSize(npc); // Set the initial size based on the stage
}

/**
 * Updates the Easter Bunny's health bar based on the total eggs collected globally.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function updateHealthBar(npc) {
    var globalData = loadPlayerEventData("Easter Egg Hunt", "Global Data");
    var totalEggs = globalData.egg_count || 0;
    npc.getDisplay().setName("§dEaster Bunny Boss §c❤ " + totalEggs);
}

/**
 * Updates the size of the Easter Bunny Boss based on its current stage.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function updateSize(npc) {
    var lives = npc.getStoreddata().get("lives");
    var size = 14 + (BUNNY_LIVES - lives) * 2; // Start at size 14 and increase by 2 for each stage
    npc.getDisplay().setSize(size);
}

/**
 * Handles player interaction with the Easter Bunny Boss.
 * @param {Object} event - The event object containing the player instance.
 */
function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var item = player.getMainhandItem();
    var itemName = item.getName();

    if (itemName === "variedcommodities:element_air") {
        startJumpAttack(npc);
        tellPlayer(player, "§6The Easter Bunny begins its jump attack!");
    } else if (itemName === "variedcommodities:element_earth") {
        spawnEasterEggs(npc, player.getWorld());
        tellPlayer(player, "§6The Easter Bunny spawns a swarm of Easter Eggs!");
    } else if (itemName === "variedcommodities:element_fire") {
        destroyFuturaBlocks(npc.getWorld());
        tellPlayer(player, "§6The power of fire has destroyed the futura blocks!");
    }
}

/**
 * Destroys one "chisel:futura" block in predefined regions and plays particles.
 * @param {IWorld} world - The world instance.
 */
function destroyFuturaBlocks(world) {
    // Helper function to destroy a block and play particles
    function destroyBlock(x, y, z) {
        var position = API.getIPos(x, y, z);
        world.playSoundAt(position, "minecraft:block.glass.break", 1.0, 1.0);
        world.setBlock(x, y, z, "chisel:wool_gray", 0);
        var particleCommand = "/particle blockcrack " + x + " " + y + " " + z + " 1 1 1 0.5 100 force @a 201";
        API.executeCommand(world, particleCommand); // Use /particle blockcrack command
    }

    // Region 1: Main area
    for (var x = -6188; x <= -6162; x++) {
        for (var y = 67; y <= 77; y++) {
            for (var z = 1991; z <= 2019; z++) {
                var block = world.getBlock(x, y, z);
                if (block.getName() === "chisel:futura" && block.getMetadata() === 4) {
                    destroyBlock(x, y, z);
                    return; // Stop after destroying one block
                }
            }
        }
    }

    // Region 2: Debug/testing area
    for (var x = 2285; x >= 2272; x--) {
        for (var y = 94; y <= 99; y++) {
            for (var z = 3608; z >= 3601; z--) {
                var block = world.getBlock(x, y, z);
                if (block.getName() === "chisel:futura" && block.getMetadata() === 4) {
                    destroyBlock(x, y, z);
                    return; // Stop after destroying one block
                }
            }
        }
    }
}

/**
 * Starts the jump attack, spawning particles and knocking back players.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function startJumpAttack(npc) {
    npc.getAi().setNavigationType(1); // Enable jumping
    npc.getAi().setWalkingSpeed(10); // Increase speed for the jump

    // Simulate the jump with a tick-based delay
    npc.getStoreddata().put("jumpAttackTicks", 4); // 2 seconds (2 tick calls per second)
    npc.getStoreddata().put("jumpPhase", "up"); // Start with the upward phase
    npc.executeCommand("/playsound minecraft:entity.rabbit.jump neutral @a");
}

/**
 * Handles tick updates for the NPC.
 * @param {Object} event - The event object containing the NPC instance.
 */
function tick(event) {
    var npc = event.npc;
    var jumpAttackTicks = npc.getStoreddata().get("jumpAttackTicks");
    var jumpPhase = npc.getStoreddata().get("jumpPhase");

    if (jumpAttackTicks > 0) {
        jumpAttackTicks--;
        npc.getStoreddata().put("jumpAttackTicks", jumpAttackTicks);

        if (jumpPhase === "up" && jumpAttackTicks > 2) {
            // Apply upward motion during the first phase of the jump
            npc.setMotionY(0.5);
        } else if (jumpPhase === "up" && jumpAttackTicks <= 2) {
            // Switch to the downward phase
            npc.getStoreddata().put("jumpPhase", "down");
        } else if (jumpPhase === "down") {
            // Apply downward motion during the second phase of the jump
            npc.setMotionY(-0.5);
        }

        if (jumpAttackTicks === 0) {
            npc.getAi().setNavigationType(0); // Disable jumping
            spawnKnockbackParticles(npc);
        }
    }
}

/**
 * Spawns knockback particles around the NPC.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function spawnKnockbackParticles(npc) {
    var world = npc.getWorld();
    var x = npc.getX();
    var y = npc.getY();
    var z = npc.getZ();

    // Ensure particles spawn on solid ground
    while (world.getBlock(x, y, z).isAir() && y > 0) {
        y--;
    }
    var blockBelow = world.getBlock(x, y - 1, z);
    if (!blockBelow.isAir()) {
        var command = "/summon area_effect_cloud " + x + " " + (y + 0.5) + " " + z +
            " {Particle:\"mobSpell\",Radius:" + PARTICLE_RADIUS + "f,Duration:" + PARTICLE_DURATION +
            ",Color:" + PARTICLE_COLOR + ",Motion:" + JSON.stringify(PARTICLE_MOTION) + "}";
        npc.executeCommand(command);
    }

    // Knockback nearby players
    var nearbyEntities = world.getNearbyEntities(npc.getPos(), PARTICLE_RADIUS, 1); // 1 = players
    for (var i = 0; i < nearbyEntities.length; i++) {
        var player = nearbyEntities[i];
        var dx = player.getX() - npc.getX();
        var dz = player.getZ() - npc.getZ();
        var distance = Math.sqrt(dx * dx + dz * dz);
        if (distance > 0) {
            var knockbackX = (dx / distance) * 2;
            var knockbackY = 1;
            var knockbackZ = (dz / distance) * 2;
            player.setMotionX(knockbackX);
            player.setMotionY(knockbackY);
            player.setMotionZ(knockbackZ);
        }
    }
}

/**
 * Spawns a swarm of Easter Eggs around the NPC.
 * @param {ICustomNpc} npc - The NPC instance.
 * @param {IWorld} world - The world instance.
 */
function spawnEasterEggs(npc, world) {
    for (var i = 0; i < EGG_SPAWN_COUNT; i++) {
        var x = npc.getX() + Math.random() * 10 - 5;
        var y = npc.getY();
        var z = npc.getZ() + Math.random() * 10 - 5;
        world.spawnClone(x, y, z, 2, "Easter Egg");
    }
}

/**
 * Handles the death of the Easter Bunny Boss.
 * @param {Object} event - The event object containing the NPC instance.
 */
function died(event) {
    var npc = event.npc;
    var lives = npc.getStoreddata().get("lives");

    // Check for "chisel:futura" blocks in the specified regions
    var world = npc.getWorld();

    // Region 1: Main area
    // for (var x = -6188; x <= -6162; x++) {
    //     for (var y = 67; y <= 77; y++) {
    //         for (var z = 1991; z <= 2019; z++) {
    //             var block = world.getBlock(x, y, z);
    //             if (block.getName() === "chisel:futura" && block.getMetadata() === 4) {
    //                 // Play glass break sound
    //                 world.playSoundAt([x, y, z], "minecraft:block.glass.break", 1.0, 1.0);
    //                 // Replace the block with "chisel:wool_gray"
    //                 world.setBlock(x, y, z, "chisel:wool_gray", 0);
    //             }
    //         }
    //     }
    // }

    // Region 2: Debug/testing area
    for (var x = 2285; x >= 2272; x--) {
        for (var y = 94; y <= 99; y++) {
            for (var z = 3608; z >= 3601; z--) {
                var block = world.getBlock(x, y, z);
                if (block.getName() === "chisel:futura" && block.getMetadata() === 4) {
                    // Play glass break sound
                    world.playSoundAt([x, y, z], "minecraft:block.glass.break", 1.0, 1.0);
                    // Replace the block with "chisel:wool_gray"
                    world.setBlock(x, y, z, "chisel:wool_gray", 0);
                }
            }
        }
    }

    if (lives > 1) {
        npc.getStoreddata().put("lives", lives - 1);
        npc.respawn();
        updateSize(npc); // Update size for the new stage
        tellNearbyPlayers(npc, "§cThe Easter Bunny has revived! Lives remaining: " + (lives - 1));
    } else {
        spawnGiantEgg(npc);
        tellNearbyPlayers(npc, "§6The Easter Bunny has been defeated and turned into a giant egg!");
    }
}

/**
 * Spawns a giant egg at the Easter Bunny's location.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function spawnGiantEgg(npc) {
    var world = npc.getWorld();
    var x = npc.getX();
    var y = npc.getY();
    var z = npc.getZ();

    npc.despawn();
    world.spawnClone(x, y, z, 2, "Giant Egg");

    var eggData = {
        stage: "defeated"
    };
    saveJson(eggData, "world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/giant_egg_data.json");
}

/**
 * Sends a message to all players near the NPC.
 * @param {ICustomNpc} npc - The NPC instance.
 * @param {string} message - The message to send.
 */
function tellNearbyPlayers(npc, message) {
    var world = npc.getWorld();
    var nearbyEntities = world.getNearbyEntities(npc.getPos(), 50, 1); // 1 = players
    for (var i = 0; i < nearbyEntities.length; i++) {
        tellPlayer(nearbyEntities[i], message);
    }
}
