// Wine Aging Shelf
// This script adds a wine aging feature to the Growthcraft wine bottles.

/*
The block data must store an array of 32 IItemStacks.
Each IItemStack must be some sort of wine bottle from the mod Growthcraft.
Within each of those IItemStacks, there must be a custom NBT tag that will store the age of the wine bottle, and the date this bottle was placed in the shelf.
On opening the GUI, the script will read the block data and generate a custom GUI with 32 bottle, that will be represented by a textured button per bottle. (32 buttons in total)
Each bottle in stored data will also have its age increased by the time the bottle was in the shelf (aka add the time between now and the date the bottle was placed in the shelf to the age of the bottle).
When the player clicks on a bottle, the button will be removed and the bottle will be removed from the block data.
At the same time, the player will receive the bottle in his inventory as an Growthcraft wine bottle item with an extra NBT tag that will store the age of the wine bottle.
The player can age further the bottle by placing it again in the shelf.
*/

// Global variables
var GUI, GRID = 16, BOTTLE_GRID = 26;
var TEXTURE_PATH_BUTTONS = "minecraft:textures/gui/wine_aging_shelf_gui_buttons.png";
var TEXTURE_PATH_BACKGROUND = "minecraft:textures/gui/wine_aging_shelf_gui.png";
var block;
var DOMAIN_FILE_PATH = "world/customnpcs/scripts/allenis_north_region.json";



function init(event) {
    // If stored data is empty, create an empty array of 32 IItemStacks
    if (event.block.storeddata.get("stored_bottles") == null) {
        var stored_bottles = [];
        for (var i = 0; i < 32; i++) {
            stored_bottles.push(event.block.world.createItem("minecraft:air", 0, 1));
        }
        event.block.storeddata.put("stored_bottles", JSON.stringify(stored_bottles));
    }

    block = event.block;
}

function interact(event) {

    // If shelf has an domain
    if (event.block.storeddata.get("domain") == null) {
        //event.player.message("This shelf doesn't have a domain linked to it. Please contact an admin to link a domain to it.");
        
        // Get the player name
        var player_name = event.player.getName();

        // Setup the domain name
        setupDomain(event, player_name);
    } /*else {
        event.player.message("This shelf is linked to the domain: " + event.block.storeddata.get("domain"));
    }*/

    var stored_bottles = JSON.parse(block.storeddata.get("stored_bottles"));

    // Clean up broken NBTS
    stored_bottles = cleanup(event, stored_bottles);

    // get what the player has in hand:
    var item = event.player.getMainhandItem();
    //get how many items the player has in hand
    var item_count = item.getStackSize();

    // If player doesn't have any wine bottle in hand, open the GUI
    if (item.getName() != "growthcraft_grapes:grapewine") {

        // If player has something else in hand, tell him he can't place it in the shelf
        //if player has a stick in hand, send him a debug message with the stored data
        if (item.getName() != "minecraft:air" && item.getName() != "minecraft:stick")
        {
            event.player.message("You can't place " + item.getDisplayName() + " in the shelf to age. You can only place Growthcraft wine bottles.");
        } else if (item.getName() == "minecraft:stick") {
            event.player.message("Stored items: " + JSON.stringify(stored_bottles));
        }

        var bottle_count = 0;
        var bottle_indexes = [];

        // Count how many bottles are in the stored data
        for (var i = 0; i < 32; i++) {
            if (stored_bottles[i] != null) {
                bottle_count++;
                bottle_indexes.push(i);

                // Update the age of the bottle
                var bottle_nbt = JSON.parse(stored_bottles[i]);
                var age = bottle_nbt.Age;
                var bottle_date = bottle_nbt.Date;
                var server_date = event.player.getWorld().getTotalTime();
                var time_passed = server_date - bottle_date;
                bottle_nbt.Age = age + time_passed;
                bottle_nbt.Date = server_date;
                //event.player.message("Bottle " + i + " has aged " + time_passed + " ticks. It now has " + bottle_nbt.Age + " ticks. It's Date: " + bottle_nbt.Date + " Server Date: " + server_date);
                stored_bottles[i] = JSON.stringify(bottle_nbt);
            }
        }

        // Create then open the GUI
        GUI = event.API.createCustomGui(1, GRID * 12, GRID * 16, false);
        create_GUI(event, GRID, stored_bottles);
        event.player.showCustomGui(GUI);

    } else {

        // Copy the item in hand
        var item_clone = item.copy();

        // Add the custom NBT tags to the item
        var item_nbt = createNBTFromBottle(item_clone, event);

        // Get the "Damage" tag, and make it JSONable
        var damage = item_nbt.getInteger("Damage");
        damage = damage.toString();
        damage = parseInt(damage);

        // If any, get the "Age" tag, and make it JSONable
        if (item_nbt.has("Age")) {
            var age = item_nbt.getInteger("Age");
            age = age.toString();
            age = parseInt(age);
        } else {
            var age = 0;
        }

        // If any, get the "BottingDate" tag, and make it JSONable
        if (item_nbt.has("BottlingDate")) {
            var bottling_date = item_nbt.getString("BottlingDate");
        } else {
            var bottling_date = getIRLDate();
        }

        // get the date, and make it JSONable
        var bottle_date = event.player.getWorld().getTotalTime();
        bottle_date = bottle_date.toString();
        bottle_date = parseInt(bottle_date);

        // remove java style "Count" and "Damage" tags
        item_nbt.remove("Count");
        item_nbt.remove("Damage");

        // add the js style tags to the item
        item_nbt.setInteger("Damage", damage);
        item_nbt.setString("BottlingDate", bottling_date);
        item_nbt.setInteger("Date", bottle_date);
        item_nbt.setInteger("Age", age);

        // get the first available slot of the array
        for (var i = 0; i < 32; i++) {
            if (stored_bottles[i] == null && item_count > 0) {

                // add the item to the slot
                stored_bottles[i] = item_nbt.toJsonString();
                item_count--;

                // tell the player that the item was placed in the shelf
                event.player.message("You placed " + item_clone.getDisplayName() + " in the shelf to age.");
            }
        }

        // Update stak size of the item in hand
        item.setStackSize(item_count);
        event.player.setMainhandItem(item);
    }

    // Update block stored data
    block.storeddata.put("stored_bottles", JSON.stringify(stored_bottles));

    return true;
}

