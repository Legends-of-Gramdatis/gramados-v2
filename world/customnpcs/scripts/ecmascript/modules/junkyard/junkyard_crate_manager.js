load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_jobs.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_region_gadgets.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_date.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_tracking.js");

var config = loadJson("world/customnpcs/scripts/ecmascript/modules/junkyard/config.json") || {};

var CROWBAR_PRICE_CENTS = config.CROWBAR_PRICE_CENTS;

var CROWBAR_INTERVAL_MINUTES = config.CROWBAR_INTERVAL_MINUTES;
var CROWBAR_MIN_INTERVAL_MINUTES = config.CROWBAR_MIN_INTERVAL_MINUTES;

var CROWBAR_MAX_AVAILABLE = config.CROWBAR_MAX_AVAILABLE;
var CROWBAR_MAX_PURCHASE = config.CROWBAR_MAX_PURCHASE;

var CROWBAR_GARAGE_VALUE_THRESHOLD_CENTS = config.CROWBAR_GARAGE_VALUE_THRESHOLD_CENTS;
var CROWBAR_GARAGE_VALUE_STEP_CENTS = config.CROWBAR_GARAGE_VALUE_STEP_CENTS;
var CROWBAR_INTERVAL_REDUCTION_PER_STEP_MINUTES = config.CROWBAR_INTERVAL_REDUCTION_PER_STEP_MINUTES;

var CROWBAR_TRACKING_TAG = "junkyard_crowbars";
var CROWBAR_DATA_PATH = "world/customnpcs/scripts/data_auto/junkyard_crowbars.json";

var MECHANIC_JOB_ID = 66;


function interact(event) {
    var npc = event.npc;
    var player = event.player;
    var world = npc.getWorld();
    var playerName = player.getName();

    // Require Mechanic job
    if (!playerHasJobWithTag(player, "Mechanic")) {
        npc.say("§fThis stall is guild stock only. Get yourself signed in with the §6Mechanics' Union§f, then we talk tools.");
        return;
    }

    var crowbarData = ensureCrowbarTracking(player);
    var intervalMinutes = crowbarData.IntervalMinutes;

    var mainhand = player.getMainhandItem();

    // === Phone check
    if (
        !mainhand.isEmpty() &&
        isItemInLootTable(
            "world/loot_tables/" + _LOOTTABLE_CELLPHONES,
            mainhand.getName()
        )
    ) {
        displayCrowbarPhoneData(player, intervalMinutes);
        return;
    }

    var availableCrowbars = getAvailableCrowbars(player, intervalMinutes);

    // === Nothing available yet
    if (availableCrowbars <= 0) {
        var timeLeft = getTimeUntilNextCrowbar(player, intervalMinutes);
        var ticksLeft = Math.floor(timeLeft / 50);

        npc.say(
            "§fNothing cleared yet. Your next crowbar comes through in §e" +
            TicksToHumanReadable(ticksLeft, true) +
            "§f."
        );
        return;
    }

    // === Player isn't holding the correct bill
    if (
        mainhand.isEmpty() ||
        getItemMoney(mainhand, world) != CROWBAR_PRICE_CENTS
    ) {
        npc.say(
            "§fI've got §e" +
            availableCrowbars +
            "§f crowbar" +
            (availableCrowbars == 1 ? "" : "s") +
            " cleared for you."
        );

        npc.say(
            "§fThey're §6" +
            getAmountCoin(CROWBAR_PRICE_CENTS) +
            " each§f. Hold §6500G bills§f in your hand — one bill for each crowbar you want."
        );

        npc.say(
            "§8Whatever allocation you don't collect is cleared when the deal goes through."
        );
        return;
    }

    // === Determine purchase amount
    var heldBills = mainhand.getStackSize();

    var purchaseAmount = Math.min(
        availableCrowbars,
        heldBills,
        CROWBAR_MAX_PURCHASE
    );

    if (purchaseAmount <= 0) {
        return;
    }

    // === Consume only the bills actually used
    consumeMainhandItems(player, world, purchaseAmount);

    // === Give crowbars
    var loot = pullLootTable(_LOOTTABLE_JUNKYARD_CRATE_CROWBAR, player);
    var crowbar = setupCrowbarNameLore(loot[0], world);

    crowbar.setStackSize(purchaseAmount);
    player.giveItem(crowbar);

    var forfeitedCrowbars = availableCrowbars - purchaseAmount;

    npc.say(
        "§fDeal made. §6" +
        purchaseAmount +
        " crowbar" +
        (purchaseAmount == 1 ? "" : "s") +
        "§f."
    );

    if (forfeitedCrowbars > 0) {
        npc.say(
            "§8The remaining " +
            forfeitedCrowbars +
            " crowbar" +
            (forfeitedCrowbars == 1 ? "" : "s") +
            " from this allocation have been cleared."
        );
    }

    logToFile(
        "mechanics",
        playerName +
        " purchased " +
        purchaseAmount +
        " Junkyard Crate Crowbar(s) for " +
        getAmountCoin(CROWBAR_PRICE_CENTS * purchaseAmount) +
        " (" +
        forfeitedCrowbars +
        " allocation forfeited)"
    );

    // === Successful collection clears all accumulated online time
    resetTimeTracking(player, CROWBAR_TRACKING_TAG);

    // === Snapshot the player's CURRENT garage value for the NEXT period
    var newIntervalMinutes = getAdjustedCrowbarIntervalMinutes(player);
    setCrowbarInterval(player, newIntervalMinutes);
}


