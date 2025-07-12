/**
 * Gets the job name by its ID.
 * @param {number} jobId - The job ID.
 * @returns {string|null} - The job name or null if not found.
 */
function getJobName(jobId) {
    var jobsData = loadJson("world/customnpcs/scripts/data/jobs_data.json");
    for (var i = 0; i < jobsData.length; i++) {
        if (jobsData[i].JobId === jobId) {
            return jobsData[i].Title;
        }
    }
    return null;
}

/**
 * Checks if a job has a specific tag.
 * @param {number} jobId - The job ID.
 * @param {string} tag - The tag to check for.
 * @returns {boolean} - True if the job has the tag, false otherwise.
 */
function hasTag(jobId, tag) {
    var jobsData = loadJson("world/customnpcs/scripts/data/jobs_data.json");
    for (var i = 0; i < jobsData.length; i++) {
        if (jobsData[i].JobId === jobId) {
            return jobsData[i].Types.includes(tag);
        }
    }
    return false;
}

/**
 * Checks if the player has at least one job with a given tag.
 * @param {IPlayer} player - The player object.
 * @param {string} tag - The tag to check for.
 * @returns {boolean} - True if the player has at least one job with the tag, false otherwise.
 */
function playerHasJobWithTag(player, tag) {
    // tellPlayer(player, "&f:check: Checking if you have the job with tag: " + tag);
    var valid_ids = getJobIdsWithTag(tag);
    // tellPlayer(player, "&f:check: Jobs with tag '" + tag + "': " + valid_ids.join(", "));
    // tellPlayer(player, "&f:check: Found " + valid_ids.length + " job IDs with tag: " + tag);
    for (var i = 0; i < valid_ids.length; i++) {
        // tellPlayer(player, "&f:check: Checking job ID: " + valid_ids[i]);
        if (player.hasReadDialog(valid_ids[i])) {
            // tellPlayer(player, "&a:check: You have the job with tag: " + tag);
            return true;
        }
    }
    return false;
}

/**
 * Returns all job IDs that have a given tag.
 * @param {string} tag - The tag to search for.
 * @returns {number[]} - An array of job IDs that have the given tag.
 */
function getJobIdsWithTag(tag) {
    var jobsData = loadJson("world/customnpcs/scripts/data/jobs_data.json");
    var jobIds = [];
    for (var i = 0; i < jobsData.Jobs.length; i++) {
        if (includes(jobsData.Jobs[i].Types, tag)) {
            jobIds.push(jobsData.Jobs[i].JobID);
        }
    }
    return jobIds;
}


