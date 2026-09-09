// Single-use Admin Tool: Reset onboarding to start of Phase 3
// Attach to a CustomNPCs scripted item. On right-click, resets the invoking
// player's UUID-backed onboarding progress to Phase 3, Stage 1, Step 1 and bypasses
// the Phase 2 -> Phase 3 long-delay gate for immediate testing.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_onboarding.js');

function interact(event) {
    var player = event.player;
    if (!player) return;

    var now = Date.now();
    var pdata = onboardingStorage_loadPlayerData(player, true);
    if (!pdata) {
        pdata = {
            name: player.getName(),
            uuid: onboardingStorage_getPlayerUuid(player),
            created: now
        };
    }

    pdata.phase = 3;
    pdata.phase3 = {
        currentStage: 1,
        currentStep: 1,
        _gateP2DelayChecked: true
    };
    pdata._debugLastResetToP3 = now;

    onboardingStorage_savePlayerData(player, pdata);

    tellPlayer(player, '&a:check_mark: Onboarding reset: &ePhase 3 &7(Stage 1, Step 1).');
    logToFile('onboarding', '[admin.reset.p3] ' + player.getName() + ' reset UUID onboarding to Phase 3 Stage1 Step1 (gate bypass).');
}

function getTooltip(event) {
    event.add('&6Reset Onboarding ➜ Phase 3');
    event.add('&7Right-click to reset yourself to Phase 3 start.');
}
