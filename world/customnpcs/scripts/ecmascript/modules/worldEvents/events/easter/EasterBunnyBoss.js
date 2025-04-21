load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');

var PARTICLE_RADIUS = 10;
var PARTICLE_COLOR = 16711935; // Pink
var PARTICLE_DURATION = 20;
var PARTICLE_MOTION = [0.0, 1.0, 0.0];
var EGG_SPAWN_COUNT = 10;

var EVENT_DATA_JSON = "world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/easterBossFight.json";
var EGG_MODE_LINES = [
    "&6The egg jiggles slightly and lets out a squeaky chirp... was that a laugh?",
    "&6You feel a soft warmth radiating from within the shell. It's... unsettlingly comforting.",
    "&6The surface is covered in faint pastel glyphs. You can't read them, but they pulse slowly.",
    "&6A low hum resonates from the egg. It sounds like static... or singing?",
    "&6You press your hand against it. For a moment, it presses back.",
    "&6Something inside shifts. You're sure of it now-this egg is very much alive.",
    "&6A faint voice echoes in your mind: \"Soon...\"",
    "&6You hear squeaky laughter, distant and glitchy, like a corrupted bunny giggle.",
    "&6You swear you saw it twitch. Just a little. Right?",
    "&6It's sealed tight. Whatever's inside isn't ready. Yet.",
    "&6You hear a muffled \"boing\" from within. The egg remains still.",
    "&6Someone-or something-is watching you through the shell.",
    "&6It smells faintly of sugar and ozone. That can't be good.",
    "&6You touch it. For a second, your vision flickers pink.",
    "&6An odd breeze passes by. The egg hums louder, like it noticed.",
    "&6The egg feels heavy... impossibly heavy. But it shifts like it's weightless.",
    "&6A strange marking appears briefly, then fades before you can memorize it.",
    "&6You feel like it knows your name. You're probably imagining that.",
    "&6The egg doesn't react. Then it does. Then it doesn't again.",
    "&6Something is waiting. You're just not sure if it's excited... or hungry."
]

var ATTACK_COOLDOWN_BASE = 40; // Base cooldown in seconds
var TICKS_PER_SECOND = 20; // Minecraft ticks per second

/**
 * Initializes the Easter Bunny Boss NPC.
 * @param {Object} event - The event object containing the NPC instance.
 */
function init(event) {
    var npc = event.npc;
    var data = loadJson(EVENT_DATA_JSON);
    if (!data) {
        data = {
            BunnyStage: 0,
            isEggMode: false
        };
        saveJson(data, EVENT_DATA_JSON);
    }

    if (data.isEggMode) {
        eggHatch(npc);
    }
    if (!data.isEggMode) {
        bunnyHatch(npc);
    }

    // Provide tutorial message to players
    provideTutorialMessage(npc);
}

/**
 * Sends a tutorial message in chat explaining the basics of the altar and the rabbit.
 * Sets the player's respawn point to a specific location.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function provideTutorialMessage(npc) {
    var world = npc.getWorld();
    var players = world.getNearbyEntities(npc.getPos(), 50, 1); // Get players within a 50-block radius

    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        npc.executeCommand("/spawnpoint " + player.getName() + " -6175 69 2030");
        logToFile("events", player.getName() + " has been set to spawnpoint at Easter Bunny Boss.");
    }

    tellNearbyPlayers(npc, "&6&l[Event Tutorial] &eWelcome to the Easter Event!", 50);
    tellNearbyPlayers(npc, "&e1. &aCollect eggs scattered around the world and bring them to the altar.", 50);
    tellNearbyPlayers(npc, "&e2. &aOffer eggs at the altar to activate recipes and gain buffs or effects.", 50);
    tellNearbyPlayers(npc, "&e3. &aThe Easter Bunny Boss will attack in waves. Defeat it to progress!", 50);
    tellNearbyPlayers(npc, "&e4. &aWatch out for special attacks like Mini Egg Swarms and Boomshell Walls!", 50);
    tellNearbyPlayers(npc, "&e5. &aUse teamwork and strategy to overcome the challenges and claim victory!", 50);
    tellNearbyPlayers(npc, "&6Good luck, and may the eggs be ever in your favor!", 50);
}

/**
 * Updates the Easter Bunny's health bar based on the total eggs collected globally.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function updateHealth(npc) {
    if (!isEggMode()) {
        var globalData = loadPlayerEventData("Easter Egg Hunt", "Global Data");
        var totalEggs = globalData.egg_count || 0;
        npc.getDisplay().setName(ccs("&dEaster Bunny Boss &c❤ " + totalEggs));
        npc.getDisplay().setBossbar(1);
        npc.getStats().setMaxHealth(totalEggs);
        npc.setHealth(totalEggs);
    } else {
        npc.getDisplay().setName(ccs("&dThe Great Eggcryption"));
        npc.getDisplay().setBossbar(0);
    }
}

/**
 * Updates the Easter Bunny's sound effects based on its mode.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function updateSounds(npc) {
    if (isEggMode()) {
        npc.getAdvanced().setSound(0, "animania:dartfrogliving4");
        npc.getAdvanced().setSound(1, "animania:dartfrogliving2");
        npc.getAdvanced().setSound(2, "animania:dartfrogliving3");
        npc.getAdvanced().setSound(3, "animania:dartfrogliving1");
        npc.getAdvanced().setSound(4, "animania:dartfrogliving2");
    } else {
        npc.getAdvanced().setSound(0, "minecraft:entity.rabbit.ambient");
        npc.getAdvanced().setSound(1, "minecraft:entity.rabbit.attack");
        npc.getAdvanced().setSound(2, "minecraft:entity.rabbit.hurt");
        npc.getAdvanced().setSound(3, "minecraft:entity.rabbit.death");
        npc.getAdvanced().setSound(4, "minecraft:entity.rabbit.jump");
    }
}

/**
 * Reloads the Easter Bunny NPC based on its mode.
 * @param {Object} event - The event object containing the NPC instance.
 */
