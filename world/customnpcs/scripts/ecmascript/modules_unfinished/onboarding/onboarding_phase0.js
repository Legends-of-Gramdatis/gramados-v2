// Phase 0 logic – returns true if data changed.
function onboarding_run_phase0(player, pdata, phaseCfg, globalCfg) {
    if (!phaseCfg || !phaseCfg.enabled) return false;
    var changed = false;
    var arrival = phaseCfg.stages && phaseCfg.stages.arrival ? phaseCfg.stages.arrival : null;
    if (!arrival) return false;
    var intervalMs = globalCfg.general.generic_streamline_interval * 1000;
    var longDelayMs = globalCfg.general.generic_streamline_delay_long * 1000;
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
                logToFile('onboarding', '[dialog-detected] ' + player.getName() + ' read dialog id=' + dialogId);
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
                    tellPlayer(player, ':giftchest: &aStarter transport issued: bicycle and wrench.');
                    logToFile('onboarding', '[rewards] ' + player.getName() + ' granted bike + wrench via loot tables.');
                }
                // Start timer immediately per spec
                if (!pdata.phase0.timerStarted) {
                    pdata.phase0.timerStarted = true;
                    pdata.phase0.timerStartMs = Date.now();
                    tellSeparatorTitle(player, 'Transfer', '&6', '&6');
                    tellPlayer(player, dialogMeta.chat.onDialogComplete);
                    
                    if (dialogMeta.chat.onTimerStart) {
                        tellPlayer(player, dialogMeta.chat.onTimerStart);
                    }
                    logToFile('onboarding', '[timer-start] ' + player.getName() + ' Phase0 transfer timer started (auto-detected dialog).');
                }
                changed = true;
            }
        }
    }
    var region = arrival.region;
    if (region) {
        var pos = player.getPos();
        if (!__onboarding_isInside(pos.x, pos.y, pos.z, region.p1, region.p2)) {
            // Only confine if player still in phase 0 and not teleported out
            if (!(pdata.phase0 && pdata.phase0.completed)) {
                var fb = region.fallback;
                player.setPosition(fb[0] + 0.5, fb[1], fb[2] + 0.5);
                // Confine chat: inform player and reset reminder timer to avoid spam
                var chatCfgC = (arrival.dialog && arrival.dialog.chat) || {};
                if (!pdata.phase0) pdata.phase0 = {};
                if (pdata.phase0 && pdata.phase0.timerStarted && !pdata.phase0.completed) {
                    // During transfer, allow immediate informative message
                    tellPlayer(player, chatCfgC.onConfineAfterDialog || chatCfgC.onTimerStart);
                } else {
                    // Before dialog completion: only show confine message after the short delay since welcome
                    var welcomeTime0 = pdata.phase0.welcomeTime || 0;
                    var afterShort = welcomeTime0 && ((nowGen - welcomeTime0) >= shortDelayMs);
                    if (afterShort) {
                        tellPlayer(player, chatCfgC.onConfine);
                    }
                }
                // Reset the general reminder timer so the loop waits full interval
                pdata.phase0.lastGeneralReminder = Date.now();
                logToFile('onboarding', '[confine] ' + player.getName() + ' attempted to exit Phase0 region. Teleported back.');
            }
        }
    }

    // (Legacy path removed: timer now started immediately when dialog detection occurs)

    // Timer countdown -> teleport
    if (pdata.phase0 && pdata.phase0.timerStarted && !pdata.phase0.completed) {
        var dcfg2 = arrival.dialog;
        var delay = dcfg2.teleport_delay_seconds || 5;
        var elapsed = (Date.now() - pdata.phase0.timerStartMs) / 1000.0;
        if (elapsed >= delay) {
            var tp = dcfg2.state_hotel_tp || { pos: [-4300, 90, 3700], yaw: 0, pitch: 0 };
            var p = tp.pos || [-4300, 90, 3700];
            player.setPosition(p[0] + 0.5, p[1], p[2] + 0.5);
            try { player.getMCEntity().rotationYaw = tp.yaw || 0; } catch (e) {}
            try { player.getMCEntity().rotationPitch = tp.pitch || 0; } catch (e) {}
            pdata.phase0.completed = true;
            pdata.phase = 1; // advance to next phase (placeholder)
            pdata.phase0.teleportTime = Date.now();
            changed = true;
            // tellSeparatorTitle(player, 'Phase 0 - Teleport', '&6', '&6');
            tellPlayer(player, dcfg2.chat.onTeleport);
            logToFile('onboarding', '[teleport] ' + player.getName() + ' Phase0 -> State Hotel.');
            if (globalCfg.general && globalCfg.general.logJson) {
                logToJson('onboarding', 'phase_changes', { player: player.getName(), phase: 0, action: 'teleport_complete', time: new Date().toISOString() });
            }
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
                    if (chatCfg0.onWelcome) {
                        tellPlayer(player, chatCfg0.onWelcome.replace('{npc}', npcName0 || ''));
                    } else if (chatCfg0.onConfine) {
                        tellPlayer(player, chatCfg0.onConfine.replace('{npc}', npcName0 || ''));
                    }
                    pdata.phase0.lastGeneralReminder = nowGen;
                    changed = true;
                }
            } else if (pdata.phase0.timerStarted && !pdata.phase0.completed) {
                // During transfer timer: remind transfer is in progress
                if (!pdata.phase0.lastGeneralReminder || (nowGen - pdata.phase0.lastGeneralReminder) > intervalMs) {
                    tellPlayer(player, chatCfg0.onConfineAfterDialog || chatCfg0.onTimerStart);
                    pdata.phase0.lastGeneralReminder = nowGen;
                    changed = true;
                }
            }
        }
    }
    return changed;
}

// Helpers (duplicated minimally to avoid polluting global scope; main script also defines the same names)
function __onboarding_isInside(x, y, z, p1, p2) {
    var minX = Math.min(p1[0], p2[0]);
    var maxX = Math.max(p1[0], p2[0]);
    var minY = Math.min(p1[1], p2[1]);
    var maxY = Math.max(p1[1], p2[1]);
    var minZ = Math.min(p1[2], p2[2]);
    var maxZ = Math.max(p1[2], p2[2]);
    return x >= minX && x <= maxX && y >= minY && y <= maxY && z >= minZ && z <= maxZ;
}