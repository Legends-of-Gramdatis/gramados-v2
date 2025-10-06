// Onboarding Reset Debug Tool
// Attach this script to a custom NPCs scripted item. When used (right-click),
// it wipes the player's onboarding stored data and removes the dialog token so they can re-run Phase 0.
// Safety: only works for OP/beta players when indev is enabled, to avoid abuse.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
// Do NOT load onboarding_main.js here (it contains init/tick event handlers and side effects).
// We'll manually read the config/data JSON files to avoid executing those hooks.
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js'); // for includes()

// Local path constants (mirrors onboarding_main.js values)
var ONBOARDING_CONFIG_PATH = 'world/customnpcs/scripts/ecmascript/modules_unfinished/onboarding/onboarding_config.json';
var ONBOARDING_DATA_PATH   = 'world/customnpcs/scripts/data_auto/onboarding_data.json';
var _onboarding_cfg = null;

function interact(e) {
    var player = e.player;
    if (!player) return;
    // Ensure config loaded (local, no side-effects from main script)
    if (_onboarding_cfg === null) { _onboarding_cfg = loadJson(ONBOARDING_CONFIG_PATH); }

    var cfg = _onboarding_cfg;
    if (!cfg) { tellPlayer(player, '&cOnboarding config missing.'); return; }

    // Permission gate: if indev -> require beta player; else allow OP only
    var allowed = true;
    if (cfg.indev) {
        var beta = cfg.beta_players || [];
        allowed = includes(beta, player.getName());
    }
    // Quick OP heuristic: presence in ops.json (reuse existing function would be ideal; fallback simple load)
    if (!allowed) {
        try {
            var ops = loadJson('ops.json') || [];
            for (var i=0;i<ops.length;i++){ if(ops[i] && ops[i].name === player.getName()) { allowed = true; break; } }
        } catch (e2) {}
    }
    if (!allowed) {
        tellPlayer(player, '&cYou are not permitted to use this debug tool.');
        return;
    }

    var dialogId = null;
    try { dialogId = cfg.phases && cfg.phases['0'] && cfg.phases['0'].stages && cfg.phases['0'].stages.arrival && cfg.phases['0'].stages.arrival.dialog && cfg.phases['0'].stages.arrival.dialog.id; } catch (ex) {}
    if (dialogId !== null && typeof dialogId !== 'undefined') {
        try { if (typeof dialogId === 'string' && dialogId.match(/^\d+$/)) { dialogId = parseInt(dialogId,10); } } catch (cidErr) {}
        try { player.removeDialog(dialogId); } catch (rdErr) { logToFile('onboarding', '[reset-tool] removeDialog failed: ' + rdErr); }
    }

    // Remove player onboarding entry
    try {
        var dataJson = loadJson(ONBOARDING_DATA_PATH) || {};
        if (dataJson[player.getName()]) {
            delete dataJson[player.getName()];
            saveJson(dataJson, ONBOARDING_DATA_PATH);
        }
    } catch (dataErr) {
        tellPlayer(player, '&cData reset failed: ' + dataErr);
        logToFile('onboarding', '[reset-tool] data wipe error for ' + player.getName() + ': ' + dataErr);
        return;
    }

    // Clear session cache if present
    if (typeof _onboarding_sessionWelcomeShown !== 'undefined' && _onboarding_sessionWelcomeShown[player.getName()]) {
        delete _onboarding_sessionWelcomeShown[player.getName()];
    }

    tellPlayer(player, '&e:recycle: Onboarding progress reset. Re-log or re-enter area to restart Phase 0.');
    logToFile('onboarding', '[reset-tool] ' + player.getName() + ' onboarding reset executed.');
}

function getTooltip(e) {
    // Adds a small hint on item hover
    e.add('&6Onboarding Reset Tool');
    e.add('&7Right-click to reset your onboarding progress.');
}
