// GUI
var GUI, GRID = 16, GRID_BORDER = 2;

// buttons
var BUTTON_CLOSE = 1;
var EMERGENCY_RESET = 2;

// file path for the destinations
var FILE_PATH = "world/customnpcs/scripts/players_phone.json";
var PHONE_FILE_PATH = "world/customnpcs/scripts/players_phone.json";



var BUTTON_TEXTURE_PATH = "minecraft:textures/gui/gramados_trucker_point_putton_textures.png";

// currently selected app
var current_app = "home";

//var player;

var personal_phone_data;




// list of all available apps
var apps = {
    "Trucker App": trucker_app
};

// Init the item
function init(event) {
    // Get the item
    var item = event.item;
    item.setDurabilityShow(false);
    item.setCustomName("§6§lSmartphone");

    return true;
}

// Script for scripted item to generate a point on interact
function interact(event) {

    personal_phone_data = check_user(event.player.getName(), event);

    GUI = event.API.createCustomGui(1, GRID * 12, GRID * 16, false);

    GUI.setBackgroundTexture("minecraft:textures/gui/gramados_smartphone_gui.png");

    home_app(event);

    event.player.showCustomGui(GUI);

    //player = event.player;

    return true;
}

/*function tick(event) {
    player = event.player;
    return true;
}*/


function customGuiButton(event) {
    var b1 = event.buttonId;
    var player = event.player;

    switch (b1) {
        case EMERGENCY_RESET:
            // reset the phone data
            var phone_data = read_file(PHONE_FILE_PATH);
            var phone_data_json = JSON.parse(phone_data);
            phone_data_json[player.getName()] = {
                "uuid": player.getUUID(),
                "apps": []
            };
            create_data(PHONE_FILE_PATH, phone_data_json);
            player.message("Phone data reset");

            // close the GUI
            event.player.closeGui();

            break;
        case 16:
            if (current_app == "home")
                switch_app(event, app_store);
            break;
        case BUTTON_CLOSE:
            switch_app(event, home_app);
            break;
        
        case 33:
            complete_trucker_quest(event);
            break;
        case 34:
            player.message("Canceling quest");
            break;
    }
    if (b1 > 400 && b1 < 500) {
        var app_name = GUI.getComponent(b1 - 100).getText();
        var app_installed = check_app_installed(personal_phone_data, app_name);

        event.player.message("Installing " + app_name + " app");

        //player.message("phone data: " + JSON.stringify(personal_phone_data));

        if (!app_installed) {
            personal_phone_data.apps.push({
                "name": app_name,
                "data": {}
            });

            player.message("Installing " + app_name + " app with data: " + JSON.stringify(personal_phone_data));

            update_phone_data(event.player.getName(), JSON.stringify(personal_phone_data));
            switch_app(event, apps[app_name]);
        }
    }
    if (b1 > 100 && b1 < 200) {
        var app_name = GUI.getComponent(b1).getLabel();
        /*
        player.message("Switching to " + app_name + " app");
        player.message("Current app: " + current_app);
        player.message("apps: " + JSON.stringify(apps));
        */
        switch_app(event, apps[app_name]);
    }

    event.gui.update(event.player);
}

function switch_app(event, next_app) {
    //event.player.message("Switching app to " + next_app);
    var index = 0;
    var component_count = GUI.getComponents().length;
    for (var i = 0; i < component_count; i++) {
        //event.player.message("Removing component: " + GUI.getComponents()[0].getID() + " from " + component_count + " components");
        // if not the close button
        if (GUI.getComponents()[index].getID() != BUTTON_CLOSE) {
            GUI.removeComponent(GUI.getComponents()[index].getID());
        } else {
            index++;
        }
    }


    if (next_app === undefined) {
        event.player.message("App not found: " + next_app);
        create_undefined_app_gui(event);
        return;
    }
    next_app(event);
}

function home_app(event) {

    current_app = "home";

    //remove X button
    GUI.removeComponent(BUTTON_CLOSE);

    //event.player.message("Openning Home GUI");

    GUI.addTexturedButton(16, "APP STORE", GRID, GRID, GRID * 4, GRID, BUTTON_TEXTURE_PATH, 0, 0);

    // for all apps in personal_phone_data
    for (var i = 0; i < personal_phone_data.apps.length; i++) {
        var app = personal_phone_data.apps[i].name;
        //event.player.message("Adding button for app: " + app + " id: " + (i + 101));
        GUI.addTexturedButton(i + 101, app, GRID, GRID * (i + 2), GRID * 4, GRID, BUTTON_TEXTURE_PATH, 0, 0);
    }
}

