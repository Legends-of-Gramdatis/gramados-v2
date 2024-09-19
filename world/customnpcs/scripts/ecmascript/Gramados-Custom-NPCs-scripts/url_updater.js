var API = Java.type('noppes.npcs.api.NpcAPI').Instance()

function interact(event) {
    // get all NPC entities in the world
    var entities = event.player.world.getAllEntities(2);

    //event.player.message("&6There are " + entities.length + " NPCs in the world!");

    for (var i = 0; i < entities.length; i++) {
        var entity = entities[i];
        var entity_name = entity.getName();

        // Get display
        var display = entity.getDisplay();
        //Get skin URL
        var url = display.getSkinUrl();
        //event.player.message("&6Skin URL: " + url);

        //If URL starts with http://legends-of-gramdatis.com
        if (url.startsWith("http://legends-of-gramdatis.com")) {
            //Replace http://legends-of-gramdatis.com with https://legends-of-gramdatis.com
            var new_url = url.replace("http://legends-of-gramdatis.com", "https://legends-of-gramdatis.com");
            event.player.message("&6Updating skin URL of " + entity_name + " from " + url + " to " + new_url);

            //Set new skin URL
            display.setSkinUrl(new_url);
        }
    }
}