load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_modifiers.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");

var MODIFIERS_CFG_PATH = "world/customnpcs/scripts/ecmascript/modules/modifiers/modifiers_config.json";

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

function interact(event) {
    var player = event.player;
    var originalItem = player.getMainhandItem();

    if (originalItem.isEmpty() || originalItem.getName() == "customnpcs:npcscripter") {
        return;
    }

    var item = originalItem.copy();
    item.setStackSize(1);

    var offItem = player.getOffhandItem();

    // Admin setup: with Seagull ID Card in offhand, use a name tag in a chest to create an orb.
    // The name tag display name must match either an active modifier `type` or a passive modifier `type`.
    if (!offItem.isEmpty() && offItem.getName() == "mts:ivv.idcard_seagull" && !has_active_modifier_tag(item) && !has_passive_modifier_tag(item)) {
        var trace = player.rayTraceBlock(5, true, false);
        var block = trace.getBlock();
        if (block.getName() == "minecraft:chest") {
            var container = block.getContainer();
        } //else {
        //     // tellPlayer(player, "§e:recycle: Debug: Not a container block.");
        //     tellPlayer(player, "§c:sun: Look at a chest containing a named name tag.");
        //     return;
        // }

        var slotCount = container.getSize();
        // tellPlayer(player, "§e:recycle: Debug: Container has " + slotCount + " slots.");

        var config_data = loadJson(MODIFIERS_CFG_PATH);
        var foundEntry = null;
        for (var slot = 0; slot < slotCount; slot++) {
            var slotItem = container.getSlot(slot);
            if (slotItem.isEmpty()) {
                continue;
            }

            var item_name = slotItem.getName();
            // tellPlayer(player, "§e:recycle: Debug: Slot " + slot + ": " + item_name);

            if (!foundEntry && item_name === "minecraft:name_tag") {
                var displayName = slotItem.getDisplayName();
                // tellPlayer(player, "§e:recycle: Debug: Found name tag with display name: " + displayName);

                // Special admin shortcut: a nametag named "all" fills the chest with all possible orbs.
                if (displayName === "all") {
                    // Build lists of valid modifier types (skip incomplete config stubs).
                    var activeTypes = [];
                    var passiveTypes = [];

                    if (config_data && config_data.modifiers && config_data.modifiers.length) {
                        for (var ai = 0; ai < config_data.modifiers.length; ai++) {
                            var a = config_data.modifiers[ai];
                            if (!a) continue;
                            if (typeof a.type !== 'string' || a.type.length === 0) continue;
                            if (typeof a.radius !== 'number') continue;
                            if (typeof a.displayName !== 'string') continue;
                            if (typeof a.description !== 'string') continue;
                            if (typeof a.colorCode !== 'number') continue;
                            activeTypes.push(a.type);
                        }
                    }

                    if (config_data && config_data.passive_modifiers && config_data.passive_modifiers.length) {
                        for (var pi = 0; pi < config_data.passive_modifiers.length; pi++) {
                            var p = config_data.passive_modifiers[pi];
                            if (!p) continue;
                            if (typeof p.type !== 'string' || p.type.length === 0) continue;
                            if (typeof p.displayName !== 'string') continue;
                            if (typeof p.description !== 'string') continue;
                            if (typeof p.colorCode !== 'number') continue;
                            if (typeof p.durationMinutes !== 'number') continue;
                            passiveTypes.push(p.type);
                        }
                    }

                    var allCount = activeTypes.length + passiveTypes.length;
                    if (allCount === 0) {
                        tellPlayer(player, "§c:sun: No valid modifiers found in config.");
                        return;
                    }

                    // Clear chest then fill sequentially.
                    for (var cs = 0; cs < slotCount; cs++) {
                        container.setSlot(cs, null);
                    }

                    var written = 0;
                    var outSlot = 0;
                    for (var at = 0; at < activeTypes.length && outSlot < slotCount; at++) {
                        var orbA = instanciate_active_modifier(player, item, activeTypes[at], true);
                        if (orbA && typeof orbA.setStackSize === 'function') orbA.setStackSize(1);
                        container.setSlot(outSlot, orbA);
                        written++;
                        outSlot++;
                    }
                    for (var pt = 0; pt < passiveTypes.length && outSlot < slotCount; pt++) {
                        var orbP = instanciate_passive_modifier(player, item, passiveTypes[pt], true);
                        if (orbP && typeof orbP.setStackSize === 'function') orbP.setStackSize(1);
                        container.setSlot(outSlot, orbP);
                        written++;
                        outSlot++;
                    }

                    if (written < allCount) {
                        tellPlayer(player, "§e:sun: Chest filled with §f" + written + "§e orbs, but there are §f" + allCount + "§e total configured; use a bigger chest.");
                    } else {
                        tellPlayer(player, "§a:sun: Chest filled with all §f" + written + "§a orbs.");
                    }
                    return;
                }

                var activeEntry = findJsonEntryArray(config_data.modifiers, "type", displayName);
                if (activeEntry) {
                    foundEntry = { kind: "active", type: activeEntry.type };
                    player.setMainhandItem(instanciate_active_modifier(player, item, displayName));
                    break;
                }

                var passiveEntry = findJsonEntryArray(config_data.passive_modifiers, "type", displayName);
                if (passiveEntry) {
                    foundEntry = { kind: "passive", type: passiveEntry.type };
                    player.setMainhandItem(instanciate_passive_modifier(player, item, displayName));
                    break;
                }
            }
        }

        if (foundEntry) {
            tellPlayer(player, "§a:sun: Created " + foundEntry.kind + " orb: §f" + foundEntry.type);
        } else {
            tellPlayer(player, "§c:sun: No modifier matched that name tag.");
        }
        return;
    }

    // Using a modifier orb
    if (has_passive_modifier_tag(item)) {
        var trace = player.rayTraceBlock(5, true, false);
        var block = trace.getBlock();
        var nbt = item.getItemNbt();
        var tag = nbt.getCompound("tag");

        // Using a passive modifier
        if (is_passive_modifier_item(item) && block.getName() == "minecraft:air") {
            var modifierType = tag.getString("passive_modifier_type");
            var time_in_minutes = tag.getInteger("duration_minutes");

            var applied = apply_passive_modifier_type(player, modifierType);
            if (!applied) {
                tellPlayer(player, "§e:sun: Passive modifier already active!");
                return;
            }

            tellPlayer(player, "§a:sun: Passive modifier activated: §f" + get_modifier_display_name(modifierType) + "§a (§e" + time_in_minutes + "m§a)");

            logToFile('modifiers', '[modifiers.use] player=' + player.getName() + ' kind=passive type="' + modifierType + '" durationMinutes=' + time_in_minutes + ' nextRepairCostTokens=' + tag.getInteger('repairs'));
            
            // Modify cloned item, reduce original stack, give modified item
            item.setStackSize(1);
            tag.setBoolean("is_passive_modifier", false);
            nbt.setCompound("tag", tag);
            var usedItem = loadJson(MODIFIERS_CFG_PATH).items.usedItemId;
            nbt.setString("id", usedItem);
            var usedItemStack = player.getWorld().createItemFromNbt(nbt);
            usedItemStack.setStackSize(1);
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
            
            originalItem.setStackSize(originalItem.getStackSize() - 1);
            player.setMainhandItem(originalItem);

            if (!player.giveItem(usedItemStack)) {
                player.dropItem(usedItemStack);
            }
            
            var command = "/playsound customnpcs:magic.shot player @a " + player.getPos().getX() + " " + player.getPos().getY() + " " + player.getPos().getZ() + " 1 1";
            API.executeCommand(player.getWorld(), command);

            return;
        } else if (!is_passive_modifier_item(item)) {
            if (block.getName() == "minecraft:chest") {
                var container = block.getContainer();
            } else {
                // tellPlayer(player, "§e:recycle: Debug: You must target a container block to recharge the used modifier.");
                tellPlayer(player, "§6:sun: This modifier is used up. Look at a chest containing " + format_arcade_token_count(-1) + "§6 to recharge it.");
                return;
            }
            var slotCount = container.getSize();
            // tellPlayer(player, "§e:recycle: Debug: Container has " + slotCount + " slots.");

            var tokens_counted = 0;
            var token_slots = [];
            for (var slot = 0; slot < slotCount; slot++) {
                var slotItem = container.getSlot(slot);
                if (slotItem.isEmpty()) {
                    continue;
                }

                var item_name = slotItem.getName();
                // tellPlayer(player, "§e:recycle: Debug: Slot " + slot + ": " + item_name);

                var newSlotItem = slotItem.copy();

                // Name tag found -> recharge modifier
                if (isArcadeToken(newSlotItem)) {
                    tokens_counted += newSlotItem.getStackSize();
                    token_slots.push(slot);
                }
            }

            if (tokens_counted == 0) {
                // tellPlayer(player, "§e:recycle: Debug: No arcade tokens found in the container to recharge the modifier.");
                tellPlayer(player, "§e:cross_mark: No §dArcade Tokens§e found in that chest.");
                return;
            }

            // Use one token to recharge
            var required_tokens = tag.getInteger("repairs");
            var needed_tokens = required_tokens;
            if (tokens_counted < required_tokens) {
                // tellPlayer(player, "§e:recycle: Debug: Not enough arcade tokens to recharge the modifier. Needed: " + required_tokens + ", found: " + tokens_counted);
                tellPlayer(player, "§c:sun: Not enough §dArcade Tokens§c (need §e" + required_tokens + "§c, found §e" + tokens_counted + "§c). ");
                return;
            }

            for (var i = 0; i < token_slots.length; i++) {
                var slotIndex = token_slots[i];
                var slotItem = container.getSlot(slotIndex);
                var stackSize = slotItem.getStackSize();

                if (stackSize <= needed_tokens) {
                    // Remove entire stack
                    container.setSlot(slotIndex, null);
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

            tellPlayer(player, "§a:check_mark: Orb recharged for "+ format_arcade_token_count(required_tokens) + "§a.");
            
            // Modify cloned item, reduce original stack, give repaired item
            var repairedOrb = repair_modifier_item(player, item);
            repairedOrb.setStackSize(1);

            var repairedNbt = repairedOrb.getItemNbt();
            var repairedTag = repairedNbt.getCompound('tag');
            var repairsTotal = repairedTag.getInteger('repairs');

            var curr_lore = item.getLore();
            var new_lore = [
                curr_lore[0],
                curr_lore[1],
                ccs("&7Next token use count: §e" + repairsTotal)
            ];
            repairedOrb.setLore(new_lore);

            var modifierType = tag.getString('passive_modifier_type');
            logToFile('modifiers', '[modifiers.repair] player=' + player.getName() + ' kind=passive type="' + modifierType + '" costTokens=' + required_tokens + ' repairsTotal=' + repairsTotal);
            
            // Reduce original stack and update mainhand
            originalItem.setStackSize(originalItem.getStackSize() - 1);
            player.setMainhandItem(originalItem);
            
            // Give the repaired orb to player
            if (!player.giveItem(repairedOrb)) {
                player.dropItem(repairedOrb);
            }

            return;
        }
    }

    if (has_active_modifier_tag(item)) {
        var trace = player.rayTraceBlock(5, true, false);
        var block = trace.getBlock();
        var nbt = item.getItemNbt();
        var tag = nbt.getCompound("tag");
        if (is_active_modifier_item(item) && block.getName() == "minecraft:air") {
            var modifierType = tag.getString("modifier_type");
            var radius = tag.getInteger("modifier_radius");
            tag.setBoolean("is_modifier", false);
            nbt.setCompound("tag", tag);

            // tellPlayer(player, "§a:recycle: Debug: Applying modifier of type '" + modifierType + "' with radius " + radius);
            var result = apply_active_modifier_type(player, modifierType, radius);
            // tellPlayer(player, "§a:recycle: Debug: Modifier application result: " + result);
            if (result === null) {
                tellPlayer(player, "§e:sun: Nothing happened.");
            } else {
                tellPlayer(player, "§a:sun: Orb activated: §f" + get_modifier_display_name(modifierType) + "§a (in a radius of §e" + radius + "§a).");
            }

            logToFile('modifiers', '[modifiers.use] player=' + player.getName() + ' kind=active type="' + modifierType + '" radius=' + radius + ' nextRepairCostTokens=' + tag.getInteger('repairs'));

            // Modify cloned item, reduce original stack, give modified item
            item.setStackSize(1);
            tag.setBoolean("is_modifier", false);
            nbt.setCompound("tag", tag);
            var usedItem = loadJson(MODIFIERS_CFG_PATH).items.usedItemId;
            nbt.setString("id", usedItem);
            var usedItemStack = player.getWorld().createItemFromNbt(nbt);
            usedItemStack.setStackSize(1);
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
            
            originalItem.setStackSize(originalItem.getStackSize() - 1);
            player.setMainhandItem(originalItem);
            
            if (!player.giveItem(usedItemStack)) {
                player.dropItem(usedItemStack);
            }
            
            var command = "/playsound customnpcs:magic.shot player @a " + player.getPos().getX() + " " + player.getPos().getY() + " " + player.getPos().getZ() + " 1 1";
            API.executeCommand(player.getWorld(), command);

            return;
        } else if (!is_active_modifier_item(item)) {
            if (block.getName() == "minecraft:chest") {
                var container = block.getContainer();
            } else {
                return;
            }
            var slotCount = container.getSize();

            var tokens_counted = 0;
            var token_slots = [];
            for (var slot = 0; slot < slotCount; slot++) {
                var slotItem = container.getSlot(slot);
                if (slotItem.isEmpty()) {
                    continue;
                }

                var item_name = slotItem.getName();

                var newSlotItem = slotItem.copy();

                // Name tag found -> recharge modifier
                if (isArcadeToken(newSlotItem)) {
                    tokens_counted += newSlotItem.getStackSize();
                    token_slots.push(slot);
                }
            }

            if (tokens_counted == 0) {
                tellPlayer(player, "§e:cross_mark: No §dArcade Tokens§e found in that chest.");
                return;
            }

            // Use one token to recharge
            var required_tokens = tag.getInteger("repairs");
            var needed_tokens = required_tokens;
            if (tokens_counted < required_tokens) {
                tellPlayer(player, "§c:cross_mark: Not enough §dArcade Tokens§c (need §e" + required_tokens + "§c, found §e" + tokens_counted + "§c). ");
                return;
            }

            for (var i = 0; i < token_slots.length; i++) {
                var slotIndex = token_slots[i];
                var slotItem = container.getSlot(slotIndex);
                var stackSize = slotItem.getStackSize();

                if (stackSize <= needed_tokens) {
                    // Remove entire stack
                    container.setSlot(slotIndex, null);
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

            tellPlayer(player, "§a:check_mark: Orb recharged for "+ format_arcade_token_count(required_tokens) + "§a.");
            
            // Modify cloned item, reduce original stack, give repaired item
            var repairedOrb = repair_modifier_item(player, item);
            repairedOrb.setStackSize(1);

            var repairedNbt = repairedOrb.getItemNbt();
            var repairedTag = repairedNbt.getCompound('tag');
            var repairsTotal = repairedTag.getInteger('repairs');

            var curr_lore = item.getLore();
            var new_lore = [
                curr_lore[0],
                curr_lore[1],
                ccs("&7Next token use count: §e" + repairsTotal)
            ];
            repairedOrb.setLore(new_lore);

            var modifierType = tag.getString('modifier_type');
            var radius = tag.getInteger('modifier_radius');
            logToFile('modifiers', '[modifiers.repair] player=' + player.getName() + ' kind=active type="' + modifierType + '" radius=' + radius + ' costTokens=' + required_tokens + ' repairsTotal=' + repairsTotal);
            
            // Reduce original stack and update mainhand
            originalItem.setStackSize(originalItem.getStackSize() - 1);
            player.setMainhandItem(originalItem);
            
            // Give the repaired orb to player
            if (!player.giveItem(repairedOrb)) {
                player.dropItem(repairedOrb);
            }

            return;
        }
    }
}

function logout(event) {
    var player = event.player;

    freeze_passive_modifiers(player);
}

function init(event) {
    var player = event.player;

    unfreeze_passive_modifiers(player);

    var current_modifiers = get_players_passive_modifiers(player);
    if (current_modifiers && current_modifiers.length > 0) {
        tellPlayer(player, "§e:sun: Passive modifiers active:");
        for (var i = 0; i < current_modifiers.length; i++) {
            tellPlayer(player, "§7- " + format_passive_modifier_presentation(player, current_modifiers[i]));
        }
    }
}

