# Gramados World Events System

This module implements a dynamic world events system for the Gramados modded Minecraft RP server (1.12.2). It allows for the creation, management, and execution of seasonal and special events.

## Features

- **Event Management**: Supports multiple events with configurable start and end dates.
- **Player Interaction**: Tracks player-specific event data and interactions.
- **Dynamic Event Behavior**: Includes unique mechanics for each event, such as spawning entities, granting rewards, or engaging in boss fights.
- **Logging and Persistence**: Logs event-related actions and persists player data across sessions.

## Event Configuration

Events are defined in the `event_config.json` file. Example:

```json
{
    "events": [
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
        },
        {
            "name": "Easter Egg Hunt",
            "startDate": {
                "month": 3,
                "day": 14
            },
            "endDate": {
                "month": 3,
                "day": 22
            }
        }
    ]
}
```

## Files

- **`worldEventsMain.js`**: Main script for managing world events, including initialization, player interactions, and event-specific logic.
- **`worldEventUtils.js`**: Utility functions for managing events and player data.
- **`event_config.json`**: Stores event definitions and date ranges.
- **`player_event_data.json`**: Tracks player-specific event data.
- **`EasterBunnyBoss.js`**: Manages the Easter Bunny Boss fight mechanics.

## How It Works

1. **Initialization**:
   - Events are loaded from `event_config.json` at startup.
   - Active events are determined based on the current date.

2. **Player Interaction**:
   - Players can interact with event-specific NPCs or objects.
   - Player-specific data is stored in `player_event_data.json`.

3. **Event Execution**:
   - Each event has its own script defining unique mechanics and behaviors.
   - Examples include spawning entities, granting rewards, or triggering special effects.

4. **Logging**:
   - Actions related to events are logged for debugging and tracking purposes.

## Adding New Events

1. Define the event in `event_config.json`.
2. Create a new script for the event in the `events` folder.
3. Use `worldEventUtils.js` for common functionality like date checks and player data management.

## Future Improvements

- Add support for recurring events.
- Implement a GUI for event management.
- Enhance logging with more detailed statistics.

## Credits

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
