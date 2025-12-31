# Modifiers Module

This module implements **orb modifiers** (active and passive) used on the Gramados server.

- **Active orbs** apply an effect in a radius (e.g. crop growth, cattle pregnancy) and then become **Used**.
- **Passive orbs** apply a timed player buff (e.g. stock income multiplier) and then become **Used**.

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
