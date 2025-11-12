// Phase 3: Scrap for a Start (Stage 1 implementation)
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
    var shortDelayMs = (globalCfg.general.generic_streamline_delay_short) * 1000;
    var intervalMs   = (globalCfg.general.generic_streamline_interval) * 1000;

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
                            // Advance to next stage scaffold
                            pdata.phase3.currentStage = 2;
                            pdata.phase3.currentStep = 1;
                            changed = true;
                        }
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
