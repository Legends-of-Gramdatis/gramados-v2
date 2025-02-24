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

function getMarginGrade(player, listed_price, reference_price, shop_reputation, reference_margin) {
    var return_value = {};
    // tellPlayer(player, "&6Reference margin (before factor): &5" + reference_margin);
    var mr = reference_margin;
    var marginMax = 3;
    var k = 0.007;
    var r = 300;

    var up = marginMax * mr;
    var down = 1 + Math.exp(-k*(shop_reputation-r));
    var perfect_margin = up / down;

    // tellPlayer(player, "&6Up: &5" + up);
    // tellPlayer(player, "&6Down: &5" + down);

    var margin = calculateMargin(reference_price, listed_price);

    // tellPlayer(player, "&6Perfect margin: &5" + perfect_margin.toFixed(2) + "%");
    // tellPlayer(player, "&6Reference margin: &5" + reference_margin.toFixed(2) + "%");
    // tellPlayer(player, "&6Current margin: &5" + margin + "%");
    // tellPlayer(player, "&6Reference price: &5" + getAmountCoin(reference_price));
    // tellPlayer(player, "&6Listed price: &5" + getAmountCoin(listed_price));

    
    var marginGrade = Math.round((perfect_margin / margin) * 100);

    tellPlayer(player, "&6Margin grade: &5" + marginGrade + ", with perfect margin: &5" + perfect_margin.toFixed(2) + "%, current margin: &5" + margin + "%");

    // if margin above perfect margin
    if (margin > perfect_margin * 1.01) {
        return_value.comment = "Overpriced";
        return_value.grade = Math.round((perfect_margin / margin) * 100);
        return_value.current_margin = margin;
        return_value.perfect_margin = perfect_margin;
        return return_value;
    }
    // if margin below perfect margin
    else if (margin < perfect_margin * 0.99) {
        return_value.comment = "Underpriced";
        // cap grade at 80, to prevent exploitation (farming shop reputation by underpricing)
        return_value.grade = Math.round((margin / perfect_margin) * 100);
        return_value.current_margin = margin;
        return_value.perfect_margin = perfect_margin;
        return return_value
    }
    // if margin is perfect
    else {
        return_value.comment = "Perfect";
        return_value.grade = Math.round((perfect_margin / margin) * 100);
        return_value.current_margin = margin;
        return_value.perfect_margin = perfect_margin;
        return return_value;
    }
}