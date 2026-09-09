// Main Onboarding Controller Script (Per-Player Model)
// This script runs per player: login() on login, chat() on player chat/commands, tick() per-player.
// Phase logic is delegated to phase scripts returning boolean when data changed.
//
// Persistent onboarding state is stored per player UUID. Progress is reloaded from
// that player's file before each processing pass so writes made by commands/debug
// tools in other script contexts cannot be overwritten by stale in-memory state.

// === Loads ===
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_onboarding.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');

// Phase scripts
load('world/customnpcs/scripts/ecmascript/modules/onboarding/onboarding_phase0.js');
load('world/customnpcs/scripts/ecmascript/modules/onboarding/onboarding_phase1.js');
load('world/customnpcs/scripts/ecmascript/modules/onboarding/onboarding_phase2.js');
load('world/customnpcs/scripts/ecmascript/modules/onboarding/onboarding_phase3.js');

// === Constants ===
var ONBOARDING_CONFIG_PATH = 'world/customnpcs/scripts/ecmascript/modules/onboarding/onboarding_config.json';

var onboarding_tick_counter = 0;

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var WORLD = API.getIWorld(0);

// === Script State ===
var _onboarding_cfg = null;

function onboarding_loadConfig() {
    _onboarding_cfg = loadJson(ONBOARDING_CONFIG_PATH) || null;
    if (!_onboarding_cfg) throw 'empty';
}

function onboarding_createPlayerData(player) {
    var initialPhase = onboarding_isBlacklisted(player) ? 3 : 0;
    var pdata = {
        name: player.getName(),
        uuid: onboardingStorage_getPlayerUuid(player),
        created: Date.now(),
        phase: initialPhase
    };

    var logMsg = onboarding_isBlacklisted(player) ? '[p.init.blacklist] ' : '[p.init] ';
    logToFile('onboarding', logMsg + player.getName() + ' entry created with phase ' + initialPhase + '.');
    return pdata;
}

/**
 * Migrates this player's old name-keyed onboarding entry, if present.
 * The legacy shared file is intentionally read-only.
 */
function onboarding_loadLegacyPlayerData(player) {
    var pdata = onboardingStorage_loadLegacyPlayerData(player);
    if (!pdata) return null;

    pdata.name = player.getName();
    pdata.uuid = onboardingStorage_getPlayerUuid(player);
    logToFile('onboarding', '[p.migrate] Migrated legacy onboarding data for ' + player.getName() + ' to UUID storage.');
    return pdata;
}

/**
 * Always reads the player's current UUID file from disk.
 *
 * This is intentionally not cached. Onboarding commands and debug/admin tools run in
 * separate CustomNPCs script contexts and may update the same player's UUID file.
 * Reloading prevents the controller from later saving a stale copy over those writes.
 */
function onboarding_loadPlayerData(player) {
    var pdata = onboardingStorage_loadPlayerData(player, false);

    if (!pdata) {
        pdata = onboarding_loadLegacyPlayerData(player);
        if (!pdata) pdata = onboarding_createPlayerData(player);
        onboarding_savePlayerData(player, pdata);
    }

    // Keep identity metadata current without changing progression state.
    var identityChanged = false;
    var currentName = player.getName();
    var currentUuid = onboardingStorage_getPlayerUuid(player);
    if (pdata.name !== currentName) {
        pdata.name = currentName;
        identityChanged = true;
    }
    if (pdata.uuid !== currentUuid) {
        pdata.uuid = currentUuid;
        identityChanged = true;
    }
    if (identityChanged) onboarding_savePlayerData(player, pdata);

    return pdata;
}

function onboarding_savePlayerData(player, pdata) {
    return onboardingStorage_savePlayerData(player, pdata);
}

function onboarding_getPlayerData(player) {
    return onboarding_loadPlayerData(player);
}

function onboarding_isBetaAllowed(player) {
    if (!_onboarding_cfg) return false;
    if (!_onboarding_cfg.indev) return true; // not indev -> everyone
    var beta = _onboarding_cfg.beta_players || [];
    return includes(beta, player.getName());
}

function onboarding_isBlacklisted(player) {
    if (!_onboarding_cfg) return false;
    var blacklist = _onboarding_cfg.blacklist_players || [];
    return includes(blacklist, player.getName());
}

function onboarding_isModuleEnabled() {
    return _onboarding_cfg && _onboarding_cfg.general && _onboarding_cfg.general.moduleEnabled;
}

// Phase 2 command execution is observed here so timestamps are written in the same
// controller context as progression state. The old CustomServerTools command logger
// is disabled by onboarding_cst_bridge.js.
function onboarding_getPhase2CommandKey(message) {
    if (message === null || typeof message === 'undefined') return null;

    var text = String(message).replace(/^\s+|\s+$/g, '');
    if (!text || text.charAt(0) !== '!') return null;

    var command = text.split(/\s+/)[0].toLowerCase();
    switch (command) {
        case '!mymoney': return 'myMoney';
        case '!deposit': return 'deposit';
        case '!depositall': return 'depositAll';
        case '!withdraw': return 'withdraw';
        default: return null;
    }
}

