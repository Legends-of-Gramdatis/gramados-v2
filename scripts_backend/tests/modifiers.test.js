// Run from repository root: node scripts_backend/tests/modifiers.test.js
// Exercises production scripts with a small CustomNPCs/NBT fixture; no server required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const clone = value => JSON.parse(JSON.stringify(value));
class Nbt {
    constructor(data = {}) { this.data = data; }
    has(key) { return Object.hasOwn(this.data, key); }
    remove(key) { delete this.data[key]; }
    getCompound(key) { return new Nbt(this.data[key] || {}); }
    setCompound(key, value) { this.data[key] = clone(value.data); }
    getString(key) { return this.data[key] || ''; }
    setString(key, value) { this.data[key] = String(value); }
    getBoolean(key) { return !!this.data[key]; }
    setBoolean(key, value) { this.data[key] = !!value; }
    getInteger(key) { return this.data[key] || 0; }
    setInteger(key, value) { assert(Number.isInteger(value)); this.data[key] = value; }
    getDouble(key) { return this.data[key] || 0; }
    setDouble(key, value) { this.data[key] = value; }
    getShort(key) { return this.getInteger(key); }
    setShort(key, value) { this.setInteger(key, value); }
}
class Item {
    constructor(nbt) { this.data = clone(nbt); }
    copy() { return new Item(this.data); }
    getItemNbt() { return new Nbt(clone(this.data)); }
    getNbt() { return new Nbt(this.data.tag || (this.data.tag = {})); }
    isEmpty() { return this.data.Count <= 0 || this.data.id === 'minecraft:air'; }
    getName() { return this.data.id; }
    getStackSize() { return this.data.Count; }
    setStackSize(count) { this.data.Count = count; }
    setCustomName(name) { this.data.tag = this.data.tag || {}; this.data.tag.name = name; }
    getDisplayName() { return this.data.tag?.name || this.data.id; }
    setLore(lore) { this.data.tag = this.data.tag || {}; this.data.tag.lore = clone(lore); }
    getLore() { return this.data.tag?.lore || []; }
}
const world = {
    createItem: (id, damage, count) => new Item({id, Damage: damage, Count: count, tag: {}}),
    createItemFromNbt: nbt => new Item(nbt.data)
};
let now = 1000000;
let runtime = {};
let effectResult = 1;
const messages = [];
const c = vm.createContext({
    load() {}, Java: {type: () => ({Instance: () => ({executeCommand() {}, stringToNbt: str => new Nbt(JSON.parse(str))})})},
    Date: {now: () => now}, Math: Object.create(Math),
    loadJson: name => name.endsWith('passive_modifiers.json') ? clone(runtime) : JSON.parse(fs.readFileSync(name, 'utf8')),
    saveJson: (data, name) => { assert(name.endsWith('passive_modifiers.json')); runtime = clone(data); },
    findJsonEntryArray: (list, key, value) => list.find(entry => entry[key] === value) || null,
    ccs: str => str, parseEmotes: str => str, includes: (list, value) => list.includes(value),
    tellPlayer: (player, message) => messages.push(message), logToFile() {},
    format_arcade_token_count: count => `${count} Arcade Tokens`,
    isArcadeToken: item => item.getName() === 'test:arcade_token',
    exports_utils_farm_crops: {harvestCropsBreak: () => effectResult},
    exports_utils_farm_fruits: {}, exports_utils_pickpocket: {}, exports_utils_nature: {}
});
const scripts = 'world/customnpcs/scripts/ecmascript/';
for (const file of ['gramados_utils/utils_maths.js', 'gramados_utils/utils_crate_keys.js', 'gramados_utils/utils_item_ownership.js',
    'gramados_utils/utils_modifier_items.js', 'gramados_utils/utils_modifiers.js',
    'gramados_utils/utils_loot_tables.js', 'modules/modifiers/modifierEngine.js']) {
    vm.runInContext(fs.readFileSync(scripts + file, 'utf8'), c, {filename: file});
}
const air = {getName: () => 'minecraft:air'};
let target = air;
const player = {
    hand: null, received: [], dropped: [],
    getWorld: () => world, getUUID: () => 'player-1', getName: () => 'Tester',
    getMainhandItem() { return this.hand; }, setMainhandItem(item) { this.hand = item; },
    getOffhandItem: () => world.createItem('minecraft:air', 0, 0),
    giveItem(item) { this.received.push(item); return true; }, dropItem(item) { this.dropped.push(item); },
    rayTraceBlock: () => ({getBlock: () => target}), getPos: () => ({getX: () => 0, getY: () => 64, getZ: () => 0})
};
const make = (spec = {}, count = 1) => c.create_modifier_item_stack(world, world.createItem('test:carrier', 7, count), {type: 'crop_harvest', ...spec});
const tag = item => item.data.tag;
let passed = 0;
function test(name, run) {
    runtime = {}; now = 1000000; effectResult = 1; target = air;
    player.received = []; player.dropped = []; c.Math.random = Math.random;
    run(); passed++; console.log('PASS ' + name);
}
test('integer and continuous RNG use the existing math helpers', () => {
    c.Math.random = () => 0;
    assert.equal(c.resolve_modifier_value({min: 0, max: 3}, true), 0);
    c.Math.random = () => 0.999999;
    assert.equal(c.resolve_modifier_value({min: 0, max: 3}, true), 3);
    assert(c.resolve_modifier_value({min: 1.05, max: 1.3}) > 1.29);
    assert.equal(c.resolve_modifier_value(0, true), 0);
    const rounded = c.rrandom_range;
    const continuous = c.random_range;
    c.rrandom_range = () => 42; c.random_range = () => 1.234;
    assert.equal(c.resolve_modifier_value({min: 0, max: 3}, true), 42);
    assert.equal(c.resolve_modifier_value({min: 1, max: 2}), 1.234);
    c.rrandom_range = rounded; c.random_range = continuous;
});
test('lifecycle defaults come from config; missing config surfaces a native error', () => {
    const load = c.loadJson;
    c.loadJson = name => {
        const data = load(name);
        if (name.endsWith('modifiers_config.json')) {
            data.defaults.usesBeforeDepletion = 4; data.defaults.cooldownSeconds = 60;
            data.defaults.brokenItem = {id: 'test:default_broken', damage: 6};
        }
        return data;
    };
    const item = make();
    assert.equal(tag(item).modifier_uses_before_depletion, 4);
    assert.equal(tag(item).modifier_cooldown_seconds, 60);
    assert.equal(tag(item).modifier_broken_item_id, 'test:default_broken');
    assert.equal(tag(item).modifier_broken_item_damage, 6);
    c.loadJson = () => null;
    assert.throws(() => c.get_modifier_config_entry('crop_harvest'), {name: 'TypeError'});
    assert.throws(() => c.get_modifier_legacy_entry('crop harvest'), {name: 'TypeError'});
    c.loadJson = load;
});
test('new format, physical metadata, tier boundaries and AND presentation', () => {
    const item = make();
    for (const field of ['modifier_class', 'modifier_type', 'modifier_use', 'is_broken']) assert(!Object.hasOwn(tag(item), field));
    assert.equal(item.data.id, 'test:carrier'); assert.equal(item.data.Damage, 7);
    const rules = [{when: {radius: {gte: 10, lt: 30}, durationMinutes: {gte: 60}}, value: 'tier'}, {when: {}, value: 'fallback'}];
    assert.equal(c.resolve_modifier_presentation(rules, {radius: 10, durationMinutes: 60}), 'tier');
    assert.equal(c.resolve_modifier_presentation(rules, {radius: 30, durationMinutes: 60}), 'fallback');
    assert.equal(c.resolve_modifier_presentation(rules, {radius: 10, durationMinutes: 59}), 'fallback');
    assert.equal(c.resolve_modifier_presentation(rules, {}), 'fallback');
    for (const [op, left, right, expected] of [['lt', 1, 2, true], ['lte', 2, 2, true], ['gt', 2, 1, true], ['gte', 2, 2, true], ['eq', 2, 2, true], ['eq', 2, '2', false]]) {
        assert.equal(c.compare_values(left, right, op), expected);
    }
});
test('four successful uses then break; recharge restores rolled values and carrier', () => {
    player.hand = make({usesBeforeDepletion: 3, radius: 23, brokenItem: {id: 'test:broken', damage: 4}});
    for (const expected of [2, 1, 0]) { c.interact({player}); assert.equal(tag(player.hand).modifier_uses_before_depletion, expected); assert(!tag(player.hand).modifier_depleted); }
    c.interact({player}); assert(tag(player.hand).modifier_depleted); assert.equal(player.hand.data.id, 'test:broken'); assert.equal(player.hand.data.Damage, 4);
    player.hand = c.repair_modifier_item(player, player.hand);
    assert.equal(tag(player.hand).modifier_uses_before_depletion, 3); assert.equal(tag(player.hand).modifier_radius, 23);
    assert.equal(player.hand.data.id, 'test:carrier'); assert.equal(player.hand.data.Damage, 7); assert.equal(tag(player.hand).modifier_repairs, 1);
});
test('last consumable use removes one physical item only', () => {
    player.hand = make({onDepletion: 'disappear'}, 2); c.interact({player});
    assert.equal(player.hand.getStackSize(), 1); assert(!tag(player.hand).modifier_last_used_at); assert.equal(player.received.length, 0);
    c.interact({player}); assert.equal(player.hand, null);
});
test('stacked multi-use item separates used state and handles full inventory', () => {
    player.hand = make({usesBeforeDepletion: 2, cooldownSeconds: 100}, 3);
    const give = player.giveItem; player.giveItem = () => false;
    c.interact({player}); player.giveItem = give;
    assert.equal(player.hand.getStackSize(), 2); assert.equal(tag(player.hand).modifier_uses_before_depletion, 2);
    assert.equal(player.dropped.length, 1); assert.equal(tag(player.dropped[0]).modifier_uses_before_depletion, 1);
    assert.equal(tag(player.dropped[0]).modifier_last_used_at, now);
});
test('no-op and failed effects leave item and timestamp untouched', () => {
    player.hand = make({usesBeforeDepletion: 2, cooldownSeconds: 10});
    const before = JSON.stringify(player.hand.data);
    for (const failure of [null, false, undefined, 0, {changed: 0, cattle: 8, fields: 2}, {converted: 0, planted: 0}, {affected: 0}]) {
        effectResult = failure; c.interact({player}); assert.equal(JSON.stringify(player.hand.data), before);
    }
});
test('cooldown begins on success, expires at boundary and survives recharge', () => {
    player.hand = make({cooldownSeconds: 10}); c.interact({player});
    player.hand = c.repair_modifier_item(player, player.hand);
    const before = JSON.stringify(player.hand.data); now += 9999; c.interact({player}); assert.equal(JSON.stringify(player.hand.data), before);
    now++; c.interact({player}); assert(tag(player.hand).modifier_depleted); assert.equal(tag(player.hand).modifier_last_used_at, now);
});
test('duration shorter than cooldown; separate items still obey effect conflict', () => {
    const spec = {type: 'stock_income', multiplier: 1.27, durationMinutes: 1, usesBeforeDepletion: 2, cooldownSeconds: 120};
    player.hand = make(spec); c.interact({player}); assert.equal(runtime['player-1'][0].multiplier, 1.27);
    const other = make({...spec, cooldownSeconds: 0}); const first = player.hand;
    player.hand = other; c.interact({player}); assert.equal(tag(player.hand).modifier_uses_before_depletion, 2);
    player.hand = first; now += 60000; c.interact({player}); assert.equal(tag(player.hand).modifier_uses_before_depletion, 1);
    now += 60000; c.interact({player}); assert.equal(tag(player.hand).modifier_uses_before_depletion, 0);
});
test('duration longer than cooldown and logout pauses duration only', () => {
    player.hand = make({type: 'stock_income', durationMinutes: 60, usesBeforeDepletion: 2, cooldownSeconds: 600});
    c.interact({player}); now += 600000; c.logout({player});
    const remaining = runtime['player-1'][0].remainingMs; now += 86400000; c.login({player});
    assert.equal(runtime['player-1'][0].remainingMs, remaining);
    c.interact({player}); assert.equal(tag(player.hand).modifier_uses_before_depletion, 1);
    now += remaining; c.interact({player}); assert.equal(tag(player.hand).modifier_uses_before_depletion, 0);
});
test('legacy orb, consumable, oldest format, broken item and runtime migration', () => {
    for (const legacy of [
        {is_modifier: true, modifier_class: 'orb', modifier_type: 'active', modifier_effect: 'nature grass large', modifier_radius: 37, is_broken: false, modifier_repairs: 4},
        {is_modifier: true, modifier_class: 'consumable', modifier_effect: 'nature grass small', modifier_radius: 9},
        {is_passive_modifier: false, passive_modifier_type: 'stock income 25%', duration_minutes: 65, repairs: 3}
    ]) {
        const source = world.createItem(legacy.is_passive_modifier === false ? 'variedcommodities:orb_broken' : 'test:carrier', 5, 1);
        source.data.tag = {...legacy, owner_uuid: 'player-1', owner_name: 'Tester'};
        const migrated = c.update_old_modifier_to_new(source, player);
        assert.equal(tag(migrated).owner_uuid, 'player-1'); assert.equal(tag(migrated).modifier_uses_before_depletion, 0);
        assert(!Object.hasOwn(tag(migrated), 'modifier_class')); assert(!c.is_old_modifier(migrated));
        assert.equal(JSON.stringify(c.update_old_modifier_to_new(migrated, player).data), JSON.stringify(migrated.data));
        if (legacy.modifier_radius) assert.equal(tag(migrated).modifier_radius, legacy.modifier_radius);
        if (legacy.is_passive_modifier === false) {
            assert(tag(migrated).modifier_depleted); assert.equal(tag(migrated).modifier_multiplier, 1.25);
            assert.equal(tag(migrated).modifier_duration_minutes, 65); assert.equal(tag(migrated).modifier_repairs, 3);
            assert.equal(c.repair_modifier_item(player, migrated).data.id, 'variedcommodities:orb');
        }
    }
    runtime = {'player-1': [{type: 'junkyard loot triple', remainingMs: 10000, lastOnlineAt: null}]};
    const migrated = c.get_players_passive_modifiers(player)[0]; assert.equal(migrated.type, 'junkyard_loot'); assert.equal(migrated.multiplier, 3);
    assert.equal(c.get_passive_multiplier_for_tag(player, 'junkyard_loot'), 3);
    assert.equal(c.apply_passive_modifier_type(player, 'junkyard_loot', {durationMinutes: 1}), false);
});
test('ownership rejected before mutation; bound owner preserved through use and recharge', () => {
    player.hand = c.bindItemToPlayer(make(), player); tag(player.hand).owner_uuid = 'other';
    const before = JSON.stringify(player.hand.data); c.interact({player}); assert.equal(JSON.stringify(player.hand.data), before);
    tag(player.hand).owner_uuid = 'player-1'; c.interact({player}); player.hand = c.repair_modifier_item(player, player.hand);
    assert.equal(tag(player.hand).owner_uuid, 'player-1'); assert(player.hand.getLore().some(line => line.includes('Bound to:')));
});
test('recharge first free, later costs tokens, insufficient funds leave both unchanged', () => {
    player.hand = make(); c.interact({player});
    const slots = [world.createItem('test:arcade_token', 0, 1)];
    const container = {getSize: () => slots.length, getSlot: i => slots[i] || world.createItem('minecraft:air', 0, 0), setSlot: (i, item) => { slots[i] = item; }};
    target = {getName: () => 'minecraft:chest', getContainer: () => container};
    c.interact({player}); assert.equal(slots[0].getStackSize(), 1); assert.equal(tag(player.hand).modifier_repairs, 1);
    target = air; c.interact({player}); target = {getName: () => 'minecraft:chest', getContainer: () => container};
    c.interact({player}); assert.equal(slots[0], null); assert.equal(tag(player.hand).modifier_repairs, 2);
    target = air; c.interact({player}); const before = JSON.stringify(player.hand.data); target = {getName: () => 'minecraft:chest', getContainer: () => container};
    c.interact({player}); assert.equal(JSON.stringify(player.hand.data), before);
});
test('admin all fills valid defaults; blank legacy carriers accept named presets', () => {
    const offhand = player.getOffhandItem;
    player.getOffhandItem = () => world.createItem('mts:ivv.idcard_seagull', 0, 1);
    const slots = Array(30).fill(null);
    const label = world.createItem('minecraft:name_tag', 0, 1); label.setCustomName('all'); slots[0] = label;
    const container = {getSize: () => slots.length, getSlot: i => slots[i] || world.createItem('minecraft:air', 0, 0), setSlot: (i, item) => { slots[i] = item; }};
    target = {getName: () => 'minecraft:chest', getContainer: () => container};
    player.hand = world.createItem('variedcommodities:orb', 0, 2);
    c.interact({player});
    const effects = JSON.parse(fs.readFileSync(scripts + 'modules/modifiers/modifiers_config.json', 'utf8')).effects;
    assert.equal(slots.filter(Boolean).length, effects.length);
    for (const item of slots.filter(Boolean)) { assert(c.is_modifier(item)); assert.equal(item.getStackSize(), 1); }
    slots.fill(null); label.setCustomName('stock income 25%'); slots[0] = label;
    player.hand.data.tag = {is_modifier: true, modifier_class: 'orb'};
    c.interact({player});
    assert.equal(player.hand.getStackSize(), 1); assert.equal(tag(player.received[0]).modifier_effect, 'stock_income');
    assert.equal(tag(player.received[0]).modifier_multiplier, 1.25);
    player.getOffhandItem = offhand;
});
test('all authored modifier/key entries generate; RNG resolved once per prepared reward', () => {
    const files = [
        ...fs.readdirSync('world/loot_tables/modifiers').map(file => 'modifiers/' + file),
        ...fs.readdirSync('world/loot_tables/casino/keys').filter(file => file.endsWith('.json')).map(file => 'casino/keys/' + file)
    ];
    for (const file of files) {
        const table = JSON.parse(fs.readFileSync('world/loot_tables/' + file, 'utf8'));
        for (const pool of table.pools) for (const entry of pool.entries) {
            if (entry.type !== 'item') continue;
            const functions = entry.functions || [];
            const spec = functions.find(f => f.function === 'set_modifier');
            const key = functions.find(f => f.function === 'set_crate_key');
            const damage = functions.find(f => f.function === 'set_data')?.data || 0;
            const base = world.createItem(entry.name, damage, 1);
            if (spec) { const generated = c.create_modifier_item_stack(world, base, spec); assert(c.is_modifier(generated)); assert.equal(generated.data.Damage, damage); }
            if (key) { const generated = c.create_crate_key_item_stack(world, base, key); assert(c.isCrateKey(generated)); assert(!c.is_modifier(generated)); }
        }
        const prepared = c.prepareLootTablePull(file, player); assert(prepared.loot.length > 0);
        for (const entry of prepared.loot) {
            const item = c.generateItemStackFromLootEntry(entry, world, player);
            if (entry.modifier) {
                assert(c.is_modifier(item));
                const repeated = c.generateItemStackFromLootEntry(entry, world, player);
                assert.deepEqual(item.data, repeated.data);
            } else assert(c.isCrateKey(item));
        }
    }
});
test('set_owner still links a generated modifier to the receiving player', () => {
    const load = c.loadJson;
    c.loadJson = name => name === 'world/loot_tables/test_bound_modifier.json'
        ? {pools: [{rolls: 1, entries: [{type: 'item', name: 'variedcommodities:orb', weight: 1,
            functions: [{function: 'set_modifier', type: 'crop_harvest'}, {function: 'set_owner', owner: 'player'}]}]}]}
        : load(name);
    const prepared = c.prepareLootTablePull('test_bound_modifier.json', player);
    const modifier = c.generateItemStackFromLootEntry(prepared.loot[0], world, player);
    c.loadJson = load;
    assert.equal(tag(modifier).owner_uuid, player.getUUID());
    assert.equal(tag(modifier).owner_name, player.getName());
    player.hand = modifier;
    const ownUUID = player.getUUID; player.getUUID = () => 'other-player';
    const before = JSON.stringify(modifier.data); c.interact({player});
    assert.equal(JSON.stringify(player.hand.data), before); player.getUUID = ownUUID;
    c.interact({player}); assert.equal(tag(player.hand).owner_uuid, player.getUUID());
});
test('new and legacy crate keys tradable; bound keys restricted; engine ignores keys', () => {
    for (const legacy of [false, true]) {
        let key = c.create_crate_key_item_stack(world, world.createItem('variedcommodities:key', 0, 1), {crate_type: 'modifiers'});
        if (legacy) key.data.tag = {is_modifier: true, modifier_class: 'key', modifier_effect: 'open_crate', modifier_use: 'single-use', crate_type: 'modifiers'};
        assert(c.canPlayerOpenCrateWithKey(key, player, 'modifiers')); assert(!c.canPlayerOpenCrateWithKey(key, player, 'gems'));
        player.hand = key; c.interact({player}); assert.equal(player.hand, key);
        key = c.bindItemToPlayer(key, player); assert(c.canPlayerOpenCrateWithKey(key, player, 'modifiers'));
        tag(key).owner_uuid = 'other'; assert(!c.canPlayerOpenCrateWithKey(key, player, 'modifiers'));
    }
});
console.log(`${passed} modifier regression groups passed.`);
