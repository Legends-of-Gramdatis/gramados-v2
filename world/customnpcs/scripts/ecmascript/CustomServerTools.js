load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_emotes.js');

var gramados_json = loadJson("world/customnpcs/scripts/data/gramados_data.json");

var _RAWCOLORS = {
    '0': 'black',
    '1': 'dark_blue',
    '2': 'dark_green',
    '3': 'dark_aqua',
    '4': 'dark_red',
    '5': 'dark_purple',
    '6': 'gold',
    '7': 'gray',
    '8': 'dark_gray',
    '9': 'blue',
    'a': 'green',
    'b': 'aqua',
    'c': 'red',
    'd': 'light_purple',
    'e': 'yellow',
    'f': 'white',
}
var _RAWEFFECTS = {
    'o': 'italic',
    'l': 'bold',
    'k': 'magic',
    'm': 'strike',
    'n': 'underline',
    'r': 'reset'
}
var UNI = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
];
var CHAT_EMOTES = {
    "check_mark": "\u9366",
    "cross_mark": "\u9367",
    "sun": "\u2739",
    "star": "\u2729",
    "recycle": "\u267B",
    "seagull": "\u932A",
    "slight_smile": "\u9510",
    "smiley": "\u9511",
    "relieved": "\u9512",
    "wink": "\u9513",
    "upside_down": "\u9514",
    "smile": "\u9515",
    "joy": "\u9516",
    "happy": "\u9517",
    "open_mouth": "\u9518",
    "dizzy_face": "\u9519",
    "scream": "\u951A",
    "hushed": "\u951B",
    "astonished": "\u951F",
    "slight_frown": "\u9520",
    "pleading_face": "\u9521",
    "cry": "\u9522",
    "tired_face": "\u9523",
    "pensive": "\u9524",
    "neutral_face": "\u9525",
    "expressionless": "\u9526",
    "cool": "\u9528",
    "persevere": "\u9529",
    "star_struck": "\u952A",
    "relaxed": "\u952B",
    "blush": "\u952C",
    "flushed": "\u952D",
    "kissing_closed_eyes": "\u952E",
    "drooling_face": "\u952F",
    "heart_eyes": "\u9530",
    "kissing": "\u9533",
    "kissing_smiling_eyes": "\u9535",
    "kissing_heart": "\u9536",
    "smiling_face_with_3_hearts": "\u9537",
    "rolling_eyes": "\u9538",
    "zipper_mouth": "\u9539",
    "mask": "\u953C",
    "innocent": "\u953E",
    "confused": "\u953F",
    "yum": "\u9541",
    "stuck_out_tongue": "\u9542",
    "stuck_out_tongue_closed_eyes": "\u9543",
    "stuck_out_tongue_winking_eyes": "\u9544",
    "zany_face": "\u9546",
    "angry": "\u9548",
    "rage": "\u9549",
    "face_with_symbols_over_mouth": "\u954A",
    "cold_face": "\u954B",
    "smiling_imp": "\u954C",
    "imp": "\u954D",
    "nauseated_face": "\u954E",
    "sick": "\u954F",
    "thonk": "\u950B",
    "heart": "\u93E7",
    "heart_gold": "\u93F2",
    "heart_wither": "\u93F1",
    "heart_dark": "\u9416",
    "wifi5": "\u936A",
    "wifi4": "\u936B",
    "wifi3": "\u936C",
    "wifi2": "\u936D",
    "wifi1": "\u936E",
    "wifi0": "\u936F",
    "lang": "\u935C",
    "money": "\u932B",
    "trin": "\u932D",
    "unu": "\u932E",
    "wheel": "\u9509",
    "folder": "\u932F",
    "thumbsup": "\u93F3",
    "thumbsdown": "\u93F4",
    "bomb": "\u93F5",
    "hazard": "\u93F6",
    "ying": "\u93F7",
    "danger": "\u93F8",
    "noperm": "\u93F9",
    "gear": "\u93FA",
    "stats": "\u93FB",
    "medal_choco": "\u9508",
    "medal_bronze": "\u9507",
    "medal_silver": "\u9506",
    "medal_gold": "\u9505",
    "medal_diamond": "\u9504",
    "medal_emerald": "\u9503",
    "medal": "\u9502",
    "trophy": "\u950A",
    "unlock": "\u937E",
    "lock": "\u937F",
    "car": "\u950D",
    "airplane": "\u950E",
    "computer": "\u950E",
    "factory": "\u950F",
    "arrow_u": "\u9920",
    "arrow_ur": "\u9921",
    "arrow_r": "\u9922",
    "arrow_dr": "\u9923",
    "arrow_d": "\u9924",
    "arrow_dl": "\u9925",
    "arrow_l": "\u9926",
    "arrow_ul": "\u9927",
    "clock_day": "\u9048",
    "clock_1": "\u9049",
    "clock_2": "\u904A",
    "clock_3": "\u904B",
    "clock_night": "\u904C",
    "clock_4": "\u904D",
    "clock_5": "\u904E",
    "clock_6": "\u904F",
    "bed": "\u90A9",
    "demonic_ingot": "\u93CB",
    "mithril_ingot": "\u93CC",
    "iron_ingot": "\u90B0",
    "gold_ingot": "\u90B1",
    "brick": "\u90B2",
    "nether_brick": "\u90B3",
    "diamond": "\u90B6",
    "ruby": "\u90B7",
    "emerald": "\u90B8",
    "sapphire": "\u93FC",
    "amethyst": "\u93CE",
    "quartz": "\u90B9",
    "crystal": "\u90BA",
    "nether_star": "\u90BD",
    "exp": "\u9901",
    "book_quill": "\u9062",
    "feather": "\u9063",
    "page_facing_up": "\u9064",
    "gapple": "\u9902",
    "creamcookie": "\u932C",
    "bread": "\u90EA",
    "cookie": "\u90EB",
    "cake": "\u90EC",
    "ppie": "\u90ED",
    "egg": "\u906C",
    "pumpkins": "\u90F0",
    "pumpkin": "\u90F1",
    "squash": "\u90F2",
    "fish": "\u90E4",
    "meat_small": "\u95A7",
    "meat_medium": "\u95A9",
    "meat_big": "\u95A8",
    "meat_prime": "\u95AA",
    "meat_gold": "\u95AB",
    "map": "\u945B",
    "key_car": "\u9560",
    "key": "\u9561",
    "key2": "\u9562",
    "relic_tablet": "\u9570",
    "relic_coin": "\u9571",
    "relic_scroll": "\u9572",
    "relic_mask": "\u9573",
    "relic_statuette": "\u9574",
    "lit": "\u9200",
    "ghost": "\u94DB",
    "hunger_empty": "\u93D2",
    "hunger_half": "\u93D1",
    "hunger_full": "\u93D0",
    "hp": "\u9390",
    "hphalf": "\u9391",
    "hpempty": "\u938E",
    "coal": "\u90B4",
    "ccoal": "\u90B5",
    "dead_bush": "\u91B4",
    "swiftness": "\u93E0",
    "slowness": "\u93E1",
    "haste": "\u93E2",
    "mining_fatigue": "\u93E3",
    "strength": "\u93E4",
    "weakness": "\u93E5",
    "poison": "\u93E6",
    "invisibility": "\u93E8",
    "hunger": "\u93E9",
    "jump_rabbit": "\u93EA",
    "nausea": "\u93EB",
    "mossy_log": "\u9466",
    "fountain": "\u9462",
    "fountain_desert": "\u9440",
    "tree_house": "\u946E",
    "hut_witch": "\u9443",
    "hut_dirt": "\u946B",
    "hut_wooden": "\u9469",
    "hut_brick": "\u946A",
    "tower": "\u946C",
    "castle": "\u946D",
    "ruins": "\u946F",
    "brewers_kit": "\u9453",
    "empire_block": "\u9500",
    "empire_ornate": "\u9501",
    "deadstone": "\u9468",
    "coal_ore": "\u9220",
    "iron_ore": "\u9221",
    "gold_ore": "\u9222",
    "redstone_ore": "\u9223",
    "diamond_ore": "\u9224",
    "lapis_ore": "\u9225",
    "emerald_ore": "\u9226",
    "coal_block": "\u9230",
    "iron_block": "\u9231",
    "gold_block": "\u9232",
    "redstone_block": "\u9233",
    "diamond_block": "\u9234",
    "lapis_block": "\u9235",
    "emerals_block": "\u9236",
    "cobble": "\u9227",
    "mosscobble": "\u9228",
    "stone": "\u9229",
    "chest": "\u92F9",
    "enderchest": "\u92FB",
    "giftchest": "\u92FC",
    "pumpkin_block": "\u9270",
    "jacklantern": "\u9271",
    "melon": "\u9274",
    "cactus": "\u9276",
    "sponge": "\u927C",
    "tnt": "\u927E",
    "fire": "\u95AF",
    "water": "\u920B",
    "lava": "\u920E",
    "portal": "\u920F",
    "log": "\u926B",
    "log2": "\u926C",
    "wood": "\u926D",
    "bookcase": "\u926E",
    "bookcasepotion": "\u9463",
    "trapdoor": "\u926F",
    "lamp_on": "\u9248",
    "lamp_off": "\u9247",
    "door": "\u90A4",
    "door_iron": "\u90A5",
    "creeper": "\u94CA",
    "ccreeper": "\u94CB",
    "skeleton": "\u94CC",
    "wskeleton": "\u94CD",
    "spider": "\u94CE",
    "zombie": "\u94CF",
    "vzombie": "\u94D0",
    "slime": "\u94D1",
    "ghast": "\u94D2",
    "oghast": "\u94D3",
    "pigzombie": "\u94D4",
    "enderman": "\u94D5",
    "cave_spider": "\u94D6",
    "silverfish": "\u94D7",
    "blaze": "\u94D8",
    "mslime": "\u94D9",
    "witch": "\u94DA",
    "pig": "\u9499",
    "sheep": "\u949A",
    "cow": "\u949B",
    "chicken": "\u949C",
    "villager": "\u94BE",
    "seastar": "\u91AA",
    "seashell": "\u91AB",
    "holy_grenade": "\u9550",
    "backpack": "\u9553",
    "cobweb": "\u91CF",
    "railsv": "\u91E0",
    "railsh": "\u91E8",
    "rails_ru": "\u91F0",
    "rails_lu": "\u91F1",
    "rails_rd": "\u91E1",
    "rails_ld": "\u91E9",
    "prailsv_off": "\u91E2",
    "prailsv_on": "\u91E3",
    "drailsv_off": "\u91E4",
    "drailsv_on": "\u91E5",
    "arailsv_off": "\u91E6",
    "arailsv_on": "\u91E7",
    "prailsh_off": "\u91EA",
    "prailsh_on": "\u91EB",
    "drailsh_off": "\u91EC",
    "drailsh_on": "\u91ED",
    "arailsh_off": "\u91EE",
    "arailsh_on": "\u91EF",
    "crowbar": "\u9050",
    "hammer": "\u9051",
    "lighter": "\u9052",
    "flint_and_steel": "\u9053",
    "army_knife": "\u9054",
    "wrench": "\u9055",
    "wrench_1": "\u9056",
    "pipe_wrench": "\u9057",
    "fuel_hose": "\u9058",
    "jumper_cables": "\u9059",
    "jumper_pack": "\u905A",
    "y2k": "\u905B",
    "shears": "\u905C",
    "lead": "\u905D",
    "name_tag": "\u905E",
    "ticket": "\u905F",
    "wooden_sword": "\u9000",
    "wooden_pickaxe": "\u9001",
    "wooden_shovel": "\u9002",
    "wooden_axe": "\u9003",
    "wooden_hoe": "\u9004",
    "stone_sword": "\u9005",
    "stone_pickaxe": "\u9006",
    "stone_shovel": "\u9007",
    "stone_axe": "\u9008",
    "stone_hoe": "\u9009",
    "golden_sword": "\u900A",
    "golden_pickaxe": "\u900B",
    "golden_shovel": "\u900C",
    "golden_axe": "\u900D",
    "golden_hoe": "\u900E",
    "iron_sword": "\u9010",
    "iron_pickaxe": "\u9011",
    "iron_shovel": "\u9012",
    "iron_axe": "\u9013",
    "iron_hoe": "\u9014",
    "diamond_sword": "\u9015",
    "diamond_pickaxe": "\u9016",
    "diamond_shovel": "\u9017",
    "diamond_axe": "\u9018",
    "diamond_hoe": "\u9019",
    "crown": "\u9551",
    "crown_1": "\u9552",
    "shotgun": "\u9620",
    "rifle": "\u9621",
    "gun": "\u9622",
    "box": "\u2B1B"
};
var _COINTABLE = {
    'c': 1,
    'g': 100,
    'k': 100000,
    'm': 100000000,
    'b': 100000000000,
    't': 100000000000000,
    'q': 100000000000000000,
    's': 100000000000000000000
};

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var INbt = Java.type('noppes.npcs.api.INbt');
var LogManager = Java.type('org.apache.logging.log4j.LogManager');
var Logger = LogManager.getLogger("GramdatisScript");
var ForgeLoader = Java.type('net.minecraftforge.fml.common.Loader').instance();
var EntityType = Java.type('noppes.npcs.api.constants.EntityType');
var _TIMERS = [];
var _RAWCODES = Object.keys(_RAWCOLORS).concat(Object.keys(_RAWEFFECTS));
var CHAT_CMD_RGX = /{[\s]*(?:([\w]+)[\s]*\:[\s]*([\w\W\/]+?)|\*)(?:[\s]*\|[\s]*([\w]+)[\s]*\:[\s]*([\w\W\/]+?[\s]*))?}/;
var CHAT_CMD_RGX_G = /{[\s]*(?:([\w]+)[\s]*\:[\s]*([\w\W\/]+?)|\*)(?:[\s]*\|[\s]*([\w]+)[\s]*\:[\s]*([\w\W\/]+?[\s]*))?}/g;
var _ENCHANTS = [];
var CSTENCH_TAG = "CSTEnch";
var SCRIPT_VERSION = "%__FILENAME__%";
var SLOWTICK_TIMER_ID = 1;
var SLOWTICK_TIMER = 100;
var MENU_TIMER_ID = 420;
var MENU_TIMER_PAYLOAD = null;
var MENU_ON_CLOSE = [];
var MENU_CAN_EDIT = false;
var rgx_selector = /@([\w]+)(?:\[([^\v]*)\])?/;
var rgx_selector_arg = /(\w+)(?:=(\w+)?(?:(\.\.)(\w+)?)?)?/g;
var rgx_selector_nbt = /(\w+)={([\S]+})?/g;

var MCP = {
    "functions": {
        "ItemStack_getItem": "func_77973_b",
        "Item_getEquipmentSlot": "func_185083_B_",
        "EntityLivingBase_travel": "func_191986_a",
        "EntityLivingBase_setAIMoveSpeed": "func_70659_e",
        "EntityLivingBase_getAIMoveSpeed": "func_70689_ay",
        "EntityLiving_getMoveHelper": "func_70605_aq",
        "EntityMoveHelper_strafe": "func_188488_a",
        "ISaveHandler_getWorldDirectory": "func_75765_b"
    },
    "fields": {
        "World_isRemote": "field_72995_K",
        "World_worldInfo": "field_72986_A",
        "World_saveHandler": "field_73019_z",
        "Entity_onGround": "field_70122_E",
    }

};

var MCItem = Java.type("net.minecraft.item.Item");
var MCItemArmor = Java.type("net.minecraft.item.ItemArmor");
var MCItemBow = Java.type("net.minecraft.item.ItemBow");
var MCItemSword = Java.type("net.minecraft.item.ItemSword");
var MCItemTool = Java.type("net.minecraft.item.ItemTool");
var EntityEqSlot = Java.type("net.minecraft.inventory.EntityEquipmentSlot");
var REGISTRY = Java.type('net.minecraftforge.fml.common.registry.ForgeRegistries');



/*
    Custom Server Tools
*/

Date.prototype.addTime = function (addTime) {
    this.setTime(this.getTime() + addTime);
};

Date.prototype.hasPassed = function (passDate) {
    return (this.getTime() >= passDate.getTime());
};

//Converts TimeString to number
function getStringTime(timeString) {
    //0y4mon3d 6h 8min3s 800ms
    var reg = /([\d]+)([a-zA-Z]+)/g;
    var _m = timeString.match(reg);
    var newTime = NaN;
    var _tk = Object.keys(msTable);

    for (var m in _m) {
        var fm = _m[m];
        var nm = fm.replace(reg, '$1').cInt();
        var om = fm.replace(reg, '$2');
        if (nm != null) {
            if (isNaN(newTime)) { newTime = 0; }
            if (_tk.indexOf(om) != -1) {
                newTime += nm * (msTable[_tk[_tk.indexOf(om)]]);
            } else { newTime += nm; }
        }
    }

    return newTime;
}
//Converts number to TimeString
function getTimeString(stringTime, excludes) {
    if (typeof (excludes) == typeof (undefined) || excludes === null) { excludes = []; }
    var newTime = parseInt(stringTime);
    var newStr = '';
    for (var ms in msTable) {
        if (excludes.indexOf(ms) == -1) {
            var msnum = 0;
            while (newTime >= msTable[ms]) {
                msnum++;
                newTime -= msTable[ms];
            }
            if (msnum > 0) {
                newStr += msnum.toString() + ms;
            }
        }
    }


    return newStr;
}


function getDateString(val, mode, dateSeperator, timeSeperator) {
    if (typeof (mode) == typeof (undefined) || mode === null) { mode = null; }
    if (typeof (dateSeperator) == typeof (undefined) || dateSeperator === null) { dateSeperator = '/'; }
    if (typeof (timeSeperator) == typeof (undefined) || timeSeperator === null) { timeSeperator = ':'; }
    var date = new Date();
    date.setTime(val);

    var outputStr = '';

    if ((mode || 'date') == 'date') {
        var showDay = date.getDate();
        var showMonth = (date.getMonth() + 1).toString().padStart(2, '0');
        var showYear = date.getFullYear();
        outputStr += showDay + dateSeperator + showMonth + dateSeperator + showYear + (mode == null ? ' ' : '');
    }
    if ((mode || 'time') == 'time') {
        var showHours = date.getHours().toString().padStart(2, '0');
        var showMins = date.getMinutes().toString().padStart(2, '0');
        var showSecs = date.getSeconds().toString().padStart(2, '0');
        outputStr += showHours + timeSeperator + showMins + timeSeperator + showSecs;
    }

    return outputStr;
} function getFnArgs(fn) {
    var fnrgx = /function[\s]+([\w]+)\(([\w,\s]+)\)/;
    var fnstr = fn.toString();
    var fnargs = [];
    var m = fnstr.match(fnrgx);
    if (m != null) {

        m[2].split(',').forEach(function (a) {
            fnargs.push(a.trim());
        });

        return fnargs;
    }

    return fnargs;
}
//Convert object to array
function objArray(obj) {
    var a = [];
    for (var i in obj) {
        var o = obj[i];
        a.push(o);
    }
    return a;
}

function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

function getObjectProp(obj, prop) {
    var objRgx = /([\w]+)(?:\[(\d+)\])?/g;
    var match;
    while ((match = objRgx.exec(prop)) !== null) {
        //handle key
        if (typeof obj[match[1]] === 'undefined') {
            return null;
        }

        obj = obj[match[1]];

        if (typeof match[2] !== 'undefined') {
            if (typeof obj[parseInt(match[2])] === 'undefined') {
                return null;
            }

            obj = obj[parseInt(match[2])];
        }
    }

    return obj
}

//Get functions in the object
function getAllFuncs(obj) {
    var props = [];

    do {
        props = props.concat(Object.getOwnPropertyNames(obj));
    } while (obj = Object.getPrototypeOf(obj));

    return props.sort().filter(function (e, i, arr) {
        if (e != arr[i + 1] && typeof obj[e] == 'function') return true;
    });
}

//Merge 2 objects
function objMerge(obj1, obj2, inheritNewProps) {
    if (typeof (inheritNewProps) == typeof (undefined) || inheritNewProps === null) { inheritNewProps = true; }
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) {
        if (inheritNewProps || Object.keys(obj1).indexOf(attrname) > -1) {
            obj3[attrname] = obj2[attrname];
        }
    }
    return obj3;
}

Object.__proto__.assign = function () {
    var obj = arguments[0];

    for (var i = 1; i < arguments.length; i++) {
        var arg = arguments[i];
        for (var key in arg) {
            var value = arg[key];
            obj[key] = value;
        }
    }

    return obj;
};

Object.__proto__.values = function (obj) {
    var vals = [];
    for (var i in obj) {
        vals.push(obj[i]);
    }

    return vals;
}
/* */

function formatObj(obj, tabIndex, maxDeep, maxLoop, propTypes, propType, argFn) {
    if (typeof (propTypes) == typeof (undefined) || propTypes === null) { propTypes = {}; }
    if (typeof (argFn) == typeof (undefined) || argFn === null) { argFn = null; }
    if (typeof obj === 'object' && obj !== null) {

        var tabIndex = (typeof tabIndex === 'undefined' || tabIndex == null) ? 1 : tabIndex;
        var isObjArray = isArray(obj);
        var tabs = '';
        var prevTabs = '';
        for (var i = 0; i < tabIndex; i++) {
            tabs += '  ';
            if (i < tabIndex - 1) {
                prevTabs += '  ';
            }
        }

        var str = prevTabs + '&8[\n';
        if (tabIndex <= maxDeep || maxDeep === -1 || typeof maxDeep === 'undefined') {
            var index = 0;
            for (var i in obj) {
                if (index > maxLoop && typeof maxLoop !== 'undefined' && maxLoop !== -1) {
                    str += tabs + '&e&l...\n';
                    break;
                }
                index++;
                var passPropType = propTypes[i] || null;
                var args = {
                    obj: obj,
                    tabIndex: tabIndex,
                    maxDeep: maxDeep,
                    maxLoop: maxLoop,
                    propTypes: propTypes,
                    passPropType: passPropType,
                    argFn: argFn
                };

                if (typeof argFn === 'function') {
                    argFn.apply(args);
                }

                str += tabs + (parseInt(i).toString() == i.toString() ? '&b' + i : '&c"' + i + '"') + '&7 => ' + formatObj(obj[i], args.tabIndex + 1, args.maxDeep, args.maxLoop, args.propTypes, args.passPropType, args.argFn) + ',\n';
            }
        } else {
            str += tabs + '&e&l...\n';
        }

        str += prevTabs + '&8]';
        return str;
    }
    // print(JSON.stringify([propTypes, propType]));
    switch (propType) {
        case 'money':
            obj = '&r:money:&e' + getAmountCoin(obj) + '&7';
            break;
        case 'time':
            obj = '&e' + getTimeString(obj) + '&7';
            break;
        case 'date':
            obj = '&e' + getDateString(obj) + '&7';
            break;
        default:
            if (obj == null) {
                obj = '&6&lnull&7';
            } else if (typeof obj === 'string') {
                obj = '&a"' + obj + '"&7';
            } else if (typeof obj === 'number') {
                obj = '&e' + obj.toString() + '&7';
            } else if (typeof obj === 'boolean') {
                obj = '&3' + obj.toString() + '&7';
            }
            break;
    }

    return obj;
}; /* */if (typeof (Object.values) !== "function") {
    Object.values = function (obj) {
        var v = [];
        for (var i in obj) {
            var oi = obj[i];
            v.push(oi);
        }

        return v;
    }
}
if (typeof (Object.keys) !== "function") {
    Object.keys = function (obj) {
        var v = [];
        for (var i in obj) {
            var oi = obj[i];
            v.push(i);
        }

        return v;
    }
}
String.prototype.allMatch = function (regx) {
    var m = this.match(regx);
    var rr = [];
    for (var mm in m) {
        var mt = m[mm];
        var rx = regx.exec(this);
        rr.push(rx);
    }

    return rr;
};


String.prototype.cmatch = function (regx) {
    return (this.match(regx) || []).length;
};

String.prototype.rangeUpper = function (min, max) {
    var str = '';
    for (var i = 0; i < this.length; i++) {
        var c = this.substring(i, i + 1); //curchar
        if (i >= min && i < max) {
            c = c.toUpperCase();
        }
        str += c.toString();
    }
    return str;
};
String.prototype.rangeLower = function (min, max) {
    var str = '';
    for (var i = 0; i < this.length; i++) {
        var c = this.substring(i, i + 1); //curchar
        if (i >= min && i < max) {
            c = c.toLowerCase();
        }
        str += c.toString();
    }
    return str;
};

String.prototype.pad = function (character, len) {
    var n = this.toString();
    for (var i = n.length; i < len; i++) {
        n += character.toString();
    }
    return n;
};

String.prototype.fill = function (payload) {
    var str = this.toString();
    for (var p in payload) {
        var payl = payload[p];
        str = str.split("{" + p + "}").join(payl);
    }
    return str;
}

String.prototype.padMiddle = function (character, len) {

    var n = this.toString();
    var sc = Math.floor((len - n.length) / 2);
    var ns = '';
    for (var i = 0; i < sc; i++) {
        ns += character.toString();
    }
    ns += n;
    for (var i = 0; i < sc; i++) {
        ns += character.toString();
    }
    return ns;
};

String.prototype.cInt = function () {
    return (isNaN(parseInt(this)) ? null : parseInt(this));
};


String.prototype.append = function (ch, amount) {
    var new_str = this.toString();
    for (var i = 0; i < amount; i++) {
        if (i >= new_str.length) {
            new_str += ch.toString();
        }
    }

    return new_str;
};

String.prototype.prepend = function (ch, amount) {
    var new_str = this.toString();
    for (var i = 0; i < amount; i++) {
        if (i >= new_str.length) {
            new_str = ch.toString() + new_str;
        }
    }

    return new_str;
};

String.prototype.replaceAll = function (search, replacement) {
    var target = this.toString();
    if (typeof (search) == 'string') { search = [search]; }
    for (var s in search) {
        var sr = search[s];
        target = target.split(sr).join(replacement);
    }
    return target;
};

function occurrences(string, subString, allowOverlapping, caseSensitive) {
    if (typeof (allowOverlapping) == typeof (undefined) || allowOverlapping === null) { allowOverlapping = false; }
    if (typeof (caseSensitive) == typeof (undefined) || caseSensitive === null) { caseSensitive = true; }
    string = string.toString()
    subString = subString.toString()

    if (!caseSensitive) {
        string = string.toLowerCase();
        subString = subString.toLowerCase();
    }

    if (subString.length <= 0) return (string.length + 1);

    var n = 0,
        pos = 0,
        step = allowOverlapping ? 1 : subString.length;

    while (true) {
        pos = string.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}

function stringIsNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function stringIsBool(n) {
    return (['true', 'false'].indexOf(n.toLowerCase()) > -1);
}

if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
        padString = (typeof padString !== 'undefined' ? padString : ' ').toString();
        if (this.length > targetLength) {
            return this.toString();
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + (this).toString();
        }
    };
}

if (!String.prototype.padEnd) {
    String.prototype.padEnd = function padEnd(targetLength, padString) {
        targetLength = targetLength >> 0; //floor if number or convert non-number to 0;
        padString = (typeof padString !== 'undefined' ? padString : ' ').toString();
        if (this.length > targetLength) {
            return (this).toString();
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); //append to original to ensure we are longer than needed
            }
            return (this) + padString.slice(0, targetLength);
        }
    };
}




//Add data to IData even if it does exist
function data_overwrite(data, keys, vals) {
    if (typeof (keys) == typeof (undefined) || keys === null) { keys = []; }
    if (typeof (vals) == typeof (undefined) || vals === null) { vals = []; }
    if (typeof (keys) == 'string') { keys = [keys]; }
    if (typeof (vals) == 'string') { vals = [vals]; }

    for (var k in keys) {
        var key = keys[k];
        var val = vals[k];
        data.put(key, val);
    }
}


var NbtTypes = {
    "Byte": 1,
    "Short": 2,
    "Integer": 3,
    "Long": 4,
    "Float": 5,
    "Double": 6,
    "ByteArray": 7,
    "String": 8,
    "List": 9,
    "Compound": 10,
    "IntegerArray": 11,
};

function getNbtType(num) {
    for (var n in NbtTypes) {
        var nbtType = NbtTypes[n];
        if (nbtType === num) { return n; }
    }
    return null;
}

function check_and_update_sign(region, pl) {
    if (region.data.ownerSigns && region.data.ownerSigns.length) {
        for (var i = 0; i < region.data.ownerSigns.length; i++) {
            var s = region.data.ownerSigns[i];
            if (!s) return false;
            var line = (s.line != null ? s.line : 2);
            var blk = pl.getWorld().getBlock(s.x, s.y, s.z);
            if (!blk || !blk.getTileEntityNBT) {
                // remove this sign from list
                region.data.ownerSigns.splice(i, 1);
                i--;
                return false;
            }
            try {
                var te = blk.getTileEntityNBT();
                if (!te) return false;

                var li = parseInt(line, 10);
                if (isNaN(li) || li < 1) li = 1; if (li > 4) li = 4;
                var key = "Text" + li;
                var newText = region.data.owner == null ? "Available" : region.data.owner;
                newText = region.data.owner == "Gramados" ? "Available" : newText;
                newText = region.data.forSale ? "Available" : newText;
                var json = JSON.stringify({ text: newText });
                te.setString(key, json);
                blk.setTileEntityNBT(te);
                // Force block update to reflect changes visually
                try { if (blk.update) blk.update(); } catch (e) {}
            } catch (e) {
                Logger.error("Error updating sign at " + s.x + "," + s.y + "," + s.z + ": " + e);
                // remove this sign from list
                region.data.ownerSigns.splice(i, 1);
                i--;
                return false;
            }
        }
    }
}

function getMCModList() {
    var modlist = [];
    var loadmods = Java.type("net.minecraftforge.fml.common.Loader").instance().getModList();

    for (var mid in loadmods) {
        var lmod = loadmods[mid];
        modlist.push(lmod.getModId());
    }

    return modlist;
}

function hasMCMod(name) {
    return getMCModList().indexOf(name) > -1;
}


function ENbt(nbtObject) {
    this.nbt = nbtObject; /* INbt */
    this.copy = function () {
        return new ENbt(API.stringToNbt(this.nbt.toJsonString()));
    };
    this.get = function (path) {
        var paths = path.toString().split(".");
        var cur = this.nbt;
        for (var pa in paths) {
            var p = paths[pa];
            var keyType = getNbtType(cur.getType(p));
            if (keyType != "List") {
                //getString, getInteger etc
                cur = cur["get" + keyType](p);
            } else {
                cur = cur["get" + keyType](p, cur.getListType(p));
            }
        }
        return cur;
    };
    this.toJsonString = function () { return this.nbt.toJsonString(); }
    this.toJsonObj = function () { return JSON.parse(this.toJsonString()); }
}

function nbtCopy(nbt) {
    return API.stringToNbt(nbt.toJsonString());
}

function nbtToObject(nbt) {
    return nbt.toJsonString().replace(/"([\w:]+?)": (\d)\w/g, '"$1": $2');
}

function nbtItem(nbt, w) {
    if (typeof (nbt) == 'string') { nbt = API.stringToNbt(nbt); }
    var item = w.createItemFromNbt(nbt);
    return item;
}

function nbtGetList(nbt, list) {
    return (nbt.has(list) ? nbt.getList(list, nbt.getListType(list)) : null);
}

//Turn String[] with item nbts to IItemStack[]
function nbtItemArr(nbtArr, w) {
    var itemArr = [];
    for (var itemData in nbtArr) {
        var item = nbtArr[itemData];
        itemArr.push(nbtItem(item, w));
    }

    return itemArr;
}

function nbtHasSameData(nbt, onbt) {
    //TODO:compare keys of nbt
} function givePlayerItems(player, stacks, pnbt) {
    if (typeof (pnbt) == typeof (undefined) || pnbt === null) { pnbt = null; }
    var w = player.world;
    if (pnbt == null) {
        pnbt = player.getEntityNbt(); //Dont over-use this one
    }
    var invcnt = getPlayerInvCount(pnbt, w);
    for (var s in stacks) {
        var stack = stacks[s];
        if (invcnt < 36) {
            //Player inv not full
            player.giveItem(stack);
            invcnt++;
        } else {
            player.dropItem(stack);
        }
    }
}

//Made for givePlayerItems (does not include armor and offhand)
function getPlayerInvCount(pnbt, w) {
    return getPlayerInvFromNbt(pnbt, w, function (item, itnbt) {
        //Exclude armor slots and offhand
        return ["-106", "100", "101", "102", "103"].indexOf(itnbt.getByte('Slot').toString()) == -1;
    }).length;
}

function getArrItemCount(array, itemstack, ignoreNbt) {
    if (typeof (ignoreNbt) == typeof (undefined) || ignoreNbt === null) { ignoreNbt = false; }
    var icount = 0;
    for (var pi in array) {
        var pitem = array[pi];
        var pinbt = pitem.getItemNbt();
        var scount = parseInt(pinbt.getByte('Count'));
        if (isItemEqual(itemstack, pitem, ignoreNbt))
            icount += scount;
    }

    return icount;
}

function getInvItemCount(pnbt, itemstack, w, ignoreNbt) {
    return getArrItemCount(getPlayerInvFromNbt(pnbt, w), itemstack, ignoreNbt);
}

function playerIsOnline(world, player) {
    var isOnline = false;
    var pl = world.getAllPlayers();
    for (var p in pl) {
        if (pl[p].getName() == player.toString()) {
            isOnline = true;
            break;
        }
    }
    return isOnline;
}

function scanPlayerOnNbt(player, nbtstring) {
    return player.getEntityNbt().getCompound('Inventory').toJsonString().indexOf(nbtstring.toString()) > -1;
} function normalizePos(pos, asObj) {
    if (typeof (asObj) == typeof (undefined) || asObj === null) { asObj = false; }
    if (!asObj) {
        return [
            pos.x,
            pos.y,
            pos.z,
        ];
    } else {
        return {
            'x': pos.x,
            'y': pos.y,
            'z': pos.z
        }
    }
} function getChunk(pos) {
    return [Math.floor(pos.x / 16), Math.floor(pos.z / 16)];
}

function getChunkCoords(chunk) {
    return [
        chunk[0] * 16,
        chunk[1] * 16,
        (chunk[0] + 1) * 16 - 1,
        (chunk[1] + 1) * 16 - 1,
    ];
}

function inChunk(pos, chunk) {
    var coords = getChunkCoords(chunk);
    return (
        pos.x >= coords[0],
        pos.z >= coords[1],
        pos.x <= coords[2],
        pos.z >= coords[3]
    );
}
var _COMMANDS = [];
var _DATAHANDLERS = {};
//To-Do: Comment this file



registerDataHandler("player", Player);

function Player(name) {


    DataHandler.apply(this, ['player', name]);

    this.addData({
        "lastPayed": 0,
        "pay": 0,
        "payTime": getStringTime('20min'),
        "firstLoan": true,
        "maxJobs": 2,
        "maxHomes": 2,
        "homes": {},
        "defaultHome": null,
        "jobs": {},
        "inventories": [],
        "emotes": [],
        "chatcolors": [], //Unlockables for color coding
        "chatcolor": null, //Default chatcolor
        "badges": [],
        "showbadges": [],
        "badgeCap": 2,
        "chateffect": null,
        "firstLogin": new Date().getTime(),
        "lastLogin": 0,
        "color": null,
        "UUID": null,
        "money": 0,
        "meta": {},
        "unlocks": {}, //general boolean unlocks
        "backPos": null,
        "serverEffects": true
    });

    this.dateData([
        'lastPayed', 'firstLogin', 'lastLogin'
    ]);
    this.timeData([
        'payTime',
    ]);

    this.moneyData([
        'money'
    ]);


    for (var v in VIRTUAL_CURRENCIES) {
        var crncy = VIRTUAL_CURRENCIES[v];
        this.data[crncy.name] = crncy.default || 0;
    }

    this.registerBackPos = function (pos) {
        this.data.backPos = {
            x: pos.x,
            y: pos.y,
            z: pos.z,
        };
        return this;
    };
    this.sync = function (ipl) {
        this.data.UUID = ipl.getUUID();
        this.name = ipl.getName();
        return this;
    };
    this.getTeamName = function (sb) {
        var t = sb.getPlayerTeam(this.name);
        if (t != null) {
            return t.getDisplayName();
        } else if (this.data.title != null) {
            return this.data.title;
        }

        return "";
    };
    this.getCap = function (capName) {
        if (typeof (capName) == typeof (undefined) || capName === null) { capName = null; }
        return Math.floor(this.data[capName ? capName + 'Cap' : 'cap']);
    };
    this.getPlayerColor = function (sb) {
        var t = sb.getPlayerTeam(this.name);
        var ccol = 'white';
        if (this.data.color != null) {
            ccol = this.data.color

        } else if (t != null) {
            ccol = t.getColor();
        }
        return ccol;
    };
    this.getChatColorPref = function (sb, data) {
        var pref = '';
        var prefeff = '';
        var t = sb.getPlayerTeam(this.name);
        if (t != null) {
            var td = new Team(t.getName()).init(data);
            if (td.data.chatcolor != null) {
                pref = '&' + getColorId(td.data.chatcolor);
            }
            if (td.data.chateffect != null) {
                prefeff = '&' + getColorId(td.data.chateffect);
            }
        }

        if (this.data.chatcolor != null) {
            pref = '&' + getColorId(this.data.chatcolor);
        }


        if (this.data.chateffect != null) {
            prefeff = '&' + getColorId(this.data.chateffect);
        }
        return pref + prefeff;
    };

    this.hasUnlock = function (name) {
        return Object.keys(this.data.unlocks).indexOf(name) > -1;
    }

    this.hasColor = function (name) {
        return this.data.chatcolors.indexOf(name) > -1 || this.hasUnlock('chatcolor_' + name);
    };


    this.getNameTag = function (sb, prefix, namesuff, teamsuff, ccChar, data) {
        if (typeof (data) == typeof (undefined) || data === null) { data = null; }
        var t = sb.getPlayerTeam(this.name);
        var dc = ccChar || '&';
        var ccol = '';
        var ctm = '';
        if (this.data.color != null) {
            var cId = getColorId(this.data.color);
            ccol = dc + cId;
        } else if (t != null) {
            ccol = dc + getColorId(t.getColor());
        }

        if (t != null) {
            ctm = ccol + dc + 'o' + t.getDisplayName() + ' ';
        }

        var badgestr = "";
        var badges = data != null ? this.getBadges(data, true) : [];
        var st;
        for (var i in badges) {
            var badge = badges[i];
            if (i < this.getCap('badge')) {
                badgestr += badge.formatBadge();
                // st = (badge.data.displayName + "&r\n" + badge.data.desc).replaceAll("&", "$");
                // badgestr += ":" + badge.data.emote + ":{*|show_text:" + st + "}&r";
            }
        }

        return ccol + dc + 'l[' + ccol + ctm + (teamsuff || '') + dc + 'r' + badgestr + ccol + this.name + (namesuff || '') + ccol + dc + 'l' + ']' + (prefix || '') + dc + 'r';
    };
    this.getBadges = function (data, onlyShow) {
        if (typeof (onlyShow) == typeof (undefined) || onlyShow === null) { onlyShow = false; }
        var retbadges = [];
        for (var i in this.data.badges) {
            var badge = this.data.badges[i];
            var databadge = new Badge(badge);
            if (databadge.load(data) && (onlyShow ? this.data.showbadges.indexOf(badge) > -1 : true)) {


                retbadges.push(databadge);
            }
        }

        return retbadges;
    };
    this.hasBadge = function (name) {
        return this.data.badges.indexOf(name) > -1;
    };
    this.isShowingBadge = function (name) {
        return this.data.showbadges.indexOf(name) > -1 && this.hasBadge(name);
    }
    this.delJob = function (name) {
        if (this.hasJob(name)) {
            delete this.data.jobs[name];
        }
        return this;
    };
    this.getJob = function (name) {
        if (this.hasJob(name)) {
            return this.data.jobs[name];
        }
        return null;
    };
    this.getJobs = function (data) {
        var jobs = [];
        for (var i in this.data.jobs) {
            var job = this.data.jobs[i];
            var pjob = new Job(i);
            if (pjob.load(data)) {
                jobs.push(pjob);
            }
        }
        return jobs;
    };
    this.getJobCount = function () {
        return Object.keys(this.data.jobs).length;
    };
    this.addJob = function (name) {
        this.data.jobs[name] = {
            "lastPayed": 0
        };
        return this;
    };
    this.hasJob = function (name) {
        return Object.keys(this.data.jobs).indexOf(name) > -1;
    };
    this.hasMaxJobs = function () {
        return (this.data.maxJobs != -1 && this.getJobCount() >= this.getMaxJobs());
    };
    this.getMaxJobs = function (sb) {
        //check this.getMaxHomes()
        return this.data.maxJobs;
    };
    this.addHome = function (name, x, y, z) {
        this.data.homes[name] = {
            x: x,
            y: y,
            z: z,
        };
        return this;
    };
    this.delHome = function (name) {
        if (this.data.homes.hasOwnProperty(name)) {
            delete this.data.homes[name];
        }
        return this;
    };
    this.hasHome = function (name) {
        return (this.data.homes.hasOwnProperty(name));
    };
    this.getMaxHomes = function (sb) {
        //WILL be edited later for handling the desision maxHome setting in teams
        return this.data.maxHomes;
    };

    this.getChats = function (data) {
        var chats = [];
        var dkeys = data.getKeys();
        for (var d in dkeys) {
            var dkey = dkeys[d];
            if (dkey.cmatch(/chatchannel_([\w]+)/g) > 0) {
                var cc = new ChatChannel(dkey.replace(/chatchannel_([\w]+)/g, "$1"));
                if (cc.load(data)) {
                    if (cc.data.players.indexOf(this.name) > -1) {
                        chats.push(cc);
                    }
                }
            }
        }

        return chats;
    }
    this.getAllowedColors = function (data, sb) {
        var ac = ['r'];
        var hasAllPerm = new Permission('__ALL__').init(data).permits(this.name, sb, data);
        for (var i in _RAWCOLORS) {
            var col = _RAWCOLORS[i];
            if (this.hasColor(col) || hasAllPerm) {
                ac.push(i);
            }
        }

        return ac;
    };
    this.canCreateCommandText = function (data, sb) {
        return new Permission('chat.command').init(data).permits(this.name, sb, data);
    };
    this.getBounty = function (sb) {
        var sbo = sb.getObjective("bounty");
        if (sbo != null) {
            var sbs = sbo.getScore(this.name);
            if (sbs != null) {
                return sbs.getValue();
            }
        }
        return 0;
    };


    this.getInventory = function (name) {
        for (var invName in this.data.inventories) {
            var inv = this.data.inventories[invName];
            if (inv[0] == name) return inv[1];
        }
        return;
    };
    this.removeInventory = function (name) {
        for (var invName in this.data.inventories) {
            this.data.inventories.splice(invName, 1);
            return true;
        }
        return false;
    };
    this.hasEmote = function (name, sb, data) { //Checks if player has emote
        var em = new Emote(name).init(data, false);
        return (this.data.emotes.indexOf(name) > -1 ||
            em.getPermission().init(data, false).permits(this.name, sb, data) ||
            em.data.default
        );
    };

    this.getAllowedEmotes = function (sb, data) {
        var ems = [];
        for (var c in CHAT_EMOTES) {
            var ce = CHAT_EMOTES[c];
            var ec = new Emote(c);
            ec.load(data);
            if (this.hasEmote(ec.name, sb, data)) {
                ems.push(ec.name);
            }
        }
        return ems;
    };

    this.getBanks = function (data) {
        var banks = [];
        var allBanks = new Bank().getAllDataEntries(data);

        for (var i in allBanks) {
            var checkBank = allBanks[i];
            if (checkBank.canSee(this.name)) {
                banks.push(checkBank);
            }
        }

        return banks;
    }
}

registerDataHandler("permission", Permission);

function Permission(name) {
    DataHandler.apply(this, ['permission', name]);

    this.addData({
        "enabled": true,
        "teams": CONFIG_SERVER.DEFAULT_PERM_TEAMS,
        "players": [],
        "jobs": [],
        "meta": {}
    });

    this.set = function (key, val) {
        this.data[key] = val;
        return this;
    };

    this.addTeams = function (teams) {
        if (typeof (teams) == 'string') { teams = [teams]; }
        for (var t in teams) {
            var team = teams[t];
            var teamname = team;
            if (this.data.teams.indexOf(teamname) == -1) {
                this.data.teams.push(teamname);
            }
        }

        return this;
    };
    this.removeTeams = function (teams) {
        if (typeof (teams) == 'string') {
            teams = [teams];
        }

        var nteams = [];
        for (var t in this.data.teams) {
            var team = this.data.teams[t];
            if (teams.indexOf(team) == -1) {
                nteams.push(team);
            }
        }
        this.data.teams = nteams;
        return this;
    };
    this.addPlayers = function (players) {
        if (typeof (players) == 'string') { players = [players]; }
        for (var p in players) {
            var player = players[p];
            if (this.data.players.indexOf(player) == -1) {
                this.data.players.push(player);
            }
        }

        return this;
    };
    this.removePlayers = function (players) {
        if (typeof (players) == 'string') { players = [players]; }
        var nplayers = [];
        for (var p in this.data.players) {
            var player = this.data.players[p];
            if (players.indexOf(player) == -1) {
                nplayers.push(player);
            }
        }
        this.data.players = nplayers;
        return this;
    };
    this.permitsPlayer = function (pl, listenToDisabled) {
        if (typeof (listenToDisabled) == typeof (undefined) || listenToDisabled === null) { listenToDisabled = true; }
        return this.permits(pl.getName(), pl.world.scoreboard, pl.world.storeddata);
    };

    this.permits = function (player, sb, data, listenToDisabled) {
        if (typeof (listenToDisabled) == typeof (undefined) || listenToDisabled === null) { listenToDisabled = true; }
        ///String player
        ///IScoreboard sb
        ///IData data
        var team = sb.getPlayerTeam(player);
        var permitted = false;
        var p = new Player(player);
        p.load(data);
        //Check enabled
        if (!this.data.enabled && listenToDisabled) { return true; }

        if (this.name != "__ALL__") {
            if (new Permission("__ALL__").init(data, true).permits(player, sb, data, false)) {
                return true;
            }
        }


        //Check team
        if (team != null) {
            if (this.data.teams.indexOf(team.getName()) != -1) {
                permitted = true;
            }
        }
        //Check player
        if (this.data.players.indexOf(player) != -1) {
            permitted = true;
        }

        //Check jobs
        /*
        var pjobs = p.getJobs(data);
        for(var p in pjobs) {
var pjob = pjobs[p];
            if(this.data.jobs.indexOf(pjob.name) != -1) {
                permitted = true;
            }
        }*/

        //Check parents
        var ppar = getParentPerms(this.name || "", data);
        for (var p in ppar) {
            var par = ppar[p];
            if (par.permits(player, sb, data, false)) {
                permitted = true;
                break;
            }
        }



        return permitted;
    };
}

function getParentPerms(name, data) {
    var ps = (name + "").split(".");
    var par = [];
    var cs = "";
    for (var i = 0; i < ps.length; i++) {
        if (i < ps.length - 1) {
            cs += (cs != "" ? "." : "") + ps[i];
            if (new Permission(cs).exists(data)) {
                par.push(new Permission(cs).init(data));
            }
        }
    }
    return par;

}
var VIRTUAL_CURRENCIES = [{
    "name": "armoney",
    "displayName": "Arcade Money",
    "displayPrefix": "&c",
    "default": 0,
    "prefix": "&3:money:A",
    "color": "&d",
    "suffix": "",
},
{
    "name": "vmoney",
    "displayName": "Vote Money",
    "displayPrefix": "&5",
    "default": 0,
    "prefix": "&d:money:V",
    "color": "&b",
    "suffix": "",
},
{
    "name": "credit",
    "displayName": "Store Money",
    "displayPrefix": "&2&l",
    "default": 0,
    "prefix": "&2:money:",
    "color": "&2",
    "suffix": "",
},
{
    "name": "money",
    "displayName": "Money",
    "displayPrefix": "&2&l",
    "default": 0,
    "prefix": "&r:money:&e",
    "color": "&e",
    "suffix": "",
    "items": true
}
];

function formatCurrency(amount, currencyType) {
    if (typeof (currencyType) == typeof (undefined) || currencyType === null) { currencyType = 'money'; }
    for (var i in VIRTUAL_CURRENCIES) {
        var currency = VIRTUAL_CURRENCIES[i];
        if (currency.name != currencyType) {
            continue;
        }

        return currency.prefix + getAmountCoin(amount) + currency.suffix;

        break;
    }

    return null;
}


//Currency settings
var _COINITEMNAME = '&2&lMoney&r'; //Custom name of currency
var _COINITEM_PREFIX = '&e'; //Prefix showing before money value lore (used for color coding)

//Your money items, and their values in money syntax
//"value": "item_id",
var LOWVALUE_ID = "variedcommodities:coin_iron";
var MIDVALUE_ID = "variedcommodities:money";
var HIGHVALUE_ID = "variedcommodities:plans";
var ULTRAVALUE_ID = "variedcommodities:satchel";


//Coin Items for the physical currency
var _COINITEMS = { //MUST BE FROM LOW TO HIGH
    '1c': LOWVALUE_ID,
    '5c': LOWVALUE_ID,
    '10c': LOWVALUE_ID,
    '20c': LOWVALUE_ID,
    '50c': LOWVALUE_ID,
    '1g': LOWVALUE_ID,
    '2g': LOWVALUE_ID,
    '5g': MIDVALUE_ID,
    '10g': MIDVALUE_ID,
    '20g': MIDVALUE_ID,
    '50g': MIDVALUE_ID,
    '100g': MIDVALUE_ID,
    '200g': MIDVALUE_ID,
    '500g': MIDVALUE_ID,
    '1k': HIGHVALUE_ID,
    '2k': HIGHVALUE_ID,
    '10k': HIGHVALUE_ID,
    '20k': HIGHVALUE_ID,
    '50k': HIGHVALUE_ID,
    '100k': HIGHVALUE_ID,
    '1m': ULTRAVALUE_ID,
    '2m': ULTRAVALUE_ID,
    '5m': ULTRAVALUE_ID,
    '10m': ULTRAVALUE_ID,
    '20m': ULTRAVALUE_ID,
    '50m': ULTRAVALUE_ID,
    '100m': ULTRAVALUE_ID,
    '200m': ULTRAVALUE_ID,
    '500m': ULTRAVALUE_ID,
    '1b': ULTRAVALUE_ID,
    '2b': ULTRAVALUE_ID,
    '5b': ULTRAVALUE_ID,
    '10b': ULTRAVALUE_ID,
    '20b': ULTRAVALUE_ID,
    '50b': ULTRAVALUE_ID,
    '100b': ULTRAVALUE_ID,
    '200b': ULTRAVALUE_ID,
    '500b': ULTRAVALUE_ID,
    '1t': ULTRAVALUE_ID,
    '2t': ULTRAVALUE_ID,
    '5t': ULTRAVALUE_ID,
    '10t': ULTRAVALUE_ID,
    '20t': ULTRAVALUE_ID,
    '50t': ULTRAVALUE_ID,
    '100t': ULTRAVALUE_ID,
    '200t': ULTRAVALUE_ID,
    '500t': ULTRAVALUE_ID,
    '1q': ULTRAVALUE_ID,
};//LANGUAGE settings
var _MSG = {
    //Error Strings
    "cmdNotFound": "&cCould not find this command!",
    "cmdNoPerm": "&cYou don't have permission to this command!",
    "argNotValid": "&c'{argName}' is not a valid id/name! It can only contain: &o{allowed}",
    "argToShort": "&c'{argName}' is too short! (Min. {allowed} characters)",
    "argNoColor": "&c'{argName}' cannot contain colorcoding!",
    "argEnum": "&c'{argName}' must be one of the following: &o{allowed}!",
    "argNaN": "&c'{argName}' is not a number!",
    "argMax": "&c'{argName}' cannot be bigger than {allowed}!",
    "argMin": "&c'{argName}' cannot be smaller than {allowed}!",
    "argNotExists": "&c{type} '{argVal}' does not exists!",
    "argExists": "&c{type} '{argVal}' already exists!",
    "argColor": "&cColors must be one of the following: {allowed}!",
    "argColorEffect": "&cChat effects must be one of the following: {allowed}!",
    "argItemAttr": "&cItem attributes must be one of these {allowed}!",
    "argBool": "&c{dataType} must be true or false!",
    //button texts
    "undoBtnText": "Undo",
    "refreshBtnText": "Refresh"
};
//===== CONFIG
var CONFIG_SERVER = {
    "NAME": "TestServer",
    "TITLE": "&5&lTestServer",
    "PREFIX": "&5&l",
    "BAR_OPEN": "&r&l[=======] &r",
    "BAR_CLOSE": "&r&l [=======]&r",
    "DEFAULT_PERM_TEAMS": [
        "Owner",
        "Developer"
    ],
    "DEFAULT_PERM_PLAYERS": [],
    "DEFAULT_TEAM_JOIN": "Player",
    "DEVELOPMENT_MODE": false,
    "USE_DISK": "DEFAULT",
    "LICENSE_KEY": "",
    "FILE_DISKS": {
        "DEFAULT": {
            "path": "{worldname}/customnpcs/scripts/world_data.json"
        },
        "CST_DATA": {
            "path": "CustomServerTools/data/data.json"
        }
    },
    "CHAT_COLOR_CURRENCY": "credit",
    "MONEY_POUCH_SCRIPT": null,
    "REGION_TYPES": {
        "garden": {
            "build": [],
            "interact": []
        }
    }
};

var DEFAULT_MONEY = 0;

//Configure your own time units for in arguments etc!
var msTable = {
    //Reallife time
    'y': 31556926000, //365.25 days for taking leap years into account
    'mon': 2629743830, //
    'w': 604800000,
    'd': 86400000,
    'h': 3600000,
    'min': 60000,
    's': 1000,
    'ms': 1,
};


function handleError(error, logsToConsole, target) {
    if (typeof (logsToConsole) == typeof (undefined) || logsToConsole === null) { logsToConsole = true; }
    if (typeof (target) == typeof (undefined) || target === null) { target = null; }
    var world = API.getIWorld(0);

    var errinfo = "";
    if (error.fileName) {
        errinfo += "$6Error in " + error.fileName + (error.lineNumber ? ':' + error.lineNumber : "") + "\n";
    }
    if (error.message) {
        errinfo += "$e" + error.message.replaceAll("&", "") + "\n";
    }
    if (error.stack) {
        errinfo += "$r\n" + error.stack + "\n";
    }
    var errorTxt = "&cScript error in " + error.fileName + (error.lineNumber ? ":" + error.lineNumber : '') + "! &n&c[Error Info]{*|show_text:" + errinfo.replaceAll("&", "") + "}&r";
    if (logsToConsole) {
        print("Error in " + error.fileName + ":" + error.lineNumber + "\n" + error.message + "\n\n" + error.stack);
    }
    executeCommandGlobal("/tellraw " + (target || "@a") + " " + strf(errorTxt));
}

var File = Java.type("java.io.File");
var Files = Java.type("java.nio.file.Files");
var Paths = Java.type("java.nio.file.Paths");
var CHARSET_UTF_8 = Java.type("java.nio.charset.StandardCharsets").UTF_8;

function readFileAsString(filePath) {
    try {
        return Java.from(readFile(filePath)).join("\n").replace(/\t/g, "  ");

    } catch (exc) {
        return readFile(filePath).join("\n").replace(/\t/g, "  ");
    }
}


function readFile(filePath) {
    var path = Paths.get(filePath);
    try {
        var lines = Files.readAllLines(path, CHARSET_UTF_8);
        return lines;
    } catch (e) {
        return [];
    }
}

// Onboarding command-run logger (minimal, self-contained; avoids loading external utils)
// Updates world/customnpcs/scripts/data_auto/onboarding_data.json when:
// - Player entry exists AND
// - entry.phase2 exists AND
// - entry.phase3 does NOT exist
// Then writes timestamp under phase2["last ran"][cmdKey] = Date.now().
// If file missing, invalid JSON, or conditions not met, it silently does nothing.
var ONBOARDING_DATA_PATH = 'world/customnpcs/scripts/data_auto/onboarding_data.json';
var ONBOARDING_CONFIG_PATH = 'world/customnpcs/scripts/ecmascript/modules/onboarding/onboarding_config.json';

// Tutorial skip helper: advances to the next enabled onboarding phase.
// - Only available from phase 1+ (phase 0 cannot be skipped).
// - Uses onboarding_config.json to find the next enabled phase.
// - Adjusts completion timestamps so phase-gates don't stall after skipping.
function cst_onboarding_skipTutorialPhase(player) {
    var playerName = player.getName();
    try {
        // Load onboarding config
        var cfgFile = new File(ONBOARDING_CONFIG_PATH);
        if (!cfgFile.exists()) {
            tellPlayer(player, '&cOnboarding config not found.');
            return false;
        }
        var cfgRaw = readFileAsString(ONBOARDING_CONFIG_PATH);
        var cfgStr = ('' + cfgRaw);
        if (!cfgStr || !cfgStr.trim()) {
            tellPlayer(player, '&cOnboarding config is empty.');
            return false;
        }
        var cfg;
        try { cfg = JSON.parse(cfgStr); } catch (eCfg) {
            tellPlayer(player, '&cOnboarding config is invalid JSON.');
            return false;
        }

        // Load onboarding data
        var dataFile = new File(ONBOARDING_DATA_PATH);
        if (!dataFile.exists()) {
            tellPlayer(player, '&cOnboarding data not found.');
            return false;
        }
        var raw = readFileAsString(ONBOARDING_DATA_PATH);
        var rawStr = ('' + raw);
        if (!rawStr || !rawStr.trim()) {
            tellPlayer(player, '&cOnboarding data is empty.');
            return false;
        }
        var data;
        try { data = JSON.parse(rawStr); } catch (eData) {
            tellPlayer(player, '&cOnboarding data is invalid JSON.');
            return false;
        }
        if (!data || !data[playerName]) {
            tellPlayer(player, '&cNo onboarding entry found for you.');
            return false;
        }

        var entry = data[playerName];
        var curPhase = entry.phase;
        if (typeof curPhase !== 'number') {
            curPhase = parseInt(curPhase || 0, 10);
            if (isNaN(curPhase)) curPhase = 0;
        }

        if (curPhase < 1) {
            tellPlayer(player, '&cYou cannot skip Phase 0.');
            return false;
        }

        var phasesObj = (cfg && cfg.phases) ? cfg.phases : {};
        var nextPhase = null;
        for (var i = curPhase + 1; i < 100; i++) {
            var pcfg = phasesObj['' + i];
            if (pcfg && pcfg.enabled) { nextPhase = i; break; }
        }

        if (nextPhase === null) {
            tellPlayer(player, '&eThere is no next onboarding phase to skip to.');
            return false;
        }

        var now = Date.now();
        var longDelayMs = (cfg.general && typeof cfg.general.generic_streamline_delay_long === 'number')
            ? (cfg.general.generic_streamline_delay_long * 1000)
            : 0;
        var bypassTs = now - longDelayMs - 1000;

        // Ensure phase-gates don't stall after skipping
        if (curPhase === 1 && nextPhase === 2) {
            if (!entry.phase1 || typeof entry.phase1 !== 'object') entry.phase1 = {};
            entry.phase1.s4_completedTime = bypassTs;
        }
        if (nextPhase === 3) {
            if (!entry.phase2 || typeof entry.phase2 !== 'object') entry.phase2 = {};
            entry.phase2.s5_completedTime = bypassTs;
            if (!entry.phase3 || typeof entry.phase3 !== 'object') entry.phase3 = {};
            entry.phase3._gateP2DelayChecked = true;
            entry.phase3.s1_availableAt = now - 1;
            entry.phase3.currentStage = 1;
            entry.phase3.currentStep = 1;
        }

        entry.phase = nextPhase;
        entry._tutorialSkipLast = now;

        writeToFile(ONBOARDING_DATA_PATH, JSON.stringify(data, null, 2));

        var nextName = (phasesObj['' + nextPhase] && phasesObj['' + nextPhase].name) ? phasesObj['' + nextPhase].name : ('Phase ' + nextPhase);
        tellPlayer(player, '&a:check_mark: Tutorial phase skipped. Next: &e' + nextName + '&a.');
        return true;
    } catch (e) {
        tellPlayer(player, '&cException in tutorial skip: ' + (e.message || e));
        return false;
    }
}

function cst_onboarding_log_command(player, cmdKey) {
    // tellPlayer(player,"Debug: cst_onboarding_log_command called for cmdKey '" + cmdKey + "'");
    var playerName = player.getName();
    try {
    // tellPlayer(player,"Debug: Player name is '" + playerName + "'");
    // Read existing data file
    var f = new File(ONBOARDING_DATA_PATH);
    if (!f.exists()) { return; }
    var raw = readFileAsString(ONBOARDING_DATA_PATH);
    var rawStr = ('' + raw);
    if (!raw || !rawStr.trim()) { return; }
    var data;
    try { data = JSON.parse(rawStr); } catch (e) { return; }
        if (!data) { return; }

        // Find player entry and ensure they're in phase 2
        var entry = data[playerName];
        if (!entry) { return; }
        if (entry.phase !== 2) { return; }

        // Ensure phase2 container exists
        if (!entry.phase2 || typeof entry.phase2 !== 'object') { entry.phase2 = {}; }
        var p2 = entry.phase2;

        // Track last execution time per command key
        if (!p2['last ran'] || typeof p2['last ran'] !== 'object') { p2['last ran'] = {}; }
        p2['last ran'][cmdKey] = Date.now();

        // Persist back to disk
        writeToFile(ONBOARDING_DATA_PATH, JSON.stringify(data, null, 2));
        // tellPlayer(player,"Debug: Logged command execution for onboarding phase 2, cmdKey '" + cmdKey + "'");
    } catch (e) {
        tellPlayer(player,"&cException in cst_onboarding_log_command: " + e.message);
    }
}

// Returns true if player has completed the given stage in the given phase of onboarding.
// If any error occurs (file missing, invalid JSON, missing entries, etc), returns false.
function checkOnboardingAdvancement(player, phaseKey, stageKey) {
    try {
        var playerName = player.getName();
        var raw = readFileAsString(ONBOARDING_DATA_PATH);
        var rawStr = ('' + raw);
        if (!rawStr || !rawStr.trim()) {
            return false;
        }

        var data = JSON.parse(rawStr);
        var entry = data[playerName];

        // If player progressed beyond phase "phaseKey", consider stage complete
        if (entry.phase > phaseKey) {
            return true;
        }

        var phaseName = 'phase' + phaseKey;

        // Otherwise check phaseName completion flag
        var phase = entry[phaseName];
        if (phase && phase.currentStage && phase.currentStage > stageKey) {
            return true;
        }

        return false;
    } catch (e) {
        // tellPlayer(player,"&cException in checkOnboardingAdvancement: " + e.message);
        return true;
    }
}



//Check config file
var CONFIG_FILEPATH = "CustomServerTools/settings.json";

function getServerProperties() {
    var proprgxs = /([\w\-.]+)\s*=([\w\W]*?)$/gm;
    var proprgx = /([\w\-.]+)\s*=([\w\W]*?)$/m;
    var propdata = {};

    (readFileAsString('server.properties').match(proprgxs) || []).forEach(function (prop) {
        var propmeta = prop.match(proprgx);
        var propname = propmeta[1];
        var propval = propmeta[2];
        if (stringIsNumeric(propval)) {
            propval = parseFloat(propval);
        } else if (stringIsBool(propval)) {
            propval = propval === 'true';
        }

        propdata[propname] = propval
    });

    return propdata;
}

function getDiskHandler(diskname) {
    if (typeof (diskname) == typeof (undefined) || diskname === null) { diskname = null; }
    diskname = diskname || CONFIG_SERVER.USE_DISK;
    if (diskname === "DEFAULT") {
        return API.getIWorld(0).storeddata;
    }
    if (Object.keys(CONFIG_SERVER.FILE_DISKS).indexOf(diskname) > -1) {
        var disk = new CSTData().useDisk(diskname);
        return disk;
    }
    return null;
}

function saveConfiguration() {
    var configFile = new File(CONFIG_FILEPATH);

    try {

        writeToFile(CONFIG_FILEPATH, JSON.stringify(CONFIG_SERVER, null, 4));


    } catch (exc) {
        handleError(exc);
    }

}

function reloadConfiguration() {
    var configFile = new File(CONFIG_FILEPATH);

    if (!configFile.exists()) {
        mkPath(CONFIG_FILEPATH);
        writeToFile(CONFIG_FILEPATH, JSON.stringify(CONFIG_SERVER, null, 4));


    }

    try {
        var loadConf = JSON.parse(readFileAsString(CONFIG_FILEPATH))
        CONFIG_SERVER = Object.assign(CONFIG_SERVER, loadConf);

        if (Object.keys(CONFIG_SERVER).sort().join(",") !== Object.keys(loadConf).sort().join(",")) {
            writeToFile(CONFIG_FILEPATH, JSON.stringify(CONFIG_SERVER, null, 4));
        }

    } catch (exc) {
        handleError(exc);
    }

}

reloadConfiguration();


/**
 * 
 * @param {Number} value Current value
 * @param {Number} max Maximum value
 * @param {Number} length Character length
 * @param {String||'|'} progChar Progressbar character
 * @param {String} fillColor Filled color code '&a'
 * @param {String} leftColor Filles color code '&c'
 */
function progressBar(value, max, length, progChar, fillColor, leftColor, opener, closer) {
    if (typeof (progChar) == typeof (undefined) || progChar === null) { progChar = null; }
    if (typeof (fillColor) == typeof (undefined) || fillColor === null) { fillColor = '&a'; }
    if (typeof (leftColor) == typeof (undefined) || leftColor === null) { leftColor = '&c'; }
    if (typeof (opener) == typeof (undefined) || opener === null) { opener = '&l['; }
    if (typeof (closer) == typeof (undefined) || closer === null) { closer = '&l]'; }
    var skillBar = '&r' + opener + '&r';
    var progress = Math.floor((value / max) * length);
    var proc = Math.round(value / max * 100);
    for (var i = 0; i < length; i++) {
        if (i < progress) skillBar += fillColor + (progChar || '|');
        if (i >= progress) skillBar += leftColor + (progChar || '|');
    }
    return skillBar += '&r' + closer + '&r';
}


//
function worldOut(str) {
    API.getIWorld(0).broadcast(strf(str));
}


//Parses JSON with comments and trailing comma's to json objects
function cson_parse(cson_string) {
    var rgx_comments = /\/(?:\*{2,}\s[\s\S]+?|\*[^\*]+?)\*\/|([\s;])+\/\/.*$/gm;
    var rgx_commas = /,+\s*(\}|\])/g;
    //print("CSON::: "+cson_string.replace(rgx_comments, '').replace(rgx_commas, '$1').replace(/[\n\t]/g, ""));
    return JSON.parse((cson_string.replace(rgx_comments, '').replace(rgx_commas, '$1')));
}



//Initialize PLugin Folder
var PLUGIN_FOLDER = CONFIG_SERVER.PLUGIN_FOLDER || "CustomServerTools/plugins";
var PLUGIN_LIST = [];

var PluginAPI = {
    Plugins: {
        get: function (name) {
            for (var i in PLUGIN_LIST) {
                var _plugin = PLUGIN_LIST[i];

                if (_plugin.id.toString() === name.toString()) {
                    return _plugin;
                }
            }
            return null;
        },
        list: function () {
            var ids = [];
            for (var i in PLUGIN_LIST) {
                var plugin = PLUGIN_LIST[i];
                ids.push(plugin);
            }
            return ids;
        },
        export: function (key, value) {
            PluginAPI._exports[key] = value;
        },
        import: function (key) {
            return PluginAPI._exports[key];
        },
        _exports: {},
    },
    DataHandlers: {
        implement: function (datahandlername, implementationFunc) {
            if (!(datahandlername in PluginAPI.DataHandlers.implementFuncs)) {
                PluginAPI.DataHandlers.implementFuncs[datahandlername] = [];
            }
            PluginAPI.DataHandlers.implementFuncs[datahandlername].push(implementationFunc);
        },
        implementFuncs: {},
        run: function (dhname, t) {
            if (dhname in PluginAPI.DataHandlers.implementFuncs) {
                var imf = PluginAPI.DataHandlers.implementFuncs[dhname];
                for (var i in imf) {
                    var im = imf[i];
                    im.apply(t, []);
                }
            }
        }
    },
    Players: {
        on: function (hook, func) {
            if (!(hook in PluginAPI.Players.hookFns)) {
                PluginAPI.Players.hookFns[hook] = [];
            }

            PluginAPI.Players.hookFns[hook].push(func)
        },
        run: function (hook, args) {
            if (Object.keys(PluginAPI.Players.hookFns).indexOf(hook) > -1) {
                for (var i in PluginAPI.Players.hookFns[hook]) {
                    var hookFn = PluginAPI.Players.hookFns[hook][i];
                    hookFn.apply(null, args);
                }
            }
        },
        hookFns: {},
    },
};




registerXCommands([
    ['!tutorial skip', function (pl, args, data) {
        return cst_onboarding_skipTutorialPhase(pl);
    }, 'tutorial.skip'],
    ['!plugins', function (pl, args, data) {
        var output = getTitleBar("Plugin List") + "\n&dHover plugin name for more info\n&a";
        for (var p in PLUGIN_LIST) {
            var plugin = PLUGIN_LIST[p];
            var pluginInfo = "$6$lName: $r$e{PluginName}\n$r$6$lID: $r$e{PluginId}\n$r$6$lAuthor: $r$e{PluginAuthor}\n$r$6$lVersion: $r$e{PluginVersion}\n\n$r$e{PluginDesc}$r".fill({
                "PluginId": plugin.id,
                "PluginName": plugin.name,
                "PluginVersion": plugin.version,
                "PluginDesc": plugin.description || "",
                "PluginAuthor": plugin.author || "No author defined",
            });
            output += plugin.name + "{*|show_text:" + pluginInfo + "}&a";
            if (p < PLUGIN_LIST.length - 1) {
                output += ", ";
            }
        }
        tellPlayer(pl, output);
        return true;
    }, 'plugins.list'],
    ['!plugin reload', function (pl, args, data) {
        if (reloadPluginsFromDisk()) {
            tellPlayer(pl, "&r[&eCSTPluginLoader{*|show_text:$eCustomServerTools PluginLoader}&r] &aLoaded &c{PluginCount} &aplugins! &2[Plugin List]{run_command:!plugins|show_text:$aClick to see plugins or do $o$a!plugins}&r".fill({
                "PluginCount": PLUGIN_LIST.length
            }));
        }
    }, 'plugins.reload'],
]);



//1 if v1 > v2
//0 if same
//-1 if v1 < v2
function compareVersion(v1, v2, options) {
    var lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split('.'),
        v2parts = v2.split('.');

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push("0");
        while (v2parts.length < v1parts.length) v2parts.push("0");
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return 1;
        }

        if (v1parts[i] == v2parts[i]) {
            continue;
        }
        else if (v1parts[i] > v2parts[i]) {
            return 1;
        }
        else {
            return -1;
        }
    }

    if (v1parts.length != v2parts.length) {
        return -1;
    }

    return 0;
}

function reloadPluginsFromDisk() {
    PLUGIN_LIST = [];
    PluginAPI.Players.hookFns = {};

    if (!(new File(PLUGIN_FOLDER).exists())) {
        mkPath(PLUGIN_FOLDER);
    }




    //Load plugins
    var pluginDirs = new File(PLUGIN_FOLDER).listFiles();
    var pluginsToRun = [];
    //Loop plugin directories
    for (var p in pluginDirs) {
        var pluginDir = pluginDirs[p];
        if (pluginDir.isDirectory()) {
            var pluginFiles = pluginDir.listFiles();
            var loadPlugin = null;
            for (var pf in pluginFiles) {
                var pluginFile = pluginFiles[pf];
                //get config file
                if (pluginFile.getName() == "plugin.json") {
                    try {
                        loadPlugin = cson_parse(readFileAsString(pluginFile.getPath()));
                        loadPlugin['DIR'] = pluginDir.getPath();
                        //Load JS files
                        for (var lf in loadPlugin.files) {
                            var lfilename = loadPlugin.files[lf];
                            var lfilepath = pluginDir.getPath() + "/" + lfilename;
                            var lfile = new File(lfilepath);
                            if (lfile.exists()) {
                                //loadPlugin.fileFuncs[lfilepath] = (loadPlugin.fileFuncs[lfilepath]||[]).push(readFileAsString(lfilepath));



                                var fileScript = readFileAsString(lfilepath)
                                var fileFunc = new Function("SETTINGS", "PLUGIN", fileScript);
                                pluginsToRun.push({
                                    "func": fileFunc,
                                    "plugin": loadPlugin
                                })

                            }
                        }

                    } catch (exc) {
                        handleError(exc);
                    }



                    break;
                }
            }
            if (loadPlugin != null) {
                PLUGIN_LIST.push(loadPlugin);
            } else {
                var errtxt = "&cError loading plugin! &n&c[info]{*|show_text:$c{PluginDir} has no plugin.json!}".fill({
                    "PluginDir": pluginDir.getPath()
                });
                executeCommandGlobal("/tellraw @a " + strf(errtxt));
                return false;
            }
        }
    }

    for (var i in pluginsToRun) {
        var runPlugin = pluginsToRun[i];
        //Check requirements
        var canRun = true;
        var req = (runPlugin.plugin.required || {});
        var errtxt = "";
        if (Object.keys(req).length > 0) {
            for (var reqid in req) {
                var minver = req[reqid];
                var checkPlugin = PluginAPI.Plugins.get(reqid);
                if (checkPlugin != null) {

                    if (compareVersion(checkPlugin.version, minver) == -1) {
                        errtxt += "&cError loading plugin '" + runPlugin.plugin.id + "' &4[Info]{*|show_text:{INFO}}&r\n".fill({
                            "INFO": ("&cToo low version of plugin '" + reqid + "' installed! Current: &l" + checkPlugin.version + "&r&c Required: &l" + minver).replaceAll("&", "§")
                        });
                        canRun = false;
                    }
                } else {
                    errtxt += "&cError loading plugin '" + runPlugin.plugin.id + "' &4[Info]{*|show_text:{INFO}}&r\n".fill({
                        "INFO": ("&cThis plugin requires &o" + reqid + "&r&c to be installed!").replaceAll("&", "§")
                    });
                    canRun = false;
                }
            }


        }

        if (canRun) {
            try {
                //execute plugins
                runPlugin.func(runPlugin.plugin.settings || {}, runPlugin.plugin);
            } catch (exc) {
                handleError(exc);
            }
        } else {
            executeCommandGlobal("/tellraw @a " + strf(errtxt));
        }
    }

    return true;
}

function compare(fval, operator, sval) {
    switch (operator) {
        case '==':
            return fval == sval;
            break;
        case '===':
            return fval === sval;
            break;
        case '!=':
            return fval != sval;
            break;
        case '!==':
            return fval !== sval;
            break;
        case '>':
            return fval > sval;
            break;
        case '<':
            return fval < sval;
            break;
        case '>=':
            return fval >= sval;
            break;
        case '<=':
            return fval <= sval;
            break;

    }

    return false;
}

//Java import


//UUIDLeast-Most
function UUIDLM() { return rrandom_range(1, 99999); }

function getDropChance(npcnbt, slot) {
    var dropC = npcnbt.getList('DropChance', 10);
    var dropChance = parseInt(dropC[slot].getInteger('Integer'));

    return dropChance;
}

function getHandItem(player) {
    return player.getMainhandItem() || player.getOffhandItem();
}

//Get unique ID
function uniqid() {
    var id = '';
    for (var i = 0; i <= 3; i++) {
        id += Math.random().toString(36).substr(2, 9);
    }
    return id;
}

//Vanilla item attributes
var _ITEMATTR = [
    'generic.attackDamage',
    'generic.followRange',
    'generic.maxHealth',
    'generic.followRange',
    'generic.knockbackResistance',
    'generic.movementSpeed',
    'generic.armor',
    'generic.armorToughness',
    'generic.attackSpeed',
    'generic.luck',
    'generic.attackKnockback',
    'generic.flyingSpeed',
    'generic.luck'
];

//Escape JSON symbols
function escapeNbtJson(json, trim_ends) {
    if (typeof (trim_ends) == typeof (undefined) || trim_ends === null) { trim_ends = true; }
    json = json.replace(/(?:\\n|\\)/g, '');
    json = json.replace(/(\d) ([fbds]+)/g, "$1$2");
    json = json.replace(/\\("|')/g, "$1");
    if (trim_ends) {
        json = json.slice(1, json.length - 1);
    }

    return json;
}

function getDayTime(time) {
    while (time > 24000) { time -= 24000; }
    return time;
}

function isObject(obj) {
    return (typeof (obj) === 'object' && !isArray(obj));
}


function dataHandlerQuery(type, items) {
    var query = {
        _items: items,
        _limit: -1,
        _where: [],
    };

    query.dump = function (player) {

        var results = query.get();
        var moreResults = 0;
        var resultCount = 0;

        var queryInfo = '';

        for (var i in query._where) {
            var qw = query._where[i];
            queryInfo += '&awhere &e' + qw[0] + ' &6' + qw[1] + ' &c' + qw[2] + '\n';
        }

        tellPlayer(player, '&5&l#Query Dump');
        tellPlayer(player, '&d#[Query Info]{*|show_text:' + queryInfo.replaceAll('&', '$') + '}&r');
        for (var i in results) {
            var result = results[i];
            if (parseInt(i) > 14) {
                moreResults++;
                continue;
            }

            result.dump.apply(result, arguments);
            resultCount++;
        }

        tellPlayer(player, '&3#[&b ' + resultCount + ' result(s). &3]');

        if (moreResults > 0) {
            tellPlayer(player, '&3...&b' + moreResults + ' more results&3...');
        }

        return this;
    };

    query.whereMoney = function (name, operator, amount) {
        if (typeof amount === 'undefined') {
            amount = operator;
            operator = '==';
        }
        amount = getCoinAmount(amount);

        return query.where(name, operator, amount);
    };

    query.whereTime = function (name, operator, time) {
        if (typeof time === 'undefined') {
            time = operator;
            operator = '==';
        }

        time = getStringTime(time);

        return query.where(name, operator, amount);
    };



    query.where = function (name, operator, value) {
        if (typeof name === 'function') {
            query._items = query._items.filter(name);
        } else {
            if (typeof value === 'undefined') {
                value = operator;
                operator = '==';
            }

            query._where.push([name, operator, value]);

            query._items = query._items.filter(function (item) {
                return compare((getObjectProp(item, 'data.' + name) || getObjectProp(item, name)), operator, value);
            });
        }

        return query;
    };

    query.whereCount = function (name, operator, value) {
        if (typeof value === 'undefined') {
            value = operator;
            operator = '==';
        }

        query._where.push([name, operator, value]);

        query._items = query._items.filter(function (item) {
            return compare((getObjectProp(item, 'data.' + name) || getObjectProp(item, name) || []).length, operator, value);
        });

        return query;
    }

    query.whereContains = function (key, value, caseSensitive) {
        if (typeof (caseSensitive) == typeof (undefined) || caseSensitive === null) { caseSensitive = true; }
        if (!isArray(value)) {
            value = [value];
        }
        query._where.push([key, 'contains', value]);

        query._items = query._items.filter(function (item) {
            var contains = false;
            var haystack = (getObjectProp(item, 'data.' + key) || getObjectProp(item, key)).toString();
            for (var v in value) {
                var val = value[v];
                if (!caseSensitive) {
                    if (typeof haystack === 'string') {
                        haystack = haystack.toLowerCase();
                    }
                    val = val.toLowerCase();
                }


                if (haystack.indexOf(val) > -1) {
                    contains = true;
                }

            }

            return contains;
        });

        return query;
    };

    query.whereNull = function (name) {
        return query.where(name, '===', null);
    };

    query.whereNotNull = function (name) {
        return query.where(name, '!==', null)
    }

    query.shuffle = function () {
        query._items = array_shuffle(query._items);
        return query;
    };

    query.limit = function (amount) {
        query._items.splice(amount, query._items.length);
        return query;
    };

    query.first = function () {
        return query._items[0] || null;
    }

    query.last = function () {
        return query._items[query._items.length - 1] || null;
    }

    query.skip = function (amount) {
        query._items.splice(0, amount);
        return query;
    };

    query.filter = function (filterFn) {
        query._items.filter(filterFn);

        return query;
    }

    query.sortBy = function () {
        for (var i in arguments) {
            var key = arguments[i];
            query._items.sort(function (a, b) {
                var ak = getObjectProp(a, key) || getObjectProp(a, 'data.' + key);
                var bk = getObjectProp(b, key) || getObjectProp(b, 'data.' + key);

                if (ak == null || bk == null) { return 0; }
                if (ak < bk) return -1;
                if (ak > bk) return 1;

                return 0;
            });
        }

        return query;
    };

    query.sortByDesc = function (key) {
        query._items.sort(function (a, b) {
            var ak = getObjectProp(a, key) || getObjectProp(a, 'data.' + key);
            var bk = getObjectProp(b, key) || getObjectProp(b, 'data.' + key);

            if (ak == null || bk == null) { return 0; }
            if (ak < bk) return -1;
            if (ak > bk) return 1;

            return 0;
        });

        query._items.reverse();

        return query;
    };

    query.get = function () {
        var items = query._items.concat([]);
        if (query._limit > -1) {
            items.splice(query._limit, query._items.length);
        }

        return items;
    };

    Object.defineProperty(query, 'count', {
        get: function () {
            return query._items.length;
        }
    });


    Object.defineProperty(query, 'each', {
        get: function () {
            return dataHandlerCaller(type, query._items);
        }
    });

    return query;
};

function dataHandlerCaller(type, items) {
    var dht = getDataHandler(type);
    var props = [];
    var mockDataHandler = new dht('__mock__');

    var caller = {
        _items: items
    };

    for (var prop in mockDataHandler) {
        var val = mockDataHandler[prop];
        if (typeof val === 'function') {
            caller[prop] = (function (prop, mockDataHandler, val) {
                return function () {
                    for (var i in caller._items) {
                        var item = caller._items[i];
                        item[prop].apply(item, arguments);
                    }

                    return caller;
                };
            })(prop, mockDataHandler, val);
        }
    }

    return caller;
}
var _UNIQIDS = [];

function uniqid(length) {
    if (typeof (length) == typeof (undefined) || length === null) { length = 7; }
    var _CHARSET = "01234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var id;
    do {
        id = "";

        for (var i = 0; i < length; i++) {
            var index = rrandom_range(0, _CHARSET.length - 1);
            id += _CHARSET.slice(index, index + 1).toString();
        }
    } while (_UNIQIDS.indexOf(id) > -1);


    return id;
}
//Superfunction (extendable)
//Used to save function data object.
function DataHandler(type, name) {
    this.type = type;
    this.name = name;
    this.data = this.data || {};
    this.removeFns = this.removeFns || [];
    this.loadFns = this.loadFns || [];
    this.loadedFns = this.loadedFns || [];
    this.saveFns = this.saveFns || [];
    this.createFns = this.createFns || [];
    this._moneyData = [];
    this._timeData = [];
    this._dateData = [
        'created', 'updated'
    ];

    this.dkeyrgx = new RegExp(this.type + '_([\\w.\-]+)', 'g');


    this.moneyData = function (props) {
        this._moneyData = this._moneyData.concat(props);
        return this;
    };

    this.timeData = function (props) {
        this._timeData = this._timeData.concat(props);
        return this;
    };
    this.dateData = function (props) {
        this._dateData = this._dateData.concat(props);
        return this;
    };


    Object.defineProperty(this.data, 'name', {
        get: function () {
            return this.name;
        },
    });

    //Gets all data IDS
    this.getAllDataIds = function (data, includeType) {
        if (typeof (includeType) == typeof (undefined) || includeType === null) { includeType = false; }
        var dkeys = data.getKeys();
        var ids = [];
        for (var d in dkeys) {
            var dkey = dkeys[d];
            if (dkey.cmatch(this.dkeyrgx) > 0) {
                ids.push(includeType ? dkey : dkey.replace(this.dkeyrgx, '$1'));
            }
        }

        return ids;
    };

    this.addData = function (dataObj) {
        this.data = objMerge(this.data, dataObj);
    };

    this.getAllDataEntries = function (data) {
        var ids = this.getAllDataIds(data, true);
        var de = [];

        for (var i in ids) {
            var id = ids[i];
            if (DataHandler.cache[id]) {
                de.push(DataHandler.cache[id]);
                continue;
            }

            var dht = getDataHandler(this.type);
            var newDht = new dht(id.replace(this.dkeyrgx, '$1')).init(data);
            de.push(newDht);
            DataHandler.cache[id] = newDht;
        }

        return de;
    };

    this.query = function (data) {
        return dataHandlerQuery(this.type, this.getAllDataEntries(data));
    };

    this.dumpdata = function (player, prop) {
        tellPlayer(player, this._getdump(player, prop));
    };

    this._getdump = function (player, prop) {
        if (typeof (prop) == typeof (undefined) || prop === null) { prop = ''; }
        var propTypes = {};
        for (var i in this._moneyData) {
            var moneyProp = this._moneyData[i];
            propTypes[moneyProp] = 'money';
        }
        for (var i in this._timeData) {
            var timeProp = this._timeData[i];
            propTypes[timeProp] = 'time';
        }
        for (var i in this._dateData) {
            var dateProp = this._dateData[i];
            propTypes[dateProp] = 'date';
        }
        return formatObj(getObjectProp(this.data, prop), 1, 3, -1, propTypes, null, function () {
            this.maxLoop = 2;
        });
    }
    this.getPropType = function (property) {
        var propTypes = {};
        for (var i in this._moneyData) {
            var moneyProp = this._moneyData[i];
            propTypes[moneyProp] = 'money';
        }
        for (var i in this._timeData) {
            var timeProp = this._timeData[i];
            propTypes[timeProp] = 'time';
        }
        for (var i in this._dateData) {
            var dateProp = this._dateData[i];
            propTypes[dateProp] = 'date';
        }

        return propTypes[property] || typeof this.data[property];
    };

    this.dump = function (player) {
        var dumpInfo = ' === &2&lDUMP&r === \n' +
            '&6&lType: &c' + this.type + '\n' +
            '&6&lName: &e' + this.name + '\n\n' +
            '&r === &2&lPROPERTIES&r === \n';

        var allowed = [];
        var hidden = [];

        for (var i in arguments) {
            if (parseInt(i) == 0) {
                continue;
            }
            var prop = arguments[i];
            if (prop.substr(0, 1) == '*') {
                hidden.push(prop.substr(1, prop.length));
                continue;
            }

            if (Object.keys(this.data).indexOf(prop) == -1) {
                var val = getObjectProp(this.data, prop);
                dumpInfo += '&r - &a(' + typeof val + ')&d' + prop + '&d: &e' + formatObj(val, null, 2, 1) + '\n';
            }
            allowed.push(prop);

        }

        var shownProps = [];

        for (var prop in this.data) {
            var val = this.data[prop];
            if (allowed.indexOf(prop) == -1 && allowed.length > 0) {
                continue;
            }
            if (hidden.indexOf(prop) > -1) {
                continue;
            }

            if (shownProps.length > 7) {
                continue;
            }

            shownProps.push(prop);

            var valType = typeof val;
            var showVal = formatObj(val, null, 2, 2);

            if (this._moneyData.indexOf(prop) > -1) {
                valType = 'money';
                showVal = '&r:money:&e' + getAmountCoin(val);
            }
            if (this._timeData.indexOf(prop) > -1) {
                valType = 'time';
                showVal = ':sun:' + getTimeString(val);
            }
            if (this._dateData.indexOf(prop) > -1) {
                valType = 'date';
                showVal = getDateString(val);
            }

            dumpInfo += '&r - &a(' + valType + ')&d' + prop + '&d: &e' + showVal + '\n';
        }

        var propDiff = Object.keys(this.data).length - shownProps.length;
        if (propDiff > 0 && allowed.length == 0) {
            dumpInfo += '&3Hiding ' + propDiff + ' more properties.\n&b' + Object.keys(this.data).filter(function (key) {
                return shownProps.indexOf(key) == -1;
            }).join(', ');
        }

        var output = '&3#&b(&c"' + this.type + '"&b) &e&o"' + this.name.substr(0, 16) + (this.name.length > 20 ? '...' : '') + '" &d[Read Dump]{*|show_text:' + dumpInfo.replaceAll('&', '$') + '}';

        tellPlayer(player, output);
        return this;
    }

    this.getDataId = function () {
        return this.type + '_' + this.name;
    }
    this.exists = function (data) {
        return data.get(this.getDataId()) != null;
    };
    this.save = function (data) {
        var now = new Date().getTime();
        if (!this.exists(data)) { //Run onCreate
            for (var i in this.createFns) {
                var createFn = this.createFns[i];
                if (typeof (createFn) == 'function') {
                    createFn(this, data);
                }
            }
            this.data.created = now;
        }
        //Run onSave
        for (var i in this.saveFns) {
            var saveFn = this.saveFns[i];
            if (typeof (saveFn) == 'function') {
                saveFn(this, data);
            }
        }
        this.data.updated = now;
        data.put(this.getDataId(), this.toJson());
        DataHandler.__proto__.cache[this.getDataId()] = this;
        return this;
    };
    this.load = function (data) {
        if (this.exists(data)) {
            for (var i in this.loadFns) {
                var loadFn = this.loadFns[i];
                if (typeof (loadFn) == 'function') { loadFn(this, data); }
            }
            var ndata = data.get(this.getDataId());
            this.data = objMerge(this.data, JSON.parse(ndata));
            for (var i in this.loadedFns) {
                var loadedFn = this.loadedFns[i];
                if (typeof (loadedFn) == 'function') { loadedFn(this, data); }
            }
            return true;
        }
        return false;
    };
    this.remove = function (data) {
        for (var rf in this.removeFns) {
            var removeFn = this.removeFns[rf];
            if (typeof (removeFn) == 'function') {
                removeFn(this, data);
            }
        }
        data.remove(this.getDataId());
        if (DataHandler.cache[this.getDataId()]) {
            delete DataHandler.cache[this.getDataId()];
        }
        return this;
    };
    this.onRemove = function (fn, args) { //When removed
        this.removeFns.push(fn, args || {});
        return this;
    };
    this.onLoad = function (fn, args) { //When gets loaded, before retrieving data
        this.loadFns.push(fn, args || {});
        return this;
    };
    this.onLoaded = function (fn, args) { //when loaded is complete
        this.loadedFns.push(fn, args || {});
        return this;
    };
    this.onSave = function (fn, args) { //Everytime when gets saved
        this.saveFns.push(fn, args || {});
        return this;
    };
    this.onCreate = function (fn, args) { //When gets saved but did not exists before (newly created)
        this.createFns.push(fn, args || {});
        return this;
    };
    this.init = function (data, createIfNotExists) {
        if (typeof (createIfNotExists) == typeof (undefined) || createIfNotExists === null) { createIfNotExists = true; }
        var self = this;
        if (DataHandler.cache[this.getDataId()]) {
            self = DataHandler.cache[this.getDataId()];
        }

        if (!self.exists(data) && createIfNotExists) {
            self.save(data);
        }
        self.load(data);

        return self;
    };
    this.set = function (key, value) {
        if (Object.keys(this.data).indexOf(key) > -1) {
            this.data[key] = value;
        }

        return this;
    };
    this.callback = function (fn) {
        fn.apply(this, [this]);
        return this;
    };
    this.setMoney = function (key, value) {
        return this.set(key, getCoinAmount(value));
    };

    this.setTime = function (key, value) {
        return this.set(key, getStringTime(value));
    };

    this.add = function (key, amount) {
        return this.set(key, this.data[key] + amount);
    };

    this.addMoney = function (key, amount) {
        return this.add(key, getCoinAmount(amount));
    };

    this.addTime = function (key, time) {
        return this.add(key, getStringTime(time));
    };



    this.sub = function (key, amount) {
        return this.set(key, this.data[key] - amount);
    }

    this.subMoney = function (key, amount) {
        return this.sub(key, getCoinAmount(amount));
    };

    this.subTime = function (key, time) {
        return this.sub(key, getStringTime(time));
    };


    this.toJson = function () {
        return JSON.stringify(this.data);
    };

    this.fill = function (data) {
        this.data = Object.assign(this.data, data);

        return this;
    };

    this.rename = function (name, data) {
        var clone = this.copy(name, data);

        this.remove(data);
        clone.save(data);

        return clone;
    };

    this.copy = function (name, data) {
        var clone = new this.constructor(name);

        clone.data = Object.assign(clone.data, this.data);

        return clone;
    }

    PluginAPI.DataHandlers.run(this.type, this);

    var now = new Date().getTime();

    this.addData({
        'created': null,
        'updated': now
    });

    this.onLoaded(function (model, data) {
        if (model.data.created == null) {
            model.data.created = new Date().getTime();
        }
    });
}
var _DHCacheKey = 'DataHandlerCache';
DataHandler.__proto__.reloadCache = function () {
    DataHandler.__proto__.cache = {};

    var tempdata = API.getIWorld(0).tempdata;
    if (!tempdata.has(_DHCacheKey)) {
        tempdata.put(_DHCacheKey, DataHandler.cache);
    }
};

DataHandler.reloadCache();
/**
 * 
 * @param {Array} items Items to show
 * @param {Array} matches (Default: [])Matches to filter on
 * @param {Number} showLen (Default: 10)Items to show per page
 * @param {Number} curPage (Default: 1)Current page to output
 * @param {String} navCmd Base command to generate new navigation commands on
 * @param {Function} listingFn (item, index) Function that returns string as one item in list (line break needed)
 * @param {Function} sortFn Function to sort items
 * @param {Function} compareFn (item,matches)Custom Function to check if item is allowed in list
 * @param {Enum("ASC", "DESC")} sortDesc (Default: ASC)Desc will reverse the items after sorting
 * @param {String} toptext The text above the results, below the help buttons
 */
function genDataPageList(items, matches, showLen, curPage, navCmd, listingFn, sortFn, compareFn, sortDesc, toptext, options) {
    if (typeof (matches) == typeof (undefined) || matches === null) { matches = []; }
    if (typeof (showLen) == typeof (undefined) || showLen === null) { showLen = 10; }
    if (typeof (curPage) == typeof (undefined) || curPage === null) { curPage = 1; }
    if (typeof (navCmd) == typeof (undefined) || navCmd === null) { navCmd = null; }
    if (typeof (listingFn) == typeof (undefined) || listingFn === null) { listingFn = null; }
    if (typeof (sortFn) == typeof (undefined) || sortFn === null) { sortFn = null; }
    if (typeof (compareFn) == typeof (undefined) || compareFn === null) { compareFn = null; }
    if (typeof (sortDesc) == typeof (undefined) || sortDesc === null) { sortDesc = false; }
    if (typeof (toptext) == typeof (undefined) || toptext === null) { toptext = ''; }
    if (typeof (options) == typeof (undefined) || options === null) { options = {}; }


    var output = "";
    //Sanitize
    for (var i in matches) {
        var match = matches[i];
        matches[i] = match.replace(/[^*\w]/g, "");
    }

    //Limit showLen
    showLen = Math.max(Math.min(showLen, 100), 4);

    //get excludes from matches
    var excludes = [];
    var excludeRgx = /\*([\w]+)/;
    var newMatches = [];
    for (var a in matches) {
        var match = matches[a];
        (match.cmatch(excludeRgx) > 0 ? excludes : newMatches).push(match.replace(excludeRgx, "$1"));
    }
    matches = newMatches;

    var minShow = (parseInt(curPage) - 1) * showLen;
    var maxShow = minShow + showLen;

    var curShow = 0;

    var tellItems = [];
    //Sort items
    if (sortFn !== false) {
        items.sort(typeof sortFn === "function" ? sortFn : function (a, b) {
            var al = a.toLowerCase();
            var bl = b.toLowerCase();

            if (al < bl) return -1;
            if (al > bl) return 1;

            return 0;
        });
    }


    if (sortDesc) {
        items.reverse();
    }
    //Filter items
    for (var i in items) {
        var item = items[i];
        var isExcluded = (compareFn == null ? arrayOccurs(item, excludes, false, false) > 0 : compareFn(item, excludes));
        if (matches.length == 0 || (compareFn == null ? arrayOccurs(item, matches, false, false) > 0 : compareFn(item, matches))) {
            if (!isExcluded) {
                if (curShow >= minShow && curShow < maxShow && tellItems.indexOf(item) == -1) {
                    tellItems.push(item)
                }
                curShow++;
            }
        }
    }

    function genNavCmd(_page, _showLen, _sort) {
        if (typeof (_page) == typeof (undefined) || _page === null) { _page = curPage; }
        if (typeof (_showLen) == typeof (undefined) || _showLen === null) { _showLen = showLen; }
        if (typeof (_sort) == typeof (undefined) || _sort === null) { _sort = sortDesc; }
        return navCmd.fill({
            "MATCHES": matches.join(" ") + " " + arrayFormat(excludes, "*{VALUE}"),
            "PAGE": _page,
            "SHOWLEN": _showLen, //Backwards compatability for some plugins
            "SHOW": _showLen, //New change
            "SORT": (_sort ? "desc" : "asc")
        });
    }

    var gCmd = genNavCmd();
    output += "&3[Copy Command]{suggest_command:" + gCmd + "|show_text:$3Click to get the command that shows exactly this page.}&r" +
        " &5[? Help]{*|show_text:$dAdd words divided by a space to search for them.\nTo Exclude something, put '*' in front.\nYou can also combine it to get more specific results.}&r\n";

    if (toptext) {
        output += toptext + '\n';
    }

    if (matches.length > 0) {
        output += "&6&lSearching for: &e" + matches.join(", ") + "\n";
    }
    if (excludes.length > 0) {
        output += "&6&lExcluding: &e" + excludes.join(", ") + "\n";
    }
    output += "&6&lSorting: &e" + (sortDesc ? "De" : "A") + "scending&r &b[Toggle]{run_command:" + genNavCmd(curPage, showLen, !sortDesc) + "|show_text:$3Click to toggle sorting type (asc/desc).}\n";
    output += "&6&lResults Found: &a" + curShow + " &eof &a" + items.length + "\n";

    var maxPages = Math.ceil(curShow / showLen);

    var showLenOptions = options.showLenOptions || [
        5,
        10,
        15,
        20
    ];
    var sloTxt = "";
    for (var s in showLenOptions) {
        var slo = showLenOptions[s];
        var showLenCmd = genNavCmd(Math.round(curPage * (showLen / slo)), slo)

        sloTxt += "&b[Show " + slo + "]{run_command:" + showLenCmd + "|show_text:$3Click to show " + slo.toString() + " results per page.}&r ";
    }

    output += sloTxt + "\n";

    var navBtns = "";
    if (navCmd != null) {
        var matchCmd = matches.join(" ") + " " + arrayFormat(excludes, "*{VALUE}");
        var prevCmd = genNavCmd(parseInt(curPage) - 1);
        var nextCmd = genNavCmd(parseInt(curPage) + 1);
        var prevBtn = curPage > 1 ? " &9[<< Previous]{run_command:" + prevCmd + "|show_text:$9Click to go to previous page.}&r" : "";
        var nextBtn = curPage < maxPages ? " &a[Next >>]{run_command:" + nextCmd + "|show_text:$aClick to go to next page.}&r" : "";
        navBtns = prevBtn + nextBtn;
    }

    if (tellItems.length > 0) {
        output += "&6&lPage: &5&l" + curPage + "/" + maxPages + "&r" + navBtns + "\n";
        var j = 0;
        for (var i in tellItems) {
            var tellItem = tellItems[i];
            var result = (listingFn == null ? " - &b&l" + tellItem + "&r\n" : listingFn(tellItem, j, i));

            if (result !== false) {
                output += result;
                j++
            }
        }
    } else {
        output += "&cNothing found with given criteria.";
    }

    return output;
}

var _CMD_HISTORY = {};
var tempdata = API.getIWorld(0).tempdata;
if (!tempdata.has('xCommandCache')) {
    tempdata.put('xCommandCache', _CMD_HISTORY);
} else {
    _CMD_HISTORY = tempdata.get('xCommandCache');
}

function queryDataHandlers(qry) {

}

function registerDataHandler(alias, dataHandlerFn) {
    _DATAHANDLERS[alias] = dataHandlerFn;
}

function getDataHandler(alias) {
    return _DATAHANDLERS[alias];
}

function registerXCommand(commandMatch, callback, perm, rules, payload) {
    if (typeof (rules) == typeof (undefined) || rules === null) { rules = []; }
    if (typeof (payload) == typeof (undefined) || payload === null) { payload = {}; }
    _COMMANDS.push({
        usage: commandMatch,
        callback: callback,
        perm: perm,
        rules: rules,
        enabled: true,
        payload: payload,
    });
}

function getCommandNoArg(cmdstr) {
    return cmdstr.match(/![\w\s]+/)[0];
}

function matchXCommands(cmdstrs) {
    if (typeof (cmdstrs) == typeof (undefined) || cmdstrs === null) { cmdstrs = []; }
    if (typeof (cmdstrs) == 'string') { cmdstrs = [cmdstrs]; }
    var cmds = [];

    for (var c in _COMMANDS) {
        var command = _COMMANDS[c];
        for (var ci in cmdstrs) {
            var cmdstr = cmdstrs[ci];
            var cname = getCommandNoArg(command.usage).trim();
            if (cmdstr.substr(0, 1) == "^") {
                if ((cmdstrs.length == 0 || occurrences(cname, cmdstr.substr(1, cmdstr.length)) == 0) && cmds.indexOf(command) == -1) {
                    cmds.push(command);
                    break;
                }
            } else {
                if ((cmdstrs.length == 0 || occurrences(cname, cmdstr) > 0) && cmds.indexOf(command) == -1) {
                    cmds.push(command);
                    break;
                }
            }
        }
    }

    return cmds;
}

function getCommandName(cmdstr) {
    var cmda = getCommandNoArg(cmdstr).trim(); //Remove whitespace around
    return cmda.substr(1, cmda.length); //Remove '!'-character
}

function getCommandPerm(cmdstr) {
    return getCommandName(cmdstr).replace(/\s+/g, '.');
}

function registerXCommands(cmds) {
    for (var c in cmds) {
        registerXCommand(cmds[c][0], cmds[c][1], cmds[c][2], cmds[c][3] || [], cmds[c][4] || {});
    }
}

function CommandFactory(datahandler, cmdtree) {
    this.type = datahandler;
    this.cmdtree = cmdtree || datahandler;
    this.cmds = [];
    this.info = [];
    this.listingTransformer = null;
    this.listingTransformerFn = null;
    this.listingRequirement = null;
    this.onFns = {
        "create": [],
        "remove": [],
        "info": [],
        "list": [],
        "copy": [],
    };
    this._settables = [];

    //Event functions
    this.on = function (action, callback) {
        this.onFns[action].push(callback);
        return this;
    };

    //Command Building functions
    this.addInfoText = function (infoFn) {
        this.info.push(infoFn);
        return this;
    };
    this.add = function (subCommand, fn, rules, payload, dhNameArg, dhMustExists) {
        if (typeof (rules) == typeof (undefined) || rules === null) { rules = []; }
        if (typeof (payload) == typeof (undefined) || payload === null) { payload = {}; }
        if (typeof (dhNameArg) == typeof (undefined) || dhNameArg === null) { dhNameArg = "name"; }
        if (typeof (dhMustExists) == typeof (undefined) || dhMustExists === null) { dhMustExists = true; }
        payload = objMerge({
            "datatype": this.type,
            "cmdtree": this.cmdtree,
            "argname": dhNameArg,
            "fn": fn,
        }, payload);
        var cmdstr = "!" + this.cmdtree + " " + subCommand;
        this.cmds.push([
            cmdstr,
            function (pl, args, data, cdata) {
                var dht = getDataHandler(cdata.datatype);
                var dh = new dht(args[cdata.argname]).init(data, false);
                return cdata.fn(dh, pl, args, data, cdata);
            },
            getCommandPerm(cmdstr),
            rules.concat([{
                "argname": dhNameArg,
                "type": "datahandler",
                "datatype": this.type,
                "exists": dhMustExists
            }]),
            payload
        ]);
        return this;
    };
    this.addSettable = function (property, argTransformFn, rules, outputTransform, argNode, argName, propertyAlias) {
        if (typeof (argTransformFn) == typeof (undefined) || argTransformFn === null) { argTransformFn = null; }
        if (typeof (rules) == typeof (undefined) || rules === null) { rules = []; }
        if (typeof (outputTransform) == typeof (undefined) || outputTransform === null) { outputTransform = null; }
        var propname = (propertyAlias || property).rangeUpper(0, 1);
        var out = objMerge({
            "val": "\"{" + property + "}\"",
        }, (outputTransform || {}));
        argName = argName || property;
        argNode = (argNode || "<{NAME}>").fill({
            "NAME": argName,
        });
        this._settables.push(property);
        this.cmds.push([
            '!' + this.cmdtree + ' set' + propname + ' <name> ' + argNode,
            function (pl, args, data, cdata) {
                var dht = getDataHandler(cdata.datatype);
                var dh = new dht(args.name);
                var val = args[cdata.argname];
                dh.load(data);
                dh.data[cdata.property] = (argTransformFn == null ? val : argTransformFn(val, dh, pl, args, data, cdata));
                dh.save(data);
                var tellData = {};
                tellData[cdata.property] = val;
                tellPlayer(pl, "&aSet property &2\"" + property + "\"&a of " + dh.type + " &2\"" + dh.name + "\"&a to " + cdata.out.val.fill(tellData) + "&r&a!");
                return true;
            },
            this.cmdtree.replaceAll(" ", ".") + '.set' + propname,
            rules.concat([{
                "argname": "name",
                "type": "datahandler",
                "datatype": this.type,
                "exists": true,
            }]),
            {
                "datatype": this.type,
                "cmdtree": this.cmdtree,
                "property": property,
                "propname": propname,
                "argname": argName,
                "argnode": argNode,
                "out": out,
            },
        ]);

        return this;
    };
    this.setListTransformer = function (transformFn) {
        this.listingTransformerFn = transformFn;

        return this;
    };
    //Generate Functions
    this.genDefault = function (excludes) {
        if (typeof (excludes) == typeof (undefined) || excludes === null) { excludes = []; }
        if (excludes.indexOf("create") == -1)
            this.cmds.push(
                ['!' + this.cmdtree + ' create <name>', function (pl, args, data, cdata) {
                    var dht = getDataHandler(cdata.datatype);
                    var dh = new dht(args.name);
                    var payload = {
                        "cancel": false,
                    };
                    for (var o in cdata.self.onFns['create']) {
                        var onFn = cdata.self.onFns['create'][o];
                        onFn(dh, pl, args, data, cdata, payload);
                    }

                    if (!payload.cancel) {
                        dh.save(data);
                        tellPlayer(pl, "&aCreated " + dh.type + " &2'" + dh.name + "'&a!");
                        return true;
                    }
                    return false;
                }, this.cmdtree.replaceAll(" ", ".") + '.create', [{
                    "argname": "name",
                    "type": "string",
                    "noColor": true,
                },
                {
                    "argname": "name",
                    "type": "datahandler",
                    "datatype": this.type,
                    "exists": false,
                },
                ], {
                    "datatype": this.type,
                    "self": this,
                }]);
        if (excludes.indexOf("remove") == -1)
            this.cmds.push(
                ['!' + this.cmdtree + ' remove <name>', function (pl, args, data, cdata) {
                    var dht = getDataHandler(cdata.datatype);
                    var dh = new dht(args.name);
                    for (var o in cdata.self.onFns['remove']) {
                        var onFn = cdata.self.onFns['remove'][o];
                        onFn(dh, pl, args, data, cdata, payload);
                    }
                    dh.remove(data);
                    tellPlayer(pl, "&aRemoved " + dh.type + " '" + dh.name + "'!");
                    return true;
                }, this.cmdtree.replaceAll(" ", ".") + '.remove', [{
                    "argname": "name",
                    "type": "datahandler",
                    "datatype": this.type,
                    "exists": true,
                }], {
                    "datatype": this.type,
                    "self": this,
                }]);
        if (excludes.indexOf("info") == -1)
            this.cmds.push(
                ['!' + this.cmdtree + ' info <name>', function (pl, args, data, cdata) {
                    var dht = getDataHandler(cdata.datatype);
                    var dh = new dht(args.name);
                    dh.load(data);
                    var typename = dh.type.rangeUpper(0, 1);
                    tellPlayer(pl, getTitleBar(typename + " Info", false));
                    tellPlayer(pl, "[&2:recycle: Refresh{run_command:!" + cdata.cmdtree + " info " + dh.name + "|show_text:$aClick to reload " + cdata.datatype + " info.}&r]\n" +
                        "&6&l" + typename + " Name: &b" + dh.name + "&r [&4:cross_mark: Remove{run_command:!" + cdata.cmdtree + " remove " + dh.name + "|show_text:$cClick to remove " + dh.type + "}&r]");
                    if ("getPermission" in dh) {
                        var dhp = dh.getPermission().init(data, false);
                        tellPlayer(pl, "&6&lPermission: &9" + dhp.name + "&r [&e:sun: Info{run_command:!perms info " + dhp.name + "}&r]")
                    }

                    var tellInfo = "";
                    for (var i in cdata.info) {
                        var infoFn = cdata.info[i];
                        tellInfo += infoFn(dh, pl, args, data, cdata);
                    }
                    if (tellInfo != "") {
                        tellPlayer(pl, tellInfo);
                    }

                    for (var o in cdata.self.onFns['info']) {
                        var onFn = cdata.self.onFns['info'][o];
                        onFn(dh, pl, args, data, cdata);
                    }

                    return true;
                }, this.cmdtree.replaceAll(" ", ".") + '.info', [{
                    "argname": "name",
                    "type": "datahandler",
                    "datatype": this.type,
                    "exists": true,
                }], {
                    "self": this,
                    "datatype": this.type,
                    "cmdtree": this.cmdtree,
                    "info": this.info,
                    "exc": excludes
                }]);
        if (excludes.indexOf("list") == -1)
            this.cmds.push(
                ['!' + this.cmdtree + ' list [...matches]', function (pl, args, data, cdata) {
                    var w = pl.world;
                    var sb = w.getScoreboard();
                    var dht = getDataHandler(cdata.datatype);
                    var params = getArgParams(args.matches);

                    var de = new dht().getAllDataEntries(data);
                    for (var o in cdata.self.onFns['list']) {
                        var onFn = cdata.self.onFns['list'][o];
                        onFn(dh, pl, args, data, cdata);
                    }
                    var txt = getTitleBar(cdata.datatype.rangeUpper(0, 1) + " List") + "\n";
                    txt += genDataPageList(
                        de,
                        args.matches,
                        parseInt(params.show || 10),
                        parseInt(params.page || 1),
                        "!" + cdata.cmdtree + " list {MATCHES} -page:{PAGE} -show:{SHOWLEN} -sort:{SORT}",
                        function (item) {
                            return cdata.ltfn == null ? ("&e - &b" + item.name + "&r\n") : cdata.ltfn(item, pl, args, data);
                        },
                        function (a, b) {
                            var aa = a.name;
                            var bb = b.name;
                            if (aa < bb) return -1;
                            if (aa > bb) return 1;
                            return 0;
                        },
                        function (cmd, list) {
                            return arrayOccurs(cmd.name, list, false, false);
                        },
                        (params.sort || "").toLowerCase() == "desc"
                    );

                    tellPlayer(pl, txt);
                    return true;
                }, this.cmdtree.replaceAll(" ", ".") + '.list', [],
                {
                    "self": this,
                    "datatype": this.type,
                    "cmdtree": this.cmdtree,
                    "lt": this.listingTransformer,
                    "ltfn": this.listingTransformerFn,
                },
                ]);
        if (excludes.indexOf("copy") == -1)
            this.cmds.push(
                ['!' + this.cmdtree + ' copy <name> <new_name>', function (pl, args, data, cdata) {
                    var dht = getDataHandler(cdata.datatype);
                    var dh = new dht(args.name).init(data);
                    for (var o in cdata.self.onFns['copy']) {
                        var onFn = cdata.self.onFns['copy'][o];
                        onFn(dh, pl, args, data, cdata);
                    }
                    dh.name = args.new_name;
                    dh.save(data);
                    tellPlayer(pl, "&aCopied " + dh.type + " '" + args.name + "' to '" + args.new_name + "'!");
                    return true;
                }, this.cmdtree.replaceAll(" ", ".") + '.copy', [{
                    "argname": "new_name",
                    "type": "string",
                    "noColor": true,
                },
                {
                    "argname": "name",
                    "type": "datahandler",
                    "datatype": this.type,
                    "exists": true,
                },
                {
                    "argname": "new_name",
                    "type": "datahandler",
                    "datatype": this.type,
                    "exists": false
                }
                ], {
                    "datatype": this.type,
                    "self": this,
                }]);
        return this;
    };
    this.register = function () {
        registerXCommands(this.cmds);
        return this;
    };
}


function parseUsageRgx(command, str) {
    if (typeof (str) == typeof (undefined) || str === null) { str = null; } //Converts command usage to Regex, and gathers info about command
    //!perms\s+manage\s+add((?:\s+[\w]+))((?:\s+[\w]+)*)
    //+ == <...vars> //multiple args, minimal one required
    //* == [...vars] //multiple args, optional
    //  == <var> //arg, required
    //? == [var] // arg, optional

    var argrx = [];
    var cmdMatch = command.usage
        .replace(/(\w)\s+(\w)/g, "$1\\s+$2")
        .replace(/(\w|>|\])\s+(\w|<|\[)/g, "$1$2"); //fix whitespace
    var req_regx = /<([.]{3})*([\w]+)>/g; //Required arg regex
    var opt_regx = /\[([.]{3})*([\w]+)\]/g; //Optional arg recalc
    var rm = cmdMatch.allMatch(req_regx);
    for (var i in rm) { //required args
        var rmcode = rm[i][0];
        var rmmulti = (rm[i][1] != null);
        var rmname = rm[i][2];
        var rmpart = "((?:\\s+\\S+)" + (rmmulti ? "+" : "") + ")";
        if (str != null) {
            argrx.push([
                command.usage.indexOf(rmcode),
                rmname,
                rmmulti
            ]);
        }
        cmdMatch = cmdMatch.replace(rmcode, rmpart);
    }
    var om = cmdMatch.allMatch(opt_regx);
    for (var i in om) { //optional args
        var omcode = om[i][0];
        var ommulti = (om[i][1] != null);
        var omname = om[i][2];
        var ompart = "((?:\\s+\\S+)" + (ommulti ? "*" : "?") + ")";
        if (str != null) {
            argrx.push([
                command.usage.indexOf(omcode),
                omname,
                ommulti
            ]);
        }
        cmdMatch = cmdMatch.replace(omcode, ompart);
    }

    var capt_names = [];
    var cids = [];

    while (argrx.length > 0) {
        var hid = 0;
        for (var i in argrx) {
            if (argrx[i][0] > hid) {
                hid = argrx[i][0];
            }
        }
        for (var i in argrx) {
            if (argrx[i][0] == hid) {
                capt_names.push([argrx[i][1], argrx[i][2]]);
                argrx.splice(i, 1);
                break;
            }
        }
    }
    capt_names.reverse();

    return [cmdMatch, capt_names];
}

var ARGPARAM_REGEX = /-([\w]+)(?:\s*:\s*("[\s\S]+?"|'[\s\S]+?'|[\w\S]+))?/gm;

function getArgParams(arr) {
    var params = {};
    var str = arr.join(' ');
    var newStr = str;
    var am;
    while ((am = ARGPARAM_REGEX.exec(str)) !== null) {
        params[am[1]] = (am[2] === undefined ? true : am[2].replace(/"([\s\S]+?)"/, '$1').replace(/'([\s\S]+?)'/, '$1'));
        newStr = newStr.replace(am[0], '');
    }

    arr.length = 0;
    var newArr = newStr.split(' ');
    for (var i in newArr) {
        if (!!newArr[i]) {
            arr.push(newArr[i]);
        }
    }
    return params;
}

function executeXCommand(str, player, permcheck, data) {
    if (typeof (permcheck) == typeof (undefined) || permcheck === null) { permcheck = true; }
    var data = data || player.world.getStoreddata();
    var sb = player.world.getScoreboard();
    for (var c in _COMMANDS) {
        var cmd = _COMMANDS[c];
        var cmdm = parseUsageRgx(cmd, str);

        var argrgx = cmdm[0];
        var rgx = new RegExp(argrgx, 'gi');
        if ((str.match(rgx) || []).length == 1) {
            if (str.indexOf(str.match(rgx)[0]) == 0 && str.replace(rgx, '') == '') {
                var argnames = cmdm[1];
                var cg = 1;
                var args = {};
                for (var a in argnames) {
                    var argname = argnames[a][0];
                    var ismulti = argnames[a][1];
                    if (typeof (args[argname]) == typeof (undefined)) {
                        args[argname] = (ismulti ? [] : null)
                    }
                    var argval = str.replace(rgx, '$' + cg.toString());
                    if (ismulti) {
                        args[argname] = argval.split(' ');
                        args[argname] = args[argname].filter(function (el) {
                            return el.toString().length > 0;
                        });
                    } else {
                        args[argname] = (argval.trim() == "" ? null : argval.trim());
                    }


                    cg++;
                }

                var cmdperm = new Permission(cmd.perm);
                if (!cmdperm.exists(data)) {
                    cmdperm.save(data);
                }
                cmdperm.load(data);
                if (cmdperm.permits(player.getName(), sb, data) || !permcheck) {
                    //Check arguments
                    for (var a in args) {
                        var arg = args[a];
                        if (arg == null) { continue; }

                        for (var b in cmd.rules) {
                            var rule = cmd.rules[b];

                            if (!("argname" in rule)) { continue; }
                            var errpref = '';
                            var errsuff = '';
                            if ("msgprefix" in rule) { errpref = rule.msgprefix }
                            if ("msgsuffix" in rule) { errsuff = rule.msgsuffix }

                            if ("as" in rule) {
                                if (rule.as == "string" && typeof arg == 'object') {
                                    arg = arg.join(" ");
                                }
                            }

                            if (rule.argname != a) { continue; }
                            var rulename = rule.name || rule.argname.toString();
                            if ('type' in rule) { //Check Arg Type
                                switch (rule.type) {
                                    case 'id':
                                        {
                                            if (arg.replace(/([\w\-\.]+)/g, '') != '') {
                                                tellPlayer(player, errpref + _MSG["argNotValid"].fill({
                                                    "argName": rulename,
                                                    "allowed": "A-Za-z0-9_-:D"
                                                }) + errsuff);
                                                return false;
                                            }
                                            //Run case 'string'
                                        }
                                    case 'string':
                                        {
                                            if (arg.replace(/([\w\-\.]+)/g, '') != '') {
                                                tellPlayer(player, errpref + _MSG["argNotValid"].fill({
                                                    "argName": rulename,
                                                    "allowed": "&cA-Za-z0-9_-"
                                                }) + errsuff);
                                                return false;
                                            }
                                            if ('minlen' in rule) {
                                                if (arg.toString().length < rule.minlen) {
                                                    tellPlayer(player, errpref + "&c'" + rulename + "' is too short! (Min. " + rule.minlen + " characters)" + errsuff);
                                                    return false;
                                                }
                                            }
                                            if ('maxlen' in rule) {
                                                if (arg.toString().length < rule.maxlen) {
                                                    tellPlayer(player, errpref + "&c'" + rulename + "' is too long! (Min. " + rule.minlen + " characters)" + errsuff);
                                                    return false;
                                                }
                                            }
                                            if ("noColor" in rule) {
                                                if (rule.noColor) {
                                                    if (escCcs(arg.toString()) != arg.toString()) {
                                                        tellPlayer(player, errpref + "&c'" + rulename + "' cannot contain color coding!" + errsuff);
                                                        return false;
                                                    }
                                                }
                                            }
                                            break;
                                        }
                                    case 'enum':
                                        {
                                            if ("values" in rule) {
                                                if (rule.values.indexOf(arg) == -1) {
                                                    tellPlayer(player, "&c'" + rulename + "' must be one of the following: " + rule.values.join(", "));
                                                    return false;
                                                }
                                            }
                                            break;
                                        }
                                    case 'virtualcurrency':
                                        {
                                            var curtypes = VIRTUAL_CURRENCIES.map(function (currency) { return currency.name; });
                                            if (curtypes.indexOf(arg) == -1) {
                                                tellPlayer(player, "&c'" + rulename + "' must be one of the following: " + curtypes.join(', '));
                                                return false;
                                            }
                                            break;
                                        }
                                    case 'currency':
                                    case 'money':
                                    case 'time':
                                    case 'number':
                                        {
                                            var num = NaN;
                                            if (rule.type == 'number') {
                                                num = parseFloat(arg);
                                            } else if (['currency', 'money'].indexOf(rule.type) > -1) {
                                                num = getCoinAmount(arg);
                                            } else {
                                                num = getStringTime(arg);
                                            }

                                            if (isNaN(num)) {
                                                tellPlayer(player, errpref + "&c'" + rulename + "' is not a number!" + errsuff);
                                                return false;
                                            }
                                            if ('max' in rule) {
                                                if (num > rule.max) {
                                                    var rmax = rule.max;
                                                    if (rule.type == 'currency') {
                                                        rmax = getAmountCoin(rule.max);
                                                    } else if (rule.type == 'time') {
                                                        rmax = getTimeString(rule.max);
                                                    }
                                                    tellPlayer(player, errpref + "&c'" + rulename + "' cannot be greater than " + rmax + errsuff);
                                                    return false;
                                                }
                                            }
                                            if ('min' in rule) {
                                                if (num < rule.min) {
                                                    var rmin = rule.min;
                                                    if (rule.type == 'currency') {
                                                        rmin = getAmountCoin(rule.min);
                                                    } else if (rule.type == 'time') {
                                                        rmin = getTimeString(rule.min);
                                                    }
                                                    tellPlayer(player, errpref + "&c'" + rulename + "' cannot be less than " + rmin + errsuff);
                                                    return false;
                                                }
                                            }
                                        }
                                    case 'datahandler':
                                        {
                                            if ('datatype' in rule) {
                                                var dh = new DataHandler(rule.datatype, arg);
                                                if ('exists' in rule) {
                                                    var exists = dh.exists(data);
                                                    if (rule.exists && !exists) {
                                                        //Hasto exists but does not
                                                        tellPlayer(player, errpref + "&c" + dh.type.rangeUpper(0, 1) + " '" + dh.name + "' does not exist!" + errsuff);
                                                        return false;
                                                    }
                                                    if (!rule.exists && exists) {
                                                        //Has not to exists but does
                                                        tellPlayer(player, errpref + "&c" + dh.type.rangeUpper(0, 1) + " '" + dh.name + "' already exists!" + errsuff);
                                                        return false;
                                                    }
                                                }
                                            }
                                            break;
                                        }
                                    case 'color':
                                        {
                                            if (objArray(_RAWCOLORS).indexOf(arg) == -1) {
                                                tellPlayer(player, errpref + "&cColor must be one of the following: " + objArray(_RAWCOLORS).join(', ') + '!' + errsuff);
                                                return false;
                                            }
                                            break;
                                        }
                                    case 'coloreffect':
                                        {
                                            if (objArray(_RAWEFFECTS).indexOf(arg) == -1) {
                                                tellPlayer(player, errpref + "&cChat effects must be one of the following: \n" + objArray(_RAWEFFECTS).join("\n") + errsuff);
                                                return false;
                                            }
                                            break;
                                        }
                                    case 'attribute':
                                        {
                                            if (_ITEMATTR.indexOf(arg) == -1) {
                                                tellPlayer(player, errpref + "&cItem attributes must be one of these: \n" + _ITEMATTR.join("\n") + errsuff);
                                                return false;
                                            }
                                            break;
                                        }
                                    case 'bool':
                                    case 'boolean':
                                        {
                                            if (['true', 'false'].indexOf(arg) == -1) {
                                                tellPlayer(player, errpref + "&c" + rulename.rangeUpper(0, 1) + " must be true or false!" + errsuff);
                                                return false;
                                            }
                                            break;
                                        }
                                }

                            }

                        }
                    }

                    return (cmd.callback(player, args, data, cmd.payload) || false);
                } else {
                    tellPlayer(player, "&cYou don't have permission to this command!");
                    return false;
                }
            }
        }
    }
    //No valid command given
    var usg = [];
    var aa = str.split(" ");

    while (aa.length > 0) {
        var saa = aa.join(" ");
        if (usg.length == 0) {
            for (var c in _COMMANDS) {
                var cmd = _COMMANDS[c];
                if (occurrences(cmd.usage, saa) > 0) {
                    var lcp = new Permission(cmd.perm);
                    lcp.load(data);
                    if (lcp.permits(player.getName(), sb, data)) {
                        usg.push(cmd.usage);
                    }
                }
            }
        }
        aa.splice(-1, 1);
    }

    if (usg.length > 0) {
        var helpText = "&e<argument> &6means that it is required\n" +
            "&e[argument] &6means that it is optional\n" +
            "&e<...argument] &6means that you can provide multiple, but $nat least one$r\n" +
            "&e[...argument] &6means that you can provide multiple, or nothing.\n\n" +
            "&cClick on a command listed below, to save yourself some typing.";
        tellPlayer(player, "&a&lDid you mean?: &5[Help]{*|show_text:" + helpText.replace(/&/g, '$') + "}&r");
        var shown = 0;
        for (var u in usg) {
            if (shown <= 10) {
                tellPlayer(player, "&e - &c" + usg[u] + "{suggest_command:" + getCommandNoArg(usg[u]) + "}");
                shown++;
            }
        }
    } else {
        tellPlayer(player, "&cCould not find this command!\nDo &c&n!help or click here{run_command:!help}&c to see available commands.");
    }



    return false;

}



//Register commands

registerXCommands([
    ['!config reload', function (pl, args, data) {
        reloadConfiguration();
        tellPlayer(pl, "&aReloaded CustomServerTools configuration.");
    }, 'config.reload'],
]);

// Emotes maintenance
registerXCommands([
    ['!emotes reload', function (pl, args, data) {
        var w = pl.world;
        var sdata = w.getStoreddata();
        var created = 0;
        for (var c in CHAT_EMOTES) {
            var ec = new Emote(c);
            if (!ec.exists(sdata)) {
                created++;
            }
        }

        reloadEmotes(w);

        tellPlayer(pl, "&aReloaded emotes. &e" + created + "&a new emote data entr" + (created == 1 ? "y" : "ies") + " created.");
        return true;
    }, 'emotes.reload'],
]);

registerXCommands([
    ['!item renameLore <slot> [...lore]', function (pl, args) {
        var mItem = pl.getMainhandItem();

        if (!mItem.isEmpty()) {
            var newLoreStr = args.lore.join(' ');
            var newLore = objArray(mItem.getLore());
            var s = parseInt(args.slot) || 0;
            if (s < newLore.length) {
                newLore[s] = parseEmotes(ccs(newLoreStr));
            } else {
                newLore.push(ccs(newLoreStr));
            }
            mItem.setLore(newLore);
            tellPlayer(pl, "&aRenamed lore!");
        } else {
            tellPlayer(pl, "&cYou don't have anything in your hand!");
        }

        return false;
    }, 'item.renameLore'],
    ['!item rename <...name>', function (pl, args) {
        var mItem = pl.getMainhandItem();

        if (!mItem.isEmpty()) {
            var newName = args.name.join(' ');
            mItem.setCustomName(parseEmotes(ccs(newName)));
            return true;
        } else {
            tellPlayer(pl, "&cYou don't have anything in your hand!");
        }

        return false;
    }, 'item.rename'],
    ['!item addcstEnchant <name> [lvl]', function (pl, args, data) {
        var mItem = pl.getMainhandItem();
        var ench = getCSTEnchantByName(args.name);
        if (!mItem.isEmpty() && ench != null) {
            addCSTEnchant(mItem, ench.name, args.lvl || 1);
        }
    }, 'item.addEnchant', [{
        "argname": "lvl",
        "type": "number",
        "min": 1
    },

        ]],
    ["!item addSellItem", function (pl, args, data) {
        var oItem = pl.getOffhandItem();
        var mItem = pl.getMainhandItem();

        var mNbt = mItem.getNbt();

        if (oItem.isEmpty()) {
            tellPlayer(pl, "&cYou don't have an chance item in your offhand!");
            return false;
        } else
            if (mItem.isEmpty()) {
                tellPlayer(pl, "&cYou don't have an sell item in your mainhand!");
                return false;
            } else {
                var chanceItems = mNbt.has("CSTSellItems") ? Java.from(mNbt.getList("CSTSellItems", mNbt.getListType("CSTSellItems"))) : [];

                chanceItems.push(oItem.getItemNbt());

                mNbt.setList("CSTSellItems", chanceItems);

                tellPlayer(pl, "&aAdded offhand item as chance item to sell item! To view sell item info, do &2!item sellItemInfo&a!");

            }


    }, "item.addSellItem"],
    ['!item removecstEnchant <name>', function (pl, args, data) {
        var mItem = pl.getMainhandItem();
        var ench = getCSTEnchantByName(args.name);
        if (!mItem.isEmpty() && ench != null) {
            removeCSTEnchant(mItem, ench.name);
        }
    }, 'item.removeEnchant', [{
        "argname": "lvl",
        "type": "number",
        "min": 1
    },

        ]],
    ['!listCstEnchants [...matches]', function (pl, args) {
        var params = getArgParams(args.matches);
        var txt = getTitleBar("Custom Server Tools Enchants", false) + "\n";

        txt += genDataPageList(
            _ENCHANTS,
            args.matches,
            parseInt(params.show || 10),
            parseInt(params.page || 1),
            "!listCstEnchants {MATCHES} -show:{SHOWLEN} -page:{PAGE} -sort:{SORT}",
            function (ench) {
                return "&e - &c&l" + ench.name + "&r\n";
            },
            function (a, b) {
                var al = a.name.toLowerCase();
                var bl = b.name.toLowerCase();

                if (al < bl) return -1;
                if (al > bl) return 1;

                return 0;
            },
            function (ench, list) {
                return arrayOccurs(ench.name, list, false, false) > 0
            },
            (params.sort || "").toLowerCase() == "desc"
        );

        tellPlayer(pl, txt);

    }, "listCstEnchants"],
    ['!item setAttr <slot> <attribute> <value>', function (pl, args) {
        var mItem = pl.getMainhandItem();

        if (!mItem.isEmpty()) {
            mItem.setAttribute(args.attribute, parseFloat(args.value), parseInt(args.slot));
            tellPlayer(pl, "&aSet " + args.attribute + " to " + args.value + "%!");
            return true;
        } else {
            tellPlayer(pl, "&cYou don't have anything in your hand!");
        }

        return false;
    }, 'item.setAttr', [{
        "argname": "slot",
        "type": "number",
        "min": -1,
        "max": 5,
    },
    {
        "argname": "attribute",
        "type": "attribute",
    },
    {
        "argname": "value",
        "type": "number",
        "min": 0,
    }
        ]],

]);

//REGISTER UTIL COMMANDS
registerXCommands([
    ['!debug [...matches]', function (pl, args, data) {
        var items = new Permission().getAllDataEntries(data);

        var params = getArgParams(args.matches);
        var tellStr = getTitleBar("Sample Items") + "\n" +
            genDataPageList(
                items,
                args.matches,
                parseInt(params.show || 10),
                parseInt(params.page || 1),
                "!debug {MATCHES} -page:{PAGE} -show:{SHOWLEN}",
                function (item, i) {
                    return "&r[&c&l" + item.name + "&r] " + "\n";
                },
                function (a, b) {
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                },
                function (item, list) {
                    return arrayOccurs(item.name, list, false, false) > 0;
                }
            );
        tellPlayer(pl, tellStr);
    }, 'debug', [{
        "argname": "rows",
        "type": "number",
        "min": 1,
        "max": 6,
    }]],
    ['!fakemsg <player> <team> <team_color> [...message]', function (pl, args, data) {
        executeCommand(pl, "/tellraw @a " + parseEmotes(strf(formatChatMessage(args.player, args.team, args.team_color, args.message.join(" ")))));
    }, 'fakemsg', [{
        "argname": "team_color",
        "type": "color"
    }]],
    ['!scare [player] [type]', function (pl, args, data) {
        var tpl = args.player || pl.getName();
        var type = args.type || "creeper";
        var snds = {
            "creeper": "minecraft:entity.creeper.primed",
            "ghast": "minecraft:entity.ghast.hurt"
        };

        if (tpl != null) {
            executeCommand(pl, "/playsound " + snds[type] + " hostile " + tpl, tpl);
        }
    }, 'scare', [{
        "argname": "type",
        "type": "enum",
        "values": [
            "creeper",
            "ghast"
        ]
    }]],
    ['!thunder [player]', function (pl, args, data) {
        var target = (args.player == null ? pl : pl.world.getPlayer(args.player));
        if (target != null) {
            var tpo = new Player(target.getName()).init(data);
            var tpos = target.getPos();
            pl.world.thunderStrike(tpos.getX(), tpos.getY(), tpos.getZ());
            executeCommand(pl, "/tellraw @a " + parseEmotes(strf(tpo.getNameTag(pl.world.getScoreboard()) + "&a&l HAS MADE THE &r:seagull:&a&lHOLY SEAGULL&r:seagull:&a&l ANGRY!!!")));
        }
    }, 'thunder', []],
    ['!sign edit <line> [...text]', function (pl, args, data) {

        var rt = pl.rayTraceBlock(16, false, false);
        var rtb = rt.getBlock();
        //is sign
        if (["minecraft:wall_sign", "minecraft:standing_sign"].indexOf(rtb.getName()) > -1 && rtb.hasTileEntity()) {
            var rnbt = rtb.getTileEntityNBT();
            var newTxt = parseEmotes(strf(args.text.join(" ")));
            rnbt.setString("Text" + args.line.toString(), newTxt);
            rtb.setTileEntityNBT(rnbt);

            //==TEMPORARY: force block update
            //==Removed when Noppes includes updating in setTileEntityNBT
            var meta = rtb.getMetadata();
            rtb.setMetadata(0);
            rtb.setMetadata(1);
            rtb.setMetadata(meta);
            //==

            tellPlayer(pl, "&aEdited line #" + args.line.toString() + " of sign!");
        } else {
            tellPlayer(pl, "&cYou are not looking at a sign!");
        }

        return false;
    }, 'sign.edit', [{
        "argname": "slot",
        "type": "number",
        "min": 1,
        "max": 4,
    },]],
    ['!help [...matches]', function (pl, args, data) {
        var params = getArgParams(args.matches);
        var txt = getTitleBar("Commands") + "\n";
        var cmds = [];
        //Only get permiited commands
        for (var c in _COMMANDS) {
            var _cmd = _COMMANDS[c];
            if (new Permission(_cmd.perm).init(data).permits(pl.getName(), pl.world.scoreboard, data)) {
                cmds.push(_cmd);
            }
        }
        txt += genDataPageList(
            cmds,
            args.matches,
            parseInt(params.show || 10),
            parseInt(params.page || 1),
            "!help {MATCHES} -page:{PAGE} -show:{SHOWLEN} -sort:{SORT}",
            function (cmd, i) {
                return "&c" + cmd.usage + "{suggest_command:" + getCommandNoArg(cmd.usage) + "}&r\n";
            },
            function (a, b) {
                var aa = getCommandNoArg(a.usage);
                var bb = getCommandNoArg(b.usage);
                if (aa < bb) return -1;
                if (aa > bb) return 1;
                return 0;
            },
            function (cmd, list) {
                return arrayOccurs(cmd.usage, list, false, false);
            },
            (params.sort || "").toLowerCase() == "desc"
        );
        tellPlayer(pl, txt);
    }, 'help'],
    ['!command info <...command>', function (pl, args, data) {
        var argcmd = args.command.join(" ").trim();
        for (var c in _COMMANDS) {
            var cmd = _COMMANDS[c];
            if (getCommandName(cmd.usage) == argcmd) {
                tellPlayer(pl, getTitleBar("Command Info"));
                tellPlayer(pl, "&eCommand: &b" + getCommandNoArg(cmd.usage).trim());
                tellPlayer(pl,
                    "&ePermission ID: &9&l" +
                    cmd.perm + "&r" +
                    (new Permission(cmd.perm).exists(data) ?
                        " (&6:sun: Info{run_command:!perms info " + cmd.perm + "}&r)" :
                        "(&d:recycle: Regenerate{run_command:!chain !perms create " + cmd.perm + ";!command info " + argcmd + "|show_text:Command exists, but permission does not.\nClick to regenerate.}&r)"
                    )
                );
                return true;
            }
        }
        tellPlayer(pl, "&cNo commands found.");
        return true;
    }, 'command.info'],
    ['!chain <...commands>', function (pl, args, data) {
        var acmds = args.commands.join(" ").split(";");
        for (var a in acmds) {
            var acmd = acmds[a];
            var excmd = acmd.trim().replace(/\s+/g, ' ');
            if (excmd.length != "") {
                executeXCommand(excmd, pl);
            }
        }
        return true;
    }, 'chain'],
    ['!fakeleave [...players]', function (pl, args) {
        var pcol = '&f';
        var sb = pl.world.getScoreboard();
        var spl = (args.players.length > 0 ? args.players : [pl.getName()]);
        for (var ss in spl) {
            var sp = spl[ss];
            var t = sb.getPlayerTeam(sp);
            if (t != null) {
                var tc = t.getColor();
                if (tc != null) {
                    pcol = '&' + getColorId(tc);
                }
            }

            executeCommand(pl, '/tellraw @a ' + strf(pcol + sp + ' &r&eleft the game', true));
        }
    }, 'fakeleave'],
    ['!fakejoin [...players]', function (pl, args) {
        var pcol = '&f';
        var sb = pl.world.getScoreboard();
        var spl = (args.players.length > 0 ? args.players : [pl.getName()]);
        for (var ss in spl) {
            var sp = spl[ss];
            var t = sb.getPlayerTeam(sp);
            if (t != null) {
                var tc = t.getColor();
                if (tc != null) {
                    pcol = '&' + getColorId(tc);
                }
            }

            executeCommand(pl, '/tellraw @a ' + strf(pcol + sp + ' &r&ejoined the game', true));
        }
    }, 'fakejoin'],
    ['!version', function (pl, args) {
        tellPlayer(pl, getTitleBar("Server Software"));
        tellPlayer(pl, "&e&l" + CONFIG_SERVER.NAME + " Version: &c&l" + SCRIPT_VERSION);
        tellPlayer(pl, "&e&lSubscription: &9&lPrototype Edition");
        tellPlayer(pl, "&e&lProgrammed by: &r&lRunonstof&e and &r&lslava_110");
        tellPlayer(pl, "&6Contact Runonstof for further questions. Or visit the &6&nDiscord Server&r");
    }, "version"],
    ['!listEnchants [...matches]', function (pl, args) {
        var ENCHANTS = REGISTRY.ENCHANTMENTS.getValues();
        ///tellPlayer(pl, getTitleBar("All Registered Enchantments", false));
        var showEnchants = [];
        for (var i in ENCHANTS) {
            var ench = ENCHANTS[i];
            var ename = REGISTRY.ENCHANTMENTS.getKey(ench);
            var eid = REGISTRY.ENCHANTMENTS.getID(ench);
            showEnchants.push({
                'name': ename,
                'id': eid
            });
            // if(args.matches.length == 0 || arrayOccurs(ename, args.matches)) {
            // 	tellPlayer(pl, "&e - &b"+ename+"&r (ID: "+eid+")");
            // }
        }
        var params = getArgParams(args.matches);
        var tellStr = getTitleBar("All Registered Enchants", false) + "\n" +
            genDataPageList(
                showEnchants,
                args.matches,
                parseInt(params.show || 10),
                parseInt(params.page || 1),
                "!listEnchants {MATCHES} -page:{PAGE} -show:{SHOWLEN}",
                function (showEnchant, i) {
                    return "&r&b" + showEnchant.name + "&e (ID: &a" + showEnchant.id + "&e)\n";
                },
                function (a, b) {
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                },
                function (showEnchant, list) {
                    return arrayOccurs(showEnchant.name, list, false, false) > 0;
                }
            );

        tellPlayer(pl, tellStr);
    }, 'listEnchants'],
    ['!listPotions [...matches]', function (pl, args) {
        var POTIONS = REGISTRY.POTIONS.getValues();
        // tellPlayer(pl, getTitleBar("All Registered Potion Effects", false));
        var showPotions = [];
        for (var i in POTIONS) {
            var pot = POTIONS[i];
            var pname = REGISTRY.POTIONS.getKey(pot);
            var pid = REGISTRY.POTIONS.getID(pot);
            // if(args.matches.length == 0 || arrayOccurs(pname, args.matches) > 0) {
            // 	tellPlayer(pl, "&e - &b"+pname+"&r (ID: "+pid+")");
            // }
            showPotions.push({
                'name': pname,
                'id': pid
            });
        }

        var params = getArgParams(args.matches);
        var tellStr = getTitleBar("All Registered Potions", false) + "\n" +
            genDataPageList(
                showPotions,
                args.matches,
                parseInt(params.show || 10),
                parseInt(params.page || 1),
                "!listPotions {MATCHES} -page:{PAGE} -show:{SHOWLEN}",
                function (showPotion, i) {
                    return "&r&b" + showPotion.name + "&e (ID: &a" + showPotion.id + "&e)\n";
                },
                function (a, b) {
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                },
                function (showPotion, list) {
                    return arrayOccurs(showPotion.name, list, false, false) > 0;
                }
            );

        tellPlayer(pl, tellStr);
    }, 'listPotions'],
    ['!listBiomes [...matches]', function (pl, args) {
        var BIOMES = REGISTRY.BIOMES.getValues();
        tellPlayer(pl, getTitleBar("All Registered Biomes", false));
        for (var i in BIOMES) {
            var bio = BIOMES[i];
            var bname = REGISTRY.BIOMES.getKey(bio);
            var bid = REGISTRY.BIOMES.getID(bio);
            if (args.matches.length == 0 || arrayOccurs(bname, args.matches) > 0) {
                tellPlayer(pl, "&e - &b" + bname + "&r (ID: " + bid + ")");
            }
        }
    }, 'listBiomes'],
    ['!listEntities [...matches]', function (pl, args) {
        var ENTITIES = REGISTRY.ENTITIES.getValues();
        tellPlayer(pl, getTitleBar("All Registered Entities", false));
        for (var i in ENTITIES) {
            var ent = ENTITIES[i];
            var bname = REGISTRY.ENTITIES.getKey(ent);
            var bid = REGISTRY.ENTITIES.getID(ent);
            if (args.matches.length == 0 || arrayOccurs(bname, args.matches) > 0) {
                tellPlayer(pl, "&e - &b" + bname + "&r (ID: " + bid + ")");
            }
        }
    }, 'listEntities'],
    ['!listSkills [...matches]', function (pl, args) {
        if (ReskillableRegistry != null) {
            var SKILLS = ReskillableRegistry.SKILLS.getValues();
            tellPlayer(pl, getTitleBar("All Registered Skills", false));
            for (var i in SKILLS) {
                var skill = SKILLS[i];
                var bname = ReskillableRegistry.SKILLS.getKey(skill);
                var bid = ReskillableRegistry.SKILLS.getID(skill);
                var obj = skill.getKey().replace(/\w+\.(\w+)/g, '$1_xp');
                if (args.matches.length == 0 || arrayOccurs(bname, args.matches) > 0) {
                    tellPlayer(pl, "&e - &b" + bname + "&r (ID: " + bid + ", Objective: " + obj + ")");
                }
            }
        } else {
            tellPlayer(pl, "&6This command requires the mod 'Reskillable' to be installed.");
        }
    }, 'listSkills'],
    ['!tellraw <player> <...message>', function (pl, args) {
        var msg = args.message.join(' ');
        executeCommand(pl, '/tellraw ' + args.player + ' ' + parseEmotes(strf(msg, true)));
        return true;
    }, 'tellraw'],
    ['!tellaction <player> <...message>', function (pl, args, data) {
        var msg = args.message.join(' ');
        executeCommand(pl, "/title " + args.player + " actionbar " + parseEmotes(strf(msg)));
        return true;
    }, 'tellaction'],
    ['!telltitle <player> <...message>', function (pl, args, data) {
        var msg = args.message.join(' ');
        executeCommand(pl, "/title " + args.player + " title " + parseEmotes(strf(msg)));
        return true;
    }, 'telltitle'],
    ['!setMagAmmo <amount>', function (pl, args) {
        var mItem = pl.getMainhandItem();
        if (!mItem.isEmpty() && mItem.hasNbt()) {
            var mnbt = mItem.getNbt();
            if (mnbt.has('Ammo')) {
                mnbt.setInteger('Ammo', args.amount);
                //Item.setNbt(mnbt);
                tellPlayer(pl, "&aSet ammo to " + args.amount + "!");
                return true;
            }
        }
        tellPlayer(pl, "&cYou don't have an magazine in your hand!");

        return false;
    }, 'setMagAmmo', [{
        "argname": "amount",
        "type": "number",
        "min": 0
    }]],
    ['!giveMoney <amount> [...players]', function (pl, args) {
        var w = pl.world;
        var plrs = [];
        objArray(w.getAllPlayers()).forEach(function (wp) {
            plrs.push(wp.getName());
        });
        var am = getCoinAmount(args.amount);
        if (args.players.length == 0) { args.players = [pl.getName()]; }
        var mn = generateMoney(w, am);

        for (var i in args.players) {
            var apl = args.players[i];
            if (plrs.indexOf(apl) > -1) {
                for (var m in mn) {
                    var mi = mn[m];
                    w.getPlayer(apl).giveItem(mi);
                }
            }
        }

        tellPlayer(pl, "&aGave &r:money:&e" + getAmountCoin(am) + "&a to players: '" + args.players.join(', ') + "'");
        for (var a in args.players) {
            var apl = args.players[a];
            if (playerIsOnline(w, apl)) {
                executeCommand(pl, "/tellraw " + apl + " " + parseEmotes(strf("&aYou got &r:money:&e" + getAmountCoin(am))));
            }
        }
    }, 'giveMoney', [{
        "argname": "amount",
        "type": "currency",
        "min": 1
    }]],
    ['!takeMoney <amount> [...players]', function (pl, args, data) {
        var w = pl.world;
        var plrs = [];
        objArray(w.getAllPlayers()).forEach(function (wp) {
            plrs.push(wp.getName());
        });
        var am = getCoinAmount(args.amount);
        if (args.players.length == 0) { args.players = [pl.getName()]; }

        for (var i in args.players) {
            var ap = args.players[i];
            var apo = new Player(ap).init(data);
            apo.data.money -= am;
            apo.save(data);
        }
    }, 'takeMoney', [{
        "argname": "amount",
        "type": "currency",
        "min": 1
    }]],
    ['!giveCurrency <currency> <amount> [...players]', function (pl, args, data) {
        var plrs = args.players;
        if (plrs.length == 0) { plrs.push(pl.getName()); }
        var amount = getCoinAmount(args.amount)
        for (var i in plrs) {
            var plr = plrs[i];
            var p = new Player(plr).init(data);

            p.data[args.currency] += amount;
            p.save(data);
        }

        tellPlayer(pl, '&aAdded &r' + formatCurrency(amount, args.currency) + '&a to ' + plrs.join(', '));
    }, 'giveCurrency', [{
        "argname": "currency",
        "type": "enum",
        "values": VIRTUAL_CURRENCIES.map(function (currency) { return currency.name; })
    },
    {
        "argname": "amount",
        "type": "money",
        "min": 1
    }
        ]],
    ['!takeCurrency <currency> <amount> [...players]', function (pl, args, data) {
        var plrs = args.players;
        if (plrs.length == 0) { plrs.push(pl.getName()); }
        var amount = getCoinAmount(args.amount)
        for (var i in plrs) {
            var plr = plrs[i];
            var p = new Player(plr);
            if (!p.load(data)) {
                continue;
            }

            p.data[args.currency] -= amount;
            p.save(data);
        }

        tellPlayer(pl, '&aTook &r' + formatCurrency(amount, args.currency) + '&a from ' + plrs.join(', '));
    }, 'takeCurrency', [{
        "argname": "currency",
        "type": "enum",
        "values": VIRTUAL_CURRENCIES.map(function (currency) { return currency.name; })
    },
    {
        "argname": "amount",
        "type": "money",
        "min": 1
    }
        ]],
    ['!giveVMoney <amount> [...players]', function (pl, args, data) {
        var w = pl.world;

        var am = getCoinAmount(args.amount);
        if (args.players.length == 0) { args.players = [pl.getName()]; }


        for (var i in args.players) {
            var apl = args.players[i];
            var apo = new Player(apl);
            if (apo.exists(data)) {
                apo.load(data);
                apo.data.vmoney += am;
                apo.save(data);

            }

        }

        tellPlayer(pl, "&aGave &b:money:" + getAmountCoin(am) + "&a to players: '" + args.players.join(', ') + "'");
        for (var a in args.players) {
            var apl = args.players[a];
            if (playerIsOnline(w, apl)) {
                executeCommand(pl, "/tellraw " + apl + " " + parseEmotes(strf("&aYou got &b:money:" + getAmountCoin(am))));
            }
        }
    }, 'giveMoney', [{
        "argname": "amount",
        "type": "currency",
        "min": 1
    }]],
    ['!giveArMoney <amount> [...players]', function (pl, args, data) {
        var w = pl.world;

        var am = getCoinAmount(args.amount);
        if (args.players.length == 0) { args.players = [pl.getName()]; }


        for (var i in args.players) {
            var apl = args.players[i];
            var apo = new Player(apl);
            if (apo.exists(data)) {
                apo.load(data);
                apo.data.armoney += am;
                apo.save(data);

            }

        }

        tellPlayer(pl, "&aGave &r:money:&e" + getAmountCoin(am) + "&a to players: '" + args.players.join(', ') + "'");
        for (var a in args.players) {
            var apl = args.players[a];
            if (playerIsOnline(w, apl)) {
                executeCommand(pl, "/tellraw " + apl + " " + parseEmotes(strf("&aYou got &r:money:&e" + getAmountCoin(am))));
            }
        }
    }, 'giveArMoney', [{
        "argname": "amount",
        "type": "currency",
        "min": 1
    }]],
    ['!convertMoney', function (pl, args) {
        var mItem = pl.getMainhandItem();
        if (!mItem.isEmpty()) {
            var mL = mItem.getLore();
            if (mL.length > 0) {
                var cAm = getCoinAmount(mL[0].replace(/\s/g, ''));
                if (cAm > 0) {
                    var ssize = mItem.getStackSize();
                    mItem.setStackSize(0);
                    var items = generateMoney(pl.world, cAm, 'money');

                    if (items[0]) {
                        items[0].setStackSize(ssize);
                    }

                    givePlayerItems(pl, items);
                    tellPlayer(pl, "&aConverted money!");
                    return true;
                }
            }
            tellPlayer(pl, "&cYou don't have valid money in hand!");
        } else {
            tellPlayer(pl, "&cYou don't have anything in your hand!");
        }

        return false;
    }, 'convertMoney'],
    ['!copyCoords [player]', function (pl, args, data) {
        var pname = args.player || pl.getName();
        if (playerIsOnline(pl.world, pname)) {
            var telltxt = getTitleBar("Coords", false) + "\n\n" +
                "&aX: &c{XCOORD} &aY: &c{YCOORD} &aZ: &c{ZCOORD}\n\n" +
                "&rCopy coords as:\n" +
                " - &a[TP Command]{suggest_command:/tp @p {XCOORD} {YCOORD} {ZCOORD}|show_text:$aClick to get coords as /tp command.}&r\n" +
                " - &a[Formatted XYZ]{suggest_command:X:{XCOORD} Y:{YCOORD} Z:{ZCOORD}|show_text:$aClick to get coords nicely formatted.}&r\n" +
                " - &a[Numbers Only]{suggest_command:{XCOORD} {YCOORD} {ZCOORD}|show_text:$aClick to get coords numbers only.}&r\n" +
                " - &a[Selector]{suggest_command:x={XCOORD},y={YCOORD},z={ZCOORD}|show_text:$aClick to get coords as selector.}&r\n";

            tellPlayer(pl, telltxt.fill({
                "XCOORD": Math.floor(pl.getX()),
                "YCOORD": Math.floor(pl.getY()),
                "ZCOORD": Math.floor(pl.getZ()),
            }));

        } else {
            tellPlayer(pl, "&cPlayer is not online!");
        }
    }, 'copyCoords'],
    //Inventory load/save
    ['!inv save <name>', function (pl, args, data) {
        var apo = new Player(pl.getName());
        apo.load(data);

        var inv = pl.getMCEntity().field_71071_by;
        var inventory = [];
        for (var i = 0; i < inv.field_70462_a.length; i++) {
            inventory.push(API.getIItemStack(inv.field_70462_a.get(i)).getItemNbt().toJsonString());
        }

        apo.data.inventories.push([args.name, inventory]);
        apo.save(data);
        tellPlayer(pl, "&aInventory saved as '" + args.name + "'");

        return true;

    }, 'inv.save'],
    ['!inv load <name>', function (pl, args, data) {
        var w = pl.world;
        var apo = new Player(pl.getName());
        apo.load(data);

        var inventory = apo.getInventory(args.name);
        if (!inventory) {
            tellPlayer(pl, "&cInventory '" + args.name + "' not found");
            return false;
        }

        var inv = pl.getMCEntity().field_71071_by;
        inv.func_174888_l(); //Clear

        for (var i = 0; i < inventory.length; i++) {
            if (inventory[i] && API.stringToNbt(inventory[i]).getString("id") != "minecraft:air")
                inv.field_70462_a.set(i, w.createItemFromNbt(API.stringToNbt(inventory[i])).getMCItemStack());
        }

        inv.func_70296_d(); //Mark dirty
        pl.getMCEntity().field_71069_bz.func_75142_b(); //Detect and send changes

        tellPlayer(pl, "&aInventory '" + args.name + "' succefully loaded");
        return true;

    }, 'inv.load'],
    ['!inv remove <name>', function (pl, args, data) {
        var w = pl.world;
        var apo = new Player(pl.getName());
        apo.load(data);

        var inventory = apo.getInventory(args.name);
        if (!inventory) {
            tellPlayer(pl, "&cInventory '" + args.name + "' not found");
            return false;
        }
        apo.removeInventory(args.name);
        apo.save(data);
        tellPlayer(pl, "&aInventory '" + args.name + "' succefully removed");
        return true;

    }, 'inv.save'],
    ['!eval [...code]', function (pl, args, data) {
        var evalCode = 'return ' + args.code.join(" ") + ';';
        var fn = new Function(
            'player',
            'data',
            'world',
            'code',
            evalCode
        );

        try {
            tellPlayer(pl, (fn(pl, data, pl.world, evalCode) || ""));
        } catch (exc) {
            handleError(exc);
        }
    }, 'eval']/*,
    ['!query <datahandler> <...code>', function (pl, args, data) {
        executeXCommand('!eval new ' + args.datahandler + '().query(data).' + args.code.join(' '), pl, false);
    }, 'query']*/,
    ['!testDynmap', function (pl, args, data) {
        var rgx = /\[name: "([\w\W\s]+?)", x: (\-?\d+), y: (\-?\d+), z: (\-?\d+)\]/gm;
        var text = ' -\
        Japanese Food Shop: [name: "Japanese Food Shop", x: -1906, y: 74, z: 337] -\
            Drawer Shop: [name: "Drawer Shop", x: -1801, y: 74, z: 282] -\
            Kitchen Shop: [name: "Kitchen Shop", x: -1775, y: 74, z: 283] -\
            Gun Shop: [name: "Gun Shop", x: -2040, y: 76, z: 58] -\
            Ammo Shop: [name: "Ammo Shop", x: -2061, y: 76, z: 62] -\
            Knife Shop: [name: "Knife Shop", x: -2064, y: 74, z: 22] -\
            Tool Shop: [name: "Tool Shop", x: -2065, y: 78, z: 18] -\
            Armor Shop: [name: "Armor Shop", x: -2065, y: 76, z: 7] -\
            Love Bar Shop: [name: "Love Bar", x: -2072, y: 75, z: 5] -\
            Gas Shop: [name: "Gas Station", x: -2073, y: 75, z: -48] -\
            Car Parts Shop: [name: "Car Parts Shop", x: -2039, y: 75, z: -40] -\
            Furniture Shop: [name: "Furniture Shop", x: -2033, y: 75, z: -11] -\
            Garage Equipment Shop: [name: "Garage Equipment Shop", x: -2009, y: 74, z: -11] -\
            Herborist Shop: [name: "Herborist Shop", x: -1990, y: 74, z: -7] -\
            Food Shop: [name: "Food Shop", x: -2034, y: 75, z: 24] -\
            Tech Shop: [name: "Tech Shop", x: -1718, y: 74, z: 200] -\
            Real Estate Agency: [name: "Real Estate Agency", x: -1710, y: 74, z: 194]\
        ';

        var match;
        var output = '';
        var set = 'Shops'

        // TODO: dynmap markers

        while ((match = rgx.exec(text)) !== null) {
            var name = match[1];
            var id = slugify(match[1]);
            var x = match[2];
            var y = match[3];
            var z = match[4];

            var tpCommand = '/tp ' + pl.getName() + ' ' + match[2] + ' ' + match[3] + ' ' + match[4];

            output += '&6&l' + match[1] + ' &c[TP]{run_command:' + tpCommand + '}&r &a[Add]{run_command:/dmarker add "' + match[1] + '" id:' + slugify(match[1]) + ' set:Shops icon:cart}&r\n';
        }
        tellPlayer(pl, output);
    }, 'testDynmap'],
    ['!genLot <min> <max> [amount]', function (pl, args, data) {
        if (!CONFIG_SERVER.MONEY_POUCH_SCRIPT) {
            tellPlayer(pl, '&cThere is no money pouch script set in settings.json');
            return false;
        }

        var min = parseInt(args.min);
        var max = parseInt(args.max);
        var amount = args.amount || 1;


        var item = pl.world.createItem('customnpcs:scripted_item', 0, amount);

        item.setTexture(411, 'variedcommodities:blueprint');
        item.setItemDamage(411);
        item.setDurabilityShow(false);

        var nbt = item.getNbt();

        nbt.merge(API.stringToNbt('{ScriptedData: {ScriptEnabled: 1b,Scripts: [{Script: "",Console: [],ScriptList: [{Line: "' + CONFIG_SERVER.MONEY_POUCH_SCRIPT + '"}]}],ScriptLanguage: "ECMAScript"}}'));

        nbt.setFloat('min', parseFloat(getCoinAmount(args.min) / 100));
        nbt.setFloat('max', parseFloat(getCoinAmount(args.max) / 100));

        givePlayerItems(pl, [item]);
    }, 'genLot'],
]);

//REGISTER PERMISSION COMMANDS
var permCommands = new CommandFactory("permission", "perms");

permCommands
    .addInfoText(function (perm) {
        var infoText = "&6&lEnabled: " + (perm.data.enabled ? "&atrue" : "&cfalse");
        infoText += "&r [" +
            (perm.data.enabled ?
                "&c:cross_mark: Disable{run_command:!perms setEnabled " + perm.name + " false|show_text:$cClick to disable permission.}" :
                "&a:check_mark: Enable{run_command:!perms setEnabled " + perm.name + " true|show_text:$aClick to enable permission.}"
            ) +
            "&r]\n";
        infoText += "&6&lPermitted Teams: &r(&a:check_mark: Add Teams{suggest_command:!perms addTeams " + perm.name + " }&r)\n";
        for (var t in perm.data.teams) {
            var permteam = perm.data.teams[t];
            infoText += "&e - &r" + permteam + "&r (&c:cross_mark: Remove{run_command:!perms removeTeams " + perm.name + " " + permteam + "|show_text:$cClick to remove team $o" + permteam + "$c from permission $o" + perm.name + "}&r)\n";
        }

        infoText += "&6&lPermitted Players: &r(&a:check_mark: Add Players{suggest_command:!perms addPlayers " + perm.name + " }&r)\n";
        for (var p in perm.data.players) {
            var permpl = perm.data.players[p];
            infoText += "&e - &r" + permpl + "&r (&c:cross_mark: Remove{run_command:!perms removePlayers " + perm.name + " " + permpl + "}&r)\n";
        }
        return infoText;
    })
    .setListTransformer(
        function (perm, pl, args, data) {
            var sb = pl.world.getScoreboard();

            var canInfo = new Permission("perms.info").init(data).permits(pl.getName(), sb, data);
            var canRemove = new Permission("perms.remove").init(data).permits(pl.getName(), sb, data);

            var tdata = {
                "INFOBTN": canInfo ? "&5[Info]{run_command:!perms info " + perm.name + "|show_text:$dClick to show permission info.}&r" : "",
                "REMOVEBTN": canRemove ? "&c[Remove]{run_command:!perms remove " + perm.name + "|show_text:$cClick to remove permission.}&r" : "",
            }

            return ("&e - &b" + perm.name + "&r {INFOBTN} {REMOVEBTN}\n").fill(tdata);
        }
    )
    .genDefault()
    .addSettable("enabled", function (enabled) {
        return (enabled.toString() === "true");
    }, [{
        "argname": "enabled",
        "type": "bool",
    }], {
        "val": "{enabled}"
    })
    .register();

registerXCommands([
    ['!perms addTeams <permission_id> <...teams>', function (pl, args, data) {
        var w = pl.world;
        var p = new Permission(args.permission_id).init(data);
        p.addTeams(args.teams).save(data);
        tellPlayer(pl, "&aAdded teams \"" + args.teams.join(", ") + "\" to " + p.name + "!&r [&5&lUndo{run_command:!perms removeTeams " + p.name + " " + args.teams.join(" ") + "}&r]");
    }, 'perms.addTeams', [{
        "argname": "permission_id",
        "type": "datahandler",
        "datatype": "permission",
        "exists": true,
    }]],
    ['!perms removeTeams <permission_id> <...teams>', function (pl, args, data) {
        var w = pl.world;
        var p = new Permission(args.permission_id).init(data);
        if (p.load(data)) {
            p.removeTeams(args.teams).save(data);
            tellPlayer(pl, "&aRemoved teams \"" + args.teams.join(", ") + "\" from " + p.name + "!&r [&5&lUndo{run_command:!perms addTeams " + p.name + " " + args.teams.join(" ") + "}&r]");
            return true;
        } else {
            tellPlayer(pl, "&c" + args.permission_id + " does not exists!");
        }
        return false;
    }, 'perms.removeTeams', [{
        "argname": "permission_id",
        "type": "datahandler",
        "datatype": "permission",
        "exists": true,
    }]],
    ['!perms addPlayers <permission_id> <...players>', function (pl, args, data) {
        var w = pl.world;
        var p = new Permission(args.permission_id).init(data);
        p.addPlayers(args.players).save(data);
        tellPlayer(pl, "&aAdded players \"" + args.players.join(", ") + "\" to " + p.name + "!&r [&5&lUndo{run_command:!perms removePlayers " + p.name + " " + args.players.join(" ") + "}&r]");
    }, 'perms.addPlayers', [{
        "argname": "permission_id",
        "type": "datahandler",
        "datatype": "permission",
        "exists": true,
    }]],
    ['!perms removePlayers <permission_id> <...players>', function (pl, args, data) {
        var w = pl.world;
        var p = new Permission(args.permission_id).init(data);
        p.removePlayers(args.players).save(data);
        tellPlayer(pl, "&aRemoved players \"" + args.players.join(", ") + "\" from " + p.name + "!&r [&5&lUndo{run_command:!perms addPlayers " + p.name + " " + args.players.join(" ") + "}&r]");
    }, 'perms.removePlayers', [{
        "argname": "permission_id",
        "type": "datahandler",
        "datatype": "permission",
        "exists": true,
    }]],
]);

//REGISTER COMMANDS
var warpCommands = new CommandFactory("warp");
warpCommands
    .addInfoText(function (warp) {
        return "&6&lTeleport Price: &r:money:&e" + getAmountCoin(warp.data.price) + "&r [&a:check_mark: Set{suggest_command:!warp setPrice " + warp.name + " }&r]\n";
    })
    .addInfoText(function (warp) {
        var wpos = warp.data.pos;
        return "&aX: &c" + wpos.x + "&a Y: &c" + wpos.y + "&a Z: &c" + wpos.z;
    })
    .setListTransformer(
        function (warp, pl, args, data) {
            var sb = pl.world.getScoreboard();
            var wperm = warp.getPermission().init(data).permits(pl.getName(), sb, data);
            var canUseTp = new Permission("warp.tp").init(data).permits(pl.getName(), sb, data);
            var tdata = {
                "PRICE": "&r:money:&e" + getAmountCoin(warp.data.price) + "&r",
                "INFOBTN": new Permission('warp.info').init(data).permitsPlayer(pl) ? "&6[Info]{run_command:!warp info " + warp.name + "} &r" : "",
                "TPBTN": (canUseTp && wperm ? "(&9Teleport{run_command:!warp tp " + warp.name + "}&r)" : ""),
            };

            return ("&e - &b" + warp.name + "&r {PRICE} {INFOBTN} {TPBTN}\n").fill(tdata);
        }
    )
    .genDefault(['create'])
    .addSettable("price", function (price) {
        return getCoinAmount(price);
    }, [{
        "argname": "price",
        "type": "currency",
        "min": 0
    }], {
        "val": "&r:money:&e{price}"
    })
    .add("tp <name>", function (warp, pl, args, data) {
        var plo = new Player(pl.getName()).init(data);
        if (warp.getPermission().init(data).permitsPlayer(pl) || plo.hasUnlock(warp.getDataId())) {
            if (plo.data.money >= warp.data.price) {
                plo.data.money -= warp.data.price;
                plo.registerBackPos(pl.pos);
                if (warp.data.price > 0) {
                    tellPlayer(pl, "&aTook &r:money:&e" + getAmountCoin(warp.data.price) + "&a as warp tax!");
                }
                pl.setPosition(warp.data.pos.x, warp.data.pos.y, warp.data.pos.z);
                plo.save(data);
                return true;
            } else {
                tellPlayer(pl, "&cYou don't have enough money!");
            }
        } else {
            tellPlayer(pl, "&cYou don't have access to this warp!");
        }
        return false;
    })
    .register();

registerXCommands([
    ['!warps', function (pl, args, data) {
        executeXCommand("!warp list", pl);
    }, 'warp.list'],
    ['!warp set <name>', function (pl, args, data) {
        var warp = new Warp(args.name);
        warp.load(data);

        warp.data.pos = normalizePos(pl.getPos(), true);


        if (warp.exists(data)) {
            tellPlayer(pl, "&aChanged location of warp '" + warp.name + "'.");
        } else {
            tellPlayer(pl, "&aCreated new warp '" + warp.name + "'");
        }
        warp.save(data);
    }, 'warp.set']
]);

registerXCommands([
    ['!redeem [code]', function (pl, args, data) {
        var response = HTTP.post('http://runonstof.000webhostapp.com/api/cst/adlink-mc', {
            'username': pl.getName()
        });
        tellPlayer(pl, JSON.stringify(response));
        print(response);
    }, 'redeem']
]);

registerXCommands([
    ["!kick <player> [...reason]", function (pl, args, data) {
        if (playerIsOnline(pl.world, args.player)) {
            var plo = new Player(pl.getName()).init(data);
            pl.world.getPlayer(args.player).kick(parseEmotes(ccs(CONFIG_SERVER.BAR_OPEN + CONFIG_SERVER.TITLE + CONFIG_SERVER.BAR_CLOSE + "\n\n" + plo.getNameTag(pl.world.scoreboard) + "\n\n&9&lHas kicked you for:&r " + args.reason.join(" "))));
        } else {
            tellPlayer(pl, "&cPlayer is not online.")
        }
    }, "kick"],
]);

//REGISTER AUTOMSG COMMANDS
registerXCommands([
    ['!announce <...msg>', function (pl, args, data) {

        tellPlayer(pl, output);
    }, 'announce']
]);

var badgeCommands = new CommandFactory("badge");
badgeCommands
    .setListTransformer(function (badge) {
        return '&e - &r' + badge.data.displayName + ' &r&o(' + badge.name + ') &5[Info]{run_command:!badge info ' + badge.name + '|show_text:$dClick to show badge info.}&r\n';
    })
    .genDefault()
    .addSettable("desc", function (desc) {
        return desc.join(" ");
    }, [], null, "[...{NAME}]")
    .addSettable("color", null, [{
        "argname": "color",
        "type": "color"
    }])
    .addSettable("emote", function (emote) { return emote; }, [{
        "argname": "emote",
        "type": "enum",
        "value": Object.keys(CHAT_EMOTES)
    }])
    .addSettable("displayName", function (name) {
        return name.join(" ");
    }, [], null, "[...{NAME}]")
    .addInfoText(function (badge) {
        return "&6&lDisplay Name: &r" + badge.data.displayName + " &r&4[Change]{suggest_command:!badge setDisplayName " + badge.name + " }&r\n" +
            "&6&lPrice: " + badge.formatPrice() + ' &a[Change]{suggest_command:!badge setPrice ' + badge.name + ' |show_text:$aClick to change the price.}&r\n' +
            "&6&lCurrency: &e" + badge.data.currency + ' &a[Change]{suggest_command:!badge setCurrency ' + badge.name + ' |show_text:$aClick to change the currency.}&r\n' +
            "&6&lEmote Icon:&r :" + badge.data.emote + ": (" + badge.data.emote + ")\n" +
            '&6&lFor Sale:' + (badge.data.forSale ? '&a:check_mark: Yes &c[Disable]{run_command:!badge setForSale ' + badge.name + ' false|show_text:$cClick to disable ' + badge.name + '}&r' : '&c:cross_mark: No &a[Enable]{run_command:!badge setForSale ' + badge.name + ' true|show_text:$aClick to enable ' + badge.name + '}&r') + '\n' +
            '&6&lHidden:' + (badge.data.hidden ? '&a:check_mark: Yes &c[Disable]{run_command:!badge setHidden ' + badge.name + ' false|show_text:$cClick to disable ' + badge.name + '}&r' : '&c:cross_mark: No &a[Enable]{run_command:!badge setHidden ' + badge.name + ' true|show_text:$aClick to enable ' + badge.name + '}&r') + '\n' +
            "&6&lDescription: &a[Change]{suggest_command:!badge setDesc " + badge.name + "|show_text:$aClick to change description of badge}&r\n" + badge.data.desc + '\n' +
            '&6&lPreview: ' + badge.formatBadge();
    })
    .add("give <name> [...players]", function (badge, pl, args, data) {
        if (args.players.length == 0) { args.players.push(pl.getName()); }
        for (var i in args.players) {
            var apl = args.players[i];
            var aplo = new Player(apl);
            if (aplo.load(data)) {
                if (aplo.data.badges.indexOf(badge.name) == -1) {
                    aplo.data.badges.push(badge.name);
                    aplo.save(data);
                }
            }
        }

        tellPlayer(pl, "&aGave badge '" + badge.name + "' to players '" + args.players.join(", ") + "'.");
    })
    .add("take <name> [...players]", function (badge, pl, args, data) {
        if (args.players.length == 0) { args.players.push(pl.getName()); }
        for (var i in args.players) {
            var apl = args.players[i];
            var aplo = new Player(apl);
            if (aplo.load(data)) {
                if (aplo.data.badges.indexOf(badge.name) > -1) {
                    var newBadges = [];
                    for (var pb in aplo.data.badges) {
                        var plb = aplo.data.badges[pb];
                        if (plb != badge.name) {
                            newBadges.push(plb);
                        }
                    }
                    aplo.data.badges = newBadges;
                    aplo.save(data);
                }
            }
        }

        tellPlayer(pl, "&aTook badge '" + badge.name + "' from players '" + args.players.join(", ") + "'.");
    })
    .add("buy <name>", function (badge, pl, args, data) {
        var p = new Player(pl.getName()).init(data);
        var balance = p.data[badge.data.currency] || 0;
        var currency = getCurrency(badge.data.currency);

        if (p.hasBadge(badge.name)) {
            tellPlayer(pl, '&cYou already own this badge.');
            return false;
        }

        if (!badge.data.forSale) {
            tellPlayer(pl, '&cThis badge is not for sale.');
            return false;
        }

        if (balance < badge.data.price) {
            tellPlayer(pl, '&cYou dont have enough ' + currency.displayName + ' for this badge');
            return false;
        }

        p.data[badge.data.currency] -= badge.data.price;
        p.data.badges.push(badge.name);
        p.save(data);
        tellPlayer(pl, '&aSuccessfully bought badge: &r' + badge.data.displayName + '&r\n&aDo &c!myBadges&a to manage your badges!');
    })
    .addSettable("currency", null, [{
        "argname": "currency",
        "type": "virtualcurrency"
    }])
    .addSettable("forSale", function (value) {
        return value == 'true';
    }, [{
        "argname": "forSale",
        "type": "bool",
    }])
    .addSettable("hidden", function (value) {
        return value == 'true';
    }, [{
        "argname": "hidden",
        "type": "bool",
    }])
    .addSettable("price", function (value) {
        return getCoinAmount(value);
    }, [{
        "argname": "price",
        "type": "currency",
        "min": 1,
    }])
    .register();

registerXCommands([
    ['!myBadge toggle <badge>', function (pl, args, data) {
        var p = new Player(pl.getName()).init(data);
        if (p.data.badges.indexOf(args.badge) == -1) {
            tellPlayer(pl, '&cYou don\'t own this badge.');
            return false;
        }
        var output = '';
        var showBadgeIndex = p.data.showbadges.indexOf(args.badge);
        if (showBadgeIndex > -1) {
            p.data.showbadges.splice(showBadgeIndex, 1);
            output += '&aRemoved badge ' + args.badge + ' from display.';
        } else {
            if (p.data.showbadges.length + 1 > p.getCap('badge')) {
                tellPlayer(pl, '&cYou can only show a max of ' + p.getCap('badge'));
                return false;
            }
            p.data.showbadges.push(args.badge);
            output += '&aAdded badge ' + args.badge + 'to display.';
        }
        p.save(data);
        tellPlayer(pl, output);
    }, 'myBadge.toggle', [{
        "argname": "badge",
        "type": "datahandler",
        "datatype": "badge",
        "exists": true
    }]],
    ['!myBadges [...matches]', function (pl, args, data) {
        var p = new Player(pl.getName()).init(data);
        tellPlayer(pl, getTitleBar('Badges') + '\n' + getNavBar(pl) + '\n' + '&6You can show &a' + p.getCap('badge') + ' &6badges max at a time.');
        var output = '';
        var allBadges = new Badge().getAllDataEntries(data);
        var badges = [];
        var showWidth = 10;

        for (var i in allBadges) {
            var badge = allBadges[i];
            if (badge.data.hidden && !p.hasBadge(badge.name)) {
                continue;
            }
            badges.push(badge);
        }

        for (var i in badges) {
            var badge = badges[i];
            var sellTxt = '';
            if (p.hasBadge(badge.name)) {
                sellTxt += '&a&lUNLOCKED';
                if (p.isShowingBadge(badge.name)) {
                    sellTxt += '\n&aCurrently showing this badge.\n&cClick to put it off display';
                } else {
                    sellTxt += '\n&aClick to put this badge on display.';
                }

            } else {
                sellTxt += '&c&lLOCKED';
                if (badge.data.forSale) {
                    sellTxt += '\n&cClick to buy for ' + badge.formatPrice();
                }
            }
            var hoverText = '\n\n' + sellTxt;
            var hoverCmd = (!p.hasBadge(badge.name) && badge.data.forSale ? 'suggest_command:!badge buy ' + badge.name : 'run_command:!myBadge toggle ' + badge.name);

            //BADGE FORMAT START
            if (p.hasBadge(badge.name)) {
                var sellEffect = p.isShowingBadge(badge.name) ? '&n' : '&r';
                output += sellEffect + '[' + badge.formatBadge(sellEffect, hoverText, hoverCmd) + sellEffect + ']';
            } else {
                output += '&8[' + badge.formatBadge('&m', hoverText, hoverCmd) + '&8]';
            }
            //BADGE FORMAT END

            if (parseInt(i) > 0 && (parseInt(i) + 1) % showWidth === 0 || i == badges.length - 1) {
                tellPlayer(pl, output);
                output = '';
            }

        }
        tellPlayer(pl, '\n&eWant a custom badge for your corporation? Contact Runonstof/TheOddlySeagull on discord.');
    }, 'myBadges']
]);

//REGISTER COMMANDS
var bankCommands = new CommandFactory("bank");

var bankCreationCost = getCoinAmount('20K');
var bankFreezePlans = [
    [getStringTime('1w'), 4, '1 week'],
    [getStringTime('2w'), 9, '2 weeks'],
    [getStringTime('1mon'), 14, '1 month'],
    [getStringTime('2mon'), 20, '2 months'],
    [getStringTime('3mon'), 24, '3 months'],
];

bankCommands
    .addSettable("cap", function (value) {
        return parseInt(value);
    }, [{
        "argname": "cap",
        "type": "number",
        "min": 1,
    }])
    .addInfoText(function (bank) {
        return "&6&lOwner: &e" + (bank.data.owner || CONFIG_SERVER.TITLE) + '\n' +
            "&6&lCapacity: &r:money:&e" + getAmountCoin(bank.data.cap) + '\n' +
            '&6&lBankcode: &b' + bank.name;
    })
    // .genDefault(['copy', 'list', 'create', 'remove'])
    .register();

registerXCommands([
    ['!bank remove <code>', function (pl, args, data) {
        var bank = new Bank(args.code).init(data);

        if (bank.data.isFrozen) {
            tellPlayer(pl, "&cThis bank is frozen.");
            return false;
        }


        if (!bank.isOwner(pl.getName()) && !new Permission('bank.admin').init(data).permitsPlayer(pl)) {
            tellPlayer(pl, "&cYou can't remove this bank");
            return false;
        }
        bank.remove(data);

        tellPlayer(pl, '&aRemoved bank \'' + (bank.data.displayName || bank.name) + '\'.');
    }, 'bank.remove', [{
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }]],
    ['!bank make <...displayName>', function (pl, args, data) {
        var p = new Player(pl.getName()).init(data);

        var banks = p.getBanks(data);
        //Todo bank cap
        var bankCount = 0;
        for (var i in banks) {
            var checkBank = banks[i];
            if (checkBank.isOwner(pl.getName())) {
                bankCount++;
            }
        }

        if (bankCount >= 2) {
            tellPlayer(pl, "&cYou have reached a maximum of 2 bank accounts");
            return false;
        }

        if (p.data.money < bankCreationCost) {
            tellPlayer(pl, "&cYou need &r:money:&e" + getAmountCoin(bankCreationCost) + "&c to create a bank account.");
            return false;
        }

        var code = Bank.genBankCode(data);

        var bank = new Bank(code);
        bank.data.owner = pl.getName();
        bank.data.displayName = args.displayName.join(' ');
        p.data.money -= bankCreationCost;
        p.save(data);
        bank.save(data);
        tellPlayer(pl, "&aTook &r:money:&e" + getAmountCoin(bankCreationCost) + "&a as bank creation cost.");
        tellPlayer(pl, "&aCreated new bank under code &e" + bank.name + "&a. Do &c!myBanks&a to manage your banks and the ones you're added to.");
    }, 'bank.make'],
    ['!myBanks [...matches]', function (pl, args, data) {
        var output = getTitleBar('Bank Accounts') + '\n';
        var params = getArgParams(args.matches);

        var banks = [];
        var allBanks = new Bank().getAllDataEntries(data);
        for (var i in allBanks) {
            var checkBank = allBanks[i];
            if (checkBank.canSee(pl.getName())) {
                if (checkBank.hasAutopay(pl.getName())) {
                    checkBank.saveAutopayAmount(pl.getName());
                }
                banks.push(checkBank);
            }
        }

        output += getNavBar(pl) + '\n';
        output += genDataPageList(
            banks,
            args.matches,
            parseInt(params.show || 10),
            parseInt(params.page || 1),
            '!myBanks {MATCHES} -show:{SHOW} -page:{PAGE} -sort:{SORT}',
            function (bank) {
                var infoText = '&dClick to see more details.\n' +
                    '&6&lBank Code: &e&o' + bank.name + '\n' +
                    '&e&o' + bank.data.displayName + '\n' +
                    '&f&o' + bank.data.description + '\n' +
                    '&6&lOwner: &e&o' + bank.data.owner + '\n' +
                    (bank.canWithdraw(pl.getName()) ? '&a[:check_mark: Withdraw]' : '&c[:cross_mark: Withdraw]') + ' ' +
                    (bank.canDeposit(pl.getName()) ? '&a[:check_mark: Deposit]' : '&c[:cross_mark: Deposit]') + ' ' +
                    (bank.isAdmin(pl.getName()) ? '&a[:check_mark: Admin]' : '&c[:cross_mark: Admin]') + '\n' +
                    '\n&6&lCapacity:\n' +
                    '&6Current: &r:money:&e' + getAmountCoin(bank.data.amount) + '&r\n' +
                    progressBar(bank.data.amount, bank.data.cap, 30) + ' &b' + roundDec(100 / bank.data.cap * bank.data.amount) + '%\n' +
                    '&6Max: &r:money:&e' + getAmountCoin(bank.data.cap);
                return '&r - &e&o' + bank.data.displayName + ' &6&o(' + bank.name + ') &d[Info]{run_command:!myBank info ' + bank.name + '|show_text:' + infoText.replaceAll('&', '$') + '\n$dClick to see more details.} &r[:money:&e' + getAmountCoin(bank.data.amount) + '&r]' +
                    '\n |-- ' +
                    (bank.canWithdraw(pl.getName()) ? ' &a[+ Withdraw]{suggest_command:!myBank withdraw ' + bank.name + ' |show_text:$aClick to withdraw $oan amount of your own choice$r$a from $e$o' + bank.name + '}' : ' &c&m[+ Withdraw]&r') +
                    (bank.canDeposit(pl.getName()) ? ' &a[- Deposit]{suggest_command:!myBank deposit ' + bank.name + ' |show_text:$aClick to deposit $oan amount of your own choice$r$a in $e$o' + bank.name + '}&r' : ' &c&m[- Deposit]&r') +
                    (bank.hasAutopay(pl.getName()) ? ' &a[% Collect Autopay]{run_command:!myBank collectAutopay ' + bank.name + '|show_text:$aYou have $r:money:$e' + getAmountCoin(bank.getAutopay(pl.getName()).amount) + '$a to collect at this bank.}&r' : ' &c&m[% Collect Autopay]') + '\n';
            },
            function (a, b) {
                return (b.data.amount || 0) - (a.data.amount || 0);
            },
            function (bank, list) {
                return arrayOccurs(bank.name, list, false, false) > 0 ||
                    arrayOccurs(bank.data.displayName, list, false, false) > 0 ||
                    arrayOccurs(bank.data.description, list, false, false) > 0;
            },
            (params.sort || "").toLowerCase() == "desc"
        );

        tellPlayer(pl, output);
    }, 'myBanks'],
    ['!myBank withdraw <code> <amount>', function (pl, args, data) {
        var bank = new Bank(args.code).init(data);
        var p = new Player(pl.getName()).init(data);
        var amount = getCoinAmount(args.amount);

        if (bank.data.isFrozen) {
            tellPlayer(pl, "&cThis bank is frozen.");
            return false;
        }

        if (!bank.canWithdraw(pl.getName()) && !new Permission('bank.admin').init(data).permitsPlayer(pl)) {
            tellPlayer(pl, "&cYou can't withdraw from this bank.");
            return false;
        }

        if (bank.data.amount < amount) {
            tellPlayer(pl, "&cNot enough money in bank" + (bank.data.amount > 0 ? ' &c&o[Withdraw the rest]{run_command:!myBank withdraw ' + args.code + ' ' + getAmountCoin(bank.data.amount) + '|show_text:$aClick to withdraw $r:money:$e' + getAmountCoin(amount) + '}&r' : ''));
            return false;
        }



        bank.data.amount -= amount;
        p.data.money += amount;
        bank.save(data);
        p.save(data);

        tellPlayer(pl, "&aWithdrawed &r:money:&e" + getAmountCoin(amount) + "&a from bank &e&o" + bank.data.displayName);

    }, 'myBank.withdraw', [{
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }, {
        "argname": "amount",
        "type": "currency",
        "min": 1
    }]],
    ['!myBank deposit <code> <amount>', function (pl, args, data) {
        var bank = new Bank(args.code).init(data);
        var p = new Player(pl.getName()).init(data);
        var amount = getCoinAmount(args.amount);

        if (bank.data.isFrozen) {
            tellPlayer(pl, "&cThis bank is frozen.");
            return false;
        }

        if (!bank.canDeposit(pl.getName()) && !new Permission('bank.admin').init(data).permitsPlayer(pl)) {
            tellPlayer(pl, "&cYou can't deposit in this bank.");
            return false;
        }

        if (bank.data.amount + amount > bank.data.cap) {
            var overflow = Math.max(bank.data.cap - bank.data.amount, 0);
            tellPlayer(pl, "&c&cThe bank can only hold &r:money:&e" + getAmountCoin(overflow) + " &cmore money." + (overflow > 0 ? " &4[Deposit]{run_command:!myBank deposit " + bank.name + " " + getAmountCoin(overflow) + "|show_text:$cClick to deposit $r:money:$e" + getAmountCoin(overflow) + "}&r" : ""));
            return false;
        }

        if (p.data.money < amount) {
            tellPlayer(pl, "&cYou don't have enough money in your money pouch.");
            return false;
        }


        bank.data.amount += amount;
        p.data.money -= amount;
        bank.save(data);
        p.save(data);

        tellPlayer(pl, "&aDeposited &r:money:&e" + getAmountCoin(amount) + "&a in bank &e&o" + bank.data.displayName);

    }, 'myBank.deposit', [{
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }]],
    ['!myBank info <code> [...matches]', function (pl, args, data) {
        var bank = new Bank(args.code).init(data);
        var params = getArgParams(args.matches);

        var page = params.showpage || 'info';

        if (!(bank.canSee(pl.getName()) || new Permission('bank.admin').init(data).permitsPlayer(pl))) {
            tellPlayer(pl, "&cYou can't see the info from this bank.");
            return false;
        }

        var refreshCmd = '&2[:recycle: Refresh]{run_command:!myBank info ' + bank.name + ' -showpage:' + page + '|show_text:$cClick to refresh page.}\n';
        var output = '';

        var trustedName;

        switch (page) {
            case 'info':
                var freezeInfo = '&dClick to see more details.';
                if (bank.data.isFrozen) {
                    if (bank.isFrozenAndDone()) {
                        freezeInfo += '\n\n&bBank freeze is done, click further to collect profit.\n';
                    } else {
                        freezeInfo += '\n&bFreeze Time Left: &o' + getTimeString((bank.data.frozeAt + bank.data.freezeTime) - new Date().getTime(), ['ms']) + '\n' +
                            '&bProfit: &r:money:&e' + getAmountCoin(bank.getFreezeAmount() - bank.data.amount);
                    }
                    freezeInfo += '\n&dClick to see more details.';
                }
                output += getTitleBar('myBank info') + '\n' +
                    refreshCmd +
                    '&6&lBank Code: &e&o' + bank.name + ' &a[:recycle: Regenerate for 5K]{run_command:!bank regencode ' + bank.name + '|show_text:$aClick to regenerate code for $r:money:$e5K\n$cWARNING: Any linked service to this bank, like a trader npc has to be manually re-set.}&r\n' +
                    '&6&lBank Name: &e&o' + bank.data.displayName + ' &a[Change]{suggest_command:!bank setDisplayName ' + bank.name + '|show_text:$aClick to change display name.}&r\n' +
                    '&6&lDescription:  &a[Change]{suggest_command:!bank setDesc ' + bank.name + '|show_text:$aClick to change description.}&r\n&e' + bank.data.description + '\n' +
                    '&6&lOwner: &e&o' + (bank.data.owner || CONFIG_SERVER.TITLE) + '\n' +
                    '&6&lMoney: &r:money:&e' + getAmountCoin(bank.data.amount) + '\n' +
                    '&6&lCapacity: &r' + progressBar(bank.data.amount, bank.data.cap, 30) + ' &d' + roundDec(100 / bank.data.cap * bank.data.amount) + '% &r:money:&e' + getAmountCoin(bank.data.amount) + '&6/&r:money:&e' + getAmountCoin(bank.data.cap) + '\n' +
                    '&6&lUpgrade Cost: &r:money:&e' + getAmountCoin(bank.data.increaseCost) + ' &a[Upgrade]{run_command:!bank upgrade ' + bank.name + '|show_text:$aClick to upgrade bank for $r:money:$e' + getAmountCoin(bank.data.increaseCost) + '$a to get:\n$e - $r:money:$e' + getAmountCoin(bank.data.increaseAmount) + ' $amore capacity\n$e - $c' + bank.data.trustedIncreaseAmount + '$a more trusted list capacity.}&r\n';

                if (bank.data.canFreeze) {
                    output += '&b&lBank freeze: &e&o' + (bank.getFreezeStatus()) + ' &b[Show Info]{run_command:!myBank info ' + bank.name + ' -showpage:freeze|show_text:' + freezeInfo.replaceAll('&', '$') + '}&r\n';
                } else {
                    output += '&bThis bank cannot be frozen.\n';
                }
                output += '&6Trusted Admin List: &a' + bank.data.trustedAdmins.length + '/' + bank.getCap('trusted') + ' &b[View List]{run_command:!myBank info ' + bank.name + ' -showpage:trustedAdmins|show_text:$3Click to see trusted bank admins list.}&r\n' +
                    '&6Trusted Withdraw List: &a' + bank.data.trustedGet.length + '/' + bank.getCap('trusted') + ' &b[View List]{run_command:!myBank info ' + bank.name + ' -showpage:trustedGet|show_text:$3Click to see trusted myBank withdraw list.}&r\n' +
                    '&6Trusted Deposit List: &a' + bank.data.trustedPut.length + '/' + bank.getCap('trusted') + ' &b[View List]{run_command:!myBank info ' + bank.name + ' -showpage:trustedPut|show_text:$3Click to see trusted myBank deposit list.}&r\n' +
                    '&6Autopay: &a' + bank.data.trustedAutopay.length.toString() + '/' + bank.getCap('autopay') + ' &b[Autopay Settings]{run_command:!myBank info ' + bank.name + ' -showpage:autopay|show_text:$bClick to show autopay settings like players, time and amounts.}&r\n' +
                    (bank.canWithdraw(pl.getName()) ? '&a[+ Withdraw]{suggest_command:!myBank withdraw ' + bank.name + '}&r' : '') + (bank.canDeposit(pl.getName()) ? '&a[- Deposit]{suggest_command:!myBank deposit ' + bank.name + '}&r' : '');
                break;
            case 'freeze':
                var freezeStatusText = '';
                switch (bank.getFreezeStatus()) {
                    case 'none':
                        freezeStatusText = '&e&onone';
                        break;
                    case 'frozen':
                        freezeStatusText = '&b&ofrozen';
                        break;
                    case 'done':
                        freezeStatusText = '&a&odone &b[Collect]{run_command:!bank collect ' + bank.name + '|show_text:$bClick to collect freeze earnings.}&r';
                        break;
                }

                output += getTitleBar('Bank Freeze Info', false) + '\n' +
                    refreshCmd +
                    '&6&lFreeze Status: ' + (freezeStatusText) + '\n';

                // Show freeze plans
                if (!bank.data.isFrozen) {
                    var fpText;
                    for (var i in bankFreezePlans) {
                        var freezePlan = bankFreezePlans[i];
                        fpText = '&3Click to freeze your bank account for ' + freezePlan[2] + ' to get:\n' +
                            '&r:money:&e' + getAmountCoin(bank.data.amount) + ' &3+ &b' + freezePlan[1] + '%&3 = &r:money:&e' + getAmountCoin(bank.getFreezeAmount(freezePlan[1])) + '\n' +
                            '&3Profit after ' + freezePlan[2] + ': &r:money:&e' + getAmountCoin(bank.getFreezeAmount(freezePlan[1]) - bank.data.amount);


                        output += '&b[Freeze ' + freezePlan[2] + ']{run_command:!bank freeze ' + bank.name + ' ' + i.toString() + '|show_text:' + fpText.replaceAll('&', '$') + '}&r\n';
                    }

                } else { // Show current freeze info
                    if (!bank.isFrozenAndDone()) {
                        output += '&6&lFreeze Time: &e&o' + getTimeString(bank.data.freezeTime, ['ms']) + '\n' +
                            '&6&lFreeze Time Left: &e&o' + getTimeString((bank.data.frozeAt + bank.data.freezeTime) - new Date().getTime(), ['ms']) + ' left\n' +
                            '&6&lFreeze Interest: &e&o' + bank.data.interest + '%\n' +
                            '&6&lProfit: &r:money:&e' + getAmountCoin(bank.getFreezeAmount() - bank.data.amount);
                    } else {
                        output += '&6&lProfit: &r:money:&e' + getAmountCoin(bank.getFreezeAmount() - bank.data.amount);
                    }
                }

                break;
            case 'trustedAdmins':
                trustedName = 'Admin';
            case 'trustedGet':
                if (!trustedName) { trustedName = 'Withdraw'; }
            case 'trustedPut':
                if (!trustedName) { trustedName = 'Deposit'; }

                var key = page;

                output += getTitleBar('Trusted Bank ' + trustedName + ' List', false) + '\n' +
                    refreshCmd;

                output += '&e&l[<<< Back to myBank info]{run_command:!myBank info ' + bank.name + '|show_text:$eClick to go back to myBank info}&r\n';

                output += genDataPageList(
                    bank.data[key],
                    args.matches,
                    parseInt(params.show || 10),
                    parseInt(params.page || 1),
                    "!myBank info " + bank.name + " -showpage:" + page + " -show:{SHOWLEN} -page:{PAGE} -sort:{SORT}",
                    function (trusted) {
                        var txt = '&e - &a' + trusted + ' &c[:cross_mark: Remove]{run_command:!myBank removetrusted ' + trustedName.toLowerCase() + ' ' + bank.name + ' ' + trusted + '}&r\n';
                        return txt;
                    },
                    function (a, b) {
                        return b - a;
                    },
                    function (trusted, list) {
                        return arrayOccurs(trusted, list, false, false) > 0;
                    },
                    (params.sort || '').toLowerCase() == 'desc',
                    '&2[+ Add more players]{suggest_command:!myBank addtrusted ' + trustedName.toLowerCase() + ' ' + bank.name + ' |show_text:$aClick to add a new player to the bank\'s ' + trustedName + ' list\n$c$o!bank add ' + trustedName.toLowerCase() + ' ' + bank.name + ' playerName otherPlayer}&r'
                );

                break;
            case 'autopay':
                output += getTitleBar('Bank Autopay Settings', false) + '\n' +
                    refreshCmd;

                output += '&e&l[<<< Back to myBank info]{run_command:!myBank info ' + bank.name + '|show_text:$eClick to go back to myBank info}&r\n';

                output += '&6Autopay Interval: &e' + getTimeString(bank.data.autopayInterval) + '&r\n' +
                    '&6Total Autopay: &r:money:&e' + getAmountCoin(bank.getTotalAutopay()) + '\n' +
                    '&6Players: &a' + bank.data.trustedAutopay.length.toString() + '/' + bank.getCap('autopay') + ' &b[View List]{run_command:!myBank info ' + bank.name + ' -showpage:autopayList|show_text:$bClick to show list of autopay players}&r';
                break;
            case 'autopayList':
                output += getTitleBar('Bank Autopay Player List', false) + '\n' + refreshCmd;

                output += '&e&l[<<< Back to autopay info]{run_command:!myBank info ' + bank.name + ' -showpage:autopay|show_text:$eClick to go back to autopay info}&r\n';

                output += genDataPageList(
                    bank.data.trustedAutopay,
                    args.matches,
                    parseInt(params.show || 10),
                    parseInt(params.page || 1),
                    "!myBank info " + bank.name + " -showpage:" + page + " -show:{SHOWLEN} -page:{PAGE} -sort:{SORT}",
                    function (autopayPlayer) {
                        var hoverTxt = '&6&lPlayer: &a' + autopayPlayer.player + '\n' +
                            '&6&lIncome: &r:money:&e' + getAmountCoin(autopayPlayer.payAmount) + ' &6every &e' + getTimeString(bank.data.autopayInterval) + ' &6passed\n' +
                            '&6&lCollect Money Left: &r:money:&e' + getAmountCoin(autopayPlayer.amount);

                        var txt = '&e - &a' + autopayPlayer.player + ' &r:money:&e' + getAmountCoin(autopayPlayer.payAmount) + ' &5[Info]{*|show_text:' + ccs(hoverTxt) + '}&r &c[:cross_mark: Remove]{run_command:!myBank removeAutopay ' + bank.name + ' ' + autopayPlayer.player + '}&r\n' +
                            '&e--: &d[Set Amount]{suggest_command:!myBank changeAutopayAmount ' + bank.name + ' ' + autopayPlayer.player + '|show_text:$dClick to change autopay amount}&r';
                        return txt + '\n';
                    },
                    function (a, b) {
                        return b.payAmount - a.payAmount;
                    },
                    function (autopayPlayer, list) {
                        return arrayOccurs(autopayPlayer.player, list, false, false) > 0;
                    },
                    (params.sort || '').toLowerCase() == 'desc',
                    '&2[+ Add more players]{suggest_command:!myBank addAutopay ' + bank.name + ' |show_text:$aClick to add a new player to the bank\'s autopay list}&r'
                );

                break;
            default:
                output += '&cPage not found.';
                break;
        }


        tellPlayer(pl, output);

    }, 'myBank.info', [{
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }]],
    ['!myBank collectAutopay <bank>', function (pl, args, data) {
        var bank = new Bank(args.bank).init(data);
        if (!bank.hasAutopay(pl.getName())) {
            tellPlayer(pl, '&cYou are not in this bank\'s autopay list.');
            return false;
        }

        bank.saveAutopayAmount(pl.getName());
        var autopayPlayer = bank.getAutopay(pl.getName());

        if (autopayPlayer.amount <= 0) {
            tellPlayer(pl, '&cThere is nothing to collect.');
            return false;
        }

        var p = new Player(pl.getName()).init(data);
        var addAmount = autopayPlayer.amount;
        p.data.money += addAmount;
        autopayPlayer.amount = 0;

        bank.save(data);
        p.save(data);

        tellPlayer(pl, '&aYou collected &r:money:&e' + getAmountCoin(addAmount) + '&a from bank autopay.');
    }, 'myBank.collectAutopay', [{
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }]],
    ['!bank list [...matches]', function (pl, args, data) {
        var output = getTitleBar('Bank List') + '\n';
        var params = getArgParams(args.matches);
        output += genDataPageList(
            new Bank().getAllDataEntries(data),
            args.matches,
            parseInt(params.show || 10),
            parseInt(params.page || 1),
            '!bank list {MATCHES} -show:{SHOW} -page:{PAGE} -sort:{SORT}',
            function (bank) {
                var infoText = '&6&lBank Code: &e&o' + bank.name + '\n' +
                    '&e&o' + bank.data.displayName + '\n' +
                    '&f&o' + bank.data.description + '\n' +
                    '&6&lOwner: &e&o' + bank.data.owner + '\n' +
                    (bank.canWithdraw(pl.getName()) ? '&a[:check_mark: Withdraw]' : '&c[:cross_mark: Withdraw]') + ' ' +
                    (bank.canDeposit(pl.getName()) ? '&a[:check_mark: Deposit]' : '&c[:cross_mark: Deposit]') + ' ' +
                    (bank.isAdmin(pl.getName()) ? '&a[:check_mark: Admin]' : '&c[:cross_mark: Admin]') + '\n' +
                    '\n&6&lCapacity:\n' +
                    '&6Current: &r:money:&e' + getAmountCoin(bank.data.amount) + '&r\n' +
                    progressBar(bank.data.amount, bank.data.cap, 30) + ' &b' + roundDec(100 / bank.data.cap * bank.data.amount) + '%\n' +
                    '&6Max: &r:money:&e' + getAmountCoin(bank.data.cap);
                return '&r - &e&o' + bank.data.displayName + ' &6&o(' + bank.name + ') &d[Info]{run_command:!myBank info ' + bank.name + '|show_text:' + infoText.replaceAll('&', '$') + '\n$dClick to see more details.} &r[:money:&e' + getAmountCoin(bank.data.amount) + '&r]\n';
            },
            function (a, b) {
                return (b.data.amount || 0) - (a.data.amount || 0);
            },
            function (bank, list) {
                return arrayOccurs(bank.name, list, false, false) > 0 ||
                    arrayOccurs(bank.data.displayName, list, false, false) > 0 ||
                    arrayOccurs(bank.data.description, list, false, false) > 0;
            },
            (params.sort || "").toLowerCase() == "desc"
        );

        tellPlayer(pl, output);
    }, 'bank.list'],
    ['!myBank addtrusted <trustedList> <code> <...players>', function (pl, args, data) {
        var bank = new Bank(args.code).init(data);
        var adminPerm = new Permission('bank.admin').init(data);
        if (args.trustedList == 'admin') {
            if (!bank.isOwner(pl.getName()) && !adminPerm.permitsPlayer(pl)) {
                tellPlayer(pl, "&cYou don't have permission to add trusted players to this bank");
                return false;
            }
        } else {
            if (!bank.isAdmin(pl.getName()) && !adminPerm.permitsPlayer(pl)) {
                tellPlayer(pl, "&cYou don't have permission to add trusted players to this bank");
                return false;
            }
        }
        var trustedListKeys = {
            'admin': 'trustedAdmins',
            'withdraw': 'trustedGet',
            'deposit': 'trustedPut'
        };

        var trustedListKey = trustedListKeys[args.trustedList];

        if (bank.data[trustedListKey].length + args.players.length > bank.getCap('trusted') && !adminPerm.permitsPlayer(pl)) {
            tellPlayer(pl, "&cYou can't add that many trusted players to the bank, upgrade your bank for more trusted capacity.");
            return false;
        }

        var addCount = 0;
        for (var i in args.players) {
            var player = args.players[i];
            if (bank.data[trustedListKey].indexOf(player) == -1) {
                bank.data[trustedListKey].push(player);
                addCount++;
            }
        }

        bank.save(data);
        tellPlayer(pl, '&aSaved ' + addCount + ' players to trusted ' + args.trustedList);
        return true;
    }, 'myBank.addtrusted', [{
        "argname": "trustedList",
        "type": "enum",
        "values": ["admin", "deposit", "withdraw"]
    },
    {
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }
        ]],
    ['!myBank removetrusted <trustedList> <code> <...players>', function (pl, args, data) {
        var bank = new Bank(args.code).init(data);
        var adminPerm = new Permission('bank.admin').init(data);
        if (args.trustedList == 'admin') {
            if (!bank.isOwner(pl.getName()) && !adminPerm.permitsPlayer(pl)) {
                tellPlayer(pl, "&cYou don't have permission to remove trusted players from this bank");
                return false;
            }
        } else {
            if (!bank.isAdmin(pl.getName()) && !adminPerm.permitsPlayer(pl)) {
                tellPlayer(pl, "&cYou don't have permission to remove trusted players from this bank");
                return false;
            }
        }
        var trustedListKeys = {
            'admin': 'trustedAdmins',
            'withdraw': 'trustedGet',
            'deposit': 'trustedPut'
        };

        var trustedListKey = trustedListKeys[args.trustedList];

        var removeCount = 0;
        var newPlayers = [];
        for (var i in bank.data[trustedListKey]) {
            var trustedPlayer = bank.data[trustedListKey][i];
            if (args.players.indexOf(trustedPlayer) == -1) {
                newPlayers.push(trustedPlayer);
                continue;
            }
            removeCount++;
        }

        bank.data[trustedListKey] = newPlayers;
        bank.save(data);
        tellPlayer(pl, "&aRemoved " + removeCount + " from " + args.trustedList);

    }, 'myBank.removetrusted', [{
        "argname": "trustedList",
        "type": "enum",
        "values": ["admin", "deposit", "withdraw"]
    },
    {
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }
        ]],
    ['!myBank addAutopay <bank> <player> [amount]', function (pl, args, data) {
        var now = new Date().getTime();
        var bank = new Bank(args.bank).init(data);
        if (!bank.isOwner(pl.getName())) {
            tellPlayer(pl, '&cYou are not the owner of this bank.');
            // return false;
        }

        var payAmount = getCoinAmount(args.amount || '0G');
        if (payAmount < 0) {
            tellPlayer(pl, '&cAmount cannot be less than zero.');
            return false;
        }

        if (bank.hasAutopay(args.player)) {
            tellPlayer(pl, '&cPlayer already has autopay data, change it instead');
            return false;
        }


        if (bank.data.trustedAutopay.length >= bank.getCap('autopay')) {
            tellPlayer(pl, '&cYou have reached your autopay cap.');
            return false;
        }

        var autopayPlayer = bank.addAutopay(args.player, parseInt(args.amount || 0));

        autopayPlayer.amount += bank.getAutopayAmount(args.player, now);
        autopayPlayer.lastPayed = now;
        autopayPlayer.payAmount = payAmount;

        bank.save(data);
        tellPlayer(pl, '&aUpdated autopay settings for ' + args.player);
    }, 'myBank.addAutopay', [{
        "argname": "bank",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }, {
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    }]],
    ['!myBank changeAutopayAmount <bank> <player> <amount>', function (pl, args, data) {
        var now = new Date().getTime();
        var bank = new Bank(args.bank).init(data);
        if (!bank.isOwner(pl.getName())) {
            tellPlayer(pl, '&cYou are not the owner of this bank.');
            // return false;
        }
        if (!bank.hasAutopay(args.player)) {
            tellPlayer(pl, '&cThis player is not in the autopay list.');
            return false;
        }

        bank.saveAutopayAmount(args.player);
        var autopayPlayer = bank.getAutopay(args.player);
        autopayPlayer.payAmount = getCoinAmount(args.amount);

        bank.save(data);
        tellPlayer(pl, '&aUpdated autopay amount to &r:money:&e' + getAmountCoin(autopayPlayer.payAmount) + '&a for ' + args.player);
    }, 'myBank.changeAutopayAmount', [{
        "argname": "bank",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }, {
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    }, {
        "argname": "amount",
        "type": "money",
        "min": 0
    }]],
    ['!myBank removeAutopay <bank> <player>', function (pl, args, data) {
        var bank = new Bank(args.bank).init(data);
        if (!bank.isOwner(pl.getName())) {
            tellPlayer(pl, '&cYou are not the owner of this bank.');
            // return false;
        }

        if (!bank.hasAutopay(args.player)) {
            tellPlayer(pl, '&cThis player has no autopay data in his bank.');
            return false;
        }

        bank.saveAutopayAmount(args.player);
        var autopayPlayer = bank.getAutopay(args.player);


        if (autopayPlayer.amount > 0) {
            var otherp = new Player(autopayPlayer.player).init(data);
            otherp.data.money += autopayPlayer.amount;
            autopayPlayer.amount = 0;
            otherp.save(data);
        }

        bank.removeAutopay(args.player);
        bank.save(data);
        tellPlayer(pl, '&a' + args.player + ' has been removed from autopay, any collection money has been given to him.');
        return false;
    }, 'myBank.removeAutopay', [{
        "argname": "bank",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }, {
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    }]],
    ['!bank setDesc <code> [...description]', function (pl, args, data) {
        var bank = new Bank(args.code).init(data);
        var desc = args.description.join(' ');
        var hasAdminPerm = new Permission('bank.admin').init(data).permitsPlayer(pl);

        if (!bank.isAdmin(pl.getName()) && !hasAdminPerm) {
            tellPlayer(pl, "&cYou can't set the description of this bank");
            return false;
        }
        bank.data.description = desc;
        bank.save(data);

        tellPlayer(pl, "&aChanged the description to: &r" + desc);
    }, 'bank.setDesc', [{
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }]],
    ['!bank setDisplayName <code> [...displayName]', function (pl, args, data) {
        var bank = new Bank(args.code).init(data);
        var displayName = args.displayName.join(' ');
        var hasAdminPerm = new Permission('bank.admin').init(data).permitsPlayer(pl);

        if (!bank.isAdmin(pl.getName()) && !hasAdminPerm) {
            tellPlayer(pl, "&cYou can't set the displayName of this bank");
            return false;
        }
        bank.data.displayName = displayName;
        bank.save(data);

        tellPlayer(pl, "&aChanged the displayName to: &r" + displayName);
    }, 'bank.setDisplayName', [{
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }]],
    ['!bank upgrade <code>', function (pl, args, data) {
        var bank = new Bank(args.code).init(data);
        var hasAdminPerm = new Permission('bank.admin').init(data).permitsPlayer(pl);

        if (bank.data.isFrozen) {
            tellPlayer(pl, "&cThis bank is frozen.");
            return false;
        }

        if (!bank.isAdmin(pl.getName()) && !hasAdminPerm) {
            tellPlayer(pl, "&cYou can't upgrade this bank");
            return false;
        }

        var p = new Player(pl.getName()).init(data);

        if (p.data.money < bank.data.increaseCost) {
            tellPlayer(pl, "&cYou don't have &r:money:&e" + getAmountCoin(bank.data.increaseCost) + "&c in your money pouch!");
            return false;
        }

        p.data.money -= bank.data.increaseCost;
        bank.upgrade();
        p.save(data);
        bank.save(data);

        tellPlayer(pl, "&aUpgraded bank for &r:money:&e" + getAmountCoin(bank.data.increaseCost) + "&a.\nThis has been takef from your money pouch. &2[Click here for myBank info]{run_command:!myBank info " + bank.name + "}&r");
    }, 'bank.upgrade', [{
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }]],
    ['!bank setDesc <code> [...description]', function (pl, args, data) {
        var bank = new Bank(args.code).init(data);
        var desc = args.description.join(' ');
        var hasAdminPerm = new Permission('bank.admin').init(data).permitsPlayer(pl);

        if (!bank.isAdmin(pl.getName()) && !hasAdminPerm) {
            tellPlayer(pl, "&cYou can't set the description of this bank");
            return false;
        }
        bank.data.description = desc;
        bank.save(data);

        tellPlayer(pl, "&aChanged the description to: &r" + desc);
    }, 'bank.setDesc', [{
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }]],
    ['!bank setDisplayName <code> [...displayName]', function (pl, args, data) {
        var bank = new Bank(args.code).init(data);
        var displayName = args.displayName.join(' ');
        var hasAdminPerm = new Permission('bank.admin').init(data).permitsPlayer(pl);

        if (!bank.isAdmin(pl.getName()) && !hasAdminPerm) {
            tellPlayer(pl, "&cYou can't set the displayName of this bank");
            return false;
        }
        bank.data.displayName = displayName;
        bank.save(data);

        tellPlayer(pl, "&aChanged the displayName to: &r" + displayName);
    }, 'bank.setDisplayName', [{
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }]],
    ['!bank freeze <code> <freezePlan>', function (pl, args, data) {
        var bank = new Bank(args.code).init(data);
        var hasAdminPerm = new Permission('bank.admin').init(data).permitsPlayer(pl);

        if (!bank.data.canFreeze) {
            tellPlayer(pl, "&cThis bank is set to be unfreezable at all times.");
            return false;
        }

        if (bank.data.isFrozen) {
            tellPlayer(pl, "&cThis bank is already frozen.");
            return false;
        }

        if (bank.getFreezeAmount() > bank.data.cap) {
            tellPlayer(pl, "&cThe earnings of freezing would exceed your capacity. Upgrade your bank or lower the amount of money in bank.");
            return false;
        }

        if (!bank.isOwner(pl.getName()) && !hasAdminPerm) {
            tellPlayer(pl, "&cYou don't have permission to freeze this bank.");
            return false;
        }

        var freezePlan = bankFreezePlans[parseInt(args.freezePlan)];

        bank
            .set('interest', freezePlan[1])
            .freeze(freezePlan[0])
            .save(data);

        tellPlayer(pl, '&aFroze the bank for ' + getTimeString(freezePlan[0]));

    }, 'bank.freeze', [{
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }, {
        "argname": "freezePlan",
        "type": "number",
        "min": 0,
        "max": bankFreezePlans.length - 1
    }]],

    ['!bank collect <code>', function (pl, args, data) {
        var bank = new Bank(args.code).init(data);
        var hasAdminPerm = new Permission('bank.admin').init(data).permitsPlayer(pl);
        if (!bank.data.isFrozen) {
            tellPlayer(pl, "&cThis bank is not frozen.");
            return false;
        }

        if (!bank.isFrozenAndDone()) {
            tellPlayer(pl, "&cThis bank is still frozen.");
            return false;
        }

        if (!bank.isOwner(pl.getName()) && !hasAdminPerm) {
            tellPlayer(pl, "&cYou don't have permission to collect for this bank.");
            return false;
        }

        var profit = bank.getFreezeAmount() - bank.data.amount;

        bank
            .unfreeze()
            .set('interest', 0)
            .save(data);

        tellPlayer(pl, "&aCollected bank freeze profits. You made &r:money:&e" + getAmountCoin(profit) + " &aextra.");

    }, 'bank.collect', [{
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }]],
    ['!bank regencode <code>', function (pl, args, data) {
        var p = new Player(pl.getName()).init(data);
        var bank = new Bank(args.code).init(data);
        var hasAdminPerm = new Permission('bank.admin').init(data).permitsPlayer(pl);

        if (bank.data.isFrozen) {
            tellPlayer(pl, "&cThis bank is frozen.");
            return false;
        }


        if (!bank.isOwner(pl.getName()) && !hasAdminPerm) {
            tellPlayer(pl, "&cYou don't have permission to regenerate the code for this bank.");
            return false;
        }
        if (p.data.money < getCoinAmount('5K')) {
            tellPlayer(pl, '&cYou don\'t have &r:money:&e5K&c in your money pouch.');
            return false;
        }

        p.data.money -= getCoinAmount('5K');
        p.save(data);

        bank = bank.rename(Bank.genBankCode(data), data);

        tellPlayer(pl, "&aRegenerated bank code and took &r:money:&e5K&a from money pouch.");
    }, 'bank.regencode', [{
        "argname": "code",
        "type": "datahandler",
        "datatype": "bank",
        "exists": true
    }]]
]);

//REGISTER CHAT CHANNEL COMMANDS

registerXCommands([
    //['', function(pl, args){}, ''],
    ['!chat create <name>', function (pl, args) {
        var data = pl.world.getStoreddata();
        var cc = new ChatChannel(args.name);
        cc.save(data);
        tellPlayer(pl, "&aCreated chat channel '" + cc.name + "'!");

        return false;
    }, 'chat.create', [
            {
                "argname": "name",
                "type": "id",
                "minlen": 3
            },
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "chatchannel",
                "exists": false,
            }
        ]],
    ['!chat remove <name>', function (pl, args, data) {
        var cc = new ChatChannel(args.name);
        cc.remove(data);
        tellPlayer(pl, "&aRemoved chat channel '" + cc.name + "'!");

        return false;
    }, 'chat.remove', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "chatchannel",
                "exists": true
            }
        ]],
    ['!chat list [...matches]', function (pl, args, data) {
        var cids = new ChatChannel().getAllDataIds(data);
        tellPlayer(pl, getTitleBar("Chat Channels"));
        for (var ci in cids) {
            var cid = cids[ci];
            var cc = new ChatChannel(cid);
            if (args.matches.length == 0 || arrayOccurs(cid, args.matches) > 0) {
                if (cc.load(data) && cc.getPermission().init(data).permits(pl.getName(), pl.world.getScoreboard(), data)) {
                    var onlinePlayers = [];
                    var offPlayers = []
                    for (var cpli in cc.data.players) {
                        var cpl = cc.data.players[cpli];
                        if (playerIsOnline(pl.world, cpl)) {
                            onlinePlayers.push(cpl);
                        } else {
                            offPlayers.push(cpl);
                        }
                    }
                    var onlineText = "$eOnline Players:$r\n" +
                        onlinePlayers.join("\n") +
                        "\n$eOffline Players:$r\n" +
                        offPlayers.join("\n");
                    var ontxt = "&r&e" + onlinePlayers.length + "/" + cc.data.players.length + " Online{*|show_text:" + onlineText + "}&r";
                    var opttxt = (cc.data.players.indexOf(pl.getName()) > -1 ? "&c&nLeave{run_command:!chat leave " + cc.name + "}&r" : "&a&nJoin{run_command:!chat join " + cc.name + "}&r");
                    tellPlayer(pl, cc.getTag() + "&r (" + cc.name + ") " + opttxt + " " + ontxt);
                }
            }
        }
        return false;
    }, 'chat.list'],
    ['!chat setColor <name> <color>', function (pl, args, data) {
        var cc = new ChatChannel(args.name);
        cc.load(data);
        cc.data.color = args.color.toLowerCase();
        cc.save(data);
        tellPlayer(pl, '&aSet color of chatchannel ' + cc.getName() + '&a to ' + cc.data.color + '!');
        return true;
    }, 'chat.setColor', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "chatchannel",
                "exists": true
            },
            {
                "argname": "color",
                "type": "color",
            }
        ]],
    ['!chat setDisplayName <name> [...displayName]', function (pl, args, data) {
        var cc = new ChatChannel(args.name).init(data);

        cc.data.displayName = (args.displayName.length > 0 ? args.displayName.join(' ') : cc.name);
        cc.save(data);
        tellPlayer(pl, '&aSet display name to: ' + cc.getName());
        return true;
    }, 'chat.setDisplayName', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "chatchannel",
                "exists": true
            },
            {
                "argname": "displayName",
                "type": "string",
                "noColor": true
            }
        ]],
    ['!chat setDesc <name> [...desc]', function (pl, args, data) {
        var cc = new ChatChannel(args.name).init(data);
        cc.data.desc = args.desc.join(' ');
        cc.save(data);
        tellPlayer(pl, '&aSet description of ' + cc.getName() + '&r&a to: ' + cc.data.desc);
        return true;
    }, 'chat.setDisplayName', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "chatchannel",
                "exists": true
            },
        ]],
    ['!chat join <name>', function (pl, args, data) {
        var cc = new ChatChannel(args.name).init(data);
        var plo = new Player(pl.getName()).init(data);
        if (cc.getPermission().init(data).permits(pl.getName(), pl.world.getScoreboard(), data)) {
            if (cc.data.players.indexOf(pl.getName()) == -1) {
                cc.data.players.push(pl.getName());
                plo.data.talkchat = cc.name;
                plo.save(data);
                cc.save(data);
                cc.broadcast(pl.world, plo.getNameTag(pl.world.getScoreboard()) + "&r &ehas joined " + cc.getName(), [pl.getName()]);
                tellPlayer(pl, "&eJoined chat-channel " + cc.getTag() + (cc.data.desc != '' ? "&r\n&e" + cc.data.desc : ""));
                return true;
            } else {
                tellPlayer(pl, "&cYou are already in this chat!");
            }


        } else {
            tellPlayer(pl, "&cYou are not allowed to join this channel!");
        }
        return false;
    }, 'chat.join', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "chatchannel",
                "exists": true
            }
        ]],
    ['!chat leave <name>', function (pl, args, data) {
        var cc = new ChatChannel(args.name).init(data);
        var plo = new Player(pl.getName()).init(data);

        if (cc.data.players.indexOf(pl.getName()) > -1) {
            cc.data.players = removeFromArray(cc.data.players, pl.getName());
            cc.save(data);
            tellPlayer(pl, "&eLeaved channel " + cc.getName());
            cc.broadcast(pl.world, plo.getNameTag(pl.world.getScoreboard()) + "&r &ehas left " + cc.getName(), [pl.getName()]);
            return true;
        } else {
            tellPlayer(pl, "&cYou can't leave a channel that you're not in!");
        }
        return false;
    }, 'chat.leave', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "chatchannel",
                "exists": true
            }
        ]],
]);

registerXCommands([
    //['', function(pl, args, data){}, '', []],
    ['!emote list [...matches]', function (pl, args, data) {
        var emids = new Emote().getAllDataIds(data);
        tellPlayer(pl, getTitleBar('Emote List'));

    }, 'emote.list', []],
    ['!emote info <name>', function (pl, args, data) {
        var em = new Emote(args.name).init(data);
        tellPlayer(pl, getTitleBar('Emote Info'));
        tellPlayer(pl, "&eEmote Name: &r" + em.name);
        tellPlayer(pl, "&eEmote: &r:" + em.name + ":");
        tellPlayer(pl, "&ePermission ID: &9&l" + em.getPermission().name + "&r [&6:sun: Info{run_command:!perms info " + em.getPermission().name + "}&r]");
        tellPlayer(pl, "&eIs Default: &c" + (em.data.default ? "&a:check_mark: Yes" : "&c:cross_mark: No"));
        tellPlayer(pl, "&ePrice: &c" + getAmountCoin(em.data.price));
        tellPlayer(pl, "&eFor Sale: " + (em.data.forSale ? "&a:check_mark: Yes" : "&c:cross_mark: No"));
        tellPlayer(pl, "&eHidden: " + (em.data.hidden ? "&c:check_mark: Yes" : "&a:cross_mark: No"));
    }, 'emote.info', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "emote",
        "exists": true,
    }]],
    ['!emote buy <emote> [...matches]', function (pl, args, data) {
        var em = new Emote(args.emote).init(data);
        var params = getArgParams(args.matches);

        if (!params.accept) {
            var output = '&eDo you want to buy &r:' + em.name + ': (' + em.name + ')&e for &r' + em.showPrice() + '&e?\n' +
                '&a[:check_mark: Yes]{run_command:!emote buy ' + em.name + ' -accept|show_text:$aClick to buy}&r';


            tellPlayer(pl, output);
        } else {
            var plo = new Player(pl.getName()).init(data);
            if (!em.data.hidden && em.data.forSale) {
                if (plo.data.emotes.indexOf() == -1) {
                    if (plo.data[em.data.currency] >= em.data.price) {
                        plo.data[em.data.currency] -= em.data.price;
                        plo.data.emotes.push(em.name);
                        plo.save(data);
                        tellPlayer(pl, "&aBought emote " + em.name + " :" + em.name + ": for " + em.showPrice() + "&a!");
                    } else {
                        var message = "&cYou don't have enough " + getCurrency(em.data.currency).displayName + " in your money pouch!";
                        tellPlayer(pl, message);
                    }
                } else {
                    tellPlayer(pl, "&cYou already have this emote!");
                }
            } else {
                tellPlayer(pl, "&cThis emote cannot be bought!");
            }
            return true;
        }
        return false;
    }, 'emote.buy', [{
        "argname": "emote",
        "type": "datahandler",
        "datatype": "emote",
        "exists": true,
    },]],
    ['!emote take <emote> <player>', function (pl, args, data) {
        var p = new Player(args.player).init(data);
        p.data.emotes = removeFromArray(p.data.emotes, args.emote);
        p.save(data);
        tellPlayer(pl, "&aTook emote '" + args.emote + "' from player '" + p.name + "'!");
        return true;
    }, 'emote.take', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true,
    },
    {
        "argname": "emote",
        "type": "datahandler",
        "datatype": "emote",
        "exists": true,
    },
        ]],
    ['!emote give <emote> <player>', function (pl, args, data) {
        var p = new Player(args.player).init(data);
        if (p.data.emotes.indexOf(args.emote) == -1) {
            p.data.emotes.push(args.emote);
        }
        p.save(data);
        tellPlayer(pl, "&aGave emote '" + args.emote + "' to player '" + p.name + "'!");
        return true;
    }, 'emote.give', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true,
    },
    {
        "argname": "emote",
        "type": "datahandler",
        "datatype": "emote",
        "exists": true,
    },
        ]],
    ['!emote setForSale <name> <forSale>', function (pl, args, data) {
        var em = new Emote(args.name).init(data);
        em.data.forSale = (args.forSale == 'true');
        em.save(data);
        tellPlayer(pl, "&a" + (em.data.forSale ? "Put" : "Pulled") + " emote '" + em.name + "' " + (em.data.forSale ? "on" : "off") + "-sale!");
    }, 'emote.setForSale', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "emote",
        "exists": true,
    },
    {
        "argname": "forSale",
        "type": "bool",
    },
        ]],
    ['!emote setHidden <name> <hidden>', function (pl, args, data) {
        var em = new Emote(args.name).init(data);
        em.data.hidden = (args.hidden == 'true');
        em.save(data);
        tellPlayer(pl, "&a" + (em.data.hidden ? "Hided" : "Showing") + " emote '" + em.name + "'");
    }, 'emote.setHidden', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "emote",
        "exists": true,
    },
    {
        "argname": "hidden",
        "type": "bool",
    },
        ]],
    ['!emote setDefault <name> <default>', function (pl, args, data) {
        var em = new Emote(args.name).init(data);
        em.data.default = (args.default == 'true');
        em.save(data);
        tellPlayer(pl, "&a" + (em.data.default ? "Put" : "Pulled") + " emote '" + em.name + "' " + (em.data.default ? "into" : "from") + " default emotes!");
    }, 'emote.setDefault', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "emote",
        "exists": true,
    },
    {
        "argname": "default",
        "type": "bool",
    },
        ]],
    ['!emote setDesc <name> [...desc]', function (pl, args, data) {
        var em = new Emote(args.name).init(data);
        em.data.desc = args.desc.join(" ");
        em.save(data);
        tellPlayer(pl, "&aChanged description of emote '" + em.name + "'!");
    }, 'emote.setDesc', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "emote",
        "exists": true,
    },]],
    ['!emote setPrice <name> <price>', function (pl, args, data) {
        var em = new Emote(args.name).init(data);
        em.data.price = getCoinAmount(args.price);
        em.save(data);
        tellPlayer(pl, "&aSet price of emote '" + em.name + "' to " + getAmountCoin(em.data.price));

        return true;
    }, 'emote.setPrice', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "emote",
        "exists": true,
    },
    {
        "argname": "price",
        "type": "currency",
        "min": 0,
    },
        ]],
]);

//REGISTER ENTITY COMMANDS
registerXCommands([
    //['', function(pl, args, data){}, '', []],
    ['!entity rename [...name]', function (pl, args, data) { }, 'entity.rename', []],
]);

registerXCommands([
    ['!fine give <player> <amount> [...reason]', function (pl, args, data) {
        var p = new Player(args.player).init(data);
        var fine = new Fine(Fine.genFineCode(data));

        fine.data.player = args.player;
        fine.data.amount = getCoinAmount(args.amount);
        fine.data.reason = args.reason.join(' ') || '';
        fine.data.giver = pl.getName();

        fine.save(data);

        var showAmount = '&r:money:&e' + getAmountCoin(fine.data.amount) + '&r';

        tellPlayerTitle(pl, '&c' + fine.data.reason, 'subtitle', args.player);
        tellPlayerTitle(pl, '&cFined ' + showAmount, 'title', args.player);

        tellTarget(pl, args.player, '&cYou have been fined ' + showAmount + '&c!\nReason: ' + fine.data.reason);
    }, 'fine.give', [{
        "argname": "players",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    }, {
        "argname": "amount",
        "type": "money",
        "min": 0
    }]],
    ['!fine list [...matches]', function (pl, args, data) {
        var params = getArgParams(args.matches);
        var output = getTitleBar('Fine List') + '\n';
        var allFines = new Fine().query(data).sortByDesc('gave').get();
        var plrs = {};
        for (var i in allFines) {
            var fine = allFines[i];
            if (Object.keys(plrs).indexOf(fine.data.player) == -1) {
                plrs[fine.data.player] = {
                    player: fine.data.player,
                    total: 0,
                    unpaid: 0,
                    active: 0,
                    fines: []
                };
            }
            plrs[fine.data.player].fines.push(fine);
            if (fine.isLate()) {
                plrs[fine.data.player].total += fine.getTotalAmount();
                plrs[fine.data.player].unpaid++;
            } else if (!fine.isPaid()) {
                plrs[fine.data.player].total += fine.getTotalAmount();
                plrs[fine.data.player].active++;
            }
        }

        plrs = Object.values(plrs);

        output += genDataPageList(
            plrs,
            args.matches,
            parseInt(params.show || 10),
            parseInt(params.page || 1),
            "!fine list {MATCHES} -show:{SHOW} -page:{PAGE} -sort:{SORT}",
            function (plr) {
                var hoverText = '&dClick for more details.\n' +
                    '&6&lUnpaid late fines: &e' + plr.unpaid.toString() + '\n' +
                    '&6&lUnpaid active fines: &e' + plr.active.toString() + '\n' +
                    '&6&lTotal unpaid sum: &r:money:&e' + getAmountCoin(plr.total) + '\n' +
                    '&dClick for more details.';
                return "&e - " + (plr.unpaid > 0 ? '&c' : (plr.active > 0 ? '&e' : '&a')) + "&l" + plr.player + "&r &c(Total: &r:money:&e" + getAmountCoin(plr.total) + "&c) &5[Info]{run_command:!fine see " + plr.player + "|show_text:" + ccs(hoverText) + "}&r\n";
            },
            function (a, b) {
                var al = a.total.toLowerCase();
                var bl = b.total.toLowerCase();

                if (al < bl) return -1;
                if (al > bl) return 1;

                return 0;
            },
            function (plr, list) {
                return arrayOccurs(plr.player, list, false, false) > 0
            },
            (params.sort || "").toLowerCase() == "desc"
        );

        tellPlayer(pl, output);
    }, 'fine.list'],
    ['!myFines [...matches]', function (pl, args, data) {
        var fines = new Fine().query(data).where('player', pl.getName()).sortBy('gave').get();
        var params = getArgParams(args.matches);
        var output = getTitleBar('My Fines', false) + '\n';

        output += genDataPageList(
            fines,
            args.matches,
            parseInt(params.show || 10),
            parseInt(params.page || 1),
            "!myFines {MATCHES} -show:{SHOW} -page:{PAGE} -sort:{SORT}",
            function (fine) {
                var hoverText = '&6&lGave By: &e' + fine.data.player + '\n' +
                    '&6&lFor: &e' + fine.data.reason + '\n' +
                    '&6&lBase amount: &e' + formatCurrency(fine.data.amount) + '\n' +
                    '&6&lTotal amount: &e' + formatCurrency(fine.getTotalAmount());
                return '&e - &r:money:&e' + getAmountCoin(fine.getTotalAmount()) + ' &c' + getDateString(fine.data.gave) + '&5 [Info]{*|show_text:' + ccs(hoverText) + '}&r\n';
            },
            function (a, b) {
                var al = a.data.gave;
                var bl = b.data.gave;

                //temp -1 1 switch
                if (al < bl) return 1;
                if (al > bl) return -1;

                return 0;
            },
            function (plr, list) {
                return arrayOccurs(plr.player, list, false, false) > 0
            },
            (params.sort || "").toLowerCase() == "desc"
        );

        tellPlayer(pl, output);
    }, 'myFines']
]);

registerXCommands([
    ['!giftcode list [...matches]', function (pl, args, data) {
        tellPlayer(pl, getTitleBar("GiftCodes List"));
        var codes = new GiftCode().getAllDataIds(data);
        for (var n in codes) {
            var codeId = codes[n];
            var code = new GiftCode(codeId).init(data);
            var hoverInfo = "$e$lCode: $r" + code.data.code + "\n$e$lUses left: $r" + code.getUsesLeft();
            tellPlayer(pl, "&e - &b&l" + code.name + "{*|show_text:" + hoverInfo + "}&r [&6:sun: Info{run_command:!giftcode info " + code.name + "}&r] [&c:cross_mark: Remove{run_command:!giftcode remove " + code.name + "}&r]");
        }
    }, 'giftcode.list', []],
    ['!giftcode info <name>', function (pl, args, data) {
        var code = new GiftCode(args.name).init(data);
        tellPlayer(pl, getTitleBar('GiftCode Info'));
        tellPlayer(pl, "&6GiftCode Name: &r" + code.name);
        tellPlayer(pl, "&6Code: &r" + code.data.code + "&r [&d:recycle: Regen{run_command:!giftcode setCode " + code.name + "}&r] [&eEdit{suggest_command:!giftcode setCode " + code.name + " }&r]");
        tellPlayer(pl, "&6Permission ID: &9&l" + code.getPermission().name + "&r [&6:sun: Info{run_command:!perms info " + code.getPermission().name + "}&r]");
        tellPlayer(pl, "&6Uses left: &c" + code.getUsesLeft());
        tellPlayer(pl, getTitleBar('Rewards', false));
        tellPlayer(pl, "&6Money: &r:money:&e" + getAmountCoin(code.data.money));
        if (code.data.badges && code.data.badges.length > 0) {
            tellPlayer(pl, "&eBadges:");
            for (var i in code.data.badges) {
                var badgeName = code.data.badges[i];
                var badge = new Badge(badgeName).init(data);
                var preview = badge.formatBadge('', '', null);
                tellPlayer(pl, "&6-&3 [" + (parseInt(i) + 1) + "] " + badge.name + " " + preview + " &r[&c:cross_mark: Remove{run_command:!giftcode removeBadge " + code.name + " " + (parseInt(i) + 1) + "}&r]");
            }
        }
        if (code.data.items.length > 0) {
            tellPlayer(pl, "&eItems:");
            for (var i in code.data.items) {
                var itemData = code.data.items[i];
                var item = nbtItem(itemData, pl.world);
                tellPlayer(pl, "&6-&3 [" + (parseInt(i) + 1) + "] " + item.getDisplayName() + " &2x" + item.getStackSize() + " &r[&c:cross_mark: Remove{run_command:!giftcode removeItem " + code.name + " " + (parseInt(i) + 1) + "}&r]");
            }
        }
        if (code.data.emotes.length > 0) {
            tellPlayer(pl, "&eEmotes:");
            for (var i in code.data.emotes) {
                var emoteData = code.data.emotes[i];
                var emote = new Emote(emoteData).init(data);
                tellPlayer(pl, "&6-&3 [" + (parseInt(i) + 1) + "] " + emote.name + " &r:" + emote.name + ": [&c:cross_mark: Remove{run_command:!giftcode removeEmote " + code.name + " " + (parseInt(i) + 1) + "}&r]");
            }
        }


    }, 'giftcode.info', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "giftcode",
                "exists": true
            }
        ]],
    ['!giftcode create <name> [code]', function (pl, args, data) {
        var giftcode = new GiftCode(args.name);
        if (args.code) {
            giftcode.data.code = args.code;
        } else {
            giftcode.generateCode();
        }
        giftcode.data.uses = -1;
        tellPlayer(pl, "&aGiftcode '" + args.name + "&a' added with code '" + giftcode.data.code + "'!");
        giftcode.save(data);
    }, 'giftcode.create', [
            {
                "argname": "name",
                "type": "id",
                "minlen": 3
            },
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "giftcode",
                "exists": false,
            }
        ]],
    ['!giftcode setCode <name> [code]', function (pl, args, data) {
        var giftcode = new GiftCode(args.name);
        giftcode.load(data);
        if (typeof (args.code) === "string") {
            giftcode.data.code = args.code;
        } else {
            giftcode.generateCode();
        }
        giftcode.save(data);
        tellPlayer(pl, "&aSet the code for GiftCode '" + args.name + "&a' to " + giftcode.data.code + "!");
    }, 'giftcode.create', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "giftcode",
                "exists": true,
            },
            {
                "argname": "code",
                "type": "id",
                "minlen": 3
            }
        ]],
    ['!giftcode setMaxUses <name> <uses>', function (pl, args, data) {
        var giftcode = new GiftCode(args.name);
        giftcode.load(data);
        giftcode.data.uses = args.uses;
        giftcode.save(data);
        tellPlayer(pl, "&aSet max uses for GiftCode '" + args.name + "&a' to " + giftcode.getUsesLeft() + "!");
    }, 'giftcode.create', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "giftcode",
                "exists": true,
            },
            {
                "argname": "uses",
                "type": "number"
            }
        ]],
    ['!giftcode addItem <name>', function (pl, args, data) {
        var hand = pl.getMainhandItem();
        if (!hand.isEmpty()) {
            var giftcode = new GiftCode(args.name);
            giftcode.load(data);
            giftcode.data.items.push(hand.getItemNbt().toJsonString());
            giftcode.save(data);
            executeXCommand("!giftcode info " + args.name, pl);
            return true;
        }
        tellPlayer(pl, "&cYou don't have anything in your hand!");
        return false;
    }, 'giftcode.create', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "giftcode",
                "exists": true,
            }
        ]],
    ['!giftcode removeItem <name> <id>', function (pl, args, data) {
        var giftcode = new GiftCode(args.name);
        var id = args.id - 1;
        giftcode.load(data);
        if (giftcode.data.items.length > id) {
            giftcode.data.items.splice(id, 1);
            giftcode.save(data);
            executeXCommand("!giftcode info " + args.name, pl);
            return true;
        }
        tellPlayer(pl, "&cNo item with this id!");
        return false;
    }, 'giftcode.create', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "giftcode",
                "exists": true,
            },
            {
                "argname": "id",
                "type": "number",
                "min": 1
            }
        ]],
    ['!giftcode setMoney <name> <amount>', function (pl, args, data) {
        var giftcode = new GiftCode(args.name);
        giftcode.load(data);
        if (args.amount != 0)
            giftcode.data.money = getCoinAmount(args.amount);
        else
            giftcode.data.money = 0;
        giftcode.save(data);
        tellPlayer(pl, "&aMoney prize set to " + args.amount + "!");
        return true;
    }, 'giftcode.create', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "giftcode",
                "exists": true
            },
            {
                "argname": "amount",
                "type": "currency"
            }
        ]],
    ['!giftcode addBadge <name> <badge>', function (pl, args, data) {
        var giftcode = new GiftCode(args.name);
        giftcode.load(data);
        if (!giftcode.data.badges) giftcode.data.badges = [];
        giftcode.data.badges.push(args.badge);
        giftcode.save(data);
        executeXCommand("!giftcode info " + args.name, pl);
        return true;
    }, 'giftcode.create', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "giftcode",
                "exists": true
            },
            {
                "argname": "badge",
                "type": "datahandler",
                "datatype": "badge",
                "exists": true
            }
        ]],
    ['!giftcode addEmote <name> <emote>', function (pl, args, data) {
        var giftcode = new GiftCode(args.name);
        giftcode.load(data);
        giftcode.data.emotes.push(args.emote);
        giftcode.save(data);
        executeXCommand("!giftcode info " + args.name, pl);
        return true;
    }, 'giftcode.create', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "giftcode",
                "exists": true
            },
            {
                "argname": "emote",
                "type": "datahandler",
                "datatype": "emote",
                "exists": true
            }
        ]],
    ['!giftcode removeBadge <name> <id>', function (pl, args, data) {
        var giftcode = new GiftCode(args.name);
        var id = args.id - 1;
        giftcode.load(data);
        if (giftcode.data.badges && giftcode.data.badges.length > id) {
            giftcode.data.badges.splice(id, 1);
            giftcode.save(data);
            executeXCommand("!giftcode info " + args.name, pl);
            return true;
        }
        tellPlayer(pl, "&cNo badge with this id!");
        return false;
    }, 'giftcode.create', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "giftcode",
                "exists": true,
            },
            {
                "argname": "id",
                "type": "number",
                "min": 1
            }
        ]],
    ['!giftcode removeEmote <name> <id>', function (pl, args, data) {
        var giftcode = new GiftCode(args.name);
        var id = args.id - 1;
        giftcode.load(data);
        if (giftcode.data.emotes.length > id) {
            giftcode.data.emotes.splice(id, 1);
            giftcode.save(data);
            executeXCommand("!giftcode info " + args.name, pl);
            return true;
        }
        tellPlayer(pl, "&cNo emote with this id!");
        return false;
    }, 'giftcode.create', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "giftcode",
                "exists": true,
            },
            {
                "argname": "id",
                "type": "number",
                "min": 1
            }
        ]],
    ['!giftcode redeem <code>', function (pl, args, data) {
        var codes = new GiftCode().getAllDataIds(data);
        for (var n in codes) {
            var codeId = codes[n];
            var code = new GiftCode(codeId).init(data);
            if (code.data.code == args.code) {
                return code.redeem(pl, data);
            }
        }
        tellPlayer(pl, "&cGiftCode with code '" + args.code + "' not found!");
    }, 'giftcode.redeem'],

    ['!giftcode unredeem <name> <player>', function (pl, args, data) {
        var code = new GiftCode(args.name);
        code.load(data);
        if (code.data.players.indexOf(args.player) == -1) {
            tellPlayer(pl, "&cCode isn't activated yet!");
            return false;
        }
        array_remove(code.data.players, args.player);
        code.save(data);
        tellPlayer(pl, "&aUnredeemed giftcode '" + args.name + "&a' for player " + args.player + "!");
    }, 'giftcode.create', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "giftcode",
                "exists": true,
            },
            {
                "argname": "player",
                "type": "datahandler",
                "datatype": "player",
                "exists": true
            }
        ]],

    ['!giftcode remove <name>', function (pl, args, data) {
        var code = new GiftCode(args.name);
        code.remove(data);
        tellPlayer(pl, "&aRemoved giftcode '" + args.name + "&a'!");
    }, 'giftcode.create', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "giftcode",
                "exists": true,
            }
        ]]
]);

registerXCommands([
    ['!jobs_deprecated create <name> [...display_name]', function (pl, args) {
        var job = new Job(args.name);
        var dname = args.display_name.join(' ');
        var data = pl.world.getStoreddata();
        if (dname != "") {
            job.data.displayName = dname;
        }
        tellPlayer(pl, "&aJob '" + job.getDisplayName(data) + "&a' created! " + getUndoBtn(["!jobs_deprecated remove " + job.name], "$cClick to undo"));
        job.save(data);
    }, 'jobs.create', [
            {
                "argname": "name",
                "type": "id",
                "minlen": 3
            },
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "job",
                "exists": false,
            }
        ]],
    ['!jobs_deprecated remove <name>', function (pl, args) {
        var job = new Job(args.name);
        var data = pl.world.getStoreddata();
        job.remove(data);
        tellPlayer(pl, "&aRemoved job '" + job.getDisplayName(data) + "&a'!");
    }, 'jobs.add', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "job",
                "exists": true,
            }
        ]],
    ['!jobs_deprecated setPay <name> <amount>', function (pl, args) {
        var job = new Job(args.name);
        var data = pl.world.getStoreddata();
        job.load(data);
        var amount = getCoinAmount(args.amount);
        job.data.pay = amount;
        job.save(data);
        tellPlayer(pl, "&aSet the salary of job '" + job.getDisplayName(data) + "&a' to &r:money:&e" + getAmountCoin(amount) + "&a!");
    }, 'jobs.setPay', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "job",
                "exists": true,
            },
            {
                "argname": "amount",
                "type": "number"
            }
        ]],
    ['!jobs_deprecated setPayTime <name> <time>', function (pl, args) {
        var job = new Job(args.name);
        var data = pl.world.getStoreddata();
        job.load(data);
        job.data.payTime = args.time;
        job.save(data);
        tellPlayer(pl, "&aSet the paytime of job '" + job.getDisplayName(data) + "&a' to " + getTimeString(args.time) + "!");
    }, 'jobs.setPayTime', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "job",
                "exists": true,
            },
            {
                "argname": "time",
                "type": "time"
            }
        ]],
    ['!jobs_deprecated setOpen <name> <open>', function (pl, args) {
        var job = new Job(args.name);
        var data = pl.world.getStoreddata();
        job.load(data);
        job.data.isOpen = (args.open == 'true');
        job.save(data);
        tellPlayer(pl, "&aSet if job '" + job.getDisplayName(data) + "&a' is open to " + args.open);
    }, 'jobs.setOpen', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "job",
                "exists": true,
            },
            {
                "argname": "open",
                "type": "bool"
            }
        ]],
    ['!jobs_deprecated setDisplayName <name> <...display_name>', function (pl, args) {
        var job = new Job(args.name);
        var data = pl.world.getStoreddata();
        job.load(data);
        job.data.displayName = args.display_name.join(' ');
        job.save(data);
        tellPlayer(pl, "&aSet the display of job_id '" + job.name + "' to '" + job.getDisplayName(data) + "&a'!");
    }, 'jobs.setDisplayName', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "job",
                "exists": true,
            }
        ]],
    ['!jobs_deprecated list [...matches]', function (pl, args) {
        var data = pl.world.getStoreddata();
        var dkeys = data.getKeys();
        tellPlayer(pl, getTitleBar("Job List"));
        for (var d in dkeys) {
            var dkey = dkeys[d];
            if ((dkey.match(/job_(\w.)/g) || []).length > 0) {
                var job = new Job(dkey.replace(/job_(\w.)/g, '$1'));
                var isMatch = false;
                args.matches.forEach(function (mt) {
                    if (occurrences(mt, job.name) > 0 || occurrences(mt, job.getDisplayName(data)) > 0) {
                        isMatch = true;
                    }
                });

                if (args.matches.length == 0 || isMatch) {
                    job.load(data);
                    tellPlayer(pl, "&e - &r" + job.getStatusColor(data) + escCcs(job.getDisplayName()) + "&r (&9&o" + job.name + "&r)");
                }

            }
        }
        return true;
    }, 'jobs.list'],
    ['!jobs_deprecated info <name>', function (pl, args) {
        var job = new Job(args.name);
        var data = pl.world.getStoreddata();
        job.load(data);
        tellPlayer(pl, getTitleBar("Job Info"));
        tellPlayer(pl, "&eName: &9&o" + job.name);
        tellPlayer(pl, "&eDisplay Name: &r" + job.getStatusColor(data) + escCcs(job.getDisplayName()));
        tellPlayer(pl, "&eCompany: &c" + job.data.companyId);
        tellPlayer(pl, "&eIncome: " + getAmountCoin(job.data.pay) + ' per ' + getTimeString(job.data.payTime));
        tellPlayer(pl, "&eIs Open: " + (job.data.isOpen ? '&atrue' : '&cfalse'));
        tellPlayer(pl, "&ePlaces taken: " + job.getStatusColor(data) + job.getPlayers(data).length + "/" + (job.data.capacity > -1 ? job.data.capacity : 'UNLIMITED'));
        tellPlayer(pl, "&eFire Time: &6" + getTimeString(job.data.fireTime));
    }, 'jobs.info', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "job",
                "exists": true,
            }
        ]],
    ['!jobs_deprecated playerList <name>', function (pl, args) {
        var job = new Job(args.name);
        var data = pl.world.getStoreddata();
        job.load(data);
        tellPlayer(pl, getTitleBar("Job Player List"));
        tellPlayer(pl, "&eJob: &9&o" + args.name);
        var pls = job.getPlayers(data);
        for (var p in pls) {
            var plr = pls[p];
            tellPlayer(pl, "&e - &r" + plr);
        }
    }, 'jobs.playerList', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "job",
                "exists": true,
            }
        ]],
    ['!jobs_deprecated addPlayers <name> <...player_names>', function (pl, args) {
        var job = new Job(args.name);
        var data = pl.world.getStoreddata();
        job.load(data);
        for (var p in args.player_names) {
            var apl = args.player_names[p];
            var apo = new Player(apl);
            if (apo.load(data)) {
                apo.addJob(job.name);
                apo.save(data);
            }
        }
        tellPlayer(pl, "&aAdded " + args.player_names.length + " player(s) to job '" + job.name + "'");
    }, 'jobs.addPlayers', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "job",
                "exists": true,
            }
        ]],
    ['!jobs_deprecated setPlaces <name> <amount>', function (pl, args) {
        var am = parseInt(args.amount) || 10;
        var job = new Job(args.name);
        var data = pl.world.getStoreddata();
        job.data.capacity = am;
        tellPlayer(pl, "&aSet max players of job '" + job.name + "' to " + am + '!');
        job.save(data);
    }, 'jobs.setPlaces', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "job",
                "exists": true,
            },
            {
                "argname": "amount",
                "type": "number"
            }
        ]],
    ['!jobs_deprecated setFireTime <name> <time>', function (pl, args) {
        var job = new Job(args.name);
        var data = pl.world.getStoreddata();
        job.data.fireTime = args.time;
        tellPlayer(pl, "&aSet fire time of job '" + job.name + "' to " + getTimeString(args.time) + "!");
        job.save(data);
    }, 'jobs.setFireTime', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "job",
                "exists": true,
            },
            {
                "argname": "time",
                "type": "time"
            }
        ]],
    ['!jobs_deprecated removePlayers <name> <...players>', function (pl, args) {
        var job = new Job(args.name);
        var data = pl.world.getStoreddata();
        for (var p in args.players) {
            var apl = args.players[p];
            var apo = new Player(apl);
            if (apo.load(data)) {
                apo.delJob(job.name);
                apo.save(data);
            }
        }
        tellPlayer(pl, "&aRemoved " + args.players.length + " player(s) from job '" + job.name + "'");
    }, 'jobs.removePlayers', [
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "job",
                "exists": true,
            }
        ]],
    ['!jobs_deprecated reload', function (pl, args) {
        var data = pl.world.getStoreddata();
        var dkeys = data.getKeys();
        var jc = 0;
        for (var d in dkeys) {
            var dkey = dkeys[d];
            if (dkey.cmatch(/job_(\w+)/g)) {
                var job = new Job(dkey.replace(/job_(\w+)/g, '$1'));
                if (job.load(data)) {
                    job.save(data);
                }
                jc++;
            }
        }
        tellPlayer(pl, "&aReloaded " + jc + " job(s)!");
    }, 'jobs.reload']
]);

registerXCommands([
    ['!loan take <amount>', function (pl, args, data) {
        var amount = getCoinAmount(args.amount);
        var loan = new Loan(pl.getName());
        loan.load(data);

        if (loan.exists(data)) {
            if (!loan.isPaid()) {
                tellPlayer(pl, "&cYou already have a loan that isn't paid!");
                return false;
            } else {
                loan.remove(data);
            }
        }

        var p = new Player(pl.getName()).init(data);
        loan = new Loan(pl.getName());

        loan.data.amount = amount;
        loan.save(data);

        p.data.money += amount;
        p.save(data);

        tellPlayer(pl, "&aLoaned &r:money:&e" + getAmountCoin(amount) + "&a! See &e!myLoan&a to see your payment plan!");
    }, 'loan.take', [{
        "argname": "amount",
        "type": "currency",
        "min": getCoinAmount('5K'),
        "max": getCoinAmount('1M')
    }]],
    ['!loan takefor <player> <amount> [interest] [timePerTerm]', function (pl, args, data) {
        var p = new Player(args.player);
        if (!p.exists(data)) {
            tellPlayer(pl, "&c" + args.player + " isn't known in this server, needs to be at least joined once.");
            return false;
        }
        var amount = getCoinAmount(args.amount);
        var loan = new Loan(args.player);
        loan.load(data);

        if (loan.exists(data)) {
            if (!loan.isPaid()) {
                tellPlayer(pl, "&c" + args.player + " already has an active loan, you don't want to give it for free &e[Spy]{run_command:!loan spy " + args.player + "}");
                return false;
            } else {
                loan.remove(data);
            }
        }

        loan = new Loan(args.player);

        loan.data.amount = amount;
        loan.data.interest = parseFloat(args.interest || loan.data.interest);
        loan.data.payInterval = getStringTime(args.timePerTerm || '1d');
        loan.save(data);

        var p = new Player(args.player).init(data);
        p.data.money += amount;
        p.save(data);

        tellPlayer(pl, "&aLoaned &r:money:&e" + getAmountCoin(amount) + "&a for " + args.player + "!");
    }, 'loan.takefor', [{
        "argname": "amount",
        "type": "currency",
        "min": getCoinAmount('100G'),
    },
    {
        "argname": "interest",
        "type": "number",
        "min": 0,
        "max": 100
    },
    {
        "argname": "timePerTerm",
        "type": "time",
        "min": getStringTime('1h'),
    }
        ]],
    ['!myLoan [...matches]', function (pl, args, data) {
        var loan = new Loan(pl.getName());
        var params = getArgParams(args.matches);
        if (!loan.exists(data)) {
            tellPlayer(pl, "&cYou don't have an open loan currently");
            return false;
        }

        loan.load(data);


        tellPlayer(pl, formatLoanInfo(loan, params, 'Info', '!myLoan'));
        // print(JSON.stringify([loan.getPaymentTerms(), loan.getPaybackAmount()]));
    }, 'myLoan'],
    ['!loan pay <amount>', function (pl, args, data) {
        var loan = new Loan(pl.getName());
        if (!loan.exists(data)) {
            tellPlayer(pl, "&cYou don't have an open loan currently.");
            return false;
        }
        loan.load(data);
        var amount = Math.min(getCoinAmount(args.amount), loan.getPaybackAmount() - loan.data.paid);
        var p = new Player(pl.getName()).init(data);
        if (p.data.money < amount) {
            tellPlayer(pl, "&cYou don't have enough money in your money pouch.");
            return false;
        }

        p.data.money -= amount;
        loan.data.paid += amount;

        if (loan.data.loanedFrom) {
            var loanedFrom = new Player(loan.data.loanedFrom).init(data);

            if (playerIsOnline(pl.world, loan.data.loanedFrom)) {
                tellPlayer(pl.world.getPlayer(loanedFrom.name), "&a" + pl.getName() + " payed &r:money:&e" + getAmountCoin(amount) + "&a towards your loan.");
            }

            loanedFrom.data.money += amount;
            loanedFrom.save(data);
        }



        p.save(data);

        if (loan.data.paid >= loan.getPaybackAmount()) {
            loan.remove(data);
            tellPlayer(pl, "&aYou paid &r:money:&e" + getAmountCoin(amount) + " &aand finished off your loan!");
            tellPlayer(pl, "&aLoan removed.");
        } else {
            loan.save(data);
            tellPlayer(pl, "&aYou paid &r:money:&e" + getAmountCoin(amount) + " &ato your loan.");
        }

        return false;

    }, 'loan.pay', [{
        'argname': 'amount',
        'type': 'currency',
        'min': 100
    }]],
    ['!loan payFor <player> <amount>', function (pl, args, data) {
        var loan = new Loan(args.player);
        if (!loan.exists(data)) {
            tellPlayer(pl, "&cThis player doesn't have an open loan currently.");
            return false;
        }
        loan.load(data);
        var amount = Math.min(getCoinAmount(args.amount), loan.getPaybackAmount() - loan.data.paid);
        loan.data.paid += amount;

        if (loan.data.loanedFrom) {
            var loanedFrom = new Player(loan.data.loanedFrom).init(data);

            if (playerIsOnline(pl.world, loan.data.loanedFrom)) {
                tellPlayer(pl.world.getPlayer(loanedFrom.name), "&a" + pl.getName() + " payed &r:money:&e" + getAmountCoin(amount) + "&a towards your loan.");
            }

            loanedFrom.data.money += amount;
            loanedFrom.save(data);
        }

        if (playerIsOnline(pl.world, args.player)) {
            tellPlayer(pl.world.getPlayer(args.player), "&a" + pl.getName() + " gave &r:money:&e" + getAmountCoin(amount) + "&a towards your personal loan.");
        }


        if (loan.data.paid >= loan.getPaybackAmount()) {
            loan.remove(data);
            tellPlayer(pl, "&aYou gave &r:money:&e" + getAmountCoin(amount) + " &a for " + args.player + " and finished off their loan!");
            tellPlayer(pl, "&aLoan removed.");
        } else {
            loan.save(data);
            tellPlayer(pl, "&aYou gave &r:money:&e" + getAmountCoin(amount) + " &ato " + args.player + "'s loan.");
        }

        return false;

    }, 'loan.payFor', [{
        'argname': 'amount',
        'type': 'currency',
        'min': 100
    }]],
    ['!loan spy <player> [...matches]', function (pl, args, data) {
        var loan = new Loan(args.player);
        var params = getArgParams(args.matches);
        if (!loan.exists(data)) {
            tellPlayer(pl, "&cThis player doesn't have an open loan currently");
            return false;
        }

        loan.load(data);

        tellPlayer(pl, formatLoanInfo(loan, params, 'Spy ' + loan.data.player, '!loan spy ' + args.player));
    }, 'loan.spy'],
    ['!loan help <amount> [interest] [timePerTerm] [...matches]', function (pl, args, data) {
        var loan = new Loan(args.player);
        var amount = getCoinAmount(args.amount);
        var interest = parseInt(args.interest);
        var params = getArgParams((args.matches.join(" ") + ' ' + args.interest + ' ' + args.timePerTerm).split(" "));

        loan.data.amount = amount;
        loan.data.interest = isNaN(interest) ? loan.data.interest : interest;
        loan.data.payInterval = getStringTime(args.timePerTerm || getTimeString(loan.data.payInterval));

        tellPlayer(pl, formatLoanInfo(loan, params, 'Help', '!loan help ' + getAmountCoin(loan.data.amount) + ' ' + loan.data.interest + ' ' + getTimeString(loan.data.payInterval)));
    }, 'loan.help', [{
        "argname": "amount",
        "type": "currency",
        "min": getCoinAmount('5K'),
        "max": getCoinAmount('1M')
    },
    {
        "argname": "interest",
        "type": "number",
        "min": 1,
        "max": 100
    },
    {
        "argname": "timePerTerm",
        "type": "time",
        "min": getStringTime('1h'),
    }
        ]],
    ['!loan unpaid [...matches]', function (pl, args, data) {
        var unpaid = [];
        var loans = new Loan().getAllDataEntries(data);
        var params = getArgParams(args.matches);

        for (var i in loans) {
            var loan = loans[i];
            if (!loan.isLate()) {
                continue;
            }

            unpaid.push(loan);
        }

        var output = getTitleBar('Unpaid Loans') + '\n';

        output += genDataPageList(
            unpaid,
            args.matches,
            parseInt(params.show || 10),
            parseInt(params.page || 1),
            "!loan unpaid {MATCHES} -show:{SHOW} -page:{PAGE} -sort:{SORT}",
            function (loan) {
                return "&e - &c&l" + loan.data.player + "&r &e[Spy]{run_command:!loan spy " + loan.data.player + "|show_text:$cClick to see loan of this player}&r\n";
            },
            function (a, b) {
                var al = a.data.player.toLowerCase();
                var bl = b.data.player.toLowerCase();

                if (al < bl) return -1;
                if (al > bl) return 1;

                return 0;
            },
            function (loan, list) {
                return arrayOccurs(loan.data.player, list, false, false) > 0
            },
            (params.sort || "").toLowerCase() == "desc"
        );

        tellPlayer(pl, output);
    }, 'loan.unpaid'],
    ['!loan change interest <player> <interest>', function (pl, args, data) {
        var loan = new Loan(args.player);
        var params = getArgParams(args.matches);
        if (!loan.exists(data)) {
            tellPlayer(pl, "&cThis player doesn't have an open loan currently");
            return false;
        }
        loan.load(data);

        loan.data.interest = parseFloat(args.interest);
        loan.save(data);

        tellPlayer(pl, "&aChanged the interest to &e" + loan.data.interest + "%&a of " + loan.data.player + "'s loan.");
        return true;

    }, 'loan.change.interest'],
    ['!loan change timePerTerm <player> <time>', function (pl, args, data) {
        var loan = new Loan(args.player);
        var params = getArgParams(args.matches);
        if (!loan.exists(data)) {
            tellPlayer(pl, "&cThis player doesn't have an open loan currently");
            return false;
        }
        loan.load(data);

        loan.data.payInterval = getStringTime(args.time);
        loan.save(data);

        tellPlayer(pl, "&aChanged the time per payment to &e" + getTimeString(loan.data.payInterval) + "&a of " + loan.data.player + "'s loan.");
        return true;

    }, 'loan.change.timePerTerm', [{
        "argname": "time",
        "type": "time",
        "min": getStringTime('1h')
    }]],
    ['!loan list [...matches]', function (pl, args, data) {
        var loans = new Loan().getAllDataEntries(data);
        var params = getArgParams(args.matches);

        var output = getTitleBar('Loan List') + '\n';

        output += genDataPageList(
            loans,
            args.matches,
            parseInt(params.show || 10),
            parseInt(params.page || 1),
            "!loan list {MATCHES} -show:{SHOW} -page:{PAGE} -sort:{SORT}",
            function (loan) {
                return "&e - &" + (loan.isLate() ? 'c' : 'a') + "&l" + loan.data.player + "&r :money:&e" + getAmountCoin(loan.data.amount) + "&r &6+ &e" + loan.data.interest + "% &6[Spy]{run_command:!loan spy " + loan.data.player + "|show_text:$cClick to see loan of this player}&r\n";
            },
            function (a, b) {
                var al = (a.player || "").toLowerCase();
                var bl = (b.player || "").toLowerCase();

                if (al < bl) return -1;
                if (al > bl) return 1;

                return 0;
            },
            function (loan, list) {
                return arrayOccurs(loan.data.player, list, false, false) > 0
            },
            (params.sort || "").toLowerCase() == "desc"
        );

        tellPlayer(pl, output);
    }, 'loan.list'],
    ['!loan request <player> <amount> [interest] [timePerPayment] [...params]', function (pl, args, data) {
        // if (pl.getName() == args.player) {
        //     tellPlayer(pl, '&cYou can\'t request a loan to yourself.');
        //     return false;
        // }

        args.interest = args.interest || (12.5).toString();
        args.timePerPayment = args.timePerPayment || '3d';


        var params = getArgParams(args.params.concat([args.interest, args.timePerPayment]));
        var output = '';
        var p = new Player(pl.getName()).init(data);
        var otherp = new Player(args.player).init(data);
        var tempdata = pl.world.tempdata;
        var requestKey = '_loan_request_' + p.name + '_' + otherp.name;

        var amount = getCoinAmount(args.amount);
        var interest = parseFloat(args.interest || 12.5);
        var payTime = getStringTime(args.timePerPayment || '3d');
        var showAmount = getAmountCoin(amount);
        var showInterest = interest.toString();
        var showPayTime = getTimeString(payTime, ['ms']);
        if (!params.accept) {

            if (new Loan(p.name).exists(data)) {
                tellPlayer(pl, '&cYou have still an active loan running.');
                return false;
            }

            output += getTitleBar('Player Loan Request', false) + '\n';

            output += '&aYou want to loan &r:money:&e' + showAmount + '&a from ' + otherp.name + ' with:&r\n' +
                '&a - an &einterest rate of &c' + showInterest + '%\n' +
                '&a - &e' + showPayTime + ' time&a per payment.\n\n' +
                '&d[? Loan Info]{run_command:!loan help ' + showAmount + ' ' + showInterest + ' ' + showPayTime + '|show_text:$dClick to show payments info about this loan. It\'s handy to know beforehand.}&r\n' +
                '&a[:check_mark: Send Request]{run_command:!loan request ' + args.player + ' ' + showAmount + ' ' + showInterest + ' ' + showPayTime + ' -accept|show_text:$aClick to send the request.}&r';

        } else {
            output += '&aSent loan invite to ' + otherp.name + '.';
            tempdata.put(requestKey, {
                amount: amount,
                interest: interest,
                payTime: payTime,
                expiresAt: new Date().getTime() + getStringTime('5min')
            });
            tellTarget(pl, otherp.name, '&a' + p.name + ' requests to loan &r:money:&e' + showAmount + '&a &a&o(interest: ' + showInterest + '%) from you. &d[Click here to view]{run_command:!loan check ' + p.name + '|show_text:$dClick to view info about the loan request.}');
        }

        tellPlayer(pl, output);
    }, 'loan.request', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true,
    },
    {
        "argname": "amount",
        "type": "currency",
        "min": getCoinAmount('1K'),
        "max": getCoinAmount('500B'),
    },
    {
        "argname": "interest",
        "type": "number",
        "min": 0,
        "max": 100,
    },
    {
        "argname": "timePerPayment",
        "type": "time",
        "min": getStringTime('1h'),
        "max": getStringTime('1mon2w'),
    }
        ]],
    ['!loan check <player> [...params]', function (pl, args, data) {
        var params = getArgParams(args.params);
        var output = '';
        var p = new Player(pl.getName()).init(data);
        var otherp = new Player(args.player).init(data);
        var tempdata = pl.world.tempdata;
        var sb = pl.world.scoreboard;
        var requestKey = '_loan_request_' + otherp.name + '_' + p.name;

        if (!tempdata.has(requestKey)) {
            tellPlayer(pl, '&c' + otherp.name + ' has not send any request to you.');
            return false;
        }

        var request = tempdata.get(requestKey);

        if (new Date().getTime() >= request.expiresAt) {
            tellPlayer(pl, '&cThis request has been expired.');
            tempdata.remove(requestKey);
            return false;
        }

        var showAmount = getAmountCoin(request.amount);
        var showPayTime = getTimeString(request.payTime);
        var showInterest = parseFloat(request.interest).toString();

        if (p.data.money < request.amount) {
            tellPlayer(pl, '&cYou don\'t have enough money in your money pouch to loan.');
            return false;
        }

        if (new Loan(otherp.name).exists(data)) {
            tellPlayer(pl, '&c' + otherp.name + ' has still an active loan running.');
            return false;
        }

        if (!params.accept && !params.deny) {
            output += getTitleBar('Player Loan Request', false) + '\n';
            output += '&r' + otherp.getNameTag(sb) + '&a requests to loan from you.\n' +
                '&aLoan amount: &r:money:&e' + showAmount + '\n' +
                '&aInterest: &e' + showInterest + '%\n' +
                '&aTime per payment: &e' + showPayTime + '\n' +
                '&d[Loan payments info]{run_command:!loan help ' + showAmount + ' ' + showInterest + ' ' + showPayTime + '|show_text:$dClick here to show what payments ' + otherp.name + ' needs to make.}&r\n' +
                '&a[:check_mark: Accept Loan Request]{run_command:!loan check ' + otherp.name + ' -accept|show_text:$aClick to accept the loan request.}&r';

        } else if (params.accept) {
            p.data.money -= request.amount;
            otherp.data.money += request.amount;

            var loan = new Loan(otherp.name);
            loan.data.amount = request.amount;
            loan.data.interest = request.interest;
            loan.data.loanedFrom = p.name;

            p.save(data);
            otherp.save(data);
            loan.save(data);

            tempdata.remove(requestKey);
            output += '&aSuccesfully accepted ' + otherp.name + '\'s loan request.';
            tellTarget(pl, otherp.name, '&a' + p.name + ' has accepted your loan request, do !myLoan');
        } else if (params.deny) {
            tempdata.remove(requestKey);
            output += '&aSuccessfully denied ' + otherp.name + '\'s loan request.';
            tellTarget(pl, otherp.name, '&c' + p.name + ' has denied your loan request.');
        }

        tellPlayer(pl, output);
    }, 'loan.check', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true,
    }]],
    ['!myPlayerLoans [...matches]', function (pl, args, data) {
        var params = getArgParams(args.matches);
        var output = getTitleBar('My Player Loans', false) + '\n';

        var loans = new Loan().query(data).where('loanedFrom', pl.getName()).get();
        output += genDataPageList(
            loans,
            args.matches,
            (params.show || 10),
            (params.page || 1),
            '!myPlayerLoans {MATCHES} -show:{SHOW} -page:{PAGE} -sort:{SORT}',
            function (loan) {
                return "&e - &" + (loan.isLate() ? 'c' : 'a') + "&l" + loan.data.player + "&r :money:&e" + getAmountCoin(loan.data.amount) + "&r &6+ &e" + loan.data.interest + "% &6[Check]{run_command:!myPlayerLoan " + loan.data.player + "|show_text:$cClick to see loan of this player}&r\n";
            },
            function (a, b) {
                var al = (a.player || "").toLowerCase();
                var bl = (b.player || "").toLowerCase();

                if (al < bl) return -1;
                if (al > bl) return 1;

                return 0;
            },
            function (loan, list) {
                return arrayOccurs(loan.data.player, list, false, false) > 0
            },
            (params.sort || "").toLowerCase() == "desc"
        );

        tellPlayer(pl, output);
    }, 'myPlayerLoans'],
    ['!myPlayerLoan <player> [...params]', function (pl, args, data) {
        var params = getArgParams(args.params);
        var loan = new Loan(args.player).init(data);
        if (loan.data.loanedFrom != pl.getName()) {
            tellPlayer(pl, '&cThis loan is not loaned from you.');
            return false;
        }

        tellPlayer(pl, formatLoanInfo(loan, params, 'Check for ' + args.player, '!myPlayerLoan ' + args.player));
    }, 'myPlayerLoan', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "loan",
        "exists": true
    }]]
]);


registerXCommands([
    ["!menu open <file>", function (pl, args, data) {
        var path = "menus/" + args.file + ".json";
        var menuFile = new File(path);
        if (menuFile.exists()) {
            var json = readFileAsString(path);
            try {
                json = JSON.parse(json);
            } catch (exc) {
                handleError(exc, true, pl.getName());
            }

            var menu = new CustomMenu().fromJson(json);
            var c = menu.open(pl);
            tellPlayer(pl, "The size is: " + c.getSize());
        } else {
            tellPlayer(pl, "&cFile '" + path + "' doesn't exists!");
        }
    }, "menu.open"]
]);





//REGISTER PLAYER COMMANDS
var playerCommands = new CommandFactory("player");

playerCommands
    .setListTransformer(
        function (player) {
            return "&e - &b" + player.name + " &3[Info]{run_command:!player info " + player.name + "}&r\n";
        }
    )
    .genDefault(["create", "info"])
    .register();


registerXCommands([
    //PLAYER MANAGE
    ['!player perms <player> [...matches]', function (pl, args, data) {
        var permids = new Permission().getAllDataIds(data);

        var w = pl.world;
        var sb = w.getScoreboard();
        var tm = sb.getPlayerTeam(args.player);
        tellPlayer(pl, getTitleBar("Player Perms"));
        tellPlayer(pl, "&ePermissions for player:&r " + args.player);
        var shownperms = 0;
        for (var p in permids) {
            var pid = permids[p];
            if (args.matches.length == 0 || arrayOccurs(pid, args.matches, false, false) > 0) {
                var perm = new Permission(pid).init(data);
                if (perm.permits(args.player, sb, data)) {
                    tellPlayer(pl, "&6 - Has permission: &b&l" + perm.name + "&r (&ePerm Info{run_command:!perms info " + perm.name + "}&r)");
                    if (perm.data.players.indexOf(args.player) > -1) {
                        tellPlayer(pl, "&e    - By player&r (&c - Revoke{run_command:!perms removePlayers " + perm.name + " " + args.player + "|show_text:$cClick to revoke permission " + perm.name + " for player " + args.player + ".}&r)");
                    }
                    if (tm != null) {
                        if (perm.data.teams.indexOf(tm.getName()) > -1) {
                            var tcol = '&' + getColorId(tm.getColor());
                            tellPlayer(pl, "&e    - By team " + tcol + "&o" + tm.getName() + "&r (&c:cross_mark: Revoke Team{run_command:!perms removeTeams " + perm.name + " " + tm.getName() + "|show_text:$cClick to revoke permission " + perm.name + " for team " + tm.getName() + ".}&r)");
                        }
                    }
                    shownperms++;
                }
            }

        }
        if (shownperms == 0) {
            tellPlayer(pl, "&cNo permissions found for player " + args.player);
        }
    }, 'player.perms'],
    ['!player setColor <player> [color]', function (pl, args, data) {
        var plo = new Player(args.player).init(data);
        plo.data.color = args.color;
        plo.save(data);

        if (args.color != null) {
            tellPlayer(pl, "&aSet color of player '" + args.player + "' to '" + args.color + "'");
        } else {
            tellPlayer(pl, "&aReset color of player '" + args.player + "'!");
        }

    }, "player.setColor", [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true,
    },
    {
        "argname": "color",
        "type": "color"
    }
        ]],
    ['!player setPay <player> <amount>', function (pl, args, data) {
        var am = getCoinAmount(args.amount);
        var p = new Player(args.player).init(data);

        p.data.pay = am;
        p.save(data);
        tellPlayer(pl, "&aSet pay amount of player '" + p.name + "' to &r:money:&e" + getAmountCoin(am) + '&a!');

        return true;
    }, 'player.setPay', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    },
    {
        "argname": "amount",
        "type": "currency",
        "min": 0
    }
        ]],
    ['!player setPayTime <player> <time>', function (pl, args, data) {
        var am = getStringTime(args.time);
        var p = new Player(args.player).init(data);
        p.data.payTime = am;
        p.save(data);
        tellPlayer(pl, "&aSet pay time of player '" + p.name + "' to " + getTimeString(am) + '!');

        return true;
    }, 'player.setPayTime', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    },
    {
        "argname": "time",
        "type": "time",
        "min": getStringTime("30s"),
    }
        ]],
    ['!player setMaxJobs <player> <amount>', function (pl, args, data) {
        var p = new Player(args.player).init(data);
        p.data.maxJobs = parseInt(args.amount) || 1;
        p.save(data);

        tellPlayer(pl, "&aSet maxhomes of player '" + p.name + "' to " + (parseInt(args.amount) || 1) + '!');
        return true;

    }, 'player.setMaxJobs', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    },
    {
        "argname": "amount",
        "type": "number",
        "min": -1,
    }
        ]],
    ['!player setMaxHomes <player> <amount>', function (pl, args, data) {
        var p = new Player(args.player).init(data);
        p.data.maxHomes = parseInt(args.amount) || 1;
        p.save(data);
        tellPlayer(pl, "&aSet maxhomes of player '" + p.name + "' to " + (parseInt(args.amount) || 1) + '!');
        return true;

    }, 'player.setMaxHomes', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    },
    {
        "argname": "amount",
        "type": "number",
        "min": -1,
    }
        ]],
    ['!player setChatColor <player> <color>', function (pl, args, data) {
        var plo = new Player(args.player).init(data);
        plo.data.chatcolor = args.color;
        plo.save(data);
        tellPlayer(pl, "&aChanged chatcolor to " + args.color + "!");
        return true;
    }, 'player.setChatColor', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    },
    {
        "argname": "color",
        "type": "color"
    }
        ]],
    ['!player resetChatColor <player>', function (pl, args, data) {
        var plo = new Player(args.player).init(data);
        plo.data.chatcolor = null;
        plo.save(data);
        tellPlayer(pl, "&aReset chatcolor of player " + plo.name + "!");
        return true;
    }, 'player.resetChatColor', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    },]],
    ['!player giveChatColor <player> <color>', function (pl, args, data) {
        var plo = new Player(args.player).init(data);
        if (plo.data.chatcolors.indexOf(args.color) > -1) {
            tellPlayer(pl, '&cThis player has already the chat color ' + args.color);
            return false;
        }
        plo.data.chatcolors.push(args.color);
        plo.save(data);
        tellPlayer(pl, "&Gave chatcolor " + args.color + " to " + args.player + "!");
        return true;
    }, 'player.giveChatColor', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    },
    {
        "argname": "color",
        "type": "color"
    }
        ]],
    ['!player takeChatColor <player> <color>', function (pl, args, data) {
        var plo = new Player(args.player).init(data);
        var cindex = plo.data.chatcolors.indexOf(args.color);
        if (cindex == -1) {
            tellPlayer(pl, '&cThis player has doesn\'t have the chat color: ' + args.color);
            return false;
        }
        plo.data.chatcolors.splice(cindex, 1);
        plo.save(data);
        tellPlayer(pl, "&Took chatcolor " + args.color + " from " + args.player + "!");
        return true;
    }, 'player.takeChatColor', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    },
    {
        "argname": "color",
        "type": "color"
    }
        ]],
    ['!player setChatEffect <player> <effect>', function (pl, args, data) {
        var plo = new Player(args.player).init(data);
        plo.data.chatcolor = args.effect;
        plo.save(data);
        tellPlayer(pl, "&aChanged chateffect to " + args.effect + "!");
        return true;
    }, 'player.setChatColor', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    },
    {
        "argname": "effect",
        "type": "coloreffect"
    }
        ]],
    ['!player resetChatEffect <player>', function (pl, args, data) {
        var plo = new Player(args.player).init(data);
        plo.data.chateffect = null;
        plo.save(data);
        tellPlayer(pl, "&aReset chateffect of player " + plo.name + "!");
        return true;
    }, 'player.resetChatEffect', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    },]],
    ['!player income <player>', function (pl, args, data) {
        var p = new Player(args.player).init(data);
        var sb = pl.world.getScoreboard();
        tellPlayer(pl, getTitleBar("Player Income"));
        tellPlayer(pl, "&ePlayer: &r" + p.getNameTag(sb));
        tellPlayer(pl, "&eBasic income: &6&o" + getAmountCoin(p.data.pay) + "&r&e per &6&o" + getTimeString(p.data.payTime));
        var tleft = (p.data.lastPayed + p.data.payTime) - new Date().getTime();
        tellPlayer(pl, "&6&o" + getTimeString(tleft, ['ms']) + "&r&e until next pay.");
        var pjobs = p.getJobs(data);

        if (pjobs.length > 0) {
            for (var pj in pjobs) {
                var pjob = pjobs[pj];
                tellPlayer(pl, "&eJob income for &r" + pjob.getDisplayName(data));
                tellPlayer(pl, "&e - Job salary: &6&o" + getAmountCoin(pjob.data.pay));
                var jleft = (p.getJob(pjob.name).lastPayed + pjob.data.payTime) - new Date().getTime();
                tellPlayer(pl, "&e - &6&o" + getTimeString(jleft, ['ms']) + "&r&e until next pay for &r" + pjob.getDisplayName(data));
            }
        }


        //print(p.toJson());
        return true;
    }, 'player.income', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    }]],
    ['!player info <player>', function (pl, args, data) {
        var p = new Player(args.player).init(data);
        var sb = pl.world.getScoreboard();
        var po = null;
        tellPlayer(pl, getTitleBar("Player Info", false));
        tellPlayer(pl, "&6&lPlayer Info For: &r" + p.getNameTag(sb));
        var now = new Date().getTime();
        tellPlayer(pl, "&6UUID: &e" + p.data.UUID);
        tellPlayer(pl, "&6First Login: &e&o" + getTimeString(now - p.data.firstLogin, ['ms']) + "&r &eago.");
        tellPlayer(pl, "&6Last Login: &e&o" + getTimeString(now - p.data.lastLogin, ['ms']) + "&r &eago.");
        for (var v in VIRTUAL_CURRENCIES) {
            var crncy = VIRTUAL_CURRENCIES[v];
            tellPlayer(pl, "&6" + crncy.displayName + ": &r" + crncy.prefix + getAmountCoin(p.data[crncy.name]) + crncy.suffix);
        }
        tellPlayer(pl, "&6Bounty: &r:money:&e" + getAmountCoin(p.getBounty(sb)));
        var mh = p.getMaxHomes(sb);
        var mj = p.getMaxJobs(sb);
        var hc = Object.keys(p.data.homes).length;
        var jc = Object.keys(p.data.jobs).length;
        tellPlayer(pl, "&6Max Homes: &e" + hc + "/" + (mh == -1 ? "&aInfinite" : mh) + "&r [&a:check_mark: Set{suggest_command:!player setMaxHomes " + p.name + " }&r] [&dView{run_command:!player homes " + p.name + "}&r]");
        tellPlayer(pl, "&6Max Jobs: &e" + jc + "/" + (mj == -1 ? "&aInfinite" : mj) + "&r [&a:check_mark: Set{suggest_command:!player setMaxJobs " + p.name + " }&r] [&dView{run_command:!player income " + p.name + "}&r]");

        // Regions (ownership/trust)
        var regions = new Region().getAllDataEntries(data);
        var ownedRegions = [];
        var trustedRegions = [];
        for (var i = 0; i < regions.length; i++) {
            var reg = regions[i];
            if (reg && reg.data) {
                if (reg.data.owner === p.name) {
                    ownedRegions.push(reg.name);
                } else if (reg.data.trusted && reg.data.trusted.indexOf(p.name) > -1) {
                    trustedRegions.push(reg.name);
                }
            }
        }
        ownedRegions.sort();
        trustedRegions.sort();
        if (ownedRegions.length === 0 && trustedRegions.length === 0) {
            tellPlayer(pl, "&6&lRegions:&r\n&7None");
        } else {
            var regionsTxt = "&6&lRegions:&r\n";
            regionsTxt += "&6Owned: &e" + ownedRegions.length + "\n" + (ownedRegions.length ? arrayFormat(ownedRegions, "&e - &b{VALUE}", "\n") : "&7 - None") + "\n";
            regionsTxt += "&6Trusted: &e" + trustedRegions.length + "\n" + (trustedRegions.length ? arrayFormat(trustedRegions, "&e - &b{VALUE}", "\n") : "&7 - None");
            tellPlayer(pl, regionsTxt);
        }

        // Modern jobs (from modules/jobs data_auto)
        var MODERN_JOBS_DATA_PATH = "world/customnpcs/scripts/data_auto/jobs.json";
        var modernJobsTxt = "&6&lModern Jobs:&r";
        var modernJobs = [];
        var jobsFile = new File(MODERN_JOBS_DATA_PATH);
        if (jobsFile.exists()) {
            var jobsRaw = readFileAsString(MODERN_JOBS_DATA_PATH);
            if (jobsRaw && jobsRaw.trim() !== "") {
                var jobsData = JSON.parse(jobsRaw);
                var entry = jobsData ? jobsData[p.data.UUID] : null;
                var active = entry && entry.ActiveJobs ? entry.ActiveJobs : {};
                for (var jid in active) {
                    var aj = active[jid];
                    if (!aj) continue;
                    var label = aj.JobName || (aj.JobID !== undefined ? ("JobID " + aj.JobID) : ("Job " + jid));
                    var meta = [];
                    if (aj.Region) meta.push(aj.Region);
                    if (aj.Type) meta.push(aj.Type);
                    if (meta.length) label += " &7(" + meta.join(", ") + ")";
                    modernJobs.push(label);
                }
            }
        }
        modernJobs.sort();
        modernJobsTxt += "\n" + (modernJobs.length ? arrayFormat(modernJobs, "&e - &b{VALUE}", "\n") : "&7None");
        tellPlayer(pl, modernJobsTxt);

        var badgetxt = arrayFormat(p.data.badges, "&e - &b{VALUE}", "\n");
        tellPlayer(pl, "&6&lBadges:&r\n" + badgetxt);
        tellPlayer(pl, "&6Unlocks:\n&b" + Object.keys(p.data.unlocks).join(', '))
        return true;
    }, 'player.info', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    }]],
    ['!player homes <player>', function (pl, args, data) {
        var apo = new Player(args.player).init(data);
        var w = pl.world;
        var sb = w.getScoreboard();
        tellPlayer(pl, getTitleBar("Player Homes"));
        tellPlayer(pl, "&6Player: " + apo.getNameTag(sb));
        for (var hname in apo.data.homes) {
            var home = apo.data.homes[hname];
            tellPlayer(pl, "&6 - &b&l" + hname + "&r [&9Teleport{run_command:/tp " + pl.getName() + " " + home.x + " " + home.y + " " + home.z + "}&r]");
        }
    }, 'player.homes', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    }]],



    //PLAYER UTILITY
    ['!bounty add <player> <amount>', function (pl, args, data) {
        var plo = new Player(pl.getName()).init(data);
        var tplo = new Player(args.player).init(data);
        var ba = getCoinAmount(args.amount);
        var w = pl.world;
        var sb = w.getScoreboard();
        var sbo = sb.getObjective("bounty");
        if (sbo != null) {
            if (plo.data.money >= ba) {
                plo.data.money -= ba;
                var btax = Math.ceil(ba / 100 * 5);
                var nb = ba - btax;
                if (sbo.hasScore(args.player)) {
                    sbo.getScore(args.player).setValue(sbo.getScore(args.player).getValue() + ba);
                } else {
                    sbo.createScore(args.player).setValue(ba);
                }
                plo.save(data);
                tellPlayer(pl, "&r:money:&e" + getAmountCoin(btax) + "&a has been taken as bounty tax!")
                if (tplo.name != plo.name) {
                    executeCommand(pl, "/tellraw @a " + parseEmotes(strf(plo.getNameTag(sb) + "&a has put a bounty of &r:money:&e" + getAmountCoin(nb) + "&a on &r" + tplo.getNameTag(sb) + "&a!")));
                } else {
                    executeCommand(pl, "/tellraw @a " + parseEmotes(strf(plo.getNameTag(sb) + "&a is so stupid, he gave himself a bounty of &r:money:&e" + getAmountCoin(nb) + "&a!")));
                }

            } else {
                tellPlayer(pl, "&cYou don't have enough money in your pouch to add the bounty!&r [&2Money Pouch{run_command:!myMoney}&r]");
            }
        } else {
            tellPlayer(pl, "&cScoreboard objective 'bounty' does not exists!");
        }

    }, 'bounty.add', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true,
    },
    {
        "argname": "amount",
        "type": "currency",
        "min": getCoinAmount("5K"),
    },
        ]],
    ['!topBounty', function (pl, args, data) {
        var sb = pl.world.getScoreboard();
        var bo = sb.getObjective("bounty");
        var scores = [];
        if (bo != null) {
            var bos = bo.getScores();
            for (var b in bos) {
                var bscore = bos[b];
                scores.push({
                    name: bscore.getPlayerName(),
                    value: bscore.getValue(),
                });
            }
        }
        scores = scores.sort(function (a, b) {
            return b.value - a.value;
        });
        tellPlayer(pl, getTitleBar("Top Bounties"))
        for (var s in scores) {
            var score = scores[s];
            var spl = new Player(score.name);
            spl.load(data);
            var pnum = parseInt(s) + 1;
            tellPlayer(pl, " - " + pnum + ". " + spl.getNameTag(sb) + "&r :money:&e" + getAmountCoin(score.value));
        }
    }, 'topBounty', []],
    ['!money pay <player> <amount> [...args]', function (pl, args, data) {
        if (pl.getName() == args.player) {
            tellPlayer(pl, '&cYou can\'t pay to yourself.');
            return false;
        }
        var params = getArgParams(args.args);

        var amount = getCoinAmount(args.amount);
        var showAmount = '&r:money:&e' + getAmountCoin(amount);

        if (params.accept) {
            var p = new Player(pl.getName()).init(data);
            var otherp = new Player(args.player).init(data);


            if (p.data.money < amount) {
                tellPlayer(pl, '&cYou don\'t have ' + showAmount + '&c to pay.');
                return false;
            }

            p.data.money -= amount;
            otherp.data.money += amount;

            p.save(data);
            otherp.save(data);

            tellPlayer(pl, '&aPaid ' + showAmount + '&a to ' + args.player);
            tellTarget(pl, args.player, '&a' + pl.getName() + ' has paid you ' + showAmount);
            return true;
        } else {
            var command = '!money pay ' + args.player + ' ' + args.amount + ' -accept';
            var output = getTitleBar('Payment to ' + args.player, false) + '\n' +
                '&6You want to pay ' + showAmount + '&6 to ' + args.player + '\n' +
                '&6Are you sure?\n' +
                '&a[:check_mark: Accept]{run_command:' + command + '|show_text:$aClick to pay or do:\n$a$o' + command + '}';

            tellPlayer(pl, output);
        }
    }, 'money.pay', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    },
    {
        "argname": "amount",
        "type": "money",
        "min": 1
    }
        ]],
    ['!money request <player> <amount> [...reason]', function (pl, args, data) {
        if (!playerIsOnline(pl.world, args.player)) {
            tellPlayer(pl, '&c' + args.player + ' is not online!');
            return false;
        }

        var output = getTitleBar('Pay Request', false) + '\n' +
            '&a' + pl.getName() + ' has requested you to pay them &r:money:&e' + args.amount + '\n&6For: &e' + args.reason.join(" ") + '\n' +
            '&a[:check_mark: Accept]{run_command:!money pay ' + pl.getName() + ' ' + args.amount + '|show_text:$aClick to pay}&r\n&cIgnore to deny';

        tellTarget(pl, args.player, output);
    }, 'money.request', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    },
    {
        "argname": "amount",
        "type": "money",
        "min": 1
    }
        ]],
    ['!menu', function (pl, args, data) {
        var output = getTitleBar('Menu') + '\n' +
            '&6[My Money]{run_command:!myMoney|show_text:$eClick to show your money}&r &e|| ' +
            '&6[My Banks]{run_command:!myBanks|show_text:$eClick to show your banks}&r &e|| ' +
            '&6[My Emotes]{run_command:!myEmotes|show_text:$eClick to show your emotes}&r\n' +
            '&6[My Colors]{run_command:!myColors|show_text:$eClick to show your chatcolors}&r &e|| ' +
            '&6[My Regions]{run_command:!myRegions|show_text:$eClick to show your regions}&r &e|| ' +
            '&6[My Income]{run_command:!myIncome|show_text:$eClick to show your income}&r\n' +
            '&6[My Loan]{run_command:!myLoan|show_text:$eClick to show your loan if you have one}&r &e|| ' +
            '&6[My PlayerLoans]{run_command:!myRegions|show_text:$eClick to show your loans to other players}&r &e|| ' +
            '&6[My Income]{run_command:!myIncome|show_text:$eClick to show your income}&r\n' +
            '&6[My Unlocks]{run_command:!myUnlocks|show_text:$eClick to show your unlockables}&r &e|| ' +
            '&6[My Badges]{run_command:!myBadges|show_text:$eClick to show your badges}&r &e|| ';
        tellPlayer(pl, output);
    }, 'menu'],
    ['!withdraw <amount> [times] [currency]', function (pl, args, data) {
        // Onboarding log: record last run time for withdraw
        cst_onboarding_log_command(pl, 'withdraw');
        var p = new Player(pl.getName()).init(data);
        var w = pl.world;
        var times = parseInt(args.times || 1);
        var currency = getCurrency(args.currency || 'money');
        if (!currency) {
            tellPlayer(pl, '&cNot a valid currency.');
            return false;
        }

        if (!currency.items) {
            tellPlayer(pl, '&cThis currency cannot be withdrawed.');
            return false;
        }

        var wamount = getCoinAmount(args.amount);
        if (p.data.money >= wamount * times) {
            for (var i = 0; i < times; i++) {
                var moneyItems = generateMoney(w, wamount, currency.name);
                p.data[currency.name] -= wamount;
                givePlayerItems(pl, moneyItems);
            }
            p.save(data);
            tellPlayer(pl, "&aWithdrawed " + formatCurrency(wamount * times, currency.name) + "&r&a " + currency.displayName + " from money pouch!");
            return true;
        } else {
            tellPlayer(pl, "&cYou dont have that much money in your pouch!");
        }
        return false;
    }, 'withdraw', [{
        "argname": "amount",
        "type": "currency",
        "min": 1,
    },
    {
        "argname": "times",
        "type": "number",
        "min": 1,
        "max": 128
    }
        ]],
    ['!deposit', function (pl, args, data) {
        // Onboarding log: record last run time for deposit
        cst_onboarding_log_command(pl, 'deposit');
        var p = new Player(pl.getName()).init(data);
        var w = pl.world;
        var mItem = pl.getMainhandItem();
        if (isItemMoney(mItem, w)) {
            var mval = getCoinAmount(mItem.getLore()[0] || "0C") * mItem.getStackSize();
            pl.setMainhandItem(null);
            p.data.money += mval;
            tellPlayer(pl, "&aAdded &r:money:&e" + getAmountCoin(mval) + "&a to money pouch.&r [&2:money: Money Pouch{run_command:!myMoney|show_text:Click here or do $o!myMoney}&r]");
            p.save(data);
        } else {
            tellPlayer(pl, "&cYou don't have valid money in your hand!");
        }
        return false;
    }, 'deposit'],
    ['!depositAll [currency]', function (pl, args, data) {
        cst_onboarding_log_command(pl, 'depositAll');
        var p = new Player(pl.getName()).init(data);
        var w = pl.world;
        var pnbt = pl.getEntityNbt();
        var currency = getCurrency(args.currency || 'money');
        if (!currency) {
            tellPlayer(pl, '&cCurrency doesn\'t exists.');
            return false;
        }

        if (!currency.items) {
            return false;
        }

        var mItems = getPlayerInvFromNbt(pnbt, w, function (item, itnbt, w) {
            return isItemMoney(item, w, currency.name);
        });
        var addAmount = 0;
        for (var i in mItems) {
            var mItem = mItems[i];
            var mVal = getItemMoney(mItem, w) * mItem.getStackSize();

            addAmount += mVal;
            pl.removeItem(mItem, mItem.getStackSize());
        }
        if (addAmount > 0) {
            tellPlayer(pl, "&aAdded &r:money:&e" + getAmountCoin(addAmount) + "&a to money pouch!&r [&9View{run_command:!myMoney}&r]");
            p.data.money += addAmount;
            p.save(data);
        } else {
            tellPlayer(pl, "&cYou don't have money in your inventory!");
        }



    }, 'deposit', []],
    ['!myMoney', function (pl, args, data) {
        cst_onboarding_log_command(pl, 'myMoney');
        var pnbt = pl.getEntityNbt();
        var p = new Player(pl.getName()).init(data);
        var mp = p.data.money;
        var mi = getMoneyItemCount(pnbt, pl.world);
        var total = mp + mi;
        tellPlayer(pl, getTitleBar('Money Pouch'));
        tellPlayer(pl, getNavBar(pl));
        tellPlayer(pl, ":danger: &4&oYou will lose 50% of your money pouch on death.&r :danger:");
        /*for (var v in VIRTUAL_CURRENCIES) {
            var crncy = VIRTUAL_CURRENCIES[v];
            tellPlayer(pl, "&6" + crncy.displayName + ": &r" + crncy.prefix + getAmountCoin(p.data[crncy.name]) + crncy.suffix + (crncy.name == 'credit' ? '&r &a[Buy More]{open_url:https://www.paypal.me/TheOddlySeagull|show_text:$aClick or contact TheOddlySeagull on Discord. 1€ = 1G}&r' : ''));
        }*/

        var advanced_pouch = ''
        var advanced_inventory = ''
        
        if (checkOnboardingAdvancement(pl, '2', 's3b_completed')) {
            advanced_inventory = "&r [&aDeposit{run_command:!depositAll|show_text:$6Click to deposit all money from inventory.}&r]";
        }

        if (checkOnboardingAdvancement(pl, '2', 's4_withdraw_completed')) {
            advanced_pouch = "&r [&aWithdraw{suggest_command:!withdraw }&r] [&aWithdraw All{run_command:!withdraw " + getAmountCoin(mp) + "}&r]";
        }

        tellPlayer(pl, "&6Arcade Tokens: &d:money:A"+getAmountCoin(p.data.armoney));
        tellPlayer(pl, "&6Vote Tokens: &b:money:V"+getAmountCoin(p.data.vmoney));
        tellPlayer(pl, "&6Shop Tokens: &2:money:S"+getAmountCoin(p.data.credit));
        tellPlayer(pl, "&6Money Pouch: &r:money:&e" + getAmountCoin(mp) + advanced_pouch);
        tellPlayer(pl, "&6Inventory: &r:money:&e" + getAmountCoin(mi) + advanced_inventory);
        tellPlayer(pl, "&cYou carry a total of &r:money:&e" + getAmountCoin(total));
        tellPlayer(pl, "&9You will lose &r:money:&e" + getAmountCoin(mi + Math.round(mp / 2)) + "&9 on death!");
        return true;
    }, 'myMoney'],
    ['!myIncome', function (pl, args, data) {
        var p = new Player(pl.getName());
        p.load(data);
        tellPlayer(pl, getTitleBar("Income"));
        tellPlayer(pl, "&eBasic income: &6&o" + getAmountCoin(p.data.pay) + "&r&e per &6&o" + getTimeString(p.data.payTime));
        var tleft = (p.data.lastPayed + p.data.payTime) - new Date().getTime();
        tellPlayer(pl, "&6&o" + getTimeString(tleft, ['ms']) + "&r&e until next pay.");
        var pjobs = p.getJobs(data);

        if (pjobs.length > 0) {
            for (var pj in pjobs) {
                var pjob = pjobs[pj];
                tellPlayer(pl, "&eJob income for &r" + pjob.getDisplayName(data));
                tellPlayer(pl, "&e - Job salary: &6&o" + getAmountCoin(pjob.data.pay));
                var jleft = (p.getJob(pjob.name).lastPayed + pjob.data.payTime) - new Date().getTime();
                tellPlayer(pl, "&e - &6&o" + getTimeString(jleft, ['ms']) + "&r&e until next pay for &r" + pjob.getDisplayName(data));
            }
        }


        //print(p.toJson());
        return true;

    }, 'myIncome'],
    ['!myStats [...matches]', function (pl, args, data) {
        var pskills = getSkills(pl);
        var maxLvl = 32;
        tellPlayer(pl, getTitleBar("Stats"));
        var lmatches = arrayTransform(args.matches, function (arr_el) { return arr_el.toLowerCase(); });
        for (var p in pskills) {
            var pskill = pskills[p];
            if (arrayOccurs(pskill.name.toLowerCase(), lmatches) || args.matches.length == 0) {
                var proc = Math.round(pskill.xp / pskill.maxXp * 100);
                skillBar = progressBar(pskill.xp, pskill.maxXp, 10);
                var nxtLvl = pskill.level + 1;
                tellPlayer(pl, "&3&l" + pskill.name + " " + (pskill.level < maxLvl ? ("&e&l" + pskill.level + " " + skillBar + " &e&l" + nxtLvl + "&r" + " " + proc + "%&e - " + pskill.xp + "/" + pskill.maxXp) : "&r&a&lMAX LEVEL&r"));
            }
        }

        return true;
    }, 'myStats'],
    ['!myColors', function (pl, args, data) {
        var plo = new Player(pl.getName()).init(data);
        var output = getTitleBar('Chat Colors') + '\n';

        var helpText = '&r\u2B1C = &cLOCKED\n' +
            '&r:box: = &aUNLOCKED\n\n' +
            '&e&oYou can use unlocked colors in chat with their respective code\n' +
            'Or you can click on an unlocked one to set it as default color';

        output += '&5[Help]{*|show_text:' + helpText.replace(/&/g, '\u00A7') + '}&r &a[Reset chatcolor]{run_command:!myColor reset|show_text:$aClick to reset your default chat color to white}&r\n';
        var i = 1;
        for (var r in _RAWCOLORS) {
            var rcol = _RAWCOLORS[r];
            var colchar = (!plo.hasColor(rcol) ? "\u2B1C" : ":box:");
            var unlock = new Unlockable('chatcolor_' + rcol).init(data);
            var sellTxt = '';
            if (plo.hasColor(rcol)) {
                sellTxt += '&a&lUNLOCKED\n&a&oClick to set as default color\nAnd you can use it via color code in chat';
            } else {
                sellTxt += '&c&lLOCKED';
                if (unlock.data.forSale) {
                    sellTxt += '\n&cClick to buy for ' + unlock.formatPrice();
                }
            }
            var colText = '&6&lColor: &r&' + r + rcol + '&r\n' +
                '&6&lCode: &e' + r + '\n\n' +
                sellTxt;
            var colCmd = plo.hasColor(rcol) ? '!myColor use ' + rcol : '!unlock buy chatcolor_' + rcol;
            output += "[&" + r + colchar + colchar + colchar + "{run_command:" + colCmd + "|show_text:" + ccs(colText) + "}&r]" + (i % 3 == 0 ? '\n' : '');
            i++;
        }

        tellPlayer(pl, output);
    }, 'myColors'],
    ['!myColor use <color>', function (pl, args, data) {
        var plo = new Player(pl.getName()).init(data);
        var output = '';
        if (plo.hasColor(args.color) == -1) {
            tellPlayer(pl, '&cYou don\'t have this color unlocked');
            return false;
        }

        plo.data.chatcolor = args.color.toLowerCase();
        plo.save(data);

        output += '&aSet chat color to ' + args.color;

        tellPlayer(pl, output);
    }, 'myColor.use', [{
        "argname": "color",
        "type": "color"
    }]],
    ['!myColor reset', function (pl, args, data) {
        var plo = new Player(pl.getName()).init(data);
        var output = '';

        plo.data.chatcolor = null;
        plo.save(data);

        output += '&aReset your chat color!';

        tellPlayer(pl, output);
    }, 'myColor.reset'],
    ['!myEmotes [...matches]', function (pl, args, data) {
        var params = getArgParams(args.matches);
        var plo = new Player(pl.getName()).init(data);
        var sb = pl.world.getScoreboard();
        var showStr = "";
        var showEmotes = [];
        var unlocked = [];
        var showWidth = 10;

        var output = '';

        for (var c in CHAT_EMOTES) {
            var ce = CHAT_EMOTES[c];
            if (args.matches.length == 0 || arrayOccurs(c, args.matches, false, false) > 0) {
                var ec = new Emote(c).init(data, false);
                showEmotes.push(ec);
                if (plo.hasEmote(ec.name, sb, data)) {
                    unlocked.push(ec);
                }
            }
        }

        output += getTitleBar('Emotes') + '\n';
        output += "&6" + unlocked.length + "/" + showEmotes.length + " Unlocked." + '\n';
        output += "&eHover emoji for info." + '\n';
        output += "[&9&l? Help{*|show_text:" +
            "$e$o$lI see chinese symbols!$r\n" +
            "You dont have the resourcepack installed, contact server admins!\n" +
            "$e$o$lHow do I unlock emotes?$r\n" +
            "Some are unlocked by default, some can be bought, some are permitted to certain teams and some require a specific task." +
            "}&r]\n";

        output += genDataPageList(
            showEmotes,
            args.matches,
            parseInt(params.show || 60),
            parseInt(params.page || 1),
            "!myEmotes {MATCHES} -show:{SHOW} -page:{PAGE} -sort:{SORT}",
            function (emote, i) {
                var plHas = plo.hasEmote(emote.name, sb, data);
                var plHasPerm = emote.getPermission().init(data, false).permits(plo.name, sb, data);

                if (emote.data.hidden && !plHas && !plHasPerm) {
                    return false;
                }

                var infoStr = ':' + emote.name + ': &r' + emote.name + '\n' +
                    '&r' + (emote.data.desc ? emote.data.desc + '\n' : '') + '&r';
                var lockedStr = '';
                if (emote.data.default) {
                    lockedStr = '\n&6&lDEFAULT EMOTE';
                } else if (plHasPerm) {
                    lockedStr = '\n&d&lUNLOCKED WITH PERM';
                } else if (plHas) {
                    lockedStr = '\n&a&lUNLOCKED';
                } else {
                    lockedStr = '\n&c&lLOCKED';
                }

                var sellStr = '';
                if (!plHas) {
                    sellStr = emote.data.forSale ? '\n&cClick to buy for ' + emote.showPrice() : '\n&cThis emote is not for sale.';
                }

                var cmdStr = (emote.data.forSale && !plHas ? 'run_command:!emote buy ' + emote.name : '*');

                var newLine = ((i + 1) % showWidth == 0 && i > 0 ? '\n' : '');

                return (plHas ? '&r' : '&8') + '[:' + emote.name + ':]{' + cmdStr + '|show_text:' + ccs(infoStr + lockedStr + sellStr) + '}' + newLine;
            },
            false,
            function (emote, list) {
                return arrayOccurs(emote.name, list, false, false) > 0
            },
            (params.sort || "").toLowerCase() == "desc",
            '', {
            showLenOptions: [
                20,
                40,
                60
            ]
        }
        );


        tellPlayer(pl, output);

    }, 'myEmotes'],
    ['!setHome <name>', function (pl, args) {
        var plo = new Player(pl.getName());
        var data = pl.world.getStoreddata();
        var ppos = pl.getPos();
        plo.load(data);

        if (plo.data.maxHomes == -1 || Object.keys(plo.data.homes).length < plo.data.maxHomes) {
            plo.addHome(args.name, ppos.getX(), ppos.getY(), ppos.getZ());
            //check if the player owns the region where the home is set
            var r = getRegionAtPos(pl.getPos(), pl.world);
            if (r != null && (r.isTrusted(pl.getName()) || r.isOwner(pl.getName()))) {
                tellPlayer(pl, "&aAdded home '" + args.name + "'!");
                plo.save(data);
                return true;
            } else {
                tellPlayer(pl, "&cYou can't set a home in a region you don't own or are not trusted in!&r [&9Your Regions{run_command:!myregions}&r]");
                return false;
            }

        } else {
            tellPlayer(pl, "&cYou have reached maximum amount of homes! (" + plo.data.maxHomes + ")");
        }

        return false;
    }, 'setHome'],
    ['!delHome <name>', function (pl, args) {
        var plo = new Player(pl.getName());
        var data = pl.world.getStoreddata();
        var ppos = pl.getPos();
        plo.load(data);
        if (plo.hasHome(args.name)) { //remove home
            plo.delHome(args.name);
            tellPlayer(pl, "&aRemoved home '" + args.name + "'!");
            plo.save(data);
            return true;
        } else { //Add new home
            tellPlayer(pl, "&cHome '" + args.name + "' does not exist!");
        }
        return false;
    }, 'delHome'],
    ['!myHomes', function (pl, args) {
        var plo = new Player(pl.getName());
        var data = pl.world.getStoreddata();
        plo.load(data);
        // Newcomer grace period check (first 30 days since first login)
        var nowMs_mh = new Date().getTime();
        var firstLogin_mh = (plo.data && typeof plo.data.firstLogin === 'number') ? plo.data.firstLogin : nowMs_mh;
        var graceMs_mh = 30 * 24 * 60 * 60 * 1000; // 30 days
        var inGrace_mh = (nowMs_mh - firstLogin_mh) < graceMs_mh;
        if (Object.keys(plo.data.homes).length > 0) {
            tellPlayer(pl, getTitleBar("Homes"));
            var maxHomeStr = " - &e" + Object.keys(plo.data.homes).length + "/" + (plo.data.maxHomes == -1 ? "&aInfinite" : plo.data.maxHomes) + "&e Homes used";
            tellPlayer(pl, "[&a:check_mark: Add{suggest_command:!setHome }&r]" + maxHomeStr);
            for (var i in plo.data.homes) {
                var home = plo.data.homes[i];
                // get home teleportation price
                var dist = Math.sqrt(Math.pow(home.x - pl.getX(), 2) + Math.pow(home.y - pl.getY(), 2) + Math.pow(home.z - pl.getZ(), 2));
                var cost = Math.ceil(dist * 10);
                var costText = inGrace_mh ? 'Free (newcomer)' : getAmountCoin(cost);

                tellPlayer(pl, "&e - &9&o" + i + "&r&r [&bTeleport{run_command:!home " + i + "|show_text:Click to take taxi\n$eCost:$r " + costText + "\n$eX:$c" + home.x + " $eY:$c" + home.y + " $eZ:$c" + home.z + " }&r] [&c:cross_mark: Remove{run_command:!delHome " + i + "|show_text:Click to remove home.}&r]");
            }
            return true;
        } else {
            tellPlayer(pl, "&cYou don't have any homes!");
        }

        return false;
    }, 'myHomes'],
    ['!defaultHome <name>', function (pl, args, data) {
        var plo = new Player(pl.getName()).init(data);
        if (Object.keys(plo.data.homes).indexOf(args.name) > -1) {
            plo.data.defaultHome = args.name;
            plo.save(data);
            tellPlayer(pl, "&aSet default home to '" + args.name + "'");
            return true;
        } else {
            tellPlayer(pl, "&cYou don't have this home!");
        }
        return false;
    }, 'defaultHome'],
    ['!home [name]', function (pl, args) {
        var plo = new Player(pl.getName());
        var data = pl.world.getStoreddata();
        var ppos = pl.getPos();
        plo.load(data);
        var hname = args.name || plo.data.defaultHome;
        if (hname != null) {
            if (plo.hasHome(hname)) {
                var h = plo.data.homes[hname];

                plo.registerBackPos(pl.pos).save(data);

                // check how much money the player has
                var cost = 0;

                // calculate the cost by seeing how far the player is from the home
                var dist = Math.sqrt(Math.pow(h.x - pl.getX(), 2) + Math.pow(h.y - pl.getY(), 2) + Math.pow(h.z - pl.getZ(), 2));
                cost = Math.ceil(dist * 10);

                // Newcomer grace: free home teleports for first 30 days since first login
                var nowMs = new Date().getTime();
                var firstLogin = (plo.data && typeof plo.data.firstLogin === 'number') ? plo.data.firstLogin : nowMs;
                var graceMs = 30 * 24 * 60 * 60 * 1000; // 30 days
                var inGrace = (nowMs - firstLogin) < graceMs;

                if (!inGrace) {
                    if (plo.data.money < cost) {
                        tellPlayer(pl, '&cYou don\'t have enough money (' + getAmountCoin(cost) + ') to take the taxi to destination ' + hname + '!');
                        return false;
                    } else {
                        plo.data.money -= cost;
                        plo.save(data);
                        tellPlayer(pl, '&aTaking the taxi to destination &r' + hname + '&a! cost: &e' + getAmountCoin(cost));
                    }
                } else {
                    // Free teleport within newcomer grace period
                    tellPlayer(pl, '&aTaking the taxi to destination &r' + hname + '&a! cost: &eFree (newcomer)');
                }

                pl.setPosition(h.x, h.y, h.z);
                return true;
            } else {
                tellPlayer(pl, "&cHome '" + args.name + "' does not exist!");
            }
        } else {
            tellPlayer(pl, "&cYou don't have any default home set!");
        }
        return false;
    }, 'home'],
    ['!back', function (pl, args, data) {
        var p = new Player(pl.getName()).init(data);

        if (p.data.backPos == null) {
            tellPlayer(pl, '&cThere is no position registered to get back to.');
            return false;
        }
        var x = p.data.backPos.x;
        var y = p.data.backPos.y;
        var z = p.data.backPos.z;
        pl.setPosition(x, y, z);

        p.set('backPos', null).save(data);
    }, 'back'],
    ['!heal', function (pl, args) {
        pl.setHealth(parseFloat(pl.getMaxHealth()));
        pl.setHunger(20);
        // pl.getMCEntity().func_71024_bL().func_75119_b(20);
        tellPlayer(pl, "&aYou have been healed!");
    }, 'heal'],
    ['!claim', function (pl, args, data) {
        tellPlayer(pl, '&aChecking if there are unclaimed rewards for you...');
        var p = new Player(pl.getName()).init(data);
        var sb = pl.world.scoreboard;

        var _claimed = 0;

        for (var v in VIRTUAL_CURRENCIES) {
            var currency = VIRTUAL_CURRENCIES[v];
            var objKey = '_cst_' + currency.name;
            if (!sb.hasObjective(objKey)) {
                continue;
            }
            var claimAmount = sb.getPlayerScore(pl.getName(), objKey, '');

            if (claimAmount > 0) {
                tellPlayer(pl, '&aYou got ' + formatCurrency(claimAmount, currency.name) + '&a ' + currency.displayName.toLowerCase());
                p.data[currency.name] += claimAmount;
                sb.setPlayerScore(pl.getName(), objKey, 0, '');
                _claimed++;
            }
        }

        p.save(data);

        if (_claimed == 0) {
            tellPlayer(pl, '&cSorry, there are no rewards waiting for you.');
        } else {
            tellTarget(pl, '@a', '&c' + pl.getName() + ' &ahas claimed some rewards by voting! &e/vote');
        }

    }, 'claim'],
    ['!player unlock <player> <unlock> [unlocked]', function (pl, args, data) {
        var p = new Player(args.player).init(data);
        var unlocked = (args.unlocked == null ? true : (args.unlocked == 'true'));

        if (unlocked) {
            p.data.unlocks[args.unlock] = true;
        } else {
            delete p.data.unlocks[args.unlock];
        }

        p.save(data);

        tellPlayer(pl, (unlocked ? '&aAdded' : '&aRemoved') + ' unlock \'' + args.unlock + '\' from ' + args.player);
    }, 'player.unlock', [{
        "argname": "player",
        "type": "datahandler",
        "datatype": "player",
        "exists": true
    }]],

]);


//REGISTER REGION COMMANDS
registerXCommands([
    //['', function(pl, args){}, '', []],
    ['!region create <name>', function (pl, args, data) {
        var region = new Region(args.name);
        region.save(data);
        tellPlayer(pl, "&aAdded region '" + args.name + "'!");
        return true;
    }, 'region.create', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": false
    }]],
    ['!region info [name] [...matches]', function (pl, args, data) {
        var allArgs = args.matches.concat([]);
        allArgs.push(args.name || '');
        var params = getArgParams(allArgs);

        var output = '';

        if (args.name != null) {
            var showpage = params.showpage || 'info';
            var region = new Region(args.name).init(data);
            output += getTitleBar('Region Info') + '\n';

            if (showpage != 'info') {
                output += '&e&l[<<< Back to info]{run_command:!region info ' + region.name + '}&r\n';
            }

            output += '&6&lRegion ID: &b&l' + region.name + '&r (&2:recycle: Refresh{run_command:!region info ' + region.name + '}&r)\n';

            switch (showpage) {
                case 'info':
                    var regperm = region.getPermission().init(data);
                    output += '&6&lPermission ID: &9&l' + regperm.name + '&r (&6:sun: Perm Info{run_command:!perms info ' + regperm.name + '}&r)\n';
                    // var rpermname = region.getPermission().name;
                    //tellPlayer(pl, '&6&lRegion Permission: &b&l'+rpermname+'&r '+(region.getPermission().exists(data) ? '(&6:sun: Info{run_command:!perms info '+rpermname+'}&r)'));
                    output += '&6&lOwner: &r&o' + (region.data.owner == null ? CONFIG_SERVER.TITLE : region.data.owner + '&r (&c:cross_mark: Kick{run_command:!region setOwner ' + region.name + '|show_text:Kick ' + region.data.owner + ' from ' + region.name + '}&r)') + '&r (&a+ Set{suggest_command:!region setOwner ' + region.name + ' |show_text:Set new owner for ' + region.name + '}&r)\n';

                    output += '&6&lPriority: &e' + region.data.priority + '&r [&6&lEDIT{suggest_command:!region setPrio ' + region.name + ' }&r]\n';
                    var openVals = [
                        'Interact',
                        'Build',
                    ];
                    output += '&6&lSale Info: &b[Sale Settings]{run_command:!region info ' + region.name + ' -showpage:sale|show_text:$cClick to view region\'s sale settings.}&r\n';
                    for (var i in openVals) {
                        var opv = openVals[i];
                        var rov = region.data['all' + opv];
                        output +=
                            '&6&lOpen ' + opv + ': &b' + (rov ? '&a:check_mark: Yes' : '&c:cross_mark: No') +
                            '&r [&' + (rov ? 'cDisable' : 'aEnable') +
                            '{run_command:!region setOpen ' + region.name + ' ' + opv.toLowerCase() + ' ' + (!rov).toString() + '}&r]\n';
                    }
                    output += '&6&lPosition List: &b[Show List]{run_command:!region info ' + region.name + ' -showpage:pos|show_text:$bClick to see region\'s position list.}&r\n';
                    break;
                case 'pos':

                    if (region.data.positions.length > 0) {
                        //Cache positions for undo
                        output += '&6&lPosition List:&r (&cClear{run_command:!region removePos ' + region.name + ' ' + Object.keys(region.data.positions).join(' ') + '}&r)\n';
                        for (var ri in region.data.positions) {
                            var regpos = region.data.positions[ri];
                            output += '&5&l - #' + ri + '&r &d[Info]{run_command:!region info ' + region.name + ' -showpage:posinfo -posNum:' + ri.toString() + '}&r &c[:cross_mark: Remove]{run_command:!region removePos ' + region.name + ' ' + ri + '}&r\n';
                        }
                    } else {
                        output += '&eRegion has no positions! (This region still can be used for group-rules, like regions with positions set)\n';
                    }

                    break;
                case 'posinfo':
                    var posNum = params.posNum || null;
                    if (posNum == null) {
                        output += '&cNo valid position number given\n';
                    } else {
                        var regionPos = region.data.positions[parseInt(posNum)] || null;
                        if (regionPos == null) {
                            output += '&cNo valid position number given\n';
                        } else {
                            output += '&6&lNum: &5&l#' + posNum + '\n' +
                                '&6 - XYZ1: &b' + (regionPos.xyz1 || []).join(', ') + '&r ' + (regionPos.xyz1 ? '&c[Teleport]{run_command:/tp ' + pl.getName() + ' ' + regionPos.xyz1.join(' ') + '}&r' : '') + '\n' +
                                '&6 - XYZ2: &b' + (regionPos.xyz2 || []).join(', ') + '&r ' + (regionPos.xyz2 ? '&c[Teleport]{run_command:/tp ' + pl.getName() + ' ' + regionPos.xyz2.join(' ') + '}&r' : '') + '\n' +
                                '&6 - Type: &e&o' + (regionPos.type || 'none') + ' &a[Set]{suggest_command:!region editPosType ' + region.name + ' ' + posNum + ' |show_text:$aSet the type of region position.}&r\n';
                        }
                    }
                    break;
                case 'sale':
                    var otherSaleType = (region.data.saleType == 'buy' ? 'rent' : 'buy');
                    output += '&6&lSale Type: &e' + region.data.saleType + ' &a[Switch to ' + otherSaleType + ']{run_command:!region setSaleType ' + region.name + ' ' + otherSaleType + '}&r\n';

                    output += '&6&lFor Sale: &r' +
                        (
                            region.data.forSale ?
                                '&a[:check_mark: Yes] &c[Disable]{run_command:!region setForSale ' + region.name + ' false|show_text:$cClick to disable region for sale.}&r' :
                                '&c[:cross_mark: No] &a[Enable]{run_command:!region setForSale ' + region.name + ' true|show_text:$aClick to enable region for sale.}&r'
                        ) + '\n';

                    if (region.data.saleType == 'buy') {
                        output += '&6&lSale Price: &r:money:&e' + getAmountCoin(region.data.salePrice) + '&r &a[Change]{suggest_command:!region setPrice ' + region.name + ' |show_text:$aClick to set region\'s buy price.}&r\n';
                    } else if (region.data.saleType == 'rent') {
                        var rentHelp = '&dWith the current settings,\n' +
                            'the player has to pay &r:money:&e' + getAmountCoin(region.data.salePrice) + '&d to add &o' + getTimeString(region.data.rentTime) + '&r&d to their rent time';

                        output += '&d[Current Settings Info]{*|show_text:' + rentHelp.replaceAll('&', '$') + '}&r\n';
                        var timeLeft = region.getRentTimeLeft();
                        if (region.data.owner) {
                            output += '&6&lRent time left: &e' + (timeLeft > 0 ? getTimeString(timeLeft, ['ms']) : '&c' + getTimeString(Math.abs(timeLeft), ['ms']) + ' too late.') + '\n';
                        }

                        output += '&6&lRent Cost: &r:money:&e' + getAmountCoin(region.data.salePrice) + '&r &a[Change]{suggest_command:!region setPrice ' + region.name + ' |show_text:$aClick to set region\'s buy price.}&r\n' +
                            '&6&lRent Time Increase: &e' + getTimeString(region.data.rentTime) + '&r &a[Change]{suggest_command:!region setRentTime ' + region.name + '|show_text:$aClick to change rent time of region.}&r\n' +
                            '&6&lMax Rent Time: &d[?]{*|show_text:$dThe amount of time someone can pre-pay for the region, this prevent billionaires pre-paying 1000 years beforehand.\nSet to $o-1$r$d to have infinite pre-pay time.}&r &e' + region.getMaxRentTimeString() + '&r &a[Change]{suggest_command:!region setMaxRentTime ' + region.name + '|show_text:$aClick to chnage max rent time}&r\n';

                    }
                    break;
            }

            tellPlayer(pl, output);

            return true;
        } else {
            var regids = new Region().getAllDataIds(data);
            var ppos = [
                pl.getPos().getX(),
                pl.getPos().getY(),
                pl.getPos().getZ(),
            ];
            var showRegs = [];
            for (var r in regids) {
                var regid = regids[r];
                var reg = new Region(regid).init(data);
                if (reg.hasCoord(ppos)) {
                    showRegs.push(reg.name);
                }
            }
            if (showRegs.length > 0) {

                executeXCommand("!region list " + showRegs.join(" "), pl);
                return true;
            } else {
                tellPlayer(pl, "&cYou are not standing in any region!");
            }
        }
        return false;
    }, 'region.info', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true,
    }]],
    ['!region editPosType <name> <posNum> <type>', function (pl, args, data) {
        var region = new Region(args.name).init(data);
        var output = '';
        var posNum = parseInt(args.posNum);

        if (posNum > region.data.positions.length - 1) {
            tellPlayer(pl, '&cInvalid position number.');
            return false;
        }

        region.data.positions[posNum].type = args.type;
        region.save(data);

        output += '&aSet type of position #' + posNum + ' in region \'' + region.name + '\' to ' + args.type;

        tellPlayer(pl, output);
    }, 'region.editPosType', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true,
    },
    {
        "argname": "posNum",
        "type": "number",
        "min": 0,
    },
    {
        "argname": "type",
        "type": "enum",
        "values": Object.keys(CONFIG_SERVER.REGION_TYPES || {}).concat(['none'])
    }
        ]],
    ['!region setOpen <name> <action> <value>', function (pl, args, data) {
        var reg = new Region(args.name).init(data);
        var rdatakey = 'all' + args.action.toLowerCase().rangeUpper(0, 1);
        var newval = (args.value == "true");
        reg.data[rdatakey] = newval;
        tellPlayer(pl, "&a" + (newval ? "Enabled" : "Disabled") + " open " + args.action + " of region '" + args.name + "'");
        reg.save(data);
    }, 'region.setOpen', [{
        "argname": "name",
        "type": "datahandler",
        "exists": true,
    },
    {
        "argname": "action",
        "type": "enum",
        "values": ["interact", "build", "attack"],
    },
    {
        "argname": "value",
        "type": "bool",
    },
        ]],
    ['!region setPrio <name> <priority>', function (pl, args, data) {
        var reg = new Region(args.name);
        reg.load(data);
        reg.data.priority = parseInt(args.priority);
        reg.save(data);
        tellPlayer(pl, "&aChanged priority of " + args.name + " to " + args.priority + "!");
        return true;
    }, 'region.setPrio', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true,
    }]],
    ['!region setForSale <name> <forSale>', function (pl, args, data) {
        var region = new Region(args.name).init(data);
        var forSale = args.forSale.toString() == 'true';

        region.set('forSale', forSale)

        check_and_update_sign(region, pl);
        
        region.save(data);

        tellPlayer(pl, '&aSet region' + (forSale ? '' : ' not') + ' for sale.');
    }, 'region.setForSale', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    }, {
        "argname": "forSale",
        "type": "bool"
    }]],
    ['!region removePos <name> [...posNumbers]', function (pl, args, data) {
        var region = new Region(args.name).init(data);
        //Cache pos for undo
        var undocmds = [];
        var newPos = [];

        for (var i in region.data.positions) {
            var rpos = region.data.positions[i];
            if (args.posNumbers.indexOf(i.toString()) > -1) {
                if (rpos.xyz1 && rpos.xyz2) {
                    undocmds.push("!region setPos " + region.name + " " + i + " 1 " + rpos.xyz1[0] + " " + rpos.xyz1[1] + " " + rpos.xyz1[2]);
                    undocmds.push("!region setPos " + region.name + " " + i + " 2 " + rpos.xyz2[0] + " " + rpos.xyz2[1] + " " + rpos.xyz2[2]);
                }
            } else {
                newPos.push(rpos);
            }
        }
        region.data.positions = newPos;

        tellPlayer(pl, "&aRemoved positions '" + args.posNumbers.join(" ") + "' of region '" + region.name + "'! &5[Undo]{run_command:!chain " + undocmds.join(";") + "}&r");

        region.save(data);
        return true;
    }, 'region.removePos', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    }]],
    ['!region setPos <name> <posNum> <selectionNum> <x> <y> <z>', function (pl, args, data) { //Wont be used by players, but region wand commands
        var region = new Region(args.name).init(data);
        var posArgs = ['x', 'y', 'z'];
        for (var i in posArgs) {
            var pa = posArgs[i];
            args[pa] = args[pa].replace("~", pl.getPos()['get' + pa.toUpperCase()]());
        }
        var newPos = [
            args.x,
            args.y,
            args.z,
        ];
        var newPosNum = Math.min(parseInt(args.posNum), region.data.positions.length);
        if (!(newPosNum in region.data.positions)) {
            region.data.positions[newPosNum] = {
                xyz1: null,
                xyz2: null,
            };
        }
        region.data.positions[newPosNum]['xyz' + args.selectionNum] = newPos;
        tellPlayer(pl, "&aSet selection #" + args.selectionNum + " of position #" + args.posNum + " of region '" + region.name + "' to " + newPos.join(", ") + "!");
        region.save(data);
        return true;
    }, 'region.setPos', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true,
    },
    {
        "argname": "posNum",
        "min": 0,
    },
    {
        "argname": "selectioNum",
        "min": 1,
        "max": 2,
    },
        ]],
    ['!region setName <name> <newName>', function (pl, args, data) {
        var region = new Region(args.name).init(data);
        var permission = new Permission(region.getPermissionId()).init();
        region.rename(args.newName, data)
        permission.rename(region.getPermissionId(), data);

        tellPlayer(pl, "&aRenamed region '" + args.name + "' to '" + args.newName + "'!&r");
    }, 'region.setName', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    },
    {
        "argname": "newName",
        "type": "datahandler",
        "datatype": "region",
        "exists": false
    }
        ]],
    ['!region list [...matches]', function (pl, args, data) {
        var params = getArgParams(args.matches);
        var regions = new Region().getAllDataEntries(data);

        var output = getTitleBar('Region List') + '\n';
        output += genDataPageList(
            regions,
            args.matches,
            (params.show || 10),
            (params.page || 1),
            '!region list {MATCHES} -show:{SHOW} -page:{PAGE} -sort:{SORT}',
            function (region) {
                return '&e - &b' + region.name + ' &6[Info]{run_command:!region info ' + region.name + '|show_text:$aClick to show info.}&r\n';
            },
            function (a, b) {
                var al = a.name.toLowerCase();
                var bl = b.name.toLowerCase();

                if (al < bl) return -1;
                if (al > bl) return 1;

                return 0;
            },
            function (region, list) {
                return arrayOccurs(region.name, list, false, false);
            },
            (params.sort == 'desc')
        );

        tellPlayer(pl, output);

        return true;
    }, 'region.list'],
    ['!region remove <name>', function (pl, args, data) {
        var region = new Region(args.name);
        region.remove(data);
        tellPlayer(pl, "&aRemoved region '" + region.name + "'!");
        return true;
    }, 'region.remove', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    }]],
    ['!region setOwner <name> [player]', function (pl, args, data) {
        var region = new Region(args.name).init(data);
        region.data.owner = args.player;
        if (!region.data.owner) {
            region.data.trusted = [];
        }
        tellPlayer(pl, "&aSet region owner to: " + (region.data.owner == null ? CONFIG_SERVER.TITLE : region.data.owner));
        
        check_and_update_sign(region, pl);
        
        region.save(data);
        return true;
    }, 'region.setOwner', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    }]],
    ['!region select <name>', function (pl, args, data) {
        var rayt;
        try {
            rayt = pl.rayTraceBlock(16, false, true);

        } catch (exc) { }
        var region = new Region(args.name).init(data);
        if (rayt) {
            var rpos = [
                rayt.getPos().getX(),
                rayt.getPos().getY(),
                rayt.getPos().getZ(),
            ];
            region.addCoord(rpos).save(data);
            tellPlayer(pl, "&aAdded coords to region '" + region.name + "'! (" + rpos.join(", ") + ")");
            return true;
        }
        tellPlayer(pl, "&cYou are not looking at a block.");
        return false;
    }, 'region.setPos', [ //Needs setPos permission (to keep modifying position at one perm!)
            {
                "argname": "name",
                "type": "datahandler",
                "datatype": "region",
                "exists": true
            }
        ]],
    ['!region setPrice <name> <price>', function (pl, args, data) {
        var region = new Region(args.name).init(data);
        var amount = getCoinAmount(args.price);
        region.set('salePrice', amount).save(data);

        tellPlayer(pl, '&aSet sale price to &r:money:&e' + getAmountCoin(amount));
    }, 'region.setPrice', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    },
    {
        "argname": "price",
        "type": "currency",
        "min": 0
    }
        ]],
    ['!region setRentPrice <name> <price>', function (pl, args, data) {
        var region = new Region(args.name).init(data);
        var amount = getCoinAmount(args.price);
        region.set('rentPrice', amount).save(data);

        tellPlayer(pl, '&aSet rent price to &r:money:&e' + getAmountCoin(amount));
    }, 'region.setPrice', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    },
    {
        "argname": "price",
        "type": "currency",
        "min": 0
    }
        ]],
    ['!region setSaleType <name> <saleType>', function (pl, args, data) {
        var region = new Region(args.name).init(data);

        region.set('saleType', args.saleType)
        
        check_and_update_sign(region, pl);
        
        region.save(data);

        tellPlayer(pl, '&aSet sale type of region \'' + region.name + '\' to ' + args.saleType);
    }, 'region.setSaleType', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    },
    {
        "argname": "saleType",
        "type": "enum",
        "values": ["buy", "rent"]
    }
        ]],
    ['!region setRentTime <name> <time>', function (pl, args, data) {
        var region = new Region(args.name).init(data);

        region.set('rentTime', getStringTime(args.time)).save(data);

        tellPlayer(pl, '&aSet rent time of region \'' + region.name + '\' to ' + args.time);
    }, 'region.setRentTime', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    }, {
        "argname": "time",
        "type": "time",
        "min": getStringTime('1h')
    }]],
    ['!region setMaxRentTime <name> <time>', function (pl, args, data) {
        var region = new Region(args.name).init(data);

        region.set('maxRentTime', getStringTime(args.time)).save(data);

        tellPlayer(pl, '&aSet max rent time of region \'' + region.name + '\' to ' + args.time);
    }, 'region.setMaxRentTime', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    }, {
        "argname": "time",
        "type": "time",
        "min": -1
    }]],
    ['!region buy [name] [...matches]', function (pl, args, data) {
        if (args.name) { args.matches.push(args.name); }
        var params = getArgParams(args.matches);

        if (!args.name) {
            var regids = new Region().getAllDataIds(data);
            var ppos = [
                pl.getPos().getX(),
                pl.getPos().getY(),
                pl.getPos().getZ(),
            ];
            var showRegs = [];
            for (var r in regids) {
                var regid = regids[r];
                var reg = new Region(regid).init(data);
                if (reg.data.forSale && reg.data.saleType == 'buy') {
                    if (reg.hasCoord(ppos)) {
                        showRegs.push(reg);
                    }
                }
            }
            if (showRegs.length > 0) {
                var output = getTitleBar('Regions for Sale') + '\n';
                output += genDataPageList(
                    showRegs, [],
                    (params.show || 10),
                    (params.page || 1),
                    "!region rent -show:{SHOW} -page:{PAGE} -sort:{SORT}",
                    function (reg) {
                        var regBuyInfo = '&aBuy this region for &r:money:&e' + getAmountCoin(reg.data.salePrice);
                        return '&e - &b' + reg.name + ' &r:money:&e' + getAmountCoin(reg.data.salePrice) + ' &a[Buy]{run_command:!region buy ' + reg.name + '|show_text:' + regBuyInfo.replaceAll('&', '$') + '}&r\n';
                    },
                    function (a, b) {
                        var al = a.name.toLowerCase();
                        var bl = b.name.toLowerCase();

                        if (al < bl) return -1;
                        if (al > bl) return 1;

                        return 0;
                    },
                    function (reg, list) {
                        return arrayOccurs(reg.name, list, false, false) > 0;
                    },
                    (params.sort == 'desc')
                );

                tellPlayer(pl, output);
                return true;
            } else {
                tellPlayer(pl, "&cThere are no regions for sale here.");
            }
        } else {
            var region = new Region(args.name).init(data);

            if (!region.data.forSale || region.data.saleType != 'buy') {
                tellPlayer(pl, '&cThis region is not available to buy.');
                return false;
            }

            var p = new Player(pl.getName()).init(data);

            if (p.data.money < region.data.salePrice) {
                tellPlayer(pl, '&cYou don\'t have &r:money:&e' + getAmountCoin(region.data.salePrice) + ' &cto buy this region.');
                return false;
            }

            p.data.money -= region.data.salePrice;
            if (region.data.owner != null) {
                var oldOwner = new Player(region.data.owner).init(data);
                oldOwner.data.money += region.data.salePrice;
                oldOwner.save(data);

            }
            region.data.owner = pl.getName();

            region.data.forSale = false;
            region.data.trusted = [];
            region.data.rentTimeCredit = 0;

            check_and_update_sign(region, pl);


            p.save(data);
            region.save(data);

            tellPlayer(pl, '&aYou successfully bought this region. Do !myRegions to view your own regions or the ones you\'re added to.');
        }


    }, 'region.buy', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    }]],
    ['!region rent [name] [...matches]', function (pl, args, data) {
        if (args.name) { args.matches.push(args.name); }
        var params = getArgParams(args.matches);
        if (!args.name) {
            var regids = new Region().getAllDataIds(data);
            var ppos = [
                pl.getPos().getX(),
                pl.getPos().getY(),
                pl.getPos().getZ(),
            ];
            var showRegs = [];
            for (var r in regids) {
                var regid = regids[r];
                var reg = new Region(regid).init(data);
                if (((reg.data.forSale && !reg.data.owner) || reg.data.owner == pl.getName()) && reg.data.saleType == 'rent') {
                    if (reg.hasCoord(ppos)) {
                        showRegs.push(reg);
                    }
                }
            }
            if (showRegs.length > 0) {
                var output = getTitleBar('Rentable Regions') + '\n';
                output += genDataPageList(
                    showRegs, [],
                    (params.show || 10),
                    (params.page || 1),
                    "!region rent -show:{SHOW} -page:{PAGE} -sort:{SORT}",
                    function (reg) {
                        var regRentInfo = '&aRent this region for &c' + getTimeString(reg.data.rentTime) + '&r&a for &r:money:&e' + getAmountCoin(reg.data.rentPrice) + '&r\n' +
                            '&aYou can pre-pay up to &c' + reg.getMaxRentTimeString();
                        return '&e - &b' + reg.name + ' &a[Rent]{run_command:!region rent ' + reg.name + '|show_text:' + regRentInfo.replaceAll('&', '$') + '}&r\n';
                    },
                    function (a, b) {
                        var al = a.name.toLowerCase();
                        var bl = b.name.toLowerCase();

                        if (al < bl) return -1;
                        if (al > bl) return 1;

                        return 0;
                    },
                    function (reg, list) {
                        return arrayOccurs(reg.name, list, false, false) > 0;
                    },
                    (params.sort == 'desc')
                );

                tellPlayer(pl, output);
                return true;
            } else {
                tellPlayer(pl, "&cThere are no regions for hire here.");
            }
        } else {
            var region = new Region(args.name).init(data);

            if ((!region.data.forSale || region.data.saleType != 'rent') && pl.getName() != region.data.owner) {
                tellPlayer(pl, '&cThis region is not available to rent.');
                return false;
            }

            if (region.data.maxRentTime > -1 && region.data.owner && region.getRentTimeLeft() + region.data.rentTime > region.data.maxRentTime) {
                tellPlayer(pl, '&cYou hit the pre-pay limit.');
                return false;
            }

            var p = new Player(pl.getName()).init(data);

            if (p.data.money < region.data.rentPrice) {
                tellPlayer(pl, '&cYou need &r:money:&e' + getAmountCoin(region.data.rentPrice) + ' &cto pay the rent of this region.');
                return false;
            }

            p.data.money -= region.data.rentPrice;
            if (region.data.owner && region.data.owner != pl.getName()) {
                var regionOwner = new Player(region.data.owner).init(data);
                regionOwner.data.money += region.data.rentPrice;
                regionOwner.save(data);
            }
            if (region.data.owner == null) {
                region.data.owner = pl.getName();
                region.data.rentedAt = new Date().getTime();
                region.data.forSale = false;
            }

            check_and_update_sign(region, pl);

            region.data.rentTimeCredit += region.data.rentTime;
            p.save(data)
            region.save(data);

            tellPlayer(pl, '&aSuccessfully rented region for &r:money:&e' + getAmountCoin(region.data.rentPrice) + ' &a for &a&o' + getTimeString(region.data.rentTime) + ' &amore time');
            // if StarterHotel in region name:
            if (region.name.toLowerCase().indexOf('starterhotel') > -1) {
                grantBadgeAndEmotes(pl, "checked_in", ["hut_dirt"]);
            }
        }


    }, 'region.rent', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    }]],
    ['!myRegions [...matches]', function (pl, args, data) {
        var checkRegions = new Region().getAllDataEntries(data);
        var params = getArgParams(args.matches);
        var regions = [];

        for (var i in checkRegions) {
            var checkRegion = checkRegions[i];
            if (checkRegion.data.owner == pl.getName() || checkRegion.data.trusted.indexOf(pl.getName()) > -1) {
                regions.push(checkRegion);
            }
        }

        var output = getTitleBar('My Regions', false) + '\n' +
            getNavBar(pl) + '\n';

        output += genDataPageList(
            regions,
            args.matches,
            (params.show || 10),
            (params.page || 1),
            "!myRegions {MATCHES} -show:{SHOW} -page:{PAGE} -sort:{SORT}",
            function (region) {
                var regionInfo = '&dClick to see more details.\n' +
                    '&6&lRegion Name: &b' + region.name + '&r\n' +
                    (region.data.owner == pl.getName() ? '&a[:check_mark: Owner]' : '&c[:cross_mark: Owner] ' + (region.isTrusted(pl.getName()) ? '&a[:check_mark: Trusted]' : '&c[:cross_mark: Trusted]')) + ' ' + (region.getPermission().init(data).permitsPlayer(pl) ? '&a[:check_mark: Via Permission]' : '&c[:cross_mark: Via Permission]') + '\n' +
                    '&6&lOwner: &r' + (region.data.owner ? '&e' + region.data.owner : CONFIG_SERVER.TITLE) + '\n' +
                    '&dClick to see more details.\n&d&o!myRegion info ' + region.name;

                return '&e - &b' + region.name + ' &d[Info]{run_command:!myRegion info ' + region.name + '|show_text:' + regionInfo.replaceAll('&', '$') + '}&r\n';
            },
            function (a, b) {
                return b.name - a.name;
            },
            function (region, list) {
                return arrayOccurs(region.name, list, false, false) > 0;
            }
        );

        tellPlayer(pl, output);
    }, 'myRegions'],
    ['!myRegion info [name] [...matches]', function (pl, args, data) {
        var params = getArgParams(args.matches);
        var showpage = params.showpage || 'info';

        var output = getTitleBar('Region Info') + '\n';


        if (!args.name) {
            var regids = new Region().getAllDataIds(data);
            var ppos = [
                pl.getPos().getX(),
                pl.getPos().getY(),
                pl.getPos().getZ(),
            ];
            var showRegs = [];
            for (var r in regids) {
                var regid = regids[r];
                var reg = new Region(regid).init(data);
                if (reg.data.owner == pl.getName() || reg.data.trusted.indexOf(pl.getName()) > -1) {
                    if (reg.hasCoord(ppos)) {
                        showRegs.push(reg.name);
                    }
                }
            }
            if (showRegs.length > 0) {

                executeXCommand("!myRegions " + showRegs.join(" "), pl);
                return true;
            } else {
                tellPlayer(pl, "&cYou are not standing in any of your regions!");
            }
        } else {
            // TODO: Make region manager for players

            var region = new Region(args.name).init(data);
            output += '&6&lRegion Name: &e' + region.name + '\n';

            switch (showpage) {
                case 'info':
                    output += '&6&lOwner: &e' + (region.data.owner || CONFIG_SERVER.TITLE) + '\n' +
                        '&6&lSale Type: &e' + region.data.saleType + '\n';
                    if (region.data.saleType == 'buy') {

                        output += '&6&lRegion value: &r:money:&e' + getAmountCoin(region.data.salePrice) + '\n';
                        if (region.data.owner == pl.getName()) {
                            var regionBuyHelpText = '&eBecause you\'re the owner of this region, you can set this region for sale. You can\'t change what the region is worth though.\nIf you feel like your region is worth more now, request a re-tax it at staff.';
                            output += '&6&lFor sale: &d[?]{*|show_text:' + regionBuyHelpText.replaceAll('&', '$') + '}&r ' +
                                (region.data.forSale ?
                                    ' &a[:check_mark: Yes] &c[Disable]{run_command:!myRegion setForSale ' + region.name + ' false|show_text:$cClick to disable for sale.}' :
                                    ' &c[:cross_mark: No] &a[Enable]{run_command:!myRegion setForSale ' + region.name + ' true|show_text:$aClick to enable for sale.}'
                                ) + '\n';

                        }
                    } else if (region.data.saleType == 'rent') {
                        var timeLeft = region.getRentTimeLeft();
                        output += '&6&lRent time left: &e' + (timeLeft > 0 ? getTimeString(timeLeft, ['ms']) : '&c' + getTimeString(Math.abs(timeLeft), ['ms']) + ' too late.') + '\n' +
                            '&6&lRent cost: &r:money:&e' + getAmountCoin(region.data.salePrice) + ' &6for &e' + getTimeString(region.data.rentTime) + ' &a[Rent more]{run_command:!region rent ' + region.name + '|show_text:$aClick to rent ' + getTimeString(region.data.rentTime) + ' more time for $r:money:$e' + getAmountCoin(region.data.salePrice) + '$a.}&r\n';
                    }

                    output += '&6&lTrusted: &a[View Trusted]{run_command:!myRegion info ' + region.name + ' -showpage:trusted|show_text:$aClick to show trusted player list}&r';
                    break;
                case 'trusted':
                    output += genDataPageList(
                        region.data.trusted,
                        args.matches,
                        (params.show || 10),
                        (params.page || 1),
                        '!myRegion info ' + region.name + ' {MATCHES} -showpage:trusted -show:{SHOW} -page:{PAGE} -sort:{SORT}',
                        function (trusted) {
                            return '&e - &b' + trusted + ' &c[:cross_mark: Remove]{run_command:!myRegion removeTrusted ' + region.name + ' ' + trusted + '|show_text:$cClick to remove ' + trusted + ' from trusted list.}&r\n';
                        },
                        function (a, b) {
                            return a.toLowerCase() - b.toLowerCase();
                        },
                        function (trusted, list) {
                            return arrayOccurs(trusted, list, false, false) > 0;
                        },
                        (params.sort == 'desc'),
                        '&a[+ Add Player]{suggest_command:!myRegion addTrusted ' + region.name + ' |show_text:$aClick to add trusted players to this region.}&r'
                    );
                    break;
            }
        }


        tellPlayer(pl, output);
    }, 'myRegion.info', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    }]],
    ['!myRegion setForSale <name> <forSale>', function (pl, args, data) {
        var region = new Region(args.name).init(data);
        var forSale = args.forSale == 'true';

        if (region.data.owner != pl.getName()) {
            tellPlayer(pl, '&cYou are not the owner of this region.');
            return false;
        }

        if (region.data.saleType == 'rent') {
            tellPlayer(pl, '&cYou can\'t sell this region.');
            return false;
        }

        region.set('forSale', forSale).save(data);

        tellPlayer(pl, '&aSet region for sale to &e' + forSale.toString());

    }, 'myRegion.setForSale', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    }, {
        "argname": "forSale",
        "type": "bool"
    }]],
    ['!myRegion addTrusted <name> <...players>', function (pl, args, data) {
        var region = new Region(args.name).init(data);

        if (region.data.owner != pl.getName()) {
            tellPlayer(pl, '&cYou are not the owner of this region.');
            return false;
        }

        for (var i in args.players) {
            var player = args.players[i];
            if (region.data.trusted.indexOf(player) == -1) {
                region.data.trusted.push(player);
            }
        }

        region.save(data);

        tellPlayer(pl, '&aAdded ' + args.players.length + ' player(s) to the trusted list.');
    }, 'myRegion.addTrusted', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    }]],
    ['!myRegion removeTrusted <name> <...players>', function (pl, args, data) {
        var region = new Region(args.name).init(data);

        if (region.data.owner != pl.getName()) {
            tellPlayer(pl, '&cYou are not the owner of this region.');
            return false;
        }
        var newTrusted = [];
        for (var i in region.data.trusted) {
            var trusted = region.data.trusted[i];
            if (args.players.indexOf(trusted) == -1) {
                newTrusted.push(trusted);
            }
        }

        region.data.trusted = newTrusted;

        region.save(data);

        tellPlayer(pl, '&Removed ' + args.players.length + ' player(s) from the trusted list.');
    }, 'myRegion.removeTrusted', [{
        "argname": "name",
        "type": "datahandler",
        "datatype": "region",
        "exists": true
    }]],
    ['!region unpaid [...matches]', function (pl, args, data) {
        var params = getArgParams(args.matches);
        var regions = new Region().getAllDataEntries(data).filter(function (region) {
            return region.data.saleType == 'rent' && region.getRentTimeLeft() < 0 && region.data.owner;
        });

        var output = getTitleBar('Region Unpaid List') + '\n';
        output += genDataPageList(
            regions,
            args.matches,
            (params.show || 10),
            (params.page || 1),
            '!region list {MATCHES} -show:{SHOW} -page:{PAGE} -sort:{SORT}',
            function (region) {
                var timeLate = getTimeString(Math.abs(region.getRentTimeLeft()), ['ms']);
                var helpTxt = '&dClick for more details.&r\n\n' +
                    '&6&lRegion owner: &e' + region.data.owner + '&r\n' +
                    '&6&lRent Time: &c' + timeLate + ' too late.&r\n' +
                    '&6&lRent Cost: &r:money:&e' + getAmountCoin(region.data.salePrice) + '&6 for &e' + getTimeString(region.data.rentTime) + '&r\n' +
                    '\n&dClick for more details.';
                return '&e - &b' + region.name + ' &e(' + region.data.owner + ') &c' + timeLate + ' too late&r &6[Info]{run_command:!region info ' + region.name + '|show_text:' + helpTxt.replaceAll('&', '$') + '}&r\n';
            },
            function (a, b) {
                var al = a.name.toLowerCase();
                var bl = b.name.toLowerCase();

                if (al < bl) return -1;
                if (al > bl) return 1;

                return 0;
            },
            function (region, list) {
                return arrayOccurs(region.name, list, false, false);
            },
            (params.sort == 'desc')
        );

        tellPlayer(pl, output);

        return true;
    }, 'region.unpaid'],
]);


//REGISTER TEAM COMMANDS
var teamCommands = new CommandFactory("team");


registerXCommands([
    ['!team syncAll [removeNonExistend]', function (pl, args, data) {
        var w = pl.world;
        var sb = w.getScoreboard();
        var sbteams = sb.getTeams();
        var dhteams = new Team().getAllDataIds(data);
        for (var s in sbteams) {
            var sbt = sbteams[s];
            if (dhteams.indexOf(sbt.getName()) == -1) {
                tellPlayer(pl, "&cScoreboard team '" + sbt.getName() + "' has no synced data! Syncing...");
            }
        }

    }, 'team.syncAll', [{
        "argname": "removeNonExistend",
        "type": "bool"
    }]],
    ['!team join <team> [...players]', function (pl, args, data) {
        var w = pl.world;
        var sb = w.scoreboard;
        if (!sb.hasTeam(args.team)) {
            tellPlayer(pl, '&cThat team doesn\'t exist.');
            return false;
        }

        var addPlayers = args.players;
        if (addPlayers.length == 0) { addPlayers.push(pl.getName()); }

        for (var i in addPlayers) {
            var addPlayer = addPlayers[i];
            executeCommand(pl, '/scoreboard teams join ' + args.team + ' ' + addPlayer);
        }

        tellPlayer(pl, '&aAdded ' + addPlayers.length + ' player(s) to team \'' + args.team + '\'.');

    }, 'team.join']
]);
;
//REGISTER TRADER COMMANDS




var unlockCommands = new CommandFactory("unlockable", "unlock");
unlockCommands
    .addSettable("price", function (value) {
        return getCoinAmount(value);
    }, [{
        "argname": "price",
        "type": "currency",
        "min": 1,
    }])
    .addSettable("displayName", function (value) {
        return value.join(' ');
    }, [], null, '[...{NAME}]')
    .addSettable("description", function (value) {
        return value.join(' ');
    }, [], null, '[...{NAME}]', null, 'desc')
    .addSettable("color", null, [{
        "argname": "color",
        "type": "color"
    }])
    .addSettable("currency", null, [{
        "argname": "currency",
        "type": "virtualcurrency"
    }])
    .addSettable("forSale", function (value) {
        return value == 'true';
    }, [{
        "argname": "forSale",
        "type": "bool",
    }])
    .addSettable("hidden", function (value) {
        return value == 'true';
    }, [{
        "argname": "hidden",
        "type": "bool",
    }])
    .addInfoText(function (unlock) {
        return "&6&lDisplay Name: &e" + unlock.data.displayName + ' &a[Change]{suggest_command:!unlock setDisplayName ' + unlock.name + ' |show_text:$aClick to change the display name.}&r\n' +
            "&6&lCurrency: &e" + unlock.data.currency + ' &a[Change]{suggest_command:!unlock setCurrency ' + unlock.name + ' |show_text:$aClick to change the currency.}&r\n' +
            "&6&lPrice: " + unlock.formatPrice() + ' &a[Change]{suggest_command:!unlock setPrice ' + unlock.name + ' |show_text:$aClick to change the price.}&r\n' +
            '&6&lDescription: &e' + unlock.data.description + ' &a[Change]{suggest_command:!unlock setDesc ' + unlock.name + ' |show_text:$aClick to change the description.}&r\n' +
            '&6&lHidden:' + (unlock.data.hidden ? '&a:check_mark: Yes &c[Disable]{run_command:!unlock setHidden ' + unlock.name + ' false|show_text:$cClick to disable ' + unlock.name + '}&r' : '&c:cross_mark: No &a[Enable]{run_command:!unlock setHidden ' + unlock.name + ' true|show_text:$aClick to enable ' + unlock.name + '}&r') + '\n' +
            '&6&lColor: &' + unlock.getColor() + unlock.data.color + ' &a[Change]{suggest_command:!unlock setColor ' + unlock.name + ' |show_text:$aClick to change the color.}&r\n' +
            '&6&lFor Sale:' + (unlock.data.forSale ? '&a:check_mark: Yes &c[Disable]{run_command:!unlock setForSale ' + unlock.name + ' false|show_text:$cClick to disable ' + unlock.name + '}&r' : '&c:cross_mark: No &a[Enable]{run_command:!unlock setForSale ' + unlock.name + ' true|show_text:$aClick to enable ' + unlock.name + '}&r');
    })
    .setListTransformer(function (unlock) {
        return '&e - &b' + unlock.name + ' &5[Info]{run_command:!unlock info ' + unlock.name + '|show_text:$5Click to show info about unlockable}&r\n';
    })
    .genDefault(['copy'])
    .register();

registerXCommands([
    ['!unlock buy <unlockable>', function (pl, args, data) {
        var unlock = new Unlockable(args.unlockable).init(data);
        if (!unlock.data.forSale) {
            tellPlayer(pl, '&cThis unlockable is not for sale.');
            return false;
        }


        var p = new Player(pl.getName()).init(data);

        if (p.hasUnlock(unlock.name)) {
            tellPlayer(pl, '&cYou already have this unlockable.');
            return false;
        }

        var balance = p.data[unlock.data.currency];
        var currency = getCurrency(unlock.data.currency);

        if (balance < unlock.data.price) {
            tellPlayer(pl, '&cYou don\'t have enough ' + currency.displayName + ' for this emote.');
            return false;
        }

        p.data.unlocks[unlock.name] = true;
        p.data[unlock.data.currency] -= unlock.data.price;

        p.save(data);
        tellPlayer(pl, '&aYou unlocked ' + unlock.data.displayName + ' for ' + formatCurrency(unlock.data.price, unlock.data.currency));
    }, 'unlock.buy', [{
        "argname": "unlockable",
        "type": "datahandler",
        "datatype": "unlockable",
        "exists": true,
    }]],
    ['!myUnlocks [...matches]', function (pl, args, data) {
        var params = getArgParams(args.matches);
        var p = new Player(pl.getName()).init(data);
        var unlocks = new Unlockable().getAllDataEntries(data).filter(function (unlock) {
            return !unlock.data.hidden;
        });

        var output = getTitleBar('Unlockables') + '\n' + getNavBar(pl) + '\n';
        output += genDataPageList(
            unlocks,
            args.matches,
            parseInt(params.show || 10),
            parseInt(params.page || 1),
            '!myUnlocks {MATCHES} -show:{SHOW} -page:{PAGE} -sort:{SORT}',
            function (unlock) {
                var color = '&' + unlock.getColor();
                var hoverCmd = p.hasUnlock(unlock.name) ? '*' : 'suggest_command:!unlock buy ' + unlock.name;
                var hoverText = color + '[' + unlock.data.displayName + ']\n' +
                    color + '&o' + unlock.data.description + '\n\n';
                if (p.hasUnlock(unlock.name)) {
                    hoverText += '&a&lUNLOCKED\n';
                } else {
                    hoverText += '&c&lLOCKED\n';
                    if (unlock.data.forSale) {
                        hoverText += '&cClick to buy for ' + unlock.formatPrice();
                    }
                }
                return color + (p.hasUnlock(unlock.name) ? '' : '&m') + '[' + unlock.data.displayName + ']{' + hoverCmd + '|show_text:' + ccs(hoverText) + '}\n';
            },
            function (a, b) {
                return (b.data.price || 0) - (a.data.price || 0);
            },
            function (unlock, list) {
                return arrayOccurs(unlock.name, list, false, false) > 0 ||
                    arrayOccurs(unlock.data.displayName, list, false, false) > 0 ||
                    arrayOccurs(unlock.data.description, list, false, false) > 0;
            },
            (params.sort || "").toLowerCase() == "desc"
        );

        tellPlayer(pl, output);
    }, 'myUnlocks']
]);

//Get server title bar for displaying
//TO-DO: Placeholders instead of multiple variables
function getTitleBar(title, showServerName) {
    if (typeof (showServerName) == typeof (undefined) || showServerName === null) { showServerName = true; }
    return CONFIG_SERVER.BAR_OPEN + (showServerName ? CONFIG_SERVER.TITLE + " " : CONFIG_SERVER.PREFIX) + title + CONFIG_SERVER.BAR_CLOSE;
}

function getNavBar(player) {
    if (checkOnboardingAdvancement(player, 2, 4)) {
        return '&r[== &e[:sun: Menu]{run_command:!menu|show_text:$eClick to show menu or do $o!menu}&r ==]';
    } else {
        return '';
    }
}

function getUndoBtn(undo_cmds, hoverText) {
    if (typeof (hoverText) == typeof (undefined) || hoverText === null) { hoverText = null; }
    return "&r[" + _MSG['undoBtnText'] + "{run_command:!chain ;" + undo_cmds.join(";") + (hoverText == null ? "" : "|show_text:" + hoverText.toString()) + "}&r]";
}


/*
Bridge between Reskillable-Compatskills mod and Custom NPCs
*/

//Classes https://github.com/Coders-After-Dark/Reskillable/

/**
 * Checks if player can level up, and executes optional callback
 * @param {IPlayer} player The player
 * @param {function||null} callback Optional callback when leveling up
 */
function checkLevelUp(player, callback) {
    if (typeof (callback) == typeof (undefined) || callback === null) { callback = null; }
    if (hasMCMod("reskillable")) {
        var skillData = getPlayerSkills(player);
        for (var i = 0; i < skillData.length; i++) {
            var skill = skillData[i];
            if (skill.xp >= skill.maxXp) {
                skill.mcSkill.setLevel(skill.level + 1);
                skill.sbScore.setValue(skill.xp - skill.maxXp);
                if (typeof callback === 'function') {
                    var e = {
                        player: player,
                        skill: getPlayerSkill(player, skill.name)
                    };
                    if (typeof callback === 'function') {
                        callback(e);
                    }
                }

            }
        }
    }
}

/**
 * 
 * @param {IPlayer} player Player to get skills from
 */
function getPlayerSkills(player) {

    if (hasMCMod("reskillable")) {
        var SkillDataHandler = Java.type('codersafterdark.reskillable.api.data.PlayerDataHandler');
        var skillDataList = SkillDataHandler.get(player.getMCEntity()).getAllSkillInfo().toArray();
        var retSkills = [];
        var sb = player.world.getScoreboard();

        for (var s in skillDataList) {
            var skillData = skillDataList[s];
            var skillslug = skillData.skill.getKey().replace(/\w+(?:\.|:)(\w+)/g, '$1');
            var sxp = skillslug + '_xp';//id.name to name_xp

            var sb_xp = sb.getObjective(sxp);

            if (sb_xp == null)
                sb_xp = sb.addObjective(sxp, 'dummy');

            var pl_xp = sb_xp.getScore(player.getName());

            if (pl_xp == null) {
                pl_xp = sb_xp.createScore(player.getName());
                pl_xp.setValue(0);
            }

            var fskill = {
                name: skillData.skill.getName(),
                skillslug: skillslug,
                xpname: sxp,
                key: skillData.skill.getKey(),
                level: skillData.getLevel(),
                points: skillData.getSkillPoints(),
                xp: pl_xp.getValue(),
                maxXp: getMaxXp(skillData.getLevel()),
                traits: [],
                mcSkill: skillData,
                sbObjective: sb_xp,
                sbScore: pl_xp
            };
            //Traits iteration
            for (var t in skillData.skill.getUnlockables()) {
                var trait = skillData.skill.getUnlockables()[t];
                var ftrait = {
                    name: trait.getName(),
                    desc: trait.getDescription(),
                    key: trait.getKey(),
                    cost: trait.getCost(),
                    unlocked: skillData.isUnlocked(trait),
                    mcTrait: trait
                }

                fskill.traits.push(ftrait);
            }

            retSkills.push(fskill);
        }

        return retSkills;
    } else {
        return [];
    }
}

function getPlayerSkill(player, skill_id) {
    var skills = getPlayerSkills(player);



    for (var i in skills) {
        if (skills[i].key == skill_id
            || skills[i].name == skill_id
            || skills[i].skillslug == skill_id
        ) {
            return skills[i];
        }
    }

    return null;
}


function givePlayerXP(player, skill_id, amount) {
    var _API = Java.type("noppes.npcs.api.NpcAPI").Instance();
    var cmd = _API.createNPC(player.world.getMCWorld());
    var skill = getPlayerSkill(player, skill_id);
    amount = Math.round(amount);
    var xpname = skill_id.replace(/\w+(?:\.|:)(\w+)/g, '$1') + '_xp';
    if (skill) {
        var event = {
            player: player,
            skill: skill,
            amount: amount,
            _canceled: false,
            setCanceled: function (bool) {
                this._canceled = bool;
            }
        };
        if (typeof skillGetXP === 'function') {
            skillGetXP(event);
        }

        if (!event._canceled) {
            var putamount = Math.round(event.amount);
            var cmdOutput = cmd.executeCommand("/scoreboard players " + (putamount > 0 ? "add" : "remove") + " " + player.getName() + " " + xpname + " " + Math.abs(putamount).toString());


            if (typeof skillHasXP === 'function') {

                skillHasXP(objMerge(event, {
                    skill: getPlayerSkill(player, skill_id)
                }));
            }
        }

    } else {
        handleError({
            'fileName': 'function givePlayerXP',
            'message': '\'' + skill_id + '\' is not a registered skill id!',
            'stack': 'Blame Runonstof'
        });
    }

}

function getMaxXp(lvl) {
    var mxp = 0;
    if (lvl < 16) {
        mxp = 2 * lvl + 7;
    } else if (lvl < 31) {
        mxp = 5 * lvl - 38;
    } else {
        mxp = 9 * lvl - 158;
    }
    return mxp * 2;
}





registerCSTEnchant("cst:berserker", "Berserker", 10, function (id, e, lvl, type) {
    switch (type) {
        case "damagedEntity":
            var chance = 5 + 2 * lvl;
            var newHP = e.player.getHealth();
            var hpPerc = Math.round(100 / e.player.getMaxHealth() * newHP);
            if (hpPerc <= 50 && Math.random() * 100 <= chance) {
                //Add Strength
                e.player.addPotionEffect(5, 3, lvl, true);
                //Add Speed
                e.player.addPotionEffect(1, 3, Math.ceil(lvl / 2), true);
                //Add Haste
                e.player.addPotionEffect(3, 3, lvl, true);
            }
            break;
    }
});


function getEntityMobHead(entity) {
    //Player
    if (entity.getType() == 1) {
        var head = API.getIWorld(0).createItem("minecraft:skull", 3, 1);
        head.getNbt().setString("SkullOwner", entity.getName());
        return head;
    }
    var vanillaSkulls = {
        "Skeleton": 0,
        "WitherSkeleton": 1,
        "Zombie": 2,
        "Creeper": 4,
    };
    var vk = Object.keys(vanillaSkulls);
    if (vk.indexOf(entity.getTypeName()) > -1) {
        var head = API.getIWorld(0).createItem("minecraft:skull", vanillaSkulls[entity.getTypeName()], 1);
        return head;
    }

    var mhfSkulls = {
        "Blaze": "Blaze",
        "CaveSpider": "CaveSpider",
        "Chicken": "Chicken",
        "Cow": "Cow",
        "Enderman": "Enderman",
        "Ghast": "Ghast",
        "VillagerGolem": "Golem",
        "LavaSlime": "LavaSlime",
        "MushroomCow": "MushroomCow",
        "Ocelot": "Ocelot",
        "Pig": "Pig",
        "PigZombie": "PigZombie",
        "Sheep": "Sheep",
        "Slime": "Slime",
        "Spider": "Spider",
        "Squid": "Squid",
        "Villager": "Villager",

    };
    if (Object.keys(mhfSkulls).indexOf(entity.getTypeName()) > -1) {
        var head = API.getIWorld(0).createItem("minecraft:skull", 3, 1);
        head.getNbt().setString("SkullOwner", "MHF_" + mhfSkulls[entity.getTypeName()]);
        return head;
    }

    return null;
}


registerCSTEnchant("cst:decapitation", "Decapitation", 5, function (id, e, lvl, type) {
    switch (type) {
        case "damagedEntity":
            var head = getEntityMobHead(e.target);
            if (head != null) {
                e.player.giveItem(head);
            }
            break;
    }
});
registerCSTEnchant("cst:depth_fighter", "Depth Fighter", 10, function (id, e, lvl, type) {
    switch (type) {
        case "damagedEntity":
            var xpChance = Math.min(5 + 4 * (lvl - 1), 100);
            var xpPerc = Math.min(25 + 5 * (lvl - 1), 100);
            var num = Math.round(Math.random() * 100);
            if (num <= xpChance) {
                var giveXP = Math.round((e.damage) / 100 * xpPerc);
                executeCommand(e.player, "/playsound minecraft:entity.experience_orb.pickup ambient " + e.player.getName())
                executeCommand(e.player, "/summon xp_orb {X} {Y} {Z} {Value:{XP}}".fill({
                    "X": e.player.getX(),
                    "Y": e.player.getY() + 1,
                    "Z": e.player.getZ(),
                    "XP": giveXP
                }));
            }
            break;
    }
});
registerCSTEnchant("cst:ender_swap", "Ender Swap", 1, function (id, e, lvl, type, slot) {
    switch (type) {
        case "damagedEntity":
            if (e.damageSource.isProjectile()) {
                var ppos = e.player.getPos().up();
                var ppitch = e.player.getPitch();
                var prot = e.player.getRotation();

                var tpos = e.target.getPos().up();
                var tpitch = e.target.getPitch();
                var trot = e.target.getRotation();

                e.player.setPos(tpos);
                e.player.setPitch(tpitch);
                e.player.setRotation(trot);

                e.player.playSound("minecraft:entity.endermen.teleport", 2, 1);

                e.target.setPos(ppos);
                e.target.setPitch(ppitch);
                e.target.setRotation(prot);

                executeCommand(e.player, "/particle dragonbreath {X} {Y} {Z} 1 1 1 1 700 force".fill({
                    "X": tpos.getX(),
                    "Y": tpos.getY(),
                    "Z": tpos.getZ(),
                }));
                executeCommand(e.player, "/particle dragonbreath {X} {Y} {Z} 1 1 1 1 700 force".fill({
                    "X": ppos.getX(),
                    "Y": ppos.getY(),
                    "Z": ppos.getZ(),
                }));
            }
            break;
    }
}, false);
registerCSTEnchant("cst:launch", "launch", 10, function (id, e, lvl, type) {
    switch (type) {
        case "damagedEntity":
            //if(hpPerc <= 50) {
            var jumpspd = 0.8 + (0.05 * lvl);
            (e.target).setMotionY(jumpspd);
            //}
            break;
    }
});
registerCSTEnchant("cst:life_steal", "Life Steal", 10, function (id, e, lvl, type) {
    switch (type) {
        case "damagedEntity":
            var stealChance = Math.min(5 + 4 * (lvl - 1), 100);
            var stealPerc = Math.min(50 + 5 * (lvl - 1), 100);
            var num = Math.round(Math.random() * 100);
            if (num <= stealChance) {
                var newHP = Math.min(Math.round(e.player.getHealth() + (e.damage / 100 * stealPerc)), e.player.getMaxHealth());
                e.player.setHealth(newHP);
                executeCommand(e.player, "/particle heart {x} {y} {z} 1 2 1 10 20".fill({
                    "x": e.player.getX(),
                    "y": e.player.getY() + 1,
                    "z": e.player.getZ(),
                }));
                executeCommand(e.player, "/playsound minecraft:entity.firework.large_blast ambient " + e.player.getName());
            }
            break;
    }
});
registerCSTEnchant("cst:paralyze", "Paralyze", 10, function (id, e, lvl, type) {
    switch (type) {
        case "damagedEntity":
            var parChance = Math.min(5 + (2 * (lvl - 1)), 100);
            if (Math.round(Math.random() * 100) <= parChance) {
                var duration = Math.round(lvl * 1.5);
                e.target.addPotionEffect(8, duration, 128, true);
                e.target.addPotionEffect(2, duration, 128, true);
            }
            break;
    }
})


function getCSTEnchantByName(name_id) {
    for (var i in _ENCHANTS) {
        var ench = _ENCHANTS[i];
        if (ench.name == name_id) {
            return ench;
        }
    }
    return null;
}

function getCSTEnchantsFromItem(itemstack) {
    if (itemstack == null || !itemstack.hasNbt()) {
        return [];
    }
    var nbt = itemstack.getNbt();
    var enchs = [];
    var itemenchs = nbtGetList(nbt, CSTENCH_TAG) || [];
    for (var i in itemenchs) {
        var itemench = itemenchs[i];
        enchs.push({
            "name": itemench.getString("name"),
            "lvl": parseInt(itemench.getShort("lvl")),
        });
    }
    return enchs;
}

//Checks if item has CST Enchant
//if lvl > 0 it will check also if enchant level >= lvl
function hasCSTEnchant(item, id, lvl) {
    if (itemstack == null || !itemstack.hasNbt()) {
        return false;
    }
    if (typeof (lvl) == typeof (undefined) || lvl === null) { lvl = 0; }
    var itemnbt = item.getNbt();
    var cstenchs = nbtGetList(itemnbt, CSTENCH_TAG);
    for (var i in cstenchs) {
        var cstench = cstenchs[i];
        if (cstench.getString("name") == id) {
            if (lvl > 0) {
                return parseInt(cstench.getShort("lvl")) >= lvl;
            }
            return true;
        }
    }

    return false;
}

function removeCSTEnchant(item, id) {
    if (hasCSTEnchant(item, id)) {
        var newench = [];
        var itemnbt = item.getNbt();
        var cstenchs = nbtGetList(itemnbt, CSTENCH_TAG);
        var newLore = [];
        var remLore = [];
        for (var i in cstenchs) {
            var cstench = cstenchs[i];
            var ench = getCSTEnchantByName(cstench.getString("name"));
            var lvl = parseInt(cstench.getShort("lvl"));


            if (ench.name != id) {
                newench.push(cstench);
            } else {
                remLore.push(ccs(getCSTEnchantDisplay(ench.name, lvl)));
            }
        }
        itemnbt.setList(CSTENCH_TAG, newench);
        var iLore = Java.from(item.getLore());
        for (var i in iLore) {
            var lore = iLore[i];
            if (remLore.indexOf(lore) == -1) {
                newLore.push(lore);
            }
        }
        item.setLore(newLore);
        return true;
    }
    return false;
}

function runCSTEnchant(id, event, lvl, type, slot) {
    var ench = getCSTEnchantByName(id);
    if (ench != null) {
        return ench.func(id, event, lvl, type, slot);
    }
    return null;
}

function addCSTEnchant(item, id, lvl) {
    var itemNbt = item.getNbt();
    var addench = getCSTEnchantByName(id);
    var newench = Java.from(nbtGetList(itemNbt, CSTENCH_TAG)) || [];
    if (hasCSTEnchant(item, id)) {
        removeCSTEnchant(item, id);
    }
    newench.push(API.stringToNbt('{"name":"' + id + '","lvl":' + lvl + 's}'));
    itemNbt.setList(CSTENCH_TAG, newench);
    item.setLore(Java.from(item.getLore()).concat([ccs(getCSTEnchantDisplay(id, lvl))]))
}

function getCSTEnchantDisplay(id, lvl) {
    var ench = getCSTEnchantByName(id);
    if (ench != null) {
        return "&7" + ench.displayName + (ench.showLvl ? " " + romanize(lvl) : "");
    }
    return "";
}

function registerCSTEnchant(name, displayName, maxLvl, func, showLvl) {
    if (typeof (showLvl) == typeof (undefined) || showLvl === null) { showLvl = true; }
    _ENCHANTS.push({
        "maxlvl": maxLvl,
        "name": name,
        "displayName": displayName,
        "func": func,
        "showLvl": showLvl,
    });
}

//Unstable, use money pouch for taking money
function takeMoneyFromPlayer(player, amount, pnbt) {
    if (typeof (pnbt) == typeof (undefined) || pnbt === null) { pnbt = null; }
    if (pnbt == null) { pnbt = player.getEntityNbt(); }
    var w = player.world;
    if (getMoneyItemCount(pnbt, w) >= amount) {
        var pmitems = getPlayerInvFromNbt(pnbt, w, function (item, inbt, w) {
            return isItemMoney(item, w); //Get only money items
        }).sort(function (r, s) {
            return getItemMoney(r, w) - getItemMoney(s, w); //Sort by money
        });

        for (var pm in pmitems) {
            var pmitem = pmitems[pm];
            var pval = getItemMoney(pmitem, w);

            for (var i = 1; i <= pmitem.getStackSize(); i++) {
                if (amount > 0) {
                    pmitem.setStackSize(pmitem.getStackSize() - 1);
                    amount -= pval;
                } else {
                    break;
                }
            }
        }
        tellPlayer(player, "Amount: " + amount);
        if (amount < 0) {
            var cmoney = generateMoney(w, Math.abs(amount));
            givePlayerItems(player, cmoney, pnbt)
        }
    }

}
//Returns amount of money in player inv
function getMoneyItemCount(pnbt, w) {
    var am = 0;
    for (var itemvalue in _COINITEMS) {
        var ci = _COINITEMS[itemvalue];
        var coinItems = generateMoney(w, getCoinAmount(itemvalue));
        for (var _cii in coinItems) {
            var _coin = coinItems[_cii];
            am += getInvItemCount(pnbt, _coin, w, false) * getCoinAmount(itemvalue);
        }

    }
    return am;
}

function getPlayerMessage(player, message, w, pname, fullraw, allowed) {
    if (typeof (pname) == typeof (undefined) || pname === null) { pname = null; }
    if (typeof (fullraw) == typeof (undefined) || fullraw === null) { fullraw = true; }
    if (typeof (allowed) == typeof (undefined) || allowed === null) { allowed = []; }
    if (pname == null) { pname = player.getName(); }
    var data = w.getStoreddata();
    var plo = new Player(player.getName()).init(data);
    var sb = w.getScoreboard();
    var ts = sb.getTeams();
    var t = sb.getPlayerTeam(pname);
    var notifySound = pick([
        'animania:cluck3',
        'animania:combo',
        'animania:crow3',
        'animania:moo2',
        'animania:ooooohh',
        'animania:reeee',
        'immersiveengineering:birthdayparty',
    ]);
    var pcol = '';
    var pteam = '';
    var tcol = '';
    var teff = '';
    var colls = Object.keys(_RAWCOLORS);
    var effs = Object.keys(_RAWEFFECTS);
    if (t != null) {
        var ct = new Team(t.getName()).init(data);
        if (ct.data.chatcolor != null) {
            if (colls.indexOf(ct.data.chatcolor) > -1) {
                tcol = '&' + getColorId(ct.data.chatcolor);
            }
        }
        if (ct.data.chateffect != null) {
            if (effs.indexOf(ct.data.chateffect) > -1) {
                teff = '&' + getColorId(ct.data.chateffect);
            }
        }
        if (t.getColor() != null) {
            pcol = '&' + getColorId(t.getColor());
        }
        pteam = pcol + "&o" + t.getDisplayName() + " &r" + pcol;
    }

    //Override player specific
    if (plo.data.chatcolor != null) {
        tcol = '&' + getColorId(plo.data.chatcolor);
    }
    //var timestr = '';
    //var now = new Date();
    //timestr = '&l[&r'+pcol+now.getHours().toString().append('0', 2)+':'+now.getMinutes().toString().append('0', 2)+'&l]&r';

    //var newmsg = pcol+timestr+pcol+'&l[&r'+pteam+pname+'&r'+pcol+'&l] -> &r'+tcol+teff;
    var newmsg = pcol + '&l[&r' + pteam + pname + '&r' + pcol + '&l] -> &r' + tcol + teff;
    if (!fullraw) {
        newmsg = ccs(newmsg, allowed);
    }
    newmsg += message.rangeUpper(0, 1); //Concat message contents

    var plr = w.getAllPlayers();
    var mrx = /@(\w+)/g;
    var mplr = newmsg.match(mrx) || [];

    for (var k in mplr) {
        var mtc = mplr[k].replace(mrx, '$1');
        var pmtc = null;
        for (var p in plr) {
            if (occurrences(plr[p].getName().toLowerCase(), mtc.toLowerCase()) > 0) {
                pmtc = plr[p].getName();
                break;
            }
        }
        if (pmtc != null) {
            executeCommand(player, "/playsound " + notifySound + " hostile " + pmtc, pmtc);
            newmsg = ccs(newmsg.replace('@' + mtc, '&9&o&l@' + pmtc + '&r'));
        }
    }

    var trx = /\$(\w+)/g;
    var tlr = newmsg.match(trx) || [];
    var apl = (function (w) {
        var pnames = [];
        var ps = w.getAllPlayers();
        for (var psi in ps) {
            var iplayr = ps[psi];
            pnames.push(iplayr.getName());
        }

        return pnames;
    })(w);
    for (var t in tlr) {
        var tc = tlr[t].replace(trx, '$1');
        for (var tt in ts) {
            var sbt = ts[tt];
            if (occurrences(sbt.getDisplayName().toLowerCase(), tc.toLowerCase()) > 0) {
                //Team select
                var spl = sbt.getPlayers();
                var scol = sbt.getColor();
                var sscol = '&f';
                var stn = sbt.getDisplayName();
                if (scol != null) {
                    sscol = "&" + getColorId(scol);
                }

                for (var sp in spl) {
                    var splayr = spl[sp];
                    if (apl.indexOf(splayr) > -1) {
                        executeCommand(player, '/playsound ' + notifySound + ' hostile ' + splayr, splayr);
                    }
                }
                newmsg = ccs(newmsg.replace('$' + tc, sscol + '&l' + "$" + stn + '&r'));
            }
        }
    }

    return newmsg;
}




var ReskillableRegistry = (hasMCMod("reskillable") ? Java.type('codersafterdark.reskillable.api.ReskillableRegistries') : null);



var PERMISSION_REGEX = /permission_([\w.\-]+)/g;

//Superfunction (extendable)
//Used to add permission requirements to datahandlers.
function Permittable(permDomain) {
    this.permDomain = permDomain || this.type;
    //Requires DataHandler
    this.getPermission = function () {
        return new Permission(this.getPermissionId());
    };
    this.getPermissionId = function () {
        return this.permDomain + '.' + this.name;
    };
    this.onRemove(function (self, data) {
        self.getPermission().remove(data); //Removes permission when DataHandler gets removed

    });
    this.onSave(function (self, data) {
        var perm = self.getPermission();
        if (!perm.exists(data)) {
            //Create permission of permittable if not exists
            perm.save(data); //this will run Permission onSave functions
        }
    });
}





registerXCommands([
    ['!skills [...matches]', function (pl, args, data) {
        //!skills {MATCHES} -show:{SHOWLEN} -page:{PAGE} -sort:{SORT}
        var pskills = getPlayerSkills(pl);
        var skillItems = [];
        var params = getArgParams(args.matches);

        var txt = [
            "&l[=======] &cMinerim Skills &r&l[=======]",
            genDataPageList(
                pskills,
                args.matches,
                params.show,
                params.page,
                "!skills {MATCHES} -show:{SHOW} -page:{PAGE} -sort:{SORT}",
                function (skill, i) {
                    var progBar = progressBar(skill.xp, skill.maxXp, 20, "|");
                    var proc = Math.round(100 / skill.maxXp * skill.xp);
                    var hovertxt = [
                        "&l&o[&e&l&o" + skill.name + "&r&l&o]&r",
                        "&e&l&oLevel: &a&l" + skill.level + "&r",
                        progBar + "&r &9&l" + proc + "% &d" + skill.xp + "/" + skill.maxXp + "&r"
                    ];

                    return "&l[&6&l" + skill.level + "&r&l] &e&l" + skill.name + "&r " + progBar + "&r &7&l[Info]{*|show_text:" + hovertxt.join("\n").replace(/&/g, '\$') + "}&r\n";
                },
                function (a, b) {//sort by level first, then xp
                    return b.lvl - a.lvl || b.xp - a.xp;
                },
                null,
                (params.sort || "").toLowerCase() == 'desc'
            )
        ];

        tellPlayer(pl, txt);

    }, 'skills']
]);
registerDataHandler("automsg", AutoMsg);
function AutoMsg(name) {
    DataHandler.apply(this, ['automsg', name]);

    this.addData({
        "msg": "Default AutoMessage",
        "enabled": true,
        "mode": "interval",
        "interval": getStringTime("5min"),
        "lastSend": 0,
    });

    this.broadcast = function (pl, target) {
        executeCommand(pl, "/tellraw " + target + " " + parseEmotes(strf(this.msg)));
        return this;
    };

    this.canSend = function () {
        return new Date().getTime() >= this.lastSend + this.interval;
    };
}
registerDataHandler("badge", Badge);

function Badge(name) {
    DataHandler.apply(this, ["badge", name]);

    this.addData({
        displayName: "New Badge",
        emote: "medal_bronze",
        color: 'white',
        desc: "",
        hidden: true,
        forSale: false,
        price: 0,
        currency: 'credit'
    });

    this.formatPrice = function () {
        return formatCurrency(this.data.price, this.data.currency);
    };
    this.getColor = function () {
        return getColorId(this.data.color);
    };

    this.formatBadge = function (prefix, hoverTxt, hoverCmd) {
        return '&' + this.getColor() + (prefix || '') + ':' + this.data.emote + ':{' + (hoverCmd || '*') + '|show_text:' + ccs(this.data.displayName + '\n&r' + this.data.desc + (hoverTxt || '')) + '}&r'
    }
}


registerDataHandler("bank", Bank);

function Bank(code) {
    DataHandler.apply(this, ['bank', code]);

    this.addData({
        displayName: 'New Bank Account',
        description: '',
        owner: null,
        trustedAdmins: [],
        trustedGet: [],
        trustedPut: [],
        trustedAutopay: [],
        autopayAmount: 0,
        autopayInterval: getStringTime('1d'),
        autopayEnabled: false,
        autopayCap: 1,
        autopayIncrease: 0.2,
        amount: 0,
        cap: getCoinAmount('25K'),
        trustedCap: 2,
        traderCap: 0,
        increaseCost: getCoinAmount('5K'),
        increaseAmount: getCoinAmount('50K'),
        canFreeze: true,
        trustedIncreaseAmount: 0.25,
        traderIncreaseAmount: 0.25,
        frozeAt: -1,
        isFrozen: false,
        interest: 0,
        freezeTime: 0,
        linkedTraders: []
    });

    this.onLoaded(function (bank, data) {
        for (var i in bank.data.trustedAutopay) {
            var autopayPlayer = bank.data.trustedAutopay[i];
            bank.saveAutopayAmount(autopayPlayer.player, function () {
                this.save(data);
            });
        }
    })

    this.dateData([
        'frozeAt'
    ]);
    this.timeData([
        'freezeTime', 'autopayInterval'
    ]);

    this.moneyData([
        'autopayAmount', 'amount', 'cap', 'increaseCost', 'increaseAmount'
    ]);

    this.onRemove(function (bank, data) {
        if (bank.data.owner) {
            var p = new Player(bank.data.owner).init(data);
            p.data.money += bank.data.amount;
            p.save(data);
        }
    });

    this.getCap = function (capName) {
        if (typeof (capName) == typeof (undefined) || capName === null) { capName = null; }
        return Math.floor(this.data[capName ? capName + 'Cap' : 'cap']);
    };

    this.getInterval = function (intervalName) {
        if (typeof (intervalName) == typeof (undefined) || intervalName === null) { intervalName = null; }
        return (this.data[intervalName ? intervalName + 'Interval' : 'interval']);
    };
    this.getIncrease = function (increaseName) {
        if (typeof (increaseName) == typeof (undefined) || increaseName === null) { increaseName = null; }
        return (this.data[increaseName ? increaseName + 'Increase' : 'increase']);
    };

    this.upgrade = function (times) {
        if (typeof (times) == typeof (undefined) || times === null) { times = 1; }
        for (var i = 1; i <= times; i++) {
            this.data.cap += this.data.increaseAmount;
            this.data.trustedCap += this.data.trustedIncreaseAmount;
            this.data.traderCap += this.data.traderIncreaseAmount;
            this.data.autopayCap += this.data.autopayIncrease;
        }

        return this;
    };

    this.validateLinkedTraders = function (world) {
        var newTraders = [];
        var changed = false;
        for (var i in this.data.linkedTraders) {
            var linkedTrader = this.data.linkedTraders[i];
            var trader = world.getEntity(linkedTrader);
            if (!trader) {
                changed = true;
                continue;
            }

            if (trader.getName() !== 'customnpcs:customnpc') {
                changed = true;
                continue;
            }

            var role = trader.getRole();
            if (role.getType() != 1) {
                changed = true;
                continue;
            }

            newTraders.push(trader);
        }

        if (changed) {
            this.data.linkedTraders = newTraders;
        }

        return this;
    };

    this.linkTrader = function (npc) {
        this.validateLinkedTraders(npc.world);
        var uuid = npc.getUUID();
        if (this.data.linkedTraders.indexOf(uuid) == -1) {
            if (this.data.linkedTraders.length + 1 <= this.getCap('trader')) {
                this.data.linkedTraders.push(uuid);
            }
        }

        return this;
    };

    this.getFreezeAmount = function (interest) {
        if (typeof (interest) == typeof (undefined) || interest === null) { interest = null; }
        interest = interest || this.data.interest;

        return this.data.amount + Math.floor(this.data.amount / 100 * interest);
    };

    this.freeze = function (time) {
        this.data.frozeAt = new Date().getTime();
        this.data.isFrozen = true;
        this.data.freezeTime = time;

        return this;
    };

    this.getFreezeStatus = function () {
        return this.data.isFrozen ? (this.isFrozenAndDone() ? 'done' : 'frozen') : 'none'
    };

    this.isFrozenAndDone = function () {
        return this.data.isFrozen && new Date().getTime() >= this.data.frozeAt + this.data.freezeTime;
    }

    this.unfreeze = function () {
        this.data.amount = this.getFreezeAmount(this.data.interest);
        this.data.frozeAt = -1;
        this.data.isFrozen = false;
        this.data.freezeTime = 0;

        return this;
    };


    this.canDeposit = function (playerName) {
        return (this.isAdmin(playerName) || (this.data.trustedPut.indexOf(playerName) > -1));
    };
    this.canWithdraw = function (playerName) {
        return (this.isAdmin(playerName) || (this.data.trustedGet.indexOf(playerName) > -1));
    };

    this.hasAutopay = function (playerName) {
        for (var i in this.data.trustedAutopay) {
            var autopayPlayer = this.data.trustedAutopay[i];
            if (autopayPlayer.player == playerName) {
                return true;
            }
        }

        return false;
    };

    this.getAutopay = function (playerName) {
        for (var i in this.data.trustedAutopay) {
            var autopayPlayer = this.data.trustedAutopay[i];
            if (autopayPlayer.player == playerName) {
                return autopayPlayer;
            }
        }

        return null;
    };

    this.addAutopay = function (playerName, payAmount, payTime, enabled) {
        var bank = this;
        var autopayPlayer = {
            player: playerName,
            amount: 0,
            payAmount: payAmount || 0,
            lastPayed: new Date().getTime()
        };

        this.data.trustedAutopay.push(autopayPlayer);

        return autopayPlayer;
    };

    this.removeAutopay = function (playerName) {
        for (var i = 0; i < this.data.trustedAutopay.length; i++) {
            if (this.data.trustedAutopay[i].player == playerName) {
                this.data.trustedAutopay.splice(i, 1);
            }
        }

        return this;
    };

    this.isAdmin = function (playerName) {
        return this.isOwner(playerName) || (this.data.trustedAdmins.indexOf(playerName) > -1);
    };

    this.isOwner = function (playerName) {
        return (playerName == this.data.owner);
    };

    this.canSee = function (playerName) {
        return this.canWithdraw(playerName) || this.canDeposit(playerName) || this.hasAutopay(playerName);
    };

    this.getTotalAutopay = function () {
        var amount = 0;
        for (var i in this.data.trustedAutopay) {
            var autopayPlayer = this.data.trustedAutopay[i];
            amount += autopayPlayer.payAmount;
        }

        return amount;
    }

    this.getAutopayAmount = function (playerName, time) {
        if (typeof (time) == typeof (undefined) || time === null) { time = null; }
        var autopayPlayer = this.getAutopay(playerName);
        var now = time || new Date().getTime();
        var timePassed = now - autopayPlayer.lastPayed;
        var amount = 0;
        if (timePassed > 0) {
            amount = Math.floor(timePassed / this.data.autopayInterval) * autopayPlayer.payAmount;
        }

        return amount;
    };

    this.saveAutopayAmount = function (playerName, callback) {
        var now = new Date().getTime();
        var autopayPlayer = this.getAutopay(playerName);
        var timePassed = now - autopayPlayer.lastPayed;

        var addAmount = Math.min(this.data.amount, this.getAutopayAmount(playerName, now));

        if (addAmount > 0 && this.canAutopay()) {
            this.data.amount -= addAmount;
            autopayPlayer.amount += addAmount;
            autopayPlayer.lastPayed += Math.floor(timePassed / this.data.autopayInterval) * this.data.autopayInterval;
            if (typeof callback === 'function') {
                callback.apply(this, [this]);
            }
        } else {
            autopayPlayer.lastPayed = now;
        }

        return this;
    };
    this.canAutopay = function () {
        return this.data.amount >= this.getTotalAutopay() && this.data.autopayEnabled && !this.data.isFrozen();
    };
}

Bank.__proto__.genBankCode = function (data) {
    var code;
    var allCodes = new Bank().getAllDataIds(data);
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    do {
        code = '';
        for (var i = 0; i < 9; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
    } while (allCodes.indexOf(code) > -1);

    return code;
}
//registerDataHandler("chatchannel", ChatChannel);
function ChatChannel(name) {
    DataHandler.apply(this, ['chatchannel', name]);
    Permittable.apply(this, []); //add getPermission etc

    this.addData({
        "displayName": name,
        "players": [],
        "color": "blue",
        "desc": "",
    });
    this.addPlayers = function (players) {
        for (var p in players) {
            var player = players[p];
            this.data.players.push(player);
        }
        return this;
    };
    this.getColor = function (cr) {
        cr = cr || '&';
        return cr + getColorId(this.data.color);
    };
    this.getName = function () {
        return this.getColor() + this.data.displayName + "&r";
    };
    this.getTag = function (prefix, cr) {
        cr = cr || '&';
        return this.getColor(cr) + cr + "l[#" + this.data.displayName + (prefix || '') + "]" + cr + "r";
    };
    this.removePlayers = function (players) {
        var np = [];
        for (var p in this.data.players) {
            var player = this.data.players[p];
            if (players.indexOf(player) == -1) {
                np.push(player);
            }
        }
        this.data.players = np;
        return this;
    };
    this.getPlayers = function (world) { //returns all online IPlayers
        var plr = world.getAllPlayers();
        var plrs = [];
        for (var p in plr) {
            var pl = plr[p];
            if (this.data.players.indexOf(pl.getName()) > -1) {
                plrs.push(pl);
            }
        }
        return plrs;
    };
    this.broadcast = function (w, msg, exc) {
        if (typeof (exc) == typeof (undefined)) { exc = []; }
        var plrs = w.getAllPlayers();
        for (var p in plrs) {
            var pl = plrs[p];
            if (this.data.players.indexOf(pl.getName()) > -1 && exc.indexOf(pl.getName()) == -1) {
                tellPlayer(pl, msg);
            }
        }
        return this;
    };

    this.onCreate(function (self, data) {
        var perm = self.getPermission();
        perm.data.enabled = false;
        perm.save(data);
    });
}


registerDataHandler('config', Config);

function Config(key, type, def) {
    DataHandler.apply(this, ['config', key]);
    this.addData({
        type: type,
        value: def,
    });
}


registerDataHandler("emote", Emote);

function Emote(name) {
    DataHandler.apply(this, ['emote', name]);
    Permittable.apply(this, ['emotes']);

    this.addData({
        "price": 0,
        "desc": "",
        "currency": "money",
        "default": false, //If everyone has the emote by default
        "forSale": false, //If emote can be bought
        "hidden": false, //Will be hidden from !myEmotes, unless player has it, if forSale == true emote can still be bought via command
    });

    this.showPrice = function () {
        return formatCurrency(this.data.price, this.data.currency);
    }

    this.getCode = function () {
        return CHAT_EMOTES[this.name] || "?";
    };
} registerDataHandler("fine", Fine);

function Fine(code) {
    registerDataHandler("fine", Fine);
    DataHandler.apply(this, ['fine', code]);

    this.addData({
        gave: new Date().getTime(),
        amount: 0,
        paid: 0,
        giver: null,
        reason: '',
        player: null,
        payTime: getStringTime('1w'),
        interest: 10,
        completed: 0
    });

    this.moneyData([
        'paid', 'amount'
    ]);

    this.dateData([
        'completed'
    ]);

    this.getTotalAmount = function () {
        var now = new Date().getTime();
        var payBefore = this.getPayBefore();

        if (now <= payBefore) {
            return this.data.amount;
        }

        var payTimesLate = Math.ceil((now - payBefore) / this.data.payTime);

        return this.data.amount + Math.round((this.data.amount / 100) * (this.data.interest * payTimesLate));
    };

    this.getPayBefore = function () {
        return this.data.gave + this.data.payTime;
    };

    this.isLate = function () {
        return this.isPaid() && new Date().getTime() > this.getPayBefore();
    };

    this.isPaid = function () {
        return this.data.paid >= this.getTotalAmount();
    };
}

Fine.__proto__.genFineCode = function (data) {
    var code;
    var allCodes = new Fine().getAllDataIds(data);
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    do {
        code = '';
        for (var i = 0; i < 9; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
    } while (allCodes.indexOf(code) > -1);

    return code;
}
//registerDataHandler("giftcode", GiftCode);

function GiftCode(name) {
    DataHandler.apply(this, ['giftcode', name]);
    Permittable.apply(this, ['giftcodes']);
    this.addData({
        "code": "",
        "uses": 0,
        "items": [],
        "money": 0,
        "emotes": [],
        "badges": [],
        "players": [], //redeemed players
    });

    this.onCreate(function (self, data) {
        var perm = self.getPermission();
        perm.data.enabled = false;
        perm.save(data);
    });

    this.generateCode = function () {
        var code = "";
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 6; i++)
            code += chars.charAt(Math.floor(Math.random() * chars.length));

        this.data.code = code;
    };

    this.getUsesLeft = function (pl) {
        if (this.data.uses == -1) return "infinite";
        return this.data.uses;
    };

    this.redeem = function (pl, data) {
        var perm = this.getPermission().init(data);
        if (!perm.permits(pl.getName(), pl.world.getScoreboard(), data)) {
            tellPlayer(pl, "&cYou don't have permission to use this code!");
            return false;
        }

        var p = new Player(pl.getName()).init(data);
        if (this.data.uses == 0) {
            tellPlayer(pl, "&cMax uses reached");
            return false;
        }
        if (this.data.players.indexOf(pl.getName()) > -1) {
            tellPlayer(pl, "&cYou already activated this code");
            return false;
        }
        //give
        var newEmotes = 0;
        if (this.data.emotes.length > 0) {
            for (var n in this.data.emotes) {
                var emote = this.data.emotes[n];
                if (p.data.emotes.indexOf(emote) == -1) {
                    p.data.emotes.push(emote);
                    newEmotes++;
                }
            }
        }
        var newBadges = 0;
        if (this.data.badges && this.data.badges.length > 0) {
            p.data.badges = p.data.badges || [];
            for (var bn in this.data.badges) {
                var badge = this.data.badges[bn];
                if (p.data.badges.indexOf(badge) == -1) {
                    p.data.badges.push(badge);
                    newBadges++;
                }
            }
        }
        if (this.data.items.length > 0) givePlayerItems(pl, nbtItemArr(this.data.items, pl.world));
        if (this.data.money > 0) givePlayerItems(pl, generateMoney(pl.world, this.data.money));

        if (this.data.uses > 0) { //keep -1 special
            this.data.uses -= 1;
        }
        this.data.players.push(pl.getName());
        this.save(data);
        p.save(data);
        // Fancy reward summary
        tellPlayer(pl, getTitleBar('&a&lGiftCode Rewards'));
        tellPlayer(pl, "&aYou redeemed &b" + this.name + "&a!");
        var rewardParts = [];
        if (this.data.money > 0) rewardParts.push(":money:&e" + getAmountCoin(this.data.money));
        if (this.data.items.length > 0) rewardParts.push(":gift:&e" + this.data.items.length + " item(s)");
        if (newEmotes > 0) rewardParts.push(":medal:&d" + newEmotes + " emote(s)");
        if (newBadges > 0) rewardParts.push(":medal:&b" + newBadges + " badge(s)");
        if (rewardParts.length > 0) {
            tellPlayer(pl, "&6You received: &r" + rewardParts.join(" &7• &r"));
        }
        var tips = [];
        if (newEmotes > 0) tips.push("&d:medal: View emotes{run_command:!myemotes|show_text:$aClick to view your emotes.}");
        if (newBadges > 0) tips.push("&9:medal: View badges{run_command:!mybadges|show_text:$aClick to view your badges.}");
        if (tips.length > 0) {
            tellPlayer(pl, "&r[" + tips.join("&r] [&r") + "&r]");
        }
        tellPlayer(pl, "&aCode '&b" + this.name + "&a' activated!");
        return true;
    };

}
registerDataHandler("job", Job);
function Job(name) {
    DataHandler.apply(this, ['job', name]);
    this.addData({
        "displayName": name,
        "pay": getCoinAmount('5g'),
        "payTime": getStringTime('20min'),
        "isOpen": false,
        "capacity": 10,
        "fireTime": getStringTime('1w'),
        "companyId": null
    });

    this.getPlayers = function (data) {
        var pl = [];
        var dkeys = data.getKeys();
        for (var d in dkeys) {
            var dkey = dkeys[d];
            if (dkey.cmatch(/player_(\w+)/g) == 1) {
                var player = new Player(dkey.replace(/player_(\w+)/g, '$1'));
                player.load(data);
                if (player.hasJob(this.name) && pl.indexOf(player.name) == -1) {
                    pl.push(player.name);
                }
            }
        }

        return pl;
    };

    this.getDisplayName = function (data) {
        if (typeof (data) == typeof (undefined)) {
            return this.data.displayName + '&r';
        } else {
            return this.getStatusColor(data) + this.data.displayName + '&r';
        }
    }

    this.getStatusColor = function (data) {
        if (this.data.capacity == -1) {
            return '&a';
        }
        if (this.getPlayers(data).length < this.data.capacity) {
            return '&6';
        }
        return '&c';
    };
}





registerDataHandler("loan", Loan);

function Loan(player) {
    DataHandler.apply(this, ['loan', player]);
    this.addData({
        loanedFrom: null,
        player: player,
        took: new Date().getTime(),
        amount: 1,
        paid: 0,
        interest: null,
        payInterval: getStringTime('3d')
    });

    this.dateData([
        'took'
    ]);
    this.timeData([
        'payInterval',
    ]);
    this.moneyData([
        'amount', 'paid'
    ]);

    this.onLoaded(function (loan, data) {
        if (!('interest' in loan)) {
            loan.data.interest = loan.data.interest || loan.data.payRate || 12.5;
        }
        if (loan.data.payRate) {
            delete loan.data.payRate;
        }
    });

    this.onRemove(function (loan, data) {
        var p = new Player(loan.data.player).init(data);
        var overflow = loan.data.paid - loan.getPaybackAmount();

        if (overflow > 0) {
            p.data.money += overflow;
            p.save(data);
        }
    });

    this.getPaybackAmount = function () {
        return Math.floor(this.data.amount + (this.data.amount / 100 * this.data.interest));
    };

    this.getPayTime = function () {
        var maxAmount = getCoinAmount('1M');
        var maxTime = getStringTime('4mon2w');

        return Math.min(getStringTime('10d') + (maxTime / maxAmount * this.data.amount), maxTime);
        // return Math.min(getStringTime('9d') + (Math.floor(Math.pow(1.4, (this.data.amount / maxAmount))) * this.data.payInterval), maxTime);
    };

    this.getTermPrice = function () {
        return Math.round(this.getPaybackAmount() / Math.ceil(this.getPayTime() / this.data.payInterval));
    };
    this.getPaymentTerms = function () {
        var terms = [];
        var amount = this.getPaybackAmount();
        var mustPayBefore = new Date().getTime() + this.getPaybackAmount();
        var termCount = Math.ceil(this.getPayTime() / this.data.payInterval);
        var termPrice = Math.round(amount / Math.ceil(this.getPayTime() / this.data.payInterval));
        for (var i = 0; i < termCount; i++) {
            var currentTermPrice = Math.min((i + 1) * termPrice, this.getPaybackAmount());
            var isPaid = this.data.paid >= currentTermPrice;

            terms.push({
                index: i,
                termPrice: termPrice,
                payTreshold: currentTermPrice,
                isPaid: isPaid,
                payBefore: this.data.took + (this.data.payInterval * (i + 1)),
            });
        }

        return terms;
    };

    this.isPaid = function () {
        return this.data.paid >= this.getPaybackAmount();
    };

    this.isLate = function () {
        var now = new Date().getTime();
        var terms = this.getPaymentTerms();
        var late = false;

        for (var i in terms) {
            var term = terms[i];
            if (now > term.payBefore && !term.isPaid) {
                late = true;
                break;
            }
        }

        return late;
    };
}

function pickwhere(a, fn, amount) {
    return pick(array_filter(a, fn), amount);
}

function genName(name) {
    var p = [
        'Amazing',
        'Awesome',
        'Blithesome',
        'Excellent',
        'Fabulous',
        'Fantastic',
        'Favorable',
        'Gorgeous',
        'Incredible',
        'Outstanding',
        'Perfect',
        'Propitious',
        'Remarkable',
        'Rousing',
        'Spectacular',
        'Splendid',
        'Stellar',
        'Super',
        'Upbeat',
        'Unbelievable',
        'Wondrous',
        'Tempered',
        'Legendary',
        'Magical'
    ];
    var s = [
        'Destruction',
        'Slaughter',
        'Starlight',
        'Heroism',
        'Bonebreaking',
        'The Fallen',
        'Silence',
        'Spellkeeping',
        'Massacre',
        'Sanity',
        'Insanity',
        'Remorse',
        'Fury'
    ];

    return pick(p) + ' ' + name + ' of ' + pick(s);
}


registerDataHandler('lottery', Lottery);

function Lottery(name) {
    DataHandler.apply(this, ['lottery', name]);

    this.addData({
        'minimumPlayers': 0,
        'maxTicketsPerPlayer': 0,
        'amount': 0,
        'ticketCost': getCoinAmount('100g'),
        'open': false,
        'openedAt': 0,
        'endAfter': getStringTime('3h'),
        'repeat': false,
        'tickets': {}
    });

    this.getWinner = function () {
        var pickFrom = [];

        for (var player in this.tickets) {
            var amount = this.tickets[player];
            pickFrom.push([player, amount]);
        }

        if (pickFrom.length == 0) { return null; }

        return pickchance(pickFrom, 1);
    };

    this.isEnded = function () {
        return new Date().getTime() >= this.data.openedAt + this.data.endAfter;
    };

    this.hasMinimumPlayers = function () {
        return Object.keys(this.tickets).length >= this.data.minimumPlayers;
    };

} registerDataHandler("mail", Mail);
function Mail(name) {
    this.addData({
        "from": null,
        "to": [],
        "title": "",
        "message": ""
    });
}
registerDataHandler("minigame", Minigame);
function Minigame(name) {
    DataHandler.apply(this, ["minigame", name]);
    this.addData({
        "from": null,
        "to": [],
        "title": "",
        "message": ""
    });

    this.start = function () {

    }
    this.win = function () {

    }
}
registerDataHandler("region", Region);

function Region(name) {
    DataHandler.apply(this, ['region', name]);
    Permittable.apply(this, ['regions']); //Uses custom permission domain 'regions'


    this.addData({
        "displayName": this.name,
        "positions": [],
        "owner": null, //
        "rentedAt": new Date().getTime(),
        "rentTimeCredit": 0,
        "maxRentTime": getStringTime('6mon'),
        "rentTime": getStringTime('1w'),
        "forSale": false,
        "saleType": "buy",
        "priority": 0,
        "salePrice": 0,
        "rentPrice": 0,
        "flags": {
            "noFallDamage": false,
        },
        "allInteract": false,
        "allBuild": false,
        "allAttack": false,
        "trusted": [], //
    });

    this.dateData([
        'rentedAt'
    ]);
    this.timeData([
        'rentTimeCredit', 'maxRentTime', 'rentTime'
    ]);
    this.moneyData([
        'salePrice', 'rentPrice'
    ]);

    this.reset = function () {
        this.data.rentTimeCredit = 0;
        this.data.trusted = [];

        return this;
    };

    this.getRentTimeLeft = function () {
        return (this.data.rentedAt + this.data.rentTimeCredit) - new Date().getTime();
    }

    this.isTrusted = function (playerName) {
        return this.data.trusted.indexOf(playerName) > -1;
    };

    this.isOwner = function (playerName) {
        return this.data.owner == playerName;
    };

    /*String player, IScoreboard sb, IData data*/
    this.can = function (player, sb, data, action) {
        if (typeof (action) == typeof (undefined) || action === null) { action = null; }
        var perm = this.getPermission().init(data);
        var canAction = false;

        switch (action) {
            case "interact":
                if (this.data.allInteract) canAction = true;
                break;
            case "build":
                if (this.data.allBuild) canAction = true;
                break;
            case "attack":
                if (this.data.allAttack) canAction = true;
                break;

        }

        return (
            this.data.owner == player ||
            this.data.trusted.indexOf(player) > -1 ||
            perm.permits(player, sb, data) ||
            canAction
        );
    }
    /*Array xyz1, Array xyz2*/
    this.addPos = function (xyz1, xyz2) {
        var newPos = {
            xyz1: xyz1,
            xyz2: xyz2,
        };
        this.data.positions.push(newPos);

        return this;
    };
    this.addCoord = function (xyz) {
        //Check if there is a half-position
        var hasHalfPos = false;
        for (var i in this.data.positions) {
            var pos = this.data.positions[i];
            if (pos.xyz1 == null || pos.xyz2 == null) {
                pos.xyz1 = pos.xyz1 || xyz;
                pos.xyz2 = pos.xyz2 || xyz;

                this.data.positions[i] = pos;
                hasHalfPos = true;
                break;
            }
        }
        if (!hasHalfPos) {
            this.addPos(xyz, null);
        }

        return this;
    };

    this.getMaxRentTimeString = function () {
        return this.data.maxRentTime == -1 ? 'Infinity' : getTimeString(this.data.maxRentTime);
    };

    /*Array xyz*/
    this.getPos = function (xyz) { //Gets cube number of xyz coord
        for (var i in this.data.positions) {
            var pos = this.data.positions[i]; //Loop cubes

            if (pos.xyz1 != null && pos.xyz2 != null) { //Check is valid cube
                var minx = Math.min(pos.xyz1[0], pos.xyz2[0]);
                var miny = Math.min(pos.xyz1[1], pos.xyz2[1]);
                var minz = Math.min(pos.xyz1[2], pos.xyz2[2]);

                var maxx = Math.max(pos.xyz1[0], pos.xyz2[0]);
                var maxy = Math.max(pos.xyz1[1], pos.xyz2[1]);
                var maxz = Math.max(pos.xyz1[2], pos.xyz2[2]);

                var x = xyz[0];
                var y = xyz[1];
                var z = xyz[2];

                if (x >= minx &&
                    x <= maxx

                    &&
                    y >= miny &&
                    y <= maxy

                    &&
                    z >= minz &&
                    z <= maxz) {
                    return parseInt(i);
                }
            }
        }

        return -1;
    };

    this.hasCoord = function (xyz) { //Check if xyz is in region
        return (this.getPos(xyz) > -1);
    };

    this.hasPaid = function () {
        if (this.data.owner == null) {
            return true;
        }

        if (this.data.saleType == "buy") {
            return true;
        }
        return this.getRentTimeLeft() > 0;
    } //TODO: REGION RENT PRICE
} registerDataHandler("team", Team);
function Team(name) {
    DataHandler.apply(this, ['team', name]);
    this.addData({
        "chatcolor": null,
        "chateffect": null,
    });
    this.teamExists = function (sb) {
        return sb.hasTeam(this.name);
    };
}




registerDataHandler('trader', Trader);

function Trader(uuid) {
    DataHandler.apply(this, ['trader', uuid]);

    this.addData({
        'bank': null,
        'money': 0,
        'items': [],
        'rowcap': 1,
        'hiredAt': new Date().getTime(),
        'hireTime': 0,
        'hireCost': getCoinAmount('10K'),
        'hireTimeIncrease': getStringTime('1mon'),
    });

    this.getMaxItemCount = function () {
        return Math.round(Math.max(Math.min(this.data.rowcap, 6), 1)) * 9;
    };

    this.getItemCount = function (item, ignoreNbt) {
        if (typeof (ignoreNbt) == typeof (undefined) || ignoreNbt === null) { ignoreNbt = false; }
        var traderItems = this.getItems();
        var count = 0;
        for (var i in traderItems) {
            var traderItem = traderItems[i];
            if (ignoreNbt) {
                if (isItemEqual(item, traderItem)) {
                    count += traderItem.getStackSize();
                }
            } else {
                if (item.getName() == traderItem.getName()) {
                    count += traderItem.getStackSize();
                }
            }
        }

        return count;
    }

    this.getItems = function () {
        var items = [];
        var world = API.getIWorld(0);

        for (var i in this.items) {
            var item = this.items[i];
            items.push(world.createItemFromFromNBT(API.stringToNbt(item)));
        }

        return items;
    };

    this.removeItems = function (items, ignoreNbt) {
        for (var i in items) {
            var item = items[i];
            this.removeItem(items, ignoreNbt);
        }

        return this;
    };

    this.removeItem = function (item, ignoreNbt) {
        if (typeof (ignoreNbt) == typeof (undefined) || ignoreNbt === null) { ignoreNbt = false; }
        this.setItems(this.getItems().filter(function (traderItem) {
            return (ignoreNbt ? (traderItem.getName() != item.getName()) : (!isItemEqual(traderItem, item)));
        }));

        return this;
    };

    this.calcNewItems = function (items) {
        var newItems = [];
        var traderItems = this.getItems();

        for (var i in items) {
            var item = items[i];
            item = item.copy();
            // this.items.push(item.getItemNbt().toJsonString());
            for (var j in traderItems) {
                var traderItem = traderItems[j];
                if (!isItemEqual(item, traderItem)) {
                    continue;
                }

                var addCount = Math.min(traderItem.getMaxStackSize() - traderItem.getStackSize(), item.getStackSize());

                if (addCount > 0) {
                    traderItems[j].setStackSize(traderItem.getStackSize() + addCount);
                    items[i].setStackSize(item.getStackSize() - addCount);
                }
            }

            if (item.isAir()) {
                continue;
            }

            newItems.push(item);
        }

        for (var j in traderItems) {
            var traderItem = traderItems[j];
            newItems.unshift(traderItem);
        }

        return newItems.length <= this.getMaxItemCount() ? newItems : false;
    }

    this.addItems = function (items) {
        var newItems = this.calcNewItems(items);

        if (newItems !== false) {
            this.setNewItems(newItems);
        }

        return this;
    };

    this.setNewItems = function (items) {
        this.data.items = [];
        for (var i in items) {
            var item = items[i];
            this.data.items.push(item.getItemNbt().toJsonString());
        }

        return this;
    }
}


registerDataHandler("unlockable", Unlockable);

function Unlockable(name) {
    DataHandler.apply(this, ['unlockable', name]);
    this.addData({
        displayName: name,
        description: '',
        price: 0,
        forSale: false,
        hidden: true,
        color: 'white',
        currency: 'credit',
    });

    this.formatPrice = function () {
        return formatCurrency(this.data.price, this.data.currency);
    };

    this.getColor = function () {
        return getColorId(this.data.color);
    }
} registerDataHandler("warp", Warp);
function Warp(name) {
    DataHandler.apply(this, ["warp", name]);
    Permittable.apply(this, ["warps"]); //Use new domain "warps"

    this.onCreate(function (self, data) {
        var perm = self.getPermission();
        perm.data.enabled = false;
        perm.save(data);
    });

    this.addData({
        "pos": {
            "x": null,
            "y": null,
            "z": null,
        },
        "price": 0,
    });
}




var URL = Java.type("java.net.URL");
var HttpURLConnection = Java.type("java.net.HttpURLConnection");
var BufferedReader = Java.type("java.io.BufferedReader");
var DataOutputStream = Java.type("java.io.DataOutputStream");
var InputStreamReader = Java.type("java.io.InputStreamReader");
var String = Java.type("java.lang.String");

var HTTP = {
    get: function (url, contentType) {
        var obj = new URL(url);
        var con = obj.openConnection();

        con.setRequestMethod("GET");
        con.setRequestProperty("User-Agent", "Mozilla/5.0");

        var responseCode = con.getResponseCode();

        var input = new BufferedReader(new InputStreamReader(con.getInputStream()));
        var inputLine;
        var response = "";
        while ((inputLine = input.readLine()) != null) {
            response = response + inputLine + "\n";
        }
        input.close();
        //print(response);

        switch (contentType) {
            case "application/json":
                response = cson_parse(response);
                break;
        }

        return { "success": responseCode === 200, "data": response, "reponseCode": responseCode };
    },
    post: function (url, data) {
        var obj = new URL(url);
        var con = obj.openConnection();
        con.setDoInput(true);
        con.setDoOutput(true);
        con.setInstanceFollowRedirects(false);
        con.setRequestMethod("POST");
        con.setRequestProperty("Content-Type", "application/json; utf-8");
        con.setRequestProperty("User-Agent", "Mozilla/5.0");

        var os;
        try {
            os = con.getOutputStream();
            var writer = new DataOutputStream(os);
            writer.writeBytes(new String(JSON.stringify(data)));
            writer.flush();
            writer.close();
            os.close();
        } catch (exc) {
            handleError(exc);
        }
        var br;
        var res = null;
        try {
            br = new BufferedReader(
                new InputStreamReader(con.getInputStream(), "UTF-8")
            );
            var response = '';
            var responseLine = null;
            while ((responseLine = br.readLine()) != null) {
                response += responseLine.trim();
            }
            res = JSON.parse(response.toString());
        } catch (exc) {
            handleError(exc);
        }
        con.disconnect();

        return res;
    }
}

HTTP.async = {
    post: function (url, data) {
        var promise = new Promise(function (resolve, reject) {
            var response = HTTP.post(url, data);
            if (response.success) {
                resolve(response);
            }

        })
    },
};


function getColorPermId(colorId) {
    return 'chat.color.' + getColorName(colorId);
}

function reloadEmotes(w) {
    var data = w.getStoreddata();
    for (var c in CHAT_EMOTES) {
        var ce = CHAT_EMOTES[c];
        var ec = new Emote(c);
        if (!ec.exists(data)) {
            ec.save(data);
        }
    }
}

function formatLoanInfo(loan, params, title, cmdPrefix) {
    if (typeof (params) == typeof (undefined) || params === null) { params = {}; }
    if (typeof (title) == typeof (undefined) || title === null) { title = 'Info'; }
    var now = new Date().getTime();

    var terms = loan.getPaymentTerms();
    var payBefore = loan.data.took + loan.getPayTime();
    var payPercentage = roundDec(100 / loan.getPaybackAmount() * loan.data.paid).toString();
    var output = getTitleBar('Loan ' + title, false) + '\n';

    // output += getNavBar() + '\n';

    if (!params.payments) {

        output +=
            '&6&lLoaned from: &e' + (loan.data.loanedFrom || CONFIG_SERVER.TITLE) + '\n' +
            '&6&lLoan type: &ePayment Plan &5[Info]{*|show_text:$6Every $e' + getTimeString(loan.data.payInterval) + ' $6you need to pay $r:money:$e' + getAmountCoin(loan.getTermPrice()) + '. $6See the $e' + terms.length + ' $6payments listed below.}&r\n' +
            '&6&lLoan Info: &r:money:&e' + getAmountCoin(loan.data.amount) + '&6 + &e' + loan.data.interest + '% &6= &r:money:&e' + getAmountCoin(loan.getPaybackAmount()) + '\n' +
            '&6&lPaid: &r:money:&e' + getAmountCoin(loan.data.paid) + ' ' + progressBar(loan.data.paid, loan.getPaybackAmount(), 30) + ' &r:money:&e' + getAmountCoin(loan.getPaybackAmount()) + ' &6| &b' + payPercentage + '%\n' +
            '&6&lTime left: ' + (now > payBefore ? '&c' + getTimeString(now - payBefore, ['ms']) + ' too late.' : '&e' + getTimeString(payBefore - now, ['ms']) + ' left.') + '\n' +
            '&6&lPayments: &a' + terms.length + ' &b[Show my payments]{run_command:' + cmdPrefix + ' -payments|show_text:$bClick to show your payments ' + cmdPrefix + ' -payments}&r';
    } else {
        output += '&e&l[<< Back to loan info]{run_command:' + cmdPrefix + '|show_text:$bClick to go back to loan info ' + cmdPrefix + '}&r\n' +
            genDataPageList(
                terms, [],
                parseInt(params.show || 10),
                parseInt(params.page || 1),
                cmdPrefix + " {MATCHES} -payments -show:{SHOW} -page:{PAGE} -sort:{SORT}",
                function (term) {
                    var termNum = (parseInt(term.index) + 1);
                    var termString = '';
                    var paymentColor = term.isPaid ? '&a' : '&b';

                    //gen hover info
                    var termInfo = '{*|show_text:$r:money:$e' + getAmountCoin(term.termPrice) + '$b';
                    var prevPayTreshold = term.payTreshold - term.termPrice;
                    if (now <= term.payBefore) {
                        termInfo += ' pay before $b$o' + getTimeString(term.payBefore - now, ['ms']);

                    } else if (!term.isPaid) {
                        termInfo += ' $c ' + getTimeString(now - term.payBefore, ['ms']) + ' too late$r';
                        paymentColor = '&c';
                    }
                    var termCurrentPay = Math.max(Math.min(loan.data.paid - prevPayTreshold, term.termPrice), 0);

                    termInfo += '\n$r:money:$e' + getAmountCoin(termCurrentPay) + '$r' + progressBar(termCurrentPay, term.termPrice, 20).replace(/&/g, '$') + '$r:money:$e' + getAmountCoin(term.termPrice) + '$r\n';

                    termInfo += '}';


                    //gen text info
                    termString += paymentColor + 'Payment ' + paymentColor + '&l#' + termNum + ':&r ' + progressBar(termCurrentPay, term.termPrice, 20) + ' &a' + roundDec(100 / term.termPrice * termCurrentPay) + '%&r ';


                    termString += '&d[Info]' + termInfo + '&r :money:&e' + getAmountCoin(term.termPrice) + '\n';


                    return termString;

                },
                function (a, b) {
                    return a.index - b.index;
                },
                function (term, list) {
                    return arrayOccurs(term.index, list, false, false) > 0
                },
                (params.sort || "").toLowerCase() == "desc"
            );
    }

    return output;
}

function fillObject(obj, data) {

    for (var key in obj) {
        var val = obj[key];
        if (typeof val === 'string') {
            //obj[key] = val.fill(data);
        } else if (typeof val != 'number') {
            //fillObject(obj[key], data);
        }
    }
    return obj;
}

function containerGetRows(container) {
    return (container.getSize() - 36) / 9;
}

function handleMenuEvents(player, evs, filldata) {
    filldata = objMerge({
        "player": player.getName(),
    }, filldata || {});

    for (var c in evs) {
        var ev = evs[c];
        fillObject(ev, filldata);
        switch (ev.type) {
            case "run_command":
                executeCommand(player, ev.command || "");
                break;
            case "run_xcommand":
            case "run_xcommand_admin":
                executeXCommand(ev.command || "", player, ev.type === "run_xcommand");
                break;
            case "run_file":
                var scrPath = ev.file || "";
                var scrFile = new File(scrPath);
                if (scrFile.exists()) {
                    var scr = readFileAsString(scrPath);
                    var scrFunc = new Function('e', 'payload', scr);
                    var payl = objMerge({
                        //defaults
                    }, ev.payload || {});

                    try {
                        scrFunc(e, payl);
                    } catch (exc) {
                        handleError(exc, false, player.getName());
                    }
                } else {
                    tellPlayer(player, "&cFile '" + scrPath + "' doesn't exist!");
                }
                break;
            case "run_script":
                var scr = ev.script || "";
                var scrFunc = new Function('e', 'payload', scr);
                var payl = objMerge({
                    //defaults
                }, ev.payload || {});

                try {
                    scrFunc(e, payl);
                } catch (exc) {
                    handleError(exc, false, player.getName());
                }
                break;
            case "open_menu":
                var menuPath = "menus/" + (ev.file || "") + ".json";
                var menuFile = new File(menuPath);
                if (menuFile.exists()) {
                    var menuFileText = readFileAsString(menuPath);
                    var menuJson = null;

                    try {
                        menuJson = JSON.parse(menuFileText);
                    } catch (exc) {
                        handleError(exc, false, player.getName());
                    }

                    if (menuJson !== null) {
                        player.closeGui();
                        MENU_TIMER_PAYLOAD = { 'menu': menuJson, 'data': ev.data || {}, 'onClose': menuJson.onClose || [] };
                        player.timers.forceStart(MENU_TIMER_ID, 1, false);

                    }


                } else {
                    tellPlayer(player, "&cFile '" + menuPath + "' does not exists!")
                }
                break;
            case "cancel":
                if (e.isCancelable()) {
                    e.setCanceled(true);
                }
                break;
            case "close_menu":
                player.closeGui();
                break;
            case "function":
                if (typeof ev.function === 'function') {
                    var payl = objMerge({
                        //defaults
                    }, ev.payload || {});
                    var c = player.getOpenContainer();
                    ev.function(player, payl, c.getSize() > 36 ? c : null);
                }
                break;
        }
    }
}

function CustomMenu(name, meta) {
    this.name = name || "";
    this.rows = 6;
    this.items = [];
    this.closeFns = [];
    this.openFns = [];
    this.filldata = {};
    this.meta = meta || {};

    this.getFirstFreeSlot = function (container) {
        var items = container.getItems();
        for (var i in items) {
            var item = items[i];
            if (item.isEmpty() && i >= 36) {
                return i - 36;
            }
        }
        return -1;
    };

    this.fromContainer = function (container) {
        this.name = container.getName();
        this.items = container.getItems().map(function (item) {
            return new CustomMenuItem().fromItemStack(item);
        });
        this.rows = containerGetRows(container);

    };

    this.fromJson = function (json) {
        if (typeof json === 'string') { json = JSON.parse(json); }
        this.name = json.name || "";
        this.rows = Math.min(Math.max(json.rows || 6, 1), 6);
        if (json.items) {
            for (var i in json.items) {
                var jitem = json.items[i];
                this.items.push(new CustomMenuItem().fromJson(jitem));
            }
        }
        if (json.onClose) {
            this.closeFns = json.onClose;
        }
        if (json.onOpen) {
            this.openFns = json.onOpen;
        }
        if (json.data) {
            this.filldata = json.data;
        }
        if (json.meta) {
            this.meta = json.meta;
        }

        return this;
    };

    this.onClose = function (ev) {
        this.closeFns.push(ev);
    };

    this.onOpen = function (ev) {
        this.openFns.push(ev);
    };

    this.getItems = function () {
        return new Collection(this.items);
    };

    this.open = function (player) {
        var container = player.showChestGui(this.rows);

        MENU_ON_CLOSE = fillObject(objMerge({}, this.closeFns), {});
        handleMenuEvents(player, this.openFns);
        this.populate(player.world, container);
        return container;
    };

    this.update = function () {
        this.getItems().do("each", function (item) { item.update(); });
    };

    this.populate = function (w, container) {
        container.setName(parseEmotes(ccs(this.name)));
        var items = this.items;
        for (var i in this.items) {
            var citem = this.items[i];

            container.setSlot(36 + citem.slot, citem.toItemStack(w));
        }
    };
}

function CustomMenuItem(id, damage, count) {
    if (typeof (damage) == typeof (undefined) || damage === null) { damage = 0; }
    if (typeof (count) == typeof (undefined) || count === null) { count = 1; }
    this.id = id;
    this.lore = [];
    this.slot = 0;
    this.count = count;
    this.damage = damage;
    this.nbt = null;
    this.nbtstring = null;
    this.classes = [];
    this.name = null;
    this.takeable = false;

    this.toJsonString = function () {
        var json = {
            "id": this.id,
            "lore": this.lore,
            "damage": this.damage,
            "count": this.count,
            "slot": this.slot,
            "classes": this.classes,
            "takeable": this.takeable
        };
        if (this.nbt) { json.nbt = this.nbt; }
        if (this.name) { json.name = this.name }

        return JSON.stringify(json);
    };

    this.fromJson = function (json) {
        if (typeof json === 'string') { json = JSON.parse(json); }
        this.id = json.id;
        if ("name" in json) {
            this.name = json.name;
        }
        this.lore = json.lore || [];
        this.damage = json.damage || 0;
        this.count = json.count || 1;
        this.nbt = json.nbt || null;
        this.classes = json.classes || [];
        this.takeable = json.takeable || false;
        this.slot = json.slot || 0;
        this.onClickFuncs = json.onClick || [];

        return this;
    };

    this.onClickFuncs = [];

    this.onClick = function (type, meta) {
        this.onClickFuncs.push(objMerge({
            "type": type,
        }, meta));
    };

    this.fromItemStack = function (stack) {
        this.id = stack.getName();
        this.damage = stack.getItemDamage();
        this.count = stack.getStackSize();
        this.lore = stack.getLore() || [];
        if (stack.hasCustomName()) {
            this.name = stack.getDisplayName().replace("§", "&");
        }
        if (stack.hasNbt()) {
            var snbt = stack.getNbt();
            this.classes = nbtGetList(snbt, "classes") || [];
            var clickActions = (nbtGetList(snbt, "onClick") || []);
            this.onClick = [];
            for (var c in clickActions) {
                var ca = clickActions[c];
                this.onClick.push(JSON.stringify(ca));
            }
            //print(nbtGetList(snbt, "onClick")||[]);
            this.takeable = snbt.getBoolean("takeable") || false;


            var setNbt = nbtCopy(snbt);
            setNbt.remove("classes");
            setNbt.remove("onClick");
            setNbt.remove("takeable");
            setNbt.remove("display");

            this.nbtstring = setNbt.toJsonString();
        }


        return this;
    };
    this.toItemStack = function (w) {
        var item = w.createItem(this.id, this.damage, this.count);
        if (this.nbt) {
            //item.getNbt().merge(API.stringToNbt(JSON.stringify(this.nbt)));
        }
        var newLore = this.lore;
        item.setLore(newLore);
        if (this.name) {
            item.setCustomName(parseEmotes(ccs(this.name || ""), [], false));
        }
        var inbt = item.getNbt();
        inbt.setList("classes", (Java.from(inbt.getList("classes", inbt.getListType("classes"))) || []).concat.apply([], [this.classes]));
        inbt.setList("onClick", (Java.from(inbt.getList("onClick", inbt.getListType("onClick"))) || []).concat.apply([], [this.onClickFuncs.map(function (f) { return JSON.stringify(f); })]));
        inbt.setBoolean("takeable", this.takeable);



        if (this.nbtstring) {
            inbt.merge(API.stringToNbt(this.nbtstring));
        }
        return item;
    };
}









//





















;






var DATA_PATH = "CustomServerTools/data";

if (!new File(DATA_PATH).exists()) {
    mkPath(DATA_PATH);
}

function CSTData(disk, create) {
    if (typeof (disk) == typeof (undefined) || disk === null) { disk = null; }
    if (typeof (create) == typeof (undefined) || create === null) { create = false; }


    this.file = "";

    this.useDisk = function (diskname) {

        diskname = diskname || CONFIG_SERVER.USE_DISK;
        if (Object.keys(CONFIG_SERVER.FILE_DISKS).indexOf(diskname) > -1) {

            this.file = CONFIG_SERVER.FILE_DISKS[diskname].path.fill({
                "worldname": getServerProperties()['level-name']
            });

        }
        return this;
    };



    this.exists = function () {
        return new File(this.file).exists();
    };
    this.create = function () {
        if (!this.exists()) {
            print("DEBUGFILE: " + this.file);
            new File(this.file).createNewFile();
            writeToFile(this.file, "{}");
        }

    };


    if (create) { this.create(); }

    this.clear = function () {
        writeToFile(this.file, "{}");
    }

    this.put = function (key, value) {
        try {
            var d = JSON.parse(this.exists() ? readFileAsString(this.file).replace(/\n/gm, "") : "{}");
            d[key] = value;
            writeToFile(this.file, JSON.stringify(d));
            return true;
        } catch (exc) {
            handleError(exc);
            return false;
        }
    }

    this.has = function (key) {
        try {
            return Object.keys(cson_parse(readFileAsString(this.file))).indexOf(key) > -1;
        } catch (exc) {
            handleError(exc);
            return false;
        }
    }

    this.get = function (key) {
        try {
            print(this.file.toString() + " --- " + key + " --- " + readFileAsString(this.file).toString());
            var jdata = JSON.parse(readFileAsString(this.file));
            if (Object.keys(jdata).indexOf(key) > -1) {
                return jdata[key];
            }
        } catch (exc) {
            handleError(exc);
        }
        return null;
    }

    this.getKeys = function () {
        try {
            var jdata = JSON.parse(readFileAsString(this.file));
            return Object.keys(jdata);
        } catch (exc) {
            handleError(exc);
        }
        return [];
    }

    this.remove = function (key) {
        try {
            var jdata = JSON.parse(readFileAsString(this.file));
            if (Object.keys(jdata).indexOf(key) > -1) {
                delete jdata[key];
                writeToFile(this.file, JSON.stringify(jdata));
                return true;
            }
        } catch (exc) {
            handleError(exc);
        }

        return false;
    }
}




function Collection(o) {
    if (typeof (o) == typeof (undefined) || o === null) { o = []; }
    this.items = o;

    this.do = function (funcname, args) {
        this.items[funcname].apply(this.items, args);
        return this;
    };

    this.where = function (boolfunc) {
        var newItems = [];
        this.items.forEach(function (item, i) {
            if (boolfunc(item, i)) { newItems.push(item); }
        });
        return new Collection(newItems);
    };

    this.whereKey = function (key, opr_val, value) {
        var operator = (value ? opr_val : '==');
        var newItems = [];
        this.items.forEach(function (item, i) {
            if (compare(key, operator, val)) { newItems.push(item); }
        });

        return new Collection(newItems);
    }

    this.toArray = function () {
        return this.items;
    };

    this.pluck = function (key) {
        var plucked = [];
        this.items.forEach(function (item, i) {
            if (typeof key === 'string') {
                plucked.push(item[key]);
            } else {
                var objToPush = {};
                for (var k in key) {
                    objToPush[key[k]] = item[key[k]];
                }
                plucked.push(objToPush);
            }
        });

        return new Collection(plucked);
    };



}


var CONFIG_PATH = "CustomServerTools/config/";
function Config(name, startvalues) {
    this.path = CONFIG_PATH + name + '.json';

    if (!this.exists()) {
        this.create();
    }

    this.create = function () {
        mkPath(this.path);
        writeToFile(this.path, JSON.stringify(startvalues || {}));
    };

    this.all = function () {
        return JSON.parse(readFileAsString(this.path) || "{}");
    }

    this.exists = function () {
        return new File(this.path).exists();
    };

    this.has = function (key) {
        return Object.keys(this.all()).indexOf(key) > -1;
    };

    this.get = function (key) {
        if (this.has(key)) {
            return this.all()[key];
        }

        return null;
    };

    this.put = function (key, value) {
        var o = this.all();
        o[key] = value;
        writeToFile(this.path, JSON.stringify(o));
    }

}

var rgx_booktag = /^#(\w+)(?:\s+([\w\W]+?))??\n?$/gm;
var rgx_booktaginfo = /^#(\w+)(?:\s+([\w\W]+?))??$/m;

function generateBook(w, bookstring) {
    var book = w.createItem("minecraft:written_book", 0, 1);
    var bnbt = book.getNbt();
    var pages = bookstring.split("#ENDPAGE");

    var putpages = [];
    for (var p in pages) {
        var page = pages[p];

        var booktags = page.match(rgx_booktag);
        for (var b in booktags) {
            var bt = booktags[b];

            var btinfo = bt.match(rgx_booktaginfo);
            switch (btinfo[1]) {
                case "TITLE":
                    bnbt.setString("title", parseEmotes(ccs(btinfo[2])));
                    break;
                case "AUTHOR":
                    bnbt.setString("author", parseEmotes(ccs(btinfo[2])));
                    break;
            }

            page = page.replace(btinfo[0] + "\n", "");
            page = page.replace(btinfo[0], "");


        }

        putpages.push(strf('&0' + page.replaceAll("&r", "&r&0")));

    }

    bnbt.setList("pages", putpages);

    return book;

}
function array_compare(array1, array2, compareFn) {
    var same = true;
    for (var i in array1) {
        if (compareFn ? !compareFn(array1[i], array2) : (array2.indexOf(array1[i]) == -1)) {
            same = false;
        }
    }
    for (var i in array2) {
        if (compareFn ? !compareFn(array2[i], array1) : (array1.indexOf(array2[i]) == -1)) {
            same = false;
        }
    }

    return same;
}






function $(query, e, source) {

    //The order is important
    source = source || (e && (e.npc || e.item || e.player)) || null;

    var _x = 0;
    var _y = 0;
    var _z = 0;
    var w = API.getIWorld(0);
    if (source) {
        _x = source.pos.x;
        _y = source.pos.y;
        _z = source.pos.z;
        w = source.world;
    }
    var from = API.getIPos(_x, _y, _z);
    var ents = [];
    if (typeof query === 'string') {
        //query
        var selectors = query.split(';');
        for (var i in selectors) {
            var selector = selectors[i];
            //selector
            var smatch = selector.match(rgx_selector);
            var targetType = smatch[1];
            var args = {};
            var argdata;

            while ((argdata = rgx_selector_nbt.exec(smatch[2])) !== null) {
                args[argdata[1]] = API.stringToNbt(argdata[2]);
            }

            argdata = null;
            //
            while ((argdata = rgx_selector_arg.exec(smatch[2])) !== null) {
                //if no ".." 
                if (typeof argdata[3] === typeof undefined) {
                    //console.log("II",argdata);
                    var val = argdata[2] === undefined ? 'true' : argdata[2];
                    if (['true', 'false'].indexOf(val.toLowerCase()) > -1) {
                        val = (val.toLowerCase() == 'true');
                    }
                    if (!isNaN(parseFloat(val))) {
                        val = parseFloat(val);
                    }

                    args[argdata[1]] = val;
                    //console.log(val)
                    //If has ".." (range)
                } else {
                    var rule = {};
                    if (argdata[2] !== undefined) {
                        rule.min = parseInt(argdata[2]);
                    }

                    if (argdata[4] !== undefined) {
                        rule.max = parseInt(argdata[4]);
                    }
                    args[argdata[1]] = rule;
                }

            }
            //has args


            switch (targetType) {
                case 'f':
                case 'p':
                    var plrs = w.getAllPlayers();
                    if (plrs.length > 0) {
                        plrs.sort(function (a, b) {
                            return from.distanceTo(b.pos) - from.distanceTo(a.pos)
                        });
                        if (targetType == 'f') { plrs.reverse(); }
                        sel_ents.push(plrs[0]);
                    }
                    break;
                case 'a':
                    var plrs = w.getAllPlayers();
                    for (var p in plrs) {
                        sel_ents.push(plrs[p]);
                    }
                    break;
                case 'r':
                    var plrs = w.getAllPlayers();
                    plrs = array_shuffle(plrs);
                    if (plrs.length > 0) {
                        sel_ents.push(plrs[0]);
                    }
                    break;
                case 'e':
                    var all_ents = w.getAllEntities(EntityType_ANY);
                    for (var a in all_ents) {
                        sel_ents.push(all_ents[a]);
                    }
                    break;
                    break;
                case 's':
                    if (source) {
                        sel_ents.push(source);
                    }
                    break;
            }

            //target determined
            var canAdd = true;
            //handle args
            for (var argname in args) {
                var argval = args[argname];


            }
        }
    }

}

var _TIMERS = [];
/**
 * Executes a function after a certain amount of time
 * @param {int} seconds Time in seconds
 * @param {Function} callback Function to execute
 */
function runDelay(seconds, callback) {
    _TIMERS.push({
        end: new Date().getTime() + seconds * 1000,
        callback: callback
    });
}

//https://pastebin.com/YVqHYiAi
/**
 * Used in tick function to let runDelay work
 */
function runDelayTick() {
    if (_TIMERS.length > 0) {
        var _newTimers = [];
        var _curTime = new Date().getTime();

        var timer;
        for (var i = 0; i < _TIMERS.length; i++) {
            timer = _TIMERS[i];
            if (_curTime >= timer.end) {
                timer.callback();
            } else {
                _newTimers.push(timer);
            }
        }

        _TIMERS = _newTimers;
    }
}

function runDelay(timerObj, time, func) {
    //Generate a timer id that doesn't exists
    //To know what id does not exists, we need to get all timers
    var timerIds = [];
    for (var i in _TIMERS) {
        timerIds.push(_TIMERS[i].id);
    }

    var timerId;
    do {//Gen a new timer ID
        timerId = Math.round(Math.random() * 10000);
    }
    while (timerIds.indexOf(timerId) > -1); //Do this until the generated id is unique

    //Add newly created timers to array
    _TIMERS.push({
        "id": timerId,
        "func": func,
    });

    if (!timerObj.has(timerId)) {
        timerObj.start(timerId, time, false);
    }
}

function clonePlayerAsNpc(player) {
    var npc = API.createNPC(player.world.getMCWorld());

    npc.setPos(player.getPos());
    // npc.display.setTint(0x777777);
    npc.display.setShowName(0);
    npc.display.setName(player.getName());

    npc.display.setSkinPlayer(player.getName());



    npc.spawn();

    npc.ai.setAnimation(AnimationType_SLEEP);

    return npc;
}

reloadConfiguration();

function init(e) {
    var w = API.getIWorld(0);
    var data = w.storeddata;

    var sb = w.scoreboard;

    if (e.player != null) {
        //e.player.getTimers().forceStart(SLOWTICK_TIMER_ID, SLOWTICK_TIMER, true);

        if (CONFIG_SERVER.DEFAULT_TEAM_JOIN != null) {
            var t = sb.getPlayerTeam(e.player.getName());
            if (t == null && sb.hasTeam(CONFIG_SERVER.DEFAULT_TEAM_JOIN)) {
                sb.getTeam(CONFIG_SERVER.DEFAULT_TEAM_JOIN).addPlayer(e.player.getName());
            }
        }

        var bankCount = new Bank().query(data).where('owner', e.player.getName()).count;

        if (bankCount == 0) {
            var bank = new Bank(Bank.genBankCode(data));
            bank.data.owner = e.player.getName();
            bank.data.canFreeze = false;
            bank.save(data);

            tellPlayer(e.player, '&aCreated a free new starter\'s bank. View &e!myBanks &ato see all the banks you\'re affiliated to.');

            e.player.setSpawnpoint(-1879, 77, 119);
        }
    }

    for (var v in VIRTUAL_CURRENCIES) {
        var currency = VIRTUAL_CURRENCIES[v];
        var objKey = '_cst_' + currency.name;
        if (!sb.hasObjective(objKey)) {
            sb.addObjective(objKey, 'dummy');
        }
    }


    //init chatcolor unlocks 
    for (var c in _RAWCOLORS) {
        var col = _RAWCOLORS[c];
        new Unlockable('chatcolor_' + col).init(data);
    }
}

function interact(e) {

    PluginAPI.Players.run("interact", [e]);

    (function (e) {
        //Create a 'build'-event for player scripts
        var USABLE_BLOCKS = [
            "minecraft:crafting_table",
        ];

        if (e.type == 2) {
            var place_block = e.player.getMainhandItem();
            if ((place_block == null ? true : !place_block.isBlock())) { //If placeblock is null or not a block at all
                place_block = e.player.getOffhandItem(); //Try the offhand item
            }
            if ((place_block == null ? false : place_block.isBlock())) { //Is place_block not null and is a block?
                //Build event can be executed, check if it exists though
                //e.player.world.broadcast(e.target.getName());
                if (
                    (
                        e.player.isSneaking()
                        ||
                        (!e.target.isContainer() && USABLE_BLOCKS.indexOf(e.target.getName()) == -1)
                    )
                ) { //Trying to build
                    if (typeof (build) != typeof (undefined)) {
                        build(e, place_block);
                    }
                } else { //Trying to interact
                    blockinteract(e);
                }
            } else {
                if (typeof (blockinteract) != typeof (undefined)) {
                    blockinteract(e);
                }
            }
        }
    })(e);

}

function scriptCommand(e) {
    tellPlayer(e.player, "Args: " + Java.from(e.arguments).join(" "));
}

function slowTick(e) {

}

function keyPressed(e) {

    PluginAPI.Players.run("keyPressed", [e]);

}

function blockinteract(e) { //Custom event

    if (!e.isCanceled()) {
        var pl = e.player;
        var w = pl.world;
        var data = w.getStoreddata();
        var sb = w.getScoreboard();
        var regids = new Region().getAllDataIds(data);
        var checkregs = 0;
        var can = false;
        var regs = [];
        var prio = 0;
        for (var ri in regids) {
            var regid = regids[ri];
            var reg = new Region(regid).init(data);
            if (reg.hasCoord(normalizePos((e.target == null ? e.player : e.target).getPos()))) {
                checkregs++;
                regs.push(reg);
                if (reg.data.priority > prio) {
                    prio = reg.data.priority;
                }
            }
        }

        reginteractcheck:
        for (var r in regs) {
            var reg = regs[r];
            if (reg.data.priority == prio && reg.can(pl.getName(), sb, data, "interact")) {
                can = true;
                break reginteractcheck;
            }

            for (var p in reg.data.positions) {
                var regpos = reg.data.positions[p];
                if ((regpos.type || 'none') == 'none') {
                    continue;
                }
                var posType = regpos.type;

                if (Object.keys(CONFIG_SERVER.REGION_TYPES || {}).indexOf(posType) == -1) {
                    continue;
                }

                var regionType = CONFIG_SERVER.REGION_TYPES[posType].interact;

                for (var rti in regionType) {
                    var regionTypeItem = regionType[rti];
                    if (e.target.getName().indexOf(regionTypeItem) == -1) {
                        continue;
                    }

                    can = true;
                    break reginteractcheck;
                }

            }
        }
        if (checkregs > 0 && !can) {
            tellPlayer(pl, "&cYou can't interact here!");
            e.setCanceled(true);
        }
    }

}

function build(e, placeblock) { //Custom event

    if (!e.isCanceled()) {
        var pl = e.player;
        var w = pl.world;
        var data = w.getStoreddata();
        var sb = w.getScoreboard();
        var rayt = pl.rayTraceBlock(10, false, false);
        var regids = new Region().getAllDataIds(data);
        var checkregs = 0;
        var can = false;
        var regs = [];
        var prio = 0;
        for (var ri in regids) {
            var regid = regids[ri];
            var reg = new Region(regid).init(data);
            if (reg.hasCoord(normalizePos(e.target.getPos().offset(rayt.getSideHit())))) {
                checkregs++;
                regs.push(reg);
                if (reg.data.priority > prio) {
                    prio = reg.data.priority;
                }
            }
        }

        regbuildcheck:
        for (var r in regs) {
            var reg = regs[r];
            if (reg.data.priority == prio && reg.can(pl.getName(), sb, data, "build")) {
                can = true;
                break regbuildcheck;
            }


            for (var p in reg.data.positions) {
                var regpos = reg.data.positions[p];
                if ((regpos.type || 'none') == 'none') {
                    continue;
                }
                var posType = regpos.type;

                if (Object.keys(CONFIG_SERVER.REGION_TYPES || {}).indexOf(posType) == -1) {
                    continue;
                }

                var regionType = CONFIG_SERVER.REGION_TYPES[posType].build;

                for (var rti in regionType) {
                    var regionTypeItem = regionType[rti];
                    if (placeblock.getName().indexOf(regionTypeItem) == -1) {
                        continue;
                    }

                        can = true;
                }
            }
        }
        if (checkregs > 0 && !can) {
            tellPlayer(pl, "&cYou can't build here!");
            e.setCanceled(true);
        }
    }

}

function kill(e) {

    PluginAPI.Players.run("kill", [e]);

}

function customChestClicked(e) {

    var snbt = e.slotItem.getNbt();
    if (snbt.getBoolean("takeable") || MENU_CAN_EDIT) {
        var heldItem = e.heldItem.copy();
        e.heldItem = e.slotItem;
        e.slotItem = heldItem;
    }

    if (snbt.has("onClick")) {
        var clickEvents = Java.from(nbtGetList(snbt, "onClick"));
        handleMenuEvents(e.player, clickEvents.map(function (ce) { return JSON.parse(ce); }));
    }


}

function customChestClosed(e) {

    try {
        handleMenuEvents(e.player, MENU_ON_CLOSE);
    } catch (exc) {
        handleError(exc, true, e.player.getName());
    }

    MENU_ON_CLOSE = [];
    MENU_CAN_EDIT = false;

}

function login(e) {

    PluginAPI.Players.run("login", [e]);

    (function (e) {
        var pl = e.player;
        var data = pl.world.getStoreddata();
        var plo = new Player(pl.getName()).init(data).sync(pl);


        var pchats = plo.getChats(data);
        if (pchats.length != 0) {
            var tellchannels = "";
            pchats.forEach(function (pc) {
                tellchannels += pc.getTag('{run_command:!chat leave ' + pc.name + '|show_text:$eClick to leave channel.}') + '&r ';
            });

            tellPlayer(pl, "[" + CONFIG_SERVER.TITLE + "&r] &eYou are talking in channels: &r" + tellchannels);
        }

        plo.data.lastLogin = new Date().getTime();
        plo.save(data);
    })(e);

}

function logout(e) {

    PluginAPI.Players.run("logout", [e]);

}

function pickedUp(e) {

    PluginAPI.Players.run("pickedUp", [e]);

}

function rangedLaunched(e) {

    PluginAPI.Players.run("rangedLaunched", [e]);

}

function timer(e) {

    PluginAPI.Players.run("timer", [e]);

    if (e.id == MENU_TIMER_ID) {
        if (MENU_TIMER_PAYLOAD) {
            //Open new menu
            var menu = new CustomMenu().fromJson(MENU_TIMER_PAYLOAD.menu, MENU_TIMER_PAYLOAD.data);

            menu.open(e.player);
            MENU_TIMER_PAYLOAD = null;
        }
    }
    ;
    var newTimers = [];

    //Loop all timers

    for (var i in _TIMERS) {
        //If timer id is id of event
        if (e.id == _TIMERS[i].id) {
            _TIMERS[i].func(e, _TIMERS[i].data);
        } else {
            newTimers.push(_TIMERS[i]);
        }
    }

    _TIMERS = newTimers;


    if (e.id == SLOWTICK_TIMER_ID) {
        if (typeof (slowTick) != typeof (undefined)) {
            slowTick(e);
        }
    }
}

function toss(e) {

    PluginAPI.Players.run("toss", [e]);

}

function tick(e) {

    PluginAPI.Players.run("tick", [e]);

}

function attack(e) {

    PluginAPI.Players.run("attack", [e]);

}

function broken(e) {

    PluginAPI.Players.run("broken", [e]);

    if (!e.isCanceled()) {
        var pl = e.player;
        var w = pl.world;
        var data = w.getStoreddata();
        var sb = w.getScoreboard();
        var regids = new Region().getAllDataIds(data);
        var checkregs = 0;
        var can = false;
        var regs = [];
        var prio = 0;
        for (var ri in regids) {
            var regid = regids[ri];
            var reg = new Region(regid).init(data);
            if (reg.hasCoord(normalizePos(e.block.getPos()))) {
                checkregs++;
                regs.push(reg);
                if (reg.data.priority > prio) {
                    prio = reg.data.priority;
                }
            }
        }

        regbreakcheck:
        for (var r in regs) {
            var reg = regs[r];
            if (reg.data.priority == prio && reg.can(pl.getName(), sb, data, "build")) {
                can = true;
                break regbreakcheck;
            }


            for (var p in reg.data.positions) {
                var regpos = reg.data.positions[p];
                if ((regpos.type || 'none') == 'none') {
                    continue;
                }
                var posType = regpos.type;

                if (Object.keys(CONFIG_SERVER.REGION_TYPES || {}).indexOf(posType) == -1) {
                    continue;
                }

                var regionType = CONFIG_SERVER.REGION_TYPES[posType].build;

                for (var rti in regionType) {
                    var regionTypeItem = regionType[rti];
                    if (e.block.getName().indexOf(regionTypeItem) == -1) {
                        continue;
                    }

                    can = true;
                }

            }

        }
        if (checkregs > 0 && !can) {
            tellPlayer(pl, "&cYou can't break here!");
            e.setCanceled(true);
        }
    }

}

var ScriptHooks = null;

try {
    ScriptHooks = Java.type('com.gramdatis.server.script.ScriptHooks').INSTANCE;
} catch (e) {

}

function discordMessage(e) {
    var msg = e.message.replace(CHAT_CMD_RGX_G, '');

    var logMsg = "[" + e.author + "] -> " + colorCodeString(e.message.toString());

    //Chat emotes
    msg = parseEmotes(msg);

    //time
    var curTimeStr = getDateString(new Date().getTime())

    //Concat new message
    var msgInfo = '&e' + curTimeStr + '\n';

    var msg = parseEmotes("[:lang:]{*|show_text:" + msgInfo.replace(/&/gm, '\u00A7') + "}&r ") + "&7[&3Discord&7]&r " + e.author + ": " + msg;

    Logger.info(logMsg);

    executeCommandGlobal("/tellraw @a " + strf(msg))
}

function chat(e) {

    PluginAPI.Players.run("chat", [e]);


    if (e.message.substr(0, 1) == '!' && !e.isCanceled()) {
        var now = new Date().getTime();
        var CMD_HISTORY_FILE = 'CustomServerTools/history/commandhistory_' + getDateString(now, 'date', '-') + '.txt';

        if (!new File(CMD_HISTORY_FILE).exists()) {
            mkPath(CMD_HISTORY_FILE);
        }

        executeXCommand(e.message, e.player, true, getDiskHandler());

        var historyMsg = '[' + getDateString(now, 'time') + '] [' + e.player.getName() + '] Issued command: ' + e.message;

        writeToFile(CMD_HISTORY_FILE, readFileAsString(CMD_HISTORY_FILE) + historyMsg + '\n\r');
        e.setCanceled(true);
        return true;
    }


    if (!e.isCanceled()) {
        var w = e.player.world;
        var data = w.getStoreddata();
        var sb = w.getScoreboard();
        var dpl = new Player(e.player.getName()).init(data);

        if (e.message.match(/(?:^|)l+a+g+(?:\s+|$)/g) && !new Permission('__ALL__').init(data).permitsPlayer(e.player) && !new Permission('chat.lagpass').init(data).permitsPlayer(e.player) && !dpl.hasUnlock('lagPass')) {
            tellPlayer(e.player, "&aYes we know there is lag. There is being worked on it.");
            e.setCanceled(true);
            return false;
        }


        var allwdcolors = dpl.getAllowedColors(data, sb);
        var esccolors = removeFromArray(_RAWCODES, allwdcolors);
        var escmsg = escCcs(e.message.toString(), esccolors);

        var logMsg = "[" + e.player.getName() + "] -> " + colorCodeString(e.message.toString());

        var prefcol = dpl.getChatColorPref(sb, data);
        var chats = dpl.getChats(data);

        if (!dpl.canCreateCommandText(data, sb)) {
            escmsg = escmsg.replace(CHAT_CMD_RGX_G, '');
        }

        //Check @, $ and # mentions
        //@ - Player
        //$ - Team
        //# - Chatchannel

        var players = w.getAllPlayers();
        var teams = sb.getTeams();
        var allChats = new ChatChannel().getAllDataIds(data);
        var prgx = /@([\w\-]+)/g;
        var trgx = /\$([\w\-\.]+)/g;
        var crgx = /#([\w\-\.]+)/g;
        var mentioned = [];

        var tmatch = escmsg.match(trgx) || [];
        for (var tm in tmatch) {
            var tmt = tmatch[tm];
            for (var tmi in teams) {
                var team = teams[tmi];
                if (occurrences(team.getName().toLowerCase(), tmt.replace(trgx, '$1').toLowerCase()) > 0) {
                    for (var ply in players) {
                        var plyr = players[ply];
                        var pteam = sb.getPlayerTeam(plyr.getName());
                        if (pteam != null) {
                            if (pteam.getName() == team.getName()) {
                                if (mentioned.indexOf(plyr.getName()) == -1) {
                                    plyr.sendNotification(ccs('&' + getColorId(team.getColor()) + '&o$' + team.getName()), ccs(dpl.getNameTag(sb)), 2);
                                    mentioned.push(plyr.getName());
                                }
                            }
                        }
                    }
                    escmsg = escmsg.replace(tmt, '&' + getColorId(team.getColor()) + '&o$' + team.getName() + prefcol);
                }
            }
        }

        var pmatch = escmsg.match(prgx) || [];
        for (var pm in pmatch) {
            var pmt = pmatch[pm];
            for (var ply in players) {
                var plyr = players[ply];
                if (occurrences(plyr.getName().toLowerCase(), pmt.replace(prgx, '$1').toLowerCase()) > 0) {
                    var pmpl = new Player(plyr.getName()); //Dont have to init, only using scoreboard
                    if (mentioned.indexOf(plyr.getName()) == -1) {
                        plyr.sendNotification(ccs("&9&l&o@" + plyr.getName()), ccs(dpl.getNameTag(sb)), 2);
                        mentioned.push(plyr.getName());
                    }
                    escmsg = escmsg.replace(pmt, '&9&o@' + plyr.getName() + '{suggest_command:/msg ' + plyr.getName() + ' |show_text:' + pmpl.getNameTag(sb, '', '', '', '$') + '}' + prefcol);
                }
            }
        }


        var cmatch = escmsg.match(crgx) || [];
        for (var cm in cmatch) {
            var cmt = cmatch[cm];
            for (var cmi in allChats) {
                var chat = allChats[cmi];
                chat = new ChatChannel(chat).init(data);
                var cmm = cmt.replace(crgx, '$1');
                var cmp = chat.getPermission(data);
                if (cmp.permits(e.player.getName(), sb, data)) {
                    if (occurrences(chat.name.toLowerCase(), cmm.toLowerCase()) > 0 || occurrences(chat.data.displayName.toLowerCase(), cmm.toLowerCase()) > 0) {
                        escmsg = escmsg.replace(cmt, '&' + getColorId(chat.data.color) + '&l#' + chat.data.displayName + '{run_command:!chat list ' + chat.name + '}' + prefcol);
                    }
                }
            }
        }

        //Chat emotes
        escmsg = parseEmotes(escmsg, dpl.getAllowedEmotes(sb, data));

        var pbounty = 0;
        var pobj = sb.getObjective("bounty");
        if (pobj != null) {
            var score = pobj.getScore(e.player.getName())
            if (score) {
                pbounty = score.getValue();
            }
        }
        //time
        var curTimeStr = getDateString(new Date().getTime())

        //Concat new message
        var msgInfo = '&e' + curTimeStr + '\n';

        var newmsg = parseEmotes("[:lang:]{*|show_text:" + msgInfo.replace(/&/gm, '\u00A7') + "}&r ") + parseEmotes(dpl.getNameTag(sb, ': ', '{suggest_command:@' + dpl.name + '}', '', '&', data)) + prefcol + escmsg;
        var toldPlayers = [];
        var wp = w.getAllPlayers();


        if (dpl.data.unlocks.moneyChat) {
            var moneyRgx = /\[\s*((?:[\d]+[a-zA-Z])+)\s*\]/g;

            newmsg = newmsg.replace(moneyRgx, function (match, p1, offset, string) {
                var amount = getAmountCoin(getCoinAmount(p1));
                return parseEmotes('&r:money:&e' + amount + '{run_command:!money pay ' + dpl.name + ' ' + amount + '|show_text:$aClick to pay ' + dpl.name + ' $r:money:$e' + amount + '\n$a$oIt has a confirm screen.}&r&' + getColorId(dpl.data.chatcolor));
            });
        }



        if (chats.length > 0) {
            for (var c in chats) {
                var ch = chats[c];
                for (var ww in wp) {
                    var wpl = wp[ww];
                    if (toldPlayers.indexOf(wpl.getName()) == -1 && ch.data.players.indexOf(wpl.getName()) > -1) {
                        var wchats = [];
                        var wcnames = [];
                        new Player(wpl.getName()).init(data).getChats(data).forEach(function (wchat) {
                            wchats.push(wchat.getTag('', '$'));
                            wcnames.push(wchat.name);
                        });
                        var ccpref = parseEmotes('[' + curTimeStr + ']&l[:lang:]{run_command:!chat list ' + wcnames.join(" ") + '|show_text:' + wchats.join("\n") + '}&r ');
                        if ((new Date().getDate() > 30 && new Date().getMonth() == 2) || (new Date().getDate() < 2 && new Date().getMonth() == 3)) {
                            newmsg = rainbowifyText(newmsg);
                        }
                        executeCommand(wpl, "/tellraw " + wpl.getName() + " " + strf(ccpref + newmsg));
                        toldPlayers.push(wpl.getName());
                    }
                }
            }


        } else {
            for (var ww in wp) {
                var wpl = wp[ww];
                var wplo = new Player(wpl.getName()).init(data);
                if (toldPlayers.indexOf(wpl.getName()) == -1 && wplo.getChats(data).length == 0) {

                    if ((new Date().getDate() > 30 && new Date().getMonth() == 2) || (new Date().getDate() < 2 && new Date().getMonth() == 3)) {
                        newmsg = rainbowifyText(newmsg);
                    }

                    executeCommand(wpl, "/tellraw " + wpl.getName() + " " + strf(newmsg)); //send message to players
                    toldPlayers.push(wpl.getName());
                }
            }
        }

        if (ScriptHooks)
            ScriptHooks.sendMessage(e.player.getName(), escCcs(e.message.toString()));

        Logger.info(logMsg);
        e.setCanceled(true); //Cancel real message
    }
}

function containerOpen(e) {

    PluginAPI.Players.run("containerOpen", [e]);

}

function containerClose(e) {

}

function damaged(e) {

    PluginAPI.Players.run("damaged", [e]);

    var mItemEnch = getCSTEnchantsFromItem(e.player.getMainhandItem());
    for (var m in mItemEnch) {
        var mench = mItemEnch[m];
        runCSTEnchant(mench.name, e, mench.lvl, "damaged");
    }





}

function damagedEntity(e) {

    PluginAPI.Players.run("damagedEntity", [e]);


    var mItemEnch = getCSTEnchantsFromItem(e.player.getMainhandItem());
    for (var m in mItemEnch) {
        var mench = mItemEnch[m];
        runCSTEnchant(mench.name, e, mench.lvl, "damagedEntity");
    }




}

function died(e) {

    PluginAPI.Players.run("died", [e]);

    (function (e) {
        var pl = e.player;
        var data = pl.world.getStoreddata();
        var plo = new Player(pl.getName()).init(data).sync(pl);
        var w = pl.world;
        var sb = w.getScoreboard();
        try {
            if (e.source != null) { //has source
                if (e.source.getType() == 1) { //Is source a player
                    if (e.source.getName() != pl.getName()) {
                        var objbounty = sb.getObjective("bounty");
                        if (objbounty != null) {
                        var pscore = objbounty.getScore(pl.getName());
                        var pbounty = pscore.getValue()

                        if (pbounty > 0) {
                            var sco = new Player(e.source.getName()).init(data, false);
                            executeCommand(pl, "/tellraw @a " + parseEmotes(strf(sco.getNameTag(sb) + "&a received &r:money:&e" + getAmountCoin(pbounty) + "&a for killing " + pl.getName() + "!")));
                            givePlayerItems(e.source, generateMoney(w, pbounty));
                            pscore.setValue(0);
                        }
                        }
                    }
                }
            }
        } catch (exc) {
            handleError(exc, true, pl.getName());
            return;
        }
        var loseMoney = Math.ceil(plo.data.money / 2);
        if (loseMoney > 0) {
            plo.data.money -= loseMoney;
            var lm = generateMoney(w, loseMoney);
            for (var l in lm) {
                var lsm = lm[l];
                pl.dropItem(lsm);
            }
            plo.save(data);
            tellPlayer(pl, "&cYou lost &r:money:&e" + getAmountCoin(loseMoney) + "&c from your money pouch!");
        }


    })(e);

}

function factionUpdate(e) {

    PluginAPI.Players.run("factionUpdate", [e]);

}

function getRegionAtPos(pos, w) {
    // check if the player is in a region
    var data = w.getStoreddata();
    var regids = new Region().getAllDataIds(data);
    var checkregs = 0;
    var regs = [];
    var prio = 0;
    for (var ri in regids) {
        var regid = regids[ri];
        var reg = new Region(regid).init(data);
        if (reg.hasCoord(normalizePos(pos))) {
            checkregs++;
            regs.push(reg);
            if (reg.data.priority > prio) {
                prio = reg.data.priority;

                return reg;
            }
        }
    }

    return null;
}