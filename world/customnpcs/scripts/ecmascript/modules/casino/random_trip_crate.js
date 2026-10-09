load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_dynmap.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

function prepareCasinoRandomTripCrateReward() {
    var setName = getRandomMarkerSet();
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
