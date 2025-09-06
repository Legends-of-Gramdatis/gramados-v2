var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

// Load utility modules
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js')
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js')
// load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_jail.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_factions.js');

load('world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js');

var safe_type = [
    "Gold Rack",
    "Bill Rack",
    "Safe",
    "Server Rack",
    "Server Secure Rack",
    "Server Strong Rack"
]
var click_cooldown = 60;
var regen_cooldown = 80000;
var tickCounter = 0;

/**
 * Initializes the NPC by linking it to a bank and setting up its stored data.
 * @param {Object} event - The event object containing the NPC instance.
 */
function init(event) {
    var npc = event.npc;
    var npcPos = npc.getPos();
    var banksData = loadJson("world/customnpcs/scripts/ecmascript/modules/bankVault/banks_data.json");

    var bankFound = false;

    for (var i = 0; i < banksData.length; i++) {
        var bank = banksData[i];
        var pos1 = bank.pos1;
        var pos2 = bank.pos2;

        if (isWithinZone(npcPos, pos1, pos2)) { // Use the utility function
            npc.getStoreddata().put("bank_name", bank.bankName);
            bankFound = true;
            break;
        }
    }

    if (!bankFound) {
        // Ensure no random bank is created
        npc.getStoreddata().clear();
        return;
    }

    if (!npc.getStoreddata().has("safe_type") || !npc.getStoreddata().has("fill_level") || !npc.getStoreddata().has("hack_lock") || !npc.getStoreddata().has("strong_lock")) {
        regenerate(npc);
    } else {
        var current_time = npc.getWorld().getTotalTime();
        var last_interaction_time = npc.getStoreddata().get("last_interraction") || 0;
        var elapsed_time = current_time - last_interaction_time;

        var refill_steps = Math.floor(elapsed_time / regen_cooldown);
        if (refill_steps > 0) {
            var fill_level = npc.getStoreddata().get("fill_level");
            var credit_refill = npc.getStoreddata().get("credit_refill") || 0;

            fill_level = Math.min(fill_level + refill_steps + credit_refill, 4);
            npc.getStoreddata().put("fill_level", fill_level);

            npc.getStoreddata().put("credit_refill", 0);

            saveInteractionTime(npc);
            updateSkinURL(npc);
        }
    }
}

/**
 * Handles periodic updates for the NPC, such as checking and applying fill credits.
 * @param {Object} event - The event object containing the NPC instance.
 */
function tick(event) {
    var npc = event.npc;
    tickCounter++;

    if (tickCounter >= 10) {
        tickCounter = 0;
        checkAndApplyFillCredit(npc);
    }

    var fill_level = npc.getStoreddata().get("fill_level");

    if (fill_level < 4) {
        var current_time = npc.getWorld().getTotalTime();
        var last_interaction_time = npc.getStoreddata().get("last_interraction") || 0;

        if (current_time - last_interaction_time >= regen_cooldown) {
            var credit_refill = npc.getStoreddata().get("credit_refill") || 0;
            npc.getStoreddata().put("credit_refill", credit_refill + 1);
            saveInteractionTime(npc);
        }
    }
}

/**
 * Checks and applies fill credits to the NPC's stored data if conditions are met.
 * @param {Object} npc - The NPC instance.
 */
