// Load utility modules
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_emotes.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_modifiers.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");

// Data files
var MARKET_DATA = "world/customnpcs/scripts/data_auto/markets.json";
var MARKET_CONFIG = "world/customnpcs/scripts/data/market_config.json";
var CONTAINERS_CONFIG = "world/customnpcs/scripts/data/containers.json";
var DOMAIN_FILE_PATH = "world/customnpcs/scripts/ecmascript/modules/winemaking/domains.json";
var MARKET_NPC_CONFIG = "world/customnpcs/scripts/ecmascript/modules/stockExchange/market_npc_config.json";

// Stored-data keys
var CRATE_PERSONAL_KEY = "crate_personal";
var CRATE_FREIGHT_KEY = "crate_freight";
var CRATE_BULK_KEY = "crate_bulk";
var BARREL_STANDARD_KEY = "barrel_standard";
var MARKET_KEY = "market";
var JOB_KEY = "job";

// Economy constants
var PRICE_EVOLUTION_FACTOR = 0.001;

// Runtime references
var npc = null;
var world = null;
var activeMarketName = null;
var activeMarketData = null;
var activeMarketConfig = null;
var activeJob = null;
var containerConfig = null;
var admin_config_items = null;

/* -------------------------------------------------------------------------- */
/* Lifecycle                                                                   */
/* -------------------------------------------------------------------------- */

function init(event) {
    npc = event.npc;
    world = npc.getWorld();

    refreshAdminConfigItems();
    refreshRuntimeConfiguration();
}

function interact(event) {
    npc = event.npc;
    world = npc.getWorld();

    if (!refreshAdminConfigItems()) {
        npc.say(ccs("&cI cannot load my admin configuration right now. Please contact an admin."));
        return;
    }

    var player = event.player;
    var offhand = player.getOffhandItem();
    var mainhand = player.getMainhandItem();

    if (isAdmin(offhand)) {
        handleAdminInteraction(npc, player, mainhand ? mainhand.copy() : null);
        refreshRuntimeConfiguration();
        return;
    }

    if (!isNpcConfigured(npc)) {
        npc.say(ccs("&eMy boss hasn't told me what to do yet. Ask an admin to configure me."));
        return;
    }

    if (!refreshRuntimeConfiguration()) {
        npc.say(ccs("&cI cannot trade right now. My configuration is invalid; please contact an admin."));
        return;
    }

    if (!playerHasRequiredJob(player)) {
        npc.say(ccs(getAccessDeniedText()));
        return;
    }

    processPlayerDelivery(player, mainhand);
}

function refreshAdminConfigItems() {
    admin_config_items = loadJson(MARKET_NPC_CONFIG);
    return !!admin_config_items;
}

/* -------------------------------------------------------------------------- */
/* Runtime configuration                                                       */
/* -------------------------------------------------------------------------- */

function refreshRuntimeConfiguration() {
    if (!npc) {
        return false;
    }

    var sd = npc.getStoreddata();

    activeMarketName = sd.has(MARKET_KEY) ? String(sd.get(MARKET_KEY)) : null;
    activeMarketData = null;
    activeMarketConfig = null;
    activeJob = null;

    containerConfig = loadJson(CONTAINERS_CONFIG);

    if (!activeMarketName || !sd.has(JOB_KEY)) {
        return false;
    }

    var allMarketData = loadJson(MARKET_DATA);
    var allMarketConfig = loadJson(MARKET_CONFIG);

    if (!allMarketData || !allMarketData[activeMarketName]) {
        return false;
    }

    if (!allMarketConfig || !allMarketConfig[activeMarketName]) {
        return false;
    }

    activeMarketData = allMarketData[activeMarketName];
    activeMarketConfig = allMarketConfig[activeMarketName];
    activeJob = findJobOrTagById(sd.get(JOB_KEY));

    return activeJob !== null;
}

function findJobOrTagById(id) {
    var jobs = getAllJobsAndTags();

    if (!jobs) {
        return null;
    }

    for (var i = 0; i < jobs.length; i++) {
        if (jobs[i] && String(jobs[i].id) === String(id)) {
            return jobs[i];
        }
    }

    return null;
}

function playerHasRequiredJob(player) {
    if (!activeJob) {
        return false;
    }

    if (Number(activeJob.id) === 0) {
        return true;
    }

    return player.hasReadDialog(Number(activeJob.id));
}

