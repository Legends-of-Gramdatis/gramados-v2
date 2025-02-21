/**
 * Sends a formatted message to the player.
 * @param {IPlayer} player - The player to send the message to.
 * @param {string} rawtext - The raw text message.
 * @returns {boolean} The result of the command execution.
 */
function tellPlayer(player, rawtext) {
    return executeCommand(player, "/tellraw " + player.getName() + " " + parseEmotes(strf(rawtext)));
}

/**
 * Sends a formatted message to a target player.
 * @param {IPlayer} player - The player sending the message.
 * @param {IPlayer} target - The target player to send the message to.
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
 * @param {IPlayer} [target] - The target player to send the title to.
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
        .replace(/\s+/g, '_') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/__+/g, '_') // Replace multiple - with single -
        .replace(/^_+/, '') // Trim - from start of text
        .replace(/_+$/, ''); // Trim - from end of text
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
 * Gets a formatted chat message.
 * @param {IPlayer} player - The player sending the message.
 * @param {string} team - The team name.
 * @param {string} color - The color code.
 * @param {string} message - The message content.
 * @returns {string} The formatted chat message.
 */
function getChatMessage(player, team, color, message) {
    var curTimeStr = new Date().toLocaleTimeString("fr-FR").split(":");
    curTimeStr.pop();
    curTimeStr = curTimeStr.join(":");
    var ccode = getColorId(color);
    return "[" + curTimeStr + "] &l&" + ccode + "[&" + ccode + team + "&r &" + ccode + player + "&l&" + ccode + "] -> &r" + message;
}

/**
 * Gets a formatted chat tag.
 * @param {IPlayer} player - The player.
 * @param {string} team - The team name.
 * @param {string} color - The color code.
 * @returns {string} The formatted chat tag.
 */
function getChatTag(player, team, color) {
    var ccode = getColorId(color);
    return "&" + ccode + "&l[&" + ccode + "&o" + team + "&r &" + ccode + player + "&" + ccode + "&l]";
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
    if (typeof (toRaw) == typeof (undefined) || toRaw === null) {
        toRaw = false;
    }
    if (typeof (allowed) == typeof (undefined) || allowed === null) {
        allowed = _RAWCODES;
    }
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
    if (typeof (toRaw) == typeof (undefined) || toRaw === null) {
        toRaw = false;
    }
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
        var ch = str.charAt(i);
        if (ch == '&') {
            isCode = true;
        } else if (isCode) {
            isCode = false;
            if (allowed.indexOf(ch) > -1) {
                switch (ch) {
                    case 'r':
                        txtColor = 'white';
                        isItalic = false;
                        isBold = false;
                        isStrike = false;
                        isUnderlined = false;
                        isObf = false;
                        break;
                    case 'o':
                        isItalic = true;
                        break;
                    case 'l':
                        isBold = true;
                        break;
                    case 'm':
                        isStrike = true;
                        break;
                    case 'n':
                        isUnderlined = true;
                        break;
                    case 'k':
                        isObf = true;
                        break;
                    default:
                        txtColor = getColorName(ch);
                        break;
                }
            }
        } else {
            txt += ch;
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
    if (typeof (fullraw) == typeof (undefined) || fullraw === null) {
        fullraw = false;
    }
    if (typeof (allowed) == typeof (undefined) || allowed === null) {
        allowed = _RAWCODES;
    }
    if (allowed == null) {
        allowed = _RAWCODES;
    }
    var txt = '';
    if (fullraw) {
        txt += '{"text":"';
    }

    for (var i in str_pieces) {
        var piece = str_pieces[i];
        if (fullraw) {
            txt += piece.text.replace(/"/g, '\\"');
        } else {
            txt += piece.text;
        }
    }

    if (fullraw) {
        txt += '"}';
    }

    return txt;
}