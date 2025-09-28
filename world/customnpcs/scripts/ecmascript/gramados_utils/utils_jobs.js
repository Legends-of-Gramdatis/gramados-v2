load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");

var CONFIG_PATH = "world/customnpcs/scripts/ecmascript/modules/jobs/config.json";

/**
 * Gets the job name by its ID.
 * @param {number} jobId - The job ID.
 * @returns {string|null} - The job name or null if not found.
 */
function getJobName(jobId) {
    var cfg = loadJson(CONFIG_PATH);
    if (!cfg || !cfg.Jobs) return null;
    for (var i = 0; i < cfg.Jobs.length; i++) {
        if (cfg.Jobs[i].JobID === jobId) {
            return cfg.Jobs[i].JobName || cfg.Jobs[i].Title || null;
        }
    }
    return null;
}

/**
 * Gets the job title by its ID.
 * @param {number} jobId - The job ID.
 * @returns {string|null} - The job title or null if not found.
 */
function getJobTitle(jobId) {
    var cfg = loadJson(CONFIG_PATH);
    if (!cfg || !cfg.Jobs) return null;
    for (var i = 0; i < cfg.Jobs.length; i++) {
        if (cfg.Jobs[i].JobID === jobId) {
            return cfg.Jobs[i].Title || cfg.Jobs[i].JobName || null;
        }
    }
    return null;
}

/**
 * Returns the job object by ID from config.
 * @param {number} jobId
 * @returns {Object|null} The job object or null if not found.
 */
function getJobById(jobId) {
    var cfg = loadJson(CONFIG_PATH);
    if (!cfg || !cfg.Jobs) return null;
    for (var i = 0; i < cfg.Jobs.length; i++) {
        var id = cfg.Jobs[i].JobID || cfg.Jobs[i].JobId;
        if (id === jobId) return cfg.Jobs[i];
    }
    return null;
}

/**
 * Preferred display label for a job: Title if present, else JobName.
 * @param {number} jobId
 * @returns {string|null}
 */
function getJobDisplayTitle(jobId) {
    var job = getJobById(jobId);
    if (!job) return null;
    return job.Title || job.JobName || null;
}

/**
 * Gets the job ID by its name.
 * @param {string} jobName - The job name.
 * @returns {number|null} - The job ID or null if not found.
 */
