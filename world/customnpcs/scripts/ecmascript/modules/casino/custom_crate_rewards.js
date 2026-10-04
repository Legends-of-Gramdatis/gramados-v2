load('world/customnpcs/scripts/ecmascript/modules/casino/emote_crate.js');

function prepareCasinoCustomCrateReward(rewardHandler, player) {
    switch (rewardHandler) {
        case 'emotes':
            return {
                type: 'emote',
                rewards: prepareCasinoEmoteCrateReward(player)
            };
        default:
            throw new Error('Unknown casino crate reward handler: ' + rewardHandler);
    }
}

function grantCasinoCustomCrateReward(prepared, player) {
    switch (prepared.type) {
        case 'emote':
            grantCasinoEmoteCrateReward(player, prepared.rewards);
            return;
        default:
            throw new Error('Unknown prepared casino crate reward type: ' + prepared.type);
    }
}
