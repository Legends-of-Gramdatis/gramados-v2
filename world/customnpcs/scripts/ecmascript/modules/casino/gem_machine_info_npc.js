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

    var playerData = getGemMachinePlayerData(player, casino.id);
    var stats = playerData.stats;
    var cooldown = getGemMachineCooldownRemaining(stats);

    tellPlayer(player, '&6[Gem Machine] &e' + casino.name);
    tellPlayer(player, '&7Staged gems: &e' + stats.staged_gems);
    tellPlayer(
        player,
        '&7Cooldown: ' +
        (cooldown > 0
            ? '&e' + formatGemMachineDuration(cooldown)
            : '&aReady')
    );
    tellPlayer(player, '&7Times played: &e' + stats.time_played);
    tellPlayer(player, '&7Total gems pulled: &e' + stats.total_pulled);
}
