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

// Compatibility entry points for event scripts; generated items use the common model.
function instanciate_active_modifier(player, stack, effect) {
    return modifier_create_legacy_preset(player, stack, effect, 'break');
}

function instanciate_passive_modifier(player, stack, effect) {
    return modifier_create_legacy_preset(player, stack, effect, 'break');
}

function instanciate_consumable_modifier(player, stack, effect) {
    var alias = get_modifier_legacy_entry(effect);
    var canonical = alias ? alias.effect : effect;
    var entry = get_modifier_config_entry(canonical);
    var radius = alias && alias.radius !== undefined ? alias.radius : entry.radius;
    return create_modifier_item_stack(player.getWorld(), stack, {
        type: canonical, onDepletion: 'disappear',
        radius: {min: Math.ceil(radius * 0.5), max: Math.floor(radius * 1.5)}
    });
}

function modifier_create_legacy_preset(player, stack, effect, action) {
    var alias = get_modifier_legacy_entry(effect);
    var spec = {type: alias ? alias.effect : effect, onDepletion: action};
    if (alias) {
        for (var key in alias) {
            if (alias.hasOwnProperty(key) && key !== 'effect') spec[key] = alias[key];
        }
    }
    return create_modifier_item_stack(player.getWorld(), stack, spec);
}

function is_modifier(stack) {
    if (!stack || stack.isEmpty()) return false;
    var nbt = stack.getItemNbt();
    if (!nbt.has('tag')) return false;
    var tag = nbt.getCompound('tag');
    return tag.getBoolean('is_modifier') && tag.getString('modifier_class') !== 'key';
}

function is_old_modifier(stack) {
    if (!stack || stack.isEmpty()) return false;
    var tag = stack.getItemNbt().getCompound('tag');
    if (tag.getString('modifier_class') === 'key') return false;
    return (tag.has('is_modifier') || tag.has('is_passive_modifier')) && !tag.has('modifier_uses_before_depletion');
}

// Convert once on interaction. Preserve rolled parameters, ownership and carrier metadata.
function update_old_modifier_to_new(stack, player) {
    if (!is_old_modifier(stack)) return stack;
    var nbt = stack.getItemNbt();
    var tag = nbt.getCompound('tag');
    var effect = tag.has('modifier_effect') ? tag.getString('modifier_effect') :
        (tag.has('passive_modifier_type') ? tag.getString('passive_modifier_type') : tag.getString('modifier_type'));
    var alias = get_modifier_legacy_entry(effect);
    var canonical = alias ? alias.effect : effect;
    var depleted = tag.has('is_broken') ? tag.getBoolean('is_broken') :
        !(tag.has('is_passive_modifier') ? tag.getBoolean('is_passive_modifier') : tag.getBoolean('is_modifier'));
    var spec = {type: canonical, usesBeforeDepletion: 0,
        onDepletion: tag.getString('modifier_class') === 'consumable' ? 'disappear' : 'break'};
    var fields = {radius: 'modifier_radius', durationMinutes: 'duration_minutes', multiplier: 'modifier_multiplier'};
    for (var key in fields) {
        if (!fields.hasOwnProperty(key)) continue;
        if (tag.has(fields[key])) spec[key] = tag.getDouble(fields[key]);
        else if (alias && alias[key] !== undefined) spec[key] = alias[key];
    }
    var config = loadJson(MODIFIERS_CFG_PATH);
    if (depleted && spec.onDepletion === 'break') spec.itemId = config.items.itemId;
    var repairs = tag.has('modifier_repairs') ? tag.getInteger('modifier_repairs') : tag.getInteger('repairs');
    var converted = create_modifier_item_stack(player.getWorld(), stack, spec);
    var convertedNbt = converted.getItemNbt();
    var convertedTag = convertedNbt.getCompound('tag');
    convertedTag.setInteger('modifier_repairs', repairs);
    convertedTag.setBoolean('modifier_depleted', depleted);
    if (depleted) convertedNbt.setString('id', nbt.getString('id'));
    convertedNbt.setCompound('tag', convertedTag);
    return refresh_modifier_presentation(player.getWorld().createItemFromNbt(convertedNbt));
}

function repair_modifier_item(player, stack) {
    if (!is_modifier(stack)) return stack;
    var nbt = stack.copy().getItemNbt();
    var tag = nbt.getCompound('tag');
    if (!tag.getBoolean('modifier_depleted') || tag.getString('modifier_on_depletion') !== 'break') return stack;
    tag.setBoolean('modifier_depleted', false);
    tag.setInteger('modifier_uses_before_depletion', tag.getInteger('modifier_initial_uses_before_depletion'));
    tag.setInteger('modifier_repairs', tag.getInteger('modifier_repairs') + 1);
    nbt.setString('id', tag.getString('modifier_ready_item_id'));
    nbt.setShort('Damage', tag.getInteger('modifier_ready_item_damage'));
    nbt.setCompound('tag', tag);
    // Keep last-used timestamp: recharging does not bypass cooldown.
    return refresh_modifier_presentation(player.getWorld().createItemFromNbt(nbt));
}

/**
 * Applies an active modifier effect to the world around the player.
 *
 * The effect dispatched depends on `modifierEffect` and is applied within `radius`.
 * Most crop/farmland actions delegate to `utils_farm_crops`.
 *
 * @param {IPlayer} player The player used as the center point for the effect.
 * @param {string} modifierEffect Modifier `type` string (as configured in `modifiers_config.json`).
 * @param {number} radius Effect radius in blocks.
 * @returns {boolean} Whether the effect changed the world.
 */
