function calculateMargin(referencePrice, listedPrice) {
    if (referencePrice === 0) {
        return listedPrice > 0 ? 100 : -100;
    }
    return ((listedPrice - referencePrice) / referencePrice * 100).toFixed(2);
}

function getRegionalDemandMultiplier(region, subRegion) {
    var regionalDemand = loadJson(REGIONAL_DEMAND_JSON_PATH)["Local Demands"];
    if (regionalDemand[region] && regionalDemand[region][subRegion]) {
        return regionalDemand[region][subRegion].demand_multiplier || 1;
    }
    return 1;
}

function getDemandForShopType(region, subRegion, shopType) {
    var regionalDemand = loadJson(REGIONAL_DEMAND_JSON_PATH)["Local Demands"];
    if (regionalDemand[region] && regionalDemand[region][subRegion] && regionalDemand[region][subRegion].entries) {
        var entries = regionalDemand[region][subRegion].entries;
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].name === shopType) {
                return entries[i].wheight || 10;
            }
        }
    }
    return 10;
}

function getWealthLevel(region, subRegion) {
    var regionalDemand = loadJson(REGIONAL_DEMAND_JSON_PATH)["Local Demands"];
    if (regionalDemand[region] && regionalDemand[region][subRegion]) {
        return regionalDemand[region][subRegion].wealth_level || 1;
    }
    return 1;
}

function getCompetitorShopCount(region, subRegion, shopType, playerShops) {
    var count = 0;
    for (var shopId in playerShops) {
        var shop = playerShops[shopId];
        if (shop.property.region === region && shop.property.sub_region === subRegion && shop.shop.type === shopType) {
            count++;
        }
    }
    return count;
}

function getBulkPurchaseMultiplier(region, subRegion) {
    var regionalDemand = loadJson(REGIONAL_DEMAND_JSON_PATH)["Local Demands"];
    if (regionalDemand[region] && regionalDemand[region][subRegion]) {
        return regionalDemand[region][subRegion].bulk_multiplier || 1;
    }
    return 1;
}