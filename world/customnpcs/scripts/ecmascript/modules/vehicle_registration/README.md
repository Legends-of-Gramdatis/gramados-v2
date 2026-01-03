# Vehicle Registration

Registers (licenses) vehicle items by validating they still have their factory-default license plate for their current plate system, then replaces plates with the Gramados plate system (`plate_gramados`).

On successful registration, the NPC also issues **Car Papers** as a `variedcommodities:letter` item, renamed and filled with lore.

If a vehicle is **already registered** (it no longer has its factory-default plate), the NPC will **not** re-register it, but can still **re-issue a copy of the Car Papers** using data from `licensed_vehicles.json` when available (for example `registrationDate`).

Unknown vehicle models are allowed. If a vehicle has no entry in `vehicle_catalog.json`, max health is treated as **N/A** and no extra titles are applied.

## Configuration

File: `world/customnpcs/scripts/ecmascript/modules/vehicle_registration/config.json`

- `engineSystemNames` (string[]): Additional `systemName` values that should be treated as engines (in addition to the `engine_` prefix wildcard).

## Admin Tips

- To change the **region linked to this NPC**, hold a `minecraft:command_block` in the main hand and `mts:ivv.idcard_seagull` in the offhand, then interact with the NPC.
- The NPC cycles through all region names in `config.json -> regions` and stores the selected region on the NPC.
- The selected region is written to the registry (`licensed_vehicles.json`) and printed on the Car Papers.

## Notes

- License plate systems are configured in `world/customnpcs/scripts/data/vehicle_catalog.json` under `plateSystems`.
- “As-new value” is read from `world/customnpcs/scripts/globals/global_prices.json` using the existing pricing utilities.
- Registry price on the papers is calculated using the same rules as the legacy paper generator scripts (translated into Nashorn JS).

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
