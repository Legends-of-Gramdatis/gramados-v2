var npc;
var world;
var player;

var startEvent = false;
var startTime;
var OngoingBattle = false;
var firstTime = false;
var waveDelay;

var enemy_pos_list = [
    [-5280, 77, -817, -1],
    [-5244, 82, -820, -1],
    [-5218, 72, -840, -1],
    [-5238, 72, -808, -1],
    [-5226, 82, -821, -1],
    [-5249, 66, -843, -1],
    [-5242, 72, -828, -1],
    [-5248, 77, -841, -1],
];
var enemy_list = [
    "Striker Drones",
    "Assault Units",
    "Enforcer Droids",
    "Shock Units"
];

var crate_pos_list = [];

var crate_list = [
    "Resupply Crate",
    "Energy Cell Crate",
    "Medkit Box",
    "Tactical Resupply Box"/*,
    "Utility Cache"*/
];



function init(event) {
    npc = event.npc;
    world = npc.getWorld();
    var display = npc.getDisplay();
    display.setBossbar(0);

    crate_pos_list = [
        [-5266, 82, -843, "North West Barracks Roof"],
        [-5239, 82, -817, "Up Stairs on Roof Above Archway"],
        [-5242, 76, -802, "South Defence Wall, Near Bastion"],
        [-5283, 88, -843, "On Glass Dome, Above North West Stairs"],
        [-5216, 77, -825, "In First Floor Of Ruined Barracks Building"],
        [-5217, 88, -833, "On Roof Of Ruined Barracks Building"],
    ];
}

function interact(event){

    if (!OngoingBattle) {
        npc = event.npc;
        player = event.player;
    }

    var active_quests = player.getActiveQuests();
    var finished_quests = player.getFinishedQuests();
    var canstart = false;

    // If player holds a command block, run "cleanNpcsAfterCombat();"
    if (player.getMainhandItem().getName() == "minecraft:command_block") {

        if (OngoingBattle) {
            failCombat();
        } else {
            cleanNpcsAfterCombat();
        }
        return;
    }

    for (var i = 0; i < active_quests.length; i++) {
        if (active_quests[i].getId() == "105") {
            canstart = true;
            firstTime = true;
            event.API.getQuests().get(105).getObjectives(event.player)[0].setProgress(1)
            break;
        }
    }

    for (var i = 0; i < finished_quests.length; i++) {
        if (finished_quests[i].getId() == "105") {
            canstart = true;
            break;
        }
    }

    if (canstart) {

        if (!OngoingBattle) {
            npc.say("Initiating...");

            startTime = world.getTotalTime();

            world.playSoundAt(player.getPos(), "immersiveengineering:chargeslow", 1, 1);
            startEvent = true;
        } else {
            npc.say("A battle is already in progress. Please wait for it to finish.");
        }
    } else {
        npc.say("You may not run this simulation before having the Marksman License.");
    }
}

function tick (event) {
    if (startEvent) {
        if (world.getTotalTime() - startTime >= 40) {
            startBattle();
            waveDelay = 10;
            startEvent = false;
            OngoingBattle = true;
        }
    }

    if (OngoingBattle) {
        waveDelay--;

        if (waveDelay <= 0) {
            generateRobotWave(1);
            waveDelay = 100;
        }

        runRobotWave();

        if (world.getTotalTime() - startTime >= 6000) {
            OngoingBattle = false;
            finishBattle(event);
        }
    }
}

function startBattle() {
    OngoingBattle = true;
    npc.say("Starting the battle!");
    world.playSoundAt(player.getPos(), "ivv:gun.explode.nuclear", 1, 1);
    var display = npc.getDisplay();
    display.setBossbar(1);
}

function generateRobotWave(difficulty) {
    for (var i = 0; i < difficulty; i++) {
        for (var i = 0; i < enemy_pos_list.length; i++) {
            // Get a random timer between 0 and spawnDelay for each enemy
            enemy_pos_list[i][3] = Math.floor(Math.random() * waveDelay);
        }
    }
}

