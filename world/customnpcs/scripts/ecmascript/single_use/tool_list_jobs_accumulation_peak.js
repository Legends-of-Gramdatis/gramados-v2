// Single-use debug item: list max concurrent job accumulation for all registered players.
// Output is sorted ascending by peak, so the highest accumulator is shown last.

load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");

var JOBS_DATA_PATH = "world/customnpcs/scripts/data_auto/jobs.json";

function interact(event) {
    var player = event.player;
    var data = loadJson(JOBS_DATA_PATH);

    if (!data) {
        tellPlayer(player, "&c[Jobs Peak] Could not load jobs.json.");
        return;
    }

    var rows = [];
    for (var uuid in data) {
        if (!data.hasOwnProperty(uuid)) continue;

        var entry = data[uuid] || {};
        var name = entry.Name || uuid;
        var peak = getPeakAccumulationFromEntry(entry);
        var activeCount = countObjectKeys(entry.ActiveJobs || {});
        var historyCount = countObjectKeys(entry.JobHistory || {});

        rows.push({
            name: name,
            uuid: uuid,
            peak: peak,
            activeCount: activeCount,
            historyCount: historyCount
        });
    }

    if (rows.length === 0) {
        tellPlayer(player, "&e[Jobs Peak] No registered players found in jobs.json.");
        return;
    }

    rows.sort(function (a, b) {
        if (a.peak !== b.peak) return a.peak - b.peak;
        var an = (a.name || "").toLowerCase();
        var bn = (b.name || "").toLowerCase();
        if (an < bn) return -1;
        if (an > bn) return 1;
        return 0;
    });

    tellPlayer(player, "&b[Jobs Peak] Registered players: &e" + rows.length);
    tellPlayer(player, "&7Sorted by max concurrent jobs accumulated (lowest -> highest):");

    for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        tellPlayer(
            player,
            "&7- &f" + r.name +
            "&7 | peak: &e" + r.peak +
            "&7 | active: &f" + r.activeCount +
            "&7 | history: &f" + r.historyCount
        );
    }

    var top = rows[rows.length - 1];
    tellPlayer(
        player,
        "&6[Top Accumulation] &f" + top.name +
        " &7reached a max of &e" + top.peak + "&7 concurrent jobs."
    );
}

function getPeakAccumulationFromEntry(entry) {
    var history = entry.JobHistory || {};
    var active = entry.ActiveJobs || {};

    var events = [];
    var activeWithoutTime = 0;

    for (var historyKey in history) {
        if (!history.hasOwnProperty(historyKey)) continue;
        var h = history[historyKey] || {};

        if (h.StartTime !== undefined && h.StartTime !== null) {
            events.push({ time: h.StartTime, delta: 1 });
        }
        if (h.EndTime !== undefined && h.EndTime !== null) {
            events.push({ time: h.EndTime, delta: -1 });
        }
    }

    for (var activeKey in active) {
        if (!active.hasOwnProperty(activeKey)) continue;
        var a = active[activeKey] || {};

        if (a.StartTime !== undefined && a.StartTime !== null) {
            events.push({ time: a.StartTime, delta: 1 });
        } else {
            activeWithoutTime++;
        }
    }

    if (events.length === 0) {
        var activeCount = countObjectKeys(active);
        if (activeCount > activeWithoutTime) return activeCount;
        return activeWithoutTime;
    }

    events.sort(function (x, y) {
        if (x.time === y.time) {
            // End events first on same tick to avoid overcounting instant transitions.
            return x.delta - y.delta;
        }
        return x.time - y.time;
    });

    var current = 0;
    var peak = 0;
    for (var i = 0; i < events.length; i++) {
        current += events[i].delta;
        if (current > peak) peak = current;
    }

    var currentWithUnknownStarts = current + activeWithoutTime;
    if (currentWithUnknownStarts > peak) {
        peak = currentWithUnknownStarts;
    }

    if (peak < 0) peak = 0;
    return peak;
}

function countObjectKeys(obj) {
    var n = 0;
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) n++;
    }
    return n;
}
