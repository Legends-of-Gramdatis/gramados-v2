load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");

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
    var world_data = player.getWorld().getStoreddata();
    var player_json = JSON.parse(world_data.get("player_" + player.getDisplayName()));

    if (!player_json) {
        player_json = {};
    }

    player_json.emotes = player_json.emotes || [];

    if (!includes(player_json.emotes, emote)) {
        player_json.emotes.push(emote);
        world_data.put("player_" + player.getDisplayName(), JSON.stringify(player_json));
        logToFile("events", "Player " + player.getDisplayName() + " received emote: " + emote);
        return true;
    }
    return false;
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