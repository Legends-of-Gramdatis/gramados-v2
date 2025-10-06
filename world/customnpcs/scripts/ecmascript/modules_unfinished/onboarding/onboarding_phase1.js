// Phase 1: State Hotel logic. Returns true if player data changed.
// Responsibilities:
//  - Confine player to hotel region until they reach/complete room setup.
//  - Assign deterministic or first-unused room on first entry to phase.
//  - Detect player entering assigned room region.
//  - Give random starter furniture (loot tables) once.
//  - Start timer then prompt for !setHome after delay.
//  - Listen for !setHome usage (flag is set via external command hook helper function exposed globally if available) – fallback: poll for stored home data in some future integration.
//  - Launch Lost Moment: teleport player to remote coords & confine; prompt for !home.
//  - Detect !home usage (flag). On success, return to room & finish phase, lifting all confinement.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_loot_tables_paths.js');

// Helper to test inside AABB region arrays {p1:[x,y,z], p2:[x,y,z]}
function p1_isInside(pos, r){
    if(!r||!r.p1||!r.p2) return false;
    var p1=r.p1,p2=r.p2;
    var minX=Math.min(p1[0],p2[0]); var maxX=Math.max(p1[0],p2[0]);
    var minY=Math.min(p1[1],p2[1]); var maxY=Math.max(p1[1],p2[1]);
    var minZ=Math.min(p1[2],p2[2]); var maxZ=Math.max(p1[2],p2[2]);
    return pos.x>=minX&&pos.x<=maxX&&pos.y>=minY&&pos.y<=maxY&&pos.z>=minZ&&pos.z<=maxZ;
}

function p1_tpPlayer(player, fallback){
    if(!fallback) return; try { player.setPosition(fallback[0]+0.5, fallback[1], fallback[2]+0.5);} catch(e){}
}

// Assign a room: prefer first not currently assigned across all players (needs global scan) else deterministic by hash of name
function p1_assignRoom(pdata, phaseCfg, allPlayers){
    if(pdata.phase1 && pdata.phase1.roomId) return pdata.phase1.roomId;
    var rooms = (phaseCfg.stages.hotel.room_assign.rooms)||[];
    // Collect used
    var used={};
    for(var k in allPlayers){ if(allPlayers[k] && allPlayers[k].phase1 && allPlayers[k].phase1.roomId){ used[ allPlayers[k].phase1.roomId ]=true; } }
    var chosen=null;
    for(var i=0;i<rooms.length;i++){ if(!used[rooms[i].id]) { chosen=rooms[i]; break; } }
    if(!chosen && rooms.length>0){ // deterministic fallback
        var nameHash=0; var n=pdata.playerName||'anon';
        for(var c=0;c<n.length;c++){ nameHash=(nameHash*31 + n.charCodeAt(c)) & 0x7fffffff; }
        chosen=rooms[nameHash % rooms.length];
    }
    if(!pdata.phase1) pdata.phase1={};
    pdata.phase1.roomId = chosen?chosen.id:null;
    return pdata.phase1.roomId;
}

// Lookup room config from id
function p1_getRoom(roomId, phaseCfg){
    if(!roomId) return null; var rs=(phaseCfg.stages.hotel.room_assign.rooms)||[]; for(var i=0;i<rs.length;i++){ if(rs[i].id===roomId) return rs[i]; } return null;
}

// Give furniture loot once
function p1_giveFurniture(player, pdata, phaseCfg){
    if(pdata.phase1.furnitureGiven) return;
    var fl = phaseCfg.stages.hotel.furniture_loot || {};
    var tables = []; // gather loot entries
    function pullAndGive(tblName){
        if(!tblName) return;
        var loot = pullLootTable(globalThis[tblName], player) || [];
        for(var i=0;i<loot.length;i++){
            try { var stack = generateItemStackFromLootEntry(loot[i], player.getWorld()); if(stack) player.giveItem(stack); } catch(e){ logToFile('onboarding','[phase1-furniture-error] '+player.getName()+': '+e); }
        }
    }
    pullAndGive(fl.beds); pullAndGive(fl.storage); pullAndGive(fl.tables);
    pdata.phase1.furnitureGiven = true;
}

