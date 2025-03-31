load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");

/**
 * Executes a command string by matching it against registered commands.
 * @param {string} str - The command string to execute.
 * @param {object} player - The player executing the command.
 * @param {boolean} [permcheck=true] - Whether to check for permissions.
 * @param {object} [data] - Optional stored data for the world.
 * @returns {boolean} - True if the command executed successfully, false otherwise.
 */
function executeXCommand(str, player, permcheck, data) {
    if (typeof (permcheck) == typeof (undefined) || permcheck === null) permcheck = true;
    var data = data || player.world.getStoreddata();
    var sb = player.world.getScoreboard();
    for (var c in _COMMANDS) {
        var cmd = _COMMANDS[c];
        var rgx = cmd.usageRgx;
        var capt = cmd.captNames;
        var match = str.match(rgx);
        if (match != null) {
            if (permcheck && cmd.perm != null && !player.hasPermission(cmd.perm)) {
                tellPlayer(player, _MSG.cmdNoPerm);
                return false;
            }
            var args = {};
            for (var i in capt) {
                args[capt[i]] = match[parseInt(i) + 1];
            }
            return cmd.callback(player, args, data);
        }
    }
    tellPlayer(player, _MSG.cmdNotFound);
    return false;
}

/**
 * Factory for creating and managing commands within a specific namespace.
 * @param {string} namespace - The namespace for the commands.
 * @param {string} [prefix=""] - The prefix for the commands.
 */
var CommandFactory = function (namespace, prefix) {
    this.namespace = namespace;
    this.prefix = prefix || "";
    this.commands = [];

    /**
     * Adds an "info" command to the command list.
     * @param {function} callback - The function to execute when the "info" command is called.
     */
    this.addInfoText = function (callback) {
        this.commands.push({
            usage: this.prefix + "info",
            callback: callback,
            perm: this.namespace + ".info"
        });
    };

    /**
     * Sets a transformer function for formatting the list output.
     * @param {function} callback - The transformer function.
     */
    this.setListTransformer = function (callback) {
        this.listTransformer = callback;
    };

    /**
     * Generates default commands, excluding specified ones.
     * @param {string[]} exclude - List of commands to exclude.
     */
    this.genDefault = function (exclude) {
        if (!exclude.includes("list")) {
            this.commands.push({
                usage: this.prefix + "list [...matches]",
                callback: (pl, args, data) => {
                    var items = getDataHandler(this.namespace).query(data).get();
                    var params = getArgParams(args.matches);
                    var output = genDataPageList(
                        items,
                        args.matches,
                        parseInt(params.show || 10),
                        parseInt(params.page || 1),
                        this.prefix + "list {MATCHES} -page:{PAGE} -show:{SHOWLEN}",
                        this.listTransformer || ((item) => item.name),
                        null,
                        null,
                        params.sort === "desc"
                    );
                    tellPlayer(pl, output);
                },
                perm: this.namespace + ".list"
            });
        }
    };

    /**
     * Adds a "set" command for modifying a specific key.
     * @param {string} key - The key to be set.
     * @param {function} callback - The function to execute when the key is set.
     * @param {object} args - The arguments for the command.
     * @param {object} options - Additional options for the command.
     * @param {string} display - Display name for the command.
     */
    this.addSettable = function (key, callback, args, options, display) {
        this.commands.push({
            usage: this.prefix + "set " + key + " <value>",
            callback: (pl, args, data) => {
                var handler = getDataHandler(this.namespace);
                var item = handler.query(data).where("name", "=", args.name).first();
                if (!item) {
                    tellPlayer(pl, _MSG.argNotExists.replace("{type}", this.namespace).replace("{argVal}", args.name));
                    return false;
                }
                callback(item, args.value);
                handler.save(data);
                tellPlayer(pl, "&a" + key + " updated successfully.");
                return true;
            },
            perm: this.namespace + ".set." + key,
            rules: args
        });
    };

    /**
     * Registers all commands in the factory.
     */
    this.register = function () {
        for (var cmd of this.commands) {
            registerXCommand(cmd.usage, cmd.callback, cmd.perm, cmd.rules, cmd.payload);
        }
    };
};

/**
 * Registers multiple commands at once.
 * @param {Array} commands - Array of command definitions.
 */
function registerXCommands(commands) {
    for (var c in commands) {
        var cmd = commands[c];
        var usageRgx = parseUsageRgx(cmd[0]);
        _COMMANDS.push({
            usage: cmd[0],
            callback: cmd[1],
            perm: cmd[2],
            rules: cmd[3],
            payload: cmd[4],
            usageRgx: usageRgx[0],
            captNames: usageRgx[1]
        });
    }
}

/**
 * Parses arguments into key-value pairs.
 * @param {string[]} args - The arguments to parse.
 * @returns {object} - Parsed key-value pairs.
 */
