// Utilities for Animania cattle management in field cuboids
// Nashorn + CustomNPCs API (MC 1.12.2)

load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_region.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_maths.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js');
load('world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js');

var DEFAULT_CATTLE_SCAN_RADIUS = 48;   // blocks around player
var DEFAULT_GESTATION_TICKS = 20182;   // observed gestation duration in NBT
var ANIMANIA_ANIMALS_JSON_PATH = 'world/customnpcs/scripts/data/animania_animals.json';
var ANIMANIA_ANIMALS_DATA = null;

/**
 * Mark eligible field cows as pregnant. Sets Gestation to default if missing/zero.
 */
function makeFieldCattlePregnant(player, radius) {
	return _applyFieldCattleAction(player, radius, 'Pregnant', _mutatePregnantCow);
}

/**
 * Force-ends gestation for pregnant field cows (Gestation -> 0).
 */
function skipGestationForFieldCattle(player, radius) {
	return _applyFieldCattleAction(player, radius, 'Skip Gestation', _mutateSkipGestation);
}

/**
 * Flag adult field cows as having kids (HasKids -> true).
 */
function setFieldCowsHasKids(player, radius) {
	return _applyFieldCattleAction(player, radius, 'HasKids', _mutateHasKidsFlag);
}

/**
 * Grow calves in the player fields to adulthood (Age -> 1).
 */
function growFieldCalvesToAdults(player, radius) {
	return _applyFieldCattleAction(player, radius, 'Grow Calves', _mutateGrowCalf);
}

// ---- Internal helpers ----

function _applyFieldCattleAction(player, radius, label, mutator) {
	if (!player || !mutator) return { changed: 0, cattle: 0, fields: 0 };
	var world = player.getWorld();
	if (!world) return { changed: 0, cattle: 0, fields: 0 };

	var playerFields = filterCuboidsByString(getPlayerCuboids(player), '_Field_');
	if (!playerFields.length) {
		tellPlayer(player, '&cThis tool only works in fields.');
		return { changed: 0, cattle: 0, fields: 0 };
	}

	var fieldBounds = _buildFieldBounds(playerFields);
	if (!fieldBounds.length) {
		tellPlayer(player, '&cNo valid field data found for these regions.');
		return { changed: 0, cattle: 0, fields: 0 };
	}

	var scanRadius = radius || DEFAULT_CATTLE_SCAN_RADIUS;
	var cattle = _collectFieldCattle(world, player.getPos(), scanRadius, fieldBounds);
	if (!cattle.length) {
		tellPlayer(player, '&eNo Animania cattle found in these fields.');
		return { changed: 0, cattle: 0, fields: fieldBounds.length };
	}

	var changed = 0;
	for (var i = 0; i < cattle.length; i++) {
		var entry = cattle[i];
		if (mutator(entry.nbt)) {
			if (entry.entity.setEntityNbt) entry.entity.setEntityNbt(entry.nbt);
			changed++;
		}
	}

	tellPlayer(player, '&a[' + label + '] Changed &6' + changed + ' &aof &6' + cattle.length + ' &acattle across &6' + fieldBounds.length + ' &afield(s).');
	return { changed: changed, cattle: cattle.length, fields: fieldBounds.length };
}

function _buildFieldBounds(fieldNames) {
	var out = [];
	var worldData = getWorldData();
	if (!worldData) return out;

	for (var i = 0; i < fieldNames.length; i++) {
		var name = '' + fieldNames[i];
		var dataStr = worldData.get('region_' + name);
		if (!dataStr) continue;
		var data;
		try { data = JSON.parse(dataStr); } catch (e) { continue; }
		if (!data || !data.positions || !data.positions.length) continue;

		var boxes = [];
		for (var j = 0; j < data.positions.length; j++) {
			var sub = data.positions[j];
			if (!sub || !sub.xyz1 || !sub.xyz2) continue;
			boxes.push(_normalizeBox(sub.xyz1, sub.xyz2));
		}
		if (boxes.length) out.push({ name: name, boxes: boxes });
	}

	return out;
}

function _collectFieldCattle(world, center, radius, fields) {
	var out = [];
	var entities = world.getNearbyEntities(center, radius, 0);
	for (var i = 0; i < entities.length; i++) {
		var ent = entities[i];
		if (!ent || !ent.getEntityNbt) continue;
		var nbt;
		try { nbt = ent.getEntityNbt(); } catch (e) { continue; }
		if (!nbt) continue;
		var id = _getEntityIdFromNbt(nbt);
		if (!_isAnimaniaCattle(id)) continue;
		var pos = ent.getPos();
		if (!_isPosInFields(pos, fields)) continue;
		out.push({ entity: ent, nbt: nbt, id: id });
	}
	return out;
}

function _isPosInFields(pos, fields) {
	if (!fields || !fields.length) return false;
	for (var i = 0; i < fields.length; i++) {
		var boxes = fields[i].boxes;
		for (var j = 0; j < boxes.length; j++) {
			var b = boxes[j];
			if (isWithinAABB(pos, [b.minX, b.minY, b.minZ], [b.maxX, b.maxY, b.maxZ])) return true;
		}
	}
	return false;
}

