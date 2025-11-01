# Onboarding Module (Unfinished)

Guides new players through: arrival, State Hotel room assignment, home commands, and economy basics. It is modular, config-driven, and designed to be testable by staff with debug tools.

This module lives under `modules_unfinished/onboarding/` and will move to `modules/` once fully approved.

## What this module does

- Phase 0: Arrival flow, dialog detection, timed transfer to the State Hotel, and confinement until transfer completes.
- Phase 1: Starter room assignment, confinement to hotel/room until setup is done, registering a home with `!setHome`, and using `!myHomes`/`!home`.
- Phase 2: Money Pouch tutorial: checking `!myMoney`, depositing/withdrawing, multi-withdraw (`!withdraw 1g 6`), and a first purchase in the canteen.
- Phase separators appear at the end of each phase with color-coded titles (see “Color/Chat Conventions”).
- When Phase 1 completes, players receive a badge/emote reward.

## Quick start (for staff)

1) Ensure the module is enabled and you’re allowed to run it:
	 - `onboarding_config.json` → `general.moduleEnabled: true`
	 - During development, only names in `beta_players` can run it when `indev: true`.
2) Teleport to the arrival area or use the reset tool (see Admin Tips) to restart onboarding.
3) Walk through the phases as a test player. Flip `general.force_full_onboarding` to `true` if you need to force the entire Phase 1 flow even for players who already own regions.

## Configuration (onboarding_config.json)

Top-level keys:

- `indev` (boolean): When true, restricts the module to `beta_players` for safer testing.
- `beta_players` (string[]): Players allowed to run onboarding while `indev` is true.
- `general` (object):
	- `moduleEnabled` (boolean): Master toggle.
	- `force_full_onboarding` (boolean, default false): Forces the full Phase 1 flow even if the player already owns regions. Ownership shortcuts are disabled, but an already-owned Starter Hotel room is still reused when present.
	- `saveThrottleTicks` (number): Debounce for saving player data.
	- `logJson` (boolean): If true, logs additional JSON to file.
	- Timers (seconds):
		- `generic_streamline_delay_short`, `generic_streamline_delay_medium`, `generic_streamline_delay_long`, `generic_streamline_delay_very_long`
		- `generic_streamline_interval` (periodic reminder interval)
- `phases` (object): Per-phase enable flags, names, stage configs, messages, positions and region AABBs.

Important Phase sections you can tweak:

- Phase 0 (`phases["0"].stages.arrival`):
	- `region`: AABB + fallback position used for confinement/teleport safety.
	- `dialog`: `id`, NPC display name, teleport delay, State Hotel TP destination.
	- `chat`: texts for welcome, timer start, confine reminder, teleport, and rewards.

- Phase 1 (`phases["1"].stages.hotel`):
	- `hotel_region`: AABB + fallback inside State Hotel.
	- `chat`: all guiding texts for finding room, setup, `!setHome`, and the home tutorial.
	- `home.proximity`: distance thresholds for “near/far” checks.
	- `home.lost_moment`: optional “get lost” mini-lesson with a separate teleport and radius.

- Phase 2 (`phases["2"]`):
	- `stages.stage1.chat`: messages for `!myMoney`, `!deposit`, `!depositall`, and `!withdraw` flows.
	- `stages.stage5`: canteen region, waiter NPC, market file, and purchase prompts.

## Ownership-aware behavior (Phase 1)

Phase 1 is designed to be smart when the player already owns regions:

- If the player already owns a Starter Hotel room: their existing room is reused for Stage 1. No new room is assigned.
- If the player already owns other regions (but not a Starter Hotel room):
	- Default: skip directly to Stage 3 (using `!myHomes`/`!home`).
	- With `general.force_full_onboarding: true`: do not skip. The player runs the full flow instead (helpful for QA and staff walkthroughs). Homes metadata is still seeded early.

Internally, Phase 1 caches a “homes meta” snapshot via a shared loader (`p1_loadPlayerHomesMeta`) so `homeMax`, names, and baseline counts are always available—no code duplication and no try/catch.

## Player-facing flow (step-by-step)

Below is the gist of what the player experiences. Texts are controlled by the config and by `chat_convention.md`.

### Phase 0 – Gramados Arrival

1) Welcome at arrival NPC. Dialog completion is auto-detected.
2) A timer starts (configurable `long` delay). The player is confined to the arrival area until transfer.
3) Teleport to the State Hotel fallback spot. A phase separator is printed.

### Phase 1 – State Hotel Room and Home

1) Room assignment: a random unowned Starter Hotel room is selected, with safe fallback if all are owned. If the player already owns a Starter room, we reuse it. Player is confined to the hotel until they enter their room.
2) Enter room → short setup period → grant starter furniture. Confinement switches to the room.
3) Prompt to register the room as home: `!setHome <name>`.
4) Home usage mini-lesson: walk away; use `!myHomes` and `!home` (or `!home <name>`) to return. If the player is lost, the “lost moment” path triggers and messages guide them back.
5) Phase 1 completion: separator printed; badge/emote granted.

