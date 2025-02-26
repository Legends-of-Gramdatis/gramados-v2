// Wine Aging Shelf
// This script adds a wine aging feature to the Growthcraft wine bottles.

// Global variables
var GUI, GRID = 16, BOTTLE_GRID = 26;
var TEXTURE_PATH_BUTTONS = "minecraft:textures/gui/wine_aging_shelf_gui_buttons.png";
var TEXTURE_PATH_BACKGROUND = "minecraft:textures/gui/wine_aging_shelf_gui.png";
var block;

function init(event) {
    if (event.block.storeddata.get("stored_bottles") == null) {
        var stored_bottles = [];
        for (var i = 0; i < 32; i++) {
            stored_bottles[i] = event.block.world.createItem("minecraft:air", 0, 1);
        }
        event.block.storeddata.put("stored_bottles", JSON.stringify(stored_bottles));
    }
    block = event.block;
}

function interact(event) {
    if (event.block.storeddata.get("domain") == null) {
        setupDomain(event, event.player.getName());
    }

    var stored_bottles = JSON.parse(block.storeddata.get("stored_bottles"));
    var item = event.player.getMainhandItem();
    var item_count = item.getStackSize();

    if (item.getName() != "growthcraft_grapes:grapewine") {
        handleNonWineItem(event, item, stored_bottles);
    } else {
        storeWineBottle(event, item, item_count, stored_bottles);
    }

    block.storeddata.put("stored_bottles", JSON.stringify(stored_bottles));
    return true;
}

function handleNonWineItem(event, item, stored_bottles) {
    if (item.getName() == "minecraft:stick") {
        event.player.message("Stored items: " + JSON.stringify(stored_bottles));
    } else if (item.getName() == "minecraft:command_block") {
        event.player.message("Cleaning up broken bottles...");
        stored_bottles = cleanup(event, stored_bottles);
    } else if (item.getName() != "minecraft:air") {
        event.player.message("You can't place " + item.getDisplayName() + " in the shelf to age. You can only place Growthcraft wine bottles.");
    }

    updateBottleAges(event, stored_bottles);
    GUI = event.API.createCustomGui(1, GRID * 12, GRID * 16, false);
    create_GUI(event, GRID, stored_bottles);
    event.player.showCustomGui(GUI);
}

function storeWineBottle(event, item, item_count, stored_bottles) {
    var item_clone = item.copy();
    var item_nbt = createNBTFromBottle(item_clone, event);

    var damage = item_nbt.getInteger("Damage").toString();
    var age = item_nbt.has("Age") ? item_nbt.getString("Age") : "0";
    var bottling_date = item_nbt.has("BottlingDate") ? item_nbt.getString("BottlingDate") : getIRLDate();
    var bottle_date = event.player.getWorld().getTotalTime().toString();

    item_nbt.remove("Count");
    item_nbt.remove("Damage");

    item_nbt.setString("Damage", damage);
    item_nbt.setString("BottlingDate", bottling_date);
    item_nbt.setString("Date", bottle_date);
    item_nbt.setString("Age", age);

    for (var i = 0; i < 32; i++) {
        if (stored_bottles[i] == null && item_count > 0) {
            stored_bottles[i] = item_nbt.toJsonString();
            item_count--;
            event.player.message("You placed " + item_clone.getDisplayName() + " in the shelf to age.");
        }
    }

    item.setStackSize(item_count);
    event.player.setMainhandItem(item);
}

function updateBottleAges(event, stored_bottles) {
    for (var i = 0; i < 32; i++) {
        if (stored_bottles[i] != null) {
            var bottle_nbt = JSON.parse(stored_bottles[i]);
            var age = parseInt(bottle_nbt.Age, 10); // Parse Age as integer
            var bottle_date = parseInt(bottle_nbt.Date, 10); // Parse Date as integer

            var server_date = event.player.getWorld().getTotalTime();
            var time_passed = server_date - bottle_date;
            bottle_nbt.Age = age + time_passed;
            bottle_nbt.Date = server_date;
            stored_bottles[i] = JSON.stringify(bottle_nbt);
        }
    }
}

function create_GUI(event, GRID, stored_bottles) {
    GUI.setBackgroundTexture(TEXTURE_PATH_BACKGROUND);

    var bottle_button_textures = [
        [51, 211], [83, 211], [115, 211], [19, 179], [51, 179], [83, 179], [115, 179], [147, 179],
        [43, 147], [83, 147], [123, 147], [63, 127], [103, 127], [83, 107], [19, 123], [39, 103],
        [59, 83], [19, 83], [39, 63], [19, 43], [147, 123], [127, 103], [147, 83], [107, 83],
        [127, 63], [147, 43], [83, 59], [63, 39], [103, 39], [43, 19], [83, 19], [123, 19]
    ];

    for (var i = 0; i < 32; i++) {
        var x = bottle_button_textures[i][0];
        var y = bottle_button_textures[i][1];
        if (stored_bottles[i] != null) {
            var bottle_nbt = JSON.parse(stored_bottles[i]);
            var age = bottle_nbt.Age;
            var bottling_date = bottle_nbt.BottlingDate;

            var button = GUI.addTexturedButton(i, "", x, y, BOTTLE_GRID, BOTTLE_GRID, TEXTURE_PATH_BUTTONS, 0, 0);
            button.setHoverText(["Bottle Age: " + ticksToMCTime(age), "Bottling Date: " + bottling_date, "Age (in ticks): " + age, "Domain: " + block.storeddata.get("domain"), "Click to drop the bottle."]);
        }
    }
}

