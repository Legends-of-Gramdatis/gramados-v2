# BankVault Module (Secured Facilities)

The `bankVault` module now powers generic secured facilities across the server (not just banks). It provides a simple, configurable pattern: define a secured zone and a gate, place a "guard" NPC (can be a person, a robot, or even a control-panel-like NPC), and populate the zone with configurable lootable racks.

---

## Features

1. **Secured Zones**:
   - Define areas where unauthorized players are restricted.
   - Automatically calculates boundaries based on two positions (`pos1` and `pos2`).

2. **Gate Guards (Mandatory for now)**:
   - An NPC controls access by opening the gate on death and closing it on respawn.
   - The "guard" may be themed as a panel/terminal you must break; functionally it’s still an NPC.
   - This requirement may become configurable in the future; currently an NPC and a gate are required.

3. **Racks / Vaults**:
   - Lootable storage units inside the secured zone.
   - Interactions are only allowed while the guard is down and the gate is open.
   - Configurable types (extensible):
     - `Bill Rack` (money)
     - `Gold Rack` (ingots)
     - `Safe` (valuables)
     - `Server Rack`, `Server Secure Rack`, `Server Strong Rack` (software disk tiers; foundation for a future in-game software economy)

4. **Dynamic Timer-Based Sound Effects**:
   - Sound effects during the vault gate open period are now based on the guard's respawn time.
   - Faster ticking sounds play during the last quarter of the respawn time.
   - Alarm sounds play during the last tenth of the respawn time.

5. **Security Layers & Actions**:
   - Racks support multiple layers: you can loot, or disable securities such as hacking locks and physical casing/armor.
   - This modular design allows adding new rack types easily (e.g., a pharmacy drug rack or a gun rack).

6. **Unlinking NPCs**:
   - Use the `minecraft:barrier` item on a guard or vault NPC to unlink it from any bank.
   - This clears all stored data for the NPC, causing it to lose its bank linkage.
   - The NPC will display an error message when interacted with after being unlinked.

7. **Player Interaction**:
   - Players can use tools like clocks, crowbars, and phones to interact with the bank system for additional information or functionality.

8. **Generic Usage**:
   - The same pattern can be used for banks, mafia vaults, server rooms, laboratories, shop stock rooms, and more.

---

## File Structure

- **`bank_guard_npc.js`**:
  - Handles the behavior of the gate guard NPC, including gate control, sound effects, and unlinking functionality.
- **`bankSafeNPC.js`**:
  - Manages the vault NPCs, including loot generation, refill mechanics, and unlinking functionality.
- **`banks_data.json`**:
  - Stores configuration data for all banks, including secured zones, gates, and vaults.
   - Although fields are named for "banks" (e.g., `bankName`), they represent any secured facility.

---

## How It Works

1. **Initialization**:
   - NPCs automatically configure themselves based on their location within the secured zone.
   - Banks are registered in `banks_data.json` if they do not already exist.

2. **Gate Control**:
   - Killing the gate guard opens the gate for a duration based on the guard's respawn time.
   - The gate closes automatically when the guard respawns.

3. **Vault Refills**:
   - Vaults refill over time, with the refill rate configurable via the `regen_cooldown` variable.

4. **Sound Effects**:
   - Dynamic sound effects are played during the gate open period, with increasing urgency as the respawn time approaches.

5. **Unlinking NPCs**:
   - Use the `minecraft:barrier` item to unlink an NPC from its associated bank.
   - This clears the NPC's stored data and displays an error message when interacted with.

6. **Server Racks and Software Disks**:
   - The three new server rack types drop different tiers of software disks.
   - A fuller economy around these disks is planned; for now, they act as collectible/placeholder items.

---

## Configuration

- **Banks/Facilities Data**:
   - Defined in `banks_data.json`.
   - Includes secured zone bounds, gate positions and block type, vehicle radius, faction reputation effects, and gate runtime state.
   - Key fields per entry:
      - `bankName`: Logical name of the secured facility (not only banks)
      - `pos1`, `pos2`: Opposite corners of the secured zone
      - `gate.pos1`, `gate.pos2`: Gate surface bounds
      - `gate.block.id`, `gate.block.data`: Block to place for the closed gate
      - `noCarRadius`: Anti-vehicle radius (where applicable)
      - `factionRepMode`, `factionRepFactionId`: Reputation adjustments on looting
      - `isVaultGateOpened`, `vaultGateOpenTime`: Runtime state, managed by scripts

- **Respawn Time**:
  - Configured per NPC using the `npc.getStats().getRespawnTime()` function.
  - Determines the duration for which the gate remains open.

- **Rack Types (current)**:
   - `Bill Rack`: Money
   - `Gold Rack`: Gold ingots
   - `Safe`: Assorted valuables
   - `Server Rack`, `Server Secure Rack`, `Server Strong Rack`: Software disks (increasing security tiers)

---

## Additional Notes

- Ensure all NPCs (guards and racks) are within the secured zone.
- Interactions with racks are only possible while the guard is down and the gate is open.
- Players trapped behind the gate after the guard respawns must either die or reopen the gate to exit.
- Use the `minecraft:barrier` item to unlink NPCs from their banks/facilities if needed.

### Contributing New Racks
- The system is designed to be modular and scalable. Community contributions are welcome.
- Example backlog: a gun rack needs a proposed loot table and balancing input from players with weapon knowledge.

---

For detailed setup instructions, refer to the [Setup Guide](./setup_guide.md).
