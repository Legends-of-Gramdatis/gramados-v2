load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

var SINGLE_PURCHASE_HISTORY_PATH = 'world/customnpcs/scripts/data_auto/single_purchase_npc_history.json';
var CONFIRM_WINDOW_MS = 5000;

var SD_ITEM_ID_KEY = 'single_purchase_item_id';
var SD_PRICE_CENTS_KEY = 'single_purchase_price_cents';

function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var offhand = player.getOffhandItem();
    var mainhand = player.getMainhandItem();

    if (isAdmin(offhand)) {
        if (isBarrier(mainhand)) {
            adminResetPlayerPurchase(npc, player);
            tellPlayer(player, '&a[Admin] Purchase history reset for player: ' + player.getName());
            return;
        }

        if (isNameTag(mainhand)) {
            var cents = extractCentsFromNameTag(mainhand);
            if (cents <= 0) {
                tellPlayer(player, '&c[Admin] Name tag must contain a positive number of cents.');
                return;
            }
            npc.getStoreddata().put(SD_PRICE_CENTS_KEY, String(cents));
            tellPlayer(player, '&a[Admin] Price set to ' + formatMoney(cents) + '&a.');
            return;
        }

        if (isSellMarker(mainhand)) {
            var sellItemId = mainhand.getName();
            npc.getStoreddata().put(SD_ITEM_ID_KEY, sellItemId);
            tellPlayer(player, '&a[Admin] Sell item set to: ' + sellItemId);
            return;
        }

        showAdminConfigurationHelp(npc, player);
        return;
    }

    if (!isNpcConfigured(npc)) {
        tellPlayer(player, '&eI am not configured yet. Ask an admin to set my price and item.');
        return;
    }

    if (hasPlayerPurchased(npc, player.getName())) {
        tellPlayer(player, '&cYou already purchased this item. This is a one-time purchase.');
        return;
    }

    var priceCents = getNpcPriceCents(npc);
    if (!hasMoneyInPouch(player, priceCents)) {
        tellPlayer(player, '&cYou do not have enough money. Price: ' + formatMoney(priceCents));
        return;
    }

    var tempData = npc.getTempdata();
    var confirmKey = getConfirmKey(player.getName());
    var now = Date.now();

    if (tempData.has(confirmKey)) {
        var confirmUntil = parseInt(tempData.get(confirmKey));
        if (now <= confirmUntil) {
            completePurchase(npc, player, priceCents, confirmKey);
            return;
        }
        tempData.remove(confirmKey);
    }

    tempData.put(confirmKey, String(now + CONFIRM_WINDOW_MS));
    tellPlayer(player, 'are you sure you want to purchase this item for ' + formatMoney(priceCents) + '? Interact again within 5 seconds to confirm.');
}

function completePurchase(npc, player, priceCents, confirmKey) {
    var itemId = npc.getStoreddata().get(SD_ITEM_ID_KEY);
    var reward = npc.getWorld().createItem(itemId, 0, 1);

    if (!reward || reward.isEmpty() || reward.getName() == 'minecraft:air') {
        npc.getTempdata().remove(confirmKey);
        tellPlayer(player, '&cThis NPC has an invalid configured sell item. Ask an admin to fix it.');
        return;
    }

    if (!extractMoneyFromPouch(player, priceCents)) {
        npc.getTempdata().remove(confirmKey);
        tellPlayer(player, '&cYou no longer have enough money. Price: ' + formatMoney(priceCents));
        return;
    }

    player.giveItem(reward);
    markPlayerPurchased(npc, player.getName());
    npc.getTempdata().remove(confirmKey);

    tellPlayer(player, '&aPurchase confirmed. You paid ' + formatMoney(priceCents) + '&a.');
    logToFile('economy', '[single_purchase_npc] ' + player.getName() + ' bought ' + itemId + ' for ' + getAmountCoin(priceCents) + ' at ' + getNpcHistoryKey(npc));
}

function isAdmin(offhandItem) {
    return offhandItem && !offhandItem.isEmpty() && offhandItem.getName() == 'mts:ivv.idcard_seagull';
}

