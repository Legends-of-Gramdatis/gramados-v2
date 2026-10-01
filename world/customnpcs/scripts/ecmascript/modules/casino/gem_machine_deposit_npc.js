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

    var mainhand = player.getMainhandItem();
    if (!mainhand || mainhand.isEmpty()) {
        tellPlayer(player, '&eHold a gem in your main hand to deposit it.');
        return;
    }

    if (!isGemMachineAcceptedItem(mainhand)) {
        tellPlayer(player, '&cThat item is not accepted by this gem machine.');
        return;
    }

    var submittedCount = Number(mainhand.getStackSize());
    var entry = createGemMachineEntry(mainhand);

    var inserted = addEntryToLootTable(
        getGemMachineLootTablePath(casino.id),
        entry,
        0,
        false
    );

    if (!inserted) {
        tellPlayer(
            player,
            '&c&lThe gem could not be added to the casino pool. Please contact an admin.'
        );
        return;
    }

    var playerData = getGemMachinePlayerData(player, casino.id);
    playerData.stats.staged_gems += submittedCount;
    saveGemMachinePlayerData(playerData);

    player.setMainhandItem(
        player.getWorld().createItem('minecraft:air', 0, 1)
    );

    tellPlayer(
        player,
        '&a:check_mark: Deposited &e' + submittedCount +
        '&a gem' + (submittedCount === 1 ? '' : 's') +
        '. &7Staged: &e' + playerData.stats.staged_gems
    );
}