/**
 * Ensures that the player has a Junkyard crowbar tracker.
 *
 * If this is a brand-new tracker, the current garage rate is snapshotted.
 * Existing periods keep their previously snapshotted rate.
 *
 * @param {IPlayer} player
 * @returns {Object} Player crowbar period data.
 */
function ensureCrowbarTracking(player) {
    var trackedTime = getTrackedTime(player, CROWBAR_TRACKING_TAG);
    var isNewTracker = trackedTime < 0;

    if (isNewTracker) {
        startTimeTracking(player, CROWBAR_TRACKING_TAG);
    } else if (!isTimeTracking(player, CROWBAR_TRACKING_TAG)) {
        startTimeTracking(player, CROWBAR_TRACKING_TAG);
    }

    var data = loadCrowbarData();
    var uuid = player.getUUID();

    if (!data[uuid]) {
        data[uuid] = {
            Name: player.getName(),
            IntervalMinutes: getAdjustedCrowbarIntervalMinutes(player)
        };

        saveJson(data, CROWBAR_DATA_PATH);
    } else {
        data[uuid].Name = player.getName();

        // If the tracker itself was recreated, this is a new allocation period.
        if (isNewTracker || data[uuid].IntervalMinutes === undefined) {
            data[uuid].IntervalMinutes = getAdjustedCrowbarIntervalMinutes(player);
        }

        saveJson(data, CROWBAR_DATA_PATH);
    }

    return data[uuid];
}


/**
 * Gets how many crowbars are currently available.
 *
 * Availability is capped at 100, even though at most 64 may be
 * purchased during a single collection.
 *
 * @param {IPlayer} player
 * @param {number} intervalMinutes
 * @returns {number}
 */
function getAvailableCrowbars(player, intervalMinutes) {
    var trackedTime = getTrackedTime(player, CROWBAR_TRACKING_TAG);

    if (trackedTime < 0) {
        return 0;
    }

    var intervalMs = intervalMinutes * 60 * 1000;

    return Math.min(
        CROWBAR_MAX_AVAILABLE,
        Math.floor(trackedTime / intervalMs)
    );
}


/**
 * Returns time remaining before the next crowbar is earned.
 *
 * @param {IPlayer} player
 * @param {number} intervalMinutes
 * @returns {number} Milliseconds remaining.
 */
function getTimeUntilNextCrowbar(player, intervalMinutes) {
    var trackedTime = getTrackedTime(player, CROWBAR_TRACKING_TAG);

    if (trackedTime < 0) {
        return intervalMinutes * 60 * 1000;
    }

    var intervalMs = intervalMinutes * 60 * 1000;
    var remainder = trackedTime % intervalMs;

    return intervalMs - remainder;
}


/**
 * Displays Junkyard allocation information while holding a phone.
 *
 * @param {IPlayer} player
 * @param {number} intervalMinutes
 */
