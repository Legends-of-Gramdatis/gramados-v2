load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js");

function generate_fish_catch_loot(player) {
    var loot = pullLootTable(_LOOTTABLE_FISH, player);
    var generatedItems = [];

    for (var i = 0; i < loot.length; i++) {
        var itemStack = generateItemStackFromLootEntry(loot[i], player.getWorld(), player);
        itemStack.setCustomName("§rFish");

        if (Math.random() < 0.25) {
            var fishEffects = ["fish swarm", "fish catch nearby"];
            itemStack = instanciate_consumable_modifier(player, itemStack, pickFromArray(fishEffects));
        }

        generatedItems.push(itemStack);
    }

    if (Math.random() < 0.25) {
        var arcadeTokens = pullLootTable(_LOOTTABLE_ARCADE_TOKENS, player);
        for (var j = 0; j < arcadeTokens.length; j++) {
            var tokenStack = generateItemStackFromLootEntry(arcadeTokens[j], player.getWorld(), player);
            generatedItems.push(tokenStack);
        }
    }

    return generatedItems;
}