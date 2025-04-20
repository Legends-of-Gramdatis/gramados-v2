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

    if (itemName === "variedcommodities:bandit_mask") {
        var model = npc.getDisplay().getModel();
        tellPlayer(player, "&6Model ID: " + model);
        return;
    } else if (itemName === "variedcommodities:spell_dark") {
        eggHatch(npc);
        tellPlayer(player, "&6The Easter Bunny has been turned into a giant egg!");
        return;
    } else if (itemName === "variedcommodities:spell_holy") {
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
        destroyFuturaBlocks(npc.getWorld());
        tellPlayer(player, "&6The power of fire has destroyed the futura blocks!");
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
            startBellSoundFreezeAttack(npc);
            tellPlayer(player, "&6The Easter Bunny summons freezing bells!");
        }
    }
}

/**
 * Destroys one "chisel:futura" block in predefined regions and plays particles.
 * @param {IWorld} world - The world instance.
 */
function destroyFuturaBlocks(world) {
    function destroyBlock(x, y, z) {
        var position = API.getIPos(x, y, z);
        world.playSoundAt(position, "minecraft:block.glass.break", 1.0, 1.0);
        world.setBlock(x, y, z, "chisel:wool_gray", 0);
        var particleCommand = "/particle blockcrack " + x + " " + y + " " + z + " 3 1 3 0.5 100 force @a 201";
        API.executeCommand(world, particleCommand);
    }

    for (var x = 2285; x >= 2273; x--) {
        for (var y = 100; y >= 94; y--) {
            for (var z = 3608; z >= 3594; z--) {
                var block = world.getBlock(x, y, z);
                if (block.getName() === "chisel:futura" && block.getMetadata() === 4) {
                    destroyBlock(x, y, z);
                    return;
                }
            }
        }
    }
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
    var totalEggsToSpawn = Math.floor(Math.random() * (10 - 3 + 1)) + 3 + Math.floor(Math.random() * (4 - 1 + 1)) + 1 * bossFightData.BunnyStage;
    var eggsSpawned = 0;

    npc.getStoreddata().put("totalEggsToSpawn", totalEggsToSpawn);
    npc.getStoreddata().put("eggsSpawned", eggsSpawned);

    npc.getTimers().start(1, 10, true); // Timer to spawn eggs every 0.5 seconds
    npc.getTimers().start(2, 1200, false); // End the attack after 1 minute
}

/**
 * Starts the Boomshell Wall attack for the bunny boss.
 * Spawns a random number of Boomshells with slight motion and ends the attack after 10 seconds.
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
    var totalBoomshellsToSpawn = Math.floor(Math.random() * 3) + 3 + bunnyStage; // 1-3 + 1 per stage

    npc.getStoreddata().put("totalBoomshellsToSpawn", totalBoomshellsToSpawn);
    npc.getStoreddata().put("boomshellsSpawned", 0);

    npc.getTimers().start(3, 10, true); // Timer to spawn Boomshells every 0.5 seconds
    npc.getTimers().start(4, 200, false); // End the attack after 10 seconds
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
 * Starts the Bell Sound Freeze attack for the bunny boss.
 * Spawns bells that freeze players on contact and ends the attack after 15 seconds.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function startBellSoundFreezeAttack(npc) {
    var bossFightData = loadJson(EVENT_DATA_JSON);

    if (bossFightData.isAttacking) {
        npc.say("&cThe boss is already attacking!");
        return;
    }

    bossFightData.isAttacking = true;
    saveJson(bossFightData, EVENT_DATA_JSON);

    tellNearbyPlayers(npc, "&6The Bell Sound Freeze attack has started!", 50);

    npc.getTimers().start(6, 20, true); // Timer to spawn bells every second
    npc.getTimers().start(7, 300, false); // End the attack after 15 seconds
}

/**
 * Spawns a bell that freezes players on contact.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function spawnBell(npc) {
    var world = npc.getWorld();
    var spawnPos = npc.getPos();

    // Randomize bell spawn position within a 10-block radius
    var x = spawnPos.getX() + (Math.random() * 20 - 10);
    var y = spawnPos.getY() + 10; // Spawn 10 blocks above the NPC
    var z = spawnPos.getZ() + (Math.random() * 20 - 10);

    // Summon the bell as a falling block
    var command = "/summon falling_block " + x + " " + y + " " + z + " {BlockState:{Name:\"<chisel:gold\"},Time:1,DropItem:0}";
    npc.executeCommand(command);

    // Apply effects to players near the bell's landing position
    npc.getTimers().start(8, 10, false, { x: x, y: y, z: z }); // Timer to check for player contact
}

/**
 * Handles tick updates for the NPC.
 * @param {Object} event - The event object containing the NPC instance.
 */
