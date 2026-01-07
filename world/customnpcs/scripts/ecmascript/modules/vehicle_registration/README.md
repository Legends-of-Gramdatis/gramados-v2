# Vehicle Registration

Registers (licenses) vehicle items by validating they still have their factory-default license plate for their current plate system, then replaces plates with the Gramados plate system (`plate_gramados`).

On successful registration, the NPC also issues **Car Papers** as a `variedcommodities:letter` item, renamed and filled with lore.

If a vehicle is **already registered** (it no longer has its factory-default plate), the NPC will **not** re-register it, but can still **re-issue a copy of the Car Papers** using data from `licensed_vehicles.json` when available (for example `registrationDate`).

Unknown vehicle models are allowed. If a vehicle has no entry in `vehicle_catalog.json`, max health is treated as **N/A** and no extra titles are applied.

## Configuration

File: `world/customnpcs/scripts/ecmascript/modules/vehicle_registration/config.json`

- `engineSystemNames` (string[]): Additional `systemName` values that should be treated as engines (in addition to the `engine_` prefix wildcard).

## Admin Tips

- **Toggle debug mode:** hold a `minecraft:command_block` in the main hand and `mts:ivv.idcard_seagull` in the offhand, then interact with the NPC.
- **Switch NPC region (debug only):** while debug mode is ON, interact with the NPC holding only a `minecraft:command_block` to cycle through all region names in `config.json -> regions`.
- The selected region is stored on the NPC, written to the registry (`licensed_vehicles.json`), and printed on the Car Papers.
- **Debug import (legacy papers):** while debug mode is ON, hold a vehicle in the main hand and any Car Papers (letter) in the offhand to create/update a best-effort registry entry.

## Notes

- License plate systems are configured in `world/customnpcs/scripts/data/vehicle_catalog.json` under `plateSystems`.
- Vehicle catalog entries in `vehicle_catalog.json -> vehicles` are keyed by the MTS vehicle `systemName` only (for example `trin_heavorum_crewcab_dually`).
- “As-new value” is read from `world/customnpcs/scripts/globals/global_prices.json` using the existing pricing utilities.
- Registry price on the papers is calculated using the same rules as the legacy paper generator scripts (translated into Nashorn JS).
- `world/customnpcs/scripts/data_auto/licensed_vehicles.json` entries now also store:
	- `trim` (string)
	- `interior` (string)
	- `msrpCents` (number | null)
	- `vehicleId` (string) — the full vehicle item id (for example `mts:unucivil.unucivil_vehicle_unu_mastodon_coupe_ivory`)
	- `vehicleSystemName` (string) — the base vehicle system name (for example `unucivil_vehicle_unu_mastodon`)
	- `engineId` (string) — the engine item id: `mts:<packID>.<systemName>`
	- `engineSystemName` (string) — the engine system name (for example `engine_v6_gasoline_turbo_aut`)
	- `metaSources` (object) — best-effort raw meta extracted from:
		- `fromCarItem`
		- `fromCarPapers`
		- (engine display name stays in `metaSources`, not on the top-level entry)
		- (plate is now also recorded in `metaSources` for auditing)
	- `paintVariant` is the **human-readable paint value** (same as the Car Papers “Paint” line), not the vehicle item ID suffix.

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
