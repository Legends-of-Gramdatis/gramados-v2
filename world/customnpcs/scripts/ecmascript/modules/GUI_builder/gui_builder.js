load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

var TILE_SCALE = 16;
var ITEM_OFFSET_X = -2.5;
var ITEM_OFFSET_Y = -2.8;

var _currentPageID = null;
var _manifest = null;
var _skinPack = null;
var _guiSourcePath = null;
var _guiscript = null;

var _NPC = null;
var _PLAYER = null;

function guiBuilder_textureBase() {
    return 'minecraft:textures/gui/gui_creator/' + _manifest.gui_name + '/' + _skinPack + '/';
}

function guiBuilder_backgroundTexture() {
    return guiBuilder_textureBase() + 'background_page_' + _currentPageID + '.png';
}

function guiBuilder_sheetTexture(sheetId) {
    return guiBuilder_textureBase() + 'sheet_' + sheetId + '.png';
}

function guiBuilder_computeSizePx(tileW, tileH) {
    
    tileW = tileW * TILE_SCALE;
    tileH = tileH * TILE_SCALE;

    return { w: tileW, h: tileH };
}

function guiBuilder_getPagesID(manifest) {
    var pages = [];
    for (var i = 0; i < manifest.pages.length; i++) {
        pages.push(manifest.pages[i].page);
    }
    return pages;
}

function guiBuilder_getAllSheets(manifest) {
    var sheets = [];
    for (var i = 0; i < manifest.pages.length; i++) {
        for (var j = 0; j < manifest.pages[i].components.length; j++) {
            var sheet = manifest.pages[i].components[j].sheet;
            if (sheets.indexOf(sheet) === -1) {
                sheets.push(sheet);
            }
        }
    }
    return sheets;
}

function guiBuilder_getAllIDs(manifest) {
    var ids = [];
    var manifest_page = findJsonEntry(manifest.pages, 'page', _currentPageID);
    for (var i = 0; i < manifest_page.components.length; i++) {
        ids.push(manifest_page.components[i].id);
    }
    return ids;
}

function guiBuilder_getAllButtonIDs() {
    var buttonIDs = [];
    var manifest_page = findJsonEntry(_manifest.pages, 'page', _currentPageID);
    for (var i = 0; i < manifest_page.components.length; i++) {
        switch (manifest_page.components[i].type) {
            case 'button':
                buttonIDs.push(manifest_page.components[i].id);
                break;
            case 'toggle_button':
                buttonIDs.push(manifest_page.components[i].id);
                break;
        }
    }
    return buttonIDs;
}

function guiBuilder_buildTextField(GUI, component) {
    var id = component.id;
    var posX = component.offset.x * TILE_SCALE;
    var posY = component.offset.y * TILE_SCALE;
    var sizeW = component.size_tiles.w * TILE_SCALE;
    var sizeH = component.size_tiles.h * TILE_SCALE;

    GUI.addTextField(id, posX, posY, sizeW, sizeH);
    guiBuilder_fillDefault(GUI, id, component);
    guiBuilder_buildMeta(GUI, id, component);

}

function guiBuilder_buildScrollList(GUI, component) {
    var id = component.id;
    var posX = component.offset.x * TILE_SCALE;
    var posY = component.offset.y * TILE_SCALE;
    var sizeW = component.size_tiles.w * TILE_SCALE;
    var sizeH = component.size_tiles.h * TILE_SCALE;
    var items = component.items || [];

    GUI.addScroll(id, posX, posY, sizeW, sizeH, items);
    guiBuilder_buildMeta(GUI, id, component);
}

function guiBuilder_buildDisabledButton(GUI, component) {
    var toggled = !!component.toggled;
    var locked = !!component.locked;

    var textureX = component.tex.x;
    var textureY = component.tex.y;

    if (locked) {
        if (toggled) {
            textureX = component.toggle_disabled_tex.x;
            textureY = component.toggle_disabled_tex.y;
        } else {
            textureX = component.disabled_tex.x;
            textureY = component.disabled_tex.y;
        }
    } else if (toggled) {
        textureX = component.toggle_tex.x;
        textureY = component.toggle_tex.y;
    }
    var id = component.id;
    var posX = component.offset.x * TILE_SCALE;
    var posY = component.offset.y * TILE_SCALE;
    var sizeW = component.size_tiles.w * TILE_SCALE;
    var sizeH = component.size_tiles.h * TILE_SCALE;
    var sheetTexture = guiBuilder_sheetTexture(component.sheet);

    GUI.addTexturedRect(id, sheetTexture, posX, posY, sizeW, sizeH, textureX, textureY);
    guiBuilder_buildMeta(GUI, id, component);

}