function reloadNPC(event) {
    var npc = event.npc;
    var data = loadJson(EVENT_DATA_JSON);
    switch (data.isEggMode) {
        case true:
            eggHatch(npc);
            break;
        case false:
            bunnyHatch(npc);
            break;
    }
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
    var bossFightData = loadJson(EVENT_DATA_JSON);

    if (itemName === "variedcommodities:bandit_mask") {
        var model = npc.getDisplay().getModel();
        tellPlayer(player, "&6Model ID: " + model);
        return;
    } else if (itemName === "variedcommodities:spell_dark") {
        initEggMode(npc);
        eggHatch(npc);
        tellPlayer(player, "&6The Easter Bunny has been turned into a giant egg!");
        return;
    } else if (itemName === "variedcommodities:spell_holy") {
        initBunnyMode(npc);
        bunnyHatch(npc);
        tellPlayer(player, "&6The Easter Bunny has been revived!");
        return;
    } else if (itemName === "variedcommodities:orb_broken") {
        var data = loadJson(EVENT_DATA_JSON);
        data.BunnyStage -= 1;
        if (data.BunnyStage < 0) {
            data.BunnyStage = 0;
        }
        saveJson(data, EVENT_DATA_JSON);
        tellPlayer(player, "&6The Easter Bunny has been weakened!");
        reloadNPC(event);
        return;
    } else if (itemName === "variedcommodities:orb") {
        var data = loadJson(EVENT_DATA_JSON);
        data.BunnyStage += 1;
        if (data.BunnyStage > 3) {
            data.BunnyStage = 3;
        }
        saveJson(data, EVENT_DATA_JSON);
        tellPlayer(player, "&6The Easter Bunny has been empowered!");
        reloadNPC(event);
        return;
    } else if (itemName === "variedcommodities:spell_fire") {
        destroyHatchPillar(npc);
        return;
    }

    if (isEggMode()) {
        tellPlayer(player, "&6The Easter Bunny is in egg mode! You can't interact with it.");
        tellRandomMessage(player, EGG_MODE_LINES);

        npc.executeCommand("/playsound animania:dartfrogliving2 neutral @a");

        var command = "/summon area_effect_cloud " + npc.getX() + " " + (npc.getY() + 0.5) + " " + npc.getZ() + " {Particle:\"mobSpellAmbient\",Radius:15f,Duration:10,Color:16713909,Motion:[0.0,1.5,0.0]}";
        npc.executeCommand(command);
    } else {
        if (itemName === "variedcommodities:element_air") {
            startJumpAttack(npc);
            tellPlayer(player, "&6The Easter Bunny begins its jump attack!");
        } else if (itemName === "variedcommodities:element_water") {
            startMiniEggSwarmAttack(npc);
            tellPlayer(player, "&6The Easter Bunny starts a mini-egg swarm attack!");
        } else if (itemName === "variedcommodities:element_fire") {
            startBoomshellWallAttack(npc);
            tellPlayer(player, "&6The Easter Bunny summons a boomshell wall!");
        } else if (itemName === "variedcommodities:element_earth") {
            startChocolatePowderFloodAttack(npc);
            tellPlayer(player, "&6The Easter Bunny summons a Chocolate Powder Flood!");
        }
    }
}

/**
 * Replaces one "chisel:futura" block within the arena region with "chisel:wool_gray".
 * @param {ICustomNpc} npc - The NPC instance.
 */
function destroyHatchPillar(npc) {
    var world = npc.getWorld();
    var bossFightData = loadJson(EVENT_DATA_JSON);
    var arenaType = bossFightData["use_arena"] || "debug"; // Get arena type from JSON
    var arena = bossFightData.Arena[arenaType];
    var pos1 = arena.pos1;
    var pos2 = arena.pos2;

    for (var x = Math.min(pos1.x, pos2.x); x <= Math.max(pos1.x, pos2.x); x++) {
        for (var y = Math.min(pos1.y, pos2.y); y <= Math.max(pos1.y, pos2.y); y++) {
            for (var z = Math.min(pos1.z, pos2.z); z <= Math.max(pos1.z, pos2.z); z++) {
                var block = world.getBlock(x, y, z);
                if (block.getName() === "chisel:futura" && block.getMetadata() === 4) {
                    world.setBlock(x, y, z, "chisel:wool_gray", 0);
                    world.playSoundAt(API.getIPos(x, y, z), "minecraft:block.glass.break", 1.0, 1.0);

                    var particleCommand = "/particle blockcrack " + x + " " + y + " " + z + " 0.5 0.5 0.5 0.1 10 normal @a";
                    API.executeCommand(world, particleCommand);

                    tellNearbyPlayers(npc, "&6The power of fire has altered a Hatch Pillar block within the arena!", 50);
                    logToFile("events", "Easter Bunny Boss: Altered one Hatch Pillar block at (" + x + ", " + y + ", " + z + ").");
                    return; // Exit after replacing one block
                }
            }
        }
    }

    tellNearbyPlayers(npc, "&6No Hatch Pillar blocks remain to be altered in the arena!", 50);
    logToFile("events", "Easter Bunny Boss: No Hatch Pillar blocks found to alter.");
}