function getJobId(jobName) {
    var cfg = loadJson(CONFIG_PATH);
    if (!cfg || !cfg.Jobs) return null;
    for (var i = 0; i < cfg.Jobs.length; i++) {
        var name = cfg.Jobs[i].JobName || cfg.Jobs[i].Title;
        if (name === jobName) {
            return cfg.Jobs[i].JobID || cfg.Jobs[i].JobId;
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
    var cfg = loadJson(CONFIG_PATH);
    if (!cfg || !cfg.Jobs) return false;
    for (var i = 0; i < cfg.Jobs.length; i++) {
        var job = cfg.Jobs[i];
        var id = job.JobID || job.JobId;
        if (id === jobId) {
            var tags = job.Tags || job.Types || [];
            return Array.isArray(tags) ? tags.indexOf(tag) !== -1 : false;
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
    // tellPlayer(player, "&f:check_mark: Checking if you have the job with tag: " + tag);
    var valid_ids = getJobIdsWithTag(tag);
    // tellPlayer(player, "&f:check_mark: Jobs with tag '" + tag + "': " + valid_ids.join(", "));
    // tellPlayer(player, "&f:check_mark: Found " + valid_ids.length + " job IDs with tag: " + tag);
    for (var i = 0; i < valid_ids.length; i++) {
        // tellPlayer(player, "&f:check_mark: Checking job ID: " + valid_ids[i]);
        var id = valid_ids[i];
        // convert to int if it's a string
        if (typeof id === "string") {
            id = parseInt(id);
        }
        if (player.hasReadDialog(id)) {
            // tellPlayer(player, "&a:check_mark: You have the job with tag: " + tag);
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
    var cfg = loadJson(CONFIG_PATH);
    var jobIds = [];
    if (!cfg || !cfg.Jobs) return jobIds;
    for (var i = 0; i < cfg.Jobs.length; i++) {
        var tags = cfg.Jobs[i].Tags || cfg.Jobs[i].Types || [];
        if (Array.isArray(tags) && tags.indexOf(tag) !== -1) {
            jobIds.push(cfg.Jobs[i].JobID || cfg.Jobs[i].JobId);
        }
    }
    return jobIds;
}

/**
 * Gets the job qualification by job ID.
 * @param {number} jobId - The job ID.
 * @returns {string|null} - The job qualification or null if not found.
 */
function getJobQualification(jobId) {
    var cfg = loadJson(CONFIG_PATH);
    if (!cfg || !cfg.Jobs) return null;
    for (var i = 0; i < cfg.Jobs.length; i++) {
        var id = cfg.Jobs[i].JobID || cfg.Jobs[i].JobId;
        if (id === jobId) {
            // In the new config this is stored as Type
            return cfg.Jobs[i].Type || cfg.Jobs[i].Qualification || null;
        }
    }
    return null;
}


function playerHasJobWithQualification(player, qualification) {
    var cfg = loadJson(CONFIG_PATH);
    if (!cfg || !cfg.Jobs) return false;
    for (var i = 0; i < cfg.Jobs.length; i++) {
        var q = cfg.Jobs[i].Type || cfg.Jobs[i].Qualification;
        var id = cfg.Jobs[i].JobID || cfg.Jobs[i].JobId;
        if (q === qualification && player.hasReadDialog(id)) {
            return true;
        }
    }
    return false;
}

function getAutopayAmountForID(jobId) {
    var cfg = loadJson(CONFIG_PATH);
    if (!cfg || !cfg.Jobs) return 0;
    for (var i = 0; i < cfg.Jobs.length; i++) {
        var id = cfg.Jobs[i].JobID || cfg.Jobs[i].JobId;
        if (id === jobId) {
            return cfg.Jobs[i].AutoPay || 0; // Default to 0 if AutoPay is not defined
        }
    }
    return 0;
}

function getAutopayAmountTotal(player) {
    var total = 0;
    var cfg = loadJson(CONFIG_PATH);
    if (!cfg || !cfg.Jobs) return 0;
    for (var i = 0; i < cfg.Jobs.length; i++) {
        var id = cfg.Jobs[i].JobID || cfg.Jobs[i].JobId;
        if (player.hasReadDialog(id)) {
            total += getAutopayAmountForID(id);
        }
    }
    return total;
}

// ===================== Dialog helpers (centralized) =====================

/**
 * Ensure that, when a job is granted, the player has the job's join dialog and all tag join dialogs,
 * and that lock/quit dialogs for the job and its tags are removed.
 * This is safe to call multiple times (idempotent behavior).
 * @param {IPlayer} player
 * @param {Object} jobDef - A job object from config.json (must contain JobID; may contain JobLock/JobQuit and Tags)
 */
function ensureJobAndTagDialogsOnGrant(player, jobDef) {
    var cfg = loadJson(CONFIG_PATH) || { Tags: {} };
    try {
        // Always add the job's join dialog
        var jid = jobDef && (jobDef.JobID || jobDef.JobId);
        if (jid !== undefined && typeof player.addDialog === 'function') {
            player.addDialog(jid);
        }

        // Remove job lock/quit tokens
        if (jobDef && jobDef.JobQuit !== undefined) player.removeDialog(jobDef.JobQuit);
        if (jobDef && jobDef.JobLock !== undefined) player.removeDialog(jobDef.JobLock);

        // Handle tag dialogs/cleanup
        var tags = (jobDef && (jobDef.Tags || jobDef.Types)) || [];
        if (Array.isArray(tags)) {
            for (var i = 0; i < tags.length; i++) {
                var tname = tags[i];
                var t = cfg.Tags ? cfg.Tags[tname] : null;
                if (!t) continue;
                if (t.TagID !== undefined && typeof player.addDialog === 'function') {
                    player.addDialog(t.TagID);
                }
                if (t.TagQuit !== undefined) player.removeDialog(t.TagQuit);
                if (t.TagLock !== undefined) player.removeDialog(t.TagLock);
            }
        }
    } catch (e) {
        // Swallow errors to avoid breaking flows; dialog ops are best-effort
    }
}

/**
 * Remove lock/quit dialogs for a job and its tags. Useful after archiving/removal, or to sanitize state.
 * Does not remove the job's join dialog nor tag join dialogs.
 * @param {IPlayer} player
 * @param {Object} jobDef - A job object from config.json
 */
function cleanupLockQuitForJobAndTags(player, jobDef) {
    var cfg = loadJson(CONFIG_PATH) || { Tags: {} };
    try {
        if (jobDef && jobDef.JobQuit !== undefined) player.removeDialog(jobDef.JobQuit);
        if (jobDef && jobDef.JobLock !== undefined) player.removeDialog(jobDef.JobLock);
        var tags = (jobDef && (jobDef.Tags || jobDef.Types)) || [];
        if (Array.isArray(tags)) {
            for (var i = 0; i < tags.length; i++) {
                var tname = tags[i];
                var t = cfg.Tags ? cfg.Tags[tname] : null;
                if (!t) continue;
                if (t.TagQuit !== undefined) player.removeDialog(t.TagQuit);
                if (t.TagLock !== undefined) player.removeDialog(t.TagLock);
            }
        }
    } catch (e) {
        // no-op
    }
}

