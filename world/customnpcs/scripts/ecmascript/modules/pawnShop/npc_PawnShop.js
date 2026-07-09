load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js');

var PAWN_LOOT_TABLE_KEY = 'pawn_loot_table';
var PAWN_HONESTY_KEY = 'pawn_honesty';
var PAWN_HAGGLE_KEY = 'pawn_haggle';
var PAWN_DEAL_BREAK_CHANCE_KEY = 'pawn_deal_break_chance';
var PAWN_BLOCK_TIMER_KEY = 'pawn_block_timer';

var PAWN_LAST_INTERACTION_KEY = 'pawn_last_interaction';
var PAWN_BLOCKED_PREFIX = 'pawn_blocked_';
var PAWN_HAGGLE_TIMEOUT_SECONDS = 30;

var admin_config_items = {
    "pawn_loot_table": {
        "id": "variedcommodities:satchel",
        "description": "&8Rename it to the loot table path/name this pawn shop should use.",
        "name": "&bLoot table"
    },
    "pawn_honesty": {
        "id": "variedcommodities:coin_emerald",
        "description": "&8100 = pays the full reference price. Lower values make offers less accurate or less fair. (0-100)",
        "name": "&bHonesty"
    },
    "pawn_haggle": {
        "id": "variedcommodities:coin_gold",
        "description": "&8Chance for each haggle attempt to successfully increase the NPC offer. (0-100)",
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

function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var offhand = player.getOffhandItem();
    var mainhand = player.getMainhandItem();

    if (isAdmin(offhand)) {
        handleAdminInteraction(npc, player, mainhand);
        return;
    }

    if (!isNpcConfigured(npc)) {
        npc.say(ccs('&eMy boss hasn\'t told me what to do yet. Ask an admin to configure me.'));
        return;
    }

    if (isPlayerBlocked(npc, player)) {
        var remaining = getPlayerBlockRemainingSeconds(npc, player);
        npc.say(ccs('&cNo. I am done dealing with you for now. Come back in &e' + remaining + 's&c.'));
        return;
    }

    var currentDeal = getLastInteraction(npc);

    if (currentDeal && currentDeal.player == player.getName()) {
        if (mainhand.isEmpty()) {
            tryHaggle(npc, player, currentDeal);
            return;
        }

        if (isSameItemAsDeal(mainhand, currentDeal)) {
            completePawnSale(npc, player, mainhand, currentDeal);
            return;
        }

        resetLastInteraction(npc);
    }

    if (!mainhand.isEmpty() && verifyIfItemCanBePawned(npc, mainhand)) {
        startPawnOffer(npc, player, mainhand);
        return;
    }

    if (mainhand.isEmpty()) {
        npc.say(ccs('&eShow me something, and I will tell you if it has value.'));
    } else {
        npc.say(ccs('&eI can\'t accept that item. Show me something worth buying.'));
    }
}

function handleAdminInteraction(npc, player, mainhand) {
    if (!mainhand || mainhand.isEmpty()) {
        if (!isNpcConfigured(npc)) {
            showAdminConfigurationHelp(npc, player);
            npc.say(ccs('&eI can\'t do anything yet. Please configure me using the admin items.'));
            giveAdminConfigItems(player);
            return;
        }

        showCurrentConfiguration(npc);
        return;
    }

    var id = mainhand.getName();
    var value = stripColorCodes(mainhand.getDisplayName());

    switch (id) {
        case admin_config_items[PAWN_LOOT_TABLE_KEY].id:
            if (doesLootTableExist(value)) {
                npc.getStoreddata().put(PAWN_LOOT_TABLE_KEY, value);
                tellPlayer(player, '&a[Admin] Loot table set to: &e' + value);
            } else {
                tellPlayer(player, '&c[Admin] Loot table not found: &e' + value);
            }
            return;

        case admin_config_items[PAWN_HONESTY_KEY].id:
            setPercentConfig(npc, player, PAWN_HONESTY_KEY, value, 'Honesty');
            return;

        case admin_config_items[PAWN_HAGGLE_KEY].id:
            setPercentConfig(npc, player, PAWN_HAGGLE_KEY, value, 'Haggle chance');
            return;

        case admin_config_items[PAWN_DEAL_BREAK_CHANCE_KEY].id:
            setPercentConfig(npc, player, PAWN_DEAL_BREAK_CHANCE_KEY, value, 'Deal break chance');
            return;

        case admin_config_items[PAWN_BLOCK_TIMER_KEY].id:
            var blockTimer = parseInt(value);
            if (isNaN(blockTimer) || blockTimer < 0) {
                tellPlayer(player, '&c[Admin] Invalid block timer. Must be a positive number.');
                return;
            }

            npc.getStoreddata().put(PAWN_BLOCK_TIMER_KEY, String(blockTimer));
            tellPlayer(player, '&a[Admin] Block timer set to: &e' + blockTimer + ' seconds');
            return;

        default:
            showAdminConfigurationHelp(npc, player);
            return;
    }
}

function setPercentConfig(npc, player, key, value, label) {
    var parsed = parseInt(value);

    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        tellPlayer(player, '&c[Admin] Invalid ' + label + '. Must be a number between 0 and 100.');
        return;
    }

    npc.getStoreddata().put(key, String(parsed));
    tellPlayer(player, '&a[Admin] ' + label + ' set to: &e' + parsed + '%');
}

