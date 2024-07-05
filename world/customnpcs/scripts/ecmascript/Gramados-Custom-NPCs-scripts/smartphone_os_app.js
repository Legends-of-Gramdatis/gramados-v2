var BUTTON_CLOSE = 1;

var app = {
    "name": "Trucker",
    "version": "1.0",
    "description": "Trucker App",
    "author": "TheOddlySeagull",
    "main": function(event) {
        event.player.world.broadcast("Openning Trucker GUI");

        // close app button
        GUI.addTexturedButton(BUTTON_CLOSE, "CLOSE", GRID, GRID, GRID * 4, GRID, BUTTON_TEXTURE_PATH, 0, 0);
    }
}


// Function to read the file
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

// Function to create data
function create_data(path, data) {
    var fileWriter = new java.io.FileWriter(path);
    fileWriter.write(JSON.stringify(data));
    fileWriter.close();
}





// function to add a new user to the phone
function check_user(player_name) {
    var data = read_file(PHONE_FILE_PATH);
    var phone_data = JSON.parse(data);

    // check if the player has phone data
    //(look for player name key)
    if (phone_data[player_name] == undefined) {
        phone_data[player_name] = [];
        player.message("It seems you don't have a phone yet. Creating new data.");

        // add a json entry with player name and UUID
        var new_player = {
            "name": player_name,
            "uuid": player.getUUID(),
            "apps": []
        };

        // add the player to the phone data
        phone_data[player_name] = new_player;
    }

    // Save the data in the file
    create_data(PHONE_FILE_PATH, phone_data);

    return phone_data[player_name];
}

// Function to check if an app is installed
function check_app_installed(player_phone_data, app_name, install_if_not = false) {
    var apps = player_phone_data.apps;
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].name == app_name) {
            return true;
        }
    }
    if (install_if_not) {
        apps.push(app_name);
        create_data(PHONE_FILE_PATH, player_phone_data);
    }
    return false;
}