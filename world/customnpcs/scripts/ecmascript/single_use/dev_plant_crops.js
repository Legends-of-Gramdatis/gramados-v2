// Dev tool: Test crop planting system with various scenarios
// Attach to a scripted item; right-click to test, attack to switch mode.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_crops.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_inventory.js');

// Test modes
var TEST_MODE = 0; // 0 = plant from inventory, 1 = plant 10 from inventory, 2 = unlimited planting, 3 = random mixed planting

function interact(event) {
    var player = event.player; if (!player) return;
    var world = player.getWorld(); if (!world) return;

    var pos = getPlayerPos(player);
    var RADIUS = 5;

    if (TEST_MODE === 0) {
        // Mode 0: Plant all available seeds from inventory
        tellPlayer(player, '&e[Test] Mode 0: Plant all seeds from inventory (radius ' + RADIUS + ')');
        testPlantFromInventory(player, world, pos, RADIUS, -1);
    } else if (TEST_MODE === 1) {
        // Mode 1: Plant exactly 10 seeds (or less if not available)
        tellPlayer(player, '&e[Test] Mode 1: Plant 10 seeds from inventory (radius ' + RADIUS + ')');
        testPlantFromInventory(player, world, pos, RADIUS, 10);
    } else if (TEST_MODE === 2) {
        // Mode 2: Unlimited planting (no inventory check)
        tellPlayer(player, '&e[Test] Mode 2: Unlimited planting (ignores inventory)');
        testUnlimitedPlanting(player, world, pos, RADIUS);
    } else if (TEST_MODE === 3) {
        // Mode 3: Random mixed planting from all available seeds
        tellPlayer(player, '&e[Test] Mode 3: Random mixed planting from all seeds in inventory');
        testRandomMixedPlanting(player, world, pos, RADIUS);
    }
}

function attack(event) {
    var player = event.player; if (!player) return;
    
    // Cycle through test modes
    TEST_MODE = (TEST_MODE + 1) % 4;
    
    var modeNames = [
        '&aPlant all from inventory',
        '&aPlant 10 from inventory',
        '&aUnlimited planting (no inv check)',
        '&aRandom mixed planting'
    ];
    
    tellPlayer(player, '&e[Test] Switched to mode ' + TEST_MODE + ': ' + modeNames[TEST_MODE]);
}

/**
 * Test planting seeds from player inventory.
 */
function testPlantFromInventory(player, world, pos, radius, count) {
    // Try to find seeds in player inventory
    var testSeeds = [
        'minecraft:wheat_seeds',
        'minecraft:carrot',
        'minecraft:potato',
        'harvestcraft:onionseeditem',
        'harvestcraft:tomatoseeditem',
        'harvestcraft:cabbageseeditem'
    ];
    
    var foundSeed = null;
    var foundCount = 0;
    
    for (var i = 0; i < testSeeds.length; i++) {
        var seedId = testSeeds[i];
        var seedCount = countItemInInventory(player, seedId, 0, null);
        if (seedCount > 0) {
            foundSeed = seedId;
            foundCount = seedCount;
            break;
        }
    }
    
    if (!foundSeed) {
        tellPlayer(player, '&cNo seeds found in inventory! Try: wheat_seeds, carrot, potato, or harvestcraft seeds');
        return;
    }
    
    var plantCount = count === -1 ? foundCount : count;
    tellPlayer(player, '&7Found &6' + foundCount + ' &7x ' + foundSeed + ' in inventory');
    tellPlayer(player, '&7Attempting to plant &6' + (count === -1 ? 'all' : plantCount) + ' &7crops...');
    
    var leftover = plantCropsOnFarmland(world, pos, radius, foundSeed, plantCount, player, 0);
    var planted = plantCount - leftover;
    
    tellPlayer(player, '&aPlanted &6' + planted + ' &acrops! Leftover: &6' + leftover);
    
    // Check inventory after
    var remainingSeeds = countItemInInventory(player, foundSeed, 0, null);
    tellPlayer(player, '&7Seeds remaining in inventory: &6' + remainingSeeds);
}

/**
 * Test unlimited planting (ignores inventory).
 */