function apply_active_modifier_type(player, modifierEffect, radius) {

    var world = player.getWorld();
    var pos = player.getPos();

    switch (modifierEffect) {
        case "cattle_pregnancy":
            return makeFieldCattlePregnant(player, radius).changed > 0;
        case "cattle_gestation":
            return skipGestationForFieldCattle(player, radius).changed > 0;
        case "cattle_milk_production":
            return setFieldCowsHasKids(player, radius).changed > 0;
        case "cattle_baby_grow":
            return growFieldCalvesToAdults(player, radius).changed > 0;
        case "farmland_fertilize":
            return farmCrops.fertilize_farmland_sphere(world, pos, radius) > 0;
        case "farmland_tilt":
            return farmCrops.tillSurfaceToFarmland(world, pos, radius, true) > 0;
        case "crop_harvest":
            return farmCrops.harvestCropsBreak(world, pos, radius) > 0;
        case "crop_harvest_and_plant":
            return farmCrops.harvestCropsBreakAndReset(world, pos, radius) > 0;
        case "crop_growth_random":
            return farmCrops.randomGrowCrops(world, pos, radius) > 0;
        case "crop_growth_max":
            return farmCrops.growCropsToMax(world, pos, radius) > 0;
        case "crop_rot_random":
            return farmCrops.randomLowerCrops(world, pos, radius) > 0;
        case "crop_rot_max":
            return farmCrops.resetCropsToZero(world, pos, radius) > 0;
        case "fruit_growth_max":
            return farmFruits.growFruitsToMax(world, pos, radius) > 0;
        case "fruit_rot_max":
            return farmFruits.resetFruitsToZero(world, pos, radius) > 0;
        case "npc_pickpocket":
            return pickpocket.pickpocket_npcs_in_radius(player, radius).affected > 0;
        case "nature_grass":
            var grass = nature.grow_grass_and_flowers(world, pos, radius);
            return grass.converted + grass.planted > 0;
        case "nature_flowers":
            return nature.spawn_flower_pattern(world, pos, radius) > 0;
        case "crop_plant_mixed":
            return farmCrops.plantMixedCropsOnFarmland(world, pos, radius) > 0;
        case "fish_swarm":
            playFishRainSpawnEffects(player);
            return spawnFishSwarm(player, radius, 5) > 0;
        case "fish_catch_nearby":
            return catchNearbyFishSwarm(player, radius) > 0;
    }
}


function get_passive_modifier_remaining_ms(player_modifier, nowMs) {
    if (player_modifier.lastOnlineAt === null) return player_modifier.remainingMs;
    return player_modifier.remainingMs - (nowMs - player_modifier.lastOnlineAt);
}

function normalize_and_clean_passive_modifiers(player, modifiers) {
    var nowMs = Date.now();
    var cleaned = [];
    var changed = false;

    for (var i = 0; i < modifiers.length; i++) {
        var raw = modifiers[i];
        if (raw.lastOnlineAt === undefined) {
            raw.lastOnlineAt = null;
            changed = true;
        }

        var alias = get_modifier_legacy_entry(raw.type);
        if (alias) {
            raw.type = alias.effect;
            if (raw.multiplier === undefined) raw.multiplier = alias.multiplier;
            if (raw.radius === undefined) raw.radius = alias.radius;
            if (raw.durationMinutes === undefined) raw.durationMinutes = alias.durationMinutes;
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
 * @param {string} modifierType Modifier type (must resolve to a timed effect).
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

    for (var i = 0; i < playerModifiers.length; i++) {
        var entry = get_modifier_config_entry(playerModifiers[i].type);
        if (includes(entry.tags, tag)) {
            return true;
        }
    }
    return false;
}

function get_passive_multiplier_for_tag(player, tag) {

    var playerModifiers = get_players_passive_modifiers(player);

    var totalMultiplier = 1.0;

    for (var i = 0; i < playerModifiers.length; i++) {
        var entry = get_modifier_config_entry(playerModifiers[i].type);
        if (includes(entry.tags, tag)) {
            var multiplier = playerModifiers[i].multiplier;
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
 * @param {string} modifierType The canonical timed effect ID to look up.
 * @returns {{type: string, remainingMs: number, lastOnlineAt: (number|null)}} Dynamic entry.
 */
function get_dynamic_modifier_entry_from_type(modifierType, modifierData) {
    var entry = get_modifier_config_entry(modifierType);
    var durationMinutes = modifierData.durationMinutes === undefined ? entry.durationMinutes : modifierData.durationMinutes;
    var multiplier = modifierData.multiplier === undefined ? entry.multiplier : modifierData.multiplier;
    var radius = modifierData.radius === undefined ? entry.radius : modifierData.radius;

    return {
        type: entry.type,
        durationMinutes: durationMinutes,
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
            durationMinutes: modifier.durationMinutes,
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
            durationMinutes: modifier.durationMinutes,
            remainingMs: remainingMs,
            lastOnlineAt: nowMs,
            multiplier: modifier.multiplier,
            radius: modifier.radius
        });
    }

    save_players_passive_modifiers(player, unfrozen);
}

function format_passive_modifier_presentation(player, player_modifier) {
    var entry = get_modifier_config_entry(player_modifier.type);
    var remainingTimeMs = get_passive_modifier_remaining_ms(player_modifier, Date.now());

    var displayName = parseEmotes(ccs(resolve_modifier_presentation(entry.displayName, player_modifier)));
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

function get_modifier_display_name(effect, values) {
    var entry = get_modifier_config_entry(effect);
    return parseEmotes(ccs(resolve_modifier_presentation(entry.displayName, values)));
}
