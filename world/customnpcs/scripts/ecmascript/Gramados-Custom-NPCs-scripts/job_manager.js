var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

// Define the raw color codes and effects for formatting text
var _RAWCOLORS = {
    '0': 'black',
    '1': 'dark_blue',
    '2': 'dark_green',
    '3': 'dark_aqua',
    '4': 'dark_red',
    '5': 'dark_purple',
    '6': 'gold',
    '7': 'gray',
    '8': 'dark_gray',
    '9': 'blue',
    'a': 'green',
    'b': 'aqua',
    'c': 'red',
    'd': 'light_purple',
    'e': 'yellow',
    'f': 'white',
};
var _RAWEFFECTS = {
    'o': 'italic',
    'l': 'bold',
    'k': 'magic',
    'm': 'strike',
    'n': 'underline',
    'r': 'reset'
}
var _ISLAND = [
    "Gramados",
    "Greenfield",
    "Allenis"
];
var world = API.getIWorld(0);

var data_file_path = "world/customnpcs/scripts/jobs_log.json";

var Job_Active_Gramados_ID = 379;

var job_data;

var tick_counter_max = 1;
var tick_counter = 1;

// Load the stock exchange data when the NPC is initialized
function init(event) {
    world.broadcast("Job Manager initialized for player " + event.player.getName());

    // Load the Job data
    job_data = load_json(data_file_path);

    // If the Job data doesn't exist, create it
    if (!job_data) {
        job_data = {
            "Region_To_ID": {},
            "Regions_To_Quit_ID": {},
            "Starter_Jobs": []
        };
        save_json(job_data, data_file_path);
    }

    update_job_entries(event.player);

    tell_player_job(event.player);

    update_job_perms(event.player);

    // world.broadcast("Job Data: " + JSON.stringify(job_data));
}

//Tick
function tick(event) {
    //world.broadcast("Job Manager ticked!");

    // Check if the Job data is loaded
    if (!job_data) {
        world.broadcast("ERROR: Job data not loaded!");
        return;
    }

    if (tick_counter >= tick_counter_max) {
        tick_counter = 0;

        // Check all jobs
        check_all_jobs(event.player);
        // Quit a job
        quit_job_manager(event.player);
    } else {
        tick_counter++;
    }
}

// Function to create a new Player
function update_job_entries(player) {
    // Get the UUID of the player
    var player_uuid = player.getUUID();

    // If the UUID is not a key in the Job data, create a new entry
    if (!job_data[player_uuid]) {
        job_data[player_uuid] = {
            "Name": player.getName(),
            "JobHistory": {},
            "ActiveJobs": {}
        };

        save_json(job_data, data_file_path);

        world.broadcast("New Job entry created for player " + player.getName());
        // world.broadcast("Job Data: " + JSON.stringify(job_data));
    }
}

//function to check all jobs
function check_all_jobs(player) {
    // Get the UUID of the player
    var player_uuid = player.getUUID();

    // world.broadcast("Checking all jobs for player " + player.getName());

    for (var i = 0; i < job_data["Starter_Jobs"].length; i++) {

        // world.broadcast("Checking job " + job_data["Starter_Jobs"][i]["JobName"]);

        var job_id = job_data["Starter_Jobs"][i]["JobID"];
        var job_name = job_data["Starter_Jobs"][i]["JobName"];
        var job_region = job_data["Starter_Jobs"][i]["Region"];
        var job_region_id = job_data["Region_To_ID"][job_region];

        // Check if the player already had the dialogue of ID job_id
        if (player.hasReadDialog(job_id) && !player.hasReadDialog(job_region_id)) {

            // if this is not already in the player's Active Jobs
            if (!job_data[player_uuid]["ActiveJobs"][job_id]) {

                // Add the job to the player's Active Jobs
                job_data[player_uuid]["ActiveJobs"][job_id] = {
                    "JobID": job_id,
                    "JobName": job_name,
                    "StartTime": world.getTotalTime(),
                    "Region": job_region
                };

                // Make it so the player has read the region dialogue, preventing any more jobs from this region to be added
                // Until he quits the job
                player.addDialog(job_region_id);

                world.broadcast(player.getName() + " has started job \"" + job_name + "\" with ID " + job_id);

                update_job_perms(player);
                // world.broadcast("Job Data: " + JSON.stringify(job_data));
                save_json(job_data, data_file_path);
            }
        }

    }
}

