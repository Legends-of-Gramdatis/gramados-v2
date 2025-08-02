load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_emotes.js')
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js')


var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var FileUtils = Java.type('java.nio.file.Files');
var Paths = Java.type('java.nio.file.Paths');

var config = loadJson("world/customnpcs/scripts/ecmascript/modules/junkyard/config.json");

var ORDER_DATA_PATH = config.ORDER_DATA_PATH;
var ORDER_ITEM_ID = config.ORDER_ITEM_ID;
var ORDER_ITEM_NAME = config.ORDER_ITEM_NAME;
var ORDER_DELAY_HOURS = config.ORDER_DELAY_HOURS;

function interact(event) {
    var player = event.player;
    var npc = event.npc;

    if (!playerHasJobWithTag(player, "Mechanic")) {
        tellPlayer(player, "&c:cross: Only mechanics can interact with this board.");
        npc.executeCommand("/playsound minecraft:block.redstone_torch.burnout block @a ~ ~ ~ 10 1");
        return;
    }

    var world = player.getWorld();
    var orderData = loadJson(ORDER_DATA_PATH) || { players: {}, orders: [] };
    var playerName = player.getName();

    orderCleanup(world, orderData);

    var heldItem = player.getMainhandItem();

    if (heldItem && heldItem.getName() === ORDER_ITEM_ID) {
        processOrder(npc, player, heldItem, orderData);
        saveJson(orderData, ORDER_DATA_PATH);
        return;
        
    } else if (heldItem && heldItem.getName() === "minecraft:command_block") {

        tellPlayer(player, "&5:check: Generating copies of all ongoing orders.");
        npc.executeCommand("/playsound ivv:computer.new.off block @a ~ ~ ~ 10 1");

        orderData.orders.forEach(function(order) {
            var orderCopy = setupOrderNameLore(order, player.getWorld());
            player.giveItem(orderCopy);
        });
        return;

    } else {

        var currentTime = getAgeTick(world);
        var delay = TimeToTick(ORDER_DELAY_HOURS,0,0);
        var playerEntry = orderData.players[playerName] || getDefaultPlayerEntry();
        
        if (heldItem.isEmpty()) {

            if (delay > 0 && currentTime - playerEntry.lastOrderTime < delay) {

                npc.executeCommand("/playsound minecraft:block.redstone_torch.burnout block @a ~ ~ ~ 10 1");
                tellPlayer(player, "&c:cross: You must wait before generating a new order.");
            
            } else {

                npc.executeCommand("/playsound ivv:computer.new.off block @a ~ ~ ~ 10 1");

                var newOrder = generateOrder(player, playerName, world);
                orderData.orders.push(newOrder);

                playerEntry.lastOrderTime = currentTime;
                playerEntry.totalOrdersGiven++;
                orderData.players[playerName] = playerEntry;

                saveJson(orderData, ORDER_DATA_PATH);

                player.giveItem(setupOrderNameLore(newOrder, player.getWorld()));

                tellPlayer(player, "&a:check: You have received a new order! Check your hand for the order form.");
                
            }

        } else if (heldItem && isItemInLootTable("world/loot_tables/" + _LOOTTABLE_CELLPHONES, heldItem.getName())) {
        
            npc.executeCommand("/playsound ivv:phone.business.blip block @a ~ ~ ~ 10 1");

            var nextOrderTime = playerEntry.lastOrderTime + delay;
            var timeLeft = getTimeLeftBeforeTick(world, nextOrderTime);

            if (timeLeft > 0) {
                tellPlayer(player, ":clock_day:&eTime left before you can take a new order: " + TicksToHumanReadable(timeLeft));
            } else {
                tellPlayer(player, "&a:check: You can take a new order now!");
            }
            return;

        }
    }
}

