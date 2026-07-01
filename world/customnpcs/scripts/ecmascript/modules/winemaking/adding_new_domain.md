# Adding a New Wine Domain

This guide explains how to add a new domain to the winemaking module and what the scripts do for you automatically.

## What the module expects

Each domain is stored in `domains.json` under `domains` with a unique key such as `domain_4`. The live scripts read these fields:

- `display_name`
- `owner`
- `value`
- `reputation`
- `bottle_variety`
- `last_sale_date`

The shelf script links a shelf to a domain by matching the player name against `owner`. The export script reads the same JSON when it prices wine.

## Step by step

1. Open `world/customnpcs/scripts/ecmascript/modules/winemaking/domains.json`.
2. Add a new entry under `domains` with a unique key.
3. Fill in the domain name and owner name exactly as they should appear in game.
4. Set the numeric fields before saving.
5. Save the file.
6. Place or reload the wine aging shelf for that owner, then interact with it once so the script can link the shelf to the domain.

Example:

```json
{
  "domains": {
    "domain_4": {
      "display_name": "Rosehill Wine Domain",
      "owner": "PlayerName",
      "value": 100000,
      "reputation": 1,
      "bottle_variety": [],
      "last_sale_date": 0
    }
  }
}
```

## What is automated

- The wine aging shelf automatically looks up the owner in `domains.json` and stores the matching `display_name` on the block.
- Once the shelf has a domain, later interactions use that saved value.
- The export NPC reads the same domain file when it calculates wine value.

## What is not automated

- The module does not create a new domain entry for you.
- The module does not rename or validate the owner field.
- The module does not fill in a new domain’s value, reputation, or sale history.
- The legacy `createDomain()` helper in `wine_export_wholesale.js` is not part of the live domain setup flow, so do not rely on it to write data into `domains.json`.

## Important notes

- Use the exact player name in `owner`.
- Keep domain keys unique.
- If the owner does not exist in `domains.json`, the shelf will fall back to `No Domain`.
- If you want a shelf to point at a different owner later, update `domains.json` and re-interact with the shelf.
