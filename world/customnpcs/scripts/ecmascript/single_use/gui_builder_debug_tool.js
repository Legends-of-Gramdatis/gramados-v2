load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/modules/GUI_builder/gui_builder.js');

var SOURCE_PATH = 'world/customnpcs/scripts/ecmascript/modules/GUI_builder/guis/';
var MANIFEST_PATH = SOURCE_PATH + 'car_dealership/gui_manifest.json';

var g_manifest = null;
var g_skinPacks = [];
var g_skinIndex = 0;
var g_currentSkinPack = null;
var g_script = null;

function guiBuilderDebug_ensureLoaded(event) {

    if (g_manifest) {
        g_manifest = guiBuilder_updateManifest(event, g_manifest);
        return;
    } else {
        g_manifest = loadJson(MANIFEST_PATH);
    }

    if (g_script == null) {
        g_script = SOURCE_PATH + g_manifest.gui_name + '/gui_' + g_manifest.gui_name + '.js';
        load(g_script);
    }

    g_manifest = guiBuilder_updateManifest(event, g_manifest);
    g_skinPacks = g_manifest.skin_packs;
    g_skinIndex = 0;
    g_currentSkinPack = g_skinPacks[g_skinIndex];
}

function init(event) {
    var item = event.item;
    guiBuilderDebug_ensureLoaded(event);
    item.setDurabilityShow(false);
    item.setCustomName('§6§lGUI Builder Debug Tool');
    g_currentSkinPack = g_skinPacks[g_skinIndex];
    return true;
}

function interact(event) {
    guiBuilderDebug_ensureLoaded(event);

    tellPlayer(event.player, 'Using skin pack: ' + g_currentSkinPack);

    var pageID = guiBuilder_getPagesID(g_manifest)[0];

    tellPlayer(event.player, 'Loaded GUI manifest: ' + MANIFEST_PATH + ' at page ' + pageID);

    guiBuilder_buildGuiFromManifest(event.API, g_manifest, g_currentSkinPack, pageID, event.player, SOURCE_PATH, g_script);
}

// Rotate skin pack while the GUI is open (or reopen it if needed)
function attack(event) {
    guiBuilderDebug_ensureLoaded(event);

    if (!g_skinPacks || g_skinPacks.length === 0) {
        return;
    }

    g_skinIndex++;
    if (g_skinIndex >= g_skinPacks.length) {
        g_skinIndex = 0;
    }

    g_currentSkinPack = g_skinPacks[g_skinIndex];

    // Keep the current page if one is already open
    var pageID = _currentPageID;
    if (!pageID) {
        pageID = guiBuilder_getPagesID(g_manifest)[0];
    }

    tellPlayer(event.player, 'Switching skin pack to: ' + g_currentSkinPack);
    // guiBuilder_buildGuiFromManifest(event.API, g_manifest, g_currentSkinPack, pageID, event.player);
}
