var stored_bottles = {

    // slot 1
    0: {
        itemstack: "",
        age: 0
    },
    // slot 2
    1: {
        itemstack: "",
        age: 0
    }
}

function init(e) {
    e.block.storeddata.put("stored_bottles", JSON.stringify(stored_bottles))
}

function interact(e) {
    var custom_stored_bottles = JSON.parse(e.block.storeddata.get("stored_bottles"))
    custom_stored_bottles[0].age = 50
    e.player.message(custom_stored_bottles[0].age)
    e.player.message(stored_bottles[0].age)
    //you'll notice that the age is different. custom_stored_bottles was recreated from the block's storeddata
}