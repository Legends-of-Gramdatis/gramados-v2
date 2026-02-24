load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles_licensing.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js");

var VEHICLE_REGISTRATION_CONFIG = loadJson("world/customnpcs/scripts/ecmascript/modules/vehicle_registration/config.json");

var ADMIN_SEAGULL_CARD_ID = "mts:ivv.idcard_seagull";

function interact(event) {
    var player = event.player;
    var heldItem = player.getMainhandItem();
    var offhandItem = player.getOffhandItem();

    var hasSeagullCard = !offhandItem.isEmpty() && offhandItem.getName() === ADMIN_SEAGULL_CARD_ID;
    if (!hasSeagullCard) {
        return;
    }

    if (heldItem.isEmpty()) {
        tellPlayer(player, ":car: &c[Vehicle Registration] Hold a vehicle or car paper item in your main hand.");
        return;
    }

    if (heldItem.hasNbt() && isItem_Vehicle(heldItem)) {
        tellPlayer(player, ":car: &e[Vehicle Registration] &r:lit:&e Main hand item is a vehicle.");
    
        var registration = assembleRegistrationFrom_Vehicle(heldItem);
        tellRegisterationDetails(player, registration);
        tellPlayer(player, ":car: &a[Vehicle Registration] Vehicle registration assembled from vehicle item and logged successfully.");
    
    
    
    } else if (heldItem.getName() === VEHICLE_REGISTRATION_CONFIG.carPapers.item_id) {
        if (isItem_CarPaperOG(heldItem)) {
            tellPlayer(player, ":car: &e[Vehicle Registration] &r:lit:&e Main hand item is an OG car paper.");
            var registration = assembleRegistrationFrom_OGpapers(heldItem);
            tellRegisterationDetails(player, registration);
            tellPlayer(player, ":car: &a[Vehicle Registration] Vehicle registration assembled from OG car papers and logged successfully.");
        } else {
            return;
        }
    } else {
        return;
    }

    if (isPlateLicensed(registration.plate)) {
        tellPlayer(player, ":car: &a[Vehicle Registration] This vehicle's plate is already licensed.");
    
        var existingRegistration = getRegistrationByPlate(registration.plate);
        tellRegisterationDetails(player, existingRegistration);

        tellPlayer(player, ":car: &e[Vehicle Registration] Updating this vehicle's registration with new information...");
        var mergedRegistration = mergeRegistrationData(existingRegistration, registration);
        updateRegistration(mergedRegistration);
        tellPlayer(player, ":car: &a[Vehicle Registration] Vehicle registration updated successfully.");
        return;
    } else {
        tellPlayer(player, ":car: &e[Vehicle Registration] This vehicle's plate is not licensed.");
        tellPlayer(player, ":car: &e[Vehicle Registration] Registering this vehicle's plate now...");
        if(registerPlate(registration)) {
            tellPlayer(player, ":car: &a[Vehicle Registration] Vehicle plate registered successfully.");
        } else {
            tellPlayer(player, ":car: &c[Vehicle Registration] Failed to register vehicle plate.");
            // merge it with last plate

            var lastPlate = getMostRecentPlate();
            if (lastPlate) {
                tellPlayer(player, ":car: &e[Vehicle Registration] Attempting to merge with most recent plate: " + lastPlate.plate);
                var mergedRegistration = mergeRegistrationData(lastPlate, registration);
                updateRegistration(mergedRegistration);
                tellPlayer(player, ":car: &a[Vehicle Registration] Vehicle registration merged with most recent plate successfully.");
            } else {
                tellPlayer(player, ":car: &c[Vehicle Registration] No recent plate found to merge with.");
            }
        }
        return;
    }
}