function runRobotWave() {
    for (var i = 0; i < enemy_pos_list.length; i++) {
        if (enemy_pos_list[i][3] == 0) {
            spawnRandomRobot(enemy_pos_list[i][0], enemy_pos_list[i][1], enemy_pos_list[i][2]);
            world.playSoundAt(player.getPos(), "ivv:acive.ejectorseat", 1, 1);
            enemy_pos_list[i][3] = -1;
        } else if (enemy_pos_list[i][3] != -1) {
            enemy_pos_list[i][3]--;
        }
    }

    // get a random crate position if the list is not empty
    if (crate_pos_list.length > 0) {
        var crate_pos = crate_pos_list[Math.floor(Math.random() * crate_pos_list.length)];
        if (waveDelay % 100 == 0) {
            spawnRandomCrate(crate_pos[0], crate_pos[1], crate_pos[2], crate_pos[3]);

            // remove coordinate from list
            var index = crate_pos_list.indexOf(crate_pos);
            if (index > -1) {
                crate_pos_list.splice(index, 1);

                // player.message("Removing " + crate_pos + " from list");

            }
        }
    }
}

function spawnRandomRobot(x, y, z) {
    // Get a random enemy type
    var enemy_type = enemy_list[Math.floor(Math.random() * enemy_list.length)];

    if (enemy_type == "Striker Drones") {
        //spawn 5 striker drones
        for (var j = 0; j < 3; j++) {
            var enemy = world.spawnClone(x, y, z, 5, "Striker Drone");
            enemy.setAttackTarget(npc);
            enemy.setHome(-5276, 72, -831);
            var command = "/summon fireworks_rocket " + x + " " + y + " " + z + " " + " {LifeTime:30,FireworksItem:{id:fireworks,Count:1,tag:{Fireworks:{Explosions:[{Type:1,Colors:[I;16747056],FadeColors:[I;16774935]},{Type:0,Flicker:1b,Trail:1b,Colors:[I;0]},{Type:2,Colors:[I;16728128]}]}}}}";
            npc.executeCommand(command);
        }
    }

    if (enemy_type == "Assault Units") {
        var enemy = world.spawnClone(x, y, z, 5, "Assault Unit");
        enemy.setAttackTarget(npc);
        enemy.setHome(-5276, 72, -831);
        var command = "/summon fireworks_rocket " + x + " " + y + " " + z + " " + " {LifeTime:30,FireworksItem:{id:fireworks,Count:1,tag:{Fireworks:{Explosions:[{Type:1,Colors:[I;16747056],FadeColors:[I;16774935]},{Type:0,Flicker:1b,Trail:1b,Colors:[I;0]},{Type:2,Colors:[I;16728128]}]}}}}";
        npc.executeCommand(command);
    }

    if (enemy_type == "Enforcer Droids") {
        var enemy = world.spawnClone(x, y, z, 5, "Enforcer Droid");
        enemy.setAttackTarget(npc);
        enemy.setHome(-5276, 72, -831);
        var command = "/summon fireworks_rocket " + x + " " + y + " " + z + " " + " {LifeTime:30,FireworksItem:{id:fireworks,Count:1,tag:{Fireworks:{Explosions:[{Type:1,Colors:[I;16747056],FadeColors:[I;16774935]},{Type:0,Flicker:1b,Trail:1b,Colors:[I;0]},{Type:2,Colors:[I;16728128]}]}}}}";
        npc.executeCommand(command);
    }

    if (enemy_type == "Shock Units") {
        var enemy = world.spawnClone(x, y, z, 5, "Shock Unit");
        enemy.setAttackTarget(npc);
        enemy.setHome(-5276, 72, -831);
        var command = "/summon fireworks_rocket " + x + " " + y + " " + z + " " + " {LifeTime:30,FireworksItem:{id:fireworks,Count:1,tag:{Fireworks:{Explosions:[{Type:1,Colors:[I;16747056],FadeColors:[I;16774935]},{Type:0,Flicker:1b,Trail:1b,Colors:[I;0]},{Type:2,Colors:[I;16728128]}]}}}}";
        npc.executeCommand(command);
    }
}

