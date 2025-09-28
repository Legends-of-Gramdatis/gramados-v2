load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");


function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var item = player.getMainhandItem().copy();
    var itemName = item.getName();

    if (itemName === "growthcraft:crowbar") {
        if (isValidKey(item, player)) {

            if (!npc.getTimers().has(1)) {
                tellPlayer(player, "&a:check_mark: You pry open the crate with the crowbar.");
                npc.executeCommand("/playsound minecraft:entity.zombie.break_door_wood block @a ~ ~ ~ 1 1");
                var command = "/particle happyVillager " + npc.getX() + " " + (npc.getY() + 1) + " " + npc.getZ() + " 0.5 0.5 0.5 0.1 10";
                npc.executeCommand(command);
                npc.getDisplay().setSkinUrl("https://legends-of-gramdatis.com/gramados_skins/Gramados_slime_crate_wooden_broken.png");
                npc.getTimers().start(1, 20*60, false);
                lootCrate(player, item, npc);
            } else {
                tellPlayer(player, "&c:cross_mark: This crate is already open.");
            }
        } else {
            tellPlayer(player, "&c:cross_mark: This crowbar is not valid for this crate.");
            return;
        }
    } else if (itemName === "minecraft:command_block") {
        // reset timer
        npc.getTimers().stop(1);
        tellPlayer(player, "&a:check_mark: The crate has been reset.");
        npc.executeCommand("/playsound ivv:computer.gaming.deleted player @a");
        npc.getDisplay().setSkinUrl("https://legends-of-gramdatis.com/gramados_skins/Gramados_slime_crate_wooden.png");
    } else {
        tellPlayer(player, "&c:cross_mark: You need a crowbar to open this crate.");
        return;
    }
}

function timer(event) {
    event.npc.getDisplay().setSkinUrl("https://legends-of-gramdatis.com/gramados_skins/Gramados_slime_crate_wooden.png");
    event.npc.getTimers().stop(1);
}

function isValidKey(item, player) {
    var itemLore = item.getLore();
    if (itemLore.length < 3) {
        tellPlayer(player, "&c:cross_mark: This crowbar is not valid for this crate.");
        return 0;
    }
    if (itemLore[0] == "§7One-use crowbar to pry open a sealed parts crate."
        && itemLore[1] == "§8Marked by the Junkyard Authority."
        && itemLore[2] == "§2§o\"Snap it, loot it, toss it.\""
    ) {
        return 1;
    }
}

function lootCrate(player, item, npc) {
    item.setStackSize(item.getStackSize() - 1);
    player.setMainhandItem(item);
    var loot = pullLootTable(_LOOTTABLE_JUNKYARD_CRATE, player);
    var value_estimate = 0;
    var logline = player.getName() + " opened a Junkyard Crate and received: ";
    for (var i = 0; i < loot.length; i++) {
        var stack = generateItemStackFromLootEntry(loot[i], world);
        value_estimate += getPriceFromItemStack(stack, 10000, false);
        npc.dropItem(stack);
        logline += loot[i].id + ":" + loot[i].damage + " x" + loot[i].count;
        if (i < loot.length - 1) {
            logline += ", ";
        }
    }
    logline += " (estimated value: " + getAmountCoin(value_estimate) + ")";
    logToFile("mechanics", logline);
}