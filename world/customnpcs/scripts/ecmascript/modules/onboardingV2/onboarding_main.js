load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_onboarding_v2.js');

var ONBOARDING_V2_CONFIG_PATH = 'world/customnpcs/scripts/ecmascript/modules/onboardingV2/onboarding_config.json';

function login(event) {
    var player = event.player;
    var config = loadJson(ONBOARDING_V2_CONFIG_PATH);
    if (!config || config.players.indexOf(String(player.getName())) === -1) return;
    if (has_onboarding_v2_data(player)) return;

    if (!player.hasActiveQuest(config.firstQuestId) && !player.hasFinishedQuest(config.firstQuestId)) {
        player.startQuest(config.firstQuestId);
    }
    if (!player.hasActiveQuest(config.firstQuestId) && !player.hasFinishedQuest(config.firstQuestId)) return;

    save_onboarding_v2_data(player, {
        name: String(player.getName()),
        uuid: String(player.getUUID())
    });
}
