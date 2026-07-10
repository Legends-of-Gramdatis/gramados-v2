# Pawn Shop NPC

This NPC buys selected single items from players, offers a price based on the global price data, and allows a short haggling flow before the deal expires.

## Behavior

- The NPC only accepts single-item stacks that appear in its configured loot table and have a valid reference price.
- When a player shows a valid item, the NPC stores a temporary offer using the configured honesty value.
- The player can accept by using the same item on the NPC again, or haggle by talking with an empty main hand.
- Haggling can improve the offer, leave it unchanged, or break the deal and temporarily block that player from trading.

## Admin Setup

Hold `mts:ivv.idcard_seagull` in your offhand to enter admin mode, then use one of these items on the NPC:

- `variedcommodities:satchel`: rename it to the loot table path or name to store in `pawn_loot_table`.
- `variedcommodities:coin_emerald`: rename it to a value from `0` to `100` to set `pawn_honesty`.
- `variedcommodities:coin_gold`: rename it to a value from `0` to `100` to set `pawn_haggle`.
- `variedcommodities:coin_stone`: rename it to a value from `0` to `100` to set `pawn_deal_break_chance`.
- `variedcommodities:coin_wood`: rename it to a non-negative number of seconds to set `pawn_block_timer`.

## Admin Tips

- Right-click with an empty main hand in admin mode to see the current stored configuration.
- If the NPC is not configured yet, right-click in admin mode with an empty main hand to receive the setup items and a usage guide.
- Hold `minecraft:barrier` in your main hand while in admin mode to clear your current block timer on this NPC and reset the NPC's active pawn offer.

## Stored Data

The NPC uses these storeddata keys:

- `pawn_loot_table`
- `pawn_honesty`
- `pawn_haggle`
- `pawn_deal_break_chance`
- `pawn_block_timer`
- `pawn_last_interaction`
- `pawn_blocked_<playerName>`

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
