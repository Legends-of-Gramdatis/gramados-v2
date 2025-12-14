
# Copilot Instructions for Gramados Custom NPC Scripts

This directory contains the JavaScript scripts for the **Gramados** Minecraft RP server (version 1.12.2) using the Nashorn engine and the CustomNPCs API. We follow a modular structure to make features reusable and maintainable. **Key principles:**

- **Reuse `gramados_utils` scripts** wherever possible to avoid duplication.
- **Use JSON configuration files** for any global or shared variables. This makes it easy to tweak settings without changing code.
- **Store dynamic data as JSON** (instead of using entity/block data) so backend scripts (e.g. Python) can generate reports or APIs from them. Such dynamic JSON files are kept under `data_auto` and are `.gitignore`d.
- **Keep docs in sync with code:** Whenever a JS script is updated, update the corresponding `README.md` or documentation in the same folder to reflect the changes.

## Repository Structure

The `world/customnpcs/scripts` folder is the root of our scripting system. It contains several directories and files:

- `data/` – Global configuration JSON files for various features.
- `data_auto/` – Dynamic JSON data used by scripts to communicate or track state (e.g. player data, module state). These files are generated/updated at runtime and are gitignored.
- `ecmascript/` – Main folder for all JavaScript scripts and modules.
- `globals/` – Additional global JSON configs (to be merged into `data/` eventually).
- `json_backups/` – Historical JSON backups from over the years (ignored; no need to maintain).
- `json_tests/` – Experimental JSONs or attempts (ignored).
- `logs/` – All logs from different modules (ignored).

Additionally:

- `CustomServerTools.js` – A legacy script from our original setup. It is still used but **deprecated and hard to read**. Eventually it will be replaced by the modular scripts.
- `world_data.json` – The old giant JSON used by `CustomServerTools.js` via the CustomNPCs API. It contains a lot of legacy data (over 1500 lines) and is being phased out in favor of multiple smaller JSON files. It can only be read/modified through the CustomNPCs interface, so we prefer splitting data into new files.

## Script Folders (`ecmascript`)

Inside `ecmascript/`, the scripts are organized by function:

- `deprecated/` – Old historical scripts that are no longer used. **Ignore these.**
- `gramados_sounds/` – Single-purpose sound player script (used as a template).
- `gramados_utils/` – Utility scripts organized by theme (jail, jobs, emotes, etc.). **This folder is very important.** Whenever you code a new feature, see if an existing utility function can help you before writing new code.
- `modules/` – Approved, released modules. Each module is in its own subfolder.
- `modules_unfinished/` – Work-in-progress (WIP) modules or features not yet released. When a feature is tested and ready, move it from here to `modules/`.
- `single_use/` – Miscellaneous small scripts (often admin/debug tools or one-off item scripts). These are used manually, not part of any module.

## Modules

All major features are implemented as **modules** (separate subfolders under `modules/` or `modules_unfinished/`). Follow these rules when creating or updating a module:

- **Development flow:** Do all initial work in `modules_unfinished/`. Only move a module to `modules/` when it is fully tested and approved.
- **Folder contents:** Each module folder should contain its scripts and:
  - A `README.md` describing the module’s purpose and usage.
  - A `config.json` (or similarly named) for module configuration values.
  - If needed, a `setup_guide.md` to explain special setup steps (e.g. placing NPCs or special blocks).
  - Any other helper scripts or resources specific to that module.
- **Modularity:** Design the module to be generic and reusable. Use JSON configuration to allow different setups (e.g. the *bankVault* module can create different vaults with different loot & difficulty).
- **JSON entries:** In the module’s README, explain what each field in the JSON config means (unless the name is self-explanatory). Document default values and ranges if applicable.
- **Admin Tips:** If the module supports admin/testing commands or interactions, include an **“Admin Tips”** section in the README. This should explain how staff can test or configure the module in-game. For example:
  - **Offhand ID Card:** Admins should hold the `mts:ivv.idcard_seagull` (identity card item) in the offhand, and another special item in hand.
  - **Actions:** Describe the special items and their effects. Common cases might be:
    - A **barrier block** to reset or remove something.
    - A **command block** or lever to switch configuration modes.
    - A custom **tool item** to configure or toggle features.
- **Module README footer:** At the end of each module’s README, include this line exactly:

  `Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.`