// function to manage a job quit
function quit_job_manager(player) {
    // For all regions in "Regions_To_Quit_ID"
    for (var region in job_data["Regions_To_Quit_ID"]) {
        var region_quit_id = job_data["Regions_To_Quit_ID"][region];
        var region_id = job_data["Region_To_ID"][region];

        // If the player is trying to quit a job
        if (player.hasReadDialog(region_quit_id)) {
            // For all active jobs
            for (var job in job_data[player.getUUID()]["ActiveJobs"]) {
                // If the job is in the region
                if (job_data[player.getUUID()]["ActiveJobs"][job]["Region"] == region) {
                    // If it's been more than 24 hours since the job started
                    if (world.getTotalTime() - job_data[player.getUUID()]["ActiveJobs"][job]["StartTime"] >= 1728000) {
                        
                        // Creat the data for his job history
                        var job_history = {
                            "JobID": job_data[player.getUUID()]["ActiveJobs"][job]["JobID"],
                            "JobName": job_data[player.getUUID()]["ActiveJobs"][job]["JobName"],
                            "StartTime": job_data[player.getUUID()]["ActiveJobs"][job]["StartTime"],
                            "EndTime": world.getTotalTime(),
                            "Region": job_data[player.getUUID()]["ActiveJobs"][job]["Region"]
                        };

                        // Add the job to the player's Job History
                        job_data[player.getUUID()]["JobHistory"][job] = job_history;

                        // Remove the job from the player's Active Jobs
                        player.removeDialog(job_data[player.getUUID()]["ActiveJobs"][job]["JobID"]);
                        delete job_data[player.getUUID()]["ActiveJobs"][job];
                        player.removeDialog(region_id);
                        player.removeDialog(region_quit_id);

                        world.broadcast(player.getName() + " has quit his job in region " + region);
                        // world.broadcast("Job Data: " + JSON.stringify(job_data));
                        save_json(job_data, data_file_path);

                        // remove jobs perms
                        remove_job_perms(player, job_history["JobID"]);
                    } else {
                        player.message("You can't quit a job in less than 24 hours!");
                        player.removeDialog(region_quit_id);
                    }
                }
            }
        }
    }
}

// function to load Job data
function load_json(data_file_path) {
    // Check if the file exists, and create it if it doesn't
    if (!check_file_exists(data_file_path)) {
        world.broadcast("ERROR: Job Data is inexistant!");
        return null;
    } else {
        var ips = new java.io.FileInputStream(data_file_path);
        var fileReader = new java.io.InputStreamReader(ips, "UTF-8");
        var readFile = fileReader.read();
        var data;
        var start = "";
        while (readFile != -1) {
            data = String.fromCharCode(readFile);
            start = start + data;
            readFile = fileReader.read();
        }

        var json_data = JSON.parse(start);

        // world.broadcast("Loaded data: " + JSON.stringify(json_data));

        return json_data;
    }
}

// Function to save Job data
function save_json(data, data_file_path) {
    var fileWriter = new java.io.FileWriter(data_file_path);
    fileWriter.write(JSON.stringify(data, null, 4)); // Pretty-print JSON with 4 spaces
    fileWriter.close();
}

// function to check if a file exists
function check_file_exists(file_path) {
    var file = new java.io.File(file_path);
    return file.exists();
}

// Function to tell a message to teh player only if teh player is called TheOddlySeagull
function tell_player(player, message) {
    if (player.getName() == "TheOddlySeagull") {
        player.message(message);
    }
}

// Function to tell the player what job he currently has
function tell_player_job(player) {
    var player_uuid = player.getUUID();

    if (job_data[player_uuid]["ActiveJobs"]) {
        for (var job in job_data[player_uuid]["ActiveJobs"]) {
            var job_name = job_data[player_uuid]["ActiveJobs"][job]["JobName"];
            var job_region = job_data[player_uuid]["ActiveJobs"][job]["Region"];

            player.message("You have been working as a " + job_name + " in the region " + job_region + " for " + get_time(job_data[player_uuid]["ActiveJobs"][job]["StartTime"], world.getTotalTime()));
        }
    }
}

// Function to tell a timestamp between two times
function get_time(start_time_ticks, end_time_ticks) {
    // 20 ticks = 1 second
    var time_difference = end_time_ticks - start_time_ticks;
    var time_seconds = time_difference / 20;

    var date = new Date(time_seconds * 1000); // Convert seconds to milliseconds

    var years = date.getUTCFullYear() - 1970; // Subtract epoch year
    var months = date.getUTCMonth();
    var days = date.getUTCDate() - 1; // Subtract epoch day
    var hours = date.getUTCHours();
    var minutes = date.getUTCMinutes();
    var seconds = date.getUTCSeconds();

    return years + " years, " + months + " months, " + days + " days, " + hours + " hours, " + minutes + " minutes and " + seconds + " seconds";
}

