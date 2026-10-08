load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_modifiers.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_item_ownership.js');

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

// Each physical item owns its charges and timestamp, even when originally stacked.
function replace_used_modifier(player, original, replacement) {
    if (replacement) replacement.setStackSize(1);
    if (original.getStackSize() <= 1) {
        player.setMainhandItem(replacement);
        return;
    }
    original.setStackSize(original.getStackSize() - 1);
    player.setMainhandItem(original);
    if (replacement && !player.giveItem(replacement)) player.dropItem(replacement);
}

function modifier_play_sound(player, sound) {
    API.executeCommand(player.getWorld(), '/playsound customnpcs:magic.' + sound + ' player @a ' +
        player.getPos().getX() + ' ' + player.getPos().getY() + ' ' + player.getPos().getZ() + ' 1 1');
}

function modifier_effect_succeeded(result) {
    if (typeof result === 'number') return result > 0;
    if (result === true) return true;
    if (!result || typeof result !== 'object') return false;
    if (typeof result.changed === 'number') return result.changed > 0;
    if (typeof result.affected === 'number') return result.affected > 0;
    return (result.converted || 0) + (result.planted || 0) > 0;
}

function modifier_finish_successful_use(player, item, now) {
    var nbt = item.getItemNbt();
    var tag = nbt.getCompound('tag');
    tag.setDouble('modifier_last_used_at', now);
    var uses = tag.getInteger('modifier_uses_before_depletion');
    if (uses > 0) {
        tag.setInteger('modifier_uses_before_depletion', uses - 1);
    } else if (tag.getString('modifier_on_depletion') === 'disappear') {
        return null;
    } else {
        tag.setBoolean('modifier_depleted', true);
        nbt.setString('id', tag.getString('modifier_broken_item_id'));
        nbt.setShort('Damage', tag.getInteger('modifier_broken_item_damage'));
    }
    nbt.setCompound('tag', tag);
    return refresh_modifier_presentation(player.getWorld().createItemFromNbt(nbt));
}

function modifier_recharge(player, item, original, block) {
    var tag = item.getItemNbt().getCompound('tag');
    if (tag.getString('modifier_on_depletion') !== 'break') return;
    if (!block || block.getName() !== 'minecraft:chest') {
        tellPlayer(player, '&6Use this depleted modifier on a chest with Arcade Tokens to recharge.');
        return;
    }
    var container = block.getContainer();
    if (!container) return;
    var cost = tag.getInteger('modifier_repairs');
    var tokens = 0;
    var slots = [];
    for (var i = 0; i < container.getSize(); i++) {
        var slot = container.getSlot(i);
        if (!slot.isEmpty() && isArcadeToken(slot)) {
            tokens += slot.getStackSize();
            slots.push(i);
        }
    }
    if (tokens < cost) {
        tellPlayer(player, '&cNot enough Arcade Tokens: need ' + cost + ', found ' + tokens + '.');
        return;
    }
    // Prepare the exact repaired item before consuming any currency.
    var repaired = repair_modifier_item(player, item);
    var needed = cost;
    for (var j = 0; j < slots.length && needed > 0; j++) {
        var tokenStack = container.getSlot(slots[j]).copy();
        var taken = Math.min(needed, tokenStack.getStackSize());
        needed -= taken;
        tokenStack.setStackSize(tokenStack.getStackSize() - taken);
        container.setSlot(slots[j], tokenStack.getStackSize() ? tokenStack : null);
    }
    replace_used_modifier(player, original, repaired);
    tellPlayer(player, '&aModifier recharged for ' + format_arcade_token_count(cost) + '&a.');
    logToFile('modifiers', '[modifiers.repair] player=' + player.getName() + ' effect=' + tag.getString('modifier_effect') + ' costTokens=' + cost);
    modifier_play_sound(player, 'charge');
}

function modifier_admin_create(player, item, block) {
    var offhand = player.getOffhandItem();
    if (offhand.isEmpty() || offhand.getName() !== 'mts:ivv.idcard_seagull') return false;
    if (get_modifier_config_entry(item.getItemNbt().getCompound('tag').getString('modifier_effect'))) return false;
    if (!block || block.getName() !== 'minecraft:chest') return false;
    var container = block.getContainer();
    if (!container) return false;
    var config = loadJson(MODIFIERS_CFG_PATH);
    for (var i = 0; i < container.getSize(); i++) {
        var slot = container.getSlot(i);
        if (slot.isEmpty() || slot.getName() !== 'minecraft:name_tag') continue;
        var name = slot.getDisplayName();
        if (name === 'all') {
            // Build first so invalid config cannot leave a cleared chest.
            var generated = [];
            for (var e = 0; e < config.effects.length && e < container.getSize(); e++) {
                var base = player.getWorld().createItem(config.items.itemId, 0, 1);
                generated.push(create_modifier_item_stack(player, base, {effect: config.effects[e].type}));
            }
            for (var c = 0; c < container.getSize(); c++) container.setSlot(c, c < generated.length ? generated[c] : null);
            tellPlayer(player, '&aCreated ' + generated.length + ' of ' + config.effects.length + ' configured modifiers.');
            return true;
        }
        var alias = get_modifier_legacy_entry(name);
        var effect = alias ? alias.effect : name;
        if (!get_modifier_config_entry(effect)) continue;
        var baseItem = player.getWorld().createItem(config.items.itemId, 0, 1);
        var result = modifier_create_legacy_preset(player, baseItem, name, 'break');
        // Blank carriers are consumed one at a time, including stacked carriers.
        replace_used_modifier(player, item, result);
        tellPlayer(player, '&aCreated modifier: ' + effect);
        return true;
    }
    return false;
}

