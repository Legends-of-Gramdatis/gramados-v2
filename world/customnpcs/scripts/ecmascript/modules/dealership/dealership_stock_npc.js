load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/modules/GUI_builder/gui_builder.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles_licensing.js");


var GUI_SOURCE_BASE = 'world/customnpcs/scripts/ecmascript/modules/GUI_builder/guis/';
var GUI_NAME = 'car_dealership';
var STORED_KEY = 'dealership_stock';

var VEHICLE_REGISTRATION_CONFIG_PATH = 'world/customnpcs/scripts/ecmascript/modules/vehicle_registration/config.json';

var STORED_REGION_KEY = 'dealership_region';
var STORED_LOOT_TABLE_KEY = 'dealership_loot_table_path';

var ADMIN_SEAGULL_CARD_ID = 'mts:ivv.idcard_seagull';
var ADMIN_RELOAD_ITEM_ID = 'minecraft:command_block';
var ADMIN_CYCLE_REGION_ITEM_ID = 'minecraft:paper';
var ADMIN_CYCLE_LOOT_TABLE_ITEM_ID = 'minecraft:shulker_shell';

var guiCache = {};

// Compute the start of the current week (Monday at 00:00 local time)
function getStartOfCurrentWeekMonday() {
    var now = new Date();
    var monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var day = monday.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    var diffToMonday = (day + 6) % 7; // Mon->0, Sun->6
    monday.setDate(monday.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function getGuiResources(guiName) {
    if (guiCache[guiName]) {
        return guiCache[guiName];
    }

    var manifestPath = GUI_SOURCE_BASE + guiName + '/gui_manifest.json';
    var manifest = loadJson(manifestPath);
    if (!manifest) {
        return null;
    }

    var scriptPath = GUI_SOURCE_BASE + guiName + '/gui_' + guiName + '.js';
    load(scriptPath);

    var skinPack = (manifest.skin_packs && manifest.skin_packs.length > 0) ? manifest.skin_packs[0] : 'default';

    guiCache[guiName] = {
        manifest: manifest,
        scriptPath: scriptPath,
        skinPack: skinPack,
        manifestPath: manifestPath,
        sourcePath: GUI_SOURCE_BASE
    };
    return guiCache[guiName];
}

function isNpcSetup(npc) {
    return (npc.getStoreddata().has(STORED_REGION_KEY) && npc.getStoreddata().has(STORED_LOOT_TABLE_KEY));
}

function adminTellCurrentSetup(player, npc) {
    var region = npc.getStoreddata().has(STORED_REGION_KEY) ? npc.getStoreddata().get(STORED_REGION_KEY) : 'UNSET';
    var lootTablePath = npc.getStoreddata().has(STORED_LOOT_TABLE_KEY) ? npc.getStoreddata().get(STORED_LOOT_TABLE_KEY) : 'UNSET';

    tellPlayer(player, '&7[Dealership.debug] region=' + region + ', lootTable=' + lootTablePath);
    tellPlayer(player, '&7[Dealership.debug] With seagull card in offhand:');
    tellPlayer(player, '&7 - Hold &eminecraft:paper&7 to cycle location');
    tellPlayer(player, '&7 - Hold &eminecraft:shulker_shell&7 to cycle loot table');
    tellPlayer(player, '&7 - Hold &eminecraft:command_block&7 to reload stock');
}

function adminCycleRegion(player, npc, setupConfig) {
    var regions = Object.keys(setupConfig.regions);

    var current = npc.getStoreddata().has(STORED_REGION_KEY) ? npc.getStoreddata().get(STORED_REGION_KEY) : null;
    var currentIndex = -1;
    for (var i = 0; i < regions.length; i++) {
        if (regions[i] === current) {
            currentIndex = i;
            break;
        }
    }

    var newIndex = (currentIndex + 1) % regions.length;
    var newRegion = regions[newIndex];
    npc.getStoreddata().put(STORED_REGION_KEY, newRegion);
    tellPlayer(player, '&a[Dealership] Location set to: ' + newRegion);
}

function adminCycleLootTable(player, npc, setupConfig) {
    var lootTables = setupConfig['dealership loot tables'];

    var current = npc.getStoreddata().has(STORED_LOOT_TABLE_KEY) ? npc.getStoreddata().get(STORED_LOOT_TABLE_KEY) : null;
    var currentIndex = -1;
    for (var i = 0; i < lootTables.length; i++) {
        if (lootTables[i] === current) {
            currentIndex = i;
            break;
        }
    }

    var newIndex = (currentIndex + 1) % lootTables.length;
    var newLootTable = lootTables[newIndex];
    npc.getStoreddata().put(STORED_LOOT_TABLE_KEY, newLootTable);
    tellPlayer(player, '&a[Dealership] Loot table set to: ' + newLootTable);
    tellPlayer(player, '&7[Dealership] Use a command block to reload stock.');
}

function openDealershipGui(api, player, npc, pageIndex) {
    var resources = getGuiResources(GUI_NAME);
    if (!resources) {
        tellPlayer(player, '&c[Dealership] GUI manifest missing for ' + GUI_NAME + '.');
        return;
    }

    var manifestCopy = JSON.parse(JSON.stringify(resources.manifest));

    var pages = guiBuilder_getPagesID(manifestCopy);
    var page = pages[pageIndex];
    npc.getStoreddata().put('dealership_current_page', page);

    guiBuilder_buildGuiFromManifest(api, player, guiBuilder_updateManifest(player, npc, manifestCopy), resources.skinPack, page, resources.sourcePath, resources.scriptPath, npc);
}

function init(event) {
    var npc = event.npc;
    var player = event.player;

    // Initialize GUI name if not present
    if (!npc.getStoreddata().has('gui_name')) {
        npc.getStoreddata().put('gui_name', GUI_NAME);
        // tellPlayer(player, '&e[Dealership] GUI name set to default: ' + GUI_NAME);
    }

    // Initialize vehicle index tracking if not present
    if (!npc.getStoreddata().has('dealership_vehicle_index')) {
        npc.getStoreddata().put('dealership_vehicle_index', 0);
        // tellPlayer(player, '&e[Dealership] Vehicle index initialized.');
    }

    // Initialize first page id if not present
    if (!npc.getStoreddata().has('dealership_current_page')) {
        npc.getStoreddata().put('dealership_current_page', 1);
        // tellPlayer(player, '&e[Dealership] Set to page 1.');
    }

    // Auto-refresh only if configured and stock exists
    if (isNpcSetup(npc) && npc.getStoreddata().has(STORED_KEY)) {
        var stockStr = npc.getStoreddata().get(STORED_KEY);
        if (stockStr) {
            var stockObj = JSON.parse(stockStr);
            if (stockObj && stockObj.refreshedAt) {
                var lastRefresh = new Date(stockObj.refreshedAt);
                var weekMonday = getStartOfCurrentWeekMonday();
                if (lastRefresh.getTime() < weekMonday.getTime()) {
                    reloadStock(player, npc);
                }
            }
        }
    }
}

function reloadStock(player, npc) {

    if (!npc.getStoreddata().has(STORED_LOOT_TABLE_KEY) || !npc.getStoreddata().get(STORED_LOOT_TABLE_KEY)) {
        tellPlayer(player, '&c[Dealership] Loot table is not set. Use the admin shulker shell tool first.');
        return;
    }

    var lootTablePath = npc.getStoreddata().get(STORED_LOOT_TABLE_KEY);

    var pulled = pullLootTable(lootTablePath, player);
    if (!pulled || pulled.length === 0) {
        npc.getStoreddata().put(STORED_KEY, JSON.stringify({
            source: lootTablePath,
            refreshedAt: new Date().toISOString(),
            totalStacks: 0,
            vehicles: []
        }));
        tellPlayer(player, '&e[Dealership] Reloaded, but no vehicles were generated. Stored list cleared.');
        return;
    }

    var aggregated = {};
    for (var i = 0; i < pulled.length; i++) {
        var entry = pulled[i];
        var damage = entry.damage || 0;
        var key = entry.id + ':' + damage;
        if (!aggregated[key]) {
            aggregated[key] = { id: entry.id, damage: damage, count: 0 };
        }
        aggregated[key].count += entry.count || 1;
    }

    var vehicles = [];
    for (var k in aggregated) {
        if (!aggregated.hasOwnProperty(k)) continue;
        vehicles.push(aggregated[k]);
    }

    npc.getStoreddata().put(STORED_KEY, JSON.stringify({
        source: lootTablePath,
        refreshedAt: new Date().toISOString(),
        totalStacks: pulled.length,
        vehicles: vehicles
    }));
}

function interact(event) {
    var player = event.player;
    var npc = event.npc;
    var api = event.API;
    var offItem = player.getOffhandItem();
    var mainItem = player.getMainhandItem();

    var hasSeagullCard = !offItem.isEmpty() && offItem.getName() === ADMIN_SEAGULL_CARD_ID;
    var mainItemName = (!mainItem.isEmpty()) ? mainItem.getName() : null;

    if (hasSeagullCard) {
        var setupConfig = loadJson(VEHICLE_REGISTRATION_CONFIG_PATH);
        if (!setupConfig) {
            tellPlayer(player, '&c[Dealership] Failed to load config: ' + VEHICLE_REGISTRATION_CONFIG_PATH);
            return;
        }

        if (!mainItemName) {
            adminTellCurrentSetup(player, npc);
            return;
        }

        if (mainItemName === ADMIN_RELOAD_ITEM_ID) {
            if (!isNpcSetup(npc)) {
                tellPlayer(player, '&c[Dealership] Configure location and loot table first (paper + shulker shell).');
                adminTellCurrentSetup(player, npc);
                return;
            }
            reloadStock(player, npc);
            return;
        }

        if (mainItemName === ADMIN_CYCLE_REGION_ITEM_ID) {
            adminCycleRegion(player, npc, setupConfig);
            return;
        }

        if (mainItemName === ADMIN_CYCLE_LOOT_TABLE_ITEM_ID) {
            adminCycleLootTable(player, npc, setupConfig);
            return;
        }

        adminTellCurrentSetup(player, npc);
        return;
    }

    // Non-admins: NPC must be configured and have stock
    var setupConfig = loadJson(VEHICLE_REGISTRATION_CONFIG_PATH);
    if (!isNpcSetup(npc)) {
        tellPlayer(player, '&c[Dealership] This NPC is not configured. Please report to an admin.');
        return;
    }

    if (!npc.getStoreddata().has(STORED_KEY) || !npc.getStoreddata().get(STORED_KEY)) {
        tellPlayer(player, '&c[Dealership] Dealership stock is not loaded. Please report to an admin.');
        return;
    }

    var slots = player.getInventory().getItems();
    var ww_registered_car_items = get_all_car_items_registered(get_all_car_items(slots), get_all_ww_car_papers(slots));
    if (ww_registered_car_items.length > 0) {
        openDealershipGui(api, player, npc, 2);
    } else {
        openDealershipGui(api, player, npc, 0);
    }
}
