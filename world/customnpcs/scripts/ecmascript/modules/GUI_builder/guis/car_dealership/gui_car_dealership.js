load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles_licensing.js");

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
                case 12:
                    purchaseVehicle(event.player, npc);
                    event.player.closeGui();
                    break;
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
    var stock = JSON.parse(npc.getStoreddata().get('dealership_stock'));
    
    if (stock.vehicles.length === 0) {
        tellPlayer(player, '&e[Dealership] No vehicles in stock.');
        return;
    }
    
    var currentIndex = npc.getStoreddata().get('dealership_vehicle_index');
    
    var newIndex = currentIndex + direction;
    var totalVehicles = stock.vehicles.length;
    
    if (newIndex < 0) {
        newIndex = totalVehicles - 1;
    } else if (newIndex >= totalVehicles) {
        newIndex = 0;
    }
    
    npc.getStoreddata().put('dealership_vehicle_index', newIndex);
    tellPlayer(player, '&e[Dealership] Showing vehicle ' + (newIndex + 1) + ' of ' + totalVehicles + '.');
}

function purchaseVehicle(player, npc) {
    var currentIndex = npc.getStoreddata().get('dealership_vehicle_index');
    var stock = JSON.parse(npc.getStoreddata().get('dealership_stock'));
    var vehicle = stock.vehicles[currentIndex];
    var itemStack = player.getWorld().createItem(vehicle.id, vehicle.damage || 0, 1);
    var price = getPriceFromItemStack(itemStack, 0, false) + calculateCarPaperPrice(getPriceFromItemStack(itemStack, 0, false), "Devland", "XXX-0000");
    
    if (extractMoneyFromPouch(player, price)) {
        player.giveItem(itemStack);
        tellPlayer(player, '&a[Dealership] You have purchased ' + itemStack.getDisplayName() + ' for ' + formatMoney(price) + '.');
        return true;
    }

    tellPlayer(player, '&c[Dealership] You do not have enough money to purchase this vehicle. Price: ' + formatMoney(price) + '.');
    return false;
}
function guiBuilder_updateManifest(player, npc, manifest) {

    var pageId = npc.getStoreddata().get('dealership_current_page');

    tellPlayer(player, '&e[Dealership] Updating GUI for page ' + pageId + '.');

    switch (pageId) {
        case 1:

            // Get current vehicle index and stock data
            var currentIndex = npc.getStoreddata().get('dealership_vehicle_index');
            var stock = JSON.parse(npc.getStoreddata().get('dealership_stock'));
            var vehicle = stock.vehicles[currentIndex];

            // Create itemstack for the current vehicle
            var world = player.getWorld();
            var itemStack = world.createItem(vehicle.id, vehicle.damage || 0, 1);
            
            // Get display name and price
            var displayName = itemStack.getDisplayName();
            var price = getPriceFromItemStack(itemStack, 0, false);
            var priceFormatted = formatMoney(price);
            var paperPrice = formatMoney(calculateCarPaperPrice(price, "Devland", "XXX-0000"));
            
            // Update label component with vehicle display name
            manifest.pages[0].components[0].label = displayName;
            manifest.pages[0].components[5].label = priceFormatted;
            manifest.pages[0].components[6].label = paperPrice;

            // Unlock licensing button if player has Mechanic job
            manifest.pages[0].components[7].locked = !playerHasJobWithTag(player, "Mechanic");
            break;
        case 2:
            tellPlayer(player, '&e[Dealership] Updating purchase page.');
            // Get current vehicle index and stock data
            var currentIndex = npc.getStoreddata().get('dealership_vehicle_index');
            var stock = JSON.parse(npc.getStoreddata().get('dealership_stock'));
            var vehicle = stock.vehicles[currentIndex];
            var itemStack = player.getWorld().createItem(vehicle.id, vehicle.damage || 0, 1);
            var displayName = itemStack.getDisplayName();
            var price = getPriceFromItemStack(itemStack, 0, false) + calculateCarPaperPrice(price, "Devland", "XXX-0000");
            var priceFormatted = formatMoney(price);

            manifest.pages[1].components[2].label = displayName;
            manifest.pages[1].components[3].label = priceFormatted;

            manifest.pages[1].components[0].locked = !hasMoneyInPouch(player, price);

            break;
        case 3:
            // Additional page updates can be handled here
            break;
    }

    return manifest;
}