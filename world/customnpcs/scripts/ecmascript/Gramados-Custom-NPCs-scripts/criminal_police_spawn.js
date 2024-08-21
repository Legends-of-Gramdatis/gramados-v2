//Spawn an enemy at a chance when the NPC is hit (the further the int in line 8 (currently 0.8) is from 100, the higher the chance)

var API = Java.type('noppes.npcs.api.NpcAPI').Instance()

var counter = 0;
var max_counter = 1000;

function tick(event) {

    counter++;

    if (counter >= max_counter) {
        counter = 0;
        isFriendOfCriminals(event);
    }
}

// function to check if the player is a friend of the Criminals
function isFriendOfCriminals(event) {
    var player = event.player
    var world = player.world;
    // check if the player is friendly to Criminal
    if (player.getFactionPoints(6) > 1800)
    {
        attempt_arrrest(event, player, world);
    }
}

function attempt_arrrest(event, player, world) {
    //var name = player.getDisplayName();
    setup_police_arrest(event, player, world);

    // switch between the different types of arrest
    // if criminality is between 1800 and 2000, spawn a police arrest
    // if criminality is between 2000 and 2500, spawn 2 police arrests
    // if criminality is between 2500 and 3000, spawn a police arrest and a SPO arrest
    // if criminality is between 3000 and 4000, spawn 2 SPO arrests
    // if criminality is between 4000 and 5000, spawn 4 SPO arrests
    // if criminality is between 5000 and 6000, spawn 8 SPO arrests
}

function setup_police_arrest(event, player, world) {

    var abandon = false;
    var abandon_counter = 0;
    // get coordinates of the player
    var x = player.getX();
    var y = player.getY();
    var z = player.getZ();

    // get a random number between 1 and 4
    var police_count = Math.floor(Math.random() * 4) + 1;

    // spawn the police
    for (var i = 0; i < police_count; i++) {
        // Chage the coordinates to a random value, in 5 blocks radius
        x = x + Math.floor(Math.random() * 10) - 5;
        y += 2;
        z = z + Math.floor(Math.random() * 10) - 5;

        // floor the coordinates to the nearest block
        x = Math.floor(x);
        y = Math.floor(y);
        z = Math.floor(z);


        // fine an available y coordinate
        while (world.getBlock(x, y, z).isAir() && abandon_counter < 10) {
            y--;
            abandon_counter++;
        }
        //player.message("Spawning the police at " + x + ", " + y + ", " + z);

        if (!world.getBlock(x, y, z).isAir()) {
            world.spawnClone(x, y + 1, z, 9, "Police Arrest Clone");
            player.message("You are a friend of the Criminals. You are under arrest!");
        }
        /*else{
            player.message("Could not find a suitable location to spawn the police. Abandoning the arrest.");
        }*/
    }   
}