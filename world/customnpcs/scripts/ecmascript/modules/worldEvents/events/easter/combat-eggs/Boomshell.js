load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

var EXPLOSION_RADIUS = 5;
var MAX_DAMAGE = 20; // Maximum damage dealt at the center of the explosion
var KNOCKBACK_STRENGTH = 2;
var DESPAWN_TIMER_ID = 1;
var EVENT_DATA_JSON = "world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/easterBossFight.json";

/**
 * Initializes the BoomShell NPC.
 * @param {Object} event - The event object containing the NPC instance.
 */
function init(event) {
    var npc = event.npc;
    npc.getStoreddata().put("isPrimed", false);
}

/**
 * Handles the NPC's tick updates.
 * @param {Object} event - The event object containing the NPC instance.
 */
function tick(event) {
    var npc = event.npc;
    var world = npc.getWorld();
    var bossFightData = loadJson(EVENT_DATA_JSON);

    // Check if the boss is no longer attacking
    if (!bossFightData.isAttacking) {
        explode(npc);
        return;
    }

    // Play flame particles above the BoomShell
    if (rrandom_range(0, 3) == 1) {
        npc.executeCommand("/particle flame " + npc.getX() + " " + (npc.getY() + 1) + " " + npc.getZ() + " 0.2 0.2 0.2 0.01 5");
    }

    var nearbyEntities = world.getNearbyEntities(npc.getPos(), EXPLOSION_RADIUS, 1); // 1 = players

    for (var i = 0; i < nearbyEntities.length; i++) {
        var player = nearbyEntities[i];

        // Skip priming and explosion if the player is in creative mode and holding specific items
        if (player.getGamemode() === 1) { // 1 = Creative mode
            var item = player.getMainhandItem();
            if (item.getName() === "customnpcs:npcsoulstoneempty" || item.getName() === "customnpcs:npcmobcloner" || item.getName() === "customnpcs:npcscripter") {
                return;
            }
        }
    }

    if (nearbyEntities.length > 0 && !npc.getStoreddata().get("isPrimed")) {
        // Prime the BoomShell
        npc.getStoreddata().put("isPrimed", true);
        npc.executeCommand("/playsound minecraft:entity.tnt.primed master @a ~ ~ ~ 1 1");
        npc.executeCommand("/particle flame " + npc.getX() + " " + (npc.getY() + 1) + " " + npc.getZ() + " 0.2 0.2 0.2 0.1 5");
        npc.executeCommand("/particle smoke " + npc.getX() + " " + (npc.getY() + 1) + " " + npc.getZ() + " 0.2 0.2 0.2 0.1 5");

        // Check if the timer is already running before starting it
        if (!npc.getTimers().has(DESPAWN_TIMER_ID)) {
            npc.getTimers().start(DESPAWN_TIMER_ID, 40, false); // 2 seconds before explosion
        }
    }
}

/**
 * Handles the NPC's timer events.
 * @param {Object} event - The event object containing the NPC instance.
 */
function timer(event) {
    var npc = event.npc;

    if (event.id === DESPAWN_TIMER_ID) {
        explode(npc);
    }
}

/**
 * Handles the NPC's death or forced despawn.
 * @param {Object} event - The event object containing the NPC instance.
 */
function died(event) {
    var npc = event.npc;
    explode(npc);
}

/**
 * Triggers the explosion effect.
 * @param {ICustomNpc} npc - The NPC instance.
 */
function explode(npc) {
    var world = npc.getWorld();
    var npcPos = npc.getPos();
    var nearbyEntities = world.getNearbyEntities(npcPos, EXPLOSION_RADIUS, 1); // 1 = players

    // Play explosion sound and particles
    npc.executeCommand("/playsound minecraft:entity.generic.explode master @a ~ ~ ~ 1 1");
    npc.executeCommand("/particle largeexplode " + npc.getX() + " " + npc.getY() + " " + npc.getZ() + " 1 1 1 0.3 2 force");
    npc.executeCommand("/particle hugeexplosion " + npc.getX() + " " + npc.getY() + " " + npc.getZ() + " 0.5 0.5 0.5 0.2 1 force");
    npc.executeCommand("/particle flame " + npc.getX() + " " + npc.getY() + " " + npc.getZ() + " 1 1 1 1 50 force");
    npc.executeCommand("/particle smoke " + npc.getX() + " " + npc.getY() + " " + npc.getZ() + " 1 1 1 0.5 50 force");

    // Apply damage and knockback to nearby players
    for (var i = 0; i < nearbyEntities.length; i++) {
        var player = nearbyEntities[i];
        var distance = npcPos.distanceTo(player.getPos());
        if (distance <= EXPLOSION_RADIUS) {
            var damage = Math.max(0, MAX_DAMAGE * (1 - distance / EXPLOSION_RADIUS));
            player.damage(damage);

            // Apply knockback
            var dx = player.getX() - npc.getX();
            var dz = player.getZ() - npc.getZ();
            var knockbackFactor = KNOCKBACK_STRENGTH / distance;
            player.setMotionX(dx * knockbackFactor);
            player.setMotionY(0.5); // Upward motion
            player.setMotionZ(dz * knockbackFactor);
        }
    }

    // Despawn the NPC
    npc.despawn();
}
