// Phase 0 logic – returns true if data changed.
function onboarding_run_phase0(player, pdata, phaseCfg, globalCfg) {
    if (!phaseCfg || !phaseCfg.enabled) return false;
    var changed = false;
    var arrival = phaseCfg.stages && phaseCfg.stages.arrival ? phaseCfg.stages.arrival : null;
    if (!arrival) return false;

    // Detect dialog completion automatically by polling the player's dialog history
    try {
        var dialogMeta = arrival.dialog || {};
        var dialogId = dialogMeta.id; // Could be numeric or string
        if (typeof dialogId !== 'undefined' && dialogId !== null) {
            // Normalize to int if numeric string
            if (typeof dialogId === 'string' && dialogId.match(/^\d+$/)) { dialogId = parseInt(dialogId, 10); }
            var hasRead = false;
            if (!pdata.phase0.dialogRead) {
                try { hasRead = player.hasReadDialog(dialogId); } catch (ee) { hasRead = false; }
                if (hasRead) {
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
                            try {
                                var stack = generateItemStackFromLootEntry(combined[li], world);
                                if (stack) { player.giveItem(stack); }
                            } catch (giErr) {
                                logToFile('onboarding', '[reward-error] ' + player.getName() + ' loot gen failed: ' + giErr);
                            }
                        }
                        pdata.phase0.rewardsGiven = true;
                        tellPlayer(player, ':giftchest: &aStarter transport issued: bicycle \& wrench.');
                        logToFile('onboarding', '[rewards] ' + player.getName() + ' granted bike + wrench via loot tables.');
                    }
                    // Start timer immediately per spec
                    if (!pdata.phase0.timerStarted) {
                        pdata.phase0.timerStarted = true;
                        pdata.phase0.timerStartMs = Date.now();
                        tellPlayer(player, (dialogMeta.chat && dialogMeta.chat.onDialogComplete) || '&aPaperwork accepted. Preparing transfer...');
                        // Also show timer start feedback (could be same or separate message)
                        if (dialogMeta.chat && dialogMeta.chat.onTimerStart) {
                            tellPlayer(player, dialogMeta.chat.onTimerStart);
                        }
                        logToFile('onboarding', '[timer-start] ' + player.getName() + ' Phase0 transfer timer started (auto-detected dialog).');
                    }
                    changed = true;
                }
            }
        }
    } catch (pollErr) {
        // Log once maybe? For simplicity log each occurrence (should be rare)
        // Avoid spamming by only logging if massive error state would occur; left minimal.
    }
    var region = arrival.region;
    if (region) {
        var pos = player.getPos();
        if (!__onboarding_isInside(pos.x, pos.y, pos.z, region.p1, region.p2)) {
            // Only confine if player still in phase 0 and not teleported out
            if (!(pdata.phase0 && pdata.phase0.completed)) {
                var fb = region.fallback;
                player.setPosition(fb[0] + 0.5, fb[1], fb[2] + 0.5);
                tellPlayer(player, arrival.dialog.chat.onConfine || "&cReturn to the desk to finish immigration.");
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
            tellPlayer(player, dcfg2.chat.onTeleport || '&bTransfer complete. Welcome!');
            logToFile('onboarding', '[teleport] ' + player.getName() + ' Phase0 -> State Hotel.');
            if (globalCfg.general && globalCfg.general.logJson) {
                logToJson('onboarding', 'phase_changes', { player: player.getName(), phase: 0, action: 'teleport_complete', time: new Date().toISOString() });
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