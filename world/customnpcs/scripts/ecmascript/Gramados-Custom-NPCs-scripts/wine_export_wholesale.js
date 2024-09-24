// Wine export wholesale script for the Custom NPCs mod.
// This scriptadds the ability for the player to sale his aged wine bottles for a price dynamically calculated based on the wine age and quality.

/*
The NPC has a simple GUI with two buttons:
- The first button allows the player to sale his aged wine bottles.
- The second button allows the player to exit the GUI.
The GUI has a slot on the left side where the player can put his aged wine bottle. (1 at a time)
The right side will display the different info about the bottle:
- The wine name
- The price
- The domain it was produced
- the age of the bottle

The domain names are saved, the longer the domain exists, and the more bottles have been sold, the more the price will increase.
The age of the bottle will also increase the price. It is the main variable that will increase the price.
Within a domain, multiple wine types can be sold. The more variety of wine types sold, the more the price will increase.
Some of the wine types are considered more valuable than others. The more valuable the wine type, the more the price will increase.
*/

// Global variables
var GUI, GRID = 16;
var TEXTURE_PATH_BUTTONS = "minecraft:textures/gui/wine_aging_shelf_gui_buttons.png"; // placeholder
var TEXTURE_PATH_BACKGROUND = "minecraft:textures/gui/wine_export_gui.png"; // placeholder
var npc;
var DOMAIN_FILE_PATH = "world/customnpcs/scripts/allenis_north_region.json";
var allenis_data;
var SELL_BUTTON = 11, EXIT_BUTTON = 12, LABEL_WINE_NAME = 13, LABEL_WINE_PRICE = 14, LABEL_WINE_DOMAIN = 15, LABEL_WINE_AGE = 16;

function init(event) {
    npc = event.npc;

    allenis_data = load_data(event, DOMAIN_FILE_PATH);
    npc.say("Allenis data: " + JSON.stringify(allenis_data));

    // check if the NPC has coirrect stored data.
    /*
    Stored data should look like something like this:
    npc_data: {
        "new_crate_wip": {
            "Domain": "*domain name*",
            "Owner": "*player name*",
            "content": {
                "id": "*item id*",
                "Damage": *item damage*,
                "Age": *item age*,
                "BottlingDate": "*bottling date*"
            },
            "count": *number of bottles in the crate (0 to 4)*
        },
        ]
        "stored_cargo_to_export": [
            {
                "Domain": "*domain name*",
                "Owner": "*player name*",
                "content": {
                    "id": "*item id*",
                    "Damage": *item damage*,
                    "Age": *item age*,
                    "BottlingDate": "*bottling date*"
                },
                "count": *number of bottles in the crate (0 to 4)*
            },
            //and more crates. From 0 to 9.
            {...}
        ]
    }

    The WIP crate is added to the stored_cargo_to_export when the player is ready to export the crate, by pressing the "Add Crate" button.
    Then, all the crates are exported when a player presses the "Export" button.
    The more domain variety, the more the price will increase.
    The more bottles sold, the more the price will increase.
    The older the bottle, the more the price will increase.
    The more valuable the wine type, the more the price will increase.
    The more the domain reputation, the more the price will increase.
    The price is calculated dynamically based on the above variables.
    */

    // get npc stored data
    var stored_cargo_to_export = load_cargo();
}

// NPC interaction
function interact(event) {
    npc = event.npc;

    var stored_cargo_to_export = load_cargo();
    npc.say("Stored cargo to export: " + JSON.stringify(stored_cargo_to_export));
    npc.say("Welcome to the wine export wholesale service!");

    // get what the player has in hand:
    var item = event.player.getMainhandItem();

    if (item.getName() != "growthcraft_grapes:grapewine") {
        // Create then open the GUI
        GUI = event.API.createCustomGui(1, 176, 222, false);
        create_GUI(event, GRID, allenis_data);
        event.player.showCustomGui(GUI);
    } else {
        npc.say("This is a wine bottle!");

        // Copy the item in hand
        var item_clone = item.copy();

        processItemStack(event, item_clone, stored_cargo_to_export);

        // Add the custom NBT tags to the item
        // var item_nbt = createNBTFromBottle(item_clone, event);

        // // Get the domain of the bottle
        // var domain = item_nbt.getString("Domain");
        // npc.say("Domain: " + domain);

        // // store the bottle in the stored_cargo_to_export
        // if (stored_cargo_to_export[domain] == null) {
        //     stored_cargo_to_export[domain] = [];
        // }

        // stored_cargo_to_export[domain].push(JSON.parse(item_nbt.toJsonString()));
        // npc.say("Stored cargo to export: " + JSON.stringify(stored_cargo_to_export));

        // // Save the stored_cargo_to_export
        // npc.storeddata.put("stored_cargo_to_export", stored_cargo_to_export);
        // npc.say("Bottle stored in the cargo to export");

        // // Remove the item from the player's inventory
        // event.player.setMainhandItem(null);
    }
}

