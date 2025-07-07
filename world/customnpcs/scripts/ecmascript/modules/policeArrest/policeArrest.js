load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_factions.js");
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js");

var API = Java.type('noppes.npcs.api.NpcAPI').Instance()
var arrest_plugin_counter = 0;
var arrest_plugin_max_counter = 10000;
var arrest_plugin_arrested_player_name = "";
var arrest_plugin_spawn_count = 0; // Tracks the total number of NPCs spawned during an arrest

function attempt_arrest(event, player, world) {

    var success = false;
    var criminality = player.getFactionPoints(FACTION_ID_CRIMINAL);

    if (criminality >= 1800 && criminality < 2000) {
        success = spawn_arrest(event, player, world, "police", rrandom_range(2, 3), 10, 5);
    } else if (criminality >= 2000 && criminality < 2500) {
        success = spawn_arrest(event, player, world, "police", rrandom_range(2, 3), 10, 5);
        success = success || spawn_arrest(event, player, world, "police", rrandom_range(2, 3), 10, 5);
    } else if (criminality >= 2500 && criminality < 3000) {
        success = spawn_arrest(event, player, world, "police", rrandom_range(2, 3), 10, 5);
        success = success || spawn_spo_fireteam(event, player, world);
    } else if (criminality >= 3000 && criminality < 4000) {
        success = spawn_spo_fireteam(event, player, world);
        success = success || spawn_spo_squad(event, player, world);
    } else if (criminality >= 4000 && criminality < 5000) {
        success = spawn_spo_fireteam(event, player, world);
        success = success || spawn_spo_squad(event, player, world);
        success = success || spawn_spo_squad(event, player, world);
    } else {
        success = spawn_spo_squad(event, player, world);
        success = success || spawn_spo_squad(event, player, world);
        success = success || spawn_spo_platoon(event, player, world);
    }

    if (success) {
        tallPlayer(player, "&4You have been spotted and arrested by the police or SPO for your criminal activities! You shall perish in the name of the law!");
        logToFile("events", "Player " + player.getName() + " has been arrested by the police or SPO for his criminal activities.");
    }
}

// function to spawn a SPO Fireteam
function spawn_spo_fireteam(event, player, world) {
    // get a random number from 3 to 5
    var count = Math.floor(Math.random() * 3) + 3;
    // 3/4th of the team have shotguns
    var shotgun = Math.floor(count * 0.75);
    // 1/4th of the team have light assault rifles
    var light_assault = Math.floor(count * 0.25);
    // spawn the SPO dog
    spawn_arrest(event, player, world, "dog_spo", 1, 10, 5);
    // spawn the shotgun SPO
    spawn_arrest(event, player, world, "shotgun_spo", shotgun, 10, 5);
    // spawn the light assault SPO
    spawn_arrest(event, player, world, "light_assault_spo", light_assault, 10, 5);
}

//function to spawn a SPO Squad
function spawn_spo_squad(event, player, world) {
    // get a random number from 8 to 12
    var count = Math.floor(Math.random() * 5) + 8;
    // 3/5th of the team have shotguns
    var shotgun = Math.floor(count * 0.6);
    // 2/5th of the team have light assault rifles
    var light_assault = Math.floor(count * 0.4);
    // spawn the SPO dog
    spawn_arrest(event, player, world, "dog_spo", 1, 10, 5);
    // spawn the shotgun SPO
    spawn_arrest(event, player, world, "shotgun_spo", shotgun, 10, 5);
    // spawn the light assault SPO
    spawn_arrest(event, player, world, "light_assault_spo", light_assault, 10, 5);
    // have 1/5 chance to spawn a sniper
    if (Math.random() < 0.2) {
        spawn_arrest(event, player, world, "sniper_spo", 1, 20, 5);
    }
}

// function to spawn a SPO platoon
function spawn_spo_platoon(event, player, world) {
    // get a random number from 16 to 30
    var count = Math.floor(Math.random() * 15) + 16;
    // 3/6th of the team have shotguns
    var shotgun = Math.floor(count * 0.5);
    // 2/6th of the team have light assault rifles
    var light_assault = Math.floor(count * 0.33);
    // 1/6th of the team have sniper rifles
    var sniper = Math.floor(count * 0.17);
    // spawn the 2 to 4 SPO dogs
    spawn_arrest(event, player, world, "dog_spo", Math.floor(Math.random() * 2) + 2, 10, 5);
    // spawn the shotgun SPO
    spawn_arrest(event, player, world, "shotgun_spo", shotgun, 10, 5);
    // spawn the light assault SPO
    spawn_arrest(event, player, world, "light_assault_spo", light_assault, 10, 5);
    // spawn the sniper SPO
    spawn_arrest(event, player, world, "sniper_spo", sniper, 20, 10);
}

