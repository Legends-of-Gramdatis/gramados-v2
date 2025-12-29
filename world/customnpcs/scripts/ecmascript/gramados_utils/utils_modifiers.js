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
function instanciate_modifier(player, stack, modifierType) {
    var stackClone = stack.copy();
    var nbt = stackClone.getItemNbt();
    var tag = nbt.getCompound("tag");
    tag.setBoolean("is_modifier", true);

    var config_data = loadJson(MODIFIERS_CFG_PATH);
    var cfg = config_data.items;
    var entry = findJsonSubEntry(config_data.modifiers, "type", modifierType);
    tellPlayer(player, "§e:recycle: Debug: Entry for modifier type '" + modifierType + "': " + JSON.stringify(entry));

    var resolvedType = modifierType;
    if (resolvedType) {
        tag.setString("modifier_type", "" + resolvedType);
        tag.setInteger("modifier_radius", entry.radius);
    }

    nbt.setCompound("tag", tag);
    nbt.setString("id", cfg.itemId);

    var newItem = player.getWorld().createItemFromNbt(nbt);

    newItem.setCustomName(parseEmotes(ccs(entry.displayName)));
    newItem.setLore([parseEmotes(ccs(entry.description)), ccs("&7Radius: &e" + entry.radius + " blocks")]);
    newItem.setItemDamage(entry.colorCode);

    return newItem;
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
    tag.setBoolean("is_modifier", true);

    var json_data = loadJson(MODIFIERS_CFG_PATH)

    var repair_count = tag.getInteger("repairs") || 0;

    tag.setInteger("repairs", repair_count + 1);

    nbt.setCompound("tag", tag);
    nbt.setString("id", json_data.items.itemId);

    var newItem = player.getWorld().createItemFromNbt(nbt);

    
    var entry = findJsonSubEntry(json_data.modifiers, "type", tag.getString("modifier_type"));
    tellPlayer(player, "§e:recycle: Debug: Repairing modifier item of type '" + tag.getString("modifier_type") + "': " + JSON.stringify(entry));
    newItem.setCustomName(parseEmotes(ccs(entry.displayName)));

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
function has_item_modifier_tag(stack) {
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
 * Checks whether an item is an active (usable) modifier item.
 *
 * Active means `tag.is_modifier === true`.
 * Used/depleted modifiers should have the marker but with `is_modifier === false`.
 *
 * @param {IItemStack} stack Item stack to inspect.
 * @returns {boolean} True if the modifier marker exists and is active.
 */
function is_active_modifier_item(stack) {
    if (has_item_modifier_tag(stack)) {
        var nbt = stack.getItemNbt();
        var compound = nbt.getCompound("tag");
        return compound.getBoolean("is_modifier");
    }
    return false;
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
function apply_modifier_type(player, modifierType, radius) {

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

/**
 * Checks whether a player currently has a given passive modifier recorded.
 *
 * Data source: `PASSIVE_MODIFIERS_DATA_PATH` (per-player array of entries).
 *
 * @param {IPlayer} player The player whose passive modifier list is checked.
 * @param {string} modifierType Passive modifier type to look for.
 * @returns {boolean} True if the player's data contains an entry with matching `type`.
 */
function has_passive_modifier(player, modifierType) {

    var playerModifiers = get_players_passive_modifiers(player);

    for (var i = 0; i < playerModifiers.length; i++) {
        if (playerModifiers[i].type === modifierType) {
            return true;
        }
    }
    return false;
}

function has_passive_modifier_with_tag(player, tag) {

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

/**
 * Adds a passive modifier to a player (if not already present).
 *
 * The stored entry is a dynamic runtime record containing at least:
 * - `type`: modifier type
 * - `start`: timestamp (ms) when the modifier began
 * - `pause`: timestamp (ms) when the modifier was last paused/frozen
 *
 * The duration itself is configured in `modifiers_config.json` under `passive_modifiers[].durationMinutes`.
 *
 * @param {IPlayer} player Player receiving the passive modifier.
 * @param {string} modifierType Modifier type (must exist in `passive_modifiers`).
 * @returns {boolean} True if a new modifier entry was added, false otherwise.
 */
function add_passive_modifier(player, modifierType) {
    var data = loadJson(PASSIVE_MODIFIERS_DATA_PATH);
    var playerId = player.getUniqueId();

    if (!data.hasOwnProperty(playerId)) {
        data[playerId] = [];
    }
    var playerModifiers = data[playerId];

    if (!has_passive_modifier(player, modifierType)) {
        var newEntry = get_dynamic_modifier_entry_from_type(modifierType);
        if (newEntry) {
            playerModifiers.push(newEntry);
            saveJson(PASSIVE_MODIFIERS_DATA_PATH, data);
            return true;
        }
    }
    return false;
}

/**
 * Removes any expired passive modifiers for a player.
 *
 * Expiry is computed using:
 * - runtime entry: `start`
 * - config entry: `passive_modifiers[].durationMinutes`
 *
 * When expired, the entry is omitted from the saved list.
 *
 * @param {IPlayer} player Player whose passive modifiers are cleaned.
 */
function clean_modifiers(player, modifiers) {

    var currentTime = Date.now();
    var activeModifiers = [];

    for (var i = 0; i < modifiers.length; i++) {
        var modifier = modifiers[i];
        var elapsedTime = currentTime - modifier.start;

        var entry = findJsonSubEntry(loadJson(MODIFIERS_CFG_PATH).passive_modifiers, "type", modifier.type);
        if (entry) {
            var durationMs = entry.durationMinutes * 60 * 1000;
            if (elapsedTime < durationMs) {
                activeModifiers.push(modifier);
            } else {
                tellPlayer(player, "§e:recycle: Debug: Passive modifier '" + modifier.type + "' has expired and will be removed.");
            }
        }
    }

    return activeModifiers;
}

/**
 * Builds a runtime (dynamic) passive modifier record from the configured type.
 *
 * This does not apply any gameplay effect by itself; it only creates the persisted
 * state entry stored in `PASSIVE_MODIFIERS_DATA_PATH`.
 *
 * @param {string} modifierType The `passive_modifiers[].type` to look up.
 * @returns {{type: string, start: number, pause: number}|null} Dynamic entry, or null if not found.
 */
function get_dynamic_modifier_entry_from_type(modifierType) {
    var data = loadJson(MODIFIERS_CFG_PATH);
    for (var i = 0; i < data.passive_modifiers.length; i++) {
        var entry = data.passive_modifiers[i];
        if (entry.type === modifierType) {
            return {
                type: entry.type,
                start: Date.now(),
                pause: Date.now()
            };
        }
    }
    return null;
}

/**
 * Retrieves the player's current passive modifier runtime entries.
 *
 * @param {IPlayer} player Player whose saved modifiers are loaded.
 * @returns {Array} Array of runtime entries (each includes `type`, `start`, `pause`).
 */
function get_players_passive_modifiers(player) {
    var data = loadJson(PASSIVE_MODIFIERS_DATA_PATH);
    var playerId = player.getUniqueId();

    if (!data.hasOwnProperty(playerId)) {
        return [];
    }

    return clean_modifiers(player, data[playerId]);
}

/**
 * Persists the full passive modifier list for a given player.
 *
 * @param {IPlayer} player Player whose modifier list is being saved.
 * @param {Array} modifiers Full list of runtime entries to store for this player.
 */
function save_players_passive_modifiers(player, modifiers) {
    var data = loadJson(PASSIVE_MODIFIERS_DATA_PATH);
    var playerId = player.getUniqueId();
    data[playerId] = modifiers;
    saveJson(PASSIVE_MODIFIERS_DATA_PATH, data);
}

/**
 * Freezes passive modifiers for a player by recording a pause timestamp.
 *
 * This is intended for situations where the timer should not tick (e.g. player is offline,
 * in a protected state, etc.). `unfreeze_passive_modifiers` compensates `start` accordingly.
 *
 * @param {IPlayer} player Player whose passive modifiers are paused.
 */
function freeze_passive_modifiers(player) {
    var modifiers = get_players_passive_modifiers(player);

    for (var i = 0; i < modifiers.length; i++) {
        modifiers[i].pause = Date.now();
    }

    save_players_passive_modifiers(player, modifiers);
}

/**
 * Unfreezes passive modifiers for a player.
 *
 * Computes how long the modifier was paused (`now - pause`) and shifts `start` forward
 * by that amount so that total active time remains unchanged.
 *
 * @param {IPlayer} player Player whose passive modifiers are resumed.
 */
function unfreeze_passive_modifiers(player) {
    var modifiers = get_players_passive_modifiers(player);

    for (var i = 0; i < modifiers.length; i++) {
        var pausedDuration = Date.now() - modifiers[i].pause;
        modifiers[i].start += pausedDuration;
        modifiers[i].pause = Date.now();
    }

    save_players_passive_modifiers(player, modifiers);
}
