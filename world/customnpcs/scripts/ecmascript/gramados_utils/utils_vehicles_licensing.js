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
    tellPlayer(player, "&6Registration Price: &e" + formatMoney(registration.registrationPriceCents));
    tellPlayer(player, "&6Owner History:");
    for (var i = 0; i < registration.ownershipHistory.length; i++) {
        var history = registration.ownershipHistory[i];
        tellPlayer(player, "  &e- Owner: " + history.owner + ", Acquired: " + history.acquiredDate + ", Sold: " + history.soldDate);
    }
}



function generatePlaceholderRegistration(ownerName, itemId, region, plate, titles) {
    var msrp = getPrice(itemId, getUnknownLabel(), null, true);
    return {
        vin: getUnknownLabel(),
        plate: plate,
        vehicleId: itemId,
        vehicleSystemName: getUnknownLabel(),
        paintVariant: getUnknownLabel(),
        trim: getUnknownLabel(),
        interior: getUnknownLabel(),
        msrpCents: msrp,
        registrationPriceCents: calculateCarPaperPrice(msrp, region, plate, titles),
        engineId: getUnknownLabel(),
        engineSystemName: getUnknownLabel(),
        ownershipHistory: [
            addOwnershipHistoryPlaceholder(ownerName)
        ],
        titles: titles,
        insuranceClaims: [],
        history: [],
        registrationDate: dateToDDMMYYYY(),
        status: "WW",
        region: region,
        metaSources: ["WW Registration"]
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
    return generatePaperItem(world, registration, player);
}

function generatePaperItemFromPlate(world, plate, player) {
    var registration = getRegistrationByPlate(plate);
    return generatePaperItem(world, registration, player);
}

function generateWWPaperItem(world, registration, player) {
    var stack = world.createItem(VEHICLE_REGISTRATION_CONFIG.carPapers.item_id, 0, 1);
    stack.setCustomName(ccs("&6Car Papers"));

    var vehicle_stack = world.createItem(registration.vehicleId, 0, 1);
    var vehicle_stack_name = vehicle_stack.getDisplayName();

    var lore = [
        "&b" + vehicle_stack_name,
        "&cThis vehicle is currently in WW state.",
        "&cTo finalize registration, please contact any dealership.",
        "&cInteract with both the car papers and the car item after placement."
    ];
    stack.setLore(lore);
    return stack;
}

function generatePaperItem(world, registration, player) {
    var stack = world.createItem(VEHICLE_REGISTRATION_CONFIG.carPapers.item_id, 0, 1);
    stack.setCustomName(ccs("&6Car Papers"));

    var vehicle_stack = world.createItem(registration.vehicleId, 0, 1);
    var vehicle_stack_name = vehicle_stack.getDisplayName();

    var lore = [
        "&b" + vehicle_stack_name,
        "&aConfiguration:",
        "&a- Trim: " + registration.trim,
        "&a- Paint: " + registration.paint,
        "&a- Interior: " + registration.interior,
        "&a- Engine: " + registration.engine,
        "&5Information:",
        "&5- First Owner: " + registration.firstOwner,
        "&5- Delivery: " + registration.delivery,
        "&5- Plate: " + registration.plate,
        "&5- MSRP: " + getAmountCoin(registration.msrpCents),
        "&eRegistry:",
        "&e- Title: " + registration.title,
        "&e- Price: " + getAmountCoin(registration.registrationPriceCents),
        "&e- Region: " + registration.region
    ];
    stack.setLore(lore);
    return stack;
}
