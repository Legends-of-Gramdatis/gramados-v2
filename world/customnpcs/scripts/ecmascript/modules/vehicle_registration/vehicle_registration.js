load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles_licensing.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js");

var API = Java.type("noppes.npcs.api.NpcAPI").Instance();

var VEHICLE_REGISTRATION_CONFIG = loadJson("world/customnpcs/scripts/ecmascript/modules/vehicle_registration/config.json");

var CAR_PAPERS_ITEM_ID = "variedcommodities:letter";

var NPC_REGION_KEY = "vehicle_registration_region";
var NPC_DEBUG_KEY = "vehicle_registration_debug";
var NON_STANDARD_PLATE_FEE_CENTS = 1000 * 100;

var UNKNOWN_VALUE = "Unknown";
var NA_VALUE = "N/A";

function isUnknownish(value) {
    if (value === null || value === undefined) {
        return true;
    }
    var s = String(value).trim();
    if (s === "") {
        return true;
    }
    var lc = s.toLowerCase();
    return lc === "n/a" || lc === "na" || lc === "unknown";
}

function normalizeComparable(value) {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value).trim().toLowerCase();
}

function mergeUniqueTitles(a, b) {
    var out = [];
    var i;

    function addOne(t) {
        if (isUnknownish(t)) {
            return;
        }
        var s = String(t).trim();
        if (!s) {
            return;
        }
        for (var j = 0; j < out.length; j++) {
            if (normalizeComparable(out[j]) === normalizeComparable(s)) {
                return;
            }
        }
        out.push(s);
    }

    if (a && a.length) {
        for (i = 0; i < a.length; i++) {
            addOne(a[i]);
        }
    }
    if (b && b.length) {
        for (i = 0; i < b.length; i++) {
            addOne(b[i]);
        }
    }
    return out;
}

function warnIfDefinedMismatch(player, label, itemValue, papersValue) {
    if (isUnknownish(itemValue) || isUnknownish(papersValue)) {
        return;
    }
    if (normalizeComparable(itemValue) !== normalizeComparable(papersValue)) {
        tellPlayer(player, "&e:warning: Mismatch for &f" + label + "&e between vehicle item and papers.");
        tellPlayer(player, "&eItem: &f" + itemValue + " &ePapers: &f" + papersValue);
    }
}

function warnIfDefinedMismatchNumber(player, label, itemValue, papersValue) {
    if (itemValue === null || itemValue === undefined) {
        return;
    }
    if (papersValue === null || papersValue === undefined) {
        return;
    }
    var a = Number(itemValue);
    var b = Number(papersValue);
    if (!isFinite(a) || !isFinite(b)) {
        return;
    }
    if (Math.round(a) !== Math.round(b)) {
        tellPlayer(player, "&e:warning: Mismatch for &f" + label + "&e between vehicle item and papers.");
        tellPlayer(player, "&eItem: &f" + getAmountCoin(Math.round(a)) + " &ePapers: &f" + getAmountCoin(Math.round(b)));
    }
}

function fillMetaFromCarItem(worldObj, itemId, vehicleInfo, engine, derived, asNewValueCents, plateText) {
    var titles = [];
    if (vehicleInfo && vehicleInfo.extraTitles && vehicleInfo.extraTitles.length > 0) {
        titles = vehicleInfo.extraTitles.slice();
    }

    var engineId = UNKNOWN_VALUE;
    var engineSystemName = UNKNOWN_VALUE;
    if (engine && engine.packID && engine.systemName) {
        engineSystemName = String(engine.systemName);
        engineId = "mts:" + engine.packID + "." + engine.systemName;
    }

    return {
        plate: (!isUnknownish(plateText)) ? String(plateText).trim() : NA_VALUE,
        paint: (derived && !isUnknownish(derived.paint)) ? derived.paint : NA_VALUE,
        trim: (derived && !isUnknownish(derived.trim)) ? derived.trim : NA_VALUE,
        interior: (derived && !isUnknownish(derived.interior)) ? derived.interior : NA_VALUE,
        msrpCents: (asNewValueCents >= 0 ? asNewValueCents : null),
        engineId: engineId,
        engineSystemName: engineSystemName,
        titles: titles,
        vehicleItemId: itemId
    };
}