function checkAndApplyFillCredit(npc) {
    var bankName = npc.getStoreddata().get("bank_name");
    if (!bankName) return;

    var banksData = loadJson("world/customnpcs/scripts/ecmascript/modules/bankVault/banks_data.json");
    var bank = null;

    // Find the bank by name
    for (var i = 0; i < banksData.length; i++) {
        if (banksData[i].bankName === bankName) {
            bank = banksData[i];
            break;
        }
    }

    if (!bank) return;

    var pos1 = bank.pos1;
    var pos2 = bank.pos2;
    var position = API.getIPos((pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2, (pos1.z + pos2.z) / 2);
    var nearbyPlayers = npc.getWorld().getNearbyEntities(position, Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y), Math.abs(pos1.z - pos2.z)), 1);

    var fill_level = npc.getStoreddata().get("fill_level");
    var credit_refill = npc.getStoreddata().get("credit_refill") || 0;
    var hack = npc.getStoreddata().get("hack_lock") || 0;
    var strong = npc.getStoreddata().get("strong_lock") || 0;

    if (nearbyPlayers.length === 0 && fill_level < 4 && credit_refill > 0 && !bank.isVaultGateOpened) {
        var newFillLevel = Math.min(fill_level + credit_refill, 4);
        npc.getStoreddata().put("fill_level", newFillLevel);
        npc.getStoreddata().put("credit_refill", 0);
        if (hack > 0) {
            npc.getStoreddata().put("hack_lock", 2);
        }
        if (strong > 0) {
            npc.getStoreddata().put("strong_lock", 3);
        }
        saveJson(banksData, "world/customnpcs/scripts/ecmascript/modules/bankVault/banks_data.json");
        updateSkinURL(npc);
    }
}

/**
 * Computes and applies the default security state (hack/casing) based on rack type.
 * Security terms:
 *  - hack: hacking security level (0 none, 2 locked, 1 bypassed)
 *  - casing: physical casing level (0 none, 3 bulkhead, 2 service_plate closed, 1 open)
 * @param {Object} npc - The NPC instance.
 * @param {string=} typeOverride - Optional rack type to use instead of stored one.
 * @returns {{hack:number,casing:number}} The applied security levels.
 */
function resetSecurityForType(npc, typeOverride) {
    var type = typeOverride || npc.getStoreddata().get("safe_type");
    var hack = 0;
    var casing = 0;
    if (type === "Server Rack") {
        hack = 0; casing = 0;
    } else if (type === "Server Secure Rack") {
        hack = 2; casing = 0;
    } else if (type === "Server Strong Rack") {
        hack = 2; casing = 3;
    } else {
        hack = 0; casing = 0;
    }
    npc.getStoreddata().put("hack_lock", hack);
    npc.getStoreddata().put("strong_lock", casing);
    return { hack: hack, casing: casing };
}

/**
 * Handles admin-only interactions (command block, heart) when the admin ID card is present.
 * Returns true if the interaction was handled.
 * @param {Object} event - The event object containing the NPC and player instances.
 * @returns {boolean}
 */
function handleAdminInteract(event) {
    var npc = event.npc;
    var player = event.player;
    var item = player.getMainhandItem();
    var item_name = item.getName();

    if (item_name == "minecraft:command_block") {
        npc.executeCommand("/playsound ivv:computer.gaming.deleted player @a");
        var new_type = regenerate(npc);
    tellPlayer(player, "&6&l[ADMIN]&6 &eThe rack has been regenerated to: &l" + new_type);
        return true;
    }

    if (item_name == "variedcommodities:heart") {
        npc.executeCommand("/playsound ivv:mts.ivv.dashboard.angel player @a");
        npc.getStoreddata().put("fill_level", 4);
    var applied = resetSecurityForType(npc);
    tellPlayer(player, "&6&l[ADMIN]&6 &aVault refilled to &e4/4&a and &b&lSecurity&a reset (&d&lHack&a: &e" + applied.hack + "&a, &3&lCasing&a: &e" + applied.casing + "&a).");
        updateSkinURL(npc);
        return true;
    }

    if (item_name == "customnpcs:npcsoulstoneempty") {
        tellPlayer(player, "&7Picked up vault with soulstone. No data changed.");
    }

    return false;
}

/**
 * Handles player interactions with the NPC, performing actions based on the item used.
 * @param {Object} event - The event object containing the NPC and player instances.
 */
