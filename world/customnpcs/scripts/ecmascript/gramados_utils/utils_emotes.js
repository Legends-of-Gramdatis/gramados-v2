load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var LEGACY_UNLOCK_CONFIG_PATH = "world/customnpcs/scripts/data/unlocks.json";
var _LEGACY_UNLOCK_ROUTING = false;

function _legacyUnlockLog(message) {
    try {
        if (typeof logToFile === "function") {
            logToFile("events", "[Legacy Unlock Migration] " + message);
            return;
        }
    } catch (ignored) {}

    try {
        java.lang.System.out.println("[Legacy Unlock Migration] " + message);
    } catch (ignored2) {}
}

function _legacyUnlockDefinitions() {
    try {
        var config = loadJson(LEGACY_UNLOCK_CONFIG_PATH) || {};
        return config.Unlocks || {};
    } catch (e) {
        _legacyUnlockLog("Could not load unlock configuration: " + e.message);
        return {};
    }
}

function _legacyUnlockNormalizeEmotes(emotes) {
    if (!emotes || !emotes.length) return "";

    var normalized = [];
    for (var i = 0; i < emotes.length; i++) {
        normalized.push(String(emotes[i]));
    }
    normalized.sort();
    return normalized.join("|");
}

function _legacyUnlockFindByBadge(badge) {
    if (!badge) return null;

    var unlocks = _legacyUnlockDefinitions();
    var wanted = String(badge);

    for (var unlockId in unlocks) {
        if (!unlocks.hasOwnProperty(unlockId)) continue;

        var definition = unlocks[unlockId];
        if (!definition || definition.Enabled === false || !definition.LegacyGrant) continue;

        if (definition.LegacyGrant.Badge !== undefined
            && String(definition.LegacyGrant.Badge) === wanted) {
            return String(unlockId);
        }
    }

    return null;
}

function _legacyUnlockFindByEmoteBundle(emotes) {
    var wanted = _legacyUnlockNormalizeEmotes(emotes);
    if (!wanted) return null;

    var unlocks = _legacyUnlockDefinitions();

    for (var unlockId in unlocks) {
        if (!unlocks.hasOwnProperty(unlockId)) continue;

        var definition = unlocks[unlockId];
        if (!definition || definition.Enabled === false || !definition.LegacyGrant) continue;

        var configured = definition.LegacyGrant.Emotes || [];
        if (!configured.length) continue;

        if (_legacyUnlockNormalizeEmotes(configured) === wanted) {
            return String(unlockId);
        }
    }

    return null;
}

function _legacyUnlockEnsureEngine() {
    if (typeof grantUnlock !== "function" || typeof hasUnlock !== "function") {
        load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_unlocks.js");
    }

    return typeof grantUnlock === "function" && typeof hasUnlock === "function";
}

function _legacyUnlockRoute(player, unlockId) {
    if (_LEGACY_UNLOCK_ROUTING || !player || !unlockId) return false;

    try {
        if (!_legacyUnlockEnsureEngine()) return false;

        // Once an unlock is already present, preserve the old helper behavior.
        // This also lets an explicit legacy grant restore a manually removed
        // badge/emote without trying to re-run a completed unlock reward.
        if (hasUnlock(player, String(unlockId))) return false;

        _LEGACY_UNLOCK_ROUTING = true;
        return grantUnlock(player, String(unlockId)) === true;
    } catch (e) {
        _legacyUnlockLog(
            "Failed to route legacy reward to unlock '" + unlockId + "': " + e.message
        );
        return false;
    } finally {
        _LEGACY_UNLOCK_ROUTING = false;
    }
}

function _legacyUnlockOwnedEmotes(player) {
    var owned = {};

    try {
        var worldData = player.getWorld().getStoreddata();
        var raw = worldData.get("player_" + player.getDisplayName());
        var playerJson = raw ? JSON.parse(raw) : {};
        var emotes = playerJson && playerJson.emotes ? playerJson.emotes : [];

        for (var i = 0; i < emotes.length; i++) {
            owned[String(emotes[i])] = true;
        }
    } catch (e) {
        _legacyUnlockLog(
            "Could not snapshot emotes for " + player.getName() + ": " + e.message
        );
    }

    return owned;
}

function _legacyUnlockCountNewRequestedEmotes(player, emotes, before) {
    var after = _legacyUnlockOwnedEmotes(player);
    var count = 0;

    for (var i = 0; i < emotes.length; i++) {
        var emote = String(emotes[i]);
        if (!before[emote] && after[emote]) count++;
    }

    return count;
}

function grantEmote(player, emote) {
    if (giveEmote(player, emote)) {
        tellPlayer(player, "&a:check_mark: You have received the '&r:" + emote + ":&a' emote!&8&o Use !myemotes to see your emotes.");
        var command = "/playsound minecraft:entity.player.levelup block @a " + player.getPos().getX() + " " + player.getPos().getY() + " " + player.getPos().getZ() + " 1 1";
        API.executeCommand(player.getWorld(), command);
    }
}

/**
 * Raw multi-emote grant used internally when the unlock engine is already
 * delivering a configured reward.
 */
function _grantEmotesRaw(player, emotes) {
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

/**
 * Grants multiple emotes at once using giveEmote (no per-emote chat).
 * Sends a single summary message showing all requested emotes in order,
 * and plays the level-up sound once if at least one emote was newly granted.
 *
 * Legacy gameplay calls can be mapped to a generic unlock with
 * `LegacyGrant.Emotes` in data/unlocks.json. In that case the unlock config
 * becomes the source of truth for the reward bundle while this API preserves
 * its original return value.
 *
 * @param {IPlayer} player
 * @param {string[]} emotes - list of emote ids, e.g., ["hut_dirt", "wave"]
 * @returns {number} count of newly granted emotes
 */
function grantEmotes(player, emotes) {
    if (!emotes || !emotes.length) return 0;

    if (!_LEGACY_UNLOCK_ROUTING) {
        var unlockId = _legacyUnlockFindByEmoteBundle(emotes);
        if (unlockId) {
            var before = _legacyUnlockOwnedEmotes(player);
            if (_legacyUnlockRoute(player, unlockId)) {
                return _legacyUnlockCountNewRequestedEmotes(player, emotes, before);
            }
        }
    }

    return _grantEmotesRaw(player, emotes);
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

function _grantBadgeAndEmotesRaw(player, badge, emotes) {
    for (var i = 0; i < emotes.length; i++) {
        giveEmote(player, emotes[i]);
    }
    if (giveBadge(player, badge)) {
        tellPlayer(player, "&a:check_mark: You have received the '&r" + badge + "&a' badge!&8&o Use !mybadges to see your badges.");
        var command = "/playsound minecraft:entity.player.levelup block @a " + player.getPos().getX() + " " + player.getPos().getY() + " " + player.getPos().getZ() + " 1 1";
        API.executeCommand(player.getWorld(), command);
    }
}

/**
 * Grants a badge and related emotes.
 *
 * If the badge is declared as a `LegacyGrant.Badge` in unlocks.json, older
 * gameplay scripts are transparently routed through grantUnlock(). This keeps
 * those scripts functional while making unlocks.json the source of truth for
 * the actual reward bundle.
 */
function grantBadgeAndEmotes(player, badge, emotes) {
    if (!_LEGACY_UNLOCK_ROUTING) {
        var unlockId = _legacyUnlockFindByBadge(badge);
        if (unlockId && _legacyUnlockRoute(player, unlockId)) {
            return;
        }
    }

    _grantBadgeAndEmotesRaw(player, badge, emotes || []);
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