function spawnRandomCrate(x, y, z, area_description) {

    // 1 chance out of 2 to get the first crate
    if (Math.random() < 0.4) {
        var crate_type = crate_list[0];
    } else if (Math.random() < 0.4) {
        var crate_type = crate_list[1];
    } else if (Math.random() < 0.4) {
        var crate_type = crate_list[2];
    } else {
        var crate_type = crate_list[3];
    }

    if (crate_type == "Resupply Crate") {
        var crate = world.spawnClone(x, y, z, 5, "Resupply Crate");
        player.message("A Resupply Crate has been dropped at " + x + ", " + y + ", " + z + " (" + area_description + ")");
    }

    if (crate_type == "Medkit Box") {
        var crate = world.spawnClone(x, y, z, 5, "Medkit Box");
        player.message("A Medkit Box has been dropped at " + x + ", " + y + ", " + z + " (" + area_description + ")");
    }

    if (crate_type == "Utility Cache") {
        var crate = world.spawnClone(x, y, z, 5, "Utility Cache");
        player.message("A Utility Cache has been dropped at " + x + ", " + y + ", " + z + " (" + area_description + ")");
    }

    if (crate_type == "Energy Cell Crate") {
        var crate = world.spawnClone(x, y, z, 5, "Energy Cell Crate");
        player.message("An Energy Cell Crate has been dropped at " + x + ", " + y + ", " + z + " (" + area_description + ")");
    }

    if (crate_type == "Tactical Resupply Box") {
        var crate = world.spawnClone(x, y, z, 5, "Tactical Resupply Box");
        player.message("A Tactical Resupply Box has been dropped at " + x + ", " + y + ", " + z + " (" + area_description + ")");
    }

    var command = "/summon fireworks_rocket " + x + " " + y + " " + z + " " + " {LifeTime:30,FireworksItem:{id:fireworks,Count:1,tag:{Fireworks:{Explosions:[{Type:1,Colors:[I;16738037],FadeColors:[I;13893780]},{Type:0,Flicker:1b,Trail:1b,Colors:[I;65280,15662851]},{Type:2,Colors:[I;65442]}]}}}}";
    npc.executeCommand(command);
}

function finishBattle(event) {
    OngoingBattle = false;
    player.message("Congratulations! You have defended Guardian-RX from the enemy forces.");

    world.playSoundAt(player.getPos(), "minecraft:ui.toast.challenge_complete", 1, 1);

    var active_quests = player.getActiveQuests();

    for (var i = 0; i < active_quests.length; i++) {
        if (active_quests[i].getId() == "106") {
            event.API.getQuests().get(106).getObjectives(player)[0].setProgress(1)
            break;
        }
    }

    var display = npc.getDisplay();
    display.setBossbar(0);

    cleanNpcsAfterCombat();
}

function failCombat() {
    OngoingBattle = false;
    player.message("You have failed to defend Guardian-RX from the enemy forces.");

    var display = npc.getDisplay();
    display.setBossbar(0);

    cleanNpcsAfterCombat();
}

function cleanNpcsAfterCombat() {
    var entities = world.getNearbyEntities(player.getPos(), 100, 0)
    for (var i = 0; i < entities.length; i++) {
        if (entities[i].getName().contains("Striker Drone") || entities[i].getName().contains("Assault Unit") || entities[i].getName().contains("Enforcer Droid") || entities[i].getName().contains("Shock Unit")) {
            // player.message("Despawning " + entities[i].getName());
            entities[i].despawn();
        }

        if (entities[i].getName().contains("Resupply Crate") || entities[i].getName().contains("Medkit Box") || entities[i].getName().contains("Utility Cache") || entities[i].getName().contains("Energy Cell Crate") || entities[i].getName().contains("Tactical Resupply Box")) {
            // player.message("Despawning " + entities[i].getName());
            entities[i].despawn();
        }
    }
}

// On death
function died(event) {

    if (OngoingBattle) {
        failCombat();
    }
}

function checkEnergyCell(event) {
    if (OngoingBattle) {
        // If the player finds an Energy Cell Crate

        // get player's nearby entities
        var entities = world.getNearbyEntities(player.getPos(), 5, 0);

        // check if the player has found an Energy Cell Crate
        for (var i = 0; i < entities.length; i++) {
            if (entities[i].getName().contains("Energy Cell Crate")) {
                player.message("You have found an Energy Cell Crate. Guardian-RX will be healed.");
                entities[i].despawn();

                // Regenerate Guardian-RX
                npc.setHealth(npc.getMaxHealth());
            }
        }
    }
}