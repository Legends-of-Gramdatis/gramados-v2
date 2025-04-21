var DESPAWN_TIME_SECONDS = 120; // Configurable time in seconds

/**
 * Initializes the NPC and starts the despawn timer.
 * @param {Object} event - The event object containing the NPC instance.
 */
function init(event) {
    var npc = event.npc;
    var uniqueTimerId = npc.getUUID().hashCode(); // Use the NPC's UUID hash code as the timer ID
    npc.getTimers().start(uniqueTimerId, DESPAWN_TIME_SECONDS * 20, false); // Convert seconds to ticks (20 ticks = 1 second)
}

/**
 * Handles the timer event to despawn the NPC.
 * @param {Object} event - The event object containing the NPC instance.
 */
function timer(event) {
    var npc = event.npc;
    if (event.id === npc.getUUID().hashCode()) { // Check if the timer ID matches the NPC's UUID hash code
        npc.despawn();
    }
}
