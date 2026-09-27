load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_item_ownership.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js');
load('world/customnpcs/scripts/ecmascript/modules/casino/utils_casino_stats.js');

// Each NPC stores its crate type, casino association, and enabled state.
// Casino definitions, crate types, and admin items are separate JSON dictionaries.
var CASINO_CRATES_CONFIG = 'world/customnpcs/scripts/ecmascript/modules/casino/crates.json';
var CASINO_ADMIN_ITEMS_CONFIG = 'world/customnpcs/scripts/ecmascript/modules/casino/crate_npc_config.json';
var CASINO_DEFINITIONS_CONFIG = 'world/customnpcs/scripts/ecmascript/modules/casino/casinos.json';
var CASINO_CRATE_TYPE_KEY = 'casino_crate_type';
var CASINO_ID_KEY = 'casino_id';
var CASINO_CRATE_ENABLED_KEY = 'casino_crate_enabled';
var CASINO_ADMIN_CARD = 'mts:ivv.idcard_seagull';
var CASINO_ADMIN_RESET = 'minecraft:barrier';

var CASINO_CRATE_FAILURE_SOUND = 'ivv:mts.ivv.dashboard.angel.no';
var CASINO_CRATE_SUCCESS_SOUND = 'ivv:mts.ivv.dashboard.angel.yes';

// Small local effects only. Unexpected script errors still propagate normally.
function playCasinoCrateFeedback(npc, successful) {
    var sound = successful ? CASINO_CRATE_SUCCESS_SOUND : CASINO_CRATE_FAILURE_SOUND;
    npc.getWorld().playSoundAt(npc.getPos(), sound, 1, 1);

    var particle = successful ? 'fireworksSpark' : 'smoke';
    var count = successful ? 24 : 6;
    npc.executeCommand('/particle ' + particle + ' ' + npc.getX() + ' ' +
        (npc.getY() + 1) + ' ' + npc.getZ() +
        ' 0.35 0.4 0.35 0.05 ' + count + ' normal @a[r=16]');
}

function rejectCasinoCrate(npc, player, message) {
    tellPlayer(player, message);
    playCasinoCrateFeedback(npc, false);
}


function init(event) {
    // Retain the behaviour of crates configured before the enabled switch existed.
    var sd = event.npc.getStoreddata();
    if (sd.has(CASINO_CRATE_TYPE_KEY) && !sd.has(CASINO_CRATE_ENABLED_KEY)) {
        sd.put(CASINO_CRATE_ENABLED_KEY, 1);
    }
}

function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var mainhand = player.getMainhandItem();
    var offhand = player.getOffhandItem();
    var adminItems = loadCasinoAdminItems();

    if (isCasinoAdmin(offhand)) {
        if (!adminItems) {
            tellPlayer(player, '&c[Crate Admin] Failed to load the configuration item dictionary.');
            return;
        }
        handleCasinoAdminInteraction(npc, player, mainhand, adminItems);
        return;
    }

    var crate = getActiveCasinoCrate(npc);
    if (!crate) {
        rejectCasinoCrate(npc, player, '&cThis crate is not configured. Please contact an admin.');
        return;
    }
    var casino = getLinkedCasino(npc);
    if (!casino) {
        rejectCasinoCrate(npc, player, '&cThis crate is not linked to a valid casino. Please contact an admin.');
        return;
    }
    if (!isNpcInsideCasino(npc, casino)) {
        rejectCasinoCrate(npc, player, '&cThis crate is outside its linked casino region. Please contact an admin.');
        return;
    }
    if (!isCasinoCrateEnabled(npc)) {
        rejectCasinoCrate(npc, player, '&eThis crate is currently unavailable.');
        return;
    }
    openCasinoCrate(npc, player, mainhand, crate, casino);
}

/* -------------------------------------------------------------------------- */
/* Configuration                                                               */
/* -------------------------------------------------------------------------- */

function loadCasinoAdminItems() {
    var config = loadJson(CASINO_ADMIN_ITEMS_CONFIG);
    if (!config || !config.crate_type || !config.casino || !config.enabled) return null;

    // Reject collisions and incomplete definitions instead of dispatching
    // different admin actions from the same physical item.
    var ids = {};
    for (var key in config) {
        if (!config.hasOwnProperty(key)) continue;
        var definition = config[key];
        if (!definition || !definition.id || !definition.name || !definition.description) return null;
        if (ids[definition.id] || definition.id === CASINO_ADMIN_RESET) return null;
        ids[definition.id] = true;
    }
    return config;
}

