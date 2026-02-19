# Dealership Module

NPC script to refresh dealership vehicle stock from an assembled loot table, keep the results in NPC stored data, and open the dealership GUI for players.

## Setup
- Attach `dealership_stock_npc.js` to the dealership admin NPC.
- The NPC has no default location/loot table configured.
- Regions and dealership loot tables are sourced from `modules/vehicle_registration/config.json` (keys: `"regions"` and `"dealership loot tables"`).
- Stock is saved in the NPC `storeddata` under key `dealership_stock` as JSON: `{ "source", "refreshedAt", "totalStacks", "vehicles": [{"id","damage","count"}] }`.
- Any player interaction opens the `car_dealership` GUI (first skin pack) via the GUI Builder. The GUI manifest lives under `modules/GUI_builder/guis/car_dealership/`.

## Vehicle Registration
- When a player purchases a vehicle through the dealership GUI, the vehicle is automatically registered as **WW**.
- The player also receives **WW Car Papers** (a `variedcommodities:letter`) linked to the purchased vehicle.

## Admin Tips
- All admin actions require holding `mts:ivv.idcard_seagull` in offhand.
- With only the seagull card (main hand empty), interacting prints a debug message showing the current configured `region` and `lootTable` and the available admin items.
- Hold `minecraft:paper` in main hand, then interact to cycle the dealership location (cycles through `config.json` → `regions`).
- Hold `minecraft:shulker_shell` in main hand, then interact to cycle the dealership loot table (cycles through `config.json` → `dealership loot tables`).
- Hold `minecraft:command_block` in main hand, then interact to force-reload stock from the currently selected loot table.
- For normal players, the NPC refuses interaction until both location and loot table are configured and stock has been loaded.

## Auto Refresh
- On NPC init, the script checks the last `refreshedAt` timestamp in `dealership_stock`.
- If that timestamp is earlier than the current week’s Monday (00:00 local time), the stock is automatically reloaded from the currently configured loot table and `refreshedAt` is updated to the current date.
- This ensures the dealership inventory stays current on a weekly cadence without manual intervention.

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
