# How to Set Up a Secured Facility (Bank, Server Room, Vault, Lab, Stock Room)

Follow this guide to create a secured facility using the BankVault module. The process involves defining a secured zone, a gate, spawning a guard NPC, and placing rack/vault NPCs. While this guide uses banks as examples, the same flow applies to server rooms, mafia vaults, laboratories, and shop stock rooms.

---

## 1. Define the Zones

### Secured Zone
- **Purpose**: The main area where unauthorized players are not supposed to enter.
- **Setup**:
  - Define two positions (`pos1` and `pos2`) to create a cuboid zone.
  - These positions can be in any order; the system will automatically calculate the boundaries.
  - All facility NPCs (e.g., guards and racks/vaults) **must** be spawned within this zone.

### Gate Zone
- **Purpose**: The entry point to the vault or vault area.
- **Setup**:
  - Define two positions (`pos1` and `pos2`) for the gate surface.
  - The gate can lead directly to the vault/room or to an intermediate area (e.g., an office leading to vaults).
  - Example:
    - **Goldincina Bank**: A large gate leading to an office, which then leads to two vaults.
  - **Springfield Bank**: A small door directly leading to the vault.
  - Server rooms: a glass/iron door panel sealing a racks corridor.

---

## 2. Spawn the Gate Guard (NPC)

- **Purpose**: Controls access by opening the gate on death and closing it on respawn.
- **Steps**:
  1. Use the **NPC Cloner (Tab 2)** to spawn a **Gate Guard** within the secured zone. This can be a humanoid guard, a robot, or a control panel-looking NPC that you must “break”.
  2. Edit the NPC as needed (e.g., appearance, name).
  3. **Kill the NPC**:
    - On death, the gate will open, allowing access to the facility interior.
     - The gate will remain open for a duration based on the guard's respawn time.
  4. When the NPC respawns:
    - The gate will automatically close.
    - Interactions will be frozen; players must leave the secured zone or take down the guard again to resume interactions.


## 3. Spawn the Racks / Vaults

- **Purpose**: Represents the lootable storage units inside the secured zone.
- **Steps**:
  1. Use the **NPC Cloner (Tab 2)** to spawn **Rack/Vault NPCs** within the secured zone.
  2. Configure the rack type using a **command block**:
     - Current options:
       - **Bill Rack**: Money
       - **Gold Rack**: Gold ingots
       - **Safe**: Other valuable loot
       - **Server Rack**, **Server Secure Rack**, **Server Strong Rack**: Software disks (increasing security tiers)
  3. The rack/vault NPCs will automatically link to the facility based on their location within the secured zone.
  4. Interaction model:
     - Racks can only be interacted with while the guard is down and the gate is open.
     - You can either loot (multiple layers) or disable security (hacking locks, casing/armor) depending on rack type.


## 4. Verify the Setup

- Ensure all NPCs (guards and racks) are within the secured zone.
- Test the gate functionality:
  - Kill the guard to open the gate.
  - Wait for the guard to respawn to confirm the gate closes and looting freezes.
- Test the vaults:
  - Interact with them to verify they are functioning as intended.


## Additional Notes

- The **secured zone** and **gate zone** are defined in the `banks_data.json` file. The system automatically updates this file when NPCs are spawned.
- Players trapped behind the gate after the guard respawns must either die or reopen the gate to exit.
- Use tools like clocks, crowbars, or phones to interact with the bank system for additional information or functionality.
- The sound effects during the gate open period are dynamically adjusted based on the guard's respawn time, replacing the previous hardcoded 2:30 minutes.

### Server Rack Notes
- Server racks are a family of rack types added for use in banks and regular server rooms.
- They currently drop different tiers of software disks; a broader economy around these disks is planned.
- Community input is welcome for new rack types (e.g., a gun rack requires a proposed loot table and balance suggestions).

### Current Limitations
- A guard NPC and a gate are required for interactions. This may become configurable in the future.

---

That's it! Your new bank is now set up and ready to function on the Gramados server.
