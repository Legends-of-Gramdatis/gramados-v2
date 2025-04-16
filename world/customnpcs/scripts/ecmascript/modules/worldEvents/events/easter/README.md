# Easter Egg Hunt Event (In Development)

The Easter Egg Hunt event brings a festive atmosphere to the Gramados server with collectible eggs, unique rewards, and whimsical interactions.

## Features

- **Egg Spawning**: Randomly spawns collectible eggs around players.
- **Player Interaction**: Players can collect eggs using special tools.
- **Starter Pack**: New participants receive a starter pack with tools and treats.
- **Dynamic Egg Types**: Eggs come in three types: Spring, Chromashell, and Encrypted, each with unique mechanics and rewards.

## How It Works

1. **Event Activation**:
   - The event is active from March 14 to March 21, as defined in `event_config.json`.

2. **Egg Spawning**:
   - Eggs spawn randomly around players in clusters.
   - Different egg types have varying rarities and rewards.

3. **Player Interaction**:
   - Players use a special scoop tool to collect eggs.
   - Collected eggs are tracked in player-specific data.

4. **Starter Pack**:
   - New participants receive a starter pack containing a scoop tool and chocolate.

5. **Egg Types**:
   - **Spring Eggs**: Common and cheerful, opened by Eggcrack Confectioners.
   - **Chromashell Eggs**: Uncommon and magical, opened by Aetheric Botanists.
   - **Encrypted Eggs**: Rare and mysterious, opened by Eggcryption Technicians.

6. **Logging**:
   - All egg spawns and player interactions are logged for tracking purposes.

## Files

- **`easterEggHuntEvent.js`**: Handles egg spawning and player interactions.
- **`easterEggNpc.js`**: Defines the behavior of Easter Egg NPCs.
- **`NPCeggcracker.js`**: Manages interactions with NPCs that open eggs based on their type.
- **`GiantEggInteractionPlaceholder.js`**: Placeholder script for interactions with giant eggs.

## Configuration

The event's date range is defined in `event_config.json`:

```json
{
    "name": "Easter Egg Hunt",
    "startDate": {
        "month": 3,
        "day": 14
    },
    "endDate": {
        "month": 3,
        "day": 21
    }
}
```

## Future Improvements

- Add more egg types with unique rewards.
- Implement leaderboards for egg collection.
- Enhance NPC interactions with additional dialogue and effects.

## Credits

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
