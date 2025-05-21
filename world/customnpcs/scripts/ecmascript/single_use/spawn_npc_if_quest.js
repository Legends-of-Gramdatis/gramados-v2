load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_spawning.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');

function redstone(event) {
    var world = event.block.getWorld();
    var blockPos = event.block.getPos();
    var RADIUS = 12; // Change as needed
    var QUEST_ID = 42; // Change to your quest ID
    var NPC_CLONE_NAME = "Mafia Elite (L86 LSW)"; // Change to your clone name
    var NPC_CLONE_TAB = 0; // Change to your clone tab
    var NPC_AMOUNT = 3; // How many to spawn
    
    // Find all players in radius
    var players = world.getNearbyEntities(blockPos, RADIUS, 1); // 1 = players
    var found = false;
    for (var i = 0; i < players.length; i++) {
        var player = players[i];
        if (player.hasActiveQuest && player.hasActiveQuest(QUEST_ID)) {
            found = true;
            break;
        }
    }

    if (found) {
        spawnClonesInArea(
            world,
            NPC_CLONE_NAME,
            NPC_CLONE_TAB,
            NPC_AMOUNT,
            iposToPos(blockPos),
            RADIUS,
            10
        );
    }
}