function tick(event) {
    var npc = event.npc;

    handleJumpAttack(npc);
    handleModifiersAndEvents(npc);
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
            spawnKnockbackParticles(npc);
            npc.executeCommand("/playsound ivv:gun.explode neutral @a");
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
 * Spawns knockback particles around the NPC.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function spawnKnockbackParticles(npc) {
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
            " {Particle:\"mobSpell\",Radius:" + PARTICLE_RADIUS + "f,Duration:" + PARTICLE_DURATION +
            ",Color:" + PARTICLE_COLOR + ",Motion:" + JSON.stringify(PARTICLE_MOTION) + "}";
        npc.executeCommand(command);
    }

    var nearbyEntities = world.getNearbyEntities(npc.getPos(), PARTICLE_RADIUS, 1);
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
 * Handles the timer events for the bunny boss.
 * @param {Object} event - The event object containing the NPC instance.
 */
function timer(event) {
    var npc = event.npc;
    var bossFightData = loadJson(EVENT_DATA_JSON);

    if (event.id === 1) { // Egg spawning timer
        var world = npc.getWorld();
        var spawnPos = npc.getPos();
        var eggsSpawned = npc.getStoreddata().get("eggsSpawned");
        var totalEggsToSpawn = npc.getStoreddata().get("totalEggsToSpawn");

        if (eggsSpawned < totalEggsToSpawn) {
            var eggsToSpawnThisTick = Math.min(Math.floor(Math.random() * 2) + 1, totalEggsToSpawn - eggsSpawned);

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
                boomshell.setMotionX((Math.random() - 0.75));
                boomshell.setMotionY(Math.random() + 0.5);
                boomshell.setMotionZ(Math.random() - 0.75);
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

    if (event.id === 6) { // Bell spawning timer
        spawnBell(npc);
    }

    if (event.id === 7) { // End Bell Sound Freeze attack timer
        bossFightData.isAttacking = false;
        saveJson(bossFightData, EVENT_DATA_JSON);

        tellNearbyPlayers(npc, "&6The Bell Sound Freeze attack has ended!", 50);
        npc.executeCommand("/playsound minecraft:entity.experience_orb.pickup master @a ~ ~ ~ 1 1");
    }

    if (event.id === 8) { // Check for player contact with the bell
        var world = npc.getWorld();
        var bellPos = event.data;
        var nearbyPlayers = world.getNearbyEntities(API.getIPos(bellPos.x, bellPos.y, bellPos.z), 3, 1); // Radius 3, type 1 = players

        for (var i = 0; i < nearbyPlayers.length; i++) {
            var player = nearbyPlayers[i];
            player.addPotionEffect(2, 100, 4, true); // Slowness IV for 5 seconds
            player.addPotionEffect(18, 100, 1, true); // Weakness II for 5 seconds
            npc.executeCommand("/playsound minecraft:block.bell.use master @a " + bellPos.x + " " + bellPos.y + " " + bellPos.z + " 1 1");
        }
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
            data.isEventOver = true;
            data.BunnyStage = 0;
            world.playSoundAt(death_pos, "minecraft:entity.enderdragon.death", 10.0, 1.0);
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
    var command = "/particle blockcrack " + x + " " + y + " " + z + " 1 1 1 0.5 100 force @a 201";
    npc.executeCommand(command);

    initEggMode(npc);
    destroyFuturaBlocks(world);
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

    npc.setFaction(16);
    npc.getDisplay().setSkinUrl("https://legends-of-gramdatis.com/gramados_skins/easter_eggs/easter_egg_19.png");
    npc.getDisplay().setModel("customnpcs:npcslime");
    npc.getDisplay().setSize(10);
    npc.getDisplay().setHasLivingAnimation(false);
    npc.getAi().setWalkingSpeed(0);
    npc.getAi().setWanderingRange(1);
    npc.getAi().setStandingType(1);
    npc.getAi().setMovingType(0);
    npc.getAi().setRetaliateType(3);
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
    npc.setFaction(12);
    npc.getDisplay().setSkinUrl("https://legends-of-gramdatis.com/gramados_skins/tmp/rabbit_easter.png");
    npc.getDisplay().setModel("animania:buck_jack");
    npc.getDisplay().setSize(14 + globalData.BunnyStage * 2);
    npc.getDisplay().setHasLivingAnimation(true);
    npc.getAi().setWalkingSpeed(7);
    npc.getAi().setWanderingRange(10);
    npc.getAi().setStandingType(0);
    npc.getAi().setMovingType(1);
    npc.getAi().setRetaliateType(1);
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
    var command = "/particle blockcrack " + x + " " + y + " " + z + " 3 2 3 5.0 300 force @a 10";
    npc.executeCommand(command);
}

/**
 * Freezes the Easter Bunny, changing its appearance and behavior.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function freezeRabbit(npc) {
    npc.getDisplay().setSkinUrl("https://legends-of-gramdatis.com/gramados_skins/tmp/rabbit_easter_frozen.png");
    npc.getAi().setWalkingSpeed(0);
    npc.getAi().setWanderingRange(1);
    npc.getAi().setStandingType(1);
    npc.getStats().setResistance(3, 2.0);
    npc.executeCommand("/playsound minecraft:entity.illusion_illager.prepare_mirror neutral @a");
}

/**
 * Unfreezes the Easter Bunny, restoring its appearance and behavior.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function unfreezeRabbit(npc) {
    npc.getDisplay().setSkinUrl("https://legends-of-gramdatis.com/gramados_skins/tmp/rabbit_easter.png");
    npc.getAi().setWalkingSpeed(7);
    npc.getAi().setWanderingRange(10);
    npc.getAi().setStandingType(0);
    npc.getStats().setResistance(3, 1.0);
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