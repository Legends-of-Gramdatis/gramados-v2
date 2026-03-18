load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

var _LOOTTABLE_FISH = "sealife/sealife_fish.json";

var tickCount = 0;
var lifespan = 20;

function init(event) {
    var npc = event.npc;
    regenerateFish(npc);
}

function tick(event) {
    var npc = event.npc;

    tickCount++;
    if (tickCount >= lifespan) {
        npc.despawn();
        npc.executeCommand("/playsound minecraft:enchant.thorns.hit master @a ~ ~ ~ 1 1");
        npc.executeCommand("/particle droplet ~ ~ ~ 0.5 0.5 0.5 0.5 10 normal");
        return;
    }

    if (npc.getMotionY() > -0.1 && npc.getMotionY() < 0) {
        npc.executeCommand("/playsound minecraft:entity.slime.squish master @a ~ ~ ~ 1 1");

        var randomMotion = Math.random() * 0.25 + 0.5;
        var randomMotionX = (Math.random() - 0.5) * 0.2;
        var randomMotionZ = (Math.random() - 0.5) * 0.2;

        npc.setMotionY(randomMotion);
        npc.setMotionX(randomMotionX);
        npc.setMotionZ(randomMotionZ);
    }
}

function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var world = npc.getWorld();

    // if bucket in main hand
    var item = player.getMainhandItem();
    if (item.getName() == "minecraft:bucket") {
        npc.executeCommand("/playsound minecraft:block.note.bell master @a ~ ~ ~ 1 1");
        var items = pullLootTable(_LOOTTABLE_FISH, player);
        for (var i = 0; i < items.length; i++) {
            var itemStack = generateItemStackFromLootEntry(items[i], world, player);

            // Set custom name to the item
            var customName = "§rFish";
            itemStack.setCustomName(customName);

            if (Math.random() < 0.2) {
                var nbt = itemStack.getItemNbt();
                var tag = nbt.getCompound("tag");
                tag.setBoolean("is_modifier", true);
                nbt.setCompound("tag", tag);
                itemStack.setLore(["§7This fish has mysterious properties..."]);
            }

            player.dropItem(itemStack);
        }
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
    lifespan = Math.floor(Math.random() * 7) + 16;
    npc.getDisplay().setSkinUrl(getRandomSkin());
    var randomScale = pickFromArray([1,2]);
    npc.getDisplay().setSize(randomScale);
    var pos = npc.getPos();
    npc.setPosition(pos.getX(), pos.getY() + 10, pos.getZ());
}

