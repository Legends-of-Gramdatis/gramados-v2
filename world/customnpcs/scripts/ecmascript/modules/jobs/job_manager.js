var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var world = API.getIWorld(0);

var data_file_path = "world/customnpcs/scripts/ecmascript/modules/jobs/jobs_log.json";

var job_data;
var tick_counter_max = 10;
var tick_counter = 1;

load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");

/**
 * Initializes the job data and updates player job entries.
 * @param {Object} event - The event object containing player information.
 */
function init(event) {
    job_data = loadJson(data_file_path);
    if (!job_data) {
        job_data = {"Region_Job_Limits": {}, "Jobs": [] };
        saveJson(job_data, data_file_path);
    }
    update_job_entries(event.player);
    check_all_jobs(event.player);
    auto_assign_jobs(event.player); // Added this line
    update_job_perms(event.player);
    update_job_type_json(event.player);
    remove_jobs_on_permission_loss(event.player);

    if (!event.player.getTimers().has(1)) {
        event.player.getTimers().start(1, 20*60*60*24, true);
    }
}

/**
 * Handles periodic job checks and updates.
 * @param {Object} event - The event object containing player information.
 */
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

function timer(event) {
    var salary = getAutopayAmountTotal(event.player);
    if (salary > 0) {
        addMoneyToCurrentPlayerPouch(event.player, salary);
        tellPlayer(event.player, "&a:check: You have received your daily salary of " + getAmountCoin(salary) + "!");
        logToFile("economy", event.player.getName() + " received daily salary of " + getAmountCoin(salary) + ".");
    }
}

/**
 * Creates a new player entry in the job data if it doesn't exist.
 * @param {Object} player - The player object.
 */
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

        saveJson(job_data, data_file_path);

        player.message("Welcome to the Gramados Server! You have been registered as a new player! Get a job to start earning money!");
    }
}

/**
 * Sends a message to the player about their current job.
 * @param {Object} player - The player object.
 */
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

/**
 * Calculates the time difference between two timestamps.
 * @param {number} start_time_ticks - The start time in ticks.
 * @param {number} end_time_ticks - The end time in ticks.
 * @returns {string} - The formatted time difference.
 */
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

/**
 * Counts the number of active jobs of a specific type in a region.
 * @param {string} player_uuid - The UUID of the player.
 * @param {string} region - The region name.
 * @param {string} job_type - The type of job.
 * @returns {number} - The count of active jobs.
 */
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

/**
 * Updates the job-related permissions for a player.
 * @param {Object} player - The player object.
 */
function update_job_perms(player) {
    var player_uuid = player.getUUID();

    for (var job in job_data[player_uuid]["ActiveJobs"]) {
        add_job_perms(player, job_data[player_uuid]["ActiveJobs"][job]["JobID"]);
    }
}

/**
 * Adds job-related permissions to a player.
 * @param {Object} player - The player object.
 * @param {number} job_id - The ID of the job.
 */
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

/**
 * Removes job-related permissions from a player.
 * @param {Object} player - The player object.
 * @param {number} job_id - The ID of the job.
 */
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

/**
 * Automatically assigns jobs to a player based on region ownership.
 * @param {Object} player - The player object.
 */
function auto_assign_jobs(player) {
    var player_uuid = player.getUUID();
    var world_data = world.getStoreddata();

    for (var i = 0; i < job_data["Jobs"].length; i++) {
        var job = job_data["Jobs"][i];

        if (job["AutoAssignPerms"] && Array.isArray(job["AutoAssignPerms"])) {
            for (var j = 0; j < job["AutoAssignPerms"].length; j++) {
                var region = job["AutoAssignPerms"][j];
                var region_data = JSON.parse(world_data.get(region));

                if (region_data && region_data["owner"] === player.getName()) {
                    if (!job_data[player_uuid]["ActiveJobs"][job["JobID"]]) {
                        job_data[player_uuid]["ActiveJobs"][job["JobID"]] = {
                            "JobID": job["JobID"],
                            "JobName": job["JobName"],
                            "StartTime": world.getTotalTime(),
                            "Region": job["Region"],
                            "Type": job["Type"]
                        };

                        world.broadcast(player.getName() + " has been automatically assigned the job \"" + job["JobName"] + "\" in " + job["Region"]);
                        player.message("You have been granted the job \"" + job["JobName"] + "\" in " + job["Region"] + " because you own the region \"" + region + "\".");
                        update_job_perms(player);
                        saveJson(job_data, data_file_path);
                    }
                }
            }
        }
    }
}

/**
 * Checks and assigns jobs to a player based on various conditions.
 * @param {Object} player - The player object.
 */
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
                    saveJson(job_data, data_file_path);
                } else {
                    player.message("You have reached the limit for " + job_type + " jobs in " + job_region + "! You cannot join " + job_name + " as you already have " + get_jobs_by_type_in_region(player_uuid, job_region, job_type));
                    player.removeDialog(job_id);
                }
            }
        }
    }
}

/**
 * Manages the process of quitting jobs for a player.
 * @param {Object} player - The player object.
 */
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
            saveJson(job_data, data_file_path);
        }
    }
}

/**
 * Retrieves the list of jobs a player has in a specific region and type.
 * @param {string} player_uuid - The UUID of the player.
 * @param {string} region - The region name.
 * @param {string} job_type - The type of job.
 * @returns {string} - A comma-separated list of job names.
 */
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

/**
 * Updates the job type JSON for a player if necessary.
 * @param {Object} player - The player object.
 */
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
        saveJson(job_data, data_file_path);
    }
}

/**
 * Removes jobs from a player if they lose the required region ownership.
 * @param {Object} player - The player object.
 */
function remove_jobs_on_permission_loss(player) {
    var player_uuid = player.getUUID();
    var world_data = world.getStoreddata();

    if (!Array.isArray(job_data["Jobs"])) {
        world.broadcast("ERROR: job_data['Jobs'] is not an array or is undefined.");
        return;
    }

    for (var job_id in job_data[player_uuid]["ActiveJobs"]) {
        var active_job = job_data[player_uuid]["ActiveJobs"][job_id];
        var job = null;

        // Use a normal for loop to find the job
        for (var i = 0; i < job_data["Jobs"].length; i++) {
            if (job_data["Jobs"][i]["JobID"] == job_id) {
                job = job_data["Jobs"][i];
                break;
            }
        }

        if (job && job["AutoAssignPerms"] && Array.isArray(job["AutoAssignPerms"])) {
            var owns_region = false;

            for (var j = 0; j < job["AutoAssignPerms"].length; j++) {
                var region = job["AutoAssignPerms"][j];
                var region_data = JSON.parse(world_data.get(region));

                if (region_data && region_data["owner"] === player.getName()) {
                    owns_region = true;
                    break;
                }
            }

            if (!owns_region) {
                // Remove the job
                delete job_data[player_uuid]["ActiveJobs"][job_id];
                remove_job_perms(player, job_id);
                // remove dialogs
                player.removeDialog(job["JobID"]);
                if (job["JobQuit"]) {
                    player.removeDialog(job["JobQuit"]);
                }
                world.broadcast(player.getName() + " has lost the job \"" + active_job["JobName"] + "\" in " + active_job["Region"] + " due to losing ownership of the required region.");
                saveJson(job_data, data_file_path);
            }
        }
    }
}
