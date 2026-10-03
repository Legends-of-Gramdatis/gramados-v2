load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/modules/casino/utils_casino_stats.js');

var CASINO_KEY_LOOT_TABLE_ROOT = 'casino/keys/';

function playCasinoMilestoneEffects(npc) {
    npc.getWorld().playSoundAt(
        npc.getPos(),
        'minecraft:entity.experience_orb.pickup',
        1,
        1
    );

    npc.executeCommand(
        '/particle fireworksSpark ' +
        npc.getX() + ' ' + (npc.getY() + 1) + ' ' + npc.getZ() +
        ' 0.45 0.55 0.45 0.08 28 normal @a[r=16]'
    );
}

function getCasinoKeyLootTable(crateType) {
    return CASINO_KEY_LOOT_TABLE_ROOT + crateType + '.json';
}

function rewardCasinoKey(
    casinoId,
    casinoName,
    npc,
    player,
    crateType,
    playerStats
) {
    var loot = pullLootTable(
        getCasinoKeyLootTable(crateType),
        player
    );

    if (!loot || loot.length !== 1) {
        tellPlayer(
            player,
            '&c&lCasino reward error: the milestone key could not be generated. Please contact an admin.'
        );
        return false;
    }

    var key = generateItemStackFromLootEntry(
        loot[0],
        player.getWorld(),
        player
    );

    if (!key || key.isEmpty()) {
        tellPlayer(
            player,
            '&c&lCasino reward error: the milestone key could not be generated. Please contact an admin.'
        );
        return false;
    }

    if (!player.giveItem(key)) {
        player.dropItem(key);
    }

    incrementCasinoAwardedKey(
        casinoId,
        casinoName,
        crateType
    );

    if (playerStats) {
        incrementPlayerAwardedKey(
            playerStats,
            crateType
        );
    }

    logToFile(
        'casino',
        player.getName() + " received a '" +
        stripColors(key.getDisplayName()) +
        "' milestone key at " + casinoName +
        " for crate type '" + crateType + "'."
    );

    return true;
}
