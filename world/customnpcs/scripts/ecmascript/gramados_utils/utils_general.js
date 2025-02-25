/**
 * Compares two IItemStacks to check if they are equal.
 * 
 * @param {IItemStack} stack - The first item stack to compare.
 * @param {IItemStack} other - The second item stack to compare.
 * @param {boolean} [ignoreNbt=false] - Whether to ignore NBT data in the comparison.
 * @returns {boolean} - True if the item stacks are equal, false otherwise.
 */
function isItemEqual(stack, other, ignoreNbt) {
    if (typeof (ignoreNbt) == typeof (undefined) || ignoreNbt === null) { ignoreNbt = false; }
    if (!other || other.isEmpty()) {
        return false;
    }

    var stackNbt = stack.getItemNbt();
    stackNbt.remove('Count');
    var otherNbt = other.getItemNbt();
    otherNbt.remove('Count');

    if (ignoreNbt) {
        if (stackNbt.getString("id") == otherNbt.getString("id")) {
            return true;
        }
    } else {
        if (isNbtEqual(stackNbt, otherNbt)) {
            return true;
        }
    }

    return false;
}

/**
 * Compares two NBT data objects to check if they are equal.
 * 
 * @param {INbt} nbt - The first NBT data object to compare.
 * @param {INbt} otherNbt - The second NBT data object to compare.
 * @returns {boolean} - True if the NBT data objects are equal, false otherwise.
 */
function isNbtEqual(nbt, otherNbt) {
    return nbt.toJsonString() == otherNbt.toJsonString();
}

/**
 * Retrieves a player's inventory from NBT data.
 * 
 * @param {INbt} playerNbt - The NBT data containing the player's inventory.
 * @param {IWorld} world - The world object.
 * @param {function} [filterFn=null] - An optional filter function to apply to the items.
 * @returns {IItemStack[]} - An array of item stacks representing the player's inventory.
 */
function getPlayerInvFromNbt(playerNbt, world, filterFn) {
    if (typeof (filterFn) == typeof (undefined) || filterFn === null) { filterFn = null; }
    var inventoryList = playerNbt.getList('Inventory', playerNbt.getListType('Inventory'));
    var playerItems = [];
    for (var i in inventoryList) {
        var itemNbt = inventoryList[i];
        var itemStack = world.createItemFromNbt(API.stringToNbt(itemNbt.toJsonString()));
        if ((filterFn == null ? true : filterFn(itemStack, itemNbt, world))) {
            playerItems.push(itemStack);
        }
    }

    return playerItems;
}

/**
 * Checks if an array contains a specific item.
 * @param {Array} array - The array to check.
 * @param {*} item - The item to search for.
 * @returns {boolean} - True if the item is in the array, false otherwise.
 */
function includes(array, item) {
    // tellPlayer(player, "&6Checking if item " + item + " is in array " + array);
    return array.indexOf(item) > -1;
}