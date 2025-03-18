# Gramados Winemaking System

This module implements a winemaking system for the Gramados modded Minecraft RP server (1.12.2). It allows players to age wine, manage wine domains, and export wine for dynamic pricing based on various factors.

## Features

- **Wine Aging**: Players can age wine bottles over time using wine aging shelves.
- **Dynamic Pricing**: Wine prices are calculated based on bottle age, domain reputation, wine variety, and other factors.
- **Domain Management**: Players can own and manage wine domains, which influence wine pricing and reputation.
- **Custom GUI**: Interactive GUIs for wine aging shelves and wholesale export.
- **Data Persistence**: All domain and wine-related data is saved to ensure persistence across server restarts.

## Components

1. **Wine Aging Shelf**:
   - Allows players to store and age wine bottles.
   - Tracks bottle age and updates dynamically based on server time.
   - Provides a GUI for managing stored bottles.

2. **Wine Export Wholesale**:
   - Enables players to sell aged wine bottles.
   - Calculates prices dynamically based on bottle attributes and domain performance.
   - Tracks export history and domain reputation.

3. **Domains**:
   - Players can create and manage wine domains.
   - Domain reputation and variety influence wine pricing.
   - Domains are stored in `domains.json`.

## Files

- **`wine_aging_shelf.js`**: Script for managing wine aging shelves, including bottle storage and aging mechanics.
- **`wine_export_wholesale.js`**: Script for handling wine export and dynamic pricing.
- **`domains.json`**: Stores domain data, including owners, reputation, and wine variety.

## How It Works

1. **Wine Aging**:
   - Players place wine bottles in aging shelves.
   - Bottles age over time, with age tracked in ticks.
   - A GUI allows players to view and retrieve aged bottles.

2. **Wine Export**:
   - Players interact with NPCs to sell aged wine bottles.
   - Prices are calculated based on:
     - Bottle age.
     - Domain reputation.
     - Variety and quality of wine.
     - Total bottles sold by the domain.
   - Exported bottles are removed from the player's inventory.

3. **Domain Management**:
   - Domains are linked to players and aging shelves.
   - Reputation increases with successful exports.
   - Variety and performance improve domain value.

4. **Data Persistence**:
   - Domain data is stored in `domains.json`.
   - Shelf and bottle data are stored in block-specific storage.

## Configuration

### Domain Data

Domains are defined in `domains.json`. Example:

```json
{
    "domains": {
        "domain_1": {
            "display_name": "Seagull's Test Wine Domain",
            "owner": "TheOddlySeagull",
            "value": 100000,
            "reputation": 1,
            "bottle_variety": [],
            "last_sale_date": 2167343852
        }
    }
}
```

### Wine Bottle NBT

Wine bottles store custom NBT data, including:

- **`Age`**: The age of the bottle in ticks.
- **`BottlingDate`**: The date the bottle was created.
- **`Domain`**: The domain associated with the bottle.

## Adding New Domains

1. Add a new domain entry to `domains.json`.
2. Assign the domain to a player or shelf.

## Commands and Debugging

- **Debug Messages**: Scripts use `npc.say` and `event.player.message` for debugging.
- **Error Handling**: Errors such as missing domain data or invalid bottles are communicated to players.

## Future Improvements

- Enhance export tracking with detailed statistics.
- Implement a GUI for domain management and reputation tracking.
- Generalize the system for other types of products (e.g., cheese, beer).

## Credits

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
