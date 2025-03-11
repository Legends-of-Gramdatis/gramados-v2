load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");

var gramadosData = loadJson("world/customnpcs/scripts/configs/gramados_data.json");

var coinItems = convertCoinItems(gramadosData._COINITEMS);
var coinTable = gramadosData._COINTABLE;
var virtualCurrencies = gramadosData.VIRTUAL_CURRENCIES;
var coinItemName = gramadosData._COINITEMNAME;
var coinItemPrefix = gramadosData._COINITEM_PREFIX;
var lowValueId = gramadosData.LOWVALUE_ID;
var midValueId = gramadosData.MIDVALUE_ID;
var highValueId = gramadosData.HIGHVALUE_ID;
var ultraValueId = gramadosData.ULTRAVALUE_ID;

/**
 * Converts a price string to an integer value in cents.
 * @param {string} price - The price string (e.g., "10g50c").
 * @returns {number} - The price in cents.
 */
function convertPrice(price) {
    var grons = price.split("g")[0];
    var cents = price.split("g")[1];
    cents = parseInt(cents.split("c")[0]);
    return parseInt(grons) * 100 + cents;
}

/**
 * Gets the monetary value of an item stack.
 * @param {Object} stack - The item stack.
 * @param {Object} world - The world object.
 * @param {string} currencyType - The type of currency.
 * @returns {number} - The monetary value of the item stack.
 */
function getItemMoney(stack, world, currencyType) {
    for (var coinKey in coinItems) {
        var coinItem = coinItems[coinKey];
        var generatedMoney = generateMoney(world, getCoinAmount(coinKey), currencyType)[0] || null;
        if (generatedMoney != null) {
            if (isItemEqual(stack, generatedMoney)) {
                return getCoinAmount(coinKey);
            }
        }
    }
    return 0;
}

/**
 * Checks if an item stack is a form of money.
 * @param {Object} stack - The item stack.
 * @param {Object} world - The world object.
 * @param {string} currencyType - The type of currency.
 * @returns {boolean} - True if the item stack is money, false otherwise.
 */
function isItemMoney(stack, world, currencyType) {
    return getItemMoney(stack, world, currencyType) > 0;
}

/**
 * Converts an integer amount to a coin string.
 * @param {number} amount - The amount in cents.
 * @returns {string} - The coin string (e.g., "10g50c").
 */
function getAmountCoin(amount) {
    var resultString = '';
    var amountSign = sign(amount);
    if (amountSign == -1) { resultString = '-'; }
    amount = Math.abs(amount);
    var coinKeys = Object.keys(coinTable);
    for (var i = coinKeys.length - 1; i >= 0; i--) {
        var add = 0;
        while (amount >= coinTable[coinKeys[i]]) {
            add++;
            amount -= coinTable[coinKeys[i]];
        }
        if (add > 0) {
            resultString += add.toString() + coinKeys[i].toUpperCase();
        }
    }
    if (resultString == '') { resultString = '0G'; }
    return resultString;
}

/**
 * Converts a coin string to an integer amount in cents.
 * @param {string} str - The coin string (e.g., "10g50c").
 * @returns {number} - The amount in cents.
 */
function getCoinAmount(str) {
    var regex = /([\d]+)([a-zA-Z]+)/g;
    var amounts = str.match(regex) || [];
    var amount = 0;
    var sign = 1;
    if (str.substr(0, 1) == '-') { sign = -1; }
    for (var a in amounts) {
        var match = amounts[a];
        var number = parseInt(match.replace(regex, '$1'));
        var unit = match.replace(regex, '$2').toLowerCase();
        var coinKeys = Object.keys(coinTable);
        if (coinKeys.indexOf(unit) > -1) {
            amount += number * coinTable[unit];
        }
    }
    return amount * sign;
}

/**
 * Generates money items based on the amount and currency type.
 * @param {Object} world - The world object.
 * @param {number} amount - The amount in cents.
 * @param {string} currencyType - The type of currency.
 * @returns {Array} - An array of generated money items.
 */
function generateMoney(world, amount, currencyType) {
    if (typeof (currencyType) == typeof (undefined) || currencyType === null) { currencyType = 'money'; }
    var remainingAmount = amount;
    var coinAmounts = Object.keys(coinItems);
    var currency = getCurrency(currencyType);

    var generatedItems = [];
    for (var i = coinAmounts.length - 1; i >= 0; i--) {
        var coinCount = 0;
        var coinValue = getCoinAmount(coinAmounts[i]);
        if (coinValue > 0) {
            while (remainingAmount >= coinValue) {
                coinCount++;
                remainingAmount -= coinValue;
            }
        }
        if (coinCount > 0) {
            var coinItem = world.createItem(coinItems[coinAmounts[i]], 0, coinCount);
            coinItem.setCustomName(ccs(currency.displayPrefix + currency.displayName + '&r'));
            coinItem.setLore([
                ccs('&e' + getAmountCoin(getCoinAmount(coinAmounts[i].toUpperCase())))
            ]);
            generatedItems.push(coinItem);
        }
    }
    return generatedItems;
}

