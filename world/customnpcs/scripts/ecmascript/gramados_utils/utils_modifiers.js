load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_crops.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_animania.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");

var farmCrops = exports_utils_farm_crops;
var MODIFIERS_CFG_PATH = "world/customnpcs/scripts/ecmascript/modules/modifiers/modifiers_config.json";
var PASSIVE_MODIFIERS_DATA_PATH = "world/customnpcs/scripts/data_auto/passive_modifiers.json";

/**
 * Creates an active (single-use) modifier item from a base stack.
 *
 * The modifier metadata is stored in the item NBT under `tag`:
 * - `is_modifier` (boolean): true while the item is active
 * - `modifier_type` (string): the configured modifier type
 * - `modifier_radius` (int): radius to apply the effect
 *
 * Configuration source:
 * - `items.itemId` (replaces the item id)
 * - `modifiers[]` entry matching `modifierType`
 *
 * @param {IPlayer} player Player used for world/NBT creation and debug output.
 * @param {IItemStack} stack Base item stack to clone and convert.
 * @param {string} modifierType Modifier `type` to resolve from `modifiers_config.json`.
 * @returns {IItemStack} A new item stack representing the configured modifier.
 */
function instanciate_active_modifier(player, stack, modifierType) {
    var stackClone = stack.copy();
    var nbt = stackClone.getItemNbt();
    var tag = nbt.getCompound("tag");
    tag.setBoolean("is_modifier", true);

    var config_data = loadJson(MODIFIERS_CFG_PATH);
    var cfg = config_data.items;
    var entry = findJsonSubEntry(config_data.modifiers, "type", modifierType);
    tellPlayer(player, "§e:recycle: Debug: Entry for active modifier type '" + modifierType + "': " + JSON.stringify(entry));

    tag.setString("modifier_type", modifierType);
    tag.setInteger("modifier_radius", entry.radius);

    nbt.setCompound("tag", tag);
    nbt.setString("id", cfg.itemId);

    var newItem = player.getWorld().createItemFromNbt(nbt);

    newItem.setCustomName(parseEmotes(ccs(entry.displayName)));
    newItem.setLore([
        parseEmotes(ccs(entry.description)),
        ccs("&7Radius: &e" + entry.radius + " blocks")
    ]);
    newItem.setItemDamage(entry.colorCode);

    return newItem;
}

/**
 * Creates a passive modifier orb item from a base stack.
 *
 * Passive modifier orbs do not apply a world effect directly.
 * They are consumed by the modifier engine to add a runtime entry in
 * `PASSIVE_MODIFIERS_DATA_PATH` via `apply_passive_modifier_type`.
 *
 * The passive modifier metadata is stored in the item NBT under `tag`:
 * - `is_passive_modifier` (boolean): marker for passive modifier items
 * - `passive_modifier_type` (string): the configured passive modifier type
 *
 * Configuration source:
 * - `items.itemId` (replaces the item id)
 * - `passive_modifiers[]` entry matching `modifierType`
 *
 * @param {IPlayer} player Player used for world/NBT creation and debug output.
 * @param {IItemStack} stack Base item stack to clone and convert.
 * @param {string} modifierType Passive modifier `type` to resolve from `modifiers_config.json`.
 * @returns {IItemStack} A new item stack representing the configured passive modifier orb.
 */
function instanciate_passive_modifier(player, stack, modifierType) {
    var stackClone = stack.copy();
    var nbt = stackClone.getItemNbt();
    var tag = nbt.getCompound("tag");
    tag.setBoolean("is_passive_modifier", true);

    var config_data = loadJson(MODIFIERS_CFG_PATH);
    var cfg = config_data.items;
    var entry = findJsonSubEntry(config_data.passive_modifiers, "type", modifierType);
    tellPlayer(player, "§e:recycle: Debug: Entry for passive modifier type '" + modifierType + "': " + JSON.stringify(entry));
    
    tag.setString("passive_modifier_type", modifierType);
    tag.setInteger("duration_minutes", entry.durationMinutes);

    nbt.setCompound("tag", tag);
    nbt.setString("id", cfg.itemId);

    var newItem = player.getWorld().createItemFromNbt(nbt);

    newItem.setCustomName(parseEmotes(ccs(entry.displayName)));
    newItem.setLore([
        parseEmotes(ccs(entry.description)),
        ccs("&7Duration: &e" + entry.durationMinutes + " minutes")
    ]);
    newItem.setItemDamage(entry.colorCode);

    return newItem;
}

