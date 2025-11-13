// Single-use Admin Tool: Reset onboarding to start of Phase 3
// Attach to a CustomNPCs scripted item. On right-click, resets the invoking
// player's onboarding progress to Phase 3, Stage 1, Step 1 and bypasses the
// Phase 2 -> Phase 3 long-delay gate for immediate testing.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

var ONBOARDING_DATA_PATH = 'world/customnpcs/scripts/data_auto/onboarding_data.json';

function interact(event) {
    var player = event.player; if (!player) return;
    var name = player.getName();

    var data = loadJson(ONBOARDING_DATA_PATH) || {};
    var existed = !!data[name];
    var now = Date.now();

    if (!data[name]) data[name] = { created: now };
    var pdata = data[name];

    // Reset to Phase 3 start
    pdata.phase = 3;
    // Overwrite phase3 object to ensure clean start
    pdata.phase3 = {
        currentStage: 1,
        currentStep: 1,
        _gateP2DelayChecked: true // bypass long-delay gate for debug
    };

    // Optional: record marker for audit/debugging
    pdata._debugLastResetToP3 = now;

    saveJson(data, ONBOARDING_DATA_PATH);

    tellPlayer(player, '&a:check_mark: Onboarding reset: &ePhase 3 &7(Stage 1, Step 1).');
    logToFile('onboarding', '[admin.reset.p3] ' + name + ' reset to Phase 3 Stage1 Step1 (gate bypass).');
}

function getTooltip(event){
    event.add('&6Reset Onboarding ➜ Phase 3');
    event.add('&7Right-click to reset yourself to Phase 3 start.');
}