function generateOrder(player, playerName, world) {
    var lootTable = pullLootTable(_LOOTTABLE_JUNKYARD_ORDERS, player);
    var parts = [];
    var partlog = [];
    var totalPayout = 0;

    lootTable.forEach(function (entry) {
        var itemStack = generateItemStackFromLootEntry(entry, world);
        parts.push({
            id: itemStack.getName(),
            count: entry.count,
            displayName: itemStack.getItemName()
        });
        partlog.push(itemStack.getName() + " x" + entry.count);
        // tellPlayer(player, "&aYou have received a new order for: §b" + itemStack.getItemName() + "§a x" + entry.count);
        // logToFile("mechanics", "Player " + playerName + " received order for " + itemStack.getItemName() + " x" + entry.count);
        totalPayout += getPriceFromItemStack(itemStack, 30000, true); // Base price of 300.00 grons per item
        totalPayout *= entry.count; // Multiply by the count of items

        
        // always allow a margin above part value (between 10 and 20 percent)
        var margin = Math.random() * 0.1 + 0.1; // Random margin between 10% and 20%
        totalPayout += Math.floor(totalPayout * margin);
    });

    var orderId = "order_" + Math.floor(Math.random() * 1000000);
    var currentDate = getAgeTick(world);
    var daysToAdd = Math.floor(Math.random() * 4) + 1; // Randomly generate between 1 and 4 days
    var expiryDate = currentDate + IRLDaysToTicks(daysToAdd);

    // Adjust payout based on deadline (shorter deadlines increase payout)
    var deadlineMultiplier = 1 + (3 - daysToAdd) * 0.1; // 10% increase per day less than 3
    totalPayout = Math.floor(totalPayout * deadlineMultiplier);

    var tolerance = Math.random() * 0.3; // 30% tolerance

    logToFile("mechanics", playerName + " was granted an order: " + partlog.join(", ") + ", Payout: " + getAmountCoin(totalPayout) + ", Tolerance: " + tolerance);

    return {
        id: orderId,
        player: playerName,
        parts: parts,
        generatedDate: currentDate,
        expiryDate: expiryDate,
        payout: totalPayout,
        tolerance: tolerance
    };
}

