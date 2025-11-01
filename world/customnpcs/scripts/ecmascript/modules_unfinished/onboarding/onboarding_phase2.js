 // Phase 2: Economy / Pouch / Currency onboarding
// Stage 1: get your first money (40g), learn about pouch vs inventory, then test !deposit

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_currency.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_trader.js');

// Local path used to read onboarding data entries made by other commands
var ONBOARDING_DATA_PATH_LOCAL = 'world/customnpcs/scripts/data_auto/onboarding_data.json';

function onboarding_run_phase2(player, pdata, phaseCfg, globalCfg, allPlayersData) {
    if (!phaseCfg || !phaseCfg.enabled) return false;
    if (!pdata) return false;
    var changed = false;
    if (!pdata.phase2) pdata.phase2 = {};

    var now = Date.now();
    var shortDelayMs = ((globalCfg && globalCfg.general && typeof globalCfg.general.generic_streamline_delay_short === 'number') ? globalCfg.general.generic_streamline_delay_short : 5) * 1000;
    var mediumDelayMs = ((globalCfg && globalCfg.general && typeof globalCfg.general.generic_streamline_delay_medium === 'number') ? globalCfg.general.generic_streamline_delay_medium : 10) * 1000;
    var longDelayMs = ((globalCfg && globalCfg.general && typeof globalCfg.general.generic_streamline_delay_long === 'number') ? globalCfg.general.generic_streamline_delay_long : 20) * 1000;
    var veryLongDelayMs = ((globalCfg && globalCfg.general && typeof globalCfg.general.generic_streamline_delay_very_long === 'number') ? globalCfg.general.generic_streamline_delay_very_long : (longDelayMs/1000)) * 1000;
    var intervalMs = ((globalCfg && globalCfg.general && typeof globalCfg.general.generic_streamline_interval === 'number') ? globalCfg.general.generic_streamline_interval : 60) * 1000;

    // Respect the user's instruction to wait generic_streamline_delay_very_long after phase1 completed
    var phase1CompletedAt = null;
    if (pdata.phase1) {
        // common completion timestamps used in Phase1
        phase1CompletedAt = pdata.phase1.s4_completedTime || pdata.phase1.homeRegisteredTime || pdata.phase1.completed || pdata.phase1.arrivalTime || null;
        // If boolean true, fallback to time recorded on creation
        if (phase1CompletedAt === true) phase1CompletedAt = pdata.phase1.completedTime || pdata.phase1.arrivalTime || pdata.phase1.created || null;
    }
    // If we have a numeric timestamp, require waiting longDelayMs; else allow immediate start
    if (phase1CompletedAt && typeof phase1CompletedAt === 'number') {
        if ((now - phase1CompletedAt) < longDelayMs) {
            // not yet time to start phase 2
            return false;
        }
    }

    // Initialize stage/step tracking if missing
    if (typeof pdata.phase2.currentStage === 'undefined') { pdata.phase2.currentStage = 1; changed = true; }
    if (typeof pdata.phase2.currentStep === 'undefined') { pdata.phase2.currentStep = 1; changed = true; }

    var stage = pdata.phase2.currentStage;
    var step = pdata.phase2.currentStep;

    switch (stage) {
        case 1: // First coins and understanding pouch
            switch (step) {
                case 1: { // Give 40g and prompt !myMoney, wait until they run it
                    if (!pdata.phase2.s1_started) {
                        pdata.phase2.s1_started = true;
                        pdata.phase2.s1_startedAt = now;
                        changed = true;
                    }

                    if (!pdata.phase2.s1_given) {
                        var cents40g = 40 * 100; // 1g=100
                        var w = player.getWorld();
                        var stacks = generateMoney(w, cents40g, "money") || [];
                        for (var i = 0; i < stacks.length; i++) {
                            player.giveItem(stacks[i]);
                        }
                        pdata.phase2.s1_given = true;
                        pdata.phase2.s1_givenTime = Date.now();
                        var s1chat0 = phaseCfg.stages.stage1.chat;
                        // Phase 2 colors: &2 separator, &a title
                        tellSeparatorTitle(player, 'Your First Coins', '&2', '&a');
                        tellPlayer(player, s1chat0.s1_received);
                        pdata.phase2.s1_promptTime = Date.now();
                        pdata.phase2.s1_lastMsg = Date.now();
                        changed = true;
                        logToFile('onboarding', '[phase2-s1] ' + player.getName() + ' granted 40g.');
                        return changed;
                    }

                    // Check whether player ran !myMoney
                    var onboardingFile1 = loadJson(ONBOARDING_DATA_PATH_LOCAL);
                    var myMoneyLastRan1 = null;
                    var pEntry1 = onboardingFile1[player.getName()];
                    if (pEntry1) {
                        if (pEntry1['phase2'] && pEntry1['phase2']['last ran'] && pEntry1['phase2']['last ran'].myMoney) myMoneyLastRan1 = pEntry1['phase2']['last ran'].myMoney;
                        if (!myMoneyLastRan1 && pEntry1['last ran'] && pEntry1['last ran'].myMoney) myMoneyLastRan1 = pEntry1['last ran'].myMoney;
                        if (!myMoneyLastRan1 && pEntry1['phase2'] && pEntry1['phase2']['last_ran'] && pEntry1['phase2']['last_ran'].myMoney) myMoneyLastRan1 = pEntry1['phase2']['last_ran'].myMoney;
                    }

                    if (!pdata.phase2.s1_myMoneySeen) {
                        if (myMoneyLastRan1 && pdata.phase2.s1_promptTime && myMoneyLastRan1 >= pdata.phase2.s1_promptTime) {
                            pdata.phase2.s1_myMoneySeen = true;
                            pdata.phase2.s1_myMoneySeenAt = myMoneyLastRan1;
                            pdata.phase2.s1_guideAvailableAt = Date.now() + longDelayMs; // keep long delay before guide
                            var s1chatD = phaseCfg.stages.stage1.chat;
                            var msgCompl = String(s1chatD.s1_completion).replace('{delay}', String(longDelayMs/1000));
                            tellPlayer(player, msgCompl);
                            pdata.phase2.currentStep = 2;
                            changed = true;
                            logToFile('onboarding', '[phase2-s1] ' + player.getName() + ' ran !myMoney detected at ' + myMoneyLastRan1);
                        } else {
                            var last1 = pdata.phase2.s1_lastMsg || pdata.phase2.s1_promptTime || 0;
                            if ((Date.now() - last1) > intervalMs) {
                                var s1chatR = phaseCfg.stages.stage1.chat;
                                tellPlayer(player, s1chatR.s1_reminder);
                                pdata.phase2.s1_lastMsg = Date.now();
                                changed = true;
                            }
                        }
                    }
                    break;
                }
                case 2: { // Show Understanding Your Pouch when available
                    if (pdata.phase2.s1_myMoneySeen && pdata.phase2.s1_guideAvailableAt && Date.now() >= pdata.phase2.s1_guideAvailableAt && !pdata.phase2.s1_guideGiven) {

                        // chat messages (configurable)
                        var guideCfg = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.guide) ? phaseCfg.stages.stage1.guide : null;
                        tellSeparatorTitle(player, 'Understanding Your Pouch', '&2', '&a');
                        storytellPlayer(player, guideCfg.chat);

                        // Give paper guide
                        var world = player.getWorld();
                        var baseNbt = { id: 'minecraft:paper', Count: 1, Damage: 0 };
                        var stack = null;
                        try { stack = world.createItemFromNbt(API.stringToNbt(JSON.stringify(baseNbt))); } catch (cn) { try { stack = world.createItemFromNbt('{id:"minecraft:paper",Count:1b}'); } catch (cn2) { stack = null; } }
                        if (stack && stack.setStackSize) stack.setStackSize(1);
                        try { if (stack && stack.setCustomName) stack.setCustomName(parseEmotes(ccs('&6Gramados: Currency Guide'))); } catch (nmEx) {}

                        var loreLines = [];
                        var guideCfg2 = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.guide) ? phaseCfg.stages.stage1.guide : null;
                        if (guideCfg2 && guideCfg2.paper && guideCfg2.paper.entries) {
                            for (var k in guideCfg2.paper.entries) {
                                if (!guideCfg2.paper.entries.hasOwnProperty(k)) continue;
                                var text = guideCfg2.paper.entries[k] || '';
                                loreLines.push(parseEmotes(ccs('&e' + k)));
                                loreLines.push(parseEmotes(ccs('&7' + text)));
                                loreLines.push('');
                            }
                        }
                        if (!loreLines.length) {
                            loreLines.push(parseEmotes(ccs('&eMoney')));
                            loreLines.push(parseEmotes(ccs('&7Your main in-game currency. Use !myMoney to view your pouch, and !deposit to move items into it.')));
                        }
                        if (loreLines.length && loreLines[loreLines.length-1] === '') loreLines.pop();
                        if (stack && stack.setLore) stack.setLore(loreLines);
                        if (stack) { try { player.giveItem(stack); } catch (gErr) { try { player.dropItem(stack); } catch (gErr2) {} } }

                        pdata.phase2.s1_guideGiven = true;
                        pdata.phase2.s1_guideGivenTime = Date.now();
                        var guideChat = phaseCfg.stages.stage1.chat;
                        tellPlayer(player, guideChat.s2_guide_added);
                        // Schedule the long gate before deposit
                        pdata.phase2.s2_availableAt = Date.now() + longDelayMs;
                        pdata.phase2.currentStep = 3;
                        changed = true;
                    }
                    break;
                }
                case 3: { // Wait very-long delay then move to Stage 2
                    if (pdata.phase2.s2_availableAt && Date.now() >= pdata.phase2.s2_availableAt) {
                        pdata.phase2.currentStage = 2;
                        pdata.phase2.currentStep = 1;
                        changed = true;
                    }
                    break;
                }
            }
            break;
        case 2: // Deposit flow
            switch (step) {
                case 1: { // Prompt for deposit and baseline pouch
                    if (!pdata.phase2.s2_started) {
                        pdata.phase2.s2_started = true;
                        pdata.phase2.s2_startedAt = Date.now();
                        var wds = getWorldData();
                        var pKey = 'player_' + player.getName();
                        var playerStr = wds.get(pKey) || null;
                        var pjson = playerStr ? JSON.parse(playerStr) : {};
                        var pouchBefore = (typeof pjson.money === 'number') ? pjson.money : (pjson.money ? Number(pjson.money) : 0);
                        pdata.phase2.s2_pouchBefore = pouchBefore;
                        var s2chat0 = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                        tellSeparatorTitle(player, 'Depositing Money', '&2', '&a');
                        tellPlayer(player, s2chat0.s2_deposit_init);
                        pdata.phase2.s2_promptTime = Date.now();
                        pdata.phase2.s2_lastMsg = Date.now();
                        changed = true;
                        return changed;
                    }

                    // Wait for deposit command run
                    var depositLastRan = null;
                    var onboard_data = loadJson(ONBOARDING_DATA_PATH_LOCAL) || {};
                    var onboard_data_player = onboard_data[player.getName()];
                    if (onboard_data_player) {
                        if (onboard_data_player['phase2'] && onboard_data_player['phase2']['last ran'] && onboard_data_player['phase2']['last ran'].deposit) depositLastRan = onboard_data_player['phase2']['last ran'].deposit;
                        if (!depositLastRan && onboard_data_player['last ran'] && onboard_data_player['last ran'].deposit) depositLastRan = onboard_data_player['last ran'].deposit;
                    }

                    if (!depositLastRan || (pdata.phase2.s2_promptTime && depositLastRan < pdata.phase2.s2_promptTime)) {
                        var last2 = pdata.phase2.s2_lastMsg || pdata.phase2.s2_promptTime || 0;
                        if ((Date.now() - last2) > intervalMs) {
                            var s2chatR = phaseCfg.stages.stage1.chat;
                            tellPlayer(player, s2chatR.s2_deposit_reminder);
                            pdata.phase2.s2_lastMsg = Date.now();
                            changed = true;
                        }
                        return changed;
                    }

                    // Verify deposit had effect
                    try {
                        var wds3 = getWorldData();
                        var pKey3 = 'player_' + player.getName();
                        var playerStr3 = wds3.get(pKey3) || null;
                        var pjson3 = playerStr3 ? JSON.parse(playerStr3) : {};
                        var pouchAfter = (typeof pjson3.money === 'number') ? pjson3.money : (pjson3.money ? Number(pjson3.money) : 0);
                        var pouchBeforeVal = pdata.phase2.s2_pouchBefore || 0;
                        var invMoney = readMoneyFromPlayerInventory(player, player.getWorld()) || 0;

                        var s2chat = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                        if (pouchAfter > pouchBeforeVal) {
                            pdata.phase2.s2_completed = true;
                            pdata.phase2.s2_completedAt = Date.now();
                            tellPlayer(player, s2chat.s2_deposit_detected);
                            // Move to Step 2 within Stage 2: Check Your Pouch (detect immediately after message is shown)
                            pdata.phase2.currentStage = 2;
                            pdata.phase2.currentStep = 2;
                            // Anchor detection to the moment we show the message so immediate !myMoney counts
                            pdata.phase2.s3_promptTime = Date.now();
                            pdata.phase2.s3_lastMsg = Date.now();
                            tellSeparatorTitle(player, 'Check Your Pouch', '&2', '&a');
                            tellPlayer(player, s2chat.s3_checkpouch_init);
                            changed = true;
                        } else {
                            if (invMoney >= (40 * 100)) {
                                tellPlayer(player, s2chat.s2_deposit_failure_inv);
                                pdata.phase2.s2_lastMsg = Date.now();
                                changed = true;
                                return changed;
                            } else {
                                tellPlayer(player, s2chat.s2_deposit_failure_generic);
                                pdata.phase2.s2_lastMsg = Date.now();
                                changed = true;
                                return changed;
                            }
                        }
                    } catch (e6) { logToFile('onboarding', '[phase2-s2-check-error] ' + player.getName() + ' ' + e6); }
                    break;
                }
                case 2: { // Check Your Pouch confirmation after short delay
                    var myMoneyLast2 = null;
                    var od3 = loadJson(ONBOARDING_DATA_PATH_LOCAL) || {};
                    var p3 = od3[player.getName()];
                    if (p3) {
                        if (p3['phase2'] && p3['phase2']['last ran'] && p3['phase2']['last ran'].myMoney) myMoneyLast2 = p3['phase2']['last ran'].myMoney;
                        if (!myMoneyLast2 && p3['last ran'] && p3['last ran'].myMoney) myMoneyLast2 = p3['last ran'].myMoney;
                        if (!myMoneyLast2 && p3['phase2'] && p3['phase2']['last_ran'] && p3['phase2']['last_ran'].myMoney) myMoneyLast2 = p3['phase2']['last_ran'].myMoney;
                    }

                    if (!pdata.phase2.s3_myMoneySeen) {
                        if (myMoneyLast2 && pdata.phase2.s3_promptTime && myMoneyLast2 >= pdata.phase2.s3_promptTime) {
                            pdata.phase2.s3_myMoneySeen = true;
                            pdata.phase2.s3_myMoneySeenAt = myMoneyLast2;
                            pdata.phase2.s3_completed = true;
                            pdata.phase2.s3_completedAt = Date.now();
                            var s3chat = phaseCfg.stages.stage1.chat;
                            tellPlayer(player, s3chat.s3_completed);
                            // Schedule a long delay before moving to Stage 3 (Depositing Batch of Money Items)
                            pdata.phase2.s3b_availableAt = Date.now() + longDelayMs;
                            // Move to a waiting step 3 within Stage 2
                            pdata.phase2.currentStage = 2;
                            pdata.phase2.currentStep = 3;
                            changed = true;
                            logToFile('onboarding', '[phase2-s2-step2] ' + player.getName() + ' confirmed pouch after deposit at ' + myMoneyLast2);
                        } else {
                            var last3 = pdata.phase2.s3_lastMsg || pdata.phase2.s3_promptTime || 0;
                            if ((Date.now() - last3) > intervalMs) {
                                var s3chatR = phaseCfg.stages.stage1.chat;
                                tellPlayer(player, s3chatR.s3_checkpouch_reminder);
                                pdata.phase2.s3_lastMsg = Date.now();
                                changed = true;
                            }
                        }
                    }
                    break;
                }
                case 3: { // Wait long delay then move to Stage 3 (depositAll)
                    if (pdata.phase2.s3b_availableAt && Date.now() >= pdata.phase2.s3b_availableAt) {
                        pdata.phase2.currentStage = 3;
                        pdata.phase2.currentStep = 1;
                        changed = true;
                    }
                    break;
                }
            }
            break;
        case 3: // Depositing Batch of Money Items (depositAll)
            switch (step) {
                case 1: {
                    // On first entry, grant 33g34c and show title + prompt
                    if (!pdata.phase2.s3b_started) {
                        pdata.phase2.s3b_started = true;
                        pdata.phase2.s3b_startedAt = Date.now();
                        try {
                            var w3 = player.getWorld();
                            var stacks3 = generateMoney(w3, (33*100 + 34), "money") || [];
                            for (var i3 = 0; i3 < stacks3.length; i3++) { try { if (stacks3[i3]) player.giveItem(stacks3[i3]); } catch (gex) { try { player.dropItem(stacks3[i3]); } catch (gex2) {} } }
                        } catch (grantErr) { logToFile('onboarding', '[phase2-s3b-grant-error] ' + player.getName() + ' ' + grantErr); }

                        // Title and prompt (messages from config only)
                        tellSeparatorTitle(player, 'Depositing Batch of Money Items', '&2', '&a');
                        var sChat = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                        tellPlayer(player, sChat.s3b_prompt);
                        pdata.phase2.s3b_promptTime = Date.now();
                        pdata.phase2.s3b_lastMsg = Date.now();
                        changed = true;
                        return changed;
                    }

                    // Wait for !depositAll run (using last ran map)
                    var depositAllLastRan = null;
                    try {
                        var onboard_data = loadJson(ONBOARDING_DATA_PATH_LOCAL) || {};
                        var onboard_data_player = onboard_data[player.getName()];
                        if (onboard_data_player) {
                            if (onboard_data_player['phase2'] && onboard_data_player['phase2']['last ran'] && onboard_data_player['phase2']['last ran'].depositAll) depositAllLastRan = onboard_data_player['phase2']['last ran'].depositAll;
                            if (!depositAllLastRan && onboard_data_player['last ran'] && onboard_data_player['last ran'].depositAll) depositAllLastRan = onboard_data_player['last ran'].depositAll;
                        }
                    } catch (e9) { depositAllLastRan = null; }

                    if (!depositAllLastRan || (pdata.phase2.s3b_promptTime && depositAllLastRan < pdata.phase2.s3b_promptTime)) {
                        var lastBA = pdata.phase2.s3b_lastMsg || pdata.phase2.s3b_promptTime || 0;
                        if ((Date.now() - lastBA) > intervalMs) {
                            var sChatR = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                            tellPlayer(player, sChatR.s3b_reminder);
                            pdata.phase2.s3b_lastMsg = Date.now();
                            changed = true;
                        }
                        return changed;
                    }

                    // Completion when depositAll detected
                    pdata.phase2.s3b_completed = true;
                    pdata.phase2.s3b_completedAt = Date.now();
                    var sChatC = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                    tellPlayer(player, sChatC.s3b_completed);
                    // Schedule Stage 4 Step 2 (Withdrawing Money) to start after a medium delay
                    pdata.phase2.s4_step2AvailableAt = Date.now() + mediumDelayMs;
                    // Move to Stage 4 - Step 1 (validity check) immediately; Step 2 will start when available time hits
                    pdata.phase2.currentStage = 4;
                    pdata.phase2.currentStep = 1;
                    changed = true;
                    break;
                }
            }
            break;
        case 4: // Withdrawing money from pouch (Stage 4)
            switch (step) {
                case 1: { // Check validity: ensure no money items in inventory; then wait for medium delay to Step 2
                    var invMoneyNow = 0;
                    try { invMoneyNow = readMoneyFromPlayerInventory(player, player.getWorld()) || 0; } catch (vErr) { invMoneyNow = 0; }
                    if (invMoneyNow > 0) {
                        // Failure reminder: ask to empty inventory (use depositAll)
                        var s4c1 = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                        var msgFail = s4c1.s4_validity_failure;
                        var lastV = pdata.phase2.s4_step1_lastMsg || 0;
                        if ((Date.now() - lastV) > intervalMs) {
                            tellPlayer(player, msgFail);
                            pdata.phase2.s4_step1_lastMsg = Date.now();
                            changed = true;
                        }
                        // Stay in Step 1 until inventory is clean
                        break;
                    }
                    // Inventory is clean; wait for scheduled medium delay to start Step 2
                    if (pdata.phase2.s4_step2AvailableAt && Date.now() >= pdata.phase2.s4_step2AvailableAt) {
                        pdata.phase2.currentStep = 2;
                        changed = true;
                    }
                    break;
                }
                case 2: { // Withdrawing Money (withdraw 6g)
                    if (!pdata.phase2.s4_withdraw_started) {
                        pdata.phase2.s4_withdraw_started = true;
                        pdata.phase2.s4_withdraw_startedAt = Date.now();
                        // Snapshot before values for validation
                        try {
                            var wdsW = getWorldData();
                            var pKeyW = 'player_' + player.getName();
                            var playerStrW = wdsW.get(pKeyW) || null;
                            var pjsonW = playerStrW ? JSON.parse(playerStrW) : {};
                            var pouchBeforeW = (typeof pjsonW.money === 'number') ? pjsonW.money : (pjsonW.money ? Number(pjsonW.money) : 0);
                            pdata.phase2.s4_withdraw_pouchBefore = pouchBeforeW;
                        } catch (we1) { pdata.phase2.s4_withdraw_pouchBefore = 0; }
                        try { pdata.phase2.s4_withdraw_invBefore = readMoneyFromPlayerInventory(player, player.getWorld()) || 0; } catch (we2) { pdata.phase2.s4_withdraw_invBefore = 0; }

                        // Title and prompt
                        tellSeparatorTitle(player, 'Withdrawing Money', '&2', '&a');
                        var s4c2 = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                        tellPlayer(player, s4c2.s4_withdraw_start);
                        pdata.phase2.s4_withdraw_promptTime = Date.now();
                        pdata.phase2.s4_withdraw_lastMsg = Date.now();
                        changed = true;
                        return changed;
                    }

                    // Detect !withdraw command
                    var withdrawLastRan = null;
                    try {
                        var odW = loadJson(ONBOARDING_DATA_PATH_LOCAL) || {};
                        var pW = odW[player.getName()];
                        if (pW) {
                            if (pW['phase2'] && pW['phase2']['last ran'] && pW['phase2']['last ran'].withdraw) withdrawLastRan = pW['phase2']['last ran'].withdraw;
                            if (!withdrawLastRan && pW['last ran'] && pW['last ran'].withdraw) withdrawLastRan = pW['last ran'].withdraw;
                            if (!withdrawLastRan && pW['phase2'] && pW['phase2']['last_ran'] && pW['phase2']['last_ran'].withdraw) withdrawLastRan = pW['phase2']['last_ran'].withdraw;
                        }
                    } catch (we3) { withdrawLastRan = null; }

                    if (!withdrawLastRan || (pdata.phase2.s4_withdraw_promptTime && withdrawLastRan < pdata.phase2.s4_withdraw_promptTime)) {
                        var lastW = pdata.phase2.s4_withdraw_lastMsg || pdata.phase2.s4_withdraw_promptTime || 0;
                        if ((Date.now() - lastW) > intervalMs) {
                            var s4c2r = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                            tellPlayer(player, s4c2r.s4_withdraw_reminder);
                            pdata.phase2.s4_withdraw_lastMsg = Date.now();
                            changed = true;
                        }
                        break;
                    }

                    // Verify effect (pouch decreased and inventory increased by ~6g)
                    var pouchBeforeChk = pdata.phase2.s4_withdraw_pouchBefore || 0;
                    var invBeforeChk = pdata.phase2.s4_withdraw_invBefore || 0;
                    var pouchAfterChk = pouchBeforeChk;
                    var invAfterChk = invBeforeChk;
                    try {
                        var wdsWA = getWorldData();
                        var pKeyWA = 'player_' + player.getName();
                        var playerStrWA = wdsWA.get(pKeyWA) || null;
                        var pjsonWA = playerStrWA ? JSON.parse(playerStrWA) : {};
                        pouchAfterChk = (typeof pjsonWA.money === 'number') ? pjsonWA.money : (pjsonWA.money ? Number(pjsonWA.money) : 0);
                    } catch (we4) {}
                    try { invAfterChk = readMoneyFromPlayerInventory(player, player.getWorld()) || 0; } catch (we5) {}

                    var expectedCents = 6 * 100; // 6g
                    var pouchDecreased = (pouchBeforeChk - pouchAfterChk) >= expectedCents;
                    var invIncreased = (invAfterChk - invBeforeChk) >= expectedCents;

                    var s4c2c = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                    if (pouchDecreased && invIncreased) {
                        // Success
                        tellPlayer(player, s4c2c.s4_withdraw_completed);
                        pdata.phase2.s4_withdraw_completed = true;
                        pdata.phase2.s4_withdraw_completedAt = Date.now();
                        // Move to Step 3: Deposit money again
                        pdata.phase2.currentStep = 3;
                        changed = true;
                    } else {
                        // Ask to try again
                        var remindMsg2 = s4c2c.s4_withdraw_reminder;
                        var lastW2 = pdata.phase2.s4_withdraw_lastMsg || 0;
                        if ((Date.now() - lastW2) > intervalMs) {
                            tellPlayer(player, remindMsg2);
                            pdata.phase2.s4_withdraw_lastMsg = Date.now();
                            changed = true;
                        }
                    }
                    break;
                }
                case 3: { // Deposit money again (!deposit or !depositAll)
                    if (!pdata.phase2.s4_redeposit_started) {
                        pdata.phase2.s4_redeposit_started = true;
                        pdata.phase2.s4_redeposit_startedAt = Date.now();
                        // Capture baselines
                        var wdsRD = getWorldData();
                        var pKeyRD = 'player_' + player.getName();
                        var playerStrRD = wdsRD.get(pKeyRD);
                        var pjsonRD = playerStrRD ? JSON.parse(playerStrRD) : {};
                        pdata.phase2.s4_redeposit_pouchBefore = pjsonRD.money;
                        pdata.phase2.s4_redeposit_invBefore = readMoneyFromPlayerInventory(player, player.getWorld());

                        var s4c3 = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                        tellPlayer(player, s4c3.s4_redeposit_start);
                        pdata.phase2.s4_redeposit_promptTime = Date.now();
                        pdata.phase2.s4_redeposit_lastMsg = Date.now();
                        changed = true;
                        return changed;
                    }

                    // Detect either deposit or depositAll
                    var dRan = null, daRan = null;
                    var odRD = loadJson(ONBOARDING_DATA_PATH_LOCAL) || {};
                    var pRD = odRD[player.getName()];
                    if (pRD) {
                        if (pRD['phase2'] && pRD['phase2']['last ran']) {
                            if (pRD['phase2']['last ran'].deposit) dRan = pRD['phase2']['last ran'].deposit;
                            if (pRD['phase2']['last ran'].depositAll) daRan = pRD['phase2']['last ran'].depositAll;
                        }
                        if (pRD['last ran']) {
                            if (!dRan && pRD['last ran'].deposit) dRan = pRD['last ran'].deposit;
                            if (!daRan && pRD['last ran'].depositAll) daRan = pRD['last ran'].depositAll;
                        }
                    }

                    // tellPlayer(player, '&7DEBUG: dRan=' + dRan + ' daRan=' + daRan + ' promptTime=' + pdata.phase2.s4_redeposit_promptTime);

                    var triggerTime = pdata.phase2.s4_redeposit_promptTime || 0;
                    var hasDeposited = (dRan && dRan >= triggerTime) || (daRan && daRan >= triggerTime);
                    if (!hasDeposited) {
                        var lastRD = pdata.phase2.s4_redeposit_lastMsg || triggerTime || 0;
                        if ((Date.now() - lastRD) > intervalMs) {
                            var s4c3r = phaseCfg.stages.stage1.chat;
                            tellPlayer(player, s4c3r.s4_redeposit_reminder);
                            pdata.phase2.s4_redeposit_lastMsg = Date.now();
                            changed = true;
                        }
                        break;
                    }

                    // Verify effect
                    var invAfterRD = readMoneyFromPlayerInventory(player, player.getWorld());
                    var s4c3c = phaseCfg.stages.stage1.chat;
                    if (invAfterRD === 0) {
                        tellPlayer(player, s4c3c.s4_redeposit_completed);
                        pdata.phase2.s4_redeposit_completed = true;
                        pdata.phase2.s4_redeposit_completedAt = Date.now();
                        // Proceed to Step 4: Withdrawing Multiple Items (1g x6)
                        pdata.phase2.currentStage = 4;
                        pdata.phase2.currentStep = 4;
                        changed = true;
                    } else {
                        // Failure: still has money items left, instruct to run again until no more money items on you
                        tellPlayer(player, s4c3c.s4_redeposit_failure);
                        pdata.phase2.s4_redeposit_lastMsg = Date.now();
                        changed = true;
                    }
                    break;
                }
                case 4: { // Withdrawing Multiple Items: withdraw 1g 6
                    // Ensure inventory has no money at the start of this step
                    var invNow4 = 0;
                    try { invNow4 = readMoneyFromPlayerInventory(player, player.getWorld()) || 0; } catch (e40) { invNow4 = 0; }
                    if (!pdata.phase2.s4_multi_started) {
                        if (invNow4 > 0) {
                            // Ask to clear inventory first (reuse validity failure phrasing or custom if provided)
                            var s4m0 = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                            var msgV0 = s4m0.s4_validity_failure || s4m0.s4_multi_deposit_first;
                            var lastV0 = pdata.phase2.s4_multi_lastMsg || 0;
                            if ((Date.now() - lastV0) > intervalMs) {
                                tellPlayer(player, msgV0);
                                pdata.phase2.s4_multi_lastMsg = Date.now();
                                changed = true;
                            }
                            break;
                        }
                        // Start step
                        pdata.phase2.s4_multi_started = true;
                        pdata.phase2.s4_multi_startedAt = Date.now();
                        tellSeparatorTitle(player, 'Withdrawing Multiple Items', '&2', '&a');
                        var s4m = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage1 && phaseCfg.stages.stage1.chat) ? phaseCfg.stages.stage1.chat : {};
                        tellPlayer(player, s4m.s4_multi_start);
                        pdata.phase2.s4_multi_promptTime = Date.now();
                        pdata.phase2.s4_multi_lastMsg = Date.now();
                        changed = true;
                        return changed;
                    }

                    // If we are in a re-deposit loop after a wrong withdraw, guide until inventory is empty again
                    if (pdata.phase2.s4_multi_needRedeposit) {
                        if (invNow4 > 0) {
                            var s4mFailRpt = phaseCfg.stages.stage1.chat;
                            var msgRpt = s4mFailRpt.s4_multi_failure_wrong;
                            var lastRpt = pdata.phase2.s4_multi_lastMsg || 0;
                            if ((Date.now() - lastRpt) > intervalMs) {
                                tellPlayer(player, msgRpt);
                                pdata.phase2.s4_multi_lastMsg = Date.now();
                                changed = true;
                            }
                            break;
                        } else {
                            // Inventory clean again -> encourage correct withdraw and reset prompt time
                            var s4mHint = phaseCfg.stages.stage1.chat;
                            tellPlayer(player, s4mHint.s4_multi_redeposit_hint);
                            pdata.phase2.s4_multi_needRedeposit = false;
                            pdata.phase2.s4_multi_promptTime = Date.now();
                            pdata.phase2.s4_multi_lastMsg = Date.now();
                            changed = true;
                            break;
                        }
                    }

                    // Detect !withdraw command
                    var withdrawLastRan4 = null;
                    try {
                        var odW4 = loadJson(ONBOARDING_DATA_PATH_LOCAL) || {};
                        var pW4 = odW4[player.getName()];
                        if (pW4) {
                            if (pW4['phase2'] && pW4['phase2']['last ran'] && pW4['phase2']['last ran'].withdraw) withdrawLastRan4 = pW4['phase2']['last ran'].withdraw;
                            if (!withdrawLastRan4 && pW4['last ran'] && pW4['last ran'].withdraw) withdrawLastRan4 = pW4['last ran'].withdraw;
                            if (!withdrawLastRan4 && pW4['phase2'] && pW4['phase2']['last_ran'] && pW4['phase2']['last_ran'].withdraw) withdrawLastRan4 = pW4['phase2']['last_ran'].withdraw;
                        }
                    } catch (we34) { withdrawLastRan4 = null; }

                    if (!withdrawLastRan4 || (pdata.phase2.s4_multi_promptTime && withdrawLastRan4 < pdata.phase2.s4_multi_promptTime)) {
                        var lastM = pdata.phase2.s4_multi_lastMsg || pdata.phase2.s4_multi_promptTime || 0;
                        if ((Date.now() - lastM) > intervalMs) {
                            var s4mR = phaseCfg.stages.stage1.chat;
                            tellPlayer(player, s4mR.s4_multi_reminder);
                            pdata.phase2.s4_multi_lastMsg = Date.now();
                            changed = true;
                        }
                        break;
                    }

                    // Evaluate inventory: must be exactly 6 coins of 1G (100 each), total 600
                    var world4 = player.getWorld();
                    var totalCents = 0;
                    var onesCount = 0;
                    try {
                        var invArr = player.getInventory();
                        // some environments expose getItems(); prefer array if present
                        if (typeof invArr.getItems === 'function') invArr = invArr.getItems();
                        for (var ii = 0; ii < invArr.length; ii++) {
                            var st4 = invArr[ii];
                            if (!st4) continue;
                            var val = getItemMoney(st4, world4, 'money');
                            if (val > 0) {
                                totalCents += (val * st4.getStackSize());
                                if (val === 100) onesCount += st4.getStackSize();
                            }
                        }
                    } catch (cntErr) {}

                    if (onesCount === 6 && totalCents === 600) {
                        var s4mC = phaseCfg.stages.stage1.chat;
                        tellPlayer(player, s4mC.s4_multi_completed);
                        pdata.phase2.s4_multi_completed = true;
                        pdata.phase2.s4_multi_completedAt = Date.now();
                        // Move to next Stage 5
                        pdata.phase2.currentStage = 5;
                        pdata.phase2.currentStep = 1;
                        changed = true;
                    } else {
                        // Wrong composition: require depositing all, then try again
                        var s4mF = phaseCfg.stages.stage1.chat;
                        tellPlayer(player, s4mF.s4_multi_failure_wrong);
                        pdata.phase2.s4_multi_needRedeposit = true;
                        pdata.phase2.s4_multi_lastMsg = Date.now();
                        changed = true;
                    }
                    break;
                }
            }
            break;
        case 5: // Your first purchase - Step 1: Heading to the Canteen (detect region entry)
            switch (step) {
                case 1: {
                    // On first entry into this step, show title and starting guidance once
                    if (!pdata.phase2.s5_step1_started) {
                        pdata.phase2.s5_step1_started = true;
                        pdata.phase2.s5_step1_startedAt = Date.now();
                        tellSeparatorTitle(player, 'Heading to the Canteen', '&2', '&a');
                        var s5c = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage5 && phaseCfg.stages.stage5.chat) ? phaseCfg.stages.stage5.chat : {};
                        if (s5c.s5_canteen_start) tellPlayer(player, s5c.s5_canteen_start);
                        pdata.phase2.s5_step1_promptTime = Date.now();
                        pdata.phase2.s5_step1_lastMsg = Date.now();
                        changed = true;
                        return changed;
                    }

                    // Detect region entry
                    var inCanteen = isPlayerInCuboid(player, phaseCfg.stages.stage5.canteen_region_name);
                    var s5chat = (phaseCfg && phaseCfg.stages && phaseCfg.stages.stage5 && phaseCfg.stages.stage5.chat) ? phaseCfg.stages.stage5.chat : {};

                    if (inCanteen) {
                        if (!pdata.phase2.s5_step1_completed) {
                            pdata.phase2.s5_step1_completed = true;
                            pdata.phase2.s5_step1_completedAt = Date.now();
                            if (s5chat.s5_canteen_completed) tellPlayer(player, s5chat.s5_canteen_completed);
                            // Advance to Step 2 (Finding waiter)
                            pdata.phase2.currentStep = 2;
                            changed = true;
                        }
                    } else {
                        // Periodic reminder to head to the canteen
                        var lastS5 = pdata.phase2.s5_step1_lastMsg || pdata.phase2.s5_step1_promptTime || 0;
                        if ((Date.now() - lastS5) > intervalMs) {
                            if (s5chat.s5_canteen_reminder) tellPlayer(player, s5chat.s5_canteen_reminder);
                            pdata.phase2.s5_step1_lastMsg = Date.now();
                            changed = true;
                        }
                    }
                    break;
                }
                case 2: { // Step 2: Finding the waiter (confine inside canteen, detect proximity to Raúl Menza)
                    var s5cfg = phaseCfg.stages.stage5;
                    var s5chat2 = s5cfg.chat;
                    var regionName = s5cfg.canteen_region_name;
                    var waiter = s5cfg.waiter;
                    var waiterName = waiter.npc_name;
                    var waiterPos = waiter.position;
                    var waiterRadius = waiter.radius;

                    // On first entry into Step 2, show title and starting guidance once
                    if (!pdata.phase2.s5_waiter_started) {
                        pdata.phase2.s5_waiter_started = true;
                        pdata.phase2.s5_waiter_startedAt = Date.now();
                        tellSeparatorTitle(player, 'Find the Waiter', '&2', '&a');
                        if (s5chat2.s5_waiter_start) {
                            var msgStart = String(s5chat2.s5_waiter_start).replace('{npc}', waiterName);
                            tellPlayer(player, msgStart);
                        }
                        pdata.phase2.s5_waiter_promptTime = Date.now();
                        pdata.phase2.s5_waiter_lastMsg = Date.now();
                        changed = true;
                        return changed;
                    }

                    // Keep the player inside the canteen while looking for the waiter
                    var didConfine = confinePlayerToRegion(player, regionName);
                    if (didConfine) {
                        var lastConf = pdata.phase2.s5_waiter_lastConfineMsg || 0;
                        if ((Date.now() - lastConf) > mediumDelayMs) {
                            if (s5chat2.s5_waiter_confining) {
                                var msgConf = String(s5chat2.s5_waiter_confining).replace('{npc}', waiterName);
                                tellPlayer(player, msgConf);
                            }
                            pdata.phase2.s5_waiter_lastConfineMsg = Date.now();
                            changed = true;
                        }
                    }

                    // Detect proximity to the waiter NPC position (3-block radius by default)
                    var p2 = player.getPos();
                    var dx = p2.x - waiterPos[0];
                    var dy = p2.y - waiterPos[1];
                    var dz = p2.z - waiterPos[2];
                    var distSq = dx*dx + dy*dy + dz*dz;
                    var rSq = waiterRadius * waiterRadius;

                    if (distSq <= rSq) {
                        if (!pdata.phase2.s5_waiter_completed) {
                            pdata.phase2.s5_waiter_completed = true;
                            pdata.phase2.s5_waiter_completedAt = Date.now();
                            if (s5chat2.s5_waiter_completed) {
                                var msgDone = String(s5chat2.s5_waiter_completed).replace('{npc}', waiterName);
                                tellPlayer(player, msgDone);
                            }
                            var marketPath = s5cfg.market.file;
                            var marketItems = readMarketItems(marketPath) || [];
                            var keys = _buildMarketKeys(marketItems);
                            pdata.phase2.s5_marketKeys = keys;
                            pdata.phase2.s5_invBaseline = _countItemsByKeys(player, keys);
                            // Advance to Step 3 (next part of purchase flow)
                            pdata.phase2.currentStep = 3;
                            changed = true;
                        }
                    } else {
                        // Periodic reminder while searching
                        var last2 = pdata.phase2.s5_waiter_lastMsg || pdata.phase2.s5_waiter_promptTime || 0;
                        if ((Date.now() - last2) > intervalMs) {
                            if (s5chat2.s5_waiter_reminder) {
                                var msgRem = String(s5chat2.s5_waiter_reminder).replace('{npc}', waiterName);
                                tellPlayer(player, msgRem);
                            }
                            pdata.phase2.s5_waiter_lastMsg = Date.now();
                            changed = true;
                        }
                    }
                    break;
                }
                case 3: { // Step 3: Purchasing food (compare inventory delta vs baseline for market items)
                    var s5cfg3 = phaseCfg.stages.stage5;
                    var s5chat3 = s5cfg3.chat;
                    var regionName3 = s5cfg3.canteen_region_name;
                    var waiter3 = s5cfg3.waiter;
                    var waiterName3 = waiter3.npc_name;
                    var waiterPos3 = waiter3.position;
                    var waiterRadius3 = waiter3.radius;
                    var farRadius = waiter3.far_radius;

                    // On first entry into Step 3
                    if (!pdata.phase2.s5_purchase_started) {
                        pdata.phase2.s5_purchase_started = true;
                        pdata.phase2.s5_purchase_startedAt = Date.now();
                        tellSeparatorTitle(player, 'Making Your First Purchase', '&2', '&a');
                        if (s5chat3.s5_purchase_start) tellPlayer(player, s5chat3.s5_purchase_start);
                        pdata.phase2.s5_purchase_promptTime = Date.now();
                        pdata.phase2.s5_purchase_lastMsg = Date.now();
                        changed = true;
                        return changed;
                    }

                    // Keep the player inside the canteen until purchase detected (lock lifted afterwards)
                    if (!pdata.phase2.s5_purchase_completed) {
                        var didConfine3 = confinePlayerToRegion(player, regionName3);
                        if (didConfine3) {
                            var lastConf3 = pdata.phase2.s5_purchase_lastConfineMsg || 0;
                            if ((Date.now() - lastConf3) > mediumDelayMs) {
                                if (s5chat3.s5_purchase_confining) tellPlayer(player, s5chat3.s5_purchase_confining);
                                pdata.phase2.s5_purchase_lastConfineMsg = Date.now();
                                changed = true;
                            }
                        }
                    }

                    // Distance reminder: if too far from the waiter, remind to return
                    var p3 = player.getPos();
                    var dx3 = p3.x - waiterPos3[0];
                    var dy3 = p3.y - waiterPos3[1];
                    var dz3 = p3.z - waiterPos3[2];
                    var distSq3 = dx3*dx3 + dy3*dy3 + dz3*dz3;
                    if (distSq3 > (farRadius * farRadius)) {
                        var lastFar = pdata.phase2.s5_purchase_farLastMsg || 0;
                        if ((Date.now() - lastFar) > intervalMs) {
                            if (s5chat3.s5_purchase_far_reminder) {
                                var msgFar = String(s5chat3.s5_purchase_far_reminder).replace('{npc}', waiterName3);
                                tellPlayer(player, msgFar);
                            }
                            pdata.phase2.s5_purchase_farLastMsg = Date.now();
                            changed = true;
                        }
                    }

                    // Detect purchase: compare current counts of market items vs baseline
                    var keys3 = pdata.phase2.s5_marketKeys || [];
                    var baseline3 = pdata.phase2.s5_invBaseline || {};
                    var nowCounts = _countItemsByKeys(player, keys3);
                    var purchasedKeys = [];
                    for (var ki3 = 0; ki3 < keys3.length; ki3++) {
                        var key3 = keys3[ki3];
                        var beforeCount = (typeof baseline3[key3] === 'number') ? baseline3[key3] : 0;
                        var nowCount = (typeof nowCounts[key3] === 'number') ? nowCounts[key3] : 0;
                        if (nowCount > beforeCount) purchasedKeys.push(key3);
                    }

                    if (purchasedKeys.length > 0) {
                        pdata.phase2.s5_purchase_completed = true;
                        pdata.phase2.s5_purchase_completedAt = Date.now();
                        if (s5chat3.s5_purchase_completed) tellPlayer(player, s5chat3.s5_purchase_completed);
                        // Lock lifted automatically by not confining anymore. Advance to next step placeholder.
                        pdata.phase2.currentStep = 4;
                        tellSeparator(player, '&2')
                        changed = true;
                    } else {
                        // Periodic generic reminder to purchase something
                        var lastPRem = pdata.phase2.s5_purchase_lastMsg || pdata.phase2.s5_purchase_promptTime || 0;
                        if ((Date.now() - lastPRem) > intervalMs) {
                            if (s5chat3.s5_purchase_reminder) tellPlayer(player, s5chat3.s5_purchase_reminder);
                            pdata.phase2.s5_purchase_lastMsg = Date.now();
                            changed = true;
                        }
                    }
                    break;
                }
            }
            break;
    }

    return changed;
}

// Helpers: build market keys and count items for those keys using Player.getInventory() (IItemStack[])
function _buildMarketKeys(items) {
    var keys = [];
    for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it || !it.id) continue;
        var dmg = (typeof it.damage === 'number') ? it.damage : 0;
        var key = it.id + '|' + String(dmg);
        if (keys.indexOf(key) < 0) keys.push(key);
    }
    return keys;
}

function _countItemsByKeys(player, keys) {
    var counts = {};
    for (var k = 0; k < keys.length; k++) counts[keys[k]] = 0;
    var inv = player.getInventory().getItems(); // IItemStack[] of size 36
    for (var i = 0; i < inv.length; i++) {
        var st = inv[i];
        if (!st) continue;
        var id = st.getName();
        var dmg = st.getItemDamage();
        var key = id + '|' + String(dmg);
        if (counts.hasOwnProperty(key)) {
            counts[key] += st.getStackSize();
        }
    }
    return counts;
}
