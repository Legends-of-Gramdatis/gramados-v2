// Load utility modules
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_modifiers.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");

var MARKET_DATA = "world/customnpcs/scripts/data_auto/markets.json";
var MARKET_CONFIG = "world/customnpcs/scripts/data/market_config.json";
var CONTAINERS_CONFIG = "world/customnpcs/scripts/data/containers.json";

var CRATE_PERSONAL_KEY = "crate_personal";
var CRATE_FREIGHT_KEY = "crate_freight";
var CRATE_BULK_KEY = "crate_bulk";
var BARREL_STANDARD_KEY = "barrel_standard";
var MARKET_KEY = "market";
var JOB_KEY = "job";

var admin_config_items = {
    "crate_personal": {
        "id": "variedcommodities:coin_wood",
        "description": "&8Toggles if the market NPC will accept personal containers or not.",
        "name": "&bToggle Personal Container Acceptance"
    },
    "crate_freight": {
        "id": "variedcommodities:coin_stone",
        "description": "&8Toggles if the market NPC will accept freight crates or not.",
        "name": "&bToggle Freight Crate Acceptance"
    },
    "crate_bulk": {
        "id": "variedcommodities:coin_bronze",
        "description": "&8Toggles if the market NPC will accept bulk storage or not.",
        "name": "&bToggle Bulk Storage Acceptance"
    },
    "barrel_standard": {
        "id": "variedcommodities:coin_iron",
        "description": "&8Toggles if the market NPC will accept standard barrels or not.",
        "name": "&bToggle Standard Barrel Acceptance"
    },
    "market": {
        "id": "variedcommodities:ingot_bronze",
        "description": "&8Switches the market the NPC is managing.",
        "name": "&bSwitch Market"
    },
    "job": {
        "id": "variedcommodities:ingot_mithril",
        "description": "&8Switches the required job for the NPC to trade with players.",
        "name": "&bSwitch Job"
    }
};

function isAdmin(offhandItem) {
    return offhandItem && !offhandItem.isEmpty() && offhandItem.getName() == 'mts:ivv.idcard_seagull';
}

function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var offhand = player.getOffhandItem();
    var mainhand = player.getMainhandItem().copy();

    if (isAdmin(offhand)) {
        handleAdminInteraction(npc, player, mainhand);
        return;
    }

    if (!isNpcConfigured(npc)) {
        npc.say(ccs('&eMy boss hasn\'t told me what to do yet. Ask an admin to configure me.'));
        return;
    }
}

function handleAdminInteraction(npc, player, mainhand) {
    if (!mainhand || mainhand.isEmpty()) {
        if (!isNpcConfigured(npc)) {
            showAdminConfigurationHelp(npc, player);
            npc.say(ccs('&eI can\'t do anything yet. Please configure me using the admin items.'));
            giveAdminConfigItems(player);
            return;
        }

        showCurrentConfiguration(npc, player);
        return;
    }

    var id = mainhand.getName();

    if (id == 'minecraft:barrier') {
        resetAdminState(npc, player);
        return;
    }

    switch (id) {
        case admin_config_items[CRATE_PERSONAL_KEY].id:
            toggleAdminConfig(npc, player, CRATE_PERSONAL_KEY);
            break;
        case admin_config_items[CRATE_FREIGHT_KEY].id:
            toggleAdminConfig(npc, player, CRATE_FREIGHT_KEY);
            break;
        case admin_config_items[CRATE_BULK_KEY].id:
            toggleAdminConfig(npc, player, CRATE_BULK_KEY);
            break;
        case admin_config_items[BARREL_STANDARD_KEY].id:
            toggleAdminConfig(npc, player, BARREL_STANDARD_KEY);
            break;
        case admin_config_items[MARKET_KEY].id:
            cycleAdminConfig(npc, player, MARKET_KEY);
            break;
        case admin_config_items[JOB_KEY].id:
            cycleJobs(npc, player);
            break;
        default:
            tellPlayer(player, '&a[Admin] This item is not recognized for configuration. Please use the provided admin items.');
            break;
    }
}

function toggleAdminConfig(npc, player, key) {
    var sd = npc.getStoreddata();
    var currentValue = sd.has(key) ? sd.get(key) : 0;
    var newValue = currentValue === 1 ? 0 : 1;

    npc.getStoreddata().put(key, newValue);

    tellPlayer(player, '&a[Admin] ' + admin_config_items[key].name + ' is now set to: &e' + newValue);
}

