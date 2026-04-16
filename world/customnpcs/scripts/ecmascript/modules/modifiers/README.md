# Modifiers Module

This module implements **orb modifiers** (active and passive) used on the Gramados server.

- **Active orbs** apply an effect in a radius (e.g. crop growth, cattle pregnancy) and then become **Used**.
- **Passive orbs** apply a timed player buff (e.g. stock income multiplier) and then become **Used**.

Active orb types added by this module also include **pickpocket** effects:

- `npc pickpocket small` (radius 2)
- `npc pickpocket large` (radius 10)

These force nearby CustomNPCs to drop their RNG death drops, plus for each NPC:

- 1/3 chance to also drop `_LOOTTABLE_NPCTYPE_HUMAN` items
- 1/3 chance to also drop 1–50 grons worth of cash

And **nature/vegetation** effects:

- `nature grass small` (radius 5) – Converts dirt to grass and grows tall grass/flowers
- `nature grass medium` (radius 10) – Converts dirt to grass and grows tall grass/flowers
- `nature grass large` (radius 20) – Converts dirt to grass and grows tall grass/flowers (massive radius for cattle farms)
- `nature flowers small` (radius 5) – Spawns decorative flower patterns (no tall grass)
- `nature flowers medium` (radius 10) – Spawns decorative flower patterns (no tall grass)

The grass orbs are particularly useful for cattle farms where animals consume vegetation. The flower orbs create aesthetic patterns for decorative builds.

And **mixed crop planting** effects:

- `crop plant mixed small` (radius 8) – Plants random mixed crops on farmland (uses all crop types from seed_to_crop.json)
- `crop plant mixed large` (radius 20) – Plants random mixed crops on farmland across a large area

These mixed crop orbs plant a variety of different crop types randomly across farmland, creating diverse fields without needing to manually plant each type.

And an **event trigger** effect:

- `fish swarm` (radius 5) - Calls the April Fools fish swarm spawner with a fixed spread radius of 5.
- `fish catch nearby` (radius 12) - Catches nearby Fish Rain fish automatically, like rapid bucket use in an area.

These effects are intended for single-use consumable fish items. `fish swarm` uses the configured modifier radius as the swarm size parameter.

## Configuration

All orb definitions live in `modifiers_config.json`.

- `items.itemId`: item id used for fresh/active orbs.
- `items.usedItemId`: item id used for used/broken orbs.
- `modifiers[]`: active orb definitions (radius-based world effects).
- `passive_modifiers[]`: passive orb definitions (player buffs with durations).

## Loot Table Support

Loot tables can now spawn modifiers directly through a `set_modifier` function entry.

- `function`: must be `set_modifier`.
- `type`: the modifier effect id, matched against `active_effects[]` or `passive_effects[]`.
- `modifier_class`: `orb` for active/passive orbs, or `consumable` for single-use modifiers.
- `modifier_type`: `active` or `passive` for orb items. Consumables do not need this field.
- `radius`: optional modifier radius. Supports a number (example: `8`) or `{ "min": 4, "max": 12 }`.
- `durationMinutes`: optional passive duration in minutes. Supports a number (example: `120`) or a `{ "min": ..., "max": ... }` range.
- `multiplier`: optional passive multiplier. Supports a number (example: `1.1`) or a `{ "min": ..., "max": ... }` range.

The loot-table helper also writes any provided runtime values onto the item NBT, so the modifier engine can use the rolled values later instead of the static config default.

## Admin Tips

Admin creation shortcut is handled by `modifierEngine.js`.

- Hold `mts:ivv.idcard_seagull` in your offhand.
- Look at a chest that contains a **named** `minecraft:name_tag`.

Name tag display name behaviors:

- If the name matches an active modifier `type`, it creates that active orb.
- If the name matches a passive modifier `type`, it creates that passive orb.
- If the name is exactly `all`, it clears the chest and fills it with **all valid orbs** from `modifiers_config.json` (as many as fit in the chest).

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
