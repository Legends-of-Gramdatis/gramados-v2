// GUI
var GUI, GRID = 16, GRID_BORDER = 2;

// file path for the destinations
var FILE_PATH = "world/customnpcs/scripts/players_phone.json";
var BUTTON_TEXTURE_PATH = "minecraft:textures/gui/gramados_trucker_point_putton_textures.png";

// currently selected app
var current_app = "home";

// currently created point data
var new_wip_destination = {
    name: "",
    id: 0,
    x: 0,
    y: 0,
    z: 0,
    description: "",
    types: [],
    category: "",
    region: "",
    trade_type: "",
    quantity_factor: 40
};

// Script for scripted item to generate a point on interact
function interact(event) {

    GUI = event.API.createCustomGui(1, GRID * 11, GRID * 16, false);

    GUI.setBackgroundTexture("minecraft:textures/gui/gramados_smartphone_gui.png");

    home_app(event);

    event.player.showCustomGui(GUI);

    return true;
}


function customGuiButton(event) {
    var b1 = event.buttonId;

    switch (b1) {
        case 1:
            if (current_app == "home")
                switch_app(event, trucker_app);
            else
                switch_app(event, home_app);
            break;
    }

    event.gui.update(event.player);
}

function switch_app(event, next_app) {
    var components = GUI.getComponents()
    //event.player.world.broadcast("Smartphone switch app, components: " + components.length);
    for (var component in GUI.getComponents())
        GUI.removeComponent(component);

    next_app(event);
}

function home_app(event) {
    
        current_app = "home";
    
        event.player.world.broadcast("Openning Home GUI");
    
        // trucker app button
        GUI.addTexturedButton(1, "TRUCKER", GRID, GRID, GRID * 4, GRID, BUTTON_TEXTURE_PATH, 0, 0);
    }

function trucker_app(event) {

    current_app = "trucker";

    event.player.world.broadcast("Openning Trucker GUI");

    // trucker app button
    GUI.addTexturedButton(1, "CLOSE", GRID, GRID, GRID * 4, GRID, BUTTON_TEXTURE_PATH, 0, 0);

    // create point button
    GUI.addTexturedButton(2, "CREATE POINT", GRID, GRID * 2, GRID * 4, GRID, BUTTON_TEXTURE_PATH, 0, 0);

    // list points button
    GUI.addTexturedButton(3, "LIST POINTS", GRID, GRID * 3, GRID * 4, GRID, BUTTON_TEXTURE_PATH, 0, 0);

    // back button
    GUI.addTexturedButton(4, "BACK", GRID, GRID * 4, GRID * 4, GRID, BUTTON_TEXTURE_PATH, 0, 0);
}




































































////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Trucker APP
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