function displayCrowbarPhoneData(player, intervalMinutes) {
    var trackedTime = getTrackedTime(player, CROWBAR_TRACKING_TAG);
    var availableCrowbars = getAvailableCrowbars(player, intervalMinutes);

    var trackedTicks = Math.floor(trackedTime / 50);

    tellPlayer(player, "&6&lJunkyard Crowbar Allocation");
    tellPlayer(
        player,
        "&7Online time credited: &f" +
        TicksToHumanReadable(trackedTicks, true)
    );
    tellPlayer(
        player,
        "&7Current rate: &f1 crowbar / " +
        intervalMinutes +
        " minutes"
    );
    tellPlayer(
        player,
        "&7Allocation: &e" +
        availableCrowbars +
        " &7/ &e" +
        CROWBAR_MAX_AVAILABLE
    );

    if (availableCrowbars >= CROWBAR_MAX_AVAILABLE) {
        tellPlayer(player, "&7Next crowbar: &6Allocation capacity reached");
    } else {
        var timeLeft = getTimeUntilNextCrowbar(player, intervalMinutes);
        var ticksLeft = Math.floor(timeLeft / 50);

        tellPlayer(
            player,
            "&7Next crowbar: &f" +
            TicksToHumanReadable(ticksLeft, true)
        );
    }

    tellPlayer(
        player,
        "&7Price: &6" +
        getAmountCoin(CROWBAR_PRICE_CENTS) +
        " &7per crowbar"
    );

    tellPlayer(
        player,
        "&8Hold 500G bills when speaking to the seller to collect."
    );
}


/**
 * Calculates the crowbar interval from the player's Mechanic garage value.
 *
 * Base: 60 minutes.
 * Above 300,000G of garage value, every additional 100,000G
 * reduces the interval by 5 minutes.
 * Minimum: 15 minutes.
 *
 * @param {IPlayer} player
 * @returns {number} Interval in minutes.
 */
function getAdjustedCrowbarIntervalMinutes(player) {
    var grantedReasons = getRegionNameThatGrantedJob(player, MECHANIC_JOB_ID);
    var allRegionPrices = 0;

    for (var i = 0; i < grantedReasons.length; i++) {
        allRegionPrices += getRegionPrice(grantedReasons[i], player);
    }

    var intervalMinutes = CROWBAR_INTERVAL_MINUTES;

    if (allRegionPrices > CROWBAR_GARAGE_VALUE_THRESHOLD_CENTS) {
        var diff =
            allRegionPrices -
            CROWBAR_GARAGE_VALUE_THRESHOLD_CENTS;

        var steps = Math.floor(
            diff / CROWBAR_GARAGE_VALUE_STEP_CENTS
        );

        intervalMinutes -=
            steps * CROWBAR_INTERVAL_REDUCTION_PER_STEP_MINUTES;
    }

    return Math.max(
        CROWBAR_MIN_INTERVAL_MINUTES,
        intervalMinutes
    );
}


/**
 * Stores the snapshotted interval for the player's next allocation period.
 *
 * @param {IPlayer} player
 * @param {number} intervalMinutes
 */
function setCrowbarInterval(player, intervalMinutes) {
    var data = loadCrowbarData();
    var uuid = player.getUUID();

    if (!data[uuid]) {
        data[uuid] = {
            Name: player.getName(),
            IntervalMinutes: intervalMinutes
        };
    } else {
        data[uuid].Name = player.getName();
        data[uuid].IntervalMinutes = intervalMinutes;
    }

    saveJson(data, CROWBAR_DATA_PATH);
}


/**
 * Loads the shared Junkyard crowbar state.
 *
 * @returns {Object}
 */
function loadCrowbarData() {
    if (!checkFileExists(CROWBAR_DATA_PATH)) {
        return {};
    }

    return loadJson(CROWBAR_DATA_PATH) || {};
}


/**
 * Removes items specifically from the player's main hand.
 *
 * @param {IPlayer} player
 * @param {IWorld} world
 * @param {number} amount
 */
function consumeMainhandItems(player, world, amount) {
    var mainhand = player.getMainhandItem();
    var remaining = mainhand.getStackSize() - amount;

    if (remaining <= 0) {
        player.setMainhandItem(
            world.createItem("minecraft:air", 0, 1)
        );
    } else {
        mainhand.setStackSize(remaining);
    }
}


function setupCrowbarNameLore(loot_entry, world) {
    var item = generateItemStackFromLootEntry(loot_entry, world);

    item.setCustomName("§6Junkyard Crate Crowbar");

    item.setLore([
        "§7One-use crowbar to pry open a sealed parts crate.",
        "§8Marked by the Junkyard Authority.",
        "§2§o\"Snap it, loot it, toss it.\""
    ]);

    return item;
}
