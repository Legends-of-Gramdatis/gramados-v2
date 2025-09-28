var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var world = API.getIWorld(0);

// Paths split between static config and dynamic player data
var config_file_path = "world/customnpcs/scripts/ecmascript/modules/jobs/config.json";
var data_file_path = "world/customnpcs/scripts/data_auto/jobs.json";

// Static config (Regions, Jobs, Tags) and dynamic per-player data
var job_config;
var job_data;
var tick_counter_max = 10;
var tick_counter = 1;

load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");

/**
 * Initializes the job data and updates player job entries.
 * @param {Object} event - The event object containing player information.
 */
function init(event) {
    // Load static config
    job_config = loadJson(config_file_path);
    if (!job_config) {
        // Fallback defaults if config is missing
        job_config = { "Region_Job_Limits": {}, "Jobs": [], "Tags": {} };
    }

    // Load dynamic data (per-player state)
    job_data = loadJson(data_file_path);
    if (!job_data) {
        job_data = {}; // dynamic file holds only player entries
        saveJson(job_data, data_file_path);
    }
    update_job_entries(event.player);

    // First handle removals/sanitization at login
    remove_jobs_on_permission_loss(event.player);   // remove jobs if region ownership/perms lost
    process_tag_quits(event.player);                // handle any tag-level quit tokens
    quit_job_manager(event.player);                 // handle any per-job quit tokens

    // Then handle grants based on dialogs/auto rules
    check_job_triggers(event.player);               // grant jobs via dialog or region triggers

    // Recompute perms/tags for final active job set
    update_job_perms(event.player);
    ensure_tag_joins_for_active_jobs(event.player);
    // Backfill/add join and clean lock/quit for all active jobs at login
    try {
        var uuid_bf = event.player.getUUID();
        for (var jid in job_data[uuid_bf]["ActiveJobs"]) {
            // find job definition
            var jd = null;
            for (var i_bf = 0; i_bf < job_config["Jobs"].length; i_bf++) {
                if (job_config["Jobs"][i_bf]["JobID"] == jid) { jd = job_config["Jobs"][i_bf]; break; }
            }
            if (jd) {
                ensureJobAndTagDialogsOnGrant(event.player, jd);
                cleanupLockQuitForJobAndTags(event.player, jd);
            }
        }
    } catch (e) { /* no-op */ }
    update_job_type_json(event.player);

    if (!event.player.getTimers().has(1)) {
        event.player.getTimers().start(1, 20 * 60 * 60 * 24, true);
    }
}

/**
 * Handles periodic job checks and updates.
 * @param {Object} event - The event object containing player information.
 */
function tick(event) {
    if (!job_data) {
        tellPlayer(event.player, "&cERROR: Job data not loaded!");
        return;
    }

    if (tick_counter >= tick_counter_max) {
        tick_counter = 0;
        check_job_triggers(event.player);
        quit_job_manager(event.player);
        process_tag_quits(event.player);
    } else {
        tick_counter++;
    }
}

/**
 * Ensures that for all currently active jobs, the player also has the TagID dialogs for their tags.
 */
function ensure_tag_joins_for_active_jobs(player) {
    var uuid = player.getUUID();
    for (var job_id in job_data[uuid]["ActiveJobs"]) {
        // find job def
        var jdef = null;
        for (var i = 0; i < job_config["Jobs"].length; i++) {
            if (job_config["Jobs"][i]["JobID"] == job_id) { jdef = job_config["Jobs"][i]; break; }
        }
        if (jdef) {
            grant_tag_joins_for_job(player, jdef);
        }
    }
}