/**
 * Starts the mini-egg swarm attack for the bunny boss.
 * Spawns a random number of eggs and ends the attack after 1 minute.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function startMiniEggSwarmAttack(npc) {
    var bossFightData = loadJson(EVENT_DATA_JSON);

    if (bossFightData.isAttacking) {
        npc.say("&cThe boss is already attacking!");
        return;
    }

    bossFightData.isAttacking = true;
    saveJson(bossFightData, EVENT_DATA_JSON);

    tellNearbyPlayers(npc, "&6The Mini Egg Swarm attack has started!", 50);

    var world = npc.getWorld();
    var spawnPos = npc.getPos();
    var totalEggsToSpawn = rrandom_range(5, 15) + (rrandom_range(3, 10) * bossFightData.BunnyStage);
    var eggsSpawned = 0;

    npc.getStoreddata().put("totalEggsToSpawn", totalEggsToSpawn);
    npc.getStoreddata().put("eggsSpawned", eggsSpawned);

    npc.getTimers().start(1, 10, true); // Timer to spawn eggs every 0.5 seconds
    npc.getTimers().start(2, 1200, false); // End the attack after 1 minute

    logToFile("events", "Easter Bunny Boss: Mini Egg Swarm attack started. Total eggs to spawn: " + totalEggsToSpawn);
}

/**
 * Starts the Boomshell Wall attack for the bunny boss.
 * Spawns a random number of Boomshells with larger motion for greater spread and ends the attack after 10 seconds.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function startBoomshellWallAttack(npc) {
    var bossFightData = loadJson(EVENT_DATA_JSON);

    if (bossFightData.isAttacking) {
        npc.say("&cThe boss is already attacking!");
        return;
    }

    bossFightData.isAttacking = true;
    saveJson(bossFightData, EVENT_DATA_JSON);

    tellNearbyPlayers(npc, "&6The Boomshell Wall attack has started!", 50);

    var world = npc.getWorld();
    var spawnPos = npc.getPos();
    var bunnyStage = bossFightData.BunnyStage || 0;
    var totalBoomshellsToSpawn = rrandom_range(4, 8) + (bunnyStage * rrandom_range(2, 5));

    npc.getStoreddata().put("totalBoomshellsToSpawn", totalBoomshellsToSpawn);
    npc.getStoreddata().put("boomshellsSpawned", 0);

    npc.getTimers().start(3, 10, true); // Timer to spawn Boomshells every 0.5 seconds
    npc.getTimers().start(4, 200, false); // End the attack after 10 seconds

    logToFile("events", "Easter Bunny Boss: Boomshell Wall attack started. Total boomshells to spawn: " + totalBoomshellsToSpawn);
}

/**
 * Starts the jump attack for the bunny boss.
 * Applies upward and downward motion to simulate a jump and ends with a knockback effect.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function startJumpAttack(npc) {
    var bossFightData = loadJson(EVENT_DATA_JSON);

    if (bossFightData.isAttacking) {
        npc.say("&cThe boss is already attacking!");
        return;
    }

    bossFightData.isAttacking = true;
    saveJson(bossFightData, EVENT_DATA_JSON);

    tellNearbyPlayers(npc, "&6The Jump Attack has started!", 50);

    npc.getAi().setNavigationType(1); // Enable jumping
    npc.getAi().setWalkingSpeed(10); // Increase speed for the jump

    npc.getStoreddata().put("jumpAttackTicks", 4); // 2 seconds (2 tick calls per second)
    npc.getStoreddata().put("jumpPhase", "up"); // Start with the upward phase
    npc.executeCommand("/playsound minecraft:entity.horse.jump neutral @a");

    // End the attack after the jump
    npc.getTimers().start(5, 40, false); // 2 seconds
}

/**
 * Starts the Chocolate Powder Flood attack for the bunny boss.
 * Spawns chocolate powder blocks that freeze players on contact and ends the attack after 30 seconds.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function startChocolatePowderFloodAttack(npc) {
    var bossFightData = loadJson(EVENT_DATA_JSON);

    if (bossFightData.isAttacking) {
        npc.say("&cThe boss is already attacking!");
        return;
    }

    bossFightData.isAttacking = true;
    saveJson(bossFightData, EVENT_DATA_JSON);

    tellNearbyPlayers(npc, "&6The Chocolate Powder Flood attack has started!", 50);

    npc.getTimers().start(6, 20, true); // Timer to spawn blocks every second
    npc.getTimers().start(7, 260, false);
}

/**
 * Spawns chocolate powder blocks that freeze players on contact.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function spawnChocolatePowder(npc) {
    var numberOfBlocks = 30; // Increased from previous value
    var bossFightData = loadJson(EVENT_DATA_JSON);

    // Stop spawning if the attack is no longer active
    if (!bossFightData.isAttacking) {
        npc.getTimers().stop(6);
        return;
    }

    var world = npc.getWorld();
    var arenaType = bossFightData["use_arena"] || "debug"; // Get arena type from JSON
    var arena = bossFightData.Arena[arenaType];
    var pos1 = arena.pos1;
    var pos2 = arena.pos2;

    // Determine the highest Y position in the arena
    var highestY = Math.max(pos1.y, pos2.y);

    for (var i = 0; i < numberOfBlocks; i++) {
        // Randomize block spawn position within the arena
        var x = Math.floor(Math.random() * (Math.max(pos1.x, pos2.x) - Math.min(pos1.x, pos2.x) + 1)) + Math.min(pos1.x, pos2.x);
        var z = Math.floor(Math.random() * (Math.max(pos1.z, pos2.z) - Math.min(pos1.z, pos2.z) + 1)) + Math.min(pos1.z, pos2.z);

        // Place the block at the highest Y position
        world.setBlock(x, highestY, z, "minecraft:concrete_powder", 12);

        // Play sound when spawning the block
        npc.executeCommand("/playsound minecraft:block.sand.place block @a " + x + " " + highestY + " " + z + " 1 1");

        // Spawn small particles at the block's location
        spawnParticles(world, API.getIPos(x, highestY, z), "blockcrack");

        // Apply slowness and weakness to players in a 5-block radius
        var players = getPlayersInRadius(world, API.getIPos(x, highestY, z), 5);
        for (var j = 0; j < players.length; j++) {
            var player = players[j];
            applyEffect(player, "slowness", 7, 5); // Level 8, duration 5 seconds
            applyEffect(player, "weakness", 1, 5); // Level 1, duration 5 seconds
        }
    }
}

/**
 * Utility function to spawn particles.
 * @param {IPos} position - The position to spawn particles.
 * @param {string} effect - The particle effect to spawn.
 */
