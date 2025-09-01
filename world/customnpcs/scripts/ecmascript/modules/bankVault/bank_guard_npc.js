var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js')
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js')

var BANKS_DATA_PATH = "world/customnpcs/scripts/ecmascript/modules/bankVault/banks_data.json";
var ENTITYTYPE = 0;
var exploded_vehicles = [];

function findBank(banksData, npcPos) {
    for (var i = 0; i < banksData.length; i++) {
        var bank = banksData[i];
        if (isWithinZone(npcPos, bank.pos1, bank.pos2)) {
            return bank;
        }
    }
    return null;
}

function notifyPlayersInRegion(world, bank, message) {
    var orderedPositions = orderPositions(bank.pos1.x, bank.pos1.y, bank.pos1.z, bank.pos2.x, bank.pos2.y, bank.pos2.z);
    var centerPos = API.getIPos(
        (orderedPositions.x1 + orderedPositions.x2) / 2,
        (orderedPositions.y1 + orderedPositions.y2) / 2,
        (orderedPositions.z1 + orderedPositions.z2) / 2
    );
    var range = Math.max(
        orderedPositions.x2 - orderedPositions.x1,
        orderedPositions.y2 - orderedPositions.y1,
        orderedPositions.z2 - orderedPositions.z1
    );
    var nearbyEntities = world.getNearbyEntities(centerPos, range, 1); // Type 1 = players

    for (var i = 0; i < nearbyEntities.length; i++) {
        var player = nearbyEntities[i];
        if (isWithinZone(player.getPos(), bank.pos1, bank.pos2)) {
            tellPlayer(player, message);
        }
    }
}

var CLOCK_OFFSET = 0; // Offset for the clock sound, can be adjusted
var ALARM_TRIGGER = 3; // Flag to trigger the alarm sound

function init(event) {
    var npc = event.npc;
    var npcPos = npc.getPos();
    var banksData = loadJson(BANKS_DATA_PATH);

    if (!banksData) {
        banksData = [];
    }

    // Find the bank the NPC is guarding
    var bank = findBank(banksData, npcPos);
    if (bank) {
        npc.getStoreddata().put("bank_name", bank.bankName);
        npc.getStoreddata().put("npc_type", "robot");

        // Notify players in the region
        notifyPlayersInRegion(npc.getWorld(), bank, "&6&l[&e&lBank Vault&6&l] &aGuarding the bank vault...");

        // Close the gate on NPC respawn
        if (bank.gate) {
            var orderedPositions = orderPositions(bank.gate.pos1.x, bank.gate.pos1.y, bank.gate.pos1.z, bank.gate.pos2.x, bank.gate.pos2.y, bank.gate.pos2.z);
            var world = npc.getWorld();
            var gateBlock = bank.gate.block;

            for (var x = orderedPositions.x1; x <= orderedPositions.x2; x++) {
                for (var y = orderedPositions.y1; y <= orderedPositions.y2; y++) {
                    for (var z = orderedPositions.z1; z <= orderedPositions.z2; z++) {
                        world.setBlock(x, y, z, gateBlock.id, gateBlock.data);
                    }
                }
            }

            // Update bank data
            bank.isVaultGateOpened = false;
            saveJson(banksData, BANKS_DATA_PATH);
        }
    } else {
        // Ensure no random bank is created
        npc.getStoreddata().clear();
    }
}

