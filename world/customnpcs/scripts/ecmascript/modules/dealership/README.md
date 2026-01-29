# Dealership Module

NPC script to refresh dealership vehicle stock from an assembled loot table, keep the results in NPC stored data, and open the dealership GUI for players.

## Setup
- Attach `dealership_stock_npc.js` to the dealership admin NPC.
- The script pulls from `automobile/vehicles/trin/cars/dealership_trin_standard.json`.
- Stock is saved in the NPC `storeddata` under key `dealership_stock` as JSON: `{ "source", "refreshedAt", "totalStacks", "vehicles": [{"id","damage","count"}] }`.
- Any player interaction opens the `car_dealership` GUI (first skin pack) via the GUI Builder. The GUI manifest lives under `modules/GUI_builder/guis/car_dealership/`.

## Vehicle Registration
- When a player purchases a vehicle through the dealership GUI, the vehicle is automatically registered as **WW**.
- The player also receives **WW Car Papers** (a `variedcommodities:letter`) linked to the purchased vehicle.

## Admin Tips
- Hold `mts:ivv.idcard_seagull` in offhand and `minecraft:command_block` in main hand, then interact with the NPC to reload stock from the loot table.
- Chat feedback shows the number of vehicle types and total units stored, plus a short preview of counts.
- Without the admin combo, interacting opens the dealership GUI.

## Auto Refresh
- On NPC init, the script checks the last `refreshedAt` timestamp in `dealership_stock`.
- If that timestamp is earlier than the current week’s Monday (00:00 local time), the stock is automatically reloaded from the loot table and `refreshedAt` is updated to the current date.
- This ensures the dealership inventory stays current on a weekly cadence without manual intervention.

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