function create_GUI(event, GRID, stored_bottles) {

    GUI.setBackgroundTexture(TEXTURE_PATH_BACKGROUND);

    // Array with all the bottle button textures positions
    var bottle_button_textures = [
        // First row
        [51, 211], [83, 211], [115, 211],
        // Second row
        [19, 179], [51, 179], [83, 179], [115, 179], [147, 179],
        // Cabinet bottom
        [43, 147], [83, 147], [123, 147],
        [63, 127], [103, 127],
        [83, 107], 
        //cabinet left
        [19, 123], [39, 103], [59, 83],
        [19, 83], [39, 63],
        [19, 43],
        //cabinet right
        [147, 123], [127, 103], [147, 83],
        [107, 83], [127, 63],
        [147, 43],
        //cabinet top
        [83, 59],
        [63, 39], [103, 39],
        [43, 19], [83, 19], [123, 19]
    ];

    // Create the buttons
    for (var i = 0; i < 32; i++) {
        var x = bottle_button_textures[i][0];
        var y = bottle_button_textures[i][1];
        if (stored_bottles[i] != null) {
            // Get some of the bottle NBT data to display on the button
            var bottle_nbt = JSON.parse(stored_bottles[i]);
            var age = bottle_nbt.Age;
            var bottling_date = bottle_nbt.BottlingDate;

            // Create the button
            var button = GUI.addTexturedButton(i, "", x, y, BOTTLE_GRID, BOTTLE_GRID, TEXTURE_PATH_BUTTONS, 0, 0);

            // Set the button hover text
            button.setHoverText(["Bottle Age: " + ticksToMCTime(age), "Bottling Date: " + bottling_date, "Age (in ticks): " + age, "Domain: " + block.storeddata.get("domain"), "Click to drop the bottle."]);
        }
    }
}

// Buttons
function customGuiButton(event) {
    var button_id = event.buttonId;
    //event.player.message("Button ID: " + button_id);
    
    // Get the stored bottles
    var stored_bottles = block.storeddata.get("stored_bottles");
    stored_bottles = JSON.parse(stored_bottles);

    //event.player.message("Stored Bottles: " + stored_bottles);

    for (var i = 0; i < 32; i++) {
        if (button_id == i && stored_bottles[i] != null) {
            //event.player.message("Button ID: " + button_id + " Stored Bottle: " + stored_bottles[i]);

            // Get the bottle NBT
            var bottle_nbt = JSON.parse(stored_bottles[i]);
            
            
            // Create the bottle item
            var item = createBottleFromNBT(event, bottle_nbt);
            // Remove the bottle from the stored data
            stored_bottles[i] = null;
            // Remve the GUI button
            event.gui.removeComponent(button_id);
            // Add the item to the player's inventory
            event.player.dropItem(item);
            /*if (event.player.giveItem(item)) {
                event.player.message("You took the bottle from the shelf.");
            } else {
                event.player.dropItem(item);
                event.player.message("You don't have enough space in your inventory to take the bottle from the shelf. It was dropped on the ground.");
            }*/
            // Update the GUI to remove the bottle's button
            event.gui.update(event.player);
            event.player.updatePlayerInventory();

        } else if (stored_bottles[i] == null) {
            // Security in case the player manages to click multiple bottles at the same time

            event.gui.removeComponent(i);
            event.gui.update(event.player);

        }

    }

    

    // remove the bottle from the stored data
    block.storeddata.put("stored_bottles", JSON.stringify(stored_bottles));
}

