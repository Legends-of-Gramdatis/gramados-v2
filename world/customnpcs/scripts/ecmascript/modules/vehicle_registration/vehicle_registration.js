load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles_licensing.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");

var API = Java.type("noppes.npcs.api.NpcAPI").Instance();

var VEHICLE_REGISTRATION_CONFIG = loadJson("world/customnpcs/scripts/ecmascript/modules/vehicle_registration/config.json");

var CAR_PAPERS_ITEM_ID = "variedcommodities:letter";

var NPC_REGION_KEY = "vehicle_registration_region";
var NON_STANDARD_PLATE_FEE_CENTS = 1000 * 100;

function getSortedRegionNames() {
    return Object.keys(VEHICLE_REGISTRATION_CONFIG.regions).sort();
}

function getNpcRegion(npc) {
    var sd = npc.getStoreddata();
    var region = sd.get(NPC_REGION_KEY);
    if (!region || region === "") {
        var regions = getSortedRegionNames();
        region = regions[0];
        sd.put(NPC_REGION_KEY, region);
    }
    return region;
}

function cycleNpcRegion(npc) {
    var regions = getSortedRegionNames();
    var current = getNpcRegion(npc);
    var idx = regions.indexOf(current);
    var next = regions[(idx + 1) % regions.length];
    npc.getStoreddata().put(NPC_REGION_KEY, next);
    return next;
}

function formatDateDDMMYYYY(dateObj) {
    var day = padLeft(dateObj.getDate(), 2, "0");
    var month = padLeft(dateObj.getMonth() + 1, 2, "0");
    var year = dateObj.getFullYear();
    return day + "/" + month + "/" + year;
}

function formatDateYYYYMMDDToDDMMYYYY(dateStr) {
    if (!dateStr) {
        return null;
    }
    var m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dateStr);
    if (!m) {
        return null;
    }
    return m[3] + "/" + m[2] + "/" + m[1];
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

    return Math.round(price);
}

function stripMinecraftSectionColors(text) {
    // Removes vanilla Minecraft formatting codes (e.g. "§a", "§l")
    return String(text || "").replace(/§[0-9A-FK-ORa-fk-or]/g, "");
}

function toTitleCaseWords(text) {
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
    var raw = stripMinecraftSectionColors(carModelText);
    var idx = raw.indexOf("-");
    if (idx === -1) {
        return { trim: "N/A", paint: "N/A", interior: "N/A" };
    }

    var before = raw.substr(0, idx).trim();
    var after = raw.substr(idx + 1).trim();

    var trim = "N/A";
    var trimTokens = ["Root", "Comfort", "Substantial", "TQ1", "TQ2", "TQ3"];
    for (var i = 0; i < trimTokens.length; i++) {
        var token = trimTokens[i];
        var re = new RegExp("\\b" + token + "\\b", "i");
        if (re.test(before)) {
            trim = toTitleCaseWords(token);
            break;
        }
    }

    var paint = "N/A";
    var interior = "N/A";
    if (after) {
        var parts = after.split(",");
        if (parts.length >= 1 && parts[0].trim() !== "") {
            paint = toTitleCaseWords(parts[0].trim());
        }
        if (parts.length >= 2 && parts[1].trim() !== "") {
            interior = toTitleCaseWords(parts[1].trim());
        }
    }

    return { trim: trim, paint: paint, interior: interior };
}

function isTrinByCatalogOrDisplay(vehicleInfo, carModelText) {
    if (vehicleInfo && vehicleInfo.brand && String(vehicleInfo.brand).toLowerCase() === "trin") {
        return true;
    }
    var raw = stripMinecraftSectionColors(carModelText);
    return raw.toLowerCase().indexOf("trin ") === 0;
}

