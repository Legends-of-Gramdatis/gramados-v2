// On death
function died(event) {
    var npc = event.npc;
    var world = npc.getWorld();
    var guardian;

    npc.say("You have found an Energy Cell Crate. Guardian-RX will be healed.");

    // Get the NPC with the name "Guardian-RX"
    var nearbyNPCs = world.getNearbyEntities(npc.getPos(), 100, 0)
    for (var i = 0; i < nearbyNPCs.length; i++) {
        if (nearbyNPCs[i].getName().equals("Guardian-RX")) {
            guardian = nearbyNPCs[i];
            break;
        }
    }
    // If the NPC exists
    if (guardian != null) {
        // Set the NPC's health to max
        guardian.setHealth(guardian.getMaxHealth());
    }
}