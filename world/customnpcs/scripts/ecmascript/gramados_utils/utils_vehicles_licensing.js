// Licensing helpers for vehicle registration flows
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js");

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

function getUnknownLabel() {
    return VEHICLE_REGISTRATION_CONFIG.carPapers.unknown_value;
}
function getNaLabel() {
    return VEHICLE_REGISTRATION_CONFIG.carPapers.na_value;
}



function addOwnershipHistoryPlaceholder(playerName) {
    return {
        owner: playerName,
        acquiredDate: dateToDDMMYYYY(),
        soldDate: getNaLabel()
    };
}


function tellRegisterationDetails(player, registration) {
    tellPlayer(player, "&6--- Vehicle Registration Details ---");
    tellPlayer(player, "&6VIN: &e" + registration.vin);
    tellPlayer(player, "&6Plate: &e" + registration.plate);
    tellPlayer(player, "&6Vehicle ID: &e" + registration.vehicleId);
    tellPlayer(player, "&6Registration Date: &e" + registration.registrationDate);
    tellPlayer(player, "&6Status: &e" + registration.status);
    tellPlayer(player, "&6Region: &e" + registration.region);
    tellPlayer(player, "&6MSRP: &e" + formatMoney(registration.msrpCents));
    tellPlayer(player, "&6Owner History:");
    for (var i = 0; i < registration.ownershipHistory.length; i++) {
        var history = registration.ownershipHistory[i];
        tellPlayer(player, "  &e- Owner: " + history.owner + ", Acquired: " + history.acquiredDate + ", Sold: " + history.soldDate);
    }
}



function generatePlaceholderRegistration(ownerName, itemId) {
    return {
        vin: getUnknownLabel(),
        plate: getUnknownLabel(),
        vehicleId: itemId,
        vehicleSystemName: getUnknownLabel(),
        paintVariant: getUnknownLabel(),
        trim: getUnknownLabel(),
        interior: getUnknownLabel(),
        msrpCents: getPrice(itemId, getUnknownLabel(), null, true),
        engineId: getUnknownLabel(),
        engineSystemName: getUnknownLabel(),
        ownershipHistory: [
            addOwnershipHistoryPlaceholder(ownerName)
        ],
        titles: [],
        insuranceClaims: [],
        history: [],
        registrationDate: dateToDDMMYYYY(),
        status: "WW",
        region: getUnknownLabel(),
        metaSources: ["Placeholder Registration"]
    };
}


function getRegistrationByVin(vin) {
    var licensed = loadLicensedVehicles();
    return findJsonEntry(licensed, "vin", vin);
}

function getRegistrationByPlate(plate) {
    var licensed = loadLicensedVehicles();
    if (licensed[plate]) {
        return licensed[plate];
    }
    return null;
}

function generatePaperItemFromVin(world, vin, player) {
    var registration = getRegistrationByVin(vin);
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
