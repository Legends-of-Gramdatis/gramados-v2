load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_onboarding_v2.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region_gadgets.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_modifier_items.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');

function onboarding_assign_hotel_room(player) {
    var rooms = getStarterHotelRegions();
    for (var i = 0; i < rooms.length; i++) {
        if (getRegionOwnerName(rooms[i].name) === player.getName()) return rooms[i].name;
    }

    var roomName = getRandomUnownedRegion(rooms, null);
    if (!roomName || !setRegionOwner(roomName, player.getName())) return null;
    return roomName;
}

function onboarding_complete_hotel_quest(player) {
    var data = load_onboarding_v2_data(player);
    if (!data || data.hotelRoom) return;

    var roomName = onboarding_assign_hotel_room(player);
    if (!roomName) {
        tellPlayer(player, '&cNo State Hotel room could be assigned. Please contact a staff member.');
        logToFile('onboarding', '<@&539939620901748775> State Hotel room assignment failed for ' + player.getName());
        return;
    }

    var roomId = roomName.split('_').pop();
    var world = player.getWorld();
    var baseItem = world.createItem('variedcommodities:bag', 0, 1);
    var packageItem = create_modifier_item_stack(world, baseItem, {
        type: 'loot_load',
        displayName: '&bRoom #' + roomId + ' - Furniture Package',
        description: '&7Open inside your assigned room.',
        requiredRegion: roomName,
        lootTables: [
            _LOOTTABLE_FURNITURE_BED,
            _LOOTTABLE_FURNITURE_STORAGE,
            _LOOTTABLE_FURNITURE_TABLE
        ],
        usesBeforeDepletion: 0,
        onDepletion: 'disappear',
        completeQuestId: 177
    });

    if (!player.giveItem(packageItem)) player.dropItem(packageItem);

    data.hotelRoom = roomName;
    save_onboarding_v2_data(player, data);
    logToFile('onboarding', 'Player ' + player.getName() + ' assigned room ' + roomName);
}
