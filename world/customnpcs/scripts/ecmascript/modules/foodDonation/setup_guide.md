# foodDonation setup guide

Step-by-step to place and configure a Food Donation NPC that accepts crates/backpacks of food and awards Civility reputation.

## Prerequisites
- Minecraft 1.12.2 with CustomNPCs (server already set up for Gramados).
- Java 8 runtime for the server process.
- This repo’s scripts deployed under `world/customnpcs/scripts/`.
- Item IDs for the crate/backpack types you want to accept.

## Files in this module
- Script: `world/customnpcs/scripts/ecmascript/modules/foodDonation/food_donation_npc.js`
- Config: `world/customnpcs/scripts/ecmascript/modules/foodDonation/config.json`
- Data (runtime): `world/customnpcs/scripts/data_auto/food_donation.json`

## 1) Place the NPC and attach the script
1. Spawn or select an NPC where donations will be accepted.
2. In the NPC’s scripting tab, enable scripting and attach:
   - `ecmascript/modules/foodDonation/food_donation_npc.js`
3. Close and reopen the NPC once to run `init(event)`. If no facility is set yet, the NPC will hint that it needs configuration.

## 2) Configure facilities and accepted containers
Edit `config.json` (create if missing; a minimal file is generated but empty by default):
```json
{
  "global": {
    "maxReputationPerPlayer": 2000,
    "lowCivThreshold": 600,
    "lowCivFloorMultiplier": 0,
    "minFoodLevelPerItem": 2,
    "foodUnitsPerCivilityPoint": 10
  },
  "facilities": {
    "Gramados State Hotel": {
      "acceptedCrates": [
        "mts:unuparts.unuparts_part_unu_crate_wooden",
        "mts:ivv.backpack_red",
        "mts:ivv.crate"
      ],
      "baseMultiplier": 1.0
    }
  }
}
```
Notes:
- `acceptedCrates` are the container item IDs players will hold in main hand when donating.
- `baseMultiplier` scales rep at this facility (e.g., 1.25 for special events).
- Optional `messageTiers` lets you customize thank‑you lines by rep size.

After editing `config.json`, reinitialize the script (disable/enable in NPC scripting tab) or restart the server to load changes.

## 3) Select the active facility (in‑game)
- Hold `mts:ivv.idcard_seagull` in your offhand as an admin.
- Right‑click the NPC to cycle through the facilities listed in `config.json`.
- The selected facility name is saved to the NPC’s stored data under key `facility`.

## 4) Test the flow
1. Give yourself a supported crate/backpack listed in `acceptedCrates`.
2. Put some food items inside. Items count only if their `getFoodLevel()` >= `minFoodLevelPerItem`.
3. Hold the crate in main hand and right‑click the NPC.
4. Expected:
   - NPC acknowledges and removes only qualifying food items from the crate.
   - Player gains Civility reputation: `rep ≈ (sum(foodLevel * count) / foodUnitsPerCivilityPoint) * baseMultiplier`, scaled by low‑civ floor when under `lowCivThreshold`.
   - A thank‑you message is picked from the highest matching `messageTiers` bucket.
   - Player cap enforced across all facilities: `maxReputationPerPlayer`.

## 5) Operations and resets
- Per‑player donation totals are stored in `data_auto/food_donation.json` by player name. Remove or edit entries to reset caps.
- Civility faction ID is taken from `utils_factions.js` (`FACTION_ID_CIVILITY`), default 2 if not defined.
- To change accepted containers or multipliers, edit `config.json` and reload the script.

## Troubleshooting
- “I am not configured to accept donations…”
  - No facility set yet or the set facility name isn’t present in `config.json`. Use the ID card to cycle, or fix `facilities` keys.
- “Please hold a valid food crate…”
  - The main‑hand item’s ID must match one of `acceptedCrates` for the active facility.
- “This crate doesn’t contain any qualifying food items…”
  - Items are filtered by `getFoodLevel()` and `minFoodLevelPerItem`. Many modded non‑foods return 0.
- No rep gained despite items donated
  - You may be at or above `maxReputationPerPlayer`. Check `data_auto/food_donation.json` or lower the cap.
  - `lowCivFloorMultiplier` can reduce early gains; raise it if needed for onboarding events.
- Config changes didn’t apply
  - Config is read at script load; reattach the script or restart the server to reload.

## Removal / disable
- Detach `food_donation_npc.js` from the NPC to disable.
- Optionally remove the facility from `config.json` or clear the NPC’s `storeddata` key `facility`.

---

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