function showCurrentConfiguration(npc) {
    var sd = npc.getStoreddata();

    npc.say(ccs('&6[Admin] &eCurrent Pawn Shop configuration:'));

    for (var key in admin_config_items) {
        var value = sd.has(key) ? sd.get(key) : '&cNot set';
        npc.say(ccs('&7- ' + admin_config_items[key].name + '&7: &e' + value));
    }
}

function startPawnOffer(npc, player, itemStack) {
    var referenceValue = getReferencePawnValue(itemStack);
    var initialValue = Math.floor(referenceValue * getNPCConfig(npc).honesty);

    if (initialValue <= 0) {
        npc.say(ccs('&eThat thing is not worth enough for me to buy.'));
        return;
    }

    saveLastInteraction(npc, player.getName(), itemStack, initialValue, referenceValue);

    npc.say(ccs('&eI can offer you &6' + formatMoney(initialValue) + ' &efor that item.'));
    npc.say(ccs('&7Use the item on me again to accept, or talk to me empty-handed to haggle.'));
}

function tryHaggle(npc, player, deal) {
    if (isDealExpired(deal)) {
        npc.say(ccs('&7Too late. I have lost interest in that offer.'));
        resetLastInteraction(npc);
        return;
    }

    var config = getNPCConfig(npc);
    deal.timestamp = new Date().getTime();

    if (Math.random() <= config.haggleChance) {
        var oldValue = deal.pawn_value;
        var maxValue = deal.reference_value;

        if (oldValue >= maxValue) {
            npc.say(ccs('&eThat is already my best price: &6' + formatMoney(oldValue) + '&e.'));
            saveDealData(npc, deal);
            return;
        }

        var remaining = maxValue - oldValue;
        var increase = Math.max(1, Math.floor(remaining * random_range(0.10, 0.20)));

        deal.pawn_value = Math.min(maxValue, oldValue + increase);

        saveDealData(npc, deal);

        npc.say(ccs('&aFine. I can raise my offer to &6' + formatMoney(deal.pawn_value) + '&a.'));
        npc.say(ccs('&7Use the item on me to accept.'));
        return;
    }

    if (Math.random() <= config.dealBreakChance) {
        blockPlayerFromDeals(npc, player);
        resetLastInteraction(npc);

        npc.say(ccs('&cNo deal. You pushed too hard.'));
        npc.say(ccs('&7Come back later if you want to trade again.'));
        return;
    }

    saveDealData(npc, deal);

    npc.say(ccs('&eNo. My offer stays at &6' + formatMoney(deal.pawn_value) + '&e.'));
    npc.say(ccs('&7Use the item on me to accept.'));
}

function completePawnSale(npc, player, itemStack, deal) {
    if (isDealExpired(deal)) {
        npc.say(ccs('&7That offer has expired. Show me the item again if you still want to sell.'));
        resetLastInteraction(npc);
        return;
    }

    if (!isSameItemAsDeal(itemStack, deal)) {
        npc.say(ccs('&cThat is not the item we were discussing.'));
        resetLastInteraction(npc);
        return;
    }

    removeOneItemFromMainhand(player, itemStack);
    payPlayerPawnValue(player, deal.pawn_value);

    npc.say(ccs('&aDeal. Here is &6' + formatMoney(deal.pawn_value) + '&a.'));
    resetLastInteraction(npc);
}

function verifyIfItemCanBePawned(npc, itemStack) {
    if (!itemStack || itemStack.isEmpty()) return false;
    if (!isNpcConfigured(npc)) return false;

    var lootTablePath = npc.getStoreddata().get(PAWN_LOOT_TABLE_KEY);

    if (!isItemInLootTable(lootTablePath, itemStack.getName())) {
        return false;
    }

    var value = getReferencePawnValue(itemStack);
    return value !== null && value > 0;
}

function getReferencePawnValue(itemStack) {
    var itemValue = getPriceFromItemStack(itemStack, 0, false);

    if (itemValue && itemValue > 0) {
        return Math.floor(itemValue);
    }

    return null;
}

function saveLastInteraction(npc, playerName, itemStack, pawnValue, referenceValue) {
    var deal = {
        player: playerName,
        item: convert_item_stack_to_json_data(itemStack),
        item_name: itemStack.getName(),
        item_damage: itemStack.getItemDamage(),
        pawn_value: pawnValue,
        reference_value: referenceValue,
        timestamp: new Date().getTime()
    };

    saveDealData(npc, deal);
}

function saveDealData(npc, deal) {
    npc.getStoreddata().put(PAWN_LAST_INTERACTION_KEY, JSON.stringify(deal));
}

function getLastInteraction(npc) {
    var sd = npc.getStoreddata();

    if (!sd.has(PAWN_LAST_INTERACTION_KEY)) {
        return null;
    }

    return JSON.parse(sd.get(PAWN_LAST_INTERACTION_KEY));
}

