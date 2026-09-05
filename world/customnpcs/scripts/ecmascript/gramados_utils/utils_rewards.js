load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");

function _configuredRewardsEnsureCurrencyUtils() {
    if (typeof generateMoney !== "function") {
        load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js");
    }
}

function _configuredRewardsEnsureEmoteUtils() {
    if (typeof grantEmotes !== "function" || typeof grantBadgeAndEmotes !== "function") {
        load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_emotes.js");
    }
}

function _configuredRewardsEnsureLootUtils() {
    if (typeof pullLootTable !== "function"
        || typeof generateItemStackFromLootEntry !== "function"
        || typeof canUseLootTable !== "function") {
        load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js");
    }
}

function _configuredRewardsGiveItem(player, itemStack) {
    if (!itemStack || (typeof itemStack.isEmpty === "function" && itemStack.isEmpty())) {
        return false;
    }

    if (!player.giveItem(itemStack)) {
        player.dropItem(itemStack);
    }
    return true;
}

function _configuredRewardsLog(contextLabel, message) {
    var prefix = contextLabel ? "[Rewards:" + contextLabel + "] " : "[Rewards] ";

    try {
        if (typeof logToFile === "function") {
            logToFile("events", prefix + message);
            return;
        }
    } catch (ignored) {}

    try {
        java.lang.System.out.println(prefix + message);
    } catch (ignored2) {}
}

/**
 * Grants rewards described with the same JSON format used by job milestones.
 *
 * Supported reward types:
 * - money: { Type: "money", Amount: <cents>, Currency?: "money" }
 * - badge: { Type: "badge", Badge: "badge_id" }
 * - emote: { Type: "emote", Emote: "emote_id" }
 * - emotes: { Type: "emotes", Emotes: ["one", "two"] }
 * - loot_table: { Type: "loot_table", LootTable: "path.json", Pulls?: 1 }
 *
 * Returns false when at least one reward could not be delivered. Callers may
 * persist that state and retry later. Badge and emote helpers are idempotent.
 *
 * @param {IPlayer} player
 * @param {Array<Object>} rewards
 * @param {string} [contextLabel]
 * @returns {boolean}
 */
function grantConfiguredRewards(player, rewards, contextLabel) {
    if (!rewards || !rewards.length) return true;

    var allSuccessful = true;

    for (var i = 0; i < rewards.length; i++) {
        var reward = rewards[i];
        if (!reward || !reward.Type) continue;

        try {
            var type = String(reward.Type).toLowerCase();

            if (type === "money") {
                _configuredRewardsEnsureCurrencyUtils();
                var amount = Number(reward.Amount || 0);

                if (amount > 0) {
                    var moneyItems = generateMoney(
                        player.getWorld(),
                        amount,
                        reward.Currency || "money"
                    ) || [];

                    for (var m = 0; m < moneyItems.length; m++) {
                        _configuredRewardsGiveItem(player, moneyItems[m]);
                    }

                    tellPlayer(
                        player,
                        "&a:money: Reward: &e" + getAmountCoin(amount) + "&a."
                    );
                }
            } else if (type === "badge") {
                _configuredRewardsEnsureEmoteUtils();
                if (reward.Badge) {
                    grantBadgeAndEmotes(player, String(reward.Badge), []);
                }
            } else if (type === "emote") {
                _configuredRewardsEnsureEmoteUtils();
                if (reward.Emote) {
                    grantEmotes(player, [String(reward.Emote)]);
                }
            } else if (type === "emotes") {
                _configuredRewardsEnsureEmoteUtils();
                if (reward.Emotes && reward.Emotes.length) {
                    grantEmotes(player, reward.Emotes);
                }
            } else if (type === "loot_table" || type === "loottable") {
                _configuredRewardsEnsureLootUtils();

                var table = reward.LootTable || reward.Table;
                var pulls = Math.max(1, Number(reward.Pulls || 1));

                if (!table) continue;

                if (!canUseLootTable(String(table))) {
                    allSuccessful = false;
                    _configuredRewardsLog(
                        contextLabel,
                        "Loot table is currently unavailable or empty: " + table
                    );
                    continue;
                }

                for (var p = 0; p < pulls; p++) {
                    var loot = pullLootTable(String(table), player);
                    if (loot === null) {
                        allSuccessful = false;
                        break;
                    }

                    for (var l = 0; l < loot.length; l++) {
                        var stack = generateItemStackFromLootEntry(
                            loot[l],
                            player.getWorld()
                        );
                        _configuredRewardsGiveItem(player, stack);
                    }
                }
            } else {
                allSuccessful = false;
                _configuredRewardsLog(
                    contextLabel,
                    "Unknown reward type '" + reward.Type + "'."
                );
            }
        } catch (e) {
            allSuccessful = false;
            _configuredRewardsLog(
                contextLabel,
                "Failed to grant reward: " + e.message
            );
        }
    }

    return allSuccessful;
}
