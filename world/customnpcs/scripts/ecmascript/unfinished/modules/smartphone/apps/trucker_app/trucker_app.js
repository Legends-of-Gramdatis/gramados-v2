load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Trucker APP
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// GENERAL FEATURES

/**
 * Checks if the player has an active trucker quest.
 * @param {string} player_name - The player's name.
 * @param {Object} event - The event object.
 * @returns {Object|string} - The trucker quest data or "no quest".
 */
function check_trucker_quest(player_name, event) {
    personal_phone_data = check_user(player_name, event);
    var apps = personal_phone_data.apps;

    for (var i = 0; i < apps.length; i++) {
        if (apps[i].name === "Trucker App" && apps[i].data) {
            return apps[i].data;
        }
    }

    return "no quest";
}

/**
 * Checks if the player is close enough to a destination.
 * @param {IPlayer} player - The player object.
 * @param {Object} destination - The destination coordinates.
 * @returns {boolean} - True if the player is close, false otherwise.
 */
function check_destination_proximity(player, destination) {
    var player_pos = player.getPos();
    var distance = get_distance(player_pos.getX(), player_pos.getY(), player_pos.getZ(), destination.x, destination.y, destination.z);
    return distance < 10;
}

/**
 * Checks if the trucker quest can be completed.
 * @param {Object} event - The event object.
 * @returns {string} - The completion status ("ok", "no quest", "time limit", or "destination").
 */
function check_trucker_quest_completion(event) {
    var player_name = event.player.getName();
    var trucker_quest = check_trucker_quest(player_name);

    if (trucker_quest === "no quest") return "no quest";

    var current_time = new Date().getTime();
    if (current_time - trucker_quest.start_time > trucker_quest.time_limit) return "time limit";

    if (!check_destination_proximity(event.player, trucker_quest.consumer)) return "destination";

    return "ok";
}

/**
 * Completes the trucker quest if possible.
 * @param {Object} event - The event object.
 */
function complete_trucker_quest(event) {
    var completion = check_trucker_quest_completion(event);

    if (completion === "ok") {
        var player_phone_data = check_user(event.player.getName(), event);
        var apps = player_phone_data.apps;

        for (var i = 0; i < apps.length; i++) {
            if (apps[i].name === "Trucker App") {
                apps[i].data = {};
                update_phone_data(event.player.getName(), JSON.stringify(player_phone_data));
                event.player.message("Quest completed! Congratulations!");
                switch_app(event, trucker_app);
            }
        }
    } else if (completion === "no quest") {
        event.player.message("No active quest");
    } else if (completion === "time limit") {
        event.player.message("Time limit exceeded");
    } else if (completion === "destination") {
        var trucker_quest = check_trucker_quest(event.player.getName());
        var player_pos = event.player.getPos();
        var distance = get_distance(player_pos.getX(), player_pos.getY(), player_pos.getZ(), trucker_quest.consumer.x, trucker_quest.consumer.y, trucker_quest.consumer.z);
        event.player.message("You are not close enough to the destination. Distance: " + Math.round(distance) + " blocks.");
    }
}

// GUI of Trucker App with no active quest
function create_trucker_app_gui_no_quest(event) {
    GUI.addLabel(16, "No active quest", GRID, GRID, GRID * 9, GRID);
}

// GUI of Trucker App with active quest
function create_trucker_app_gui_active_quest(event) {
    GUI.addLabel(16, "Active quest", GRID, GRID, GRID * 9, GRID);
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
