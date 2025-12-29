load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_modifiers.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");

var MODIFIERS_CFG_PATH = "world/customnpcs/scripts/ecmascript/modules/modifiers/modifiers_config.json";

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

function interact(event) {
    var player = event.player;
    var item = player.getMainhandItem();

    if (item.isEmpty() || item.getName() == "customnpcs:npcscripter") {
        return;
    }

    var offItem = player.getOffhandItem();

    if (!offItem.isEmpty() && offItem.getName() == "mts:ivv.idcard_seagull" && !has_item_modifier_tag(item)) {
        var trace = player.rayTraceBlock(5, true, false);
        var block = trace.getBlock();
        if (block.getName() == "minecraft:chest") {
            var container = block.getContainer();
        } else {
            tellPlayer(player, "§e:recycle: Debug: Not a container block.");
            return;
        }

        var slotCount = container.getSize();
        tellPlayer(player, "§e:recycle: Debug: Container has " + slotCount + " slots.");

        var foundEntry = null;
        for (var slot = 0; slot < slotCount; slot++) {
            var slotItem = container.getSlot(slot);
            if (slotItem.isEmpty()) {
                continue;
            }

            var item_name = slotItem.getName();
            tellPlayer(player, "§e:recycle: Debug: Slot " + slot + ": " + item_name);

            if (!foundEntry && item_name === "minecraft:name_tag") {
                var displayName = slotItem.getDisplayName();
                tellPlayer(player, "§e:recycle: Debug: Found name tag with display name: " + displayName);

                player.setMainhandItem(instanciate_modifier(player, item, displayName));
            }
        }

        if (foundEntry) {
            tellPlayer(player, "§a:recycle: Debug: Found modifier entry for type: " + foundEntry.type);
        } else {
            tellPlayer(player, "§e:recycle: Debug: No modifier entry matched the name tag.");
        }
        return;
    }

    if (has_item_modifier_tag(item)) {
        var trace = player.rayTraceBlock(5, true, false);
        var block = trace.getBlock();
        var nbt = item.getItemNbt();
        var tag = nbt.getCompound("tag");
        if (is_active_modifier_item(item) && block.getName() == "minecraft:air") {
            var modifierType = tag.getString("modifier_type");
            var radius = tag.getInteger("modifier_radius");
            tag.setBoolean("is_modifier", false);
            nbt.setCompound("tag", tag);

            tellPlayer(player, "§a:recycle: Debug: Applying modifier of type '" + modifierType + "' with radius " + radius);
            var result = apply_modifier_type(player, modifierType, radius);
            tellPlayer(player, "§a:recycle: Debug: Modifier application result: " + result);

            // replace item id with used one
            var usedItem = loadJson(MODIFIERS_CFG_PATH).items.usedItemId;
            nbt.setString("id", usedItem);
            var usedItemStack = player.getWorld().createItemFromNbt(nbt);
            usedItemStack.setCustomName(item.getDisplayName() + " §8(§7Used§8)");
            var curr_lore = item.getLore();
            var new_lore = [
                curr_lore[0],
                curr_lore[1],
                ccs("&8This modifier has been used and needs to be recharged."),
                ccs("&6Use the orb on a chest with §dArcade Token §6inside to recharge it."),
                ccs("&7Next token use count: §e" + (tag.getInteger("repairs")))
            ];
            usedItemStack.setLore(new_lore);
            player.setMainhandItem(usedItemStack);
            var command = "/playsound customnpcs:magic.shot player @a " + player.getPos().getX() + " " + player.getPos().getY() + " " + player.getPos().getZ() + " 1 1";
            API.executeCommand(player.getWorld(), command);

            return;
        } else if (!is_active_modifier_item(item)) {
            tellPlayer(player, "§e:recycle: Debug: Modifier item is not active.");
            if (block.getName() == "minecraft:chest") {
                var container = block.getContainer();
            } else {
                tellPlayer(player, "§e:recycle: Debug: You must target a container block to recharge the used modifier.");
                return;
            }
            var slotCount = container.getSize();
            tellPlayer(player, "§e:recycle: Debug: Container has " + slotCount + " slots.");

            var tokens_counted = 0;
            var token_slots = [];
            for (var slot = 0; slot < slotCount; slot++) {
                var slotItem = container.getSlot(slot);
                if (slotItem.isEmpty()) {
                    continue;
                }

                var item_name = slotItem.getName();
                tellPlayer(player, "§e:recycle: Debug: Slot " + slot + ": " + item_name);

                var newSlotItem = slotItem.copy();

                // Name tag found -> recharge modifier
                if (isArcadeToken(newSlotItem)) {
                    tokens_counted += newSlotItem.getStackSize();
                    token_slots.push(slot);
                }
            }

            if (tokens_counted == 0) {
                tellPlayer(player, "§e:recycle: Debug: No arcade tokens found in the container to recharge the modifier.");
                return;
            }

            // Use one token to recharge
            var needed_tokens = tag.getInteger("repairs");
            if (tokens_counted < needed_tokens) {
                tellPlayer(player, "§e:recycle: Debug: Not enough arcade tokens to recharge the modifier. Needed: " + needed_tokens + ", found: " + tokens_counted);
                return;
            }

            for (var i = 0; i < token_slots.length; i++) {
                var slotIndex = token_slots[i];
                var slotItem = container.getSlot(slotIndex);
                var stackSize = slotItem.getStackSize();

                if (stackSize <= needed_tokens) {
                    // Remove entire stack
                    container.setSlot(slotIndex, container.getEmptyItem());
                    needed_tokens -= stackSize;
                } else {
                    // Remove partial stack
                    var newStack = slotItem.copy();
                    newStack.setStackSize(stackSize - needed_tokens);
                    container.setSlot(slotIndex, newStack);
                    needed_tokens = 0;
                }

                if (needed_tokens <= 0) {
                    break;
                }
            }
            var command = "/playsound customnpcs:magic.charge player @a " + player.getPos().getX() + " " + player.getPos().getY() + " " + player.getPos().getZ() + " 1 1";
            API.executeCommand(player.getWorld(), command);

            tellPlayer(player, "§a:recycle: Debug: Modifier recharged successfully using " + needed_tokens + " arcade tokens.");
            
            var curr_lore = item.getLore();
            var new_lore = [
                curr_lore[0],
                curr_lore[1],
                ccs("&7Next token use count: §e" + (tag.getInteger("repairs")))
            ];
            player.getMainhandItem().setLore(new_lore);

            player.setMainhandItem(repair_modifier_item(player, item));

            return;
        }
    }
}

function logout(e) {


}

