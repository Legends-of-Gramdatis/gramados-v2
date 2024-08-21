/*
This script is for plans to add the truck driver job on the Gramados server.
The final goal is to have several saved destinations, and a GUI to select one of several random delivery (from a point to another).
Each delivery will also fill the truck with a random cargo, and the player will have to deliver it to the destination.

This script is used to create a new point that will be stored in world data to be chosen from for the quest creation script.
*/

// GUI
var GUI, GRID_H = 16, GRID_W = 16, GRID_BORDER = 2;

// file path for the destinations
//var FILE_PATH = "world/customnpcs/scripts/truck_destinations.json";
var FILE_PATH_NEW = "world/customnpcs/scripts/trucker_job_data.json";
var destinations = [];

// Constant IDs for buttons and text fields
var BUTTON_REGION_PREV = 301,
    BUTTON_REGION_NEXT = 302,
    BUTTON_CATEGORY_PREV = 311,
    BUTTON_CATEGORY_NEXT = 312,
    BUTTON_PRODUCER_PREV = 321,
    BUTTON_PRODUCER_NEXT = 322,
    BUTTON_QUANTITY_PREV = 331,
    BUTTON_QUANTITY_NEXT = 332,
    BUTTON_DIFFICULTY_PREV = 341,
    BUTTON_DIFFICULTY_NEXT = 342,
    BUTTON_CANCEL = 13,
    BUTTON_CONFIRM = 14,
    ENTRY_ID = 101,
    ENTRY_NAME = 102,
    ENTRY_X = 103,
    ENTRY_Y = 104,
    ENTRY_Z = 105,
    ENTRY_WHIGHT = 106,
    ENTRY_DESCRIPTION = 200,
    TEXT_REGION = 451,
    TEXT_CATEGORY = 452,
    TEXT_PRODUCER = 453,
    TEXT_DIFFICULTY = 454,
    IMAGE_QUANTITY = 455,
    LIST_TYPE = 100;


//list
var scrollSelection = [];

// currently created point data
var new_wip_destination = {
    key: "",
    name: "",
    description: "",
    region: "",
    x: 0,
    y: 0,
    z: 0,
    access_difficulty: "",

    category: "",
    trade_type: "",
    types: [],
    quantity_factor: 16,
    wheight: 10
};

// list of available regions
var regions = ["Gramados", "Greenfield", "Monsalac", "Farmiston", "Allenis", "Feldpard", "Casco"];

// dictionary of available categories
var categories = {
    "Material": ["wood", "stone", "dirt", "sand", "gravel", "clay", "terracotta", "iron", "steel", "scrap metal", "feldspar", "high quality paper"],
    "Fluid": ["water", "lava", "milk", "oil", "ethanol", "diesel", "biodiesel", "concrete", "biomass"],
    "Food": ["grain", "vegetables", "fruits", "dairy", "cheese", "seafood", "twingo juice"],
    "Organic": ["flowers", "saplings", "seeds"],
    "Animals": ["Angus cow", "Friesian cow", "Hereford cow", "Holstein cow", "Longhorn cow", "Highland cow", "Jersey cow"],
    "Armoury": ["ammo", "missiles", "grenades", "rockets", "handguns", "rifles", "shotguns", "sniper rifles", "machine guns", "rocket launchers"],
};

// list of available trade types
var trade_types = ["Producer", "Consumer"];

// list of access difficulty
var access_difficulty = ["Easy", "Medium", "Hard"];

// List of quantities
var quantities = [16, 32, 48, 96, 144];
var current_quantity = 16;

// Init the item
function init(event) {
    // Get the item
    var item = event.item;
    item.setDurabilityShow(false);
    item.setCustomName("§6§lTrucker's Job Point Generator");

    return true;
}

