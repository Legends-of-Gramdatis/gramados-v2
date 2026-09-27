// UUID owner metadata is optional for ordinary items and modifiers.
// Consumers must explicitly enforce it when ownership is required.
function bindItemToPlayer(stack, player) {
    if (!stack || stack.isEmpty() || !player || !player.getUUID()) return null;
    var nbt = stack.getItemNbt(), tag = nbt.getCompound('tag');
    tag.setString('owner_uuid', String(player.getUUID()));
    tag.setString('owner_name', String(player.getName()));
    nbt.setCompound('tag', tag);
    var item = player.getWorld().createItemFromNbt(nbt);
    // CustomNPCs exposes lore as a Java array/list in Nashorn, not a JS Array.
    var currentLore = item.getLore();
    var lore = [];
    if (currentLore) {
        for (var i = 0; i < currentLore.length; i++) lore.push(String(currentLore[i]));
    }
    lore.push('§8Bound to: §a' + player.getName());
    item.setLore(lore);
    return item;
}
function getItemOwnerUUID(stack) {
    if (!stack || stack.isEmpty()) return null;
    var nbt = stack.getItemNbt();
    if (!nbt.has('tag')) return null;
    var tag = nbt.getCompound('tag');
    if (!tag.has('owner_uuid')) return null;
    var uuid = String(tag.getString('owner_uuid'));
    return uuid.length ? uuid : null;
}
function isItemOwnedBy(stack, player) {
    var owner = getItemOwnerUUID(stack);
    return owner !== null && !!player && owner === String(player.getUUID());
}
function isCrateKeyModifier(stack) {
    if (!stack || stack.isEmpty()) return false;
    var nbt = stack.getItemNbt();
    if (!nbt.has('tag')) return false;
    var tag = nbt.getCompound('tag');
    return tag.has('is_modifier') && tag.getBoolean('is_modifier') &&
        tag.has('modifier_class') && tag.getString('modifier_class') === 'key' &&
        tag.has('modifier_effect') && tag.getString('modifier_effect') === 'open_crate' &&
        tag.has('modifier_use') && tag.getString('modifier_use') === 'single-use' &&
        tag.has('crate_type') && !!tag.getString('crate_type');
}
function canPlayerOpenCrateWithKey(key, player, crateType) {
    return isCrateKeyModifier(key) && isItemOwnedBy(key, player) &&
        key.getItemNbt().getCompound('tag').getString('crate_type') === crateType;
}
