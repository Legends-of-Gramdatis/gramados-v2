load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_volatile_loot_pools.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js');
load('world/customnpcs/scripts/ecmascript/modules/casino/utils_casino_stats.js');
load('world/customnpcs/scripts/ecmascript/modules/casino/utils_casino_rewards.js');

var GEM_MACHINE_CONFIG_PATH =
    'world/customnpcs/scripts/ecmascript/modules/casino/gem_machine_config.json';
var GEM_MACHINE_CASINOS_PATH =
    'world/customnpcs/scripts/ecmascript/modules/casino/casinos.json';
var GEM_MACHINE_CASINO_ID_KEY = 'casino_id';

var GEM_MACHINE_ADMIN_CARD = 'mts:ivv.idcard_seagull';
var GEM_MACHINE_ADMIN_LINK = 'minecraft:nether_star';
var GEM_MACHINE_ADMIN_RESET = 'minecraft:barrier';

function loadGemMachineConfig() {
    return loadJson(GEM_MACHINE_CONFIG_PATH);
}

function loadGemMachineCasinos() {
    return loadJson(GEM_MACHINE_CASINOS_PATH);
}

function getGemMachinePoolAlias(casinoId) {
    var config = loadGemMachineConfig();
    if (!config || !config.volatile_loot_pools) return null;
    return config.volatile_loot_pools[casinoId] || null;
}

function getGemMachinePoolConfig(casinoId) {
    var alias = getGemMachinePoolAlias(casinoId);
    return alias ? getVolatileLootPoolConfig(alias) : null;
}

function getGemMachineLootTablePath(casinoId) {
    var poolConfig = getGemMachinePoolConfig(casinoId);
    return poolConfig ? poolConfig.LootTablePath : null;
}

function getGemMachineFullLootTablePath(casinoId) {
    var poolConfig = getGemMachinePoolConfig(casinoId);
    return poolConfig ? getVolatileLootPoolFullPath(poolConfig) : null;
}

function getGemMachineCooldownMs() {
    return Number(loadGemMachineConfig().cooldown_minutes) * 60 * 1000;
}

function getGemMachineKeyRewardEvery() {
    return Number(loadGemMachineConfig().key_reward_every);
}

function getGemMachineLinkedCasino(npc) {
    var stored = npc.getStoreddata();
    if (!stored.has(GEM_MACHINE_CASINO_ID_KEY)) return null;

    var casinoId = String(stored.get(GEM_MACHINE_CASINO_ID_KEY));
    var casinos = loadGemMachineCasinos();
    var casino = casinos[casinoId];

    if (!casino) return null;

    return {
        id: casinoId,
        name: casino.DisplayName,
        town: casino.Town || '',
        island: casino.Island || '',
        region: casino.Region
    };
}

function getGemMachineRegionsAtNpc(npc) {
    return getAllRegionsAtPosition(iposToPos(npc.getPos())) || [];
}

function isGemMachineNpcInsideCasino(npc, casino) {
    return getGemMachineRegionsAtNpc(npc).indexOf(casino.region) !== -1;
}

function getGemMachineCasinoAtNpc(npc) {
    var casinos = loadGemMachineCasinos();
    var regions = getGemMachineRegionsAtNpc(npc);
    var ids = Object.keys(casinos);

    for (var i = 0; i < ids.length; i++) {
        var casino = casinos[ids[i]];
        if (casino.Region && regions.indexOf(casino.Region) !== -1) {
            return {
                id: ids[i],
                name: casino.DisplayName,
                town: casino.Town || '',
                island: casino.Island || '',
                region: casino.Region
            };
        }
    }

    return null;
}

function isGemMachineAdmin(player) {
    var offhand = player.getOffhandItem();
    return offhand &&
        !offhand.isEmpty() &&
        offhand.getName() === GEM_MACHINE_ADMIN_CARD;
}

function showGemMachineAdminStatus(npc, player) {
    var casino = getGemMachineLinkedCasino(npc);

    tellPlayer(player, '&6[Gem Machine Admin] &eCurrent configuration:');

    if (!casino) {
        tellPlayer(player, '&7- Casino: &cNot linked');
    } else {
        tellPlayer(
            player,
            '&7- Casino: &e' + casino.name + ' &7(' + casino.id + ')'
        );
        tellPlayer(player, '&7- Region: &f' + casino.region);
        tellPlayer(
            player,
            '&7- Region match: ' +
            (isGemMachineNpcInsideCasino(npc, casino)
                ? '&aValid'
                : '&cOutside linked region')
        );
        var poolAlias = getGemMachinePoolAlias(casino.id);
        var poolPath = getGemMachineFullLootTablePath(casino.id);

        tellPlayer(
            player,
            '&7- VLP alias: ' + (poolAlias ? '&f' + poolAlias : '&cNot configured')
        );
        tellPlayer(
            player,
            '&7- Loot pool: &f' + (getGemMachineLootTablePath(casino.id) || 'N/A')
        );
        tellPlayer(
            player,
            '&7- Pool file: ' +
            (poolPath && checkFileExists(poolPath)
                ? '&aFound'
                : '&cMissing')
        );
    }

    tellPlayer(player, '&7Nether Star: link this NPC to the casino at its position.');
    tellPlayer(player, '&7Barrier: clear casino link.');
}

