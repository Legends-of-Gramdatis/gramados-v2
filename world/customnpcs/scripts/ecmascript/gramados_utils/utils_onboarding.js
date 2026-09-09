// Shared onboarding persistence helpers.
//
// Authoritative onboarding state is stored one file per player UUID under
// data_auto/onboarding/. The old name-keyed onboarding_data.json is read-only and
// exists only as a migration fallback for players who have not yet received a UUID
// file. New code must never write to the legacy shared file.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

var ONBOARDING_STORAGE_DATA_DIR = 'world/customnpcs/scripts/data_auto/onboarding';
var ONBOARDING_STORAGE_LEGACY_DATA_PATH = 'world/customnpcs/scripts/data_auto/onboarding_data.json';

function onboardingStorage_ensureDataDir() {
    var dir = new java.io.File(ONBOARDING_STORAGE_DATA_DIR);
    if (!dir.exists()) dir.mkdirs();
}

function onboardingStorage_getPlayerUuid(player) {
    if (!player) return null;
    return String(player.getUUID());
}

function onboardingStorage_getPlayerDataPath(player) {
    var uuid = onboardingStorage_getPlayerUuid(player);
    if (!uuid) return null;
    return ONBOARDING_STORAGE_DATA_DIR + '/' + uuid + '.json';
}

/**
 * Reads the old name-keyed entry without modifying the legacy file.
 * This is only a compatibility fallback for players not yet migrated.
 */
function onboardingStorage_loadLegacyPlayerData(player) {
    if (!player || !checkFileExists(ONBOARDING_STORAGE_LEGACY_DATA_PATH)) return null;

    var legacy = loadJson(ONBOARDING_STORAGE_LEGACY_DATA_PATH);
    if (!legacy) return null;

    var pdata = legacy[player.getName()];
    return pdata || null;
}

/**
 * Loads authoritative UUID-backed onboarding state.
 * If allowLegacyFallback is true and no UUID file exists, the old name-keyed entry
 * may be returned read-only. Callers that intend to persist it should use
 * onboardingStorage_savePlayerData(), which always writes the UUID file.
 */
function onboardingStorage_loadPlayerData(player, allowLegacyFallback) {
    if (!player) return null;
    onboardingStorage_ensureDataDir();

    var path = onboardingStorage_getPlayerDataPath(player);
    if (path && checkFileExists(path)) {
        var pdata = loadJson(path);
        if (pdata) return pdata;
    }

    if (allowLegacyFallback) {
        return onboardingStorage_loadLegacyPlayerData(player);
    }
    return null;
}

function onboardingStorage_savePlayerData(player, pdata) {
    if (!player || !pdata) return false;
    onboardingStorage_ensureDataDir();

    pdata.name = player.getName();
    pdata.uuid = onboardingStorage_getPlayerUuid(player);
    saveJson(pdata, onboardingStorage_getPlayerDataPath(player));
    return true;
}

function onboardingStorage_deletePlayerData(player) {
    if (!player) return false;
    var path = onboardingStorage_getPlayerDataPath(player);
    if (!path) return false;

    var file = new java.io.File(path);
    if (!file.exists()) return true;
    return file['delete']();
}

function onboardingStorage_getPhaseNumber(pdata) {
    if (!pdata) return null;
    var phase = (typeof pdata.phase === 'number') ? pdata.phase : parseInt(pdata.phase, 10);
    return isNaN(phase) ? null : phase;
}

/**
 * Compatibility helper for legacy CustomServerTools UI gates.
 *
 * stageKey supports both forms currently used by the server:
 * - a number: completed once currentStage is greater than that number;
 * - a field name such as "s3b_completed": completed when that phase flag is truthy.
 */
function onboardingStorage_hasAdvancement(player, phaseKey, stageKey) {
    var pdata = onboardingStorage_loadPlayerData(player, true);
    if (!pdata) return false;

    var wantedPhase = (typeof phaseKey === 'number') ? phaseKey : parseInt(phaseKey, 10);
    if (isNaN(wantedPhase)) return false;

    var currentPhase = onboardingStorage_getPhaseNumber(pdata);
    if (currentPhase === null) return false;
    if (currentPhase > wantedPhase) return true;
    if (currentPhase < wantedPhase) return false;

    var phaseData = pdata['phase' + wantedPhase];
    if (!phaseData || typeof phaseData !== 'object') return false;

    if (typeof stageKey === 'undefined' || stageKey === null) return true;

    var numericStage = null;
    if (typeof stageKey === 'number') {
        numericStage = stageKey;
    } else if (String(stageKey).match(/^\d+$/)) {
        numericStage = parseInt(stageKey, 10);
    }

    if (numericStage !== null) {
        var currentStage = (typeof phaseData.currentStage === 'number')
            ? phaseData.currentStage
            : parseInt(phaseData.currentStage, 10);
        return !isNaN(currentStage) && currentStage > numericStage;
    }

    return !!phaseData[String(stageKey)];
}
