load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js');

var PAWN_LOOT_TABLE_KEY = 'pawn_loot_table';
var PAWN_HONESTY_KEY = 'pawn_honesty';
var PAWN_HAGGLE_KEY = 'pawn_haggle';
var PAWN_DEAL_BREAK_CHANCE_KEY = 'pawn_deal_break_chance';
var PAWN_BLOCK_TIMER_KEY = 'pawn_block_timer';

var admin_config_items = {
    "pawn_loot_table": {
        "id": "variedcommodities:satchel",
        "description": "&8Rename it to the loot table path/name this pawn shop should use.",
        "name": "&bLoot table",
    },
    "pawn_honesty": {
        "id": "variedcommodities:coin_emerald",
        "description": "&8100 = pays the full reference price. Lower values make offers less accurate or less fair. (0-100)",
        "name": "&bHonesty"
    },
    "pawn_haggle": {
        "id": "variedcommodities:coin_gold",
        "description": "&8Chance for each haggle attempt to successfully lower the NPC price. (0-100)",
        "name": "&bHaggle chance"
    },
    "pawn_deal_break_chance": {
        "id": "variedcommodities:coin_stone",
        "description": "&8If a haggle attempt fails, this is the chance the NPC refuses the deal entirely. (0-100)",
        "name": "&bDeal break chance"
    },
    "pawn_block_timer": {
        "id": "variedcommodities:coin_wood",
        "description": "&8Time the NPC will refuse to trade with the player after breaking a deal. (seconds)",
        "name": "&bBlock timer"
    }
};

function getNPCConfig(npc) {
    var stored_data = npc.getStoreddata();
    return {
        lootTable: stored_data.get(PAWN_LOOT_TABLE_KEY),
        honesty: parseInt(stored_data.get(PAWN_HONESTY_KEY))/100,
        haggleChance: parseInt(stored_data.get(PAWN_HAGGLE_KEY))/100,
        dealBreakChance: parseInt(stored_data.get(PAWN_DEAL_BREAK_CHANCE_KEY))/100,
        blockTimer: parseInt(stored_data.get(PAWN_BLOCK_TIMER_KEY))
    };
}

function getHaggledData(npc) {
    var stored_data = npc.getStoreddata();
    if (!stored_data.has('last_interaction')) {
        return null;
    }
    var last_interaction = JSON.parse(stored_data.get('last_interaction'));
    return last_interaction;
}

