// Licensing helpers for vehicle registration flows
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js");

var VEHICLE_REGISTRATION_CONFIG = loadJson("world/customnpcs/scripts/ecmascript/modules/vehicle_registration/config.json");
var VEHICLE_LICENSED_DATA_PATH = "world/customnpcs/scripts/data_auto/licensed_vehicles.json";
var VEHICLE_LICENSED_DATA = loadJson(VEHICLE_LICENSED_DATA_PATH);

function getUnknownLabel() {
    return VEHICLE_REGISTRATION_CONFIG.carPapers.unknown_value;
}

function getNaLabel() {
    return VEHICLE_REGISTRATION_CONFIG.carPapers.na_value;
}

function isPlateLicensed(plate) {
    var licensed = loadLicensedVehicles();
    return !!licensed[plate];
}

function calculateCarPaperPrice(vehicleMsrp, region, plateText, titles) {
    var basePrice = vehicleMsrp * 0.05;

    var regionMultiplier = VEHICLE_REGISTRATION_CONFIG.regions[region];
    var price = basePrice * regionMultiplier;

    // Titles may be a string or an array of strings.
    if (titles && VEHICLE_REGISTRATION_CONFIG.titles) {
        var titleList = (typeof titles === "string") ? [titles] : titles;
        if (titleList && titleList.length) {
            for (var i = 0; i < titleList.length; i++) {
                var t = titleList[i];
                if (t && VEHICLE_REGISTRATION_CONFIG.titles.hasOwnProperty(t)) {
                    price = price * VEHICLE_REGISTRATION_CONFIG.titles[t];
                }
            }
        }
    }

    // Known plate formats:
    // - Gramados: 3 letters + dash + 4 digits (ABC-1234)
    // - UNU Euro / WW: 2 letters + dash + 5 digits (BT-00000 / WW-00000)
    var plateStr = String(plateText || "");
    var isStandardPlate = /^[A-Za-z]{3}-\d{4}$/.test(plateStr) || /^[A-Za-z]{2}-\d{5}$/.test(plateStr);
    if (!isStandardPlate) {
        price += VEHICLE_REGISTRATION_CONFIG.carPapers.special_plate_fee; // Add fee for non-standard plates
    }

    return Math.round(price / 100) * 100;
}

// TODO: DEPRECATE IN FAVOR OF getRegistrationByVin/Plate
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

