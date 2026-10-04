load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

// Casino runtime data is split by casino and by gambler UUID.
var CASINO_DATA_DIR = 'world/customnpcs/scripts/data_auto/casinos';
var CASINO_GAMBLERS_DIR = CASINO_DATA_DIR + '/gamblers';
var CASINO_CRATE_AUDIT_PATH = 'world/customnpcs/scripts/logs/casino_crates.jsonl';

function ensureCasinoDataDirectories() {
    new java.io.File(CASINO_DATA_DIR).mkdirs();
    new java.io.File(CASINO_GAMBLERS_DIR).mkdirs();
}

function casinoStatsPath(casinoId) {
    return CASINO_DATA_DIR + '/' + casinoId + '.json';
}

function casinoGamblerPath(uuid) {
    return CASINO_GAMBLERS_DIR + '/' + uuid + '.json';
}

function loadCasinoStats(casinoId) {
    var path = casinoStatsPath(casinoId);
    if (!checkFileExists(path)) return {};
    return loadJson(path);
}

function saveCasinoStats(casinoId, data) {
    ensureCasinoDataDirectories();
    saveJson(data, casinoStatsPath(casinoId));
}

function ensureCasinoStats(data, casinoId, casinoName) {
    data.Version = 1;
    data.Casino = casinoId;
    data.Name = casinoName || data.Name || casinoId;
    if (!data.CratesOpened) data.CratesOpened = {Total: 0, ByType: {}, ByDate: {}};
    if (!data.CratesOpened.ByType) data.CratesOpened.ByType = {};
    if (!data.CratesOpened.ByDate) data.CratesOpened.ByDate = {};
    if (!data.loot_box_rewards) {
        data.loot_box_rewards = {TotalStacks: 0, TotalItems: 0, ByItem: {}};
    }
    if (!data.loot_box_rewards.ByItem) data.loot_box_rewards.ByItem = {};
    if (!data.awarded_keys) data.awarded_keys = {};
    return data;
}

function loadCasinoGambler(uuid, playerName) {
    var path = casinoGamblerPath(uuid);
    var data = checkFileExists(path) ? loadJson(path) : {};
    if (!data) data = {};

    data.Version = 1;
    data.UUID = uuid;
    data.Name = playerName || data.Name || '';
    if (!data.Games) data.Games = {};
    if (!data.Games.loot_crates) data.Games.loot_crates = {};
    if (!data.Games.gem_machine) data.Games.gem_machine = {};
    return data;
}

function saveCasinoGambler(uuid, data) {
    ensureCasinoDataDirectories();
    saveJson(data, casinoGamblerPath(uuid));
}

function ensurePlayerLootCrateStats(gambler, casinoId) {
    var games = gambler.Games;
    if (!games.loot_crates[casinoId]) {
        games.loot_crates[casinoId] = {
            Timestamp: 0,
            CratesOpened: {Total: 0, ByType: {}}
        };
    }

    var stats = games.loot_crates[casinoId];
    if (!stats.CratesOpened) stats.CratesOpened = {Total: 0, ByType: {}};
    if (!stats.CratesOpened.ByType) stats.CratesOpened.ByType = {};
    return stats;
}

function ensurePlayerGemMachineStats(gambler, casinoId) {
    var games = gambler.Games;
    if (!games.gem_machine) games.gem_machine = {};

    if (!games.gem_machine[casinoId]) {
        games.gem_machine[casinoId] = {
            last_gamble_timestamp: 0,
            staged_gems: 0,
            total_pulled: 0,
            time_played: 0,
            awarded_keys: {}
        };
    }

    var stats = games.gem_machine[casinoId];
    if (!stats.awarded_keys) stats.awarded_keys = {};
    return stats;
}

function incrementCasinoAwardedKey(casinoId, casinoName, crateType) {
    var casino = ensureCasinoStats(
        loadCasinoStats(casinoId),
        casinoId,
        casinoName
    );

    casino.awarded_keys[crateType] =
        Number(casino.awarded_keys[crateType] || 0) + 1;

    saveCasinoStats(casinoId, casino);
}

function incrementPlayerAwardedKey(playerStats, crateType) {
    if (!playerStats.awarded_keys) playerStats.awarded_keys = {};

    playerStats.awarded_keys[crateType] =
        Number(playerStats.awarded_keys[crateType] || 0) + 1;
}

