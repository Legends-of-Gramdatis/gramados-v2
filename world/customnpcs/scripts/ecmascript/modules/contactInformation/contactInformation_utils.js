load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");

var CONTACT_INFO_PATH = "world/customnpcs/scripts/data_auto/contact_information.json";

function getContactInfoStore() {
    return loadJson(CONTACT_INFO_PATH) || {};
}

function saveContactInfoStore(contactInfo) {
    saveJson(contactInfo, CONTACT_INFO_PATH);
}

function buildContactInformationData(player) {
    return {
        "username": player.getName(),
        "email": "",
        "birthday": ""
    };
}

function ensureContactInfo(player) {
    var uuid = player.getUUID();
    var contactInfo = getContactInfoStore();

    if (!contactInfo.hasOwnProperty(uuid)) {
        contactInfo[uuid] = buildContactInformationData(player);
        tellPlayer(player, ":book_quill: &aWelcome to Gramados! You can share your contact information with the server by using the !contact command.");
        tellPlayer(player, "&7:arrow_r: Contact Information are used for server events, giveaways, and other community activities. You can set your email and birthday!");
    } else if (!contactInfo[uuid].username) {
        contactInfo[uuid].username = player.getName();
    }

    saveContactInfoStore(contactInfo);
    return contactInfo[uuid];
}

function getContactInfo(player) {
    var uuid = player.getUUID();
    var contactInfo = getContactInfoStore();

    return contactInfo[uuid];
}

function setContactInfoEmail(uuid, email) {
    var contactInfo = getContactInfoStore();

    contactInfo[uuid].email = email;

    saveContactInfoStore(contactInfo);
}

function setContactInfoBirthday(uuid, day, month, year) {
    var contactInfo = getContactInfoStore();

    var date_info = day + "/" + month + (year ? "/" + year : "");

    contactInfo[uuid].birthday = date_info;

    saveContactInfoStore(contactInfo);
}