function getAccessDeniedText() {
    if (!activeJob) {
        return "&cI do not know which workers I am authorized to trade with.";
    }

    if (activeJob.MarketAccessDeniedText) {
        return activeJob.MarketAccessDeniedText;
    }

    return "&eI can only trade with workers registered as " + activeJob.title + ".";
}

/* -------------------------------------------------------------------------- */
/* Admin configuration                                                         */
/* -------------------------------------------------------------------------- */

function isAdmin(offhandItem) {
    return offhandItem
        && !offhandItem.isEmpty()
        && offhandItem.getName() == "mts:ivv.idcard_seagull";
}

function handleAdminInteraction(npc, player, mainhand) {
    if (!mainhand || mainhand.isEmpty()) {
        if (!isNpcConfigured(npc)) {
            showAdminConfigurationHelp(npc, player);
            npc.say(ccs("&eI can't do anything yet. Please configure me using the admin items."));
            giveAdminConfigItems(player);
            return;
        }

        showCurrentConfiguration(npc, player);
        return;
    }

    var id = mainhand.getName();

    if (id == "minecraft:barrier") {
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
            cycleMarket(npc, player);
            break;
        case admin_config_items[JOB_KEY].id:
            cycleJobs(npc, player);
            break;
        default:
            tellPlayer(player, "&c[Admin] This item is not recognized for configuration.");
            break;
    }
}

function toggleAdminConfig(npc, player, key) {
    var sd = npc.getStoreddata();
    var currentValue = sd.has(key) ? Number(sd.get(key)) : 0;
    var newValue = currentValue === 1 ? 0 : 1;

    sd.put(key, newValue);

    tellPlayer(
        player,
        "&a[Admin] " + admin_config_items[key].name
        + " &ais now set to: "
        + (newValue === 1 ? "&aEnabled" : "&cDisabled")
    );
}

function cycleMarket(npc, player) {
    var sd = npc.getStoreddata();
    var marketConfig = loadJson(MARKET_CONFIG);
    var options = marketConfig ? Object.keys(marketConfig) : [];

    if (options.length === 0) {
        tellPlayer(player, "&c[Admin] No markets are available to cycle.");
        return;
    }

    var currentValue = sd.has(MARKET_KEY) ? String(sd.get(MARKET_KEY)) : null;
    var currentIndex = currentValue ? options.indexOf(currentValue) : -1;
    var nextIndex = (currentIndex + 1) % options.length;
    var newValue = options[nextIndex];

    sd.put(MARKET_KEY, newValue);

    tellPlayer(
        player,
        "&a[Admin] " + admin_config_items[MARKET_KEY].name
        + " &ais now set to: &e" + newValue
    );
}

function cycleJobs(npc, player) {
    var sd = npc.getStoreddata();
    var currentJob = sd.has(JOB_KEY) ? sd.get(JOB_KEY) : null;
    var jobs = getAllJobsAndTags();

    if (!jobs || jobs.length === 0) {
        tellPlayer(player, "&c[Admin] No jobs or tags are available to cycle.");
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
        tellPlayer(player, "&c[Admin] The next job entry is invalid.");
        return;
    }

    sd.put(JOB_KEY, newJob.id);

    tellPlayer(
        player,
        "&a[Admin] " + admin_config_items[JOB_KEY].name
        + " &ais now set to: &e" + newJob.title
        + " &7(ID: " + newJob.id + ")"
    );
}

function resetAdminState(npc, player) {
    var sd = npc.getStoreddata();

    sd.remove(CRATE_PERSONAL_KEY);
    sd.remove(CRATE_FREIGHT_KEY);
    sd.remove(CRATE_BULK_KEY);
    sd.remove(BARREL_STANDARD_KEY);
    sd.remove(MARKET_KEY);
    sd.remove(JOB_KEY);

    tellPlayer(player, "&a[Admin] Cleared the current configuration for this Market NPC.");
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
        var definition = admin_config_items[key];
        var itemStack = player.getWorld().createItem(definition.id, 0, 1);

        itemStack.setCustomName(ccs(definition.name));
        itemStack.setLore([ccs(definition.description)]);
        player.giveItem(itemStack);
    }
}

