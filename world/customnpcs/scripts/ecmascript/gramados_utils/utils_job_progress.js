load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");

var JOB_PROGRESS_CONFIG_PATH = "world/customnpcs/scripts/data/job_milestones.json";
var JOB_PROGRESS_JOBS_CONFIG_PATH = "world/customnpcs/scripts/data/jobs_data.json";
var JOB_PROGRESS_DATA_DIR = "world/customnpcs/scripts/data_auto/job_progress";
var JOB_PROGRESS_VERSION = 1;
var JOB_PROGRESS_API = Java.type('noppes.npcs.api.NpcAPI').Instance();

function _jobProgressNormalizeType(subjectType) {
    var normalized = String(subjectType || "").toLowerCase();
    if (normalized === "job" || normalized === "jobs") return "Jobs";
    if (normalized === "tag" || normalized === "tags") return "Tags";
    return null;
}

function _jobProgressEnsureDataDir() {
    var dir = new java.io.File(JOB_PROGRESS_DATA_DIR);
    if (!dir.exists()) {
        dir.mkdirs();
    }
}

function _jobProgressGetPlayerPath(player) {
    return JOB_PROGRESS_DATA_DIR + "/" + String(player.getUUID()) + ".json";
}

function _jobProgressCreatePlayerData(player) {
    return {
        Version: JOB_PROGRESS_VERSION,
        UUID: String(player.getUUID()),
        Name: player.getName(),
        Jobs: {},
        Tags: {}
    };
}

function loadJobProgressData(player) {
    _jobProgressEnsureDataDir();
    var path = _jobProgressGetPlayerPath(player);
    var data = loadJson(path);

    if (!data) {
        data = _jobProgressCreatePlayerData(player);
    }

    if (!data.Jobs) data.Jobs = {};
    if (!data.Tags) data.Tags = {};
    if (!data.Version) data.Version = JOB_PROGRESS_VERSION;
    data.UUID = String(player.getUUID());
    data.Name = player.getName();

    return data;
}

function saveJobProgressData(player, data) {
    _jobProgressEnsureDataDir();
    data.Version = JOB_PROGRESS_VERSION;
    data.UUID = String(player.getUUID());
    data.Name = player.getName();
    saveJson(data, _jobProgressGetPlayerPath(player));
}

function _jobProgressCreateSubjectData() {
    return {
        Stats: {},
        Markets: {},
        Unlocked: {}
    };
}

function _jobProgressGetSubjectData(data, subjectType, progressionKey, create) {
    var namespace = _jobProgressNormalizeType(subjectType);
    if (!namespace || !progressionKey) return null;

    if (!data[namespace]) data[namespace] = {};
    if (!data[namespace][progressionKey] && create) {
        data[namespace][progressionKey] = _jobProgressCreateSubjectData();
    }

    var subjectData = data[namespace][progressionKey] || null;
    if (subjectData) {
        if (!subjectData.Stats) subjectData.Stats = {};
        if (!subjectData.Markets) subjectData.Markets = {};
        if (!subjectData.Unlocked) subjectData.Unlocked = {};
    }
    return subjectData;
}

function _jobProgressNotifyUnlock(player, subjectConfig, milestone, namespace, progressionKey) {
    var subjectName = subjectConfig.DisplayName || progressionKey;
    var milestoneName = milestone.Name || milestone.Id;
    tellPlayer(player, "&6:star: &eNew " + (namespace === "Tags" ? "job tag" : "job") + " milestone unlocked: &f" + milestoneName + " &7(" + subjectName + ")");
}

function _jobProgressEnsureCurrencyUtils() {
    if (typeof generateMoney !== "function") {
        load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
    }
}

function _jobProgressEnsureEmoteUtils() {
    if (typeof grantEmotes !== "function" || typeof grantBadgeAndEmotes !== "function") {
        load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_emotes.js");
    }
}

function _jobProgressEnsureLootUtils() {
    if (typeof pullLootTable !== "function" || typeof generateItemStackFromLootEntry !== "function" || typeof canUseLootTable !== "function") {
        load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js");
    }
}

function _jobProgressGiveItem(player, itemStack) {
    if (!itemStack || (typeof itemStack.isEmpty === "function" && itemStack.isEmpty())) return false;
    if (!player.giveItem(itemStack)) {
        player.dropItem(itemStack);
    }
    return true;
}

