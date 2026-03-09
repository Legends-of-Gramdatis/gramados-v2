// GUI
var GUI, GRID = 16, GRID_BORDER = 2;

// buttons
var BUTTON_CLOSE = 1;
var EMERGENCY_RESET = 2;

// file path for the destinations
var FILE_PATH = "world/customnpcs/scripts/ecmascript/modules_unfinished/smartphone/players_phone.json";
var PHONE_FILE_PATH = "world/customnpcs/scripts/ecmascript/modules_unfinished/smartphone/players_phone.json";

var BUTTON_TEXTURE_PATH = "minecraft:textures/gui/gramados_trucker_point_putton_textures.png";

// currently selected app
var current_app = "home";

var personal_phone_data;

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/modules_unfinished/smartphone/apps/trucker_app/trucker_app.js');

// list of all available apps
var apps = {
    "Trucker App": trucker_app
};

/**
 * Initializes the smartphone item.
 * @param {Object} event - The event object.
 * @returns {boolean} - Always returns true.
 */
function init(event) {
    var item = event.item;
    item.setDurabilityShow(false);
    item.setCustomName("§6§lSmartphone");
    return true;
}

/**
 * Handles interaction with the smartphone item.
 * @param {Object} event - The event object.
 * @returns {boolean} - Always returns true.
 */
function interact(event) {
    personal_phone_data = check_user(event.player.getName(), event);
    GUI = event.API.createCustomGui(1, GRID * 12, GRID * 16, false);
    GUI.setBackgroundTexture("minecraft:textures/gui/gramados_smartphone_gui.png");
    home_app(event);
    event.player.showCustomGui(GUI);
    return true;
}

/**
 * Handles button clicks in the smartphone GUI.
 * @param {Object} event - The event object.
 */
function customGuiButton(event) {
    var b1 = event.buttonId;
    var player = event.player;

    switch (b1) {
        case EMERGENCY_RESET:
            var phone_data = read_file(PHONE_FILE_PATH);
            var phone_data_json = JSON.parse(phone_data);
            phone_data_json[player.getName()] = { "uuid": player.getUUID(), "apps": [] };
            create_data(PHONE_FILE_PATH, phone_data_json);
            player.message("Phone data reset");
            event.player.closeGui();
            break;
        case 16:
            if (current_app == "home") switch_app(event, app_store);
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

        if (!app_installed) {
            personal_phone_data.apps.push({ "name": app_name, "data": {} });
            update_phone_data(event.player.getName(), JSON.stringify(personal_phone_data));
            switch_app(event, apps[app_name]);
        }
    }

    if (b1 > 100 && b1 < 200) {
        var app_name = GUI.getComponent(b1).getLabel();
        switch_app(event, apps[app_name]);
    }

    event.gui.update(event.player);
}

/**
 * Switches the current app in the smartphone GUI.
 * @param {Object} event - The event object.
 * @param {Function} next_app - The function to render the next app.
 */
function switch_app(event, next_app) {
    var index = 0;
    var component_count = GUI.getComponents().length;
    for (var i = 0; i < component_count; i++) {
        if (GUI.getComponents()[index].getID() != BUTTON_CLOSE) {
            GUI.removeComponent(GUI.getComponents()[index].getID());
        } else {
            index++;
        }
    }

    if (!next_app) {
        event.player.message("App not found: " + next_app);
        create_undefined_app_gui(event);
        return;
    }
    next_app(event);
}

/**
 * Renders the home app in the smartphone GUI.
 * @param {Object} event - The event object.
 */
function home_app(event) {
    current_app = "home";
    GUI.removeComponent(BUTTON_CLOSE);
    GUI.addTexturedButton(16, "APP STORE", GRID, GRID, GRID * 4, GRID, BUTTON_TEXTURE_PATH, 0, 0);

    for (var i = 0; i < personal_phone_data.apps.length; i++) {
        var app = personal_phone_data.apps[i].name;
        GUI.addTexturedButton(i + 101, app, GRID, GRID * (i + 2), GRID * 4, GRID, BUTTON_TEXTURE_PATH, 0, 0);
    }
}

/**
 * Renders the app store in the smartphone GUI.
 * @param {Object} event - The event object.
 */
function app_store(event) {
    current_app = "app_store";
    GUI.addLabel(16, "App Store", GRID, GRID, GRID * 9, GRID);
    GUI.getComponent(16).setColor(0x00FF00);
    GUI.addTexturedButton(BUTTON_CLOSE, "X", GRID * 10, GRID, GRID, GRID, BUTTON_TEXTURE_PATH, GRID * 6, 0);

    var it_uninstalled = 0;
    for (var app in apps) {
        var player_phone_data = check_user(event.player.getName(), event);
        var app_installed = check_app_installed(player_phone_data, app);

        if (!app_installed) {
            it_uninstalled++;
            GUI.addLabel(300 + it_uninstalled, app, GRID, GRID * (it_uninstalled + 2), GRID * 5, GRID);
            GUI.addTexturedButton(400 + it_uninstalled, "INSTALL", GRID * 6, GRID * (it_uninstalled + 2), GRID * 4, GRID, BUTTON_TEXTURE_PATH, 0, 0);
        }
    }
}

/**
 * Opens the "undefined app" error GUI.
 * @param {Object} event - The event object.
 * @returns {boolean} - Always returns true.
 */
