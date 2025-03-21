if (message.startsWith("$shop create")) {
        var args = message.split(" ");
        var name = null;
        var type = null;
        var region = null;
        var sub_region = null;
        var money = 0;

        if (args.length > 2) {
            for (var i = 2; i < args.length; i++) {
                var value = getProperty(args[i]);
                switch (value.propertyName) {
                    case "name":
                        name = value.value;
                        break;
                    case "type":
                        type = value.value;
                        break;
                    case "region":
                        region = value.value;
                        break;
                    case "sub_region":
                        sub_region = value.value;
                        break;
                    case "money":
                        money = parseInt(value.value) || 0;
                        break;
                }
            }
        }

        if (!name || !type || !region || !sub_region) {
            tellPlayer(player, "&cMissing parameters! Usage: &e$shop create name=<name> type=<type> region=<region> sub_region=<sub_region> [money=<money>]");
            return;
        }

        createShop(player, type, region, sub_region, convertUnderscore(name), money);
    } else if (message.startsWith("$shop delete")) {    
        var args = message.split(" ");
        if (args.length === 3) {
            var shopId = parseInt(args[2]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[2]);
                return;
            }
            deleteShop(player, shopId);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop delete <ID>");
        }
    } else if (message.startsWith("$shop type switch")) {
        var args = message.split(" ");
        if (args.length === 5) {
            var shopId = parseInt(args[3]);
            var newType = args[4];
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            var shop = playerShops[shopId];

            if (!hasPermission(player.getName(), shop, PERMISSION_TYPE_SWITCH)) {
                tellPlayer(player, "&cYou don't have permission to switch shop types!");
                return;
            }
            shop.shop.type = newType;
            initStockRoom(player, shopId, playerShops);
            removeOutdatedListedItems(player, shop, newType);
            saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
            tellPlayer(player, "&aShop type switched to &e" + newType + " &afor shop &e" + shopId);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop type switch <ID> <NewType>");
        }
    } else if (message.startsWith("$shop property set")) {
        var args = message.split(" ");
        if (args.length < 4) {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop property set <ID> [name=<name>] [type=<type>] [region=<region>] [sub_region=<sub_region>] [money=<money>]");
            return;
        }

        var shopId = parseInt(args[3]);
        if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
            tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
            tellPlayer(player, "&cUse \"_\" for spaces in the values");
            return;
        }

        var shop = playerShops[shopId];

        var name = shop.shop.display_name || null;
        var type = shop.shop.type || null;
        var region = shop.property.region || null;
        var sub_region = shop.property.sub_region || null;
        var money = shop.finances.stored_cash || 0;

        if (args.length > 4) {
            for (var i = 4; i < args.length; i++) {
                var value = getProperty(args[i]);
                switch (value.propertyName) {
                    case "name":
                        shop.shop.display_name = convertUnderscore(value.value);
                        break;
                    case "type":
                        shop.shop.type = value.value;
                        initStockRoom(player, shopId, playerShops);
                        removeOutdatedListedItems(player, shop, value.value);
                        break;
                    case "region":
                        if (!checkRegionExists(value.value)) {
                            tellPlayer(player, "&cInvalid region: &e" + value.value);
                            return;
                        }
                        shop.property.region = value.value;
                        break;
                    case "sub_region":
                        if (!checkSubRegionExists(region, value.value)) {
                            tellPlayer(player, "&cInvalid sub-region: &e" + value.value);
                            return;
                        }
                        shop.property.sub_region = value.value;
                        break;
                    case "money":
                        shop.finances.stored_cash = parseInt(value.value) || 0;
                        break;
                    default:
                        tellPlayer(player, "&cUnknown property: &e" + value.propertyName);
                        return;
                }
            }
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop property set <ID> [name=<name>] [type=<type>] [region=<region>] [sub_region=<sub_region>] [money=<money>]");
            tellPlayer(player, "&cUse \"_\" for spaces in the values");
        }

        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aShop properties updated!");
    } else if (message.startsWith("$shop property add")) {
        var args = message.split(" ");
        if (args.length < 4) {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop property add <ID> [stock_room=<region>] [main_room=<region>]");
            return;
        }

        var shopId = parseInt(args[3]);
        if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
            tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
            return;
        }

        var shop = playerShops[shopId];
        if (args.length > 4) {
            for (var i = 4; i < args.length; i++) {
                var value = getProperty(args[i]);
                switch (value.propertyName) {
                    case "stock_room":
                        addStockRoom(player, shopId, playerShops, value.value);
                        break;
                    case "main_room":
                        shop.property.main_room.push(value.value);
                        tellPlayer(player, "&aMain room added: &e" + value.value);
                        var decomposed_cuboid_name = value.value.split(":");
                        var cuboid_name = decomposed_cuboid_name[0];
                        var sub_cuboid_id = decomposed_cuboid_name[1];
                        var size = calculateCuboidSize(player, cuboid_name, [sub_cuboid_id]);
                        tellPlayer(player, "&aMain room size: &e" + size + " air blocks");
                        break;
                }
            }
        }

        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aShop properties updated!");
    } else if (message.startsWith("$shop property remove")) {
        var args = message.split(" ");
        if (args.length < 4) {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop property remove <ID> [stock_room=<index_or_name>] [main_room=<index_or_name>]");
            return;
        }

        var shopId = parseInt(args[3]);
        if (isNaN(shopId)) {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop property remove <ID> [stock_room=<index_or_name>] [main_room=<index_or_name>]");
            return;
        }

        var shop = playerShops[shopId];
        if (args.length > 4) {
            for (var i = 4; i < args.length; i++) {
                var value = getProperty(args[i]);
                switch (value.propertyName) {
                    case "stock_room":
                        if (!removeStockRoom(player, shopId, playerShops, value.value)) {
                            tellPlayer(player, "&cRegion &e" + value.value + " &cnot found in stock_room!");
                            tellPlayer(player, "&cAvailable regions: &e" + shop.property.stock_room.join(", "));
                        }
                        break;
                    case "main_room":
                        if (!removeRoom(shop.property.main_room, value.value)) {
                            tellPlayer(player, "&cRegion &e" + value.value + " &cnot found in main_room!");
                            tellPlayer(player, "&cAvailable regions: &e" + shop.property.main_room.join(", "));
                        }
                        break;
                }
            }
        }

        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aShop properties updated!");
    } else if (message.startsWith("$shop open")) {
        var args = message.split(" ");
        if (args.length === 3) {
            var shopId = parseInt(args[2]);
            openShop(player, shopId, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop open <ID>");
        }
    } else if (message.startsWith("$shop close")) {
        var args = message.split(" ");
        if (args.length === 3) {
            var shopId = parseInt(args[2]);
            closeShop(player, shopId);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop close <ID>");
        }
    } else if (message.startsWith("$shop stock add")) {
        var args = message.split(" ");
        if (args.length === 4) {
            var shopId = parseInt(args[3]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            addStockFromHand(player, shopId, playerShops);
        } else if (args.length === 5 && args[4] === "all") {
            var shopId = parseInt(args[3]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            addAllStockFromInventory(player, shopId, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop stock add <ID> or $shop stock add <ID> all");
        }
    } else if (message.startsWith("$shop stock remove")) {
        var args = message.split(" ");
        if (args.length >= 4) {
            var shopId = parseInt(args[3]);
            var itemIdOrIndex = args[4];
            var count = args.length === 6 ? parseInt(args[5]) : 64;
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            var shop = playerShops[shopId];
            var itemId = itemIdOrIndex;
            if (!isNaN(itemIdOrIndex)) {
                var index = parseInt(itemIdOrIndex);
                var keys = Object.keys(shop.inventory.stock);
                if (index >= 0 && index < keys.length) {
                    itemId = keys[index];
                } else {
                    tellPlayer(player, "&cInvalid item index: &e" + itemIdOrIndex);
                    return;
                }
            }
            removeStock(player, shop, itemId, count, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop stock remove <ID> <Item ID or index> [number]");
        }
    } else if (message.startsWith("$shop stock eval")) {
        evalHandItem(player);
    } else if (message.startsWith("$shop price set")) {
        var args = message.split(" ");
        if (args.length < 5) {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop price set <shopID> <itemID OR item index> <profit>");
            return;
        }

        var shopId = parseInt(args[3]);
        var itemIdOrIndex = args[4];
        var profit = args[5];

        if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
            tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
            return;
        }

        if (profit === "default") {
            var shop = playerShops[shopId];
            if (!shop.finances.default_margin) {
                tellPlayer(player, "&cNo default margin set for this shop!");
                return;
            }
            profit = shop.finances.default_margin * 100 + "%";
        }

        setPrice(player, shopId, itemIdOrIndex, profit, playerShops);
    } else if (message.startsWith("$shop price remove")) {
        var args = message.split(" ");
        if (args.length === 5) {
            var shopId = parseInt(args[3]);
            var itemIdOrIndex = args[4];
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            removeListedItem(player, shopId, itemIdOrIndex, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop price remove <shopID> <itemID OR item index>");
        }
    } else if (message.startsWith("$shop price default")) {
        var args = message.split(" ");
        if (args.length < 4) {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop price default <shopID> <percentage>");
            return;
        }

        var shopId = parseInt(args[3]);
        var defaultMargin = args[4];

        var shop = playerShops[shopId];
        if (!shop) {
            tellPlayer(player, "&cShop with ID &e" + shopId + " &cnot found!");
            return;
        }

        if (!hasPermission(player.getName(), shop, PERMISSION_SET_PRICES)) {
            tellPlayer(player, "&cYou don't have permission to set prices for this shop!");
            return;
        }

        if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
            tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
            return;
        }

        if (!defaultMargin) {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop price default <shopID> <percentage>");
            return;
        }

        if (!defaultMargin.endsWith("%")) {
            tellPlayer(player, "&cInvalid percentage format! Use a percentage value (e.g., 10%)");
            return;
        }

        var percent = parseFloat(defaultMargin.slice(0, -1));
        if (isNaN(percent)) {
            tellPlayer(player, "&cInvalid percentage value!");
            return;
        }
        shop.finances.default_margin = percent / 100;
        saveJson(playerShops, SERVER_SHOPS_JSON_PATH);
        tellPlayer(player, "&aDefault margin set to &e" + defaultMargin + " &afor shop &e" + shopId);
    } else if (message.startsWith("$shop money put pouch")) {
        var args = message.split(" ");
        if (args.length === 6) {
            var shopId = parseInt(args[4]);
            var value = getCoinAmount(args[5]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[4]);
                return;
            }
            putMoneyInShopFromPouch(player, shopId, value, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop money put pouch <ID> <value>");
        }
    } else if (message.startsWith("$shop money take pouch")) {
        var args = message.split(" ");
        if (args.length === 6) {
            var shopId = parseInt(args[4]);
            var value = getCoinAmount(args[5]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[4]);
                return;
            }
            takeMoneyFromShopToPouch(player, shopId, value, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop money take pouch <ID> <value>");
        }
    } else if (message.startsWith("$shop money put")) {
        var args = message.split(" ");
        if (args.length === 4) {
            var shopId = parseInt(args[3]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            putMoneyInShop(player, shopId, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop money put <ID>");
        }
    } else if (message.startsWith("$shop money take")) {
        var args = message.split(" ");
        if (args.length === 5) {
            var shopId = parseInt(args[3]);
            var value = getCoinAmount(args[4]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            takeMoneyFromShop(player, shopId, value, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop money take <ID> <value>");
        }
    } else if (message.startsWith("$shop reputation add")) {
        var args = message.split(" ");
        if (args.length === 5) {
            var shopId = parseInt(args[3]);
            var amount = parseInt(args[4]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            if (isNaN(amount)) {
                tellPlayer(player, "&cInvalid amount: &e" + args[4]);
                return;
            }
            addShopReputation(player, shopId, amount, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop reputation add <ID> <Amount>");
        }
    } else if (message.startsWith("$shop reputation remove")) {
        var args = message.split(" ");
        if (args.length === 5) {
            var shopId = parseInt(args[3]);
            var amount = parseInt(args[4]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            if (isNaN(amount)) {
                tellPlayer(player, "&cInvalid amount: &e" + args[4]);
                return;
            }
            addShopReputation(player, shopId, -amount, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop reputation remove <ID> <Amount>");
        }
    } else if (message.startsWith("$shop reputation log")) {
        var args = message.split(" ");
        if (args.length === 4 || args.length === 5) {
            var shopId = parseInt(args[3]);
            var hours = args.length === 5 ? parseInt(args[4]) : 24;
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            if (isNaN(hours)) {
                tellPlayer(player, "&cInvalid time: &e" + args[4]);
                return;
            }
            logShopReputation(player, shopId, hours, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop reputation log <ID> [time]");
        }
    } else if (message.startsWith("$shop reputation expertise")) {
        var args = message.split(" ");
        if (args.length === 4) {
            var shopId = parseInt(args[3]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            // evalShopReputation(player, shopId, playerShops);
            calculateShopScore(player, shopId, playerShops, true);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop reputation expertise <ID>");
        }
    } else if (message.startsWith("$shop upgrade list")) {
        // If it has an extra argument, list the upgrades for a specific shop
        var args = message.split(" ");
        if (args.length === 4) {
            var shopId = parseInt(args[3]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            listShopUpgrades(player, shopId, playerShops);
        } else {
            listAllUpgrades(player);
        }
    } else if (message.startsWith("$shop event list")) {
        // If it has an extra argument, list the events for a specific shop
        var args = message.split(" ");
        if (args.length === 4) {
            var shopId = parseInt(args[3]);
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            listShopEvents(player, shopId, playerShops);
        } else {
            listAllEvents(player);
        }
    } else if (message.startsWith("$shop upgrade take")) {
        var args = message.split(" ");
        if (args.length === 5) {
            var shopId = parseInt(args[3]);
            var upgradeId = args[4];
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            takeShopUpgrade(player, shopId, upgradeId, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop upgrade take <shopID> <upgradeID>");
        }
    } else if (message.startsWith("$shop event take")) {
        var args = message.split(" ");
        if (args.length === 5) {
            var shopId = parseInt(args[3]);
            var eventId = args[4];
            if (isNaN(shopId) || !shopExists(shopId, playerShops)) {
                tellPlayer(player, "&cInvalid shop ID: &e" + args[3]);
                return;
            }
            takeShopEvent(player, shopId, eventId, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop event take <shopID> <eventID>");
        }
    } else if (message.startsWith("$shop sell")) {
        var args = message.split(" ");
        if (args.length === 4) {
            var shopId = parseInt(args[2]);
            var salePrice = args[3];

            sellShop(player, shopId, salePrice, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop sell <ID> <price|cancel>");
        }
    } else if (message.startsWith("$shop buy")) {
        var args = message.split(" ");
        if (args.length === 3 || args.length === 4) {
            var shopId = parseInt(args[2]);
            var buyerName = args.length === 4 ? args[3] : player.getName();
            buyShop(player, shopId, buyerName, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop buy <ID> [buyer]");
        }
    } else if (message.startsWith("$shop stock list")) {
        var args = message.split(" ");
        var shopId = args[3];
        var showItems = args.length > 4 && args[4] === "items";
        listShopStock(player, shopId, showItems);
    } else if (message.startsWith("$shop price list")) {
        var args = message.split(" ");
        var shopId = args[3];
        listShopPrices(player, shopId);
    } else if (message.startsWith("$shop info")) {
        var args = message.split(" ");
        var shopId = args[2];
        // if command has an "item" argument, show item info
        if (args.length === 4 && args[3] === "item") {
            displayShopInfo(player, shopId, true);
        } else {
            displayShopInfo(player, shopId);
        }
    } else if (message.startsWith("$shop stat consumer flow")) {
        var args = message.split(" ");
        if (args.length === 5) {
            var shopId = parseInt(args[4]);
            handleShopStatConsumerFlow(player, shopId, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop stat consumer flow <ID>");
        }
    } else if (message.startsWith("$shop stat consumer money")) {
        var args = message.split(" ");
        if (args.length === 5) {
            var shopId = parseInt(args[4]);
            handleShopStatConsumerMoney(player, shopId, playerShops);
        } else {
            tellPlayer(player, "&cInvalid command! Usage: &e$shop stat consumer money <ID>");
        }
    } else if (message.startsWith("$shop") || message.startsWith("$shop help")) {
        tellPlayer(player, "&b=========================================");
        tellPlayer(player, "&bShop Commands:");
        tellPlayer(player, "&b=========================================");
        tellPlayer(player, "&e$shop create <name> <type> <region> <sub_region> [money] &7- Create a new shop with the specified properties.");
        tellPlayer(player, "&e$shop delete <ID> &7- Delete the shop with the specified ID.");
        tellPlayer(player, "&e$shop property set <ID> [name=<name>] [type=<type>] [region=<region>] [sub_region=<sub_region>] [money=<money>] &7- Set properties of the specified shop.");
        tellPlayer(player, "&e$shop property add <ID> [stock_room=<region>] [main_room=<region>] &7- Add properties to the specified shop.");
        tellPlayer(player, "&e$shop property remove <ID> [stock_room=<index_or_name>] [main_room=<index_or_name>] &7- Remove properties from the specified shop.");
        tellPlayer(player, "&e$shop open <ID> &7- Open the shop with the specified ID.");
        tellPlayer(player, "&e$shop close <ID> &7- Close the shop with the specified ID.");
        tellPlayer(player, "&e$shop stock add <ID> &7- Add stock to the specified shop.");
        tellPlayer(player, "&e$shop stock remove <ID> <Item ID or index> [number] &7- Remove stock from the specified shop.");
        tellPlayer(player, "&e$shop stock eval &7- Evaluate the item in hand.");
        tellPlayer(player, "&e$shop price set <shopID> <itemID OR item index> <profit> &7- Set the price of an item in the specified shop.");
        tellPlayer(player, "&e$shop price remove <shopID> <itemID OR item index> &7- Remove the price of an item in the specified shop.");
        tellPlayer(player, "&e$shop price default <shopID> <percentage> &7- Set the default margin for the specified shop.");
        tellPlayer(player, "&e$shop money put pouch <ID> <value> &7- Put money from pouch into the specified shop.");
        tellPlayer(player, "&e$shop money take pouch <ID> <value> &7- Take money from the specified shop to pouch.");
        tellPlayer(player, "&e$shop money put <ID> &7- Put money into the specified shop.");
        tellPlayer(player, "&e$shop money take <ID> <value> &7- Take money from the specified shop.");
        tellPlayer(player, "&e$shop reputation add <ID> <Amount> &7- Add reputation to the specified shop.");
        tellPlayer(player, "&e$shop reputation remove <ID> <Amount> &7- Remove reputation from the specified shop.");
        tellPlayer(player, "&e$shop reputation log <ID> [time] &7- Log the reputation of the specified shop.");
        tellPlayer(player, "&e$shop reputation expertise <ID> &7- Evaluate the expertise of the specified shop.");
        tellPlayer(player, "&e$shop upgrade list [ID] &7- List all upgrades or upgrades for the specified shop.");
        tellPlayer(player, "&e$shop upgrade take <shopID> <upgradeID> &7- Apply an upgrade to the specified shop.");
        tellPlayer(player, "&e$shop event list [ID] &7- List all events or events for the specified shop.");
        tellPlayer(player, "&e$shop event take <shopID> <eventID> &7- Start an event for the specified shop.");
        tellPlayer(player, "&b=========================================");
    }