function loadCasinoCrateTypes() {
    var config = loadJson(CASINO_CRATES_CONFIG);
    return config && config.crates ? config.crates : null;
}

function loadCasinoDefinitions() {
    return loadJson(CASINO_DEFINITIONS_CONFIG);
}

function getLinkedCasino(npc) {
    var sd = npc.getStoreddata();
    if (!sd.has(CASINO_ID_KEY)) return null;
    var id = String(sd.get(CASINO_ID_KEY));
    var casinos = loadCasinoDefinitions();
    if (!casinos || !casinos[id] || !casinos[id].Region || !casinos[id].DisplayName) return null;
    return {
        id: id,
        name: casinos[id].DisplayName,
        town: casinos[id].Town || '',
        island: casinos[id].Island || '',
        region: casinos[id].Region
    };
}

function getCasinoRegionsAtNpc(npc) {
    return getAllRegionsAtPosition(iposToPos(npc.getPos())) || [];
}

function isNpcInsideCasino(npc, casino) {
    return !!casino && getCasinoRegionsAtNpc(npc).indexOf(casino.region) !== -1;
}

function getCasinoCrateType(npc) {
    var sd = npc.getStoreddata();
    return sd.has(CASINO_CRATE_TYPE_KEY) ? String(sd.get(CASINO_CRATE_TYPE_KEY)) : null;
}

function getActiveCasinoCrate(npc) {
    var type = getCasinoCrateType(npc);
    var types = loadCasinoCrateTypes();
    if (!type || !types || !types[type] || !types[type].loot_table) return null;

    return {
        type: type,
        name: types[type].name || type,
        description: types[type].description || '',
        lootTable: types[type].loot_table
    };
}

function isCasinoCrateConfigured(npc) {
    var casino = getLinkedCasino(npc);
    return npc.getStoreddata().has(CASINO_CRATE_TYPE_KEY)
        && npc.getStoreddata().has(CASINO_CRATE_ENABLED_KEY)
        && npc.getStoreddata().has(CASINO_ID_KEY)
        && getActiveCasinoCrate(npc) !== null
        && isNpcInsideCasino(npc, casino);
}

function isCasinoCrateEnabled(npc) {
    var sd = npc.getStoreddata();
    return sd.has(CASINO_CRATE_ENABLED_KEY)
        && Number(sd.get(CASINO_CRATE_ENABLED_KEY)) === 1;
}

/* -------------------------------------------------------------------------- */
/* Admin configuration                                                         */
/* -------------------------------------------------------------------------- */

function isCasinoAdmin(offhand) {
    return !!offhand && !offhand.isEmpty() && offhand.getName() === CASINO_ADMIN_CARD;
}

function findCasinoAdminAction(item, adminItems) {
    if (!item || item.isEmpty()) return null;
    var id = item.getName();
    for (var key in adminItems) {
        if (adminItems.hasOwnProperty(key) && adminItems[key].id === id) return key;
    }
    return null;
}

function handleCasinoAdminInteraction(npc, player, mainhand, adminItems) {
    if (!mainhand || mainhand.isEmpty()) {
        showCasinoCrateConfiguration(npc, player, adminItems);
        if (!isCasinoCrateConfigured(npc)) {
            showCasinoCrateAdminHelp(player, adminItems);
            giveCasinoCrateAdminItems(player, adminItems);
        }
        return;
    }

    if (mainhand.getName() === CASINO_ADMIN_RESET) {
        resetCasinoCrateConfiguration(npc, player);
        return;
    }

    var action = findCasinoAdminAction(mainhand, adminItems);
    switch (action) {
        case 'crate_type':
            cycleCasinoCrateType(npc, player, adminItems);
            break;
        case 'casino':
            cycleCasinoLink(npc, player, adminItems);
            break;
        case 'enabled':
            toggleCasinoCrateAvailability(npc, player, adminItems);
            break;
        default:
            tellPlayer(player, '&c[Crate Admin] Unrecognized configuration item. Use an empty hand for help.');
            break;
    }
}

