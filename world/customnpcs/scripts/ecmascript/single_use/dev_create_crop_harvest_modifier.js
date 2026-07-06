// Single-use scripted item: create a crop harvest active modifier orb from the held stack.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_modifiers.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_modifier_items.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

function interact(event) {
    var player = event.player;
    if (!player) {
        return;
    }

    var stack = player.getMainhandItem();
    if (!stack || stack.isEmpty()) {
        tellPlayer(player, '&cHold a base item in your main hand first.');
        return;
    }

    var modifierItem = instanciate_active_modifier(player, stack.copy(), 'crop harvest');
    if (!modifierItem) {
        tellPlayer(player, '&cCould not create the crop harvest modifier.');
        return;
    }

    setModifierRadius(modifierItem, 30);

    modifierItem.setStackSize(1);
    player.setMainhandItem(modifierItem);
    tellPlayer(player, '&aCreated the crop harvest modifier orb.');
}
