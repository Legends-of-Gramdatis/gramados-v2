load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");

var API = Java.type("noppes.npcs.api.NpcAPI").Instance();

function interact(event) {
    var player = event.player;
    var npc = event.npc;

    var heldItem = player.getMainhandItem();

    if (!heldItem || heldItem.isEmpty()) {
        tellPlayer(player, "&f:cross: Please hold a vehicle item in your hand.");
        return;
    }

    var rawNbt = heldItem.getNbt();
    if (!rawNbt) {
        tellPlayer(player, "&4:cross: This item contains no data.");
        return;
    }

    // Convert to JSON and clean it up
    var jsonStr = rawNbt.toJsonString();
    jsonStr = jsonStr.replace(/(\d+)[bBsSlLfFdD]/g, '$1'); // Remove suffixes
    var json = JSON.parse(jsonStr);

    // Check if player is allowed to register vehicles
    if (playerHasJobWithTag(player, "Mechanic")) {
        tellPlayer(player, "&a:check: You are allowed to register vehicles.");
    } else {
        tellPlayer(player, "&c:cross: You are not allowed to register vehicles. Please contact a mechanic.");
        return;
    }

    // ============ Extract Plate ============ //
    var plate = null;
    var keys = getJsonKeys(json);

    // if no "electricPower" key, assume it's not a vehicle
    if (!includes(keys, "electricPower")) {
        tellPlayer(player, "&c:cross: This item is not a vehicle.");
        return;
    }

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.startsWith("part_")) {
            var part = json[key];
            if (part.systemName && part.systemName === "plate_gramados") {
                plate = part.textLine0;
                break;
            }
        }
    }

    if (!plate) {
        tellPlayer(player, "&c:cross: No license plate found on the vehicle.");
        return;
    }

    if (!/^[A-Za-z]{3}-\d{4}$/.test(plate)) {
        tellPlayer(player, "&e:danger: Custom plate format. An extra fee of 1000 grons will be charged for custom plates.");
    }

    if (plate.length > 8) {
        tellPlayer(player, "&c:cross: The license plate is invalid as it exceeds 8 characters.");
        return;
    }

    // ============ Extract Vehicle Damage ============ //
    var vehicleDamage = json.damage || 0;
    var maxHealth = json.maxHealth || 100;

    if (vehicleDamage >= maxHealth) {
        tellPlayer(player, "&c:recycle: This vehicle is totaled and must be functionnal before registration.");
        return;
    }

    // ============ Check Key UUID ============ //
    var keyUUID = json.keyUUID || null;
    if (keyUUID) {
        tellPlayer(player, "&a:check: Vehicle ownership confirmed");
    } else {
        tellPlayer(player, "&e:danger: Vehicle ownership is unclear");
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
        tellPlayer(player, "&c:cross: No engine found in this vehicle.");
        return;
    }

    var engineHours = engine.hours || null;
    var engineDamage = engine.damage || 0;

    // ============ Log Result ============ //
    tellPlayer(player, "&a:check: Vehicle is eligible for registration:");
    tellPlayer(player, "&aPlate: &f" + plate);
    tellPlayer(player, "&aVehicle Damage: &f" + vehicleDamage + "/" + maxHealth);
    tellPlayer(player, "&aEngine Found: &f" + engine.systemName);
    tellPlayer(player, "&aEngine Damage: &f" + engineDamage);
    tellPlayer(player, "&aEngine Hours: &f" + (engineHours !== null ? engineHours : "N/A"));
    tellPlayer(player, "&aKey UUID: &f" + (keyUUID || "N/A"));


    // Proceed to pricing or paperwork from here
}
