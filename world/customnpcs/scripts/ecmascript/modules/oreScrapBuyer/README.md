# Ore Scrap Buyer NPC

This NPC purchases scrap-type items from crates using ore-based dynamic pricing.

Key behavior:
- Reads items inside held crates/backpacks and looks up their entry in `globals/global_prices.json`.
- If an entry contains an `ore` composition, the NPC computes the item's scrap value by summing each component amount × the component's `current_price` from `globals/ore_market.json`.
- Items without an `ore` composition are ignored by the ore-scrap purchasing flow.

Presets
- The module includes a presets file at `ecmascript/modules/oreScrapBuyer/presets.json` defining which ores the buyer will accept.
- Two presets are provided out-of-the-box:
	- `ferrous` — accepts ferrous metals (e.g. `ore:iron`, `ore:steel`, `ore:nickel`, `ore:lead`).
	- `non_ferrous` — accepts non-ferrous metals (e.g. `ore:gold`, `ore:copper`, `ore:aluminum`, `ore:electrum`, `ore:constantan`).

Admin configuration & controls
- Each NPC stores its selected preset in NPC storeddata under key `ore_scrap_preset`.
- By default (on init) the NPC is not configured and will refuse purchases until an admin sets a preset.
- To cycle the NPC preset in-game: hold `mts:ivv.idcard_seagull` in your offhand and hold a `minecraft:command_block` in your main hand, then right-click the NPC. This cycles: `none` → `ferrous` → `non_ferrous` → `none` …
- To clear/remove the selected preset: hold `mts:ivv.idcard_seagull` in your offhand and hold a `minecraft:barrier` in your main hand, then right-click the NPC. The NPC will clear its preset and stop buying ores.

Usage
- An admin must first set a preset for the NPC (see Admin controls above).
- Player operation: hold a supported crate/backpack in your main hand and right‑click the NPC. The NPC will:
	- Inspect the crate contents and consult `globals/global_prices.json` for `ore` compositions.
	- Only purchase items whose ore components are fully allowed by the currently selected preset.
	- Pay the player into their Money Pouch and remove purchased items from the crate.

Files
- Script: `ecmascript/modules/oreScrapBuyer/ore_scrap_buyer_npc.js`
- Presets: `ecmascript/modules/oreScrapBuyer/presets.json`
- Metal market: `globals/ore_market.json`
- Global prices: `globals/global_prices.json`

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.