function testUnlimitedPlanting(player, world, pos, radius) {
    var testSeed = 'minecraft:wheat_seeds';
    var cropBlock = getCropBlockForSeed(testSeed, 0);
    
    if (!cropBlock) {
        tellPlayer(player, '&cFailed to get crop block for ' + testSeed);
        return;
    }
    
    tellPlayer(player, '&7Planting &6' + testSeed + ' &7-> &6' + cropBlock + ' &7(unlimited mode)');
    
    var leftover = plantCropsOnFarmland(world, pos, radius, testSeed, -1, null, 0);
    
    tellPlayer(player, '&aUnlimited planting complete! Leftover: &6' + leftover + ' &7(should be 0)');
}

/**
 * Test random mixed planting from all available seed types in inventory.
 */
function testRandomMixedPlanting(player, world, pos, radius) {
    // Load seed mapping and get all seed types dynamically
    var seedMap = loadSeedToCropMap();
    var allSeedTypes = [];
    for (var seedId in seedMap) {
        allSeedTypes.push(seedId);
    }
    
    // Find which seeds player has
    var availableSeeds = [];
    for (var i = 0; i < allSeedTypes.length; i++) {
        var seedId = allSeedTypes[i];
        var count = countItemInInventory(player, seedId, 0, null);
        if (count > 0) {
            availableSeeds.push({id: seedId, count: count});
        }
    }
    
    if (availableSeeds.length === 0) {
        tellPlayer(player, '&cNo seeds found in inventory!');
        return;
    }
    
    tellPlayer(player, '&7Found &6' + availableSeeds.length + ' &7different seed types in inventory');
    
    // Scan for farmland and plant randomly
    var c = { x: Math.floor(pos.x), y: Math.floor(pos.y), z: Math.floor(pos.z) };
    var r2 = radius * radius;
    var planted = 0;
    var plantedByType = {};
    
    for (var dx = -radius; dx <= radius; dx++) {
        for (var dy = -radius; dy <= radius; dy++) {
            for (var dz = -radius; dz <= radius; dz++) {
                if (dx*dx + dy*dy + dz*dz > r2) continue;
                
                var x = c.x + dx;
                var y = c.y + dy;
                var z = c.z + dz;
                
                // Check if this block is farmland
                var blockBelow = world.getBlock(x, y, z);
                if (!blockBelow || blockBelow.getName() !== 'minecraft:farmland') continue;
                
                // Check if block above is air
                var blockAbove = world.getBlock(x, y + 1, z);
                if (!blockAbove || !blockAbove.isAir()) continue;
                
                // Pick random seed from available
                var randomIndex = Math.floor(Math.random() * availableSeeds.length);
                var seedEntry = availableSeeds[randomIndex];
                
                // Get crop block for this seed
                var cropBlock = getCropBlockForSeed(seedEntry.id, 0);
                if (!cropBlock) continue;
                
                // Plant it (guard against bad ids causing format errors)
                try {
                    world.setBlock(x, y + 1, z, cropBlock, 0);
                    planted++;
                } catch (ex) {
                    tellPlayer(player, '&cError planting ' + seedEntry.id + ': ' + ex);
                    continue;
                }
                
                // Track planted by type
                if (!plantedByType[seedEntry.id]) {
                    plantedByType[seedEntry.id] = 0;
                }
                plantedByType[seedEntry.id]++;
                
                // Remove one seed from inventory
                removeItemsFromInventory(player, seedEntry.id, 1, 0, null);
                seedEntry.count--;
                
                // Remove from available list if depleted
                if (seedEntry.count <= 0) {
                    availableSeeds.splice(randomIndex, 1);
                    if (availableSeeds.length === 0) break;
                }
            }
            if (availableSeeds.length === 0) break;
        }
        if (availableSeeds.length === 0) break;
    }
    
    tellPlayer(player, '&aPlanted &6' + planted + ' &acrops randomly from &6' + Object.keys(plantedByType).length + ' &aseed types!');
    
    // Show breakdown
    for (var seedId in plantedByType) {
        var count = plantedByType[seedId];
        tellPlayer(player, '&7  - ' + seedId + ': &6' + count);
    }
}

function getTooltip(e) {
    e.add('&aDev: Test Crop Planting');
    e.add('&7Right-click: Run test in current mode');
    e.add('&7Attack: Cycle test mode');
    e.add('&eMode 0: &7Plant all seeds from inventory');
    e.add('&eMode 1: &7Plant 10 seeds from inventory');
    e.add('&eMode 2: &7Unlimited planting (no inv)');
    e.add('&eMode 3: &7Random mixed planting');
}