function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var banksData = loadJson("world/customnpcs/scripts/ecmascript/modules/bankVault/banks_data.json");
    var bankName = npc.getStoreddata().get("bank_name");

    var item = player.getMainhandItem();
    var item_name = item.getName();

    var allow_through = event.player.getOffhandItem().getName() == "mts:ivv.idcard_seagull";

    if (item_name === "minecraft:barrier") {
        // Clear stored data and unlink NPC from the bank
        npc.getStoreddata().clear();
        tellPlayer(player, "&cThis vault has been unlinked from any bank.");
        npc.executeCommand("/playsound minecraft:block.anvil.land player @a");
        return;
    }

    if (!bankName) {
        // Default error message if NPC is not in any secured zone
        tellPlayer(player, "&cThis vault is not linked to any bank. Please contact an administrator.");
        npc.executeCommand("/playsound minecraft:block.anvil.land player @a");
        return;
    }

    var bank = banksData[findJsonSubEntryIndex(banksData, "bankName", bankName)];

    var fill_level = npc.getStoreddata().get("fill_level");
    var credit_refill = npc.getStoreddata().get("credit_refill") || 0;
    var bank_name = npc.getStoreddata().get("bank_name") || "Unknown Bank";
    var vault_type = npc.getStoreddata().get("safe_type") || "Unknown Type";

    // Admin-only interactions behind admin ID card
    if (allow_through && handleAdminInteract(event)) {
        return;
    }

    if (item_name == "minecraft:clock") {
        var current_time = npc.getWorld().getTotalTime();
        var last_interaction_time = npc.getStoreddata().get("last_interraction") || 0;
        var time_since_last = current_time - last_interaction_time;

        var time_until_next_fill = Math.max(0, regen_cooldown - (time_since_last % regen_cooldown));
        var steps_to_full = 4 - fill_level;
        var time_until_full = steps_to_full > 0 ? steps_to_full * regen_cooldown - time_since_last : 0;

    npc.executeCommand("/playsound minecraft:block.note.hat player @a");
    tellPlayer(player, "&7Time until next &a&lrefill&7: &e" + (time_until_next_fill / 20 / 60).toFixed(1) + " &7minutes.");
    tellPlayer(player, "&7Time until &a&lfull&7: &e" + (time_until_full / 20 / 60).toFixed(1) + " &7minutes.");
    } else if (item_name == "variedcommodities:crowbar") {
        npc.executeCommand("/playsound minecraft:entity.zombie.attack_iron_door player @a");
    tellPlayer(player, "&8&l[Status]&8 &7Fill: &e" + fill_level + "/4 &7| Pending refills: &e" + credit_refill + " &7| Type: &6" + vault_type);
    } else {
        if (!bank || !bank.isVaultGateOpened && !allow_through) {
            // Knockback the player
            var knockbackCount = player.getStoreddata().get("knockbackCount") || 0;
            player.setMotionX(Math.random() * 2 - 1);
            player.setMotionY(1);
            player.setMotionZ(Math.random() * 2 - 1);
            player.getStoreddata().put("knockbackCount", knockbackCount + 1);
            npc.executeCommand("/playsound ivv:gun.explode.techno block @a");
            npc.executeCommand("/particle lava " + npc.getPos().getX() + " " + npc.getPos().getY() + " " + npc.getPos().getZ() + " 1 1 1 1 10 normal");
            tellPlayer(player, "&7You are stuck in the vault! You must open the gate again to loot the vault.");
            player.damage(5);
        // Strong Rack: Stage 1 - Armoured removal via blowtorch (20% chance)
        } else if (vault_type === "Server Strong Rack" && isItemInLootTable(_LOOTTABLE_TOOLS_WELDING, item_name)) {
            var strong_lock_bt = npc.getStoreddata().get("strong_lock") || 0;
            if (strong_lock_bt !== 3) {
                tellPlayer(player, "&7This rack isn't in the &3&lBulkhead&7 state anymore.");
            } else if (getTimer(npc) <= click_cooldown) {
                tellPlayer(player, "&7Tool cooling down. Try again soon.");
            } else {
                saveInteractionTime(npc);
                var successBt = rrandom_range(1, 100) <= 20;
                if (successBt) {
                    npc.getStoreddata().put("strong_lock", 2);
                    updateSkinURL(npc);
                    npc.executeCommand("/playsound minecraft:block.anvil.use player @a");
                    tellPlayer(player, "&a&lBulkhead&a removed. Now open the &3&lService Plate&3 using precision tools.");
                } else {
                    npc.executeCommand("/playsound chisel:block.metal.hit player @a");
                    tellPlayer(player, "&cThe &3&lBulkhead&c didn't yield this time.");
                }
            }
        // Strong Rack: Stage 2 - Unlocking via wrench (20% chance)
        } else if (vault_type === "Server Strong Rack" && isItemInLootTable(_LOOTTABLE_TOOLS_PRECISION, item_name)) {
            var strong_lock_wr = npc.getStoreddata().get("strong_lock") || 0;
            if (strong_lock_wr !== 2) {
                tellPlayer(player, "&7You can't open the &3&lService Plate&7 at this stage.");
            } else if (getTimer(npc) <= click_cooldown) {
                tellPlayer(player, "&7Tool cooling down. Try again soon.");
            } else {
                saveInteractionTime(npc);
                var successWr = rrandom_range(1, 100) <= 20;
                if (successWr) {
                    npc.getStoreddata().put("strong_lock", 1);
                    updateSkinURL(npc);
                    npc.executeCommand("/playsound minecraft:block.piston.extend player @a");
                    tellPlayer(player, "&a&lService Plate&a opened. Now attempt a &d&lBypass&d on the onboard computer to release the discs.");
                } else {
                    npc.executeCommand("/playsound chisel:block.metal.hit player @a");
                    tellPlayer(player, "&cThe &3&lService Plate&c resisted your tool.");
                }
            }
        } else if (isItemInLootTable(_LOOTTABLE_BRUTEFORCE, item_name)) {
            // For Strong Rack, brute force only at the final (hacking) layer
            if (vault_type === "Server Strong Rack") {
                var strong_lock_bf = npc.getStoreddata().get("strong_lock") || 0;
                if (strong_lock_bf >= 2) {
                    tellPlayer(player, "&cYou must remove the &3&lBulkhead&c and open the &3&lService Plate&c before brute forcing the computer.");
                    npc.executeCommand("/playsound minecraft:block.anvil.land player @a");
                    return;
                }
            }
            npc.executeCommand("/playsound ivv:gun.explode.car block @a");
            npc.executeCommand("/particle largesmoke " + npc.getPos().getX() + " " + npc.getPos().getY() + " " + npc.getPos().getZ() + " 1 1 1 0.3 20 normal");
            npc.executeCommand("/particle flame " + npc.getPos().getX() + " " + npc.getPos().getY() + " " + npc.getPos().getZ() + " 1 1 1 1 5 normal");
            player.setMotionX((Math.random() - 0.5)/2);
            player.setMotionY(0.25);
            player.setMotionZ((Math.random() - 0.5)/2);
            tellPlayer(player, "&c&lBrute-force&c attempt underway. Contents may be damaged.");
            brute_safe(event);
        } else if (isItemInLootTable(_LOOTTABLE_CELLPHONES, item_name)) {
            // Attempt hack on Secure Rack (locked) or Strong Rack (final stage)
            var hack_lock = npc.getStoreddata().get("hack_lock") || 0;
            var strong_lock_ph = npc.getStoreddata().get("strong_lock") || 0;
            var canHackSecure = (vault_type === "Server Secure Rack" && hack_lock === 2);
            var canHackStrong = (vault_type === "Server Strong Rack" && strong_lock_ph === 1 && hack_lock === 2);
            if (canHackSecure || canHackStrong) {
                saveInteractionTime(npc);
                var success = rrandom_range(1, 100) <= 30;
                if (success) {
                    npc.getStoreddata().put("hack_lock", 1);
                    updateSkinURL(npc);
                    npc.executeCommand("/playsound ivv:phone.modern.warning player @a");
                    npc.executeCommand("/particle totem " + npc.getPos().getX() + " " + npc.getPos().getY() + " " + npc.getPos().getZ() + " 1 1 1 0.3 30 normal");
                    tellPlayer(player, "&d&lBypass&a Successful. Disc removal is now enabled.");
                } else {
                    npc.executeCommand("/playsound ivv:phone.modern.error player @a");
                    tellPlayer(player, "&d&lBypass&c Failed. Try again later.");
                }
            } else {
                npc.executeCommand("/playsound ivv:phone.modern.error player @a");
                // Provide guidance when bypass isn't possible now
                if (vault_type === "Server Secure Rack") {
                    if (hack_lock === 1) {
                        tellPlayer(player, "&7You can't perform a &d&lBypass&7 now; the &d&lHack&7 stage is already completed.");
                    } else if (hack_lock === 0) {
                        tellPlayer(player, "&7This rack has no &d&lHack&7 security.");
                    } else {
                        tellPlayer(player, "&7You can't perform a &d&lBypass&7 yet.");
                    }
                } else if (vault_type === "Server Strong Rack") {
                    if (strong_lock_ph >= 2) {
                        tellPlayer(player, "&7You must remove the &3&lBulkhead&7 and open the &3&lService Plate&7 before attempting a &d&lBypass&7.");
                    } else if (strong_lock_ph === 0) {
                        // Edge case: casing fully open/none but hack stage not at 2
                        if (hack_lock === 1) {
                            tellPlayer(player, "&7You can't perform a &d&lBypass&7 now; the &d&lHack&7 stage is already completed.");
                        } else if (hack_lock === 0) {
                            tellPlayer(player, "&7This rack has no &d&lHack&7 security.");
                        } else {
                            tellPlayer(player, "&7You can't perform a &d&lBypass&7 yet.");
                        }
                    } else if (strong_lock_ph === 1 && hack_lock !== 2) {
                        if (hack_lock === 1) {
                            tellPlayer(player, "&7You can't perform a &d&lBypass&7 now; the &d&lHack&7 stage is already completed.");
                        } else if (hack_lock === 0) {
                            tellPlayer(player, "&7This rack has no &d&lHack&7 security.");
                        } else {
                            tellPlayer(player, "&7You can't perform a &d&lBypass&7 yet.");
                        }
                    } else {
                        tellPlayer(player, "&7You can't perform a &d&lBypass&7 now.");
                    }
                } else {
                    tellPlayer(player, "&7This rack has no &d&lHack&7 security.");
                }
            }
        } else if (fill_level > 0 && getTimer(npc) > click_cooldown) {
            // Prevent disc removal from secure/strong server racks while hack_lock is 2 (locked)
            var hack_lock = npc.getStoreddata().get("hack_lock") || 0;
            var isLockedRack = (vault_type === "Server Secure Rack" || vault_type === "Server Strong Rack") && hack_lock === 2;
            if (isLockedRack) {
                npc.executeCommand("/playsound minecraft:block.anvil.land player @a");
                if (vault_type === "Server Strong Rack") {
                    tellPlayer(player, "&cSecurity active: &3&lCasing&c and &d&lHack&c. Remove the &3&lBulkhead&c, open the &3&lService Plate&c, then perform a &d&lBypass&c to release the discs.");
                } else {
                    tellPlayer(player, "&cSecurity active: &d&lHack&c. Use a phone to attempt a &d&lBypass&c or brute-force with proper tools.");
                }
                return;
            }
            npc.executeCommand("/playsound minecraft:block.shulker_box.open block @a");
            loot_safe(event);
        } else if (fill_level === 0) {
            // Display tips and tricks only when the vault is empty and the gate is open
            if (rrandom_range(0, 50) == 1) {
                tellPlayer(player, "&7This vault is empty! Come back later. &8&o(tip: use a clock to check refill timers).");
            } else if (rrandom_range(0, 100) == 1) {
                tellPlayer(player, "&7This vault is empty! Come back later. &8&o(tip: use a crowbar to check status).");
            } else {
                tellPlayer(player, "&7This vault is empty! Come back later.");
            }
            npc.executeCommand("/playsound chisel:block.metal.hit block @a");
        }
    }
}

