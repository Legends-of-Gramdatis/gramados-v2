load('world/customnpcs/scripts/ecmascript/modules/casino/gem_machine_utils.js');

function interact(event) {
    var npc = event.npc;
    var player = event.player;

    if (isGemMachineAdmin(player)) {
        handleGemMachineAdminInteraction(npc, player);
        return;
    }

    var casino = getUsableGemMachineCasino(npc, player);
    if (!casino) return;

    npc.getWorld().playSoundAt(
        npc.getPos(),
        'ivv:computer.gaming.deleted',
        1,
        1
    );

    var playerData = getGemMachinePlayerData(player, casino.id);
    var stats = playerData.stats;

    if (Number(stats.staged_gems) <= 0) {
        tellPlayer(player, '&eYou have no staged gems to gamble.');
        return;
    }

    var cooldown = getGemMachineCooldownRemaining(stats);
    if (cooldown > 0) {
        tellPlayer(
            player,
            '&eYou can use the gem machine again in &6' +
            formatGemMachineDuration(cooldown) + '&e.'
        );
        return;
    }

    var staged = Number(stats.staged_gems);
    var totalStock = syncGemMachineWeights(casino.id);

    if (totalStock < staged) {
        tellPlayer(
            player,
            '&c&lGEM MACHINE ERROR: The casino gem pool has less stock than your staged gems. Please contact an admin.'
        );
        return;
    }

    var loot = multiplePullLootTable(
        getGemMachineLootTablePath(casino.id),
        player,
        staged
    );

    if (!loot || loot.length !== staged) {
        tellPlayer(
            player,
            '&c&lGEM MACHINE ERROR: The gem pool changed during your gamble. Please contact an admin.'
        );
        return;
    }

    var rewards = [];
    for (var i = 0; i < loot.length; i++) {
        var reward = generateItemStackFromLootEntry(
            loot[i],
            player.getWorld(),
            player
        );

        if (!reward || reward.isEmpty()) {
            tellPlayer(
                player,
                '&c&lGEM MACHINE ERROR: A reward could not be generated. Please contact an admin.'
            );
            return;
        }

        rewards.push(reward);
    }

    stats.staged_gems = 0;
    stats.total_pulled += staged;
    stats.time_played += 1;
    stats.last_gamble_timestamp = Date.now();

    var keyRewardEvery = getGemMachineKeyRewardEvery();
    var milestoneReached =
        keyRewardEvery > 0 &&
        stats.time_played % keyRewardEvery === 0;

    if (milestoneReached) {
        if (
            rewardCasinoKey(
                casino.id,
                casino.name,
                npc,
                player,
                'gems',
                stats
            )
        ) {
            tellPlayer(
                player,
                '&6&lMilestone reached! &eYou received a Gem Collector\'s Key for ' +
                stats.time_played + ' gem machine plays at ' + casino.name + '.'
            );
            playCasinoMilestoneEffects(npc);
        }
    }

    saveGemMachinePlayerData(playerData);

    var rewardTotals = {};

    for (var r = 0; r < rewards.length; r++) {
        var rewardName = stripColors(rewards[r].getDisplayName());
        var rewardCount = Number(rewards[r].getStackSize());
        rewardTotals[rewardName] =
            Number(rewardTotals[rewardName] || 0) + rewardCount;

        if (!player.giveItem(rewards[r])) {
            player.dropItem(rewards[r]);
        }
    }

    tellPlayer(
        player,
        '&a:check_mark: Pulled &e' + staged +
        '&a gem' + (staged === 1 ? '' : 's') + ' from the machine.'
    );

    var rewardSummary = [];
    for (var rewardName in rewardTotals) {
        rewardSummary.push(
            rewardTotals[rewardName] + "x '" + rewardName + "'"
        );
    }

    logToFile(
        'casino',
        player.getName() + ' used the gem machine at ' + casino.name +
        ' with ' + staged + ' staged gem' + (staged === 1 ? '' : 's') +
        ' and received ' + rewardSummary.join(', ') + '.'
    );
}
