// Single-use admin tool: Fill a chest with Christmas rewards for a selected player.
// Attach to a scripted item.
//
// Controls:
// - Right-click a chest: clears it and fills it with the selected player's reward items.
// - Right-click in air: shows currently selected player.
// - Left-click: cycle to next player.
// - Sneak + Left-click: cycle to previous player.

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');

var API = Java.type('noppes.npcs.api.NpcAPI').Instance();
var System = Java.type('java.lang.System');

// Absolute path as requested
var REWARDS_PATH = '/home/mouette/gramados-v2/scripts_backend/reports/christmas_elf_rewards.json';

var SD_KEY_INDEX = 'christmas_rewards_player_index';
var SD_KEY_NAME  = 'christmas_rewards_player_name';

function interact(event) {
    var player = event.player;
    var item = event.item;
    if (!player || !item) return;

    if (!checkFileExists(REWARDS_PATH)) {
        tellPlayer(player, '&c[ChristmasRewards] Rewards file not found: ' + REWARDS_PATH);
        return;
    }

    var rewards = loadJson(REWARDS_PATH);
    var players = _christmasRewards_getPlayers(rewards);
    if (!players.length) {
        tellPlayer(player, '&c[ChristmasRewards] No players found in rewards JSON.');
        return;
    }

    var sd = item.getStoreddata();
    var selectedName = _christmasRewards_getSelectedPlayerName(sd, players);

    // Look for a chest block in front of the player
    var trace = player.rayTraceBlock(5, true, false);
    var block = trace ? trace.getBlock() : null;

    if (!block || !block.getName || block.getName() === 'minecraft:air') {
        tellPlayer(player, '&e[ChristmasRewards] Selected: &b' + selectedName + '&e.');
        tellPlayer(player, '&7Right-click a chest to fill it. Left-click to cycle players.');
        return;
    }

    var blockName = block.getName();
    if (blockName !== 'minecraft:chest' && blockName !== 'minecraft:trapped_chest') {
        tellPlayer(player, '&e[ChristmasRewards] Look at a chest to fill it. (Found: ' + blockName + ')');
        return;
    }

    var containers = _christmasRewards_collectConnectedChestContainers(player.getWorld(), block);
    if (!containers || containers.length === 0) {
        tellPlayer(player, '&c[ChristmasRewards] Could not access chest container(s).');
        return;
    }

    var playerRewards = rewards[selectedName];
    if (!playerRewards || !playerRewards.items || !playerRewards.items.length) {
        tellPlayer(player, '&c[ChristmasRewards] No reward items for: ' + selectedName);
        return;
    }

    // Clear all connected chests first
    var totalSlots = 0;
    for (var ci = 0; ci < containers.length; ci++) {
        var c = containers[ci];
        var sz = c.getSize();
        totalSlots += sz;
        for (var si = 0; si < sz; si++) {
            c.setSlot(si, null);
        }
    }

    var world = player.getWorld();

    var writtenStacks = 0;
    var writtenSlots = 0;
    var skippedStacks = 0;

    // Current output position across multiple containers
    var outContainerIndex = 0;
    var outSlotIndex = 0;

    for (var ri = 0; ri < playerRewards.items.length; ri++) {
        var entry = playerRewards.items[ri];
        if (!entry || !entry.id) continue;

        var remaining = (typeof entry.count === 'number') ? entry.count : 1;
        if (remaining <= 0) continue;

        // Build a 1-count stack to discover max stack size for this exact NBT
        var probeNbt = {
            id: entry.id,
            Count: 1,
            Damage: (typeof entry.meta === 'number') ? entry.meta : 0
        };
        if (entry.nbt) {
            // Rewards JSON stores the item TAG as a JSON object
            probeNbt.tag = entry.nbt;
        }

        var probeStack = world.createItemFromNbt(API.stringToNbt(JSON.stringify(probeNbt)));
        var maxStackSize = (probeStack && probeStack.getMaxStackSize) ? probeStack.getMaxStackSize() : 64;
        if (maxStackSize <= 0) maxStackSize = 64;

        while (remaining > 0) {
            if (writtenSlots >= totalSlots) {
                skippedStacks++;
                remaining = 0;
                break;
            }

            var piece = Math.min(maxStackSize, remaining);

            var nbtObj = {
                id: entry.id,
                Count: piece,
                Damage: (typeof entry.meta === 'number') ? entry.meta : 0
            };
            if (entry.nbt) {
                nbtObj.tag = entry.nbt;
            }

            var stack = world.createItemFromNbt(API.stringToNbt(JSON.stringify(nbtObj)));
            if (stack && typeof stack.setStackSize === 'function') {
                stack.setStackSize(piece);
            }

            // Advance across containers as slots are filled
            while (outContainerIndex < containers.length && outSlotIndex >= containers[outContainerIndex].getSize()) {
                outContainerIndex++;
                outSlotIndex = 0;
            }
            if (outContainerIndex >= containers.length) {
                skippedStacks++;
                remaining = 0;
                break;
            }
            containers[outContainerIndex].setSlot(outSlotIndex, stack);
            outSlotIndex++;
            writtenSlots++;
            writtenStacks++;

            remaining -= piece;
        }
    }

    tellPlayer(player, '&a[ChristmasRewards] Filled chest for &b' + selectedName + '&a.');
    tellPlayer(player, '&7Used &e' + containers.length + '&7 connected chest container(s).');
    tellPlayer(player, '&7Wrote &e' + writtenStacks + '&7 stacks into &e' + writtenSlots + '&7/' + totalSlots + '&7 slots.');
    if (skippedStacks > 0) {
        tellPlayer(player, '&e[ChristmasRewards] Not enough chest space; some stacks were skipped.');
    }
}

