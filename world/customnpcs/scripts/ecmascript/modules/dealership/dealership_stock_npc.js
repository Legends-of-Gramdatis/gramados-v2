load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/modules/GUI_builder/gui_builder.js');


var GUI_SOURCE_BASE = 'world/customnpcs/scripts/ecmascript/modules/GUI_builder/guis/';
var GUI_NAME = 'car_dealership';

var LOOT_TABLE_PATH = 'automobile/vehicles/trin/cars/dealership_trin_standard.json';
var STORED_KEY = 'dealership_stock';

var guiCache = {};

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

function openDealershipGui(api, player, npc) {
    var resources = getGuiResources(GUI_NAME);
    if (!resources) {
        tellPlayer(player, '&c[Dealership] GUI manifest missing for ' + GUI_NAME + '.');
        return;
    }

    var manifestCopy = JSON.parse(JSON.stringify(resources.manifest));

    var pages = guiBuilder_getPagesID(manifestCopy);
    var firstPage = pages[0];

    guiBuilder_buildGuiFromManifest(api, player, guiBuilder_updateManifest(player, npc, manifestCopy), resources.skinPack, firstPage, resources.sourcePath, resources.scriptPath, npc);
}

function init(event) {
    var npc = event.npc;
    var player = event.player;

    // Initialize GUI name if not present
    if (!npc.getStoreddata().has('gui_name')) {
        npc.getStoreddata().put('gui_name', GUI_NAME);
        tellPlayer(player, '&e[Dealership] GUI name set to default: ' + GUI_NAME);
    }

    // Initialize vehicle index tracking if not present
    if (!npc.getStoreddata().has('dealership_vehicle_index')) {
        npc.getStoreddata().put('dealership_vehicle_index', 0);
        tellPlayer(player, '&e[Dealership] Vehicle index initialized.');
    }

    // Initialize first page id if not present
    if (!npc.getStoreddata().has('dealership_current_page')) {
        npc.getStoreddata().put('dealership_current_page', 1);
        tellPlayer(player, '&e[Dealership] Set to page 1.');
    }

    // Warn if no stock loaded  
    if (!npc.getStoreddata().has(STORED_KEY)) {
        tellPlayer(player, '&c[Dealership] No stock loaded. Ask an admin to refresh.');
    }
}

function reloadStock(player, npc) {

    var fullPath = 'world/loot_tables/' + LOOT_TABLE_PATH;
    if (!checkFileExists(fullPath)) {
        tellPlayer(player, '&c[Dealership] Loot table missing: ' + LOOT_TABLE_PATH);
        return;
    }

    var pulled = pullLootTable(LOOT_TABLE_PATH, player);
    if (!pulled || pulled.length === 0) {
        npc.getStoreddata().put(STORED_KEY, JSON.stringify({
            source: LOOT_TABLE_PATH,
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
        source: LOOT_TABLE_PATH,
        refreshedAt: new Date().toISOString(),
        totalStacks: pulled.length,
        vehicles: vehicles
    }));

    tellPlayer(player, '&a[Dealership] Reloaded stock from ' + LOOT_TABLE_PATH + '.');
    tellPlayer(player, '&7Stored ' + vehicles.length + ' vehicle types (' + pulled.length + ' total units).');
}

function interact(event) {
    var player = event.player;
    var npc = event.npc;
    var api = event.API;
    var offItem = player.getOffhandItem();
    var mainItem = player.getMainhandItem();

    var hasSeagullCard = !offItem.isEmpty() && offItem.getName() === 'mts:ivv.idcard_seagull';
    var hasCommandBlock = !mainItem.isEmpty() && mainItem.getName() === 'minecraft:command_block';

    if (hasSeagullCard && hasCommandBlock) {
        reloadStock(player, npc);
    } else {
        npc.getStoreddata().put('dealership_current_page', 1);
        openDealershipGui(api, player, npc);
    }
}
