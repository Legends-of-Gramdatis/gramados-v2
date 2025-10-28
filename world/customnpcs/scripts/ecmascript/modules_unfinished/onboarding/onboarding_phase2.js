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
    // New very-long delay for gating Phase 2 start after Phase 1 completion; fallback to long if not set
    var veryLongDelayMs = ((globalCfg && globalCfg.general && typeof globalCfg.general.generic_streamline_delay_very_long === 'number') ? globalCfg.general.generic_streamline_delay_very_long : (longDelayMs/1000)) * 1000;

    // Respect the user's instruction to wait generic_streamline_delay_very_long after phase1 completed
    var phase1CompletedAt = null;
    if (pdata.phase1) {
        // common completion timestamps used in Phase1
        phase1CompletedAt = pdata.phase1.s4_completedTime || pdata.phase1.homeRegisteredTime || pdata.phase1.completed || pdata.phase1.arrivalTime || null;
        // If boolean true, fallback to time recorded on creation
        if (phase1CompletedAt === true) phase1CompletedAt = pdata.phase1.completedTime || pdata.phase1.arrivalTime || pdata.phase1.created || null;
    }
    // If we have a numeric timestamp, require waiting veryLongDelayMs; else allow immediate start
    if (phase1CompletedAt && typeof phase1CompletedAt === 'number') {
        if ((now - phase1CompletedAt) < veryLongDelayMs) {
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
                        // Schedule the very-long gate before deposit
                        pdata.phase2.s2_availableAt = Date.now() + veryLongDelayMs;
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
                    var od2 = loadJson(ONBOARDING_DATA_PATH_LOCAL) || {};
                    var p2 = od2[player.getName()];
                    if (p2) {
                        if (p2['phase2'] && p2['phase2']['last ran'] && p2['phase2']['last ran'].deposit) depositLastRan = p2['phase2']['last ran'].deposit;
                        if (!depositLastRan && p2['last ran'] && p2['last ran'].deposit) depositLastRan = p2['last ran'].deposit;
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
                            // Move to Stage 3: Check Your Pouch (with short delay)
                            pdata.phase2.currentStage = 3;
                            pdata.phase2.currentStep = 1;
                            pdata.phase2.s3_promptTime = Date.now() + shortDelayMs;
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
            }
            break;
        case 3: // Confirm pouch after deposit
            switch (step) {
                case 1: {
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
                            pdata.phase2.completed = true;
                            var s3chat = phaseCfg.stages.stage1.chat;
                            tellPlayer(player, s3chat.s3_completed);
                            changed = true;
                            logToFile('onboarding', '[phase2-s3] ' + player.getName() + ' confirmed pouch after deposit at ' + myMoneyLast2);
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
            }
            break;
    }

    return changed;
}
