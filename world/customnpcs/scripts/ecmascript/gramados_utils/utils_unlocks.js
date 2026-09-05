load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_player.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_rewards.js");

var GENERIC_UNLOCK_CONFIG_PATH = "world/customnpcs/scripts/data/unlocks.json";

function _genericUnlockLog(message) {
    try {
        if (typeof logToFile === "function") {
            logToFile("events", "[Generic Unlocks] " + message);
            return;
        }
    } catch (ignored) {}

    try {
        java.lang.System.out.println("[Generic Unlocks] " + message);
    } catch (ignored2) {}
}

function loadGenericUnlockConfig() {
    var config = loadJson(GENERIC_UNLOCK_CONFIG_PATH) || {};
    if (!config.Unlocks) config.Unlocks = {};
    return config;
}

function _genericUnlockGetPlayerData(player) {
    try {
        return loadPlayerMeta(player);
    } catch (e) {
        _genericUnlockLog(
            "Could not load player metadata for " + player.getName() + ": " + e.message
        );
        return null;
    }
}

function _genericUnlockEnsureContainers(playerData) {
    if (!playerData.unlocks) playerData.unlocks = {};
    if (!playerData.meta) playerData.meta = {};
    if (!playerData.meta.genericUnlocks) playerData.meta.genericUnlocks = {};
}

function _genericUnlockGetMetadata(playerData, unlockId, create) {
    _genericUnlockEnsureContainers(playerData);

    if (!playerData.meta.genericUnlocks[unlockId] && create) {
        playerData.meta.genericUnlocks[unlockId] = {
            UnlockedAt: null,
            RewardsGranted: false,
            RewardsGrantedAt: null
        };
    }

    return playerData.meta.genericUnlocks[unlockId] || null;
}

