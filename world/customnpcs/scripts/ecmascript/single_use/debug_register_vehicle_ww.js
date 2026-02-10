// Debug script: Register any vehicle from inventory as WW plate
// Place this as an NPC script (interact) for quick vehicle registration testing

load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles_licensing.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");


function interact(event) {
    var player = event.player;
    var inv = player.getInventory();
    var slots = inv.getItems();

    var all_papers = get_all_car_papers(slots, false);
    var ww_papers = get_all_ww_car_papers(slots);
    var car_items = get_all_car_items(slots);
    var registered_car_items = get_all_car_items_registered(car_items, all_papers);
    var ww_registered_car_items = get_all_car_items_registered(car_items, ww_papers);

    tellPlayer(player, "&6Debug Vehicle Registration Report:");
    tellPlayer(player, "&e- Total Car Papers (excl. WW): &a" + all_papers.length);
    tellPlayer(player, "&e- Total WW Car Papers: &a" + ww_papers.length);
    tellPlayer(player, "&e- Total Car Items: &a" + car_items.length);
    tellPlayer(player, "&e- Total Registered Car Items: &a" + registered_car_items.length);
    tellPlayer(player, "&e- Total WW Registered Car Items: &a" + ww_registered_car_items.length);

    var unregistered_cars = [];
    for (var i = 0; i < car_items.length; i++) {
        var car_stack = car_items[i];
        if (!is_car_registered(car_stack, ww_papers, true)) {
            unregistered_cars.push(car_stack);
        }
    }

    tellPlayer(player, "&6Unregistered Car Items in Inventory:");
    for (var i = 0; i < unregistered_cars.length; i++) {
        var car_stack = unregistered_cars[i];
        tellPlayer(player, "&e- " + car_stack.getDisplayName());
    }

    tellPlayer(player, "&6WW Registered Car Items in Inventory:");
    for (var i = 0; i < ww_registered_car_items.length; i++) {
        var car_stack = ww_registered_car_items[i];
        tellPlayer(player, "&e- " + car_stack.getDisplayName());
    }

    if (ww_registered_car_items.length > 0) {
        for (var i = 0; i < ww_registered_car_items.length; i++) {
            var car_stack = ww_registered_car_items[i];
            tellPlayer(player, "&6Checking if " + car_stack.getDisplayName() + " has valid vehicle NBT tu upgrade from WW to Active registration...");
            if (hasVehicleNBT(car_stack, player)) {
                tellPlayer(player, "&aVehcile " + car_stack.getDisplayName() + " is valid and can be registered to Active status.");
            }
        }
    }
}