function guiBuilder_buildButton(GUI, component) {
    if (component.locked) {
        guiBuilder_buildDisabledButton(GUI, component);
        return;
    }
    var id = component.id;
    var posX = component.offset.x * TILE_SCALE;
    var posY = component.offset.y * TILE_SCALE;
    var sizeW = component.size_tiles.w * TILE_SCALE;
    var sizeH = component.size_tiles.h * TILE_SCALE;
    var textureX = component.tex.x;
    var textureY = component.tex.y;
    var label = component.label || '';
    var sheetTexture = guiBuilder_sheetTexture(component.sheet);

    GUI.addTexturedButton(id, label, posX, posY, sizeW, sizeH, sheetTexture, textureX, textureY);
    guiBuilder_buildMeta(GUI, id, component);

}

function guiBuilder_updateToggleButton(GUI, component, player) {
    GUI.removeComponent(component.id);
    guiBuilder_buildToggleButton(GUI, component);
    GUI.update(player);
}

function guiBuilder_buildToggleButton(GUI, component) {
    if (component.locked) {
        guiBuilder_buildDisabledButton(GUI, component);
        return;
    }
    var toggled = !!component.toggled;
    var disabled = !!component.disabled;

    var textureX = component.tex.x;
    var textureY = component.tex.y;

    if (disabled && component.disabled_tex) {
        textureX = component.disabled_tex.x;
        textureY = component.disabled_tex.y;
    } else if (toggled && component.toggle_tex) {
        textureX = component.toggle_tex.x;
        textureY = component.toggle_tex.y;
    }
    var id = component.id;
    var posX = component.offset.x * TILE_SCALE;
    var posY = component.offset.y * TILE_SCALE;
    var sizeW = component.size_tiles.w * TILE_SCALE;
    var sizeH = component.size_tiles.h * TILE_SCALE;
    var label = component.label || '';
    var sheetTexture = guiBuilder_sheetTexture(component.sheet);

    GUI.addTexturedButton(id, label, posX, posY, sizeW, sizeH, sheetTexture, textureX, textureY);
    guiBuilder_buildMeta(GUI, id, component);
}

function guiBuilder_buildLabel(GUI, component) {
    var id = component.id;
    var label = component.label || '';
    var posX = component.offset.x * TILE_SCALE;
    var posY = component.offset.y * TILE_SCALE;
    var sizeW = component.size_tiles.w * TILE_SCALE;
    var sizeH = component.size_tiles.h * TILE_SCALE;

    posX = posX + (TILE_SCALE / 2);
    sizeW = sizeW - TILE_SCALE;
    posY = posY + (TILE_SCALE / 2);
    sizeH = sizeH - TILE_SCALE;

    GUI.addLabel(id, label, posX, posY, sizeW, sizeH);
    guiBuilder_buildMeta(GUI, id, component);
}

function guiBuilder_buildTexturedRect(GUI, component) {
    var id = component.id;
    var posX = component.offset.x * TILE_SCALE;
    var posY = component.offset.y * TILE_SCALE;
    var sizeW = component.size_tiles.w * TILE_SCALE;
    var sizeH = component.size_tiles.h * TILE_SCALE;
    var textureX = component.tex.x || 0;
    var textureY = component.tex.y || 0;
    var texture = component.texture || '';

    GUI.addTexturedRect(id, texture, posX, posY, sizeW, sizeH, textureX, textureY);
    guiBuilder_buildMeta(GUI, id, component);
}

function guiBuilder_buildItemSlot(GUI, component, world) {
    var id = component.id;
    var rawX = ((component.size_tiles.w - 1)/2) + component.offset.x
    var rawY = ((component.size_tiles.h - 1)/2) + component.offset.y
    var posX = (rawX + ITEM_OFFSET_X) * TILE_SCALE;
    var posY = (rawY + ITEM_OFFSET_Y) * TILE_SCALE;

    // Pre-fill slot with a specified item if provided by the manifest (slot_item mirrors loot table entry shape)
    if (component.slot_item && world) {
        var item_stack = world.createItem(component.slot_item.id, component.slot_item.damage || 0, component.slot_item.count || 1);
        GUI.addItemSlot(posX, posY, item_stack);
    } else {
        GUI.addItemSlot(posX, posY);
    }

    guiBuilder_buildMeta(GUI, id, component);
}

