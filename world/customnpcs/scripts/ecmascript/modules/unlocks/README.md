# Generic Unlocks

This module adds permanent, configuration-driven unlocks for Gramados players.

Unlike job milestones, generic unlocks are not tied to a profession. They evaluate conditions against existing player data, dialogs, badges/emotes, or job/tag milestones and write the resulting unlock flag into the player's existing `unlocks` object in world stored data.

The module deliberately reuses the legacy `player_<name>` object already serialized in `world_data.json`. It does **not** create another player progression database.

## Files

- `data/unlocks.json` - static unlock definitions.
- `gramados_utils/utils_unlocks.js` - requirement evaluation, unlock persistence, and public API.
- `gramados_utils/utils_rewards.js` - reusable configured reward delivery.
- `modules/unlocks/unlock_engine.js` - player `login` / `init` event hooks.

## Storage

A player already contains data such as:

```json
{
    "created": 1581273684398,
    "firstLogin": 1551189992695,
    "badges": [],
    "emotes": [],
    "unlocks": {
        "chatcolor_red": true
    },
    "meta": {}
}
```

Generic unlocks preserve the existing boolean unlock format:

```json
"unlocks": {
    "chatcolor_red": true,
    "veteran_5_years": true
}
```

Framework metadata is stored separately so old code reading `unlocks[id] === true` remains valid:

```json
"meta": {
    "genericUnlocks": {
        "veteran_5_years": {
            "UnlockedAt": 1788600000000,
            "RewardsGranted": true,
            "RewardsGrantedAt": 1788600000100
        }
    }
}
```

If an unlock already exists in the old boolean map but has no generic-unlock metadata, the framework treats it as a legacy/manual unlock and does **not** retroactively grant money or loot-table rewards.

## Configuration

Definitions live in `world/customnpcs/scripts/data/unlocks.json`.

Example:

```json
{
    "Version": 1,
    "Unlocks": {
        "veteran_5_years": {
            "Enabled": true,
            "Name": "Five Year Veteran",
            "Triggers": ["login"],
            "RequirementMode": "ALL",
            "Requirements": [
                {
                    "Type": "player_data_age",
                    "Field": "created",
                    "Years": 5
                }
            ],
            "Rewards": [
                {
                    "Type": "badge",
                    "Badge": "veteran_5_years"
                }
            ]
        }
    }
}
```

The committed veteran example is disabled by default so merging the framework cannot award a badge ID before that badge has been created/configured in world data. Enable it once the badge definition is ready.

`Field` can be changed from `created` to another timestamp already present in player metadata, such as `firstLogin`.

## Requirement modes

`RequirementMode` supports:

- `ALL` - every requirement must pass (default).
- `ANY` - at least one requirement must pass.

## Requirement types

### `player_data_age`

Tests whether a timestamp field has reached a calendar age.

```json
{
    "Type": "player_data_age",
    "Field": "created",
    "Years": 5,
    "Months": 0,
    "Days": 0
}
```

The target date is calculated with calendar date operations rather than approximating a year as 365 days.

An optional `Operator` may be supplied; the default is `>=`.

### `player_data_value`

Compares a numeric value from the existing player object.

```json
{
    "Type": "player_data_value",
    "Field": "money",
    "Operator": ">=",
    "Value": 100000000
}
```

Nested paths are supported, for example `meta.someValue`.

Supported operators are `>`, `>=`, `<`, `<=`, `==`, and `!=`.

### `has_unlock`

```json
{
    "Type": "has_unlock",
    "Unlock": "chatcolor_red"
}
```

Set `Value: false` to require that the unlock is absent.

### `has_badge`

```json
{
    "Type": "has_badge",
    "Badge": "checked_in"
}
```

### `has_emote`

```json
{
    "Type": "has_emote",
    "Emote": "fish"
}
```

### `dialog`

```json
{
    "Type": "dialog",
    "Id": 606
}
```

### `job_milestone`

```json
{
    "Type": "job_milestone",
    "Subject": "Fisherman",
    "Milestone": "experienced_fisherman"
}
```

### `tag_milestone`

```json
{
    "Type": "tag_milestone",
    "Subject": "Mechanic",
    "Milestone": "experienced_mechanic"
}
```

These last two reuse the already-merged job/tag milestone API.

## Triggers

`unlock_engine.js` exposes two automatic events:

- `login`
- `init`

A definition is only evaluated for an event when its `Triggers` array contains that event. `*` and `all` are accepted as wildcard triggers.

Example:

```json
"Triggers": ["login", "init"]
```

Other systems can define their own trigger names and call:

```js
checkUnlocksForTrigger(player, "money_change");
```

This avoids evaluating every unlock continuously.

## Rewards

Generic unlock rewards use the same JSON shape as job milestone rewards.

Supported types:

```json
{ "Type": "money", "Amount": 250000 }
```

```json
{ "Type": "badge", "Badge": "badge_id" }
```

```json
{ "Type": "emote", "Emote": "emote_id" }
```

```json
{ "Type": "emotes", "Emotes": ["one", "two"] }
```

```json
{
    "Type": "loot_table",
    "LootTable": "job_rewards/example.json",
    "Pulls": 1
}
```

Loot-table rewards use `canUseLootTable()` before pulling. If a volatile loot table is currently empty, the unlock remains permanent but `RewardsGranted` stays false so delivery can be retried on a later check.

## Public API

```js
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_unlocks.js");
```

Check a flag:

```js
hasUnlock(player, "veteran_5_years");
```

Evaluate one configured unlock:

```js
checkUnlock(player, "veteran_5_years");
```

Evaluate unlocks attached to a trigger:

```js
checkUnlocksForTrigger(player, "login");
```

Force a full reevaluation regardless of trigger filters:

```js
recheckAllUnlocks(player);
```

Grant a configured unlock directly:

```js
grantUnlock(player, "veteran_5_years");
```

## Setup

Add `modules/unlocks/unlock_engine.js` to the CustomNPCs global/player script list used for player login events. The module itself loads all required utilities.

No migration of existing `world_data.json` player objects is required. Missing `unlocks`, `meta`, or `meta.genericUnlocks` containers are created lazily only when needed.

## Admin Tips

For testing, temporarily enable an unlock in `data/unlocks.json` and reduce its requirement. Relog the test player or invoke `recheckAllUnlocks(player)` from a scripted admin item.

Check the player's `player_<name>` world-data entry after the test. The public unlock should be a boolean under `unlocks`, while framework metadata should be under `meta.genericUnlocks`.

---

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
