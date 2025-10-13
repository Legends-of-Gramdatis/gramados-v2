load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");   // for loadJson, saveJson, etc.
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_factions.js"); // for FACTION_ID_CIVILITY constant, etc.

// Define file path constants
var CONFIG_PATH = "world/customnpcs/scripts/ecmascript/modules/foodDonation/config.json";
var STATS_PATH  = "world/customnpcs/scripts/data_auto/food_donation.json";

// Load configuration data (create default file if missing)
if (!checkFileExists(CONFIG_PATH)) {
    // Create an empty config file to prevent errors (admin should fill it)
    createJsonFile(CONFIG_PATH);
    // You might notify admin in-game if needed
}
var configData = loadJson(CONFIG_PATH) || {};
var globalConfig = configData.global || {};
var facilitiesConfig = configData.facilities || {};

// Apply global config with defaults
var MAX_REP_PER_PLAYER = globalConfig.maxReputationPerPlayer || 2000;
var LOW_CIV_THRESHOLD  = globalConfig.lowCivThreshold || 500;
var LOW_CIV_FLOOR_MULT = (globalConfig.lowCivFloorMultiplier !== undefined ? globalConfig.lowCivFloorMultiplier : 0);
var MIN_FOOD_PER_ITEM = (globalConfig.minFoodLevelPerItem !== undefined ? globalConfig.minFoodLevelPerItem : 2);
var FOOD_UNITS_PER_REP = (globalConfig.foodUnitsPerCivilityPoint !== undefined ? globalConfig.foodUnitsPerCivilityPoint : 100);
var MESSAGE_TIERS = globalConfig.messageTiers || [];
var CIVILITY_FACTION_ID = FACTION_ID_CIVILITY || 2;  // default to 2 if constant not loaded

// NPC state variables
var npcObj, worldObj;
var CURRENT_FACILITY = null;  // Name of the facility this NPC is configured for

/**
 * Initialize NPC data on spawn/load.
 */
function init(event) {
    npcObj = event.npc;
    worldObj = npcObj.getWorld();

    // If NPC has a stored facility setting, use it; otherwise default to first configured facility
    var stored = npcObj.getStoreddata();
    var facilityList = Object.keys(facilitiesConfig);
    if (stored.has("facility")) {
        CURRENT_FACILITY = stored.get("facility");
    } else if (facilityList.length > 0) {
        CURRENT_FACILITY = facilityList[0];  // default to first facility in config
        // Inform admin that NPC needs configuration (only visible if they interact before setting)
        npcObj.say("&e[Config] Facility not set. Use your ID card to cycle facility mode. Valid facilities: " + facilityList.join(", "));
        // (Note: We do not store it yet; admin should explicitly set via ID card)
    } else {
        CURRENT_FACILITY = null;
        npcObj.say("&c[Error] No donation facilities configured. Please check config.json.");
    }

    // If a valid facility is set, NPC can announce readiness (optional flavor text)
    if (CURRENT_FACILITY) {
        // npcObj.say("Hello! This donation desk is now operating for " + CURRENT_FACILITY + ". I can accept food crate donations.");
    }
}

/**
 * Handle player-NPC interactions (right-click).
 */
