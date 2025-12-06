// Phase 3: Scrap for a Start (Stage 1 implemented, Stage 2 crate detection logic)
// Stage 1 - Salvaged Mess:
//  Step 1: Ensure player has required free inventory slots (skip if already enough).
//  Step 2: Give configured scrap items immediately, announce start message, wait short delay, then give a random crate from configured loot table.
// Completion of Stage 1 occurs when crate is awarded.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_dynmap.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js');

// Runner returns true when pdata changed
function onboarding_run_phase3(player, pdata, phaseCfg, globalCfg, allPlayers) {
    if (!phaseCfg || !phaseCfg.enabled) return false;
    if (!pdata) return false;
    var changed = false;
    if (!pdata.phase3) { pdata.phase3 = {}; changed = true; }

    // --- Timers / delays (reuse generic config values) ---
    var shortDelayMs  = (globalCfg.general.generic_streamline_delay_short) * 1000;
    var mediumDelayMs = (globalCfg.general.generic_streamline_delay_medium) * 1000;
    var longDelayMs   = (globalCfg.general.generic_streamline_delay_long) * 1000;
    var intervalMs    = (globalCfg.general.generic_streamline_interval) * 1000;

    var now = Date.now();

    // Gate Phase 3 start until long delay after Phase 2 completion (canteen purchase)
    // Detect Phase 2 completion timestamp heuristically.
    var p2CompletedAt = null;
    if (pdata.phase2) {
        var p2 = pdata.phase2;
        p2CompletedAt = p2.s5_completedTime || p2.stage5CompletedTime || p2.completedTime || p2.completed || null;
        if (p2CompletedAt === true) p2CompletedAt = p2.completedTime || p2.s5_completedTime || null;
    }
    if (!pdata.phase3._gateP2DelayChecked) {
        if (p2CompletedAt && typeof p2CompletedAt === 'number') {
            if ((now - p2CompletedAt) < longDelayMs) {
                return false; // wait until long delay passes after Phase 2 completion
            }
        }
        pdata.phase3._gateP2DelayChecked = true;
        changed = true;
    }

    // Initialize stage/step tracking
    if (typeof pdata.phase3.currentStage === 'undefined') { pdata.phase3.currentStage = 1; changed = true; }
    if (typeof pdata.phase3.currentStep === 'undefined') { pdata.phase3.currentStep = 1; changed = true; }

    var stage = pdata.phase3.currentStage;
    var step  = pdata.phase3.currentStep;

    var stage1Cfg = phaseCfg.stages.stage1;
    if (!stage1Cfg) return changed;

    switch(stage) {
        case 1: // Salvaged Mess
            switch(step) {
                case 1: // Ensure free inventory slots
                    var requiredSlots = stage1Cfg.required_free_slots;
                    var invItems = player.getInventory().getItems(); // size 36
                    var freeCount = 0;
                    for (var i = 0; i < invItems.length; i++) { if (invItems[i].isEmpty()) freeCount++; }
                    if (freeCount >= requiredSlots) {
                        // Skip directly to giving items
                        pdata.phase3.currentStep = 2;
                        changed = true;
                        break; // proceed next tick to step2
                    }
                    // Reminder throttling
                    var lastRem = pdata.phase3.lastReminderStep1 || 0;
                    if ((Date.now() - lastRem) >= intervalMs) {
                        var chatCfg = stage1Cfg.chat.inventory_free_slots_reminder;
                        tellPlayer(player, String(chatCfg).replace('{slots}', String(requiredSlots)));
                        pdata.phase3.lastReminderStep1 = Date.now();
                        changed = true;
                    }
                    break;
                case 2: // Give scrap items then award crate after delay
                    // On first entry to this step: give items + announce start
                    if (!pdata.phase3.stage1ItemsGiven) {
                        var itemsList = stage1Cfg.items || [];
                        if (!itemsList.length) {
                            // Config must provide items; fail loudly (no fallback)
                            tellPlayer(player, '&cPhase3 Stage1 configuration error: no items defined.');
                            logToFile('onboarding', '[p3.error] Missing items array in phase3.stage1 config for ' + player.getName());
                            return changed;
                        }
                        // Start message
                        tellSeparatorTitle(player, "Salvaged Mess", '&e', '&6');
                        var startMsg = stage1Cfg.chat.start;
                        var delaySec = Math.floor(shortDelayMs / 1000);
                        tellPlayer(player, String(startMsg).replace('{delay}', String(delaySec)));

                        var world = player.getWorld();
                        for (var ii = 0; ii < itemsList.length; ii++) {
                            var spec = itemsList[ii];
                            // Parse id and optional damage: pattern mod:item:damage or mod:item
                            var parts = String(spec).split(':');
                            if (parts.length < 2) {
                                logToFile('onboarding', '[p3.item.skip] Invalid item spec ' + spec + ' for ' + player.getName());
                                continue;
                            }
                            var id = parts[0] + ':' + parts[1];
                            var damage = 0;
                            if (parts.length > 2) {
                                var dmgStr = parts[2];
                                if (dmgStr.match(/^\d+$/)) damage = parseInt(dmgStr, 10);
                            }
                            var stack = world.createItem(id, damage, 1);
                            player.giveItem(stack);
                        }
                        pdata.phase3.stage1ItemsGiven = true;
                        pdata.phase3.stage1ItemsGivenTime = Date.now();
                        logToFile('onboarding', '[p3.stage1.items] ' + player.getName() + ' given ' + itemsList.length + ' scrap items.');
                        changed = true;
                    }
                    // After delay: award crate if not yet
                    if (pdata.phase3.stage1ItemsGiven && !pdata.phase3.stage1CrateGiven) {
                        var elapsed = Date.now() - pdata.phase3.stage1ItemsGivenTime;
                        if (elapsed >= shortDelayMs) {
                            var crateCfg = stage1Cfg.crate || {};
                            var ltPath = crateCfg.loot_table_path;
                            if (!ltPath) {
                                tellPlayer(player, '&cPhase3 Stage1 configuration error: crate.loot_table_path missing.');
                                logToFile('onboarding', '[p3.error] Missing crate loot table path for ' + player.getName());
                                return changed;
                            }
                            var lootEntries = pullLootTable(ltPath, player);
                            if (!lootEntries || !lootEntries.length) {
                                tellPlayer(player, '&cCrate loot table empty or failed: ' + ltPath);
                                logToFile('onboarding', '[p3.error] Crate loot empty for ' + player.getName() + ' path=' + ltPath);
                                return changed;
                            }
                            var world2 = player.getWorld();
                            for (var li = 0; li < lootEntries.length; li++) {
                                var entry = lootEntries[li];
                                var crateStack = world2.createItem(entry.id, entry.damage || 0, entry.count || 1);
                                player.giveItem(crateStack);
                            }
                            pdata.phase3.stage1CrateGiven = true;
                            pdata.phase3.stage1CrateGivenTime = Date.now();
                            // Completion message
                            tellPlayer(player, stage1Cfg.chat.completion);
                            logToFile('onboarding', '[p3.stage1.crate] ' + player.getName() + ' awarded crate from ' + ltPath);
                            // Mark completion of stage1 (future stages will advance beyond this)
                            pdata.phase3.stage1Completed = true;
                            // Advance to next stage after a medium delay
                            pdata.phase3.currentStage = 2;
                            pdata.phase3.currentStep = 0; // waiting window before Stage 2 starts
                            pdata.phase3.stage2DelayStartMs = Date.now();
                            changed = true;
                        }
                    }
                    break;
            }
            break;
        case 2: // Stage 2 - Packing the Crate (Steps 3.2.1 and 3.2.2)
            // Reuse Stage 1 crate loot table
            var ltCfg2 = stage1Cfg.crate || {};
            var lootTablePath2 = ltCfg2.loot_table_path;
            if (!lootTablePath2) { tellPlayer(player, '&cPhase3 Stage2 configuration error: crate.loot_table_path missing.'); logToFile('onboarding', '[p3.error] P3S2 missing crate loot table for ' + player.getName()); return changed; }
            var stage2CfgRoot = (phaseCfg.stages && phaseCfg.stages.stage2) ? phaseCfg.stages.stage2 : null;
            if (!stage2CfgRoot || typeof stage2CfgRoot.radius !== 'number') { tellPlayer(player, '&cPhase3 Stage2 configuration error: stage2.radius missing.'); logToFile('onboarding', '[p3.error] P3S2 missing radius for ' + player.getName()); return changed; }
            var radius = stage2CfgRoot.radius;
            switch(step) {
                case 0: // waiting before starting Stage 2
                    if (!pdata.phase3.stage2DelayStartMs) {
                        pdata.phase3.stage2DelayStartMs = Date.now();
                        changed = true;
                        break;
                    }
                    if ((Date.now() - pdata.phase3.stage2DelayStartMs) >= 0) {
                        // Move to step 1: announce and capture baseline
                        pdata.phase3.currentStep = 1;
                        // Clear any previously stored state
                        pdata.phase3.stage2BaselineUUIDs = [];
                        pdata.phase3.stage2CrateUUID = '';
                        pdata.phase3.stage2LastReminderMs = 0;
                        changed = true;
                    }
                    break;
                case 1: // 3.2.1 Step 1 - Placing the crate
                    // On first entry to this step: show separator and capture baseline set
                    if (!pdata.phase3.stage2BaselineSetMs) {
                        // Show separator only the first time Stage 2 is entered (avoid repeat on resets)
                        if (!pdata.phase3.stage2BannerShown) {
                            tellSeparatorTitle(player, 'Packing the Crate', '&e', '&6');
                            pdata.phase3.stage2BannerShown = true;
                        }
                        var stage2Cfg = (phaseCfg.stages.stage2) ? phaseCfg.stages.stage2 : null;
                        // Stage 2 step1 messages are now under step1.chat (not root chat)
                        var stage2Chat = (stage2Cfg && stage2Cfg.step1 && stage2Cfg.step1.chat) ? stage2Cfg.step1.chat : null;
                        var showFailureInstead = pdata.phase3.stage2ShowFailureStart ? true : false;
                        if (stage2Chat) {
                            if (showFailureInstead && stage2Chat.failure) {
                                tellPlayer(player, stage2Chat.failure);
                                // If a failure reminder was scheduled, send when due and clear
                                if (pdata.phase3.stage2FailureReminderDueAt && Date.now() >= pdata.phase3.stage2FailureReminderDueAt) {
                                    if (stage2Chat.failure_reminder) tellPlayer(player, stage2Chat.failure_reminder);
                                    pdata.phase3.stage2FailureReminderDueAt = 0;
                                }
                            } else if (stage2Chat.start) {
                                tellPlayer(player, stage2Chat.start);
                            }
                        }
                        pdata.phase3.stage2ShowFailureStart = false;

                        // Capture baseline UUIDs present now
                        var baseNow = _p3s2_scanCrateInventoryUUIDs(player.getWorld(), player.getPos(), radius, lootTablePath2);
                        var baseList = Object.keys(baseNow);
                        pdata.phase3.stage2BaselineUUIDs = baseList;
                        pdata.phase3.stage2BaselineSetMs = Date.now();
                        // First reminder should wait full interval after start
                        pdata.phase3.stage2LastReminderMs = Date.now();
                        changed = true;
                        break; // wait next tick to compare
                    }

                    // Compare current set vs baseline
                    var curr = _p3s2_scanCrateInventoryUUIDs(player.getWorld(), player.getPos(), radius, lootTablePath2);
                    var added = [];
                    var baseline = pdata.phase3.stage2BaselineUUIDs || [];
                    var k;
                    for (k in curr) {
                        var presentInBase = false;
                        for (var bi = 0; bi < baseline.length; bi++) { if (baseline[bi] === k) { presentInBase = true; break; } }
                        if (!presentInBase) added.push(k);
                    }
                    if (added.length > 0) {
                        pdata.phase3.stage2CrateUUID = added[0];
                        pdata.phase3.stage2CrateLockedMs = Date.now();
                        // Cache the corresponding crate item id for later inventory detection
                        var foundPartForId = _p3s2_findCratePartByUUID(player.getWorld(), player.getPos(), radius, lootTablePath2, pdata.phase3.stage2CrateUUID);
                        if (foundPartForId) {
                            var packIDc = foundPartForId.has('packID') ? String(foundPartForId.getString('packID')) : '';
                            var systemNamec = foundPartForId.has('systemName') ? String(foundPartForId.getString('systemName')) : '';
                            var subNamec = foundPartForId.has('subName') ? String(foundPartForId.getString('subName')) : '';
                            if (packIDc && systemNamec) {
                                pdata.phase3.stage2CrateItemId = 'mts:' + packIDc + '.' + systemNamec + (subNamec ? subNamec : '');
                            }
                        }
                        // Completion message for Step 1 (now under step1.chat)
                        var s1ChatRoot = (stage2CfgRoot && stage2CfgRoot.step1 && stage2CfgRoot.step1.chat) ? stage2CfgRoot.step1.chat : null;
                        if (s1ChatRoot && s1ChatRoot.completion) tellPlayer(player, s1ChatRoot.completion);
                        // Move to Step 2 after a short delay (no separator between steps)
                        // pdata.phase3.stage2Step2AvailableAt = Date.now() + shortDelayMs;
                        pdata.phase3.currentStep = 2; // move to filling
                        changed = true; break;
                    }
                    // Reminder every minute until detection
                    var lastR = pdata.phase3.stage2LastReminderMs || 0;
                    if ((Date.now() - lastR) >= intervalMs) {
                        var stage2Chat2 = (stage2CfgRoot && stage2CfgRoot.step1 && stage2CfgRoot.step1.chat) ? stage2CfgRoot.step1.chat : null;
                        if (stage2Chat2 && stage2Chat2.reminder) tellPlayer(player, stage2Chat2.reminder);
                        pdata.phase3.stage2LastReminderMs = Date.now();
                        changed = true;
                    }
                    break;
                case 2: // 3.2.2 Step 2 - Filling the crate
                    // Wait short delay between previous completion and this step's start message
                    // if (pdata.phase3.stage2Step2AvailableAt && Date.now() < pdata.phase3.stage2Step2AvailableAt) {
                    //     break;
                    // }
                    var focusId = pdata.phase3.stage2CrateUUID || '';
                    if (!focusId) {
                        // Should not happen, re-enter step 1
                        pdata.phase3.stage2BaselineUUIDs = [];
                        pdata.phase3.stage2BaselineSetMs = 0;
                        pdata.phase3.currentStep = 1;
                        changed = true;
                        break;
                    }
                    var curr2 = _p3s2_scanCrateInventoryUUIDs(player.getWorld(), player.getPos(), radius, lootTablePath2);
                    if (!curr2[focusId]) {
                        var step2ChatFail = (stage2CfgRoot && stage2CfgRoot.step2 && stage2CfgRoot.step2.chat) ? stage2CfgRoot.step2.chat : null;
                        if (step2ChatFail && step2ChatFail.failure) tellPlayer(player, step2ChatFail.failure);
                        pdata.phase3.stage2ShowFailureStart = true;
                        pdata.phase3.stage2BaselineUUIDs = [];
                        pdata.phase3.stage2BaselineSetMs = 0;
                        pdata.phase3.stage2CrateUUID = '';
                        pdata.phase3.currentStep = 1;
                        changed = true;
                        break;
                    }
                    // Show start once
                    if (!pdata.phase3.stage2Step2StartShown) {
                        var step2ChatStart = (stage2CfgRoot && stage2CfgRoot.step2 && stage2CfgRoot.step2.chat) ? stage2CfgRoot.step2.chat : null;
                        if (step2ChatStart && step2ChatStart.start) tellPlayer(player, step2ChatStart.start);
                        pdata.phase3.stage2Step2StartShown = true;
                        // First reminder should wait full interval after start
                        pdata.phase3.stage2Step2StartMs = Date.now();
                        pdata.phase3.stage2Step2LastReminder = Date.now();
                        changed = true; break;
                    }
                    // Validate crate contents (show missing list only on item removal)
                    var part = _p3s2_findCratePartByUUID(player.getWorld(), player.getPos(), radius, lootTablePath2, focusId);
                    if (part) {
                        var allItemsCfg = stage1Cfg.items || [];
                        // Build current content pairs and missing list
                        var contentPairsStep2 = _p3s2_extractContentPairsFromPartNbt(part);
                        var missingStep2 = _p3s2_getMissingRequiredItems(allItemsCfg, contentPairsStep2);
                        // Count total items (sum of counts) to detect removals
                        var totalCountNow = _p3s2_countTotalItemsInPartNbt(part);
                        if (typeof pdata.phase3.stage2Step2LastItemCount !== 'number') {
                            pdata.phase3.stage2Step2LastItemCount = totalCountNow;
                        }
                        if (missingStep2 && missingStep2.length > 0 && totalCountNow < pdata.phase3.stage2Step2LastItemCount) {
                            var names2 = _p3s2_specsToDisplayNames(player.getWorld(), missingStep2);
                            var step2ChatRoot = (stage2CfgRoot && stage2CfgRoot.step2 && stage2CfgRoot.step2.chat) ? stage2CfgRoot.step2.chat : {};
                            var msgMiss2 = step2ChatRoot && step2ChatRoot.failure_missing_world ? step2ChatRoot.failure_missing_world : (':danger: &eA required scrap item was removed from the crate. Please place it back: &6{items}&e.');
                            tellPlayer(player, msgMiss2.replace('{items}', names2.join(', ')));
                            logToFile('onboarding', '[p3.s2.step2.missing.world] ' + player.getName() + ' count ' + pdata.phase3.stage2Step2LastItemCount + ' -> ' + totalCountNow + ', missing=[' + names2.join(', ') + ']');
                            pdata.phase3.stage2Step2LastItemCount = totalCountNow; // update to current to avoid spam
                            changed = true;
                        } else if (totalCountNow > pdata.phase3.stage2Step2LastItemCount) {
                            // Items added -> update baseline silently
                            pdata.phase3.stage2Step2LastItemCount = totalCountNow;
                        }
                        if (_p3s2_crateHasAllItems(part, allItemsCfg)) {
                            var step2ChatComp = (stage2CfgRoot && stage2CfgRoot.step2 && stage2CfgRoot.step2.chat) ? stage2CfgRoot.step2.chat : null;
                            if (step2ChatComp && step2ChatComp.completion) tellPlayer(player, step2ChatComp.completion);
                            // Move to Step 3 after a short delay (no separator between steps)
                            pdata.phase3.stage2Step3AvailableAt = Date.now();
                            pdata.phase3.currentStep = 3; // scaffold for next step (picking up)
                            pdata.phase3.stage2FilledAt = Date.now();
                            // Clear step2 counters
                            pdata.phase3.stage2Step2LastItemCount = 0;
                            changed = true; break;
                        }
                    }
                    // Periodic reminder
                    var lastRR = pdata.phase3.stage2Step2LastReminder || 0;
                    if ((Date.now() - lastRR) >= intervalMs) {
                        var step2ChatRem = (stage2CfgRoot && stage2CfgRoot.step2 && stage2CfgRoot.step2.chat) ? stage2CfgRoot.step2.chat : null;
                        if (step2ChatRem && step2ChatRem.reminder) tellPlayer(player, step2ChatRem.reminder);
                        pdata.phase3.stage2Step2LastReminder = Date.now();
                        changed = true;
                    }
                    break;
                case 3: // 3.2.3 Step 3 - Picking up the filled crate
                    // Wait short delay between previous completion and this step's start message
                    if (pdata.phase3.stage2Step3AvailableAt && Date.now() < pdata.phase3.stage2Step3AvailableAt) {
                        break;
                    }
                    var focusUUID = pdata.phase3.stage2CrateUUID || '';
                    if (!focusUUID) {
                        // No focus -> restart stage2 step1
                        pdata.phase3.stage2BaselineUUIDs = [];
                        pdata.phase3.stage2BaselineSetMs = 0;
                        pdata.phase3.currentStep = 1;
                        changed = true;
                        break;
                    }
                    var step3Chat = (stage2CfgRoot && stage2CfgRoot.step3 && stage2CfgRoot.step3.chat) ? stage2CfgRoot.step3.chat : null;
                    // Show start once
                    if (!pdata.phase3.stage2Step3StartShown) {
                        if (step3Chat && step3Chat.start) tellPlayer(player, step3Chat.start);
                        pdata.phase3.stage2Step3StartShown = true;
                        // First reminder should wait full interval after start
                        pdata.phase3.stage2Step3StartMs = Date.now();
                        pdata.phase3.stage2Step3LastReminder = Date.now();
                        changed = true;
                        break; // wait next tick for action
                    }
                    // Determine if crate part still exists near player
                    var nearbySet = _p3s2_scanCrateInventoryUUIDs(player.getWorld(), player.getPos(), radius, lootTablePath2);
                    var partStillPresent = !!nearbySet[focusUUID];
                    // Debug: log presence status each tick (file-only to avoid chat spam)
                    logToFile('onboarding', '[p3.s2.step3.tick] ' + player.getName() + ' focusUUID=' + focusUUID + ' present=' + partStillPresent);
                    if (partStillPresent) {
                        // If crate is present but missing required items (someone removed them), notify once per change
                        var partNow = _p3s2_findCratePartByUUID(player.getWorld(), player.getPos(), radius, lootTablePath2, focusUUID);
                        if (partNow) {
                            var presentPairs = _p3s2_extractContentPairsFromPartNbt(partNow);
                            var missingReq = _p3s2_getMissingRequiredItems(stage1Cfg.items || [], presentPairs);
                            if (missingReq && missingReq.length > 0) {
                                var missKey3 = missingReq.slice().sort().join(',');
                                if (pdata.phase3.stage2Step3LastMissingKey !== missKey3) {
                                    pdata.phase3.stage2Step3LastMissingKey = missKey3;
                                    var names = _p3s2_specsToDisplayNames(player.getWorld(), missingReq);
                                    var s3chat = (stage2CfgRoot && stage2CfgRoot.step3 && stage2CfgRoot.step3.chat) ? stage2CfgRoot.step3.chat : {};
                                    var msg = s3chat && s3chat.failure_missing_world ? s3chat.failure_missing_world : (':danger: &eYou removed a required item from the crate. Please put it back: &6{items}&e.');
                                    tellPlayer(player, msg.replace('{items}', names.join(', ')));
                                    logToFile('onboarding', '[p3.s2.step3.missing.world] ' + player.getName() + ' missing=[' + names.join(', ') + ']');
                                    changed = true;
                                }
                            } else {
                                // Clear so future removals are re-announced
                                if (pdata.phase3.stage2Step3LastMissingKey) {
                                    pdata.phase3.stage2Step3LastMissingKey = '';
                                }
                            }
                        }
                        // Reset removal observation window if crate re-appears
                        pdata.phase3.stage2Step3RemovedAt = 0;
                        // Remind to pick it up every interval
                        var lastStep3Rem = pdata.phase3.stage2Step3LastReminder || 0;
                        if ((Date.now() - lastStep3Rem) >= intervalMs) {
                            if (step3Chat && step3Chat.reminder) tellPlayer(player, step3Chat.reminder);
                            pdata.phase3.stage2Step3LastReminder = Date.now();
                            changed = true;
                        }
                        break;
                    }
                    // Crate part no longer on ground: start short observation window to detect inventory pickup
                    if (!pdata.phase3.stage2Step3RemovedAt) {
                        pdata.phase3.stage2Step3RemovedAt = Date.now();
                        // Clear prior failure reminder flags
                        pdata.phase3.stage2FailureReminderDueAt = 0;
                        // Debug: crate removed detection
                        var obsSec = Math.floor(shortDelayMs/1000);
                        // tellPlayer(player, '&7[dbg] crate removed from world. Observing inventory for ' + obsSec + 's...');
                        logToFile('onboarding', '[p3.s2.step3.removed] ' + player.getName() + ' crate disappeared, start observationWindowMs=' + shortDelayMs + ', crateIdHint=' + (pdata.phase3.stage2CrateItemId||'') + ', radius=' + radius);
                        changed = true;
                        break;
                    }
                    var sinceRemoval = Date.now() - (pdata.phase3.stage2Step3RemovedAt || 0);
                    var crateIdHint = pdata.phase3.stage2CrateItemId || '';
                    var requiredList = stage1Cfg.items || [];
                    var invStatus = _p3s2_findCrateItemStatusInInventory(player, lootTablePath2, crateIdHint, requiredList);
                    if (invStatus && invStatus.found && invStatus.hasAll) {
                        // Success
                        tellPlayer(player, step3Chat.completion);
                        logToFile('onboarding', '[p3.s2.step3.success] ' + player.getName() + ' matching crate found in inventory within observation window.');
                        pdata.phase3.stage2PickupCompleted = true;
                        // Gate Stage 3 start with a medium delay
                        pdata.phase3.currentStage = 3;
                        pdata.phase3.currentStep = 0; // waiting gate before Stage 3 step 1
                        pdata.phase3.stage3DelayStartMs = Date.now();
                        // Reset transient state
                        pdata.phase3.stage2Step3RemovedAt = 0;
                        changed = true;
                        break;
                    } else if (invStatus && invStatus.found && !invStatus.hasAll) {
                        // Specific failure: crate in inventory but missing required items
                        var namesInv = _p3s2_specsToDisplayNames(player.getWorld(), invStatus.missingKeys || []);
                        var s3chat2 = (stage2CfgRoot && stage2CfgRoot.step3 && stage2CfgRoot.step3.chat) ? stage2CfgRoot.step3.chat : {};
                        var msg2 = s3chat2 && s3chat2.failure_missing_inventory ? s3chat2.failure_missing_inventory : (':danger: &eThe crate you picked up is missing required items: &6{items}&e. Place it down and put them back.');
                        tellPlayer(player, msg2.replace('{items}', namesInv.join(', ')));
                        logToFile('onboarding', '[p3.s2.step3.missing.inventory] ' + player.getName() + ' missing=[' + namesInv.join(', ') + ']');
                        // Fail immediately and reset to Step 1
                        pdata.phase3.stage2FailureReminderDueAt = Date.now() + intervalMs;
                        pdata.phase3.stage2ShowFailureStart = true;
                        pdata.phase3.stage2BaselineUUIDs = [];
                        pdata.phase3.stage2BaselineSetMs = 0;
                        pdata.phase3.stage2CrateUUID = '';
                        pdata.phase3.stage2Step2StartShown = false;
                        pdata.phase3.stage2Step3StartShown = false;
                        pdata.phase3.currentStep = 1; // back to placing
                        changed = true;
                        break;
                    }
                    if (sinceRemoval <= shortDelayMs) {
                        // Still within observation window; keep waiting without failing yet
                        // Debug: within observation window
                        var leftMs = (shortDelayMs - sinceRemoval);
                        logToFile('onboarding', '[p3.s2.step3.wait] ' + player.getName() + ' still observing inventory, msLeft=' + leftMs);
                        break;
                    }
                    // Observation window expired: issue failure and schedule failure reminder
                    if (step3Chat && step3Chat.failure) tellPlayer(player, step3Chat.failure);
                    // tellPlayer(player, '&7[dbg] observation window expired; no valid crate found in inventory.');
                    logToFile('onboarding', '[p3.s2.step3.fail] ' + player.getName() + ' observation window expired; no matching crate detected.');
                    // Schedule failure reminder after interval
                    pdata.phase3.stage2FailureReminderDueAt = Date.now() + intervalMs;
                    pdata.phase3.stage2ShowFailureStart = true;
                    pdata.phase3.stage2BaselineUUIDs = [];
                    pdata.phase3.stage2BaselineSetMs = 0;
                    pdata.phase3.stage2CrateUUID = '';
                    pdata.phase3.stage2Step2StartShown = false;
                    pdata.phase3.stage2Step3StartShown = false;
                    pdata.phase3.currentStep = 1; // back to placing
                    changed = true;
                    break;
                    break;
            }
            break;
        case 3: // 3.3 Stage 3 - Selling Crate Contents
            var stage3Cfg = phaseCfg.stages.stage3;
            var facilities = stage3Cfg.facilities;
            // Use first facility (FerraSol) by default
            var fac = facilities[0];
            var fac2 = facilities.length > 1 ? facilities[1] : null; // Non-ferrous facility
            var s1chat = stage3Cfg.step1.chat;
            switch(step){
                case 0: // Waiting gate before starting Stage 3 messages
                    if (!pdata.phase3.stage3DelayStartMs) {
                        pdata.phase3.stage3DelayStartMs = Date.now();
                        changed = true;
                        break;
                    }
                    if ((Date.now() - pdata.phase3.stage3DelayStartMs) >= mediumDelayMs) {
                        pdata.phase3.currentStep = 1;
                        changed = true;
                    }
                    break;
                case 1: // 3.3.1 Step 1 - Heading to the facility
                    var fac_name = getMarkerName(fac.dynmap_set, fac.dynmap_marker);
                    var fac_marker = getMarkerXYZ(fac.dynmap_set, fac.dynmap_marker);
                    if (!pdata.phase3.s3_step1Init) {
                        tellSeparatorTitle(player, 'Heading to the Selling Facility', '&e', '&6');
                        tellPlayer(player, s1chat.intro.replace('{facility_ferrous}', fac_name));
                        pdata.phase3.s3_step1Init = true;
                        pdata.phase3.s3_step1IntroAt = Date.now();
                        changed = true;
                        break;
                    }
                    if (!pdata.phase3.s3_step1HintShown) {
                        var sinceIntro = Date.now() - pdata.phase3.s3_step1IntroAt;

                        if (sinceIntro >= mediumDelayMs) {
                            tellPlayer(player, s1chat.journeymap_hint.replace('{facility_ferrous}', fac_name));
                            tellPlayer(player, s1chat.journeymap_waypoint.replace('{facility_ferrous}', fac_name).replace('{x}', fac_marker[0]).replace('{y}', fac_marker[1]).replace('{z}', fac_marker[2]));
                            pdata.phase3.s3_step1HintShown = true;
                            pdata.phase3.s3_step1LastMsg = Date.now();
                            changed = true;
                        }
                    } else {
                        var lastMsg = pdata.phase3.s3_step1LastMsg;
                        if ((Date.now() - lastMsg) >= intervalMs) {
                            tellPlayer(player, s1chat.reminder.replace('{facility_ferrous}', fac_name));
                            tellPlayer(player, s1chat.journeymap_waypoint.replace('{facility_ferrous}', fac_name).replace('{x}', fac_marker[0]).replace('{y}', fac_marker[1]).replace('{z}', fac_marker[2]));
                            pdata.phase3.s3_step1LastMsg = Date.now();
                            changed = true;
                        }
                    }
                    // Completion when entering facility cuboid
                    if (isPlayerInCuboid(player, fac.cuboid)) {
                        tellPlayer(player, s1chat.completion.replace('{facility_ferrous}', fac_name));
                        pdata.phase3.currentStep = 2; // next step of Stage 3
                        pdata.phase3.s3_arrivedAt = Date.now();
                        changed = true;
                        break;
                    }
                    break;
                case 2: // 3.3.2 Step 2 - Selling the crate's contents (ferrous preset)
                    var fac_name = getMarkerName(fac.dynmap_set, fac.dynmap_marker);
                    var fac_marker = getMarkerXYZ(fac.dynmap_set, fac.dynmap_marker);
                    var s2chat = stage3Cfg.step2.chat;
                    if (!pdata.phase3.s3_step2Init) {
                        tellPlayer(player, s2chat.start.replace('{facility_ferrous}', fac_name));
                        pdata.phase3.s3_step2Init = true;
                        pdata.phase3.s3_step2LastMsg = Date.now();
                        changed = true;
                        break;
                    }
                    // Periodic reminder
                    if (s2chat && s2chat.reminder) {
                        var lastMsg2 = pdata.phase3.s3_step2LastMsg || 0;
                        if ((Date.now() - lastMsg2) >= intervalMs) {
                            tellPlayer(player, s2chat.reminder);
                            pdata.phase3.s3_step2LastMsg = Date.now();
                            changed = true;
                        }
                    }
                    var economyLogPath = 'world/customnpcs/scripts/logs/economy.json';
                    var econ = loadJson(economyLogPath);
                    var pname = player.getName();
                    var entries = (econ && econ[pname]) ? econ[pname] : null;
                    if (!entries || !entries.length) {
                        break;
                    }
                    var foundFerrousSale = false;
                    var foundIndex = -1;
                    for (var ei = 0; ei < entries.length; ei++) {
                        var rec = entries[ei];
                        if (!rec) continue;
                        var t = rec.type;
                        var p = rec.preset;
                        var scanned = (typeof rec.scanned_by_onboarding !== 'undefined') ? !!rec.scanned_by_onboarding : false;
                        if (t === 'scrap_sale' && p === 'ferrous' && !scanned) { foundFerrousSale = true; foundIndex = ei; break; }
                    }
                    if (foundFerrousSale) {
                        // Tag the matched log entry to allow re-testing without immediate auto-complete
                        try {
                            entries[foundIndex].scanned_by_onboarding = true;
                            saveJson(econ, economyLogPath);
                        } catch (logErr) {
                            // Per onboarding rules, avoid try/catch unless necessary; here we log error and continue
                            logToFile('onboarding', '[p3.s3.step2.tag.error] ' + pname + ' failed to tag economy log: ' + logErr);
                        }
                        // Mark step completion; advance to next step placeholder
                        pdata.phase3.s3_step2Completed = true;
                        pdata.phase3.s3_step2CompletedAt = Date.now();
                        // Announce stage step completion
                        if (s2chat && s2chat.completion) tellPlayer(player, s2chat.completion);
                        logToFile('onboarding', '[p3.s3.step2.complete] ' + pname + ' ferrous scrap sale detected in logs.');
                        pdata.phase3.currentStep = 3; // advance to Step 3 (non-ferrous heading)
                        changed = true;
                        break;
                    }
                    // Otherwise, keep waiting until the log reflects the sale.
                    break;
                case 3: // 3.3.3 Step 3 - Heading to the non-ferrous facility
                    if (!fac2) { logToFile('onboarding', '[p3.s3.step3.error] Non-ferrous facility missing in config.'); break; }
                    var s3chat = (stage3Cfg && stage3Cfg.step3 && stage3Cfg.step3.chat) ? stage3Cfg.step3.chat : null;
                    var fac2_name = getMarkerName(fac2.dynmap_set, fac2.dynmap_marker);
                    var fac2_marker = getMarkerXYZ(fac2.dynmap_set, fac2.dynmap_marker);
                    // Gate Step 3 start with a medium delay
                    if (!pdata.phase3.s3_step3GateStartMs) {
                        pdata.phase3.s3_step3GateStartMs = Date.now();
                        changed = true;
                        break;
                    }
                    if ((Date.now() - pdata.phase3.s3_step3GateStartMs) < mediumDelayMs) {
                        break;
                    }
                    if (!pdata.phase3.s3_step3Init) {
                        tellSeparatorTitle(player, 'Heading to the Selling Facility', '&e', '&6');
                        if (s3chat && s3chat.intro) tellPlayer(player, s3chat.intro.replace('{facility_nonferrous}', fac2_name));
                        pdata.phase3.s3_step3Init = true;
                        pdata.phase3.s3_step3IntroAt = Date.now();
                        changed = true;
                        break;
                    }
                    if (!pdata.phase3.s3_step3HintShown) {
                        var sinceIntro3 = Date.now() - pdata.phase3.s3_step3IntroAt;
                        if (sinceIntro3 >= mediumDelayMs) {
                            if (s3chat && s3chat.journeymap_hint) tellPlayer(player, s3chat.journeymap_hint.replace('{facility_nonferrous}', fac2_name));
                            if (s3chat && s3chat.journeymap_waypoint) tellPlayer(player, s3chat.journeymap_waypoint.replace('{facility_nonferrous}', fac2_name).replace('{x}', fac2_marker[0]).replace('{y}', fac2_marker[1]).replace('{z}', fac2_marker[2]));
                            pdata.phase3.s3_step3HintShown = true;
                            pdata.phase3.s3_step3LastMsg = Date.now();
                            changed = true;
                        }
                    } else {
                        var lastMsg3 = pdata.phase3.s3_step3LastMsg || 0;
                        if ((Date.now() - lastMsg3) >= intervalMs) {
                            if (s3chat && s3chat.reminder) tellPlayer(player, s3chat.reminder.replace('{facility_nonferrous}', fac2_name));
                            if (s3chat && s3chat.journeymap_waypoint) tellPlayer(player, s3chat.journeymap_waypoint.replace('{facility_nonferrous}', fac2_name).replace('{x}', fac2_marker[0]).replace('{y}', fac2_marker[1]).replace('{z}', fac2_marker[2]));
                            pdata.phase3.s3_step3LastMsg = Date.now();
                            changed = true;
                        }
                    }
                    // Completion when entering non-ferrous facility cuboid
                    if (isPlayerInCuboid(player, fac2.cuboid)) {
                        if (s3chat && s3chat.completion) tellPlayer(player, s3chat.completion.replace('{facility_nonferrous}', fac2_name));
                        pdata.phase3.currentStep = 4; // next: selling non-ferrous
                        pdata.phase3.s3_arrivedAt2 = Date.now();
                        changed = true;
                        break;
                    }
                    break;
                case 4: // 3.3.4 Step 4 - Selling the remaining crate's contents (non-ferrous)
                    if (!fac2) { logToFile('onboarding', '[p3.s3.step4.error] Non-ferrous facility missing in config.'); break; }
                    var fac2_name = getMarkerName(fac2.dynmap_set, fac2.dynmap_marker);
                    var s4chat = stage3Cfg.step4.chat;
                    // If phase closure is already pending, wait for medium delay, then announce and advance
                    if (pdata.phase3.s3_phaseClosePending) {
                        var dueAt = pdata.phase3.s3_phaseCloseDueAt || 0;
                        if (Date.now() >= dueAt) {
                            // Announce Phase 3 completion and advance to Phase 4
                            tellPlayer(player, s4chat.phase_completion);
                            tellSeparator(player, "&e");
                            // placeholder message to tell the player the next phase is still WIP and will be automatically triggered when ready
                            tellPlayer(player, ':lit: &eThe next phase is currently under development and will be available soon. Stay tuned for updates!');
                            pdata.phase3.stage3Completed = true;
                            pdata.phase3.completed = true;
                            pdata.phase3.completedTime = Date.now();
                            pdata.phase = 4;
                            if (!pdata.phase4) { pdata.phase4 = { created: Date.now() }; }
                            // Clear pending flags
                            pdata.phase3.s3_phaseClosePending = false;
                            pdata.phase3.s3_phaseCloseDueAt = 0;
                            logToFile('onboarding', '[p3.complete] ' + player.getName() + ' Phase 3 completed (delayed); advancing to Phase 4.');
                            changed = true;
                        }
                        break;
                    }
                    if (!pdata.phase3.s3_step4Init) {
                        if (s4chat && s4chat.start) tellPlayer(player, s4chat.start.replace('{facility_nonferrous}', fac2_name));
                        pdata.phase3.s3_step4Init = true;
                        pdata.phase3.s3_step4LastMsg = Date.now();
                        changed = true;
                        break;
                    }
                    // Periodic reminder
                    if (s4chat && s4chat.reminder) {
                        var lastMsg4 = pdata.phase3.s3_step4LastMsg || 0;
                        if ((Date.now() - lastMsg4) >= intervalMs) {
                            tellPlayer(player, s4chat.reminder);
                            pdata.phase3.s3_step4LastMsg = Date.now();
                            changed = true;
                        }
                    }
                    // Detect non-ferrous sale in economy logs
                    var economyLogPath2 = 'world/customnpcs/scripts/logs/economy.json';
                    var econ2 = loadJson(economyLogPath2);
                    var pname2 = player.getName();
                    var entries2 = (econ2 && econ2[pname2]) ? econ2[pname2] : null;
                    if (!entries2 || !entries2.length) { break; }
                    var foundNonFerrousSale = false; var foundIndex2 = -1;
                    for (var ej = 0; ej < entries2.length; ej++) {
                        var rec2 = entries2[ej]; if (!rec2) continue;
                        var t2 = rec2.type; var p2 = rec2.preset;
                        var scanned2 = (typeof rec2.scanned_by_onboarding !== 'undefined') ? !!rec2.scanned_by_onboarding : false;
                        if (t2 === 'scrap_sale' && p2 === 'non_ferrous' && !scanned2) { foundNonFerrousSale = true; foundIndex2 = ej; break; }
                    }
                    if (foundNonFerrousSale) {
                        try {
                            entries2[foundIndex2].scanned_by_onboarding = true;
                            saveJson(econ2, economyLogPath2);
                        } catch (logErr2) {
                            logToFile('onboarding', '[p3.s3.step4.tag.error] ' + pname2 + ' failed to tag economy log: ' + logErr2);
                        }
                        pdata.phase3.s3_step4Completed = true;
                        pdata.phase3.s3_step4CompletedAt = Date.now();
                        if (s4chat && s4chat.completion) tellPlayer(player, s4chat.completion);
                        logToFile('onboarding', '[p3.s3.step4.complete] ' + pname2 + ' non-ferrous scrap sale detected in logs.');
                        // Schedule Phase 3 closure after medium delay
                        pdata.phase3.s3_phaseClosePending = true;
                        pdata.phase3.s3_phaseCloseDueAt = Date.now() + mediumDelayMs;
                        changed = true;
                        break;
                    }
                    break;
                default:
                    break;
            }
            break;
        default:
            break;
    }

    return changed;
}