/**
 * Regenerates the NPC's safe type and resets its fill level.
 * @param {Object} npc - The NPC instance.
 * @returns {string} - The new safe type.
 */
function regenerate(npc) {
    var current_type = npc.getStoreddata().get("safe_type");
    var current_index = safe_type.indexOf(current_type);
    var next_index = (current_index + 1) % safe_type.length;
    var next_type = safe_type[next_index];
    npc.getDisplay().setName(next_type);

    npc.getStoreddata().put("safe_type", next_type);
    npc.getStoreddata().put("fill_level", 4);

    // Apply default security setup according to rack type
    resetSecurityForType(npc, next_type);

    saveInteractionTime(npc);

    updateSkinURL(npc);

    return next_type;
}

/**
 * Saves the current interaction time to the NPC's stored data.
 * @param {Object} npc - The NPC instance.
 */
function saveInteractionTime(npc) {
    var current_time = npc.getWorld().getTotalTime();
    npc.getStoreddata().put("last_interraction", current_time);
}

/**
 * Handles the looting of the safe by the player, reducing the fill level and generating loot.
 * @param {Object} event - The event object containing the NPC and player instances.
 */
function loot_safe(event) {
    var npc = event.npc;
    var player = event.player;

    var fill_level = npc.getStoreddata().get("fill_level");

    fill_level = Math.max(0, fill_level - 1);
    npc.getStoreddata().put("fill_level", fill_level);
    saveInteractionTime(npc);

    updateSkinURL(npc);
    generateLoot(npc.getWorld(), npc, player);
}