function interact(event) {
    var player = event.player;
    var item = player.getMainhandItem();
    var offItem = player.getOffhandItem();

    // Admin facility cycling via Seagull ID card in offhand
    if (!offItem.isEmpty() && offItem.getName() == "mts:ivv.idcard_seagull") {
        var facilityNames = Object.keys(facilitiesConfig);
        if (facilityNames.length === 0) {
            npcObj.say("No facilities available in config.");
        } else {
            // Determine next facility in list
            var currentIndex = facilityNames.indexOf(CURRENT_FACILITY);
            var nextIndex = (currentIndex + 1) % facilityNames.length;
            CURRENT_FACILITY = facilityNames[nextIndex];
            // Save the new facility setting persistently
            npcObj.getStoreddata().put("facility", CURRENT_FACILITY);
            npcObj.say("&6[Admin] Facility set to: " + CURRENT_FACILITY);
        }
        return;  // Only cycle config, do not process donation in this interaction
    }

    // If not configured or invalid facility, refuse service
    if (!CURRENT_FACILITY || !facilitiesConfig[CURRENT_FACILITY]) {
        npcObj.say("I am not configured to accept donations at the moment.");
        return;
    }

    // Retrieve this facility's config
    var facilityConf = facilitiesConfig[CURRENT_FACILITY];
    var acceptedCrates = facilityConf.acceptedCrates || [];
    var baseMultiplier = facilityConf.baseMultiplier || 1.0;

    // Check if player is holding an acceptable food crate
    if (item.isEmpty() || acceptedCrates.indexOf(item.getName()) === -1) {
        npcObj.say("Hello! I can accept food donations here. Please hold a valid food crate in your hand.");
        return;
    }

    // Process the crate contents for food items
    npcObj.say("Let me see what you have in that crate...");
    var delivery = readCrateContents(item);
    var world = npcObj.getWorld();
    // Build a map of only food items to donate, using itemstack.getFoodLevel()
    var donated = { "generic": {} };
    // Calculate total food value and reputation gain
    var totalFoodValue = 0;
    if (delivery && delivery.generic) {
        for (var key in delivery.generic) {
            if (!delivery.generic.hasOwnProperty(key)) continue;
            var count = delivery.generic[key].count;
            // key format: "modid:item:damage"
            var parts = key.split(":");
            if (parts.length < 3) continue;
            var itemName = parts[0] + ":" + parts[1];
            var dmg = parseInt(parts[2], 10);
            if (isNaN(dmg)) dmg = 0;
            var stack = world.createItem(itemName, dmg, 1);
            var foodVal = 0;
            try {
                foodVal = stack.getFoodLevel();
            } catch (e) {
                foodVal = 0; // if API not present or item isn't food
            }
            if (foodVal >= MIN_FOOD_PER_ITEM) {
                donated.generic[key] = { count: count };
                totalFoodValue += (foodVal * count);
            }
        }
    }
    if (!donated || Object.keys(donated.generic).length === 0) {
        npcObj.say("This crate doesn't contain any qualifying food items I can accept (each item must restore at least " + MIN_FOOD_PER_ITEM + " hunger).");
        return;
    }
    // Convert food units to base Civility rep, then apply base multiplier
    var baseRepGain = (totalFoodValue / FOOD_UNITS_PER_REP) * baseMultiplier;

    // Apply low Civility reputation penalty if applicable
    var currentRep = player.getFactionPoints(CIVILITY_FACTION_ID);
    var repMultiplier = 1.0;
    if (currentRep < LOW_CIV_THRESHOLD) {
        var fraction = (currentRep > 0 ? currentRep / LOW_CIV_THRESHOLD : 0);
        if (fraction < 0) fraction = 0;
        repMultiplier = LOW_CIV_FLOOR_MULT + (fraction * (1 - LOW_CIV_FLOOR_MULT));
        if (repMultiplier < 0) repMultiplier = 0;
    }
    var adjustedRepGain = Math.floor(baseRepGain * repMultiplier);
    if (adjustedRepGain <= 0) {
        npcObj.say("Your donation is appreciated, but it seems you gain no reputation from it right now.");
        return;
    }

    // Enforce cap on total rep gain from donations
    var statsData = checkFileExists(STATS_PATH) ? loadJson(STATS_PATH) : {};
    var playerId = player.getName();
    var playerStats = statsData[playerId] || {};  // per-player record
    // Sum the player's total donated rep across facilities
    var currentDonatedTotal = 0;
    for (var fac in playerStats) {
        currentDonatedTotal += (playerStats[fac] || 0);
    }
    if (currentDonatedTotal >= MAX_REP_PER_PLAYER) {
        npcObj.say("You've already earned the maximum Civility reputation from donations. Thank you, but you can't gain more rep this way.");
        return;
    }
    // Clamp gain if it overshoots the cap
    if (currentDonatedTotal + adjustedRepGain > MAX_REP_PER_PLAYER) {
        adjustedRepGain = MAX_REP_PER_PLAYER - currentDonatedTotal;
    }

    // Award reputation points to player
    player.addFactionPoints(CIVILITY_FACTION_ID, adjustedRepGain);
    // Update stats tracking
    playerStats[CURRENT_FACILITY] = (playerStats[CURRENT_FACILITY] || 0) + adjustedRepGain;
    statsData[playerId] = playerStats;
    saveJson(statsData, STATS_PATH);

    // Remove donated items from the crate (leave any non-food items in place)
    // Remove only the donated (food) items from the crate
    clearCrateItems(item, donated);
    // Notify player of success with a tiered, humane message
    var msg = null;
    if (MESSAGE_TIERS && MESSAGE_TIERS.length > 0) {
        // Sort tiers by minRepGain descending to find the best match
        try {
            MESSAGE_TIERS.sort(function(a,b){ return (b.minRepGain||0) - (a.minRepGain||0); });
            for (var ti = 0; ti < MESSAGE_TIERS.length; ti++) {
                var tier = MESSAGE_TIERS[ti];
                var minRG = tier.minRepGain || 0;
                if (adjustedRepGain >= minRG && tier.messages && tier.messages.length > 0) {
                    msg = tier.messages[Math.floor(Math.random() * tier.messages.length)];
                    break;
                }
            }
        } catch (e) {
            // ignore and fallback
        }
    }
    if (!msg) {
        msg = "&7Thank you for contributing. Your Civility increased by &a" + adjustedRepGain + "&7.";
    }
    npcObj.say(msg);
    if (playerStats[CURRENT_FACILITY] >= MAX_REP_PER_PLAYER || (currentDonatedTotal + adjustedRepGain) >= MAX_REP_PER_PLAYER) {
        npcObj.say("&e(You have reached the maximum Civility reputation from food donations.)");
    }
}