// === Helpers (local to Phase 3 script) ===
// Scan nearby MTS entities, collect inventory.uniqueUUID for crate parts present in the given loot table.
function _p3s2_scanCrateInventoryUUIDs(world, pos, radius, lootTablePath) {
    var set = {};
    var entities = world.getNearbyEntities(pos, radius, 0);
    for (var i = 0; i < entities.length; i++) {
        var ent = entities[i];
        if (ent.getName() !== 'entity.mts_entity.name') continue;
        var nbt = ent.getEntityNbt();
        _p3s2_collectCrateInventoryUUIDsFromNbt(nbt, set, lootTablePath);
    }
    return set;
}

function _p3s2_collectCrateInventoryUUIDsFromNbt(nbt, outMap, lootTablePath) {
    if (!nbt) return;
    for (var i = 0; i < 64; i++) {
        var key = 'part_' + i;
        if (!nbt.has(key)) continue;
        var part = nbt.getCompound(key);
        if (!part) continue;
        var packID = part.has('packID') ? String(part.getString('packID')) : '';
        var systemName = part.has('systemName') ? String(part.getString('systemName')) : '';
        var subName = part.has('subName') ? String(part.getString('subName')) : '';
        if (packID && systemName) {
            var itemId = 'mts:' + packID + '.' + systemName + (subName ? subName : '');
            if (isItemInLootTable(lootTablePath, itemId)) {
                if (part.has('inventory')) {
                    var inv = part.getCompound('inventory');
                    if (inv && inv.has('uniqueUUID')) {
                        var uid = String(inv.getString('uniqueUUID'));
                        if (uid) outMap[uid] = true;
                    }
                }
            }
        }
        // Recurse into nested parts (stacked crates)
        _p3s2_collectCrateInventoryUUIDsFromNbt(part, outMap, lootTablePath);
    }
}

