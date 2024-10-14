// On death
function died(event) {
    var npc = event.npc;
    var world = npc.getWorld();
    var guardian;

    npc.say("You have found a Tactical Resupply Box. Guardian-RX will be 50% healed.");

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
        var current_health = guardian.getHealth();
        var max_health = guardian.getMaxHealth();
        guardian.setHealth(current_health + (max_health / 2));
    }
}