function create_undefined_app_gui(event) {
    var component_count = GUI.getComponents().length;
    for (var i = 0; i < component_count; i++) {
        GUI.removeComponent(GUI.getComponents()[0].getID());
    }

    GUI.addLabel(16, "ERROR: APP NOT FOUND", GRID, GRID, GRID * 9, GRID);
    GUI.addLabel(17, "Warning: your phone may need to be reset", GRID, GRID * 2, GRID * 9, GRID);
    GUI.addTexturedButton(BUTTON_CLOSE, "X", GRID * 10, GRID, GRID, GRID, BUTTON_TEXTURE_PATH, GRID * 6, 0);
    GUI.addTexturedButton(EMERGENCY_RESET, "RESET", GRID, GRID * 3, GRID * 9, GRID, BUTTON_TEXTURE_PATH, 0, 0);

    return true;
}

/**
 * Checks if a user exists in the phone data and creates one if not.
 * @param {string} player_name - The player's name.
 * @param {Object} event - The event object.
 * @returns {Object} - The player's phone data.
 */
function check_user(player_name, event) {
    var data = read_file(PHONE_FILE_PATH);
    var phone_data = JSON.parse(data);

    if (!phone_data[player_name]) {
        event.player.message("It seems you don't have a phone yet. Creating new data.");
        phone_data[player_name] = { "uuid": event.player.getUUID(), "apps": [] };
        create_data(PHONE_FILE_PATH, phone_data);
    }

    return phone_data[player_name];
}

/**
 * Checks if an app is installed for the player.
 * @param {Object} player_phone_data - The player's phone data.
 * @param {string} app_name - The app name.
 * @returns {boolean} - True if the app is installed, false otherwise.
 */
function check_app_installed(player_phone_data, app_name) {
    return player_phone_data.apps.some(app => app.name === app_name);
}

/**
 * Updates the phone data for a player.
 * @param {string} player_name - The player's name.
 * @param {string} data - The updated phone data in JSON format.
 */
function update_phone_data(player_name, data) {
    var phone_data = read_file(PHONE_FILE_PATH);
    var phone_data_json = JSON.parse(phone_data);
    phone_data_json[player_name] = JSON.parse(data);
    create_data(PHONE_FILE_PATH, phone_data_json);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Function to get the distance between two points.
 * @param {number} x1 - The x-coordinate of the first point.
 * @param {number} y1 - The y-coordinate of the first point.
 * @param {number} z1 - The z-coordinate of the first point.
 * @param {number} x2 - The x-coordinate of the second point.
 * @param {number} y2 - The y-coordinate of the second point.
 * @param {number} z2 - The z-coordinate of the second point.
 * @returns {number} - The distance between the two points.
 */
function get_distance(x1, y1, z1, x2, y2, z2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
}

/**
 * Opens the "undefined app" error GUI.
 * @param {Object} event - The event object.
 * @returns {boolean} - Always returns true.
 */
function create_undefined_app_gui(event) {
    var component_count = GUI.getComponents().length;
    for (var i = 0; i < component_count; i++) {
        GUI.removeComponent(GUI.getComponents()[0].getID());
    }

    GUI.addLabel(16, "ERROR: APP NOT FOUND", GRID, GRID, GRID * 9, GRID);
    GUI.addLabel(17, "Warning: your phone may need to be reset", GRID, GRID * 2, GRID * 9, GRID);
    GUI.addTexturedButton(BUTTON_CLOSE, "X", GRID * 10, GRID, GRID, GRID, BUTTON_TEXTURE_PATH, GRID * 6, 0);
    GUI.addTexturedButton(EMERGENCY_RESET, "RESET", GRID, GRID * 3, GRID * 9, GRID, BUTTON_TEXTURE_PATH, 0, 0);

    return true;
}

/**
 * Checks if a user exists in the phone data and creates one if not.
 * @param {string} player_name - The player's name.
 * @param {Object} event - The event object.
 * @returns {Object} - The player's phone data.
 */
function check_user(player_name, event) {
    var data = read_file(PHONE_FILE_PATH);
    var phone_data = JSON.parse(data);

    if (!phone_data[player_name]) {
        event.player.message("It seems you don't have a phone yet. Creating new data.");
        phone_data[player_name] = { "uuid": event.player.getUUID(), "apps": [] };
        create_data(PHONE_FILE_PATH, phone_data);
    }

    return phone_data[player_name];
}

/**
 * Checks if an app is installed for the player.
 * @param {Object} player_phone_data - The player's phone data.
 * @param {string} app_name - The app name.
 * @returns {boolean} - True if the app is installed, false otherwise.
 */
function check_app_installed(player_phone_data, app_name) {
    return player_phone_data.apps.some(app => app.name === app_name);
}

/**
 * Updates the phone data for a player.
 * @param {string} player_name - The player's name.
 * @param {string} data - The updated phone data in JSON format.
 */
function update_phone_data(player_name, data) {
    var phone_data = read_file(PHONE_FILE_PATH);
    var phone_data_json = JSON.parse(phone_data);
    phone_data_json[player_name] = JSON.parse(data);
    create_data(PHONE_FILE_PATH, phone_data_json);
}

/**
 * Reads the content of a file.
 * @param {string} path - The path to the file.
 * @returns {string} - The content of the file.
 */
function read_file(path) {
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
    return start1;
}

/**
 * Writes data to a file.
 * @param {string} path - The path to the file.
 * @param {Object} data - The data to write to the file.
 */
function create_data(path, data) {
    var fileWriter = new java.io.FileWriter(path);
    fileWriter.write(JSON.stringify(data));
    fileWriter.close();
}