load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_player.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_perms.js");

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

function grantEmote(player, emote) {
    if (giveEmote(player, emote)) {
        tellPlayer(player, "&a:check_mark: You have received the '&r:" + emote + ":&a' emote!&8&o Use !myemotes to see your emotes.");
        var command = "/playsound minecraft:entity.player.levelup block @a " + player.getPos().getX() + " " + player.getPos().getY() + " " + player.getPos().getZ() + " 1 1";
        API.executeCommand(player.getWorld(), command);
    }
}

/**
 * Grants multiple emotes at once using giveEmote (no per-emote chat).
 * Sends a single summary message showing all requested emotes in order,
 * and plays the level-up sound once if at least one emote was newly granted.
 *
 * @param {IPlayer} player
 * @param {string[]} emotes - list of emote ids, e.g., ["hut_dirt", "wave"]
 * @returns {number} count of newly granted emotes
 */
function grantEmotes(player, emotes) {
    if (!emotes || !emotes.length) return 0;
    var grantedCount = 0;
    for (var i = 0; i < emotes.length; i++) {
        if (giveEmote(player, emotes[i])) {
            grantedCount++;
        }
    }
    if (grantedCount > 0) {
        // Build display list using the same order as input
        var parts = [];
        for (var j = 0; j < emotes.length; j++) {
            parts.push("&r:" + emotes[j] + ":&a");
        }
        tellPlayer(player, "&a:check_mark: You have received the following emotes: &r" + parts.join("&7, &r") + "&a!&8&o Use !myemotes to see your emotes.");
        var command = "/playsound minecraft:entity.player.levelup block @a " + player.getPos().getX() + " " + player.getPos().getY() + " " + player.getPos().getZ() + " 1 1";
        API.executeCommand(player.getWorld(), command);
    }
    return grantedCount;
}

function giveEmote(player, emote) {
    var playerData = loadPlayerMeta(player);

    if (!includes(playerData.emotes, emote)) {
        playerData.emotes.push(emote);
        savePlayerMeta(player, playerData);
        logToFile("events", "Player " + player.getName() + " received emote: " + emote);
        return true;
    }
    return false;
}

/**
 * Returns the saved emote metadata used by CustomServerTools Emote.
 * Unsaved emotes use the Emote class default of default=false.
 *
 * @param {IPlayer} player
 * @param {string} emote
 * @returns {boolean}
 */
function isEmoteDefaultForPlayer(player, emote) {
    var raw = player.getWorld().getStoreddata().get("emote_" + emote);
    return raw === null ? false : JSON.parse(raw).default === true;
}

/**
 * Returns whether the player can currently use an emote through an explicit
 * unlock, the emote permission, or the emote's default flag.
 *
 * @param {IPlayer} player
 * @param {string} emote
 * @returns {boolean}
 */
function playerHasEmoteAccess(player, emote) {
    var playerData = loadPlayerMeta(player);

    return playerData.emotes.indexOf(emote) !== -1 ||
        playerHasPermission(player, "emotes." + emote) ||
        isEmoteDefaultForPlayer(player, emote);
}

/**
 * Filters an explicit emote pool down to emotes the player cannot currently use.
 *
 * @param {IPlayer} player
 * @param {Array<string>} emotes
 * @returns {Array<string>}
 */
function getPlayerMissingEmotes(player, emotes) {
    var missing = [];

    for (var i = 0; i < emotes.length; i++) {
        if (!playerHasEmoteAccess(player, emotes[i])) {
            missing.push(emotes[i]);
        }
    }

    return missing;
}

function grantBadgeAndEmotes(player, badge, emotes) {
    for (var i = 0; i < emotes.length; i++) {
        giveEmote(player, emotes[i]);
    }
    if (giveBadge(player, badge)) {
        tellPlayer(player, "&a:check_mark: You have received the '&r" + badge + "&a' badge!&8&o Use !mybadges to see your badges.");
        var command = "/playsound minecraft:entity.player.levelup block @a " + player.getPos().getX() + " " + player.getPos().getY() + " " + player.getPos().getZ() + " 1 1";
        API.executeCommand(player.getWorld(), command);
    }
}

function giveBadge(player, badge) {
    var world_data = player.getWorld().getStoreddata();
    var player_json = JSON.parse(world_data.get("player_" + player.getDisplayName()));

    if (!player_json) {
        player_json = {};
    }

    player_json.badges = player_json.badges || [];

    if (!includes(player_json.badges, badge)) {
        player_json.badges.push(badge);
        world_data.put("player_" + player.getDisplayName(), JSON.stringify(player_json));
        logToFile("events", "Player " + player.getDisplayName() + " received badge: " + badge);
        return true;
    }
    return false;
}