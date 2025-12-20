// Dev tool: Experimental Farm Cycle (progressive batching)
// Attach to a scripted item.
// Steps:
// 0: Till + clear vegetation on nearby surface (grass/dirt -> farmland)
// 1: Water farmland (fertilize to wet)
// 2: Plant random single-crop patches (from JSON, ignores inventory)
// 3: Fill leftover farmland with random mixed crops (from JSON)
// 4: Harvest by breaking (setblock air destroy)
// Right-click runs a batch of the current step; Attack cycles steps and resets progress.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_crops.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

var STEP_MODE = 0;          // 0..5
var RADIUS = 100;            // default working radius (can be large)

function interact(event) {
    var player = event.player; if (!player) return;
    var world = player.getWorld(); if (!world) return;

    var pos = getPlayerPos(player);
    pos.y = pos.y - 1; // bias down toward surface

    if (STEP_MODE === 0) {
        var tilled = tillSurfaceToFarmland(world, pos, RADIUS, true);
        tellPlayer(player, '&a[Till] Converted &6' + tilled + ' &ablocks to farmland (cleared vegetation).');
    } else if (STEP_MODE === 1) {
        var changed = fertilize_farmland_sphere(world, pos, RADIUS);
        tellPlayer(player, '&a[Water] Wet &6' + changed + ' &afarmland blocks.');
    } else if (STEP_MODE === 2) {
        var planted = plantRandomPatches(world, pos, RADIUS, player);
        tellPlayer(player, '&a[Patches] Planted &6' + planted + ' &apatches.');
    } else if (STEP_MODE === 3) {
        var filled = plantMixedCrops(world, pos, RADIUS);
        tellPlayer(player, '&a[Fill] Planted &6' + filled + ' &amixed crops.');
    } else if (STEP_MODE === 4) {
        var grown = growCropsToMax(world, pos, RADIUS);
        tellPlayer(player, '&a[Grow] Grew &6' + grown + ' &acrops to max stage.');
    } else if (STEP_MODE === 5) {
        var broken = harvestCropsBreak(world, pos, RADIUS);
        tellPlayer(player, '&a[Harvest] Broke &6' + broken + ' &acrops.');
    }
}

function attack(event) {
    var player = event.player; if (!player) return;
    STEP_MODE = (STEP_MODE + 1) % 6;
    var names = [
        '&aStep 0: Till + Clear',
        '&aStep 1: Water Farmland',
        '&aStep 2: Random Patches',
        '&aStep 3: Fill Mixed',
        '&aStep 4: Grow to Max',
        '&aStep 5: Harvest'
    ];
    tellPlayer(player, '&e[FarmExperiment] Mode ' + STEP_MODE + ': ' + names[STEP_MODE]);
}

function getTooltip(e) {
    e.add('&aDev: Experimental Farm Cycle (' + RADIUS + ')');
    e.add('&7Right-click: run batch | Attack: cycle step');
    e.add('&eStep 0: &7Till + clear vegetation');
    e.add('&eStep 1: &7Water farmland');
    e.add('&eStep 2: &7Plant random patches (JSON)');
    e.add('&eStep 3: &7Fill leftover with mixed crops');
    e.add('&eStep 4: &7Grow all crops to max stage');
    e.add('&eStep 5: &7Harvest by breaking');
}

// ---- Step 2: Plant random single-crop patches ----
function plantRandomPatches(world, center, radius, player) {
    var seedMap = loadSeedToCropMap();
    var seedIds = [];
    for (var sid in seedMap) { seedIds.push(sid); }
    
    // Scale patch count with area (radius²) for better coverage
    var patchCount = Math.max(3, Math.floor(radius * radius));
    var planted = 0;
    
    for (var i = 0; i < patchCount; i++) {
        var dx = Math.floor((Math.random()*2 - 1) * radius);
        var dy = Math.floor((Math.random()*2 - 1) * radius);
        var dz = Math.floor((Math.random()*2 - 1) * radius);
        if (dx*dx + dy*dy + dz*dz > radius*radius) { i--; continue; }
        
        var px = Math.floor(center.x) + dx;
        var py = Math.floor(center.y) + dy;
        var pz = Math.floor(center.z) + dz;
        var pr = 2 + Math.floor(Math.random() * 3); // patch radius 2..4
        var sid = seedIds[Math.floor(Math.random() * seedIds.length)];
        
        plantCropsOnFarmland(world, {x: px, y: py, z: pz}, pr, sid, -1, null, 0);
        planted++;
    }
    
    return planted;
}

// ---- Step 3: Fill leftover farmland with random mixed crops ----
function plantMixedCrops(world, center, radius) {
    var seedMap = loadSeedToCropMap();
    var cropIds = [];
    var seen = {};
    for (var sid in seedMap) {
        var e = seedMap[sid];
        if (e && typeof e.crop === 'string' && !seen[e.crop]) {
            seen[e.crop] = true;
            cropIds.push(e.crop);
        }
    }
    if (cropIds.length === 0) return 0;

    var c = { x: Math.floor(center.x), y: Math.floor(center.y), z: Math.floor(center.z) };
    var r2 = radius * radius;
    var planted = 0;

    for (var dx = -radius; dx <= radius; dx++) {
        for (var dy = -radius; dy <= radius; dy++) {
            for (var dz = -radius; dz <= radius; dz++) {
                if (dx*dx + dy*dy + dz*dz > r2) continue;
                
                var x = c.x + dx, y = c.y + dy, z = c.z + dz;
                var below = world.getBlock(x, y, z);
                if (!below || below.getName() !== 'minecraft:farmland') continue;
                
                var above = world.getBlock(x, y + 1, z);
                if (!above || !above.isAir()) continue;
                
                var cropBlock = cropIds[Math.floor(Math.random() * cropIds.length)];
                world.setBlock(x, y + 1, z, cropBlock, 0);
                planted++;
            }
        }
    }
    
    return planted;
}