/**
 * Checks whether an item stack contains this module's modifier marker.
 *
 * Note: This only checks for presence of `tag.is_modifier`, not whether it is active.
 * Use `is_active_modifier_item` to check if the orb is currently usable.
 *
 * @param {IItemStack} stack Item stack to inspect.
 * @returns {boolean} True if the stack has a `tag.is_modifier` key.
 */
function has_active_modifier_tag(stack) {
    var nbt = stack.getItemNbt();
    if (stack.isEmpty()) {
        return false;
    }

    if (!nbt.has("tag")) {
        return false;
    }

    var compound = nbt.getCompound("tag");
    if (!compound.has("is_modifier")) {
        return false;
    }

    return true;
}

/**
 * Checks whether an item stack contains this module's passive modifier marker.
 *
 * @param {IItemStack} stack Item stack to inspect.
 * @returns {boolean} True if the stack has a `tag.is_passive_modifier` key.
 */
function has_passive_modifier_tag(stack) {
    if (!stack || stack.isEmpty()) {
        return false;
    }

    var nbt = stack.getItemNbt();
    if (!nbt.has("tag")) {
        return false;
    }

    var compound = nbt.getCompound("tag");
    return compound.has("is_passive_modifier");
}

/**
 * Checks whether an item is an active (usable) modifier item.
 *
 * Active means `tag.is_modifier === true`.
 * Used/depleted modifiers should have the marker but with `is_modifier === false`.
 *
 * @param {IItemStack} stack Item stack to inspect.
 * @returns {boolean} True if the modifier marker exists and is active.
 */
function is_active_modifier_item(stack) {
    if (has_active_modifier_tag(stack)) {
        var nbt = stack.getItemNbt();
        var compound = nbt.getCompound("tag");
        return compound.getBoolean("is_modifier");
    }
    return false;
}

/**
 * Checks whether an item stack is a passive modifier orb.
 *
 * @param {IItemStack} stack Item stack to inspect.
 * @returns {boolean} True if the passive marker exists and is set to true.
 */
function is_passive_modifier_item(stack) {
    if (!has_passive_modifier_tag(stack)) {
        return false;
    }
    var nbt = stack.getItemNbt();
    var compound = nbt.getCompound("tag");
    return compound.getBoolean("is_passive_modifier");
}


/**
 * "Repairs" a used modifier orb back into an active modifier orb.
 *
 * Side effects on NBT:
 * - sets `tag.is_modifier` to true
 * - increments `tag.repairs` (used to compute future recharge costs)
 * - replaces item id with `items.itemId`
 *
 * @param {IPlayer} player Player used for world/NBT creation and debug output.
 * 
 * @param {IItemStack} stack The existing modifier item stack to repair (will be cloned).
 * @returns {IItemStack} A new item stack representing the repaired modifier.
 */
function repair_modifier_item(player, stack) {
    var stackClone = stack.copy();
    var nbt = stackClone.getItemNbt();
    var tag = nbt.getCompound("tag");
    if (tag.has("modifier_type")) {
        tag.setBoolean("is_modifier", true);
        var itemName = get_modifier_display_name(tag.getString("modifier_type"));
    } else {
        tag.setBoolean("is_passive_modifier", true);
        var itemName = get_modifier_display_name(tag.getString("passive_modifier_type"));
    }

    var json_data = loadJson(MODIFIERS_CFG_PATH)

    var repair_count = tag.getInteger("repairs") || 0;

    tag.setInteger("repairs", repair_count + 1);

    nbt.setCompound("tag", tag);
    nbt.setString("id", json_data.items.itemId);

    var newItem = player.getWorld().createItemFromNbt(nbt);

    newItem.setCustomName(parseEmotes(ccs(itemName)));

    return newItem;
}


/**
 * Applies an active modifier effect to the world around the player.
 *
 * The effect dispatched depends on `modifierType` and is applied within `radius`.
 * Most crop/farmland actions delegate to `utils_farm_crops`.
 *
 * @param {IPlayer} player The player used as the center point for the effect.
 * @param {string} modifierType Modifier `type` string (as configured in `modifiers_config.json`).
 * @param {number} radius Effect radius in blocks.
 * @returns {*} The underlying handler's return value, or null if `modifierType` is unknown.
 */
