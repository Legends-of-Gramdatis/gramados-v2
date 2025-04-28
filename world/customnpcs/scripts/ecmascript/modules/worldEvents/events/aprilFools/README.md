# April Fools Event

The April Fools event introduces chaos and hilarity to the Gramados server with the appearance of "Sus Boxes"—mysterious entities that spawn around players.

## Features

- **Sus Box Spawning**: Randomly spawns "Sus Boxes" near players during the event.
- **Player Interaction**: Players can interact with "Sus Boxes" for unpredictable outcomes.
- **Cleanup Mechanism**: Automatically despawns "Sus Boxes" when players leave, die, or after a set interval.
- **Logging**: Tracks all "Sus Box" spawns, interactions, and cleanups for debugging and analytics.

## How It Works

1. **Event Activation**:
   - The event is active from March 30 to April 4, as defined in `event_config.json`.

2. **Sus Box Spawning**:
   - "Sus Boxes" spawn randomly around players at intervals.
   - The number of "Sus Boxes" and their spawn radius are configurable.

3. **Player Interaction**:
   - Players receive humorous messages when interacting with "Sus Boxes."
   - "Sus Boxes" despawn when players leave the game, die, or after a set duration.

4. **Logging**:
   - All "Sus Box" spawns, interactions, and cleanups are logged for tracking purposes.

## Files

- **`susBoxEvent.js`**: Handles the spawning, interaction, and cleanup of "Sus Boxes."

## Configuration

The event's date range is defined in `event_config.json`:

```json
{
    "name": "April Fools",
    "startDate": {
        "month": 3,
        "day": 30
    },
    "endDate": {
        "month": 4,
        "day": 4
    }
}
```

## Future Improvements

- Add more interaction mechanics for "Sus Boxes."
- Introduce rewards for players who interact with "Sus Boxes."

## Credits

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
