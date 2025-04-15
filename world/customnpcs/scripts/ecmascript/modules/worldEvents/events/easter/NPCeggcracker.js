// Load utility modules
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

load('world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js');

var eggcracker_type = [
    "Eggcrack Confectioner",
    "Aetheric Botanist",
    "Eggcryption Technician"
]

var egg_openning_lines_confectioner = [
    "&aAh, another Spring Egg? Let's see what sweetness lies inside!",
    "&aCareful! These shells are soft as whipped cream.",
    "&aSmells like vanilla and secrets. I love it.",
    "&aYou'd be amazed what people stuff inside these things.",
    "&aJust a pinch of warmth and it'll pop right open!",
    "&aMmm... I hope it's not another glittery marshmallow again.",
    "&aHere we go! Let's see if luck is on your side.",
    "&aIt's not the chocolate that's magic, it's the joy!",
    "&aEvery egg is like a little surprise pastry, don't you think?",
    "&aI once opened one that sang a song. Still don't know how.",
    "&aI've been cracking eggs since the Spring of '43.",
    "&aHold on, lemme grab my sugar-gloves.",
    "&aOho! This one's humming. Might be a fancy prize!",
    "&aThey say each egg has a soul. I say it has nougat.",
    "&aThe joy of spring, bottled in shell and sparkle."
]

var egg_openning_lines_botanist = [
    "&aAh... another chromatic anomaly wrapped in eggshell.",
    "&aThis shell is alive-you can hear it breathe.",
    "&aNature's way of celebrating strange seasons.",
    "&aCareful. These eggs are photosensitive.",
    "&aFascinating. The pattern matches that of a rare pollen cluster.",
    "&aLet me open this with a little whisper and a lot of care.",
    "&aYou see that shimmer? That's raw aether, my friend.",
    "&aSometimes, flowers bloom from them. Sometimes... insects.",
    "&aI swear one of these hatched into a cloud once.",
    "&aEven the wind respects these eggs. You should too.",
    "&aI don't trust the ones that glow green. You shouldn't either.",
    "&aThe egg is part of the cycle... we're just the curious middle.",
    "&aLet's peel back the mystery-leaf by leaf.",
    "&aThe forest gave us this. Let's not waste it.",
    "&aA chromashell... rare and reflective. Like dew at dusk."
]

var egg_openning_lines_technician = [
    "&aWhoa. Encrypted Grade-C? You got something spicy.",
    "&aLet's plug this bad boy in. Just... don't stand too close.",
    "&aYou got an Arcade Token? Then we're in business.",
    "&aHuh... this one's humming in Morse code.",
    "&aCareful. Last time one of these exploded into cake.",
    "&aStand by. Breaching containment shell now.",
    "&aNot gonna lie, I have no clue how this tech even exists.",
    "&aThese eggs are smarter than most of my clients.",
    "&aDecrypting now. If the lights flicker, stay calm.",
    "&aWe've isolated the signal. Now we open it with... science.",
    "&aYou wouldn't believe what one guy pulled out of one of these. A live disco duck.",
    "&aThis pattern... it's old. Like pre-Gramados old.",
    "&aAlright, slotting the token. Let's see what pops.",
    "&aYou ever seen one leak data? Wild stuff.",
    "&aThe encryption fights back. But so do I."
]

function regenerate(npc) {
    // move to next eggcracker type
    var current_type = npc.getStoreddata().get("eggcracker_type");
    var current_index = eggcracker_type.indexOf(current_type);
    var next_index = (current_index + 1) % eggcracker_type.length;
    var next_type = eggcracker_type[next_index];
    npc.getStoreddata().put("eggcracker_type", next_type);
    // set the NPC name
    npc.getDisplay().setName(next_type);
    // switch next_type for title
    var title = "";
    var egg_item = "";
    switch (next_type) {
        case "Eggcrack Confectioner":
            title = "Opens Spring Eggs";
            egg_item = "minecraft:egg";
            break;
        case "Aetheric Botanist":
            title = "Opens Chromashell Eggs";
            egg_item = "animania:brown_egg"
            break;
        case "Eggcryption Technician":
            title = "Opens Encrypted Eggs";
            egg_item = "animania:peacock_egg_blue";
            break;
        default:
            title = "Opens Easter Eggs";
            egg_item = "animania:peacock_egg_white";
            break;
    }

    npc.getDisplay().setTitle(title);
    // set the NPC egg item
    npc.getStoreddata().put("egg_item", egg_item);
}

/**
 * Initializes the NPC when it is spawned or loaded.
 * @aaram {Object} event - The event object containing the NPC instance.
 */
function init(event) {
    var npc = event.npc;
    
    if (!npc.getStoreddata().has("eggcracker_type")) {
        npc.getStoreddata().put("eggcracker_type", eggcracker_type[0]);
    }

    if (!npc.getStoreddata().has("egg_item")) {
        npc.getStoreddata().put("egg_item", "minecraft:egg");
    }
}

/**
 * Handles player interaction with the NPC.
 * @aaram {Object} event - The event object containing the player instance.
 */
