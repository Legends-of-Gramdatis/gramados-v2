// Here is an example where i create the item in init, and then save the NBT string in storeddata.
// In the interact function, I recreate the item from the blocks storeddata

function init(e) {
    var someItem = e.block.world.createItem("diamond_sword", 0, 1)
    someItem.setCustomName("Cool Sword")
    var someItemAsNbt = someItem.getItemNbt().toJsonString()
    e.block.storeddata.put("someItem", someItemAsNbt)
}

function interact(e) {
    var nbtString = e.block.storeddata.get("someItem")
    e.player.message(nbtString)
    var nbt_object = e.API.stringToNbt(nbtString)
    var recreateItem = e.block.world.createItemFromNbt(nbt_object)
    var GUI = e.API.createCustomGui(1, 256, 256, false)
    GUI.addItemSlot(50, 50, recreateItem)
    e.player.showCustomGui(GUI)
}