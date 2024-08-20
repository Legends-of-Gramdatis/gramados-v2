// Wine Aging Shelf
// This script will add a aged timer to the item stack in the slot
//
// The GUI will have 6 slots for the player to place the wine bottles


// GUI
var GUI, GRID_H = 16, GRID_W = 16, GRID_BORDER = 2;

var owner = "";

var stored_bottles = {

    // slot 1
    0: {
        itemstack: "",
        age: 0
    },
    // slot 2
    1: {
        itemstack: "",
        age: 0
    },
    // slot 3
    2: {
        itemstack: "",
        age: 0
    },
    // slot 4
    3: {
        itemstack: "",
        age: 0
    },
    // slot 5
    4: {
        itemstack: "",
        age: 0
    },
    // slot 6
    5: {
        itemstack: "",
        age: 0
    },
    // slot 7
    6: {
        itemstack: "",
        age: 0
    },
    // slot 8
    7: {
        itemstack: "",
        age: 0
    },
    // slot 9
    8: {
        itemstack: "",
        age: 0
    }
};

function init(event) {
    save_placeholder_item(event);
}

function interact(event) {

    // get the item held by the player
    var item = event.player.getMainhandItem();
    if (item != null) {
        // remove item by giving air
        event.player.setMainhandItem(event.block.world.createItem("minecraft:air", 0, 1));
        //event.player.message("Item held: " + item.getItemNbt().toJsonString());
        event.player.updatePlayerInventory();
    } else {
        event.player.message("No item held");
    }

    GUI = event.API.createCustomGui(1, GRID_W * 14, GRID_H * 11, false);

    create_GUI(event, GRID_W, GRID_H);
    GUI.showPlayerInventory(50, 100);

    event.player.showCustomGui(GUI);

    if (owner == "") {
        owner = event.player.getName();
    }

    event.player.message("Owner: " + owner);

    var custom_stored_bottles = JSON.parse(event.block.storeddata.get("stored_bottles"))
    // if there is indeed a stored_bottles in the block data
    if (custom_stored_bottles != null) {
        custom_stored_bottles[0].age = 50
        event.player.message(custom_stored_bottles[0].age)
        event.player.message(stored_bottles[0].age)
        //you'll notice that the age is different. custom_stored_bottles was recreated from the block's storeddata
    }

    readGuiSlots(event);

    return true;
}

function create_GUI(event, GRID_W, GRID_H) {

    GUI.setBackgroundTexture("minecraft:textures/gui/wine_aging_shelf_gui_wip.png");
    var button_texture_sheet = "minecraft:textures/gui/gramados_trucker_point_putton_textures.png";

    // add 9 item slots
    /*for (var i = 0; i < 9; i++) {

        if (i == 0) {
            var itemstack = load_placeholder_item(event);
            GUI.addItemSlot(20 + (i * GRID_W), 20, itemstack);
            event.player.message("Item added to slot 0");
        } else {

            GUI.addItemSlot(20 + (i * GRID_W), 20);
            // add a red rectangle at the slot
            GUI.addTexturedRect(i, button_texture_sheet, 20 + (i * GRID_W), 20, GRID_W, GRID_H, GRID_W * 8, 0);
        }

    }*/
}

function readGuiSlots(event) {
    var slot_list = GUI.getSlots();
    var slot_count = slot_list.length;
    event.player.message("There are " + slot_count + " slots");
    // navigate all slots
    for (var i = 0; i < slot_count; i++) {

        if (slot_list[i].hasStack()) {
            event.player.message("Slot " + i + " has an item");
        } else {
            event.player.message("Slot " + i + " is empty");
        }
    }

    // save data
    //save_bottles_to_blockdata(event);
}

/*function customGuiSlot(event) {
    event.player.message("Slot clicked");
    readGuiSlots(event);
}*/

function save_bottles_to_blockdata(event) {
    event.block.storeddata.put("stored_bottles", JSON.stringify(stored_bottles))
    event.player.message("Bottles saved to block data");
}

function customGuiClose(event) {
    event.player.message("GUI closed");
    // save data
    save_bottles_to_blockdata(event);
}

function fill_shelf_with_stored_bottles(event) {
    var custom_stored_bottles = event.block.storeddata.get("stored_bottles")
    event.player.message(custom_stored_bottles)
    // if there is indeed a stored_bottles in the block data
    if (custom_stored_bottles != null) {
        for (var i = 0; i < 9; i++) {
            if (!custom_stored_bottles[i].isEmpty()) {
                var nbt_object = e.API.stringToNbt(nbtString)
            }
        }
    }
}

function save_placeholder_item(event) {
    var item = event.block.world.createItem("growthcraft_grapes:grapewine", 1, 4);
    var itemAsNBT = item.getItemNbt().toJsonString()
    event.block.storeddata.put("placeholderItem", itemAsNBT);
}

function load_placeholder_item(event) {
    var nbtString = event.block.storeddata.get("placeholderItem");
    event.player.message(nbtString);
    var nbt_object = event.API.stringToNbt(nbtString);
    var item = event.block.world.createItemFromNbt(nbt_object);
    return item;
}