function _christmasRewards_isChestBlockName(name) {
    return name === 'minecraft:chest' || name === 'minecraft:trapped_chest';
}

// Collect all containers reachable by orthogonally-adjacent chests starting from startBlock.
// Deduplicates containers via Java identity hash code (handles double-chest containers).
function _christmasRewards_collectConnectedChestContainers(world, startBlock) {
    if (!world || !startBlock) return [];

    var sx = startBlock.getX();
    var sy = startBlock.getY();
    var sz = startBlock.getZ();

    var queue = [{ x: sx, y: sy, z: sz }];
    var visited = {};
    var containers = [];
    var seenContainers = {};

    while (queue.length > 0) {
        var cur = queue.shift();
        var key = cur.x + ',' + cur.y + ',' + cur.z;
        if (visited[key]) continue;
        visited[key] = true;

        var blk = world.getBlock(cur.x, cur.y, cur.z);
        if (!blk || !blk.getName) continue;
        var name = blk.getName();
        if (!_christmasRewards_isChestBlockName(name)) continue;

        var c = blk.getContainer();
        if (c) {
            var cid = '' + System.identityHashCode(c);
            if (!seenContainers[cid]) {
                seenContainers[cid] = true;
                containers.push(c);
            }
        }

        // 4-directional adjacency on the same Y
        queue.push({ x: cur.x + 1, y: cur.y, z: cur.z });
        queue.push({ x: cur.x - 1, y: cur.y, z: cur.z });
        queue.push({ x: cur.x, y: cur.y, z: cur.z + 1 });
        queue.push({ x: cur.x, y: cur.y, z: cur.z - 1 });
    }

    return containers;
}

function attack(event) {
    var player = event.player;
    var item = event.item;
    if (!player || !item) return;

    if (!checkFileExists(REWARDS_PATH)) {
        tellPlayer(player, '&c[ChristmasRewards] Rewards file not found: ' + REWARDS_PATH);
        return;
    }

    var rewards = loadJson(REWARDS_PATH);
    var players = _christmasRewards_getPlayers(rewards);
    if (!players.length) {
        tellPlayer(player, '&c[ChristmasRewards] No players found in rewards JSON.');
        return;
    }

    var sd = item.getStoreddata();
    var idx = _christmasRewards_getSelectedPlayerIndex(sd, players);

    if (player.isSneaking()) {
        idx = (idx - 1 + players.length) % players.length;
    } else {
        idx = (idx + 1) % players.length;
    }

    sd.put(SD_KEY_INDEX, String(idx));
    sd.put(SD_KEY_NAME, players[idx]);

    tellPlayer(player, '&a[ChristmasRewards] Selected: &b' + players[idx] + '&a (' + (idx + 1) + '/' + players.length + ')');
}

function getTooltip(e) {
    e.add('&aChristmas Rewards Chest Filler');
    e.add('&7Right-click chest: clear + fill rewards');
    e.add('&7Right-click air: show selection');
    e.add('&7Left-click: next player');
    e.add('&7Sneak + Left-click: previous player');
}

function _christmasRewards_getPlayers(rewards) {
    if (!rewards) return [];
    var names = Object.keys(rewards);
    // Stable order makes cycling predictable
    names.sort();
    return names;
}

function _christmasRewards_getSelectedPlayerIndex(sd, players) {
    var idxStr = sd.get(SD_KEY_INDEX);
    var idx = 0;
    if (typeof idxStr === 'string' && idxStr.length > 0) {
        var parsed = parseInt(idxStr, 10);
        if (!isNaN(parsed)) idx = parsed;
    }

    // Prefer restoring by stored name if available
    var storedName = sd.get(SD_KEY_NAME);
    if (storedName && typeof storedName === 'string') {
        var found = players.indexOf(storedName);
        if (found !== -1) return found;
    }

    // Clamp
    if (idx < 0) idx = 0;
    if (idx >= players.length) idx = 0;
    return idx;
}

function _christmasRewards_getSelectedPlayerName(sd, players) {
    var idx = _christmasRewards_getSelectedPlayerIndex(sd, players);
    var name = players[idx];
    sd.put(SD_KEY_INDEX, String(idx));
    sd.put(SD_KEY_NAME, name);
    return name;
}