/**
 * Retrieves the currency object based on the currency type.
 * @param {string} type - The type of currency.
 * @returns {Object|null} - The currency object or null if not found.
 */
function getCurrency(type) {
    for (var i in virtualCurrencies) {
        var currency = virtualCurrencies[i];
        if (currency.name != type) {
            continue;
        }
        return currency;
        break;
    }
    return null;
}

/**
 * Calculates the price based on a reference price and a profit modifier.
 * @param {number} referencePrice - The reference price in cents.
 * @param {string} profit - The profit modifier (e.g., "10%" or "10g50c").
 * @returns {number} - The calculated price in cents.
 */
function calculatePrice(referencePrice, profit) {
    if (!profit) {
        return referencePrice;
    }
    if (profit.endsWith("%")) {
        var percent = parseFloat(profit.slice(0, -1));
        return Math.round(referencePrice * (1 + percent / 100));
    } else {
        return referencePrice + getCoinAmount(profit);
    }
}

/**
 * Retrieves money from a player's inventory.
 * @param {Object} player - The player object.
 * @param {Object} world - The world object.
 * @param {string} currencyType - The type of currency.
 * @returns {number} - The total amount of money retrieved in cents.
 */
function getMoneyFromPlayerInventory(player, world, currencyType) {
    var currencyType = currencyType || 'money';
    var totalAmount = 0;
    var moneyItems = getPlayerInvFromNbt(player.getEntityNbt(), world, function (item, itemNbt, world) {
        return isItemMoney(item, world, currencyType);
    });
    for (var i in moneyItems) {
        var moneyItem = moneyItems[i];
        var itemValue = getItemMoney(moneyItem, world, currencyType) * moneyItem.getStackSize();
        totalAmount += itemValue;
        player.removeItem(moneyItem, moneyItem.getStackSize());
    }
    return totalAmount;
}

/**
 * Converts the coin items from JSON format to the required format.
 * @param {Object} jsonCoinItems - The coin items from JSON.
 * @returns {Object} - The converted coin items.
 */
function convertCoinItems(jsonCoinItems) {
    var converted = {};
    for (var key in jsonCoinItems) {
        converted[key] = gramadosData[jsonCoinItems[key]];
    }
    return converted;
}

/**
 * Retrieves the money from a player's pouch.
 * @param {Object} player - The player object.
 * @param {number} value - The value to retrieve in cents.
 * @returns {boolean} - True if the money was successfully retrieved, false otherwise.
 */
function getMoneyFromPlayerPouch(player, value) {
    var worldData = getWorldData();
    var playerIndex = player.getDisplayName();
    playerIndex = "player_" + playerIndex;
    var playerData = JSON.parse(worldData.get(playerIndex));
    var money = playerData["money"];
    if (money < value) {
        return false;
    }
    money = money - value;
    playerData["money"] = money;
    worldData.put(playerIndex, JSON.stringify(playerData));
    return true;
}

/**
 * Adds money to the current player's pouch.
 * @param {Object} player - The player object.
 * @param {number} value - The value to add in cents.
 * @returns {boolean} - True if the money was successfully added, false otherwise.
 */
function addMoneyToCurrentPlayerPouch(player, value) {
    var worldData = getWorldData();
    var playerIndex = player.getDisplayName();
    playerIndex = "player_" + playerIndex;
    var playerData = JSON.parse(worldData.get(playerIndex));
    var money = playerData["money"];
    money = money + value;
    playerData["money"] = money;
    worldData.put(playerIndex, JSON.stringify(playerData));
    return true;
}

/**
 * Adds money to a specified player's pouch by name.
 * @param {string} playerName - The name of the player.
 * @param {number} value - The value to add in cents.
 * @returns {boolean} - True if the money was successfully added, false otherwise.
 */
function addMoneyToPlayerPouchByName(playerName, value) {
    var worldData = getWorldData();
    var playerIndex = "player_" + playerName;
    var playerData = JSON.parse(worldData.get(playerIndex));
    var money = playerData["money"];
    money = money + value;
    playerData["money"] = money;
    worldData.put(playerIndex, JSON.stringify(playerData));
    return true;
}