function showCurrentConfiguration(npc, player) {
    var sd = npc.getStoreddata();

    tellPlayer(player, "&6[Admin] &eCurrent Market NPC configuration:");

    for (var key in admin_config_items) {
        var value = "&cNot set";

        if (sd.has(key)) {
            value = String(sd.get(key));

            if (key === JOB_KEY) {
                var job = findJobOrTagById(value);
                if (job) {
                    value = job.title + " &7(ID: " + job.id + ")";
                }
            } else if (
                key === CRATE_PERSONAL_KEY
                || key === CRATE_FREIGHT_KEY
                || key === CRATE_BULK_KEY
                || key === BARREL_STANDARD_KEY
            ) {
                value = Number(value) === 1 ? "&aEnabled" : "&cDisabled";
            }
        }

        tellPlayer(player, "&7- " + admin_config_items[key].name + "&7: &e" + value);
    }
}

function showAdminConfigurationHelp(npc, player) {
    var tutorialText = [
        "&6[Admin] &eMarket NPC Configuration",
        "&7Use the following admin items on this NPC to configure its behavior:",
        "&7Use a &fminecraft:barrier &7to clear the current configuration.",
        "",
        "&e- &f" + admin_config_items[CRATE_PERSONAL_KEY].id + " &7→ " + admin_config_items[CRATE_PERSONAL_KEY].name,
        "  " + admin_config_items[CRATE_PERSONAL_KEY].description,
        "",
        "&e- &f" + admin_config_items[CRATE_FREIGHT_KEY].id + " &7→ " + admin_config_items[CRATE_FREIGHT_KEY].name,
        "  " + admin_config_items[CRATE_FREIGHT_KEY].description,
        "",
        "&e- &f" + admin_config_items[CRATE_BULK_KEY].id + " &7→ " + admin_config_items[CRATE_BULK_KEY].name,
        "  " + admin_config_items[CRATE_BULK_KEY].description,
        "",
        "&e- &f" + admin_config_items[BARREL_STANDARD_KEY].id + " &7→ " + admin_config_items[BARREL_STANDARD_KEY].name,
        "  " + admin_config_items[BARREL_STANDARD_KEY].description,
        "",
        "&e- &f" + admin_config_items[MARKET_KEY].id + " &7→ " + admin_config_items[MARKET_KEY].name,
        "  " + admin_config_items[MARKET_KEY].description,
        "",
        "&e- &f" + admin_config_items[JOB_KEY].id + " &7→ " + admin_config_items[JOB_KEY].name,
        "  " + admin_config_items[JOB_KEY].description
    ];

    storytellPlayer(player, tutorialText);
}

/* -------------------------------------------------------------------------- */
/* Container configuration                                                     */
/* -------------------------------------------------------------------------- */

function getContainerTierDefinition(typeKey, tierKey) {
    if (!containerConfig
        || !containerConfig.container_types
        || !containerConfig.container_types[typeKey]
        || !containerConfig.container_types[typeKey].tiers) {
        return null;
    }

    return containerConfig.container_types[typeKey].tiers[tierKey] || null;
}

function findHeldContainer(item) {
    if (!item || item.isEmpty()) {
        return null;
    }

    var itemId = item.getName();
    var configuredTiers = [
        { type: "crate", tier: "personal", storedKey: CRATE_PERSONAL_KEY },
        { type: "crate", tier: "freight", storedKey: CRATE_FREIGHT_KEY },
        { type: "crate", tier: "bulk", storedKey: CRATE_BULK_KEY },
        { type: "barrel", tier: "standard", storedKey: BARREL_STANDARD_KEY }
    ];

    for (var i = 0; i < configuredTiers.length; i++) {
        var candidate = configuredTiers[i];
        var tierDefinition = getContainerTierDefinition(candidate.type, candidate.tier);

        if (!tierDefinition || !tierDefinition.items) {
            continue;
        }

        if (tierDefinition.items.indexOf(itemId) !== -1) {
            return {
                type: candidate.type,
                tier: candidate.tier,
                storedKey: candidate.storedKey,
                displayName: tierDefinition.display_name || candidate.tier,
                itemId: itemId
            };
        }
    }

    return null;
}

function npcAcceptsContainer(containerInfo) {
    if (!containerInfo) {
        return false;
    }

    var sd = npc.getStoreddata();
    return sd.has(containerInfo.storedKey)
        && Number(sd.get(containerInfo.storedKey)) === 1;
}

