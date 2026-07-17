function isItemAnEngine(itemstack) {
    var itemNbt = itemstack.getNbt();
    return (itemNbt && itemNbt.has("temp"));
}

function getEngineHours(itemstack) {
    var itemNbt = itemstack.getNbt();
    if (isItemAnEngine(itemstack)) {
        if (itemNbt.has("hours")) {
            return itemNbt.getDouble("hours");
        }
        return 0;
    }
    return null;
}