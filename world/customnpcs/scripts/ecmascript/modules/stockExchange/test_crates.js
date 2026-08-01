// Load utility modules
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_emotes.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_modifiers.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_containers.js");

var CONTAINERS_CONFIG = "world/customnpcs/scripts/data/containers.json";


function interact(event) {
    var npc = event.npc;
    var world = npc.getWorld();
    var player = event.player;
    var mainhand = player.getMainhandItem();

    if (isContainerItem(mainhand)) {
        tellPlayer(player,"&eThis looks like a " + getContainerDisplayName(mainhand) + ". Let's see what you have inside...");
    } else {
        tellPlayer(player,"&cYou need to hold a container in your hand to check its contents.");
    }
}