function getEnabledContainerDescription() {
    var sd = npc.getStoreddata();
    var enabled = [];

    if (sd.has(CRATE_PERSONAL_KEY) && Number(sd.get(CRATE_PERSONAL_KEY)) === 1) {
        enabled.push("personal containers");
    }
    if (sd.has(CRATE_FREIGHT_KEY) && Number(sd.get(CRATE_FREIGHT_KEY)) === 1) {
        enabled.push("freight crates");
    }
    if (sd.has(CRATE_BULK_KEY) && Number(sd.get(CRATE_BULK_KEY)) === 1) {
        enabled.push("bulk storage");
    }
    if (sd.has(BARREL_STANDARD_KEY) && Number(sd.get(BARREL_STANDARD_KEY)) === 1) {
        enabled.push("standard barrels");
    }

    if (enabled.length === 0) {
        return "no delivery containers";
    }

    return enabled.join(", ");
}

/* -------------------------------------------------------------------------- */
/* Delivery processing                                                         */
/* -------------------------------------------------------------------------- */

function processPlayerDelivery(player, item) {
    if (!item || item.isEmpty()) {
        npc.say(ccs("&ePlease bring your delivery in an accepted container."));
        return;
    }

    var containerInfo = findHeldContainer(item);

    if (!containerInfo) {
        npc.say(ccs("&eI cannot accept that container. I currently take " + getEnabledContainerDescription() + "."));
        return;
    }

    if (!npcAcceptsContainer(containerInfo)) {
        npc.say(ccs("&eThis counter is not equipped to handle " + containerInfo.displayName + "."));
        return;
    }

    if (containerInfo.type === "crate") {
        processCrateDelivery(player, item);
        return;
    }

    if (containerInfo.type === "barrel") {
        processBarrelDelivery(player, item);
        return;
    }

    npc.say(ccs("&cThat delivery container type is not supported."));
}

function processCrateDelivery(player, item) {
    npc.say(ccs("&eLet me see what you have in that container..."));

    var delivery = readCrateDelivery(item, item.getStackSize());

    if (Object.keys(delivery).length === 0) {
        npc.say(ccs("&eThis container does not hold anything I can purchase."));
        return;
    }

    if (activeMarketName.toLowerCase().indexOf("lumber") !== -1) {
        grantBadgeAndEmotes(
            player,
            "Lumberjack",
            ["mossy_log", "log", "log2", "wood", "wooden_axe", "stone_axe"]
        );
    }

    completeDelivery(player, item, delivery, "crate");
}

function processBarrelDelivery(player, item) {
    npc.say(ccs("&eLet me inspect the contents of that barrel..."));

    var delivery = readBarrelDelivery(item);

    if (Object.keys(delivery).length === 0) {
        npc.say(ccs("&eThis barrel does not contain a fluid I can purchase."));
        return;
    }

    completeDelivery(player, item, delivery, "barrel");
}

function completeDelivery(player, item, delivery, containerType) {
    var totalEarnings = calculateEarnings(player, delivery);

    addSpyData({
        "date": new Date().toLocaleString(),
        "delivery": delivery,
        "totalEarnings": totalEarnings
    }, player);

    updateMarketPrices(delivery);

    if (containerType === "crate") {
        clearCrate(item, delivery);
    } else if (containerType === "barrel") {
        clearBarrel(item, delivery);
    }

    generateMoneyForPlayer(player.getWorld(), totalEarnings, player);
}

/* -------------------------------------------------------------------------- */
/* Earnings                                                                    */
/* -------------------------------------------------------------------------- */

function calculateEarnings(player, delivery) {
    var totalEarnings = 0;
    var earningsMultiplier = 1;
    var modifierBonus = 1;
    var varietyBonus = Number(activeMarketConfig.variety_bonus || 0);

    if (delivery.generic) {
        for (var genericItem in delivery.generic) {
            totalEarnings += calculateGenericEarnings(delivery.generic[genericItem], genericItem);
            earningsMultiplier += varietyBonus;
        }
    }

    if (delivery.ageable_booze) {
        for (var boozeItem in delivery.ageable_booze) {
            totalEarnings += calculateAgeableBoozeEarnings(delivery.ageable_booze[boozeItem], boozeItem);
            earningsMultiplier += varietyBonus;
        }
    }

    if (delivery.fluid) {
        for (var fluid in delivery.fluid) {
            if (activeMarketData[fluid]) {
                totalEarnings += delivery.fluid[fluid].count * activeMarketData[fluid].current_price;
                earningsMultiplier += varietyBonus;
            }
        }
    }

    if (player_has_passive_modifier_with_tag(player, "stock_income")) {
        modifierBonus = get_passive_multiplier_for_tag(player, "stock_income");

        tellPlayer(
            player,
            "§a:sun: Your passive modifier increases your market delivery earnings by §e"
            + ((modifierBonus - 1) * 100).toFixed(2)
            + "%§a!"
        );
    }

    return Math.round(totalEarnings * earningsMultiplier * modifierBonus);
}

