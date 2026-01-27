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
    
    var vehicleCatalog = loadVehicleCatalog();
    
    // Search for first vehicle item in inventory
    for (var i = 0; i < slots.length; i++) {
        var stack = slots[i];
        if (!stack || stack.isEmpty()) continue;
        
        var itemId = stack.getName();

        var mainVehicleId = getMainVehicleId(itemId);

        if (mainVehicleId && vehicleCatalog.vehicles[mainVehicleId]) {
            var registeredData = generatePlaceholderRegistration(player.getDisplayName(), itemId);
            tellRegisterationDetails(player, registeredData);
            return;
        }
    }
    
    tellPlayer(player, "&c[Debug] No vehicle items found in your inventory.");
}