function fillMetaFromCarPapers(papersData) {
    var titles = [];
    if (papersData && papersData.titles && papersData.titles.length) {
        titles = papersData.titles.slice();
    } else if (papersData && !isUnknownish(papersData.title)) {
        titles = [String(papersData.title).trim()];
    }

    return {
        plate: (papersData && !isUnknownish(papersData.plate)) ? String(papersData.plate).trim() : NA_VALUE,
        paint: (papersData && !isUnknownish(papersData.paint)) ? papersData.paint : NA_VALUE,
        trim: (papersData && !isUnknownish(papersData.trim)) ? papersData.trim : NA_VALUE,
        interior: (papersData && !isUnknownish(papersData.interior)) ? papersData.interior : NA_VALUE,
        msrpCents: (papersData && papersData.msrpCents !== null && papersData.msrpCents !== undefined) ? papersData.msrpCents : null,
        engineModel: (papersData && !isUnknownish(papersData.engineModel)) ? papersData.engineModel : UNKNOWN_VALUE,
        titles: titles
    };
}

function resolveMetaValue(itemValue, papersValue, unknownFallback) {
    if (!isUnknownish(papersValue)) {
        return papersValue;
    }
    if (!isUnknownish(itemValue)) {
        return itemValue;
    }
    return unknownFallback;
}

function getRawGlobalPriceValueCents(itemId) {
    var id = String(itemId || "").trim();
    if (!id) {
        return null;
    }
    // Ensure :damage suffix
    if (!/^.+:.+:\d+$/.test(id)) {
        id += ":0";
    }
    var globalPrices = loadJson(GLOBAL_PRICES_JSON_PATH);
    if (!globalPrices || !globalPrices.hasOwnProperty(id)) {
        return null;
    }
    var entry = globalPrices[id];
    if (!entry || entry.value === undefined || entry.value === null) {
        return null;
    }
    return Number(entry.value);
}

function warnIfMsprMismatch(player, itemId, msrpCents, contextLabel) {
    if (msrpCents === null || msrpCents === undefined) {
        return;
    }
    var raw = getRawGlobalPriceValueCents(itemId);
    if (raw === null || raw === undefined) {
        return;
    }
    var msrp = Number(msrpCents);
    if (!isFinite(msrp) || !isFinite(raw)) {
        return;
    }
    if (Math.round(msrp) !== Math.round(raw)) {
        tellPlayer(player, "&e:warning: MSRP mismatch" + (contextLabel ? " (" + contextLabel + ")" : "") + ".");
        tellPlayer(player, "&eComputed: &f" + getAmountCoin(Math.round(msrp)) + " &eGlobal: &f" + getAmountCoin(Math.round(raw)));
    }
}

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

function isNpcDebugMode(npc) {
    return npc.getStoreddata().get(NPC_DEBUG_KEY) === "1";
}

function setNpcDebugMode(npc, enabled) {
    npc.getStoreddata().put(NPC_DEBUG_KEY, enabled ? "1" : "0");
}

function toggleNpcDebugMode(npc) {
    var next = !isNpcDebugMode(npc);
    setNpcDebugMode(npc, next);
    return next;
}

function parsePaperDateToYYYYMMDD(text) {
    var s = String(text || "").trim();
    var m1 = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s);
    if (m1) {
        return m1[1] + "-" + m1[2] + "-" + m1[3];
    }
    var m2 = /^([0-9]{1,2})\/([0-9]{1,2})\/([0-9]{4})$/.exec(s);
    if (m2) {
        return m2[3] + "-" + padLeft(m2[2], 2, "0") + "-" + padLeft(m2[1], 2, "0");
    }
    return null;
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

function isLikelyCarPapersItem(stack) {
    if (!stack || stack.isEmpty()) {
        return false;
    }
    if (stack.getName() !== CAR_PAPERS_ITEM_ID) {
        return false;
    }
    var dn = stripMinecraftSectionColors(stack.getDisplayName());
    if (dn && dn.toLowerCase() === "car papers") {
        return true;
    }
    var lore = stack.getLore();
    if (!lore || lore.length === 0) {
        return false;
    }
    for (var i = 0; i < lore.length; i++) {
        var line = stripMinecraftSectionColors(String(lore[i]));
        var lc = line.toLowerCase();
        if (lc.indexOf("plate") > -1 && lc.indexOf(":") > -1) {
            return true;
        }
        if (lc.indexOf("registry") > -1) {
            return true;
        }
    }
    return false;
}

