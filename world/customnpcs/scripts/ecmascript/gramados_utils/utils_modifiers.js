load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_crops.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_fruits.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_animania.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_pickpocket.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_nature.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_modifier_items.js");
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/events/aprilFools/2026/fishSwarm.js");

var farmCrops = exports_utils_farm_crops;
var farmFruits = exports_utils_farm_fruits;
var pickpocket = exports_utils_pickpocket;
var nature = exports_utils_nature;
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
 * @param {string} modifierEffect Modifier `type` to resolve from `modifiers_config.json`.
 * @returns {IItemStack} A new item stack representing the configured modifier.
 */
function instanciate_active_modifier(player, stack, modifierEffect) {
    var config_data = loadJson(MODIFIERS_CFG_PATH);
    var cfg = config_data.items;
    return create_modifier_item_stack(player, stack, {
        modifierClass: "orb",
        modifierType: "active",
        modifierEffect: modifierEffect,
        overrideItemId: cfg.itemId
    });
}

/**
 * Creates a passive modifier orb item from a base stack.
 *
 * Passive modifier orbs do not apply a world effect directly.
 * They are consumed by the modifier engine to add a runtime entry in
 * `PASSIVE_MODIFIERS_DATA_PATH` via `apply_passive_modifier_type`.
 *
 * The passive modifier metadata is stored in the item NBT under `tag`:
 * - `is_modifier` (boolean): marker for modifier items
 * - `modifier_type` (string): the configured modifier type
 *
 * Configuration source:
 * - `items.itemId` (replaces the item id)
 * - `passive_modifiers[]` entry matching `modifierType`
 *
 * @param {IPlayer} player Player used for world/NBT creation and debug output.
 * @param {IItemStack} stack Base item stack to clone and convert.
 * @param {string} modifierEffect Passive modifier `type` to resolve from `modifiers_config.json`.
 * @returns {IItemStack} A new item stack representing the configured passive modifier orb.
 */
function instanciate_passive_modifier(player, stack, modifierEffect) {
    var config_data = loadJson(MODIFIERS_CFG_PATH);
    var cfg = config_data.items;
    return create_modifier_item_stack(player, stack, {
        modifierClass: "orb",
        modifierType: "passive",
        modifierEffect: modifierEffect,
        overrideItemId: cfg.itemId
    });
}

/**
 * Creates a consumable modifier item from a base stack.
 *
 * Consumable modifiers apply an effect to any item type and are deleted after use.
 * Unlike orbs, consumables do not have a "broken" or "recharged" state.
 *
 * The consumable modifier metadata is stored in the item NBT under `tag`:
 * - `is_modifier` (boolean): marker for modifier items
 * - `modifier_class` (string): "consumable"
 * - `modifier_use` (string): "single-use"
 * - `modifier_effect` (string): the configured effect type
 * - `modifier_radius` (int): radius to apply the effect
 *
 * Configuration source:
 * - Base item can be any item (the item is what the player holds)
 * - `active_effects[]` entry matching `modifierEffect` (consumables use active effect definitions)
 *
 * @param {IPlayer} player Player used for world/NBT creation and debug output.
 * @param {IItemStack} stack Base item stack to clone and convert (the carrier item).
 * @param {string} modifierEffect Active effect `type` to resolve from `modifiers_config.json`.
 * @returns {IItemStack} A new item stack representing the configured consumable modifier.
 */
function instanciate_consumable_modifier(player, stack, modifierEffect) {
    var config_data = loadJson(MODIFIERS_CFG_PATH);
    var entry = findJsonEntryArray(config_data.active_effects, "type", modifierEffect);
    var size = rrandom_range(entry.radius * 0.5, entry.radius * 1.5)

    return create_modifier_item_stack(player, stack, {
        modifierClass: "consumable",
        modifierEffect: modifierEffect,
        radius: size
    });
}

/**
 * Checks whether an item stack contains this module's modifier marker.
 *
 * Note: This only checks for presence of `tag.is_modifier`, not whether it is active.
 * Use `is_modifier_active` to check if the orb is currently usable.
 *
 * @param {IItemStack} stack Item stack to inspect.
 * @returns {boolean} True if the stack has a `tag.is_modifier` key.
 */
function is_modifier_active(stack) {

    if (!is_modifier(stack)) {
        return false;
    }

    var nbt = stack.getItemNbt();
    var compound = nbt.getCompound("tag");

    return compound.getString("modifier_type") === "active";
}

/**
 * Checks whether an item stack contains this module's passive modifier marker.
 *
 * @param {IItemStack} stack Item stack to inspect.
 * @returns {boolean} True if `tag.modifier_type` is `passive`.
 */
