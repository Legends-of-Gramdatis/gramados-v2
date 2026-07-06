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