function handleGemMachineAdminInteraction(npc, player) {
    var mainhand = player.getMainhandItem();

    if (!mainhand || mainhand.isEmpty()) {
        showGemMachineAdminStatus(npc, player);
        return true;
    }

    if (mainhand.getName() === GEM_MACHINE_ADMIN_RESET) {
        npc.getStoreddata().remove(GEM_MACHINE_CASINO_ID_KEY);
        tellPlayer(player, '&a[Gem Machine Admin] Casino link cleared.');
        return true;
    }

    if (mainhand.getName() === GEM_MACHINE_ADMIN_LINK) {
        var casino = getGemMachineCasinoAtNpc(npc);

        if (!casino) {
            tellPlayer(
                player,
                '&c[Gem Machine Admin] No defined casino matches this NPC position.'
            );
            return true;
        }

        npc.getStoreddata().put(GEM_MACHINE_CASINO_ID_KEY, casino.id);
        tellPlayer(
            player,
            '&a[Gem Machine Admin] Linked to &e' + casino.name +
            '&a &7(' + casino.id + ')'
        );
        return true;
    }

    tellPlayer(
        player,
        '&c[Gem Machine Admin] Use a Nether Star to link, a Barrier to reset, or an empty main hand for status.'
    );
    return true;
}

function getUsableGemMachineCasino(npc, player) {
    var casino = getGemMachineLinkedCasino(npc);

    if (!casino) {
        tellPlayer(
            player,
            '&c&lThis gem machine is not linked to a valid casino. Please contact an admin.'
        );
        return null;
    }

    if (!isGemMachineNpcInsideCasino(npc, casino)) {
        tellPlayer(
            player,
            '&c&lThis gem machine is outside its linked casino region. Please contact an admin.'
        );
        return null;
    }

    var poolAlias = getGemMachinePoolAlias(casino.id);
    var poolConfig = getGemMachinePoolConfig(casino.id);
    var poolPath = getGemMachineFullLootTablePath(casino.id);

    if (!poolAlias || !poolConfig) {
        tellPlayer(
            player,
            '&c&lThis casino has no valid gem machine VLP configured. Please contact an admin.'
        );
        return null;
    }

    if (!poolPath || !checkFileExists(poolPath)) {
        tellPlayer(
            player,
            '&c&lThis casino gem pool is missing. Please contact an admin.'
        );
        return null;
    }

    return casino;
}

function getGemMachinePlayerData(player, casinoId) {
    var uuid = String(player.getUUID());
    var gambler = loadCasinoGambler(uuid, String(player.getName()));
    var stats = ensurePlayerGemMachineStats(gambler, casinoId);

    return {
        uuid: uuid,
        gambler: gambler,
        stats: stats
    };
}

function saveGemMachinePlayerData(playerData) {
    saveCasinoGambler(playerData.uuid, playerData.gambler);
}

function getGemMachineCooldownRemaining(stats) {
    var readyAt =
        Number(stats.last_gamble_timestamp || 0) +
        getGemMachineCooldownMs();

    return Math.max(0, readyAt - Date.now());
}

function formatGemMachineDuration(milliseconds) {
    var totalSeconds = Math.ceil(milliseconds / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return minutes + 'm ' + seconds + 's';
}

function getGemMachineItemDamage(itemStack) {
    if (typeof itemStack.getItemDamage === 'function') {
        return Number(itemStack.getItemDamage());
    }

    return Number(itemStack.getDamage());
}

function createGemMachineEntry(itemStack) {
    var count = Number(itemStack.getStackSize());
    var damage = getGemMachineItemDamage(itemStack);

    var entry = {
        type: 'item',
        name: String(itemStack.getName()),
        weight: count,
        volatile: true,
        stock: count
    };

    if (damage !== 0) {
        entry.functions = [
            {
                function: 'set_data',
                data: damage
            }
        ];
    }

    return entry;
}

function isGemMachineAcceptedItem(casinoId, itemStack) {
    var poolConfig = getGemMachinePoolConfig(casinoId);

    if (!poolConfig || !poolConfig.WhitelistLootTable) {
        return false;
    }

    if (!doesLootTableExist(poolConfig.WhitelistLootTable)) {
        return false;
    }

    return isItemInLootTable(
        poolConfig.WhitelistLootTable,
        itemStack.getName(),
        getGemMachineItemDamage(itemStack)
    );
}

function syncGemMachineWeights(casinoId) {
    var path = getGemMachineFullLootTablePath(casinoId);
    var table = loadJson(path);
    var totalStock = 0;

    for (var p = 0; p < table.pools.length; p++) {
        var entries = table.pools[p].entries;

        for (var e = 0; e < entries.length; e++) {
            if (entries[e].volatile === true) {
                entries[e].weight = Number(entries[e].stock);
                totalStock += Number(entries[e].stock);
            }
        }
    }

    saveJson(table, path);
    return totalStock;
}
