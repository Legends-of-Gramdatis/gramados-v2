// Onboarding Reset Debug Tool
// Attach this script to a CustomNPCs scripted item. When used (right-click),
// it resets the player's UUID-backed onboarding state and removes the dialog token so
// they can re-run Phase 0.
// Safety: only works for beta players while indev is enabled, or OPs.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_onboarding.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
// Do NOT load onboarding_main.js here (it contains login/tick event handlers and side effects).
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js'); // for includes()
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js'); // region helpers

var ONBOARDING_RESET_CONFIG_PATH = 'world/customnpcs/scripts/ecmascript/modules/onboarding/onboarding_config.json';
var _onboarding_reset_cfg = null;

function onboardingReset_isOp(player) {
    try {
        var ops = loadJson('ops.json') || [];
        for (var i = 0; i < ops.length; i++) {
            if (ops[i] && ops[i].name === player.getName()) return true;
        }
    } catch (e) {}
    return false;
}

function interact(e) {
    var player = e.player;
    if (!player) return;

    if (_onboarding_reset_cfg === null) {
        _onboarding_reset_cfg = loadJson(ONBOARDING_RESET_CONFIG_PATH);
    }

    var cfg = _onboarding_reset_cfg;
    if (!cfg) {
        tellPlayer(player, '&cOnboarding config missing.');
        return;
    }

    // During indev, beta players and OPs may use the tool. Outside indev, OP only.
    var isOp = onboardingReset_isOp(player);
    var beta = cfg.beta_players || [];
    var isBeta = includes(beta, player.getName());
    var allowed = cfg.indev ? (isBeta || isOp) : isOp;
    if (!allowed) {
        tellPlayer(player, '&cYou are not permitted to use this debug tool.');
        return;
    }

    var dialogId = null;
    try {
        dialogId = cfg.phases && cfg.phases['0'] && cfg.phases['0'].stages &&
            cfg.phases['0'].stages.arrival && cfg.phases['0'].stages.arrival.dialog &&
            cfg.phases['0'].stages.arrival.dialog.id;
    } catch (ex) {}

    if (dialogId !== null && typeof dialogId !== 'undefined') {
        try {
            if (typeof dialogId === 'string' && dialogId.match(/^\d+$/)) dialogId = parseInt(dialogId, 10);
        } catch (cidErr) {}
        try {
            player.removeDialog(dialogId);
        } catch (rdErr) {
            logToFile('onboarding', '[reset-tool] removeDialog failed: ' + rdErr);
        }
    }

    // Do not delete the UUID file. Deleting it would allow the controller to migrate
    // an old legacy name-keyed entry again on the next login. Overwrite it with a
    // fresh Phase 0 record so this reset is authoritative.
    try {
        var now = Date.now();
        var freshData = {
            name: player.getName(),
            uuid: onboardingStorage_getPlayerUuid(player),
            created: now,
            phase: 0,
            _debugLastFullReset: now
        };
        onboardingStorage_savePlayerData(player, freshData);
    } catch (dataErr) {
        tellPlayer(player, '&cData reset failed: ' + dataErr);
        logToFile('onboarding', '[reset-tool] data reset error for ' + player.getName() + ': ' + dataErr);
        return;
    }

    // Remove player from any Starter Hotel room ownerships to avoid duplicates during testing.
    try {
        var regions = getStarterHotelRegions(); // [{name,data}]
        var worldData = getWorldData();
        var removed = 0;
        var pname = player.getName();
        for (var i = 0; i < regions.length; i++) {
            var r = regions[i];
            var key = 'region_' + r.name;
            var dataStr = worldData.get(key);
            if (!dataStr) continue;
            var data;
            try { data = JSON.parse(dataStr); } catch (e3) { continue; }
            var owner = data.owner || data.ownerName || (data.meta && data.meta.owner) || null;
            if (owner && String(owner) === String(pname)) {
                data.owner = null;
                if (data.ownerName) data.ownerName = null;
                if (data.meta && data.meta.owner) data.meta.owner = null;
                worldData.put(key, JSON.stringify(data));
                try { updateRegionOwnerSigns(r.name); } catch (e4) {}
                removed++;
            }
        }
        if (removed > 0) {
            tellPlayer(player, '&eRemoved your ownership from &6' + removed + ' &eStarter Hotel room(s).');
            logToFile('onboarding', '[reset-tool] ' + pname + ' ownership cleared from ' + removed + ' Starter Hotel rooms.');
        } else {
            tellPlayer(player, '&7No Starter Hotel rooms owned by you were found to clear.');
        }
    } catch (rmErr) {
        logToFile('onboarding', '[reset-tool-error] clear starter rooms failed for ' + player.getName() + ': ' + rmErr);
    }

    tellPlayer(player, '&e:recycle: Onboarding progress reset. Re-log to restart Phase 0.');
    logToFile('onboarding', '[reset-tool] ' + player.getName() + ' UUID onboarding reset executed.');
}

function getTooltip(e) {
    e.add('&6Onboarding Reset Tool');
    e.add('&7Right-click to reset your onboarding progress.');
}