function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var offhand = player.getOffhandItem();
    var mainhand = player.getMainhandItem();

    if (isAdmin(offhand)) {
        if (!mainhand.isEmpty()) {
            switch (mainhand.getName()) {
                case admin_config_items[PAWN_LOOT_TABLE_KEY].id:
                    var lootTablePath = mainhand.getDisplayName();
                    if (doesLootTableExist(lootTablePath)) {
                        npc.getStoreddata().put(PAWN_LOOT_TABLE_KEY, lootTablePath);
                        tellPlayer(player, '&a[Admin] Loot table set to: ' + lootTablePath);
                    } else {
                        tellPlayer(player, '&c[Admin] Loot table not found: ' + lootTablePath);
                    }
                    return;
                case admin_config_items[PAWN_HONESTY_KEY].id:
                    var honesty = parseInt(mainhand.getDisplayName());
                    if (isNaN(honesty) || honesty < 0 || honesty > 100) {
                        tellPlayer(player, '&c[Admin] Invalid honesty value. Must be a number between 0 and 100.');
                        return;
                    }
                    npc.getStoreddata().put(PAWN_HONESTY_KEY, String(honesty));
                    tellPlayer(player, '&a[Admin] Honesty set to: ' + honesty);
                    return;
                case admin_config_items[PAWN_HAGGLE_KEY].id:
                    var haggle = parseInt(mainhand.getDisplayName());
                    if (isNaN(haggle) || haggle < 0 || haggle > 100) {
                        tellPlayer(player, '&c[Admin] Invalid haggle value. Must be a number between 0 and 100.');
                        return;
                    }
                    npc.getStoreddata().put(PAWN_HAGGLE_KEY, String(haggle));
                    tellPlayer(player, '&a[Admin] Haggle chance set to: ' + haggle);
                    return;
                case admin_config_items[PAWN_DEAL_BREAK_CHANCE_KEY].id:
                    var dealBreakChance = parseInt(mainhand.getDisplayName());
                    if (isNaN(dealBreakChance) || dealBreakChance < 0 || dealBreakChance > 100) {
                        tellPlayer(player, '&c[Admin] Invalid deal break chance value. Must be a number between 0 and 100.');
                        return;
                    }
                    npc.getStoreddata().put(PAWN_DEAL_BREAK_CHANCE_KEY, String(dealBreakChance));
                    tellPlayer(player, '&a[Admin] Deal break chance set to: ' + dealBreakChance);
                    return;
                case admin_config_items[PAWN_BLOCK_TIMER_KEY].id:
                    var blockTimer = parseInt(mainhand.getDisplayName());
                    if (isNaN(blockTimer) || blockTimer < 0) {
                        tellPlayer(player, '&c[Admin] Invalid block timer value. Must be a positive number.');
                        return;
                    }
                    npc.getStoreddata().put(PAWN_BLOCK_TIMER_KEY, String(blockTimer));
                    tellPlayer(player, '&a[Admin] Block timer set to: ' + blockTimer);
                    return;
                default:
                    showAdminConfigurationHelp(npc, player);
                    return;
            }
        } else if (!isNpcConfigured(npc)) {
            showAdminConfigurationHelp(npc, player);
            npc.say(ccs('&eI can\'t do anything yet. Please configure me using the admin items. Use the renamed items on me to apply the corresponding configuration.'));
            giveAdminConfigItems(player);
            return;
        }

        // display NPC configuration
        npc.say(ccs('&eCurrent configuration:'));
        var sd = npc.getStoreddata();
        for (var key in admin_config_items) {
            var value = sd.has(key) ? sd.get(key) : '&cNot set';
            npc.say(ccs('&6' + admin_config_items[key].name + ': &e' + value));
        }
        return;
    }

    if (!isNpcConfigured(npc)) {
        npc.say(ccs('&eMy boss hasn\'t told me what to do yet. Ask an admin to configure me.'));
        return;
    }

    // get what the player has in hand
    if (!isHaggling(npc, mainhand, player) && verifyIfItemCanBePawned(npc, mainhand)) {
        npc.say(ccs('&eI can offer you &6' + formatMoney(initial_pawn_value) + ' &efor that item.'));
        // save haggling state: player name, itemstack, and timestamp
        saveLastInteraction(npc, player.getName(), mainhand, initial_pawn_value);
    }
    
    
    // if haggling
    if (isHaggling(npc, mainhand, player)) {
        var last_saved_value = npc.getStoreddata().get('last_interaction');

    } else {
        npc.say(ccs('&eI can\'t accept that item. Please show me an item I can buy.'));
        // reset haggling state
        resetLastInteraction(npc);
    }

}

function verifyIfItemCanBePawned(npc, item_stack) {
    if (item_stack.isEmpty()) {
        return false;
    }

    if (!isNpcConfigured(npc)) {
        return false;
    }

    var loot_table_path = npc.getStoreddata().get(PAWN_LOOT_TABLE_KEY);
    if (!isItemInLootTable(loot_table_path, item_stack.getName())) {
        return false;
    }

    var initial_pawn_value = getInitialPawnValue(npc, item_stack);
    if (initial_pawn_value === null) {
        return false;
    }

    return true;
}

function getInitialPawnValue(npc, item_stack) {
    var item_value = getPriceFromItemStack(item_stack, 0, false);
    if (item_value !== 0) {
        return item_value*getNPCConfig(npc).honesty;
    }
    return null;
}

function saveLastInteraction(npc, player_name, item_stack, pawn_value) {
    // save in NPC data: player name, itemstack, and timestamp
    var stored_data = npc.getStoreddata();
    var interaction_data = {
        player: player_name,
        item: convert_item_stack_to_json_data(item_stack),
        pawn_value: pawn_value,
        timestamp: new Date().getTime()
    };
    stored_data.put('last_interaction', JSON.stringify(interaction_data));
}

function resetLastInteraction(npc) {
    var stored_data = npc.getStoreddata();
    stored_data.remove('last_interaction');
}

function isHaggling(npc, item_stack, player) {
    // If a haggling is on going,
    var stored_data = npc.getStoreddata();
    if (!stored_data.has('last_interaction')) {
        return false;
    }

    // check if the player is the same
    var last_interaction = JSON.parse(stored_data.get('last_interaction'));
    if (last_interaction.player !== player.getName()) {
        return false;
    }

    // We will keep that for completion.
    // // and if the item is the same
    // var last_item_stack = convert_json_data_to_item_stack(last_interaction.item, npc.getWorld());
    // if (last_item_stack.getName() !== item_stack.getName() || last_item_stack.getItemDamage() !== item_stack.getItemDamage()) {
    //     return false;
    // }

    // and if player is holding air
    if (!item_stack.isEmpty()) {
        return false;
    }

    // and if no longer than "pawn_block_timer" seconds have passed since the last interaction
    var now = new Date().getTime();
    var elapsed_time = now - last_interaction.timestamp;
    if (elapsed_time > getNPCConfig(npc).blockTimer * 1000) {
        return false;
    }

    return true;
}

