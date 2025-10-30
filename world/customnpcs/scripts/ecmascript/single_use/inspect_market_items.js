// Admin Single-Use Item: Inspect Market Items
// Usage: Attach to a scripted item. Right-click to list all sellable items in a saved market.
// Notes:
// - Reads NBT-styled JSON using loadJavaJson via utils_trader.readMarketItems
// - Excludes money placeholders named exactly "§2§lMoney§r"
// - Admin-gated: requires OP (present in ops.json)

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_trader.js');

var MARKET_ABSOLUTE_PATH = '/home/mouette/gramados-v2/world/customnpcs/markets/food_state_hotel.json';

function isOp(player){
    try {
        var ops = loadJson('ops.json') || [];
        var pname = String(player.getName());
        for (var i=0;i<ops.length;i++){
            var entry = ops[i];
            var ename = (entry && (entry.name || entry.uuid || entry.profile || entry.ProfileName)) ? (entry.name || entry.ProfileName) : null;
            if (ename && String(ename) === pname) return true;
        }
    } catch(e) { /* ignore; fallback deny */ }
    return false;
}

function interact(e){
    var player = e.player; if (!player) return;
    if (!isOp(player)) { tellPlayer(player, '&cOnly admins can use this tool.'); return; }

    // Header
    tellSeparatorTitle(player, 'Market Items', '&2', '&a');

    // Read items
    var items = [];
    try { items = readMarketItems(MARKET_ABSOLUTE_PATH) || []; } catch (err) { items = []; }

    if (!items.length){
        tellPlayer(player, '&7No sellable items found or market file not readable.');
        return;
    }

    // Print each item: Name (if any) + id + xcount (+ dmg when >0)
    for (var i=0;i<items.length;i++){
        var it = items[i];
        var label = it.name ? (String(it.name) + ' &7(' + it.id + ')') : String(it.id);
        var dmgStr = (it.damage && Number(it.damage) > 0) ? (' &7dmg ' + Number(it.damage)) : '';
        tellPlayer(player, '&7- &e' + label + ' &7x' + Number(it.count) + dmgStr);
    }
}

function getTooltip(e){
    e.add('&6Inspect Market Items');
    e.add('&7Right-click to list items in the saved market.');
}
