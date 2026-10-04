load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_emotes.js');

var CASINO_EMOTE_CRATE_CONFIG =
    'world/customnpcs/scripts/ecmascript/modules/casino/emote_crate_config.json';

function loadCasinoEmoteCrateConfig() {
    return loadJson(CASINO_EMOTE_CRATE_CONFIG);
}

function getCasinoEmoteCrateAvailableEmotes(player) {
    return getPlayerMissingEmotes(
        player,
        loadCasinoEmoteCrateConfig().emotes
    );
}

function shuffleCasinoEmotePool(emotes) {
    var shuffled = emotes.slice();

    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = tmp;
    }

    return shuffled;
}

function prepareCasinoEmoteCrateReward(player) {
    var config = loadCasinoEmoteCrateConfig();
    var available = getPlayerMissingEmotes(player, config.emotes);
    var shuffled = shuffleCasinoEmotePool(available);
    var count = Math.min(Number(config.emotes_per_open), shuffled.length);

    return shuffled.slice(0, count);
}

function grantCasinoEmoteCrateReward(player, emotes) {
    var granted = grantEmotes(player, emotes);

    if (granted !== emotes.length) {
        throw new Error(
            'Emote crate prepared ' + emotes.length +
            ' emote(s) but only granted ' + granted + '.'
        );
    }
}