// Find the crate part compound by its inventory.uniqueUUID
function _p3s2_findCratePartByUUID(world, pos, radius, lootTablePath, uuid) {
    var entities = world.getNearbyEntities(pos, radius, 0);
    for (var i = 0; i < entities.length; i++) {
        var ent = entities[i];
        if (ent.getName() !== 'entity.mts_entity.name') continue;
        var nbt = ent.getEntityNbt();
        var found = _p3s2_collectPartByUUID(nbt, lootTablePath, uuid);
        if (found) return found;
    }
    return null;
}

function _p3s2_collectPartByUUID(nbt, lootTablePath, uuid) {
    if (!nbt) return null;
    for (var i = 0; i < 64; i++) {
        var key = 'part_' + i;
        if (!nbt.has(key)) continue;
        var part = nbt.getCompound(key);
        if (!part) continue;

        var packID = part.has('packID') ? String(part.getString('packID')) : '';
        var systemName = part.has('systemName') ? String(part.getString('systemName')) : '';
        var subName = part.has('subName') ? String(part.getString('subName')) : '';
        if (packID && systemName) {
            var itemId = 'mts:' + packID + '.' + systemName + (subName ? subName : '');
            if (isItemInLootTable(lootTablePath, itemId)) {
                if (part.has('inventory')) {
                    var inv = part.getCompound('inventory');
                    if (inv && inv.has('uniqueUUID')) {
                        var uid = String(inv.getString('uniqueUUID'));
                        if (uid === uuid) return part;
                    }
                }
            }
        }
        var nested = _p3s2_collectPartByUUID(part, lootTablePath, uuid);
        if (nested) return nested;
    }
    return null;
}

