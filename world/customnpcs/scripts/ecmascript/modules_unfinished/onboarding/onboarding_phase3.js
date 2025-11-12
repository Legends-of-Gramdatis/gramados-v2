// Phase 3: Scrap for a Start (Stage 1 implemented, Stage 2 crate detection logic)
// Stage 1 - Salvaged Mess:
//  Step 1: Ensure player has required free inventory slots (skip if already enough).
//  Step 2: Give configured scrap items immediately, announce start message, wait short delay, then give a random crate from configured loot table.
// Completion of Stage 1 occurs when crate is awarded.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');

// Runner returns true when pdata changed
function onboarding_run_phase3(player, pdata, phaseCfg, globalCfg, allPlayers) {
    if (!phaseCfg || !phaseCfg.enabled) return false;
    if (!pdata) return false;
    var changed = false;
    if (!pdata.phase3) { pdata.phase3 = {}; changed = true; }

    // --- Timers / delays (reuse generic config values) ---
    var shortDelayMs  = (globalCfg.general.generic_streamline_delay_short) * 1000;
    var mediumDelayMs = (globalCfg.general.generic_streamline_delay_medium) * 1000;
    var intervalMs    = (globalCfg.general.generic_streamline_interval) * 1000;

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
                        tellSeparatorTitle(player, "Salvaged Mess", '&e', '&a');
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
                            var completionMsg = stage1Cfg.chat && stage1Cfg.chat.completion ? stage1Cfg.chat.completion : null;
                            if (completionMsg) tellPlayer(player, completionMsg);
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
                    if ((Date.now() - pdata.phase3.stage2DelayStartMs) >= mediumDelayMs) {
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
                        // Separator exact: &e[===] &aPacking the mess &e[===]
                        tellSeparatorTitle(player, 'Packing the mess', '&e', '&a');
                        var stage2Cfg = (phaseCfg.stages.stage2) ? phaseCfg.stages.stage2 : null;
                        var stage2Chat = (stage2Cfg && stage2Cfg.chat) ? stage2Cfg.chat : null;
                        var showFailureInstead = pdata.phase3.stage2ShowFailureStart ? true : false;
                        if (stage2Chat) {
                            if (showFailureInstead && stage2Chat.failure) {
                                tellPlayer(player, stage2Chat.failure);
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
                        pdata.phase3.stage2LastReminderMs = 0;
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
                        // Completion message for Step 1
                        var s2ChatRoot = (stage2CfgRoot && stage2CfgRoot.chat) ? stage2CfgRoot.chat : null;
                        if (s2ChatRoot && s2ChatRoot.completion) tellPlayer(player, s2ChatRoot.completion);
                        pdata.phase3.currentStep = 2; // move to filling
                        changed = true; break;
                    }
                    // Reminder every minute until detection
                    var lastR = pdata.phase3.stage2LastReminderMs || 0;
                    if ((Date.now() - lastR) >= intervalMs) {
                        var stage2Chat2 = (stage2CfgRoot && stage2CfgRoot.chat) ? stage2CfgRoot.chat : null;
                        if (stage2Chat2 && stage2Chat2.reminder) tellPlayer(player, stage2Chat2.reminder);
                        pdata.phase3.stage2LastReminderMs = Date.now();
                        changed = true;
                    }
                    break;
                case 2: // 3.2.2 Step 2 - Filling the crate
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
                        pdata.phase3.stage2Step2LastReminder = 0;
                        changed = true; break;
                    }
                    // Validate crate contents
                    var part = _p3s2_findCratePartByUUID(player.getWorld(), player.getPos(), radius, lootTablePath2, focusId);
                    if (part) {
                        var allItemsCfg = stage1Cfg.items || [];
                        if (_p3s2_crateHasAllItems(part, allItemsCfg)) {
                            var step2ChatComp = (stage2CfgRoot && stage2CfgRoot.step2 && stage2CfgRoot.step2.chat) ? stage2CfgRoot.step2.chat : null;
                            if (step2ChatComp && step2ChatComp.completion) tellPlayer(player, step2ChatComp.completion);
                            pdata.phase3.currentStep = 3; // scaffold for next step (picking up)
                            pdata.phase3.stage2FilledAt = Date.now();
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
            }
            break;
        default:
            // Future stages not yet implemented
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
    // parts are typically indexed part_0..part_63; scan recursively
    for (var i = 0; i < 64; i++) {
        var key = 'part_' + i;
        if (!nbt.has(key)) continue;
        var part = nbt.getCompound(key);
        if (!part) continue;

        // Build mts item id and validate against loot table
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
        if (typeof list.length === 'number') size = list.length; else if (typeof list.size === 'function') size = list.size();
    }
    for (var i = 0; i < size; i++) {
        var it = list[i];
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
