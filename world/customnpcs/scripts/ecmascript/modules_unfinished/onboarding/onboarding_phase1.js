// Phase 1: State Hotel (Minimal Baseline)
// Only enforce confinement inside the State Hotel building for now.
// Placeholder announcer is provided for future step/stage/phase events.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

// --- Helpers ---

function p1_teleportToFallback(player, region){
    if(!region || !region.fallback) return false;
    try { player.setPosition(region.fallback[0]+0.5, region.fallback[1], region.fallback[2]+0.5); return true; } catch(e){ return false; }
}

// Placeholder announcer for future steps/phases/stages.
// scope: 'phase' | 'stage' | 'step' | 'move' (free-form); status: 'enter' | 'progress' | 'complete'
function onboarding_phase1_placeholderAnnounce(scope, status, detail, player){
    try {
        var who = player ? (player.getName ? player.getName() : '') : '';
        var msg = '&7[placeholder] &f' + (scope||'phase') + ' ' + (status||'progress') + (detail?(' &7- &f'+detail):'');
        tellPlayer(player, msg);
        logToFile('onboarding', '[phase1-placeholder] ' + who + ' => ' + msg.replace(/§./g,''));
    } catch(e) {}
}

// --- Room selection helpers (no true assignment yet) ---
var P1_STARTER_HOTEL_FALLBACK_ROOM = 'Gramados_GramadosCity_StarterHotel_301';

function p1_pickRandomStarterRoomName(){
    try {
        var regions = getStarterHotelRegions(); // [{name,data}]
        if(!regions || !regions.length){
            return null; // will fallback to config-driven pick
        }
        var fallback = P1_STARTER_HOTEL_FALLBACK_ROOM;
        var hasFallback = false;
        for(var i=0;i<regions.length;i++){ if(regions[i].name === fallback){ hasFallback=true; break; } }
        if(!hasFallback) fallback = regions[0].name; // first region becomes fallback
        var chosen = getRandomUnownedRegion(regions, fallback); // returns name
        return chosen || fallback;
    } catch(e){
        return null;
    }
}

function p1_roomIdFromRegionName(regionName){
    if(!regionName || typeof regionName !== 'string') return null;
    var m = regionName.match(/(\d+)$/);
    return m ? m[1] : null;
}

