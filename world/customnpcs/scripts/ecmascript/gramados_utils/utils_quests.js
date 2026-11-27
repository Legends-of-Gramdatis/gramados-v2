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
