load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

var gramados_json = loadJson("world/customnpcs/scripts/configs/gramados_data.json");

var _RAWCOLORS = gramados_json._RAWCOLORS;
var _RAWEFFECTS = gramados_json._RAWEFFECTS;
var _RAWCODES = gramados_json._RAWCODES;
var CHAT_EMOTES = gramados_json.CHAT_EMOTES;
var CHAT_CMD_RGX = gramados_json.CHAT_CMD_RGX;


/**
 * Sends a formatted message to the player.
 * @param {IPlayer} player - The player to send the message to.
 * @param {string} rawtext - The raw text message.
 * @returns {boolean} The result of the command execution.
 */
function tellPlayer(player, rawtext) {
    if ((new Date().getDate() > 30 && new Date().getMonth() == 2) || (new Date().getDate() < 2 && new Date().getMonth() == 3)) {
        rawtext = rainbowifyText(rawtext);
    }
    try {
        return executeCommand(player, "/tellraw " + player.getName() + " " + parseEmotes(strf(rawtext)));
    }
    catch (e) {
        return false;
    }
}

/**
 * Applies a rainbow color effect to the given text.
 * Skips adding color codes to existing color codes (the '&' character).
 * @param {string} text - The text to rainbowify.
 * @returns {string} The rainbow-colored text.
 */
function rainbowifyText(text) {
    var rainbowText = '';
    var colorIndex = 0;
    var color_keys = getJsonKeys(_RAWCOLORS);
    var stack = []; // Stack to handle recursive brackets
    var skipRainbow = false;

    for (var i = 0; i < text.length; i++) {
        var char = text.charAt(i);

        // Handle opening brackets
        if ((char === '[' || char === '{') && !skipRainbow) {
            stack.push(char === '[' ? ']' : '}');
            skipRainbow = true;
        }

        // Handle closing brackets
        if (skipRainbow && stack.length > 0 && char === stack[stack.length - 1]) {
            stack.pop();
            if (stack.length === 0) {
                skipRainbow = false;
            }
        }

        if (skipRainbow || ((char === '&' || char === '$') && i + 1 < text.length && (includes(color_keys, text.charAt(i + 1)) || _RAWEFFECTS[text.charAt(i + 1)]))) {
            // Skip adding color codes to existing color codes or within skip sections or formatting tags
            rainbowText += char;
            if (char === '&' || char === '$') {
                rainbowText += text.charAt(i + 1);
                i++; // Skip the next character as it's part of the color code or formatting tag
            }
        } else {
            // Get the color code for the current character
            var colorCode = color_keys[colorIndex % color_keys.length];
            rainbowText += '&' + colorCode + char;
            colorIndex++;
        }
    }

    return rainbowText; // Return the rainbow text
}

/**
 * Sends a formatted message to a target player.
 * @param {IPlayer} player - The player sending the message.
 * @param {string} target - The target player name to send the message to.
 * @param {string} rawtext - The raw text message.
 * @returns {boolean} The result of the command execution.
 */
function tellTarget(player, target, rawtext) {
    return executeCommand(player, "/tellraw " + target + " " + parseEmotes(strf(rawtext)));
}

/**
 * Sends a title message to a player.
 * @param {IPlayer} player - The player to send the title to.
 * @param {string} rawtext - The raw text message.
 * @param {string} [type="actionbar"] - The type of title message.
 * @param {string} [target] - The target player name to send the title to.
 * @returns {boolean} The result of the command execution.
 */
function tellPlayerTitle(player, rawtext, type, target) {
    if (typeof (type) == typeof (undefined) || type === null) { type = "actionbar"; }
    return executeCommand(player, "/title " + (target || player.getName()) + " " + type + " " + parseEmotes(strf(rawtext)))
}

/**
 * Sends multiple formatted messages to a player.
 * @param {IPlayer} player - The player to send the messages to.
 * @param {Array<string>} ar - The array of raw text messages.
 */
function storytellPlayer(player, ar) {
    for (var i in ar) {
        var ari = ar[i];
        tellPlayer(player, ari);
    }
}

/**
 * Gets the color ID for a given color name.
 * @param {string} name - The color name.
 * @returns {string} The color ID.
 */
function getColorId(name) {
    for (var i in _RAWCOLORS) {
        if (name == _RAWCOLORS[i]) {
            return i;
        }
    }
    for (var i in _RAWEFFECTS) {
        var re = _RAWEFFECTS[i];
        if (name == re) {
            return i;
        }
    }
    return 'r';
}

/**
 * Gets the color name for a given color ID.
 * @param {string} id - The color ID.
 * @returns {string} The color name.
 */
function getColorName(id) {
    for (var i in _RAWCOLORS) {
        var rc = _RAWCOLORS[i];
        if (id == i) {
            return rc;
        }
    }
    for (var i in _RAWEFFECTS) {
        var re = _RAWEFFECTS[i];
        if (id == i) {
            return re;
        }
    }
    return 'white';
}

/**
 * Strips color codes from a string.
 * @param {string} str - The string to strip color codes from.
 * @returns {string} The string without color codes.
 */
