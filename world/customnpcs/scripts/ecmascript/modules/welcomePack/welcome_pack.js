load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

// TODO: Deprecate this script when the 10h onboarding will be ready.

var WELCOME_PACK_JSON_PATH = "world/customnpcs/scripts/data_auto/welcome_pack.json";

/**
 * @description
 * This function is called when a player joins the server for the first time.
 * It gifts the player a bike from the loot table and logs the event.
 * It also checks if the player has already been gifted to avoid duplication.
 * If the player has already been gifted, it does nothing.
 * If the player has not been gifted, it pulls a bike from the loot table,
 * gives it to the player, and adds the player to the gifted list.
 * Finally, it saves the updated gifted list to a JSON file.
 */
function init(event) {
    var player = event.player;
    var world = player.getWorld();
    var giftedPlayers = loadJson(WELCOME_PACK_JSON_PATH) || { giftedMTSItems: [] };

    // Check if the player has already been gifted
    if (includes(giftedPlayers.giftedMTSItems, player.getUUID())) {
        return;
    }

    // Pull a bike from the loot table
    var lootedItems = pullLootTable(_LOOTTABLE_VEHICLE_WRENCH, player);
    lootedItems = lootedItems.concat(pullLootTable(_LOOTTABLE_VEHICLE_BIKE, player));
    if (lootedItems && lootedItems.length > 0) {
        for (var i = 0; i < lootedItems.length; i++) {
            player.giveItem(
                generateItemStackFromLootEntry(lootedItems[i], world)
                );
        }
        player.message("&aThe town's caretakers present you with a bicycle - may it carry you far and safely.");
        logToFile("events", player.getName() + " received a bike from the welcome pack.");

        // Add the player to the gifted list and save
        giftedPlayers.giftedMTSItems.push(player.getUUID());
        saveJson(giftedPlayers, WELCOME_PACK_JSON_PATH);
    } else {
        player.message("&cFailed to gift the bike. Please contact an admin.");
    }
}
