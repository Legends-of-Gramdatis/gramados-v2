var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

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

/**
 * Checks if any of the specified items are included in the array.
 * @param {Array} array - The array to check.
 * @param {Array} items - The items to search for.
 * @returns {boolean} - True if any item is in the array, false otherwise.
 */
function includeSome(array, items) {
    for (var i = 0; i < items.length; i++) {
        if (includes(array, items[i])) {
            return true;
        }
    }

    return false;
}

/**
 * Finds an entry in a JSON array by a specific key and value.
 *
 * @param {Object{}} json - The JSON object to search.
 * @param {string} key - The key to search for.
 * @param {*} value - The value to search for.
 * @returns {Object} - The JSON object if found, null otherwise.
 */
function findJsonEntry(json, key, value) {
    // for all entries in json
    var all_keys = Object.keys(json);

    for (var i = 0; i < all_keys.length; i++) {

        var entryKey = all_keys[i];
        var entry = json[entryKey];

        if (entry[key] === value) {
            return entry;
        }
    }

    return null;
}

/**
 * Finds a sub-entry in a JSON array by a specific key and value.
 * @param {Object[]} jsonarray - The JSON array to search.
 * @param {string} key - The key to search for.
 * @param {*} value - The value to search for.
 * @returns {Object} - The JSON object if found, null otherwise.
 */
function findJsonEntryArray(jsonarray, key, value) {
    for (var i = 0; i < jsonarray.length; i++) {
        if (jsonarray[i][key] === value) {
            return jsonarray[i];
        }
    }

    return null;
}

/**
 * Finds the index of a sub-entry in a JSON array by a specific key and value.
 * @param {Object[]} jsonarray - The JSON array to search.
 * @param {string} key - The key to search for.
 * @param {*} value - The value to search for.
 * @returns {number} - The index of the JSON object if found, -1 otherwise.
 */
function findJsonEntryArrayIndex(jsonarray, key, value) {
    for (var i = 0; i < jsonarray.length; i++) {
        if (jsonarray[i][key] === value) {
            return i;
        }
    }

    return -1;
}

/**
 * Gets a value from a JSON object by key.
 * @param {Object} json - The JSON object to search.
 * @param {string} key - The key to search for.
 * @returns {*} - The value if found, null otherwise.
 */
function getJsonValue(json, key) {
    if (json[key]) {
        return json[key];
    }
    return null;
}

/**
 * Gets all keys from a JSON object.
 * 
 * @param {Object} json - The JSON object to retrieve keys from.
 * @returns {string[]} - An array of keys in the JSON object.
 */
function getJsonKeys(json) {
    return Object.keys(json);
}

/**
 * Checks if a player is an operator (OP).
 * @param {IPlayer} player - The player to check.
 * @returns {boolean} - True if the player is an operator, false otherwise.
 */
// function isPlayerOp(player) {
//     var playerName = player.getName();
//     // /home/mouette/gramados-v2/ops.json
//     var ops = loadJson("ops.json");
//     // tellPlayer(player, "&6Checking if player " + playerName + " is an OP");
//     if (ops) {
//         if (findJsonEntryArray(ops, "name", playerName)) {
//             return true;
//         }
//     } else {
//         tellPlayer(player, "&cNo ops.json file found! Contact an admin!");
//     }
//     return false;
// }

/**
 * Executes a command as a player.
 * @param {IPlayer} player - The player executing the command.
 * @param {string} command - The command to execute.
 * @param {string} [as_player] - The player to execute the command as.
 * @returns {boolean} The result of the command execution.
 */
function executeCommand(player, command, as_player) {
    if (typeof (as_player) == typeof (undefined) || as_player === null) { as_player = null; }
    if (as_player == null) { as_player = player.getName(); }
    var cmd = API.createNPC(player.world.getMCWorld());

    return cmd.executeCommand("/execute " + as_player + " ~ ~ ~ " + command);
}

/**
 * Executes a command globally.
 * @param {string} command - The command to execute.
 * @param {number} [dim=0] - The dimension to execute the command in.
 * @returns {boolean} The result of the command execution.
 */
function executeCommandGlobal(command, dim) {
    if (typeof (dim) == typeof (undefined) || dim === null) { dim = 0; }
    return API.createNPC(API.getIWorld(dim).getMCWorld()).executeCommand(command);
}

/**
 * Pad a string to a specified length (Nashorn-compatible alternative to padStart)
 */
function padLeft(str, length, char) {
    char = char || "0";
    var result = str.toString();
    while (result.length < length) {
        result = char + result;
    }
    return result;
}