// Vehicle utilities for registration and management
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");

/**
 * Pad a string to a specified length (Nashorn-compatible alternative to padStart)
 */
function padLeft(str, length, char) {
    char = char || "0";
    var result = str.toString();
    while (result.length < length) {
        result = char + result;
    }
    return result;
}

/**
 * Load the vehicle catalog database
 */
function loadVehicleCatalog() {
    return loadJson("world/customnpcs/scripts/data/vehicle_catalog.json");
}

/**
 * Load the dynamic licensed vehicles database
 */
function loadLicensedVehicles() {
    var file = "world/customnpcs/scripts/data_auto/licensed_vehicles.json";
    try {
        return loadJson(file);
    } catch (e) {
        // Return empty object if file doesn't exist
        return {};
    }
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
    
    // Try to find by removing variants
    var keys = getJsonKeys(catalog.vehicles);
    for (var i = 0; i < keys.length; i++) {
        var mainId = keys[i];
        var vehicle = catalog.vehicles[mainId];
        var variants = vehicle.paintVariants || [];
        
        // Check if fullItemId matches mainId + any variant
        for (var j = 0; j < variants.length; j++) {
            if (fullItemId === mainId + variants[j]) {
                return mainId;
            }
        }
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
    var vehicleInfo = getVehicleInfo(mainVehicleId);
    if (!vehicleInfo) {
        return false;
    }
    return plate === vehicleInfo.defaultPlateFormat;
}

/**
 * Generate a random license plate for a vehicle
 */
function generateRandomPlate(mainVehicleId) {
    var vehicleInfo = getVehicleInfo(mainVehicleId);
    if (!vehicleInfo) {
        return null;
    }
    
    var format = vehicleInfo.defaultPlateFormat;
    var brand = vehicleInfo.brand;
    var catalogData = loadVehicleCatalog();
    var plateFormat = catalogData.platePrefixes[brand];
    
    if (!plateFormat) {
        return null;
    }
    
    var formatStr = plateFormat.format;
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
    if (!vehicleInfo) {
        return { success: false, message: "Vehicle not found in catalog" };
    }
    
    // Generate a unique plate
    var licensedVehicles = loadLicensedVehicles();
    var plate;
    var attempts = 0;
    var maxAttempts = 100;
    
    do {
        plate = generateRandomPlate(mainVehicleId);
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
        titles: vehicleInfo.extraTitles ? vehicleInfo.extraTitles.slice() : [],
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
