load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_modifier_items.js");

function generate_fish_catch_loot(player) {
    var loot = pullLootTable(_LOOTTABLE_FISH, player);
    var generatedItems = [];

    for (var i = 0; i < loot.length; i++) {
        var itemStack = generateItemStackFromLootEntry(loot[i], player.getWorld(), player);
        itemStack.setCustomName("§rFish");

        if (Math.random() < 0.25) {
            var fishEffects = ["fish_swarm", "fish_catch_nearby"];
            var effect = get_modifier_config_entry(pickFromArray(fishEffects));
            itemStack = create_modifier_item_stack(player, itemStack, {
                effect: effect.type,
                onDepletion: 'disappear',
                radius: {min: Math.ceil(effect.radius * 0.5), max: Math.floor(effect.radius * 1.5)}
            });
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