// APP store
function app_store(event) {

    current_app = "app_store";

    event.player.message("Openning App Store GUI");

    // App Store Label
    GUI.addLabel(16, "App Store", GRID, GRID, GRID * 9, GRID);
    GUI.getComponent(16).setColor(0x00FF00);

    // Add close app button
    GUI.addTexturedButton(BUTTON_CLOSE, "X", GRID * 10, GRID, GRID, GRID, BUTTON_TEXTURE_PATH, GRID * 6, 0);

    var it_uninstalled = 0;

    // For all apps, if not installed, add a button to install
    for (var app in apps) {
        var player_phone_data = check_user(event.player.getName(), event);
        var app_installed = check_app_installed(player_phone_data, app);

        if (!app_installed) {
            it_uninstalled++;

            GUI.addLabel(300 + it_uninstalled, app, GRID, GRID * (it_uninstalled + 2), GRID * 5, GRID);
            GUI.addTexturedButton(400 + it_uninstalled, "INSTALL", GRID * 6, GRID * (it_uninstalled + 2), GRID * 4, GRID, BUTTON_TEXTURE_PATH, 0, 0);
        
            event.player.message("App " + app + " not installed, button INSTALL id: " + (400 + it_uninstalled));
        }
    }
}

// Trucker APP
function trucker_app(event) {

    current_app = "trucker";

    //player.message("Openning Trucker GUI");

    // Trucker Label
    GUI.addLabel(16, "Trucker App", GRID, GRID, GRID * 9, GRID);
    GUI.getComponent(16).setColor(0x00FF00);

    // Add close app button
    GUI.addTexturedButton(BUTTON_CLOSE, "X", GRID * 10, GRID, GRID, GRID, BUTTON_TEXTURE_PATH, GRID * 6, 0);

    // Check if player has an active trucker quest
    var trucker_quest = check_trucker_quest(event.player.getName());

    //event.player.message("Trucker quest: " + JSON.stringify(trucker_quest));

    // if data is "no quest", no active quest
    if (trucker_quest == "no quest" || trucker_quest == undefined || JSON.stringify(trucker_quest) == "{}") {
        GUI.addLabel(17, "No active quest", GRID, GRID * 2, GRID * 9, GRID);
    } else {
        // At the top, add a lebel saying "from: " + trucker_quest.producer.name
        GUI.addLabel(17, "From: " + trucker_quest.producer.region, GRID, GRID * 2, GRID * 5, GRID);
        GUI.addLabel(18, trucker_quest.producer.x + ", " + trucker_quest.producer.z, GRID * 6, GRID * 2, GRID * 5, GRID);
        GUI.addLabel(19, trucker_quest.producer.name, GRID, GRID * 3, GRID * 10, GRID);
        GUI.getComponent(18).setHoverText("x: " + trucker_quest.producer.x + ", y: " + trucker_quest.producer.y + ", z: " + trucker_quest.producer.z);
        GUI.getComponent(19).setHoverText(trucker_quest.producer.description)

        // "to: " + trucker_quest.consumer.name
        GUI.addLabel(20, "To: " + trucker_quest.consumer.region, GRID, GRID * 4, GRID * 5, GRID);
        GUI.addLabel(21, trucker_quest.consumer.x + ", " + trucker_quest.consumer.z, GRID * 6, GRID * 4, GRID * 5, GRID);
        GUI.addLabel(22, trucker_quest.consumer.name, GRID, GRID * 5, GRID * 10, GRID);
        GUI.getComponent(21).setHoverText("x: " + trucker_quest.consumer.x + ", y: " + trucker_quest.consumer.y + ", z: " + trucker_quest.consumer.z);
        GUI.getComponent(22).setHoverText(trucker_quest.consumer.description)

        // Cargo infos
        GUI.addLabel(23, "Current Cargo", GRID, GRID * 6, GRID * 10, GRID);
        GUI.addLabel(24, trucker_quest.quantity + " stacks of " + trucker_quest.cargo, GRID, GRID * 7, GRID * 10, GRID);

        // get the current time
        var current_time = new Date();
        var current_time_millis = current_time.getTime();

        // Timer
        GUI.addLabel(25, "Timer: " + (current_time_millis - trucker_quest.start_time) + " / " + trucker_quest.time_limit, GRID, GRID * 8, GRID * 10, GRID);

        // Expected revenue
        GUI.addLabel(26, "Expected Revenue", GRID, GRID * 9, GRID * 10, GRID);
        GUI.addLabel(27, trucker_quest.reward, GRID, GRID * 10, GRID * 10, GRID);
        // bonus and malus side by side
        GUI.addLabel(28, "Bonus:", GRID, GRID * 11, GRID * 5, GRID);
        GUI.addLabel(29, "Malus:", GRID * 6, GRID * 11, GRID * 5, GRID);
        GUI.addLabel(30, trucker_quest.bonus, GRID, GRID * 12, GRID * 5, GRID);
        GUI.addLabel(31, trucker_quest.malus, GRID * 6, GRID * 12, GRID * 5, GRID);

        // reputation
        GUI.addLabel(32, "Reputation: " + trucker_quest.reputation, GRID, GRID * 13, GRID * 10, GRID);

        // buttons
        GUI.addTexturedButton(33, "Complete", GRID, GRID * 14, GRID * 5, GRID, BUTTON_TEXTURE_PATH, 9 * GRID, 0);
        GUI.addTexturedButton(34, "Cancel", GRID * 6, GRID * 14, GRID * 5, GRID, BUTTON_TEXTURE_PATH, 9 * GRID, 0);
    }
}