function _jobProgressGrantRewards(player, rewards) {
    if (!rewards || !rewards.length) return true;
    var allSuccessful = true;

    for (var i = 0; i < rewards.length; i++) {
        var reward = rewards[i];
        if (!reward || !reward.Type) continue;

        try {
            var type = String(reward.Type).toLowerCase();

            if (type === "money") {
                _jobProgressEnsureCurrencyUtils();
                var amount = Number(reward.Amount || 0);
                if (amount > 0) {
                    var moneyItems = generateMoney(player.getWorld(), amount, reward.Currency || "money") || [];
                    for (var m = 0; m < moneyItems.length; m++) {
                        _jobProgressGiveItem(player, moneyItems[m]);
                    }
                    tellPlayer(player, "&a:money: Milestone reward: &e" + getAmountCoin(amount) + "&a.");
                }
            } else if (type === "badge") {
                _jobProgressEnsureEmoteUtils();
                if (reward.Badge) {
                    grantBadgeAndEmotes(player, String(reward.Badge), []);
                }
            } else if (type === "emote") {
                _jobProgressEnsureEmoteUtils();
                if (reward.Emote) grantEmotes(player, [String(reward.Emote)]);
            } else if (type === "emotes") {
                _jobProgressEnsureEmoteUtils();
                if (reward.Emotes && reward.Emotes.length) grantEmotes(player, reward.Emotes);
            } else if (type === "loot_table" || type === "loottable") {
                _jobProgressEnsureLootUtils();
                var table = reward.LootTable || reward.Table;
                var pulls = Math.max(1, Number(reward.Pulls || 1));
                if (!table) continue;

                if (!canUseLootTable(String(table))) {
                    allSuccessful = false;
                    _jobProgressLog("Milestone loot table is currently unavailable or empty: " + table);
                    continue;
                }

                for (var p = 0; p < pulls; p++) {
                    var loot = pullLootTable(String(table), player);
                    if (loot === null) {
                        allSuccessful = false;
                        break;
                    }
                    for (var l = 0; l < loot.length; l++) {
                        var stack = generateItemStackFromLootEntry(loot[l], player.getWorld());
                        _jobProgressGiveItem(player, stack);
                    }
                }
            } else {
                allSuccessful = false;
                _jobProgressLog("Unknown milestone reward type '" + reward.Type + "'.");
            }
        } catch (e) {
            allSuccessful = false;
            _jobProgressLog("Failed to grant milestone reward: " + e.message);
        }
    }

    return allSuccessful;
}

function _jobProgressLog(message) {
    try {
        if (typeof logToFile === "function") {
            logToFile("events", "[Job Milestones] " + message);
            return;
        }
    } catch (ignored) {}

    try {
        java.lang.System.out.println("[Job Milestones] " + message);
    } catch (ignored2) {}
}

function _jobProgressUpdateBreakdowns(subjectData, changes, context) {
    if (!subjectData || !context) return;

    if (context.market) {
        var marketName = String(context.market);
        if (!subjectData.Markets[marketName]) {
            subjectData.Markets[marketName] = {};
        }

        var marketData = subjectData.Markets[marketName];
        for (var stat in changes) {
            if (!changes.hasOwnProperty(stat)) continue;
            var delta = Number(changes[stat] || 0);
            if (isNaN(delta)) continue;
            marketData[stat] = Number(marketData[stat] || 0) + delta;
        }
    }
}

function _jobProgressLoadJobsConfig() {
    return loadJson(JOB_PROGRESS_JOBS_CONFIG_PATH) || { Jobs: [], Tags: {} };
}

function _jobProgressGetJobProgressionKey(jobDef) {
    if (!jobDef) return null;
    return String(jobDef.ProgressionKey || jobDef.JobName || jobDef.Title || jobDef.JobID || jobDef.JobId || "");
}

function _jobProgressGetTagProgressionKey(tagName, tagDef) {
    if (tagDef && tagDef.ProgressionKey) return String(tagDef.ProgressionKey);
    return String(tagName || "");
}

function _jobProgressGetMilestoneConfig(subjectType, progressionKey) {
    var cfg = loadJson(JOB_PROGRESS_CONFIG_PATH) || {};
    var namespace = _jobProgressNormalizeType(subjectType);
    if (!namespace || !cfg[namespace]) return null;
    return cfg[namespace][progressionKey] || null;
}

function _jobProgressCompare(actual, operator, expected) {
    var a = Number(actual || 0);
    var e = Number(expected || 0);
    switch (String(operator || ">=")) {
        case ">": return a > e;
        case ">=": return a >= e;
        case "<": return a < e;
        case "<=": return a <= e;
        case "==": return a === e;
        case "!=": return a !== e;
        default: return false;
    }
}

