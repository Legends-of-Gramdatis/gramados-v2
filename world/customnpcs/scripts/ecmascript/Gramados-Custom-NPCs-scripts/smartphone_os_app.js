var BUTTON_CLOSE = 1;


// function to create new app
function create_app(app_name) {

    var new_app;

    switch (app_name) {
        case "Trucker":
            return app;
    }
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





// function to add a new user to the phone
function check_user(player_name) {
    var data = read_file(PHONE_FILE_PATH);
    var phone_data = JSON.parse(data);

    //player.message("Imported Phone data: " + JSON.stringify(phone_data));

    // check if the player has phone data
    //(look for player name key)
    if (phone_data[player_name] == undefined) {
        player.message("It seems you don't have a phone yet. Creating new data.");

        // add a json entry with player name and UUID
        var new_player = {
            "uuid": player.getUUID(),
            "apps": []
        };

        //player.message("New player: " + JSON.stringify(new_player));

        // add the player to the phone data
        phone_data[player_name] = new_player;

        //player.message("Added " + player_name + " to phone data: " + JSON.stringify(phone_data));
    }

    //player.message("About to save Phone data: " + JSON.stringify(phone_data));

    // Save the data in the file
    create_data(PHONE_FILE_PATH, phone_data);

    return phone_data[player_name];
}

// Function to check if an app is installed
function check_app_installed(player_phone_data, app_name, install_if_not) {

    if (install_if_not == undefined) {
        install_if_not = false;
    }

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

// function to log the player's phone data
function log_phone_data(player_phone_data) {
    player.message("Phone data: " + JSON.stringify(player_phone_data));
}