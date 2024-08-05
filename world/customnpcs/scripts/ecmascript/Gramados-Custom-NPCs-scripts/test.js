var GUI_1, GUI_2, GUI_3, GUI_4, run_thru = 1, rect1, changeColor = 0, itemS1, itemS2, scrollSelection;
function interact(event) {
    GUI_1 = event.API.createCustomGui(1, 248, 166, false);
    GUI_1.setBackgroundTexture("minecraft:textures/gui/toad1.png");
    GUI_1.addTexturedButton(10, "             Right", 10, 0, 30, 30, "minecraft:textures/gui/resource_packs.png", 0, 0);
    GUI_1.addTexturedButton(11, "             Left", 10, 30, 30, 30, "minecraft:textures/gui/resource_packs.png", 30, 0);
    GUI_1.addButton(20, "§cABCDEF", 10, 65, 50, 19);
    GUI_1.addTextField(30, 10, 85, 50, 19);
    //
    //GUI_1.addItemSlot(30, 90);
    //GUI_1.addItemSlot(0, 0);
    //GUI_1.addItemSlot(57, 88,event.player.world.createItem("minecraft:log",0,1));
    //
    GUI_1.addTexturedRect(50, "minecraft:textures/gui/colors.png", 10, 120, 30, 30, 0, 0);
    GUI_1.addTexturedRect(51, "minecraft:textures/gui/widgets.png", 90, 85, 23, 23, 1, 23);
    GUI_1.addTexturedRect(52, "minecraft:textures/gui/widgets.png", 63, 87, 20, 20, 1, 1);
    //
    GUI_1.addButton(21, "X", 80, 5, 19, 19);
    GUI_1.addButton(22, "A", 70, 35, 19, 19);
    GUI_1.addButton(23, "B", 93, 35, 19, 19);
    GUI_1.addButton(24, "N", 93, 65, 19, 19);
    GUI_1.addScroll(60, 185, 111, 55, 50, ["one", "two", "three", "four", "5555", "6666", "7777", "8888", "9999", "ten ten"]).setMultiSelect(true);
    ////
    GUI_1.getComponent(10).setHoverText("§aThis makes it go right");
    GUI_1.getComponent(11).setHoverText("§dThis makes it go left");
    GUI_1.getComponent(20).setHoverText("§fThis changes the color");
    GUI_1.getComponent(30).setHoverText("§ftext??");
    GUI_1.getComponent(50).setHoverText("§bExample");
    GUI_1.getComponent(52).setHoverText("blank");
    //
    event.player.showCustomGui(GUI_1);
    // other gui's
    GUI_2 = event.API.createCustomGui(2, 248, 166, false);
    GUI_2.setBackgroundTexture("minecraft:textures/gui/demo_background.png");
    GUI_2.addButton(24, "2 gui", 116, 35, 38, 19);
    GUI_3 = event.API.createCustomGui(3, 500, 166, false);
    GUI_3.setBackgroundTexture("minecraft:textures/gui/two_blocks.png");
    GUI_3.addButton(24, "3 gui", 116, 35, 38, 19);
    GUI_4 = event.API.createCustomGui(4, 126, 179, false);
    GUI_4.setBackgroundTexture("minecraft:textures/gui/book.png");
    GUI_4.addButton(24, "4 gui", 116, 35, 38, 19);
}

function customGuiButton(event) {
    var b1 = event.buttonId;
    rect1 = event.player.getCustomGui().getComponent(50);
    if (b1 == 10) {
        rect1.setPos(rect1.getPosX() + 5, rect1.getPosY());
        event.gui.updateComponent(rect1);
        event.player.world.broadcast("r");
    } else if (b1 == 11) {
        rect1.setPos(rect1.getPosX() - 5, rect1.getPosY());
        event.gui.updateComponent(rect1);
        event.player.world.broadcast("l");
    } else if (b1 == 20) {
        if (changeColor == 7) {
            changeColor = 0
        } else {
            changeColor++;
        }
        rect1.setTextureOffset(30 * changeColor, 0);
        event.gui.updateComponent(rect1);
    } else if (b1 == 21) {
        event.player.world.broadcast("close " + event.gui.getComponent(30).getText());
        event.player.closeGui();
    } else if (b1 == 22) {
        for (var i = 0; i < scrollSelection.length; i++) {
            event.player.world.broadcast(scrollSelection[i]);

        }

    } else if (b1 == 23) {
        GUI_1.removeComponent(60);
    } else if (b1 == 24) {
        switch (run_thru) {
            case 0:
                event.player.showCustomGui(GUI_1);
                GUI_1.removeComponent(4);
                break;
            case 1:
                event.player.showCustomGui(GUI_2);
                GUI_2.removeComponent(1);
                break;
            case 2:
                event.player.showCustomGui(GUI_3);
                GUI_3.removeComponent(2);
                break;
            case 3:
                event.player.showCustomGui(GUI_4);
                GUI_4.removeComponent(3);
                break;
        }
        run_thru++;
        if (run_thru == 4) {
            run_thru = 0;
        }
    }
    event.gui.update(event.player);

}

function customGuiClose(event) {
    event.player.world.broadcast("close function " + GUI_1.getComponent(30).getText());

}
function customGuiScroll(event) {
    scrollSelection = event.selection;
    event.API.getIWorld(0).broadcast("say scroll function " + event.gui.getComponent(30).getText());

}
function customGuiSlot(event) {
    event.player.world.broadcast("this from slot function " + event.gui.getComponent(30).getText());
}















function interact(event) {
    event.player.message(event.player.world.getStoreddata().get("abc"));
    
    }