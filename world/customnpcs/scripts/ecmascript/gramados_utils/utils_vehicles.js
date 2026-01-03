// Vehicle utilities for registration and management
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");

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
 * Get the main vehicle ID (without paint variant)
 * e.g., "mts:iv_tcp_v3_civil.trin_footpather_phase2_sage_g" -> "mts:iv_tcp_v3_civil.trin_footpather_phase2"
 */
function getMainVehicleId(fullItemId) {
    var catalog = loadVehicleCatalog();
    
    // Check if it's already a main ID
    if (catalog.vehicles[fullItemId]) {
        return fullItemId;
    }

    // Otherwise, match by prefix (e.g. mainId + "_sage_g")
    var keys = getJsonKeys(catalog.vehicles);
    var bestMatch = null;
    for (var i = 0; i < keys.length; i++) {
        var mainId = keys[i];
        if (fullItemId.indexOf(mainId) === 0) {
            if (fullItemId.length === mainId.length || fullItemId.charAt(mainId.length) === "_") {
                if (bestMatch === null || mainId.length > bestMatch.length) {
                    bestMatch = mainId;
                }
            }
        }
    }

    if (bestMatch !== null) {
        return bestMatch;
    }
    
    return null;
}

/**
 * Get the paint variant from a full item ID
 * e.g., "mts:iv_tcp_v3_civil.trin_footpather_phase2_sage_g" -> "_sage_g"
 */
function getPaintVariant(fullItemId) {
    var mainId = getMainVehicleId(fullItemId);
    if (mainId && fullItemId !== mainId) {
        return fullItemId.substring(mainId.length);
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
 * Check if a license plate is the default one for a vehicle
 */
function isDefaultPlate(plate, mainVehicleId) {
    // Deprecated: plate defaults are determined by the license plate part systemName.
    return false;
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
 * Returns: { success: boolean, plate: string, message: string }
 */
function registerVehicle(mainVehicleId, vin, ownerName, paintVariant) {
    var vehicleInfo = getVehicleInfo(mainVehicleId);
    
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
    var today = new Date();
    var dateStr = today.getFullYear() + "-" + 
                  padLeft(today.getMonth() + 1, 2, "0") + "-" + 
                  padLeft(today.getDate(), 2, "0");
    
    licensedVehicles[plate] = {
        vin: vin,
        vehicleId: mainVehicleId,
        paintVariant: paintVariant || "",
        ownershipHistory: [
            {
                owner: ownerName,
                acquiredDate: dateStr,
                soldDate: null
            }
        ],
        titles: (vehicleInfo && vehicleInfo.extraTitles) ? vehicleInfo.extraTitles.slice() : [],
        insuranceClaims: [],
        registrationDate: dateStr,
        status: "active"
    };
    
    saveLicensedVehicles(licensedVehicles);
    
    return { success: true, plate: plate, message: "Vehicle registered successfully" };
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
    
    var today = new Date();
    var dateStr = today.getFullYear() + "-" + 
                  padLeft(today.getMonth() + 1, 2, "0") + "-" + 
                  padLeft(today.getDate(), 2, "0");
    
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
    
    var today = new Date();
    var dateStr = today.getFullYear() + "-" + 
                  padLeft(today.getMonth() + 1, 2, "0") + "-" + 
                  padLeft(today.getDate(), 2, "0");
    
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
