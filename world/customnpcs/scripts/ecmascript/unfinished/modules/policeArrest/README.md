# Gramados Police Arrest System

This module implements a police arrest system for the Gramados modded Minecraft RP server (1.12.2). It dynamically spawns NPCs to arrest players based on their faction points with the "Criminals" faction.

## Features

- **Dynamic NPC Spawning**: Spawns police officers, SPO units, and dogs based on the player's faction points.
- **Faction-Based Arrests**: Players with high faction points in the "Criminals" faction are targeted for arrests.
- **NPC Types**:
  - Police Officers
  - SPO Units (Shotgun, Light Assault, Sniper)
  - SPO Dogs
- **Arrest Scaling**: The number and type of NPCs spawned scale with the player's faction points.
- **Player Interaction**: Arrested players receive messages and lose faction points upon death.

## NPC Spawn Logic

1. **Faction Points Thresholds**:
   - 1800–2000: Small police team.
   - 2000–2500: Larger police team.
   - 2500–3000: Police team with SPO fireteam.
   - 3000–4000: SPO fireteam and squad.
   - 4000–5000: SPO fireteam and multiple squads.
   - 5000+: SPO platoon.

2. **SPO Units Composition**:
   - Fireteam: Shotguns (75%), Light Assault (25%), 1 Dog.
   - Squad: Shotguns (60%), Light Assault (40%), 1 Dog, optional Sniper.
   - Platoon: Shotguns (50%), Light Assault (33%), Snipers (17%), 2–4 Dogs.

3. **Spawn Behavior**:
   - NPCs spawn near the player within a configurable radius.
   - NPCs are removed upon the player's death.

## Configuration

### NPC Clones

The following NPC clones are used for spawning:

- **Police Arrest Clone**: Standard police officer.
- **SPO dog Arrest Clone**: SPO dog unit.
- **SPO shotgun Arrest Clone**: SPO shotgun unit.
- **SPO light-assault Arrest Clone**: SPO light assault unit.
- **SPO Sniper Arrest Clone**: SPO sniper unit.

### Script Functions

- **`isFriendOfCriminals(event)`**: Checks if a player is friendly to the "Criminals" faction and initiates an arrest.
- **`spawn_arrest(event, player, world, type, count, distance, radius)`**: Spawns NPCs of the specified type near the player.
- **`arrest_plugin_player_death(event)`**: Handles NPC despawning and faction point reduction upon the player's death.

## Commands and Debugging

- **Debug Messages**: The script uses `player.message` for debugging and notifications.
- **Error Handling**: Ensures NPCs spawn only on valid blocks.

## Future Improvements

- Add support for custom arrest scenarios.
- Add arrest logging system for tracking player interactions.

## Credits

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and suggestions.

