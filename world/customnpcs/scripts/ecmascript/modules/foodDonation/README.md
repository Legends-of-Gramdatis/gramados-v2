# foodDonation module

Accepts food crate donations at configured facilities and awards Civility faction reputation based on the nutritional value of donated items.

## What it does
- Players hand over a crate/backpack with food items to a donation NPC.
- The script totals food value per item (using `getFoodLevel()`), filters out non-food and low-value items, and converts food units to Civility reputation.
- Reputation gain respects a per‑player donation cap and an early‑game “low civility” penalty that scales up as the player’s Civility rises.
- Admins can switch the NPC between facilities (locations) in-game using an ID card. Facilities control which container items are accepted and the rep multiplier.

Key script: `food_donation_npc.js`
Config: `config.json`
Stats data: `world/customnpcs/scripts/data_auto/food_donation.json`

## How it works (flow)
1. Player right‑clicks the NPC while holding a supported container (crate/backpack) in main hand.
2. Script reads container NBT (`inventory.Items`) and groups contents by `<modid:item:damage>`.
3. For each entry, it creates a 1x stack to query `getFoodLevel()`; if value >= `minFoodLevelPerItem`, the item contributes: `foodLevel * count`.
4. Total food units are converted to base reputation: `baseRep = (totalFoodUnits / foodUnitsPerCivilityPoint) * baseMultiplier`.
5. If player Civility < `lowCivThreshold`, apply a floor multiplier curve from `lowCivFloorMultiplier` up to 1.0.
6. Clamp against `maxReputationPerPlayer` accumulated across all facilities; adjust down if the cap would be exceeded.
7. Award via `player.addFactionPoints(FACTION_ID_CIVILITY, adjustedRep)`, record per‑facility totals in `data_auto/food_donation.json`, remove only the donated (food) items from the crate.

## Configuration (`config.json`)
- `global.maxReputationPerPlayer` (int, default 2000): Cap on total reputation from donations per player (all facilities combined).
- `global.lowCivThreshold` (int, default 600): Civility points below which early‑game penalty applies (scaled).
- `global.lowCivFloorMultiplier` (float 0..1, default 0): Floor of penalty at zero Civility; linearly interpolates up to 1 at the threshold.
- `global.minFoodLevelPerItem` (int, default 2): Minimum food level per item to count as a “donatable” food.
- `global.foodUnitsPerCivilityPoint` (int, default 10): Conversion rate from food units to Civility reputation before multipliers.
- `global.messageTiers[]` (sorted by `minRepGain` descending): Randomized thank‑you lines chosen based on the granted rep.

Facilities define accepted containers and a local multiplier:
```json
{
  "facilities": {
    "Gramados State Hotel": {
      "acceptedCrates": [
        "mts:unuparts.unuparts_part_unu_crate_wooden",
        "mts:ivv.backpack_red"
      ],
      "baseMultiplier": 1.0
    }
  }
}
```
- `acceptedCrates[]`: Item IDs for container items the NPC will process when held in main hand.
- `baseMultiplier` (float): Multiplier applied to rep at this facility.

Defaults and constants
- Civility faction: pulled from `utils_factions.js` as `FACTION_ID_CIVILITY`, defaulting to `2` if unavailable.
- Config is loaded at script load; after editing `config.json`, reinitialize the NPC (toggle script or reload server) to apply changes.

## Data files
- Runtime stats: `world/customnpcs/scripts/data_auto/food_donation.json`
  - Per‑player map of donation rep totals per facility.
- No module‑specific logs are written by this script (can be added later via `utils_logging`).

## Admin tips
- Assign facility in-game: hold `mts:ivv.idcard_seagull` in offhand and right‑click the NPC to cycle facilities. The chosen facility is persisted in the NPC’s `storeddata` under key `facility`.
- Force re-read config: reattach the script to the NPC or restart scripts/server after changing `config.json`.
- Reset a player’s donation cap: edit or remove their entry in `data_auto/food_donation.json` (the key is the player name).

## Player UX
- If no valid crate is in hand, the NPC explains the requirement.
- If the crate contains no qualifying food (below `minFoodLevelPerItem`), the NPC declines politely.
- On success, the NPC removes only donated food items from the crate and sends a tiered thank‑you message proportional to rep gain; warns upon reaching the donation cap.

## Known limitations / notes
- Only counts items for which `getFoodLevel()` returns a value; modded non-foods are ignored.
- Mixed crates: non‑food items remain untouched.
- Partial stack removal is supported; the script rewrites the crate’s `inventory.Items` list with remaining counts.

---

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
