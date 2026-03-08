load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");

var TIP_CONFIG = loadJson("world/customnpcs/scripts/ecmascript/modules/dailyTip/tip_config.json");
var DAILY_TIP_TIMER_ID = 91;
var DAILY_TIP_DELAY_TICKS = 20 * 60;

function login(event) {
    var timers = event.player.getTimers();
    if (timers.has(DAILY_TIP_TIMER_ID)) {
        timers.stop(DAILY_TIP_TIMER_ID);
    }
    timers.start(DAILY_TIP_TIMER_ID, DAILY_TIP_DELAY_TICKS, false);
}

function timer(event) {
    if (event.id != DAILY_TIP_TIMER_ID) {
        return;
    }

    var player = event.player;
    var tip = getTip(player);
    if (tip) {
        tellPlayer(player, ":lit:&eToday's tip: &r" + tip.display);
        if (tip.description) {
            tellPlayer(player, "&7:arrow_r: &r" + tip.description);
        }
    }
}

function getTip(player, attempts) {
    // get a random element from "tip_types" array
    var tipType = pickFromArray(TIP_CONFIG.tip_types);

    // tellPlayer(player, ":lit:&eToday's tip type: &r" + tipType);

    var tip = null;

    switch (tipType) {
        case "features":
            tip = getFeatureTip(player);
            break;
        case "quests":
            tip = getQuestTip(player);
            break;
        default:
            return null;
    }

    if (checkTipValidity(player, tip)) {
        return tip;
    } else {
        if (!attempts) {
            attempts = 0;
        }
        if (attempts < 5) {
            return getTip(player, attempts + 1);
        } else {
            // tellPlayer(player, ":lit:&cCouldn't find a valid tip after 5 attempts. Please try again later.");
            return null;
        }
    }
}

function getFeatureTip(player) {
    var feature = pickFromArray(TIP_CONFIG.features);
    // tellPlayer(player, ":lit:&eToday's tip feature: &r" + feature.name);
    return feature;
}
function getQuestTip(player) {
    var quest = pickFromArray(TIP_CONFIG.quests);
    // tellPlayer(player, ":lit:&eToday's tip quest: &r" + quest.name);
    return quest;
}


function checkTipValidity(player, tip) {
    // If player offhand is sagull id card
    if (player.getOffhandItem().getName() == "mts:ivv.idcard_seagull") {
        return true;
    }
    for (var i = 0; i < tip.requirements.length; i++) {
        var requirement = tip.requirements[i];
        if (!checkRequirement(player, requirement)) {
            return false;
        }
    }
    return true;
}

function checkRequirement(player, requirement) {
    // tellPlayer(player, ":lit:&eChecking requirement: &r" + requirement.type);
    switch (requirement.type) {
        case "money_cents":
            if (requirement.min) {
                if (getMoneyInPouch(player) < requirement.min) {
                    return false;
                }
            }
            if (requirement.max) {
                if (getMoneyInPouch(player) > requirement.max) {
                    return false;
                }
            }
            break;
        case "factions":
            if (requirement.min) {
                if (player.getFactionPoints(requirement.id) < requirement.min) {
                    return false;
                }
            }
            if (requirement.max) {
                if (player.getFactionPoints(requirement.id) > requirement.max) {
                    return false;
                }
            }
            break;
        case "quests_completed":
            return player.hasFinishedQuest(requirement.id);
        case "quests_uncompleted":
            return !player.hasFinishedQuest(requirement.id);
        default:
            return true;
    }
}