function createCarPapersItem(worldObj, paperData) {
    var papers = worldObj.createItem(CAR_PAPERS_ITEM_ID, 0, 1);
    papers.setCustomName(ccs("&6Car Papers"));

    var lore = [
        "&b" + paperData.carModel,
        "&aConfiguration:",
        "&a- Trim: " + paperData.trim,
        "&a- Paint: " + paperData.paint,
        "&a- Interior: " + paperData.interior,
        "&a- Engine: " + paperData.engine,
        "&5Information:",
        "&5- First Owner: " + paperData.firstOwner,
        "&5- Delivery: " + paperData.delivery,
        "&5- Plate: " + paperData.plate,
        "&5- MSRP: " + (paperData.msrpCents !== null ? getAmountCoin(paperData.msrpCents) : "N/A"),
        "&eRegistry:",
        "&e- Title: " + paperData.title,
        "&e- Price: " + (paperData.priceCents !== null ? getAmountCoin(paperData.priceCents) : "N/A"),
        "&e- Region: " + paperData.region
    ];

    for (var i = 0; i < lore.length; i++) {
        lore[i] = ccs(lore[i]);
    }

    papers.setLore(lore);
    return papers;
}

function interact(event) {
    var player = event.player;
    var npc = event.npc;
    var heldItem = player.getMainhandItem();

    var offhandItem = player.getOffhandItem();
    var hasSeagullCard = offhandItem && !offhandItem.isEmpty() && offhandItem.getName() === "mts:ivv.idcard_seagull";

    // Admin: cycle this NPC's linked registration region
    if (hasSeagullCard && heldItem && !heldItem.isEmpty() && heldItem.getName() === "minecraft:command_block") {
        var newRegion = cycleNpcRegion(npc);
        tellPlayer(player, "&a:check_mark: Vehicle registration region set to: &f" + newRegion);
        return;
    }

    if (!heldItem || heldItem.isEmpty()) {
        tellPlayer(player, "&f:cross_mark: Please hold a vehicle item in your hand.");
        return;
    }

    if (!heldItem.hasNbt()) {
        tellPlayer(player, "&4:cross_mark: This item contains no data.");
        return;
    }
    var rawNbt = heldItem.getNbt();
    

    // Convert to JSON
    var json = JSON.parse(sanitizeJavaJson(rawNbt.toJsonString()));

    // Check if player is allowed to register vehicles

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
    var plateSystemName = null;
    var keys = getJsonKeys(json);

    // if no "electricPower" key, assume it's not a vehicle
    if (!includes(keys, "electricPower")) {
        tellPlayer(player, "&c:cross_mark: This item is not a vehicle.");
        return;
    }

    var catalog = loadVehicleCatalog();
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.startsWith("part_")) {
            var part = json[key];
            if (part.systemName && catalog.plateSystems[part.systemName]) {
                plateSystemName = part.systemName;
                plate = part.textLine0 || part["textLicense Plate"] || null;
                break;
            }
            if (part.systemName && (part.systemName.indexOf("plate") > -1 || part.systemName.indexOf("licenseplate") > -1)) {
                // Found a plate-like system we don't know about -> hard fail (config must be updated)
                tellPlayer(player, "&c:cross_mark: Unknown license plate system: &f" + part.systemName);
                tellPlayer(player, "&cAdd it to vehicle_catalog.json -> plateSystems.");
                return;
            }
        }
    }

    if (!plate) {
        tellPlayer(player, "&c:cross_mark: No license plate found on the vehicle.");
        return;
    }

    if (!plateSystemName) {
        tellPlayer(player, "&c:cross_mark: Could not determine license plate system.");
        return;
    }

    var plateSystem = catalog.plateSystems[plateSystemName];
    var defaultPlate = plateSystem.default;

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
        tellPlayer(player, "&e:danger: Vehicle has no VIN number. This will require additional paperwork. (use a key to assign a VIN)");
    }

    // ============ Locate Engine ============ //
    var engine = null;
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.startsWith("part_")) {
            var part = json[key];
            if (part.systemName && (part.systemName.startsWith("engine_") || includes(VEHICLE_REGISTRATION_CONFIG.engineSystemNames, part.systemName))) {
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
    var maxHealth = null;
    
    if (mainVehicleId) {
        vehicleInfo = getVehicleInfo(mainVehicleId);
    }
    
    if (!vehicleInfo) {
        // Unknown vehicles are allowed: maxHealth becomes N/A and no extra titles.
        // Use the raw item ID as identifier if we couldn't map it.
        if (!mainVehicleId) {
            mainVehicleId = itemID;
        }
        tellPlayer(player, "&e:danger: Vehicle model not found in catalog. Continuing with health: N/A.");
        logToFile("dev", "[vehicle_registration] Unknown vehicle model during registration (itemID=" + itemID + ", resolvedId=" + mainVehicleId + ")");
    } else {
        maxHealth = vehicleInfo.maxHealth;
    }

    // Check if the vehicle is already licensed
    // Vehicles can ONLY be registered if they have the default plate
    if (plate !== defaultPlate) {
        var licensedVehiclesExisting = loadLicensedVehicles();
        var existingEntry = licensedVehiclesExisting[plate] || null;

        // If this plate is already in the registry (and not marked as unlicensed),
        // we still issue papers using the stored data.
        if (existingEntry && existingEntry.status !== "unlicensed") {
            var asNewValueExisting = getPriceFromItemStack(heldItem, -1, true);

            var npcRegionExisting = getNpcRegion(npc);
            var regionExisting = existingEntry.region || npcRegionExisting;
            if (!existingEntry.region) {
                existingEntry.region = regionExisting;
                licensedVehiclesExisting[plate] = existingEntry;
                saveLicensedVehicles(licensedVehiclesExisting);
            }

            var titleExisting = "N/A";
            if (existingEntry.titles && existingEntry.titles.length > 0) {
                titleExisting = existingEntry.titles[0];
            } else if (vehicleInfo && vehicleInfo.extraTitles && vehicleInfo.extraTitles.length > 0) {
                titleExisting = vehicleInfo.extraTitles[0];
            }

            var paperPriceExisting = (asNewValueExisting >= 0) ? calculateCarPaperPrice(asNewValueExisting, regionExisting, plate, titleExisting) : null;

            var carModelTextExisting = heldItem.getDisplayName();
            var isTrinExisting = isTrinByCatalogOrDisplay(vehicleInfo, carModelTextExisting);
            var derivedExisting = isTrinExisting ? deriveTrinTrimPaintInterior(carModelTextExisting) : { trim: "N/A", paint: "N/A", interior: "N/A" };

            var engineModelTextExisting = "mts:" + engine.packID + "." + engine.systemName;
            engineModelTextExisting = world.createItem(engineModelTextExisting, 0, 1).getDisplayName();

            var firstOwnerExisting = "Unknown";
            if (existingEntry.ownershipHistory && existingEntry.ownershipHistory.length > 0 && existingEntry.ownershipHistory[0].owner) {
                firstOwnerExisting = existingEntry.ownershipHistory[0].owner;
            }

            var deliveryExisting = formatDateYYYYMMDDToDDMMYYYY(existingEntry.registrationDate) || formatDateDDMMYYYY(new Date());

            var papersExisting = createCarPapersItem(player.world, {
                carModel: carModelTextExisting,
                trim: derivedExisting.trim,
                paint: derivedExisting.paint,
                interior: derivedExisting.interior,
                engine: engineModelTextExisting,
                firstOwner: firstOwnerExisting,
                delivery: deliveryExisting,
                plate: plate,
                msrpCents: (asNewValueExisting >= 0 ? asNewValueExisting : null),
                title: titleExisting,
                region: regionExisting,
                priceCents: paperPriceExisting
            });
            player.giveItem(papersExisting);

            tellPlayer(player, "&e:warning: This vehicle is already registered. Registration was not performed.");
            tellPlayer(player, "&a:check_mark: A copy of the car papers was issued from the registry.");
            logToFile("automobile", player.getName() + " requested car papers for already-registered plate: " + plate);
            return;
        }

        // Track vehicles that are in the wild but not in our registry
        if (!isPlateLicensed(plate)) {
            var licensedVehicles = licensedVehiclesExisting;
            var npcRegionUnlicensed = getNpcRegion(npc);
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
                region: npcRegionUnlicensed,
                status: "unlicensed"
            };
            saveLicensedVehicles(licensedVehicles);
            logToFile("automobile", "[UNLICENSED] Added unregistered vehicle with plate: " + plate + " (VIN: " + (keyUUID || "unknown") + ")");
        }
        tellPlayer(player, "&c:cross_mark: This vehicle is already licensed and cannot be re-registered.");
        tellPlayer(player, "&cCurrent plate: &f" + plate);
        tellPlayer(player, "&cExpected default plate: &f" + defaultPlate + " &7(system: " + plateSystemName + ")");
        logToFile("automobile", player.getName() + " attempted to re-license vehicle with plate: " + plate);
        return;
    }

    // Validate damage against catalog maxHealth (if known)
    if (maxHealth !== null && maxHealth !== undefined && vehicleDamage >= maxHealth) {
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

    // Persist registry region for this NPC into the registry entry
    var npcRegion = getNpcRegion(npc);
    var licensedVehiclesAfterRegistration = loadLicensedVehicles();
    if (licensedVehiclesAfterRegistration[newPlate]) {
        licensedVehiclesAfterRegistration[newPlate].region = npcRegion;
        saveLicensedVehicles(licensedVehiclesAfterRegistration);
    }

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
    tellPlayer(player, "&aVehicle Damage: &f" + vehicleDamage + "/" + (maxHealth !== null && maxHealth !== undefined ? maxHealth : "N/A"));
    tellPlayer(player, "&aEngine Found: &f" + engine.systemName);
    tellPlayer(player, "&aEngine Damage: &f" + engineDamage);
    tellPlayer(player, "&aEngine Hours: &f" + (engineHours !== null ? engineHours : "N/A"));
    tellPlayer(player, "&aVehicle VIN: &f" + (keyUUID || "N/A"));
    tellPlayer(player, "&a&lRegistration Successful!");
    tellPlayer(player, "&aNew License Plate: &f" + newPlate);
    if (vehicleInfo) {
        tellPlayer(player, "&aVehicle Model: &f" + vehicleInfo.name + " (" + vehicleInfo.brand + ")");
    } else {
        tellPlayer(player, "&aVehicle Model: &f" + mainVehicleId + " (N/A)");
    }

    var asNewValue = getPriceFromItemStack(heldItem, -1, true);
    tellPlayer(player, "&aAs-New Value: &f" + (asNewValue >= 0 ? getAmountCoin(asNewValue) : "N/A"));
    if (platesUpdated > 0) {
        tellPlayer(player, "&aLicense Plate(s) Updated: &f" + platesUpdated);
    }

    // ============ Generate Car Papers ============ //
    var region = npcRegion;
    var title = "N/A";
    if (vehicleInfo && vehicleInfo.extraTitles && vehicleInfo.extraTitles.length > 0) {
        title = vehicleInfo.extraTitles[0];
    }

    var paperPrice = (asNewValue >= 0) ? calculateCarPaperPrice(asNewValue, region, newPlate, title) : null;

    var carModelText = heldItem.getDisplayName();
    var isTrin = isTrinByCatalogOrDisplay(vehicleInfo, carModelText);
    var derived = isTrin ? deriveTrinTrimPaintInterior(carModelText) : { trim: "N/A", paint: "N/A", interior: "N/A" };
    var engineModelText = "mts:" + engine.packID + "." + engine.systemName;
    engineModelText = world.createItem(engineModelText, 0, 1).getDisplayName();

    var papers = createCarPapersItem(player.world, {
        carModel: carModelText,
        trim: derived.trim,
        paint: derived.paint,
        interior: derived.interior,
        engine: engineModelText,
        firstOwner: player.getName(),
        delivery: formatDateDDMMYYYY(new Date()),
        plate: newPlate,
        msrpCents: (asNewValue >= 0 ? asNewValue : null),
        title: title,
        region: region,
        priceCents: paperPrice
    });
    player.giveItem(papers);
    
    logToFile("automobile", player.getName() + " registered vehicle: " + mainVehicleId + " with plate: " + newPlate + " (" + platesUpdated + " plates updated)");
}
