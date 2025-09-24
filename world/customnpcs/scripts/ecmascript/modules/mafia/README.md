# Mafia Reputation Dealer

A CustomNPCs script that lets players below a threshold buy back Mafia reputation using one-time tickets. It matches the tone/format of other Gramados modules and targets MC 1.12.2.

## Features

- Generates a one-time "Reputation Ticket" only if the player is below `min_rep`.
- Price scales with how far below the threshold the player is (configurable).
- Per-player 6-hour cooldown between ticket generations.
- Server-side ticket registry with ID validation and anti-tamper.
- Payment taken from the player pouch; ticket is consumed on success.
- Grants a badge and emotes after successful redemption.
- Cooldown check via cellphone items (from a loot table) without generating a ticket.

## Files

- `MafiaReputationDealer.js` — Main script (attach to the dealer NPC `interact`).
- `mafia_config.json` — Configuration.
- Data: `world/customnpcs/scripts/data_auto/mafia.json`.

## How It Works

1) Generate Ticket: If player rep `< min_rep`, interacting (not holding a ticket) creates a ticket and starts a 6-hour cooldown.

2) Check Cooldown: If holding a cellphone item (in `_LOOTTABLE_CELLPHONES`), interacting shows remaining time before a new ticket can be generated.

3) Redeem Ticket: Hold the ticket (paper) and interact. The script validates the ticket ID, checks funds, consumes the ticket, charges pouch, adds Mafia rep, and grants badge/emotes.

Invalid/tampered tickets are rejected; tickets are removed from the registry after redemption.

## Ticket Item

- Item: `minecraft:paper`
- Name: `§cMafia Reputation Buyback`
- Lore:
  - `§8[Reputation Ticket]`
  - `§7Worth: §e<rep>§7 rep`
  - `§7Cost: :money:§e<amount>`
  - `§8§oTicket ID: <id>`

## Configuration (`mafia_config.json`)

```json
{
  "min_rep": 500,
  "max_rep_purchase": 500,
  "cost_multiplier": 3
}
```

- `min_rep`: Minimum rep considered acceptable; below this enables buyback.
- `max_rep_purchase`: Max rep per ticket.
- `cost_multiplier`: Price scaling divisor.

## Pricing

Let `repGap = min_rep - currentRep`, `repToOffer = min(max_rep_purchase, repGap)`.
- Price in G: `costG = roundTo0.1(repToOffer * (repGap / cost_multiplier))`
- Price in cents: `costCents = round(costG * 100)`

Funds are charged on redemption (not on generation) from the player pouch.

## Cooldown

- 6 hours per player (stored in ticks). Players can check remaining time with a cellphone item.

## Dependencies & Setup

Uses utilities from `gramados_utils` (chat, currency/pouch, loot tables, logging, factions with `FACTION_ID_MAFIA`, date, emotes).

- Attach `MafiaReputationDealer.js` to the NPC `interact` hook.
- Tune `mafia_config.json` to adjust thresholds and pricing.
- Reset data by removing `world/customnpcs/scripts/data_auto/mafia.json` (wipes tickets/last times).
