// Vehicle utilities for registration and management
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js");

/**
 * Load the vehicle catalog database
 */
function loadVehicleCatalog() {
    return loadJson("world/customnpcs/scripts/data/vehicle_catalog.json");
}

/**
 * Get the plate system config by systemName
 */
function getPlateSystemConfig(systemName) {
    var catalog = loadVehicleCatalog();
    return catalog.plateSystems[systemName];
}

/**
 * Load the dynamic licensed vehicles database
 */
function loadLicensedVehicles() {
    var file = "world/customnpcs/scripts/data_auto/licensed_vehicles.json";
    if (!checkFileExists(file)) {
        createJsonFile(file);
    }
    return loadJson(file);
}

/**
 * Save the dynamic licensed vehicles database
 */
function saveLicensedVehicles(data) {
    saveJson(data, "world/customnpcs/scripts/data_auto/licensed_vehicles.json");
}

/**
 * Get the MTS systemName from a full item id.
 * e.g., "mts:iv_tcp_v3_civil.trin_footpather_phase2_sage_g" -> "trin_footpather_phase2_sage_g"
 */
function getVehicleSystemNameFromItemId(fullItemId) {
    var id = String(fullItemId || "").trim();
    if (!id) {
        return null;
    }
    var idx = id.lastIndexOf(".");
    if (idx < 0 || idx === id.length - 1) {
        return null;
    }
    return id.substring(idx + 1);
}

/**
 * Get the base vehicle systemName (without paint variant), using the vehicle catalog.
 * e.g., "mts:iv_tcp_v3_civil.trin_footpather_phase2_sage_g" -> "trin_footpather_phase2"
 */
function getMainVehicleId(fullItemId) {
    var systemName = getVehicleSystemNameFromItemId(fullItemId);
    if (!systemName) {
        return null;
    }

    var catalog = loadVehicleCatalog();
    if (catalog.vehicles[systemName]) {
        return systemName;
    }

    // Otherwise, match by prefix (e.g. mainSystemName + "_sage_g")
    var keys = getJsonKeys(catalog.vehicles);
    var bestMatch = null;
    for (var i = 0; i < keys.length; i++) {
        var baseSystemName = keys[i];
        if (systemName.indexOf(baseSystemName) === 0) {
            if (systemName.length === baseSystemName.length || systemName.charAt(baseSystemName.length) === "_") {
                if (bestMatch === null || baseSystemName.length > bestMatch.length) {
                    bestMatch = baseSystemName;
                }
            }
        }
    }

    return bestMatch;
}

/**
 * Get the paint variant from a full item ID
 * e.g., "mts:iv_tcp_v3_civil.trin_footpather_phase2_sage_g" -> "_sage_g"
 */
function getPaintVariant(fullItemId) {
    var baseSystemName = getMainVehicleId(fullItemId);
    var systemName = getVehicleSystemNameFromItemId(fullItemId);
    if (baseSystemName && systemName && systemName !== baseSystemName) {
        return systemName.substring(baseSystemName.length);
    }
    return "";
}

/**
 * Get vehicle info from the catalog
 */
function getVehicleInfo(mainVehicleId) {
    var catalog = loadVehicleCatalog();
    return catalog.vehicles[mainVehicleId] || null;
}

/**
 * Generate a random license plate for a vehicle
 */
function generateRandomPlate(systemName) {
    var plateSystem = getPlateSystemConfig(systemName);
    var formatStr = plateSystem.format;
    var plate = "";
    
    for (var i = 0; i < formatStr.length; i++) {
        var char = formatStr[i];
        if (char === 'X') {
            // Random uppercase letter
            plate += String.fromCharCode(65 + Math.floor(Math.random() * 26));
        } else if (char === 'N') {
            // Random letter (case-insensitive, we'll uppercase)
            plate += String.fromCharCode(65 + Math.floor(Math.random() * 26));
        } else if (char === '0') {
            // Random digit
            plate += Math.floor(Math.random() * 10);
        } else {
            // Keep the character as-is (e.g., dash)
            plate += char;
        }
    }
    
    return plate;
}

/**
 * Register a vehicle with a new license plate
 *
 * `vehicleMeta` may be either:
 * - a string (legacy): stored as `paintVariant`
 * - an object: { paintVariant, trim, interior, msrpCents, engineId, engineSystemName }
 *
 * NOTE: `paintVariant` is now the human-readable paint value (same as the “Paint” line on Car Papers).
 * NOTE: `engineId` is the engine item id: `mts:<packID>.<systemName>`.
 * Returns: { success: boolean, plate: string, message: string }
 */
