var api = Java.type('noppes.npcs.api.NpcAPI').Instance();

var uniqueUUID = "";

var owned_trucks_nearby = [];
var your_trucks = [];


function interact(event) {
    var delivery_possible = false;

    //event.player.message("Nearby entities: " + nearby_entity_list.length);

    var truck_list = collect_nearby_trucks(event);
    /*if (truck_list.length > 1) {
        event.player.message("There are " + truck_list.length + " trucks nearby");
    } else if (truck_list.length == 1) {
        event.player.message("There is " + truck_list.length + " truck nearby");
    } else {
        event.player.message("There are no trucks nearby");
    }*/

    var owned_trucks_nearby = collect_owned_trucks(event, truck_list);
    /*if (owned_trucks_nearby.length > 1) {
        event.player.message("There are " + owned_trucks_nearby.length + " trucks nearby that are owned");
    } else if (owned_trucks_nearby.length == 1) {
        event.player.message("There is " + owned_trucks_nearby.length + " truck nearby that is owned");
    } else {
        event.player.message("There are no trucks nearby that are owned");
        event.player.message("An owned truck is a truck that has a key");
    }*/

    var your_trucks = collect_your_trucks(event, owned_trucks_nearby);
    if (your_trucks.length > 1) {
        event.player.message("There are " + your_trucks.length + " trucks nearby that are yours. You must have 1 truck nearby to take the delivery.");
    } else if (your_trucks.length == 1) {
        event.player.message("There is 1 truck nearby that is yours, you may take the delivery.");
        delivery_possible = true;
    } else {
        event.player.message("There are no trucks nearby that are yours");
        event.player.message("A truck that is yours is a truck that you have the key for");
    }





    if (delivery_possible) {
        var truck = your_trucks[0];
        var can_take = can_take_delivery(event, truck, "container");
        if (can_take) {
            event.player.message("The truck can take the delivery");
        } else {
            event.player.message("The truck cannot take the delivery");
        }
    }
}


// check if a player had the key on him
function check_key(event, UUID) {

    var player_inventory = event.player.getInventory();
    var player_inventory_list = player_inventory.getItems();
    for (var i = 0; i < player_inventory_list.length; i++) {
        var itemNBT = player_inventory_list[i].getNbt();
        if (itemNBT.getString("keyUUID") == UUID) {
            return true;
        }
    }
    return false;
}

// function to collect all nearby trucks
function collect_nearby_trucks(event) {
    var player = event.player;
    var world = player.world;

    var truck_list_t = [];

    var nearby_entity_list = world.getNearbyEntities(player.getPos(), 10, 0);

    for (var i = 0; i < nearby_entity_list.length; i++) {
        if (nearby_entity_list[i].getEntityName() == "entity.mts_entity.name") {
            truck_list_t.push(nearby_entity_list[i]);
        }
    }

    return truck_list_t;
}


// function to collect all owned trucks
function collect_owned_trucks(event, truck_list) {

    var truck_list_t = [];

    for (var i = 0; i < truck_list.length; i++) {
        var entity = truck_list[i];
        var entityNBT = entity.getEntityNbt();
        if (entityNBT.getString("keyUUID")) {
            truck_list_t.push(entity);
        }
    }

    return truck_list_t;
}

// function to collect all owned trucks that are yours
function collect_your_trucks(event, truck_list) {

    var truck_list_t = [];

    for (var i = 0; i < truck_list.length; i++) {
        var entity = truck_list[i];
        var entityNBT = entity.getEntityNbt();
        var keyUUID = entityNBT.getString("keyUUID");
        if (keyUUID) {
            if (check_key(event, keyUUID)) {
                truck_list_t.push(entity);
            }
        }
    }

    return truck_list_t;
}



// Function to check if the Truck can take a delivery of a specific type
function can_take_delivery(event, truck, delivery_type) {
    var bed_types = [];
    switch (delivery_type) {
        case "container":
            bed_types = ["truck_bed_containerholder", "unuparts_bodypart_unu_truckbed_container", "containerbed"];
        case "flatbed":
            bed_types = ["flatbed"];
        case "stake":
            bed_types = ["unuparts_bodypart_unu_truckbed_stakeside_wood", "truck_bed_woodenflatbed", "truck_bed_flatbedwalleddumpster", "truck_bed_flatbedwalledtall", "iav_truck_flatbed"];
        case "tanker":
            bed_types = ["unuparts_bodypart_unu_truckbed_tanker_vintage", "iav_truck_tank"];
        default:
            bed_types = ["truck_bed_containerholder", "unuparts_bodypart_unu_truckbed_container", "containerbed"];
    }

    var truckNBT = truck.getEntityNbt();
    var keys = truckNBT.getKeys();
    for (var j = 0; j < keys.length; j++) {
        if (truckNBT.getCompound(keys[j]).has("systemName")) {
            for (var k = 0; k < bed_types.length; k++) {
                if (truckNBT.getCompound(keys[j]).getString("systemName") == bed_types[k]) {
                    // Check if no container is already in the truck
                    if (!truckNBT.getCompound(keys[j]).has("part_0")) {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        }
    }

    return false;
}