////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Function to get the distance between two points
function get_distance(x1, y1, z1, x2, y2, z2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
}

// Function to open the "undefined app" GUI
function create_undefined_app_gui(event) {

    // clean any previous GUI
    var component_count = GUI.getComponents().length;
    for (var i = 0; i < component_count; i++) {
        GUI.removeComponent(GUI.getComponents()[0].getID());
    }

    // Add the components

    // it has an "ERROR: APP NOT FOUND" label
    // a cross button to close the app
    // A "Warnoing: your phone may need to be reset" label
    // A reset button

    GUI.addLabel(16, "ERROR: APP NOT FOUND", GRID, GRID, GRID * 9, GRID);
    GUI.addLabel(17, "Warning: your phone may need to be reset", GRID, GRID * 2, GRID * 9, GRID);
    GUI.addTexturedButton(BUTTON_CLOSE, "X", GRID * 10, GRID, GRID, GRID, BUTTON_TEXTURE_PATH, GRID * 6, 0);
    GUI.addTexturedButton(EMERGENCY_RESET, "RESET", GRID, GRID * 3, GRID * 9, GRID, BUTTON_TEXTURE_PATH, 0, 0);

    return true;
}



















































// function to add a new user to the phone
function check_user(player_name, event) {
    var data = read_file(PHONE_FILE_PATH);
    var phone_data = JSON.parse(data);

    //player.message("Imported Phone data: " + JSON.stringify(phone_data));

    // check if the player has phone data
    //(look for player name key)
    if (phone_data[player_name] == undefined) {
        event.player.message("It seems you don't have a phone yet. Creating new data.");

        // add a json entry with player name and UUID
        var new_player = {
            "uuid": event.player.getUUID(),
            "apps": []
        };

        //player.message("New player: " + JSON.stringify(new_player));

        // add the player to the phone data
        phone_data[player_name] = new_player;

        // save the new phone data
        create_data(PHONE_FILE_PATH, phone_data);
    }

    return phone_data[player_name];
}

// Function to check if an app is installed
function check_app_installed(player_phone_data, app_name) {

    var apps = player_phone_data.apps;
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].name == app_name) {
            return true;
        }
    }
    return false;
}

// function to log the player's phone data
function log_phone_data(player_phone_data, event) {
    event.player.message("Phone data: " + JSON.stringify(player_phone_data));
}



// Function to read the file
function read_file(path) {
    //player.message("Reading file: " + path);
    var ips = new java.io.FileInputStream(path);
    var fileReader = new java.io.InputStreamReader(ips, "UTF-8");
    var data1 = fileReader.read();
    var data;
    var start1 = "";
    while (data1 != -1) {
        data = String.fromCharCode(data1);
        start1 = start1 + data;
        data1 = fileReader.read();
    }
    //player.message("Data read: " + start1);
    return start1;
}

// Function to write data to the file
function create_data(path, data) {
    //player.message("Creating data: " + JSON.stringify(data));
    var fileWriter = new java.io.FileWriter(path);
    fileWriter.write(JSON.stringify(data));
    fileWriter.close();
}

