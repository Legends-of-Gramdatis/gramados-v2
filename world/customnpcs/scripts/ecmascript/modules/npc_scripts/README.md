# NPC Scripts

This module contains standalone CustomNPC scripts used for specific NPC behaviors.

## Included scripts

- `engineMechanicNPC.js` — Repairs compatible engines for a pouch fee.
- `junkyard_crate_manager.js` — Sells junkyard crowbars with cooldown/job checks.
- `junkyard_loot_crate.js` — Opens junkyard crates with validated crowbars.
- `PoliceNPC.js` — Drops configured police loot on death.
- `single_purchase_npc.js` — Sells one configured item once per player, with a 5-second confirmation.

## `single_purchase_npc.js` setup

Attach `single_purchase_npc.js` to the NPC script slot.

The script uses:
- NPC stored data for item + price config.
- `world/customnpcs/scripts/data_auto/single_purchase_npc_history.json` for per-player purchase history.

### Runtime behavior

- Player interacts with NPC.
- If player has enough pouch money, NPC asks:
  - `are you sure you want to purchjase this item for X money?`
- If the same player interacts again within 5 seconds, purchase is confirmed.
- After a confirmed purchase, that player cannot buy from this NPC again unless reset by admin.

### Admin Tips

Admin controls are enabled only when the admin has `mts:ivv.idcard_seagull` in offhand.

When interacting with the NPC while holding the ID card in offhand, the NPC prints a full setup guide in chat with all configuration items and the current configured price/item.

- Hold a renamed `minecraft:name_tag` in main hand:
  - Digits in the name are extracted and saved as price in cents.
  - Example: name tag `12500` sets the price to 125g.
- Hold any other item renamed exactly `sell` in main hand:
  - The NPC saves that held item ID as the sell item.
- Hold `minecraft:barrier` in main hand:
  - Resets purchase history for the interacting player on this NPC.

## Notes

- Currency checks and extraction use `utils_currency.js` pouch helpers.
- Purchase history is scoped per NPC position key and player name.

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
