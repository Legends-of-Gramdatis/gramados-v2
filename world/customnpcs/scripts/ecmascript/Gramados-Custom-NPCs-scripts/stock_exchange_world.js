var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

var _TIMER_COUNTER = 1728000; // 24 IRL hours
var _PRICE_EVOLUTION_FACTOR = 0.005;
var STOCK_FILE_PATH = "world/customnpcs/scripts/stock_exchange_data.json";
var REGION_FILE_PATH = "world/customnpcs/scripts/allenis_north_region.json";

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
            updateStockPrice(stocks[stock], regionGenerals[region]);
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

    if (elapsedTime >= _TIMER_COUNTER) {
        if (Math.floor(stockValue["current_price"] * (1 + _PRICE_EVOLUTION_FACTOR)) == stockValue["current_price"]) {
            stockValue["current_price"] += 1;
        } else {
            stockValue["current_price"] = Math.floor(stockValue["current_price"] * (1 + _PRICE_EVOLUTION_FACTOR));
        }
    }

    // Add a random factor to the price
    var randomFactor = Math.floor(Math.min(Math.random() * stockValue["reference_price"] * 0.05, 100));
    randomFactor = Math.random() > 0.5 ? randomFactor : -randomFactor;
    stockValue["current_price"] += randomFactor;

    if (regionGeneral && regionGeneral["stock_multiplier"]) {
        stockValue["current_price"] = Math.floor(stockValue["current_price"] * regionGeneral["stock_multiplier"]);
    }

    stockValue["current_price"] = Math.max(stockValue["min_price"], Math.min(stockValue["current_price"], stockValue["max_price"]));
}

function updateDomainValues() {
    world.broadcast("Updating domain values...");

    var regionData = loadJson(REGION_FILE_PATH);
    if (!regionData) {
        world.broadcast("ERROR: Domain data not found!");
        return;
    }

    for (var domain in regionData["domains"]) {
        updateDomainReputation(regionData["domains"][domain]);
    }

    saveJson(regionData, REGION_FILE_PATH);
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

function loadJson(filePath) {
    if (!checkFileExists(filePath)) {
        npc.say("ERROR: JSON file not found at path: " + filePath);
        return null;
    }

    var fileInputStream = new java.io.FileInputStream(filePath);
    var fileReader = new java.io.InputStreamReader(fileInputStream, "UTF-8");
    var data = '';
    var char;

    while ((char = fileReader.read()) != -1) {
        data += String.fromCharCode(char);
    }

    fileReader.close();
    return JSON.parse(data);
}

function saveJson(data, filePath) {
    var fileWriter = new java.io.FileWriter(filePath);
    fileWriter.write(JSON.stringify(data, null, 4)); // Pretty-print JSON with 4 spaces
    fileWriter.close();
}

function checkFileExists(filePath) {
    var file = new java.io.File(filePath);
    return file.exists();
}