function registerVehicle(vehicleId, vehicleSystemName, vin, ownerName, vehicleMeta) {
    var vehicleInfo = getVehicleInfo(vehicleSystemName);

    var meta = {};
    if (vehicleMeta && typeof vehicleMeta === "object") {
        meta = vehicleMeta;
    } else {
        meta.paintVariant = vehicleMeta || "";
    }
    
    // Generate a unique plate
    var licensedVehicles = loadLicensedVehicles();
    var plate;
    var attempts = 0;
    var maxAttempts = 100;
    
    do {
        plate = generateRandomPlate("plate_gramados");
        attempts++;
    } while (licensedVehicles[plate] && attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
        return { success: false, message: "Could not generate unique license plate" };
    }
    
    // Create registration record
    var dateStr = dateToYYYYMMDD();

    licensedVehicles[plate] = {
        vin: vin,
        vehicleId: String(vehicleId),
        vehicleSystemName: (vehicleSystemName !== undefined && vehicleSystemName !== null) ? String(vehicleSystemName) : "Unknown",
        // Human-readable paint value (papers “Paint”)
        paintVariant: (meta.paintVariant !== undefined && meta.paintVariant !== null) ? String(meta.paintVariant) : "",
        trim: (meta.trim !== undefined && meta.trim !== null) ? String(meta.trim) : "N/A",
        interior: (meta.interior !== undefined && meta.interior !== null) ? String(meta.interior) : "N/A",
        msrpCents: (meta.msrpCents !== undefined) ? meta.msrpCents : null,
        engineId: (meta.engineId !== undefined && meta.engineId !== null) ? String(meta.engineId) : "Unknown",
        engineSystemName: (meta.engineSystemName !== undefined && meta.engineSystemName !== null) ? String(meta.engineSystemName) : "Unknown",
        ownershipHistory: [
            {
                owner: ownerName,
                acquiredDate: dateStr,
                soldDate: null
            }
        ],
        titles: (vehicleInfo && vehicleInfo.extraTitles) ? vehicleInfo.extraTitles.slice() : [],
        insuranceClaims: [],
        history: [],
        registrationDate: dateStr,
        status: "active"
    };
    
    saveLicensedVehicles(licensedVehicles);
    
    return { success: true, plate: plate, message: "Vehicle registered successfully" };
}

function generateRandomWWPlate() {

    var plate = "WW-";
    
    do {
        plate += padLeft(Math.floor(Math.random() * 100000), 5, "0");
    } while (!isPlateAvailable(plate));
    
    return plate;

}

function registerVehicleAsWW(vehicleId, ownerName, player) {
    var vehicleInfo = getVehicleInfo(vehicleId);
    var plate = generateRandomWWPlate();
    var licensedVehicles = loadLicensedVehicles();

    tellPlayer(player, "&e[Vehicle Registration] Generated WW plate: " + plate);

    var dateStr = dateToYYYYMMDD();

    licensedVehicles[plate] = {
        asWW: true,
        WWplate: plate,
        vin: "N/A",
        vehicleId: String(vehicleId),
        vehicleSystemName: vehicleId,
        paintVariant: "",
        trim: "N/A",
        interior: "N/A",
        msrpCents: null,
        engineId: "Unknown",
        engineSystemName: "Unknown",
        ownershipHistory: [
            {
                owner: ownerName,
                acquiredDate: dateStr,
                soldDate: null
            }
        ],
        titles: (vehicleInfo && vehicleInfo.extraTitles) ? vehicleInfo.extraTitles.slice() : [],
        insuranceClaims: [],
        history: [],
        registrationDate: dateStr,
        status: "WW"
    };
    
    saveLicensedVehicles(licensedVehicles);
    
    return { success: true, plate: plate, message: "Vehicle registered successfully as WW" };
}

/**
 * Get vehicle registration by license plate
 */
function getVehicleRegistration(plate) {
    var licensedVehicles = loadLicensedVehicles();
    return licensedVehicles[plate] || null;
}

/**
 * Add an insurance claim to a vehicle
 */
function addInsuranceClaim(plate, description, amount) {
    var licensedVehicles = loadLicensedVehicles();
    var vehicle = licensedVehicles[plate];
    
    if (!vehicle) {
        return false;
    }
    
    var dateStr = dateToYYYYMMDD();
    
    var claimId = "claim_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    
    vehicle.insuranceClaims.push({
        claimId: claimId,
        date: dateStr,
        description: description,
        amount: amount
    });
    
    saveLicensedVehicles(licensedVehicles);
    return true;
}

/**
 * Transfer vehicle ownership
 */
function transferOwnership(plate, newOwner) {
    var licensedVehicles = loadLicensedVehicles();
    var vehicle = licensedVehicles[plate];
    
    if (!vehicle) {
        return false;
    }
    
    var dateStr = dateToYYYYMMDD();
    
    // Mark previous owner as sold
    if (vehicle.ownershipHistory.length > 0) {
        var lastIdx = vehicle.ownershipHistory.length - 1;
        vehicle.ownershipHistory[lastIdx].soldDate = dateStr;
    }
    
    // Add new owner
    vehicle.ownershipHistory.push({
        owner: newOwner,
        acquiredDate: dateStr,
        soldDate: null
    });
    
    saveLicensedVehicles(licensedVehicles);
    return true;
}

/**
 * Add a title to a vehicle (import, demilitarized, collection, etc.)
 */
function addVehicleTitle(plate, title) {
    var licensedVehicles = loadLicensedVehicles();
    var vehicle = licensedVehicles[plate];
    
    if (!vehicle) {
        return false;
    }
    
    if (!includes(vehicle.titles, title)) {
        vehicle.titles.push(title);
    }
    
    saveLicensedVehicles(licensedVehicles);
    return true;
}

/**
 * Get current owner of a vehicle
 */
function getCurrentOwner(plate) {
    var vehicle = getVehicleRegistration(plate);
    if (!vehicle || vehicle.ownershipHistory.length === 0) {
        return null;
    }
    
    // Return the last owner with no soldDate
    var history = vehicle.ownershipHistory;
    for (var i = history.length - 1; i >= 0; i--) {
        if (history[i].soldDate === null) {
            return history[i].owner;
        }
    }
    
    return null;
}

/**
 * Check if a plate is available (not yet registered)
 */
function isPlateAvailable(plate) {
    var licensedVehicles = loadLicensedVehicles();
    return !licensedVehicles[plate];
}
