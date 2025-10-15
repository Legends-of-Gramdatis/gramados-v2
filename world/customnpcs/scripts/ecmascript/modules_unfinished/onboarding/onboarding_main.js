// Main Onboarding Controller Script (Per-Player Model)
// This script runs per player: init() on login, tick() per-player.
// Phase logic is delegated to phase scripts returning boolean when data changed.

// === Loads ===
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');

// Phase scripts
load('world/customnpcs/scripts/ecmascript/modules_unfinished/onboarding/onboarding_phase0.js');
load('world/customnpcs/scripts/ecmascript/modules_unfinished/onboarding/onboarding_phase1.js');

// === Constants ===
var ONBOARDING_CONFIG_PATH = 'world/customnpcs/scripts/ecmascript/modules_unfinished/onboarding/onboarding_config.json';
var ONBOARDING_DATA_PATH   = 'world/customnpcs/scripts/data_auto/onboarding_data.json';

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var WORLD = API.getIWorld(0);

// === In-Memory State (per-script instance) ===
var _onboarding_cfg = null;          // Config JSON
var _onboarding_players = {};        // All players onboarding data
var _onboarding_current_pdata = null;// Convenience ref for current player

function onboarding_loadConfig() {
    try {
        _onboarding_cfg = loadJson(ONBOARDING_CONFIG_PATH) || null;
        if (!_onboarding_cfg) throw 'empty';
    } catch (e) {
        _onboarding_cfg = { indev: true, beta_players: [], general: { moduleEnabled: true }, phases: {} };
        logToFile('onboarding', '[error] fallback config loaded: ' + e);
    }
}

function onboarding_loadData() {
    try { _onboarding_players = loadJson(ONBOARDING_DATA_PATH) || {}; } catch (e) { _onboarding_players = {}; }
}

function onboarding_getPlayerData(player) {
    var n = player.getName();
    if (!_onboarding_players[n]) {
        _onboarding_players[n] = { created: Date.now(), phase: 0 };
        logToFile('onboarding', '[init-player] ' + n + ' entry created.');
        saveJson(_onboarding_players, ONBOARDING_DATA_PATH);
    }
    _onboarding_current_pdata = _onboarding_players[n];
    return _onboarding_current_pdata;
}

function onboarding_isBetaAllowed(player) {
    if (!_onboarding_cfg) return false;
    if (!_onboarding_cfg.indev) return true; // not indev -> everyone
    var beta = _onboarding_cfg.beta_players || [];
    return includes(beta, player.getName());
}

function onboarding_isModuleEnabled() {
    return _onboarding_cfg && _onboarding_cfg.general && _onboarding_cfg.general.moduleEnabled;
}

// === Event Hooks ===
function init(event) {
    onboarding_loadConfig();
    onboarding_loadData();
    var player = event.player; if (!player) return;
    if (!onboarding_isModuleEnabled()) return;
    if (!onboarding_isBetaAllowed(player)) return;
    var pdata = onboarding_getPlayerData(player);
    var phaseIdx = pdata.phase || 0;
    if (phaseIdx === 0) {
        var phase0 = _onboarding_cfg.phases && _onboarding_cfg.phases['0'];
        if (phase0 && phase0.enabled) {
            var arrival = phase0.stages && phase0.stages.arrival;
            if (arrival && arrival.dialog && (!pdata.phase0 || !pdata.phase0.completed)) {
                if (!pdata.phase0) pdata.phase0 = {};
                var npcName = arrival.dialog.npc;
                var chatCfg = arrival.dialog.chat || {};
                var templ = chatCfg.onWelcome || '&bWelcome! Please speak with {npc}.';
                var npcFormatted = '&6&l' + npcName + '&r&b';
                tellPlayer(player, templ.replace('{npc}', npcFormatted));
                // Record welcome time to gate Phase 0 reminders (avoid immediate spam)
                if (!pdata.phase0) pdata.phase0 = {};
                if (!pdata.phase0.welcomeTime) {
                    pdata.phase0.welcomeTime = Date.now();
                }
                logToFile('onboarding', '[welcome] ' + player.getName() + ' login welcome for ' + npcName);
            }
        }
    }
}

function tick(event) {
    if (!_onboarding_cfg) return;
    var player = event.player; if (!player) return;
    if (!onboarding_isModuleEnabled()) return;
    if (!onboarding_isBetaAllowed(player)) return;
    var pdata = onboarding_getPlayerData(player);
    var changed = false;
    switch (pdata.phase) {
        case 0:
            changed = onboarding_run_phase0(player, pdata, _onboarding_cfg.phases['0'], _onboarding_cfg) || false;
            break;
        case 1:
            changed = onboarding_run_phase1(player, pdata, _onboarding_cfg.phases['1'], _onboarding_cfg, _onboarding_players) || false;
            break;
        default:
            break;
    }
    if (changed) saveJson(_onboarding_players, ONBOARDING_DATA_PATH);
}