function isBarrier(item) {
    return item && !item.isEmpty() && item.getName() == 'minecraft:barrier';
}

function isNameTag(item) {
    return item && !item.isEmpty() && item.getName() == 'minecraft:name_tag';
}

function isSellMarker(item) {
    if (!item || item.isEmpty()) {
        return false;
    }
    var display = stripColors(item.getDisplayName()).toLowerCase();
    return display == 'sell';
}

function extractCentsFromNameTag(item) {
    var raw = stripColors(item.getDisplayName());
    var digits = raw.replace(/[^0-9]/g, '');
    if (digits == '') {
        return 0;
    }
    return parseInt(digits);
}

function isNpcConfigured(npc) {
    var sd = npc.getStoreddata();
    return sd.has(SD_ITEM_ID_KEY) && sd.has(SD_PRICE_CENTS_KEY);
}

function getNpcPriceCents(npc) {
    return parseInt(npc.getStoreddata().get(SD_PRICE_CENTS_KEY));
}

function getConfirmKey(playerName) {
    return 'single_purchase_confirm_' + playerName;
}

function getNpcHistoryKey(npc) {
    return npc.getName() + '@' + Math.floor(npc.getX()) + ',' + Math.floor(npc.getY()) + ',' + Math.floor(npc.getZ());
}

function readPurchaseHistory() {
    if (!checkFileExists(SINGLE_PURCHASE_HISTORY_PATH)) {
        return {};
    }
    var history = loadJson(SINGLE_PURCHASE_HISTORY_PATH);
    if (!history) {
        return {};
    }
    return history;
}

function savePurchaseHistory(history) {
    saveJson(history, SINGLE_PURCHASE_HISTORY_PATH);
}

function hasPlayerPurchased(npc, playerName) {
    var history = readPurchaseHistory();
    var npcKey = getNpcHistoryKey(npc);
    if (!history[npcKey]) {
        return false;
    }
    return history[npcKey][playerName] === true;
}

function markPlayerPurchased(npc, playerName) {
    var history = readPurchaseHistory();
    var npcKey = getNpcHistoryKey(npc);

    if (!history[npcKey]) {
        history[npcKey] = {};
    }

    history[npcKey][playerName] = true;
    savePurchaseHistory(history);
}

function adminResetPlayerPurchase(npc, player) {
    var history = readPurchaseHistory();
    var npcKey = getNpcHistoryKey(npc);
    var playerName = player.getName();

    if (!history[npcKey]) {
        history[npcKey] = {};
    }

    if (history[npcKey][playerName]) {
        delete history[npcKey][playerName];
    }

    if (Object.keys(history[npcKey]).length == 0) {
        delete history[npcKey];
    }

    savePurchaseHistory(history);
    npc.getTempdata().remove(getConfirmKey(playerName));
}

function showAdminConfigurationHelp(npc, player) {
    var sd = npc.getStoreddata();
    var configuredItem = sd.has(SD_ITEM_ID_KEY) ? sd.get(SD_ITEM_ID_KEY) : 'not set';
    var configuredPrice = sd.has(SD_PRICE_CENTS_KEY) ? parseInt(sd.get(SD_PRICE_CENTS_KEY)) : -1;
    var priceText = configuredPrice >= 0 ? formatMoney(configuredPrice) : 'not set';

    storytellPlayer(player, [
        '&6[Admin Setup] Single Purchase NPC',
        '&7You have the Seagull ID card in offhand. Use these mainhand items to configure:',
        '&e1) Name Tag &7(renamed to a number in cents) &r-> &aset price',
        '&8   Example: name tag "12500" sets price to 125g.',
        '&e2) Any item renamed "sell" &r-> &asets that item ID as sold item',
        '&8   Keep the item itself in mainhand while interacting.',
        '&e3) Barrier &r-> &cresets this player purchase history for this NPC',
        '&8   Useful for testing one-time purchase behavior.',
        '&7Current sold item: &f' + configuredItem,
        '&7Current price: &f' + priceText
    ]);
}
