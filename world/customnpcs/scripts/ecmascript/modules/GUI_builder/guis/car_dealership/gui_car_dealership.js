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
    
    if (!stock.vehicles || stock.vehicles.length === 0) {
        tellPlayer(player, '&e[Dealership] No vehicles in stock.');
        npc.getStoreddata().put('dealership_vehicle_index', 0);
        return;
    }
    
    var currentIndex = npc.getStoreddata().get('dealership_vehicle_index');
    
    // Ensure current index is valid
    if (currentIndex < 0 || currentIndex >= stock.vehicles.length) {
        currentIndex = 0;
    }
    
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
    
    if (!stock.vehicles || stock.vehicles.length === 0) {
        tellPlayer(player, '&c[Dealership] No vehicles available in stock.');
        return false;
    }
    
    if (currentIndex < 0 || currentIndex >= stock.vehicles.length) {
        tellPlayer(player, '&c[Dealership] Invalid vehicle selection. Please refresh.');
        return false;
    }
    
    var vehicle = stock.vehicles[currentIndex];
    var itemStack = player.getWorld().createItem(vehicle.id, vehicle.damage || 0, 1);

    var registration = generateWWRegistration(
        player.getName(),
        vehicle.id,
        "Devland",
        generateRandomWWPlate(),
        [getNaLabel()]
    );
    var price = registration.msrpCents + registration.registrationPriceCents;
    
    if (extractMoneyFromPouch(player, price)) {
        player.giveItem(itemStack);
        tellPlayer(player, '&a[Dealership] You have purchased ' + itemStack.getDisplayName() + ' for ' + formatMoney(price) + '.');

        player.giveItem(generatePaperItem(player.getWorld(), registration, itemStack));

        saveLicenseJSON(registration);

        if (vehicle.count > 1) {
            stock.vehicles[currentIndex].count -= 1;
        } else {
            stock.vehicles.splice(currentIndex, 1);
            stock.totalStacks -= 1;
            if (stock.vehicles.length === 0) {
                npc.getStoreddata().put('dealership_vehicle_index', 0);
            } else if (currentIndex >= stock.vehicles.length) {
                npc.getStoreddata().put('dealership_vehicle_index', stock.vehicles.length - 1);
            }
        }

        npc.getStoreddata().put('dealership_stock', JSON.stringify(stock));
        
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
            
            // Check if stock is empty
            if (!stock.vehicles || stock.vehicles.length === 0) {
                manifest.pages[0].components[0].label = "No Vehicles Available";
                manifest.pages[0].components[5].label = "--";
                manifest.pages[0].components[6].label = "--";
                manifest.pages[0].components[7].locked = true;
                break;
            }
            
            // Validate index
            if (currentIndex < 0 || currentIndex >= stock.vehicles.length) {
                currentIndex = 0;
                npc.getStoreddata().put('dealership_vehicle_index', 0);
            }
            
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
            manifest.pages[0].components[0].label = displayName + (vehicle.count > 1 ? " (" + vehicle.count + " available)" : "");
            manifest.pages[0].components[5].label = priceFormatted;
            manifest.pages[0].components[6].label = paperPrice;

            // Unlock licensing button if player has Mechanic job
            manifest.pages[0].components[7].locked = !playerHasJobWithTag(player, "Mechanic");
            break;
        case 2:
            // tellPlayer(player, '&e[Dealership] Updating purchase page.');
            // Get current vehicle index and stock data
            var currentIndex = npc.getStoreddata().get('dealership_vehicle_index');
            var stock = JSON.parse(npc.getStoreddata().get('dealership_stock'));
            
            // Validate stock and index
            if (!stock.vehicles || stock.vehicles.length === 0) {
                manifest.pages[1].components[2].label = "No Vehicles Available";
                break;
            }
            
            if (currentIndex < 0 || currentIndex >= stock.vehicles.length) {
                currentIndex = 0;
                npc.getStoreddata().put('dealership_vehicle_index', 0);
            }
            
            var vehicle = stock.vehicles[currentIndex];
            var itemStack = player.getWorld().createItem(vehicle.id, vehicle.damage || 0, 1);
            var displayName = itemStack.getDisplayName();
            var price = getPriceFromItemStack(itemStack, 0, false) + calculateCarPaperPrice(getPriceFromItemStack(itemStack, 0, false), "Devland", "XXX-0000");
            var priceFormatted = formatMoney(price);

            manifest.pages[1].components[2].label = displayName;
            manifest.pages[1].components[3].label = priceFormatted;

            manifest.pages[1].components[0].locked = !hasMoneyInPouch(player, price);

            break;
        case 3:
            // Additional page updates can be handled here
            var inv = player.getInventory();
            var slots = inv.getItems();
            var all_papers = get_all_car_papers(slots, false);
            var ww_papers = get_all_ww_car_papers(slots);
            tellPlayer(player, "&e- Total Car Papers (excl. WW): &a" + all_papers.length);
            tellPlayer(player, "&e- Total WW Car Papers: &a" + ww_papers.length);

            if( ww_papers.length > 0) {
                var current_ww_paper = ww_papers[0]
                var registry_data = getPaperLinkedRegistry(current_ww_paper);
            }

            manifest.pages[2].components[3].label = registry_data.plate;
            manifest.pages[2].components[6].label = player.getWorld().createItem(registry_data.vehicleId, 0, 1).getDisplayName();

            break;
    }

    return manifest;
}