// Buttons
function customGuiButton(event) {
    var button_id = event.buttonId;
    var stored_bottles = JSON.parse(block.storeddata.get("stored_bottles"));

    for (var i = 0; i < 32; i++) {
        if (button_id == i && stored_bottles[i] != null) {
            var bottle_nbt = JSON.parse(stored_bottles[i]);
            var item = createBottleFromNBT(event, bottle_nbt);
            stored_bottles[i] = null;
            event.gui.removeComponent(button_id);
            event.player.dropItem(item);
            event.gui.update(event.player);
            event.player.updatePlayerInventory();
        } else if (stored_bottles[i] == null) {
            event.gui.removeComponent(i);
            event.gui.update(event.player);
        }
    }

    block.storeddata.put("stored_bottles", JSON.stringify(stored_bottles));
}

// Function to generate the item from the NBT
function createBottleFromNBT(event, nbt) {
    var item = event.player.getWorld().createItem(nbt.id, parseInt(nbt.Damage), 1);
    item.setStackSize(1);
    item.setLore([
        "Bottle Age: " + ticksToMCTime(parseInt(nbt.Age)),
        "Bottling Date: " + nbt.BottlingDate,
        "Age (in ticks): " + nbt.Age,
        'Domain: ' + block.storeddata.get("domain")
    ]);

    return item;
}

// Function to generate the NBT from the item
function createNBTFromBottle(item, event) {
    var nbt = item.getItemNbt();
    var lore = item.getLore();

    if (lore == null) {
        nbt.setString("BottlingDate", getIRLDate());
        nbt.setString("Age", "0"); // Convert to string
        nbt.setString("Domain", block.storeddata.get("domain"));
        return nbt;
    }

    for (var i = 0; i < lore.length; i++) {
        var parts = lore[i].split(": ");
        if (lore[i].contains("Bottle Age") || lore[i].contains("Age (in ticks)")) {
            nbt.setString("Age", parts[1]);
        } else if (lore[i].contains("Bottling Date")) {
            nbt.setString("BottlingDate", parts[1]);
        } else if (lore[i].contains("Domain")) {
            nbt.setString("Domain", parts[1]);
        }
    }

    return nbt;
}

// Function to convert ticks to MC time
function ticksToMCTime(ticks) {
    var days = Math.floor(ticks / 24000);
    var years = Math.floor(days / 360);
    days = days - years * 360;
    var months = Math.floor(days / 30);
    days = days - months * 30;
    var hours = Math.floor((ticks % 24000) / 1000);

    return years + "/" + months + "/" + days + " ( + " + hours + "h)";
}

// Function to get the date in DD/MM/YYYY HH:MM:SS format
function getIRLDate() {
    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();

    // Add a 0 to the left of the number if it is less than 10
    if (day < 10) day = "0" + day;
    if (month < 10) month = "0" + month;
    if (hours < 10) hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;

    return day + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
}

// Function to clean up broken bottles
function cleanup(event, stored_bottles) {
    for (var i = 0; i < 32; i++) {
        if (stored_bottles[i] != null) {
            var bottle_nbt = JSON.parse(stored_bottles[i]);
            if (bottle_nbt.id == null || bottle_nbt.Damage == null) {
                stored_bottles[i] = null;
            } else {
                var age_string = bottle_nbt.BottlingDate;
                bottle_nbt.Age = MCTimeToTicks(event, parseInt(age_string.split("/")[0]), parseInt(age_string.split("/")[1]), parseInt(age_string.split("/")[2]), parseInt(age_string.split(":")[0]), parseInt(age_string.split(":")[1]), parseInt(age_string.split(":")[2]));
                bottle_nbt.Date = parseInt(bottle_nbt.Date);
                stored_bottles[i] = JSON.stringify(bottle_nbt);
            }
        }
    }
    return stored_bottles;
}

// Function to setup a domain name linked to the shelf
function setupDomain(event, player_name) {
    var allenis_data = load_data(event, "world/customnpcs/scripts/ecmascript/modules/winemaking/domains.json");

    if (allenis_data == null) {
        event.player.message("ERROR: Domain Data is inexistant!");
        event.block.storeddata.put("domain", "No Domain");
        return;
    }

    var player_domain = "No Domain";
    for (var domain in allenis_data.domains) {
        if (allenis_data.domains[domain].owner == player_name) {
            player_domain = allenis_data.domains[domain].display_name;
        }
    }

    event.player.message("The domain linked to this shelf is: " + player_domain);
    event.block.storeddata.put("domain", player_domain);
}

// Function to load allenis data
function load_data(event, data_file_path) {
    if (!check_file_exists(data_file_path)) {
        event.player.message("ERROR: Domain Data is inexistant!");
        return null;
    } else {
        var ips = new java.io.FileInputStream(data_file_path);
        var fileReader = new java.io.InputStreamReader(ips, "UTF-8");
        var readFile = fileReader.read();
        var start = "";
        while (readFile != -1) {
            start += String.fromCharCode(readFile);
            readFile = fileReader.read();
        }

        return JSON.parse(start);
    }
}

// Function to check if a file exists
function check_file_exists(file_path) {
    var file = new java.io.File(file_path);
    return file.exists();
}