function casinoRewardSummary(item) {
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
 * Record a completed crate opening.
 *
 * Aggregate casino data is stored in one JSON file per casino.
 * Per-player casino data is stored once per UUID and groups activity across casinos.
 */
function recordCasinoCrateOpen(casinoId, casinoName, crate, npc, player, key, rewards) {
    var timestamp = Date.now();
    // ByDate intentionally remains YYYY-MM-DD because it is useful for daily summaries.
    var date = new Date(timestamp).toISOString().slice(0, 10);
    var uuid = String(player.getUUID());
    var playerName = String(player.getName());
    var summary = [];

    for (var i = 0; i < rewards.length; i++) {
        summary.push(casinoRewardSummary(rewards[i]));
    }

    appendCasinoAuditEvent({
        Time: timestamp,
        Event: 'crate_opened',
        Casino: casinoId,
        CasinoName: casinoName,
        CrateType: crate.type,
        CrateName: crate.name,
        LootTable: crate.lootTable,
        PlayerUUID: uuid,
        PlayerName: playerName,
        KeyItem: String(key.getName()),
        Position: casinoCratePosition(npc),
        Rewards: summary
    });

    var casino = ensureCasinoStats(loadCasinoStats(casinoId), casinoId, casinoName);
    casino.Timestamp = timestamp;
    casino.CratesOpened.Total++;
    casino.CratesOpened.ByType[crate.type] =
        (casino.CratesOpened.ByType[crate.type] || 0) + 1;
    casino.CratesOpened.ByDate[date] =
        (casino.CratesOpened.ByDate[date] || 0) + 1;

    for (var j = 0; j < summary.length; j++) {
        var reward = summary[j];
        var itemKey = reward.Item + ':' + reward.Damage;
        casino.loot_box_rewards.TotalStacks++;
        casino.loot_box_rewards.TotalItems += reward.Count;
        casino.loot_box_rewards.ByItem[itemKey] =
            (casino.loot_box_rewards.ByItem[itemKey] || 0) + reward.Count;
    }

    saveCasinoStats(casinoId, casino);

    var gambler = loadCasinoGambler(uuid, playerName);
    gambler.Name = playerName;
    var playerStats = ensurePlayerLootCrateStats(gambler, casinoId);
    playerStats.Timestamp = timestamp;
    playerStats.CratesOpened.Total++;
    playerStats.CratesOpened.ByType[crate.type] =
        (playerStats.CratesOpened.ByType[crate.type] || 0) + 1;
    saveCasinoGambler(uuid, gambler);

    var rewardText = [];
    for (var k = 0; k < summary.length; k++) {
        rewardText.push(summary[k].Count + 'x ' + summary[k].Item);
    }

    logToFile(
        'casino',
        playerName + ' opened ' + crate.name + ' at ' + casinoName +
        ' and received ' + rewardText.join(', ') + '.'
    );
}


/**
 * Records a completed custom-reward casino crate opening.
 * Custom rewards are audited and count toward crate totals, but are not added
 * to item-based loot_box_rewards statistics.
 */
function recordCasinoCustomCrateOpen(
    casinoId,
    casinoName,
    crate,
    npc,
    player,
    key,
    rewardType,
    rewards
) {
    var timestamp = Date.now();
    var date = new Date(timestamp).toISOString().slice(0, 10);
    var uuid = String(player.getUUID());
    var playerName = String(player.getName());
    var auditRewards = [];

    for (var i = 0; i < rewards.length; i++) {
        auditRewards.push({
            Type: rewardType,
            Id: String(rewards[i])
        });
    }

    appendCasinoAuditEvent({
        Time: timestamp,
        Event: 'crate_opened',
        Casino: casinoId,
        CasinoName: casinoName,
        CrateType: crate.type,
        CrateName: crate.name,
        RewardHandler: crate.rewardHandler,
        PlayerUUID: uuid,
        PlayerName: playerName,
        KeyItem: String(key.getName()),
        Position: casinoCratePosition(npc),
        Rewards: auditRewards
    });

    var casino = ensureCasinoStats(loadCasinoStats(casinoId), casinoId, casinoName);
    casino.Timestamp = timestamp;
    casino.CratesOpened.Total++;
    casino.CratesOpened.ByType[crate.type] =
        (casino.CratesOpened.ByType[crate.type] || 0) + 1;
    casino.CratesOpened.ByDate[date] =
        (casino.CratesOpened.ByDate[date] || 0) + 1;
    saveCasinoStats(casinoId, casino);

    var gambler = loadCasinoGambler(uuid, playerName);
    gambler.Name = playerName;
    var playerStats = ensurePlayerLootCrateStats(gambler, casinoId);
    playerStats.Timestamp = timestamp;
    playerStats.CratesOpened.Total++;
    playerStats.CratesOpened.ByType[crate.type] =
        (playerStats.CratesOpened.ByType[crate.type] || 0) + 1;
    saveCasinoGambler(uuid, gambler);

    logToFile(
        'casino',
        playerName + ' opened ' + crate.name + ' at ' + casinoName +
        ' and unlocked ' + rewards.join(', ') + '.'
    );
}
