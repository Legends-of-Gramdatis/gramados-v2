# Junkyard Module

Mechanics can take part orders, source parts, and crack open sealed crates for extra loot. This module provides two main features: a Parts Order Board and a Crate Crowbar shop with matching loot crates.

---

## Features
- Parts Order Board for Mechanics
  - Generate timed part orders with value-based payouts.
  - Complete orders by turning in required parts from your inventory.
  - Expiry, tolerance window, and late payout reductions.
  - Return outdated orders for a small compensation (cookie).
- Crate Crowbar Shop
  - Mechanic-only purchase of a one-use crowbar with a short cooldown.
  - Crowbar opens nearby Junkyard crates for randomized loot.
- Economy integration
  - Payouts and value estimates use the global price system.
- Admin/dev affordances
  - Command-block interactions for quick resets and testing.

---

## Files
- `config.json`
  - Module configuration (paths, item id/name, order delay hours).
- `junkyard_part_order_board.js`
  - The Parts Order Board NPC script.
- `junkyard_crate_manager.js`
  - The Crowbar seller NPC script.
- `junkyard_loot_crate.js`
  - The sealed crate NPC script.

---

## Prerequisites
- Job: Players must have the `Mechanic` job to use the board and buy crowbars.
- Dialogs: Not required by the junkyard scripts themselves (job gating is the main gate).

---

## Parts Order Board
Script: `junkyard_part_order_board.js`

- Who: Only Mechanics can interact.
- Data: Orders are stored in `ORDER_DATA_PATH` (see Configuration).
- Loot tables:
  - Uses `_LOOTTABLE_JUNKYARD_ORDERS` to generate the list of parts.

### Player Flow
1) Request an order (hands empty or normal item)
- Interact with the board; if eligible (cooldown passed), you receive an order form item.
- Order form item id/name come from config and is customized with lore.

2) Order form details
- Custom name: `§eVehicle Part Order Form` (configurable).
- Lore includes, for example:
  - `§7Requested Part(s):` followed by each required part and count.
  - `§6Payout: §a<amount>`
  - `§3Order expires on: §f<date>`
  - `§8§oOrder ID: <id>`
  - `§8§oOriginal Player: <name>`

3) Completion
- Hold the order form and interact with the board again.
- The script checks your inventory for all required parts and consumes them.
- Payout is generated as money items and given to you.

4) Expiry and tolerance
- Each order has an expiry date (random 1–4 IRL days) and a tolerance window (0–30% extra time).
- If completed after the original deadline but before tolerance end, payout is reduced proportionally.
- If completed after tolerance end, it is rejected.

5) Outdated order returns (uncompleted)
- If an order was cleaned up as uncompleted (e.g., you missed the tolerance window), returning the old form yields a `§6Compensation Cookie` as a small consolation.

### Payout Model (overview)
- Base value sums the global prices of requested parts (using `getPriceFromItemStack` with a base fallback of 300g each and ignoring NBT).
- Multiplied by the requested counts.
- Adds a random margin between 10% and 20%.
- Adjusted for deadline pressure (shorter deadlines increase payout slightly).
- Final payout is listed on the form and paid at completion (subject to late penalties).

### Stats & Cleanup
- The script tracks simple per-player stats (orders given, completed, late, etc.).
- Periodic cleanup marks expired orders as uncompleted and maintains an `uncompletedOrders` list for returns.

---

## Crowbars & Loot Crates
Scripts: `junkyard_crate_manager.js`, `junkyard_loot_crate.js`

### Crowbar Purchase
- Who: Mechanic only.
- Price: 500g (50000 cents).
- Cooldown: ~10 minutes IRL per player.
- Phone Quick-Check: If you hold a phone (matched via `_LOOTTABLE_CELLPHONES`), the seller tells you whether you’re still on cooldown.
- Result: You receive a one-use crowbar item with custom name/lore:
  - Name: `§6Junkyard Crate Crowbar`
  - Lore (must match exactly to be valid):
    - `§7One-use crowbar to pry open a sealed parts crate.`
    - `§8Marked by the Junkyard Authority.`
    - `§2§o"Snap it, loot it, toss it."`

### Crate Interaction
- Use: Hold the crowbar and interact with a Junkyard crate NPC.
- If valid and unopened:
  - Plays breaking/particle effects and switches skin to a broken crate image.
  - Consumes 1 crowbar.
  - Drops loot via `_LOOTTABLE_JUNKYARD_CRATE` on the ground.
  - Logs an estimated value using global prices.
  - Starts a short reset timer (about a minute) after which the crate closes (skin reset).
- If already opened: You’ll be told it’s already open.
- Admin reset: Interact with a command block in hand to instantly reset a crate.

---

## Configuration
File: `config.json`
- `ORDER_DATA_PATH`: Path to the JSON file storing all orders/state (e.g., `world/customnpcs/scripts/data_auto/parts_orders.json`).
- `ORDER_ITEM_ID`: The item id used for the order form (e.g., `variedcommodities:plans`).
- `ORDER_ITEM_NAME`: Custom display name for the order form (default: `§eVehicle Part Order Form`).
- `ORDER_DELAY_HOURS`: Minimum hours between two generated orders for the same player.
- `ORDER_DEADLINE_DAYS_MIN` / `ORDER_DEADLINE_DAYS_MAX`: Inclusive range (in real days) to randomly pick the order deadline/expiry. Defaults: 1–4.
- `ORDER_TOLERANCE_MIN` / `ORDER_TOLERANCE_MAX`: Inclusive range for the tolerance window as a fraction (e.g., 0.0–0.3 = 0%–30%). Defaults: 0.0–0.3.
- `CROWBAR_PRICE_CENTS`: Cost of the Junkyard Crate Crowbar in cents (e.g., `50000` = 500g). Defaults to 50000 if missing.
- `CROWBAR_COOLDOWN_MINUTES`: Purchase cooldown for crowbars in real-world minutes. Defaults to 10 if missing.
- `JUNKYARD_CRATE_RESET_SECONDS`: How long an opened Junkyard crate stays open before it resets (in seconds). Defaults to 60.

Crowbar purchase data is stored in `world/customnpcs/scripts/data_auto/junkyard_purchases.json` with per-player cooldown timestamps.

---

## Economy & Loot Tables
- Pricing utilities: `utils_global_prices.js`, `utils_currency.js`.
- Loot tables referenced:
  - `_LOOTTABLE_JUNKYARD_ORDERS` — part lists for orders.
  - `_LOOTTABLE_JUNKYARD_CRATE_CROWBAR` — crowbar template for the seller.
  - `_LOOTTABLE_JUNKYARD_CRATE` — crate loot.
  - `_LOOTTABLE_CELLPHONES` — used by the seller to identify phones for cooldown checks.

---

## Admin Tips
- To test crate reset: hold a command block and interact with the crate.
- To replace order forms or troubleshoot a player’s order:
  - Check `ORDER_DATA_PATH` for their entry.

---

## Edge Cases
- Non-Mechanics are blocked from both the board and the crowbar seller.
- Order processing requires the exact order form item and will verify all listed parts and counts in the player’s inventory.
- Orders beyond their tolerance window are rejected; outdated order forms can be handed in for a cookie if flagged as uncompleted.
- Crowbars without the exact lore are rejected by crates.

---

## Roadmap / Notes
- Order and crate reward balance is driven by global prices; tune those to calibrate payouts.
- `ORDER_DELAY_HOURS` gates how often Mechanics can receive new orders.
- Consider adding achievements/emotes for streaks of on-time deliveries or high-value crate hauls.