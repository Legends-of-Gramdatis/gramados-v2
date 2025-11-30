// utils_dynmap.js
// Utility functions for interacting with Dynmap marker data

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

// Public: get full marker data for given set and marker key
function getMarkerData(setName, markerKey) {
    var data = loadJson("dynmap/web/tiles/_markers_/marker_world.json");
    var sets = data.sets;
    var markerdata = sets[setName].markers[markerKey];
    return markerdata;
}

// Public: get [x,y,z] array for given set and marker key
function getMarkerXYZ(setName, markerKey) {
    var m = getMarkerData(setName, markerKey);
    return [m.x, m.y, m.z];
}