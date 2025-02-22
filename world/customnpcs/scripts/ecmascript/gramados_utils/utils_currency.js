load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js")

var gramados_json = loadJson("world/customnpcs/scripts/configs/gramados_data.json");
var _COINITEMS = gramados_json._COINITEMS;
var _COINTABLE = gramados_json._COINTABLE;
var VIRTUAL_CURRENCIES = gramados_json.VIRTUAL_CURRENCIES;

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
 * @param {Object} w - The world object.
 * @param {string} currencyType - The type of currency.
 * @returns {number} - The monetary value of the item stack.
 */
function getItemMoney(stack, w, currencyType) {
    for (var ival in _COINITEMS) {
        var ci = _COINITEMS[ival];
        var cm = genMoney(w, getCoinAmount(ival), currencyType)[0] || null;
        if (cm != null) {
            if (isItemEqual(stack, cm)) {
                return getCoinAmount(ival);
            }
        }
    }
    return 0;
}

/**
 * Checks if an item stack is a form of money.
 * @param {Object} stack - The item stack.
 * @param {Object} w - The world object.
 * @param {string} currencyType - The type of currency.
 * @returns {boolean} - True if the item stack is money, false otherwise.
 */
function isItemMoney(stack, w, currencyType) {
    return getItemMoney(stack, w, currencyType) > 0;
}

/**
 * Converts an integer amount to a coin string.
 * @param {number} amount - The amount in cents.
 * @returns {string} - The coin string (e.g., "10g50c").
 */
function getAmountCoin(amount) {
    var rstr = '';
    var ams = sign(amount);
    if (ams == -1) { rstr = '-'; }
    amount = Math.abs(amount);
    var ckeys = Object.keys(_COINTABLE);
    for (var i = ckeys.length - 1; i >= 0; i--) {

        var add = 0;
        while (amount >= _COINTABLE[ckeys[i]]) {
            add++;
            amount -= _COINTABLE[ckeys[i]];
        }
        if (add > 0) {
            rstr += add.toString() + ckeys[i].toUpperCase();
        }
    }

    if (rstr == '') { rstr = '0G'; }
    return rstr;
}

/**
 * Converts a coin string to an integer amount in cents.
 * @param {string} str - The coin string (e.g., "10g50c").
 * @returns {number} - The amount in cents.
 */
function getCoinAmount(str) {
    var arx = /([\d]+)([a-zA-Z]+)/g;
    var amounts = str.match(arx) || [];
    var amount = 0;
    var sgn = 1;
    if (str.substr(0, 1) == '-') { sgn = -1; }

    for (var a in amounts) {
        var _am = amounts[a];
        var _amnum = parseInt(_am.replace(arx, '$1'));
        var _amunit = _am.replace(arx, '$2').toLowerCase();
        var coinkeys = Object.keys(_COINTABLE);
        if (coinkeys.indexOf(_amunit) > -1) {
            amount += _amnum * _COINTABLE[_amunit];
        }
    }
    return amount * sgn;
}

/**
 * Generates money items based on the amount and currency type.
 * @param {Object} w - The world object.
 * @param {number} amount - The amount in cents.
 * @param {string} currencyType - The type of currency.
 * @returns {Array} - An array of generated money items.
 */
function genMoney(w, amount, currencyType) {
    if (typeof (currencyType) == typeof (undefined) || currencyType === null) { currencyType = 'money'; }
    var am = amount
    var coinams = Object.keys(_COINITEMS);
    var currency = getCurrency(currencyType);

    var nmItems = [];
    for (var i = coinams.length - 1; i >= 0; i--) {
        var coincount = 0;
        var coinval = getCoinAmount(coinams[i]);
        if (coinval > 0) {
            while (am >= coinval) {
                coincount++;
                am -= coinval;
            }
        }
        if (coincount > 0) {
            var coinitem = w.createItem(_COINITEMS[coinams[i]], 0, coincount);
            coinitem.setCustomName(ccs(currency.displayPrefix + currency.displayName + '&r'));
            coinitem.setLore([
                ccs('&e' + getAmountCoin(getCoinAmount(coinams[i].toUpperCase())))
            ]);
            nmItems.push(coinitem);
        }
    }

    return nmItems;
}

/**
 * Retrieves the currency object based on the currency type.
 * @param {string} type - The type of currency.
 * @returns {Object|null} - The currency object or null if not found.
 */
function getCurrency(type) {
    for (var i in VIRTUAL_CURRENCIES) {
        var currency = VIRTUAL_CURRENCIES[i];
        if (currency.name != type) {
            continue;
        }
        return currency;
        break;
    }

    return null;
}