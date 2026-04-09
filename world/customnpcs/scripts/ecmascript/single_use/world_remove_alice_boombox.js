var API = Java.type('noppes.npcs.api.NpcAPI').Instance();

var TARGET_PLAYER_NAME = 'AliceOfTheMoon';
var TARGET_ITEM_ID = 'mts:ivv.boombox';

function login(event) {
    enforceBoomboxRemoval(event.player);
}

function tick(event) {
    // Safe fallback if this script is attached where tick has a player context.
    if (!event.player) {
        return;
    }
    enforceBoomboxRemoval(event.player);
}

function enforceBoomboxRemoval(player) {
    if (!player || player.getName() != TARGET_PLAYER_NAME) {
        return;
    }

    var world = player.getWorld();

    var mainhand = player.getMainhandItem();
    if (mainhand && !mainhand.isEmpty() && mainhand.getName() == TARGET_ITEM_ID) {
        player.dropItem(mainhand.copy());
        player.setMainhandItem(world.createItem('minecraft:air', 0, 1));
    }

    var offhand = player.getOffhandItem();
    if (offhand && !offhand.isEmpty() && offhand.getName() == TARGET_ITEM_ID) {
        player.dropItem(offhand.copy());
        API.executeCommand(world, '/replaceitem entity ' + player.getName() + ' weapon.offhand air');
    }
}
