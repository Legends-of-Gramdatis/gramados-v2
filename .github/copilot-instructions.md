# Copilot instructions for Gramados (Minecraft 1.12.2, CustomNPCs/Nashorn)

This repo powers the Gramados RP server via CustomNPCs JavaScript (Nashorn) scripts. Code lives under `world/customnpcs/scripts`. Favor small, targeted edits and reuse utilities.

## Architecture and layout
- Scripts entry root: `world/customnpcs/scripts/ecmascript/`
  - `gramados_utils/` shared helpers (I/O, chat, logging, regions, currency, loot tables)
  - `modules/` shipped, stable features; `modules_unfinished/` WIP modules
  - Each module may include JS, config JSON under its folder, and docs (README.md)
- Config vs data:
  - Static config JSON: `world/customnpcs/scripts/data/`
  - Runtime data JSON: `world/customnpcs/scripts/data_auto/` (generated; read/write via utils)
- Events: scripts are attached to NPCs/items or run per-player via events: `init(event)`, `tick(event)`, `interact(e)`.

## Core utilities (use these instead of ad‑hoc code)
- Files: `utils_files.js` → `loadJson(path)`, `saveJson(obj,path)`, `getWorldData()` (CustomNPCs storeddata)
- Chat/UI: `utils_chat.js` → `tellPlayer(p, msg)`, `tellSeparatorTitle(p, title, sepColor, titleColor)`, `executeCommand(...)`
- Logging: `utils_logging.js` → `logToFile(type,msg)`, `logToJson(type,key,obj)`; logs in `world/customnpcs/scripts/logs/`
- Regions: `utils_region.js` → `isWithinAABB`, `getStarterHotelRegions()`, `getRandomUnownedRegion(...)`, `updateRegionOwnerSigns(name)`, `confinePlayerToRegion(...)`
- Currency: `utils_currency.js` → `generateMoney(world, cents, "money")`, `addMoneyToCurrentPlayerPouch(...)`
- Loot tables: `utils_loot_tables.js` → `pullLootTable(tablePath, player)`, `multiplePullLootTable(...)`

## Project conventions and patterns
- Use JSON configs to parameterize behavior; write ephemeral state to `data_auto`.
- Chat formatting uses `&` color codes and emoji aliases; see `gramados_utils/utils_chat.js` and onboarding `chat_convention.md`.
- Teleports: prefer `player.setPosition(x+0.5, y, z+0.5)` and preserve yaw/pitch when needed.
- Access Minecraft/CustomNPCs via Nashorn: `var API = Java.type('noppes.npcs.api.NpcAPI').Instance();` and `API.getIWorld(0)`.
- Never `load()` a script that registers event hooks (like `onboarding_main.js`) from a tool/utility; use shared utils + direct JSON access instead (see `onboarding_reset_tool.js`).

## Onboarding module (example of module design)
- Files: `modules_unfinished/onboarding/` → `onboarding_main.js` (per-player controller), `onboarding_phase*.js`, `onboarding_config.json`.
- Gating: `onboarding_config.json` has `indev` and `beta_players`; `general.moduleEnabled` toggles module.
- Data path: `world/customnpcs/scripts/data_auto/onboarding_data.json` (per-player progress). Save via `saveJson` when state changes.
- Typical flow: detect dialog via `player.hasReadDialog(id)` → grant loot via `pullLootTable(...)` → timed teleport → confine to regions → advance phases.

## Build/run/debug workflows
- No build step; scripts are interpreted by CustomNPCs. To run the server on Linux: use `ServerStartLinux.sh` (Java 8 required; reads `settings.cfg`).
- Quick test loop: edit JS → rejoin server or trigger the script’s event → watch `world/customnpcs/scripts/logs/*.log`.
- Reset onboarding state for a player using the scripted item `modules_unfinished/onboarding/onboarding_reset_tool.js` (clears dialog token, data file, and room ownerships).

## When adding or modifying scripts
- Reuse `gramados_utils` functions; don’t duplicate file I/O, chat, or region math.
- Keep configurable values in JSON next to the module; load once.
- Persist only minimal per-player/module state to `data_auto/*.json`; log transitions with `logToJson('onboarding', 'phase_changes', {...})` when relevant.
- Follow the separator/title chat style: `tellSeparatorTitle(player, 'Title', '&b', '&e')` and short, actionable lines.

References: `GUIDELINES.md` (repo-wide scripting principles), root `README.md` (server overview), and module READMEs under `world/customnpcs/scripts/ecmascript/modules*/`.