// Script for scripted item to generate a point on interact
function interact(event) {

    GUI = event.API.createCustomGui(1, GRID_W * 14, GRID_H * 11, false);

    create_GUI(event, GRID_W, GRID_H);

    event.player.showCustomGui(GUI);

    var data = load_data(event, FILE_PATH_NEW);

    /*event.player.message("Loaded data: " + JSON.stringify(data));
    event.player.message("Loaded contents: There are " + data.contents.regions.length + " regions");

    // count the number of destinations (keys in "data.destinations")
    var count = 0;
    for (var key in data.destinations) {
        count++;
    }
    event.player.message("There are " + count + " destinations");*/

    return true;
}

function create_GUI(event, GRID_W, GRID_H) {

    GUI.setBackgroundTexture("minecraft:textures/gui/gramados_trucker_point_gui.png");

    var button_texture_sheet = "minecraft:textures/gui/gramados_trucker_point_putton_textures.png";

    // Name entry
    GUI.addLabel(16, "Name", GRID_W + GRID_BORDER, GRID_H, (GRID_W * 2) - (2 * GRID_BORDER), GRID_H);
    GUI.addTextField(ENTRY_NAME, GRID_BORDER + GRID_W * 3, GRID_H + GRID_BORDER, GRID_W * 4 - 2 * GRID_BORDER, GRID_H - 2 * GRID_BORDER);
    // hover text:
    GUI.getComponent(ENTRY_NAME).setHoverText("Name of the destination");

    // ID entry
    GUI.addLabel(17, "ID", GRID_W + GRID_BORDER, GRID_H * 2, GRID_W * 2, GRID_H);
    GUI.addTextField(ENTRY_ID, GRID_W * 3 + GRID_BORDER, GRID_H * 2 + GRID_BORDER, GRID_W * 4 - 2 * GRID_BORDER, GRID_H - 2 * GRID_BORDER);
    // hover text:
    GUI.getComponent(ENTRY_ID).setHoverText("ID of the destination");

    // X entry
    GUI.addLabel(18, "X", GRID_W + GRID_BORDER, GRID_H * 3, GRID_W * 2, GRID_H);
    GUI.addTextField(ENTRY_X, GRID_W + GRID_BORDER, GRID_H * 4 + GRID_BORDER, GRID_W * 2 - 2 * GRID_BORDER, GRID_H - 2 * GRID_BORDER);

    // Y entry
    GUI.addLabel(19, "Y", GRID_W * 3 + GRID_BORDER, GRID_H * 3, GRID_W * 2, GRID_H);
    GUI.addTextField(ENTRY_Y, GRID_W * 3 + GRID_BORDER, GRID_H * 4 + GRID_BORDER, GRID_W * 2 - 2 * GRID_BORDER, GRID_H - 2 * GRID_BORDER);

    // Z entry
    GUI.addLabel(20, "Z", GRID_W * 5 + GRID_BORDER, GRID_H * 3, GRID_W * 2, GRID_H);
    GUI.addTextField(ENTRY_Z, GRID_W * 5 + GRID_BORDER, GRID_H * 4 + GRID_BORDER, GRID_W * 2 - 2 * GRID_BORDER, GRID_H - 2 * GRID_BORDER);

    // Description entry
    GUI.addLabel(21, "Description", GRID_W + GRID_BORDER, GRID_H * 5, GRID_W * 6, GRID_H);
    GUI.addTextField(ENTRY_DESCRIPTION, GRID_W + GRID_BORDER, GRID_H * 6 + GRID_BORDER, GRID_W * 6 - 2 * GRID_BORDER, GRID_H - 2 * GRID_BORDER);
    GUI.getComponent(ENTRY_DESCRIPTION).setHoverText("Description of the destination");

    // Consumer / Producer
    GUI.addTexturedButton(BUTTON_PRODUCER_PREV, "", GRID_W, GRID_H * 7, GRID_W, GRID_H, button_texture_sheet, GRID_W * 8, 0);
    GUI.addLabel(TEXT_PRODUCER, "Producer", GRID_W * 2 + GRID_BORDER, GRID_H * 7, GRID_W * 4, GRID_H);
    GUI.addTexturedButton(BUTTON_PRODUCER_NEXT, "", GRID_W * 6, GRID_H * 7, GRID_W, GRID_H, button_texture_sheet, GRID_W * 7, 0);
    GUI.getComponent(TEXT_PRODUCER).setHoverText("Weather the destination is a producer or a consumer");


    // Quantity selection
    GUI.addTexturedButton(BUTTON_QUANTITY_PREV, "", GRID_W, GRID_H * 8, GRID_W, GRID_H, button_texture_sheet, GRID_W * 8, 0);
    GUI.addTexturedRect(IMAGE_QUANTITY, button_texture_sheet, GRID_W * 2, GRID_H * 8, GRID_W * 4, GRID_H, 0, GRID_H * (9 + quantities.indexOf(current_quantity)));
    GUI.addTexturedButton(BUTTON_QUANTITY_NEXT, "", GRID_W * 6, GRID_H * 8, GRID_W, GRID_H, button_texture_sheet, GRID_W * 7, 0);
    GUI.getComponent(IMAGE_QUANTITY).setHoverText("Quantity of the cargo, refer to the icons. Current quantity: Up to " + current_quantity * 9 + " stacks / buckets");


    // Region selection
    GUI.addTexturedButton(BUTTON_REGION_PREV, "", GRID_W * 7, GRID_H, GRID_W, GRID_H, button_texture_sheet, GRID_W * 8, 0);
    GUI.addLabel(TEXT_REGION, "", GRID_W * 8 + GRID_BORDER, GRID_H, GRID_W * 4, GRID_H);
    GUI.addTexturedButton(BUTTON_REGION_NEXT, "", GRID_W * 12, GRID_H, GRID_W, GRID_H, button_texture_sheet, GRID_W * 7, 0);
    GUI.getComponent(TEXT_REGION).setHoverText("Select the Island region where the destination is located");

    // Category selection
    GUI.addTexturedButton(BUTTON_CATEGORY_PREV, "", GRID_W * 7, GRID_H * 2, GRID_W, GRID_H, button_texture_sheet, GRID_W * 8, 0);
    GUI.addLabel(TEXT_CATEGORY, "", GRID_W * 8 + GRID_BORDER, GRID_H * 2, GRID_W * 4, GRID_H);
    GUI.addTexturedButton(BUTTON_CATEGORY_NEXT, "", GRID_W * 12, GRID_H * 2, GRID_W, GRID_H, button_texture_sheet, GRID_W * 7, 0);
    GUI.getComponent(TEXT_CATEGORY).setHoverText("Select the category of cargo that can be delivered to or from the destination");

    // Difficulty selection
    GUI.addTexturedButton(BUTTON_DIFFICULTY_PREV, "", GRID_W * 7, GRID_H * 3, GRID_W, GRID_H, button_texture_sheet, GRID_W * 8, 0);
    GUI.addLabel(TEXT_DIFFICULTY, "", GRID_W * 8 + GRID_BORDER, GRID_H * 3, GRID_W * 4, GRID_H);
    GUI.addTexturedButton(BUTTON_DIFFICULTY_NEXT, "", GRID_W * 12, GRID_H * 3, GRID_W, GRID_H, button_texture_sheet, GRID_W * 7, 0);
    GUI.getComponent(TEXT_DIFFICULTY).setHoverText("Select the access difficulty of the destination. Stuff like the type of road, the room to maneuver, etc. are taken into account.");

    

    // Type list
    GUI.addLabel(25, "Type(s)", GRID_W * 7 + GRID_BORDER, GRID_H * 4, GRID_W * 3, GRID_H);
    GUI.addScroll(LIST_TYPE, GRID_W * 7 + GRID_BORDER, GRID_H * 5, GRID_W * 6 - GRID_BORDER * 2, GRID_H * 3, get_type_list()).setMultiSelect(true);
    // hover text:
    GUI.getComponent(25).setHoverText("Select the type(s) of cargo that can be delivered to the destination. Warning: fill this part last, as it is reset when changing the category and other.");

    // Wheight selection
    GUI.addLabel(22, "Wheight", GRID_W * 7 + GRID_BORDER, GRID_H * 8, GRID_W * 3, GRID_H);
    GUI.addTextField(ENTRY_WHIGHT, GRID_W * 10 + GRID_BORDER, GRID_H * 8 + GRID_BORDER, GRID_W * 3 - 2 * GRID_BORDER, GRID_H - 2 * GRID_BORDER);
    GUI.getComponent(ENTRY_WHIGHT).setHoverText("The chance of these cargos to be selected for a delivery. The higher the wheight, the higher the chance.");


    // CANCEL button
    GUI.addTexturedButton(BUTTON_CANCEL, "Cancel", GRID_W, GRID_H * 9, GRID_W * 6, GRID_H, button_texture_sheet, 0, GRID_H * 6 - 1);
    // CONFIRM button
    GUI.addTexturedButton(BUTTON_CONFIRM, "Confirm", GRID_W * 7, GRID_H * 9, GRID_W * 6, GRID_H, button_texture_sheet, 0, GRID_H * 3 - 1);

    // Prefill the GUI with the current point data
    prefill_GUI(event.player);
}