// Check if the crate's inventory contains at least one of each required item spec (mod:id[:damage])
function _p3s2_crateHasAllItems(partNbt, requiredSpecs) {
    if (!partNbt) return false;
    if (!requiredSpecs || !requiredSpecs.length) return false;
    if (!partNbt.has('inventory')) return false;
    var inv = partNbt.getCompound('inventory');
    if (!inv || !inv.has('Items')) return false;

    var present = {};
    var list = inv.getList('Items', 10);
    var size = 0;
    if (list) {
        if (typeof list.size === 'function') size = list.size(); else if (typeof list.length === 'number') size = list.length;
    }
    for (var i = 0; i < size; i++) {
        var it = (list && typeof list.get === 'function') ? list.get(i) : list[i];
        if (!it) continue;
        var iid = it.has('id') ? String(it.getString('id')) : '';
        var dmg = it.has('Damage') ? it.getInteger('Damage') : 0;
        var key = iid + ':' + String(dmg);
        present[key] = (present[key] ? present[key] + 1 : 1);
    }

    for (var r = 0; r < requiredSpecs.length; r++) {
        var spec = String(requiredSpecs[r]);
        var parts = spec.split(':');
        if (parts.length < 2) return false;
        var id = parts[0] + ':' + parts[1];
        var damage = 0;
        if (parts.length > 2 && parts[2].match(/^\d+$/)) damage = parseInt(parts[2], 10);
        var needKey = id + ':' + String(damage);
        if (!present[needKey] || present[needKey] < 1) return false;
    }
    return true;
}

