// CustomServerTools -> UUID onboarding compatibility bridge.
//
// This file MUST be loaded after CustomServerTools.js in the same ScriptList entry.
// CustomServerTools still contains legacy onboarding helpers that read/write the old
// shared onboarding_data.json. Reassign those helpers here so every live caller uses
// the per-UUID storage model instead.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_onboarding.js');

var ONBOARDING_BRIDGE_CONFIG_PATH = 'world/customnpcs/scripts/ecmascript/modules/onboarding/onboarding_config.json';

// Phase 2 command timestamps are now recorded by onboarding_main.js in the same
// script context that owns progression state. Leaving the old CST logger active would
// write to the legacy shared file and reintroduce the race fixed by UUID storage.
cst_onboarding_log_command = function (player, cmdKey) {
    return;
};

// Used by !myMoney UI unlocks and the navigation bar.
// Supports both numeric stage thresholds and named completion flags.
checkOnboardingAdvancement = function (player, phaseKey, stageKey) {
    try {
        return onboardingStorage_hasAdvancement(player, phaseKey, stageKey);
    } catch (e) {
        return false;
    }
};

// Tutorial skip helper using authoritative UUID-backed state.
cst_onboarding_skipTutorialPhase = function (player) {
    if (!player) return false;

    try {
        var cfg = loadJson(ONBOARDING_BRIDGE_CONFIG_PATH);
        if (!cfg) {
            tellPlayer(player, '&cOnboarding config is missing or invalid.');
            return false;
        }

        // UUID file first; legacy name-keyed data is accepted only as a one-time
        // read fallback and is persisted to UUID storage by the save below.
        var entry = onboardingStorage_loadPlayerData(player, true);
        if (!entry) {
            tellPlayer(player, '&cNo onboarding entry found for you.');
            return false;
        }

        var curPhase = onboardingStorage_getPhaseNumber(entry);
        if (curPhase === null) curPhase = 0;

        if (curPhase < 1) {
            tellPlayer(player, '&cYou cannot skip Phase 0.');
            return false;
        }

        var phasesObj = cfg.phases || {};
        var nextPhase = null;
        for (var i = curPhase + 1; i < 100; i++) {
            var pcfg = phasesObj['' + i];
            if (pcfg && pcfg.enabled) {
                nextPhase = i;
                break;
            }
        }

        if (nextPhase === null) {
            tellPlayer(player, '&eThere is no next onboarding phase to skip to.');
            return false;
        }

        var now = Date.now();
        var longDelayMs = (cfg.general && typeof cfg.general.generic_streamline_delay_long === 'number')
            ? cfg.general.generic_streamline_delay_long * 1000
            : 0;
        var bypassTs = now - longDelayMs - 1000;

        // Preserve the original skip behaviour: advance timestamp-based gates so the
        // next phase can start immediately instead of waiting on a skipped phase.
        if (curPhase === 1 && nextPhase === 2) {
            if (!entry.phase1 || typeof entry.phase1 !== 'object') entry.phase1 = {};
            entry.phase1.s4_completedTime = bypassTs;
        }

        if (nextPhase === 3) {
            if (!entry.phase2 || typeof entry.phase2 !== 'object') entry.phase2 = {};
            entry.phase2.s5_completedTime = bypassTs;

            if (!entry.phase3 || typeof entry.phase3 !== 'object') entry.phase3 = {};
            entry.phase3._gateP2DelayChecked = true;
            entry.phase3.s1_availableAt = now - 1;
            entry.phase3.currentStage = 1;
            entry.phase3.currentStep = 1;
        }

        entry.phase = nextPhase;
        entry._tutorialSkipLast = now;
        onboardingStorage_savePlayerData(player, entry);

        var nextName = (phasesObj['' + nextPhase] && phasesObj['' + nextPhase].name)
            ? phasesObj['' + nextPhase].name
            : ('Phase ' + nextPhase);
        tellPlayer(player, '&a:check_mark: Tutorial phase skipped. Next: &e' + nextName + '&a.');
        logToFile('onboarding', '[tutorial.skip] ' + player.getName() + ' skipped Phase ' + curPhase + ' -> ' + nextPhase + '.');
        return true;
    } catch (e) {
        tellPlayer(player, '&cException in tutorial skip: ' + (e.message || e));
        logToFile('onboarding', '[tutorial.skip.error] ' + player.getName() + ' ' + e);
        return false;
    }
};
