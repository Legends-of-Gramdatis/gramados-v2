load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

var ONBOARDING_V2_DATA_DIR = 'world/customnpcs/scripts/data_auto/onboardingV2';

function onboarding_v2_data_path(player) {
    return ONBOARDING_V2_DATA_DIR + '/' + player.getUUID() + '.json';
}

function has_onboarding_v2_data(player) {
    return checkFileExists(onboarding_v2_data_path(player));
}

function load_onboarding_v2_data(player) {
    if (!has_onboarding_v2_data(player)) return null;
    return loadJson(onboarding_v2_data_path(player));
}

function save_onboarding_v2_data(player, data) {
    new java.io.File(ONBOARDING_V2_DATA_DIR).mkdirs();
    saveJson(data, onboarding_v2_data_path(player));
}