function cycleCasinoCrateType(npc, player, adminItems) {
    var types = loadCasinoCrateTypes();
    var options = types ? Object.keys(types).filter(function(key) {
        return types[key] && types[key].loot_table;
    }) : [];

    if (!options.length) {
        tellPlayer(player, '&c[Crate Admin] No valid crate types are defined in crates.json.');
        return;
    }

    var current = getCasinoCrateType(npc);
    var next = options[(options.indexOf(current) + 1) % options.length];
    npc.getStoreddata().put(CASINO_CRATE_TYPE_KEY, next);

    tellPlayer(player, '&a[Crate Admin] ' + adminItems.crate_type.name
        + '&a: &e' + (types[next].name || next) + ' &7(' + next + ')');
    tellPlayer(player, '&7Reward table: &f' + types[next].loot_table);
}

function cycleCasinoLink(npc, player, adminItems) {
    var casinos = loadCasinoDefinitions();
    if (!casinos) {
        tellPlayer(player, '&c[Crate Admin] Failed to load casinos.json.');
        return;
    }
    var regions = getCasinoRegionsAtNpc(npc);
    var options = Object.keys(casinos).filter(function(id) {
        var entry = casinos[id];
        return entry && entry.DisplayName && entry.Region && regions.indexOf(entry.Region) !== -1;
    });
    if (!options.length) {
        tellPlayer(player, '&c[Crate Admin] No defined casino matches this NPC position.');
        tellPlayer(player, '&7NPC regions: &f' + (regions.length ? regions.join(', ') : '(none)'));
        return;
    }
    var sd = npc.getStoreddata();
    var current = sd.has(CASINO_ID_KEY) ? String(sd.get(CASINO_ID_KEY)) : null;
    var next = options[(options.indexOf(current) + 1) % options.length];
    sd.put(CASINO_ID_KEY, next);
    tellPlayer(player, '&a[Crate Admin] ' + adminItems.casino.name + '&a: &e' + casinos[next].DisplayName);
    tellPlayer(player, '&7Region: &f' + casinos[next].Region);
}

function toggleCasinoCrateAvailability(npc, player, adminItems) {
    if (!getActiveCasinoCrate(npc) || !isNpcInsideCasino(npc, getLinkedCasino(npc))) {
        tellPlayer(player, '&c[Crate Admin] Select a crate type and link a matching casino first.');
        return;
    }

    var next = isCasinoCrateEnabled(npc) ? 0 : 1;
    npc.getStoreddata().put(CASINO_CRATE_ENABLED_KEY, next);
    tellPlayer(player, '&a[Crate Admin] ' + adminItems.enabled.name + '&a: '
        + (next ? '&aEnabled' : '&cDisabled'));
}

function resetCasinoCrateConfiguration(npc, player) {
    var sd = npc.getStoreddata();
    sd.remove(CASINO_CRATE_TYPE_KEY);
    sd.remove(CASINO_ID_KEY);
    sd.remove(CASINO_CRATE_ENABLED_KEY);
    tellPlayer(player, '&a[Crate Admin] Crate type, casino link, and availability cleared.');
}

function giveCasinoCrateAdminItems(player, adminItems) {
    for (var key in adminItems) {
        if (!adminItems.hasOwnProperty(key)) continue;
        var definition = adminItems[key];
        var item = player.getWorld().createItem(definition.id, 0, 1);
        item.setCustomName(ccs(definition.name));
        item.setLore([ccs(definition.description)]);
        if (!player.giveItem(item)) player.dropItem(item);
    }
}