function _genericUnlockCompare(actual, operator, expected) {
    var a = Number(actual);
    var e = Number(expected);

    if (isNaN(a) || isNaN(e)) return false;

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

function _genericUnlockGetPlayerField(playerData, fieldPath) {
    if (!playerData || !fieldPath) return undefined;

    var current = playerData;
    var parts = String(fieldPath).split(".");

    for (var i = 0; i < parts.length; i++) {
        if (current === null || current === undefined) return undefined;
        current = current[parts[i]];
    }

    return current;
}

/**
 * Builds the calendar anniversary for an age requirement.
 * Example: created + 5 years, or firstLogin + 6 months.
 */
function _genericUnlockBuildAgeTarget(timestamp, requirement) {
    var value = Number(timestamp);
    if (isNaN(value) || value <= 0) return null;

    var target = new Date(value);

    var years = Number(requirement.Years || 0);
    var months = Number(requirement.Months || 0);
    var days = Number(requirement.Days || 0);
    var milliseconds = Number(requirement.Milliseconds || 0);

    if (years) target.setFullYear(target.getFullYear() + years);
    if (months) target.setMonth(target.getMonth() + months);
    if (days) target.setDate(target.getDate() + days);
    if (milliseconds) target = new Date(target.getTime() + milliseconds);

    return target.getTime();
}

function _genericUnlockEnsureJobProgressUtils() {
    if (typeof hasJobMilestone !== "function") {
        load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_job_progress.js");
    }
}

function _genericUnlockRequirementMet(player, playerData, requirement) {
    if (!requirement || !requirement.Type) return false;

    var type = String(requirement.Type).toLowerCase();

    if (type === "player_data_age") {
        var ageField = requirement.Field || "created";
        var timestamp = _genericUnlockGetPlayerField(playerData, ageField);
        var targetTime = _genericUnlockBuildAgeTarget(timestamp, requirement);
        if (targetTime === null) return false;

        return _genericUnlockCompare(
            new Date().getTime(),
            requirement.Operator || ">=",
            targetTime
        );
    }

    if (type === "player_data_value") {
        var fieldValue = _genericUnlockGetPlayerField(playerData, requirement.Field);
        return _genericUnlockCompare(
            fieldValue,
            requirement.Operator || ">=",
            requirement.Value
        );
    }

    if (type === "has_unlock") {
        var wantedUnlock = String(requirement.Unlock || requirement.Id || "");
        if (!wantedUnlock) return false;
        var hasUnlockValue = !!(
            playerData.unlocks
            && playerData.unlocks[wantedUnlock] === true
        );
        var expectedUnlockValue = requirement.Value === undefined
            ? true
            : !!requirement.Value;
        return hasUnlockValue === expectedUnlockValue;
    }

    if (type === "has_badge") {
        var badges = playerData.badges || [];
        return badges.indexOf(String(requirement.Badge || "")) !== -1;
    }

    if (type === "has_emote") {
        var emotes = playerData.emotes || [];
        return emotes.indexOf(String(requirement.Emote || "")) !== -1;
    }

    if (type === "dialog") {
        var dialogId = Number(requirement.Id);
        return !isNaN(dialogId) && player.hasReadDialog(dialogId);
    }

    if (type === "job_milestone" || type === "tag_milestone") {
        _genericUnlockEnsureJobProgressUtils();

        var subjectType = type === "job_milestone" ? "job" : "tag";
        var subject = requirement.Subject || requirement.ProgressionKey;
        var milestone = requirement.Milestone || requirement.MilestoneId;

        if (!subject || !milestone) return false;

        return hasJobMilestone(
            player,
            subjectType,
            String(subject),
            String(milestone)
        );
    }

    _genericUnlockLog("Unknown requirement type '" + requirement.Type + "'.");
    return false;
}

function _genericUnlockRequirementsMet(player, playerData, definition) {
    var requirements = definition.Requirements || [];
    if (requirements.length === 0) return true;

    var mode = String(definition.RequirementMode || "ALL").toUpperCase();
    var matched = 0;

    for (var i = 0; i < requirements.length; i++) {
        var met = _genericUnlockRequirementMet(
            player,
            playerData,
            requirements[i]
        );

        if (met) {
            matched++;
        } else if (mode !== "ANY") {
            return false;
        }
    }

    return mode === "ANY"
        ? matched > 0
        : matched === requirements.length;
}

function _genericUnlockHasTrigger(definition, trigger) {
    var triggers = definition.Triggers || [];
    var wanted = String(trigger || "").toLowerCase();

    for (var i = 0; i < triggers.length; i++) {
        var configured = String(triggers[i]).toLowerCase();
        if (configured === wanted || configured === "*" || configured === "all") {
            return true;
        }
    }

    return false;
}

function _genericUnlockNotify(player, unlockId, definition) {
    if (definition.Silent === true) return;

    if (definition.Message) {
        tellPlayer(player, String(definition.Message));
        return;
    }

    tellPlayer(
        player,
        "&6:star: &eNew unlock: &f" + (definition.Name || unlockId)
    );
}

/**
 * Returns whether a generic unlock is present in the player's existing
 * `unlocks` map stored in world_data.json.
 */
function hasUnlock(player, unlockId) {
    var playerData = _genericUnlockGetPlayerData(player);
    if (!playerData || !playerData.unlocks) return false;
    return playerData.unlocks[String(unlockId)] === true;
}

/**
 * Permanently grants an unlock and its configured rewards.
 *
 * The public unlock remains a legacy-compatible boolean under
 * `playerData.unlocks`. Reward-delivery metadata is kept separately under
 * `playerData.meta.genericUnlocks`.
 */
function grantUnlock(player, unlockId, definition, existingPlayerData) {
    if (!player || !unlockId) return false;

    var configDefinition = definition;
    if (!configDefinition) {
        var config = loadGenericUnlockConfig();
        configDefinition = config.Unlocks[String(unlockId)] || null;
    }
    if (!configDefinition) return false;

    var playerData = existingPlayerData || _genericUnlockGetPlayerData(player);
    if (!playerData) return false;

    _genericUnlockEnsureContainers(playerData);

    var id = String(unlockId);
    var alreadyUnlocked = playerData.unlocks[id] === true;
    var metadata = _genericUnlockGetMetadata(playerData, id, false);

    // Legacy/manual unlocks predate this framework. Do not retroactively grant
    // money or loot when there is no framework metadata saying rewards are due.
    if (alreadyUnlocked && !metadata) {
        playerData.meta.genericUnlocks[id] = {
            UnlockedAt: null,
            RewardsGranted: true,
            RewardsGrantedAt: null,
            Imported: true
        };
        savePlayerMeta(player, playerData);
        return true;
    }

    if (!alreadyUnlocked) {
        playerData.unlocks[id] = true;
        metadata = _genericUnlockGetMetadata(playerData, id, true);
        metadata.UnlockedAt = new Date().getTime();
        metadata.RewardsGranted = false;
        metadata.RewardsGrantedAt = null;

        // Persist the unlock before attempting non-idempotent rewards.
        savePlayerMeta(player, playerData);
    }

    metadata = _genericUnlockGetMetadata(playerData, id, true);

    if (metadata.RewardsGranted !== true) {
        var rewardsGranted = grantConfiguredRewards(
            player,
            configDefinition.Rewards || [],
            "unlock:" + id
        );

        // Badge/emote reward helpers also edit player_<name>. Reload before
        // persisting reward metadata so their changes cannot be overwritten by
        // the copy of playerData that existed before reward delivery.
        var refreshedPlayerData = _genericUnlockGetPlayerData(player);
        if (!refreshedPlayerData) return true;
        _genericUnlockEnsureContainers(refreshedPlayerData);

        metadata = _genericUnlockGetMetadata(refreshedPlayerData, id, true);
        if (metadata.UnlockedAt === null && !alreadyUnlocked) {
            metadata.UnlockedAt = new Date().getTime();
        }
        metadata.RewardsGranted = rewardsGranted;
        metadata.RewardsGrantedAt = rewardsGranted
            ? new Date().getTime()
            : null;
        savePlayerMeta(player, refreshedPlayerData);
    }

    if (!alreadyUnlocked) {
        _genericUnlockNotify(player, id, configDefinition);
    }

    return true;
}

/**
 * Evaluates one configured unlock. Returns true when the player has the unlock
 * after the check (whether it was already present or was just granted).
 */
function checkUnlock(player, unlockId, existingPlayerData) {
    var config = loadGenericUnlockConfig();
    var definition = config.Unlocks[String(unlockId)] || null;
    if (!definition || definition.Enabled === false) return false;

    var playerData = existingPlayerData || _genericUnlockGetPlayerData(player);
    if (!playerData) return false;

    _genericUnlockEnsureContainers(playerData);

    if (playerData.unlocks[String(unlockId)] === true) {
        return grantUnlock(player, unlockId, definition, playerData);
    }

    if (!_genericUnlockRequirementsMet(player, playerData, definition)) {
        return false;
    }

    return grantUnlock(player, unlockId, definition, playerData);
}

/**
 * Evaluates only unlocks configured for a specific trigger (for example login).
 * Returns the IDs that were newly unlocked during this call.
 */
function checkUnlocksForTrigger(player, trigger) {
    var config = loadGenericUnlockConfig();
    var newlyUnlocked = [];

    for (var unlockId in config.Unlocks) {
        if (!config.Unlocks.hasOwnProperty(unlockId)) continue;

        var definition = config.Unlocks[unlockId];
        if (!definition || definition.Enabled === false) continue;
        if (!_genericUnlockHasTrigger(definition, trigger)) continue;

        // Load fresh data for every definition. Rewards such as badges/emotes
        // mutate the same player_<name> object, so carrying one cached object
        // across several unlocks could overwrite changes made by a prior reward.
        var wasUnlocked = hasUnlock(player, unlockId);
        var nowUnlocked = checkUnlock(player, unlockId);

        if (!wasUnlocked && nowUnlocked) {
            newlyUnlocked.push(unlockId);
        }
    }

    return newlyUnlocked;
}

/**
 * Ignores trigger filters and reevaluates every enabled generic unlock.
 * Useful for admin checks, migrations, and newly-added unlock definitions.
 */
function recheckAllUnlocks(player) {
    var config = loadGenericUnlockConfig();
    var newlyUnlocked = [];

    for (var unlockId in config.Unlocks) {
        if (!config.Unlocks.hasOwnProperty(unlockId)) continue;

        var definition = config.Unlocks[unlockId];
        if (!definition || definition.Enabled === false) continue;

        var wasUnlocked = hasUnlock(player, unlockId);
        var nowUnlocked = checkUnlock(player, unlockId);

        if (!wasUnlocked && nowUnlocked) {
            newlyUnlocked.push(unlockId);
        }
    }

    return newlyUnlocked;
}
