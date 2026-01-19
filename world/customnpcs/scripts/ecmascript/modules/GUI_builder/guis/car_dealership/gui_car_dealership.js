load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');

function guiButtons(event, buttonId, pageId) {
    switch (pageId) {
        case 1:
            switch (buttonId) {
                // case 4:
                //     // Do something
                //     break;
                // case 6:
                //     // Do something
                //     break;
                // case 7:
                //     // Do something
                //     break;
                // case 8:
                //     // Do something
                //     break;
            }
            break;
        case 2:
            switch (buttonId) {
                // case 12:
                //     // Do something
                //     break;
                // case 13:
                //     // Do something
                //     break;
            }
            break;
    }
}

function  guiBuilder_updateManifest(event, manifest) {
    // Modify the manifest as needed before building the GUI
    // For example, if you want to make a locked button unlocked due to some conditions.
    var player = event.player;
    if (!player) return manifest;
    tellPlayer(player, "Your nickname is: " + player.getDisplayName());
    if (playerHasJobWithTag(player, "Mechanic")) {
        manifest.pages[0].components[4].locked = false;
    }
    if (getMoneyInPouch(player) >= 1000000) {
        manifest.pages[1].components[3].locked = false;
    }
    return manifest;
}