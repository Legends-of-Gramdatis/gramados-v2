// Single-use scripted item: inspect the value of the item in offhand.
// Attach this script to a CustomNPCs scripted item, hold the target item in
// offhand, then right-click to price that stack through getPriceFromItemStack.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js');

function interact(event) {
    var player = event.player;
    if (!player) {
        return;
    }

    var offhandItem = player.getOffhandItem();
    if (!offhandItem || offhandItem.isEmpty()) {
        tellPlayer(player, '&cHold an item in your offhand first.');
        return;
    }

    var priceCents = getPriceFromItemStack(offhandItem, -1, false);
    tellPlayer(player, '&eOffhand item: &f' + offhandItem.getDisplayName());
    tellPlayer(player, '&eStack value: &6' + getAmountCoin(priceCents));
}
