load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

var MODIFIERS_CFG_PATH = 'world/customnpcs/scripts/ecmascript/modules/modifiers/modifiers_config.json';
var MODIFIERS_LEGACY_PATH = 'world/customnpcs/scripts/ecmascript/modules/modifiers/modifiers_legacy.json';

// Integer ranges are inclusive and uniformly sampled. Multipliers remain continuous.
function resolve_modifier_value(valueSpec, integer) {
    var value = valueSpec;
    if (valueSpec && typeof valueSpec === 'object') {
        var min = valueSpec.min;
        var max = valueSpec.max;
        if (typeof min !== 'number' || typeof max !== 'number' || !isFinite(min) || !isFinite(max) || min > max) {
            throw new Error('Invalid modifier range: ' + JSON.stringify(valueSpec));
        }
        if (integer) {
            min = Math.ceil(min);
            max = Math.floor(max);
            if (min > max) throw new Error('Modifier range contains no integer');
            return min + Math.floor(Math.random() * (max - min + 1));
        }
        return min + Math.random() * (max - min);
    }
    if (value === undefined || value === null) return null;
    if (typeof value !== 'number' || !isFinite(value) || (integer && Math.floor(value) !== value)) {
        throw new Error('Invalid modifier value: ' + value);
    }
    return value;
}

function get_modifier_world(context) {
    return context && typeof context.getWorld === 'function' ? context.getWorld() : context;
}

function get_modifier_config_entry(effect) {
    var config = loadJson(MODIFIERS_CFG_PATH);
    return config ? findJsonEntryArray(config.effects, 'type', effect) : null;
}

function get_modifier_legacy_entry(effect) {
    var legacy = loadJson(MODIFIERS_LEGACY_PATH);
    return legacy && legacy.hasOwnProperty(effect) ? legacy[effect] : null;
}

// First matching rule wins; all conditions in one rule must match.
function resolve_modifier_presentation(spec, values) {
    if (typeof spec === 'string') return spec;
    if (!spec) return '';
    for (var i = 0; i < spec.length; i++) {
        var rule = spec[i];
        var matches = true;
        for (var key in (rule.when || {})) {
            if (!rule.when.hasOwnProperty(key)) continue;
            var actual = values[key];
            var conditions = rule.when[key];
            if (typeof actual !== 'number') { matches = false; break; }
            for (var op in conditions) {
                if (!conditions.hasOwnProperty(op)) continue;
                var expected = conditions[op];
                if (typeof expected !== 'number' || !isFinite(expected)) { matches = false; break; }
                if (op === 'lt') matches = matches && actual < expected;
                else if (op === 'lte') matches = matches && actual <= expected;
                else if (op === 'gt') matches = matches && actual > expected;
                else if (op === 'gte') matches = matches && actual >= expected;
                else if (op === 'eq') matches = matches && actual === expected;
                else matches = false;
            }
        }
        if (matches) return rule.value || '';
    }
    return '';
}

function get_modifier_item_values(tag) {
    var values = {};
    var fields = {radius: 'modifier_radius', durationMinutes: 'modifier_duration_minutes', multiplier: 'modifier_multiplier',
        usesBeforeDepletion: 'modifier_uses_before_depletion', cooldownSeconds: 'modifier_cooldown_seconds'};
    for (var key in fields) {
        if (fields.hasOwnProperty(key) && tag.has(fields[key])) values[key] = tag.getDouble(fields[key]);
    }
    return values;
}

function refresh_modifier_presentation(item) {
    var tag = item.getItemNbt().getCompound('tag');
    var effect = tag.getString('modifier_effect');
    var entry = get_modifier_config_entry(effect);
    if (!entry) return item;
    var values = get_modifier_item_values(tag);
    var depleted = tag.getBoolean('modifier_depleted');
    var name = resolve_modifier_presentation(entry.displayName, values) || effect;
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

function create_modifier_item_stack(context, baseStack, spec) {
    if (!baseStack || baseStack.isEmpty()) return baseStack;
    var effect = spec.effect || spec.type || spec.modifierEffect || spec.modifier_effect;
    var entry = get_modifier_config_entry(effect);
    if (!entry) throw new Error('Unknown modifier effect: ' + effect);
    var action = spec.onDepletion || 'break';
    if (action !== 'break' && action !== 'disappear') throw new Error('Unknown modifier depletion action: ' + action);
    if (spec.conflictPolicy && spec.conflictPolicy !== 'reject') throw new Error('Unsupported modifier conflict policy');
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
        if (!fields.hasOwnProperty(key)) continue;
        var valueSpec = spec[key] !== undefined ? spec[key] : entry[key];
        if (valueSpec === undefined && (key === 'usesBeforeDepletion' || key === 'cooldownSeconds')) valueSpec = 0;
        var value = resolve_modifier_value(valueSpec, key !== 'multiplier');
        tag.remove(fields[key]);
        if (value === null) continue;
        if ((key !== 'multiplier' && value > 2147483647) || value < 0 || ((key === 'durationMinutes' || key === 'multiplier') && value === 0)) throw new Error('Invalid modifier ' + key);
        if (key === 'multiplier') tag.setDouble(fields[key], value);
        else tag.setInteger(fields[key], value);
    }
    if (entry.behavior === 'timed' && !tag.has('modifier_duration_minutes')) throw new Error('Timed modifier requires duration');
    if (entry.behavior === 'instant' && !tag.has('modifier_radius')) throw new Error('Instant modifier requires radius');
    tag.setInteger('modifier_initial_uses_before_depletion', tag.getInteger('modifier_uses_before_depletion'));
    if (spec.conflictPolicy) tag.setString('modifier_conflict_policy', spec.conflictPolicy);
    else tag.remove('modifier_conflict_policy');
    if (spec.itemId) nbt.setString('id', spec.itemId);
    var carrierFields = ['modifier_broken_item_id', 'modifier_broken_item_damage', 'modifier_ready_item_id', 'modifier_ready_item_damage'];
    for (var ci = 0; ci < carrierFields.length; ci++) tag.remove(carrierFields[ci]);
    if (action === 'break') {
        var config = loadJson(MODIFIERS_CFG_PATH);
        var broken = spec.brokenItem || {id: config.items.usedItemId, damage: 0};
        if (!broken.id || typeof broken.id !== 'string') throw new Error('Broken modifier requires an item ID');
        var brokenDamage = broken.damage === undefined ? 0 : resolve_modifier_value(broken.damage, true);
        if (brokenDamage < 0) throw new Error('Invalid broken item damage');
        tag.setString('modifier_broken_item_id', broken.id);
        tag.setInteger('modifier_broken_item_damage', brokenDamage);
        tag.setString('modifier_ready_item_id', nbt.getString('id'));
        tag.setInteger('modifier_ready_item_damage', nbt.getShort('Damage'));
    }
    var legacyFields = ['modifier_class', 'modifier_type', 'modifier_use', 'is_broken', 'duration_minutes', 'is_passive_modifier', 'passive_modifier_type', 'repairs'];
    for (var i = 0; i < legacyFields.length; i++) tag.remove(legacyFields[i]);
    nbt.setCompound('tag', tag);
    return refresh_modifier_presentation(get_modifier_world(context).createItemFromNbt(nbt));
}

function setModifierRadius(item, radius) {
    var value = resolve_modifier_value(radius, true);
    if (value === null || value < 0) throw new Error('Invalid modifier radius');
    item.getNbt().setInteger('modifier_radius', value);
    refresh_modifier_presentation(item);
}
