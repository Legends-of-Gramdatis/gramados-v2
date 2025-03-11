load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");

/**
 * Permission to open or close the shop.
 * @constant {string}
 */
var PERMISSION_OPEN_CLOSE_SHOP = "open_close_shop";

/**
 * Permission to set prices in the shop.
 * @constant {string}
 */
var PERMISSION_SET_PRICES = "set_prices";

/**
 * Permission to manage shop permissions.
 * @constant {string}
 */
var PERMISSION_MANAGE_PERMISSIONS = "manage_permissions";

/**
 * Permission to take money from the shop.
 * @constant {string}
 */
var PERMISSION_TAKE_MONEY = "take_money";

/**
 * Permission to manage shop stock.
 * @constant {string}
 */
var PERMISSION_MANAGE_STOCK = "manage_stock";

/**
 * Permission to sell the shop.
 * @constant {string}
 */
var PERMISSION_SELL_SHOP = "sell_shop";

/**
 * Permission to switch shop type.
 * @constant {string}
 */
var PERMISSION_TYPE_SWITCH = "type_switch";

/**
 * Permission to take upgrades for the shop.
 * @constant {string}
 */
var PERMISSION_TAKE_UPGRADE = "take_upgrade";

/**
 * Permission to take events for the shop.
 * @constant {string}
 */
var PERMISSION_TAKE_EVENT = "take_event";

/**
 * Path to the permissions JSON file.
 * @constant {string}
 */
var PERMISSIONS_JSON_PATH = "world/customnpcs/scripts/ecmascript/modules/shopkeeping_dev/roles_permissions.json";

/**
 * Checks if a player has the required permission for a shop.
 * @param {IPlayer} player - The player.
 * @param {number} shopId - The shop ID.
 * @param {Object} playerShops - The player's shops.
 * @param {string} permission - The required permission.
 * @returns {boolean} True if the player has the required permission, false otherwise.
 */
function hasPermission(playerName, shop, permission) {
    var roles = getPlayerRolesFromShop(playerName, shop);
    for (var i = 0; i < roles.length; i++) {
        if (hasRolePermission(roles[i], permission)) {
            return true;
        }
    }
    return false;
}

/**
 * Gets the list of permissions for a given role.
 * @param {string} role - The role.
 * @returns {Array<string>} The list of permissions for the role.
 */
function getPermissions(role) {
    var rolesPermissions = loadJson(PERMISSIONS_JSON_PATH);
    if (rolesPermissions && rolesPermissions.roles[role]) {
        return rolesPermissions.roles[role].permissions;
    }
    return [];
}

/**
 * Gets the roles of a player in a shop.
 * @param {string} playerName - The name of the player.
 * @param {Object} shop - The shop.
 * @returns {Array<string>} The list of roles the player has in the shop.
 */
function getPlayerRolesFromShop(playerName, shop) {
    var roles = [];
    if (!shop) {
        return roles;
    }
    var shopRoles = getRolesList(shop);
    for (var i = 0; i < shopRoles.length; i++) {
        if (includes(shop.roles[shopRoles[i]], playerName)) {
            roles.push(shopRoles[i]);
        }
    }
    return roles;
}

/**
 * Gets the list of roles in a shop.
 * @param {Object} shop - The shop.
 * @returns {Array<string>} The list of roles in the shop.
 */
function getRolesList(shop) {

    var roles = [];
    var roleKeys = Object.keys(shop.roles);
    for (var i = 0; i < roleKeys.length; i++) {
        var role = roleKeys[i];
        if (role !== "enabled") {
            roles.push(role);
        }
    }
    return roles;
}

/**
 * Checks if a role has a specific permission.
 * @param {string} role - The role.
 * @param {string} permission - The permission.
 * @returns {boolean} True if the role has the permission, false otherwise.
 */
function hasRolePermission(role, permission) {
    var rolesPermissions = loadJson(PERMISSIONS_JSON_PATH);
    if (rolesPermissions && rolesPermissions.roles[role]) {
        return includes(rolesPermissions.roles[role].permissions, permission);
    }
    return false;
}