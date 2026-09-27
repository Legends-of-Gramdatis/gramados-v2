load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_item_ownership.js');

// Each NPC stores only its selected crate type and enabled state.
// All available crate types and all admin items are configured in JSON.
var CASINO_CRATES_CONFIG = 'world/customnpcs/scripts/ecmascript/modules/casino/crates.json';
var CASINO_ADMIN_ITEMS_CONFIG = 'world/customnpcs/scripts/ecmascript/modules/casino/crate_npc_config.json';
var CASINO_CRATE_TYPE_KEY = 'casino_crate_type';
var CASINO_CRATE_ENABLED_KEY = 'casino_crate_enabled';
var CASINO_ADMIN_CARD = 'mts:ivv.idcard_seagull';
var CASINO_ADMIN_RESET = 'minecraft:barrier';

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
        tellPlayer(player, '&cThis crate is not configured. Please contact an admin.');
        return;
    }
    if (!isCasinoCrateEnabled(npc)) {
        tellPlayer(player, '&eThis crate is currently unavailable.');
        return;
    }
    openCasinoCrate(npc, player, mainhand, crate);
}

/* -------------------------------------------------------------------------- */
/* Configuration                                                               */
/* -------------------------------------------------------------------------- */

function loadCasinoAdminItems() {
    var config = loadJson(CASINO_ADMIN_ITEMS_CONFIG);
    if (!config || !config.crate_type || !config.enabled) return null;

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
    return npc.getStoreddata().has(CASINO_CRATE_TYPE_KEY)
        && npc.getStoreddata().has(CASINO_CRATE_ENABLED_KEY)
        && getActiveCasinoCrate(npc) !== null;
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

function toggleCasinoCrateAvailability(npc, player, adminItems) {
    if (!getActiveCasinoCrate(npc)) {
        tellPlayer(player, '&c[Crate Admin] Select a valid crate type first.');
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
    sd.remove(CASINO_CRATE_ENABLED_KEY);
    tellPlayer(player, '&a[Crate Admin] Crate type and availability cleared.');
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
    var sd = npc.getStoreddata();
    tellPlayer(player, '&6[Crate Admin] &eCurrent configuration:');
    tellPlayer(player, '&7- ' + adminItems.crate_type.name + '&7: '
        + (crate ? '&e' + crate.name + ' &7(' + crate.type + ')' : '&cNot set'));
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

function openCasinoCrate(npc, player, mainhand, crate) {
    if (!isCrateKeyModifier(mainhand)) {
        tellPlayer(player, '&eHold the matching crate key in your main hand.');
        return;
    }
    if (!isItemOwnedBy(mainhand, player)) {
        tellPlayer(player, '&cThis key belongs to another player or is unbound.');
        return;
    }
    if (!canPlayerOpenCrateWithKey(mainhand, player, crate.type)) {
        tellPlayer(player, '&cThat key does not open this crate.');
        return;
    }
    if (!canUseLootTable(crate.lootTable)) {
        tellPlayer(player, '&cThis crate is currently out of rewards.');
        return;
    }

    var prepared = prepareLootTablePull(crate.lootTable, player);
    if (!prepared || !prepared.loot || !prepared.loot.length) {
        tellPlayer(player, '&cUnable to prepare a reward. Your key was not consumed.');
        return;
    }

    var rewards = [];
    for (var i = 0; i < prepared.loot.length; i++) {
        var item = generateItemStackFromLootEntry(prepared.loot[i], player.getWorld(), player);
        if (!item || item.isEmpty()) {
            tellPlayer(player, '&cReward generation failed. Your key was not consumed.');
            return;
        }
        rewards.push(item);
    }
    if (!commitLootTablePull(prepared)) {
        tellPlayer(player, '&cReward pool changed. Try again.');
        return;
    }

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
    tellPlayer(player, '&a:check_mark: ' + crate.name + ' opened!');
}
