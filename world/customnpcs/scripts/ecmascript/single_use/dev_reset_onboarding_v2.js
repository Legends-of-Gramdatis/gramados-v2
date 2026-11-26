load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_onboarding_v2.js');

function interact(event) {
    var player = event.player;
    var file = new java.io.File(onboarding_v2_data_path(player));
    if (file.exists() && !file.delete()) {
        player.message('Could not reset onboarding V2 data.');
        return;
    }
    player.message('Onboarding V2 data reset. Reset the onboarding quest category and reconnect.');
}