function getOwnershipHistoryEntry(playerName) {
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

function generateRegistration(ownerName, item_stack, region, titles) {
    if (!item_stack.hasNbt()) {
        return generateWWRegistration(ownerName, item_stack.getName(), region, generateRandomPlate("plate_gramados"), titles);
    }
}

function generateWWRegistration(ownerName, itemId, region, plate, titles) {
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
        firstRegistrant: ownerName,
        ownershipHistory: [
            getOwnershipHistoryEntry(ownerName)
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

function setupPaperNBT(stack, registration) {
    var nbt = stack.getNbt();
    nbt.setString("status", registration.status);
    nbt.setString("plate", registration.plate);
    nbt.setString("registrant", registration.firstRegistrant);
    nbt.setString("linked_vehicle_id", registration.vehicleId);
}

function setupPaperLoreWW(stack, registration, vehicleDisplayName) {
    var lore = [
        "§b" + vehicleDisplayName,
        "§cThis vehicle is currently in WW state.",
        "§cTo finalize registration, please contact any dealership.",
        "§cInteract with both these papers and the car item after placement.",
        "§5WW Information:",
        "§5- WW Registrant: " + registration.firstRegistrant,
        "§5- WW Registration Date: " + registration.registrationDate,
        "§5- Plate: " + registration.plate,
        "§5- MSRP: " + getAmountCoin(registration.msrpCents),
        "§eRegistry:",
        "§e- Titles: " + registration.titles.join(", "),
        "§e- Price: " + getAmountCoin(registration.registrationPriceCents),
        "§e- Region: " + registration.region
    ];
    stack.setLore(lore);
    return stack;
}

function setPaperLoreActive(stack, registration, vehicleDisplayName) {
    var lore = [
        "§b" + vehicleDisplayName,
        "§aConfiguration:",
        "§a- Trim: " + registration.trim,
        "§a- Paint: " + registration.paint,
        "§a- Interior: " + registration.interior,
        "§a- Engine: " + registration.engine,
        "§5Information:",
        "§5- Registrant: " + registration.firstRegistrant,
        "§5- Registration Date: " + registration.registrationDate,
        "§5- Plate: " + registration.plate,
        "§5- MSRP: " + getAmountCoin(registration.msrpCents),
        "§eRegistry:",
        "§e- Titles: " + registration.titles.join(", "),
        "§e- Price: " + getAmountCoin(registration.registrationPriceCents),
        "§e- Region: " + registration.region
    ];
    stack.setLore(lore);
    return stack;
}

function getPaperLinkedRegistry(paperStack) {
    if (!isPaperCarPapers(paperStack)) {
        return null;
    }
    var nbt = paperStack.getNbt();
    var plate = nbt.getString("plate");
    return getRegistrationByPlate(plate);
}

function generatePaperItem(world, registration, car_stack) {

    var stack = world.createItem(VEHICLE_REGISTRATION_CONFIG.carPapers.item_id, 0, 1);
    stack.setCustomName(ccs("&6Car Papers"));

    if (registration.status === "WW") {
        setupPaperLoreWW(stack, registration, car_stack.getDisplayName());
    } else {
        setPaperLoreActive(stack, registration, car_stack.getDisplayName());
    }
    setupPaperNBT(stack, registration);
    
    return stack;
}

function isPaperCarPapers(stack) {
    if (!stack || stack.isEmpty()) {
        return false;
    }
    if (stack.getName() !== VEHICLE_REGISTRATION_CONFIG.carPapers.item_id) {
        return false;
    }
    var nbt = stack.getNbt();
    return nbt.has("plate") && nbt.has("status") && nbt.has("registrant") && nbt.has("linked_vehicle_id");
}

function isPaperWWCarPapers(stack) {
    if (!isPaperCarPapers(stack)) {
        return false;
    }
    var nbt = stack.getNbt();
    return nbt.getString("status") === "WW";
}

function playerHasWWPapersInInv(player) {
    var inv = player.getInventory();
    var slots = inv.getItems();
    for (var i = 0; i < slots.length; i++) {
        var stack = slots[i];
        if (isPaperWWCarPapers(stack)) {
            return true;
        }
    }
    return false;
}

function saveLicenseJSON(registration) {
    var plate = registration.plate;

    VEHICLE_LICENSED_DATA[plate] = registration;
    saveJson(VEHICLE_LICENSED_DATA, VEHICLE_LICENSED_DATA_PATH);
}
    

// Car Part NBT Checks

function isCarPartNBT_Engine(nbt) {
    if (nbt.has("packID") && nbt.has("temp") && nbt.has("systemName")) {
        return includes(VEHICLE_REGISTRATION_CONFIG.engineSystemNames, nbt.getString("systemName"));
    }
    return false;
}

function isCarPartNBT_Plate(nbt) {
    if (nbt.has("packID") && nbt.has("systemName")) {
        return includes(VEHICLE_REGISTRATION_CONFIG.plateSystemNames, nbt.getString("systemName"));
    }
    return false;
}

//  VIN

function hasVehicleVIN(ItemStack) {
    if (!isItem_Vehicle(ItemStack)) {
        return false;
    }
    var nbt = ItemStack.getNbt();
    return nbt.has("keyUUID");
}

function getVehicleVIN(ItemStack) {
    if (!hasVehicleVIN(ItemStack)) {
        return null;
    }
    var nbt = ItemStack.getNbt();
    return nbt.getString("keyUUID");
}

// Other NBT

function hasVehicleNBT(ItemStack, player) {
    if (!isItem_Vehicle(ItemStack)) {
        tellPlayer(player, "&cThe item " + ItemStack.getDisplayName() + " is not recognized as a vehicle. Have you placed it down and interacted with it to generate the necessary NBT data?");
        return false;
    }

    var checked_systems = checkCarSystems(ItemStack);

    tellPlayer(player, "&6Vehicle NBT Check:");
    tellPlayer(player, "&e- Plate System: " + (checked_systems.plate_gramados ? "&aFound" : "&cNot Found"));
    tellPlayer(player, "&e- VIN: " + (checked_systems.VIN ? "&aFound" : "&cNot Found"));
    tellPlayer(player, "&e- Engine System: " + (checked_systems.engine ? "&aFound" : "&cNot Found"));
    return (checked_systems.plate_gramados && checked_systems.VIN && checked_systems.engine);
}

function checkCarSystems(ItemStack) {
    var checkedSystems = {
        "plate_gramados": false,
        "VIN": false,
        "engine": false
    }

    var rawNbt = ItemStack.getNbt();
    var allKeys = rawNbt.getKeys();
    var allPartKeys = []
    for (var i = 0; i < allKeys.length; i++) {
        var key = allKeys[i];
        if (key.startsWith("part_")) {
            allPartKeys.push(key);
        }
    }
    
    for (var i = 0; i < allPartKeys.length; i++) {
        var partKey = allPartKeys[i];
        var partNbt = rawNbt.getCompound(partKey);

        if (!checkedSystems.plate_gramados) {
            checkedSystems.plate_gramados = isCarPartNBT_Plate(partNbt);
        }
        if (!checkedSystems.engine) {
            checkedSystems.engine = isCarPartNBT_Engine(partNbt);
        }
        if (!checkedSystems.VIN) {
            checkedSystems.VIN = hasVehicleVIN(ItemStack);
        }
    }
    return checkedSystems;
}

function getCarSystems(ItemStack) {
    var checkedSystems = {
        "plate_gramados": null,
        "VIN": null,
        "engine": null
    }

    var rawNbt = ItemStack.getNbt();
    var allKeys = rawNbt.getKeys();
    var allPartKeys = []
    for (var i = 0; i < allKeys.length; i++) {
        var key = allKeys[i];
        if (key.startsWith("part_")) {
            allPartKeys.push(key);
        }
    }

    if (hasVehicleVIN(ItemStack)) {
        checkedSystems.VIN = getVehicleVIN(ItemStack);
    }
    
    for (var i = 0; i < allPartKeys.length; i++) {
        var partKey = allPartKeys[i];
        var partNbt = rawNbt.getCompound(partKey);

        if (isCarPartNBT_Plate(partNbt)) {
            checkedSystems.plate_gramados = {
                systemName: partNbt.getString("systemName"),
                plateText: partNbt.getString("plateText")
            };
        }
        if (isCarPartNBT_Engine(partNbt)) {
            checkedSystems.engine = {
                systemName: partNbt.getString("systemName"),
                temp: partNbt.getFloat("temp")
            };
        }
    }
    return checkedSystems;
}

function isItem_Vehicle(ItemStack) {
    var nbt = ItemStack.getNbt();
    return nbt.has("electricPower") && nbt.has("fuelTank");
}