load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

var gramados_json = loadJson("world/customnpcs/scripts/configs/gramados_data.json");

function init(event) {
    var world = Java.type('noppes.npcs.api.NpcAPI').Instance().getIWorld(0);
    // Test all functions here
    var testPrice = "10g50c";
    var convertedPrice = convertPrice(testPrice);
    world.broadcast("Converted Price: " + convertedPrice);

    var testStack = {}; // Replace with actual item stack for testing
    var testWorld = {}; // Replace with actual world object for testing
    var testCurrencyType = "money";
    var itemMoney = getItemMoney(testStack, testWorld, testCurrencyType);
    world.broadcast("Item Money: " + itemMoney);

    var isMoney = isItemMoney(testStack, testWorld, testCurrencyType);
    world.broadcast("Is Item Money: " + isMoney);

    var testAmount = 1050;
    var amountCoin = getAmountCoin(testAmount);
    world.broadcast("Amount Coin: " + amountCoin);

    var testCoinStr = "10g50c";
    var coinAmount = getCoinAmount(testCoinStr);
    world.broadcast("Coin Amount: " + coinAmount);

    var generatedMoney = genMoney(testWorld, testAmount, testCurrencyType);
    world.broadcast("Generated Money: " + generatedMoney);

    var testCurrency = getCurrency(testCurrencyType);
    world.broadcast("Currency: " + testCurrency);
}

function convertPrice(price) {
    var grons = price.split("g")[0];
    var cents = price.split("g")[1];
    cents = parseInt(cents.split("c")[0]);
    return parseInt(grons) * 100 + cents;
}

function getItemMoney(stack, w, currencyType) {
    for (var ival in gramados_json._COINITEMS) {
        var ci = gramados_json._COINITEMS[ival];
        var cm = genMoney(w, getCoinAmount(ival), currencyType)[0] || null;
        if (cm != null) {
            if (isItemEqual(stack, cm)) {
                return getCoinAmount(ival);
            }
        }
    }
    return 0;
}

function isItemMoney(stack, w, currencyType) {
    return getItemMoney(stack, w, currencyType) > 0;
}


//Converts int to string
function getAmountCoin(amount) {
    var rstr = '';
    var ams = sign(amount);
    if (ams == -1) { rstr = '-'; }
    amount = Math.abs(amount);
    var ckeys = Object.keys(gramados_json._COINTABLE);
    for (var i = ckeys.length - 1; i >= 0; i--) {

        var add = 0;
        while (amount >= gramados_json._COINTABLE[ckeys[i]]) {
            add++;
            amount -= gramados_json._COINTABLE[ckeys[i]];
        }
        if (add > 0) {
            rstr += add.toString() + ckeys[i].toUpperCase();
        }
    }

    if (rstr == '') { rstr = '0G'; }
    return rstr;
}
//converts string to int
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
        var coinkeys = Object.keys(gramados_json._COINTABLE);
        if (coinkeys.indexOf(_amunit) > -1) {
            amount += _amnum * gramados_json._COINTABLE[_amunit];
        }
    }
    return amount * sgn;
}

// Existing code for genMoney remains unchanged
function genMoney(w, amount) {
    var am = amount;
    var coinams = Object.keys(gramados_json._COINITEMS);

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
            var coinitem = w.createItem(gramados_json._COINITEMS[coinams[i]], 0, coincount);
            coinitem.setCustomName(ccs('&2&lMoney&r'));
            coinitem.setLore([
                ccs('&e' + coinams[i].toUpperCase())
            ]);
            nmItems.push(coinitem);
        }
    }

    return nmItems;
}

function genMoney(w, amount, currencyType) {
    if (typeof (currencyType) == typeof (undefined) || currencyType === null) { currencyType = 'money'; }
    var am = amount
    var coinams = Object.keys(gramados_json._COINITEMS);
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
            var coinitem = w.createItem(gramados_json._COINITEMS[coinams[i]], 0, coincount);
            coinitem.setCustomName(ccs(currency.displayPrefix + currency.displayName + '&r'));
            coinitem.setLore([
                ccs('&e' + getAmountCoin(getCoinAmount(coinams[i].toUpperCase())))
            ]);
            nmItems.push(coinitem);
        }
    }


    return nmItems;
}

function getCoinAmount(str) {
    var arx = /([\d]+)([a-zA-Z]+)/g;
    var amounts = str.match(arx) || [];
    var amount = 0;

    for (var a in amounts) {
        var _am = amounts[a];
        var _amnum = parseInt(_am.replace(arx, '$1'));
        var _amunit = _am.replace(arx, '$2').toLowerCase();
        var coinkeys = Object.keys(gramados_json._COINTABLE);
        if (coinkeys.indexOf(_amunit) > -1) {
            amount += _amnum * gramados_json._COINTABLE[_amunit];
        }
    }
    return amount;
}

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