//function to generate the item from the nbt
function createBottleFromNBT(event, nbt) {
    //event.player.message("Creating bottle from NBT: " + JSON.stringify(nbt));
    var item = event.player.getWorld().createItem(nbt.id, nbt.Damage, 1);
    item.setStackSize(1);
    //event.player.message("Item: " + item.getDisplayName() + " NBT: " + item.getItemNbt().toJsonString());
    item.setLore(["Bottle Age: " + ticksToMCTime(nbt.Age), "Bottling Date: " + nbt.BottlingDate, "Age (in ticks): " + nbt.Age, 'Domain: ' + block.storeddata.get("domain")]);
    //event.player.message("Item: " + item.getDisplayName() + " NBT: " + item.getItemNbt().toJsonString());

    return item;
}

//function to generate the nbt from the item
function createNBTFromBottle(item, event) {

    
    // Create NBT based on the item
    var nbt = item.getItemNbt();

    // Get the lore of the item
    var lore = item.getLore();

    // Process the lore to get the bottle age and bottling date
    for (var i = 0; i < lore.length; i++) {
        if (lore[i].contains("Bottle Age")) {
            var age = lore[i].split(": ");
            nbt.setInteger("Age", age[1]);
        }
        if (lore[i].contains("Bottling Date")) {
            var bottling_date = lore[i].split(": ");
            nbt.setString("BottlingDate", bottling_date[1]);
        }
        if (lore[i].contains("Age (in ticks)")) {
            var age_ticks = lore[i].split(": ");
            nbt.setInteger("Age", age_ticks[1]);
        }
        if (lore[i].contains("Domain")) {
            var domain = lore[i].split(": ");
            nbt.setString("Domain", domain[1]);
        }
    }

    // return the NBT
    return nbt;
}

// Function to convert ticks to MC time
function ticksToMCTime(ticks) {
    //there are 24000 ticks in a day.
    // Get the number of days
    var days = Math.floor(ticks / 24000);

    // From "days", get the number of years, months and days
    var years = Math.floor(days / 360);
    days = days - years * 360;
    var months = Math.floor(days / 30);
    days = days - months * 30;
    
    // Get the number of hours
    var hours = Math.floor((ticks % 24000) / 1000);

    var date = years + "/" + months + "/" + days + " ( + " + hours + "h)";

    return date;
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
    if (day < 10) {
        day = "0" + day;
    }
    if (month < 10) {
        month = "0" + month;
    }
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }


    return day + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
}

// function to clean up broken bottles
function cleanup(event, stored_bottles) {
    // For each bottle in the stored data
    for (var i = 0; i < 32; i++) {
        // If the bottle is missing one of the required tags, remove it from the stored data
        if (stored_bottles[i] != null) {
            var bottle_nbt = event.API.stringToNbt(stored_bottles[i]);
            //event.player.message("Bottle NBT: " + JSON.stringify(bottle_nbt));
            if (!bottle_nbt.has("Age") || !bottle_nbt.has("BottlingDate") || !bottle_nbt.has("Date") || !bottle_nbt.has("id") || !bottle_nbt.has("Damage")) {
                stored_bottles[i] = null;
            }
        }
    }
    
    return stored_bottles;
}

// Function to setup a domain name linked to the shelf
function setupDomain(event, player_name) {
    //event.player.message("Setting up domain for player: " + player_name);
    // Get the stored data
    var allenis_data = load_data(event, DOMAIN_FILE_PATH);

    //event.player.message("Allenis data: " + JSON.stringify(allenis_data));

    if (allenis_data == null) {
        event.player.message("ERROR: Domain Data is inexistant!");
        event.block.storeddata.put("domain", "No Domain");
        return;
    } else {
        // for all domains in the data, look for the one owned by the player
        var player_domain = "No Domain";
        for (var domain in allenis_data.domains) {
            if (allenis_data.domains[domain].owner == player_name) {
                //event.player.message("Player Domain: " + allenis_data.domains[domain].display_name);
                player_domain = allenis_data.domains[domain].display_name;
            }
        }

        event.player.message("The domain linked to this shelf is: " + player_domain);
        // store the domain name in the shelf
        event.block.storeddata.put("domain", player_domain);
    }
}

// function to load allenis data
function load_data(event, data_file_path) {
    // Check if the file exists, and create it if it doesn't
    if (!check_file_exists(data_file_path)) {
        event.player.message("ERROR: Domain Data is inexistant!");
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

        //npc.say("Loaded data: " + JSON.stringify(json_data));

        return json_data;
    }
}

// function to check if a file exists
function check_file_exists(file_path) {
    var file = new java.io.File(file_path);
    return file.exists();
}