/**
 * Handles the brute forcing of the safe by the player, reducing the fill level more significantly and generating loot.
 * @param {Object} event - The event object containing the NPC and player instances.
 */
function brute_safe(event) {
    var npc = event.npc;
    var player = event.player;

    // random number between 1 and 4
    var random_number = rrandom_range(1, 4);

    var fill_level = npc.getStoreddata().get("fill_level");

    if (fill_level > random_number) {
        fill_level = Math.max(0, fill_level - random_number);
        generateLoot(npc.getWorld(), npc, player);
    } else {
        fill_level = Math.max(0, fill_level - random_number);
    }
    npc.getStoreddata().put("fill_level", fill_level);
    saveInteractionTime(npc);
    updateSkinURL(npc);
}

/**
 * Calculates the elapsed time since the last interaction with the NPC.
 * @param {Object} npc - The NPC instance.
 * @returns {number} - The elapsed time in ticks.
 */
function getTimer(npc) {
    var current_time = npc.getWorld().getTotalTime();
    var last_interaction_time = npc.getStoreddata().get("last_interraction");
    if (last_interaction_time == null) {
        return 0;
    }
    var elapsed_time = current_time - last_interaction_time;
    return elapsed_time;
}

/**
 * Generates loot for the player based on the NPC's safe type and logs the event.
 * @param {Object} world - The world instance.
 * @param {Object} npc - The NPC instance.
 * @param {Object} player - The player instance.
 */