function _jobProgressRequirementValue(subjectData, requirement) {
    if (!requirement) return 0;

    if (requirement.Market) {
        var market = subjectData.Markets[String(requirement.Market)] || {};
        return Number(market[requirement.Stat] || 0);
    }

    return Number(subjectData.Stats[requirement.Stat] || 0);
}

function _jobProgressMilestoneRequirementsMet(subjectData, milestone) {
    var requirements = milestone.Requirements || [];
    if (requirements.length === 0) return true;

    var mode = String(milestone.RequirementMode || "ALL").toUpperCase();
    var matched = 0;

    for (var i = 0; i < requirements.length; i++) {
        var req = requirements[i];
        var actual = _jobProgressRequirementValue(subjectData, req);
        var met = _jobProgressCompare(actual, req.Operator || ">=", req.Value);
        if (met) matched++;
        else if (mode !== "ANY") return false;
    }

    return mode === "ANY" ? matched > 0 : matched === requirements.length;
}

function getJobProgress(player, subjectType, progressionKey) {
    var data = loadJobProgressData(player);
    return _jobProgressGetSubjectData(data, subjectType, progressionKey, false);
}

function getJobStat(player, subjectType, progressionKey, stat) {
    var subjectData = getJobProgress(player, subjectType, progressionKey);
    if (!subjectData || !subjectData.Stats) return 0;
    return Number(subjectData.Stats[stat] || 0);
}

function setJobStat(player, subjectType, progressionKey, stat, value, context) {
    var data = loadJobProgressData(player);
    var subjectData = _jobProgressGetSubjectData(data, subjectType, progressionKey, true);
    subjectData.Stats[stat] = Number(value || 0);
    _jobProgressUpdateBreakdowns(subjectData, {}, context);
    saveJobProgressData(player, data);
    checkJobMilestones(player, subjectType, progressionKey, data);
    return subjectData.Stats[stat];
}

function hasJobMilestone(player, subjectType, progressionKey, milestoneId) {
    var subjectData = getJobProgress(player, subjectType, progressionKey);
    return !!(subjectData && subjectData.Unlocked && subjectData.Unlocked[milestoneId]);
}

function recordJobProgress(player, progressionKey, changes, context) {
    return recordProgress(player, "job", progressionKey, changes, context);
}

function recordTagProgress(player, progressionKey, changes, context) {
    return recordProgress(player, "tag", progressionKey, changes, context);
}

function recordProgress(player, subjectType, progressionKey, changes, context) {
    if (!player || !progressionKey || !changes) return null;

    var namespace = _jobProgressNormalizeType(subjectType);
    if (!namespace) return null;

    var data = loadJobProgressData(player);
    var subjectData = _jobProgressGetSubjectData(data, namespace, String(progressionKey), true);

    for (var stat in changes) {
        if (!changes.hasOwnProperty(stat)) continue;
        var delta = Number(changes[stat] || 0);
        if (isNaN(delta)) continue;
        subjectData.Stats[stat] = Number(subjectData.Stats[stat] || 0) + delta;
    }

    _jobProgressUpdateBreakdowns(subjectData, changes, context);
    saveJobProgressData(player, data);
    checkJobMilestones(player, namespace, String(progressionKey), data);

    return subjectData;
}

function getJobOrTagProgressionSubjectById(subjectId) {
    var cfg = _jobProgressLoadJobsConfig();
    var jobs = cfg.Jobs || [];
    var wanted = String(subjectId);

    for (var i = 0; i < jobs.length; i++) {
        var job = jobs[i];
        var id = job.JobID !== undefined ? job.JobID : job.JobId;
        if (String(id) === wanted) {
            return {
                Type: "Jobs",
                Key: _jobProgressGetJobProgressionKey(job),
                Name: job.JobName || job.Title || String(id),
                Definition: job,
                Tags: job.Tags || []
            };
        }
    }

    var tags = cfg.Tags || {};
    for (var tagName in tags) {
        if (!tags.hasOwnProperty(tagName)) continue;
        var tagDef = tags[tagName];
        var tagId = tagDef.TagID !== undefined ? tagDef.TagID : tagDef.TagId;
        if (String(tagId) === wanted) {
            return {
                Type: "Tags",
                Key: _jobProgressGetTagProgressionKey(tagName, tagDef),
                Name: tagName,
                Definition: tagDef,
                Tags: []
            };
        }
    }

    return null;
}

