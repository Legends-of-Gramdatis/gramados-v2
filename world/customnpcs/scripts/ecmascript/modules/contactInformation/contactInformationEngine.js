load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/modules/contactInformation/contactInformation_utils.js");

var CONTACT_INFO_PATH = "world/customnpcs/scripts/data_auto/contact_information.json";

function interact(event) {
    // Get player's UUID
    var player = event.player;
    var uuid = player.getUUID();

    var contactInfoStore = getContactInfoStore();

    // Check if the player's UUID exists in the contact information data
    if (contactInfoStore.hasOwnProperty(uuid)) {
        var contactData = contactInfoStore[uuid];
        var username = contactData.username || "Unknown";
        var email = contactData.email || "Not provided";
        var birthday = contactData.birthday || "Not provided";

        // Send a message to the player with their contact information
        tellPlayer(player, "&eContact Information:");
        tellPlayer(player, "&7Username: &r" + username);
        tellPlayer(player, "&7Email: &r" + email);
        tellPlayer(player, "&7Birthday: &r" + birthday);
    } else {
        // If no contact information is found for the player
        tellPlayer(player, "&cNo contact information found for your account.");
        // create a new entry for the player in the contact information data
        ensureContactInfo(player);
        tellPlayer(player, "&aA new contact information entry has been created for your account. Please update it as needed.");
    }
}
