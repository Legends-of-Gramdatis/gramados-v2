var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var world = API.getIWorld(0);

var data_file_path = "world/customnpcs/scripts/ecmascript/modules/jobs/jobs_log.json";

var job_data;
var tick_counter_max = 1;
var tick_counter = 1;

// Load Job Data on NPC Initialization
function init(event) {
    job_data = load_json(data_file_path);
    if (!job_data) {
        job_data = {"Region_Job_Limits": {}, "Jobs": [] };
        save_json(job_data, data_file_path);
    }
    update_job_entries(event.player);
    check_all_jobs(event.player);
    // tell_player_job(event.player);
    update_job_perms(event.player);
    update_job_type_json(event.player);
}

// Tick Function
function tick(event) {
    if (!job_data) {
        world.broadcast("ERROR: Job data not loaded!");
        return;
    }

    if (tick_counter >= tick_counter_max) {
        tick_counter = 0;
        check_all_jobs(event.player);
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

        player.message("Welcome to the Gramados Server! You have been registered as a new player! Get a job to start earning money!");
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

// Count Active Jobs by Type in a Region
function count_jobs_by_type_in_region(player_uuid, region, job_type) {
    var count = 0;
    for (var job in job_data[player_uuid]["ActiveJobs"]) {
        if (job_data[player_uuid]["ActiveJobs"][job]["Region"] === region &&
            job_data[player_uuid]["ActiveJobs"][job]["Type"] === job_type) {
            count++;
        }
    }
    return count;
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

    for (var i = 0; i < job_data["Jobs"].length; i++) {
        if (job_data["Jobs"][i]["JobID"] == job_id) {
            if (job_data["Jobs"][i]["Perms"]) {
                // world.broadcast("Adding perms for job " + job_data["Jobs"][i]["JobName"] + " to player " + player.getName());
                for (var j = 0; j < job_data["Jobs"][i]["Perms"].length; j++) {
                    var perm = job_data["Jobs"][i]["Perms"][j];

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

    for (var i = 0; i < job_data["Jobs"].length; i++) {
        if (job_data["Jobs"][i]["JobID"] == job_id) {
            if (job_data["Jobs"][i]["Perms"]) {
                for (var j = 0; j < job_data["Jobs"][i]["Perms"].length; j++) {
                    var perm = job_data["Jobs"][i]["Perms"][j];

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
                    perm_data["players"] = new_list;
                    world_data.put(perm, JSON.stringify(perm_data));
                }
            }
        }
    }
}


// Check All Jobs
function check_all_jobs(player) {
    var player_uuid = player.getUUID();

    for (var i = 0; i < job_data["Jobs"].length; i++) {

        // Check if the job is already active
        if (!job_data[player_uuid]["ActiveJobs"][job_data["Jobs"][i]["JobID"]]) {

            var job = job_data["Jobs"][i];
            var job_id = job["JobID"];
            var job_name = job["JobName"];
            var job_region = job["Region"];
            var job_type = job["Type"];

            var job_limit = job_data["Region_Job_Limits"][job_region] ? job_data["Region_Job_Limits"][job_region][job_type] : 1;

            if (player.hasReadDialog(job_id)) {
                if (!job_data[player_uuid]["ActiveJobs"][job_id] &&
                    count_jobs_by_type_in_region(player_uuid, job_region, job_type) < job_limit) {

                    job_data[player_uuid]["ActiveJobs"][job_id] = {
                        "JobID": job_id,
                        "JobName": job_name,
                        "StartTime": world.getTotalTime(),
                        "Region": job_region,
                        "Type": job_type
                    };

                    world.broadcast(player.getName() + " has started job \"" + job_name + "\" in " + job_region);
                    update_job_perms(player);
                    save_json(job_data, data_file_path);
                } else {
                    player.message("You have reached the limit for " + job_type + " jobs in " + job_region + "! You cannot join " + job_name + " as you already have " + get_jobs_by_type_in_region(player_uuid, job_region, job_type));
                    player.removeDialog(job_id);
                }
            }
        }
    }
}

// Quit Job Manager
function quit_job_manager(player) {
    var player_uuid = player.getUUID();

    for (var i = 0; i < job_data["Jobs"].length; i++) {
        var job = job_data["Jobs"][i];

        if (job["JobQuit"] && player.hasReadDialog(job["JobQuit"])) {
            var job_id = job["JobID"];

            // Check if the player actually has this job
            if (!job_data[player_uuid]["ActiveJobs"][job_id]) {
                player.message("ERROR: You cannot quit a job you don't have!");
                player.removeDialog(job["JobQuit"]); // Remove the quit dialogue
                continue;
            }

            var active_job = job_data[player_uuid]["ActiveJobs"][job_id];

            // Ensure player has worked the job for at least 24 in-game hours (20 ticks per second)
            var min_work_time = 20 * 60 * 60 * 24; // 24 real-time hours in ticks
            if (world.getTotalTime() - active_job["StartTime"] < min_work_time) {
                player.message("You need to work at least 24 hours before quitting this job!");
                player.removeDialog(job["JobQuit"]); // Remove the quit dialogue
                continue;
            }

            // Move job to history
            var job_history = {
                "JobID": active_job["JobID"],
                "JobName": active_job["JobName"],
                "StartTime": active_job["StartTime"],
                "EndTime": world.getTotalTime(),
                "Region": active_job["Region"]
            };
            job_data[player_uuid]["JobHistory"][job_id] = job_history;

            // Remove job from active jobs
            delete job_data[player_uuid]["ActiveJobs"][job_id];

            // Remove job-related dialogs
            player.removeDialog(job["JobQuit"]);
            player.removeDialog(job["JobID"]);

            // Remove permissions
            remove_job_perms(player, job_id);

            // Broadcast quit message
            world.broadcast(player.getName() + " has quit their job as " + job["JobName"] + " in " + job["Region"]);

            // Save changes
            save_json(job_data, data_file_path);
        }
    }
}

// Load JSON
function load_json(data_file_path) {
    if (!check_file_exists(data_file_path)) {
        world.broadcast("ERROR: Job Data is nonexistent!");
        return null;
    } else {
        var ips = new java.io.FileInputStream(data_file_path);
        var fileReader = new java.io.InputStreamReader(ips, "UTF-8");
        var start = "";
        var readFile = fileReader.read();
        while (readFile != -1) {
            start += String.fromCharCode(readFile);
            readFile = fileReader.read();
        }
        return JSON.parse(start);
    }
}

// Save JSON
function save_json(data, data_file_path) {
    var fileWriter = new java.io.FileWriter(data_file_path);
    fileWriter.write(JSON.stringify(data, null, 4));
    fileWriter.close();
}

// Check if File Exists
function check_file_exists(file_path) {
    return new java.io.File(file_path).exists();
}

// Returns the list of jobs you currently have in a given region with the given type
function get_jobs_by_type_in_region(player_uuid, region, job_type) {
    var jobs = [];
    for (var job in job_data[player_uuid]["ActiveJobs"]) {
        if (job_data[player_uuid]["ActiveJobs"][job]["Region"] === region &&
            job_data[player_uuid]["ActiveJobs"][job]["Type"] === job_type) {
            jobs.push(job_data[player_uuid]["ActiveJobs"][job]["JobName"]);
        }
    }
    // make a string out of the array
    jobs = jobs.join(", ");
    return jobs;
}

// Function to update the player's job type json if necessary as this is a new feature and not all players have it
function update_job_type_json(player) {
    var player_uuid = player.getUUID();

    var updated = false;

    // Check all active and history jobs
    for (var job in job_data[player_uuid]["ActiveJobs"]) {
        if (!job_data[player_uuid]["ActiveJobs"][job]["Type"]) {
            for (var i = 0; i < job_data["Jobs"].length; i++) {
                if (job_data["Jobs"][i]["JobID"] == job) {
                    job_data[player_uuid]["ActiveJobs"][job]["Type"] = job_data["Jobs"][i]["Type"];
                    world.broadcast("Updated job type for player " + player.getName() + " to " + job_data["Jobs"][i]["Type"]);
                    updated = true;
                }
            }
        }
    }

    for (var job in job_data[player_uuid]["JobHistory"]) {
        if (!job_data[player_uuid]["JobHistory"][job]["Type"]) {
            for (var i = 0; i < job_data["Jobs"].length; i++) {
                if (job_data["Jobs"][i]["JobID"] == job) {
                    job_data[player_uuid]["JobHistory"][job]["Type"] = job_data["Jobs"][i]["Type"];
                    world.broadcast("Updated job type for player " + player.getName() + " to " + job_data["Jobs"][i]["Type"]);
                    updated = true;
                }
            }
        }
    }

    if (updated) {
        save_json(job_data, data_file_path);
    }
}