// Lost moment confinement check
function p1_enforceLostMoment(player, pdata, lostCfg){
    if(!lostCfg || !pdata.phase1.lostActive) return;
    var pos = player.getPos();
    var center = lostCfg.teleport.pos || [0,0,0];
    var radius = lostCfg.radius || 10;
    var dx = pos.x - center[0]; var dy = pos.y - center[1]; var dz = pos.z - center[2];
    if((dx*dx + dy*dy + dz*dz) > radius*radius){
        // Pull back
        player.setPosition(center[0]+0.5, center[1], center[2]+0.5);
    }
}

// Hotel confinement (unless in lost moment or phase done)
function p1_enforceHotel(player, pdata, hotelRegion){
    if(pdata.phase1 && (pdata.phase1.completed || pdata.phase1.lostActive)) return; // skip when lost or completed
    var pos=player.getPos();
    if(!p1_isInside(pos, hotelRegion)){
        p1_tpPlayer(player, hotelRegion.fallback);
    }
}

// Room confinement while doing setup before home set
function p1_enforceRoom(player, pdata, roomCfg){
    if(!pdata.phase1.inRoom || pdata.phase1.homeSet || pdata.phase1.lostActive) return; // only while initial setup
    var pos=player.getPos();
    if(!p1_isInside(pos, roomCfg.region)){
        p1_tpPlayer(player, roomCfg.region.fallback);
    }
}

// Process command usage flags (these could be set by external command listener integration later)
// For now we rely on a temporary global arrays where some other script would push events. Provide fallbacks.
function p1_checkCommands(pdata, player){
    // External integration: global _ONBOARDING_CMD_EVENTS: [{player:'name', cmd:'setHome'}]
    try {
        if(globalThis._ONBOARDING_CMD_EVENTS && globalThis._ONBOARDING_CMD_EVENTS.length){
            for(var i=globalThis._ONBOARDING_CMD_EVENTS.length-1;i>=0;i--){
                var ev = globalThis._ONBOARDING_CMD_EVENTS[i];
                if(ev.player===player.getName()){
                    if(ev.cmd==='setHome'){ pdata.phase1.homeSet = true; pdata.phase1.homeSetTime=Date.now(); globalThis._ONBOARDING_CMD_EVENTS.splice(i,1); }
                    if(ev.cmd==='home' && pdata.phase1.lostActive){ pdata.phase1.lostRecovered = true; pdata.phase1.lostRecoveredTime=Date.now(); globalThis._ONBOARDING_CMD_EVENTS.splice(i,1); }
                }
            }
        }
    } catch(e){ }
}