function tick(event) {
    var npc = event.npc;
    var banksData = loadJson(BANKS_DATA_PATH);
    var world = npc.getWorld();

    var bankName = npc.getStoreddata().get("bank_name");
    var bank = findJsonEntry(banksData, "bankName", bankName); // Use utility function

    var localEntities = world.getNearbyEntities(npc.getPos(), bank.noCarRadius, ENTITYTYPE);

    try {
        for (var i = 0; i < localEntities.length; i++) {
            if (localEntities[i].getName() === "entity.mts_entity.name") {

                // Close the gate on NPC respawn
                if (bank.gate) {
                    var orderedPositions = orderPositions(bank.gate.pos1.x, bank.gate.pos1.y, bank.gate.pos1.z, bank.gate.pos2.x, bank.gate.pos2.y, bank.gate.pos2.z);
                    var gateBlock = bank.gate.block;

                    for (var x = orderedPositions.x1; x <= orderedPositions.x2; x++) {
                        for (var y = orderedPositions.y1; y <= orderedPositions.y2; y++) {
                            for (var z = orderedPositions.z1; z <= orderedPositions.z2; z++) {
                                world.setBlock(x, y, z, gateBlock.id, gateBlock.data);
                            }
                        }
                    }

                    // Update bank data
                    bank.isVaultGateOpened = false;
                    saveJson(banksData, BANKS_DATA_PATH);
                    notifyPlayersInRegion(npc.getWorld(), bank, "&6&l[&e&lBank Vault&6&l] &aThe vault gate has been closed because a vehicle was detected!");
                }
                
                if (includes(exploded_vehicles, localEntities[i].getUUID())) {
                    continue;
                } else {
                    logToFile("bank_robbery", "Blowing up vehicle: " + localEntities[i].getUUID() + " at " + localEntities[i].getPos().getX() + ", " + localEntities[i].getPos().getY() + ", " + localEntities[i].getPos().getZ() );
                    exploded_vehicles.push(localEntities[i].getUUID());
                    notifyPlayersInRegion(npc.getWorld(), bank, "&6&l[&e&lMAFIA bunker&6&l] &cYou are not allowed to bring vehicles here!");
                }

                npc.executeCommand("/playsound ivv:gun.explode.car master @a ~ ~ ~ 1 1");
                npc.executeCommand("/particle largeexplode " + localEntities[i].getX() + " " + localEntities[i].getY() + " " + localEntities[i].getZ() + " 1 1 1 0.3 2 force");
                npc.executeCommand("/particle hugeexplosion " + localEntities[i].getX() + " " + localEntities[i].getY() + " " + localEntities[i].getZ() + " 0.5 0.5 0.5 0.2 1 force");
                npc.executeCommand("/particle flame " + localEntities[i].getX() + " " + localEntities[i].getY() + " " + localEntities[i].getZ() + " 1 1 1 1 50 force");
                npc.executeCommand("/particle smoke " + localEntities[i].getX() + " " + localEntities[i].getY() + " " + localEntities[i].getZ() + " 1 1 1 0.5 50 force");

                
                world.explode(localEntities[i].getX(), localEntities[i].getY(), localEntities[i].getZ(), 5, false, false);
            }
        }
    } catch (e) {
        tellNearbyPlayers(npc, "&cError while checking for vehicles: " + e.message, 20);
        logToFile("dev", "Error while checking for vehicles: " + e.message);
    }

    if (bank && bank.isVaultGateOpened) {
        var currentTime = npc.getWorld().getTotalTime();
        var gateOpenTime = bank.vaultGateOpenTime || 0;
        var elapsedTime = currentTime - gateOpenTime;

        var respawnTimeTicks = npc.getStats().getRespawnTime() * 20; // Convert seconds to ticks
        var oneFourthTime = respawnTimeTicks * 0.25;
        var oneTenthTime = respawnTimeTicks * 0.1;
        // replace last digit of elapsedTime with 0
        elapsedTime = Math.floor(elapsedTime / 10) * 10; // Round down to nearest 10 ticks
        // tellNearbyPlayers(npc, "&0DEBUG: elapsedTime: " + elapsedTime + ", respawnTimeTicks: " + respawnTimeTicks, 20);

        if (elapsedTime <= oneFourthTime * 3) { // Before the last quarter
            if (CLOCK_OFFSET == 0) { // Play sound every second
                npc.executeCommand("/playsound minecraft:block.note.hat block @a ~ ~ ~ 10 1");
                // tellNearbyPlayers(npc, "&0DEBUG: Running clock tick before the last quarter for the vault gate. Time left: " + Math.floor((respawnTimeTicks - elapsedTime) / 20) + " seconds.", 20);
            }
        } else if (elapsedTime <= respawnTimeTicks - oneTenthTime) { // Last quarter
            if (CLOCK_OFFSET == 0 || CLOCK_OFFSET == 1) { // Play sound every 10 ticks
                npc.executeCommand("/playsound minecraft:block.note.hat block @a ~ ~ ~ 10 1");
                // tellNearbyPlayers(npc, "&0DEBUG: Running clock tick last quarter for the vault gate. Time left: " + Math.floor((respawnTimeTicks - elapsedTime) / 20) + " seconds.", 20);
            }
        } else { // Last tenth
            if (CLOCK_OFFSET == 0 || CLOCK_OFFSET == 1) {
                npc.executeCommand("/playsound minecraft:block.note.hat block @a ~ ~ ~ 10 1");
                if (ALARM_TRIGGER == 0) {
                    npc.executeCommand("/playsound cfm:fire_alarm block @a ~ ~ ~ 10 1");
                    ALARM_TRIGGER = 3; // Reset the alarm trigger
                } else if (ALARM_TRIGGER > 0) {
                    ALARM_TRIGGER--;
                }
            }
        }

        CLOCK_OFFSET++;
        if (CLOCK_OFFSET >= 2) { 
            CLOCK_OFFSET = 0;
        }
    }
}

