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
var GUI, GRID = 16;
var owner = "";
var BUTTON_TEXTURE_PATH = "minecraft:textures/gui/gramados_trucker_point_putton_textures.png";



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

    event.player.message("Item: " + item.getDisplayName() + " Count: " + item_count);

    // If player holds air:
    if (item.getDisplayName() == "Air") {
        event.player.message("You are holding air.");

        var bottle_count = 0;
        // Count how many bottles are in the stored data
        for (var i = 0; i < 32; i++) {
            if (stored_bottles[i] != null) {
                bottle_count++;
            }
        }

        // Open the GUI
        GUI = event.API.createCustomGui(1, GRID * 14, GRID * 11, false);
        create_GUI(event, GRID, bottle_count, stored_bottles);
        event.player.showCustomGui(GUI);

    } else {

        // get the first available slot of the array
        for (var i = 0; i < 32; i++) {

            var item_clone = item.copy();
            item_clone.setStackSize(1);

            // Add the age and date to the item
            var item_nbt = item_clone.getItemNbt();
            item_nbt.setLong("date", event.player.getWorld().getTotalTime());
            item_nbt.setLong("age", 0);

            if (stored_bottles[i] == null && item_count > 0) {


                // add the item to the slot
                stored_bottles[i] = item_nbt.toJsonString();
                item_count--;

                // tell the player that the item was placed in the shelf
                event.player.message("You placed 1 item in the shelf: " + item_clone.getDisplayName() + " at slot " + i);
            }
        }

        //tell what is in stored data
        //event.player.message("Stored items: " + stored_bottles);

        // Update stak size of the item in hand
        item.setStackSize(item_count);
        event.player.setMainhandItem(item);

        // Save block data
        event.block.storeddata.put("stored_bottles", JSON.stringify(stored_bottles));

    }

    return true;
}






function create_GUI(event, GRID, bottle_count, stored_bottles) {

    event.player.message("Creating GUI with " + bottle_count + " bottles");
    GUI.setBackgroundTexture("minecraft:textures/gui/wine_aging_shelf_gui_wip.png");
    var button_texture_sheet = "minecraft:textures/gui/gramados_trucker_point_putton_textures.png";

    // add the bottles as textures buttons
    for (var i = 0; i < bottle_count; i++) {
        GUI.addTexturedButton(i, "boottle", GRID * i, GRID, GRID, GRID, BUTTON_TEXTURE_PATH, GRID * 6, 0);
    }
}