function customGuiButton(event) {
    var b1 = event.buttonId;

    switch (b1) {
        // Cancel
        case BUTTON_CANCEL:
            event.player.closeGui();
            break;
        // Confirm
        case BUTTON_CONFIRM:
            save_GUI_content(event);
            event.player.closeGui();
            break;
        // Region previous
        case BUTTON_REGION_PREV:
            var region = GUI.getComponent(TEXT_REGION).getText();
            var index = regions.indexOf(region);
            if (index > 0) {
                GUI.getComponent(TEXT_REGION).setText(regions[index - 1]);
            }
            update_type_list();
            break;
        // Region next
        case BUTTON_REGION_NEXT:
            var region = GUI.getComponent(TEXT_REGION).getText();
            var index = regions.indexOf(region);
            if (index < regions.length - 1) {
                GUI.getComponent(TEXT_REGION).setText(regions[index + 1]);
            }
            update_type_list();
            break;
        // Category previous
        case BUTTON_CATEGORY_PREV:
            var category = GUI.getComponent(TEXT_CATEGORY).getText();
            var index = Object.keys(categories).indexOf(category);
            if (index > 0) {
                GUI.getComponent(TEXT_CATEGORY).setText(Object.keys(categories)[index - 1]);
            }
            update_type_list();
            break;
        // Category next
        case BUTTON_CATEGORY_NEXT:
            var category = GUI.getComponent(TEXT_CATEGORY).getText();
            var index = Object.keys(categories).indexOf(category);
            if (index < Object.keys(categories).length - 1) {
                GUI.getComponent(TEXT_CATEGORY).setText(Object.keys(categories)[index + 1]);
            }
            update_type_list();
            break;
        // trade type previous
        case BUTTON_PRODUCER_PREV:
            var trade_type = GUI.getComponent(TEXT_PRODUCER).getText();
            var index = trade_types.indexOf(trade_type);
            if (index > 0) {
                GUI.getComponent(TEXT_PRODUCER).setText(trade_types[index - 1]);
            } else {
                GUI.getComponent(TEXT_PRODUCER).setText(trade_types[trade_types.length - 1]);
            }
            update_type_list();
            break;
        // trade type next
        case BUTTON_PRODUCER_NEXT:
            var trade_type = GUI.getComponent(TEXT_PRODUCER).getText();
            var index = trade_types.indexOf(trade_type);
            if (index < trade_types.length - 1) {
                GUI.getComponent(TEXT_PRODUCER).setText(trade_types[index + 1]);
            } else {
                GUI.getComponent(TEXT_PRODUCER).setText(trade_types[0]);
            }
            update_type_list();
            break
        // Quantity previous
        case BUTTON_QUANTITY_PREV:
            var index = quantities.indexOf(current_quantity);
            if (index > 0) {
                current_quantity = quantities[index - 1];
                index = quantities.indexOf(current_quantity);
                //event.player.message("New Quantity: " + current_quantity + " of index " + index);
                GUI.getComponent(IMAGE_QUANTITY).setTextureOffset(0, GRID_H * (9 + index));
            }
            // hover text update
            GUI.getComponent(IMAGE_QUANTITY).setHoverText("Quantity of the cargo, refer to the icons. Current quantity: Up to " + current_quantity * 9 + " stacks / buckets");
            update_type_list();
            break;
        // Quantity next
        case BUTTON_QUANTITY_NEXT:
            var index = quantities.indexOf(current_quantity);
            if (index < quantities.length - 1) {
                current_quantity = quantities[index + 1];
                index = quantities.indexOf(current_quantity);
                //event.player.message("New Quantity: " + current_quantity + " of index " + index);
                GUI.getComponent(IMAGE_QUANTITY).setTextureOffset(0, GRID_H * (9 + index));
            }
            // hover text update
            GUI.getComponent(IMAGE_QUANTITY).setHoverText("Quantity of the cargo, refer to the icons. Current quantity: Up to " + current_quantity * 9 + " stacks / buckets");
            update_type_list();
            break;
        // Difficulty previous
        case BUTTON_DIFFICULTY_PREV:
            var difficulty = GUI.getComponent(TEXT_DIFFICULTY).getText();
            var index = access_difficulty.indexOf(difficulty);
            if (index > 0) {
                GUI.getComponent(TEXT_DIFFICULTY).setText(access_difficulty[index - 1]);
            }
            update_type_list();
            break;
        // Difficulty next
        case BUTTON_DIFFICULTY_NEXT:
            var difficulty = GUI.getComponent(TEXT_DIFFICULTY).getText();
            var index = access_difficulty.indexOf(difficulty);
            if (index < access_difficulty.length - 1) {
                GUI.getComponent(TEXT_DIFFICULTY).setText(access_difficulty[index + 1]);
            }
            update_type_list();
            break;


    }

    event.gui.update(event.player);
}