function cycleJobs(npc, player) {
    var sd = npc.getStoreddata();
    var currentJob = sd.has(JOB_KEY) ? sd.get(JOB_KEY) : null;
    var jobs = getAllJobsAndTags();

    if (!jobs || jobs.length === 0) {
        tellPlayer(player, '&c[Admin] No jobs or tags are available to cycle.');
        return;
    }

    var currentIndex = -1;

    for (var i = 0; i < jobs.length; i++) {
        if (jobs[i] && String(jobs[i].id) === String(currentJob)) {
            currentIndex = i;
            break;
        }
    }

    var nextIndex = (currentIndex + 1) % jobs.length;
    var newJob = jobs[nextIndex];

    if (!newJob) {
        tellPlayer(player, '&c[Admin] The next job entry is invalid.');
        return;
    }

    sd.put(JOB_KEY, newJob.id);

    tellPlayer(player, '&a[Admin] ' + admin_config_items[JOB_KEY].name + ' &ais now set to: &e' + newJob.title
    );
}

function cycleAdminConfig(npc, player, key) {
    var sd = npc.getStoreddata();
    var currentValue = sd.has(key) ? sd.get(key) : null;
    var options = [];

    if (key === MARKET_KEY) {
        var marketConfig = loadJson(MARKET_CONFIG);
        options = Object.keys(marketConfig);
    } else if (key === JOB_KEY) {
        options = getAllJobsAndTags();
    }

    if (options.length === 0) {
        tellPlayer(player, '&c[Admin] No options available to cycle for ' + admin_config_items[key].name);
        return;
    }

    var currentIndex = currentValue ? options.indexOf(currentValue) : -1;
    var nextIndex = (currentIndex + 1) % options.length;
    var newValue = options[nextIndex];

    npc.getStoreddata().put(key, newValue);

    tellPlayer(player, '&a[Admin] ' + admin_config_items[key].name + ' is now set to: &e' + newValue);
}

function resetAdminState(npc, player) {
    var sd = npc.getStoreddata();
    sd.remove(CRATE_PERSONAL_KEY);
    sd.remove(CRATE_FREIGHT_KEY);
    sd.remove(CRATE_BULK_KEY);
    sd.remove(BARREL_STANDARD_KEY);
    sd.remove(MARKET_KEY);
    sd.remove(JOB_KEY);

    tellPlayer(player, '&a[Admin] Cleared the current configuration for this Market NPC.');
}

function isNpcConfigured(npc) {
    var sd = npc.getStoreddata();

    return sd.has(MARKET_KEY)
        && sd.has(JOB_KEY)
        && sd.has(CRATE_PERSONAL_KEY)
        && sd.has(CRATE_FREIGHT_KEY)
        && sd.has(CRATE_BULK_KEY)
        && sd.has(BARREL_STANDARD_KEY);
}

function giveAdminConfigItems(player) {
    for (var key in admin_config_items) {
        var itemName = admin_config_items[key].id;
        var itemStack = player.getWorld().createItem(itemName, 0, 1);

        itemStack.setCustomName(ccs(admin_config_items[key].name));
        itemStack.setLore([ccs(admin_config_items[key].description)]);

        player.giveItem(itemStack);
    }
}

function showCurrentConfiguration(npc, player) {
    var sd = npc.getStoreddata();

    tellPlayer(player, '&6[Admin] &eCurrent Market NPC configuration:');

    for (var key in admin_config_items) {
        var value = sd.has(key) ? sd.get(key) : '&cNot set';
        tellPlayer(player, '&7- ' + admin_config_items[key].name + '&7: &e' + value);
    }
}

function showAdminConfigurationHelp(npc, player) {
    var tutorialText = [
        '&6[Admin] &eMarket NPC Configuration',
        '&7Use the following admin items on this NPC to configure its behavior:',
        '&7Use a &fminecraft:barrier &7to clear the current configuration.',
        '',
        '&e- &f' + admin_config_items[CRATE_PERSONAL_KEY].id + ' &7→ ' + admin_config_items[CRATE_PERSONAL_KEY].name,
        '  ' + admin_config_items[CRATE_PERSONAL_KEY].description,
        '',
        '&e- &f' + admin_config_items[CRATE_FREIGHT_KEY].id + ' &7→ ' + admin_config_items[CRATE_FREIGHT_KEY].name,
        '  ' + admin_config_items[CRATE_FREIGHT_KEY].description,
        '',
        '&e- &f' + admin_config_items[CRATE_BULK_KEY].id + ' &7→ ' + admin_config_items[CRATE_BULK_KEY].name,
        '  ' + admin_config_items[CRATE_BULK_KEY].description,
        '',
        '&e- &f' + admin_config_items[BARREL_STANDARD_KEY].id + ' &7→ ' + admin_config_items[BARREL_STANDARD_KEY].name,
        '  ' + admin_config_items[BARREL_STANDARD_KEY].description,
        '',
        '&e- &f' + admin_config_items[MARKET_KEY].id + ' &7→ '+ admin_config_items[MARKET_KEY].name,
        '  ' + admin_config_items[MARKET_KEY].description,
        '',
        '&e- &f' + admin_config_items[JOB_KEY].id + ' &7→ ' + admin_config_items[JOB_KEY].name,
        '  ' + admin_config_items[JOB_KEY].description
    ];

    storytellPlayer(player, tutorialText);
}
