// this script will scan drawers in the vault and fill them with random valuables

var loot_table = [
    {id: "minecraft:iron_ingot", weight: 10, min: 1, max: 3},
    {id: "minecraft:gold_ingot", weight: 5, min: 1, max: 2},
    {id: "minecraft:diamond", weight: 2, min: 1, max: 1},
    {id: "minecraft:emerald", weight: 2, min: 1, max: 1},
    {id: "minecraft:iron_sword", weight: 1, min: 1, max: 1},
    {id: "minecraft:iron_pickaxe", weight: 1, min: 1, max: 1},
    {id: "minecraft:iron_axe", weight: 1, min: 1, max: 1}
];

function interact(event){
    //2112 84 3707 to 2112 81 3709
    var x1 = 2112;
    var y1 = 84;
    var z1 = 3707;
    var x2 = 2112;
    var y2 = 81;
    var z2 = 3709;
    var player = event.player;
    var world = player.world;

    // scan all blocks in the region
    for (var x = x1; x <= x2; x++) {
        for (var y = y1; y >= y2; y--) {
            for (var z = z1; z <= z2; z++) {
                var block = world.getBlock(x, y, z);
                //player.message("Block at " + x + " " + y + " " + z + " is " + block.getName() + " " + block.getMetadata());
                if (block.getName() == "storagedrawers:basicdrawers") {
                    //player.message("Found a drawer at " + x + " " + y + " " + z);
                
                    switch (block.getMetadata()) {
                        case 0:
                            // single large drawer
                            event.player.message("Basic Drawer");
                            break;
                        case 1:
                            // two small drawers
                            event.player.message("Basic Drawers 1x2");
                            break;
                        case 2:
                            // four small drawers
                            event.player.message("Basic Drawers 2x2");
                            break;

                        default:
                            event.player.message("Unknown drawer type");
                            break;
                    }

                    // get block NBT
                    var nbt = block.getTileEntityNBT();
                    // for each key in the NBT
                    var keys = nbt.getKeys();
                    //event.player.message("Drawer has " + keys.length + " keys");
                    //event.player.message("Drawer has " + nbt.toJsonString());
                    //event.player.message("Drawer Mat is " + nbt.getString("Mat"));

                    var drawers = nbt.getList("Drawers", 10);
                    for (var j = 0; j < drawers.length; j++) {
                        //event.player.message("Drawer " + j + " has " + drawers[j].toJsonString());

                        // example of a filled drawer:
                        //{Item:{ForgeCaps:{"customnpcs:itemscripteddata":{}},id:"minecraft:lapis_block",Count:1b,Damage:0s},Count:64}

                        // tell what item
                        var item = drawers[j].getCompound("Item");
                        var id = item.getString("id");
                        var count = drawers[j].getInteger("Count");
                        var damage = item.getShort("Damage");
                        event.player.message("Drawer " + j + " has " + count + " " + id + " " + damage);

                        // if the drawer is empty
                        if (id == null) {
                            // fill it with a random item
                            var random = randomItem();
                            id = random.id;
                            count = random.count;
                            event.player.message("Filling drawer " + j + " with " + count + " " + id);
                            item.setString("id", id);
                            drawers[j].setInteger("Count", count);
                        }
                    }
                    // save the changes
                    nbt.setList("Drawers", drawers);
                    block.setTileEntityNBT(nbt);
                }
            }
        }
    }
}

// function to generate a random item
function randomItem() {
    var totalWeight = 0;
    for (var i = 0; i < loot_table.length; i++) {
        totalWeight += loot_table[i].weight;
    }

    var random = Math.floor(Math.random() * totalWeight);
    for (var i = 0; i < loot_table.length; i++) {
        random -= loot_table[i].weight;
        if (random <= 0) {
            return {id: loot_table[i].id, count: Math.floor(Math.random() * (loot_table[i].max - loot_table[i].min + 1)) + loot_table[i].min};
        }
    }
}