function spawnParticles(world, position, effect) {
    var command = "/particle " + effect + " " + position.getX() + " " + position.getY() + " " + position.getZ() + " 0.5 0.5 0.5 0.1 10 normal @a 172";
    API.executeCommand(world, command);
}

/**
 * Utility function to get players in a radius.
 * @param {IPos} position - The center position.
 * @param {number} radius - The radius to search for players.
 * @returns {Array} - List of players within the radius.
 */
function getPlayersInRadius(world, position, radius) {
    return world.getNearbyEntities(position, radius, 1); // Type 1 = players
}

/**
 * Utility function to apply effects to a player.
 * @param {IPlayer} player - The player to apply the effect to.
 * @param {string} effect - The effect to apply.
 * @param {number} level - The level of the effect.
 * @param {number} duration - The duration of the effect in ticks.
 */
function applyEffect(player, effect, level, duration) {
    switch (effect) {
        case "slowness":
            player.addPotionEffect(2, duration, level, true);
            break;
        case "weakness":
            player.addPotionEffect(18, duration, level, true);
            break;
        case "blindness":
            player.addPotionEffect(15, duration, level, true);
            break;
    }
}

/**
 * Handles tick updates for the NPC.
 * @param {Object} event - The event object containing the NPC instance.
 */
function tick(event) {
    var npc = event.npc;
    var bossFightData = loadJson(EVENT_DATA_JSON);

    // Ensure the bunny boss stays within the arena
    keepBossInArena(npc, bossFightData);

    // Handle players leaving the arena during combat
    if (bossFightData.isAttacking) {
        handlePlayersExitingArena(npc, bossFightData);
    }

    handleJumpAttack(npc);
    handleModifiersAndEvents(npc);

    // Handle autonomous attacks
    handleAutonomousAttacks(npc, bossFightData);
}

/**
 * Handles autonomous attacks for the bunny boss.
 * @param {ICustomNpc} npc - The NPC instance.
 * @param {Object} bossFightData - The boss fight data.
 */
function handleAutonomousAttacks(npc, bossFightData) {
    if (!bossFightData.isEventRunning || isEggMode() || bossFightData.isAttacking) {
        return; // Disable automatic attacks if the event is not running or in egg mode
    }

    var storedData = npc.getStoreddata();
    var lastAttackTime = storedData.get("lastAttackTime") || 0;
    var currentTime = npc.getWorld().getTotalTime();

    var bunnyStage = bossFightData.BunnyStage || 0;
    var cooldown = ATTACK_COOLDOWN_BASE - (bunnyStage * 10); // Reduce cooldown by 10 seconds per stage
    var cooldownTicks = cooldown * TICKS_PER_SECOND;

    if (currentTime - lastAttackTime >= cooldownTicks) {
        if (Math.random() < 0.1) { // 10% chance to start an attack each tick
            startRandomAttack(npc, bossFightData);
            storedData.put("lastAttackTime", currentTime);
        }
    }
}

/**
 * Starts a random attack for the bunny boss.
 * @param {ICustomNpc} npc - The NPC instance.
 * @param {Object} bossFightData - The boss fight data.
 */
function startRandomAttack(npc, bossFightData) {
    var attacks = [
        startJumpAttack,
        startMiniEggSwarmAttack,
        startBoomshellWallAttack,
        startChocolatePowderFloodAttack
    ];

    var randomAttack = attacks[Math.floor(Math.random() * attacks.length)];
    try {
        randomAttack(npc);
        logToFile("events", "Easter Bunny Boss: Started a random attack - " + randomAttack.name);
    } catch (error) {
        logToFile("events", "Error starting random attack: " + error.message);
    }
}

/**
 * Ensures the bunny boss stays within the arena bounds.
 * @param {ICustomNpc} npc - The NPC instance.
 * @param {Object} bossFightData - The boss fight data.
 */
function keepBossInArena(npc, bossFightData) {
    var arenaType = bossFightData["use_arena"] || "debug"; // Get arena type from JSON
    var arena = bossFightData.Arena[arenaType];
    var pos1 = arena.pos1;
    var pos2 = arena.pos2;

    var x = Math.max(Math.min(npc.getX(), Math.max(pos1.x, pos2.x)), Math.min(pos1.x, pos2.x));
    var y = Math.max(Math.min(npc.getY(), Math.max(pos1.y, pos2.y)), Math.min(pos1.y, pos2.y));
    var z = Math.max(Math.min(npc.getZ(), Math.max(pos1.z, pos2.z)), Math.min(pos1.z, pos2.z));

    if (x !== npc.getX() || y !== npc.getY() || z !== npc.getZ()) {
        npc.setPosition(x, y, z);

        // Apply motion to push the bunny back into the arena
        var centerX = (pos1.x + pos2.x) / 2;
        var centerZ = (pos1.z + pos2.z) / 2;

        var dx = centerX - npc.getX();
        var dz = centerZ - npc.getZ();
        var distance = Math.sqrt(dx * dx + dz * dz);

        if (distance > 0) {
            var motionX = (dx / distance) * 0.5;
            var motionY = 0.2; // Slight upward motion
            var motionZ = (dz / distance) * 0.5;

            npc.setMotionX(motionX);
            npc.setMotionY(motionY);
            npc.setMotionZ(motionZ);
        }

        // Trigger shockwave effect
        triggerShockwave(npc);
    }
}