function customGuiScroll(event) {
    scrollSelection = event.selection;
}

function save_GUI_content(event) {
    var name = event.gui.getComponent(ENTRY_NAME).getText();
    var id = event.gui.getComponent(ENTRY_ID).getText();
    var x = event.gui.getComponent(ENTRY_X).getText();
    var y = event.gui.getComponent(ENTRY_Y).getText();
    var z = event.gui.getComponent(ENTRY_Z).getText();
    var description = event.gui.getComponent(ENTRY_DESCRIPTION).getText();
    var region = event.gui.getComponent(TEXT_REGION).getText();
    var category = event.gui.getComponent(TEXT_CATEGORY).getText();
    var trade_type = event.gui.getComponent(TEXT_PRODUCER).getText();
    var access_difficulty = event.gui.getComponent(TEXT_DIFFICULTY).getText();
    var wheight = event.gui.getComponent(ENTRY_WHIGHT).getText();

    var types = [];
    for (var i = 0; i < scrollSelection.length; i++) {
        types.push(scrollSelection[i]);
        event.player.message("Type: " + scrollSelection[i]);
    }

    new_wip_destination = {
        key: id,
        display_name: name,
        description: description,
        region: region,
        x: x,
        y: y,
        z: z,
        access_difficulty: access_difficulty,

        category: category,
        trade_type: trade_type,
        types: types,
        quantity_factor: current_quantity,
        wheight: wheight
    };

    display_delivry_chat(event);

    event.player.message("Existing destinations: " + destinations.length);
    add_destination(new_wip_destination);
}


