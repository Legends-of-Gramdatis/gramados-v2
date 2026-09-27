# Owner-bound crate keys

The optional loot-table function `{"function":"set_owner","owner":"player"}` binds a generated item to its recipient's UUID and adds display lore. General items/modifiers remain tradable and usable unless their consumer enforces ownership. The crate NPC always requires ownership.

Generate bound items with `generateItemStackFromLootEntry(entry, world, player)`; a missing recipient fails closed. `grantConfiguredRewards` passes the player already. If an existing caller uses a new owner-bound loot table, update it to pass the recipient.

Keys use `set_modifier` with `modifier_class: key`, `type: open_crate`, `crate_type`, and an optional `item_id`, `key_name`, and `key_description`. Pair it with `set_owner`. See `world/loot_tables/casino/example_art_key.json`.

To configure a crate NPC, attach `modules/casino/crate_npc.js`; with the admin Seagull ID card in offhand and paper in main hand, interact to cycle crate type. Edit `modules/casino/crates.json` to configure available types and loot tables. Players hold their bound key in main hand and interact to open; the NPC checks UUID and matching crate type, generates rewards, commits volatile loot when present, consumes one key and gives rewards. Ordinary right-click on the key does nothing except display guidance through the modifier engine.

The art, gems and stickers examples are smoke-test configurations, not finalized casino balancing. Multiplayer, stacked keys, inventory-full and concurrent volatile-pool openings need in-game verification before deploying scarce rewards.
