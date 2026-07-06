function interact(event) {
    var npc = event.npc;
    var player = event.player;
    if (player.getMainhandItem().getName() === "variedcommodities:usb_stick") {
        npc.say("Hello, you bought a share from the stock exchange! I hope you enjoy your investment.");
    }
}

function damaged(event) {
    var npc = event.npc;
    var player = event.source;
    if (!player.getMainhandItem()) {
        return;
    }
    if (player.getMainhandItem().getName() === "variedcommodities:usb_stick") {
        npc.say("Hello, you sold a share from the stock exchange! I hope you enjoyed your investment.");
    }
}

function buy_stock_share() {}
function sell_stock_share() {}
