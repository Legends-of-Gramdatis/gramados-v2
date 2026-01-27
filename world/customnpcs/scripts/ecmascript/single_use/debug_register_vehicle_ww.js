// Debug script: Register any vehicle from inventory as WW plate
// Place this as an NPC script (interact) for quick vehicle registration testing

load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles.js");
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
        
        // Check if this item exists in vehicle catalog
        // Try direct lookup first
        var systemName = getVehicleSystemNameFromItemId(itemId);
        var mainVehicleId = getMainVehicleId(itemId);

        tellPlayer(player, "&6[Debug] Checking item: &e" + itemId + " | System name: " + systemName + " | Main vehicle ID: " + mainVehicleId);
        
        if (mainVehicleId && vehicleCatalog.vehicles[mainVehicleId]) {
            tellPlayer(player, "&6[Debug] Found vehicle: &e" + itemId);
            tellPlayer(player, "&6[Debug] System name: &e" + systemName);
            
            // Call registerVehicleAsWW
            registerVehicleAsWW(itemId, player.getName(), player);
            
            tellPlayer(player, "&a[Debug] Vehicle registration initiated!");
            return;
        }
    }
    
    tellPlayer(player, "&c[Debug] No vehicle items found in your inventory.");
}
