 // Phase 2: Economy / Pouch / Currency onboarding
// Stage 1: get your first money (40g), learn about pouch vs inventory, then test !deposit

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');

// Local path used to read onboarding data entries made by other commands
var ONBOARDING_DATA_PATH_LOCAL = 'world/customnpcs/scripts/data_auto/onboarding_data.json';

function onboarding_run_phase2(player, pdata, phaseCfg, globalCfg, allPlayersData) {
    if (!phaseCfg || !phaseCfg.enabled) return false;
    if (!pdata) return false;
    var changed = false;
    if (!pdata.phase2) pdata.phase2 = {};

    var now = Date.now();
    var shortDelayMs = ((globalCfg && globalCfg.general && typeof globalCfg.general.generic_streamline_delay_short === 'number') ? globalCfg.general.generic_streamline_delay_short : 5) * 1000;
    var longDelayMs = ((globalCfg && globalCfg.general && typeof globalCfg.general.generic_streamline_delay_long === 'number') ? globalCfg.general.generic_streamline_delay_long : 20) * 1000;
    var intervalMs = ((globalCfg && globalCfg.general && typeof globalCfg.general.generic_streamline_interval === 'number') ? globalCfg.general.generic_streamline_interval : 60) * 1000;

    // Respect the user's instruction to wait generic_streamline_delay_long after phase1 completed
    var phase1CompletedAt = null;
    if (pdata.phase1) {
        // common completion timestamps used in Phase1
        phase1CompletedAt = pdata.phase1.s4_completedTime || pdata.phase1.homeRegisteredTime || pdata.phase1.completed || pdata.phase1.arrivalTime || null;
        // If boolean true, fallback to time recorded on creation
        if (phase1CompletedAt === true) phase1CompletedAt = pdata.phase1.completedTime || pdata.phase1.arrivalTime || pdata.phase1.created || null;
    }

    // Step 3: after deposit, ask player to run !myMoney again to confirm pouch balance (respect short delay)
    if (pdata.phase2.s3_started && !pdata.phase2.s3_completed) {
        var myMoneyLast2 = null;
        try {
            var od3 = loadJson(ONBOARDING_DATA_PATH_LOCAL) || {};
            var p3 = od3[player.getName()];
            if (p3) {
                if (p3['phase2'] && p3['phase2']['last ran'] && p3['phase2']['last ran'].myMoney) myMoneyLast2 = p3['phase2']['last ran'].myMoney;
                if (!myMoneyLast2 && p3['last ran'] && p3['last ran'].myMoney) myMoneyLast2 = p3['last ran'].myMoney;
                if (!myMoneyLast2 && p3['phase2'] && p3['phase2']['last_ran'] && p3['phase2']['last_ran'].myMoney) myMoneyLast2 = p3['phase2']['last_ran'].myMoney;
            }
        } catch (e7) { myMoneyLast2 = null; }

        // If they ran it after the prompt time, confirm and finish Phase 2
        if (!pdata.phase2.s3_myMoneySeen) {
            if (myMoneyLast2 && pdata.phase2.s3_promptTime && myMoneyLast2 >= pdata.phase2.s3_promptTime) {
                pdata.phase2.s3_myMoneySeen = true;
                pdata.phase2.s3_myMoneySeenAt = myMoneyLast2;
                pdata.phase2.s3_completed = true;
                pdata.phase2.s3_completedAt = Date.now();
                pdata.phase2.completed = true;
                // Phase completion header (three separators); phase name comes from config
                var phaseName = (phaseCfg && phaseCfg.name) ? phaseCfg.name : 'Phase ' + pdata.phase;
                tellSeparator(player, '&f');
                tellSeparatorTitle(player, phaseName, '&2', '&a');
                var s3chat = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                tellPlayer(player, s3chat.s3_completed);
                tellSeparator(player, '&f');
                changed = true;
                logToFile('onboarding', '[phase2-s3] ' + player.getName() + ' confirmed pouch after deposit at ' + myMoneyLast2);
            } else {
                var last3 = pdata.phase2.s3_lastMsg || pdata.phase2.s3_promptTime || 0;
                if ((Date.now() - last3) > intervalMs) {
                    var s3chat = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                    tellPlayer(player, s3chat.s3_reminder);
                    pdata.phase2.s3_lastMsg = Date.now();
                    changed = true;
                }
            }
        }
    }
    // If we have a numeric timestamp, require waiting longDelayMs; else allow immediate start
    if (phase1CompletedAt && typeof phase1CompletedAt === 'number') {
        if ((now - phase1CompletedAt) < longDelayMs) {
            // not yet time to start phase 2
            return false;
        }
    }

    // Stage 1 / Step 1: give starting money then prompt !myMoney
    if (!pdata.phase2.s1_started) {
        pdata.phase2.s1_started = true;
        pdata.phase2.s1_startedAt = Date.now();
        changed = true;
    }

    // Give the 40g if not given yet
    if (!pdata.phase2.s1_given) {
        // 1g = 100 cents -> 40g = 4000
        var cents40g = 40 * 100;
        try {
            var w = player.getWorld();
            var stacks = generateMoney(w, cents40g, "money") || [];
            for (var i = 0; i < stacks.length; i++) {
                try { if (stacks[i]) player.giveItem(stacks[i]); } catch (gi) { player.dropItem(stacks[i]); }
            }
            pdata.phase2.s1_given = true;
            pdata.phase2.s1_givenTime = Date.now();
            // Prompt player to run !myMoney
            // Stage header and grant message (text configurable in onboarding_config.json)
            var s1chat = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
            tellSeparatorTitle(player, 'Currency — Received Money', '&6', '&e');
            tellPlayer(player, s1chat.s1_received);
            pdata.phase2.s1_promptTime = Date.now();
            pdata.phase2.s1_lastMsg = Date.now();
            changed = true;
            logToFile('onboarding', '[phase2-s1] ' + player.getName() + ' granted 40g.');
        } catch (giveErr) {
            logToFile('onboarding', '[phase2-s1-error] failed to grant 40g to ' + player.getName() + ': ' + giveErr);
        }
        return changed;
    }

    // Check whether player ran !myMoney by inspecting onboarding_data.json 'last ran' entry for myMoney
    var onboardingFile = null;
    try { onboardingFile = loadJson(ONBOARDING_DATA_PATH_LOCAL) || {}; } catch (e) { onboardingFile = {}; }
    var myMoneyLastRan = null;
    try {
        var pEntry = onboardingFile[player.getName()];
        if (pEntry) {
            // Some modules store a 'last ran' map under different keys; check a few locations
            if (pEntry['phase2'] && pEntry['phase2']['last ran'] && pEntry['phase2']['last ran'].myMoney) myMoneyLastRan = pEntry['phase2']['last ran'].myMoney;
            if (!myMoneyLastRan && pEntry['last ran'] && pEntry['last ran'].myMoney) myMoneyLastRan = pEntry['last ran'].myMoney;
            if (!myMoneyLastRan && pEntry['phase2'] && pEntry['phase2']['last_ran'] && pEntry['phase2']['last_ran'].myMoney) myMoneyLastRan = pEntry['phase2']['last_ran'].myMoney;
        }
    } catch (e2) { /* ignore */ }

    // If player has not yet run !myMoney since we prompted, remind periodically
    if (!pdata.phase2.s1_myMoneySeen) {
        // If they ran it and it is after the prompt time, proceed to show the currency guide after a short delay
        if (myMoneyLastRan && pdata.phase2.s1_promptTime && myMoneyLastRan >= pdata.phase2.s1_promptTime) {
            pdata.phase2.s1_myMoneySeen = true;
            pdata.phase2.s1_myMoneySeenAt = myMoneyLastRan;
            pdata.phase2.s1_guideAvailableAt = Date.now() + shortDelayMs;
            changed = true;
            logToFile('onboarding', '[phase2-s1] ' + player.getName() + ' ran !myMoney detected at ' + myMoneyLastRan);
        } else {
            // send periodic reminder
            var last = pdata.phase2.s1_lastMsg || pdata.phase2.s1_promptTime || 0;
            if ((Date.now() - last) > intervalMs) {
                var s1chat = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                tellPlayer(player, s1chat.s1_reminder);
                pdata.phase2.s1_lastMsg = Date.now();
                changed = true;
            }
        }
    }

    // When myMoney was seen and guide time passed, first wait short delay then send chat lines and give the detailed explanation item
    if (pdata.phase2.s1_myMoneySeen && !pdata.phase2.s1_guideGiven && pdata.phase2.s1_guideAvailableAt && Date.now() >= pdata.phase2.s1_guideAvailableAt) {
        try {
            // chat messages (configurable)
            try {
                var guideCfg = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.guide) ? phaseCfg.stages.stage1.guide : null;
                if (guideCfg && guideCfg.chat && guideCfg.chat.length) {
                    tellSeparatorTitle(player, 'Currency Guide', '&6', '&e');
                    for (var ci = 0; ci < guideCfg.chat.length; ci++) {
                        tellPlayer(player, guideCfg.chat[ci]);
                    }
                }
            } catch (messErr) { logToFile('onboarding', '[phase2] chat guide send error: ' + messErr); }

            // Now create the paper item with more detailed paragraphs (configurable in onboarding_config.json)
            try {
                var world = player.getWorld();
                var baseNbt = { id: 'minecraft:paper', Count: 1, Damage: 0 };
                var stack = null;
                try { stack = world.createItemFromNbt(API.stringToNbt(JSON.stringify(baseNbt))); } catch (cn) { try { stack = world.createItemFromNbt('{id:"minecraft:paper",Count:1b}'); } catch (cn2) { stack = null; } }
                if (stack && stack.setStackSize) stack.setStackSize(1);
                try { if (stack && stack.setCustomName) stack.setCustomName(parseEmotes(ccs('&6Gramados: Currency Guide'))); } catch (nmEx) {}

                var loreLines = [];
                if (guideCfg && guideCfg.paper && guideCfg.paper.entries) {
                    for (var k in guideCfg.paper.entries) {
                        if (!guideCfg.paper.entries.hasOwnProperty(k)) continue;
                        var text = guideCfg.paper.entries[k] || '';
                        loreLines.push(parseEmotes(ccs('&e' + k)));
                        loreLines.push(parseEmotes(ccs('&7' + text)));
                        loreLines.push('');
                    }
                }
                // Fallback if no configured entries
                if (!loreLines.length) {
                    loreLines.push(parseEmotes(ccs('&eMoney')));
                    loreLines.push(parseEmotes(ccs('&7Your main in-game currency. Use !myMoney to view your pouch, and !deposit to move items into it.')));
                }
                // trim trailing blank
                if (loreLines.length && loreLines[loreLines.length-1] === '') loreLines.pop();
                if (stack && stack.setLore) stack.setLore(loreLines);
                if (stack) {
                    try { player.giveItem(stack); } catch (gErr) { try { player.dropItem(stack); } catch (gErr2) {} }
                }

                pdata.phase2.s1_guideGiven = true;
                pdata.phase2.s1_guideGivenTime = Date.now();
                changed = true;
                tellSeparator(player, '&f');
                var guideChat = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                tellPlayer(player, guideChat.s1_guide_added);
                tellSeparator(player, '&f');
            } catch (createErr) {
                logToFile('onboarding', '[phase2-s1-guide-error-create] ' + player.getName() + ' ' + createErr);
            }
        } catch (e3) {
            logToFile('onboarding', '[phase2-s1-guide-error] ' + player.getName() + ' ' + e3);
        }
    }

    // If guide given, advance to Step 2: deposit flow
    if (pdata.phase2.s1_guideGiven && !pdata.phase2.s2_started) {
        pdata.phase2.s2_started = true;
        pdata.phase2.s2_startedAt = Date.now();
        // Record current pouch amount as baseline
        try {
            var wds = getWorldData();
            var pKey = 'player_' + player.getName();
            var playerStr = wds.get(pKey) || null;
            var pjson = playerStr ? JSON.parse(playerStr) : {};
            var pouchBefore = (typeof pjson.money === 'number') ? pjson.money : (pjson.money ? Number(pjson.money) : 0);
            pdata.phase2.s2_pouchBefore = pouchBefore;
            // Prompt for deposit (message configurable)
            var s1chat = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
            tellSeparatorTitle(player, 'Deposit', '&b', '&a');
            tellPlayer(player, s1chat.s2_prompt);
            pdata.phase2.s2_promptTime = Date.now();
            pdata.phase2.s2_lastMsg = Date.now();
            changed = true;
        } catch (e4) {
            logToFile('onboarding', '[phase2-s2-error] read pouch failed for ' + player.getName() + ': ' + e4);
        }
        return changed;
    }

    // Step 2: wait for deposit command run; check 'deposit' in 'last ran'
    if (pdata.phase2.s2_started && !pdata.phase2.s2_completed) {
        var depositLastRan = null;
        try {
            var od2 = loadJson(ONBOARDING_DATA_PATH_LOCAL) || {};
            var p2 = od2[player.getName()];
            if (p2) {
                if (p2['phase2'] && p2['phase2']['last ran'] && p2['phase2']['last ran'].deposit) depositLastRan = p2['phase2']['last ran'].deposit;
                if (!depositLastRan && p2['last ran'] && p2['last ran'].deposit) depositLastRan = p2['last ran'].deposit;
            }
        } catch (e5) { depositLastRan = null; }

        // If not run yet, periodic reminder
        if (!depositLastRan || (pdata.phase2.s2_promptTime && depositLastRan < pdata.phase2.s2_promptTime)) {
            var last = pdata.phase2.s2_lastMsg || pdata.phase2.s2_promptTime || 0;
            if ((Date.now() - last) > intervalMs) {
                var s2chat = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                tellPlayer(player, s2chat.s2_prompt);
                pdata.phase2.s2_lastMsg = Date.now();
                changed = true;
            }
            return changed;
        }

        // Deposit command was run; confirm pouch actually changed
        try {
            var wds3 = getWorldData();
            var pKey3 = 'player_' + player.getName();
            var playerStr3 = wds3.get(pKey3) || null;
            var pjson3 = playerStr3 ? JSON.parse(playerStr3) : {};
            var pouchAfter = (typeof pjson3.money === 'number') ? pjson3.money : (pjson3.money ? Number(pjson3.money) : 0);
            var pouchBeforeVal = pdata.phase2.s2_pouchBefore || 0;
            var invMoney = readMoneyFromPlayerInventory(player, player.getWorld()) || 0;

            if (pouchAfter > pouchBeforeVal) {
                // deposit had effect
                pdata.phase2.s2_completed = true;
                pdata.phase2.s2_completedAt = Date.now();
                tellSeparatorTitle(player, 'Deposit Confirmed', '&a', '&6');
                var s2chat = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                tellPlayer(player, s2chat.s2_deposit_detected);
                try {
                    pdata.phase2.s3_started = true;
                    pdata.phase2.s3_startedAt = Date.now();
                    pdata.phase2.s3_promptTime = Date.now() + shortDelayMs; // respect short delay between steps
                    pdata.phase2.s3_lastMsg = Date.now();
                    tellSeparatorTitle(player, 'Confirm Pouch', '&6', '&e');
                    tellPlayer(player, s2chat.s3_prompt);
                    changed = true;
                } catch (s3err) {
                    logToFile('onboarding', '[phase2-s3-init-error] ' + player.getName() + ' ' + s3err);
                }
            } else {
                // deposit run but pouch unchanged -> likely deposited nothing (or deposit moved to other place)
                // If inventory still contains close to original starter money (40g in inventory), remind them to run deposit while holding money
                if (invMoney >= (40 * 100)) {
                    var s2chat = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                    tellPlayer(player, s2chat.s2_deposit_failure_inv);
                    // reset last msg to avoid spam
                    pdata.phase2.s2_lastMsg = Date.now();
                    changed = true;
                    return changed;
                } else {
                    // Generic fallback message
                    var s2chat = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                    tellPlayer(player, s2chat.s2_deposit_failure_generic);
                    pdata.phase2.s2_lastMsg = Date.now();
                    changed = true;
                    return changed;
                }
            }
        } catch (e6) {
            logToFile('onboarding', '[phase2-s2-check-error] ' + player.getName() + ' ' + e6);
        }
    }

    return changed;
}
