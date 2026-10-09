load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_dynmap.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

function prepareCasinoRandomTripCrateReward() {
    var possible_sets = [
        ['Historical Sites', 64],
        ['Parks And Gardens', 33],
        ['Restaurants', 25],
        ['Town Halls', 24],
        ['Hotels', 12],
        ['Entertainment & Leisure', 7],
        ['Open Air Markets', 6],
        ['Education & Culture', 6],
        ['Bars', 4],
        ['Government Buildings', 2],
    ]
    var setName = pickchance(possible_sets, 1);
    var marker = getRandomMarkerData(setName);
    var name = marker.label.replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    return {
        type: 'trip',
        rewards: [setName + ': ' + name + ' (' + marker.x + ', ' + marker.y + ', ' + marker.z + ')'],
        destination: marker,
        destinationName: name
    };
}

function grantCasinoRandomTripCrateReward(player, prepared) {
    var marker = prepared.destination;
    player.setPosition(marker.x, marker.y, marker.z);
    tellPlayer(player, '&bYour random trip brought you to &f' + prepared.destinationName + '&b!');
}
