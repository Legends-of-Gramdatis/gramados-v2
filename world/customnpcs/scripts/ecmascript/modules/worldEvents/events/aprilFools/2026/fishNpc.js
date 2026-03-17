load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');

var tickCount = 0;

function init(event) {
    var npc = event.npc;
    regenerateFish(npc);
}

function tick(event) {
    var npc = event.npc;

    tickCount++;
    if (tickCount >= 40) {
        npc.despawn();
        npc.executeCommand("/playsound minecraft:enchant.thorns.hit master @a ~ ~ ~ 1 1");
        npc.executeCommand("/particle droplet ~ ~ ~ 0.5 0.5 0.5 0.5 10 normal");
        return;
    }

    if (npc.getMotionY() > -0.1 && npc.getMotionY() < 0) {
        npc.executeCommand("/playsound minecraft:entity.slime.squish master @a ~ ~ ~ 1 1");
        npc.setMotionY(1);
    }
}

function interact(event) {
    var npc = event.npc;
    var player = event.player;

    // if bucket in main hand
    var item = player.getMainhandItem();
    if (item.getName() == "minecraft:bucket") {
        npc.executeCommand("/playsound minecraft:block.note.bell master @a ~ ~ ~ 1 1");
        player.giveItem("minecraft:fish", 0, 1);
        npc.despawn();
    }
}

function getRandomSkin() {
    var skin_url = "https://legends-of-gramdatis.com/gramados_skins/fish/fish_";
    var skin_ext = ".png";

    var skin_varients = ["black", "blue", "brown", "cyan", "green", "orange", "pink", "purple", "red", "yellow"];
    var skin_varient = pickFromArray(skin_varients);
    return skin_url + skin_varient + skin_ext;
}

function regenerateFish(npc) {
    tickCount = 0;
    npc.getDisplay().setSkinUrl(getRandomSkin());
    var randomScale = pickFromArray([1,2]);
    npc.getDisplay().setSize(randomScale);
    var pos = npc.getPos();
    npc.setPosition(pos.getX(), pos.getY() + 10, pos.getZ());
}

