# Modifiers

Modifiers carry an effect ID and rolled parameters. Effect definitions in `modifiers_config.json` determine the gameplay implementation (`instant` or `timed`), defaults, names and descriptions. The item does not store a class or active/passive type. All executable handlers remain in `utils_modifiers.js`.

## Item lifecycle

- `modifier_effect`: canonical effect ID, such as `nature_grass`, `crop_harvest`, `stock_income` or `junkyard_loot`. IDs never encode strength or tier.
- `modifier_radius`, `modifier_duration_minutes`, `modifier_multiplier`: applicable effect parameters.
- `modifier_uses_before_depletion`: uses before the final available activation. **0 means one available use**, 3 means four. Negative/unlimited values are unsupported.
- `modifier_initial_uses_before_depletion`: original rolled charge count, restored on recharge.
- `modifier_on_depletion`: `break` or `disappear`.
- `modifier_depleted`: prevents activation after breaking.
- `modifier_cooldown_seconds`, `modifier_last_used_at`: item cooldown and successful-use timestamp in milliseconds. The timestamp is an NBT double to preserve epoch milliseconds.
- `modifier_conflict_policy`: optional; `reject` is the implicit default and the only supported policy.
- `modifier_repairs`: number of completed recharges, also the next cost in Arcade Tokens.
- `modifier_ready_item_id`, `modifier_ready_item_damage`, `modifier_broken_item_id`, `modifier_broken_item_damage`: exact physical representations for repairable items.

Activation checks ownership, depletion, cooldown and effect rules before running a handler. Only successful effects consume a charge or start cooldown. Instant handlers returning zero changes do not consume the item. Each activation operates on one physical item: stacked unused items retain their charges and timestamp, while the used item is returned separately (dropped if inventory is full).

For `break`, the final successful activation changes the physical item and sets `modifier_depleted = true`. Identity, rolled parameters, original charges, ownership and last-used timestamp survive. Use a depleted item on a chest to recharge. The first recharge costs **0** tokens, the next 1, then 2, etc.; an empty chest works for the free recharge. Repair restores the original ID/metadata and charge count. It does not reset cooldown. For `disappear`, the final successful activation removes one physical item.

Timed effects last for **online gameplay time** and pause on logout. Item cooldown uses **wall-clock time**, including time offline. Both timers start on successful activation and constrain reuse independently. An active timed effect rejects another activation of the same canonical effect, even from a different item. A different item has its own cooldown.

## Loot-table generation

`set_modifier` uses the carrier item and metadata chosen by the loot table. Modifier configuration has no `colorCode` or skin metadata.

```json
{
    "type": "item",
    "name": "variedcommodities:orb",
    "weight": 10,
    "functions": [
        {"function": "set_data", "data": 2},
        {
            "function": "set_modifier",
            "type": "nature_grass",
            "radius": {"min": 4, "max": 12},
            "usesBeforeDepletion": {"min": 0, "max": 3},
            "onDepletion": "break",
            "cooldownSeconds": {"min": 30, "max": 180},
            "brokenItem": {"id": "variedcommodities:orb_broken", "damage": 0}
        }
    ]
}
```

`radius`, `durationMinutes`, `multiplier`, `usesBeforeDepletion` and `cooldownSeconds` accept numbers or `{min,max}`. Integer parameters use inclusive, uniform integer sampling; multipliers use continuous sampling. Author valid ranges and integer values in the loot table. `resolve_modifier_value` delegates to `rrandom_range` for integers and `random_range` for multipliers. Omitted parameters inherit their effect definition, then the shared `defaults` in `modifiers_config.json`. These currently set charges/cooldown to 0, depletion to `break`, and the broken carrier to `variedcommodities:orb_broken` with metadata 0. `itemId` may explicitly override the carrier ID. The factory accepts an explicit world: `create_modifier_item_stack(player.getWorld(), baseStack, spec)`, with `spec.type` as the effect ID.

Loot preparation resolves supplied ranges once. Constructing the prepared reward does not reroll them. Optional `set_owner` still binds a modifier to its recipient; ordinary generated modifiers are tradable. Ownership lives in `utils_item_ownership.js`, and the modifier engine enforces it before activation or recharge. For a player-linked reward, add this to its loot-table functions:

