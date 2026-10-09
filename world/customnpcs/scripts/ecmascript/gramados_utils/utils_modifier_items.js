load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');

var MODIFIERS_CFG_PATH = 'world/customnpcs/scripts/ecmascript/modules/modifiers/modifiers_config.json';
var MODIFIERS_LEGACY_PATH = 'world/customnpcs/scripts/ecmascript/modules/modifiers/modifiers_legacy.json';

// Loot-table values are either numbers or configured min/max ranges.
function resolve_modifier_value(valueSpec, integer) {
    if (typeof valueSpec === 'object') {
        return integer ? rrandom_range(valueSpec.min, valueSpec.max) : random_range(valueSpec.min, valueSpec.max);
    }
    return valueSpec;
}

function get_modifier_config_entry(effect) {
    var config = loadJson(MODIFIERS_CFG_PATH);
    return findJsonEntryArray(config.effects, 'type', effect);
}

function get_modifier_legacy_entry(effect) {
    var legacy = loadJson(MODIFIERS_LEGACY_PATH);
    return legacy[effect];
}

// Fixed presentation uses a string; conditional presentation uses ordered rules.
function resolve_modifier_presentation(rules, values) {
    if (typeof rules === 'string') return rules;
    for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        var matches = true;
        for (var key in rule.when) {
            for (var operator in rule.when[key]) {
                if (!compare_values(values[key], rule.when[key][operator], operator)) {
                    matches = false;
                    break;
                }
            }
            if (!matches) break;
        }
        if (matches) return rule.value;
    }
}

function get_modifier_item_values(tag) {
    var values = {};
    var fields = {radius: 'modifier_radius', durationMinutes: 'modifier_duration_minutes', multiplier: 'modifier_multiplier',
        usesBeforeDepletion: 'modifier_uses_before_depletion', cooldownSeconds: 'modifier_cooldown_seconds'};
    for (var key in fields) {
        if (tag.has(fields[key])) values[key] = tag.getDouble(fields[key]);
    }
    return values;
}

function refresh_modifier_presentation(item) {
    var tag = item.getItemNbt().getCompound('tag');
    var effect = tag.getString('modifier_effect');
    var entry = get_modifier_config_entry(effect);
    var values = get_modifier_item_values(tag);
    var depleted = tag.getBoolean('modifier_depleted');
    var name = resolve_modifier_presentation(entry.displayName, values);
    item.setCustomName(parseEmotes(ccs(name + (depleted ? ' &8(Depleted)' : ''))));
    var lore = [];
    var description = resolve_modifier_presentation(entry.description, values);
    if (description) lore.push(parseEmotes(ccs(description)));
    if (values.radius !== undefined) lore.push(ccs('&7Radius: &e' + values.radius + ' blocks'));
    if (values.durationMinutes !== undefined) lore.push(ccs('&7Duration: &e' + values.durationMinutes + ' online minutes'));
    if (values.multiplier !== undefined) lore.push(ccs('&7Multiplier: &e' + values.multiplier.toFixed(2) + 'x'));
    lore.push(ccs('&7Uses remaining: &e' + (depleted ? 0 : values.usesBeforeDepletion + 1)));
    if (values.cooldownSeconds > 0) lore.push(ccs('&7Cooldown: &e' + values.cooldownSeconds + ' seconds'));
    if (tag.getString('modifier_on_depletion') === 'break') {
        if (depleted) lore.push(ccs('&6Use on a chest with Arcade Tokens to recharge.'));
        lore.push(ccs('&7Next recharge cost: &e' + tag.getInteger('modifier_repairs') + ' Arcade Tokens'));
    }
    if (tag.has('owner_name')) lore.push(ccs('&8Bound to: &a' + tag.getString('owner_name')));
    item.setLore(lore);
    return item;
}

function create_modifier_item_stack(world, baseStack, spec) {
    var config = loadJson(MODIFIERS_CFG_PATH);
    var effect = spec.type;
    var entry = get_modifier_config_entry(effect);
    var action = spec.onDepletion === undefined ? config.defaults.onDepletion : spec.onDepletion;
    var nbt = baseStack.copy().getItemNbt();
    var tag = nbt.getCompound('tag');
    tag.setBoolean('is_modifier', true);
    tag.setString('modifier_effect', effect);
    tag.setBoolean('modifier_depleted', false);
    tag.setString('modifier_on_depletion', action);
    tag.setInteger('modifier_repairs', 0);
    tag.remove('modifier_last_used_at');
    var fields = {radius: 'modifier_radius', durationMinutes: 'modifier_duration_minutes', multiplier: 'modifier_multiplier',
        usesBeforeDepletion: 'modifier_uses_before_depletion', cooldownSeconds: 'modifier_cooldown_seconds'};
    for (var key in fields) {
        var valueSpec = spec[key] !== undefined ? spec[key] : entry[key];
        if (valueSpec === undefined) valueSpec = config.defaults[key];
        var value = resolve_modifier_value(valueSpec, key !== 'multiplier');
        tag.remove(fields[key]);
        if (value === undefined) continue;
        if (key === 'multiplier') tag.setDouble(fields[key], value);
        else tag.setInteger(fields[key], value);
    }
    tag.setInteger('modifier_initial_uses_before_depletion', tag.getInteger('modifier_uses_before_depletion'));
    if (spec.conflictPolicy) tag.setString('modifier_conflict_policy', spec.conflictPolicy);
    else tag.remove('modifier_conflict_policy');
    if (spec.itemId) nbt.setString('id', spec.itemId);
    var carrierFields = ['modifier_broken_item_id', 'modifier_broken_item_damage', 'modifier_ready_item_id', 'modifier_ready_item_damage'];
    for (var ci = 0; ci < carrierFields.length; ci++) tag.remove(carrierFields[ci]);
    if (action === 'break') {
        var broken = spec.brokenItem === undefined ? config.defaults.brokenItem : spec.brokenItem;
        tag.setString('modifier_broken_item_id', broken.id);
        tag.setInteger('modifier_broken_item_damage', broken.damage);
        tag.setString('modifier_ready_item_id', nbt.getString('id'));
        tag.setInteger('modifier_ready_item_damage', nbt.getShort('Damage'));
    }
    var legacyFields = ['modifier_class', 'modifier_type', 'modifier_use', 'is_broken', 'duration_minutes', 'is_passive_modifier', 'passive_modifier_type', 'repairs'];
    for (var i = 0; i < legacyFields.length; i++) tag.remove(legacyFields[i]);
    nbt.setCompound('tag', tag);
    return refresh_modifier_presentation(world.createItemFromNbt(nbt));
}

function setModifierRadius(item, radius) {
    item.getNbt().setInteger('modifier_radius', radius);
    refresh_modifier_presentation(item);
}
