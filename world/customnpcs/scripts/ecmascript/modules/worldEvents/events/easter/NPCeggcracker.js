// Load utility modules
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js')
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js')

load('world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js');

var error_lines = {}

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

var  Spring_Egg_Technicians = [
    "&eUnless that thing's got a firewall, I don't want it.",
    "&eThis is candy. I'm not paid in chocolate.",
    "&eTry a sugar alchemist or whatever they call themselves.",
    "&eDo I look like I debug jellybeans?",
    "&eSweet, but not encrypted. I deal in danger, not dessert.",
    "&eYou're about eight layers of frosting too early.",
    "&eThat egg's cute. I'm looking for corrupted.",
    "&eIf I can't plug it in, it's not my problem."
]

var Spring_Egg_Botanists = [
    "&eNo floral imprint, no chromatic bloom... this is junk food.",
    "&eYou're looking for someone with a sugar problem, not a spore journal.",
    "&eMy eggs whisper secrets. Yours... smells like marshmallow.",
    "&eThat's not infused with anything natural. It's barely organic.",
    "&eBring me an egg that hums with life, not one that giggles.",
    "&eThis shell's been dyed, not grown. Try the confectioners.",
    "&eThis egg's been processed. My eggs are born wild.",
    "&eThat thing's artificial joy. I work with natural resonance."
]

var Chromashell_Egg_Confectioners = [
    "&eHmm... no chocolate, no sprinkles. Are you sure this is food?",
    "&eThat egg looks like it came out of a swamp, not an oven.",
    "&eWhat in the jellybean is this?",
    "&eSorry, love, I only deal in sugar, not moss and mystery.",
    "&eEugh, that thing's moving. Not in a fun, candy way.",
    "&eThis egg has bark. Actual bark. No thanks.",
    "&eTry someone with a compost bin, not a candy counter.",
    "&eI can't cook this. I don't even think it's safe to taste."
]

var Chromashell_Egg_Technicians = [
    "&eNo signal. Just spores. Gross.",
    "&eLooks more like a seed than a circuit.",
    "&eIf it grows roots instead of logs, I'm out.",
    "&eThat's not encrypted-that's alive.",
    "&eTake your nature egg somewhere with less tech and more sunlight.",
    "&eI work with data. Not bark and bioluminescence.",
    "&eI crack codes, not coconuts.",
    "&eMaybe it has secrets. Maybe it's a mushroom. Either way: not my job."
]

var Encrypted_Egg_Confectioners = [
    "&eI said fudge, not firewalls!",
    "&eThis thing's humming... Is it safe?",
    "&eWhere's the sugar? The joy? The anything remotely edible?",
    "&eI bake cookies, not crash programs.",
    "&eThis egg is judging me. I don't like it.",
    "&eSweetie, I think you've brought me a weapon.",
    "&eThere's no recipe for this. Unless it's disaster.",
    "&eYeah, no. Take that thing back to the lab."
]

var Encrypted_Egg_Botanists = [
    "&eThat shell's not from any forest I've walked.",
    "&eThis thing has firmware. My eggs have petals.",
    "&eThat's not a natural hum. That's machine talk.",
    "&eThe forest didn't make this. Some lab-dwelling madman did.",
    "&eIt's flickering... Why is it flickering?",
    "&eI touch that, and I sprout wi-fi, don't I?",
    "&eFind a tech-head. I work with seeds, not servers.",
    "&eThis isn't a living egg. It's a synthetic riddle."
]

var not_an_egg = [
    "&7...That's not an egg.",
    "&7Unless you're hiding a yolk in there, I can't help you.",
    "&7Nope. Try again—with something round and eggy.",
    "&7I open eggs, not... whatever this is.",
    "&7That item's as useful to me as a screen door on a submarine.",
    "&7Mmm, interesting. Not relevant, though.",
    "&7I don't think that belongs in the egg department.",
    "&7Wrong item, right enthusiasm.",
    "&7Sorry, this thing doesn't have a shell, code, or goo. Can't help.",
    "&7That's not on the seasonal egg list. Not even close.",
    "&7If it doesn't chirp, pulse, or sparkle—it's not my problem.",
    "&7Come back when it's egg-shaped.",
    "&7Looks nice. Useless here.",
    "&7Hmm... Nope. Doesn't qualify as an egg in any universe.",
    "&7I see what you're going for... but that's not it."
]





