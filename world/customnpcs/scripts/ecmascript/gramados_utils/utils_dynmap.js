// utils_dynmap.js
// Utility functions for interacting with Dynmap marker data

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');

var DYNMAP_MARKERS_PATH = 'dynmap/web/tiles/_markers_/marker_world.json';

// Current marker set IDs (snapshot: 2026-10-09). Selection reads the live file.
// - Hardware Shops
// - Butcheries
// - Truck Stops
// - Wine Domains
// - Wholesalers
// - Junk Yards
// - General Stores
// - Education & Culture
// - Government Buildings
// - Furniture Shops
// - Town Halls
// - Dealerships
// - Banks
// - Repair Shops
// - Armories
// - Factories
// - Fuel Stations
// - Shops
// - Entertainment & Leisure
// - Tech Shops
// - Parkings
// - Transports
// - Restaurants
// - Sawmills
// - Hotels
// - Bridges
// - Automobile Parts
// - Services
// - Parks And Gardens
// - Open Air Markets
// - Bakeries
// - markers
// - Historical Sites
// - Bars


// Public: get full marker data for given set and marker key
function getMarkerData(setName, markerKey) {
    var data = loadJson(DYNMAP_MARKERS_PATH);
    var sets = data.sets;
    var markerdata = sets[setName].markers[markerKey];
    return markerdata;
}

// Public: get [x,y,z] array for given set and marker key
function getMarkerXYZ(setName, markerKey) {
    var m = getMarkerData(setName, markerKey);
    return [m.x, m.y, m.z];
}

function getMarkerName(setName, markerKey) {
    var m = getMarkerData(setName, markerKey);
    return m.label;
}

// Public: pick a nonempty set by ID, with equal probability per set.
function getRandomMarkerSet() {
    var sets = loadJson(DYNMAP_MARKERS_PATH).sets;
    var setNames = [];
    for (var setName in sets) {
        if (Object.keys(sets[setName].markers).length > 0) setNames.push(setName);
    }
    return pickFromArray(setNames);
}

// Public: pick one point from a given set, returning its full marker data.
function getRandomMarkerData(setName) {
    var markers = loadJson(DYNMAP_MARKERS_PATH).sets[setName].markers;
    var markerKey = pickFromArray(Object.keys(markers));
    return markers[markerKey];
}