function prefill_GUI(player) {

    GUI.getComponent(ENTRY_NAME).setText(new_wip_destination.name);

    // if id is "", then get a new id
    if (new_wip_destination.id == "") {
        new_wip_destination.id = get_available_id()
    }
    GUI.getComponent(ENTRY_ID).setText(new_wip_destination.id);

    // use the player position
    new_wip_destination.x = player.getX();
    new_wip_destination.y = player.getY();
    new_wip_destination.z = player.getZ();
    GUI.getComponent(ENTRY_X).setText(Math.round(new_wip_destination.x));
    GUI.getComponent(ENTRY_Y).setText(Math.round(new_wip_destination.y));
    GUI.getComponent(ENTRY_Z).setText(Math.round(new_wip_destination.z));

    GUI.getComponent(ENTRY_DESCRIPTION).setText(new_wip_destination.description);

    if (new_wip_destination.wheight == "") {
        new_wip_destination.wheight = 10;
    }
    GUI.getComponent(ENTRY_WHIGHT).setText(new_wip_destination.wheight);

    if (new_wip_destination.region == "") {
        new_wip_destination.region = regions[0];
    }
    GUI.getComponent(TEXT_REGION).setText(new_wip_destination.region);

    if (new_wip_destination.category == "") {
        new_wip_destination.category = Object.keys(categories)[0];
    }
    GUI.getComponent(TEXT_CATEGORY).setText(new_wip_destination.category);

    if (new_wip_destination.access_difficulty == "") {
        new_wip_destination.access_difficulty = access_difficulty[0];
    }
    GUI.getComponent(TEXT_DIFFICULTY).setText(new_wip_destination.access_difficulty);


    if (new_wip_destination.types == "") {
        new_wip_destination.types = categories[new_wip_destination.category];
    }

    if (new_wip_destination.trade_type == "") {
        new_wip_destination.trade_type = trade_types[0];
    }
    GUI.getComponent(TEXT_PRODUCER).setText(new_wip_destination.trade_type);

    //GUI.getComponent(ENTRY_QUANTITY_FACTOR).setText(new_wip_destination.quantity_factor);

    update_type_list();

}

