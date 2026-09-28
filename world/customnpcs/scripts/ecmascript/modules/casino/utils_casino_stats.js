load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

// Persistent runtime statistics are intentionally separate from casino definitions.
// The JSONL audit file provides one detailed event per successfully opened crate.
var CASINO_STATS_PATH = 'world/customnpcs/scripts/data_auto/casinos.json';
var CASINO_CRATE_AUDIT_PATH = 'world/customnpcs/scripts/logs/casino_crates.jsonl';

function loadCasinoStats() {
    if (!checkFileExists(CASINO_STATS_PATH)) return {};
    return loadJson(CASINO_STATS_PATH);
}

function ensureCasinoStats(data, casinoId) {
    if (!data[casinoId]) data[casinoId] = {};
    var casino = data[casinoId];
    if (!casino.CratesOpened) casino.CratesOpened = {Total: 0, ByType: {}, ByDate: {}};
    if (!casino.CratesOpened.ByType) casino.CratesOpened.ByType = {};
    if (!casino.CratesOpened.ByDate) casino.CratesOpened.ByDate = {};
    if (!casino.RewardsDistributed) casino.RewardsDistributed = {TotalStacks: 0, TotalItems: 0, ByItem: {}};
    if (!casino.RewardsDistributed.ByItem) casino.RewardsDistributed.ByItem = {};
    if (!casino.Players) casino.Players = {};
    return casino;
}

function casinoRewardSummary(item) {
    // Item ID + metadata + count are sufficient for economy statistics.
    // Deliberately do not log full reward NBT or sensitive item payloads.
    return {
        Item: String(item.getName()),
        Damage: Number(item.getItemDamage()),
        Count: Number(item.getStackSize())
    };
}

function casinoCratePosition(npc) {
    var pos = npc.getPos();
    return {x: Number(pos.getX()), y: Number(pos.getY()), z: Number(pos.getZ())};
}

function appendCasinoAuditEvent(event) {
    var writer = new java.io.FileWriter(CASINO_CRATE_AUDIT_PATH, true);
    try {
        writer.write(JSON.stringify(event) + '\n');
    } finally {
        writer.close();
    }
}

/**
 * Record a completed crate opening, not a prepared or attempted one.
 * This function is deliberately independent of crate NPC state so that
 * other casino activities can later reuse the same casino ID.
 */
function recordCasinoCrateOpen(casinoId, casinoName, crate, npc, player, key, rewards) {
    var now = new Date();
    var stamp = now.toISOString();
    var date = stamp.slice(0, 10);
    var uuid = String(player.getUUID());
    var summary = [];
    for (var i = 0; i < rewards.length; i++) summary.push(casinoRewardSummary(rewards[i]));
    var event = {
        Time: stamp,
        Event: 'crate_opened',
        Casino: casinoId,
        CasinoName: casinoName,
        CrateType: crate.type,
        CrateName: crate.name,
        LootTable: crate.lootTable,
        PlayerUUID: uuid,
        PlayerName: String(player.getName()),
        KeyItem: String(key.getName()),
        Position: casinoCratePosition(npc),
        Rewards: summary
    };

    // Audit trail is written first so aggregated statistics can be rebuilt
    // from successful events if a later stats-file write fails.
    var auditOk = true;
    try {
        appendCasinoAuditEvent(event);
    } catch (e) {
        auditOk = false;
        java.lang.System.err.println('[Casino] Failed to append crate audit: ' + e);
    }

    var statsOk = true;
    try {
        var data = loadCasinoStats();
        if (!data) throw new Error('Failed to load casino statistics; refusing to overwrite data.');
        var casino = ensureCasinoStats(data, casinoId);
        var opened = casino.CratesOpened;
        opened.Total++;
        opened.ByType[crate.type] = (opened.ByType[crate.type] || 0) + 1;
        opened.ByDate[date] = (opened.ByDate[date] || 0) + 1;
        casino.LastOpenedAt = stamp;

        var playerStats = casino.Players[uuid];
        if (!playerStats) {
            playerStats = {Name: String(player.getName()), CratesOpened: {Total: 0, ByType: {}}};
            casino.Players[uuid] = playerStats;
        }
        playerStats.Name = String(player.getName());
        playerStats.CratesOpened.Total++;
        playerStats.CratesOpened.ByType[crate.type] = (playerStats.CratesOpened.ByType[crate.type] || 0) + 1;
        playerStats.LastOpenedAt = stamp;

        var distributed = casino.RewardsDistributed;
        for (var j = 0; j < summary.length; j++) {
            var reward = summary[j];
            var itemKey = reward.Item + ':' + reward.Damage;
            distributed.TotalStacks++;
            distributed.TotalItems += reward.Count;
            distributed.ByItem[itemKey] = (distributed.ByItem[itemKey] || 0) + reward.Count;
        }
        saveJson(data, CASINO_STATS_PATH);
    } catch (e2) {
        statsOk = false;
        java.lang.System.err.println('[Casino] Failed to update crate statistics: ' + e2);
    }

    // Human-readable activity log; structured details stay in the JSONL
    // audit trail and the aggregated statistics JSON.
    var rewardText = [];
    for (var k = 0; k < summary.length; k++) {
        rewardText.push(summary[k].Count + 'x ' + summary[k].Item);
    }

    logToFile(
        'casino',
        player.getName() + ' opened ' + crate.name + ' at ' + casinoName +
        ' and received ' + rewardText.join(', ') + '.'
    );

    return auditOk && statsOk;
}
