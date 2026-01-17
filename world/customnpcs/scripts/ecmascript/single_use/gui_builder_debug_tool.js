load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/modules/GUI_builder/gui_builder.js');

var MANIFEST_PATH = '/home/mouette/gramados-v2/world/customnpcs/scripts/ecmascript/modules/GUI_builder/gui_manifest.json';

function init(event) {
    var item = event.item;
    item.setDurabilityShow(false);
    item.setCustomName('§6§lGUI Builder Debug Tool');
    return true;
}

function interact(event) {
    var g_manifest = loadJson(MANIFEST_PATH);
    var g_skinPack = g_manifest.skin_packs[0];

    tellPlayer(event.player, 'Using skin pack: ' + g_skinPack);

    var pageID = guiBuilder_getPagesID(g_manifest)[0];

    tellPlayer(event.player, 'Loaded GUI manifest: ' + MANIFEST_PATH + ' at page ' + pageID);

    guiBuilder_buildGuiFromManifest(event.API, g_manifest, g_skinPack, pageID, event.player);
}
