# Owner-bound crate keys

The optional loot-table function `{"function":"set_owner","owner":"player"}` binds the generated item to its recipient's UUID. Keys are `modifier_class: key`, `type: open_crate`, with a `crate_type` matching the crate's configured type. See `world/loot_tables/casino/example_art_key.json`.

## Setting up an NPC

The casino crate NPC follows the Market NPC's item-driven configuration pattern. Attach `modules/casino/crate_npc.js` to a CustomNPCs NPC, then hold the Seagull ID Card (`mts:ivv.idcard_seagull`) in your offhand:

| Main-hand item | Action |
| --- | --- |
| Empty hand | Display current setup; if unconfigured, display help and grant configuration items |
| Shulker Shell | Cycle the NPC's crate type using `crates.json` |
| Iron Coin | Toggle this crate's enabled state |
| Barrier | Clear this NPC's crate type and enabled state |

The item IDs, display names and descriptions come from `crate_npc_config.json`, not from separate hard-coded interaction checks. Admin mode always takes precedence over ordinary key opening. Unrecognized admin items produce a help message without opening a crate.

Select the crate type first, then enable it. An initialized but unconfigured or disabled NPC cannot dispense rewards. An NPC configured before the enabled switch existed is automatically enabled during initialization to preserve the previous behaviour.

Edit `crates.json` to define each type's name, description and loot table. Current art, gems and stickers types are *demonstration configurations*, not finalized casino rewards.

## Normal interaction

Players hold an owner-bound, matching key in their main hand and interact. The NPC checks the UUID and crate type, prepares all rewards, commits volatile entries if applicable, consumes one key, then gives the rewards.

For owner-bound loot table rewards, consumers must call `generateItemStackFromLootEntry(entry, world, player)`; the generic configured-reward utility already passes the player. Bound orbs may be transferred but cannot be activated by anyone except their owner. Ordinary unbound modifiers retain their existing behaviour.

Test two-player ownership, stacked keys, full inventory, changed configuration, and simultaneous volatile pulls in-game before deploying scarce prizes.
