# BankVault Module

The `bankVault` module is responsible for managing the functionality of banks in the Gramados server. It includes features such as secured zones, vaults, gate guards, and player interactions.

---

## Features

1. **Secured Zones**:
   - Define areas where unauthorized players are restricted.
   - Automatically calculates boundaries based on two positions (`pos1` and `pos2`).

2. **Gate Guards**:
   - NPCs that control access to the vault by opening and closing gates.
   - Gates open when the guard NPC is killed and close upon respawn.

3. **Vaults**:
   - Lootable storage units inside the secured zone.
   - Configurable types: `Gold Rack`, `Bill Rack`, and `Safe`.

4. **Dynamic Timer-Based Sound Effects**:
   - Sound effects during the vault gate open period are now based on the guard's respawn time.
   - Faster ticking sounds play during the last quarter of the respawn time.
   - Alarm sounds play during the last tenth of the respawn time.

5. **Unlinking NPCs**:
   - Use the `minecraft:barrier` item on a guard or vault NPC to unlink it from any bank.
   - This clears all stored data for the NPC, causing it to lose its bank linkage.
   - The NPC will display an error message when interacted with after being unlinked.

6. **Player Interaction**:
   - Players can use tools like clocks, crowbars, and phones to interact with the bank system for additional information or functionality.

---

## File Structure

- **`bank_guard_npc.js`**:
  - Handles the behavior of the gate guard NPC, including gate control, sound effects, and unlinking functionality.
- **`bankSafeNPC.js`**:
  - Manages the vault NPCs, including loot generation, refill mechanics, and unlinking functionality.
- **`banks_data.json`**:
  - Stores configuration data for all banks, including secured zones, gates, and vaults.

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

---

## Configuration

- **Banks Data**:
  - Defined in `banks_data.json`.
  - Includes secured zones, gate positions, and vault configurations.

- **Respawn Time**:
  - Configured per NPC using the `npc.getStats().getRespawnTime()` function.
  - Determines the duration for which the gate remains open.

- **Vault Types**:
  - `Gold Rack`: Contains gold ingots.
  - `Bill Rack`: Contains money.
  - `Safe`: Contains other valuable loot.

---

## Additional Notes

- Ensure all NPCs (guards and vaults) are within the secured zone.
- Use tools like clocks, crowbars, or phones to interact with the bank system for additional information or functionality.
- Players trapped behind the gate after the guard respawns must either die or reopen the gate to exit.
- Use the `minecraft:barrier` item to unlink NPCs from their banks if needed.

---

For detailed setup instructions, refer to the [Setup Guide](./setup_guide.md).
