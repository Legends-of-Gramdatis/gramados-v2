// Dev tool: Animania Cattle Spawner & Tester
// Attach to a scripted item.
// Modes:
// 0: Spawn random cows around player
// 1: Make nearby cows pregnant
// 2: Skip gestation for nearby pregnant cows
// 3: Grow nearby calves to adults
// Right-click runs current mode; attack cycles modes.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_animania.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');

var TOOL_MODE = 0; // 0..3
var RADIUS = 16;   // scan/spawn radius
var SPAWN_COUNT = 5;

function interact(event) {
    var player = event.player; if (!player) return;
    var world = player.getWorld(); if (!world) return;
    var pos = getPlayerPos(player);

    if (TOOL_MODE === 0) {
        var spawned = spawnRandomCowsAround(world, pos, SPAWN_COUNT, RADIUS);
        tellPlayer(player, '&a[Animania] Spawned &6' + spawned + ' &arandom cows around you.');
    } else if (TOOL_MODE === 1) {
        var changed = applyNearbyCattleMutation(world, pos, RADIUS, _mutatePregnantCow);
        tellPlayer(player, '&a[Animania] Made &6' + changed + ' &anearby cows pregnant.');
    } else if (TOOL_MODE === 2) {
        var changed2 = applyNearbyCattleMutation(world, pos, RADIUS, _mutateSkipGestation);
        tellPlayer(player, '&a[Animania] Skipped gestation for &6' + changed2 + ' &apregnant cows.');
    } else if (TOOL_MODE === 3) {
        var changed3 = applyNearbyCattleMutation(world, pos, RADIUS, _mutateGrowCalf);
        tellPlayer(player, '&a[Animania] Grew &6' + changed3 + ' &acalves to adults.');
    }
}

function attack(event) {
    var player = event.player; if (!player) return;
    TOOL_MODE = (TOOL_MODE + 1) % 4;
    var names = [
        '&aSpawn Random Cows',
        '&aMake Nearby Cows Pregnant',
        '&aSkip Gestation Nearby',
        '&aGrow Nearby Calves'
    ];
    tellPlayer(player, '&e[AnimaniaTool] Mode ' + TOOL_MODE + ': ' + names[TOOL_MODE]);
}

function getTooltip(e) {
    e.add('&aDev: Animania Cattle Tool (' + RADIUS + ')');
    e.add('&7Right-click: run | Attack: cycle mode');
    e.add('&eMode 0: &7Spawn random cows');
    e.add('&eMode 1: &7Make nearby cows pregnant');
    e.add('&eMode 2: &7Skip gestation for nearby cows');
    e.add('&eMode 3: &7Grow nearby calves to adults');
}

// ---- Helpers ----

function spawnRandomCowsAround(world, center, count, radius) {
    var data = loadAnimaniaAnimalData();
    if (!data || !data.cow || !data.cow.breeds) return 0;
    var breeds = data.cow.breeds;
    var keys = Object.keys(breeds);
    if (!keys.length) return 0;
    var spawned = 0;
    for (var i = 0; i < count; i++) {
        var k = keys[Math.floor(Math.random() * keys.length)];
        var br = breeds[k]; if (!br) continue;
        // 70% chance adult cow, 30% chance calf
        var useCalf = (Math.random() < 0.30);
        var eid = useCalf ? br.kid : br.female;
        var dx = Math.floor((Math.random()*2 - 1) * radius);
        var dz = Math.floor((Math.random()*2 - 1) * radius);
        var sx = Math.floor(center.x) + dx;
        var sz = Math.floor(center.z) + dz;
        var sy = Math.floor(center.y);
        // Try to place slightly above ground if possible
        // Simple probe: search down up to 8 blocks to find non-air, then spawn 1 block above
        var yProbe = sy; var tries = 8; var found = false;
        for (var t = 0; t < tries; t++) {
            var blk = world.getBlock(sx, yProbe, sz);
            if (blk && !blk.isAir()) { found = true; break; }
            yProbe--; // go down
        }
        if (found) sy = yProbe + 1;
        // Fallback to direct summon
        try {
            API.executeCommand(world, '/summon ' + eid + ' ' + sx + ' ' + sy + ' ' + sz);
            spawned++;
        } catch (e) { /* ignore failed summon */ }
    }
    return spawned;
}

function applyNearbyCattleMutation(world, center, radius, mutator) {
    var changed = 0;
    // Ensure center is an IPos for API calls (player.getPos() returns IPos; getPlayerPos returns plain {x,y,z})
    var centerPos = (center && typeof center.getX === 'function')
        ? center
        : API.getIPos(Math.floor(center.x), Math.floor(center.y), Math.floor(center.z));
    var entities = world.getNearbyEntities(centerPos, radius, 0);
    for (var i = 0; i < entities.length; i++) {
        var ent = entities[i]; if (!ent || !ent.getEntityNbt) continue;
        var nbt; try { nbt = ent.getEntityNbt(); } catch (e) { continue; }
        var id = _getEntityIdFromNbt(nbt);
        if (!_isAnimaniaCattle(id)) continue; // cows & calves only
        if (mutator(nbt)) {
            try { ent.setEntityNbt(nbt); changed++; } catch (e2) { /* ignore */ }
        }
    }
    return changed;
}
