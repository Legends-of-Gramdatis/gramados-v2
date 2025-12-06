
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');

// Phase 0 logic – returns true if data changed.
function onboarding_run_phase0(player, pdata, phaseCfg, globalCfg) {
    if (!phaseCfg || !phaseCfg.enabled) return false;
    var changed = false;
    var arrival = phaseCfg.stages && phaseCfg.stages.arrival ? phaseCfg.stages.arrival : null;
    if (!arrival) return false;
    var intervalMs = globalCfg.general.generic_streamline_interval * 1000;
    var longDelayMs = globalCfg.general.generic_streamline_delay_long * 1000;
    var mediumDelayMs = globalCfg.general.generic_streamline_delay_medium * 1000;
    var shortDelayMs = globalCfg.general.generic_streamline_delay_short * 1000;
    var nowGen = Date.now();

    // Detect dialog completion automatically by polling the player's dialog history
    var dialogMeta = arrival.dialog || {};
    var dialogId = dialogMeta.id; // Could be numeric or string
    if (typeof dialogId !== 'undefined' && dialogId !== null) {
        // Normalize to int if numeric string
        if (typeof dialogId === 'string' && dialogId.match(/^\d+$/)) { dialogId = parseInt(dialogId, 10); }
        if (!pdata.phase0.dialogRead) {
            if (player.hasReadDialog(dialogId)) {
                pdata.phase0.dialogRead = true;
                pdata.phase0.dialogReadTime = Date.now();
                logToFile('onboarding', '[p0.dialog.complete] ' + player.getName() + ' read dialog id=' + dialogId);
                // Award real bike + wrench via loot tables if not already
                if (!pdata.phase0.rewardsGiven) {
                    var world = player.getWorld();
                    var lootWrench = pullLootTable(_LOOTTABLE_VEHICLE_WRENCH, player) || [];
                    var lootBike = pullLootTable(_LOOTTABLE_VEHICLE_BIKE, player) || [];
                    var combined = lootWrench.concat(lootBike);
                    for (var li = 0; li < combined.length; li++) {
                        var stack = generateItemStackFromLootEntry(combined[li], world);
                        if (stack) { player.giveItem(stack); }
                    }
                    pdata.phase0.rewardsGiven = true;
                    var npcFmt = dialogMeta.npc || '';
                    var rewardMsg = dialogMeta.chat.onReward;
                    rewardMsg = rewardMsg.replace('{npc}', npcFmt);
                    tellPlayer(player, rewardMsg);
                    logToFile('onboarding', '[p0.rewards.granted] ' + player.getName() + ' granted bike + wrench via loot tables.');
                }
                // Start timer immediately per spec
                if (!pdata.phase0.timerStarted) {
                    pdata.phase0.timerStarted = true;
                    pdata.phase0.timerStartMs = Date.now();
                    tellSeparatorTitle(player, 'State Hotel Transfer', '&6', '&e');
                    try {
                        var delaySec = mediumDelayMs / 1000;
                        var npcNameD = dialogMeta.npc || '';
                        if (dialogMeta.chat && dialogMeta.chat.onDialogComplete) {
                            var msgA = String(dialogMeta.chat.onDialogComplete).replace('{delay}', String(delaySec)).replace('{npc}', npcNameD);
                            tellPlayer(player, msgA);
                        }
                        // if (dialogMeta.chat && dialogMeta.chat.onTimerStart) {
                        //     var msgB = String(dialogMeta.chat.onTimerStart).replace('{delay}', String(delaySec)).replace('{npc}', npcNameD);
                        //     tellPlayer(player, msgB);
                        // }
                    } catch (tmErr) { /* ignore */ }
                    logToFile('onboarding', '[p0.timer.start] ' + player.getName() + ' Phase0 transfer timer started (auto-detected dialog).');
                }
                changed = true;
            }
        }
    }
    var region = arrival.region;
    if (region) {
        var pos = player.getPos();
        if (!isWithinAABB(pos, region.p1, region.p2)) {
            // Only confine if player still in phase 0 and not teleported out
            if (!(pdata.phase0 && pdata.phase0.completed)) {
                var fb = region.fallback;
                player.setPosition(fb[0] + 0.5, fb[1], fb[2] + 0.5);
                player.setRotation(region.fallback_rotation)
                player.setPitch(region.fallback_pitch)
                // Confine chat: inform player and reset reminder timer to avoid spam
                var chatCfgC = (arrival.dialog && arrival.dialog.chat) || {};
                if (!pdata.phase0) pdata.phase0 = {};
                if (pdata.phase0 && pdata.phase0.timerStarted && !pdata.phase0.completed) {
                    // During transfer, allow immediate informative message
                    var msgC = chatCfgC.onTimerStart;
                    if (msgC) {
                        var npcN = dialogMeta.npc;
                        tellPlayer(player, String(msgC).replace('{npc}', npcN));
                    }
                } else {
                    // Before dialog completion: only show confine message after the short delay since welcome
                    var welcomeTime0 = pdata.phase0.welcomeTime || 0;
                    var afterShort = welcomeTime0 && ((nowGen - welcomeTime0) >= shortDelayMs);
                    if (afterShort) {
                        var npcN2 = dialogMeta.npc || '';
                        var confineMsg = chatCfgC.onConfine ? String(chatCfgC.onConfine) : null;
                        if (confineMsg) tellPlayer(player, confineMsg.replace('{npc}', npcN2));
                    }
                }
                // Reset the general reminder timer so the loop waits full interval (no log for looped confine)
                pdata.phase0.lastGeneralReminder = Date.now();
            }
        }
    }

    // (Legacy path removed: timer now started immediately when dialog detection occurs)

    // Timer countdown -> teleport
    if (pdata.phase0 && pdata.phase0.timerStarted && !pdata.phase0.completed) {
        var dcfg2 = arrival.dialog;
        var delay = longDelayMs / 1000.0;
        var elapsed = (Date.now() - pdata.phase0.timerStartMs) / 1000.0;
        if (elapsed >= delay) {
            var tp = dcfg2.state_hotel_tp || { pos: [-4300, 90, 3700], yaw: 0, pitch: 0 };
            var p = tp.pos || [-4300, 90, 3700];
            player.setPosition(p[0] + 0.5, p[1], p[2] + 0.5);
            player.setRotation(tp.yaw)
            player.setPitch(tp.pitch)
            pdata.phase0.completed = true;
            pdata.phase = 1; // advance to next phase (placeholder)
            pdata.phase0.teleportTime = Date.now();
            changed = true;
            // tellSeparatorTitle(player, 'Phase 0 - Teleport', '&6', '&6');
            tellPlayer(player, dcfg2.chat.onTeleport);
            // Phase 0 completion separator (see chat_convention.md -> Phase 0 separator color &6)
            tellSeparator(player, '&6');
            logToFile('onboarding', '[p0.teleport.complete] ' + player.getName() + ' Phase0 -> State Hotel.');
        }
    }

    // Generic periodic reminders for Phase 0 (start only after long delay from welcome)
    if (!pdata.phase0) pdata.phase0 = {};
    if (!pdata.phase0.completed) {
        var chatCfg0 = (arrival.dialog && arrival.dialog.chat) || {};
        var welcomeTime = pdata.phase0.welcomeTime || 0;
        var afterWelcomeDelay = welcomeTime && ((nowGen - welcomeTime) >= longDelayMs);
        if (afterWelcomeDelay) {
            // Before dialog: remind to speak with NPC
            if (!pdata.phase0.dialogRead) {
                if (!pdata.phase0.lastGeneralReminder || (nowGen - pdata.phase0.lastGeneralReminder) > intervalMs) {
                    var npcName0 = arrival.dialog.npc;
                    var repeatMsg = chatCfg0.onRepeat || chatCfg0.onWelcome || chatCfg0.onConfine;
                    if (repeatMsg) {
                        tellPlayer(player, String(repeatMsg).replace('{npc}', npcName0 || ''));
                    }
                    pdata.phase0.lastGeneralReminder = nowGen;
                    changed = true;
                }
            } else if (pdata.phase0.timerStarted && !pdata.phase0.completed) {
                // During transfer timer: remind transfer is in progress
                if (!pdata.phase0.lastGeneralReminder || (nowGen - pdata.phase0.lastGeneralReminder) > intervalMs) {
                    var npcNm = arrival.dialog.npc;
                    var msgR = chatCfg0.onTimerStart;
                    if (msgR) tellPlayer(player, String(msgR).replace('{npc}', npcNm));
                    pdata.phase0.lastGeneralReminder = nowGen;
                    changed = true;
                }
            }
        }
    }
    return changed;
}