function calculateGenericEarnings(deliveryItem, itemKey) {
    if (!activeMarketData[itemKey]) {
        return 0;
    }

    return Number(deliveryItem.count) * Number(activeMarketData[itemKey].current_price);
}

function calculateAgeableBoozeEarnings(deliveryItem, itemKey) {
    var genericKey = itemKey.split(":").slice(0, 3).join(":");

    if (!activeMarketData[genericKey]) {
        return 0;
    }

    var stackValue = Number(activeMarketData[genericKey].current_price);
    var age = Number(deliveryItem.extra_data.Age || 0);
    var domain = deliveryItem.extra_data.Domain;

    // 8,640,000 ticks = one Minecraft year.
    // The historical implementation adds 4,000 currency subunits per year.
    stackValue += (age / 8640000) * 4000;
    stackValue *= getDomainMultiplier(domain);
    stackValue *= Number(deliveryItem.count);

    return Math.max(0, stackValue);
}

/* -------------------------------------------------------------------------- */
/* Container readers                                                           */
/* -------------------------------------------------------------------------- */

function readCrateDelivery(item, stackSize) {
    var delivery = {};
    var inventoryCompound = item.getNbt().getCompound("inventory");
    var items = inventoryCompound.getList("Items", 10);

    for (var i = 0; i < items.length; i++) {
        var itemId = items[i].getString("id");
        var itemDamage = items[i].getShort("Damage");
        var itemCount = items[i].getByte("Count");
        var key = itemId + ":" + itemDamage;
        var totalCount = itemCount * stackSize;
        var marketEntry = activeMarketData[key];

        if (!marketEntry) {
            continue;
        }

        if (marketEntry.type === "ageable_booze") {
            if (marketEntry.expects_tag === true) {
                var requiredTag = items[i].getCompound("tag");

                if (!requiredTag || requiredTag.toJsonString() === "{}") {
                    continue;
                }
            }

            var boozeInfo = readAgeableBooze(items[i]);

            if (!boozeInfo) {
                continue;
            }

            if (!delivery.ageable_booze) {
                delivery.ageable_booze = {};
            }

            if (!delivery.ageable_booze[boozeInfo.key]) {
                delivery.ageable_booze[boozeInfo.key] = {
                    "count": totalCount,
                    "extra_data": boozeInfo.data
                };
            } else {
                delivery.ageable_booze[boozeInfo.key].count += totalCount;
            }

            continue;
        }

        if (!delivery.generic) {
            delivery.generic = {};
        }

        if (!delivery.generic[key]) {
            delivery.generic[key] = { "count": totalCount };
        } else {
            delivery.generic[key].count += totalCount;
        }
    }

    return delivery;
}

function readBarrelDelivery(item) {
    var tankData = item.getNbt().getCompound("tank");
    var fluidLevel = Number(tankData.getDouble("fluidLevel"));
    var currentFluid = String(tankData.getString("currentFluid"));

    if (fluidLevel <= 0 || !currentFluid) {
        return {};
    }

    var fluidKey = "liquid:" + currentFluid;

    if (!activeMarketData[fluidKey]) {
        return {};
    }

    var quantity = (fluidLevel / 1000) * item.getStackSize();
    var delivery = { "fluid": {} };

    delivery.fluid[fluidKey] = {
        "count": quantity
    };

    npc.say(
        ccs(
            "&aYou have sold &e" + quantity
            + " bucket(s) of "
            + (activeMarketData[fluidKey].display_name || currentFluid)
            + "&a."
        )
    );

    return delivery;
}

/* -------------------------------------------------------------------------- */
/* Market evolution                                                            */
/* -------------------------------------------------------------------------- */