function guiBuilder_fillDefault(GUI, componentID, component) {
    if (component.label == '' || typeof component.label === 'undefined') {
        return;
    }

    if (component.type === 'text_field') {
        var guiComponent = GUI.getComponent(componentID);
        guiComponent.setText(component.label);
    }
}

function guiBuilder_buildMeta(GUI, componentID, component) {
    if (!component.hover_text) {
        return;
    }

    var guiComponent = GUI.getComponent(componentID);
    if (guiComponent && typeof guiComponent.setHoverText === 'function') {
        guiComponent.setHoverText(component.hover_text);
    }
}

function guiBuilder_OpenPage(player, GUI, NewpageID, api) {
    var allIDs = guiBuilder_getAllIDs(_manifest);
    for (var i = 0; i < allIDs.length; i++) {
        GUI.removeComponent(allIDs[i]);
    }

    tellPlayer(player, '&e[GUI Builder] Opening page ' + NewpageID + '.');
    _NPC.getStoreddata().put('dealership_current_page', NewpageID);

    _currentPageID = NewpageID;
    _manifest = guiBuilder_updateManifest(player, _NPC, _manifest);

    GUI = guiBuilder_assembleGUI(GUI, player);

    GUI.update(player);
}

function customGuiButton(event) {
    var b1 = event.buttonId;
    var gui = event.gui;
    load(_guiscript);

    var buttonManifest = findJsonEntry(findJsonEntry(_manifest.pages, 'page', _currentPageID).components, 'id', b1);
    
    var page = _currentPageID;

    if (buttonManifest.hasOwnProperty('open_page')) {
        page = buttonManifest.open_page;
    } else if (buttonManifest.hasOwnProperty('close_gui')) {
        event.player.closeGui();
    } else if (buttonManifest.type === 'toggle_button') {
        buttonManifest.toggled = !buttonManifest.toggled;
        guiBuilder_updateToggleButton(event.gui, buttonManifest, event.player);
    }

    tellPlayer(event.player, '&7Handling button ID: ' + b1 + ' on page ' + page);

    guiButtons(event, _NPC, b1, _currentPageID, _manifest);
    guiBuilder_OpenPage(event.player, event.gui, page, event.API);
}

function customGuiScroll(event) {
    var scrollSelection = event.selection;
    tellPlayer(event.player, 'Scrolled to selection: ' + scrollSelection[0]);
}

function guiBuilder_assembleGUI(GUI, player) {
    // tellPlayer(player, '&e[GUI Builder] Assembling GUI for page ' + _currentPageID + '.');
    var bgTexture = guiBuilder_backgroundTexture();

    GUI.setBackgroundTexture(bgTexture);
    var manifest_page = findJsonEntry(_manifest.pages, 'page', _currentPageID);

    for (var i = 0; i < manifest_page.components.length; i++) {
        var component = manifest_page.components[i];
        if (component.type === 'button') {
            guiBuilder_buildButton(GUI, component);
        } else if (component.type === 'toggle_button') {
            guiBuilder_buildToggleButton(GUI, component);
        } else if (component.type === 'label') {
            guiBuilder_buildLabel(GUI, component);
        } else if (component.type === 'item_slot') {
            guiBuilder_buildItemSlot(GUI, component, player.getWorld());
        } else if (component.type === 'text_field') {
            guiBuilder_buildTextField(GUI, component);
        } else if (component.type === 'scroll_list') {
            guiBuilder_buildScrollList(GUI, component);
        } else if (component.type === 'textured_rect') {
            guiBuilder_buildTexturedRect(GUI, component);
        }
    }
    return GUI;
}

function guiBuilder_buildGuiFromManifest(api, player, manifest, skinPack, pageID, source_path, gui_script, npc) {

    _currentPageID = pageID;
    _manifest = manifest;
    _skinPack = skinPack;
    _guiSourcePath = source_path;
    _guiscript = gui_script;
    _NPC = npc;
    _PLAYER = player;

    var GUI = api.createCustomGui(pageID, manifest.size * TILE_SCALE, manifest.size * TILE_SCALE, false);
    GUI = guiBuilder_assembleGUI(GUI, player);

    player.showCustomGui(GUI);
}