function stripColors(str) {
    for (var i in _RAWCODES) {
        var rawcode = _RAWCODES[i];
        str = str.replaceAll('&' + rawcode, '');
    }

    return str;
}

/**
 * Converts a string to a slug.
 * @param {string} text - The text to slugify.
 * @returns {string} The slugified text.
 */
function slugify(text) {
    text = stripColors(text);
    return text.toString().toLowerCase()
        .replace(/\s+/g, '_') // Replace spaces with _
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/__+/g, '_') // Replace multiple _ with single _
        .replace(/^_+/, '') // Trim _ from start of text
        .replace(/_+$/, ''); // Trim _ from end of text
}

/**
 * Color codes a string.
 * @param {string} str - The string to color code.
 * @param {Array<string>} [af] - Allowed formats.
 * @returns {string} The color-coded string.
 */
function ccs(str, af) {
    if (typeof (af) == typeof (undefined) || af === null) { af = null; }
    return colorCodeString(str, af);
}

/**
 * Color codes a string with allowed formats.
 * @param {string} str - The string to color code.
 * @param {Array<string>} [allowed_formats] - Allowed formats.
 * @returns {string} The color-coded string.
 */
function colorCodeString(str, allowed_formats) {
    if (typeof (allowed_formats) == typeof (undefined) || allowed_formats === null) { allowed_formats = null; }
    if (allowed_formats == null) {
        allowed_formats = Object.keys(_RAWCOLORS).concat(Object.keys(_RAWEFFECTS));
    }
    allowed_formats = removeFromArray(allowed_formats, ['x', 'y']);
    return str.replace(new RegExp("&([" + allowed_formats.join("") + "])", 'g'), '\u00A7$1').replace(/&\\/g, '&');
}

/**
 * Escapes color codes in a string.
 * @param {string} str - The string to escape color codes from.
 * @param {Array<string>} [esc_formats] - Formats to escape.
 * @returns {string} The string without escaped color codes.
 */
function escCcs(str, esc_formats) {
    if (typeof (esc_formats) == typeof (undefined) || esc_formats === null) { esc_formats = null; }
    if (esc_formats == null) {
        esc_formats = _RAWCODES;
    }

    return str.replace(new RegExp('&([' + esc_formats.join("") + '])', 'g'), '');
}

/**
 * Formats a chat message with the given parameters.
 * @param {string} playerName - The name of the player.
 * @param {string} teamName - The name of the team.
 * @param {string} colorCode - The color code for the message.
 * @param {string} message - The message content.
 * @returns {string} - The formatted chat message.
 */
function formatChatMessage(playerName, teamName, colorCode, message) {
    var curTimeStr = new Date().toLocaleTimeString("fr-FR").split(":");
    curTimeStr.pop();
    curTimeStr = curTimeStr.join(":");
    var ccode = getColorId(colorCode);
    return "[" + curTimeStr + "] &l&" + ccode + "[&" + ccode + teamName + "&r &" + ccode + playerName + "&l&" + ccode + "] -> &r" + message;
}

/**
 * Gets the chat tag for a player.
 * @param {string} playerName - The name of the player.
 * @param {string} teamName - The name of the team.
 * @param {string} colorCode - The color code for the tag.
 * @returns {string} - The formatted chat tag.
 */
function getChatTag(playerName, teamName, colorCode) {
    var ccode = getColorId(colorCode);
    return "&" + ccode + "&l[&" + ccode + "&o" + teamName + "&r &" + ccode + playerName + "&" + ccode + "&l]";
}

/**
 * Parses emotes in a string.
 * @param {string} str - The string to parse.
 * @param {Array<string>} [allwd] - Allowed emotes.
 * @param {boolean} [replaceOld=false] - Whether to replace old emotes.
 * @returns {string} The string with parsed emotes.
 */
function parseEmotes(str, allwd, replaceOld) {
    if (typeof (allwd) == typeof (undefined) || allwd === null) {
        allwd = Object.keys(CHAT_EMOTES);
    }
    if (typeof (replaceOld) == typeof (undefined) || replaceOld === null) {
        replaceOld = false;
    }
    if (replaceOld) {
        str = str.replace(/:([\w]+):/g, function (match, p1) {
            return (p1 in CHAT_EMOTES ? CHAT_EMOTES[p1] : match);
        });
    }
    for (var ce in CHAT_EMOTES) {
        if (allwd.indexOf(ce) > -1) {
            str = str.replace(new RegExp(":" + ce + ":", "g"), CHAT_EMOTES[ce]);
        }
    }
    return str;
}

/**
 * Formats a string with color codes.
 * @param {string} str - The string to format.
 * @param {boolean} [toRaw=false] - Whether to convert to raw format.
 * @param {Array<string>} [allowed] - Allowed color codes.
 * @returns {string} The formatted string.
 */
function strf(str, toRaw, allowed) {
    if (typeof (toRaw) == typeof (undefined) || toRaw === null) { toRaw = true; }
    if (typeof (allowed) == typeof (undefined) || allowed === null) { allowed = null; }
    return strrawformat(str, toRaw, allowed);
}