function is_modifier_passive(stack) {
    
    if (!is_modifier(stack)) {
        return false;
    }

    var nbt = stack.getItemNbt();
    var compound = nbt.getCompound("tag");

    return compound.getString("modifier_type") === "passive";
}

function is_modifier_an_orb(stack) {
    if (!is_modifier(stack)) {
        return false;
    }

    var nbt = stack.getItemNbt();
    var compound = nbt.getCompound("tag");

    return compound.getString("modifier_class") === "orb";
}

function is_modifier(stack) {
    var nbt = stack.getItemNbt();
    if (stack.isEmpty()) {
        return false;
    }

    if (!nbt.has("tag")) {
        return false;
    }

    var compound = nbt.getCompound("tag");
    return compound.has("is_modifier");
}

function is_old_modifier(stack) {
    if (!stack || stack.isEmpty()) {
        return false;
    }

    var nbt = stack.getItemNbt();
    if (!nbt.has("tag")) {
        return false;
    }

    var compound = nbt.getCompound("tag");
    var has_a_modifier_tag = compound.has("is_passive_modifier") || compound.has("is_modifier");
    var has_a_modifier_class = get_modifier_class(stack) !== null;
    return has_a_modifier_tag && !has_a_modifier_class;
}

function get_modifier_class(stack) {
    if (!is_modifier(stack)) {
        return null;
    }

    var nbt = stack.getItemNbt();
    var compound = nbt.getCompound("tag");

    if (compound.has("modifier_class")) {
        return compound.getString("modifier_class");
    }
    return null;
}

function update_old_modifier_to_new(stack, player) {
    if (!is_old_modifier(stack)) {
        return stack;
    }

    var nbt = stack.getItemNbt();
    var tag = nbt.getCompound("tag");
    var legacyEffect = null;

    if (tag.has("modifier_type")) {
        legacyEffect = tag.getString("modifier_type");
    } else if (tag.has("passive_modifier_type")) {
        legacyEffect = tag.getString("passive_modifier_type");
    }

    if (tag.has("is_modifier")) {
        tag.setString("modifier_type", "active");
        tag.setBoolean("is_broken", !tag.getBoolean("is_modifier"));
    } else if (tag.has("is_passive_modifier")) {
        tag.setString("modifier_type", "passive");
        tag.setBoolean("is_broken", !tag.getBoolean("is_passive_modifier"));
    } else {
        return stack;
    }

    if (legacyEffect !== null) {
        tag.setString("modifier_effect", legacyEffect);
    }

    if (tag.has("repairs")) {
        tag.setInteger("modifier_repairs", tag.getInteger("repairs"));
    } else {
        tag.setInteger("modifier_repairs", 0);
    }

    tag.setString("modifier_class", "orb");
    tag.setString("modifier_use", "unlimited-use");
    tag.setBoolean("is_modifier", true);
    nbt.setCompound("tag", tag);

    var world = player.getWorld();
    var newItem = world.createItemFromNbt(nbt);
    return newItem;
}


/**
 * "Repairs" a used modifier orb back into an active modifier orb.
 *
 * Side effects on NBT:
 * - sets `tag.is_broken` to false
 * - increments `tag.modifier_repairs` (used to compute future recharge costs)
 * - replaces item id with `items.itemId`
 *
 * @param {IPlayer} player Player used for world/NBT creation and debug output.
 * 
 * @param {IItemStack} stack The existing modifier item stack to repair (will be cloned).
 * @returns {IItemStack} A new item stack representing the repaired modifier.
 */
function repair_modifier_item(player, stack) {

    if (!is_modifier(stack)) {
        return stack;
    }

    var nbt = stack.getItemNbt();
    var tag = nbt.getCompound("tag");

    if (!tag.getBoolean("is_broken")) {
        return stack;
    }

    tag.setBoolean("is_broken", false);

    var json_data = loadJson(MODIFIERS_CFG_PATH)

    var repair_count = tag.getInteger("modifier_repairs");

    tag.setInteger("modifier_repairs", repair_count + 1);

    nbt.setCompound("tag", tag);

    if (is_modifier_an_orb(stack)) {
        nbt.setString("id", json_data.items.itemId);
    }

    var newItem = player.getWorld().createItemFromNbt(nbt);
    var itemName = get_modifier_display_name(tag.getString("modifier_effect"));

    newItem.setCustomName(itemName);

    return newItem;
}


/**
 * Applies an active modifier effect to the world around the player.
 *
 * The effect dispatched depends on `modifierType` and is applied within `radius`.
 * Most crop/farmland actions delegate to `utils_farm_crops`.
 *
 * @param {IPlayer} player The player used as the center point for the effect.
 * @param {string} modifierEffect Modifier `type` string (as configured in `modifiers_config.json`).
 * @param {number} radius Effect radius in blocks.
 * @returns {*} The underlying handler's return value, or null if `modifierType` is unknown.
 */
