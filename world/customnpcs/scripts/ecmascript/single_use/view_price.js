load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');

function interact(event) {
    var npc = event.npc;
    var world = npc.getWorld();

    // get player hand item
    var player = event.player;
    var item = player.getMainhandItem().copy();
    var price = getPriceFromItemStack(item, null, false);

    tellPlayer(player, "&aItem: " + item.getName());
    tellPlayer(player, "&aPrice: " + formatMoney(price));
}