function recordProgressForJobOrTagId(player, subjectId, changes, context) {
    var subject = getJobOrTagProgressionSubjectById(subjectId);
    if (!subject) return false;

    if (subject.Type === "Jobs") {
        recordProgress(player, "Jobs", subject.Key, changes, context);

        var cfg = _jobProgressLoadJobsConfig();
        var tagDefs = cfg.Tags || {};
        var seenTagKeys = {};
        for (var i = 0; i < subject.Tags.length; i++) {
            var tagName = String(subject.Tags[i]);
            var tagKey = _jobProgressGetTagProgressionKey(tagName, tagDefs[tagName]);
            if (!tagKey || seenTagKeys[tagKey]) continue;
            seenTagKeys[tagKey] = true;
            recordProgress(player, "Tags", tagKey, changes, context);
        }
        return true;
    }

    recordProgress(player, "Tags", subject.Key, changes, context);
    return true;
}

function recordMarketJobProgress(player, subjectId, marketName, totalEarnings, delivery) {
    var earnings = Number(totalEarnings || 0);
    if (!player || !subjectId || earnings < 0) return false;

    var changes = {
        market_earnings: earnings,
        market_transactions: 1
    };

    var context = {
        source: "market",
        automated: false,
        market: String(marketName || "Unknown"),
        delivery: delivery || null
    };

    return recordProgressForJobOrTagId(player, subjectId, changes, context);
}

function checkJobMilestones(player, subjectType, progressionKey, existingData) {
    var namespace = _jobProgressNormalizeType(subjectType);
    if (!namespace || !player || !progressionKey) return [];

    var config = _jobProgressGetMilestoneConfig(namespace, progressionKey);
    if (!config || !config.Milestones || !config.Milestones.length) return [];

    var data = existingData || loadJobProgressData(player);
    var subjectData = _jobProgressGetSubjectData(data, namespace, progressionKey, true);
    var newlyUnlocked = [];

    for (var i = 0; i < config.Milestones.length; i++) {
        var milestone = config.Milestones[i];
        if (!milestone || !milestone.Id) continue;
        if (subjectData.Unlocked[milestone.Id]) {
            if (subjectData.Unlocked[milestone.Id].RewardsGranted !== true) {
                var retryGranted = _jobProgressGrantRewards(player, milestone.Rewards || []);
                subjectData.Unlocked[milestone.Id].RewardsGranted = retryGranted;
                subjectData.Unlocked[milestone.Id].RewardsGrantedAt = retryGranted ? new Date().getTime() : null;
                saveJobProgressData(player, data);
            }
            continue;
        }
        if (!_jobProgressMilestoneRequirementsMet(subjectData, milestone)) continue;

        subjectData.Unlocked[milestone.Id] = {
            UnlockedAt: new Date().getTime(),
            RewardsGranted: false
        };

        // Persist the unlock before granting non-idempotent rewards.
        saveJobProgressData(player, data);

        var rewardsGranted = _jobProgressGrantRewards(player, milestone.Rewards || []);
        subjectData.Unlocked[milestone.Id].RewardsGranted = rewardsGranted;
        subjectData.Unlocked[milestone.Id].RewardsGrantedAt = rewardsGranted ? new Date().getTime() : null;
        saveJobProgressData(player, data);

        _jobProgressNotifyUnlock(player, config, milestone, namespace, progressionKey);
        newlyUnlocked.push(milestone.Id);
    }

    return newlyUnlocked;
}

function recheckAllJobMilestones(player) {
    var data = loadJobProgressData(player);
    var unlocked = [];
    var namespaces = ["Jobs", "Tags"];

    for (var n = 0; n < namespaces.length; n++) {
        var namespace = namespaces[n];
        var subjects = data[namespace] || {};
        for (var key in subjects) {
            if (!subjects.hasOwnProperty(key)) continue;
            var ids = checkJobMilestones(player, namespace, key, data);
            for (var i = 0; i < ids.length; i++) {
                unlocked.push(namespace + ":" + key + ":" + ids[i]);
            }
        }
    }

    return unlocked;
}

function getOnlinePlayerByNameForJobProgress(playerName) {
    var dimensions = [0, -1, 1];
    for (var i = 0; i < dimensions.length; i++) {
        try {
            var world = JOB_PROGRESS_API.getIWorld(dimensions[i]);
            if (!world) continue;
            try {
                var player = world.getPlayer(String(playerName));
                if (player) return player;
            } catch (ignoredGetPlayer) {}

            try {
                var players = world.getAllPlayers();
                for (var p = 0; p < players.length; p++) {
                    if (String(players[p].getName()).toLowerCase() === String(playerName).toLowerCase()) {
                        return players[p];
                    }
                }
            } catch (ignoredGetAll) {}
        } catch (ignored) {}
    }
    return null;
}
