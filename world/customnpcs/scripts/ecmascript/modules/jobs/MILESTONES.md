# Gramados Job Milestones

This system tracks persistent career progression separately from active job ownership.
Progress is stored per player UUID in `data_auto/job_progress/<uuid>.json`, so quitting or losing a job does not erase career statistics or unlocked milestones.

## Subjects: jobs and tags

Milestones support both concrete jobs and shared job tags.

- **Jobs** use `ProgressionKey` from `jobs_data.json` when present, otherwise `JobName`.
- **Tags** use `ProgressionKey` from the tag definition when present, otherwise the tag name.
- When progress is recorded against a concrete job ID, the same progress is also propagated to every tag listed on that job.
- When progress is recorded against a tag ID, only that tag receives the progress because there may be several concrete jobs behind the same tag.

Progress is namespaced in player data under `Jobs` and `Tags`, so a job and tag can safely share the same name.

## Core API

```js
load("world/customnpcs/scripts/ecmascript/gramados_utils/utils_job_progress.js");

recordJobProgress(player, "Fisherman", {
    traps_harvested: 1
}, {
    source: "fish_trap"
});

recordTagProgress(player, "Mechanic", {
    cars_repaired: 1
}, {
    source: "garage"
});

recordProgressForJobOrTagId(player, jobOrTagId, {
    custom_stat: 1
}, {
    source: "custom_system"
});

var earnings = getJobStat(player, "job", "Fisherman", "market_earnings");
var unlocked = hasJobMilestone(player, "job", "Fisherman", "experienced_fisherman");
```

`recordProgressForJobOrTagId()` is preferred when the caller has a configured job/tag ID because it automatically resolves `ProgressionKey` and propagates concrete job progress to tags.

## Automatic market statistics

The economy logger automatically detects successful market transactions made by the configurable market NPCs and records:

- `market_earnings` in cents
- `market_transactions`

A per-market breakdown is also stored under the subject's `Markets` object.

## Milestone configuration

Milestones are configured in `data/job_milestones.json`.

```json
{
    "Version": 1,
    "Jobs": {
        "Fisherman": {
            "DisplayName": "Fisherman",
            "Milestones": [
                {
                    "Id": "experienced_fisherman",
                    "Name": "Experienced Fisherman",
                    "Requirements": [
                        {
                            "Stat": "market_earnings",
                            "Operator": ">=",
                            "Value": 10000000
                        },
                        {
                            "Stat": "traps_harvested",
                            "Operator": ">=",
                            "Value": 25
                        }
                    ],
                    "Rewards": [
                        {
                            "Type": "money",
                            "Amount": 250000
                        },
                        {
                            "Type": "badge",
                            "Badge": "experienced_fisherman"
                        },
                        {
                            "Type": "emotes",
                            "Emotes": ["fish", "fishing_rod"]
                        },
                        {
                            "Type": "loot_table",
                            "LootTable": "job_rewards/fisherman_experienced.json",
                            "Pulls": 1
                        }
                    ]
                }
            ]
        }
    },
    "Tags": {
        "Mechanic": {
            "DisplayName": "Certified Mechanic",
            "Milestones": []
        }
    }
}
```

Money amounts are stored and rewarded in **cents**, like the rest of the Gramados economy.

### Requirements

Supported operators:

- `>`
- `>=`
- `<`
- `<=`
- `==`
- `!=`

Requirements default to `ALL`. Set `"RequirementMode": "ANY"` on a milestone for OR behavior.

A requirement normally reads from aggregate `Stats`. To target a particular market breakdown, add `"Market": "Market Name"`.

```json
{
    "Stat": "market_earnings",
    "Market": "Gramados Lumber",
    "Operator": ">=",
    "Value": 5000000
}
```

### Rewards

Supported reward types:

- `money`: `Amount` in cents, optional `Currency` (defaults to `money`)
- `badge`: `Badge`
- `emote`: `Emote`
- `emotes`: `Emotes` array
- `loot_table`: `LootTable` (or `Table`) and optional `Pulls`

Loot table rewards use the existing loot-table API and therefore support the same item/NBT generation logic as other Gramados loot systems. If a loot table is currently unusable, such as an empty volatile table, the milestone remains unlocked but its rewards stay pending and are retried on a later milestone check.

## Player data format

Example:

```json
{
    "Version": 1,
    "UUID": "...",
    "Name": "Player",
    "Jobs": {
        "Fisherman": {
            "Stats": {
                "market_earnings": 2845630,
                "market_transactions": 47,
                "traps_harvested": 26
            },
            "Markets": {
                "Foréval Fishing": {
                    "market_earnings": 1845630,
                    "market_transactions": 31
                }
            },
            "Unlocked": {
                "experienced_fisherman": {
                    "UnlockedAt": 1788590000000,
                    "RewardsGranted": true,
                    "RewardsGrantedAt": 1788590000100
                }
            }
        }
    },
    "Tags": {}
}
```

## Legacy economy backfill

`scripts_backend/single_use/backfill_job_milestones.py` parses historical economy logs once and writes only the aggregate market statistics into the new per-UUID files.

It maps old market transactions back to jobs or tags using the `Markets` arrays in `jobs_data.json`, then propagates job statistics to that job's tags using the same rules as the live system. Ambiguous or unmatched markets are skipped and reported; an optional override map can resolve them.

The script is dry-run by default. Use `--apply` after reviewing its report. Applied files receive a migration marker so the same historical log is not accidentally counted twice; `--force` exists for deliberate re-runs.

The migration intentionally does **not** directly mark milestones as unlocked or grant rewards. Existing players will have their historical stats available immediately; milestones will be evaluated and rewarded the next time that subject receives progress, or when `recheckAllJobMilestones(player)` is explicitly called while the player is online.

---

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
