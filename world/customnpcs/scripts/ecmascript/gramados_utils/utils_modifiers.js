load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_chat.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_crops.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_farm_animania.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_files.js");
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_general.js");

var farmCrops = exports_utils_farm_crops;
var MODIFIERS_CFG_PATH = "world/customnpcs/scripts/ecmascript/modules/modifiers/modifiers_config.json";

function instanciate_modifier(player, stack, modifierType) {
    var stackClone = stack.copy();
    var nbt = stackClone.getItemNbt();
    var tag = nbt.getCompound("tag");
    tag.setBoolean("is_modifier", true);

    var config_data = loadJson(MODIFIERS_CFG_PATH);
    var cfg = config_data.items;
    var entry = findJsonSubEntry(config_data.modifiers, "type", modifierType);
    tellPlayer(player, "§e:recycle: Debug: Entry for modifier type '" + modifierType + "': " + JSON.stringify(entry));

    var resolvedType = modifierType;
    if (resolvedType) {
        tag.setString("modifier_type", "" + resolvedType);
        tag.setInteger("modifier_radius", entry.radius);
    }

    nbt.setCompound("tag", tag);
    nbt.setString("id", cfg.itemId);

    var newItem = player.getWorld().createItemFromNbt(nbt);

    newItem.setCustomName(parseEmotes(ccs(entry.displayName)));
    newItem.setLore([parseEmotes(ccs(entry.description)), ccs("&7Radius: &e" + entry.radius + " blocks")]);
    newItem.setItemDamage(entry.colorCode);

    return newItem;
}

/**
 * 
 * @param {IPlayer} player
 * @param {IItemStack} stack 
 * @returns {IItemStack}
 */
function repair_modifier_item(player, stack) {
    var stackClone = stack.copy();
    var nbt = stackClone.getItemNbt();
    var tag = nbt.getCompound("tag");
    tag.setBoolean("is_modifier", true);

    var json_data = loadJson(MODIFIERS_CFG_PATH)

    var repair_count = tag.getInteger("repairs") || 0;

    tag.setInteger("repairs", repair_count + 1);

    nbt.setCompound("tag", tag);
    nbt.setString("id", json_data.items.itemId);

    var newItem = player.getWorld().createItemFromNbt(nbt);

    
    var entry = findJsonSubEntry(json_data.modifiers, "type", tag.getString("modifier_type"));
    tellPlayer(player, "§e:recycle: Debug: Repairing modifier item of type '" + tag.getString("modifier_type") + "': " + JSON.stringify(entry));
    newItem.setCustomName(parseEmotes(ccs(entry.displayName)));

    return newItem;
}

/**
 * 
 * @param {IItemStack} stack 
 * @returns {boolean}
 */
function has_item_modifier_tag(stack) {
    var nbt = stack.getItemNbt();
    if (stack.isEmpty()) {
        return false;
    }

    if (!nbt.has("tag")) {
        return false;
    }

    var compound = nbt.getCompound("tag");
    if (!compound.has("is_modifier")) {
        return false;
    }

    return true;
}

/**
 * 
 * @param {IItemStack} stack 
 * @returns {boolean}
 */
function is_active_modifier_item(stack) {
    if (has_item_modifier_tag(stack)) {
        var nbt = stack.getItemNbt();
        var compound = nbt.getCompound("tag");
        return compound.getBoolean("is_modifier");
    }
    return false;
}

function apply_modifier_type(player, modifierType, radius) {

    var world = player.getWorld();
    var pos = player.getPos();

    switch (modifierType) {
        case "cattle pregnancy":
            return makeFieldCattlePregnant(player, radius);
        case "cattle gestation":
            return skipGestationForFieldCattle(player, radius);
        case "cattle milk production":
            return setFieldCowsHasKids(player, radius);
        case "cattle baby grow":
            return growFieldCalvesToAdults(player, radius);
        case "farmland fertilize":
            return farmCrops.fertilize_farmland_sphere(world, pos, radius);
        case "farmland tilt":
            return farmCrops.tillSurfaceToFarmland(world, pos, radius, true);
        case "crop harvest":
            return farmCrops.harvestCropsBreak(world, pos, radius);
        case "crop harvest and plant":
            return farmCrops.harvestCropsBreakAndReset(world, pos, radius);
        case "crop growth random":
            return farmCrops.randomGrowCrops(world, pos, radius);
        case "crop growth max":
            return farmCrops.growCropsToMax(world, pos, radius);
        case "crop rot random":
            return farmCrops.randomLowerCrops(world, pos, radius);
        case "crop rot max":
            return farmCrops.resetCropsToZero(world, pos, radius);
        default:
            return null;
    }
}