function processOrder(npc, player, heldItem, orderData) {
    // Extract order ID from the item's lore
    var lore = heldItem.getLore();
    var orderId = null;
    var world = player.getWorld();

    for (var i = 0; i < lore.length; i++) {
        if (lore[i].startsWith("§8§oOrder ID: ")) {
            orderId = lore[i].substring("§8§oOrder ID: ".length);
            break;
        }
    }

    if (!orderId) {
        tellPlayer(player, "&c:cross: Invalid order ID.");
        npc.executeCommand("/playsound minecraft:block.redstone_torch.burnout block @a ~ ~ ~ 10 1");
        return;
    }

    // Check if the order ID is in the uncompleted orders list
    if (includes(orderData.uncompletedOrders && orderData.uncompletedOrders, orderId)) {
        // Remove the order ID from the uncompleted orders list
        orderData.uncompletedOrders = orderData.uncompletedOrders.filter(function(id) {
            return id !== orderId;
        });

        // Generate a compensation cookie
        var cookie = world.createItem("minecraft:cookie", 0, 1);
        cookie.setCustomName("§6Compensation Cookie");
        cookie.setLore([
            "§7A sweet treat for your troubles!",
            "§7Order ID: " + orderId,
            "§8§o" + player.getName() + " deserves a break!"
        ]);

        // Give the cookie to the player
        player.giveItem(cookie);

        // Log the action
        logToFile("mechanics", player.getName() + " returned outdated order " + orderId + " and received a compensation cookie.");

        // Remove the order item from the player's inventory
        heldItem.setStackSize(heldItem.getStackSize() - 1);
        if (heldItem.getStackSize() <= 0) {
            player.setMainhandItem(player.getWorld().createItem("minecraft:air", 0, 1));
        }

        tellPlayer(player, "&a:check: Outdated order returned. Enjoy your compensation cookie!");
        npc.executeCommand("/playsound minecraft:entity.experience_orb.pickup block @a ~ ~ ~ 10 1");
        saveJson(orderData, ORDER_DATA_PATH);

        grantBadgeAndEmotes(player, "too_late", ["clock_night", "clock_4", "clock_5", "clock_6", "slowness", "dead_bush", "cobweb"]);
        return;
    }

    // Use a loop to find the order instead of .find()
    var order = null;
    for (var i = 0; i < orderData.orders.length; i++) {
        if (orderData.orders[i].id === orderId) {
            order = orderData.orders[i];
            break;
        }
    }

    if (!order) {
        tellPlayer(player, "&c:cross: Invalid order ID.");
        npc.executeCommand("/playsound minecraft:block.redstone_torch.burnout block @a ~ ~ ~ 10 1");
        return;
    }

    var currentTime = getAgeTick(world);
    var originalDeadline = order.expiryDate;
    var lateTime = originalDeadline - order.generatedDate;
    var toleranceTime = originalDeadline + (lateTime * order.tolerance);
    var toleranceDeadline = TicksToHumanReadable(toleranceTime);
    // tellPlayer(player, "&6Order ID: §f" + order.id + " §6| Expiry Date: §f" + expiryDate + " §6| Tolerance: §f" + (order.tolerance * 100).toFixed(2) + "% §6| Tolerance Date: §f" + toleranceDate + ".");

    var adjustedPayout = order.payout;

    if (currentTime > toleranceTime) {
        tellPlayer(player, "&c:cross: The order has expired and cannot be completed. You had to complete it by " + toleranceDeadline + ".");
        npc.executeCommand("/playsound minecraft:block.redstone_torch.burnout block @a ~ ~ ~ 10 1");

        // Cleanup JSON entries
        var orderIndex = -1;
        for (var i = 0; i < orderData.orders.length; i++) {
            if (orderData.orders[i].id === orderId) {
                orderIndex = i;
                break;
            }
        }
        if (orderIndex !== -1) {
            orderData.orders.splice(orderIndex, 1);
        }

        var playerEntry = orderData.players[order.player];
        if (playerEntry) {
            playerEntry.totalOrdersUncompleted++;
        }

        // Remove the order item from the player's inventory
        heldItem.setStackSize(heldItem.getStackSize() - 1);
        if (heldItem.getStackSize() <= 0) {
            player.setMainhandItem(player.getWorld().createItem("minecraft:air", 0, 1));
        }

        saveJson(orderData, ORDER_DATA_PATH);
        return;
    }

    // Calculate payout reduction if completed after the original deadline
    if (currentTime > originalDeadline) {
        var generatedDate = order.generatedDate;
        var orderDuration = originalDeadline - generatedDate; // Total time between generatedDate and expiryDate
        var toleranceDuration = orderDuration * order.tolerance; // Tolerance duration based on the multiplier
        var toleranceEndTime = originalDeadline + toleranceDuration; // End time including tolerance

        if (currentTime > toleranceEndTime) {
            tellPlayer(player, "&c:cross: The order has expired and cannot be completed. You had to complete it by " + TicksToHumanReadable(toleranceEndTime) + ".");
            npc.executeCommand("/playsound minecraft:block.redstone_torch.burnout block @a ~ ~ ~ 10 1");

            // Cleanup JSON entries
            var orderIndex = -1;
            for (var i = 0; i < orderData.orders.length; i++) {
                if (orderData.orders[i].id === orderId) {
                    orderIndex = i;
                    break;
                }
            }
            if (orderIndex !== -1) {
                orderData.orders.splice(orderIndex, 1);
            }

            var playerEntry = orderData.players[order.player];
            if (playerEntry) {
                playerEntry.totalOrdersLate++;
            }

            // Remove the order item from the player's inventory
            heldItem.setStackSize(heldItem.getStackSize() - 1);
            if (heldItem.getStackSize() <= 0) {
                player.setMainhandItem(player.getWorld().createItem("minecraft:air", 0, 1));
            }

            saveJson(orderData, ORDER_DATA_PATH);
            return;
        }

        // Calculate payout reduction if completed after the original deadline but within tolerance
        if (currentTime > originalDeadline) {
            var lateTime = currentTime - originalDeadline; // Time past the expiryDate
            var maxLateTime = toleranceDuration; // Maximum allowable late time
            var lateFactor = lateTime / maxLateTime; // Proportion of lateness within tolerance
            var reductionFactor = lateFactor / 2; // Reduction is half the lateness proportion
            var adjustedPayout = Math.max(0, Math.floor(order.payout * (1 - reductionFactor)));

            tellPlayer(player, ":danger: §eThe order is Expired, but remains within tolerance. Payout has been reduced to &r:money:&e" + getAmountCoin(adjustedPayout) + " instead of &r:money:&e" + getAmountCoin(order.payout) + ".");
            npc.executeCommand("/playsound minecraft:entity.experience_orb.pickup block @a ~ ~ ~ 10 1");

            // Use adjustedPayout for payment without modifying order.payout in the JSON
            order.payout = adjustedPayout;
        }
    }

    var inventory = player.getInventory().getItems();
    var hasAllParts = true;

    for (var j = 0; j < order.parts.length; j++) {
        var part = order.parts[j];
        var totalCount = 0;

        for (var k = 0; k < inventory.length; k++) {
            var itemStack = inventory[k];
            if (itemStack && itemStack.getName() === part.id) {
                totalCount += itemStack.getStackSize();
            }
        }

        if (totalCount < part.count) {
            hasAllParts = false;
            break;
        }
    }

    if (!hasAllParts) {
        tellPlayer(player, "&c:cross: You do not have all the required parts to complete this order.");
        npc.executeCommand("/playsound minecraft:block.redstone_torch.burnout block @a ~ ~ ~ 10 1");
        return;
    }

    // Remove items from inventory
    order.parts.forEach(function (part) {
        for (var i = 0; i < inventory.length; i++) {
            var itemStack = inventory[i];
            if (itemStack && itemStack.getName() === part.id) {
                var toRemove = Math.min(itemStack.getStackSize(), part.count);
                itemStack.setStackSize(itemStack.getStackSize() - toRemove);
                part.count -= toRemove;
                if (part.count <= 0) break;
            }
        }
    });

    var world = player.getWorld();

    // Pay the player
    tellPlayer(player, "&a:check: Order completed! You have been paid &r:money:&a " + getAmountCoin(adjustedPayout) + ".");
    npc.executeCommand("/playsound minecraft:entity.player.levelup block @a ~ ~ ~ 10 1");
    logToFile("mechanics", player.getName() + " completed order " + orderId + " for payout: " + getAmountCoin(adjustedPayout));
    var moneyItems = generateMoney(world, adjustedPayout);
    for (var i = 0; i < moneyItems.length; i++) {
        npc.dropItem(moneyItems[i]);
    }

    // Update order data
    var playerEntry = orderData.players[order.player];
    if (order.player === player.getName()) {
        playerEntry.totalOrdersCompleted++;
    } else {
        playerEntry.totalOrdersCompletedNotAssigned++;
    }

    // Remove the completed order from the list
    var orderIndex = -1;
    for (var i = 0; i < orderData.orders.length; i++) {
        if (orderData.orders[i].id === orderId) {
            orderIndex = i;
            break;
        }
    }
    if (orderIndex !== -1) {
        orderData.orders.splice(orderIndex, 1);
    }

    // Decrease the stack size of the order item by 1
    // tellPlayer(player, "&a:check: You have completed the order. The order form will be removed from your hand.");
    heldItem.setStackSize(heldItem.getStackSize() - 1);
    if (heldItem.getStackSize() <= 0) {
        player.setMainhandItem(world.createItem("minecraft:air", 0, 1)); // Remove the item from hand
    }
}

