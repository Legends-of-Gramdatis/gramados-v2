var API = Java.type('noppes.npcs.api.NpcAPI').Instance()

var counter = 0;
var _TIMER_COUNTER = 1728000; // 24 IRL hours
var STOCK_FILE_PATH = "world/customnpcs/scripts/stock_exchange_data.json";

var world = API.getIWorld(0);

function init(event) {
    counter = 0;
    world.broadcast("Stock Exchange World initialized!");
    updateStockValue(event);
    updateDomainValues(event);
}

function tick(event) {
    // world.broadcast("Stock Exchange World ticked!");

    counter++;

    if (counter >= _TIMER_COUNTER) {
        updateStockValue(event);
        updateDomainValues(event);
        counter = 0;
    }
}

function updateStockValue(event) {
    world.broadcast("Updating stock values...");

    var stock_data = load_json(STOCK_FILE_PATH);

    if (stock_data == null) {
        world.broadcast("ERROR: Stock data not found!");
        return;
    }

    for (var region in stock_data) {
        // world.broadcast("Updating stock values for region: " + region);
        var stocks = stock_data[region];

        for (var stock in stocks) {

            // world.broadcast("Updating stock value for stock: " + stock);

            var stock_value = stocks[stock];

            // Get last time the item was sold
            var last_sold_time = stock_value["last_sold_time"];
            var current_time = world.getTotalTime();
            var elapsed_time = 0;
            // If last sold time is not 0
            if (last_sold_time > 0) {
                elapsed_time = current_time - last_sold_time;
            }

            // world.broadcast("Elapsed time since last time one of these items was sold: " + elapsed_time);

            // Get the number of days that have passed
            var days = Math.floor(elapsed_time / _TIMER_COUNTER);
            // world.broadcast("Days since last time one of these items was sold: " + days);

            // world.broadcast("Current stock value for stock " + stock + ": " + stock_value["current_price"]);

            // Increase the stock value by 5% per day
            stock_value["current_price"] = Math.floor(stock_value["current_price"] * (1 + (0.05 * days)));

            // if value is under minimum, set it to minimum
            if (stock_value["current_price"] < stock_value["min_price"]) {
                stock_value["current_price"] = stock_value["min_price"];
            }

            // if value is over maximum, set it to maximum
            if (stock_value["current_price"] > stock_value["max_price"]) {
                stock_value["current_price"] = stock_value["max_price"];
            }

            // world.broadcast("New stock value for stock " + stock + ": " + stock_value["current_price"]);

            stocks[stock] = stock_value;
        }

        stock_data[region] = stocks;
    }

    save_json(stock_data, STOCK_FILE_PATH);
}

function updateDomainValues(event) {
    world.broadcast("Updating domain values...");

    var region_data = load_json("world/customnpcs/scripts/allenis_north_region.json");

    if (region_data == null) {
        world.broadcast("ERROR: Domain data not found!");
        return;
    }

    for (var domain in region_data["domains"]) {
        var domain_data = region_data["domains"][domain];

        // Get the time where the domain sold its last item
        var last_sold_time = domain_data["last_sale_date"];
        var current_time = world.getTotalTime();
        var elapsed_time = current_time - last_sold_time;

        // Get the number of days that have passed
        var days = Math.floor(elapsed_time / _TIMER_COUNTER);
        // world.broadcast("Days since last time this domain sold an item: " + days);

        // world.broadcast("Current domain reputation for domain " + domain_data["display_name"] + ": " + domain_data["reputation"]);

        // If there are 0 days, increase the domain reputation by 5%
        if (days == 0) {
            domain_data["reputation"] = domain_data["reputation"] * 1.05;
        }

        // If there are 7 days, lower the domain reputation by 5%
        if (days >= 7) {
            domain_data["reputation"] = domain_data["reputation"] * 0.95;
        }

        // Get the variety of items sold by the domain
        var variety = domain_data["bottle_variety"];
        for (var i = 0; i < variety.length; i++) {
            domain_data["reputation"] *= 1.05;
        }

        // reset the variety
        domain_data["bottle_variety"] = [];

        // if value is under 1, set it to 1
        if (domain_data["reputation"] < 1) {
            domain_data["reputation"] = 1;
        }

        // floor the value to 3 decimal places
        domain_data["reputation"] = Math.floor(domain_data["reputation"] * 1000) / 1000;

        // world.broadcast("New domain value for domain " + domain_data["display_name"] + ": " + domain_data["reputation"]);

        region_data["domains"][domain] = domain_data;
    }

    save_json(region_data, "world/customnpcs/scripts/allenis_north_region.json");
}

// function to load domain data
function load_json(data_file_path) {
    // Check if the file exists, and create it if it doesn't
    if (!check_file_exists(data_file_path)) {
        npc.say("ERROR: JSON file not found at path: " + data_file_path);
        return null;
    } else {
        var ips = new java.io.FileInputStream(data_file_path);
        var fileReader = new java.io.InputStreamReader(ips, "UTF-8");
        var readFile = fileReader.read();
        var data;
        var start = "";
        while (readFile != -1) {
            data = String.fromCharCode(readFile);
            start = start + data;
            readFile = fileReader.read();
        }

        var json_data = JSON.parse(start);

        // npc.say("Loaded data: " + JSON.stringify(json_data));

        return json_data;
    }
}

// Function to save domain data
function save_json(data, data_file_path) {
    var fileWriter = new java.io.FileWriter(data_file_path);
    fileWriter.write(JSON.stringify(data, null, 4)); // Pretty-print JSON with 4 spaces
    fileWriter.close();
}

// function to check if a file exists
function check_file_exists(file_path) {
    var file = new java.io.File(file_path);
    return file.exists();
}