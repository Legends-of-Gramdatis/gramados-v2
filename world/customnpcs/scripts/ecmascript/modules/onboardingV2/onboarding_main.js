load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_onboarding_v2.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

load('world/customnpcs/scripts/ecmascript/modules/onboardingV2/onboarding_state_hotel.js');

var ONBOARDING_V2_CONFIG_PATH = 'world/customnpcs/scripts/ecmascript/modules/onboardingV2/onboarding_config.json';

function login(event) {
    var player = event.player;
    var config = loadJson(ONBOARDING_V2_CONFIG_PATH);
    if (has_onboarding_v2_data(player)) return;

    if (!player.hasActiveQuest(config.firstQuestId) && !player.hasFinishedQuest(config.firstQuestId)) {
        tellPlayer(player, config.welcomeMessage);
        player.startQuest(config.firstQuestId);
        player.setPosition(config.officePosition.x, config.officePosition.y, config.officePosition.z);
        logToFile('onboarding', 'Player ' + player.getName() + ' started onboarding V2 questline');
    }
    if (!player.hasActiveQuest(config.firstQuestId) && !player.hasFinishedQuest(config.firstQuestId)) return;

    save_onboarding_v2_data(player, {
        name: String(player.getName()),
        uuid: String(player.getUUID())
    });
}

function questTurnIn(event) {
    var config = loadJson(ONBOARDING_V2_CONFIG_PATH);
    if (event.quest.getId() === config.hotelQuestId) {
        onboarding_complete_hotel_quest(event.player);
    }
}