- **Legacy modules:** Some existing (especially older) modules or scripts may not follow all of the above rules yet. They will be refactored over time to match these guidelines.

### Example: Bank Vault Module

The *bankVault* module is a good illustration:

- It has its own subfolder in `modules/`.
- It contains a `bankVault.js` script, a `config.json` describing vault parameters, and a `README.md`.
- The README explains how to place and configure a new vault via JSON (no code changes needed) and includes **Admin Tips** for testing vault locks, resetting bank state, etc.
- A `setup_guide.md` helps staff set up vault locations using NPCs or blocks.

## Data and Configuration

- **Config files:** Typically named `config.json` within each module. These should define all tunable parameters (e.g. rates, limits, item IDs). Always load and save via helper utils if available.
- **Dynamic data:** Use files in `data_auto/` for runtime state. For example, a module might save a JSON of active quests or completed rewards. These are updated by your script and *should not* be committed to Git (since they change every run).
- **Global data:** Use `data/` for static data like localization texts, loot tables, or global lists (e.g. list of money items, roles, etc.).
- **Utility usage:** Many utility functions require loading/saving JSON. Use `loadJson(path)` and `saveJson(data, path)` from `utils_files` instead of writing your own file I/O.

## Documentation and Style

- **Update docs promptly:** Whenever you change or add JS code, update the corresponding documentation (the README or setup guide) in the same folder. Users and future developers rely on these docs.
- **Writing style:** Keep content clear and concise. Use short paragraphs (3–5 sentences) and bullet lists for steps or grouped ideas. The existing documentation uses:
  - Markdown headings (e.g. `## Subsection`) to divide topics.
  - Bold text for emphasis (e.g. **Server Features** in the main README).
  - Inline code formatting for commands, item IDs, config keys, or code snippets (e.g. `like this`).
  - Numbered lists (`1.`, `2.`) if you need a specific order, otherwise bullet lists (`-` or `*`) are fine.
  - See examples in the repository README and tutorial files for guidance.
- **Examples of formatting:**
  - Refer to commands or special strings in backticks, e.g. hold `mts:ivv.idcard_seagull` in your offhand.
  - Show JSON keys or code objects in inline code, e.g. `"lootTable": "my_loot_table"`.
  - For clarity, prefix variable names or commands with context, like `!help` or `mts:ivv.idcard_seagull` so readers see they are commands/items.

Copilot should prioritize consistency with existing style conventions. Match existing documentation and script layout wherever possible.

# Onboarding Development Rules

These rules apply to all onboarding code and documentation in this folder.
They are mandatory and should guide all future changes.

- No try/catch by default: Do not wrap logic in `try/catch`. If a `try/catch` is strictly necessary (e.g., third‑party API boundary), you must clearly log the error to a logfile using the standard logging utilities (e.g., `logToFile('onboarding', '...')`) and include enough context to act on it.
- No config fallbacks: Missing configuration must cause a hard failure. Do not invent defaults or fall back to implicit values. Required keys must exist in `onboarding_config.json`; if they are absent, let the error surface rather than masking it.
- Keep config and chat_convention identical: When adding or updating chat messages in the config, copy them verbatim from `chat_convention.md`. The strings in `onboarding_config.json` must match the corresponding entries in `chat_convention.md` exactly.
- Always update the config for new features: Any new feature or flow must be reflected in `onboarding_config.json` with all required toggles, delays, regions, and chat texts. Do not ship functionality that relies on hardcoded values that belong in config.
- Always update the README: Whenever you implement something new or change behavior, update `README.md` in this folder to document purpose, usage, config keys, and any admin/testing notes. Keep examples and instructions current.

## Practical Guidance

- Validation first: Load the relevant section of `onboarding_config.json` and validate the presence of all required keys before running the feature. If a key is missing, allow the script to error. If you must guard access (e.g., type checks), log and throw — do not substitute defaults.
- Consistent logging: When handling truly exceptional cases with `try/catch`, always log via the shared logging utility with a stable prefix like `[onboarding.error]` and include the player name (if applicable), phase/stage/step, and the config key(s) involved.
- Message source of truth: Treat `chat_convention.md` as the sole source for the text of player‑facing messages. When changing texts there, mirror them to the config in the same commit.

Source references:
- `chat_convention.md` — message and color conventions for all phases.
- `onboarding_config.json` — required configuration keys and texts for runtime.
- `README.md` — module overview, setup, and admin/testing guidance.

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
