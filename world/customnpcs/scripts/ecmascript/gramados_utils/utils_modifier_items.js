load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

var MODIFIERS_CFG_PATH = 'world/customnpcs/scripts/ecmascript/modules/modifiers/modifiers_config.json';

function resolve_modifier_value(valueSpec) {
    if (typeof (valueSpec) === 'number') {
        return valueSpec;
    }

    if (valueSpec && typeof (valueSpec) === 'object') {
        if (typeof (valueSpec.min) === 'number' && typeof (valueSpec.max) === 'number') {
            return rrandom_range(valueSpec.min, valueSpec.max);
        }
    }

    return null;
}

function get_modifier_world(context) {
    if (context && typeof (context.getWorld) === 'function') {
        return context.getWorld();
    }

    return context;
}

function normalize_modifier_class(modifierClass) {
    if (modifierClass === 'single-use' || modifierClass === 'single_use' || modifierClass === 'single use') {
        return 'consumable';
    }

    return modifierClass;
}

function get_modifier_config_entry(modifierClass, modifierType, modifierEffect) {
    var configData = loadJson(MODIFIERS_CFG_PATH);
    if (!configData) {
        return null;
    }

    if (modifierClass === 'orb' && modifierType === 'passive') {
        return findJsonEntryArray(configData.passive_effects, 'type', modifierEffect);
    }

    return findJsonEntryArray(configData.active_effects, 'type', modifierEffect);
}

function format_modifier_multiplier(multiplier) {
    if (typeof (multiplier) !== 'number') {
        return null;
    }

    return multiplier.toFixed(2);
}

function create_modifier_item_stack(context, baseStack, modifierSpec) {
    if (!baseStack || baseStack.isEmpty()) {
        return baseStack;
    }

    var world = get_modifier_world(context);
    var configData = loadJson(MODIFIERS_CFG_PATH);
    if (!configData) {
        return baseStack;
    }

    var modifierClass = normalize_modifier_class(modifierSpec.modifierClass || modifierSpec.modifier_class || 'orb');
    var modifierType = modifierSpec.modifierType || modifierSpec.modifier_type || null;
    var modifierEffect = modifierSpec.modifierEffect || modifierSpec.modifier_effect || modifierSpec.type;

    if (modifierClass === 'orb' && !modifierType) {
        modifierType = (modifierSpec.durationMinutes !== undefined || modifierSpec.duration_minutes !== undefined || modifierSpec.multiplier !== undefined)
            ? 'passive'
            : 'active';
    }

    if (modifierClass === 'consumable') {
        modifierType = null;
    }

    var entry = get_modifier_config_entry(modifierClass, modifierType, modifierEffect);
    if (!entry) {
        logToFile('loot_tables', '[modifiers.item] Missing modifier config entry for class=' + modifierClass + ' type=' + modifierType + ' effect=' + modifierEffect);
        return baseStack;
    }

    var stackClone = baseStack.copy();
    var nbt = stackClone.getItemNbt();
    var tag = nbt.getCompound('tag');

    tag.setBoolean('is_modifier', true);
    tag.setString('modifier_class', modifierClass);
    if (modifierType) {
        tag.setString('modifier_type', modifierType);
    }
    tag.setString('modifier_use', modifierSpec.modifierUse || modifierSpec.modifier_use || (modifierClass === 'consumable' ? 'single-use' : 'unlimited-use'));
    tag.setInteger('modifier_repairs', typeof (modifierSpec.modifierRepairs) === 'number' ? modifierSpec.modifierRepairs : 0);
    tag.setBoolean('is_broken', false);
    tag.setString('modifier_effect', modifierEffect);

    var radius = resolve_modifier_value(modifierSpec.radius);
    if (radius === null && typeof (entry.radius) === 'number') {
        radius = entry.radius;
    }
    if (radius !== null) {
        tag.setInteger('modifier_radius', Math.floor(radius));
    }

    var durationMinutes = resolve_modifier_value(modifierSpec.durationMinutes !== undefined ? modifierSpec.durationMinutes : modifierSpec.duration_minutes);
    if (durationMinutes === null && typeof (entry.durationMinutes) === 'number') {
        durationMinutes = entry.durationMinutes;
    }
    if (durationMinutes !== null) {
        tag.setInteger('duration_minutes', Math.floor(durationMinutes));
    }

    var multiplier = resolve_modifier_value(modifierSpec.multiplier);
    if (multiplier === null && typeof (entry.multiplier) === 'number') {
        multiplier = entry.multiplier;
    }
    if (multiplier !== null) {
        tag.setDouble('modifier_multiplier', multiplier);
    }

    nbt.setCompound('tag', tag);

    if (modifierSpec.overrideItemId || modifierSpec.itemId || modifierSpec.item_id) {
        nbt.setString('id', modifierSpec.overrideItemId || modifierSpec.itemId || modifierSpec.item_id);
    } else if (modifierClass !== 'consumable' && configData.items && configData.items.itemId) {
        nbt.setString('id', configData.items.itemId);
    }

    var newItem = world.createItemFromNbt(nbt);

    if (entry.displayName) {
        var displayName = parseEmotes(ccs(entry.displayName));
        if (modifierClass === 'consumable') {
            displayName = parseEmotes(ccs(entry.displayName + ' &8[Consumable]'));
        }
        newItem.setCustomName(displayName);
    }

    var lore = [];
    if (entry.description) {
        lore.push(parseEmotes(ccs(entry.description)));
    }

    if (radius !== null) {
        lore.push(ccs('&7Radius: &e' + Math.floor(radius) + ' blocks'));
    }

    if (durationMinutes !== null) {
        lore.push(ccs('&7Duration: &e' + Math.floor(durationMinutes) + ' minutes'));
    }

    if (multiplier !== null) {
        lore.push(ccs('&7Multiplier: &e' + format_modifier_multiplier(multiplier) + 'x'));
    }

    if (modifierClass === 'consumable') {
        lore.push(ccs('&8Single-use item'));
    }

    if (lore.length > 0) {
        newItem.setLore(lore);
    }

    if (modifierClass === 'orb' && entry.colorCode !== undefined) {
        newItem.setItemDamage(entry.colorCode);
    }

    return newItem;
}