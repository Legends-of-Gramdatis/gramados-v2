// Licensing helpers for vehicle registration flows
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
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

function isUnknownOrNa(value) {
    var str = String(value || "").trim();
    return (str === getUnknownLabel() || str === getNaLabel() || str === "");
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

function removeRegistration(plate) {
    var licensed = loadLicensedVehicles();
    if (licensed[plate]) {
        delete licensed[plate];
        saveJson(licensed, VEHICLE_LICENSED_DATA_PATH);
        return true;
    }
    return false;
}

function assembleRegistrationFrom_OGpapers(item_stack) {
    var lore = item_stack.getLore();
    var lr_paintVariant = getLoreValueByPrefix(lore, "§a- Paint: ", getUnknownLabel());
    var lr_trim = getLoreValueByPrefix(lore, "§a- Trim: ", getUnknownLabel());
    var lr_interior = getLoreValueByPrefix(lore, "§a- Interior: ", getUnknownLabel());
    var lr_engine = getLoreValueByPrefix(lore, "§a- Engine: ", getUnknownLabel());

    var lr_owner = getLoreValueByPrefix(lore, "§5- First Owner: ", getUnknownLabel());
    if (isUnknownOrNa(lr_owner)) {
        lr_owner = getLoreValueByPrefix(lore, "§5- Owner: ", getUnknownLabel());
    }
    var lr_delivery = getLoreValueByPrefix(lore, "§5- Delivery: ", getUnknownLabel());
    var lr_plate = getLoreValueByPrefix(lore, "§5- Plate: ", getUnknownLabel());
    var lr_msrp = getLoreValueByPrefix(lore, "§5- MSRP: ", getUnknownLabel());

    var lr_title = getLoreValueByPrefix(lore, "§e- Title: ", getUnknownLabel());
    if (isUnknownOrNa(lr_title)) {
        lr_title = getLoreValueByPrefix(lore, "§e- Titles: ", getUnknownLabel());
    }

    var lr_registryprice = getLoreValueByPrefix(lore, "§e- Price: ", getUnknownLabel());
    var lr_region = getLoreValueByPrefix(lore, "§e- Region: ", getUnknownLabel());

    var parsedMsrp = getUnknownLabel();
    if (!isUnknownOrNa(lr_msrp)) {
        var msrpDigits = String(lr_msrp).replace(/[^0-9]/g, "").trim();
        parsedMsrp = msrpDigits ? parseInt(msrpDigits, 10) : getUnknownLabel();
        parsedMsrp *= 100; // Convert to cents
    }

    var parsedRegistrationPrice = getUnknownLabel();
    if (!isUnknownOrNa(lr_registryprice)) {
        var priceDigits = String(lr_registryprice).replace(/[^0-9]/g, "").trim();
        parsedRegistrationPrice = priceDigits ? parseInt(priceDigits, 10) : getUnknownLabel();
    }

    var parsedTitles = [];
    if (!isUnknownOrNa(lr_title)) {
        var titleParts = String(lr_title).split(",");
        for (var i = 0; i < titleParts.length; i++) {
            var titleName = String(titleParts[i] || "").trim();
            if (titleName !== "") {
                parsedTitles.push(titleName);
            }
        }
    }

    return {
        vin: getUnknownLabel(),
        plate: lr_plate,
        vehicleId: getUnknownLabel(),
        vehicleSystemName: getUnknownLabel(),
        paintVariant: lr_paintVariant,
        trim: lr_trim,
        interior: lr_interior,
        msrpCents: parsedMsrp,
        registrationPriceCents: parsedRegistrationPrice,
        engineId: getUnknownLabel(),
        // engineSystemName: lr_engine,
        engineSystemName: getUnknownLabel(),
        firstRegistrant: lr_owner,
        ownershipHistory: [
            {
                owner: lr_owner,
                acquiredDate: lr_delivery,
                soldDate: getNaLabel()
            }
        ],
        titles: parsedTitles,
        insuranceClaims: [],
        history: [],
        registrationDate: lr_delivery,
        status: getUnknownLabel(),
        region: lr_region,
        metaSources: ["OG Car Papers"]
    };
}

function assembleRegistrationFrom_Vehicle(item_stack) {
    var validsystems = checkCarSystems(item_stack);
    var systems = getCarSystems(item_stack);
    var vehicleName = item_stack.getDisplayName();

    var trinTrimPaintInterior = deriveTrinTrimPaintInterior(vehicleName);

    if (validsystems.VIN) {
        var valid_vin = systems.VIN;
    } else {
        var valid_vin = getUnknownLabel();
    }

    if (validsystems.plate_gramados) {
        var valid_plate = systems.plate_gramados.plateText;
    } else {
        var valid_plate = getUnknownLabel();
    }

    if (validsystems.engine) {
        var valid_engine = systems.engine.systemName;
    } else {
        var valid_engine = getUnknownLabel();
    }

    return {
        vin: valid_vin,
        plate: valid_plate,
        vehicleId: item_stack.getName(),
        vehicleSystemName: getUnknownLabel(),
        paintVariant: trinTrimPaintInterior.paint,
        trim: trinTrimPaintInterior.trim,
        interior: trinTrimPaintInterior.interior,
        msrpCents: getUnknownLabel(),
        registrationPriceCents: getUnknownLabel(),
        engineId: getUnknownLabel(),
        engineSystemName: valid_engine,
        firstRegistrant: getUnknownLabel(),
        ownershipHistory: [],
        titles: [],
        insuranceClaims: [],
        history: [],
        registrationDate: getUnknownLabel(),
        status: getUnknownLabel(),
        region: getUnknownLabel(),
        metaSources: ["Vehicle Item NBT"]
    };
}

function mergeRegistrationData(baseRegistration, newRegistration) {
    return {
        vin: baseRegistration.vin !== getUnknownLabel() ? baseRegistration.vin : newRegistration.vin,
        plate: baseRegistration.plate !== getUnknownLabel() ? baseRegistration.plate : newRegistration.plate,
        vehicleId: baseRegistration.vehicleId !== getUnknownLabel() ? baseRegistration.vehicleId : newRegistration.vehicleId,
        vehicleSystemName: baseRegistration.vehicleSystemName !== getUnknownLabel() ? baseRegistration.vehicleSystemName : newRegistration.vehicleSystemName,
        paintVariant: baseRegistration.paintVariant !== getUnknownLabel() ? baseRegistration.paintVariant : newRegistration.paintVariant,
        trim: baseRegistration.trim !== getUnknownLabel() ? baseRegistration.trim : newRegistration.trim,
        interior: baseRegistration.interior !== getUnknownLabel() ? baseRegistration.interior : newRegistration.interior,
        msrpCents: baseRegistration.msrpCents !== getUnknownLabel() ? baseRegistration.msrpCents : newRegistration.msrpCents,
        registrationPriceCents: baseRegistration.registrationPriceCents !== getUnknownLabel() ? baseRegistration.registrationPriceCents : newRegistration.registrationPriceCents,
        engineId: baseRegistration.engineId !== getUnknownLabel() ? baseRegistration.engineId : newRegistration.engineId,
        engineSystemName: baseRegistration.engineSystemName !== getUnknownLabel() ? baseRegistration.engineSystemName : newRegistration.engineSystemName,
        firstRegistrant: baseRegistration.firstRegistrant !== getUnknownLabel() ? baseRegistration.firstRegistrant : newRegistration.firstRegistrant,
        ownershipHistory: mergeOwnershipHistories(baseRegistration.ownershipHistory, newRegistration.ownershipHistory),
        titles: mergeTitles(baseRegistration.titles, newRegistration.titles),
        insuranceClaims: mergeInsuranceClaims(baseRegistration.insuranceClaims, newRegistration.insuranceClaims),
        history: mergeHistory(baseRegistration.history, newRegistration.history),
        registrationDate: baseRegistration.registrationDate || newRegistration.registrationDate || getUnknownLabel(),
        status: mergeStatus(baseRegistration.status, newRegistration.status),
        region: mergeRegion(baseRegistration.region, newRegistration.region),
        metaSources: mergeMetaSources(baseRegistration.metaSources, newRegistration.metaSources)
    };
}

function mergeMetaSources(sources1, sources2) {
    var merged = sources1.slice();
    for (var i = 0; i < sources2.length; i++) {
        if (merged.indexOf(sources2[i]) === -1) {
            merged.push(sources2[i]);
        }
    }
    return merged;
}

function mergeRegion(region1, region2) {
    if (region1 !== getUnknownLabel()) {
        return region1;
    }
    return region2;
}

function mergeStatus(status1, status2) {
    if (status1 !== getUnknownLabel()) {
        return status1;
    }
    return status2;
}

function mergeHistory(history1, history2) {
    var merged = history1.slice();
    for (var i = 0; i < history2.length; i++) {
        if (merged.indexOf(history2[i]) === -1) {
            merged.push(history2[i]);
        }
    }
    return merged;
}

function mergeInsuranceClaims(claims1, claims2) {
    var merged = claims1.slice();
    for (var i = 0; i < claims2.length; i++) {
        if (merged.indexOf(claims2[i]) === -1) {
            merged.push(claims2[i]);
        }
    }
    return merged;
}

function mergeTitles(titles1, titles2) {
    var merged = titles1.slice();
    for (var i = 0; i < titles2.length; i++) {
        if (merged.indexOf(titles2[i]) === -1) {
            merged.push(titles2[i]);
        }
    }
    return merged;
}

function mergeOwnershipHistories(history1, history2) {
    var merged = history1.slice();
    for (var i = 0; i < history2.length; i++) {
        var entry = history2[i];
        var exists = false;
        for (var j = 0; j < merged.length; j++) {
            if (merged[j].owner === entry.owner && merged[j].acquiredDate === entry.acquiredDate) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            merged.push(entry);
        }
    }
    return merged;
}

function updateRegistration(registration) {
    var licensed = loadLicensedVehicles();
    licensed[registration.plate] = registration;
    saveLicensedVehicles(licensed);
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
        "§a- Paint: " + registration.paintVariant,
        "§a- Interior: " + registration.interior,
        "§a- Engine: " + registration.engineSystemName,
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

function registerPlate(registration) {
    var plate = registration.plate;
    if (isUnknownOrNa(plate)) {
        return false;
    }
    var licensed = loadLicensedVehicles();

    licensed[plate] = registration;
    saveJson(licensed, VEHICLE_LICENSED_DATA_PATH);
    return true;
}

function getMostRecentPlate() {
    var licensed = loadLicensedVehicles();
    var length = Object.keys(licensed).length;
    return licensed[Object.keys(licensed)[length - 1]];
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

function checkCarSystems(ItemStackSource) {
    var checkedSystems = {
        "plate_gramados": false,
        "VIN": false,
        "engine": false
    }

    var ItemStack = ItemStackSource.copy(); // Work with a copy to avoid modifying original NBT

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

function getCarSystems(ItemStackSource) {
    var checkedSystems = {
        "plate_gramados": null,
        "VIN": null,
        "engine": null
    }

    var ItemStack = ItemStackSource.copy(); // Work with a copy to avoid modifying original NBT

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
                plateText: partNbt.getString("plateText") || partNbt.getString("textLicense Plate")
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

function isItem_CarPaperOG(ItemStack) {
    var lore = ItemStack.getLore();
    if (!lore || lore.length < 2) {
        return false;
    }
    return lore[1] == "§aConfiguration:" && ItemStack.getDisplayName() == "§6Car Papers"
}

// Setters

function setVehicleLicensePlate(ItemStack, plateText) {
    var rawNbt = ItemStack.getNbt();
    var allKeys = rawNbt.getKeys();
    var atleastone = false;
    for (var i = 0; i < allKeys.length; i++) {
        var key = allKeys[i];
        if (key.startsWith("part_")) {
            var partNbt = rawNbt.getCompound(key);
            if (isCarPartNBT_Plate(partNbt)) {
                partNbt.setString("textLicense Plate", plateText);
                partNbt.setString("systemName", "plate_gramados");
                atleastone = true;
            }
        }
    }
    return atleastone;
}



function _stripMinecraftSectionColors(text) {
    // Removes vanilla Minecraft formatting codes (e.g. "§a", "§l")
    return String(text || "").replace(/§[0-9A-FK-ORa-fk-or]/g, "");
}

function _toTitleCaseWords(text) {
    var cleaned = String(text || "").trim().replace(/\s+/g, " ");
    if (!cleaned) {
        return "";
    }
    var parts = cleaned.split(" ");
    for (var i = 0; i < parts.length; i++) {
        var w = parts[i];
        if (!w) {
            continue;
        }
        parts[i] = w.substr(0, 1).toUpperCase() + w.substr(1).toLowerCase();
    }
    return parts.join(" ");
}

function deriveTrinTrimPaintInterior(carModelText) {
    var raw = _stripMinecraftSectionColors(carModelText);
    var idx = raw.indexOf("-");
    if (idx === -1) {
        return { trim: getNaLabel(), paint: getNaLabel(), interior: getNaLabel() };
    }

    var before = raw.substr(0, idx).trim();
    var after = raw.substr(idx + 1).trim();

    var trim = getNaLabel();
    var trimTokens = ["Root", "Comfort", "Substantial", "TQ1", "TQ2", "TQ3"];
    for (var i = 0; i < trimTokens.length; i++) {
        var token = trimTokens[i];
        var re = new RegExp("\\b" + token + "\\b", "i");
        if (re.test(before)) {
            trim = _toTitleCaseWords(token);
            break;
        }
    }

    var paint = getNaLabel();
    var interior = getNaLabel();
    if (after) {
        var parts = after.split(",");
        if (parts.length >= 1 && parts[0].trim() !== "") {
            paint = _toTitleCaseWords(parts[0].trim());
        }
        if (parts.length >= 2 && parts[1].trim() !== "") {
            interior = _toTitleCaseWords(parts[1].trim());
        }
    }

    return { trim: trim, paint: paint, interior: interior };
}