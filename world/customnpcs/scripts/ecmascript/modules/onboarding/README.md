# Onboarding Module

Guides new players through arrival, State Hotel room assignment, home commands, economy basics, and starter scrap trading. It is modular, config-driven, and designed to be testable by staff with debug tools.

This module lives under `world/customnpcs/scripts/ecmascript/modules/onboarding/`.

## What this module does

- Phase 0: Arrival flow, dialog detection, timed transfer to the State Hotel, and confinement until transfer completes.
- Phase 1: Starter room assignment, confinement to hotel/room until setup is done, registering a home with `!setHome`, and using `!myHomes`/`!home`.
- Phase 2: Money Pouch tutorial: checking `!myMoney`, depositing/withdrawing, multi-withdraw (`!withdraw 1g 6`), and a first purchase in the canteen.
- Phase 3: Scrap for a Start: learn crates by packing and selling a mixed scrap crate. Stage 1 gives 18 scrap items and a random crate (loot table is configurable), then guides packing and selling at two facilities.
	- Stage 3 Step 2 (Selling): This step completes when the player's economy log (`world/customnpcs/scripts/logs/economy.json`) contains any entry with `type: "scrap_sale"` and `preset: "ferrous"` under their name. No in-game checks are performed; the sale is inferred from the log.
- Phase separators appear at the end of each phase with color-coded titles (see “Color/Chat Conventions”).
- When Phase 1 completes, players receive a badge/emote reward.
- Players can skip the current onboarding phase (Phase 1+) with `!tutorial skip`.

## Quick start (for staff)

1) Ensure the module is enabled and you’re allowed to run it:
	- `onboarding_config.json` → `general.moduleEnabled: true`
	- During development, only names in `beta_players` can run it when `indev: true`.
2) Teleport to the arrival area or use the reset tool (see Admin Tips) to restart onboarding.
3) Walk through the phases as a test player. Flip `general.force_full_onboarding` to `true` if you need to force the entire Phase 1 flow even for players who already own regions.

Tip: if you need to jump forward quickly during testing, use `!tutorial skip` (it only works from Phase 1 and up; Phase 0 cannot be skipped).

## Configuration (`onboarding_config.json`)

Top-level keys:

- `indev` (boolean): When true, restricts the module to `beta_players` for safer testing.
- `beta_players` (string[]): Players allowed to run onboarding while `indev` is true.
- `blacklist_players` (string[]): Players who skip onboarding entirely and start at the last implemented phase (Phase 3).
- `general` (object):
	- `moduleEnabled` (boolean): Master toggle.
	- `force_full_onboarding` (boolean, default false): Forces the full Phase 1 flow even if the player already owns regions.
	- Timers (seconds): `generic_streamline_delay_short`, `generic_streamline_delay_medium`, `generic_streamline_delay_long`, `generic_streamline_delay_very_long`, and `generic_streamline_interval`.
- `phases` (object): Per-phase enable flags, names, stage configs, messages, positions and region AABBs.

Important Phase sections you can tweak:

- Phase 0 (`phases["0"].stages.arrival`): region, arrival dialog, transfer delay/destination, and chat texts.
- Phase 1 (`phases["1"].stages.hotel`): hotel region, home tutorial messages, proximity thresholds, and lost-moment settings.
- Phase 2 (`phases["2"]`): economy command prompts and Stage 5 canteen/waiter/market settings.

## Ownership-aware behavior (Phase 1)

Phase 1 is designed to be smart when the player already owns regions:

- If the player already owns a Starter Hotel room, their existing room is reused for Stage 1. No new room is assigned.
- If the player already owns other regions (but not a Starter Hotel room):
	- Default: skip directly to Stage 3 (using `!myHomes`/`!home`).
	- With `general.force_full_onboarding: true`: do not skip. The player runs the full flow instead.

Internally, Phase 1 caches a homes metadata snapshot via `p1_loadPlayerHomesMeta` so `homeMax`, names, and baseline counts remain available without duplicating reads.

## Player-facing flow

### Phase 0 – Gramados Arrival

1) Welcome at arrival NPC. Dialog completion is auto-detected.
2) A timer starts. The player is confined to the arrival area until transfer.
3) Teleport to the State Hotel fallback spot. A phase separator is printed.

### Phase 1 – State Hotel Room and Home

1) Assign or reuse a Starter Hotel room and guide the player to it.
2) Enter room → setup period → grant starter furniture.
3) Register the room as home with `!setHome <name>`.
4) Home usage mini-lesson with `!myHomes` and `!home`.
5) Phase 1 completion: separator and badge/emote reward.