/**
 * Triggers a shockwave effect when the bunny boss hits the edge of the arena.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function triggerShockwave(npc) {
    var world = npc.getWorld();
    var shockwaveRadius = 10;
    var shockwaveDamage = 2;

    // Play sound and particles
    npc.executeCommand("/playsound ivv:mts.ivv.engine.t42.backfire master @a ~ ~ ~ 1 1");
    npc.executeCommand("/particle reddust " + npc.getX() + " " + npc.getY() + " " + npc.getZ() + " 1 1 1 0.1 20 normal");

    // Apply damage and knockback to nearby players
    var nearbyPlayers = world.getNearbyEntities(npc.getPos(), shockwaveRadius, 1); // Type 1 = players
    for (var i = 0; i < nearbyPlayers.length; i++) {
        var player = nearbyPlayers[i];
        var dx = player.getX() - npc.getX();
        var dz = player.getZ() - npc.getZ();
        var direction = Math.atan2(-dz, -dx) * (180 / Math.PI) + 90; // Reverse direction to push players away

        // Apply knockback
        player.knockback(2, direction);

        // Only damage the player if their health is above 50%
        if (player.getHealth() > player.getMaxHealth() * 0.25) {
            player.damage(shockwaveDamage);
        }

        // Disorient players holding guns
        var heldItem = player.getMainhandItem();
        if (heldItem && heldItem.getName().startsWith("flansmod:")) {
            applyEffect(player, "blindness", 0, 5); // Level 1, duration 5 seconds
            tellPlayer(player, "&cThe shockwave disoriented you! Guns are heavy, and you lost focus!");
        }
    }
}

/**
 * Handles players exiting the arena during combat.
 * @param {ICustomNpc} npc - The NPC instance.
 * @param {Object} bossFightData - The boss fight data.
 */
function handlePlayersExitingArena(npc, bossFightData) {
    var arenaType = bossFightData["use_arena"] || "debug"; // Get arena type from JSON
    var arena = bossFightData.Arena[arenaType];
    var pos1 = arena.pos1;
    var pos2 = arena.pos2;

    var world = npc.getWorld();
    var nearbyPlayers = world.getNearbyEntities(npc.getPos(), 50, 1); // Get players within a radius

    for (var i = 0; i < nearbyPlayers.length; i++) {
        var player = nearbyPlayers[i];
        var playerPos = player.getPos();

        // Check if the player is outside the arena bounds
        if (!isWithinZone(iposToPos(playerPos), pos1, pos2)) {
            // If the player is above the arena, push them down
            if (player.getY() > Math.max(pos1.y, pos2.y)) {
                player.setMotionY(-1.0); // Push the player downward
                tellPlayer(player, "&cYou are too high above the arena! Returning you to the ground.");
            } else {
                // Calculate the center of the arena
                var centerX = (pos1.x + pos2.x) / 2;
                var centerZ = (pos1.z + pos2.z) / 2;

                // Calculate knockback direction towards the center
                var dx = centerX - player.getX();
                var dz = centerZ - player.getZ();
                var distance = Math.sqrt(dx * dx + dz * dz);
                if (distance > 0) {
                    var knockbackX = (dx / distance) * 1.5;
                    var knockbackY = 0.5; // Upward motion
                    var knockbackZ = (dz / distance) * 1.5;
                    player.setMotionX(knockbackX);
                    player.setMotionY(knockbackY);
                    player.setMotionZ(knockbackZ);
                }

                // Apply damage
                player.damage(2);

                // Play zap sound and particles
                var command = "/particle reddust " + player.getX() + " " + player.getY() + " " + player.getZ() + " 0.5 0.5 0.5 0.1 20 normal";
                npc.executeCommand(command);
                npc.executeCommand("/playsound ivv:mts.ivv.engine.damage.hiss master @a " + player.getX() + " " + player.getY() + " " + player.getZ() + " 1 1");
            }
        }
    }
}

/**
 * Handles the jump attack logic during tick updates.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function handleJumpAttack(npc) {
    var jumpAttackTicks = npc.getStoreddata().get("jumpAttackTicks");
    var jumpPhase = npc.getStoreddata().get("jumpPhase");

    if (jumpAttackTicks > 0) {
        jumpAttackTicks--;
        npc.getStoreddata().put("jumpAttackTicks", jumpAttackTicks);

        if (jumpPhase === "up" && jumpAttackTicks > 2) {
            npc.setMotionY(0.5);
        } else if (jumpPhase === "up" && jumpAttackTicks <= 2) {
            npc.getStoreddata().put("jumpPhase", "down");
        } else if (jumpPhase === "down") {
            npc.setMotionY(-0.5);
        }

        if (jumpAttackTicks === 0) {
            npc.getAi().setNavigationType(0);
            spawnKnockbackParticles(npc, 20);
            npc.executeCommand("/playsound ivv:gun.explode neutral @a");
        }
    }
}

/**
 * Spawns knockback particles around the NPC.
 * @param {ICustomNpc} npc - The NPC instance.
 * @param {number} radius - The radius of the knockback effect.
 */