function _normalizeBox(xyz1, xyz2) {
	return {
		minX: Math.min(xyz1[0], xyz2[0]),
		maxX: Math.max(xyz1[0], xyz2[0]),
		minY: Math.min(xyz1[1], xyz2[1]),
		maxY: Math.max(xyz1[1], xyz2[1]),
		minZ: Math.min(xyz1[2], xyz2[2]),
		maxZ: Math.max(xyz1[2], xyz2[2])
	};
}

function _getEntityIdFromNbt(nbt) {
	if (!nbt) return '';
	if (nbt.has('id')) return '' + nbt.getString('id');
	return '';
}

function _isAnimaniaCow(id) {
	if (!id) return false;
	var data = loadAnimaniaAnimalData();
	if (!data || !data.cow || !data.cow.breeds) return false;
	var breeds = data.cow.breeds;
	var keys = Object.keys(breeds);
	for (var i = 0; i < keys.length; i++) {
		var br = breeds[keys[i]];
		if (br && br.female === id) return true;
	}
	return false;
}

function _isAnimaniaCalf(id) {
	if (!id) return false;
	var data = loadAnimaniaAnimalData();
	if (!data || !data.cow || !data.cow.breeds) return false;
	var breeds = data.cow.breeds;
	var keys = Object.keys(breeds);
	for (var i = 0; i < keys.length; i++) {
		var br = breeds[keys[i]];
		if (br && br.kid === id) return true;
	}
	return false;
}

function _isAnimaniaCattle(id) {
	// Cattle operations target cows and calves (exclude bulls intentionally).
	return _isAnimaniaCow(id) || _isAnimaniaCalf(id);
}

function _getAgeFromNbt(nbt) {
	if (!nbt) return 1;
	if (nbt.has('Age')) return nbt.getFloat('Age');
	return 1;
}

function _mutatePregnantCow(nbt) {
	var id = _getEntityIdFromNbt(nbt);
	if (!_isAnimaniaCow(id)) return false;
	var age = _getAgeFromNbt(nbt);
	if (age < 1) return false;

	var changed = false;
	var isPregnant = nbt.has('Pregnant') ? nbt.getBoolean('Pregnant') : false;
	if (!isPregnant) {
		nbt.setBoolean('Pregnant', true);
		changed = true;
	}

	var gest = nbt.has('Gestation') ? nbt.getInteger('Gestation') : -1;
	if (gest <= 0) {
		nbt.setInteger('Gestation', DEFAULT_GESTATION_TICKS);
		changed = true;
	}
	return changed;
}

function _mutateSkipGestation(nbt) {
	var id = _getEntityIdFromNbt(nbt);
	if (!_isAnimaniaCow(id)) return false;
	var isPregnant = nbt.has('Pregnant') ? nbt.getBoolean('Pregnant') : false;
	if (!isPregnant) return false;
	var gest = nbt.has('Gestation') ? nbt.getInteger('Gestation') : DEFAULT_GESTATION_TICKS;
	if (gest === 0) return false;
	nbt.setInteger('Gestation', 0);
	return true;
}

function _mutateHasKidsFlag(nbt) {
	var id = _getEntityIdFromNbt(nbt);
	if (!_isAnimaniaCow(id)) return false;
	var age = _getAgeFromNbt(nbt);
	if (age < 1) return false;
	var hasKids = nbt.has('HasKids') ? nbt.getBoolean('HasKids') : false;
	if (hasKids) return false;
	nbt.setBoolean('HasKids', true);
	return true;
}

function _mutateGrowCalf(nbt) {
	var id = _getEntityIdFromNbt(nbt);
	if (!_isAnimaniaCalf(id)) return false;
	var age = _getAgeFromNbt(nbt);
	if (age >= 1) return false;
	nbt.setFloat('Age', 1);
	return true;
}

// ---- Animania data helpers (type detection) ----

function loadAnimaniaAnimalData() {
	if (!ANIMANIA_ANIMALS_DATA) {
		try { ANIMANIA_ANIMALS_DATA = loadJson(ANIMANIA_ANIMALS_JSON_PATH); } catch (e) { ANIMANIA_ANIMALS_DATA = null; }
	}
	return ANIMANIA_ANIMALS_DATA;
}

/**
 * Returns high-level type for a given Animania entity id (e.g., 'cow', 'sheep', 'goat', 'pig', 'chicken', 'rabbit', 'peafowl', 'horse').
 * @param {string} entityId
 * @returns {string|null}
 */
function getAnimaniaTypeByEntityId(entityId) {
	if (!entityId) return null;
	var data = loadAnimaniaAnimalData();
	if (!data) return null;
	var types = Object.keys(data);
	for (var t = 0; t < types.length; t++) {
		var type = types[t];
		var breeds = data[type] && data[type].breeds ? data[type].breeds : null;
		if (!breeds) continue;
		var breedKeys = Object.keys(breeds);
		for (var b = 0; b < breedKeys.length; b++) {
			var br = breeds[breedKeys[b]];
			if (!br) continue;
			if (br.female === entityId || br.male === entityId || br.kid === entityId) {
				return type;
			}
		}
	}
	return null;
}

/**
 * Returns true if the given entity id is defined in the Animania animal data JSON.
 * @param {string} entityId
 * @returns {boolean}
 */
function isAnimaniaAnimal(entityId) {
	return getAnimaniaTypeByEntityId(entityId) !== null;
}
