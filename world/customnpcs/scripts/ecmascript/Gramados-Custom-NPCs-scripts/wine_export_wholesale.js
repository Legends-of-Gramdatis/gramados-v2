// Wine export wholesale script for the Custom NPCs mod.
// This scriptadds the ability for the player to sale his aged wine bottles for a price dynamically calculated based on the wine age and quality.

/*
The NPC has a simple GUI with two buttons:
- The first button allows the player to sale his aged wine bottles.
- The second button allows the player to exit the GUI.
The GUI has a slot on the left side where the player can put his aged wine bottle. (1 at a time)
The right side will display the different info about the bottle:
- The wine name
- The price
- The domain it was produced
- the age of the bottle

The domain names are saved, the longer the domain exists, and the more bottles have been sold, the more the price will increase.
The age of the bottle will also increase the price. It is the main variable that will increase the price.
Within a domain, multiple wine types can be sold. The more variety of wine types sold, the more the price will increase.
Some of the wine types are considered more valuable than others. The more valuable the wine type, the more the price will increase.
*/

// Global variables
var GUI, GRID = 16;
var TEXTURE_PATH_BUTTONS = "minecraft:textures/gui/wine_aging_shelf_gui_buttons.png"; // placeholder
var TEXTURE_PATH_BACKGROUND = "minecraft:textures/gui/wine_aging_shelf_gui.png"; // placeholder
var npc;

function init(event) {
    allenis_domains = event.npc.world.getStoreddata().get("allenis_domains");
    // If data doesn't exist, create it
    if (allenis_domains == null) {
        allenis_domains = [];
        event.npc.world.getStoreddata().put("allenis_domains", allenis_domains);
    } else {
        event.npc.say("Allenis domains: " + allenis_domains);
    }
}