function died(event) {
    var npc = event.npc;
    var world = npc.getWorld();
    var banksData = loadJson(BANKS_DATA_PATH);

    var bankName = npc.getStoreddata().get("bank_name");
    var bank = findJsonEntry(banksData, "bankName", bankName);

    if (bank && bank.gate) {
        // Notify players in the region
        notifyPlayersInRegion(world, bank, "&6&l[&e&lBank Vault&6&l] &aThe vault gate is now open for " + npc.getStats().getRespawnTime() + " seconds!");

        // Open the gate by filling it with air blocks
        var orderedPositions = orderPositions(bank.gate.pos1.x, bank.gate.pos1.y, bank.gate.pos1.z, bank.gate.pos2.x, bank.gate.pos2.y, bank.gate.pos2.z);

        // tellNearbyPlayers(npc, "Opening vault gate... " + bank.gate.block.id + " from position " + orderedPositions.x1 + ", " + orderedPositions.y1 + ", " + orderedPositions.z1 + " to " + orderedPositions.x2 + ", " + orderedPositions.y2 + ", " + orderedPositions.z2, 20);

        for (var x = orderedPositions.x1; x <= orderedPositions.x2; x++) {
            for (var y = orderedPositions.y1; y <= orderedPositions.y2; y++) {
                for (var z = orderedPositions.z1; z <= orderedPositions.z2; z++) {
                    // tellNearbyPlayers(npc, "Breaking block at " + x + ", " + y + ", " + z, 20);
                    world.setBlock(x, y, z, "minecraft:air", 0);
                }
            }
        }

        // Update bank data
        bank.isVaultGateOpened = true;
        bank.vaultGateOpenTime = world.getTotalTime();
        saveJson(banksData, BANKS_DATA_PATH);
    } else {
        notifyPlayersInRegion(world, bank, "&cNo bank data found for this NPC.");
    }

    var npc_type = npc.getStoreddata().get("npc_type");
    switch (npc_type) {
        case "robot":
            var loot = pullLootTable(_LOOTTABLE_NPCTYPE_ROBOT, event.player);
            for (var i = 0; i < loot.length; i++) {
                npc.dropItem(
                    generateItemStackFromLootEntry(loot[i], world)
                );
            }
            break;
        case "human":
            break;
        default:
            tellPlayer(event.player, "&7Unknown npc type. Cannot load any loot table.");
    }
}

function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var item = player.getMainhandItem();
    var itemName = item.getName();

    if (itemName === "minecraft:barrier") {
        // Clear stored data and unlink NPC from the bank
        npc.getStoreddata().clear();
        tellPlayer(player, "&cThis guard has been unlinked from any bank.");
        npc.executeCommand("/playsound minecraft:block.anvil.land player @a");
        return;
    }

    if (player.getMainhandItem().getName() == "minecraft:command_block") {
        var commandBlockName = player.getMainhandItem().getDisplayName();

        switch (commandBlockName) {
            case "robot":
                tellPlayer(player, "&7Switching NPC type to robot.");
                npc.getStoreddata().put("npc_type", "robot");
                npc.executeCommand("/playsound ivv:phone.modern.error player @a");
                break;
            case "human":
                tellPlayer(player, "&7Switching NPC type to human.");
                npc.getStoreddata().put("npc_type", "human");
                npc.executeCommand("/playsound ivv:phone.modern.error player @a");
                break;
            default:
                tellPlayer(player, "&7Unknown npc type.");
        }
    }

    if (itemName === "variedcommodities:phone") {
        npc.executeCommand("/playsound ivv:phone.modern.error player @a");
        var bankName = npc.getStoreddata().get("bank_name") || "Unknown Bank";
        var banksData = loadJson(BANKS_DATA_PATH);
        var bank = findJsonEntry(banksData, "bankName", bankName); // Use utility function

        if (bank) {
            tellPlayer(player, "&7Bank Guard Data:");
            tellPlayer(player, "&7- Bank Name: &e" + bank.bankName);
            tellPlayer(player, "&7- Gate Position 1: &e(" + bank.gate.pos1.x + ", " + bank.gate.pos1.y + ", " + bank.gate.pos1.z + ")");
            tellPlayer(player, "&7- Gate Position 2: &e(" + bank.gate.pos2.x + ", " + bank.gate.pos2.y + ", " + bank.gate.pos2.z + ")");
            tellPlayer(player, "&7- Gate Block: &e" + bank.gate.block.id + " (Data: " + bank.gate.block.data + ")");
        } else {
            tellPlayer(player, "&cNo bank data found for this NPC.");
        }
    }
}
