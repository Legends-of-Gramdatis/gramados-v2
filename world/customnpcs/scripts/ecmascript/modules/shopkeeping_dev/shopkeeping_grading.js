/**
 * Calculates the margin between the listed price and the reference price.
 * @param {number} referencePrice - The reference price of the item.
 * @param {number} listedPrice - The listed price of the item.
 * @returns {number} The margin percentage.
 */
function calculateMargin(referencePrice, listedPrice) {
    if (referencePrice === 0) {
        return 0;
    }
    return ((listedPrice - referencePrice) / referencePrice * 100).toFixed(2);
}

/**
 * Gets the regional demand multiplier for a given region and sub-region.
 * @param {string} region - The region name.
 * @param {string} subRegion - The sub-region name.
 * @returns {number} The demand multiplier.
 */
function getRegionalDemandMultiplier(region, subRegion) {
    var regionalDemand = loadJson(REGIONAL_DEMAND_JSON_PATH)["Local Demands"];
    if (regionalDemand[region] && regionalDemand[region][subRegion]) {
        return regionalDemand[region][subRegion].demand_multiplier || 1;
    }
    return 1;
}

/**
 * Gets the demand for a specific shop type in a given region and sub-region.
 * @param {string} region - The region name.
 * @param {string} subRegion - The sub-region name.
 * @param {string} shopType - The shop type.
 * @returns {number} The demand weight.
 */
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

/**
 * Gets the wealth level for a given region and sub-region.
 * @param {string} region - The region name.
 * @param {string} subRegion - The sub-region name.
 * @returns {number} The wealth level.
 */
function getWealthLevel(region, subRegion) {
    var regionalDemand = loadJson(REGIONAL_DEMAND_JSON_PATH)["Local Demands"];
    if (regionalDemand[region] && regionalDemand[region][subRegion]) {
        return regionalDemand[region][subRegion].wealth_level || 1;
    }
    return 1;
}

/**
 * Gets the number of competitor shops for a given shop type in a region and sub-region.
 * @param {string} region - The region name.
 * @param {string} subRegion - The sub-region name.
 * @param {string} shopType - The shop type.
 * @param {Object} playerShops - The player shops data.
 * @returns {number} The number of competitor shops.
 */
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

/**
 * Gets the bulk purchase multiplier for a given region and sub-region.
 * @param {string} region - The region name.
 * @param {string} subRegion - The sub-region name.
 * @returns {number} The bulk purchase multiplier.
 */
function getBulkPurchaseMultiplier(region, subRegion) {
    var regionalDemand = loadJson(REGIONAL_DEMAND_JSON_PATH)["Local Demands"];
    if (regionalDemand[region] && regionalDemand[region][subRegion]) {
        return regionalDemand[region][subRegion].bulk_multiplier || 1;
    }
    return 1;
}

/**
 * Calculates the margin grade for a listed item.
 * @param {number} listed_price - The listed price of the item.
 * @param {number} reference_price - The reference price of the item.
 * @param {number} shop_reputation - The reputation of the shop.
 * @param {number} reference_margin - The reference margin.
 * @param {number} margin_tolerance - The margin tolerance.
 * @returns {Object} The margin grade data.
 */
function getMarginGrade(listed_price, reference_price, shop_reputation, reference_margin, margin_tolerance) {
    var return_value = {};
    var mr = reference_margin;
    var marginMax = 3;
    var k = 0.007;
    var r = 300;

    var up = marginMax * mr;
    var down = 1 + Math.exp(-k*(shop_reputation-r));
    var perfect_margin = (up / down) * margin_tolerance;

    var margin = calculateMargin(reference_price, listed_price);

    var marginGrade = Math.round((perfect_margin / margin) * 100);

    if (margin > perfect_margin * 1.01) {
        return_value.comment = "Overpriced";
        return_value.grade = Math.round((perfect_margin / margin) * 100);
        return_value.current_margin = margin;
        return_value.perfect_margin = perfect_margin;
        return return_value;
    } else if (margin < perfect_margin * 0.99) {
        return_value.comment = "Underpriced";
        return_value.grade = Math.round((margin / perfect_margin) * 100);
        return_value.current_margin = margin;
        return_value.perfect_margin = perfect_margin;
        return return_value;
    } else {
        return_value.comment = "Perfect";
        return_value.grade = Math.round((perfect_margin / margin) * 100);
        return_value.current_margin = margin;
        return_value.perfect_margin = perfect_margin;
        return return_value;
    }
}

/**
 * Evaluates the reputation of a shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player shops data.
 */
