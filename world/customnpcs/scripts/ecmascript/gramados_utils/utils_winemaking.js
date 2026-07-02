load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

var WINEMAKING_DOMAIN_FILE_PATH = 'world/customnpcs/scripts/ecmascript/modules/winemaking/domains.json';

function getWinemakingDomainsData() {
    return loadJson(WINEMAKING_DOMAIN_FILE_PATH);
}

function getWinemakingDomainsByOwner(ownerName) {
    var data = getWinemakingDomainsData();
    var matches = [];

    if (!data || !data.domains) {
        return matches;
    }

    for (var domainKey in data.domains) {
        if (!data.domains.hasOwnProperty(domainKey)) {
            continue;
        }

        var domainEntry = data.domains[domainKey];
        if (domainEntry && domainEntry.owner === ownerName) {
            matches.push({
                key: domainKey,
                data: domainEntry
            });
        }
    }

    return matches;
}

function formatWinemakingBottleVariety(variety) {
    if (!variety) {
        return 'None';
    }

    if (Array.isArray(variety)) {
        if (variety.length === 0) {
            return 'None';
        }

        return variety.map(function (entry) {
            if (typeof entry === 'string') {
                return entry;
            }

            if (entry && typeof entry === 'object') {
                if (entry.name !== null && typeof entry.name !== 'undefined' && entry.count !== null && typeof entry.count !== 'undefined') {
                    return entry.name + ' x' + entry.count;
                }

                return JSON.stringify(entry);
            }

            return '' + entry;
        }).join(', ');
    }

    if (typeof variety === 'object') {
        var varietyParts = [];
        var varietyKeys = Object.keys(variety).sort();

        for (var i = 0; i < varietyKeys.length; i++) {
            var varietyKey = varietyKeys[i];
            varietyParts.push(varietyKey + ' x' + variety[varietyKey]);
        }

        return varietyParts.length > 0 ? varietyParts.join(', ') : 'None';
    }

    return '' + variety;
}

function formatWinemakingLastSaleDate(world, lastSaleTick) {
    if (!lastSaleTick || lastSaleTick <= 0) {
        return 'Never';
    }

    if (world && typeof world.getTotalTime === 'function') {
        var currentDate = new Date();
        var serverAgeSeconds = world.getTotalTime() / 20;
        currentDate.setSeconds(currentDate.getSeconds() - serverAgeSeconds);
        currentDate.setSeconds(currentDate.getSeconds() + (lastSaleTick / 20));

        var day = currentDate.getDate();
        var month = currentDate.getMonth() + 1;
        var year = currentDate.getFullYear();
        var hours = currentDate.getHours();
        var minutes = currentDate.getMinutes();
        var seconds = currentDate.getSeconds();

        return (day < 10 ? '0' : '') + day + '/' + (month < 10 ? '0' : '') + month + '/' + year + ' ' +
            (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds +
            ' (' + lastSaleTick + ' ticks)';
    }

    return lastSaleTick + ' ticks';
}
