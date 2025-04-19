var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");

var BANKS_DATA_PATH = "world/customnpcs/scripts/ecmascript/modules/bankVault/banks_data.json";

function findBank(banksData, npcPos) {
    for (var i = 0; i < banksData.length; i++) {
        var bank = banksData[i];
        if (isWithinZone(npcPos, bank.pos1, bank.pos2)) {
            return bank;
        }
    }
    return null;
}

function orderPositions(pos1, pos2) {
    return {
        x1: Math.min(pos1.x, pos2.x),
        y1: Math.min(pos1.y, pos2.y),
        z1: Math.min(pos1.z, pos2.z),
        x2: Math.max(pos1.x, pos2.x),
        y2: Math.max(pos1.y, pos2.y),
        z2: Math.max(pos1.z, pos2.z)
    };
}

function notifyPlayersInRegion(world, bank, message) {
    var orderedPositions = orderPositions(bank.pos1, bank.pos2);
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

        // Notify players in the region
        notifyPlayersInRegion(npc.getWorld(), bank, "&6&l[&e&lBank Vault&6&l] &aGuarding the bank vault...");

        // Close the gate on NPC respawn
        if (bank.gate) {
            var orderedPositions = orderPositions(bank.gate.pos1, bank.gate.pos2);
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

    var bankName = npc.getStoreddata().get("bank_name");
    var bank = findJsonEntry(banksData, "bankName", bankName); // Use utility function

    if (bank && bank.isVaultGateOpened) {
        var currentTime = npc.getWorld().getTotalTime();
        var gateOpenTime = bank.vaultGateOpenTime || 0;
        var elapsedTime = currentTime - gateOpenTime;

        var respawnTimeTicks = npc.getStats().getRespawnTime() * 20; // Convert seconds to ticks
        var oneFourthTime = respawnTimeTicks * 0.25;
        var oneTenthTime = respawnTimeTicks * 0.1;

        if (elapsedTime <= respawnTimeTicks - oneFourthTime) { // Before the last quarter
            if (currentTime % 20 === 0) { // Play sound every second
                npc.executeCommand("/playsound minecraft:block.note.hat block @a ~ ~ ~ 10 1");
            }
        } else if (elapsedTime <= respawnTimeTicks - oneTenthTime) { // Last quarter
            if (currentTime % 10 === 0) { // Play sound every 10 ticks
                npc.executeCommand("/playsound minecraft:block.note.hat block @a ~ ~ ~ 10 1");
            }
        } else { // Last tenth
            if (currentTime % 10 === 0) { // Play both sounds every 10 ticks
                npc.executeCommand("/playsound minecraft:block.note.hat block @a ~ ~ ~ 10 1");
                npc.executeCommand("/playsound cfm:fire_alarm block @a ~ ~ ~ 10 1");
            }
        }
    }
}

function died(event) {
    var npc = event.npc;
    var world = npc.getWorld();
    var banksData = loadJson(BANKS_DATA_PATH);

    var bankName = npc.getStoreddata().get("bank_name");
    var bank = findJsonEntry(banksData, "bankName", bankName); // Use utility function

    if (bank && bank.gate) {
        // Notify players in the region
        notifyPlayersInRegion(world, bank, "&6&l[&e&lBank Vault&6&l] &aThe vault gate is now open for 2:30 minutes!");

        // Open the gate by filling it with air blocks
        var orderedPositions = orderPositions(bank.gate.pos1, bank.gate.pos2);

        for (var x = orderedPositions.x1; x <= orderedPositions.x2; x++) {
            for (var y = orderedPositions.y1; y <= orderedPositions.y2; y++) {
                for (var z = orderedPositions.z1; z <= orderedPositions.z2; z++) {
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