function evalShopReputation(player, shopId, playerShops) {
    var shop = playerShops[shopId];
    var currentReputation = shop.reputation_data.reputation;
    tellPlayer(player, "&aCurrent reputation: &e" + currentReputation);

    var region = shop.property.region;
    var subRegion = shop.property.sub_region;
    var shopType = shop.shop.type;

    var demandMultiplier = getRegionalDemandMultiplier(region, subRegion);
    var shopTypeDemand = getDemandForShopType(region, subRegion, shopType);
    var wealthLevel = getWealthLevel(region, subRegion);
    var competitorCount = getCompetitorShopCount(region, subRegion, shopType, playerShops);
    var bulkMultiplier = getBulkPurchaseMultiplier(region, subRegion);

    tellPlayer(player, "&aRegional demand multiplier: &e" + demandMultiplier);
    tellPlayer(player, "&aDemand for shop type: &e" + shopTypeDemand);
    tellPlayer(player, "&aWealth level of the region: &e" + wealthLevel);
    tellPlayer(player, "&aCompetitor shop count: &e" + competitorCount);
    tellPlayer(player, "&aBulk purchase multiplier: &e" + bulkMultiplier);

    var listedItems = shop.inventory.listed_items;
    for (var itemId in listedItems) {
        var listedItem = listedItems[itemId];
        var referencePrice = getReferencePrice(player, itemId, listedItem.tag);
        var referencePriceAtListing = listedItem.reference_price;
        var margin = calculateMargin(referencePrice, listedItem.price);
        var stockCount = shop.inventory.stock[itemId] ? shop.inventory.stock[itemId].count : 0;

        tellPlayer(player, "&aItem: &e" + itemId);
        tellPlayer(player, "&aReference price: &e" + getAmountCoin(referencePrice));
        tellPlayer(player, "&aReference price at listing: &e" + getAmountCoin(referencePriceAtListing));
        tellPlayer(player, "&aListed price: &e" + getAmountCoin(listedItem.price));
        tellPlayer(player, "&aMargin: &e" + margin + "%");
        tellPlayer(player, "&aStock count: &e" + stockCount);
    }
}

/**
 * Calculates the overall score for a shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player shops data.
 * @param {boolean} [enableMessages=true] - Whether to enable chat messages (tellPlayer).
 * @returns {number} The calculated shop score.
 */
