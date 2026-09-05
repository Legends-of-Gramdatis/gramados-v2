load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_unlocks.js");

/**
 * Player login hook for generic unlocks.
 *
 * Add this script to the global/player CustomNPCs script list so configured
 * `login` unlocks are evaluated whenever a player connects.
 */
function login(event) {
    if (!event.player) return;
    checkUnlocksForTrigger(event.player, "login");
}

/**
 * Optional init trigger. It is kept separate from login so definitions can
 * explicitly opt in to script reload/player init evaluation when desired.
 */
function init(event) {
    if (!event.player) return;
    checkUnlocksForTrigger(event.player, "init");
}