Ownership shortcuts may skip step 1–3 and jump to using `!myHomes` and `!home` directly when appropriate (unless forced full onboarding is enabled).

### Phase 2 – Economy Basics

1) `!myMoney`: Learn pouch vs inventory money and read the breakdown.
2) `!deposit` (and `!depositall`): Move money from inventory to pouch and confirm via `!myMoney` again.
3) Withdraw flows:
	 - `!withdraw 6g` → emits a 5G bill + 1G coin.
	 - Redeposit loop until inventory is clean.
	 - Multi-withdraw: `!withdraw 1g 6` → six 1G coins. Then redeposit again.
4) First purchase:
	 - Go to the canteen (configured region), find waiter NPC (configured name/position), stay near him, and buy any food from the configured market file.

## Color/Chat Conventions

We follow `chat_convention.md` to keep messages consistent:

- Phase separators: Phase 0 `&6[===]`, Phase 1 `&b[===]`, Phase 2 `&2[===]`.
- Titles use `&e` in this module.
- “Start” messages use `&b:sun:`; confirmations often use `&a:check_mark:`; repeats use `:lit:&e`.

## Admin Tips (testing and tools)

All tools are in `ecmascript/single_use/` and are meant to be attached to a scripted item. Hold/use them as noted.

- Onboarding Reset Tool (`modules_unfinished/onboarding/onboarding_reset_tool.js`)
	- Right-click to wipe the player’s onboarding data and remove the Phase 0 dialog token.
	- Permission: when `indev: true`, only `beta_players`; otherwise OP-only.
	- Also unassigns the player from any Starter Hotel rooms to avoid duplicates.

- Random Starter Room Finder (`single_use/tool_random_starter_room.js`)
	- Right-click to print a random unowned Starter Hotel room (falls back safely when all are owned). Optional counts for debug.
	- Useful for quick manual assignment checks and ensuring region pools look correct.

- Starter Room Linker (`single_use/starter_room_linker.js`)
	- Attack to cycle/select a region from the cuboids you’re currently in; interact on a sign to write/link the owner name.
	- Updates linked owner signs for that region.

- Starter Room Switcher (`single_use/starter_room_switcher.js`)
	- Attack to cycle/select a region from your current cuboids; interact to transfer the selected region to a configured target (currently `Colt_44_magnum`).
	- Handy for testing ownership flows fast.

- Starter Hotel Data Setter (`single_use/starter_hotel_data_setter.js`)
	- Interact to convert all `StarterHotel` regions to rentable (saleType `rent`), mark unowned rooms for sale, and apply a standard price/priority.
	- Safe, additive changes to region world data.

## Testing playbooks (suggested)

1) Fresh player, no regions:
	 - Phase 0 → Phase 1 full path → `!setHome` → home tutorial → Phase 2 money flows → canteen purchase.

2) Player already owns a Starter Hotel room:
	 - Verify reuse: the module should point them to their existing room for Phase 1 Stage 1.

3) Player owns non-starter regions:
	 - Default: verify skip to Phase 1 Stage 3 (homes tutorial).
	 - With `general.force_full_onboarding: true`: verify full Phase 1 runs instead of skipping.

4) All rooms taken scenario:
	 - Use the Random Room Tool to confirm fallback kicks in and flow still proceeds.

## Troubleshooting

- Logs: look for the `onboarding` log file to see step transitions and debug traces.
	- When the force flag prevents a skip, you’ll see: `[phase1-force-full] Ownership shortcuts disabled by config for <player>. Proceeding with full onboarding.`
- If onboarding doesn’t start:
	- Check `general.moduleEnabled`, `indev`, and `beta_players`.
	- Ensure the player is in the correct arrival area or use the Reset Tool.
- If room selection fails:
	- Verify Starter Hotel regions exist and follow naming (e.g., `Gramados_GramadosCity_StarterHotel_301`).
	- Ensure region data is present in world data (and not corrupted JSON).

## Data and persistence

- Persistent player module state: `world/customnpcs/scripts/data_auto/onboarding_data.json`.
- Global world data (legacy/other systems): `world/customnpcs/scripts/world_data.json` (via CustomNPCs API).
- Region ownership and player homes are read from world data; the module avoids try/catch in new code and uses a shared JSON read helper for homes metadata.

## Notes and status

- This module is still in `modules_unfinished/` and under active testing.
- It attempts to minimize duplication and centralize data access; notably, Phase 1 uses `p1_loadPlayerHomesMeta` so `homeMax` is always populated, even when skipping steps.

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
