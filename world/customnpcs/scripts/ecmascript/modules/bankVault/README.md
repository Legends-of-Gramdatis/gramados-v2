# BankVault Module (Secured Facilities)

The `bankVault` module powers generic secured facilities across the server (not just banks). Pattern: define a secured zone and a gate, place a guard NPC (can be a person, a robot, or a control‑panel themed NPC), then populate the zone with configurable lootable racks.

---

## Features

1. Secured zones
   - Define a no‑go area with two corners (`pos1`, `pos2`).
   - All related NPCs must be inside this zone.

2. Gate guards (required for now)
   - The guard’s death opens the gate; respawn closes it and freezes interactions.
   - Guard can be skinned as a terminal/panel; functionally it’s still an NPC.

3. Racks / vaults
   - Lootable storage NPCs inside the zone; interact only while gate is open.
   - Types (extensible): `Bill Rack`, `Gold Rack`, `Safe`, `Server Rack`, `Server Secure Rack`, `Server Strong Rack`.

4. Time‑based SFX
   - During gate open, sounds scale with the guard’s respawn time (faster ticks, end‑alarm).

5. Security layers
   - Loot or disable security (hacking lock, casing/armor) depending on rack type.

6. Unlinking
   - Use a `minecraft:barrier` on a guard or vault NPC to unlink it from any facility.

7. Player tooling
   - Phones, clocks, crowbars provide info or actions depending on context.

---

## Files

- `bank_guard_npc.js` — Gate control, sounds, unlink behavior.
- `bankSafeNPC.js` — Rack behavior, refill, security layers, admin operations.
- `banks_data.json` — Facilities registry: zones, gates, runtime state.

---

## How it works

1) Initialization
- NPCs auto‑link to a facility based on position within a secured zone.
- Missing facilities are registered in `banks_data.json`.

2) Gate control
- Kill the guard → gate opens for `respawnTime` seconds; respawn closes it.

3) Refill and security
- Racks refill over time (see `regen_cooldown` in code) and expose hacking/casing layers per type.

4) Unlink
- Use `minecraft:barrier` to clear stored linkage on an NPC.

---

## Configuration (banks_data.json)

Per‑facility entry fields:
- `bankName` (string): Logical name of the facility.
- `pos1`, `pos2` (object): Zone corners `{x,y,z}`; order is arbitrary.
- `gate.pos1`, `gate.pos2` (object): Gate surface corners.
- `gate.block.id` (string), `gate.block.data` (int): Closed‑gate block id/data.
- `noCarRadius` (int, default 0): Radius to deter vehicles near the guard.
- `factionRepMode` ("increase"|"decrease"): Reputation mode on looting.
- `factionRepFactionId` (int): Faction affected.
- `isVaultGateOpened` (bool): Runtime; managed by scripts.
- `vaultGateOpenTime` (long ticks): Runtime; managed by scripts.

Other tunables are in code:
- Guard respawn: `npc.getStats().getRespawnTime()` controls open window.
- Rack refill cadence: `regen_cooldown` in `bankSafeNPC.js`.

---

## Admin Tips

- Offhand ID Card: hold `mts:ivv.idcard_seagull` in offhand when interacting with rack NPCs to access admin‑only actions.
- Actions (main hand):
  - `minecraft:command_block` on rack NPCs: cycle rack type or configure (admin‑only, behind ID card).
  - `minecraft:barrier` on guard or rack: unlink from facility and clear stored data.
  - `variedcommodities:phone` on guard: print facility gate info (positions, block) to chat.
- Placement: ensure guards and racks are spawned within the secured zone or they won’t link.

---

For step‑by‑step setup, see the [setup guide](./setup_guide.md).

---

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