function onboarding_recordPhase2Command(player, commandKey) {
    if (!player || !commandKey) return false;

    var pdata = onboarding_getPlayerData(player);
    if (!pdata || onboardingStorage_getPhaseNumber(pdata) !== 2) return false;

    if (!pdata.phase2 || typeof pdata.phase2 !== 'object') pdata.phase2 = {};
    if (!pdata.phase2['last ran'] || typeof pdata.phase2['last ran'] !== 'object') {
        pdata.phase2['last ran'] = {};
    }

    var ranAt = Date.now();
    pdata.phase2['last ran'][commandKey] = ranAt;
    onboarding_savePlayerData(player, pdata);
    logToFile('onboarding', '[p2.command] ' + player.getName() + ' ran !' + commandKey + ' at ' + ranAt + '.');
    return true;
}

// === Event Hooks ===
function login(event) {
    onboarding_loadConfig();
    var player = event.player; if (!player) return;
    if (!onboarding_isModuleEnabled()) return;
    if (!onboarding_isBetaAllowed(player)) return;
    if (onboarding_isBlacklisted(player)) return; // Skip init for blacklisted players

    var pdata = onboarding_loadPlayerData(player);
    var changed = false;
    var phaseIdx = onboardingStorage_getPhaseNumber(pdata);
    if (phaseIdx === null) phaseIdx = 0;

    // Skip hint (only for implemented phases; not Phase 0 and not Phase 4+)
    if (phaseIdx >= 1 && phaseIdx <= 4) {
        var phaseCfgN = _onboarding_cfg.phases && _onboarding_cfg.phases['' + phaseIdx];
        if (phaseCfgN && phaseCfgN.enabled) {
            tellPlayer(player, _onboarding_cfg.general.chat.skip_phase_hint);
        }
    }

    if (phaseIdx === 0) {
        var phase0 = _onboarding_cfg.phases && _onboarding_cfg.phases['0'];
        if (phase0 && phase0.enabled) {
            var arrival = phase0.stages && phase0.stages.arrival;
            if (arrival && arrival.dialog && (!pdata.phase0 || !pdata.phase0.completed)) {
                if (!pdata.phase0) {
                    pdata.phase0 = {};
                    changed = true;
                }
                var npcName = arrival.dialog.npc;
                var chatCfg = arrival.dialog.chat || {};
                var templ = chatCfg.onWelcome;
                // Show the Immigrant Office separator title before the welcome message
                var phaseName0 = (phase0 && phase0.name) ? phase0.name : 'Immigrant Office';
                tellSeparatorTitle(player, phaseName0, '&6', '&e');
                tellPlayer(player, templ.replace('{npc}', npcName));
                // Record welcome time to gate Phase 0 reminders (avoid immediate spam)
                if (!pdata.phase0.welcomeTime) {
                    pdata.phase0.welcomeTime = Date.now();
                    changed = true;
                }
                logToFile('onboarding', '[p0.welcome] ' + player.getName() + ' login welcome for ' + npcName);
            }
        }
    }

    if (changed) onboarding_savePlayerData(player, pdata);
}

function chat(event) {
    var player = event.player;
    if (!player) return;

    // login() normally initializes config first, but keep this event safe after script reloads.
    if (!_onboarding_cfg) {
        try { onboarding_loadConfig(); } catch (cfgErr) { return; }
    }
    if (!onboarding_isModuleEnabled()) return;

    var commandKey = onboarding_getPhase2CommandKey(event.message);
    if (!commandKey) return;

    onboarding_recordPhase2Command(player, commandKey);
}

function tick(event) {
    onboarding_tick_counter++;
    if (onboarding_tick_counter < 10) return;
    onboarding_tick_counter = 0;

    if (!_onboarding_cfg) return;
    var player = event.player;
    if (!player) return;
    if (!onboarding_isModuleEnabled()) return;
    // if (!onboarding_isBetaAllowed(player)) return;

    // Reload authoritative state on each processing pass. Do not retain a stale copy.
    var pdata = onboarding_getPlayerData(player);
    if (!pdata) return;

    var changed = false;
    switch (onboardingStorage_getPhaseNumber(pdata)) {
        case 0:
            changed = onboarding_run_phase0(player, pdata, _onboarding_cfg.phases['0'], _onboarding_cfg) || false;
            break;
        case 1:
            changed = onboarding_run_phase1(player, pdata, _onboarding_cfg.phases['1'], _onboarding_cfg) || false;
            break;
        case 2:
            changed = onboarding_run_phase2(player, pdata, _onboarding_cfg.phases['2'], _onboarding_cfg) || false;
            break;
        case 3:
            changed = onboarding_run_phase3(player, pdata, _onboarding_cfg.phases['3'], _onboarding_cfg) || false;
            break;
        default:
            break;
    }

    if (changed) onboarding_savePlayerData(player, pdata);
}