function spawnKnockbackParticles(npc, radius) {
    var world = npc.getWorld();
    var x = npc.getX();
    var y = npc.getY();
    var z = npc.getZ();

    while (world.getBlock(x, y, z).isAir() && y > 0) {
        y--;
    }
    var blockBelow = world.getBlock(x, y - 1, z);
    if (!blockBelow.isAir()) {
        var command = "/summon area_effect_cloud " + x + " " + (y + 0.5) + " " + z +
            " {Particle:\"mobSpell\",Radius:" + radius + "f,Duration:" + PARTICLE_DURATION +
            ",Color:" + PARTICLE_COLOR + ",Motion:" + JSON.stringify(PARTICLE_MOTION) + "}";
        npc.executeCommand(command);
    }

    var nearbyEntities = world.getNearbyEntities(npc.getPos(), radius, 1);
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
 * Handles modifiers and events during tick updates.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function handleModifiersAndEvents(npc) {
    if (!isEggMode()) {
        var data = loadJson(EVENT_DATA_JSON);
        if (data) {
            if (data.running_recipes.length > 0) {
                for (var i = 0; i < data.running_recipes.length; i++) {
                    var recipe = data.running_recipes[i];
                    handleRecipeEffects(npc, recipe);
                }
            }

            if (isRabbitFrozen(npc) && !hasFreezingRecipe(data)) {
                unfreezeRabbit(npc);
            }
        }
    }
}

/**
 * Handles recipe effects on the NPC.
 * @param {ICustomNpc} npc - The NPC instance.
 * @param {Object} recipe - The recipe object.
 */
function handleRecipeEffects(npc, recipe) {
    switch (recipe.name) {
        case "Minor Calm Offer":
        case "Phase Trigger":
            if (!isRabbitFrozen(npc)) {
                freezeRabbit(npc);
            }
            break;
        case "knockback":
            spawnKnockbackParticles(npc);
            break;
        default:
            break;
    }
}

/**
 * Checks if there is a freezing recipe in the data.
 * @param {Object} data - The data object.
 * @returns {boolean} - True if a freezing recipe exists, false otherwise.
 */
function hasFreezingRecipe(data) {
    return findJsonEntry(data.running_recipes, "name", "Minor Calm Offer") || 
           findJsonEntry(data.running_recipes, "name", "Phase Trigger");
}

/**
 * Handles the timer events for the bunny boss.
 * @param {Object} event - The event object containing the NPC instance.
 */
function timer(event) {
    var npc = event.npc;
    var bossFightData = loadJson(EVENT_DATA_JSON);

    try {
        if (event.id === 1) { // Egg spawning timer
            var world = npc.getWorld();
            var spawnPos = npc.getPos();
            var eggsSpawned = npc.getStoreddata().get("eggsSpawned");
            var totalEggsToSpawn = npc.getStoreddata().get("totalEggsToSpawn");

            if (eggsSpawned < totalEggsToSpawn) {
                var eggsToSpawnThisTick = Math.min(rrandom_range(1, 3), totalEggsToSpawn - eggsSpawned);

                for (var i = 0; i < eggsToSpawnThisTick; i++) {
                    var egg = world.spawnClone(spawnPos.getX(), spawnPos.getY(), spawnPos.getZ(), 2, "Scrambler");
                    egg.executeCommand("/playsound ivv:gun.firing.laser neutral @a");
                    if (egg) {
                        egg.setMotionX((Math.random() * 1.5 - 0.75));
                        egg.setMotionY(Math.random() * 1 + 0.5);
                        egg.setMotionZ(Math.random() * 1.5 - 0.75);
                    }
                }

                eggsSpawned += eggsToSpawnThisTick;
                npc.getStoreddata().put("eggsSpawned", eggsSpawned);
            } else {
                npc.getTimers().stop(1);
            }
        }

        if (event.id === 2) { // End Mini Egg Swarm attack timer
            bossFightData.isAttacking = false;
            saveJson(bossFightData, EVENT_DATA_JSON);

            tellNearbyPlayers(npc, "&6The Mini Egg Swarm attack has ended!", 50);
            npc.executeCommand("/playsound minecraft:entity.experience_orb.pickup master @a ~ ~ ~ 1 1");
        }

        if (event.id === 3) { // Boomshell spawning timer
            var world = npc.getWorld();
            var spawnPos = npc.getPos();
            var boomshellsSpawned = npc.getStoreddata().get("boomshellsSpawned");
            var totalBoomshellsToSpawn = npc.getStoreddata().get("totalBoomshellsToSpawn");

            if (boomshellsSpawned < totalBoomshellsToSpawn) {
                var boomshell = world.spawnClone(spawnPos.getX(), spawnPos.getY(), spawnPos.getZ(), 2, "Boomshell");
                if (boomshell) {
                    // Increase motion values for greater spread
                    boomshell.setMotionX((Math.random() * 3 - 1.5)); // Larger horizontal motion
                    boomshell.setMotionY(Math.random() * 1.5 + 0.5); // Higher vertical motion
                    boomshell.setMotionZ(Math.random() * 3 - 1.5); // Larger horizontal motion
                }

                boomshellsSpawned++;
                npc.getStoreddata().put("boomshellsSpawned", boomshellsSpawned);
            } else {
                npc.getTimers().stop(3);
            }
        }

        if (event.id === 4) { // End Boomshell Wall attack timer
            bossFightData.isAttacking = false;
            saveJson(bossFightData, EVENT_DATA_JSON);

            tellNearbyPlayers(npc, "&6The Boomshell Wall attack has ended!", 50);
            npc.executeCommand("/playsound minecraft:entity.experience_orb.pickup master @a ~ ~ ~ 1 1");
        }

        if (event.id === 5) { // End Jump Attack timer
            bossFightData.isAttacking = false;
            saveJson(bossFightData, EVENT_DATA_JSON);

            tellNearbyPlayers(npc, "&6The Jump Attack has ended!", 50);
            npc.executeCommand("/playsound minecraft:entity.experience_orb.pickup master @a ~ ~ ~ 1 1");
        }

        if (event.id === 6) { // Chocolate powder spawning timer
            spawnChocolatePowder(npc);
        }

        if (event.id === 7) { // End Chocolate Powder Flood attack timer
            bossFightData.isAttacking = false;
            saveJson(bossFightData, EVENT_DATA_JSON);

            tellNearbyPlayers(npc, "&6The Chocolate Powder Flood attack has ended!", 50);

            // Replace all chocolate powder blocks in the arena
            var arenaType = bossFightData["use_arena"] || "debug"; // Get arena type from JSON
            var arena = bossFightData.Arena[arenaType];
            var pos1 = arena.pos1;
            var pos2 = arena.pos2;

            var world = npc.getWorld();
            for (var x = Math.min(pos1.x, pos2.x); x <= Math.max(pos1.x, pos2.x); x++) {
                for (var y = Math.min(pos1.y, pos2.y); y <= Math.max(pos1.y, pos2.y); y++) {
                    for (var z = Math.min(pos1.z, pos2.z); z <= Math.max(pos1.z, pos2.z); z++) {
                        var block = world.getBlock(x, y, z);
                        if (block.getName() === "minecraft:concrete_powder" && block.getMetadata() === 12) {
                            world.setBlock(x, y, z, "minecraft:air", 0);

                            // Spawn particles when cleaning up the blocks
                            var particleCommand = "/particle blockcrack " + x + " " + y + " " + z + " 0.5 0.5 0.5 0.1 10 normal @a 172";
                            npc.executeCommand(particleCommand);

                            // Apply knockback to players near the block
                            var nearbyPlayers = world.getNearbyEntities(API.getIPos(x, y, z), 3, 1); // Radius 3, type 1 = players
                            for (var i = 0; i < nearbyPlayers.length; i++) {
                                var player = nearbyPlayers[i];
                                var dx = player.getX() - x;
                                var dz = player.getZ() - z;
                                var distance = Math.sqrt(dx * dx + dz * dz);
                                if (distance > 0) {
                                    var knockbackX = (dx / distance) * 0.5;
                                    var knockbackY = 0.3; // Upward motion
                                    var knockbackZ = (dz / distance) * 0.5;
                                    player.setMotionX(knockbackX);
                                    player.setMotionY(knockbackY);
                                    player.setMotionZ(knockbackZ);
                                }
                            }
                        }
                    }
                }
            }

            // Kill remaining falling blocks
            npc.executeCommand("/kill @e[type=falling_block]");

            npc.executeCommand("/playsound minecraft:entity.illusion_illager.cast_spell master @a ~ ~ ~ 1 1");
            npc.executeCommand("/playsound minecraft:entity.experience_orb.pickup master @a ~ ~ ~ 1 1");
        }
    } catch (error) {
        logToFile("events", "Error in timer event (ID: " + event.id + "): " + error.message);
    }
}

/**
 * Handles the death of the Easter Bunny Boss.
 * @param {Object} event - The event object containing the NPC instance.
 */
function died(event) {
    var npc = event.npc;
    var player = event.player;
    var world = npc.getWorld();
    var death_pos = npc.getPos();

    var data = loadJson(EVENT_DATA_JSON);

    if (data) {
        data.BunnyStage += 1;
        data.isEggMode = true;
        data.isAttacking = false;
        data.running_recipes = [];
        saveJson(data, EVENT_DATA_JSON);

        if (data.BunnyStage > 3) {
            npc.despawn();
            data.isEventRunning = true;
            data.BunnyStage = 0;
            world.playSoundAt(death_pos, "minecraft:entity.enderdragon.death", 10.0, 1.0);
            tellNearbyPlayers(npc, "&cThe Easter Bunny has been defeated once and for all! The event is over!");
        } else {
            tellNearbyPlayers(npc, "&6The Easter Bunny has been defeated, but it seems to be preparing for something...");
            tellNearbyPlayers(npc, "&cStage " + data.BunnyStage + " has begun! The bunny is stronger than before!");
        }
    }

    var x = death_pos.getX();
    var y = death_pos.getY();
    var z = death_pos.getZ();
    var command = "/summon area_effect_cloud " + x + " " + (y + 0.5) + " " + z +
        " {Particle:\"mobSpell\",Radius:" + PARTICLE_RADIUS + "f,Duration:" + PARTICLE_DURATION +
        ",Color:" + PARTICLE_COLOR + ",Motion:" + JSON.stringify(PARTICLE_MOTION) + "}";
    npc.executeCommand(command);
    world.playSoundAt(death_pos, "minecraft:entity.enderdragon.growl", 10.0, 1.0);
    var command = "/particle blockcrack " + x + " " + y + " " + z + " 1 1 1 0.5 100 normal @a 201";
    npc.executeCommand(command);

    // Run all cleanups
    initEggMode(npc);
    destroyHatchPillar(npc);
    cleanupRemainingEntities(world);
    cleanupArena(world);

    logToFile("events", "Easter Bunny Boss: Died. Bunny Stage: " + data.BunnyStage);
}

/**
 * Cleans up remaining entities like eggs and boomshells in the world.
 * @param {IWorld} world - The world instance.
 */
function cleanupRemainingEntities(world) {
    var entities = world.getNearbyEntities(API.getIPos(0, 0, 0), 10000, 2); // Type 2 = NPCs
    for (var i = 0; i < entities.length; i++) {
        var entity = entities[i];
        if (entity.getName() === "Scrambler" || entity.getName() === "Boomshell") {
            entity.despawn();
        }
    }
    logToFile("events", "Cleaned up remaining Scramblers and Boomshells.");
}

/**
 * Cleans up the arena by removing temporary blocks like chocolate powder.
 * @param {IWorld} world - The world instance.
 */
function cleanupArena(world) {
    var data = loadJson(EVENT_DATA_JSON);
    var arenaType = data["use_arena"] || "debug"; // Get arena type from JSON
    var arena = data.Arena[arenaType];
    var pos1 = arena.pos1;
    var pos2 = arena.pos2;

    for (var x = Math.min(pos1.x, pos2.x); x <= Math.max(pos1.x, pos2.x); x++) {
        for (var y = Math.min(pos1.y, pos2.y); y <= Math.max(pos1.y, pos2.y); y++) {
            for (var z = Math.min(pos1.z, pos2.z); z <= Math.max(pos1.z, pos2.z); z++) {
                var block = world.getBlock(x, y, z);
                if (block.getName() === "minecraft:concrete_powder" && block.getMetadata() === 12) {
                    world.setBlock(x, y, z, "minecraft:air", 0);
                }
            }
        }
    }
    API.executeCommand(world, "/kill @e[type=falling_block]");
    logToFile("events", "Cleaned up the arena by removing temporary blocks.");
}

/**
 * Spawns a giant egg at the Easter Bunny's location.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function initEggMode(npc) {
    var globalData = loadJson(EVENT_DATA_JSON);
    var world = npc.getWorld();
    var x = npc.getX();
    var y = npc.getY();
    var z = npc.getZ();

    if (!globalData) {
        globalData = {
            isEggMode: true,
            isAttacking: false,
            running_recipes: []
        };
    }
    globalData.isEggMode = true;
    globalData.isAttacking = false;
    globalData.running_recipes = [];
    saveJson(globalData, EVENT_DATA_JSON);

    // Cleanup remaining entities and arena
    cleanupRemainingEntities(world);
    cleanupArena(world);

    npc.setFaction(16);
    npc.getDisplay().setSkinUrl("https://legends-of-gramdatis.com/gramados_skins/easter_eggs/easter_egg_19.png");
    npc.getDisplay().setModel("customnpcs:npcslime");
    npc.getDisplay().setSize(10);
    npc.getDisplay().setHasLivingAnimation(false);
    npc.getAi().setWalkingSpeed(0);
    npc.getAi().setWanderingRange(1);
    npc.getAi().setStandingType(1);
    npc.getAi().setMovingType(0);
    npc.getAi().setRetaliateType(2);
    updateHealth(npc);
    updateSounds(npc);
}

/**
 * Initializes the bunny mode for the Easter Bunny Boss.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function initBunnyMode(npc) {
    var globalData = loadJson(EVENT_DATA_JSON);
    if (globalData) {
        globalData.isEggMode = false;
        saveJson(globalData, EVENT_DATA_JSON);
    }
    npc.setFaction(11);
    npc.getDisplay().setSkinUrl("https://legends-of-gramdatis.com/gramados_skins/tmp/rabbit_easter.png");
    npc.getDisplay().setModel("animania:buck_jack");
    npc.getDisplay().setSize(14 + globalData.BunnyStage * 2);
    npc.getDisplay().setHasLivingAnimation(true);
    npc.getAi().setWalkingSpeed(7);
    npc.getAi().setWanderingRange(14);
    // npc.getAi().setWanderingRange(5);
    npc.getAi().setStandingType(0);
    npc.getAi().setMovingType(1);
    npc.getAi().setRetaliateType(3);
    updateHealth(npc);
    updateSounds(npc);
}

/**
 * Checks if the Easter Bunny is in egg mode.
 * @returns {boolean} - True if in egg mode, false otherwise.
 */
function isEggMode() {
    var globalData = loadJson(EVENT_DATA_JSON);
    if (!globalData) {
        globalData = {
            isEggMode: false
        };
        saveJson(globalData, EVENT_DATA_JSON);
    }
    return globalData.isEggMode;
}

/**
 * Transforms the Easter Bunny into bunny mode.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function bunnyHatch(npc) {
    initBunnyMode(npc);
    var world = npc.getWorld();

    world.playSoundAt(npc.getPos(), "minecraft:entity.wither.break_block", 10.0, 1.0);
    world.playSoundAt(npc.getPos(), "minecraft:entity.wither.spawn", 10.0, 1.0);
    tellNearbyPlayers(npc, "&dThe Easter Bunny has returned in its Bunny form! Prepare for battle!");
    logToFile("events", "Easter Bunny Boss: Bunny mode activated.");
}

/**
 * Transforms the Easter Bunny into egg mode.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function eggHatch(npc) {
    var world = npc.getWorld();

    var x = Math.floor(npc.getHomeX());
    var y = Math.floor(npc.getHomeY());
    var z = Math.floor(npc.getHomeZ());

    npc.setPosition(x, y + 1, z);

    world.playSoundAt(npc.getPos(), "minecraft:entity.zombie_horse.death", 5.0, 1.0);
    world.playSoundAt(npc.getPos(), "minecraft:block.lava.ambient", 1.0, 1.0);
    var command = "/particle blockcrack " + x + " " + y + " " + z + " 3 2 3 5.0 300 normal @a 10";
    npc.executeCommand(command);
    tellNearbyPlayers(npc, "&eThe Easter Bunny has retreated into its Egg form. Something is brewing...");
    logToFile("events", "Easter Bunny Boss: Egg mode activated.");
}

/**
 * Freezes the Easter Bunny, changing its appearance and behavior.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function freezeRabbit(npc) {
    logToFile("events", "Easter Bunny Boss: Frozen.");
    npc.getDisplay().setSkinUrl("https://legends-of-gramdatis.com/gramados_skins/tmp/rabbit_easter_frozen.png");
    npc.getAi().setWalkingSpeed(0);
    npc.getAi().setWanderingRange(1);
    npc.getAi().setStandingType(1);
    npc.getStats().setResistance(3, 2.0);
    npc.getStats().setResistance(0, 1.8);
    npc.getStats().setResistance(1, 1.8);
    npc.executeCommand("/playsound minecraft:entity.illusion_illager.prepare_mirror neutral @a");
}

/**
 * Unfreezes the Easter Bunny, restoring its appearance and behavior.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function unfreezeRabbit(npc) {
    logToFile("events", "Easter Bunny Boss: Unfrozen.");
    npc.getDisplay().setSkinUrl("https://legends-of-gramdatis.com/gramados_skins/tmp/rabbit_easter.png");
    npc.getAi().setWalkingSpeed(7);
    npc.getAi().setWanderingRange(10);
    npc.getAi().setStandingType(0);
    npc.getStats().setResistance(3, 1.0);
    npc.getStats().setResistance(0, 1.0);
    npc.getStats().setResistance(1, 1.0);
    npc.executeCommand("/playsound minecraft:entity.illusion_illager.cast_spell neutral @a");
}

/**
 * Checks if the Easter Bunny is frozen.
 * @param {ICustomNpc} npc - The NPC instance.
 * @returns {boolean} - True if frozen, false otherwise.
 */
function isRabbitFrozen(npc) {
    return (npc.getDisplay().getSkinUrl() == "https://legends-of-gramdatis.com/gramados_skins/tmp/rabbit_easter_frozen.png");
}