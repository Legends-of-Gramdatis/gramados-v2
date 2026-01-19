// Dealership stock loader NPC: refreshes vehicle stock from a loot table when an admin interacts and opens the dealership GUI for players.
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js'); // provides pullLootTable, logging, chat helpers
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/modules/GUI_builder/gui_builder.js');

var LOOT_TABLE_PATH = 'automobile/vehicles/trin/cars/dealership_trin_standard.json';
var STORED_KEY = 'dealership_stock';
var PREVIEW_LIMIT = 5;

var GUI_SOURCE_BASE = 'world/customnpcs/scripts/ecmascript/modules/GUI_builder/guis/';
var GUI_DEFAULT = 'car_dealership';
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
    var resources = getGuiResources(GUI_DEFAULT);
    if (!resources) {
        tellPlayer(player, '&c[Dealership] GUI manifest missing for ' + GUI_DEFAULT + '.');
        return;
    }

    var manifestCopy = JSON.parse(JSON.stringify(resources.manifest));
    manifestCopy = guiBuilder_updateManifest(player, npc, manifestCopy);

    var pages = guiBuilder_getPagesID(manifestCopy);
    if (!pages || pages.length === 0) {
        tellPlayer(player, '&c[Dealership] GUI manifest has no pages.');
        return;
    }

    var firstPage = pages[0];
    guiBuilder_buildGuiFromManifest(api, player, manifestCopy, resources.skinPack, firstPage, resources.sourcePath, resources.scriptPath, npc);
}

function interact(event) {
    var player = event.player;
    var npc = event.npc;
    var api = event.API;
    var offItem = player.getOffhandItem();
    var mainItem = player.getMainhandItem();

    var hasSeagullCard = offItem && !offItem.isEmpty() && offItem.getName() === 'mts:ivv.idcard_seagull';
    var hasCommandBlock = mainItem && !mainItem.isEmpty() && mainItem.getName() === 'minecraft:command_block';

    if (!hasSeagullCard || !hasCommandBlock) {
        openDealershipGui(api, player, npc);
        return;
    }

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

    var preview = [];
    for (var j = 0; j < vehicles.length && j < PREVIEW_LIMIT; j++) {
        var v = vehicles[j];
        preview.push(v.id + ' x' + v.count);
    }

    tellPlayer(player, '&a[Dealership] Reloaded stock from ' + LOOT_TABLE_PATH + '.');
    tellPlayer(player, '&7Stored ' + vehicles.length + ' vehicle types (' + pulled.length + ' total units).');
    if (preview.length > 0) {
        var suffix = vehicles.length > PREVIEW_LIMIT ? ' ...' : '';
        tellPlayer(player, '&7Preview: ' + preview.join(', ') + suffix);
    }
}
