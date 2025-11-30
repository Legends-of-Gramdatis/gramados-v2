# Ore Scrap Buyer NPC

This NPC purchases scrap-type items from crates using ore-based dynamic pricing.

- Reads items inside held crates/backpacks.
- For each item that exists in `globals/global_prices.json`, the NPC checks for an `ore` composition.
- If `ore` exists, price is computed dynamically from `globals/ore_market.json` by summing each component amount multiplied by its `current_price`.
- If no `ore` is present but a fixed `value` exists, the NPC uses the fixed value.
- Items without an entry in `global_prices.json` are ignored.

## Usage
- Hold a supported crate/backpack in your main hand and interact with the NPC.
- The NPC will evaluate contents, pay into your Money Pouch, and remove purchased items from the crate.

## Files
- Script: `ecmascript/modules_unfinished/oreScrapBuyer/ore_scrap_buyer_npc.js`
- Metal market: `globals/ore_market.json`
- Global prices: `globals/global_prices.json`

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.