load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");

function getRegionPrice(region, player) {
    var worldData = getWorldData();
    var region_json = JSON.parse(worldData.get(["region_" + region]));
    if (region_json
        && region_json.saleType
        && region_json.saleType === "buy"
        && region_json.salePrice) 
        {
            return region_json.salePrice;
        }
    // tellPlayer(player, "&cRegion value not found for: " + region);
    // If region_json.saleType === "rent", then let player know price is not considered.
    if (region_json.saleType === "rent") {
        tellPlayer(player, "&eRegion " + region + " is sat for rent. Region price is not counted.");
        return 0;
    }
    return 0;
}

function transferRegion(player, region, target) {
    var worldData = getWorldData();
    var region_json = JSON.parse(worldData.get(["region_" + region]));
    if (region_json) {
        var regionOwner = region_json.owner;
        if (regionOwner) {
            if (regionOwner === player) {
                region_json.owner = target;
                worldData.put(["region_" + region], JSON.stringify(region_json));
                tellPlayer(player, "&aRegion transferred to " + target + ".");
                tellPlayer(target, "&aRegion transferred from " + player + ".");
            } else {
                tellPlayer(player, "&cYou are not the owner of this region.");
            }
        } else {
            tellPlayer(player, "&cRegion owner not found.");
        }
    } else {
        tellPlayer(player, "&cRegion not found.");
    }
}