function regenerate(npc) {
    // move to next eggcracker type
    var current_type = npc.getStoreddata().get("eggcracker_type");
    var current_index = eggcracker_type.indexOf(current_type);
    var next_index = (current_index + 1) % eggcracker_type.length;
    var next_type = eggcracker_type[next_index];
    npc.getDisplay().setName(next_type);
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

    initErrorLines(npc);

    npc.getDisplay().setTitle(title);
    // npc.say("&6&l[&e&lEggcracker&6&l] &eYou have changed the eggcracker type to " + next_type + "!");
    // npc.say("&6&l[&e&lEggcracker&6&l] &eError lines: " + JSON.stringify(error_lines));
    npc.getStoreddata().put("eggcracker_type", next_type);
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

    initErrorLines(npc);
}

function initErrorLines(npc) {
    switch (npc.getStoreddata().get("eggcracker_type")) {
        case "Eggcrack Confectioner":
            error_lines["animania:brown_egg"] = Chromashell_Egg_Confectioners;
            error_lines["animania:peacock_egg_blue"] = Encrypted_Egg_Confectioners;
            break;
        case "Aetheric Botanist":
            error_lines["minecraft:egg"] = Spring_Egg_Botanists;
            error_lines["animania:peacock_egg_blue"] = Encrypted_Egg_Botanists;
            break;
        case "Eggcryption Technician":
            error_lines["minecraft:egg"] = Spring_Egg_Technicians;
            error_lines["animania:brown_egg"] = Chromashell_Egg_Technicians;
            break;
        default:
            break;
    }
}

/**
 * Handles player interaction with the NPC.
 * @aaram {Object} event - The event object containing the player instance.
 */
function interact(event) {
    var npc = event.npc;
    var world = npc.getWorld();

    // get player hand item
    var player = event.player;
    var item = player.getMainhandItem().copy();
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
        npc.executeCommand("/playsound minecraft:entity.villager.yes master @a");
        npc.executeCommand("/playsound " + openning_sound + " master @a");

        var item_lore = item.getLore()
        var eggsize = item_lore[3].split(" ")[1].trim();
        eggsize = eggsize.replace("§l", "").replace("§r§d§o", "");
        // tellPlayer(player, "&aThe egg is " + eggsize + " in size.");
        // var loot_table = genereate_egg_loot(eggcracker_type);

        var loot_pull = Math.max(1, eggsize - 2);
        // tellPlayer(player, "&eYou have " + loot_pull + " loot pulls from loot table " + _LOOTTABLE_CHOCOLATE + ".");
        var pulled_loot = multiplePullLootTable(_LOOTTABLE_CHOCOLATE, player, loot_pull);
        
        // tellPlayer(player, "&eYou pulled " + JSON.stringify(pulled_loot) + " from the loot table.");
        
        for (var i = 0; i < pulled_loot.length; i++) {
            player.giveItem(
                generateItemStackFromLootEntry(pulled_loot[i], world, player)
            );
        }
        // premove egg item from player inventory
        item.setStackSize(item.getStackSize() - 1);
        player.setMainhandItem(item);

    } else {
        // get the error lines
        // tellPlayer(player, "&eYou have given me a " + item_name + "!");
        // tellPlayer(player, "&eError lines: " + JSON.stringify(error_lines));
        if (error_lines.hasOwnProperty(item_name)) {
            var error_line = error_lines[item_name];
            tellRandomMessage(player, error_line);
            npc.executeCommand("/playsound minecraft:entity.villager.no master @a");
        } else {
            tellRandomMessage(player, not_an_egg);
            npc.executeCommand("/playsound minecraft:entity.villager.no master @a");
        }
    }
}
