load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

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
    if (!itemTag) {
        return null;
    }

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