function updateMarketPrices(delivery) {
    var currentTime = world.getTotalTime();
    var flexibility = Number(activeMarketConfig.stock_flexibility || 0);

    for (var deliveryType in delivery) {
        if (deliveryType === "generic" || deliveryType === "fluid") {
            updateStandardMarketEntries(delivery[deliveryType], currentTime, flexibility);
        } else if (deliveryType === "ageable_booze") {
            updateAgeableBoozeEntries(delivery[deliveryType], currentTime, flexibility);
        }
    }

    saveActiveMarketData();
}

function updateStandardMarketEntries(entries, currentTime, flexibility) {
    for (var itemKey in entries) {
        var marketEntry = activeMarketData[itemKey];

        if (!marketEntry) {
            continue;
        }

        var deliveredCount = Number(entries[itemKey].count);
        var quantityFactor = Math.max(1, Number(marketEntry.quantity_factor || 1));
        var proportion = deliveredCount / quantityFactor;
        var priceEvolution = proportion * PRICE_EVOLUTION_FACTOR;
        var newPrice = Number(marketEntry.current_price) * (1 - (priceEvolution * flexibility));

        marketEntry.quantity_sold = Number(marketEntry.quantity_sold || 0) + deliveredCount;
        marketEntry.last_sold_time = currentTime;
        marketEntry.current_price = clampRoundedPrice(
            newPrice,
            marketEntry.min_price,
            marketEntry.max_price
        );
    }
}

function updateAgeableBoozeEntries(entries, currentTime, flexibility) {
    var domainsData = loadJson(DOMAIN_FILE_PATH);

    for (var itemKey in entries) {
        var deliveryEntry = entries[itemKey];
        var genericId = itemKey.split(":").slice(0, 3).join(":");
        var marketEntry = activeMarketData[genericId];

        if (!marketEntry) {
            continue;
        }

        var quantityDelivered = Number(deliveryEntry.count);
        var quantityFactor = Math.max(1, Number(marketEntry.quantity_factor || 1));
        var priceEvolution = (quantityDelivered / quantityFactor) * PRICE_EVOLUTION_FACTOR;
        var newPrice = Number(marketEntry.current_price) * (1 - (priceEvolution * flexibility));

        marketEntry.quantity_sold = Number(marketEntry.quantity_sold || 0) + quantityDelivered;
        marketEntry.last_sold_time = currentTime;
        marketEntry.current_price = clampRoundedPrice(
            newPrice,
            marketEntry.min_price,
            marketEntry.max_price
        );

        registerDomainBottleVariety(
            domainsData,
            deliveryEntry.extra_data.Domain,
            genericId
        );
    }

    if (domainsData) {
        saveJson(domainsData, DOMAIN_FILE_PATH);
    }
}

function clampRoundedPrice(value, minimum, maximum) {
    var rounded = Math.round(value);
    var min = Number(minimum);
    var max = Number(maximum);

    if (!isNaN(min)) {
        rounded = Math.max(rounded, min);
    }

    if (!isNaN(max)) {
        rounded = Math.min(rounded, max);
    }

    return rounded;
}

function saveActiveMarketData() {
    var allMarketData = loadJson(MARKET_DATA);

    if (!allMarketData) {
        allMarketData = {};
    }

    allMarketData[activeMarketName] = activeMarketData;
    saveJson(allMarketData, MARKET_DATA);
}

/* -------------------------------------------------------------------------- */
/* Clearing containers                                                         */
/* -------------------------------------------------------------------------- */

function clearCrate(item, delivery) {
    var inventoryCompound = item.getNbt().getCompound("inventory");
    var inventory = inventoryCompound.getList("Items", 10);

    for (var i = 0; i < inventory.length; i++) {
        var itemId = inventory[i].getString("id");
        var itemDamage = inventory[i].getShort("Damage");
        var genericKey = itemId + ":" + itemDamage;
        var shouldRemove = false;

        if (delivery.generic && delivery.generic[genericKey]) {
            shouldRemove = true;
        }

        if (!shouldRemove && delivery.ageable_booze) {
            for (var specialKey in delivery.ageable_booze) {
                if (specialKey.indexOf(genericKey + ":") === 0) {
                    shouldRemove = true;
                    break;
                }
            }
        }

        if (shouldRemove) {
            inventory[i].setByte("Count", 0);
        }
    }

    var remaining = [];

    for (var j = 0; j < inventory.length; j++) {
        if (inventory[j].getByte("Count") > 0) {
            remaining.push(inventory[j]);
        }
    }

    inventoryCompound.setList("Items", remaining);
}