function onboarding_run_phase1(player, pdata, phaseCfg, globalCfg, allPlayers){
    if(!phaseCfg || !phaseCfg.enabled) return false;
    if(!pdata.phase1) pdata.phase1={};
    var changed=false;
    pdata.playerName = player.getName(); // used by room hash fallback

    var hotelStage = phaseCfg.stages && phaseCfg.stages.hotel;
    if(!hotelStage) return false;

    var chat = hotelStage.chat || {};

    // Assign room
    if(!pdata.phase1.roomId){
        var rid = p1_assignRoom(pdata, phaseCfg, allPlayers);
        if(rid){
            tellPlayer(player, (chat.onArrival||"&bYou've been assigned room #{room}.").replace('{room}', rid).replace('#{room}', rid));
            pdata.phase1.arrivalShown=true;
            pdata.phase1.arrivalTime=Date.now();
            changed=true;
        }
    }

    var hotelRegion = hotelStage.hotel_region;
    if(hotelRegion) p1_enforceHotel(player, pdata, hotelRegion);

    // Periodic reminder while not yet in room and not lost segment
    if(pdata.phase1.roomId && !pdata.phase1.inRoom && !pdata.phase1.lostActive){
        var interval = (hotelStage.reminder_interval_seconds||600)*1000;
        if(!pdata.phase1.lastReminderTime) pdata.phase1.lastReminderTime = pdata.phase1.arrivalTime || Date.now();
        if(Date.now() - pdata.phase1.lastReminderTime >= interval){
            tellPlayer(player, (chat.onReminder||"&eReminder: room #{room}").replace('{room}', pdata.phase1.roomId).replace('#{room}', pdata.phase1.roomId));
            pdata.phase1.lastReminderTime = Date.now();
            changed=true;
        }
    }

    // Detect entering room
    var roomCfg = p1_getRoom(pdata.phase1.roomId, phaseCfg);
    if(roomCfg && !pdata.phase1.inRoom){
        var pos=player.getPos();
        if(p1_isInside(pos, roomCfg.region)){
            pdata.phase1.inRoom = true;
            tellPlayer(player, chat.onRoomEnter || '&aYou have entered your room.');
            changed=true;
        }
    }

    if(roomCfg) p1_enforceRoom(player, pdata, roomCfg);

    // Give furniture once upon entering room
    if(pdata.phase1.inRoom) {
        if(!pdata.phase1.furnitureGiven){
            p1_giveFurniture(player, pdata, phaseCfg);
            tellPlayer(player, chat.onFurnitureGiven || '&bStarter furniture delivered.');
            pdata.phase1.furnitureGivenTime=Date.now();
            changed=true;
        }
        // Start setup timer if not started
        if(!pdata.phase1.setupTimerStart){ pdata.phase1.setupTimerStart = Date.now(); changed=true; }
        else {
            // After delay prompt for !setHome until set
            var delayMs = (hotelStage.home && hotelStage.home.setup_delay_seconds ? hotelStage.home.setup_delay_seconds : 20)*1000;
            if(!pdata.phase1.homePrompted && (Date.now() - pdata.phase1.setupTimerStart) >= delayMs){
                tellPlayer(player, chat.onHomePrompt || '&eUse !setHome to register this room.');
                pdata.phase1.homePrompted = true; changed=true;
            }
        }
    }

    // Poll command events for setHome/home usage
    p1_checkCommands(pdata, player);

    if(pdata.phase1.homeSet && !pdata.phase1.lostActive && !pdata.phase1.lostCompleted){
        // Transition to lost moment
        tellPlayer(player, chat.onHomeSet || '&aHome registered!');
        var lostCfg = hotelStage.home && hotelStage.home.lost_moment;
        if(lostCfg){
            pdata.phase1.lostActive = true;
            pdata.phase1.lostStartTime = Date.now();
            // Teleport
            var tp = lostCfg.teleport || {pos:[0,80,0],yaw:0,pitch:0};
            var p = tp.pos; player.setPosition(p[0]+0.5,p[1],p[2]+0.5);
            try { player.getMCEntity().rotationYaw = tp.yaw||0; } catch(e){}
            try { player.getMCEntity().rotationPitch = tp.pitch||0; } catch(e){}
            tellPlayer(player, chat.onLostMomentTeleport || '&cYou are lost! Use !home.');
            changed=true;
        } else {
            // No lost moment configured -> directly complete
            pdata.phase1.completed = true; pdata.phase = 2; changed=true;
            tellPlayer(player, chat.onPhaseComplete || '&aOrientation complete.');
        }
    }

    // Lost moment loop
    var lostCfg2 = hotelStage.home && hotelStage.home.lost_moment;
    if(pdata.phase1.lostActive){
        p1_enforceLostMoment(player, pdata, lostCfg2);
        // Periodic reminder
        var remInt = (hotelStage.reminder_interval_seconds||600)*1000;
        if(!pdata.phase1.lostLastReminder) pdata.phase1.lostLastReminder = pdata.phase1.lostStartTime;
        if(Date.now() - pdata.phase1.lostLastReminder >= remInt){
            tellPlayer(player, chat.onLostMomentReminder || '&eUse !home to return.');
            pdata.phase1.lostLastReminder = Date.now(); changed=true;
        }
        if(pdata.phase1.lostRecovered){
            // Return to room - assume home TP externally done; if not we manually TP to room fallback
            var roomReturn = roomCfg && roomCfg.region && roomCfg.region.fallback ? roomCfg.region.fallback : (hotelRegion ? hotelRegion.fallback : null);
            p1_tpPlayer(player, roomReturn);
            pdata.phase1.lostActive=false; pdata.phase1.lostCompleted=true; changed=true;
            tellPlayer(player, chat.onReturnHome || '&bYou made it back using !home.');
            // Complete phase
            pdata.phase1.completed=true; pdata.phase=2; pdata.phase1.completeTime=Date.now();
            tellPlayer(player, chat.onPhaseComplete || '&aState Hotel orientation complete!');
        }
    }

    return changed;
}
