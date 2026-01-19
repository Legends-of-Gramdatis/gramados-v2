# Dealership Module

NPC script to refresh dealership vehicle stock from an assembled loot table, keep the results in NPC stored data, and open the dealership GUI for players.

## Setup
- Attach `dealership_stock_npc.js` to the dealership admin NPC.
- The script pulls from `automobile/vehicles/trin/cars/dealership_trin_standard.json`.
- Stock is saved in the NPC `storeddata` under key `dealership_stock` as JSON: `{ "source", "refreshedAt", "totalStacks", "vehicles": [{"id","damage","count"}] }`.
- Any player interaction opens the `car_dealership` GUI (first skin pack) via the GUI Builder. The GUI manifest lives under `modules/GUI_builder/guis/car_dealership/`.

## Admin Tips
- Hold `mts:ivv.idcard_seagull` in offhand and `minecraft:command_block` in main hand, then interact with the NPC to reload stock from the loot table.
- Chat feedback shows the number of vehicle types and total units stored, plus a short preview of counts.
- Without the admin combo, interacting opens the dealership GUI.

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
