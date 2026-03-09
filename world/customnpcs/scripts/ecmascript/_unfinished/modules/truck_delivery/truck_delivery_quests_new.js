/*
This script is for plans to add the truck driver job on the Gramados server.
The final goal is to have several saved trucker_data, and a GUI to select one of several random delivery (from a point to another).
Each delivery will also fill the truck with a random cargo, and the player will have to deliver it to the destination.
*/

//get player
var player;

var trucker_data = {}

var FILE_PATH = "world/customnpcs/scripts/trucker_job_data.json";
var PHONE_FILE_PATH = "world/customnpcs/scripts/ecmascript/modules_unfinished/smartphone/players_phone.json";

var valid_cargo = [];


function init(event) {
    // Get the item
    var item = event.item;
    item.setDurabilityShow(false);
    item.setCustomName("§6§lTrucker's Quest Creation");

    return true;
}

function tick(event) {
    player = event.player;
    return true;
}

// Script for scripted block to generate a quest on interact
function interact(event) {
    player = event.player;

    trucker_data = load_data();

    //event.player.message("Trucker data: " + JSON.stringify(trucker_data));
    //event.player.message("Trucker data: " + JSON.stringify(trucker_data.data));
    //event.player.message("Trucker data: " + JSON.stringify(trucker_data.destinations));

    list_valid_cargos(event);

    // create a new delivery quest
    //create_delivery_quest(world);

    return true;
}

function create_delivery_quest(world) {
    // From the list of valid cargos, we select one randomly
    var cargo = valid_cargo[Math.floor(Math.random() * valid_cargo.length)];
    var cargo_name = cargo.name;
    var cargo_producer = cargo.producer_list[Math.floor(Math.random() * cargo.producer_list.length)];
    var cargo_consumer = cargo.consumer_list[Math.floor(Math.random() * cargo.consumer_list.length)];

    // Get a quantity of cargo (basec on teh smallest quantity of the producer and consumer)
    var cargo_quantity = Math.min(cargo_producer.quantity_factor, cargo_consumer.quantity_factor);
    // make the quantity random between 0.20 and 1 of the quantity
    cargo_quantity = Math.floor(cargo_quantity * (Math.random() * 0.80 + 0.20));
    // multiply by 9
    cargo_quantity = cargo_quantity * 9;

    var new_quest = {
        "type": "Truck Delivery",
        "cargo": cargo_name,
        "quantity": cargo_quantity,
        "producer": cargo_producer,
        "consumer": cargo_consumer
    };

    world.broadcast("New Truck Delivery Quest: Deliver " + cargo_quantity + " stacks of " + cargo_name + " from " + cargo_producer.name + " to " + cargo_consumer.name + ".");

    save_truck_job_on_phone(new_quest);
}

function list_valid_cargos(event) {
    var tested_cargo
    // For all the categories and their type, we loop through all the trucker_data to check if there is at least one producer and one consumer of the cargo.
    /*for (var category in categories) {
        for (var i = 0; i < categories[category].length; i++) {
            var cargo = categories[category][i];
            tested_cargo = {
                "name": cargo,
                "category": category,
                "producer_list": [],
                "consumer_list": []
            };
            for (var j = 0; j < trucker_data.length; j++) {
                for (var look_type_it = 0; look_type_it < trucker_data[j].types.length; look_type_it++) {
                    if (trucker_data[j].trade_type == "Producer" && trucker_data[j].types[look_type_it] == cargo) {
                        tested_cargo.producer_list.push(trucker_data[j]);
                    }
                    if (trucker_data[j].trade_type == "Consumer" && trucker_data[j].types[look_type_it] == cargo) {
                        tested_cargo.consumer_list.push(trucker_data[j]);
                    }
                }
            }
            if (tested_cargo.producer_list.length > 0 && tested_cargo.consumer_list.length > 0) {
                valid_cargo.push(tested_cargo);
            }
        }
    }*/

    // in the data, list all the "destinations" keys
    var destinations = Object.keys(trucker_data.destinations);
    for (var i = 0; i < destinations.length; i++) {

        event.player.message("Destination: " + destinations[i]);

        var produces = get_keys(trucker_data.destinations[destinations[i]].producer);
        var consumes = get_keys(trucker_data.destinations[destinations[i]].consumer);
        var produced_ressources = [];
        var consumed_ressources = [];
        for (var j = 0; j < produces.length; j++) {
            produced_ressources.push(get_keys(trucker_data.destinations[destinations[i]].producer[produces[j]]));
        }
        for (var j = 0; j < consumes.length; j++) {
            consumed_ressources.push(get_keys(trucker_data.destinations[destinations[i]].consumer[consumes[j]]));
        }


        event.player.message("This destination turns " + consumes + " to " + produces);
        event.player.message("This destination produces: " + produced_ressources);
        event.player.message("This destination consumes: " + consumed_ressources);
    }
}













// function to store the quest into player's phone
function save_truck_job_on_phone(new_quest) {

    // get player's nickname
    var player_name = player.getName();

    // get the player's phone data
    var player_phone_data = check_user(player_name);

    // check if "Trucker" app is installed
    if (!check_app_installed(player_phone_data, "Trucker App", false)) {
        player.message("You don't have the Trucker app installed. Please install it first.");
    } else {
        player.message("Trucker app is installed. Saving the quest...");

        // find the app with the name "Trucker App" and update the data
        for (var i = 0; i < player_phone_data.apps.length; i++) {
            if (player_phone_data.apps[i].name == "Trucker App") {
                player_phone_data.apps[i].data = new_quest;
            }
        }

        // save the phone data
        update_phone_data(player_name, JSON.stringify(player_phone_data));
    }
}



































// Function to load the trucker_data from world data
function load_data() {

    // load the trucker_data
    if (!file_exists(FILE_PATH)) {
        create_file(FILE_PATH);
    }

    var data = read_file(FILE_PATH);
    var trucker_data = JSON.parse(data);
    return trucker_data;
}

// Function to create data
function create_file(path) {
    var fileWriter = new java.io.FileWriter(path);
    fileWriter.close();
}

// Function to check if file exists
function file_exists(path) {
    var file = new java.io.File(path);
    return file.exists();
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
function check_app_installed(player_phone_data, app_name) 
{

    var apps = player_phone_data.apps;
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].name == app_name) {
            return true;
        }
    }
    return false;
}

// function to log the player's phone data
function log_phone_data(player_phone_data) {
    player.message("Phone data: " + JSON.stringify(player_phone_data));
}



// function to get keys of a json input
function get_keys(json_input) {
    if (json_input != undefined) {
        return Object.keys(json_input);
    }
    return [];
}