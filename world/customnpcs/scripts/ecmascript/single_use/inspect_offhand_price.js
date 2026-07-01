// Single-use scripted item: inspect the value of the item in offhand.
// Attach this script to a CustomNPCs scripted item, hold the target item in
// offhand, then right-click to price that stack through getPriceFromItemStack.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');

var STOCK_FILE_PATH = 'world/customnpcs/scripts/stock_exchange.json';
var DOMAIN_FILE_PATH = 'world/customnpcs/scripts/ecmascript/modules/winemaking/domains.json';

function normalizeStockItemKey(itemId, itemDamage) {
    return itemId + ':' + itemDamage;
}

function doesStockEntryMatchTag(stockEntry, itemTag) {
    var expectsTag = stockEntry && stockEntry.expects_tag === true;
    var hasTag = itemTag !== null && itemTag !== undefined;

    return expectsTag === hasTag;
}

function readAgeableBoozeData(itemTag) {

    var displayTag = itemTag.getCompound('display');
    if (!displayTag) {
        return null;
    }

    var loreLines = displayTag.getList('Lore', 8);
    if (!loreLines || loreLines.length === 0) {
        return null;
    }

    var data = {
        Age: null,
        Domain: null
    };

    for (var index = 0; index < loreLines.length; index++) {
        var loreLine = loreLines[index];

        if (loreLine.contains('Age (in ticks):')) {
            data.Age = parseInt(loreLine.replace('Age (in ticks): ', ''), 10);
        } else if (loreLine.contains('Domain:')) {
            data.Domain = loreLine.replace('Domain: ', '');
        }
    }

    if (data.Age === null || data.Domain === null) {
        return null;
    }

    return data;
}

function getDomainMultiplierForInspection(domainName) {
    var domainData = loadJson(DOMAIN_FILE_PATH);

    if (!domainData || !domainData.domains) {
        return 1;
    }

    for (var domainKey in domainData.domains) {
        if (!domainData.domains.hasOwnProperty(domainKey)) {
            continue;
        }

        var domainEntry = domainData.domains[domainKey];
        if (domainEntry && domainEntry.display_name === domainName) {
            return domainEntry.reputation || 1;
        }
    }

    return 1;
}

function isItemInStockExchange(itemId, itemDamage, itemTag) {
    var stockExchangeData = loadJson(STOCK_FILE_PATH);

    for (var regionName in stockExchangeData) {
        if (regionName === 'Region Generals') {
            continue;
        }

        if (isItemInStockExchangeRegion(regionName, itemId, itemDamage, itemTag)) {
            return true;
        }
    }

    return false;
}

function getStockExchangeRegionForItem(itemId, itemDamage, itemTag) {
    var stockExchangeData = loadJson(STOCK_FILE_PATH);

    for (var regionName in stockExchangeData) {
        if (regionName === 'Region Generals') {
            continue;
        }

        if (isItemInStockExchangeRegion(regionName, itemId, itemDamage, itemTag)) {
            return regionName;
        }
    }

    return null;
}

function getStockExchangeForItemInRegion(regionName, itemId, itemDamage, itemTag) {
    var stockExchangeData = loadJson(STOCK_FILE_PATH);

    if (stockExchangeData.hasOwnProperty(regionName)) {
        var regionData = stockExchangeData[regionName];
        var itemKey = normalizeStockItemKey(itemId, itemDamage);

        if (regionData.hasOwnProperty(itemKey)) {
            var stockEntry = regionData[itemKey];

            if (doesStockEntryMatchTag(stockEntry, itemTag)) {
                return stockEntry;
            }
        }
    }

    return null;
}

function getStockTypeForItemInRegion(regionName, itemId, itemDamage, itemTag) {
    var stockExchangeData = loadJson(STOCK_FILE_PATH);

    if (stockExchangeData.hasOwnProperty(regionName)) {
        var regionData = stockExchangeData[regionName];
        var itemKey = normalizeStockItemKey(itemId, itemDamage);

        if (regionData.hasOwnProperty(itemKey)) {
            var stockEntry = regionData[itemKey];

            if (doesStockEntryMatchTag(stockEntry, itemTag)) {
                return stockEntry.type || null;
            }
        }
    }

    return null;
}

function isItemInStockExchangeRegion(regionName, itemId, itemDamage, itemTag) {
    var stockExchangeData = loadJson(STOCK_FILE_PATH);
    if (!stockExchangeData.hasOwnProperty(regionName)) {
        return false;
    }

    var regionData = stockExchangeData[regionName];
    var itemKey = normalizeStockItemKey(itemId, itemDamage);

    if (!regionData.hasOwnProperty(itemKey)) {
        return false;
    }

    return doesStockEntryMatchTag(regionData[itemKey], itemTag);
}

function getAgeableBoozePrice(itemId, itemDamage, itemTag) {
    var stockRegion = getStockExchangeRegionForItem(itemId, itemDamage, itemTag);
    if (!stockRegion) {
        return null;
    }

    var entry = getStockExchangeForItemInRegion(stockRegion, itemId, itemDamage, itemTag);
    if (!entry) {
        return null;
    }

    if (entry.type !== 'ageable_booze') {
        return entry.current_price || null;
    }

    var boozeData = readAgeableBoozeData(itemTag);
    if (!boozeData) {
        return entry.current_price || null;
    }

    var stackValue = entry.current_price;
    stackValue += (boozeData.Age / 8640000) * 4000;
    stackValue *= getDomainMultiplierForInspection(boozeData.Domain);

    return Math.round(stackValue);
}

function getPriceFromItemStack(itemStack, defaultPrice, ignoreNBT) {
    if (!itemStack || itemStack.isEmpty()) {
        return defaultPrice;
    }

    var itemId = itemStack.getName();
    var itemDamage = itemStack.getItemDamage();
    var itemTag = itemStack.hasNbt() && !ignoreNBT ? itemStack.getNbt() : null;
    var stackSize = itemStack.getStackSize();
    var stackPrice = defaultPrice;

    if (isItemInStockExchange(itemId, itemDamage, itemTag)) {
        var stockRegion = getStockExchangeRegionForItem(itemId, itemDamage, itemTag);
        var stockExchangeEntry = getStockExchangeForItemInRegion(stockRegion, itemId, itemDamage, itemTag);
        var stockType = getStockTypeForItemInRegion(stockRegion, itemId, itemDamage, itemTag);

        if (stockType === 'ageable_booze') {
            stackPrice = getAgeableBoozePrice(itemId, itemDamage, itemTag);
        } else {
            stackPrice = stockExchangeEntry.current_price;
        }
    }

    if (stackPrice === null || stackPrice === undefined) {
        stackPrice = defaultPrice;
    }

    return stackPrice * stackSize;
}

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
