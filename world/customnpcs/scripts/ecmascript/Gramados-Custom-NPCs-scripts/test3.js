// Wine Aging Shelf
// This script adds a wine aging feature to the Growthcraft wine bottles.

/*
The block data must store an array of 32 IItemStacks.
Each IItemStack must be some sort of wine bottle from the mod Growthcraft.
Within each of those IItemStacks, there must be a custom NBT tag that will store the age of the wine bottle, and the date this bottle was placed in the shelf.
On opening the GUI, the script will read the block data and generate a custom GUI with 32 bottle, that will be represented by a textured button per bottle. (32 buttons in total)
Each bottle in stored data will also have its age increased by the time the bottle was in the shelf (aka add the time between now and the date the bottle was placed in the shelf to the age of the bottle).
When the player clicks on a bottle, the button will be removed and the bottle will be removed from the block data.
At the same time, the player will receive the bottle in his inventory as an Growthcraft wine bottle item with an extra NBT tag that will store the age of the wine bottle.
The player can age further the bottle by placing it again in the shelf.
*/


// GUI
var GUI, GRID_H = 16, GRID_W = 16, GRID_BORDER = 2;

var owner = "";



function init(event) {
    // If stored data is empty, create an empty array of 32 IItemStacks
    if (event.block.storeddata.get("stored_bottles") == null) {
        var stored_bottles = [];
        for (var i = 0; i < 32; i++) {
            stored_bottles.push(event.block.world.createItem("minecraft:air", 0, 1));
        }
        event.block.storeddata.put("stored_bottles", JSON.stringify(stored_bottles));
    }
}

function interact(event) {

    var stored_bottles = JSON.parse(event.block.storeddata.get("stored_bottles"));

    // tell the player the current data of the block
    event.player.message("Stored items: " + JSON.stringify(stored_bottles));

    // get what the player has in hand:
    var item = event.player.getMainhandItem();
    //get how many items the player has in hand
    var item_count = item.getStackSize();


    // get the first available slot of the array
    for (var i = 0; i < 32; i++) {
        if (stored_bottles[i] == null && item_count > 0) {

            // add the item to the slot
            stored_bottles[i] = item;
            item_count--;

            // tell the player that the item was placed in the shelf
            event.player.message("You placed 1 item in the shelf: " + item.getDisplayName() + " at slot " + i);
        }
    }

    // get the item held by the player
    /*var item = event.player.getMainhandItem();

    // if the player is not holding an item or is holding air
    if (item != null && item.getDisplayName() != "Air") {

        // remove item by giving air
        event.player.setMainhandItem(event.block.world.createItem("minecraft:air", 0, 1));
        //event.player.message("Item held: " + item.getItemNbt().toJsonString());
        event.player.updatePlayerInventory();



        //tell the player that the item was removed
        event.player.message("You placed an item in the shelf: " + item.getDisplayName() + " x" + item.getStackSize());


    } else {
        event.player.message("No item held");
    }

    GUI = event.API.createCustomGui(1, GRID_W * 14, GRID_H * 11, false);

    create_GUI(event, GRID_W, GRID_H);
    GUI.showPlayerInventory(50, 100);

    event.player.showCustomGui(GUI);

    /*if (owner == "") {
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

    readGuiSlots(event);*/

    // Save block data
    event.block.storeddata.put("stored_bottles", JSON.stringify(stored_bottles));

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

/*function save_placeholder_item(event) {
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
}*/