function spawn_arrest(event, player, world, type, count, distance_from_player, group_radius) {

    var abandon_counter = 0;
    // get coordinates of the player
    var x = Math.floor(player.getX() + Math.random() * distance_from_player - (distance_from_player / 2));
    var y = player.getY();
    var z = Math.floor(player.getZ() + Math.random() * distance_from_player - (distance_from_player / 2));

    var success = false;

    // spawn the police
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
        //player.message("Spawning the police at " + x + ", " + y + ", " + z);

        if (!world.getBlock(x, y, z).isAir()) {
            switch (type) {
                case "police":
                    spawn_police_NPC(x, y + 1, z, world);
                    break;
                case "dog_spo":
                    spawn_spo_dog_NPC(x, y + 1, z, world);
                    break;
                case "shotgun_spo":
                    spawn_shotgun_spo_NPC(x, y + 1, z, world);
                    break;
                case "light_assault_spo":
                    spawn_light_assault_spo_NPC(x, y + 1, z, world);
                    break;
                case "sniper_spo":
                    spawn_sniper_spo_NPC(x, y + 1, z, world);
                    break;
                default:
                    spawn_police_NPC(x, y + 1, z, world);
                    break;
            }
            success = true;
            arrest_plugin_spawn_count++; // Increment the spawn count for each NPC spawned
        }
    }

    logToFile("events", "Player " + player.getName() + " has been arrested by the police or SPO for his criminal activities. Spawned " + count + " NPCs of type " + type);

    return success;
}

// function to spawn a police officer
function spawn_police_NPC(x, y, z, world) {
    world.spawnClone(x, y, z, 9, "Police Arrest Clone");
}

// function to spawn a SPO dog
function spawn_spo_dog_NPC(x, y, z, world) {
    world.spawnClone(x, y, z, 9, "SPO dog Arrest Clone");
}

// function to spawn a shotgun SPO
function spawn_shotgun_spo_NPC(x, y, z, world) {
    world.spawnClone(x, y, z, 9, "SPO shotgun Arrest Clone");
}

//function to spawn a SPO light-assault
function spawn_light_assault_spo_NPC(x, y, z, world) {
    world.spawnClone(x, y, z, 9, "SPO light-assault Arrest Clone");
}

//function to spawn a SPO sniper
function spawn_sniper_spo_NPC(x, y, z, world) {
    world.spawnClone(x, y, z, 9, "SPO Sniper Arrest Clone");
}

// If player dies, remove the arrest
function died(event) {
    if (arrest_plugin_arrested_player_name == event.player.getDisplayName()) {
        var player = event.player;
        var world = player.world;
        var nearby_gentity_list = world.getNearbyEntities(player.getPos(), 50, 0);
        // event.player.message("Nearby entities: " + nearby_gentity_list.length);
        for (var i = 0; i < nearby_gentity_list.length; i++) {
            var removal_test_entity = nearby_gentity_list[i];
            // event.player.message("Entity: " + removal_test_entity.getName());
            if (removal_test_entity.getName().contains("Arrest Clone")) {
                removal_test_entity.despawn();
            }
        }

        // Tell the player that their arrestation is done
        player.message("&4Your arrest has been completed. You are now free to go.");
        // Remove faction points proportional to the number of NPCs spawned
        var reputation_decrease = -10 * arrest_plugin_spawn_count;
        player.addFactionPoints(FACTION_ID_CRIMINAL, reputation_decrease);
        logToFile("events", "Player " + player.getName() + " has been arrested and died. Removing arrest clones. Reputation decreased by " + reputation_decrease);

        // Reset the spawn count after the arrest is completed
        arrest_plugin_spawn_count = 0;
    }
}

function init(event) {
    // set a random counter based on the current time
    arrest_plugin_counter = Math.floor(Math.random() * arrest_plugin_max_counter);
}

function tick(event) {

    arrest_plugin_counter++;

    if (!isAnyEventActive() && arrest_plugin_counter >= arrest_plugin_max_counter) {
        arrest_plugin_counter = 0;
        var player = event.player
        var world = player.world;
        if (isCriminal(player)) {
            attempt_arrest(event, player, world);
            arrest_plugin_arrested_player_name = player.getDisplayName();
        }
    }
}