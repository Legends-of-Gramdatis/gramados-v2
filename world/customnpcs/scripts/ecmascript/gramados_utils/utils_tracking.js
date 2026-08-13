load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");

var TRACKING_DATA_PATH = "world/customnpcs/scripts/data_auto/tracking.json";

/**
 * Starts a time tracker for a player.
 * Creates the player and tracker entries if they do not exist.
 * Does nothing if the tracker is already active.
 *
 * @param {IPlayer} player - The player to track.
 * @param {string} tag - Unique tag identifying the tracker.
 * @returns {boolean} True if the tracker was started, false if already active.
 */
function startTimeTracking(player, tag) {
    var data = loadTrackingData();
    var uuid = player.getUUID();
    var now = new Date().getTime();

    if (!data[uuid]) {
        data[uuid] = {
            Name: player.getName(),
            Trackers: {}
        };
    }

    data[uuid].Name = player.getName();

    if (!data[uuid].Trackers) {
        data[uuid].Trackers = {};
    }

    var tracker = data[uuid].Trackers[tag];

    if (!tracker) {
        data[uuid].Trackers[tag] = {
            Active: true,
            StartTime: now,
            CreditTime: 0
        };
    } else {
        if (tracker.Active) {
            return false;
        }

        tracker.Active = true;
        tracker.StartTime = now;
    }

    saveJson(data, TRACKING_DATA_PATH);
    return true;
}

/**
 * Stops/pause a time tracker while preserving its accumulated time.
 *
 * @param {IPlayer} player - The player being tracked.
 * @param {string} tag - Tracker tag.
 * @returns {number} Accumulated tracked time in milliseconds, or -1 if not found.
 */
function stopTimeTracking(player, tag) {
    var data = loadTrackingData();
    var uuid = player.getUUID();

    if (!data[uuid] || !data[uuid].Trackers || !data[uuid].Trackers[tag]) {
        return -1;
    }

    var tracker = data[uuid].Trackers[tag];

    if (tracker.Active && tracker.StartTime !== null) {
        tracker.CreditTime += new Date().getTime() - tracker.StartTime;
    }

    tracker.Active = false;
    tracker.StartTime = null;

    saveJson(data, TRACKING_DATA_PATH);
    return tracker.CreditTime;
}

/**
 * Returns the total accumulated time for a tracker without stopping it.
 *
 * If the tracker is currently active, the current online session is
 * included in the returned value.
 *
 * @param {IPlayer} player - The player being tracked.
 * @param {string} tag - Tracker tag.
 * @returns {number} Tracked time in milliseconds, or -1 if not found.
 */
function getTrackedTime(player, tag) {
    var data = loadTrackingData();
    var uuid = player.getUUID();

    if (!data[uuid] || !data[uuid].Trackers || !data[uuid].Trackers[tag]) {
        return -1;
    }

    var tracker = data[uuid].Trackers[tag];
    var time = tracker.CreditTime || 0;

    if (tracker.Active && tracker.StartTime !== null) {
        time += new Date().getTime() - tracker.StartTime;
    }

    return time;
}

/**
 * Checks whether a tracker currently exists and is active.
 *
 * @param {IPlayer} player - The player being tracked.
 * @param {string} tag - Tracker tag.
 * @returns {boolean} True if active.
 */
function isTimeTracking(player, tag) {
    var data = loadTrackingData();
    var uuid = player.getUUID();

    if (!data[uuid] || !data[uuid].Trackers || !data[uuid].Trackers[tag]) {
        return false;
    }

    return data[uuid].Trackers[tag].Active === true;
}

/**
 * Deletes a tracker entirely.
 *
 * If the player has no trackers remaining afterwards,
 * their entire entry is removed from tracking.json.
 *
 * @param {IPlayer} player - The player whose tracker should be deleted.
 * @param {string} tag - Tracker tag.
 * @returns {boolean} True if deleted, false if it did not exist.
 */
function deleteTimeTracking(player, tag) {
    var data = loadTrackingData();
    var uuid = player.getUUID();

    if (!data[uuid] || !data[uuid].Trackers || !data[uuid].Trackers[tag]) {
        return false;
    }

    delete data[uuid].Trackers[tag];

    if (Object.keys(data[uuid].Trackers).length === 0) {
        delete data[uuid];
    }

    saveJson(data, TRACKING_DATA_PATH);
    return true;
}

/**
 * Handles a tracked player's login.
 *
 * Every active tracker begins a new online-time interval.
 *
 * @param {IPlayer} player - Player logging in.
 */
function handleTimeTrackingLogin(player) {
    var data = loadTrackingData();
    var uuid = player.getUUID();

    if (!data[uuid] || !data[uuid].Trackers) {
        return;
    }

    data[uuid].Name = player.getName();

    var now = new Date().getTime();
    var changed = false;

    for (var tag in data[uuid].Trackers) {
        var tracker = data[uuid].Trackers[tag];

        if (tracker.Active) {
            tracker.StartTime = now;
            changed = true;
        }
    }

    if (changed) {
        saveJson(data, TRACKING_DATA_PATH);
    }
}

/**
 * Handles a tracked player's logout.
 *
 * Accumulates the current online interval for every active tracker,
 * then clears StartTime so offline time is not counted.
 *
 * @param {IPlayer} player - Player logging out.
 */
function handleTimeTrackingLogout(player) {
    var data = loadTrackingData();
    var uuid = player.getUUID();

    if (!data[uuid] || !data[uuid].Trackers) {
        return;
    }

    var now = new Date().getTime();
    var changed = false;

    for (var tag in data[uuid].Trackers) {
        var tracker = data[uuid].Trackers[tag];

        if (tracker.Active && tracker.StartTime !== null) {
            tracker.CreditTime += now - tracker.StartTime;
            tracker.StartTime = null;
            changed = true;
        }
    }

    if (changed) {
        saveJson(data, TRACKING_DATA_PATH);
    }
}

/**
 * Loads tracking data.
 *
 * @returns {Object} Tracking data, or an empty object if no file exists yet.
 */
function loadTrackingData() {
    var data = loadJson(TRACKING_DATA_PATH);
    return data || {};
}

/**
 * Resets the accumulated time of a tracker without deleting it.
 *
 * If active, a new online interval starts immediately.
 * If inactive, StartTime remains null.
 *
 * @param {IPlayer} player
 * @param {string} tag
 * @returns {boolean} True if reset, false if tracker does not exist.
 */
function resetTimeTracking(player, tag) {
    var data = loadTrackingData();
    var uuid = player.getUUID();

    if (
        !data[uuid] ||
        !data[uuid].Trackers ||
        !data[uuid].Trackers[tag]
    ) {
        return false;
    }

    var tracker = data[uuid].Trackers[tag];

    tracker.CreditTime = 0;

    if (tracker.Active) {
        tracker.StartTime = new Date().getTime();
    } else {
        tracker.StartTime = null;
    }

    saveJson(data, TRACKING_DATA_PATH);
    return true;
}