function apply_active_modifier_type(player, modifierType, radius) {

    var world = player.getWorld();
    var pos = player.getPos();

    switch (modifierType) {
        case "cattle pregnancy":
            return makeFieldCattlePregnant(player, radius);
        case "cattle gestation":
            return skipGestationForFieldCattle(player, radius);
        case "cattle milk production":
            return setFieldCowsHasKids(player, radius);
        case "cattle baby grow":
            return growFieldCalvesToAdults(player, radius);
        case "farmland fertilize":
            return farmCrops.fertilize_farmland_sphere(world, pos, radius);
        case "farmland tilt":
            return farmCrops.tillSurfaceToFarmland(world, pos, radius, true);
        case "crop harvest":
            return farmCrops.harvestCropsBreak(world, pos, radius);
        case "crop harvest and plant":
            return farmCrops.harvestCropsBreakAndReset(world, pos, radius);
        case "crop growth random":
            return farmCrops.randomGrowCrops(world, pos, radius);
        case "crop growth max":
            return farmCrops.growCropsToMax(world, pos, radius);
        case "crop rot random":
            return farmCrops.randomLowerCrops(world, pos, radius);
        case "crop rot max":
            return farmCrops.resetCropsToZero(world, pos, radius);
        default:
            return null;
    }
}


function get_passive_modifier_config_entry(modifierType) {
    return findJsonSubEntry(loadJson(MODIFIERS_CFG_PATH).passive_modifiers, "type", modifierType);
}

function get_passive_modifier_remaining_ms(player_modifier, nowMs) {
    if (!player_modifier) {
        return 0;
    }

    var remainingMs = player_modifier.remainingMs;
    if (typeof (remainingMs) !== "number") {
        remainingMs = 0;
    }

    var lastOnlineAt = player_modifier.lastOnlineAt;
    if (typeof (lastOnlineAt) === "number") {
        remainingMs = remainingMs - (nowMs - lastOnlineAt);
    }

    return remainingMs;
}

function normalize_and_clean_passive_modifiers(player, modifiers) {
    var nowMs = Date.now();
    var cleaned = [];
    var changed = false;

    if (!modifiers) {
        return { modifiers: [], changed: false };
    }

    for (var i = 0; i < modifiers.length; i++) {
        var raw = modifiers[i];
        if (!raw) {
            changed = true;
            continue;
        }

        if (typeof (raw.lastOnlineAt) === "undefined") {
            changed = true;
        }

        var remainingMs = get_passive_modifier_remaining_ms(raw, nowMs);
        if (remainingMs <= 0) {
            changed = true;
            continue;
        }

        cleaned.push(raw);
    }

    if (cleaned.length !== modifiers.length) {
        changed = true;
    }

    return { modifiers: cleaned, changed: changed };
}


/**
 * Adds a passive modifier to a player (if not already present).
 *
 * Timer model:
 * - We store `remainingMs` (ms left) and `lastOnlineAt` (ms timestamp when countdown started).
 * - On logout, `freeze_passive_modifiers` collapses time spent online into `remainingMs` and sets `lastOnlineAt = null`.
 * - On login/init, `unfreeze_passive_modifiers` sets `lastOnlineAt = now` so time only ticks while online.
 *
 * Data file: `PASSIVE_MODIFIERS_DATA_PATH` (per-player array).
 *
 * @param {IPlayer} player Player receiving the passive modifier.
 * @param {string} modifierType Modifier type (must exist in `passive_modifiers`).
 * @returns {boolean} True if a new modifier entry was added, false otherwise.
 */
function apply_passive_modifier_type(player, modifierType) {
    var data = loadJson(PASSIVE_MODIFIERS_DATA_PATH);
    var playerId = player.getUUID();

    if (!data.hasOwnProperty(playerId)) {
        data[playerId] = [];
    }
    var normalized = normalize_and_clean_passive_modifiers(player, data[playerId]);
    var playerModifiers = normalized.modifiers;

    for (var i = 0; i < playerModifiers.length; i++) {
        if (playerModifiers[i].type === modifierType) {
            if (normalized.changed) {
                data[playerId] = playerModifiers;
                saveJson(data, PASSIVE_MODIFIERS_DATA_PATH);
            }
            return false;
        }
    }

    var newEntry = get_dynamic_modifier_entry_from_type(modifierType);
    if (!newEntry) {
        return false;
    }

    playerModifiers.push(newEntry);
    data[playerId] = playerModifiers;
    saveJson(data, PASSIVE_MODIFIERS_DATA_PATH);
    return true;
}