function timer(event) {
    var salary = getAutopayAmountTotal(event.player);
    if (salary > 0) {
        addMoneyToCurrentPlayerPouch(event.player, salary);
        tellPlayer(event.player, "&a:check_mark: You have received your daily salary of " + getAmountCoin(salary) + "!");
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

        tellPlayer(player, "&a:check_mark: Welcome to &bGramados&f! &7You're registered. &aGet a job to start earning money!");
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

            tellPlayer(player, "&aYou have been working as &b" + job_name + " &7in &e" + job_region + " &7for &f" + get_time(job_data[player_uuid]["ActiveJobs"][job]["StartTime"], world.getTotalTime()));
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

    for (var i = 0; i < job_config["Jobs"].length; i++) {
        if (job_config["Jobs"][i]["JobID"] == job_id) {
            if (job_config["Jobs"][i]["Perms"]) {
                for (var j = 0; j < job_config["Jobs"][i]["Perms"].length; j++) {
                    var perm = job_config["Jobs"][i]["Perms"][j];

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
                        perm_data["players"].push(player.getName());
                        world_data.put(perm, JSON.stringify(perm_data));
                    }
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

    for (var i = 0; i < job_config["Jobs"].length; i++) {
        if (job_config["Jobs"][i]["JobID"] == job_id) {
            if (job_config["Jobs"][i]["Perms"]) {
                for (var j = 0; j < job_config["Jobs"][i]["Perms"].length; j++) {
                    var perm = job_config["Jobs"][i]["Perms"][j];

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
function check_region_triggers(player) {
    var player_uuid = player.getUUID();
    var world_data = world.getStoreddata();

    // Also ensure removals if player lost ownership of required regions
    // This keeps region-trigger logic symmetric: it both grants and revokes.
    remove_jobs_on_permission_loss(player);

    for (var i = 0; i < job_config["Jobs"].length; i++) {
        var job = job_config["Jobs"][i];

        if (job["AutoAssignPerms"] && Array.isArray(job["AutoAssignPerms"])) {
            for (var j = 0; j < job["AutoAssignPerms"].length; j++) {
                var region = job["AutoAssignPerms"][j];
                // ensure region starts with region_
                if (!region.startsWith("region_")) {
                    region = "region_" + region;
                }
                var region_data = JSON.parse(world_data.get(region));

                if (region_data && region_data["owner"] === player.getName()) {
                    // Use unified add flow (checks limits, perms, tags)
                    if (!job_data[player_uuid]["ActiveJobs"][job["JobID"]]) {
                        add_job_to_player(player, job, /*source*/"auto-region");
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
function check_dialog_triggers(player) {
    var player_uuid = player.getUUID();

    // Also process any per-job quit tokens here so dialog-trigger loop handles removals too
    // This keeps dialog-trigger logic symmetric: it both grants (join) and revokes (quit).
    quit_job_manager(player);

    for (var i = 0; i < job_config["Jobs"].length; i++) {

        // tellPlayer(player, "&8[DEBUG] Checking job: " + job_config["Jobs"][i]["JobName"] + " (ID: " + job_config["Jobs"][i]["JobID"] + ")");

        // Check if the job is already active
        if (!job_data[player_uuid]["ActiveJobs"][job_config["Jobs"][i]["JobID"]]) {

            // tellPlayer(player, "&8[DEBUG] You do NOT have the job: " + job_config["Jobs"][i]["JobName"] + " (ID: " + job_config["Jobs"][i]["JobID"] + ")");

            var job = job_config["Jobs"][i];
            var job_id = job["JobID"];
            var job_name = job["JobName"];
            var job_region = job["Region"];
            var job_type = job["Type"];

            var job_limit = job_config["Region_Job_Limits"][job_region] ? job_config["Region_Job_Limits"][job_region][job_type] : 1;

            if (player.hasReadDialog(job_id)) {
                // tellPlayer(player, "&8[DEBUG] You have read the join dialog for job: " + job_name + " (ID: " + job_id + ")");
                if (!job_data[player_uuid]["ActiveJobs"][job_id] &&
                    count_jobs_by_type_in_region(player_uuid, job_region, job_type) < job_limit) {
                    // Unified add flow (perms, tags, save)
                    add_job_to_player(player, job, /*source*/"dialog-join");
                } else {
                    tellPlayer(player, "&c:cross_mark: Limit reached for &e" + job_type + " &7jobs in &e" + job_region + "&7. Can't join &b" + job_name + "&7 as you already have &f" + get_jobs_by_type_in_region(player_uuid, job_region, job_type));
                    player.removeDialog(job_id);
                }
            }
        }
    }
}

/**
 * Aggregates all job join triggers (dialogs and region purchases).
 * @param {Object} player - The player object.
 */
function check_job_triggers(player) {
    // Dialog-based join tokens
    check_dialog_triggers(player);
    // Region ownership-based auto joins
    check_region_triggers(player);
}

/**
 * Manages the process of quitting jobs for a player.
 * @param {Object} player - The player object.
 */
function quit_job_manager(player) {
    var player_uuid = player.getUUID();

    for (var i = 0; i < job_config["Jobs"].length; i++) {
        var job = job_config["Jobs"][i];

        if (job["JobQuit"] && player.hasReadDialog(job["JobQuit"])) {
            var job_id = job["JobID"];

            // Check if the player actually has this job
            if (!job_data[player_uuid]["ActiveJobs"][job_id]) {
                tellPlayer(player, "&c:cross_mark: You cannot quit a job you don't have!");
                player.removeDialog(job["JobQuit"]); // Remove the quit dialogue
                continue;
            }

            var active_job = job_data[player_uuid]["ActiveJobs"][job_id];

            // Ensure player has worked the job for at least 24 in-game hours (20 ticks per second)
            var min_work_time = 20 * 60 * 60 * 24; // 24 real-time hours in ticks
            if (world.getTotalTime() - active_job["StartTime"] < min_work_time) {
                tellPlayer(player, "&e:hourglass: You need to work at least &61 day &e(24h) before quitting this job!");
                player.removeDialog(job["JobQuit"]); // Remove the quit dialogue
                continue;
            }
            // Unified removal/archive flow
            player.removeDialog(job["JobQuit"]); // clear the quit token now
            archive_and_remove_job(player, job_id, job, "player-quit");
            tellPlayer(player, "&e:door: You have successfully quit your job as &b" + job["JobName"] + " &ein &e" + job["Region"] + "&e. You can rejoin it later if you wish.");
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
            for (var i = 0; i < job_config["Jobs"].length; i++) {
                if (job_config["Jobs"][i]["JobID"] == job) {
                    job_data[player_uuid]["ActiveJobs"][job]["Type"] = job_config["Jobs"][i]["Type"];
                    tellPlayer(player, "&e:information_source: Updated job type for your job &b" + job_data[player_uuid]["ActiveJobs"][job]["JobName"] + " &eto " + job_config["Jobs"][i]["Type"] + ".");
                    updated = true;
                }
            }
        }
    }

    for (var job in job_data[player_uuid]["JobHistory"]) {
        if (!job_data[player_uuid]["JobHistory"][job]["Type"]) {
            for (var i = 0; i < job_config["Jobs"].length; i++) {
                if (job_config["Jobs"][i]["JobID"] == job) {
                    job_data[player_uuid]["JobHistory"][job]["Type"] = job_config["Jobs"][i]["Type"];
                    tellPlayer(player, "&e:information_source: Updated job type for your past job &b" + job_data[player_uuid]["JobHistory"][job]["JobName"] + " &eto " + job_config["Jobs"][i]["Type"] + ".");
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

    if (!Array.isArray(job_config["Jobs"])) {
        tellPlayer(player, "&cERROR: Job configuration is invalid!");
        return;
    }

    for (var job_id in job_data[player_uuid]["ActiveJobs"]) {
        var active_job = job_data[player_uuid]["ActiveJobs"][job_id];
        var job = null;

        // Use a normal for loop to find the job
        for (var i = 0; i < job_config["Jobs"].length; i++) {
            if (job_config["Jobs"][i]["JobID"] == job_id) {
                job = job_config["Jobs"][i];
                break;
            }
        }

        if (job && job["AutoAssignPerms"] && Array.isArray(job["AutoAssignPerms"])) {
            var owns_region = false;

            for (var j = 0; j < job["AutoAssignPerms"].length; j++) {
                var region = job["AutoAssignPerms"][j];
                // ensure region starts with region_
                if (!region.startsWith("region_")) {
                    region = "region_" + region;
                }
                var region_data = JSON.parse(world_data.get(region));

                if (region_data && region_data["owner"] === player.getName()) {
                    owns_region = true;
                    break;
                }
            }

            if (!owns_region) {
                archive_and_remove_job(player, job_id, job, "perm-loss:region-ownership");
                tellPlayer(player, "&c:cross_mark: You have lost your job as &b" + active_job["JobName"] + " &cin &e" + active_job["Region"] + "&c because you no longer own the required region.");
            }
        }
    }
}

// ===================== Shared Helpers (add/remove, tags, history) =====================

/**
 * Get the allowed limit for a job type in a region.
 */
function get_region_type_limit(region, type) {
    var limits = (job_config && job_config["Region_Job_Limits"]) ? job_config["Region_Job_Limits"][region] : null;
    if (!limits) return 1;
    if (typeof limits[type] === "number") return limits[type];
    return 1;
}

/**
 * Check whether the player can add a job of this type in this region per limits.
 */
function can_add_job(player_uuid, job) {
    var limit = get_region_type_limit(job["Region"], job["Type"]);
    var current = count_jobs_by_type_in_region(player_uuid, job["Region"], job["Type"]);
    return current < limit;
}

/**
 * Grant tag join dialogs for a job to the player (TagID per tag name).
 */
function grant_tag_joins_for_job(player, job) {
    try {
        var tags = job["Tags"] || job["Types"] || [];
        if (!Array.isArray(tags) || tags.length === 0) return;
        var tagDefs = (job_config && job_config["Tags"]) ? job_config["Tags"] : {};
        for (var i = 0; i < tags.length; i++) {
            var tname = tags[i];
            var t = tagDefs[tname];
            if (t && t["TagID"]) {
                // Only add if not present already
                if (!player.hasReadDialog(t["TagID"])) {
                    if (typeof player.addDialog === 'function') {
                        player.addDialog(t["TagID"]);
                    }
                }
            }
        }
    } catch (e) {
        // swallow; tag grant is best-effort
    }
}

/**
 * Adds a job to the player's active list honoring limits; updates perms, saves, and grants tag dialogs.
 * Returns true if job was added; false otherwise.
 */
function add_job_to_player(player, job, source) {
    var uuid = player.getUUID();
    var id = job["JobID"];
    if (job_data[uuid]["ActiveJobs"][id]) return false; // already has
    if (!can_add_job(uuid, job)) return false; // over limit

    job_data[uuid]["ActiveJobs"][id] = {
        "JobID": id,
        "JobName": job["JobName"],
        "StartTime": world.getTotalTime(),
        "Region": job["Region"],
        "Type": job["Type"]
    };

    update_job_perms(player);
    // Centralized: ensure job and tag join dialogs are granted, and lock/quit cleared
    ensureJobAndTagDialogsOnGrant(player, job);
    // And ensure all active jobs' tags have their TagID dialogs present (redundant safety)
    ensure_tag_joins_for_active_jobs(player);

    saveJson(job_data, data_file_path);

    // Message
    if (source === "auto-region") {
        tellPlayer(player, "&a:check_mark: You have been granted the job &b" + job["JobName"] + " &7in &e" + job["Region"] + "&7 because you own the required region.");
    } else if (source === "dialog-join") {
        tellPlayer(player, "&a:check_mark: You have started working as &b" + job["JobName"] + " &7in &e" + job["Region"] + "&7. Good luck!");
    }
    // Log economy: job granted
    try {
        var displayGrant = (typeof getJobDisplayTitle === 'function') ? (getJobDisplayTitle(id) || job["JobName"]) : job["JobName"];
        var reasonGrant = source || "unspecified";
        logToFile("economy", player.getName() + " granted job '" + displayGrant + "' (ID:" + id + ") in " + job["Region"] + " [" + job["Type"] + "] via " + reasonGrant + ".");
    } catch (e) { /* no-op */ }
    return true;
}

/**
 * Archives and removes a job from the player's active list; removes perms and dialogs; saves.
 */
function archive_and_remove_job(player, job_id, job_def_opt, reason_opt) {
    var uuid = player.getUUID();
    var active_job = job_data[uuid]["ActiveJobs"][job_id];
    if (!active_job) return false;

    // Determine job definition if not provided
    var job_def = job_def_opt;
    if (!job_def) {
        for (var i = 0; i < job_config["Jobs"].length; i++) {
            if (job_config["Jobs"][i]["JobID"] == job_id) { job_def = job_config["Jobs"][i]; break; }
        }
    }

    // Build standardized history entry
    job_data[uuid]["JobHistory"][job_id] = {
        "JobID": active_job["JobID"],
        "JobName": active_job["JobName"],
        "StartTime": active_job["StartTime"],
        "EndTime": world.getTotalTime(),
        "Region": active_job["Region"],
        "Type": job_def ? (job_def["Type"] || active_job["Type"]) : active_job["Type"]
    };

    // Remove from active
    delete job_data[uuid]["ActiveJobs"][job_id];

    // Remove permissions
    remove_job_perms(player, job_id);

    // Remove dialogs tied to the job (and clean lock/quit for job and tags)
    if (job_def) {
        player.removeDialog(job_def["JobID"]);
        cleanupLockQuitForJobAndTags(player, job_def);
    } else {
        player.removeDialog(parseInt(job_id));
    }

    saveJson(job_data, data_file_path);

    // Log economy: job removed
    try {
        var displayRemove = active_job["JobName"];
        if (typeof getJobDisplayTitle === 'function') {
            var dispName = getJobDisplayTitle(parseInt(job_id));
            if (dispName) displayRemove = dispName;
        }
        var workedFor = get_time(active_job["StartTime"], world.getTotalTime());
        var reasonRemove = reason_opt || "unspecified";
        logToFile("economy", player.getName() + " removed job '" + displayRemove + "' (ID:" + job_id + ") in " + active_job["Region"] + " [" + active_job["Type"] + "] | Reason: " + reasonRemove + " | Worked: " + workedFor + ".");
    } catch (e) { /* no-op */ }
    return true;
}

/**
 * Removes all jobs that have a given tag name from the player.
 */
function remove_jobs_with_tag(player, tag_name) {
    var uuid = player.getUUID();
    // Collect job ids first to avoid mutating while iterating
    var toRemove = [];
    for (var job_id in job_data[uuid]["ActiveJobs"]) {
        // find job def
        var jdef = null;
        for (var i = 0; i < job_config["Jobs"].length; i++) {
            if (job_config["Jobs"][i]["JobID"] == job_id) { jdef = job_config["Jobs"][i]; break; }
        }
        if (!jdef) continue;
        var tags = jdef["Tags"] || jdef["Types"] || [];
        if (Array.isArray(tags) && tags.indexOf(tag_name) !== -1) {
            toRemove.push({ id: job_id, def: jdef });
        }
    }

    for (var k = 0; k < toRemove.length; k++) {
        var pair = toRemove[k];
        archive_and_remove_job(player, pair.id, pair.def, "tag-quit:" + tag_name);
        tellPlayer(player, "&c:tag: You have lost the job &b" + pair.def["JobName"] + " &cin &e" + pair.def["Region"] + "&c due to quitting the tag &e" + tag_name + "&c.");
    }
}

/**
 * Handle tag-level quit dialogs: if player has TagQuit, remove all jobs with that tag, then clear TagQuit.
 */
function process_tag_quits(player) {
    var tags = (job_config && job_config["Tags"]) ? job_config["Tags"] : {};
    for (var tname in tags) {
        var t = tags[tname];
        if (t && t["TagQuit"] && player.hasReadDialog(t["TagQuit"])) {
            remove_jobs_with_tag(player, tname);
            player.removeDialog(t["TagQuit"]);
        }
    }
}
