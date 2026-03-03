// Single-use debug tool: count all blocks with id `mts:decor`
// inside the fixed world-coordinate box:
// -1183 73 112 -> -882 150 270

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

var TARGET_BLOCK_ID = 'mts:decor';
var ALLOWED_URL_PREFIX = 'https://legends-of-gramdatis.com/';
var REPLACEMENT_URL = 'https://legends-of-gramdatis.com/gramados_skins/1_1_billboard_El_Embrague-Divino.png';

var REGION_MIN = { x: -1183, y: 73, z: 112 };
var REGION_MAX = { x: -882, y: 150, z: 270 };

function interact(event) {
    var player = event.player;
    if (!player) return;

    var world = player.getWorld();
    if (!world) return;

    var bounds = getNormalizedBounds(REGION_MIN, REGION_MAX);

    tellPlayer(player, '&6[Decor Scan] &7Counting &e' + TARGET_BLOCK_ID + '&7 in the fixed region...');

    var counts = countDecorAndTextImageUrl(world, bounds.min, bounds.max, TARGET_BLOCK_ID);
    var volume = getVolume(bounds.min, bounds.max);

    tellPlayer(player, '&6[Decor Scan] &aDone. Found &e' + counts.totalDecor + '&a block(s) of &e' + TARGET_BLOCK_ID + '&a.');
    tellPlayer(player, '&6[Decor Scan] &aWith non-empty &etextimageURL&a in block NBT: &e' + counts.withTextimageUrl);
    tellPlayer(player, '&6[Decor Scan] &aURLs replaced (not starting with &e' + ALLOWED_URL_PREFIX + '&a): &e' + counts.replacedCount);
    if (counts.urls.length > 0) {
        tellPlayer(player, '&6[Decor Scan] &7Listing textimageURL values:');
        for (var i = 0; i < counts.urls.length; i++) {
            var entry = counts.urls[i];
            tellPlayer(player, '&7- (&b' + entry.x + '&7, &b' + entry.y + '&7, &b' + entry.z + '&7) &f' + entry.value);
        }
    }
    tellPlayer(player, '&7Box: (&b' + bounds.min.x + '&7, &b' + bounds.min.y + '&7, &b' + bounds.min.z + '&7) -> (&b' + bounds.max.x + '&7, &b' + bounds.max.y + '&7, &b' + bounds.max.z + '&7), volume=&e' + volume);
}

function countDecorAndTextImageUrl(world, minPos, maxPos, targetId) {
    var totalDecor = 0;
    var withTextimageUrl = 0;
    var replacedCount = 0;
    var urls = [];

    for (var x = minPos.x; x <= maxPos.x; x++) {
        for (var y = minPos.y; y <= maxPos.y; y++) {
            for (var z = minPos.z; z <= maxPos.z; z++) {
                var block = world.getBlock(x, y, z);
                if (!block || typeof block.getName !== 'function') continue;
                if (block.getName() === targetId) {
                    totalDecor++;
                    var textimageUrl = getTextimageUrl(block);
                    if (textimageUrl !== null) {
                        if (!startsWith(textimageUrl, ALLOWED_URL_PREFIX)) {
                            setTextimageUrl(block, REPLACEMENT_URL);
                            textimageUrl = REPLACEMENT_URL;
                            replacedCount++;
                        }
                        withTextimageUrl++;
                        urls.push({
                            x: x,
                            y: y,
                            z: z,
                            value: textimageUrl
                        });
                    }
                }
            }
        }
    }

    return {
        totalDecor: totalDecor,
        withTextimageUrl: withTextimageUrl,
        replacedCount: replacedCount,
        urls: urls
    };
}

function getTextimageUrl(block) {
    if (typeof block.getTileEntityNBT !== 'function') return null;

    var nbt = block.getTileEntityNBT();
    if (!nbt || typeof nbt.has !== 'function' || !nbt.has('textimageURL')) return null;

    var value = nbt.getString('textimageURL');
    if (value === null || value === '') return null;
    return value;
}

function setTextimageUrl(block, value) {
    if (typeof block.getTileEntityNBT !== 'function') return;
    if (typeof block.setTileEntityNBT !== 'function') return;

    var nbt = block.getTileEntityNBT();
    if (!nbt || typeof nbt.setString !== 'function') return;

    nbt.setString('textimageURL', value);
    block.setTileEntityNBT(nbt);
}

function startsWith(text, prefix) {
    if (text === null || prefix === null) return false;
    return String(text).indexOf(String(prefix)) === 0;
}

function getNormalizedBounds(a, b) {
    return {
        min: {
            x: Math.min(a.x, b.x),
            y: Math.min(a.y, b.y),
            z: Math.min(a.z, b.z)
        },
        max: {
            x: Math.max(a.x, b.x),
            y: Math.max(a.y, b.y),
            z: Math.max(a.z, b.z)
        }
    };
}

function getVolume(minPos, maxPos) {
    return (maxPos.x - minPos.x + 1) * (maxPos.y - minPos.y + 1) * (maxPos.z - minPos.z + 1);
}

function getTooltip(event) {
    event.add('&6Count mts:decor in fixed region');
    event.add('&7Right-click to scan -1183 73 112 to -882 150 270.');
}
