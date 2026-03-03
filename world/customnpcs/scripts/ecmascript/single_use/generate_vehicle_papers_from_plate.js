load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_vehicles_licensing.js");

var TARGET_PLATE = "mdl-1931";

function interact(event) {
    var player = event.player;
    var world = event.player.getWorld();
    var plate = TARGET_PLATE;

    var registration = getRegistrationByPlate(plate);
    if (!registration) {
        tellPlayer(player, "&cNo licensed vehicle found for plate: &e" + plate);
        return;
    }

    var vehiclePreviewStack = world.createItem(registration.vehicleId, 0, 1);
    var papers = generatePaperItem(world, registration, vehiclePreviewStack);

    if (!papers || papers.isEmpty()) {
        tellPlayer(player, "&cFailed to generate car papers for plate: &e" + plate);
        return;
    }

    player.giveItem(papers);
    tellPlayer(player, "&aGenerated car papers for plate: &e" + plate + "&a.");
}