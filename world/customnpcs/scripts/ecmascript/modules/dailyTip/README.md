# Daily Tip Module

The `dailyTip` module sends players a contextual tip in chat after they log in. Tips can highlight server features or questlines, and each tip can be gated by requirements such as money, faction reputation, or quest progress.

As of the current behavior, the tip is shown **1 minute after login** (not instantly), to avoid chat overload during spawn/login flows.

## Files

- `dailyTipEngine.js` — main login + timer logic and requirement validation.
- `tip_config.json` — all tip content and requirement rules.

## How It Works

1. On player login, the module starts a one-shot timer for `60 seconds`.
2. When the timer fires, one tip type is picked from `tip_types`.
3. A random tip from that type is selected.
4. Requirements are checked.
5. If invalid, the module retries up to 5 times to find a valid tip.
6. If a valid tip is found, it sends:
	 - `Today's tip: <display>`
	 - optional arrow line with `<description>`

## Configuration (`tip_config.json`)

Top-level keys:

- `tip_types` (array of strings)
	- Lists pools available for random selection.
	- Current values: `features`, `quests`, `jobs`.

- `features` (array of tip objects)
- `quests` (array of tip objects)
- `jobs` (array of tip objects)

Each tip object supports:

- `name` (string)
	- Internal/admin-readable label.
- `display` (string)
	- Main tip line shown to the player.
	- Supports color codes (for example: `§6`, `§l`, `§r`).
- `description` (string, optional)
	- Second line with extra context.
	- Also supports color codes.
- `requirements` (array)
	- List of requirement objects. All must pass.
	- Empty array `[]` means always eligible.
- `release_date` (string)
	- Content metadata/date marker (not currently enforced by logic).

### Requirement Types

Supported requirement objects:

- `{"type": "money_cents", "min": <number>, "max": <number>}`
	- Uses player pouch money (`getMoneyInPouch`).
- `{"type": "factions", "id": <factionId>, "min": <number>, "max": <number>}`
	- Uses `player.getFactionPoints(id)`.
- `{"type": "quests_completed", "id": <questId>}`
	- Requires `player.hasFinishedQuest(id) == true`.
- `{"type": "quests_uncompleted", "id": <questId>}`
	- Requires `player.hasFinishedQuest(id) == false`.
- `{"type": "max_jobs_accumulated_at_once", "min": <number>, "max": <number>}`
	- Uses `getMaxJobsAccumulatedAtOnce(player)` from `utils_jobs.js`.
	- Compares against the highest number of jobs the player ever held concurrently.
	- `min` and `max` are optional and can be used independently.

Unknown requirement types currently pass by default.

## Admin Tips

- To force any tip to pass requirement checks for testing, hold `mts:ivv.idcard_seagull` in your offhand.
- After login, wait 60 seconds for the timer-based message.
- Keep `requirements` explicit for quest tips (`quests_uncompleted` is recommended for one-time discovery quests).
- If no eligible tip is found after retries, no message is sent.

## Example Tip Entry

```json
{
	"name": "Valencian Fire Zest",
	"display": "§6§lTaste test challenge!§r §eA hyper-energetic teen in Citrus Alley dares you to try Café Valencia's legendary drink.",
	"description": "§7Find §dMira Ventroli §7near the plaza, then head to §6Café Valencia§7 between the hotel and hall.",
	"requirements": [
		{
			"type": "quests_uncompleted",
			"id": 158
		}
	],
	"release_date": "26/08/2025"
}
```

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