/**
 * Formats a string with raw color codes.
 * @param {string} str - The string to format.
 * @param {boolean} [toRaw=false] - Whether to convert to raw format.
 * @param {Array<string>} [allowed] - Allowed color codes.
 * @returns {string} The formatted string.
 */
function strrawformat(str, toRaw, allowed) {
    if (typeof (toRaw) == typeof (undefined) || toRaw === null) { toRaw = false; }
    var rf = [];
    var txt = '';
    var ri = -1;
    var isCode = false;
    var txtColor = 'white';
    var isItalic = false;
    var isBold = false;
    var isStrike = false;
    var isUnderlined = false;
    var isObf = false;
    str = str + '&r ';

    for (var i = 0; i < str.length; i++) {
        var c = str.substr(i, 1);
        if (c == '&' || i == str.length - 1) {
            //Check if new section has to be made
            if (txt.length > 0) {
                ri++;
                var cmds = [];

                rf.push([txt, txtColor, isItalic, isBold, isUnderlined, isStrike, isObf]);
                isItalic = false;
                isBold = false;
                isUnderlined = false;
                isStrike = false;
                isObf = false;
                txtColor = 'white';
                txt = '';
            }
            isCode = true;
            continue;
        } else {
            if (!isCode) {
                txt += c.toString();
            } else {
                //Check Colors
                if (typeof (_RAWCOLORS[c]) != typeof (undefined)) {
                    txtColor = _RAWCOLORS[c];
                }
                //Check Markup
                switch (c.toString()) {
                    case 'o': {
                        isItalic = true;
                        break;
                    }
                    case 'l': {
                        isBold = true;
                        break;
                    }
                    case 'n': {
                        isUnderlined = true;
                        break;
                    }
                    case 'm': {
                        isStrike = true;
                        break;
                    }
                    case 'k': {
                        isObf = true;
                        break;
                    }
                    case 'r': {
                        isItalic = false;
                        isBold = false;
                        isUnderlined = false;
                        isStrike = false;
                        isObf = false;
                        txtColor = 'white';
                        break;
                    }
                }
                isCode = false;
            }
        }
    }

    return (!toRaw ? rf : rawformat(rf, true));
}

/**
 * Formats a string with raw color codes.
 * @param {Array<string>} str_pieces - The string pieces to format.
 * @param {boolean} [fullraw=false] - Whether to convert to full raw format.
 * @param {Array<string>} [allowed] - Allowed color codes.
 * @returns {string} The formatted string.
 */
function rawformat(str_pieces, fullraw, allowed) {
    if (typeof (fullraw) == typeof (undefined) || fullraw === null) { fullraw = true; }
    if (typeof (allowed) == typeof (undefined) || allowed === null) { allowed = null; }
    if (allowed == null) {
        allowed = Object.keys(_RAWCOLORS).concat(Object.keys(_RAWEFFECTS)).concat(['x', 'y']);

    }
    var txt = '';
    if (fullraw) { txt += '[""'; }

    for (var i in str_pieces) {
        var p = str_pieces[i];
        var ntext = p[0].replace(/\"/g, '\\"');
        var nm = ntext.match(CHAT_CMD_RGX) || [];
        if (nm.length > 0) {
            p[7] = nm[1];
            p[8] = nm[2];
            p[9] = nm[3];
            p[10] = nm[4];
            ntext = ntext.replace(nm[0], '');
        }
        var pc = '{"text":"' + ntext + '"';
        if (p[1]) {
            if (allowed.indexOf(getColorId(p[1])) == -1) {
                p[1] = 'white';
            }

            pc += ',"color":"' + p[1].toString() + '"';

        }
        if (p[2]) {
            if (allowed.indexOf('o') > -1) {
                pc += ',"italic":true';
            }
        }
        if (p[3]) {
            if (allowed.indexOf('l') > -1) {
                pc += ',"bold":true';
            }
        }
        if (p[4]) {
            if (allowed.indexOf('n') > -1) {
                pc += ',"underlined":true';
            }
        }
        if (p[5]) {
            if (allowed.indexOf('m') > -1) {
                pc += ',"strikethrough":true';
            }
        }
        if (p[6]) {
            if (allowed.indexOf('k') > -1) {
                pc += ',"obfuscated":true';
            }
        }

        if (p[7] && p[8]) { pc += ',"clickEvent":{"action":"' + p[7] + '","value":"' + p[8] + '"}'; }
        if (p[9] && p[10]) { pc += ',"hoverEvent":{"action":"' + p[9] + '","value":"' + ccs((p[10] || "").replace(/\$/g, '\u00A7'), allowed) + '"}'; }
        pc += '}';


        txt += (fullraw ? ',' : '') + pc.toString();
    }

    if (fullraw) {
        txt += ']';
    }

    return txt;
}

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
 * Converts a number to a roman numeral.
 * @param {number} num - The number to convert.
 * @returns {string} The roman numeral.
 */
function romanize(num) {
    var lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 },
        roman = '',
        i;
    for (i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
}