/**
 * Reads the contents of a crate item and returns a delivery object of food items.
 * Similar to stock_exchange_delivery_npc.read_crate_delivery but without stock filtering.
 * @param {IItemStack} crateItem - The crate item stack.
 * @returns {Object} delivery data with structure { generic: { "<modid:item:damage>": { count: totalCount } } }
 */
function readCrateContents(crateItem) {
    var delivery = { "generic": {} };
    var invNbt = crateItem.getNbt().getCompound("inventory");
    if (!invNbt) return delivery;
    var itemsList = invNbt.getList("Items", 10);  // list of item NBT compounds
    for (var i = 0; i < itemsList.length; i++) {
        var itemNbt = itemsList[i];
        var itemId = itemNbt.getString("id");
        var damage = itemNbt.getShort("Damage");
        var countByte = itemNbt.getByte("Count");  // count in this slot
        var stackSize = crateItem.getStackSize();  // number of crates in the stack (usually 1)
        var totalCount = countByte * stackSize;
        var key = itemId + ":" + damage;
        // Determine if item is food: we will later filter by getFoodLevel value > 0
        // (No immediate rejection here; non-food will simply yield 0 foodLevel later.)
        if (!delivery.generic[key]) {
            delivery.generic[key] = { "count": totalCount };
        } else {
            delivery.generic[key].count += totalCount;
        }
    }
    return delivery;
}

/**
 * Removes donated (accepted) items from the crate's inventory, leaving others intact.
 * @param {IItemStack} crateItem - The crate item stack (container).
 * @param {Object} delivery - The delivery data of items to remove (as returned by readCrateContents).
 */
function clearCrateItems(crateItem, delivery) {
    var invNbt = crateItem.getNbt().getCompound("inventory");
    if (!invNbt) return;
    var itemsList = invNbt.getList("Items", 10);
    var newList = [];  // will build a new list of remaining items
    for (var i = 0; i < itemsList.length; i++) {
        var itemNbt = itemsList[i];
        var itemId = itemNbt.getString("id");
        var damage = itemNbt.getShort("Damage");
        var countByte = itemNbt.getByte("Count");
        var key = itemId + ":" + damage;
        var removeCount = 0;
        if (delivery.generic && delivery.generic[key]) {
            // Determine how many were donated from this stack
            removeCount = delivery.generic[key].count;
        }
        if (removeCount >= countByte) {
            // Entire stack donated – do not keep this item
            // (We effectively remove it by not adding to newList)
        } else if (removeCount > 0) {
            // Partially donated – reduce the count and keep the remainder
            var newCount = countByte - removeCount;
            itemNbt.setByte("Count", newCount);
            newList.push(itemNbt);
        } else {
            // Not donated at all – keep item as is
            newList.push(itemNbt);
        }
    }
    // Update crate NBT with remaining items
    invNbt.setList("Items", newList);
}