function getArgParams(args) {
    var params = {};
    var str = args.join(" ");
    var match;
    while ((match = ARGPARAM_REGEX.exec(str)) !== null) {
        params[match[1]] = match[2] ? match[2].replace(/['"]/g, "") : true;
    }
    return params;
}

/**
 * Generates a paginated list of data items.
 * @param {Array} data - The data to paginate.
 * @param {string[]} matches - Filters for matching data.
 * @param {number} show - Number of items to show per page.
 * @param {number} page - The page number to display.
 * @param {string} command - The command template for navigation.
 * @param {function} formatter - Function to format each item.
 * @param {function} sorter - Function to sort the data.
 * @param {function} filter - Function to filter the data.
 * @param {boolean} desc - Whether to sort in descending order.
 * @param {object} options - Additional options for pagination.
 * @returns {string} - The formatted paginated list.
 */
function genDataPageList(data, matches, show, page, command, formatter, sorter, filter, desc, options) {
    var filtered = data.filter((item) => {
        return matches.every((match) => item.name.includes(match));
    });
    if (sorter) filtered.sort(sorter);
    if (desc) filtered.reverse();
    var start = (page - 1) * show;
    var end = start + show;
    var paginated = filtered.slice(start, end);
    var output = paginated.map(formatter).join("\n");
    return output;
}

/**
 * Sends a message to a player.
 * @param {object} player - The player to send the message to.
 * @param {string} message - The message to send.
 */
function tellPlayer(player, message) {
    player.message(message);
}

/**
 * Sends a message to a target player from another player.
 * @param {object} player - The player sending the message.
 * @param {object} target - The target player receiving the message.
 * @param {string} message - The message to send.
 */
function tellTarget(player, target, message) {
    target.message(message);
}

/**
 * Generates a title bar for display.
 * @param {string} title - The title text.
 * @param {boolean} centered - Whether to center the title.
 * @returns {string} - The formatted title bar.
 */
function getTitleBar(title, centered) {
    return centered ? `=== ${title} ===` : title;
}

/**
 * Placeholder for generating a navigation bar.
 * @returns {string} - The navigation bar placeholder.
 */
function getNavBar() {
    return "Navigation Bar Placeholder";
}

/**
 * Formats loan information for display.
 * @param {object} loan - The loan object.
 * @param {object} params - Additional parameters for formatting.
 * @param {string} title - The title for the loan information.
 * @param {string} command - The command associated with the loan.
 * @returns {string} - The formatted loan information.
 */
function formatLoanInfo(loan, params, title, command) {
    return `${title}: ${loan.amount} - ${loan.interest}%`;
}

/**
 * Retrieves a currency object by name.
 * @param {string} name - The name of the currency.
 * @returns {object} - The currency object.
 */
function getCurrency(name) {
    return VIRTUAL_CURRENCIES.find((currency) => currency.name === name);
}

/**
 * Parses a string amount into a numeric value.
 * @param {string} amount - The string representation of the amount.
 * @returns {number} - The numeric value of the amount.
 */
function getCoinAmount(amount) {
    return parseInt(amount.replace(/[^\d]/g, ""));
}

/**
 * Counts occurrences of a value in an array.
 * @param {string} value - The value to search for.
 * @param {Array} array - The array to search in.
 * @param {boolean} caseSensitive - Whether the search is case-sensitive.
 * @param {boolean} partial - Whether to allow partial matches.
 * @returns {number} - The number of occurrences.
 */
function arrayOccurs(value, array, caseSensitive, partial) {
    return array.filter((item) => {
        if (!caseSensitive) item = item.toLowerCase();
        return partial ? item.includes(value) : item === value;
    }).length;
}

/**
 * Transforms an array using a callback function.
 * @param {Array} array - The array to transform.
 * @param {function} callback - The transformation function.
 * @returns {Array} - The transformed array.
 */
function arrayTransform(array, callback) {
    return array.map(callback);
}

/**
 * Replaces color codes in a string with Minecraft formatting codes.
 * @param {string} text - The text to format.
 * @returns {string} - The formatted text.
 */
function ccs(text) {
    return text.replace(/&/g, "\u00A7");
}

/**
 * Parses emotes in a text string.
 * @param {string} text - The text containing emotes.
 * @returns {string} - The text with emotes replaced.
 */
function parseEmotes(text) {
    return text.replace(/:\w+:/g, (match) => CHAT_EMOTES[match] || match);
}

/**
 * Formats a string by replacing placeholders with message values.
 * @param {string} text - The text containing placeholders.
 * @returns {string} - The formatted text.
 */
function strf(text) {
    return text.replace(/\{(\w+)\}/g, (match, key) => _MSG[key] || match);
}

/**
 * Handles errors and optionally logs them.
 * @param {Error} error - The error object.
 * @param {boolean} notify - Whether to log the error.
 * @param {string} playerName - The name of the player associated with the error.
 */
function handleError(error, notify, playerName) {
    if (notify) console.error(`Error for ${playerName}: ${error.message}`);
}