function apply_active_modifier_type(player, modifierEffect, radius) {

    var world = player.getWorld();
    var pos = player.getPos();

    switch (modifierEffect) {
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
        case "fruit growth max":
            return farmFruits.growFruitsToMax(world, pos, radius);
        case "fruit rot max":
            return farmFruits.resetFruitsToZero(world, pos, radius);
        case "npc pickpocket small":
            return pickpocket.pickpocket_npcs_in_radius(player, radius);
        case "npc pickpocket large":
            return pickpocket.pickpocket_npcs_in_radius(player, radius);
        case "nature grass small":
            return nature.grow_grass_and_flowers(world, pos, radius);
        case "nature grass medium":
            return nature.grow_grass_and_flowers(world, pos, radius);
        case "nature grass large":
            return nature.grow_grass_and_flowers(world, pos, radius);
        case "nature flowers small":
            return nature.spawn_flower_pattern(world, pos, radius);
        case "nature flowers medium":
            return nature.spawn_flower_pattern(world, pos, radius);
        case "crop plant mixed small":
            return farmCrops.plantMixedCropsOnFarmland(world, pos, radius);
        case "crop plant mixed large":
            return farmCrops.plantMixedCropsOnFarmland(world, pos, radius);
        case "fish swarm":
            playFishRainSpawnEffects(player);
            return spawnFishSwarm(player, radius, 5);
        case "fish catch nearby":
            return catchNearbyFishSwarm(player, radius);
        default:
            return null;
    }
}


function get_passive_modifier_config_entry(modifierType) {
    return findJsonEntryArray(loadJson(MODIFIERS_CFG_PATH).passive_effects, "type", modifierType);
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
function apply_passive_modifier_type(player, modifierType, modifierData) {
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

    var newEntry = get_dynamic_modifier_entry_from_type(modifierType, modifierData);
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
        var entry = findJsonEntryArray(config_data.passive_effects, "type", playerModifiers[i].type);
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
        var entry = findJsonEntryArray(config_data.passive_effects, "type", playerModifiers[i].type);
        if (entry && entry.tags && includes(entry.tags, tag)) {
            var multiplier = (typeof (playerModifiers[i].multiplier) === "number") ? playerModifiers[i].multiplier : entry.multiplier;
            if (typeof (multiplier) !== "number") {
                multiplier = 1.0;
            }
            totalMultiplier += multiplier - 1.0;
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
function get_dynamic_modifier_entry_from_type(modifierType, modifierData) {
    var entry = get_passive_modifier_config_entry(modifierType);
    if (!entry) {
        return null;
    }

    var durationMinutes = entry.durationMinutes;
    var multiplier = entry.multiplier;
    var radius = entry.radius;

    if (modifierData) {
        if (typeof (modifierData.durationMinutes) === "number") {
            durationMinutes = modifierData.durationMinutes;
        }
        if (typeof (modifierData.multiplier) === "number") {
            multiplier = modifierData.multiplier;
        }
        if (typeof (modifierData.radius) === "number") {
            radius = modifierData.radius;
        }
    }

    if (typeof (durationMinutes) !== "number") {
        durationMinutes = 0;
    }

    return {
        type: entry.type,
        remainingMs: durationMinutes * 60 * 1000,
        lastOnlineAt: Date.now(),
        multiplier: multiplier,
        radius: radius
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
            lastOnlineAt: null,
            multiplier: modifier.multiplier,
            radius: modifier.radius
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
            lastOnlineAt: nowMs,
            multiplier: modifier.multiplier,
            radius: modifier.radius
        });
    }

    save_players_passive_modifiers(player, unfrozen);
}

function format_passive_modifier_presentation(player, player_modifier) {
    if (!player_modifier || !player_modifier.type) {
        return ccs("&7(Invalid passive modifier entry)");
    }

    var entry = findJsonEntryArray(loadJson(MODIFIERS_CFG_PATH).passive_effects, "type", player_modifier.type);
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
    var entry = findJsonEntryArray(loadJson(MODIFIERS_CFG_PATH).active_effects, "type", modifierType);
    if (entry) {
        if (entry.displayName) {
            return parseEmotes(ccs(entry.displayName));
        }
        return ccs("&f" + modifierType);
    } else {
        entry = findJsonEntryArray(loadJson(MODIFIERS_CFG_PATH).passive_effects, "type", modifierType);
        if (entry) {
            if (entry.displayName) {
                return parseEmotes(ccs(entry.displayName));
            }
            return ccs("&f" + modifierType);
        }
    }
    return ccs("&7Unknown modifier: &f" + modifierType);
}