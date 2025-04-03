load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

var _TIMER_COUNTER = 1728000; // 24 IRL hours
var _OFFER_AND_DEMAND_FACTOR = 0.005; // 0.5% increase/decrease
var _RANDOM_FACTOR = 0.1; // 10% random factor
var STOCK_FILE_PATH = "world/customnpcs/scripts/stock_exchange.json";
var DOMAINS_FILE_PATH = "world/customnpcs/scripts/ecmascript/modules/winemaking/domains.json";

var world = API.getIWorld(0);

function init(event) {
    world.broadcast("Stock Exchange World initialized!");
    updateStockValue();
    updateDomainValues();
}

function updateStockValue() {
    world.broadcast("Updating stock values...");

    var stockData = loadJson(STOCK_FILE_PATH);
    if (!stockData) {
        world.broadcast("ERROR: Stock data not found!");
        return;
    }

    var regionGenerals = stockData["Region Generals"];
    delete stockData["Region Generals"];

    for (var region in stockData) {
        var stocks = stockData[region];
        for (var stock in stocks) {
            stocks[stock] = updateStockPrice(stocks[stock], regionGenerals[region]);
        }
        stockData[region] = stocks;
    }

    stockData["Region Generals"] = regionGenerals;
    saveJson(stockData, STOCK_FILE_PATH);
}

function updateStockPrice(stockValue, regionGeneral) {
    var lastSoldTime = stockValue["last_sold_time"];
    var currentTime = world.getTotalTime();
    var elapsedTime = lastSoldTime > 0 ? currentTime - lastSoldTime : 0;
    // world.broadcast("Elapsed time since last sale for " + stockValue["display_name"] + ": " + elapsedTime);

    // If the stock is "active" (has been sold at least once), update its price
    if (elapsedTime != 0) {
        var sixHours = _TIMER_COUNTER / 4; // 432000

        if (elapsedTime < sixHours) { // Less than 432000
            // world.broadcast("Stock " + stockValue["display_name"] + " is in phase 1! (less than 6 hours)");
            // If last sale is less than 6 hours ago, lower the stock price
            var proportion = _OFFER_AND_DEMAND_FACTOR;
            if (regionGeneral && regionGeneral["stock_flexibility"] != null) {
                proportion *= regionGeneral["stock_flexibility"];
            }
            var percent = 1 - proportion;
            stockValue["current_price"] = Math.round(stockValue["current_price"] * percent);

        } else if (elapsedTime > sixHours*2 && elapsedTime < _TIMER_COUNTER) { // Between 864000 and 1728000
            // world.broadcast("Stock " + stockValue["display_name"] + " is in phasse 2! (between 12 and 24 hours)");
            // If last sale is between 12 and 24 hours ago, increase the stock price

            var proportion = _OFFER_AND_DEMAND_FACTOR;
            if (regionGeneral && regionGeneral["stock_flexibility"] != null) {
                proportion *= regionGeneral["stock_flexibility"];
            }
            var percent = 1 + proportion;
            stockValue["current_price"] = Math.round(stockValue["current_price"] * percent);
        } else if (elapsedTime > _TIMER_COUNTER && elapsedTime < _TIMER_COUNTER*2) { // Between 1728000 and 3456000
            // world.broadcast("Stock " + stockValue["display_name"] + " is in phase 3! (between 24 and 48 hours)");

            var maxPrice = stockValue["max_price"];
            var diff = 0;
            if (
                stockValue["current_price"] < 
                Math.max(stockValue["reference_price"], stockValue["current_price"])
            ) {
                diff = maxPrice / stockValue["current_price"];
            } else {
                diff = stockValue["current_price"] / maxPrice;
            }

            diff--;

            var proportion = diff / 4;
            if (regionGeneral && regionGeneral["stock_flexibility"] != null) {
                proportion *= regionGeneral["stock_flexibility"];
            }
            var random = Math.random();
            var percent = 1 + (random * proportion);
            stockValue["current_price"] = Math.floor(stockValue["current_price"] * percent);
        }
    }

    // world.broadcast("Applying random factor to stock " + stockValue["name"] + "...");
    
    var cap = Math.max(stockValue["reference_price"] * 0.055, 20);

    // If last sale is more than 48 hours ago, randomly adjust the stock price closer to the reference price
    var randomFactor = Math.floor(Math.min(Math.random() * stockValue["reference_price"] * _RANDOM_FACTOR, cap));

    /* 
        This will give a value between 0 and 1. If at 0.5, the current price is close to the reference price
        If the value is higher, the current price is higher than the reference price
        If the value is lower, the current price is lower than the reference price

        Therefore, the stock price will have a higher chance of increasing if the current price is lower than the reference price, but still have a chance of decreasing.
        This decrease chance gets lower as the current price gets closer to the reference price.

        We will use the output of this formula to determine if the random factor should be positive or negative.
    */
    var randomProbability = (stockValue["current_price"] / 2) / stockValue["reference_price"];

    if (Math.random() < randomProbability) {
        randomFactor *= -1;
    }

    stockValue["current_price"] += randomFactor;

    // Apply the stock multiplier if it exists
    if (regionGeneral && regionGeneral["stock_multiplier"]) {
        stockValue["current_price"] = Math.floor(stockValue["current_price"] * regionGeneral["stock_multiplier"]);
    }

    // Cap the stock price between the min and max values
    stockValue["current_price"] = Math.max(stockValue["min_price"], Math.min(stockValue["current_price"], stockValue["max_price"]));

    return stockValue;
}

function updateDomainValues() {
    world.broadcast("Updating domain values...");

    var regionData = loadJson(DOMAINS_FILE_PATH);
    if (!regionData) {
        world.broadcast("ERROR: Domain data not found!");
        return;
    }

    for (var domain in regionData["domains"]) {
        updateDomainReputation(regionData["domains"][domain]);
    }

    saveJson(regionData, DOMAINS_FILE_PATH);
}

function updateDomainReputation(domainData) {
    var lastSoldTime = domainData["last_sale_date"];
    var currentTime = world.getTotalTime();
    var days = Math.floor((currentTime - lastSoldTime) / _TIMER_COUNTER);

    if (days == 0) {
        domainData["reputation"] *= 1.05;
    } else if (days >= 7) {
        domainData["reputation"] *= 0.95;
    }

    domainData["reputation"] *= Math.pow(1.05, domainData["bottle_variety"].length);
    domainData["bottle_variety"] = [];
    domainData["reputation"] = Math.max(1, Math.floor(domainData["reputation"] * 1000) / 1000);
}
