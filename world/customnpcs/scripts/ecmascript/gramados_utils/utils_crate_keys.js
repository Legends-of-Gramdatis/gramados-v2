load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

function isCrateKey(stack) {
    if (!stack || stack.isEmpty()) return false;
    var tag = stack.getItemNbt().getCompound('tag');
    if (!tag.getString('crate_type')) return false;
    if (tag.getBoolean('is_crate_key')) return true;
    // Existing keys remain usable without retaining modifier semantics in new items.
    return tag.getBoolean('is_modifier') && tag.getString('modifier_class') === 'key' &&
        tag.getString('modifier_effect') === 'open_crate' && tag.getString('modifier_use') === 'single-use';
}

function create_crate_key_item_stack(world, base, spec) {
    var crate = spec.crate_type;
    var nbt = base.copy().getItemNbt();
    var tag = nbt.getCompound('tag');
    tag.setBoolean('is_crate_key', true);
    tag.setString('crate_type', crate);
    var obsolete = ['is_modifier', 'modifier_class', 'modifier_type', 'modifier_effect', 'modifier_use', 'is_broken'];
    for (var i = 0; i < obsolete.length; i++) tag.remove(obsolete[i]);
    nbt.setCompound('tag', tag);
    if (spec.item_id !== undefined) nbt.setString('id', spec.item_id);
    var item = world.createItemFromNbt(nbt);
    item.setCustomName(parseEmotes(ccs(spec.key_name)));
    item.setLore([parseEmotes(ccs(spec.key_description)), ccs('&8Single-use key')]);
    return item;
}
