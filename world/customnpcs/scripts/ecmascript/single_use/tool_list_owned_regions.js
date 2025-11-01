// Tool: List Owned Regions
// Attach this script to a CustomNPCs scripted item. On right-click, it
// lists every region the player (user of the item) currently owns and shows
// the total count. Data source: CustomNPCs World Data entries with keys
// named "region_<regionName>" whose JSON contains an owner field.
//
// Ownership detection rules (case-insensitive):
// - data.owner OR data.ownerName OR data.meta.owner is equal to player name
// - OR player's name is in an array data.owners OR data.meta.owners
//
// Dependencies from gramados_utils:
// - utils_chat: tellPlayer(), tellSeparatorTitle()
// - utils_region: getOwnedRegions()

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js');

var MAX_NAMES_PER_LINE = 10; // to keep chat readable

function interact(event) {
    var player = event.player;
    if (!player) return;

    var details = getOwnedRegions(player, { returnDetails: true });
    var owned = (details && details.regions) ? details.regions.slice(0) : [];
    var parseErrors = (details && typeof details.parseErrors === 'number') ? details.parseErrors : 0;
    // Sort for stability
    owned.sort();

    // Output
    tellSeparatorTitle(player, 'Region Ownership', '&b', '&e');

    if (owned.length === 0) {
        tellPlayer(player, '&7You do not currently own any regions.');
        if (parseErrors > 0) tellPlayer(player, '&8(ignored ' + parseErrors + ' malformed region entries)');
        return;
    }

    tellPlayer(player, '&aYou currently own &e' + owned.length + '&a region(s). Listing them:');

    // Paginate names across multiple lines
    var line = [];
    for (var k = 0; k < owned.length; k++) {
        line.push(owned[k]);
        if (line.length >= MAX_NAMES_PER_LINE) {
            tellPlayer(player, '&7- &b' + line.join('&7, &b'));
            line = [];
        }
    }
    if (line.length > 0) {
        tellPlayer(player, '&7- &b' + line.join('&7, &b'));
    }

    if (parseErrors > 0) {
        tellPlayer(player, '&8(ignored ' + parseErrors + ' malformed region entries)');
    }
}

function getTooltip(event) {
    event.add('&6Owned Regions Tool');
    event.add('&7Right-click to list all regions you own.');
}
