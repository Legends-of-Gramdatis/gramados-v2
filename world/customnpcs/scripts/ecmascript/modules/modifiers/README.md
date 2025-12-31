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

## Configuration

All orb definitions live in `modifiers_config.json`.

- `items.itemId`: item id used for fresh/active orbs.
- `items.usedItemId`: item id used for used/broken orbs.
- `modifiers[]`: active orb definitions (radius-based world effects).
- `passive_modifiers[]`: passive orb definitions (player buffs with durations).

## Admin Tips

Admin creation shortcut is handled by `modifierEngine.js`.

- Hold `mts:ivv.idcard_seagull` in your offhand.
- Look at a chest that contains a **named** `minecraft:name_tag`.

Name tag display name behaviors:

- If the name matches an active modifier `type`, it creates that active orb.
- If the name matches a passive modifier `type`, it creates that passive orb.
- If the name is exactly `all`, it clears the chest and fills it with **all valid orbs** from `modifiers_config.json` (as many as fit in the chest).

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