// Scan player inventory for a crate item matching either a known crateId or any id in the loot table,
// and verify its embedded inventory contains all required items. Extra items are allowed.
function _p3s2_crateItemInInventoryHasAll(player, lootTablePath, crateIdHint, requiredSpecs) {
    var invItems = player.getInventory().getItems();
    var acceptableIds = {};
    if (crateIdHint && crateIdHint.length) {
        acceptableIds[crateIdHint] = true;
    } else {
        var loot = pullLootTable(lootTablePath, player) || [];
        for (var i = 0; i < loot.length; i++) {
            var le = loot[i];
            if (!le || !le.id) continue;
            acceptableIds[le.id] = true; // ignore damage here; MTS crates typically have 0
        }
    }
    for (var j = 0; j < invItems.length; j++) {
        var st = invItems[j];
        if (!st || st.isEmpty()) continue;
        var iid = st.getName();
        if (!acceptableIds[iid]) continue;
        // Debug: spotted a candidate crate item in inventory
        // logToFile('onboarding', '[p3.s2.inv.detect] ' + player.getName() + ' spotted candidate crate in slot=' + j + ' id=' + iid);
        // tellPlayer(player, '&7[dbg] spotted crate item in inventory: slot=' + j + ' id=' + iid);
        var nbt = (typeof st.getItemNbt === 'function') ? st.getItemNbt() : (typeof st.getNbt === 'function' ? st.getNbt() : null);
        if (!nbt) { logToFile('onboarding', '[p3.s2.inv.nobt] ' + player.getName() + ' item has no NBT: id=' + iid + ' slot=' + j); continue; }
        // Read content of the crate inventory and print a concise summary
        var contentSummary = '';
        var contentPairs = [];
        var totalItems = 0;
        // Support both top-level and 'tag' wrapped NBT
        var rootNbt = (nbt.has && nbt.has('tag')) ? nbt.getCompound('tag') : nbt;
        if (rootNbt && rootNbt.has && rootNbt.has('inventory')) {
            var inv = rootNbt.getCompound('inventory');
            if (inv && inv.has('Items')) {
                var list = inv.getList('Items', 10);
                var size = 0;
                if (list) {
                    if (typeof list.size === 'function') size = list.size(); else if (typeof list.length === 'number') size = list.length;
                }
                for (var i2 = 0; i2 < size; i2++) {
                    var it = (list && typeof list.get === 'function') ? list.get(i2) : list[i2];
                    if (!it) continue;
                    var iid2 = it.has('id') ? String(it.getString('id')) : '';
                    var dmg2 = it.has('Damage') ? it.getInteger('Damage') : 0;
                    var cnt2 = it.has('Count') ? it.getInteger('Count') : 1;
                    totalItems += cnt2;
                    // For matching, we only need id:damage (ignore counts)
                    contentPairs.push(iid2 + ':' + String(dmg2));
                }
            }
        }
        contentSummary = contentPairs.join(', ');
        // tellPlayer(player, '&7[dbg] crate content read: ' + (contentSummary || '(empty)'));
        // logToFile('onboarding', '[p3.s2.inv.content] ' + player.getName() + ' contentKeys=[' + contentSummary + '] total=' + totalItems);

        tellPlayer(player, '&7[dbg] crate expected items: ' + requiredSpecs.join(', '));
        // Validate against required specs using a simple comparator
        if (_p3s2_hasAllRequiredItems(requiredSpecs, contentPairs)) {
            // tellPlayer(player, '&7[dbg] crate content satisfies all required items.');
            logToFile('onboarding', '[p3.s2.inv.match] ' + player.getName() + ' crate in slot=' + j + ' matches required specs.');
            return true;
        } else {
            // tellPlayer(player, '&7[dbg] crate content does not yet satisfy required items.');
            logToFile('onboarding', '[p3.s2.inv.nomatch] ' + player.getName() + ' crate in slot=' + j + ' missing some required items.');
        }
    }
    return false;
}