```json
{"function": "set_owner", "owner": "player"}
```

`displayName` and `description` are ordered lists of `{when, value}` rules. A single unconditional rule represents a fixed name or description. Conditions use `lt`, `lte`, `gt`, `gte`, `eq`; all conditions are ANDed, and the first match wins. A rule with `"when": {}` is unconditional. Include it as the last rule to cover the remaining values. Comparisons use the reusable `compare_values(val1, val2, operator)` helper in `utils_maths.js`. Names/descriptions derive from the resolved item values; lore updates after use and recharge.

```json
"displayName": [
    {"when": {"radius": {"lt": 10}}, "value": "&dTouch of Verdure"},
    {"when": {"radius": {"lt": 30}}, "value": "&dVerdant Reach"},
    {"when": {}, "value": "&dMeadow's Blessing"}
]
```

## Modifier Collector's Crate

Casino crate type **`modifiers`** references `modifiers/modifier_crate.json`, with one reward per key. `casino/keys/modifiers.json` generates its keys. It is also available through the existing two-key random-key crate. Use the existing crate NPC admin controls to select `modifiers`, bind the casino and enable the crate.

The initial table has eight instant effects, each with a common band (weight 10, radius 4–12, 1–3 uses, cooldown 30–180s) and a rare band (weight 2, radius 16–32, 3–6 uses, cooldown 120–600s). `stock_income` and `junkyard_loot` each have weight 6, duration 30–90 online minutes, 1–4 uses and cooldown 1800–7200s. Their multiplier ranges are 1.05–1.30 and 1.25–2.50 respectively. All rewards are repairable. These are starting balance values, adjustable entirely in JSON.

## Migration and admin tools

`modifiers_legacy.json` maps old effect IDs to canonical IDs and defaults. Existing items convert on interaction, preserving explicit rolled values, repair count, ownership and carrier metadata. Old broken orbs retain their physical broken representation and restore the historical orb carrier on recharge. New code never produces the old NBT vocabulary. Existing passive runtime entries normalize when loaded without resetting remaining time; missing legacy multipliers use the old tier's value. Previously overlapping legacy effects retain their recorded bonuses until they expire; new activations obey canonical conflict rules.

Existing casino keys remain accepted by the dedicated key helper. New keys use `is_crate_key = true` and `crate_type`, generated by `set_crate_key`, with no modifier tags.

For admin creation, hold `mts:ivv.idcard_seagull` in the offhand, a blank carrier in the main hand, and look at a chest containing a named `minecraft:name_tag`. A canonical effect ID creates that modifier. Historical names also resolve through the migration map. `all` replaces the chest contents with one default modifier per configured effect, up to its capacity. Admin-created carriers use `items.itemId` and metadata 0; skins belong to loot-table content.

`modifier_function_coverage.json` covers fixed/random parameters, charges, cooldown, custom broken metadata, timed effects and consumables. Existing vegetation tables use the new syntax. Historical `instanciate_*` helper entry points are retained for event scripts, but emit only the new item model.

## Code conventions

Trust the authored configuration. Do not add malformed-config recovery, substitute objects/names, broad type checks or custom validation exceptions. Missing or malformed configuration should reach the existing JSON error reporting and normal script errors. Use the existing math utilities for RNG and comparisons. Keep an explicit world argument rather than accepting interchangeable world/player contexts. Checks for ownership, charges, cooldown, passive conflicts and real player interactions remain gameplay logic. Legacy conversions are explicit migration paths.

The runtime file `world/customnpcs/scripts/data_auto/passive_modifiers.json` must contain valid JSON (an empty object for a new installation); do not replace a failed read with an empty object.

## Validation

Run `node scripts_backend/tests/modifiers.test.js` from the repository root. The regression fixture executes the production scripts with mocked CustomNPCs items/NBT, inventory, clock, world and persistence.

Before deploying, verify in Minecraft 1.12.2/Nashorn: ordinary and legacy orbs, one stacked multi-use item with a full inventory, free and paid chest recharge, a timed effect across logout/login, cooldown denial, custom broken metadata, and an actual casino modifier-crate pull. Container/NBT behavior and world handlers need this live smoke test; the Node fixture does not emulate the Minecraft server.
