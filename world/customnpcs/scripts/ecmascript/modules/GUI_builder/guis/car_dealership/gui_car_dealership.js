load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js');

function guiButtons(event, npc, buttonId, pageId) {
    switch (pageId) {
        case 1:
            switch (buttonId) {
                // case 33:
                //     // Do something
                //     break;
                case 38: // Previous vehicle
                    navigateVehicle(event, npc, -1);
                    break;
                case 39: // Next vehicle
                    navigateVehicle(event, npc, 1);
                    break;
                // case 43:
                //     // Do something
                //     break;
            }
            break;
        case 2:
            switch (buttonId) {
                // case 12:
                //     // Do something
                //     break;
                // case 13:
                //     // Do something
                //     break;
                // case 50:
                //     // Do something
                //     break;
            }
            break;
        case 3:
            switch (buttonId) {
                // case 52:
                //     // Do something
                //     break;
                // case 53:
                //     // Do something
                //     break;
                // case 55:
                //     // Do something
                //     break;
                // case 76:
                //     // Do something
                //     break;
            }
            break;
    }
}

function navigateVehicle(event, npc, direction) {
    var player = event.player;
    
    var stockData = npc.getStoreddata().get('dealership_stock');
    if (!stockData) {
        tellPlayer(player, '&c[Dealership] No stock loaded. Ask an admin to refresh.');
        return;
    }
    
    var stock = null;
    try {
        stock = JSON.parse(stockData);
    } catch (e) {
        tellPlayer(player, '&c[Dealership] Stock data corrupted.');
        return;
    }
    
    if (!stock || !stock.vehicles || stock.vehicles.length === 0) {
        tellPlayer(player, '&e[Dealership] No vehicles in stock.');
        return;
    }
    
    var currentIndexStr = npc.getStoreddata().get('dealership_vehicle_index');
    var currentIndex = parseInt(currentIndexStr || '0', 10);
    
    var newIndex = currentIndex + direction;
    var totalVehicles = stock.vehicles.length;
    
    if (newIndex < 0) {
        newIndex = totalVehicles - 1;
    } else if (newIndex >= totalVehicles) {
        newIndex = 0;
    }
    
    npc.getStoreddata().put('dealership_vehicle_index', String(newIndex));
}

function guiBuilder_updateManifest(player, npc, manifest) {
    if (!player || !npc) return manifest;

    // Initialize vehicle index tracking if not present
    var stored = npc.getStoreddata().get('dealership_vehicle_index');
    if (!stored) {
        npc.getStoreddata().put('dealership_vehicle_index', '0');
    }

    // Get current vehicle index and stock data
    var currentIndexStr = npc.getStoreddata().get('dealership_vehicle_index') || '0';
    var currentIndex = parseInt(currentIndexStr, 10);
    
    var stockData = npc.getStoreddata().get('dealership_stock');
    if (stockData) {
        var stock = JSON.parse(stockData);
        if (stock && stock.vehicles && stock.vehicles.length > 0 && currentIndex < stock.vehicles.length) {
            var vehicle = stock.vehicles[currentIndex];
            
            // Create itemstack for the current vehicle
            var world = player.getWorld();
            var itemStack = world.createItem(vehicle.id, vehicle.damage || 0, 1);
            
            // Get display name and price
            var displayName = itemStack.getDisplayName();
            // var price = getPriceFromItemStack(itemStack, 0, false);
            // var priceFormatted = formatMoney(price);
            
            // Update label component 5 with vehicle info
            for (var i = 0; i < manifest.pages.length; i++) {
                if (manifest.pages[i].page === 1) {
                    for (var j = 0; j < manifest.pages[i].components.length; j++) {
                        if (manifest.pages[i].components[j].id === 5) {
                            manifest.pages[i].components[j].label = displayName;
                            break;
                        }
                    }
                    break;
                }
            }
            
            var labelComponent = manifest.pages[0].components[4]; // Find component 5
            for (var k = 0; k < manifest.pages[0].components.length; k++) {
                if (manifest.pages[0].components[k].id === 5) {
                    labelComponent = manifest.pages[0].components[k];
                    break;
                }
            }
        }
    }

    // Unlock buttons based on jobs/cash (existing behavior)
    if (playerHasJobWithTag(player, "Mechanic")) {
        manifest.pages[0].components[4].locked = false;
    }
    if (getMoneyInPouch(player) >= 1000000) {
        manifest.pages[1].components[3].locked = false;
    }

    return manifest;
}