function clearBarrel(item, delivery) {
    if (!delivery.fluid) {
        return;
    }

    var tankData = item.getNbt().getCompound("tank");
    var currentFluid = String(tankData.getString("currentFluid"));
    var fluidKey = "liquid:" + currentFluid;

    if (delivery.fluid[fluidKey]) {
        tankData.setDouble("fluidLevel", 0);
        tankData.setString("currentFluid", "");
    }
}

/* -------------------------------------------------------------------------- */
/* Wine/domain handling                                                        */
/* -------------------------------------------------------------------------- */

function readAgeableBooze(itemData) {
    var itemId = itemData.getString("id");
    var itemDamage = itemData.getShort("Damage");
    var itemTag = itemData.getCompound("tag");

    if (!itemTag || itemTag.toJsonString() === "{}") {
        return null;
    }

    var displayTag = itemTag.getCompound("display");

    if (!displayTag || displayTag.toJsonString() === "{}") {
        return null;
    }

    var lore = displayTag.getList("Lore", 8);

    if (!lore || lore.length === 0) {
        return null;
    }

    var data = {};

    for (var i = 0; i < lore.length; i++) {
        var loreLine = String(lore[i]);

        if (loreLine.indexOf("Age (in ticks):") !== -1) {
            data.Age = parseInt(loreLine.replace("Age (in ticks):", "").trim(), 10);
        } else if (loreLine.indexOf("Domain:") !== -1) {
            data.Domain = loreLine.replace("Domain:", "").trim();
        }
    }

    if (!data.Domain || isNaN(data.Age)) {
        return null;
    }

    return {
        "key": itemId + ":" + itemDamage + ":" + data.Domain + ":" + data.Age,
        "type": "ageable_booze",
        "data": data
    };
}

function getDomainMultiplier(domainName) {
    if (!domainName) {
        return 1;
    }

    var domainsData = loadJson(DOMAIN_FILE_PATH);

    if (!domainsData || !domainsData.domains) {
        return 1;
    }

    for (var domainKey in domainsData.domains) {
        var domain = domainsData.domains[domainKey];

        if (domain.display_name === domainName) {
            domain.last_sale_date = world.getTotalTime();
            saveJson(domainsData, DOMAIN_FILE_PATH);
            return 1 + (Number(domain.reputation || 0) / 10);
        }
    }

    return 1;
}

function registerDomainBottleVariety(domainsData, domainName, bottleId) {
    if (!domainsData || !domainsData.domains || !domainName) {
        return;
    }

    for (var domainKey in domainsData.domains) {
        var domain = domainsData.domains[domainKey];

        if (domain.display_name !== domainName) {
            continue;
        }

        if (!domain.bottle_variety) {
            domain.bottle_variety = [];
        }

        if (domain.bottle_variety.indexOf(bottleId) === -1) {
            domain.bottle_variety.push(bottleId);
        }

        return;
    }
}

/* -------------------------------------------------------------------------- */
/* Logging and payment                                                         */
/* -------------------------------------------------------------------------- */

function addSpyData(data, player) {
    var playerName = player.getName();
    var totalItemCount = 0;
    var deliveryTypeCount = 0;

    for (var deliveryType in data.delivery) {
        var keys = Object.keys(data.delivery[deliveryType]);
        deliveryTypeCount += keys.length;

        for (var i = 0; i < keys.length; i++) {
            totalItemCount += Number(data.delivery[deliveryType][keys[i]].count || 0);
        }
    }

    var logEntry = {
        "date": new Date().toLocaleString(),
        "market": activeMarketName,
        "delivery": data.delivery,
        "totalEarnings": data.totalEarnings
    };

    var logLine = playerName
        + " sold " + totalItemCount
        + " units across " + deliveryTypeCount
        + " product types to " + activeMarketName
        + " for " + getAmountCoin(data.totalEarnings);

    logToJson("economy", playerName, logEntry);
    logToFile("economy", logLine);
}

function generateMoneyForPlayer(world, totalCents, player) {
    var moneyItems = generateMoney(world, totalCents);

    for (var i = 0; i < moneyItems.length; i++) {
        player.dropItem(moneyItems[i]);
    }

    tellPlayer(
        player,
        "&aYou received your payment! Total: &r:money:&e"
        + getAmountCoin(totalCents)
    );
}
