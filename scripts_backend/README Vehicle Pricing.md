# Vehicle Pricing Updater (Trin)

This tool scans the server `crafttweaker.log` for Trin vehicle item IDs and computes a `value` for each one, then appends missing entries to `world/customnpcs/scripts/globals/global_prices.json`.

## Inputs

Configured in [scripts_backend/vehicle_price_config.json](scripts_backend/vehicle_price_config.json):

- `crafttweaker_log`: the log to scan for item IDs like `<mts:iv_tcp_v3_civil.trin_heavorum_crewcab_dually_appleford_g>`
- `trin_car_models`: base prices (`base_price`) from Trin catalog
- `factory_colors`: paint prices
- `interior_colors`: interior prices
- `global_prices`: output JSON to append into

## How pricing works

For each found item ID:

1. Parse suffix after the dot, e.g. `trin_heavorum_crewcab_dually_appleford_g`
2. Detect interior variant (optional)
   - `g` → `Gray`, `w` → `White`, `b` → `Brown`, `r` → `Red`, `t` → `Tan`, `bl` → `Black`, `gb` → `Gray & Blue`
3. Detect paint
   - Single-tone: matches an entry in `factoryColors.json`
   - Multi-tone (polychrome): split on `and` (e.g. `tungstenandelectricblue`) and add both paint prices + `polychrome_extra` (default `1000`)
4. Match the model in `trinCarModels.json` (best-fit heuristic)
5. Final value:

$$\text{value} = \text{base_price} + \text{paint_price} + \text{interior_price} + \text{polychrome_extra (if any)}$$

## Running it

Dry-run (recommended first):

- `python3 scripts_backend/vehicle_price_updater.py --dry-run --non-interactive`

Interactive mode (asks when a paint/interior/model is unrecognized or ambiguous):

- `python3 scripts_backend/vehicle_price_updater.py`

In interactive mode, if you resolve an *unknown paint key* once, the tool remembers it for the rest of the run and also persists it into the overrides file (config key `paths.overrides`) so the next run won’t ask again.

Similarly, if the tool asks you to pick from an **Ambiguous model match** list, your selection is remembered and persisted so the same `model_key` won’t prompt again in future runs.

Apply changes:

- `python3 scripts_backend/vehicle_price_updater.py --non-interactive`

If you need to overwrite entries that already exist in `global_prices.json` (rewrites the full file):

- `python3 scripts_backend/vehicle_price_updater.py --update-existing`

## Reports

Each run writes a report JSON to `report_out` (default):

- `/home/mouette/gramados-v2/scripts_backend/vehicle_price_report.json`

It contains counts, errors, and sample computed entries.

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
