# Casino crate keys and optional item ownership

The example casino keys are **unbound and freely tradable**. The optional loot-table function `{"function":"set_owner","owner":"player"}` remains available for other rewards and binds the generated item to its recipient's UUID. Keys are `modifier_class: key`, `type: open_crate`, with a `crate_type` matching the crate's configured type. See `world/loot_tables/casino/example_art_key.json`.

## Setting up an NPC

The casino crate NPC follows the Market NPC's item-driven configuration pattern. Attach `modules/casino/crate_npc.js` to a CustomNPCs NPC, then hold the Seagull ID Card (`mts:ivv.idcard_seagull`) in your offhand:

| Main-hand item | Action |
| --- | --- |
| Empty hand | Display current setup; if unconfigured, display help and grant configuration items |
| Shulker Shell | Cycle the NPC's crate type using `crates.json` |
| Nether Star | Link the crate to a configured casino covering the NPC's position |
| Iron Coin | Toggle this crate's enabled state |
| Barrier | Clear this NPC's crate type and enabled state |

The item IDs, display names and descriptions come from `crate_npc_config.json`, not from separate hard-coded interaction checks. Admin mode always takes precedence over ordinary key opening. Unrecognized admin items produce a help message without opening a crate.

Select the crate type, link a casino using the Nether Star, then enable the crate. Only casinos whose configured region contains the crate NPC can be selected. The selected casino is stored on each NPC and checked again before opening. Existing crate NPCs without a casino link must be linked before use.

The casino registry is `casinos.json`, keyed by region ID, with `DisplayName`, `Town`, `Island`, and `Region`. Currently Brisamar Casino is registered in `Solterra_Brisamar_BrisamarCasino_Casino`.

Successful openings update `world/customnpcs/scripts/data_auto/casinos.json` with per-casino totals, crate types, daily counts, per-player breakdowns, and rewards dispensed by item ID/metadata. Each completed opening also appends a timestamped JSON event (player UUID/name, casino, crate, key, location, and rewards) to `world/customnpcs/scripts/logs/casino_crates.jsonl`, plus a conventional `casino.log` event. Only completed draws are counted; failed or rejected uses do not affect statistics.

Select the crate type and link the casino first, then enable it. An initialized but unconfigured or disabled NPC cannot dispense rewards. An NPC configured before the enabled switch existed is automatically enabled during initialization to preserve the previous behaviour.

Edit `crates.json` to define each type's name, description and loot table. Current art, gems and stickers types are *demonstration configurations*, not finalized casino rewards.

## Normal interaction

Players hold a matching key in their main hand and interact. Unbound keys can be used by anyone; if a key has explicit owner metadata, the NPC checks its owner's UUID. It also checks the crate type, prepares all rewards, commits volatile entries if applicable, consumes one key, then gives the rewards.

For owner-bound loot table rewards, consumers must call `generateItemStackFromLootEntry(entry, world, player)`; the generic configured-reward utility already passes the player. Bound orbs may be transferred but cannot be activated by anyone except their owner. Ordinary unbound modifiers retain their existing behaviour.

Test traded unbound keys, explicitly bound keys (owner and non-owner), stacked keys, full inventory, changed configuration, and simultaneous volatile pulls in-game before deploying scarce prizes.

## Compatibility: loot item materialization

The third `player` argument in `generateItemStackFromLootEntry(entry, world, player)` is **optional for unbound loot**, preserving the original two-argument behaviour. It is **required** for entries with `set_owner: player`. Missing owners and invalid crate-key modifiers throw script exceptions rather than returning a silent null.

Existing player-controlled reward paths were reviewed and now pass the recipient: generic configured rewards, job milestones, onboarding, bank safe loot, Easter eggs, April Fools fish catches, pickpocket bonus loot, junkyard part orders, junkyard crate drops, and crowbar generation. The legacy welcome-pack script has also been updated.

Four intentionally two-argument NPC-only call sites remain: `single_use/humanNPCloot.js`, `modules/npc_scripts/PoliceNPC.js`, `modules/bankVault/bank_guard_npc.js`, and `gramados_utils/utils_trader.js`. These generate NPC drops or trader inventory *without a defined player recipient*. Their existing unbound tables work unchanged; do not add `set_owner` to those tables without establishing the recipient at redemption/death time. A bound entry in those contexts raises a visible script exception rather than silently generating an unbound item.

Static call-site and JavaScript syntax checks pass for the reviewed scripts. Simulated item-generation checks pass for unbound two-argument loot, NBT loot, bound three-argument keys, missing recipients and invalid key specifications. These do not replace in-game CustomNPCs/Nashorn integration tests.