function generateLoot(world, npc, player) {
    var full_loot = [];
    var criminalityIncrease = rrandom_range(1, 5);
    // Apply faction reputation change based on bank configuration
    var chosenFactionId = 6; // default criminal
    var chosenMode = "increase"; // default increase
    var chosenDelta = criminalityIncrease;
    var allow_through = player.getOffhandItem().getName() == "mts:ivv.idcard_seagull";
    if (!allow_through) {
        try {
            var banksData = loadJson("world/customnpcs/scripts/ecmascript/modules/bankVault/banks_data.json");
            var bankName = npc.getStoreddata().get("bank_name");
            var bankIndex = findJsonSubEntryIndex(banksData, "bankName", bankName);
            if (bankIndex != null && bankIndex >= 0) {
                var bank = banksData[bankIndex];
                chosenMode = bank.factionRepMode || "increase"; // default increase
                chosenFactionId = bank.factionRepFactionId != null ? bank.factionRepFactionId : 6; // default criminal id 6
                chosenDelta = (chosenMode === "decrease") ? -criminalityIncrease : criminalityIncrease;
                // addFactionPoints accepts negative values to decrease reputation
                player.addFactionPoints(chosenFactionId, chosenDelta);
            } else {
                // Fallback to default behavior
                player.addFactionPoints(chosenFactionId, chosenDelta);
            }
        } catch (e) {
            // On error, fallback to default behavior and log
            try { logToFile("dev", "Error applying faction reputation change: " + e.message); } catch (ignored) { }
            player.addFactionPoints(chosenFactionId, chosenDelta);
        }
    }

    // Resolve faction name and message verb
    var factionName = "Criminal";
    try { factionName = getFactionName(chosenFactionId) || factionName; } catch (ignored) { }
    var changeWord = (chosenDelta >= 0) ? "increased" : "decreased";
    var changePoints = Math.abs(chosenDelta);

    switch (npc.getStoreddata().get("safe_type")) {
        case "Gold Rack":
            var full_loot = pullLootTable(_LOOTTABLE_BANKVAULT_GOLDRACK, player);
            for (var i = 0; i < full_loot.length; i++) {
                player.dropItem(
                    generateItemStackFromLootEntry(full_loot[i], world, player)
                );
            }
            var logline = player.getName() + " opened a Gold Rack in " + npc.getStoreddata().get("bank_name") + " and received: ";
            for (var i = 0; i < full_loot.length; i++) {
                logline += full_loot[i].id + ":" + full_loot[i].damage + " x" + full_loot[i].count;
                if (i < full_loot.length - 1) {
                    logline += ", ";
                }
            }
            logline += " with " + factionName + " reputation " + changeWord + " by " + changePoints + ".";
            logToFile("bank_robbery", logline);
            break;
        case "Bill Rack":
            var money = rrandom_range(10000, 500000);
            var moneyItems = generateMoney(world, money);
            for (var i = 0; i < moneyItems.length; i++) {
                player.dropItem(moneyItems[i]);
            }
            var logline = player.getName() + " opened a Bill Rack in " + npc.getStoreddata().get("bank_name") + " and received " + getAmountCoin(money);
            logline += " with " + factionName + " reputation " + changeWord + " by " + changePoints + ".";
            logToFile("bank_robbery", logline);
            break;
        case "Safe":
            var full_loot = pullLootTable(_LOOTTABLE_BANKVAULT_SAFE, player);
            for (var i = 0; i < full_loot.length; i++) {
                player.dropItem(
                    generateItemStackFromLootEntry(full_loot[i], world, player)
                );
            }
            var logline = player.getName() + " broke open a Safe in " + npc.getStoreddata().get("bank_name") + " and received: ";
            for (var i = 0; i < full_loot.length; i++) {
                logline += full_loot[i].id + ":" + full_loot[i].damage + " x" + full_loot[i].count;
                if (i < full_loot.length - 1) {
                    logline += ", ";
                }
            }
        case "Server Rack":
            var full_loot = pullLootTable(_LOOTTABLE_BANKVAULT_SERVERRACK, player);
            for (var i = 0; i < full_loot.length; i++) {
                player.dropItem(
                    generateItemStackFromLootEntry(full_loot[i], world, player)
                );
            }
            var logline = player.getName() + " un-racked a Server in " + npc.getStoreddata().get("bank_name") + " and received: ";
            for (var i = 0; i < full_loot.length; i++) {
                logline += full_loot[i].id + ":" + full_loot[i].damage + " x" + full_loot[i].count;
                if (i < full_loot.length - 1) {
                    logline += ", ";
                }
            }
            if (!allow_through) {
                logline += " with " + factionName + " reputation " + changeWord + " by " + changePoints + ".";
            } else {
                logline += ".";
            }
            logToFile("bank_robbery", logline);
            break;
        case "Server Secure Rack":
            var full_loot = pullLootTable(_LOOTTABLE_BANKVAULT_SERVERSECURERACK, player);
            for (var i = 0; i < full_loot.length; i++) {
                player.dropItem(
                    generateItemStackFromLootEntry(full_loot[i], world, player)
                );
            }
            var logline = player.getName() + " un-racked a Server in " + npc.getStoreddata().get("bank_name") + " and received: ";
            for (var i = 0; i < full_loot.length; i++) {
                logline += full_loot[i].id + ":" + full_loot[i].damage + " x" + full_loot[i].count;
                if (i < full_loot.length - 1) {
                    logline += ", ";
                }
            }
            if (!allow_through) {
                logline += " with " + factionName + " reputation " + changeWord + " by " + changePoints + ".";
            } else {
                logline += ".";
            }
            logToFile("bank_robbery", logline);
            break;
        case "Server Strong Rack":
            var full_loot = pullLootTable(_LOOTTABLE_BANKVAULT_SERVERSTRONGRACK, player);
            for (var i = 0; i < full_loot.length; i++) {
                player.dropItem(
                    generateItemStackFromLootEntry(full_loot[i], world, player)
                );
            }
            var logline = player.getName() + " un-racked a Server in " + npc.getStoreddata().get("bank_name") + " and received: ";
            for (var i = 0; i < full_loot.length; i++) {
                logline += full_loot[i].id + ":" + full_loot[i].damage + " x" + full_loot[i].count;
                if (i < full_loot.length - 1) {
                    logline += ", ";
                }
            }
            if (!allow_through) {
                logline += " with " + factionName + " reputation " + changeWord + " by " + changePoints + ".";
            } else {
                logline += ".";
            }
            logToFile("bank_robbery", logline);
            break;
    }

    if (!allow_through) {
        tellPlayer(player, "&cYour &l" + factionName + "&c reputation has &l" + changeWord + "&c by &e" + changePoints + "&c points!");
    }
}

