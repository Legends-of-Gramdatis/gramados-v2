load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles_licensing.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");

var API = Java.type("noppes.npcs.api.NpcAPI").Instance();

function interact(event) {
    var player = event.player;
    var heldItem = player.getMainhandItem();

    if (!heldItem || heldItem.isEmpty()) {
        tellPlayer(player, "&f:cross_mark: Please hold a vehicle item in your hand.");
        return;
    }

    if (!heldItem.hasNbt()) {
        tellPlayer(player, "&4:cross_mark: This item contains no data.");
        return;
    }
    var rawNbt = heldItem.getNbt();
    

    // Convert to JSON and clean it up
    var jsonStr = rawNbt.toJsonString();
    jsonStr = jsonStr.replace(/\b(\d+)[bBsSlLfFdD]\b/g, function(match, p1, offset, string) {
        // Ensure the match is not surrounded by quotes
        var before = string[offset - 1];
        var after = string[offset + match.length];
        if (before !== '"' && after !== '"') {
            return p1;
        }
        return match;
    });
    var json = JSON.parse(jsonStr);

    // Check if player is allowed to register vehicles
    var offhandItem = player.getOffhandItem();
    var hasSeagullCard = offhandItem && !offhandItem.isEmpty() && offhandItem.getName() === "mts:ivv.idcard_seagull";

    if (hasSeagullCard) {
        tellPlayer(player, "&a:check_mark: Admin override: You are allowed to register vehicles.");
    } else if (playerHasJobWithTag(player, "Mechanic")) {
        tellPlayer(player, "&a:check_mark: You are allowed to register vehicles.");
    } else {
        tellPlayer(player, "&c:cross_mark: You are not allowed to register vehicles. Please contact a mechanic.");
        return;
    }

    // ============ Extract Plate ============ //
    var plate = null;
    var keys = getJsonKeys(json);

    // if no "electricPower" key, assume it's not a vehicle
    if (!includes(keys, "electricPower")) {
        tellPlayer(player, "&c:cross_mark: This item is not a vehicle.");
        return;
    }

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.startsWith("part_")) {
            var part = json[key];
            if (part.systemName && part.systemName === "plate_gramados") {
                // Handle both textLine0 and "textLicense Plate" field names
                plate = part.textLine0 || part["textLicense Plate"] || null;
                break;
            }
        }
    }

    if (!plate) {
        tellPlayer(player, "&c:cross_mark: No license plate found on the vehicle.");
        return;
    }

    if (!/^[A-Za-z]{3}-\d{4}$/.test(plate)) {
        tellPlayer(player, "&e:danger: Custom plate format. An extra fee of 1000 grons will be charged for custom plates.");
    }

    if (plate.length > 8) {
        tellPlayer(player, "&c:cross_mark: The license plate is invalid as it exceeds 8 characters.");
        return;
    }

    // ============ Extract Vehicle Damage ============ //
    var vehicleDamage = json.damage || 0;

    // ============ Check Key UUID ============ //
    var keyUUID = json.keyUUID || null;
    if (keyUUID) {
        tellPlayer(player, "&a:check_mark: Vehicle has a valid VIN number.");
    } else {
        tellPlayer(player, "&e:danger: Vehicle has no VIN number. This will require additional paperwork.");
    }

    // ============ Locate Engine ============ //
    var engine = null;
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.startsWith("part_")) {
            var part = json[key];
            if (part.systemName && part.systemName.startsWith("engine_")) {
                engine = part;
                break;
            }
        }
    }

    if (!engine) {
        tellPlayer(player, "&c:cross_mark: No engine found in this vehicle.");
        return;
    }

    var engineHours = engine.hours || null;
    var engineDamage = engine.damage || 0;

    // ============ Identify Vehicle in Catalog ============ //
    // Get the item's registry name (e.g., mts:iv_tcp_v3_civil.trin_footpather_phase2_sage_g)
    var itemID = heldItem.getName();
    
    // Extract the main vehicle ID (without paint variant)
    var mainVehicleId = getMainVehicleId(itemID);
    var paintVariant = getPaintVariant(itemID);
    var vehicleInfo = null;
    
    if (mainVehicleId) {
        vehicleInfo = getVehicleInfo(mainVehicleId);
    }
    
    if (!vehicleInfo) {
        tellPlayer(player, "&c:cross_mark: This vehicle model is not in our database.");
        logToFile("dev", "[vehicle_registration] Unknown vehicle: " + mainVehicleId);
        return;
    }

    // Check if the vehicle is already licensed
    // Vehicles can ONLY be registered if they have the default plate
    if (plate !== vehicleInfo.defaultPlateFormat) {
        // Track vehicles that are in the wild but not in our registry
        if (!isPlateLicensed(plate)) {
            var licensedVehicles = loadLicensedVehicles() || {};
            var today = new Date();
            var dateStr = today.getFullYear() + "-" + padLeft(today.getMonth() + 1, 2, "0") + "-" + padLeft(today.getDate(), 2, "0");
            licensedVehicles[plate] = {
                vin: keyUUID || "unknown",
                vehicleId: mainVehicleId,
                paintVariant: paintVariant || "",
                ownershipHistory: [],
                titles: [],
                insuranceClaims: [],
                registrationDate: dateStr,
                status: "unlicensed"
            };
            saveLicensedVehicles(licensedVehicles);
            logToFile("automobile", "[UNLICENSED] Added unregistered vehicle with plate: " + plate + " (VIN: " + (keyUUID || "unknown") + ")");
        }
        tellPlayer(player, "&c:cross_mark: This vehicle is already licensed and cannot be re-registered.");
        tellPlayer(player, "&cCurrent plate: &f" + plate);
        tellPlayer(player, "&cDefault plate format: &f" + vehicleInfo.defaultPlateFormat);
        logToFile("automobile", player.getName() + " attempted to re-license vehicle with plate: " + plate);
        return;
    }

    // Validate damage against catalog maxHealth
    if (vehicleDamage >= vehicleInfo.maxHealth) {
        tellPlayer(player, "&c:recycle: This vehicle is totaled and must be functional before registration.");
        return;
    }

    // ============ Check for VIN Fraud ============ //
    // If a VIN already exists in the system, this is fraud
    if (keyUUID) {
        var vinMatch = getRegistrationByVin(keyUUID);
        if (vinMatch) {
            tellPlayer(player, "&4:warning: VIN Fraud Detected!");
            tellPlayer(player, "&4This VIN is already registered to plate: &f" + vinMatch.plate);
            if (vinMatch.entry && vinMatch.entry.ownershipHistory && vinMatch.entry.ownershipHistory.length > 0) {
                var lastOwner = vinMatch.entry.ownershipHistory[vinMatch.entry.ownershipHistory.length - 1].owner;
                tellPlayer(player, "&4Owner: &f" + lastOwner);
            }
            logToFile("automobile", "[FRAUD ALERT] " + player.getName() + " attempted to register vehicle with duplicate VIN: " + keyUUID + " (existing plate: " + vinMatch.plate + ")");
            return;
        }
    }

    // ============ Register Vehicle ============ //
    var registrationResult = registerVehicle(mainVehicleId, keyUUID, player.getName(), paintVariant);
    
    if (!registrationResult.success) {
        tellPlayer(player, "&c:cross_mark: Registration failed: " + registrationResult.message);
        logToFile("automobile", "Registration failed for " + player.getName() + ": " + registrationResult.message);
        return;
    }

    var newPlate = registrationResult.plate;

    // ============ Update License Plates on Vehicle ============ //
    // Replace all license plates with Gramados plate and update text
    var platesUpdated = 0;
    var keys = getJsonKeys(json);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.startsWith("part_")) {
            var part = json[key];
            // Check if this is any kind of license plate part
            if (part.systemName && (includes(part.systemName, "plate") || includes(part.systemName, "licenseplate"))) {
                // Update to Gramados plate system
                part.systemName = "plate_gramados";
                // Update the text field (handle both textLine0 and textLicense Plate)
                if (part.textLine0 !== undefined) {
                    part.textLine0 = newPlate;
                }
                if (part["textLicense Plate"] !== undefined) {
                    part["textLicense Plate"] = newPlate;
                }
                platesUpdated++;
            }
        }
    }

    // Convert JSON back to NBT and update the item
    if (platesUpdated > 0) {
        var nbtData = heldItem.getNbt();
        
        // Update all modified vehicle parts in NBT
        var keys = getJsonKeys(json);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key.startsWith("part_")) {
                var part = json[key];
                // Check if this is a license plate part we modified
                if (part.systemName && (includes(part.systemName, "plate") || includes(part.systemName, "licenseplate"))) {
                    // Get the compound for this part from NBT
                    var partCompound = nbtData.getCompound(key);
                    
                    // Update systemName
                    partCompound.setString("systemName", "plate_gramados");
                    
                    // Update text fields
                    if (part.textLine0 !== undefined) {
                        partCompound.setString("textLine0", newPlate);
                    }
                    if (part["textLicense Plate"] !== undefined) {
                        partCompound.setString("textLicense Plate", newPlate);
                    }
                }
            }
        }
        
        // Replace the player's mainhand item with updated NBT
        player.setMainhandItem(heldItem);
    }
    tellPlayer(player, "&a:check_mark: Vehicle is eligible for registration:");
    tellPlayer(player, "&aPlate: &f" + plate);
    tellPlayer(player, "&aVehicle Damage: &f" + vehicleDamage + "/" + vehicleInfo.maxHealth);
    tellPlayer(player, "&aEngine Found: &f" + engine.systemName);
    tellPlayer(player, "&aEngine Damage: &f" + engineDamage);
    tellPlayer(player, "&aEngine Hours: &f" + (engineHours !== null ? engineHours : "N/A"));
    tellPlayer(player, "&aVehicle VIN: &f" + (keyUUID || "N/A"));
    tellPlayer(player, "&a&lRegistration Successful!");
    tellPlayer(player, "&aNew License Plate: &f" + newPlate);
    tellPlayer(player, "&aVehicle Model: &f" + vehicleInfo.name + " (" + vehicleInfo.brand + ")");
    if (platesUpdated > 0) {
        tellPlayer(player, "&aLicense Plate(s) Updated: &f" + platesUpdated);
    }
    
    logToFile("automobile", player.getName() + " registered vehicle: " + mainVehicleId + " with plate: " + newPlate + " (" + platesUpdated + " plates updated)");
}