function setupOrderNameLore(order_data, world) {
    var item = world.createItem(ORDER_ITEM_ID, 0, 1);
    item.setCustomName(ORDER_ITEM_NAME);
    var lore = [
        "§7Requested Part(s):"
    ];

    order_data.parts.forEach(function (part) {
        lore.push("§f- §b" + part.count + "x§f - " + part.displayName);
        lore.push(parseEmotes("  §8:arrow_r: §o" + part.id ));
    });

    lore.push("§6Payout: §a" + getAmountCoin(order_data.payout));
    lore.push("§3Order expires on: §f" + TicksToDate(order_data.expiryDate));
    lore.push("§8§oOrder ID: " + order_data.id); // Add order ID in a discrete format
    lore.push("§8§oOriginal Player: " + order_data.player); // Add original player in a discrete format
    item.setLore(lore);
    return item;
}

function orderCleanup(world, orderData) {
    var currentTime = getAgeTick(world);

    // Initialize uncompleted orders list if not present
    if (!orderData.uncompletedOrders) {
        orderData.uncompletedOrders = [];
    }

    // Iterate through orders to check deadlines
    for (var i = orderData.orders.length - 1; i >= 0; i--) {
        var order = orderData.orders[i];

        // Convert generatedDate and expiryDate from ISO format to ticks if necessary
        if (typeof order.generatedDate === "string") {
            order.generatedDate = new Date(order.generatedDate).getTime() * 20 / 1000; // Convert milliseconds to ticks
        }
        if (typeof order.expiryDate === "string") {
            order.expiryDate = new Date(order.expiryDate).getTime() * 20 / 1000; // Convert milliseconds to ticks
        }

        var expiryDate = order.expiryDate;
        var toleranceTime = expiryDate + ((expiryDate - order.generatedDate) * order.tolerance);

        // If the order is past tolerance time, mark as uncompleted
        if (currentTime > toleranceTime) {
            var playerEntry = orderData.players[order.player];
            if (playerEntry) {
                playerEntry.totalOrdersUncompleted = (playerEntry.totalOrdersUncompleted || 0) + 1;
            }

            // Add order ID to uncompleted orders list
            orderData.uncompletedOrders.push(order.id);

            // Remove the order from the main list
            orderData.orders.splice(i, 1);
        }
    }

    // Save updated order data
    saveJson(orderData, ORDER_DATA_PATH);
}

function getDefaultPlayerEntry() {
    return {
        lastOrderTime: 0,
        totalOrdersGiven: 0,
        totalOrdersCompleted: 0,
        totalOrdersCompletedNotAssigned: 0,
        totalOrdersUncompleted: 0,
        totalOrdersLate: 0
    };
}