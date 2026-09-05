# Legacy badge and emote reward migration

The generic unlock engine can now absorb older gameplay scripts that still call `grantBadgeAndEmotes()` or `grantEmotes()` directly.

This is intended as a migration layer: existing gameplay code keeps working, while `data/unlocks.json` becomes the source of truth for the permanent unlock and its reward bundle.

## How routing works

An unlock definition may declare a `LegacyGrant` section.

For an old badge grant:

```json
"LegacyGrant": {
    "Badge": "checked_in"
}
```

When old code calls:

```js
grantBadgeAndEmotes(player, "checked_in", ["hut_dirt", "bed"]);
```

`utils_emotes.js` finds the matching unlock and calls:

```js
grantUnlock(player, "onboarding_checked_in");
```

The reward bundle from `unlocks.json` is then delivered instead of relying on the reward list embedded in the old gameplay script.

For an emote-only legacy grant, an exact unordered bundle can be declared:

```json
"LegacyGrant": {
    "Emotes": [
        "hunger_empty",
        "hunger_half",
        "hunger_full"
    ]
}
```

The configured bundle is matched regardless of emote order.

## Historical player import

Each migrated unlock also has a login requirement based on the already-owned badge or emote.

This means players who received the reward before the generic unlock engine existed are imported automatically on their next login. The migrated definitions use `Silent: true`, so existing owners are not shown a false "new unlock" message.

Badge and emote reward helpers are idempotent, so the import can also restore missing companion emotes without duplicating badge entries.

## Migrated rewards

The first migration set contains:

- `onboarding_checked_in`
  - old badge: `checked_in`
  - emotes: `hut_dirt`, `bed`
- `onboarding_first_meal`
  - emotes: `hunger_empty`, `hunger_half`, `hunger_full`
- `lumberjack_first_delivery`
  - old badge: `Lumberjack`
  - emotes: `mossy_log`, `log`, `log2`, `wood`, `wooden_axe`, `stone_axe`
- `mafia_blood_money`
  - old badge: `blood_money`
  - emotes: `heart_dark`, `hphalf`, `book_quill`, `strength`
- `junkyard_fashionably_late`
  - old badge: `too_late`
  - emotes: `clock_night`, `clock_4`, `clock_5`, `clock_6`, `slowness`, `dead_bush`, `cobweb`
- `easter_egg_hunter`
  - old badge: `easter_hunter`
  - emotes: `egg`, `jump_rabbit`

## Combined badge reward type

`utils_rewards.js` now supports:

```json
{
    "Type": "badge_and_emotes",
    "Badge": "badge_id",
    "Emotes": ["emote_one", "emote_two"]
}
```

This preserves the old `grantBadgeAndEmotes()` behavior: companion emotes are granted silently and the normal badge notification/sound is used when the badge itself is new.

## What is deliberately not migrated

Role or affiliation badges should not become permanent unlocks when they may need to be revoked later. Examples include owner, company, farm, and repair-shop identity badges.

Purchasable legacy badges are also left unchanged for now. They should only be moved into the unlock engine after deciding whether they remain purchases or become actual achievements.

---

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
