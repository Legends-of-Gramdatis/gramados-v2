// Licensing helpers for vehicle registration flows
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles.js");

var VEHICLE_REGISTRATION_CONFIG = loadJson("world/customnpcs/scripts/ecmascript/modules/vehicle_registration/config.json");


function isPlateLicensed(plate) {
    if (!plate) {
        return false;
    }
    var licensed = loadLicensedVehicles();
    return !!licensed[plate];
}

function isVinUnknown(vin) {
    if (!vin) {
        return true;
    }
    var licensed = loadLicensedVehicles();
    for (var plate in licensed) {
        if (licensed[plate] && licensed[plate].vin === vin) {
            return false;
        }
    }
    return true;
}

function calculateCarPaperPrice(msrpNumber, region, plateText, title) {
    var msrp = Number(msrpNumber);
    if (!isFinite(msrp) || msrpNumber === null || msrpNumber === undefined || msrpNumber < 0) {
        return null;
    }
    var basePrice = msrp * 0.05;

    var regionMultiplier = VEHICLE_REGISTRATION_CONFIG.regions[region];
    var price = basePrice * regionMultiplier;

    if (title && VEHICLE_REGISTRATION_CONFIG.titles && VEHICLE_REGISTRATION_CONFIG.titles.hasOwnProperty(title)) {
        price = price * VEHICLE_REGISTRATION_CONFIG.titles[title];
    }

    if (!/^[A-Za-z]{3}-\d{4}$/.test(plateText || "")) {
        price += NON_STANDARD_PLATE_FEE_CENTS;
    }

    return Math.round(price / 100) * 100;
}

function getRegistrationByVinCompact(vin) {
    if (!vin) {
        return null;
    }
    var licensed = loadLicensedVehicles();
    for (var plate in licensed) {
        var entry = licensed[plate];
        if (entry && entry.vin === vin) {
            return { plate: plate, entry: entry };
        }
    }
    return null;
}

function getRegistrationByVin(vin) {
    if (!vin) {
        return null;
    }
    var licensed = loadLicensedVehicles();
    for (var plate in licensed) {
        var entry = licensed[plate];
        if (entry && entry.vin === vin) {
            return { plate: plate, entry: entry };
        }
    }
    return null;
}



function getRegistrationByPlate(plate) {
    if (!plate) {
        return null;
    }
    var licensed = loadLicensedVehicles();
    if (licensed[plate]) {
        return { plate: plate, entry: licensed[plate] };
    }
    return null;
}

function generatePaperItemFromVin(world, vin, player) {
    var registration = getRegistrationByVinCompact(vin);
    if (registration) {
        return generatePaperItemFromPlate(world, registration.plate, player);
    }
    return null;
}

function generatePaperItemFromPlate(world, plate, player) {
    var licensed = loadLicensedVehicles();
    if (!licensed[plate]) {
        return null;
    }
    var vehicleData = licensed[plate];
    var vehicleInfo = getVehicleInfoByItemId(vehicleData.itemId);
    if (!vehicleInfo) {
        return null;
    }

    return stack;
}
