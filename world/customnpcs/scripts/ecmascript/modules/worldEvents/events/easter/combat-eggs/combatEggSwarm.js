load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load("world/customnpcs/scripts/ecmascript/modules/worldEvents/worldEventUtils.js");

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var EVENT_DATA_JSON = "world/customnpcs/scripts/ecmascript/modules/worldEvents/events/easter/easterBossFight.json";

var EGG_SKINS = [6, 16, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
var EGG_SKIN_URL = "https://legends-of-gramdatis.com/gramados_skins/easter_eggs/easter_egg_";
var EGG_SKIN_EXT = ".png";

/**
 * Customizes a mini-egg NPC with random size and skin.
 * @param {Object} event - The event object containing the NPC instance.
 */
function init(event) {
    var npc = event.npc;
    // Set random size between 3 and 5
    var randomSize = Math.floor(Math.random() * (5 - 3 + 1)) + 3;
    npc.getDisplay().setSize(randomSize);

    // Set random skin
    var randomSkin = EGG_SKINS[Math.floor(Math.random() * EGG_SKINS.length)];
    var skinUrl = EGG_SKIN_URL + randomSkin + EGG_SKIN_EXT;
    npc.getDisplay().setSkinUrl(skinUrl);

    // Set name and behavior
    npc.getDisplay().setName("Scrambler");
}

/**
 * Handles the timer event for despawning eggs.
 * @param {Object} event - The event object containing the NPC instance.
 */
function tick(event) {
    var npc = event.npc;
    var bossFightData = loadJson(EVENT_DATA_JSON);
    if (!bossFightData.isAttacking) {
        npc.despawn();
    }
}
