# How to Set Up a New Bank on the Gramados Server

Follow this guide to create a new bank on the Gramados server. The process involves defining specific zones, spawning NPCs, and configuring the bank's functionality.

---

## 1. Define the Zones

### Secured Zone
- **Purpose**: The main area where unauthorized players are not supposed to enter.
- **Setup**:
  - Define two positions (`pos1` and `pos2`) to create a cuboid zone.
  - These positions can be in any order; the system will automatically calculate the boundaries.
  - All bank-related NPCs (e.g., guards and vaults) **must** be spawned within this zone.

### Gate Zone
- **Purpose**: The entry point to the vault or vault area.
- **Setup**:
  - Define two positions (`pos1` and `pos2`) for the gate surface.
  - The gate can lead directly to the vault or to an intermediate area (e.g., an office leading to vaults).
  - Example:
    - **Goldincina Bank**: A large gate leading to an office, which then leads to two vaults.
    - **Springfield Bank**: A small door directly leading to the vault.

---

## 2. Spawn the Bank Gate Guard

- **Purpose**: Controls access to the vault by opening and closing the gate.
- **Steps**:
  1. Use the **NPC Cloner (Tab 2)** to spawn a **Bank Gate Guard** within the secured zone.
  2. Edit the NPC as needed (e.g., appearance, name).
  3. **Kill the NPC**:
     - On death, the gate will open, allowing access to the vault.
     - The gate will remain open for a duration based on the guard's respawn time.
  4. When the NPC respawns:
     - The gate will automatically close.
     - Looting will be "frozen," meaning players must leave the secured zone before the guard respawns. If they fail to do so, they must either die or reopen the gate.

---

## 3. Spawn the Bank Vaults

- **Purpose**: Represents the lootable storage units inside the vault.
- **Steps**:
  1. Use the **NPC Cloner (Tab 2)** to spawn **Bank Vaults** within the secured zone.
  2. Configure the vault type using a **command block**:
     - Options:
       - **Bill Rack**: Contains money.
       - **Gold Rack**: Contains gold ingots.
       - **Safe**: Contains other valuable loot.
  3. The vault NPCs will automatically configure themselves based on their location within the secured zone.

---

## 4. Verify the Setup

- Ensure all NPCs (guards and vaults) are within the secured zone.
- Test the gate functionality:
  - Kill the guard to open the gate.
  - Wait for the guard to respawn to confirm the gate closes and looting freezes.
- Test the vaults:
  - Interact with them to verify they are functioning as intended.

---

## Additional Notes

- The **secured zone** and **gate zone** are defined in the `banks_data.json` file. The system automatically updates this file when NPCs are spawned.
- Players trapped behind the gate after the guard respawns must either die or reopen the gate to exit.
- Use tools like clocks, crowbars, or phones to interact with the bank system for additional information or functionality.
- The sound effects during the gate open period are dynamically adjusted based on the guard's respawn time, replacing the previous hardcoded 2:30 minutes.

---

That's it! Your new bank is now set up and ready to function on the Gramados server.