/**
 * Checks whether a player currently has a given passive modifier recorded.
 *
 * Data source: `PASSIVE_MODIFIERS_DATA_PATH` (per-player array of entries).
 *
 * @param {IPlayer} player The player whose passive modifier list is checked.
 * @param {string} modifierType Passive modifier type to look for.
 * @returns {boolean} True if the player's data contains an entry with matching `type`.
 */
function player_has_passive_modifier(player, modifierType) {

    var playerModifiers = get_players_passive_modifiers(player);

    for (var i = 0; i < playerModifiers.length; i++) {
        if (playerModifiers[i].type === modifierType) {
            return true;
        }
    }
    return false;
}

function player_has_passive_modifier_with_tag(player, tag) {

    var playerModifiers = get_players_passive_modifiers(player);

    var config_data = loadJson(MODIFIERS_CFG_PATH);

    for (var i = 0; i < playerModifiers.length; i++) {
        var entry = findJsonSubEntry(config_data.passive_modifiers, "type", playerModifiers[i].type);
        if (entry && entry.tags && includes(entry.tags, tag)) {
            return true;
        }
    }
    return false;
}

function get_passive_multiplier_for_tag(player, tag) {

    var playerModifiers = get_players_passive_modifiers(player);

    var config_data = loadJson(MODIFIERS_CFG_PATH);

    var totalMultiplier = 1.0;

    for (var i = 0; i < playerModifiers.length; i++) {
        var entry = findJsonSubEntry(config_data.passive_modifiers, "type", playerModifiers[i].type);
        if (entry && entry.tags && includes(entry.tags, tag)) {
            totalMultiplier += entry.multiplier - 1.0;
        }
    }
    return totalMultiplier;
}

/**
 * Removes any expired passive modifiers from a list.
 *
 * Expiry is computed using the runtime `remainingMs` minus any time since `lastOnlineAt`.
 *
 * @param {IPlayer} player Player whose passive modifiers are cleaned.
 * @param {Array} modifiers Raw runtime entries.
 * @returns {Array} Cleaned runtime entries.
 */
function clean_modifiers(player, modifiers) {

    var normalized = normalize_and_clean_passive_modifiers(player, modifiers);
    return normalized.modifiers;
}

/**
 * Builds a runtime (dynamic) passive modifier record from the configured type.
 *
 * This does not apply any gameplay effect by itself; it only creates the persisted
 * state entry stored in `PASSIVE_MODIFIERS_DATA_PATH`.
 *
 * Data format:
 * - `type`: modifier type
 * - `remainingMs`: milliseconds remaining
 * - `lastOnlineAt`: timestamp (ms) when countdown started, or null when paused/offline
 *
 * @param {string} modifierType The `passive_modifiers[].type` to look up.
 * @returns {{type: string, remainingMs: number, lastOnlineAt: (number|null)}|null} Dynamic entry, or null if not found.
 */
function get_dynamic_modifier_entry_from_type(modifierType) {
    var entry = get_passive_modifier_config_entry(modifierType);
    if (!entry) {
        return null;
    }

    return {
        type: entry.type,
        remainingMs: entry.durationMinutes * 60 * 1000,
        lastOnlineAt: Date.now()
    };
}

/**
 * Retrieves the player's current passive modifier runtime entries.
 *
 * @param {IPlayer} player Player whose saved modifiers are loaded.
 * @returns {Array} Array of runtime entries.
 */
function get_players_passive_modifiers(player) {
    var data = loadJson(PASSIVE_MODIFIERS_DATA_PATH);
    var playerId = player.getUUID();

    if (!data.hasOwnProperty(playerId)) {
        return [];
    }

    var normalized = normalize_and_clean_passive_modifiers(player, data[playerId]);
    if (normalized.changed) {
        data[playerId] = normalized.modifiers;
        saveJson(data, PASSIVE_MODIFIERS_DATA_PATH);
    }
    return normalized.modifiers;
}

