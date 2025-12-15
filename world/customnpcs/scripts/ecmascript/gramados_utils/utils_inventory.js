// Utilities for inventory manipulation
// Nashorn + CustomNPCs API (MC 1.12.2)

/**
 * Count items in a player's inventory matching the given criteria.
 * 
 * @param {IPlayer} player - The player whose inventory to scan.
 * @param {string} itemId - Item ID (e.g., 'minecraft:wheat_seeds').
 * @param {number} [damage=-1] - Item damage/meta. -1 = ignore damage.
 * @param {INbt|null} [nbt=null] - NBT to match. null = ignore NBT.
 * @returns {number} Total count of matching items across all inventory slots.
 */
function countItemInInventory(player, itemId, damage, nbt) {
    if (typeof damage === 'undefined' || damage === null) damage = -1;
    if (typeof nbt === 'undefined') nbt = null;

    var inv = player.getInventory();
    var slots = inv.getItems();
    var total = 0;

    for (var i = 0; i < slots.length; i++) {
        var stack = slots[i];
        if (!stack || stack.isEmpty()) continue;

        var stackName = stack.getName();
        if (stackName !== itemId) continue;

        // Check damage if required
        if (damage !== -1 && stack.getItemDamage() !== damage) continue;

        // Check NBT if required
        if (nbt !== null) {
            var stackNbt = stack.getItemNbt();
            if (!stackNbt || stackNbt.toJsonString() !== nbt.toJsonString()) continue;
        }

        total += stack.getStackSize();
    }

    return total;
}

/**
 * Remove a specified count of items from a player's inventory matching the given criteria.
 * Removes from multiple stacks if needed.
 * 
 * @param {IPlayer} player - The player whose inventory to modify.
 * @param {string} itemId - Item ID (e.g., 'minecraft:wheat_seeds').
 * @param {number} count - Number of items to remove.
 * @param {number} [damage=-1] - Item damage/meta. -1 = ignore damage.
 * @param {INbt|null} [nbt=null] - NBT to match. null = ignore NBT.
 * @returns {number} Actual count removed (may be less than requested if not enough items).
 */
function removeItemsFromInventory(player, itemId, count, damage, nbt) {
    if (typeof damage === 'undefined' || damage === null) damage = -1;
    if (typeof nbt === 'undefined') nbt = null;

    var inv = player.getInventory();
    var slots = inv.getItems();
    var remaining = count;

    for (var i = 0; i < slots.length && remaining > 0; i++) {
        var stack = slots[i];
        if (!stack || stack.isEmpty()) continue;

        var stackName = stack.getName();
        if (stackName !== itemId) continue;

        // Check damage if required
        if (damage !== -1 && stack.getItemDamage() !== damage) continue;

        // Check NBT if required
        if (nbt !== null) {
            var stackNbt = stack.getItemNbt();
            if (!stackNbt || stackNbt.toJsonString() !== nbt.toJsonString()) continue;
        }

        var stackSize = stack.getStackSize();
        var toRemove = Math.min(stackSize, remaining);

        if (toRemove >= stackSize) {
            // Remove entire stack
            inv.setSlot(i, null);
        } else {
            // Reduce stack size
            stack.setStackSize(stackSize - toRemove);
        }

        remaining -= toRemove;
    }

    return count - remaining; // Actual removed count
}

/**
 * Get an item stack from player inventory matching criteria.
 * 
 * @param {IPlayer} player - The player whose inventory to scan.
 * @param {string} itemId - Item ID (e.g., 'minecraft:wheat_seeds').
 * @param {number} [damage=-1] - Item damage/meta. -1 = ignore damage.
 * @param {INbt|null} [nbt=null] - NBT to match. null = ignore NBT.
 * @returns {IItemStack|null} First matching item stack, or null if not found.
 */
function getItemFromInventory(player, itemId, damage, nbt) {
    if (typeof damage === 'undefined' || damage === null) damage = -1;
    if (typeof nbt === 'undefined') nbt = null;

    var inv = player.getInventory();
    var slots = inv.getItems();

    for (var i = 0; i < slots.length; i++) {
        var stack = slots[i];
        if (!stack || stack.isEmpty()) continue;

        var stackName = stack.getName();
        if (stackName !== itemId) continue;

        // Check damage if required
        if (damage !== -1 && stack.getItemDamage() !== damage) continue;

        // Check NBT if required
        if (nbt !== null) {
            var stackNbt = stack.getItemNbt();
            if (!stackNbt || stackNbt.toJsonString() !== nbt.toJsonString()) continue;
        }

        return stack;
    }

    return null;
}
