load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles_licensing.js");

function guiButtons(event, npc, buttonId, pageId, manifest) {
    switch (pageId) {
        case 1:
            switch (buttonId) {
                case 38: // Previous vehicle
                    navigateVehicle(event, npc, -1);
                    break;
                case 39: // Next vehicle
                    navigateVehicle(event, npc, 1);
                    break;
                // case 43:
                //     // Do something
                //     break;
                // case 87:
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
                // case 103:
                //     // Do something
                //     break;
                // case 104:
                //     // Do something
                //     break;
                case 105:
                    manifest.pages[2].components[11].label = generateRandomPlate('plate_gramados');
                    break;
                case 107:
                    manifest.pages[2].components[11].label = event.gui.getComponent(manifest.pages[2].components[11].id).getText();
                    break;
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
            var slots = player.getInventory().getItems();
            var registered_car_couple = getRegisteredCouple(get_all_car_items(slots), get_all_ww_car_papers(slots));

            if( registered_car_couple && registered_car_couple.paper && registered_car_couple.car ) {
                var registry_data = getPaperLinkedRegistry(registered_car_couple.paper);
            }

            if (manifest.pages[2].components[11].label == "XXX-0000") {
                manifest.pages[2].components[11].label = generateRandomPlate('plate_gramados');
            }
            manifest.pages[2].components[3].label = player.getWorld().createItem(registry_data.vehicleId, 0, 1).getDisplayName();

            // manifest.pages[2].components[10].locked = !playerHasJobWithTag(player, "Mechanic");
            // manifest.pages[2].components[11].locked = !playerHasJobWithTag(player, "Mechanic");
            manifest.pages[2].components[10].locked = false; // For testing purposes, unlock the button regardless of job status
            manifest.pages[2].components[11].locked = false;

            var systems = checkCarSystems(registered_car_couple.car);
            var systemDetails = getCarSystems(registered_car_couple.car);

            if (systems.plate_gramados) {
                manifest.pages[2].components[5].tex.x = 160;
                manifest.pages[2].components[5].tex.y = 96;
                manifest.pages[2].components[5].hover_text = manifest.pages[2].components[11].label;
            } else {
                manifest.pages[2].components[5].tex.x = 176;
                manifest.pages[2].components[5].tex.y = 96;
                manifest.pages[2].components[5].hover_text = "Invalid Plate Detected";
            }
            if (systems.engine) {
                manifest.pages[2].components[6].tex.x = 160;
                manifest.pages[2].components[6].tex.y = 96;
                manifest.pages[2].components[6].hover_text = systemDetails.engine.systemName;
            } else {
                manifest.pages[2].components[6].tex.x = 176;
                manifest.pages[2].components[6].tex.y = 96;
                manifest.pages[2].components[6].hover_text = "No Engine Detected";
            }
            if (systems.VIN) {
                manifest.pages[2].components[7].tex.x = 160;
                manifest.pages[2].components[7].tex.y = 96;
                manifest.pages[2].components[7].hover_text = systemDetails.VIN;
            } else {
                manifest.pages[2].components[7].tex.x = 176;
                manifest.pages[2].components[7].tex.y = 96;
                manifest.pages[2].components[7].hover_text = "No VIN Detected";
            }

            var validity = isPlateValid(manifest.pages[2].components[11].label);
            if (validity.valid) {
                if (isPlateCustom(manifest.pages[2].components[11].label)) {
                    var config = loadJson("world/customnpcs/scripts/ecmascript/modules/vehicle_registration/config.json");
                    manifest.pages[2].components[9].locked = !hasMoneyInPouch(player, config.carPapers.special_plate_fee)
                    manifest.pages[2].components[9].hover_text = "You can't afford custom plate fee: " + formatMoney(config.carPapers.special_plate_fee);
                } else {
                    manifest.pages[2].components[9].locked = false;
                    manifest.pages[2].components[9].hover_text = "Plate is valid";
                }
            } else {
                manifest.pages[2].components[9].locked = true;
                manifest.pages[2].components[9].hover_text = "Plate is invalid: " + validity.messages.join(", ");
            }

            break;
    }

    return manifest;
}