function interact(event) {
    var npc = event.npc;

    // get player hand item
    var player = event.player;
    var item = player.getMainhandItem();
    var item_name = item.getName();
    var egg_item = npc.getStoreddata().get("egg_item");

    if (item_name == "minecraft:command_block") {
        npc.executeCommand("/playsound ivv:computer.gaming.deleted master @a");
        // regenerate the NPC
        regenerate(npc);
        // tell the player that the NPC has been regenerated
        tellPlayer(player, "&6The NPC has been regenerated!");
    } else if (item_name == egg_item) {
        // get the eggcracker type
        var eggcracker_type = npc.getStoreddata().get("eggcracker_type");
        var openning_sound = "minecraft:block.fire.extinguish";
        var egg_openning_lines = [];
        switch (eggcracker_type) {
            case "Eggcrack Confectioner":
                egg_openning_lines = egg_openning_lines_confectioner;
                openning_sound = "chisel:chisel.wood";
                break;
            case "Aetheric Botanist":
                egg_openning_lines = egg_openning_lines_botanist;
                openning_sound = "cfm:tap";
                break;
            case "Eggcryption Technician":
                egg_openning_lines = egg_openning_lines_technician;
                openning_sound = "ivv:phone.malfunction.paradox.future";
                break;
            default:
                break;
        }
        tellRandomMessage(player, egg_openning_lines);
        // play the sound
        npc.executeCommand("/playsound " + openning_sound + " master @a");

        var item_lore = item.getLore()
        var eggsize = item_lore[3].split(" ")[1].trim();
        eggsize = eggsize.replace("§l", "").replace("§r§d§o", "");
        tellPlayer(player, "&aThe egg is " + eggsize + " in size.");
        // premove egg item from player inventory
        // item.setStackSize(item.getStackSize() - 1);
    }
}

function genereate_egg_loot(eggcracker_type) {
    var loot = [];
    switch (eggcracker_type) {
        case "Eggcrack Confectioner":
            loot = [
                "minecraft:dye:3",
                "harvestcraft:cocoapowderitem:0",
                "harvestcraft:chocolatebaritem:0",
                "harvestcraft:candiedwalnutsitem:0",
                "harvestcraft:candiedgingeritem:0",
                "harvestcraft:candiedsweetpotatoesitem:0",
                "harvestcraft:candiedlemonitem:0",
                "harvestcraft:cottoncandyitem:0",
                "harvestcraft:chocolatesprinklecakeitem:0",
                "mts:iv_tpp.paint_bucket_chocolate:0",
                "mts:unuparts.unuparts_decor_unu_paint_chocolate:0",
                "harvestcraft:chocolateorangeitem:0",
                "harvestcraft:candiedpecansitem:0",
                "harvestcraft:maplecandiedbaconitem:0",
                "harvestcraft:chocolaterollitem:0",
                "harvestcraft:chocolatecupcakeitem:0",
                "harvestcraft:chocolatepuddingitem:0",
                "harvestcraft:chocolatesprinklecakeitem:0",
                "animania:chocolate_truffle:0",
                "harvestcraft:chocolatecoconutbaritem:0",
                "growthcraft_milk:yogurt:1:0",
                "growthcraft_milk:ice_cream:1:0",
                "harvestcraft:chocolatedonutitem:0",
                "harvestcraft:chocolatestrawberryitem:0",
                "harvestcraft:chocolatemilkshakeitem:0",
                "harvestcraft:chocolatebaconitem:0",
                "harvestcraft:cherrycoconutchocolatebaritem:0",
                "harvestcraft:honeycombchocolatebaritem:0",
                "harvestcraft:chocolatecaramelfudgeitem:0",
                "harvestcraft:chocolatemilkitem:0",
                "harvestcraft:chocolateyogurtitem:0",
                "harvestcraft:chocolatecherryitem:0",
                "harvestcraft:chocolateicecreamitem:0",
                "harvestcraft:hotchocolateitem:0",
                "harvestcraft:chilichocolateitem:0",
                "minecraft:cookie:0",
                "harvestcraft:creamcookieitem:0",
                "harvestcraft:meringuecookieitem:0",
                "harvestcraft:marshmellowsitem:0",
                "harvestcraft:marshmellowchicksitem:0",
                "minecraft:cake:0",
            ];
            break;
        case "Aetheric Botanist":
            loot = [
                "minecraft:dye:0",
                "minecraft:dye:1",
                "minecraft:dye:2",
                "minecraft:dye:3",
                "minecraft:dye:4",
                "minecraft:dye:5",
                "minecraft:dye:6",
                "minecraft:dye:7",
                "minecraft:dye:8",
                "minecraft:dye:9",
                "minecraft:dye:10",
                "minecraft:dye:11",
                "minecraft:dye:12",
                "minecraft:dye:13",
                "minecraft:dye:14",
                "minecraft:dye:15",
                "minecraft:yellow_flower:0",
                "minecraft:red_flower:0",
                "minecraft:red_flower:1",
                "minecraft:red_flower:2",
                "minecraft:red_flower:3",
                "minecraft:red_flower:4",
                "minecraft:red_flower:5",
                "minecraft:red_flower:6",
                "minecraft:red_flower:7",
                "minecraft:red_flower:8",
                "minecraft:double_plant:0",
                "minecraft:double_plant:1",
                "minecraft:double_plant:4",
                "minecraft:double_plant:5",
                "mts:cactusdecor_misc.grass_5x5:0",
                "mts:cactusdecor_misc.grass_3x3:0"
            ];
            break;
        }
    return loot;
}

function getRandomLoot() {
    var loot = genereate_egg_loot();
    var randomIndex = Math.floor(Math.random() * loot.length);
    return loot[randomIndex];
}