// Minimal Phase 1 runner (called each per-player tick by onboarding_main)
function onboarding_run_phase1(player, pdata, phaseCfg, globalCfg, allPlayers){
    if(!phaseCfg || !phaseCfg.enabled) return false;
    if(!pdata.phase1) pdata.phase1 = {};
    var changed = false;

    // Entry message once
    if(!pdata.phase1.arrivalShown){
        onboarding_phase1_placeholderAnnounce('phase1', 'enter', 'State Hotel: explore and find your starter room (WIP).', player);
        pdata.phase1.arrivalShown = true;
        pdata.phase1.arrivalTime = Date.now();
        changed = true;
    }

    // Initialize stage/step tracking if missing
    if(typeof pdata.phase1.currentStage === 'undefined'){ pdata.phase1.currentStage = 1; changed = true; }
    if(typeof pdata.phase1.currentStep === 'undefined'){ pdata.phase1.currentStep = 1; changed = true; }

    // Enforce hotel confinement until the player finds their room (then revoke)
    var hotelStage = phaseCfg.stages && phaseCfg.stages.hotel;
    if(!hotelStage) return changed;
    var hotelRegion = hotelStage.hotel_region;
    if(!hotelRegion) return changed;

    var ppos = getPlayerPos(player); // from utils_maths
    if(!pdata.phase1.hotelLockRevoked && !isWithinAABB(ppos, hotelRegion.p1, hotelRegion.p2)){
        var didTp = p1_teleportToFallback(player, hotelRegion);
        var now = Date.now();
        var g = (globalCfg && globalCfg.general) ? globalCfg.general : {};
        var remindMs = (((typeof g.generic_streamline_interval === 'number') ? g.generic_streamline_interval : 600) * 1000);
        var longDelayMs1 = (((typeof g.generic_streamline_delay_long === 'number') ? g.generic_streamline_delay_long : 20) * 1000);
        var afterDelay1 = (pdata.phase1 && pdata.phase1.arrivalTime) ? ((now - pdata.phase1.arrivalTime) >= longDelayMs1) : true;
        // Immediate feedback on teleport, and reset loop timer
        if (didTp) {
            tellPlayer(player, ':hotel: &ePlease stay inside the State Hotel.');
            pdata.phase1.lastConfineMsg = now; // reset loop so next reminder waits full interval
            changed = true;
            logToFile('onboarding', '[phase1-confine] ' + player.getName() + ' pulled back to hotel fallback.');
        } else if (afterDelay1 && (!pdata.phase1.lastConfineMsg || (now - pdata.phase1.lastConfineMsg) > remindMs)) {
            // Periodic reminder only after long delay from phase arrival
            tellPlayer(player, ':hotel: &ePlease stay inside the State Hotel.');
            pdata.phase1.lastConfineMsg = now;
            changed = true;
        }
    }

    // Stage/Step state machine
    var stage = pdata.phase1.currentStage;
    var step = pdata.phase1.currentStep;

    switch(stage){
        case 1: // Stage 1: Finding Room
            switch(step){
                case 1: // Step 1: Looking for the room
                    // Select a target room if not yet chosen
                    if(!pdata.phase1.inRoom && !pdata.phase1.targetRoomId){
                        var chosenName = p1_pickRandomStarterRoomName();
                        if(chosenName){
                            var rid = p1_roomIdFromRegionName(chosenName);
                            if(!rid){
                                var roomsFallback = (hotelStage.room_assign && hotelStage.room_assign.rooms) || [];
                                rid = roomsFallback.length ? String(roomsFallback[0].id) : null;
                            }
                            if(rid){
                                pdata.phase1.targetRoomName = chosenName;
                                pdata.phase1.targetRoomId = String(rid);
                                // Immediately attempt to assign ownership so player can open the door
                                try {
                                    var currentOwner0 = getRegionOwnerName(pdata.phase1.targetRoomName);
                                    var pname0 = player.getName();
                                    if (currentOwner0 === 'Available') {
                                        transferRegion(player, pdata.phase1.targetRoomName, pname0);
                                        pdata.phase1.roomClaimed = true;
                                        onboarding_phase1_placeholderAnnounce('step', 'progress', 'Target room selected and assigned to you: #' + rid + '.', player);
                                    } else if (currentOwner0 === pname0) {
                                        pdata.phase1.roomClaimed = true; // already owned by player
                                        onboarding_phase1_placeholderAnnounce('step', 'progress', 'Target room selected (you already own it): #' + rid + '.', player);
                                    } else {
                                        pdata.phase1.roomClaimed = false;
                                        onboarding_phase1_placeholderAnnounce('step', 'progress', 'Target room selected: #' + rid + ' (already owned by ' + currentOwner0 + ').', player);
                                        logToFile('onboarding', '[phase1-claim-room-skip] Selected room ' + pdata.phase1.targetRoomName + ' already owned by ' + currentOwner0 + '.');
                                    }
                                } catch (claimErr0) {
                                    logToFile('onboarding', '[phase1-claim-room-error] ' + player.getName() + ' ' + claimErr0);
                                    onboarding_phase1_placeholderAnnounce('step', 'progress', 'Target room selected: #' + rid + '.', player);
                                }
                                changed = true;
                            }
                        }
                    }
                    // Periodic reminder to find the assigned room (gated by long delay)
                    if(isWithinAABB(ppos, hotelRegion.p1, hotelRegion.p2) && !pdata.phase1.inRoom){
                        var remindMsA = globalCfg.general.generic_streamline_interval * 1000;
                        var longDelayMsA = (((typeof globalCfg.general.generic_streamline_delay_long === 'number') ? globalCfg.general.generic_streamline_delay_long : 20) * 1000);
                        var nowA = Date.now();
                        var afterDelayA = (pdata.phase1 && pdata.phase1.arrivalTime) ? ((nowA - pdata.phase1.arrivalTime) >= longDelayMsA) : true;
                        if(afterDelayA && (!pdata.phase1.lastFindRoomMsg || (nowA - pdata.phase1.lastFindRoomMsg) > remindMsA)){
                            if(pdata.phase1.targetRoomId){
                                tellPlayer(player, ':compass: &eFind your assigned room &6#' + pdata.phase1.targetRoomId + '&e and enter it.');
                            } else {
                                tellPlayer(player, ':compass: &eFind your assigned room and enter it.');
                            }
                            pdata.phase1.lastFindRoomMsg = nowA;
                            changed = true;
                        }
                    }
                    // Transition: entering the selected room -> Step 2
                    if(pdata.phase1.targetRoomName && isPlayerInCuboid(player, pdata.phase1.targetRoomName)){
                        pdata.phase1.inRoom = true;
                        pdata.phase1.inRoomSince = Date.now();
                        // Revoke hotel confinement from now on; room lock takes over
                        if(!pdata.phase1.hotelLockRevoked){
                            pdata.phase1.hotelLockRevoked = true;
                            logToFile('onboarding', '[phase1-hotel-lock-revoked] ' + player.getName() + ' after entering room ' + (pdata.phase1.targetRoomId ? ('#'+pdata.phase1.targetRoomId) : pdata.phase1.targetRoomName) + '.');
                            changed = true;
                        }
                        pdata.phase1.currentStep = 2;
                        // Inform the player about room entry and incoming furniture on a short timer
                        var shortDelaySec_entry = (globalCfg && globalCfg.general && typeof globalCfg.general.generic_streamline_delay_short === 'number') ? globalCfg.general.generic_streamline_delay_short : 5;
                        tellPlayer(player, ':key: &aWelcome! This is your room ' + (pdata.phase1.targetRoomId ? ('&6#'+pdata.phase1.targetRoomId) : '') + '&a. We\'ll issue some starter furniture in &6' + shortDelaySec_entry + 's&a.');
                        if(!pdata.phase1.furnitureGranted && !pdata.phase1.furnitureTimerStart){ pdata.phase1.furnitureTimerStart = Date.now(); changed = true; }
                        changed = true;
                    }
                    break;
                case 2: // Step 2: Initial setup (locked; grant furniture after delay)
                    if(pdata.phase1.targetRoomName){
                        var corrected = confinePlayerToRegion(player, pdata.phase1.targetRoomName);
                        var nowB = Date.now();
                        var remindMsB = globalCfg.general.generic_streamline_interval * 1000;
                        var longDelayMsB = (((typeof globalCfg.general.generic_streamline_delay_long === 'number') ? globalCfg.general.generic_streamline_delay_long : 20) * 1000);
                        var afterDelayB = (pdata.phase1 && pdata.phase1.inRoomSince) ? ((nowB - pdata.phase1.inRoomSince) >= longDelayMsB) : true;
                        if (corrected) {
                            // Immediate feedback when trying to exit; reset loop timer
                            tellPlayer(player, ':door: &ePlease stay inside your room ' + (pdata.phase1.targetRoomId ? ('&6#'+pdata.phase1.targetRoomId) : '') + '&e while we prepare your starter furniture.');
                            pdata.phase1.lastRoomConfineMsg = nowB;
                            changed = true;
                        } else if (afterDelayB && (!pdata.phase1.lastRoomConfineMsg || (nowB - pdata.phase1.lastRoomConfineMsg) > remindMsB)) {
                            tellPlayer(player, ':door: &eStay inside your room ' + (pdata.phase1.targetRoomId ? ('&6#'+pdata.phase1.targetRoomId) : '') + '&e while we prepare your starter furniture.');
                            pdata.phase1.lastRoomConfineMsg = nowB;
                            changed = true;
                        }
                        if(!pdata.phase1.furnitureGranted){
                            if(!pdata.phase1.furnitureTimerStart){ pdata.phase1.furnitureTimerStart = Date.now(); changed = true; }
                            var delaySec = globalCfg.general.generic_streamline_delay_short;
                            var elapsedSec = (Date.now() - pdata.phase1.furnitureTimerStart) / 1000.0;
                            if(elapsedSec >= delaySec){
                                try {
                                    var world2 = player.getWorld();
                                    var lootBed2 = pullLootTable(_LOOTTABLE_FURNITURE_BED, player) || [];
                                    var lootStorage2 = pullLootTable(_LOOTTABLE_FURNITURE_STORAGE, player) || [];
                                    var lootTable2 = pullLootTable(_LOOTTABLE_FURNITURE_TABLE, player) || [];
                                    var combinedLoot2 = lootBed2.concat(lootStorage2).concat(lootTable2);
                                    for (var lj = 0; lj < combinedLoot2.length; lj++) {
                                        try {
                                            var stack2 = generateItemStackFromLootEntry(combinedLoot2[lj], world2);
                                            if (stack2) { player.giveItem(stack2); }
                                        } catch (giErr2) {
                                            logToFile('onboarding', '[phase1-furniture-error] ' + player.getName() + ' loot gen failed: ' + giErr2);
                                        }
                                    }
                                    pdata.phase1.furnitureGranted = true;
                                    pdata.phase1.furnitureGrantedTime = Date.now();
                                    tellPlayer(player, ':giftchest: &aBasic room furniture issued: bed, storage, and table. Make the space yours!');
                                    logToFile('onboarding', '[phase1-furniture] ' + player.getName() + ' granted starter furniture for room ' + (pdata.phase1.targetRoomId ? ('#'+pdata.phase1.targetRoomId) : pdata.phase1.targetRoomName) + '.');
                                    // Schedule !setHome intro after an extra short delay to avoid overlapping messages
                                    var shortDelayMs_post = ((globalCfg && globalCfg.general && typeof globalCfg.general.generic_streamline_delay_short === 'number') ? globalCfg.general.generic_streamline_delay_short : 5) * 1000;
                                    pdata.phase1.s2_introAvailableAt = Date.now() + shortDelayMs_post;
                                    pdata.phase1.s2_introShown = false;
                                    pdata.phase1.lastSetHomeMsg = null;
                                    // Transition to Stage 2 (commands)
                                    pdata.phase1.currentStage = 2;
                                    pdata.phase1.currentStep = 1;
                                    // No immediate Stage 2 chat to prevent duplicate guidance; intro will fire after short delay
                                    changed = true;
                                } catch (furnErr2) {
                                    logToFile('onboarding', '[phase1-furniture-error] ' + player.getName() + ' unexpected error: ' + furnErr2);
                                }
                            }
                        }
                    }
                    break;
            }
            break;
        case 2: // Stage 2: Getting familiar with commands
            switch(step){
                case 1: // Step 1: Setting home (locked until set)
                    if(pdata.phase1.targetRoomName && pdata.phase1.inRoom){
                        // Keep player confined inside the room
                        var corrected2 = confinePlayerToRegion(player, pdata.phase1.targetRoomName);
                        var nowC = Date.now();
                        var remindMsC = ((globalCfg && globalCfg.general && typeof globalCfg.general.generic_streamline_interval === 'number') ? globalCfg.general.generic_streamline_interval : 60) * 1000;
                        var introAt = pdata.phase1.s2_introAvailableAt || 0;
                        var introAllowed = !introAt || nowC >= introAt;
                        if (corrected2) {
                            // Immediate message on attempted exit; also reset loop timer to avoid double messages
                            tellPlayer(player, '&eYou must register this room as your home before leaving. Use &6!setHome <name>&e.');
                            pdata.phase1.lastSetHomeMsg = nowC;
                            changed = true;
                        } else if (introAllowed) {
                            // Show intro once, then periodic reminders
                            if (!pdata.phase1.s2_introShown) {
                                tellPlayer(player, ':house: &eRegister this room as your home with &6!setHome <name>&e.');
                                pdata.phase1.s2_introShown = true;
                                pdata.phase1.lastSetHomeMsg = nowC;
                                changed = true;
                            } else if (!pdata.phase1.lastSetHomeMsg || (nowC - pdata.phase1.lastSetHomeMsg) > remindMsC) {
                                tellPlayer(player, ':house: &eRegister this room as your home with &6!setHome <name>&e.');
                                pdata.phase1.lastSetHomeMsg = nowC;
                                changed = true;
                            }
                        }
                        if(corrected2){ logToFile('onboarding', '[phase1-room-confine] ' + player.getName() + ' pulled back to room ' + (pdata.phase1.targetRoomId ? ('#'+pdata.phase1.targetRoomId) : pdata.phase1.targetRoomName) + ' (stage 2).'); }

                        // Initialize home capacity/baseline from live world data (once at step start)
                        if(!pdata.phase1.homeCheckInit){
                            try {
                                var wds = getWorldData();
                                var pkey = 'player_' + player.getName();
                                var raw = wds ? wds.get(pkey) : null; // stringified JSON expected
                                var parsed = null;
                                if(raw){
                                    try { parsed = JSON.parse(String(raw)); } catch (jerr) { parsed = null; }
                                }
                                var homesMap0 = (parsed && parsed.homes) ? parsed.homes : {};
                                var maxHomes0 = (parsed && typeof parsed.maxHomes === 'number') ? parsed.maxHomes : 2; // default 2
                                var baselineCount = 0;
                                try { baselineCount = Object.keys(homesMap0).length; } catch (kcErr) { baselineCount = 0; }
                                pdata.phase1.homeCheckInit = true;
                                pdata.phase1.homeBaselineCount = baselineCount;
                                pdata.phase1.homeBaselineNames = (function(o){ var a=[]; for(var k in o){ if(o.hasOwnProperty(k)) a.push(k); } return a; })(homesMap0);
                                pdata.phase1.homeMax = maxHomes0;
                                // If no capacity left, skip this step to avoid blocking older players
                                if(baselineCount >= maxHomes0){
                                    tellPlayer(player, '&7You already have the maximum number of homes (&e' + maxHomes0 + '&7). Skipping home registration.');
                                    pdata.phase1.currentStage = 3;
                                    pdata.phase1.currentStep = 1;
                                    // Lifts the room lock by leaving Stage 2
                                    changed = true;
                                    break; // exit step handling
                                }
                                changed = true;
                            } catch (initErr) {
                                // If world data cannot be read, still proceed with prompting; assume capacity
                                pdata.phase1.homeCheckInit = true;
                                pdata.phase1.homeBaselineCount = 0;
                                pdata.phase1.homeBaselineNames = [];
                                pdata.phase1.homeMax = 2;
                                changed = true;
                                logToFile('onboarding', '[phase1-home-init-error] ' + player.getName() + ' ' + initErr);
                            }
                        }

                        // Periodic reminder to run !setHome <name>
                        if(pdata.phase1.homeCheckInit){
                            // Poll live world data to detect when a new home is added
                            try {
                                var wds2 = getWorldData();
                                var pkey2 = 'player_' + player.getName();
                                var raw2 = wds2 ? wds2.get(pkey2) : null;
                                var parsed2 = null;
                                if(raw2){
                                    try { parsed2 = JSON.parse(String(raw2)); } catch (jerr2) { parsed2 = null; }
                                }
                                var homesMap = (parsed2 && parsed2.homes) ? parsed2.homes : {};
                                var currCount = 0;
                                try { currCount = Object.keys(homesMap).length; } catch (kcErr2) { currCount = 0; }
                                // Detect new home set
                                if(typeof pdata.phase1.homeBaselineCount === 'number' && currCount > pdata.phase1.homeBaselineCount){
                                    // Success! Home was registered after prompting
                                    tellPlayer(player, '&a:check_mark: Home registered successfully. You are free to leave your room.');
                                    pdata.phase1.homeRegistered = true;
                                    pdata.phase1.homeRegisteredTime = Date.now();
                                    // Prepare a short delay before Stage 3 intro to avoid message overlap
                                    var s3ShortMs = ((globalCfg && globalCfg.general && typeof globalCfg.general.generic_streamline_delay_short === 'number') ? globalCfg.general.generic_streamline_delay_short : 5) * 1000;
                                    pdata.phase1.s3_introAvailableAt = Date.now() + s3ShortMs;
                                    pdata.phase1.s3_introShown = false;
                                    pdata.phase1.s3_lastMsg = null;
                                    pdata.phase1.s3_wasFar = false;
                                    // Advance to next step/stage and lift the room lock
                                    pdata.phase1.currentStage = 3;
                                    pdata.phase1.currentStep = 1;
                                    changed = true;
                                }
                            } catch (pollErr) {
                                // ignore polling errors; keep prompting
                            }

                            // Only prompt if player still has capacity (avoid mixed states)
                            if(!pdata.phase1.homeRegistered && (!pdata.phase1.lastSetHomeMsg || (nowC - pdata.phase1.lastSetHomeMsg) > remindMsC)){
                                var roomLabel = pdata.phase1.targetRoomId ? ('#'+pdata.phase1.targetRoomId) : '';
                                onboarding_phase1_placeholderAnnounce('step', 'progress', 'Register this room ' + roomLabel + ' as your home: &e!setHome <name>&7.', player);
                                pdata.phase1.lastSetHomeMsg = nowC;
                                changed = true;
                            }
                        }
                    }
                    break;
                default:
                    // Future steps for Stage 2
                    break;
            }
            break;
        case 3: // Stage 3: Testing the commands (!myHomes and !home)
            switch(step){
                case 1:
                    try {
                        var gcfg = (globalCfg && globalCfg.general) ? globalCfg.general : {};
                        var intervalMs = ((typeof gcfg.generic_streamline_interval === 'number') ? gcfg.generic_streamline_interval : 60) * 1000;
                        var homeCfg = (phaseCfg && phaseCfg.stages && phaseCfg.stages.hotel && phaseCfg.stages.hotel.home) ? phaseCfg.stages.hotel.home : {};
                        var prox = homeCfg.proximity || { far: 15, near: 2 };

                        // Ensure we at least once showed the initial guidance before switching to distance-specific nudges
                        var nowS3 = Date.now();
                        var introAtS3 = pdata.phase1.s3_introAvailableAt || 0;
                        var introAllowedS3 = !introAtS3 || nowS3 >= introAtS3;
                        if(introAllowedS3 && !pdata.phase1.s3_introShown){
                            tellPlayer(player, ':house: &eOpen your homes list with &6!myHomes&e. Then walk a bit away from your apartment and try &6!home &eto return.');
                            pdata.phase1.s3_introShown = true;
                            pdata.phase1.s3_lastMsg = nowS3;
                            changed = true;
                        }

                        // Read current list of homes and compute distances
                        var wds3 = getWorldData();
                        var pkey3 = 'player_' + player.getName();
                        var raw3 = wds3 ? wds3.get(pkey3) : null;
                        var parsed3 = null;
                        if(raw3){ try { parsed3 = JSON.parse(String(raw3)); } catch (e3p) { parsed3 = null; } }
                        var homes3 = (parsed3 && parsed3.homes) ? parsed3.homes : {};

                        // Build array of home positions
                        var homeList = [];
                        try {
                            for(var hk in homes3){ if(homes3.hasOwnProperty(hk)){
                                var h = homes3[hk];
                                if(h && typeof h.x === 'number' && typeof h.y === 'number' && typeof h.z === 'number'){
                                    homeList.push({ name: hk, x: h.x, y: h.y, z: h.z });
                                }
                            }}
                        } catch (hlErr) { homeList = []; }

                        // If no homes in data, cannot proceed; remind to set home (safety net)
                        if(homeList.length === 0){
                            if(!pdata.phase1.s3_lastMsg || (nowS3 - pdata.phase1.s3_lastMsg) > intervalMs){
                                tellPlayer(player, '&eIt looks like you don\'t have any home yet. Use &6!setHome <name> &ein your room first.');
                                pdata.phase1.s3_lastMsg = nowS3;
                                changed = true;
                            }
                            break;
                        }

                        // Helper: squared distance between current pos and a home
                        var pnow = getPlayerPos(player);
                        var dist2ToHome = function(h){ var dx=pnow.x-h.x, dy=pnow.y-h.y, dz=pnow.z-h.z; return dx*dx+dy*dy+dz*dz; };
                        // Optional helper (currently unused)
                        var dist2Between = function(a,b){ var dx=a.x-b.x, dy=a.y-b.y, dz=a.z-b.z; return dx*dx+dy*dy+dz*dz; };

                        // Find closest home
                        var closest = null, minD2 = Number.POSITIVE_INFINITY;
                        for(var i3=0;i3<homeList.length;i3++){
                            var d2 = dist2ToHome(homeList[i3]);
                            if(d2 < minD2){ minD2 = d2; closest = homeList[i3]; }
                        }

                        var farR = (typeof prox.far === 'number' ? prox.far : 15);
                        var nearR = (typeof prox.near === 'number' ? prox.near : 2);
                        var farR2 = farR*farR;
                        var nearR2 = nearR*nearR;

                        // Maintain a flag once player has been seen far away from any home
                        if(typeof pdata.phase1.s3_wasFar !== 'boolean'){ pdata.phase1.s3_wasFar = false; changed = true; }

                        // Determine far/near status relative to closest home
                        var isNear = minD2 <= nearR2;
                        var isFar = minD2 >= (farR2);

                        // State transitions: once far, wait until near to pass
                        if(isFar) {
                            var becameFar = false;
                            if(!pdata.phase1.s3_wasFar){ pdata.phase1.s3_wasFar = true; becameFar = true; changed = true; }
                            if(becameFar){
                                // Force-show immediately at the exact moment we become far enough
                                tellPlayer(player, ':arrow_right: &aYou\'re far enough now. Try &6!home &ato teleport back to your home.');
                                pdata.phase1.s3_lastMsg = nowS3;
                                changed = true;
                            } else if(!pdata.phase1.s3_lastMsg || (nowS3 - pdata.phase1.s3_lastMsg) > intervalMs){
                                // Afterwards, fall back to throttled reminders
                                tellPlayer(player, ':arrow_right: &aYou\'re far enough now. Try &6!home &ato teleport back to your home.');
                                pdata.phase1.s3_lastMsg = nowS3;
                                changed = true;
                            }
                        } else {
                            // Not far yet: keep giving the base message periodically, but don\'t spam
                            if(!pdata.phase1.s3_lastMsg || (nowS3 - pdata.phase1.s3_lastMsg) > intervalMs){
                                tellPlayer(player, ':house: &eOpen &6!myHomes&e, then walk a few blocks away and try &6!home &eto return.');
                                pdata.phase1.s3_lastMsg = nowS3;
                                changed = true;
                            }
                        }

                        // Completion detection: if previously far and now within near radius of any home, consider that as returned via !home
                        if(pdata.phase1.s3_wasFar && isNear){
                            // Optional: sanity check that near a saved home, not just the closest one calculation from current tick
                            // Confirm within near radius of at least one home
                            var nearAny = false;
                            for(var j3=0;j3<homeList.length;j3++){
                                var d2h = dist2ToHome(homeList[j3]);
                                if(d2h <= nearR2){ nearAny = true; break; }
                            }
                            if(nearAny){
                                tellPlayer(player, '&a:check_mark: Tutorial complete. You used &6!home &ato return near your home.');
                                pdata.phase1.currentStage = 4; // proceed to completion stage
                                pdata.phase1.currentStep = 1;
                                pdata.phase1.s3_completed = true;
                                pdata.phase1.s3_completedTime = Date.now();
                                changed = true;
                            }
                        }
                    } catch (s3Err) {
                        logToFile('onboarding', '[phase1-stage3-error] ' + player.getName() + ' ' + s3Err);
                    }
                    break;
                default:
                    break;
            }
            break;
        case 4: // Stage 4: Lost Moment – radius confine, use !home to return
            switch(step){
                case 1: // Start timer, then teleport to lost spot and begin confinement
                    try {
                        var homeStageCfg4 = (phaseCfg && phaseCfg.stages && phaseCfg.stages.hotel && phaseCfg.stages.hotel.home) ? phaseCfg.stages.hotel.home : {};
                        var lmCfg = homeStageCfg4.lost_moment || {};
                        var delaySec = (typeof lmCfg.delay_seconds === 'number') ? lmCfg.delay_seconds : 10;
                        if(!pdata.phase1.s4_timerStart){
                            pdata.phase1.s4_timerStart = Date.now();
                            // Immediate reminder on entering this step
                            onboarding_phase1_placeholderAnnounce('stage', 'enter', ':map: &eYou feel disoriented. In a moment, you\'ll be moved. Be ready to use &6!home &eto return.', player);
                            changed = true;
                        }
                        // Periodic reminder while waiting for teleport
                        var gcfg4_1 = (globalCfg && globalCfg.general) ? globalCfg.general : {};
                        var intervalMs4_1 = ((typeof gcfg4_1.generic_streamline_interval === 'number') ? gcfg4_1.generic_streamline_interval : 60) * 1000;
                        if(!pdata.phase1.s4_waitMsg || (Date.now() - pdata.phase1.s4_waitMsg) > intervalMs4_1){
                            onboarding_phase1_placeholderAnnounce('stage', 'progress', ':hourglass: &ePlease wait... you will be moved shortly. Use &6!home &eonce you\'re lost.', player);
                            pdata.phase1.s4_waitMsg = Date.now();
                            changed = true;
                        }
                        var elapsedS = (Date.now() - pdata.phase1.s4_timerStart) / 1000.0;
                        if(elapsedS >= delaySec){
                            var tp4 = lmCfg.teleport || { pos: [-2100, 70, -150], yaw: 0, pitch: 0 };
                            var p4 = tp4.pos || [-2100, 70, -150];
                            player.setPosition(p4[0] + 0.5, p4[1], p4[2] + 0.5);
                            try { player.getMCEntity().rotationYaw = tp4.yaw || 0; } catch (e) {}
                            try { player.getMCEntity().rotationPitch = tp4.pitch || 0; } catch (e) {}
                            // Save center and radius for confinement
                            pdata.phase1.s4_center = { x: p4[0] + 0.5, y: p4[1], z: p4[2] + 0.5 };
                            pdata.phase1.s4_radius = (typeof lmCfg.radius === 'number') ? lmCfg.radius : 12;
                            pdata.phase1.s4_confining = true;
                            pdata.phase1.currentStep = 2;
                            onboarding_phase1_placeholderAnnounce('stage', 'enter', 'You feel disoriented. Use &e!home&7 to return to your room.', player);
                            changed = true;
                        }
                    } catch (s4e1) {
                        logToFile('onboarding', '[phase1-lost-start-error] ' + player.getName() + ' ' + s4e1);
                    }
                    break;
                case 2: // Active: confine to radius; complete when near any home
                    try {
                        var gcfg4 = (globalCfg && globalCfg.general) ? globalCfg.general : {};
                        var intervalMs4 = ((typeof gcfg4.generic_streamline_interval === 'number') ? gcfg4.generic_streamline_interval : 60) * 1000;
                        var homeCfg4 = (phaseCfg && phaseCfg.stages && phaseCfg.stages.hotel && phaseCfg.stages.hotel.home) ? phaseCfg.stages.hotel.home : {};
                        var prox4 = homeCfg4.proximity || { far: 15, near: 2 };

                        // Check proximity to any home first; if near, finish and stop confining
                        var wds4 = getWorldData();
                        var pkey4 = 'player_' + player.getName();
                        var raw4 = wds4 ? wds4.get(pkey4) : null;
                        var parsed4 = null;
                        if(raw4){ try { parsed4 = JSON.parse(String(raw4)); } catch (e4p) { parsed4 = null; } }
                        var homes4 = (parsed4 && parsed4.homes) ? parsed4.homes : {};
                        var homeList4 = [];
                        try { for(var hk4 in homes4){ if(homes4.hasOwnProperty(hk4)){ var h4 = homes4[hk4]; if(h4 && typeof h4.x==='number' && typeof h4.y==='number' && typeof h4.z==='number'){ homeList4.push({name: hk4, x:h4.x, y:h4.y, z:h4.z}); } } } } catch (ehl4) { homeList4 = []; }

                        var ppos4 = getPlayerPos(player);
                        var nearR2_4 = (typeof prox4.near === 'number' ? prox4.near : 2); nearR2_4 = nearR2_4 * nearR2_4;
                        var isNearHome4 = false;
                        for(var ii4=0; ii4<homeList4.length; ii4++){
                            var dhx = ppos4.x - homeList4[ii4].x;
                            var dhy = ppos4.y - homeList4[ii4].y;
                            var dhz = ppos4.z - homeList4[ii4].z;
                            var d2h4 = dhx*dhx + dhy*dhy + dhz*dhz;
                            if(d2h4 <= nearR2_4){ isNearHome4 = true; break; }
                        }
                        if(isNearHome4){
                            pdata.phase1.s4_confining = false; // stop confining
                            tellPlayer(player, '&a:check_mark: You found your way back. Phase 1 complete!');
                            tellPlayer(player, '&bYou can view your homes anytime with &6!myHomes&b. By default you can set up to 2 homes.');
                            pdata.phase1.completed = true;
                            pdata.phase1.s4_completed = true;
                            pdata.phase1.s4_completedTime = Date.now();
                            pdata.phase = 2; // advance to next phase placeholder
                            changed = true;
                            break;
                        }

                        // Otherwise, keep player within radius around the lost spot
                        if(pdata.phase1.s4_confining && pdata.phase1.s4_center){
                            var cx = pdata.phase1.s4_center.x, cz = pdata.phase1.s4_center.z; // keep Y free-ish
                            var rad = pdata.phase1.s4_radius || 12;
                            var dx = ppos4.x - cx; var dz = ppos4.z - cz;
                            var dlen = Math.sqrt(dx*dx + dz*dz);
                            if(dlen > rad){
                                var scale = (rad - 0.25) / dlen;
                                var nx = cx + dx * scale;
                                var nz = cz + dz * scale;
                                // Teleport to boundary, keep Y to avoid fall/tp loops
                                player.setPosition(nx, ppos4.y, nz);
                                if(!pdata.phase1.s4_lastMsg || (Date.now() - pdata.phase1.s4_lastMsg) > intervalMs4){
                                    onboarding_phase1_placeholderAnnounce('stage', 'progress', ':round_pushpin: &eYou are lost. Use &6!home &eto return to your room.', player);
                                    pdata.phase1.s4_lastMsg = Date.now();
                                    changed = true;
                                }
                            } else if(!pdata.phase1.s4_lastMsg || (Date.now() - pdata.phase1.s4_lastMsg) > intervalMs4){
                                // Gentle reminder while inside the circle
                                onboarding_phase1_placeholderAnnounce('stage', 'progress', ':round_pushpin: &eTry &6!home &eto get back home.', player);
                                pdata.phase1.s4_lastMsg = Date.now();
                                changed = true;
                            }
                        }
                    } catch (s4e2) {
                        logToFile('onboarding', '[phase1-lost-active-error] ' + player.getName() + ' ' + s4e2);
                    }
                    break;
                default:
                    break;
            }
            break;
    }

    return changed;
}