function interact(event) {
    var player = event.player;
    var original = player.getMainhandItem();
    if (original.isEmpty() || original.getName() === 'customnpcs:npcscripter' || isCrateKey(original)) return;
    if (getItemOwnerUUID(original) !== null && !isItemOwnedBy(original, player)) {
        if (is_modifier(original) || is_old_modifier(original)) tellPlayer(player, '&cThis modifier belongs to another player.');
        return;
    }
    var trace = player.rayTraceBlock(5, true, false);
    var block = trace ? trace.getBlock() : null;
    if (modifier_admin_create(player, original, block)) return;
    if (!is_modifier(original) && !is_old_modifier(original)) return;
    var item = update_old_modifier_to_new(original.copy(), player);
    item.setStackSize(1);
    var tag = item.getItemNbt().getCompound('tag');
    var entry = get_modifier_config_entry(tag.getString('modifier_effect'));
    if (!entry || !tag.has('modifier_uses_before_depletion')) {
        tellPlayer(player, '&cUnknown or invalid modifier.');
        return;
    }
    if (tag.getBoolean('modifier_depleted')) {
        modifier_recharge(player, item, original, block);
        return;
    }
    if (block && block.getName() !== 'minecraft:air') return;
    var action = tag.getString('modifier_on_depletion');
    if ((action !== 'break' && action !== 'disappear') || tag.getInteger('modifier_uses_before_depletion') < 0 ||
        (action === 'break' && (!tag.getString('modifier_broken_item_id') || !tag.getString('modifier_ready_item_id')))) {
        tellPlayer(player, '&cInvalid modifier lifecycle.');
        return;
    }
    var now = Date.now();
    var cooldown = tag.getInteger('modifier_cooldown_seconds');
    var lastUsed = tag.has('modifier_last_used_at') ? tag.getDouble('modifier_last_used_at') : null;
    if (lastUsed !== null && now - lastUsed < cooldown * 1000) {
        tellPlayer(player, '&eModifier cooldown: ' + Math.ceil((lastUsed + cooldown * 1000 - now) / 1000) + ' seconds remaining.');
        return;
    }
    if (tag.has('modifier_conflict_policy') && tag.getString('modifier_conflict_policy') !== 'reject') {
        tellPlayer(player, '&cUnsupported modifier conflict policy.');
        return;
    }
    var values = get_modifier_item_values(tag);
    var success;
    if (entry.behavior === 'timed') {
        if (!(values.durationMinutes > 0)) return;
        success = apply_passive_modifier_type(player, entry.type, values);
        if (!success) tellPlayer(player, '&eThis modifier effect is already active.');
    } else if (entry.behavior === 'instant') {
        if (!(values.radius >= 0)) return;
        success = modifier_effect_succeeded(apply_active_modifier_type(player, entry.type, values.radius));
        if (!success) tellPlayer(player, '&eNothing changed. Your modifier was not used.');
    } else {
        tellPlayer(player, '&cUnknown modifier behavior.');
        return;
    }
    if (!success) return;
    replace_used_modifier(player, original, modifier_finish_successful_use(player, item, now));
    tellPlayer(player, '&aModifier activated: ' + get_modifier_display_name(entry.type, values));
    logToFile('modifiers', '[modifiers.use] player=' + player.getName() + ' effect=' + entry.type + ' parameters=' + JSON.stringify(values));
    modifier_play_sound(player, 'shot');
}

function logout(event) {
    freeze_passive_modifiers(event.player);
}

function login(event) {
    var player = event.player;
    unfreeze_passive_modifiers(player);
    var modifiers = get_players_passive_modifiers(player);
    if (!modifiers.length) return;
    tellPlayer(player, '&ePassive modifiers active:');
    for (var i = 0; i < modifiers.length; i++) tellPlayer(player, '&7- ' + format_passive_modifier_presentation(player, modifiers[i]));
}