### Phase 2 – Economy Basics

1) `!myMoney`: learn pouch vs inventory money and read the breakdown.
2) `!deposit` / `!depositall`: move money from inventory to pouch and confirm via `!myMoney` again.
3) Withdraw flows:
	- `!withdraw 6g`.
	- Redeposit until inventory is clean.
	- `!withdraw 1g 6` for six 1G coins, then redeposit again.
4) First purchase: go to the configured canteen, find the waiter, and buy any configured food item.

### Phase 3 – Scrap for a Start

1) Ensure enough free inventory space, then receive configured scrap items and a random crate.
2) Pack the crate and pick it back up.
3) Travel to the configured scrap facilities and sell the contents.

## Color/Chat Conventions

We follow `chat_convention.md` to keep messages consistent:

- Phase separators: Phase 0 `&6[===]`, Phase 1 `&b[===]`, Phase 2 `&2[===]`.
- “Start” messages use `&b:sun:`; confirmations often use `&a:check_mark:`; repeats use `:lit:&e`.

## Admin Tips (testing and tools)

- Onboarding Reset Tool (`modules/onboarding/debugTools/debug_onboarding_reset_tool.js`)
	- Right-click to replace the player's UUID onboarding file with a fresh Phase 0 record and remove the Phase 0 dialog token.
	- It intentionally does **not** delete the UUID file, because deletion could cause an old legacy entry to be migrated again.
	- Also unassigns the player from Starter Hotel rooms for clean testing.
- Phase 3 Reset Tool (`modules/onboarding/debugTools/debug_reset_onboarding_to_phase3.js`)
	- Right-click to move the invoking player directly to Phase 3 Stage 1 using UUID storage.
- Random Starter Room Finder (`single_use/tool_random_starter_room.js`)
	- Prints a random unowned Starter Hotel room.
- Starter Room Linker (`single_use/starter_room_linker.js`)
	- Links region owner information to signs.
- Starter Room Switcher (`single_use/starter_room_switcher.js`)
	- Transfers a selected room for testing ownership flows.
- Starter Hotel Data Setter (`single_use/starter_hotel_data_setter.js`)
	- Applies standard rental metadata to Starter Hotel regions.

## Testing playbooks

1) Fresh player, no regions: Phase 0 → Phase 1 → home tutorial → Phase 2 money flows → canteen purchase.
2) Existing Starter Hotel owner: verify the existing room is reused.
3) Player owns non-starter regions: verify the normal shortcut and the `force_full_onboarding` override.
4) All rooms taken: verify the room-selection fallback.
5) From Phase 1 or 2, run `!tutorial skip`, then confirm the UUID file advances immediately and remains advanced after several onboarding ticks and after relogging.
6) During Phase 2, verify `!myMoney`, `!deposit`, `!depositAll`, and `!withdraw` are detected without any write to the legacy shared file.
7) Run both reset tools and confirm progression does not reappear from `onboarding_data.json` after relogging.

## Troubleshooting

- Logs: inspect the `onboarding` log for step transitions and command/skip traces.
- If onboarding doesn’t start, check `general.moduleEnabled`, `indev`, and `beta_players`.
- If room selection fails, verify Starter Hotel regions and region world data.
- If a command succeeds but onboarding does not progress, verify the player's UUID file under `data_auto/onboarding/` is changing. Do **not** use `onboarding_data.json` to diagnose current progress.

## Data and persistence

Authoritative state is **one JSON file per player UUID**:

`world/customnpcs/scripts/data_auto/onboarding/<uuid>.json`

Storage access is centralized in:

`world/customnpcs/scripts/ecmascript/gramados_utils/utils_onboarding.js`

Rules for code touching onboarding state:

- New code must read/write through the UUID storage helpers.
- `world/customnpcs/scripts/data_auto/onboarding_data.json` is **legacy and read-only**. It is used only as a migration fallback for players who do not yet have a UUID file.
- Never write a full name-keyed onboarding snapshot back to the legacy file; that was the source of the simultaneous-player overwrite bug.
- The main controller reloads the player's UUID file before each processing pass, allowing command/debug tools in other script contexts to update that player safely without being overwritten by stale controller state.
- `onboarding_cst_bridge.js` is loaded directly after `CustomServerTools.js` in the same player-script bundle. It shadows CustomServerTools' old onboarding helpers so `!tutorial skip`, progression UI checks, and obsolete command logging cannot fall back to the legacy shared-file implementation.

Global world data (`world_data.json`) remains a separate legacy system used for regions, homes and other unrelated server state.

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