/**
 * Updates the NPC's skin URL based on its safe type and fill level.
 * @param {Object} npc - The NPC instance.
 */
function updateSkinURL(npc) {
    var current_type = npc.getStoreddata().get("safe_type");
    var fill_level = npc.getStoreddata().get("fill_level");
    var hack = npc.getStoreddata().get("hack_lock") || 0;
    var strong = npc.getStoreddata().get("strong_lock") || 0;

    var skin_url = "https://legends-of-gramdatis.com/gramados_skins/bank_safe/Gramados_slime_banksafe_";

    switch (current_type) {
        case "Gold Rack":
            skin_url = skin_url + "goldrack_" + fill_level;
            break;
        case "Bill Rack":
            skin_url = skin_url + "billrack_" + fill_level;
            break;
        case "Safe":
            skin_url = skin_url + "safe_" + fill_level;
            break;
        case "Server Rack":
            skin_url = skin_url + "serverrack_" + fill_level;
            break;
        case "Server Secure Rack":
            skin_url = skin_url + "serversecurerack_" + fill_level;
            break;
        case "Server Strong Rack":
            skin_url = skin_url + "serverstrongrack_" + fill_level;
            break;
    }

    if (hack === 2) {
        skin_url += "_unhacked";
    } else if (hack === 1) {
        skin_url += "_hacked";
    }

    if (strong === 3) {
        skin_url += "_armoured";
    } else if (strong === 2) {
        skin_url += "_locked";
    } else if (strong === 1) {
        skin_url += "_unlocked";
    }

    skin_url += ".png";

    npc.getDisplay().setSkinUrl(skin_url);
}