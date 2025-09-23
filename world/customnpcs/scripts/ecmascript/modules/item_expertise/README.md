# Item Expertise Module

The `item_expertise` module adds a lightweight appraisal and expertise system for gems, ingots, and rare materials, with optional discreet sales to the Mafia. It’s designed to plug into the shared economy (global prices), support configurable item attributes, and create an interesting mid-game money sink and evaluation loop.

---

## What it does
- Appraises eligible items into a tagged “Appraisal Notice” item with a fee estimate.
- Performs a paid “Expertise” to produce a tagged, single-item, quality-inspected result.
- Lets you sell expertised items to a Mafia contact for money and reputation (two-step confirmation).
- Integrates with the global pricing system and supports per-item attribute sets (clarity, purity, etc.).

---

## Files
- `gem_expertise.js`
  - NPC interaction for Appraisal and Expertise.
  - Requires the player to have read dialog `560`.
- `gem_mafia_purchase.js`
  - NPC interaction for Mafia purchase of expertised items.
  - Requires the player to have read dialog `565`.
- `gem_config.json`
  - Module configuration: rates, exp requirement, mafia rep tuning, and the list of eligible items with their variables.

---

## Player Flow

1) Appraisal (free creation, shows fee)
- Hold an eligible item in your main hand (see “Eligible Items”).
- Interact with the Appraiser NPC (script: `gem_expertise.js`).
- Requirements:
  - You must have read dialog `560`.
  - You must be at least `config.expertise_exp` levels (default: `10`).
- Effects:
  - Your original stack is reduced by 1.
  - You receive a new single-item copy with lore tag `§7[Appraisal Notice]` and an “Estimated fee”.
  - This item is now ready for the paid expertise step.

2) Expertise (paid, produces the final expertised item)
- Hold the “Appraisal Notice” item and interact again with the Appraiser NPC.
- The fee is parsed from the appraisal lore and charged from your pouch.
- On success:
  - The appraisal item is consumed (stack -1).
  - You receive a single `§7[Expertised]` item with quality variables in its lore.
  - The estimated value line is not shown; the valuation is “sealed”.

3) Mafia Purchase (optional, two-step confirmation)
- Hold an `§7[Expertised]` item and interact with the Mafia Buyer NPC (script: `gem_mafia_purchase.js`).
- Requirements:
  - You must have read dialog `565`.
- First interaction:
  - The item is tagged: `Mafia interest registered. Interact again to finalize transaction.`
- Second interaction:
  - The item is consumed (stack -1).
  - You are paid based on the item’s global price, quality, and a swing factor.
  - If you have < 2000 Mafia reputation, you gain some reputation (capped per sale).

---

## Eligible Items & Variables

Eligibility is controlled by `gem_config.json` under `items` as a map:
- Key: full item id with damage, e.g. `minecraft:diamond:0`
- Value: array of expertise variables

Example excerpt from `gem_config.json`:
```
{
  "items": {
    "minecraft:diamond:0": ["clarity", "purity", "weight", "color_grade"],
    "variedcommodities:gem_ruby:0": ["clarity", "purity", "weight", "color_grade"],
    "forestry:ingot_copper:0": ["purity", "weight"],
    "variedcommodities:ingot_mithril:0": ["lightness", "purity"],
    "variedcommodities:ingot_demonic:0": ["resonance", "purity"]
  }
}
```

Supported variables (current):
- `purity`: 0.25–1.00 (weighted 0.2)
- `clarity`: 1.0–10.0 (weighted 5)
- `weight`: 1.0–10.0 (weighted 4)
- `color_grade`: 0.50–1.00 (weighted 0.25)
- `lightness`: 1–100 (weighted 20)
- `resonance`: 1–100 (weighted 20)

The expertised item lore lists each variable as `Name: value` (color codes included). Internal logic lowercases and parses these for sales.

---

## Pricing, Fees, and Payouts

- Appraisal fee estimate
  - Estimated from the item’s global price (via `getPrice`) multiplied by `config.expertise_rate`.
  - Displayed in the appraisal item’s lore as an estimated coin amount.
- Expertise fee collection
  - On the expertise step, the fee is parsed from the lore and charged in cents.
- Mafia payout
  - Base price from `getPrice(itemId, 55000, null, true)` (fallback: 550g = 55,000 cents).
  - Multiplied by a quality score derived from your variables and their weights.
  - Multiplied by a swing factor (usually 0.8–1.2, rarely 0.5–1.5).

Notes
- `getPrice` integrates with the global economy (`globals/global_prices.json` and optional stock links).
- If an itemId is missing damage (e.g., `minecraft:diamond`), it’s normalized to `minecraft:diamond:0` internally.
- Currency is tracked in cents; UI uses coin formatting via shared utilities.

---

## Configuration

File: `gem_config.json`
- `expertise_rate`: fraction of price used to compute the appraisal fee (default: `0.05`).
- `expertise_exp`: minimum XP levels to access the module (default: `10`).
- `mafia_rep_per_cents`: reputation per paid cents (default: `20000`) used to compute mafia rep gain when under 2000.
- `items`: map of eligible item ids to their variable arrays.

Adjusting behavior
- Add/remove items: update the `items` map.
- Tune fees: change `expertise_rate`.
- Gate access: change `expertise_exp`.
- Mafia reputation tuning: change `mafia_rep_per_cents`.

---

## NPC Setup (Admins)

- Appraiser NPC
  - Attach `gem_expertise.js`.
  - Ensure players have access to dialog `560` for the interaction to trigger.
- Mafia Buyer NPC
  - Attach `gem_mafia_purchase.js`.
  - Gate access via dialog `565`.

Dialog gating allows you to place these services behind quests or storyline progress.

---

## Lore Tags (for reference)
- Appraisal item first line: `§7[Appraisal Notice]`
- Expertised item first line: `§7[Expertised]`
- Mafia mark (added on first Mafia interaction): `§8Mafia interest registered. Interact again to finalize transaction.`

The presence of `[Appraisal Notice]` and `[Expertised]` governs which path runs in the scripts.

---

## Edge Cases & Messages
- Not holding an item / ineligible item: interaction is rejected with feedback.
- Already expertised: cannot re-expertise.
- Missing levels (below `expertise_exp`): appraisal/expertise not allowed.
- Insufficient funds at expertise time: transaction aborted.
- Unparseable appraisal lore: fails safe and asks you to try again.

---

## Dev Notes
- Price resolution uses `utils_global_prices.getPrice(itemId, defaultPrice, nbt, ignoreNBT)`; expert flows pass `ignoreNBT=true`.
- Mafia faction id is hardcoded to `9` in `gem_mafia_purchase.js`. Change there if needed.
- Reputation gain applies only while player’s Mafia reputation is below 2000 and is capped per sale.
- The appraisal step reduces your original stack by 1 and gives you a single “Appraisal Notice” copy. The expertise step consumes that appraisal item and returns a single expertised item — total count is conserved aside from fees.

---

## Roadmap
- Additional item families and variables.
- Vendor-side uses for variables (crafting/bonuses).
- Tighter integration with stock-linked pricing and events.

If you add new items, please also suggest sensible variable sets and test sale values to keep the economy balanced.