function calculateShopScore(player, shopId, playerShops, enableMessages) {
    if (enableMessages === undefined) {
        enableMessages = true
    }

    var shop = playerShops[shopId];
    var currentReputation = shop.reputation_data.reputation;

    var scaledReputation = 500 / (Math.log(currentReputation + 10) / Math.log(2));

    var region = shop.property.region;
    var subRegion = shop.property.sub_region;
    var shopType = shop.shop.type;

    var demandMultiplier = getRegionalDemandMultiplier(region, subRegion);
    var shopTypeDemand = getDemandForShopType(region, subRegion, shopType);
    var wealthLevel = getWealthLevel(region, subRegion);
    var competitorCount = getCompetitorShopCount(region, subRegion, shopType, playerShops);

    var totalPricingScore = 0;
    var totalItems = 0;
    var stockroomPenalty = 0;

    var listedItems = shop.inventory.listed_items;

    var recommendations = [];

    var shop_categories = loadJson(SHOP_CATEGORIES_JSON_PATH);
    var shop_entry = null;
    for (var i = 0; i < shop_categories["entries"].length; i++) {
        var entry = shop_categories["entries"][i];
        if (entry.name === shopType) {
            shop_entry = entry;
            break;
        }
    }

    var priceTolerance = getModuleValue(shop, "price_tolerance");
    // tellPlayer(player, "&eTotal price tolerance: &a" + priceTolerance);
    priceTolerance += 1;

    for (var itemId in listedItems) {
        var listedItem = listedItems[itemId];
        var referencePrice = getReferencePrice(player, itemId, listedItem.tag);
        var listedPrice = listedItem.price;
        var stockCount = shop.inventory.stock[itemId] ? shop.inventory.stock[itemId].count : 0;

        var marginGradeData = getMarginGrade(listedPrice, referencePrice, currentReputation, shop_entry.general_ref.base_markup, priceTolerance);
        var marginGrade = marginGradeData.grade;

        totalPricingScore += marginGrade;
        totalItems++;

        if (marginGradeData.comment === "Overpriced") {
            if (marginGradeData.grade < 75) {
                if (marginGradeData.grade < 25) {
                    recommendations.push("&l :arrow_r: &7Item &f" + itemId + "&7 is &4heavily overpriced&7. Lower the price immediately.");
                    var penalty = (0.5 - (marginGradeData.perfect_margin / marginGradeData.current_margin)) * 20;
                    stockroomPenalty += penalty;
                } else if (marginGradeData.grade < 50) {
                    recommendations.push("&l :arrow_r: &7Item &f" + itemId + "&7 is &coverpriced&7. Consider lowering the price.");
                } else {
                    recommendations.push("&l :arrow_r: &7Item &f" + itemId + "&7 is &eslightly overpriced&7. Consider lowering the price.");
                }
                var perfectPrice = referencePrice * (1 + marginGradeData.perfect_margin / 100);
                recommendations.push("&l   :arrow_r: &7&r:lit: &bConsider setting the price to &r:money:&e" + getAmountCoin(perfectPrice) + "&b for a &e" + marginGradeData.perfect_margin.toFixed(2) + "%&b margin.");
            } else {
                recommendations.push("&l :arrow_r: &7Item &f" + itemId + "&7 is &awell-priced&7 but could benefit from a small price reduction.");
            }
        } else if (marginGradeData.comment === "Underpriced") {
            if (marginGradeData.grade < 60) {
                recommendations.push("&l :arrow_r: &7Item &f" + itemId + "&7 is &eunderpriced&7. You could raise the price.");
            } else {
                recommendations.push("&l :arrow_r: &7Item &f" + itemId + "&7 is &awell-priced&7 but could benefit from a small price increase.");
            }
        } else {
            recommendations.push("&l :arrow_r: &7Item &f" + itemId + "&7 is &2perfectly priced&7.");
        }

        if (stockCount === 0) {
            recommendations.push("&l :arrow_r: &7Item &f" + itemId + "&4 is out of stock! Restock immediately &7to avoid losing customers.");
            stockroomPenalty += 3;
        }
    }
    
    var pricingScore = totalItems > 0 ? (totalPricingScore / totalItems) - stockroomPenalty : 50;
    pricingScore = Math.max(pricingScore, 0);

    var possibleItemsCount = getPossibleItemsForShopType(player, shopType);
    var listedItemProportion = Object.keys(listedItems).length / possibleItemsCount;
    var listItemProportionScore = Math.min(100, listedItemProportion * 100);

    var demandScore = (shopTypeDemand * wealthLevel * demandMultiplier) / (competitorCount || 1);

    var unstockedListedItems = 0;
    for (var itemId in listedItems) {
        if (shop.inventory.stock[itemId]) {
            if (shop.inventory.stock[itemId].count === 0) {
                unstockedListedItems++;
            }
        }
    }
    var stockedListedItemsScore = 1 - (unstockedListedItems / Object.keys(listedItems).length);
    stockedListedItemsScore *= 100;

    var W1 = 4, W2 = 3, W3 = 1, W4 = 1, W5 = 5;
    var shopScore = (W1 * scaledReputation) + (W2 * marginGrade) + (W3 * listItemProportionScore) + (W4 * demandScore) + (W5 * stockedListedItemsScore);
    shopScore /= (W1 + W2 + W3 + W4 + W5);

    if (enableMessages) {
        tellPlayer(player, "&eScaled Reputation: &a" + scaledReputation.toFixed(2));
        tellPlayer(player, "&ePricing Score: &a" + pricingScore.toFixed(2));
        tellPlayer(player, "&eStocked Listed Items Score: &a" + stockedListedItemsScore.toFixed(2));
        tellPlayer(player, "&eListed Item Proportion Score: &a" + listItemProportionScore.toFixed(2));
        tellPlayer(player, "&eDemand Score: &a" + demandScore.toFixed(2));
    }

    var feedback = "";
    if (shopScore > 80) feedback = "&aYour shop is thriving! Keep up the great work!";
    else if (shopScore > 60) feedback = "&eYour shop is doing well, but there's room for optimization.";
    else if (shopScore > 40) feedback = "&cYour shop is struggling. Check pricing and stock variety.";
    else feedback = "&4Your shop is failing! Consider adjusting prices, stock, and reputation strategies.";

    if (enableMessages) {
        tellPlayer(player, "&eShop Score: &a" + shopScore.toFixed(2));
        tellPlayer(player, feedback);

        var recommendationMessages = [
            "&6Recommendations for improving your shop:"
        ];
        recommendations.forEach(function (recommendation) {
            recommendationMessages.push(recommendation);
        });
        tellPlayer(player, recommendationMessages.join("\n"));
    }

    return shopScore;
}