// Find status of acceptable crate item in inventory and report missing keys if any.
function _p3s2_findCrateItemStatusInInventory(player, lootTablePath, crateIdHint, requiredSpecs) {
    var invItems = player.getInventory().getItems();
    var acceptableIds = {};
    if (crateIdHint && crateIdHint.length) acceptableIds[crateIdHint] = true; else {
        var loot = pullLootTable(lootTablePath, player) || [];
        for (var i = 0; i < loot.length; i++) { var le = loot[i]; if (le && le.id) acceptableIds[le.id] = true; }
    }
    for (var j = 0; j < invItems.length; j++) {
        var st = invItems[j];
        if (!st || st.isEmpty()) continue;
        var iid = st.getName();
        if (!acceptableIds[iid]) continue;
        var nbt = (typeof st.getItemNbt === 'function') ? st.getItemNbt() : (typeof st.getNbt === 'function' ? st.getNbt() : null);
        if (!nbt) continue;
        var contentPairs = [];
        var rootNbt = (nbt.has && nbt.has('tag')) ? nbt.getCompound('tag') : nbt;
        if (rootNbt && rootNbt.has && rootNbt.has('inventory')) {
            var inv = rootNbt.getCompound('inventory');
            if (inv && inv.has('Items')) {
                var list = inv.getList('Items', 10);
                var size = 0;
                if (list) { if (typeof list.size === 'function') size = list.size(); else if (typeof list.length === 'number') size = list.length; }
                for (var i2 = 0; i2 < size; i2++) {
                    var it = (list && typeof list.get === 'function') ? list.get(i2) : list[i2];
                    if (!it) continue;
                    var iid2 = it.has('id') ? String(it.getString('id')) : '';
                    var dmg2 = it.has('Damage') ? it.getInteger('Damage') : 0;
                    contentPairs.push(iid2 + ':' + String(dmg2));
                }
            }
        }
        var missing = _p3s2_getMissingRequiredItems(requiredSpecs || [], contentPairs);
        if (!missing.length) return { found: true, hasAll: true, slot: j, id: iid };
        return { found: true, hasAll: false, slot: j, id: iid, missingKeys: missing, contentPairs: contentPairs };
    }
    return { found: false };
}

