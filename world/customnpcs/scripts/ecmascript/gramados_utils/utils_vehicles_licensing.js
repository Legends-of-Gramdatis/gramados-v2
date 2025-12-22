// Licensing helpers for vehicle registration flows
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles.js");

function isPlateLicensed(plate) {
    if (!plate) {
        return false;
    }
    var licensed = loadLicensedVehicles() || {};
    return !!licensed[plate];
}

function isVinUnknown(vin) {
    if (!vin) {
        return true;
    }
    var licensed = loadLicensedVehicles() || {};
    for (var plate in licensed) {
        if (licensed[plate] && licensed[plate].vin === vin) {
            return false;
        }
    }
    return true;
}

function getRegistrationByVin(vin) {
    if (!vin) {
        return null;
    }
    var licensed = loadLicensedVehicles() || {};
    for (var plate in licensed) {
        var entry = licensed[plate];
        if (entry && entry.vin === vin) {
            return { plate: plate, entry: entry };
        }
    }
    return null;
}