function convert_item_stack_to_json_data(item_stack) {
    var item_as_nbt = item_stack.getNbt();
    return item_as_nbt.toJsonString();
}

function convert_json_data_to_item_stack(json_data, world) {
    var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
    var item_as_nbt = API.stringToNbt(json_data);
    return world.createItemFromNbt(item_as_nbt);
}

function saveLastInteraction(npc, player_name, item_stack) {
    // store in NPC data: player name, itemstack, and timestamp
    var stored_data = npc.getStoreddata();
    var interaction_data = {
        player: player_name,
        item: {
            id: item_stack.getName(),
            damage: item_stack.getItemDamage(),
            nbt: item_stack.hasNbt() ? item_stack.getNbt() : null,
            count: item_stack.getStackSize()
        },
        timestamp: new Date().getTime()
    };
    stored_data.put('last_interaction', JSON.stringify(interaction_data));
}


function isAdmin(offhandItem) {
    return offhandItem && !offhandItem.isEmpty() && offhandItem.getName() == 'mts:ivv.idcard_seagull';
}

function isLootTableItem(item) {
    return item && !item.isEmpty() && item.getName() == admin_config_items[PAWN_LOOT_TABLE_KEY].id;
}

function isHonestyItem(item) {
    return item && !item.isEmpty() && item.getName() == admin_config_items[PAWN_HONESTY_KEY].id;
}

function isHaggleItem(item) {
    return item && !item.isEmpty() && item.getName() == admin_config_items[PAWN_HAGGLE_KEY].id;
}

function isDealBreakChanceItem(item) {
    return item && !item.isEmpty() && item.getName() == admin_config_items[PAWN_DEAL_BREAK_CHANCE_KEY].id;
}

function isBlockTimerItem(item) {
    return item && !item.isEmpty() && item.getName() == admin_config_items[PAWN_BLOCK_TIMER_KEY].id;
}

function giveAdminConfigItems(player) {
    for (var key in admin_config_items) {
        var itemName = admin_config_items[key].id;
        var itemStack = player.getWorld().createItem(itemName, 0, 1);
        itemStack.setCustomName(ccs(admin_config_items[key].name));
        itemStack.setLore([ccs(admin_config_items[key].description)]);
        player.giveItem(itemStack);
    }
}

function isNpcConfigured(npc) {
    var stored_data = npc.getStoreddata();
    return stored_data.has(PAWN_LOOT_TABLE_KEY) && stored_data.has(PAWN_HONESTY_KEY) && stored_data.has(PAWN_HAGGLE_KEY) && stored_data.has(PAWN_DEAL_BREAK_CHANCE_KEY) && stored_data.has(PAWN_BLOCK_TIMER_KEY);
}

function showAdminConfigurationHelp(npc, player) {
    var sd = npc.getStoreddata();
    var tutorial_text = [
        '&6[Admin] &ePawn Shop NPC Configuration',
        '&7Use the following admin items on this NPC after renaming them to the value you want to set:',
        '',
        '&e- &f' + admin_config_items[PAWN_LOOT_TABLE_KEY].id + ' &7→ ' + admin_config_items[PAWN_LOOT_TABLE_KEY].name,
        '  ' + admin_config_items[PAWN_LOOT_TABLE_KEY].description,
        '',
        '&e- &f' + admin_config_items[PAWN_HONESTY_KEY].id + ' &7→ ' + admin_config_items[PAWN_HONESTY_KEY].name + ' &8(0-100)',
        '  ' + admin_config_items[PAWN_HONESTY_KEY].description,
        '',
        '&e- &f' + admin_config_items[PAWN_HAGGLE_KEY].id + ' &7→ ' + admin_config_items[PAWN_HAGGLE_KEY].name + ' &8(0-100)',
        '  ' + admin_config_items[PAWN_HAGGLE_KEY].description,
        '',
        '&e- &f' + admin_config_items[PAWN_DEAL_BREAK_CHANCE_KEY].id + ' &7→ ' + admin_config_items[PAWN_DEAL_BREAK_CHANCE_KEY].name + ' &8(0-100)',
        '  ' + admin_config_items[PAWN_DEAL_BREAK_CHANCE_KEY].description,
        '',
        '&e- &f' + admin_config_items[PAWN_BLOCK_TIMER_KEY].id + ' &7→ ' + admin_config_items[PAWN_BLOCK_TIMER_KEY].name + ' &8(seconds)',
        '  ' + admin_config_items[PAWN_BLOCK_TIMER_KEY].description,
        ''
    ]

    storytellPlayer(player, tutorial_text);
}
