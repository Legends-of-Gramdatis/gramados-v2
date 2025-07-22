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
var can_be_arrested = false;
var is_under_arrest = false; // Tracks if the player is currently under arrest
var damage_buffer = 0; // Tracks the total number of NPCs spawned during an arrest
var damage_taken = 0;

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
        tellPlayer(player, "&4You have been spotted and arrested by the police or SPO for your criminal activities! You shall perish in the name of the law!");
        logToFile("events", "Player " + player.getName() + " has been arrested by the police or SPO for his criminal activities.");
        is_under_arrest = true;
        can_be_arrested = false;
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
        }
    }

    damage_buffer += count * 10; // Increase the damage buffer for each NPC spawned
    logToFile("events", "Player " + player.getName() + " has been arrested by the police or SPO for his criminal activities. Spawned " + count + " NPCs of type " + type + ", buffering " + damage_buffer + " damage.");
    

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

function damaged(event) {
    if (is_under_arrest) {
        var player = event.player;
        if (damage_buffer > 0) {
            player.addFactionPoints(FACTION_ID_CRIMINAL, -1);
            damage_buffer--;
            damage_taken++;
        }
    }
}

// If player dies, remove the arrest
function died(event) {
    if (is_under_arrest) {
        var player = event.player;
        var world = player.world;
        var nearby_gentity_list = world.getNearbyEntities(player.getPos(), 50, 0);
        for (var i = 0; i < nearby_gentity_list.length; i++) {
            var removal_test_entity = nearby_gentity_list[i];
            if (removal_test_entity.getName().contains("Arrest Clone")) {
                removal_test_entity.despawn();
            }
        }
        
        logToFile("events", "Player " + player.getName() + " has been arrested and died. Removing arrest clones. Reputation decreased by " + damage_taken + " during the arrest. Buffer left: " + damage_buffer + ".");

        // Reset the spawn count after the arrest is completed
        // damage_buffer = 0;
        damage_taken = 0;
    }

    is_under_arrest = false; // Reset the arrest status when the player dies
    can_be_arrested = false; // Allow future arrests
}

function tick(event) {

    if (can_be_arrested) {
        arrest_plugin_counter++;
        if (arrest_plugin_counter >= arrest_plugin_max_counter) {
            arrest_plugin_counter = 0;
            var cur_player = event.player
            var world = cur_player.world;
            attempt_arrest(event, cur_player, world);
        }
    }
    else if (!isAnyEventActive() && isCriminal(event.player) && !is_under_arrest) {
        can_be_arrested = true;
        arrest_plugin_counter = Math.floor(Math.random() * arrest_plugin_max_counter);
    }

    if (is_under_arrest) {
        // If no arrest clones are present, reset the arrest status
        var world = event.player.world;
        var nearby_gentity_list = world.getNearbyEntities(event.player.getPos(), 50, 0);
        var arrest_clone_present = false;
        for (var i = 0; i < nearby_gentity_list.length; i++) {
            var entity = nearby_gentity_list[i];
            if (entity.getName().contains("Arrest Clone")) {
                arrest_clone_present = true;
                break;
            }
        }
        if (!arrest_clone_present) {
            is_under_arrest = false; // Reset the arrest status if no clones are present
            can_be_arrested = false; // Allow future arrests
            tellPlayer(event.player, "&eYou have escaped from arrest! You can now commit crimes again.");
            // despawn all arrest clones
            nearby_gentity_list = world.getNearbyEntities(event.player.getPos(), 100, 0);
            for (var i = 0; i < nearby_gentity_list.length; i++) {
                var removal_test_entity = nearby_gentity_list[i];
                if (removal_test_entity.getName().contains("Arrest Clone")) {
                    removal_test_entity.despawn();
                }
            }
            logToFile("events", "Player " + event.player.getName() + " has escaped from arrest. All arrest clones have been despawned.");
        }
    }
}