// function to update a player's phone data
function update_phone_data(player_name, data) {
    var phone_data = read_file(PHONE_FILE_PATH);
    var phone_data_json = JSON.parse(phone_data);

    phone_data_json[player_name] = JSON.parse(data);

    //player.message("Updating phone data: " + JSON.stringify(phone_data_json));

    create_data(PHONE_FILE_PATH, phone_data_json);
}


































































////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Trucker APP
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// GENERAL FEATURES

// function to check if player has an active trucker quest
function check_trucker_quest(player_name, event) {
    
    personal_phone_data = check_user(player_name, event);

    var apps = personal_phone_data.apps;

    //player.message("Checking for active quest in Trucker App: " + JSON.stringify(apps));

    for (var i = 0; i < apps.length; i++) {
        if (apps[i].name == "Trucker App") {
            //player.message("Trucker App found: " + JSON.stringify(apps[i]));
            if (apps[i].data != {} && apps[i].data != undefined) {
                return apps[i].data;
            }
        }
    }

    return "no quest";
}

// Function to check if a player is close enough to a destination
function check_destination_proximity(player, destination) {
    var player_pos = player.getPos();
    var distance = get_distance(player_pos.getX(), player_pos.getY(), player_pos.getZ(), destination.x, destination.y, destination.z);
    if (distance < 10) {
        return true;
    }
    return false;
} 

// function to check if trucker quest can be completed
function check_trucker_quest_completion(event) {
    var player_name = event.player.getName();
    var trucker_quest = check_trucker_quest(player_name);

    if (trucker_quest == "no quest") {
        return "no quest";
    }

    // get the current time
    var current_time = new Date();
    var current_time_millis = current_time.getTime();

    // if the time limit has passed
    if (current_time_millis - trucker_quest.start_time > trucker_quest.time_limit) {
        return "time limit";
    }

    // if the player is not at the destination
    if (!check_destination_proximity(event.player, trucker_quest.consumer)) {
        return "destination";
    }

    return "ok";
}

// Function to complete a trucker quest if possible
function complete_trucker_quest(event) {
    var completion = check_trucker_quest_completion(event);

    //event.player.message("Completion: " + completion);

    if (completion == "ok") {
        // remove the quest from the player's phone data
        var player_phone_data = check_user(event.player.getName(), event);
        //event.player.message("Phone data: " + JSON.stringify(player_phone_data));

        var apps = player_phone_data.apps;

        for (var i = 0; i < apps.length; i++) {
            //event.player.message("Checking app: " + player_phone_data.apps[i].name);
            if (player_phone_data.apps[i].name == "Trucker App") {
                //event.player.message("Removing quest from phone data");
                player_phone_data.apps[i].data = {};

                // update the phone data
                update_phone_data(event.player.getName(), JSON.stringify(player_phone_data));

                event.player.message("Quest completed ! Congratulations !");

                // reload the trucker app
                switch_app(event, trucker_app);
            }
        }
        // give the player the reward
        //var trucker_quest = check_trucker_quest(event.player.getName());
        //event.player.message("Reward: " + trucker_quest.reward);
        //event.player.giveItem(trucker_quest.cargo, trucker_quest.quantity);
    } else if (completion == "no quest") {
        event.player.message("No active quest");
    } else if (completion == "time limit") {
        event.player.message("Time limit exceeded");
    } else if (completion == "destination") {
        // calculate how far the player is from the destination
        var trucker_quest = check_trucker_quest(event.player.getName());
        var player_pos = event.player.getPos();
        var distance = get_distance(player_pos.getX(), player_pos.getY(), player_pos.getZ(), trucker_quest.consumer.x, trucker_quest.consumer.y, trucker_quest.consumer.z);
        distance = Math.round(distance);
        event.player.message("You are not close enough to the destination. Distance: " + distance + " blocks (flown)");
    } else {
        event.player.message("Unknown error");
    }
}

// GUIs

// GUI of Trucker App with no active quest
function create_trucker_app_gui_no_quest(event) {
    GUI.addLabel(16, "No active quest", GRID, GRID, GRID * 9, GRID);
}

// GUI of Trucker App with active quest
function create_trucker_app_gui_active_quest(event) {
    GUI.addLabel(16, "Active quest", GRID, GRID, GRID * 9, GRID);
}