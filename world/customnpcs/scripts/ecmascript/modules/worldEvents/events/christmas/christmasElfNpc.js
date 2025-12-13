// christmasElfNpc.js - Attach to the elf NPC itself
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_logging.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

var CHRISTMAS_CFG_PATH = 'world/customnpcs/scripts/ecmascript/modules/worldEvents/events/christmas/christmas_config.json';
var OWNER_KEY = 'christmas_owner';
var SELF_CFG = loadJson(CHRISTMAS_CFG_PATH);
// Load timing configuration
var ACCIDENTAL_DELAY_MS = SELF_CFG.accidentalDelayMs;
var MAX_DELAY_MS = SELF_CFG.maxDelayMs;
var DONATION_DATA_PATH = 'world/customnpcs/scripts/data_auto/christmas_elf_donations.json';

function _christmas_itemSignature(itemStack) {
    var id = itemStack.getName();
    var meta = itemStack.getItemDamage();
    var nbtRaw = itemStack.hasNbt() ? itemStack.getNbt() : null;
    var nbtKey = (nbtRaw && nbtRaw.toJsonString) ? nbtRaw.toJsonString() : '';
    return id + '|' + meta + '|' + nbtKey;
}

function _christmas_recordDonation(player, itemStack) {
    var data = loadJson(DONATION_DATA_PATH);
    var pname = player.getName();
    var playerEntry = data[pname] || { items: [] };
    if (!playerEntry.items) {
        playerEntry.items = [];
    }
    var signature = _christmas_itemSignature(itemStack);

    var items = playerEntry.items;
    var found = false;
    for (var i = 0; i < items.length; i++) {
        var entry = items[i];
        var entryNbtStr = entry.nbt ? JSON.stringify(entry.nbt) : '';
        var entrySig = entry.id + '|' + entry.meta + '|' + entryNbtStr;
        if (entrySig === signature) {
            entry.count += 1;
            items[i] = entry;
            found = true;
            break;
        }
    }

    if (!found) {
        var nbtData = null;
        if (itemStack.hasNbt()) {
            var nbtStr = itemStack.getNbt().toJsonString();
            nbtData = JSON.parse(nbtStr);
        }
        items.push({
            id: itemStack.getName(),
            meta: itemStack.getItemDamage(),
            nbt: nbtData,
            displayName: itemStack.getDisplayName(),
            count: 1
        });
    }

    playerEntry.items = items;
    data[pname] = playerEntry;
    saveJson(data, DONATION_DATA_PATH);
}

function init(event) {
    _christmas_playSpawnEffects(event.npc);
}

function tick(event) {
    if (!SELF_CFG.selfDespawnEnabled) return;
    var npc = event.npc;
    var owner = npc.getStoreddata().get(OWNER_KEY);
    if (!owner) return;
    var world = npc.getWorld();
    var radius = SELF_CFG.selfDespawnRadius;
    var nearbyPlayers = world.getNearbyEntities(npc.getPos(), radius, 1); // 1 = players
    var ownerNearby = false;
    for (var i = 0; i < nearbyPlayers.length; i++) {
        if (nearbyPlayers[i].getName() === owner) {
            ownerNearby = true;
            break;
        }
    }
    if (!ownerNearby) {
        logToFile('dev', '[christmas] Elf self-despawn: owner ' + owner + ' not nearby.');
        _christmas_selfDespawnEffects(npc);
    }
}

function _christmas_selfDespawnEffects(npc) {
    _christmas_playDespawnEffects(npc);
    npc.despawn();
}

function _christmas_playSpawnEffects(npc) {
    try {
        var pos = npc.getPos();
        var cmdBase = pos.getX() + ' ' + pos.getY() + ' ' + pos.getZ();
        npc.executeCommand('/particle snowshovel ' + cmdBase + ' 0.5 0.8 0.5 0 30');
        npc.executeCommand('/particle fireworksSpark ' + cmdBase + ' 0.5 0.8 0.5 0 20');
        npc.executeCommand('/playsound minecraft:entity.firework.launch player @a[r=12] ' + cmdBase + ' 0.8 1.2');
        npc.executeCommand('/playsound minecraft:entity.experience_orb.pickup player @a[r=12] ' + cmdBase + ' 0.6 1.5');
    } catch (err) {
        logToFile('dev', '[christmas] Error playing spawn effects: ' + err);
    }
}