function update_type_list() {
    // get the types compatible with the category
    var category = GUI.getComponent(TEXT_CATEGORY).getText();
    var types = categories[category];

    // remove old list
    GUI.removeComponent(LIST_TYPE);
    // add new list
    GUI.addScroll(LIST_TYPE, GRID_W * 7, GRID_H * 5, GRID_W * 6, GRID_H * 3, types).setMultiSelect(true);
}


function get_available_id() {
    var id = 0;
    for (var i = 0; i < destinations.length; i++) {
        if (destinations[i].id == id) {
            id++;
        }
    }
    return id;
}

function get_type_list() {
    var list = [];
    for (var key in categories) {
        //concatenate the list
        list = list.concat(categories[key]);
    }
    return list;
}

function display_delivry_chat(event) {
    event.player.message("Name: " + new_wip_destination.name);
    event.player.message("ID: " + new_wip_destination.id);
    event.player.message("X: " + new_wip_destination.x);
    event.player.message("Y: " + new_wip_destination.y);
    event.player.message("Z: " + new_wip_destination.z);
    event.player.message("Description: " + new_wip_destination.description);
    event.player.message("Region: " + new_wip_destination.region);
    event.player.message("Trade type: " + new_wip_destination.trade_type);
    event.player.message("Quantity factor: " + new_wip_destination.quantity_factor);
    event.player.message("Access difficulty: " + new_wip_destination.access_difficulty);
    event.player.message("Category: " + new_wip_destination.category);
    event.player.message("Types: ");
    for (var i = 0; i < new_wip_destination.types.length; i++) {
        event.player.message(new_wip_destination.types[i]);
    }

    return true;
}


















// Function to add a destination to the json
function save_data(data, file_path) {
    /*if (destinations == "") {
        destinations = [];
    }
    destinations.push(destination);
    create_data();*/
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


// Function to load data
function load_data(event, data_file_path) {
    // Check if the file exists, and create it if it doesn't
    if (!check_file_exists(data_file_path)) {
        create_json_file(data_file_path);
        event.player.message("File created");
    } else {
        event.player.message("File exists");
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

    //event.player.message("Loaded data: " + JSON.stringify(json_data));

    return json_data;
}