//function to update job perms
function update_job_perms(player) {
    var player_uuid = player.getUUID();

    for (var job in job_data[player_uuid]["ActiveJobs"]) {
        add_job_perms(player, job_data[player_uuid]["ActiveJobs"][job]["JobID"]);
    }
}

// function to add job related perms
function add_job_perms(player, job_id) {

    // Load world data
    var world_data = world.getStoreddata();

    for (var i = 0; i < job_data["Starter_Jobs"].length; i++) {
        if (job_data["Starter_Jobs"][i]["JobID"] == job_id) {
            if (job_data["Starter_Jobs"][i]["Perms"])
            {
                // world.broadcast("Adding perms for job " + job_data["Starter_Jobs"][i]["JobName"] + " to player " + player.getName());
                for (var j = 0; j < job_data["Starter_Jobs"][i]["Perms"].length; j++) {
                    var perm = job_data["Starter_Jobs"][i]["Perms"][j];
                    
                    // world.broadcast("Adding perm " + perm + " to player " + player.getName());
                    // world.broadcast("Old perm data: " + JSON.stringify(world_data.get(perm)));

                    /* 
                    The line looks like something like this:
                    
                    "permission_regions.gramados_lumberjack": "{\"created\":1581762618862,\"updated\":1724973207287,\"enabled\":true,\"teams\":[\"Owner\",\"Developer\"],\"players\":[\"BOTFerris\",\"Leyx\"],\"jobs\":[],\"meta\":{}}",
                    
                    Add the player to the players array (keeping the text format like the one above)
                    */
                    var perm_data = JSON.parse(world_data.get(perm));

                    // Check if the player is already in the perm data
                    var already_perm = false;
                    for (var k = 0; k < perm_data["players"].length; k++) {
                        if (perm_data["players"][k] == player.getName()) {
                            already_perm = true;
                        }
                    }

                    // Add the player to the perm data if he's not already in it
                    if (!already_perm) {
                        // world.broadcast("Player not in perm data, adding...");
                        perm_data["players"].push(player.getName());
                        world_data.put(perm, JSON.stringify(perm_data));
                    } /*else {
                        world.broadcast("Player already in perm data");
                    }

                    world.broadcast("New perm data: " + JSON.stringify(world_data.get(perm)));*/
                }
            }
        }
    }
}

// function to remove job related perms (when quitting a job)
function remove_job_perms(player, job_id) {
    // Load world data
    var world_data = world.getStoreddata();

    for (var i = 0; i < job_data["Starter_Jobs"].length; i++) {
        if (job_data["Starter_Jobs"][i]["JobID"] == job_id) {
            if (job_data["Starter_Jobs"][i]["Perms"])
            {
                for (var j = 0; j < job_data["Starter_Jobs"][i]["Perms"].length; j++) {
                    var perm = job_data["Starter_Jobs"][i]["Perms"][j];
                    
                    // world.broadcast("Removing perm " + perm + " from player " + player.getName());
                    // world.broadcast("Perm data: " + JSON.stringify(world_data.get(perm)));

                    /* 
                    The line looks like something like this:
                    
                    "permission_regions.gramados_lumberjack": "{\"created\":1581762618862,\"updated\":1724973207287,\"enabled\":true,\"teams\":[\"Owner\",\"Developer\"],\"players\":[\"BOTFerris\",\"Leyx\"],\"jobs\":[],\"meta\":{}}",
                    
                    Remove the player from the players array (keeping the text format like the one above)
                    */
                    var perm_data = JSON.parse(world_data.get(perm));
                    var new_list = [];
                    // loop through all players
                    for (var k = 0; k < perm_data["players"].length; k++) {
                        // if player is not the one to remove
                        if (perm_data["players"][k] != player.getName()) {
                            new_list.push(perm_data["players"][k]);
                        }
                    }
                    // world.broadcast("New list: " + new_list);
                    perm_data["players"] = new_list;
                    world_data.put(perm, JSON.stringify(perm_data));
                    // world.broadcast("Perm data: " + JSON.stringify(world_data.get(perm)));
                }
            }
        }
    }
}