function _christmas_playDespawnEffects(npc) {
    try {
        var pos = npc.getPos();
        var cmdBase = pos.getX() + ' ' + pos.getY() + ' ' + pos.getZ();
        npc.executeCommand('/particle snowshovel ' + cmdBase + ' 0.6 0.9 0.6 0 25');
        npc.executeCommand('/particle happyVillager ' + cmdBase + ' 0.4 0.6 0.4 0 15');
        npc.executeCommand('/playsound minecraft:entity.chicken.egg player @a[r=12] ' + cmdBase + ' 0.8 1.8');
        npc.executeCommand('/playsound minecraft:entity.bat.takeoff player @a[r=12] ' + cmdBase + ' 0.6 1.6');
    } catch (err) {
        logToFile('dev', '[christmas] Error playing despawn effects: ' + err);
    }
}
function _christmas_playAcceptEffects(npc) {
    try {
        var pos = npc.getPos();
        var cmdBase = pos.getX() + ' ' + pos.getY() + ' ' + pos.getZ();
        npc.executeCommand('/particle heart ' + cmdBase + ' 0.5 1.0 0.5 0 15');
        npc.executeCommand('/particle happyVillager ' + cmdBase + ' 0.5 0.8 0.5 0 20');
        npc.executeCommand('/particle fireworksSpark ' + cmdBase + ' 0.3 0.5 0.3 0 10');
        npc.executeCommand('/playsound minecraft:entity.player.levelup player @a[r=12] ' + cmdBase + ' 0.5 1.3');
        npc.executeCommand('/playsound customnpcs:human.girl.villager.heh player @a[r=12] ' + cmdBase + ' 0.8 1.1');
    } catch (err) {
        logToFile('dev', '[christmas] Error playing accept effects: ' + err);
    }
}
function interact(event) {
    var player = event.player;
    var npc = event.npc;
    var owner = npc.getStoreddata().get(OWNER_KEY);
    
    // Only allow interaction from the elf's owner
    if (player.getName() !== owner) {
        return;
    }
    
    // Check if player has empty main hand
    var mainhand = player.getMainhandItem();
    if (!mainhand || !mainhand.getName || mainhand.getName() === 'minecraft:air') {
        // Player has empty hand - elf asks for materials
        var elfName = npc.getDisplay().getName() || 'Christmas Elf';
        var emptyHandMessages = [
            '&c&lI am missing&r &ematerials&r to craft &a&lpresents&r! \u952A',
            '&aPlease give me some &c&lmaterials&r, and I will turn them into &e&lwonderful presents&r &anear Christmas!',
            '&eI need &b&lyour help&r! Do you have any &c&lmaterials&r? \u952A',
            '&b&lWithout materials&r, I cannot &e&lcraftpresents&r for you! \u9521',
            '&c&lBring me&r some &6&litems&r and I shall craft &a&lwonderful presents&r! \u93E7',
            '&aThe &lmore&r materials you give, the &e&lbetter presents&r I can make! \u952A',
            '&e&lI\'ve been waiting&r for your help! Do you have &a&lanything&r? \u9517',
            '&c&lCome on&r, let\'s make some &e&lpresents&r together! Give me &a&lsomething&r! \u952A',
            '&b&lMy workshop&r is running low on &c&lsupplies&r! Help me out! \u93FA',
            '&eEvery &a&lmaterial&r you give brings &c&lChristmas&r closer! \u93E7'
        ];
        npc.say(emptyHandMessages[Math.floor(Math.random() * emptyHandMessages.length)]);
        npc.executeCommand('/playsound customnpcs:human.girl.villager.help player @a[r=12] ' + npc.getPos().getX() + ' ' + npc.getPos().getY() + ' ' + npc.getPos().getZ() + ' 0.8 1.1');

        logToFile('dev', '[christmas] Elf ' + elfName + ' asked ' + player.getName() + ' for materials');
        return;
    }
    
    // Player is holding something - confirm before accepting
    _christmas_handleItemConfirmation(event.npc, event.player);
}