// Build a list of contentPairs 'mod:id:damage' from a crate entity part NBT.
function _p3s2_extractContentPairsFromPartNbt(partNbt) {
    var pairs = [];
    if (!partNbt || !partNbt.has('inventory')) return pairs;
    var inv = partNbt.getCompound('inventory');
    if (!inv || !inv.has('Items')) return pairs;
    var list = inv.getList('Items', 10);
    var size = 0;
    if (list) { if (typeof list.size === 'function') size = list.size(); else if (typeof list.length === 'number') size = list.length; }
    for (var i = 0; i < size; i++) {
        var it = (list && typeof list.get === 'function') ? list.get(i) : list[i];
        if (!it) continue;
        var iid = it.has('id') ? String(it.getString('id')) : '';
        var dmg = it.has('Damage') ? it.getInteger('Damage') : 0;
        pairs.push(iid + ':' + String(dmg));
    }
    return pairs;
}

// Return the list of required keys that are missing from contentPairs (counts aware)
function _p3s2_getMissingRequiredItems(requiredSpecs, contentPairs) {
    var present = {};
    for (var i = 0; i < contentPairs.length; i++) {
        var key = _p3s2_normalizeSpec(contentPairs[i]);
        if (key) present[key] = (present[key] || 0) + 1;
    }
    var missing = [];
    for (var r = 0; r < (requiredSpecs || []).length; r++) {
        var need = _p3s2_normalizeSpec(String(requiredSpecs[r]));
        if (!need) continue;
        if (!present[need] || present[need] < 1) missing.push(need); else present[need] = present[need] - 1;
    }
    return missing;
}