function parseCarPapersLore(stack) {
    var out = {
        plate: null,
        region: null,
        title: null,
        titles: null,
        firstOwner: null,
        delivery: null,
        trim: null,
        paint: null,
        interior: null,
        engineModel: null,
        msrpCents: null
    };

    if (!stack || stack.isEmpty()) {
        return out;
    }
    var lore = stack.getLore();
    if (!lore || lore.length === 0) {
        return out;
    }

    for (var i = 0; i < lore.length; i++) {
        var raw = stripMinecraftSectionColors(String(lore[i])).trim();
        if (!raw) {
            continue;
        }

        // Normalize common list prefixes
        raw = raw.replace(/^[-•]\s*/, "");

        var lower = raw.toLowerCase();
        var idx = raw.indexOf(":");
        if (idx === -1) {
            continue;
        }
        var key = raw.substr(0, idx).trim().toLowerCase();
        var value = raw.substr(idx + 1).trim();

        if ((key === "plate" || key.indexOf("plate") > -1) && !out.plate) {
            out.plate = value;
            continue;
        }
        if ((key === "region" || key.indexOf("region") > -1) && !out.region) {
            out.region = value;
            continue;
        }
        if ((key === "title" || key.indexOf("title") > -1) && !out.title) {
            out.title = value;
            // Support comma-separated titles on older papers.
            if (value && value.indexOf(",") > -1) {
                var parts = value.split(",");
                var collected = [];
                for (var ti = 0; ti < parts.length; ti++) {
                    var t = String(parts[ti] || "").trim();
                    if (t) {
                        collected.push(t);
                    }
                }
                if (collected.length > 0) {
                    out.titles = collected;
                }
            }
            continue;
        }
        if ((key.indexOf("first owner") > -1 || key === "owner") && !out.firstOwner) {
            out.firstOwner = value;
            continue;
        }
        if ((key.indexOf("delivery") > -1 || key.indexOf("date") > -1) && !out.delivery) {
            out.delivery = value;
            continue;
        }

        if (key.indexOf("trim") > -1 && !out.trim) {
            out.trim = value;
            continue;
        }
        if (key.indexOf("paint") > -1 && !out.paint) {
            out.paint = value;
            continue;
        }
        if (key.indexOf("interior") > -1 && !out.interior) {
            out.interior = value;
            continue;
        }
        if (key.indexOf("engine") > -1 && !out.engineModel) {
            out.engineModel = value;
            continue;
        }
        if (key.indexOf("msrp") > -1 && out.msrpCents === null) {
            var v = String(value || "").trim();
            if (v && v.toLowerCase() !== "n/a") {
                if (/^-?\d+$/.test(v)) {
                    out.msrpCents = parseInt(v, 10);
                } else {
                    var coinCandidate = v.replace(/[^0-9A-Za-z-]/g, "");
                    var cents = getCoinAmount(coinCandidate);
                    if (cents > 0 || coinCandidate.indexOf("0") > -1) {
                        out.msrpCents = cents;
                    }
                }
            }
            continue;
        }
        // Fallbacks for older papers that use slightly different wording
        if (!out.plate && lower.indexOf("plate") > -1 && lower.indexOf(":") > -1) {
            out.plate = value;
        }
    }

    return out;
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
    var world = player.getWorld();

    var offhandItem = player.getOffhandItem();
    var hasSeagullCard = offhandItem && !offhandItem.isEmpty() && offhandItem.getName() === "mts:ivv.idcard_seagull";

    var debugMode = isNpcDebugMode(npc);

    // Admin: toggle debug mode
    if (hasSeagullCard && heldItem && !heldItem.isEmpty() && heldItem.getName() === "minecraft:command_block") {
        var enabled = toggleNpcDebugMode(npc);
        tellPlayer(player, "&a:check_mark: Vehicle registration debug mode: &f" + (enabled ? "ON" : "OFF"));
        tellPlayer(player, "&7Current NPC region: &f" + getNpcRegion(npc));
        return;
    }

    // Debug: cycle region (command block only)
    if (debugMode && heldItem && !heldItem.isEmpty() && heldItem.getName() === "minecraft:command_block") {
        var newRegion = cycleNpcRegion(npc);
        tellPlayer(player, "&a:check_mark: Vehicle registration region set to: &f" + newRegion);
        return;
    }

    // Debug: import legacy papers into registry (car papers offhand + vehicle in mainhand)
    if (debugMode && isLikelyCarPapersItem(offhandItem)) {
        if (!heldItem || heldItem.isEmpty() || !heldItem.hasNbt()) {
            tellPlayer(player, "&c:cross_mark: Debug import requires a vehicle item in main hand.");
            return;
        }

        var rawNbtImport = heldItem.getNbt();
        var jsonImport = JSON.parse(sanitizeJavaJson(rawNbtImport.toJsonString()));
        var keysImport = getJsonKeys(jsonImport);
        if (!includes(keysImport, "electricPower")) {
            tellPlayer(player, "&c:cross_mark: Main hand item is not a vehicle.");
            return;
        }

        var papersData = parseCarPapersLore(offhandItem);

        var plateFromPapers = null;
        if (papersData && papersData.plate && !isUnknownish(papersData.plate)) {
            plateFromPapers = String(papersData.plate).trim();
        }

        // Extract vehicle plate (fallback to paperwork if missing)
        var catalogImport = loadVehicleCatalog();
        var plateFromVehicle = null;
        for (var i = 0; i < keysImport.length; i++) {
            var k = keysImport[i];
            if (k.startsWith("part_")) {
                var p = jsonImport[k];
                if (p.systemName && catalogImport.plateSystems[p.systemName]) {
                    var candidate = p.textLine0 || p["textLicense Plate"] || null;
                    var defaultPlate = catalogImport.plateSystems[p.systemName].default;
                    if (candidate && !isUnknownish(candidate) && String(candidate).trim() !== String(defaultPlate).trim()) {
                        plateFromVehicle = String(candidate).trim();
                    }
                    break;
                }
            }
        }

        // Prefer papers plate; vehicle plate is often the factory-default placeholder.
        var plateImport = plateFromPapers || plateFromVehicle || null;
        if (!plateImport) {
            tellPlayer(player, "&c:cross_mark: Could not determine plate (vehicle NBT and paperwork are missing it).");
            return;
        }
        var regionImport = (papersData.region && VEHICLE_REGISTRATION_CONFIG.regions.hasOwnProperty(papersData.region)) ? papersData.region : getNpcRegion(npc);

        var titleImport = (papersData.title && papersData.title !== "N/A") ? papersData.title : "N/A";

        var regDate = parsePaperDateToYYYYMMDD(papersData.delivery) || dateToYYYYMMDD(new Date());

        var vinImport = jsonImport.keyUUID || "unknown";
        var itemIdImport = heldItem.getName();
        var vehicleIdImport = itemIdImport;
        var vehicleSystemNameImport = getMainVehicleId(itemIdImport) || UNKNOWN_VALUE;

        var vehicleInfoImport = (vehicleSystemNameImport !== UNKNOWN_VALUE) ? getVehicleInfo(vehicleSystemNameImport) : null;
        var asNewValueImport = getPriceFromItemStack(heldItem, -1, true);

        // Derive Trin trim/paint/interior from the display name when possible.
        var carModelImport = heldItem.getDisplayName();
        var derivedImport = { trim: NA_VALUE, paint: NA_VALUE, interior: NA_VALUE };
        if (isTrinByCatalogOrDisplay(vehicleInfoImport, carModelImport)) {
            derivedImport = deriveTrinTrimPaintInterior(carModelImport);
        }

        // Extract engine from vehicle item (systemName) when possible.
        var engineImport = null;
        for (var ei = 0; ei < keysImport.length; ei++) {
            var ek = keysImport[ei];
            if (ek.startsWith("part_")) {
                var ep = jsonImport[ek];
                if (ep && ep.systemName && (String(ep.systemName).indexOf("engine_") === 0 || includes(VEHICLE_REGISTRATION_CONFIG.engineSystemNames, ep.systemName))) {
                    engineImport = ep;
                    break;
                }
            }
        }

        var metaFromItem = fillMetaFromCarItem(player.world, itemIdImport, vehicleInfoImport, engineImport, derivedImport, asNewValueImport, plateFromVehicle);
        var metaFromPapers = fillMetaFromCarPapers(papersData);

        // Always warn when both sources define a value and they differ.
        warnIfDefinedMismatch(player, "Paint", metaFromItem.paint, metaFromPapers.paint);
        warnIfDefinedMismatch(player, "Trim", metaFromItem.trim, metaFromPapers.trim);
        warnIfDefinedMismatch(player, "Interior", metaFromItem.interior, metaFromPapers.interior);
        warnIfDefinedMismatchNumber(player, "MSRP", metaFromItem.msrpCents, metaFromPapers.msrpCents);

        var titlesResolved = mergeUniqueTitles(metaFromItem.titles, metaFromPapers.titles);
        if (metaFromItem.titles.length > 0 && metaFromPapers.titles.length > 0) {
            // Warn if the sets differ (order-insensitive).
            var tA = mergeUniqueTitles(metaFromItem.titles, []);
            var tB = mergeUniqueTitles(metaFromPapers.titles, []);
            if (tA.length !== tB.length) {
                tellPlayer(player, "&e:warning: Titles differ between item and papers; storing union.");
            }
        }

        warnIfMsprMismatch(player, itemIdImport, metaFromPapers.msrpCents, "debug import");

        var resolvedPaint = resolveMetaValue(metaFromItem.paint, metaFromPapers.paint, NA_VALUE);
        var resolvedTrim = resolveMetaValue(metaFromItem.trim, metaFromPapers.trim, NA_VALUE);
        var resolvedInterior = resolveMetaValue(metaFromItem.interior, metaFromPapers.interior, NA_VALUE);
        var resolvedMsrp = (metaFromPapers.msrpCents !== null && metaFromPapers.msrpCents !== undefined) ? metaFromPapers.msrpCents : metaFromItem.msrpCents;
        var resolvedEngineId = (metaFromItem.engineId && !isUnknownish(metaFromItem.engineId)) ? metaFromItem.engineId : UNKNOWN_VALUE;
        var resolvedEngineSystemName = (metaFromItem.engineSystemName && !isUnknownish(metaFromItem.engineSystemName)) ? metaFromItem.engineSystemName : UNKNOWN_VALUE;

        var entry = {
            vin: vinImport,
            vehicleId: vehicleIdImport,
            vehicleSystemName: vehicleSystemNameImport,
            // Resolved meta (prefer papers when present, else item)
            paintVariant: resolvedPaint,
            trim: resolvedTrim,
            interior: resolvedInterior,
            msrpCents: resolvedMsrp,
            engineId: resolvedEngineId,
            engineSystemName: resolvedEngineSystemName,
            metaSources: {
                fromCarItem: metaFromItem,
                fromCarPapers: metaFromPapers
            },
            ownershipHistory: [],
            titles: [],
            insuranceClaims: [],
            history: [],
            registrationDate: regDate,
            region: regionImport,
            status: "active"
        };

        if (papersData.firstOwner && papersData.firstOwner !== "N/A") {
            entry.ownershipHistory = [{ owner: papersData.firstOwner, acquiredDate: regDate, soldDate: null }];
        }
        entry.titles = mergeUniqueTitles(titlesResolved, (titleImport && titleImport !== "N/A") ? [titleImport] : []);

        var licensedVehiclesImport = loadLicensedVehicles();
        if (licensedVehiclesImport[plateImport]) {
            var existing = licensedVehiclesImport[plateImport];
            // Merge only missing fields (best effort, non-destructive)
            if (!existing.vin) { existing.vin = entry.vin; }
            if (!existing.vehicleId) { existing.vehicleId = entry.vehicleId; }
            if (!existing.vehicleSystemName) { existing.vehicleSystemName = entry.vehicleSystemName; }
            if (existing.paintVariant === undefined || existing.paintVariant === "") { existing.paintVariant = entry.paintVariant; }
            if (existing.trim === undefined || existing.trim === "") { existing.trim = entry.trim; }
            if (existing.interior === undefined || existing.interior === "") { existing.interior = entry.interior; }
            if (existing.msrpCents === undefined) { existing.msrpCents = entry.msrpCents; }
            if (existing.engineId === undefined || existing.engineId === "") { existing.engineId = entry.engineId; }
            if (existing.engineSystemName === undefined || existing.engineSystemName === "") { existing.engineSystemName = entry.engineSystemName; }
            existing.metaSources = entry.metaSources;
            if (!existing.registrationDate) { existing.registrationDate = entry.registrationDate; }
            if (!existing.region) { existing.region = entry.region; }
            if (!existing.status) { existing.status = entry.status; }
            if (!existing.ownershipHistory || existing.ownershipHistory.length === 0) { existing.ownershipHistory = entry.ownershipHistory; }
            existing.titles = mergeUniqueTitles(existing.titles || [], entry.titles || []);
            if (!existing.insuranceClaims) { existing.insuranceClaims = entry.insuranceClaims; }
            licensedVehiclesImport[plateImport] = existing;
            saveLicensedVehicles(licensedVehiclesImport);
            tellPlayer(player, "&a:check_mark: Updated existing registry entry for plate: &f" + plateImport);
        } else {
            licensedVehiclesImport[plateImport] = entry;
            saveLicensedVehicles(licensedVehiclesImport);
            tellPlayer(player, "&a:check_mark: Created registry entry for plate: &f" + plateImport);
        }

        if (plateFromVehicle && plateFromPapers && plateFromPapers !== plateFromVehicle) {
            tellPlayer(player, "&e:warning: Papers plate does not match vehicle plate.");
            tellPlayer(player, "&eVehicle plate: &f" + plateFromVehicle + " &ePapers plate: &f" + papersData.plate);
        }

        logToFile("automobile", "[DEBUG_IMPORT] " + player.getName() + " imported papers for plate: " + plateImport + " (vehicleId=" + vehicleIdImport + ")");
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
    if (!isItem_Vehicle(heldItem)) {
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
    // Full vehicle item id (e.g., mts:iv_tcp_v3_civil.trin_footpather_phase2_sage_g)
    var itemID = heldItem.getName();
    var vehicleId = itemID;

    // Base vehicle systemName (catalog key)
    var vehicleSystemName = getMainVehicleId(itemID) || UNKNOWN_VALUE;
    var paintVariant = getPaintVariant(itemID);
    var vehicleInfo = null;
    var maxHealth = null;

    if (vehicleSystemName !== UNKNOWN_VALUE) {
        vehicleInfo = getVehicleInfo(vehicleSystemName);
    }
    
    if (!vehicleInfo) {
        // Unknown vehicles are allowed: maxHealth becomes N/A and no extra titles.
        tellPlayer(player, "&e:danger: Vehicle model not found in catalog. Continuing with health: N/A.");
        logToFile("dev", "[vehicle_registration] Unknown vehicle model during registration (itemID=" + itemID + ", vehicleSystemName=" + vehicleSystemName + ")");
    } else {
        maxHealth = vehicleInfo.maxHealth;
    }

    var asNewValue = getPriceFromItemStack(heldItem, -1, true);
    warnIfMsprMismatch(player, itemID, (asNewValue >= 0 ? asNewValue : null), "computed MSRP");

    var carModelText = heldItem.getDisplayName();
    var isTrin = isTrinByCatalogOrDisplay(vehicleInfo, carModelText);
    var derived = isTrin ? deriveTrinTrimPaintInterior(carModelText) : { trim: "N/A", paint: "N/A", interior: "N/A" };

    // Check if the vehicle is already licensed
    // Vehicles can ONLY be registered if they have the default plate
    if (plate !== defaultPlate) {
        var licensedVehiclesExisting = loadLicensedVehicles();
        var existingEntry = licensedVehiclesExisting[plate] || null;

        // If this plate is already in the registry (and not marked as unlicensed),
        // we still issue papers using the stored data.
        if (existingEntry && existingEntry.status !== "unlicensed") {
            var npcRegionExisting = getNpcRegion(npc);
            var regionExisting = existingEntry.region || npcRegionExisting;
            if (!existingEntry.region) {
                existingEntry.region = regionExisting;
                licensedVehiclesExisting[plate] = existingEntry;
                saveLicensedVehicles(licensedVehiclesExisting);
            }

            // Backfill missing config info in the registry when possible
            if (existingEntry.paintVariant === undefined || existingEntry.paintVariant === "") {
                existingEntry.paintVariant = derived.paint;
            }
            if (existingEntry.trim === undefined || existingEntry.trim === "") {
                existingEntry.trim = derived.trim;
            }
            if (existingEntry.interior === undefined || existingEntry.interior === "") {
                existingEntry.interior = derived.interior;
            }
            if (existingEntry.msrpCents === undefined) {
                existingEntry.msrpCents = (asNewValue >= 0 ? asNewValue : null);
            }

            // Backfill engine meta
            if (existingEntry.engineId === undefined || existingEntry.engineId === "") {
                existingEntry.engineId = "mts:" + engine.packID + "." + engine.systemName;
            }
            if (existingEntry.engineSystemName === undefined || existingEntry.engineSystemName === "") {
                existingEntry.engineSystemName = engine.systemName;
            }
            if (!existingEntry.metaSources) {
                existingEntry.metaSources = {
                    fromCarItem: fillMetaFromCarItem(player.world, itemID, vehicleInfo, engine, derived, asNewValue),
                    fromCarPapers: null
                };
            }
            licensedVehiclesExisting[plate] = existingEntry;
            saveLicensedVehicles(licensedVehiclesExisting);

            var titleExisting = "N/A";
            if (existingEntry.titles && existingEntry.titles.length > 0) {
                titleExisting = existingEntry.titles[0];
            } else if (vehicleInfo && vehicleInfo.extraTitles && vehicleInfo.extraTitles.length > 0) {
                titleExisting = vehicleInfo.extraTitles[0];
            }

            var paperPriceExisting = (asNewValue >= 0) ? calculateCarPaperPrice(asNewValue, regionExisting, plate, titleExisting) : null;

            var carModelTextExisting = carModelText;
            var derivedExisting = derived;

            var trimExisting = existingEntry.trim || derivedExisting.trim;
            var paintExisting = existingEntry.paintVariant || derivedExisting.paint;
            var interiorExisting = existingEntry.interior || derivedExisting.interior;

            var engineIdExisting = "mts:" + engine.packID + "." + engine.systemName;
            var engineModelTextExisting = world.createItem(engineIdExisting, 0, 1).getDisplayName();

            var firstOwnerExisting = "Unknown";
            if (existingEntry.ownershipHistory && existingEntry.ownershipHistory.length > 0 && existingEntry.ownershipHistory[0].owner) {
                firstOwnerExisting = existingEntry.ownershipHistory[0].owner;
            }

            var deliveryExisting = formatDateYYYYMMDDToDDMMYYYY(existingEntry.registrationDate) || formatDateDDMMYYYY(new Date());

            var papersExisting = createCarPapersItem(player.world, {
                carModel: carModelTextExisting,
                trim: trimExisting,
                paint: paintExisting,
                interior: interiorExisting,
                engine: engineModelTextExisting,
                firstOwner: firstOwnerExisting,
                delivery: deliveryExisting,
                plate: plate,
                msrpCents: (existingEntry.msrpCents !== undefined ? existingEntry.msrpCents : (asNewValue >= 0 ? asNewValue : null)),
                title: titleExisting,
                region: regionExisting,
                priceCents: paperPriceExisting
            });

            warnIfMsprMismatch(player, itemID, papersExisting ? (existingEntry.msrpCents !== undefined ? existingEntry.msrpCents : (asNewValue >= 0 ? asNewValue : null)) : null, "re-issue papers");
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
            var dateStr = dateToYYYYMMDD();
            licensedVehicles[plate] = {
                vin: keyUUID || "unknown",
                vehicleId: vehicleId,
                vehicleSystemName: vehicleSystemName,
                paintVariant: derived.paint,
                trim: derived.trim,
                interior: derived.interior,
                msrpCents: (asNewValue >= 0 ? asNewValue : null),
                engineId: "mts:" + engine.packID + "." + engine.systemName,
                engineSystemName: engine.systemName,
                metaSources: {
                    fromCarItem: fillMetaFromCarItem(player.world, itemID, vehicleInfo, engine, derived, asNewValue),
                    fromCarPapers: null
                },
                ownershipHistory: [],
                titles: [],
                insuranceClaims: [],
                history: [],
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
        var vinMatch = getRegistrationByVinCompact(keyUUID);
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
    var engineItemId = "mts:" + engine.packID + "." + engine.systemName;
    var engineModelText = world.createItem(engineItemId, 0, 1).getDisplayName();

    var registrationResult = registerVehicle(vehicleId, vehicleSystemName, keyUUID, player.getName(), {
        paintVariant: derived.paint,
        trim: derived.trim,
        interior: derived.interior,
        msrpCents: (asNewValue >= 0 ? asNewValue : null),
        engineId: engineItemId,
        engineSystemName: engine.systemName
    });
    
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
        licensedVehiclesAfterRegistration[newPlate].metaSources = {
            fromCarItem: fillMetaFromCarItem(player.world, itemID, vehicleInfo, engine, derived, asNewValue, newPlate),
            fromCarPapers: null
        };
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
        tellPlayer(player, "&aVehicle Model: &f" + vehicleSystemName + " (N/A)");
    }

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

    // (carModelText / derived already computed above)
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
    
    logToFile("automobile", player.getName() + " registered vehicle: " + vehicleId + " with plate: " + newPlate + " (" + platesUpdated + " plates updated)");
}