// function to create a new domain
function createDomain(display_name, owner) {
    var domain = {
        display_name: display_name,
        owner: owner,
        value: 0,
        reputation: 0,
        bottle_variety: {},
        time_since_last_sale: 0
    };
    
    npc.say("Domain created: " + display_name);
    return domain;
}

// function to create the GUI
function create_GUI(event, GRID, allenis_data) {
    GUI.setBackgroundTexture(TEXTURE_PATH_BACKGROUND);
    GUI.addTexturedButton(SELL_BUTTON, "Sell", GRID * 2, GRID * 2, GRID * 4, GRID * 2, TEXTURE_PATH_BUTTONS, 0, 0);
    GUI.addTexturedButton(EXIT_BUTTON, "Exit", GRID * 2, GRID * 10, GRID * 4, GRID * 2, TEXTURE_PATH_BUTTONS, 0, 0);
    GUI.addItemSlot(8, -10);
    GUI.addItemSlot(8, 8);
    GUI.addItemSlot(8, 26);
    GUI.addItemSlot(26, -10);
    GUI.addItemSlot(26, 8);
    GUI.addItemSlot(26, 26);
    GUI.addLabel(LABEL_WINE_NAME, "Wine Name: ", GRID * 8, GRID * 4, GRID * 5, GRID);
    GUI.addLabel(LABEL_WINE_PRICE, "Esteemated Revenue: ", GRID * 8, GRID * 5, GRID * 5, GRID);
    GUI.addLabel(LABEL_WINE_DOMAIN, "Domain: ", GRID * 8, GRID * 6, GRID * 5, GRID);
    GUI.addLabel(LABEL_WINE_AGE, "Export fee: ", GRID * 8, GRID * 7, GRID * 5, GRID);

    GUI.showPlayerInventory(8, 112);
}




// function to load allenis data
function load_data(event, data_file_path) {
    // Check if the file exists, and create it if it doesn't
    if (!check_file_exists(data_file_path)) {
        create_json_file(data_file_path);
        npc.say("File created");
    } else {
        npc.say("File exists");
    }

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

// function to check if a file exists
function check_file_exists(file_path) {
    var file = new java.io.File(file_path);
    return file.exists();
}
// function to create a file
function create_json_file(file_path) {
    var fileWriter = new java.io.FileWriter(file_path);
    fileWriter.write("{}");
    fileWriter.close();
}

function save_data(data, file_path) {
    var fileWriter = new java.io.FileWriter(file_path);
    fileWriter.write(JSON.stringify(data));
    fileWriter.close();
}

function load_cargo() {

    if (npc.storeddata.get("npc_data") == null) {
        npc.say("npc_data does not exist");
        var npc_data = {
            "new_crate_wip": {},
            "stored_cargo_to_export": []
        };
        //convert to string
        var npc_data_save = JSON.stringify(npc_data);
        npc.storeddata.put("npc_data", npc_data_save);
    } else {
        npc.say("npc_data exists");
        npc_data = npc.storeddata.get("npc_data");
    }

    return npc_data;
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

// Function to process an item stack
function processItemStack(event, item_clone, npc_data) {
    
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

    
    // Get the domain of the bottle
    var domain = item_nbt.getString("Domain");

    // get the number of bottles in hand
    var count = item_clone.getStackSize();

    // remove java style "Count" and "Damage" tags
    item_nbt.remove("Count");
    item_nbt.remove("Damage");

    // add the js style tags to the item
    item_nbt.setInteger("Damage", damage);
    item_nbt.setString("BottlingDate", bottling_date);
    item_nbt.setInteger("Age", age);

    //make the npc say the item nbt
    npc.say("Damage: " + item_nbt.getInteger("Damage"));
    npc.say("Bottling Date: " + item_nbt.getString("BottlingDate"));
    npc.say("Age: " + item_nbt.getInteger("Age"));
    npc.say("Domain: " + domain);

    npc.say("npc_data: " + JSON.stringify(npc_data) + " new_crate_wip: " + JSON.stringify(npc_data["new_crate_wip"]));

    // store the bottle in the npc_data as the WIP crate
    if (npc_data["new_crate_wip"] != {}) {
        npc.say("WIP crate exists, add the crate to the export list");
        return npc_data;
    }

    npc_data["new_crate_wip"]["Domain"] = domain;
    npc_data["new_crate_wip"]["Owner"] = event.player.getName();
    npc_data["new_crate_wip"]["content"] = JSON.parse(item_nbt.toJsonString());
    npc_data["new_crate_wip"]["count"] = count;

    npc.say("npc_data: " + JSON.stringify(npc_data) + " new_crate_wip: " + JSON.stringify(npc_data["new_crate_wip"]));

    // Save the npc_data
    npc.storeddata.put("npc_data", npc_data);
    npc.say("Bottle stored in the WIP crate");

    // Remove the item from the player's inventory
    event.player.setMainhandItem(null);

    return npc_data;
}