// Sum of item counts in a crate part's inventory (uses NBT 'Count' per entry; defaults to 1 if missing)
function _p3s2_countTotalItemsInPartNbt(partNbt) {
    if (!partNbt || !partNbt.has('inventory')) return 0;
    var inv = partNbt.getCompound('inventory');
    if (!inv || !inv.has('Items')) return 0;
    var list = inv.getList('Items', 10);
    var size = 0;
    if (list) { if (typeof list.size === 'function') size = list.size(); else if (typeof list.length === 'number') size = list.length; }
    var total = 0;
    for (var i = 0; i < size; i++) {
        var it = (list && typeof list.get === 'function') ? list.get(i) : list[i];
        if (!it) continue;
        var cnt = it.has('Count') ? it.getByte('Count') : 1;
        // getByte returns signed; ensure positive integer handling
        if (cnt < 0) cnt = 256 + cnt; // wrap to unsigned byte range if needed
        total += cnt;
    }
    return total;
}

// Convert normalized spec keys to display names via world.createItem(id, damage, 1)
function _p3s2_specsToDisplayNames(world, specs) {
    var out = [];
    for (var i = 0; i < (specs || []).length; i++) {
        var s = String(specs[i]);
        var parts = s.split(':');
        if (parts.length < 2) { out.push(s); continue; }
        var id = parts[0] + ':' + parts[1];
        var dmg = 0; if (parts.length > 2 && String(parts[2]).match(/^\d+$/)) dmg = parseInt(parts[2], 10);
        var st = world.createItem(id, dmg, 1);
        var name = (st && typeof st.getDisplayName === 'function') ? st.getDisplayName() : s;
        out.push(name);
    }
    return out;
}

// Compare two lists of item keys, ignoring order and extras.
// requiredSpecs: array of 'mod:id[:damage]' specs.
// contentPairs: array of 'mod:id:damage' keys from container contents.
function _p3s2_hasAllRequiredItems(requiredSpecs, contentPairs) {
    if (!requiredSpecs || !requiredSpecs.length) return false;
    var present = {};
    for (var i = 0; i < contentPairs.length; i++) {
        var key = _p3s2_normalizeSpec(contentPairs[i]);
        if (key) present[key] = (present[key] || 0) + 1;
    }
    for (var r = 0; r < requiredSpecs.length; r++) {
        var need = _p3s2_normalizeSpec(String(requiredSpecs[r]));
        if (!need) return false;
        if (!present[need] || present[need] < 1) return false;
        // Decrement to support duplicates in requiredSpecs
        present[need] = present[need] - 1;
    }
    return true;
}

// Normalize 'mod:id[:damage]' or 'mod:id:damage' into 'mod:id:damage'. Defaults damage to 0.
function _p3s2_normalizeSpec(specStr) {
    if (!specStr) return null;
    var s = String(specStr);
    var parts = s.split(':');
    if (parts.length < 2) return null;
    var id = parts[0] + ':' + parts[1];
    var dmg = 0;
    if (parts.length > 2) {
        var d = parts[2];
        if (String(d).match(/^\d+$/)) dmg = parseInt(d, 10);
    }
    return id + ':' + String(dmg);
}
