# Vehicle Registration

Admin NPC tool to create or update vehicle registrations from either vehicle items or OG car papers.

When a player interacts with this NPC while holding `mts:ivv.idcard_seagull` in offhand, the script reads the mainhand item and builds a registration payload. It then checks if the plate already exists in the registry and either updates the existing entry (merge) or creates a new one.

## Behavior

- Requires offhand admin card: `mts:ivv.idcard_seagull`.
- If main hand is empty, the script shows an error and stops.
- Supported mainhand inputs:
  - Vehicle item with NBT (`isItem_Vehicle`) → builds registration via `assembleRegistrationFrom_Vehicle`.
  - Car paper item (`variedcommodities:letter` from config) that passes `isItem_CarPaperOG` → builds registration via `assembleRegistrationFrom_OGpapers`.
- If the plate is already licensed in `world/customnpcs/scripts/data_auto/licensed_vehicles.json`:
  - loads existing entry,
  - merges new data into existing data with `mergeRegistrationData`,
  - updates the stored registration with `updateRegistration`.
- If the plate is not licensed:
  - attempts to register with `registerPlate`.
  - on failure, attempts fallback merge with the most recent plate entry (`getMostRecentPlate` + `mergeRegistrationData` + `updateRegistration`).
- The script prints registration details to chat using `tellRegisterationDetails` during processing.

## Configuration

File: `world/customnpcs/scripts/ecmascript/modules/vehicle_registration/config.json`

- `engineSystemNames` (string[]): engine `systemName` values used by engine detection utilities.
- `plateSystemNames` (string[]): plate part `systemName` values used by plate detection utilities.
- `carPapers.item_id` (string): item id used to identify car papers (default: `variedcommodities:letter`).
- `carPapers.unknown_value` / `carPapers.na_value`: labels reused by registration assembly utilities.

## Admin Tips

- Hold `mts:ivv.idcard_seagull` in offhand.
- Hold either a vehicle item or OG car paper in main hand.
- Interact with the NPC to process registration.
- Re-using an already licensed plate will update/merge the existing registry entry instead of skipping.

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
