load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_global_prices.js");


var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var FileUtils = Java.type('java.nio.file.Files');
var Paths = Java.type('java.nio.file.Paths');

var ORDER_DATA_PATH = "world/customnpcs/scripts/data_auto/parts_orders.json";
var ORDER_ITEM_ID = "variedcommodities:plans";
var ORDER_ITEM_NAME = "§eVehicle Part Order Form";
var ORDER_DELAY_HOURS = 6; // Configurable variable for time delay between orders (in hours). Set to 0 for unlimited orders.

function interact(event) {
    var player = event.player;
    var playerName = player.getName();
    var world = player.getWorld();
    var npc = event.npc;

    // Load or initialize order data
    var orderData = loadJson(ORDER_DATA_PATH) || { players: {}, orders: [] };

    // Check if player is a mechanic
    if (!playerHasJobWithTag(player, "Mechanic")) {
        tellPlayer(player, "§c:cross: Only mechanics can interact with this board.");
        npc.executeCommand("/playsound minecraft:block.redstone_torch.burnout block @a ~ ~ ~ 10 1");
        return;
    }

    // If player is holding an order, process it
    var heldItem = player.getMainhandItem();
    if (heldItem && heldItem.getName() === ORDER_ITEM_ID) {
        processOrder(npc, player, heldItem, orderData);
        saveJson(orderData, ORDER_DATA_PATH);
        return;
    }

    // If player is holding a command block (admin action), provide copies of all ongoing orders
    if (heldItem && heldItem.getName() === "minecraft:command_block") {
        tellPlayer(player, "§a:check: Admin action detected. Generating copies of all ongoing orders.");
        orderData.orders.forEach(function(order) {
            var orderCopy = setupOrderNameLore(order, player.getWorld());
            player.giveItem(orderCopy);
        });
        return;
    }

    // If player is holding an item from the _LOOTTABLE_CELLPHONES loot table, display time left
    if (heldItem && isItemInLootTable("world/loot_tables/" + _LOOTTABLE_CELLPHONES, heldItem.getName())) {
        npc.executeCommand("/playsound ivv:phone.business.blip block @a ~ ~ ~ 10 1");
        var playerEntry = orderData.players[playerName] || {
            lastOrderTime: 0,
            totalOrdersGiven: 0,
            totalOrdersCompleted: 0,
            totalOrdersCompletedNotAssigned: 0,
            totalOrdersUncompleted: 0,
            totalOrdersLate: 0
        };

        var currentTime = new Date().getTime();
        var timeLeft = Math.max(0, ORDER_DELAY_HOURS * 60 * 60 * 1000 - (currentTime - playerEntry.lastOrderTime));

        if (timeLeft > 0) {
            var hours = Math.floor(timeLeft / (1000 * 60 * 60));
            var minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            tellPlayer(player, "§e:clock: Time left before you can take a new order: " + hours + " hours and " + minutes + " minutes.");
        } else {
            tellPlayer(player, "§a:check: You can take a new order now!");
        }
        return;
    }

    // If player is not holding an item, generate a new order
    if (heldItem.isEmpty()) {
        var playerEntry = orderData.players[playerName] || {
            lastOrderTime: 0,
            totalOrdersGiven: 0,
            totalOrdersCompleted: 0,
            totalOrdersCompletedNotAssigned: 0,
            totalOrdersUncompleted: 0,
            totalOrdersLate: 0
        };

        var currentTime = new Date().getTime();
        if (ORDER_DELAY_HOURS > 0 && currentTime - playerEntry.lastOrderTime < ORDER_DELAY_HOURS * 60 * 60 * 1000) {
            tellPlayer(player, "§c:cross: You must wait before generating a new order.");
            npc.executeCommand("/playsound minecraft:block.redstone_torch.burnout block @a ~ ~ ~ 10 1");
            return;
        }

        var newOrder = generateOrder(player, playerName, world);
        orderData.orders.push(newOrder);

        playerEntry.lastOrderTime = currentTime;
        playerEntry.totalOrdersGiven++;
        orderData.players[playerName] = playerEntry;

        saveJson(orderData, ORDER_DATA_PATH);
        player.giveItem(setupOrderNameLore(newOrder, player.getWorld()));
        tellPlayer(player, "§a:check: You have received a new order! Check your hand for the order form.");
        npc.executeCommand("/playsound ivv:computer.new.off block @a ~ ~ ~ 10 1");
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
        // tellPlayer(player, "§aYou have received a new order for: §b" + itemStack.getItemName() + "§a x" + entry.count);
        // logToFile("mechanics", "Player " + playerName + " received order for " + itemStack.getItemName() + " x" + entry.count);
        totalPayout += getPriceFromItemStack(itemStack, 10000, true); // Base price of 100.00 grons per item
        totalPayout *= entry.count; // Multiply by the count of items

        
        // always allow a margin above part value (between 10 and 20 percent)
        var margin = Math.random() * 0.1 + 0.1; // Random margin between 10% and 20%
        totalPayout += Math.floor(totalPayout * margin);
    });

    var orderId = "order_" + Math.floor(Math.random() * 1000000);
    var currentDate = new Date();
    var daysToAdd = Math.floor(Math.random() * 3) + 1; // Randomly generate between 1 and 3 days
    var expiryDate = new Date(currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    // Adjust payout based on deadline (shorter deadlines increase payout)
    var deadlineMultiplier = 1 + (3 - daysToAdd) * 0.1; // 10% increase per day less than 3
    totalPayout = Math.floor(totalPayout * deadlineMultiplier);

    var tolerance = Math.random() * 0.3; // 30% tolerance

    logToFile("mechanics", playerName + " was granted an order: " + partlog.join(", ") + ", Payout: " + getAmountCoin(totalPayout) + ", Tolerance: " + tolerance);

    return {
        id: orderId,
        player: playerName,
        parts: parts,
        generatedDate: currentDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        payout: totalPayout,
        tolerance: tolerance
    };
}