function resetLastInteraction(npc) {
    npc.getStoreddata().remove(PAWN_LAST_INTERACTION_KEY);
}

function isDealExpired(deal) {
    return new Date().getTime() - deal.timestamp > PAWN_HAGGLE_TIMEOUT_SECONDS * 1000;
}

function isSameItemAsDeal(itemStack, deal) {
    if (!itemStack || itemStack.isEmpty()) return false;
    if (itemStack.getName() != deal.item_name) return false;
    if (itemStack.getItemDamage() != deal.item_damage) return false;

    return convert_item_stack_to_json_data(itemStack) == deal.item;
}

function blockPlayerFromDeals(npc, player) {
    var config = getNPCConfig(npc);
    var until = new Date().getTime() + config.blockTimer * 1000;
    npc.getStoreddata().put(PAWN_BLOCKED_PREFIX + player.getName(), String(until));
}

function isPlayerBlocked(npc, player) {
    return getPlayerBlockRemainingSeconds(npc, player) > 0;
}

function getPlayerBlockRemainingSeconds(npc, player) {
    var key = PAWN_BLOCKED_PREFIX + player.getName();
    var sd = npc.getStoreddata();

    if (!sd.has(key)) return 0;

    var until = parseInt(sd.get(key));
    var remaining = Math.ceil((until - new Date().getTime()) / 1000);

    if (remaining <= 0) {
        sd.remove(key);
        return 0;
    }

    return remaining;
}

function getNPCConfig(npc) {
    var sd = npc.getStoreddata();

    return {
        lootTable: sd.get(PAWN_LOOT_TABLE_KEY),
        honesty: parseInt(sd.get(PAWN_HONESTY_KEY)) / 100,
        haggleChance: parseInt(sd.get(PAWN_HAGGLE_KEY)) / 100,
        dealBreakChance: parseInt(sd.get(PAWN_DEAL_BREAK_CHANCE_KEY)) / 100,
        blockTimer: parseInt(sd.get(PAWN_BLOCK_TIMER_KEY))
    };
}

function isNpcConfigured(npc) {
    var sd = npc.getStoreddata();

    return sd.has(PAWN_LOOT_TABLE_KEY)
        && sd.has(PAWN_HONESTY_KEY)
        && sd.has(PAWN_HAGGLE_KEY)
        && sd.has(PAWN_DEAL_BREAK_CHANCE_KEY)
        && sd.has(PAWN_BLOCK_TIMER_KEY);
}

function convert_item_stack_to_json_data(itemStack) {
    return itemStack.getNbt().toJsonString();
}

function removeOneItemFromMainhand(player, itemStack) {
    var size = itemStack.getStackSize();
    itemStack.setStackSize(size - 1);
    player.setMainhandItem(itemStack);
}

function payPlayerPawnValue(player, amount) {
    var world = player.getWorld();
    var currencyItems = generateMoney(world, amount);
    for (var i = 0; i < currencyItems.length; i++) {
        if(!player.giveItem(currencyItems[i])) {
            player.dropItem(currencyItems[i]);
        }
    }
}

function isAdmin(offhandItem) {
    return offhandItem && !offhandItem.isEmpty() && offhandItem.getName() == 'mts:ivv.idcard_seagull';
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

function showAdminConfigurationHelp(npc, player) {
    var tutorialText = [
        '&6[Admin] &ePawn Shop NPC Configuration',
        '&7Use the following admin items on this NPC after renaming them to the value you want to set:',
        '',
        '&e- &f' + admin_config_items[PAWN_LOOT_TABLE_KEY].id + ' &7→ ' + admin_config_items[PAWN_LOOT_TABLE_KEY].name,
        '  ' + admin_config_items[PAWN_LOOT_TABLE_KEY].description,
        '',
        '&e- &f' + admin_config_items[PAWN_HONESTY_KEY].id + ' &7→ ' + admin_config_items[PAWN_HONESTY_KEY].name,
        '  ' + admin_config_items[PAWN_HONESTY_KEY].description,
        '',
        '&e- &f' + admin_config_items[PAWN_HAGGLE_KEY].id + ' &7→ ' + admin_config_items[PAWN_HAGGLE_KEY].name,
        '  ' + admin_config_items[PAWN_HAGGLE_KEY].description,
        '',
        '&e- &f' + admin_config_items[PAWN_DEAL_BREAK_CHANCE_KEY].id + ' &7→ ' + admin_config_items[PAWN_DEAL_BREAK_CHANCE_KEY].name,
        '  ' + admin_config_items[PAWN_DEAL_BREAK_CHANCE_KEY].description,
        '',
        '&e- &f' + admin_config_items[PAWN_BLOCK_TIMER_KEY].id + ' &7→ ' + admin_config_items[PAWN_BLOCK_TIMER_KEY].name,
        '  ' + admin_config_items[PAWN_BLOCK_TIMER_KEY].description,
        '',
        '&aUse a renamed item on this NPC to apply the corresponding configuration.'
    ];

    storytellPlayer(player, tutorialText);
}