/**
 * Persists the full passive modifier list for a given player.
 *
 * @param {IPlayer} player Player whose modifier list is being saved.
 * @param {Array} modifiers Full list of runtime entries to store for this player.
 */
function save_players_passive_modifiers(player, modifiers) {
    var data = loadJson(PASSIVE_MODIFIERS_DATA_PATH);
    var playerId = player.getUUID();
    data[playerId] = modifiers;
    saveJson(data, PASSIVE_MODIFIERS_DATA_PATH);
}

/**
 * Freezes passive modifiers for a player so they don't tick while offline.
 *
 * Collapses time spent online into `remainingMs` and sets `lastOnlineAt = null`.
 *
 * @param {IPlayer} player Player whose passive modifiers are paused.
 */
function freeze_passive_modifiers(player) {
    var nowMs = Date.now();
    var modifiers = get_players_passive_modifiers(player);
    var frozen = [];

    for (var i = 0; i < modifiers.length; i++) {
        var modifier = modifiers[i];
        var remainingMs = get_passive_modifier_remaining_ms(modifier, nowMs);
        if (remainingMs <= 0) {
            continue;
        }

        frozen.push({
            type: modifier.type,
            remainingMs: remainingMs,
            lastOnlineAt: null
        });
    }

    save_players_passive_modifiers(player, frozen);
}

/**
 * Unfreezes passive modifiers for a player.
 *
 * Sets `lastOnlineAt = now` (without subtracting any time), ensuring offline time is never counted.
 *
 * @param {IPlayer} player Player whose passive modifiers are resumed.
 */
function unfreeze_passive_modifiers(player) {
    var nowMs = Date.now();
    var modifiers = get_players_passive_modifiers(player);
    var unfrozen = [];

    for (var i = 0; i < modifiers.length; i++) {
        var modifier = modifiers[i];
        var remainingMs = get_passive_modifier_remaining_ms(modifier, nowMs);
        if (remainingMs <= 0) {
            continue;
        }

        unfrozen.push({
            type: modifier.type,
            remainingMs: remainingMs,
            lastOnlineAt: nowMs
        });
    }

    save_players_passive_modifiers(player, unfrozen);
}

function format_passive_modifier_presentation(player, player_modifier) {
    if (!player_modifier || !player_modifier.type) {
        return ccs("&7(Invalid passive modifier entry)");
    }

    var entry = findJsonSubEntry(loadJson(MODIFIERS_CFG_PATH).passive_modifiers, "type", player_modifier.type);
    if (!entry) {
        return ccs("&7Unknown passive modifier: &f" + player_modifier.type);
    }

    var remainingTimeMs = get_passive_modifier_remaining_ms(player_modifier, Date.now());

    var displayName = parseEmotes(ccs(entry.displayName));
    var remainingStr = formatDurationMs(remainingTimeMs);

    return displayName + ccs(" &8(§7Remaining: §e" + remainingStr + "§8)");
}

/**
 * Formats a duration in milliseconds into a compact human-readable string.
 *
 * Examples:
 * - 65000 -> "1m 5s"
 * - 3600000 -> "1h 0m"
 *
 * @param {number} durationMs Duration in milliseconds.
 * @returns {string} Human-readable duration string.
 */
function formatDurationMs(durationMs) {
    if (durationMs === null || typeof (durationMs) === typeof (undefined)) {
        return "0s";
    }

    if (durationMs < 0) {
        durationMs = 0;
    }

    var totalSeconds = Math.floor(durationMs / 1000);
    var hours = Math.floor(totalSeconds / 3600);
    totalSeconds = totalSeconds % 3600;
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;

    if (hours > 0) {
        return hours + "h " + minutes + "m";
    }

    if (minutes > 0) {
        return minutes + "m " + seconds + "s";
    }

    return seconds + "s";
}

function get_modifier_display_name(modifierType) {
    var entry = findJsonSubEntry(loadJson(MODIFIERS_CFG_PATH).modifiers, "type", modifierType);
    if (entry) {
        return parseEmotes(ccs(entry.displayName));
    } else {
        entry = findJsonSubEntry(loadJson(MODIFIERS_CFG_PATH).passive_modifiers, "type", modifierType);
        if (entry) {
            return parseEmotes(ccs(entry.displayName));
        }
    }
    return ccs("&7Unknown modifier: &f" + modifierType);
}