function processOrder(npc, player, heldItem, orderData) {
    // Extract order ID from the item's lore
    var lore = heldItem.getLore();
    var orderId = null;

    for (var i = 0; i < lore.length; i++) {
        if (lore[i].startsWith("§8§oOrder ID: ")) {
            orderId = lore[i].replace("§8§oOrder ID: ", "").trim();
            break;
        }
    }

    if (!orderId) {
        tellPlayer(player, "§c:cross: Invalid order ID.");
        npc.executeCommand("/playsound minecraft:block.redstone_torch.burnout block @a ~ ~ ~ 10 1");
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
        tellPlayer(player, "§c:cross: Invalid order ID.");
        npc.executeCommand("/playsound minecraft:block.redstone_torch.burnout block @a ~ ~ ~ 10 1");
        return;
    }

    var currentTime = new Date();
    var expiryDate = new Date(order.expiryDate);
    var lateTime = new Date(expiryDate - new Date(order.generatedDate));
    var toleranceTime = expiryDate.getTime() + (lateTime * order.tolerance);
    var toleranceDate = new Date(toleranceTime);
    // tellPlayer(player, "§6Order ID: §f" + order.id + " §6| Expiry Date: §f" + expiryDate.toISOString() + " §6| Tolerance: §f" + (order.tolerance * 100).toFixed(2) + "% §6| Tolerance Date: §f" + toleranceDate.toISOString() + ".");

    // var days = Math.floor(lateTime / (1000 * 60 * 60 * 24));
    // var hours = Math.floor((lateTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    // var minutes = Math.floor((lateTime % (1000 * 60 * 60)) / (1000 * 60));
    // var seconds = Math.floor((lateTime % (1000 * 60)) / 1000);
    // tellPlayer(player, "§6Tolerance Time: §f" + days + " days, " + hours + " hours, " + minutes + " minutes, " + seconds + " seconds.");
    var adjustedPayout = order.payout;

    if (currentTime.getTime() > toleranceTime) {
        tellPlayer(player, "§c:cross: The order has expired and cannot be completed. You had to complete it by " + toleranceDate.toISOString() + ".");
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
    if (currentTime.getTime() > expiryDate.getTime()) {
        var generatedDate = new Date(order.generatedDate);
        var orderDuration = expiryDate.getTime() - generatedDate.getTime(); // Total time between generatedDate and expiryDate
        var toleranceDuration = orderDuration * order.tolerance; // Tolerance duration based on the multiplier
        var toleranceEndTime = expiryDate.getTime() + toleranceDuration; // End time including tolerance

        if (currentTime.getTime() > toleranceEndTime) {
            tellPlayer(player, "§c:cross: The order has expired and cannot be completed. You had to complete it by " + new Date(toleranceEndTime).toISOString() + ".");
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
        if (currentTime.getTime() > expiryDate.getTime()) {
            var lateTime = currentTime.getTime() - expiryDate.getTime(); // Time past the expiryDate
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
        tellPlayer(player, "§c:cross: You do not have all the required parts to complete this order.");
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
    // tellPlayer(player, "§a:check: You have completed the order. The order form will be removed from your hand.");
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
    lore.push("§3Order expires on: §f" + order_data.expiryDate.split('T')[0]);
    lore.push("§8§oOrder ID: " + order_data.id); // Add order ID in a discrete format
    lore.push("§8§oOriginal Player: " + order_data.player); // Add original player in a discrete format
    item.setLore(lore);
    return item;
}