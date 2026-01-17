load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/modules/GUI_builder/gui_builder.js');

var MANIFEST_PATH = '/home/mouette/gramados-v2/world/customnpcs/scripts/ecmascript/modules/GUI_builder/gui_manifest.json';

var g_manifest = null;
var g_skinPacks = [];
var g_skinIndex = 0;

function guiBuilderDebug_ensureLoaded() {
    if (g_manifest) {
        return;
    }
    g_manifest = loadJson(MANIFEST_PATH);
    g_skinPacks = g_manifest.skin_packs;
    g_skinIndex = 0;
}

function init(event) {
    var item = event.item;
    item.setDurabilityShow(false);
    item.setCustomName('§6§lGUI Builder Debug Tool');
    return true;
}

function interact(event) {
    guiBuilderDebug_ensureLoaded();
    var g_skinPack = g_skinPacks[g_skinIndex];

    tellPlayer(event.player, 'Using skin pack: ' + g_skinPack);

    var pageID = guiBuilder_getPagesID(g_manifest)[0];

    tellPlayer(event.player, 'Loaded GUI manifest: ' + MANIFEST_PATH + ' at page ' + pageID);

    guiBuilder_buildGuiFromManifest(event.API, g_manifest, g_skinPack, pageID, event.player);
}

// Rotate skin pack while the GUI is open (or reopen it if needed)
function attack(event) {
    guiBuilderDebug_ensureLoaded();

    if (!g_skinPacks || g_skinPacks.length === 0) {
        return;
    }

    g_skinIndex++;
    if (g_skinIndex >= g_skinPacks.length) {
        g_skinIndex = 0;
    }

    var newSkinPack = g_skinPacks[g_skinIndex];

    // Keep the current page if one is already open
    var pageID = _currentPageID;
    if (!pageID) {
        pageID = guiBuilder_getPagesID(g_manifest)[0];
    }

    tellPlayer(event.player, 'Switching skin pack to: ' + newSkinPack);
    guiBuilder_buildGuiFromManifest(event.API, g_manifest, newSkinPack, pageID, event.player);
}