function _christmas_handleItemConfirmation(npc, player) {
    var itemName = player.getMainhandItem().getName();
    var elfName = npc.getDisplay().getName() || 'Christmas Elf';
    var pname = player.getName();
    var now = Date.now();
    
    // Get display name for the item
    var itemDisplayName = '&6&l' + (player.getMainhandItem().getDisplayName ? player.getMainhandItem().getDisplayName() : itemName) + '&r';
    
    // Track last interaction per player using storeddata
    var lastInteractionKey = 'lastInteraction_' + pname;
    var lastItemKey = 'lastItem_' + pname;
    var lastInteraction = npc.getStoreddata().get(lastInteractionKey);
    var lastItem = npc.getStoreddata().get(lastItemKey);
    
    if (!lastInteraction) {
        // First interaction - remember item and ask for confirmation
        npc.getStoreddata().put(lastInteractionKey, now);
        npc.getStoreddata().put(lastItemKey, itemName);
        
        var firstMessages = [
            '&e&lOh!&r You want to give me ' + itemDisplayName + '? \u952A',
            '&a&lInteresting&r! Is ' + itemDisplayName + ' &atruly&r for &lme&r? \u952A',
            '&d&lHmm&r, you wish to &c&ldonate&r ' + itemDisplayName + '? \u952A',
            itemDisplayName + ' &e&llooks useful&r! Do you want to &a&lhelp&r? \u952A'
        ];
        npc.say(firstMessages[Math.floor(Math.random() * firstMessages.length)]);
        npc.executeCommand('/playsound customnpcs:human.girl.villager.uhuh player @a[r=12] ' + npc.getPos().getX() + ' ' + npc.getPos().getY() + ' ' + npc.getPos().getZ() + ' 0.8 1.1');
        logToFile('dev', '[christmas] Elf ' + elfName + ' received item offer from ' + pname + ': ' + itemName);
        return;
    }
    
    var timeSinceLastInteraction = now - lastInteraction;
    
    if (itemName !== lastItem) {
        // Different item offered - reset timer
        npc.getStoreddata().put(lastInteractionKey, now);
        npc.getStoreddata().put(lastItemKey, itemName);
        
        var differentMessages = [
            '&c&lOh&r, you &echanged&r your mind to ' + itemDisplayName + '! \u952A',
            '&aA &l&ddifferent&r item now? ' + itemDisplayName + ' &ais interesting&r! \u952A',
            '&e&lInteresting&r! So you want to give me ' + itemDisplayName + ' &a&linstead&r! \u952A'
        ];
        npc.say(differentMessages[Math.floor(Math.random() * differentMessages.length)]);
        logToFile('dev', '[christmas] Elf ' + elfName + ' received different item from ' + pname + ': ' + itemName);
        return;
    }
    
        if (timeSinceLastInteraction < ACCIDENTAL_DELAY_MS) {
        // Too fast - likely accidental double-click
        var doubleClickMessages = [
            '&c&lWhoa&r, &eeasy there&r with ' + itemDisplayName + '! \u9366',
            '&e&lSlow down&r! Did you mean to click &c&ltwice&r on ' + itemDisplayName + '? \u9366',
            '&b&lHold on&r, you clicked too &e&lfast&r! Be careful with ' + itemDisplayName + '! \u9366'
        ];
        npc.say(doubleClickMessages[Math.floor(Math.random() * doubleClickMessages.length)]);
        logToFile('dev', '[christmas] Elf ' + elfName + ' detected accidental double-click from ' + pname);
        return;
    }
    
        if (timeSinceLastInteraction >= ACCIDENTAL_DELAY_MS && timeSinceLastInteraction <= MAX_DELAY_MS) {
        // Within confirmation window - accept the item!
        var confirmMessages = [
            '&c&lThank you&r for ' + itemDisplayName + '! This will &ahelp&r! \u93E7',
            '&e&lWonderful&r! I will &a&lcherish&r ' + itemDisplayName + '! \u93E7',
            '&b&lPerfect&r! ' + itemDisplayName + ' is &eexactly&r what I &aneeded&r! \u93E7',
            '&a&lExcellent&r! Your ' + itemDisplayName + ' is &c&lpriceless&r! \u93E7'
        ];
        npc.say(confirmMessages[Math.floor(Math.random() * confirmMessages.length)]);
        
        // Take the item from player
        var itemStack = player.getMainhandItem();
        _christmas_recordDonation(player, itemStack);
        var itemStackClone = itemStack.copy();
        itemStackClone.setStackSize(itemStackClone.getStackSize() - 1);
        
        // Play acceptance effects
        _christmas_playAcceptEffects(npc);
        
        // Clear confirmation state
        npc.getStoreddata().put(lastInteractionKey, null);
        npc.getStoreddata().put(lastItemKey, null);

        player.setMainhandItem(itemStackClone);
        
        logToFile('dev', '[christmas] Elf ' + elfName + ' accepted item from ' + pname + ': ' + itemName);
        return;
    }
    
        if (timeSinceLastInteraction > MAX_DELAY_MS) {
        // Confirmation window expired - reset
        npc.getStoreddata().put(lastInteractionKey, now);
        npc.getStoreddata().put(lastItemKey, itemName);
        
        var expiredMessages = [
            '&c&lOops&r, you took &etoo long&r with ' + itemDisplayName + '! Let\'s start &a&lfresh&r! \u952A',
            '&e&lToo slow&r! Did you &cforget&r about ' + itemDisplayName + '? \u952A',
            '&bThe &lmoment&r for ' + itemDisplayName + ' &apassed&r! Try again! \u952A'
        ];
        npc.say(expiredMessages[Math.floor(Math.random() * expiredMessages.length)]);
        logToFile('dev', '[christmas] Elf ' + elfName + ' confirmation window expired from ' + pname);
        return;
    }
}