function showCasinoCrateConfiguration(npc, player, adminItems) {
    var crate = getActiveCasinoCrate(npc);
    var casino = getLinkedCasino(npc);
    var sd = npc.getStoreddata();
    tellPlayer(player, '&6[Crate Admin] &eCurrent configuration:');
    tellPlayer(player, '&7- ' + adminItems.crate_type.name + '&7: '
        + (crate ? '&e' + crate.name + ' &7(' + crate.type + ')' : '&cNot set'));
    tellPlayer(player, '&7- ' + adminItems.casino.name + '&7: '
        + (casino ? '&e' + casino.name + ' &7(' + casino.town + ', ' + casino.island + ')' : '&cNot set'));
    if (casino) {
        tellPlayer(player, '&7- Region: &f' + casino.region);
        tellPlayer(player, '&7- Region match: ' + (isNpcInsideCasino(npc, casino) ? '&aValid' : '&cOutside linked region'));
        var stats = loadCasinoStats();
        var totals = stats && stats[casino.id] && stats[casino.id].CratesOpened;
        tellPlayer(player, '&7- Casino crates opened: &e' + (totals ? totals.Total : 0));
        if (totals && crate) tellPlayer(player, '&7- This crate type opened: &e' + (totals.ByType[crate.type] || 0));
    }
    tellPlayer(player, '&7- ' + adminItems.enabled.name + '&7: '
        + (sd.has(CASINO_CRATE_ENABLED_KEY)
            ? (isCasinoCrateEnabled(npc) ? '&aEnabled' : '&cDisabled') : '&cNot set'));

    if (crate) {
        tellPlayer(player, '&7- Description: &f' + crate.description);
        tellPlayer(player, '&7- Loot table: &f' + crate.lootTable);
        tellPlayer(player, '&7- Reward availability: '
            + (canUseLootTable(crate.lootTable) ? '&aAvailable' : '&cEmpty or invalid'));
    }
    tellPlayer(player, '&7- Setup status: '
        + (isCasinoCrateConfigured(npc) ? '&aConfigured' : '&eIncomplete'));
}

function showCasinoCrateAdminHelp(player, adminItems) {
    var lines = [
        '&6[Crate Admin] &eNPC Setup',
        '&7With your Seagull ID Card in the offhand:',
        '&7Use these items to configure the crate:',
        ''
    ];
    for (var key in adminItems) {
        if (!adminItems.hasOwnProperty(key)) continue;
        var entry = adminItems[key];
        lines.push('&e- &f' + entry.id + ' &7→ ' + entry.name);
        lines.push('  ' + entry.description);
        lines.push('');
    }
    lines.push('&7Empty main hand: show configuration (and receive items if not configured).');
    lines.push('&7minecraft:barrier: reset this NPC.');
    storytellPlayer(player, lines);
}

/* -------------------------------------------------------------------------- */
/* Player interaction                                                          */
/* -------------------------------------------------------------------------- */

function openCasinoCrate(npc, player, mainhand, crate, casino) {
    if (!isCrateKeyModifier(mainhand)) {
        rejectCasinoCrate(npc, player, '&eHold the matching crate key in your main hand.');
        return;
    }
    if (!isItemOwnedBy(mainhand, player)) {
        rejectCasinoCrate(npc, player, '&cThis key belongs to another player or is unbound.');
        return;
    }
    if (!canPlayerOpenCrateWithKey(mainhand, player, crate.type)) {
        rejectCasinoCrate(npc, player, '&cThat key does not open this crate.');
        return;
    }
    if (!canUseLootTable(crate.lootTable)) {
        rejectCasinoCrate(npc, player, '&cThis crate is currently out of rewards.');
        return;
    }

    var prepared = prepareLootTablePull(crate.lootTable, player);
    if (!prepared || !prepared.loot || !prepared.loot.length) {
        rejectCasinoCrate(npc, player, '&cUnable to prepare a reward. Your key was not consumed.');
        return;
    }

    var rewards = [];
    for (var i = 0; i < prepared.loot.length; i++) {
        var item = generateItemStackFromLootEntry(prepared.loot[i], player.getWorld(), player);
        if (!item || item.isEmpty()) {
            rejectCasinoCrate(npc, player, '&cReward generation failed. Your key was not consumed.');
            return;
        }
        rewards.push(item);
    }
    if (!commitLootTablePull(prepared)) {
        rejectCasinoCrate(npc, player, '&cReward pool changed. Try again.');
        return;
    }

    var usedKey = mainhand.copy();
    usedKey.setStackSize(1);
    if (mainhand.getStackSize() <= 1) {
        player.setMainhandItem(player.getWorld().createItem('minecraft:air', 0, 1));
    } else {
        var remaining = mainhand.copy();
        remaining.setStackSize(mainhand.getStackSize() - 1);
        player.setMainhandItem(remaining);
    }
    for (var j = 0; j < rewards.length; j++) {
        if (!player.giveItem(rewards[j])) player.dropItem(rewards[j]);
    }
    // Record only completed openings: no denied attempts or failed pulls
    // inflate the casino's reward and crate counters.
    recordCasinoCrateOpen(casino.id, casino.name, crate, npc, player, usedKey, rewards);
    playCasinoCrateFeedback(npc, true);
    tellPlayer(player, '&a:check_mark: ' + crate.name + ' opened!');
}
