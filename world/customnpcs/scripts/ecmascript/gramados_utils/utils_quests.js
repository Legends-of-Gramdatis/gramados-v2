load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

var GAMEPLAY_QUESTS_CONFIG_PATH = 'world/customnpcs/scripts/data/gameplay_quests.json';

function complete_quest_objectives(player, questId) {
    var quests = player.getActiveQuests();

    for (var i = 0; i < quests.length; i++) {
        if (quests[i].getId() !== questId) continue;

        var objectives = quests[i].getObjectives(player);

        for (var j = 0; j < objectives.length; j++) {
            objectives[j].setProgress(objectives[j].getMaxProgress());
        }

        return true;
    }

    return false;
}

function complete_gameplay_quest(player, action) {
    var config = loadJson(GAMEPLAY_QUESTS_CONFIG_PATH);
    var questIds = config[action];

    if (!questIds) return;

    for (var i = 0; i < questIds.length; i++) {
        complete_quest_objectives(player, questIds[i]);
    }
}
