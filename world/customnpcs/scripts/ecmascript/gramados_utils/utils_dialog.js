load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

var TOTAL_DIALOGS = 1000;

function unread_all_dialogs(player) {
    for (var i = 0; i < TOTAL_DIALOGS; i++) {
        if (player.hasReadDialog(i)) {
            player.removeDialog(i);
        }
    }
}

function unread_dialog_from_category(player, category) {
    // world/customnpcs/dialogs/<category>/
    var dialogPath = "world/customnpcs/dialogs/" + category + "/";
    var dialogFiles = readDir(dialogPath);
    var deletedDialogs = 0;
    // a Dialog file is <id>.json, so we need to extract the id from the filename
    for (var i = 0; i < dialogFiles.length; i++) {
        var dialogFile = dialogFiles[i];
        var dialogId = parseInt(dialogFile.split("/").pop().split(".")[0]);
        if (!isNaN(dialogId) && player.hasReadDialog(dialogId)) {
            player.removeDialog(dialogId);
            deletedDialogs++;
        }
    }
    return deletedDialogs;
}

function undo_quest_from_category(player, category) {
    // world/customnpcs/quests/<category>/
    var questsPath = "world/customnpcs/quests/" + category + "/";
    var questsFiles = readDir(questsPath);
    var deletedQuests = 0;
    // a Quest file is <id>.json, so we need to extract the id from the filename
    for (var i = 0; i < questsFiles.length; i++) {
        var questFile = questsFiles[i];
        var questId = parseInt(questFile.split("/").pop().split(".")[0]);
        if (!isNaN(questId) && player.hasFinishedQuest(questId)) {
            player.removeQuest(questId);
            deletedQuests++;
        }
    }
    return deletedQuests;
}
