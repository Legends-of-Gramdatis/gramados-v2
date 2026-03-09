# CustomServerTools.js

This script provides various functionalities for managing regions, players, and events on a custom server. It includes commands for interacting with regions, handling player actions, and integrating with external services like Discord.

## Functions

### General Functions

- `getHalfRotation(angle)`
  - Description: Calculates half of the given rotation angle.
  - Parameters: `angle` (number) - The rotation angle.
  - Returns: Half of the rotation angle.

- `clonePlayerAsNpc(player)`
  - Description: Clones a player as an NPC.
  - Parameters: `player` (Player) - The player to clone.
  - Returns: None.

### Initialization and Configuration

- `reloadConfiguration()`
  - Description: Reloads the server configuration.
  - Parameters: None.
  - Returns: None.

- `init(e)`
  - Description: Initializes the script.
  - Parameters: `e` (Event) - The initialization event.
  - Returns: None.

### Event Handlers

- `interact(e)`
  - Description: Handles player interaction events.
  - Parameters: `e` (Event) - The interaction event.
  - Returns: None.

- `scriptCommand(e)`
  - Description: Handles custom script commands.
  - Parameters: `e` (Event) - The command event.
  - Returns: None.

- `slowTick(e)`
  - Description: Handles slow tick events.
  - Parameters: `e` (Event) - The tick event.
  - Returns: None.

- `keyPressed(e)`
  - Description: Handles key press events.
  - Parameters: `e` (Event) - The key press event.
  - Returns: None.

- `blockinteract(e)`
  - Description: Handles block interaction events.
  - Parameters: `e` (Event) - The block interaction event.
  - Returns: None.

- `build(e, placeblock)`
  - Description: Handles block placement events.
  - Parameters: `e` (Event), `placeblock` (Block) - The build event and the block being placed.
  - Returns: None.

- `kill(e)`
  - Description: Handles entity kill events.
  - Parameters: `e` (Event) - The kill event.
  - Returns: None.

- `customChestClicked(e)`
  - Description: Handles custom chest click events.
  - Parameters: `e` (Event) - The chest click event.
  - Returns: None.

- `customChestClosed(e)`
  - Description: Handles custom chest close events.
  - Parameters: `e` (Event) - The chest close event.
  - Returns: None.

- `login(e)`
  - Description: Handles player login events.
  - Parameters: `e` (Event) - The login event.
  - Returns: None.

- `logout(e)`
  - Description: Handles player logout events.
  - Parameters: `e` (Event) - The logout event.
  - Returns: None.

- `pickedUp(e)`
  - Description: Handles item pickup events.
  - Parameters: `e` (Event) - The pickup event.
  - Returns: None.

- `rangedLaunched(e)`
  - Description: Handles ranged weapon launch events.
  - Parameters: `e` (Event) - The launch event.
  - Returns: None.

- `timer(e)`
  - Description: Handles timer events.
  - Parameters: `e` (Event) - The timer event.
  - Returns: None.

- `toss(e)`
  - Description: Handles item toss events.
  - Parameters: `e` (Event) - The toss event.
  - Returns: None.

- `tick(e)`
  - Description: Handles tick events.
  - Parameters: `e` (Event) - The tick event.
  - Returns: None.

- `attack(e)`
  - Description: Handles attack events.
  - Parameters: `e` (Event) - The attack event.
  - Returns: None.

- `broken(e)`
  - Description: Handles block break events.
  - Parameters: `e` (Event) - The break event.
  - Returns: None.

### Discord Integration

- `discordMessage(e)`
  - Description: Handles Discord message events.
  - Parameters: `e` (Event) - The Discord message event.
  - Returns: None.

### Region Management

- `getRegionAtPos(pos, w)`
  - Description: Gets the region at a specific position.
  - Parameters: `pos` (Position), `w` (World) - The position and world.
  - Returns: The region at the specified position.

- `tellPlayer(pl, message)`
  - Description: Sends a message to a player.
  - Parameters: `pl` (Player), `message` (string) - The player and the message.
  - Returns: None.

- `getArgParams(matches)`
  - Description: Parses argument parameters from matches.
  - Parameters: `matches` (array) - The matches array.
  - Returns: Parsed parameters.

- `getTitleBar(title)`
  - Description: Generates a title bar for messages.
  - Parameters: `title` (string) - The title.
  - Returns: The title bar string.

- `genDataPageList(data, matches, show, page, command, itemFunc, sortFunc, filterFunc, desc)`
  - Description: Generates a paginated list of data.
  - Parameters: `data` (array), `matches` (array), `show` (number), `page` (number), `command` (string), `itemFunc` (function), `sortFunc` (function), `filterFunc` (function), `desc` (boolean) - Various parameters for generating the list.
  - Returns: The paginated list string.

- `arrayOccurs(item, list, caseSensitive, exact)`
  - Description: Counts occurrences of an item in a list.
  - Parameters: `item` (any), `list` (array), `caseSensitive` (boolean), `exact` (boolean) - The item, list, and options.
  - Returns: The count of occurrences.

- `getAmountCoin(amount)`
  - Description: Converts an amount to a coin string.
  - Parameters: `amount` (number) - The amount.
  - Returns: The coin string.

- `getTimeString(time, units)`
  - Description: Converts a time value to a string.
  - Parameters: `time` (number), `units` (array) - The time and units.
  - Returns: The time string.

- `normalizePos(pos)`
  - Description: Normalizes a position.
  - Parameters: `pos` (Position) - The position.
  - Returns: The normalized position.

- `executeCommandGlobal(command)`
  - Description: Executes a global command.
  - Parameters: `command` (string) - The command.
  - Returns: None.

- `parseEmotes(msg)`
  - Description: Parses emotes in a message.
  - Parameters: `msg` (string) - The message.
  - Returns: The message with parsed emotes.

- `getDateString(time)`
  - Description: Converts a timestamp to a date string.
  - Parameters: `time` (number) - The timestamp.
  - Returns: The date string.

- `strf(msg)`
  - Description: Formats a string.
  - Parameters: `msg` (string) - The message.
  - Returns: The formatted string.

### Region Commands

- `!region create <regionName>`
  - Description: Creates a new region with the specified name.
  - Parameters: `regionName` (string) - The name of the region.
  - Returns: None.

- `!region select <regionName>`
  - Description: Selects a region for editing.
  - Parameters: `regionName` (string) - The name of the region.
  - Returns: None.

- `!region setOwner <name> [player]`
  - Description: Sets the owner of a region.
  - Parameters: `name` (string), `player` (string) - The region name and player name.
  - Returns: None.

- `!region setPrio <name> <priority>`
  - Description: Sets the priority of a region.
  - Parameters: `name` (string), `priority` (number) - The region name and priority.
  - Returns: None.

- `!region setForSale <name> <forSale>`
  - Description: Sets a region for sale.
  - Parameters: `name` (string), `forSale` (boolean) - The region name and sale status.
  - Returns: None.

- `!region setRentTime <name> <time>`
  - Description: Sets the rent time for a region.
  - Parameters: `name` (string), `time` (string) - The region name and rent time.
  - Returns: None.

- `!region setRentPrice <name> <price>`
  - Description: Sets the rent price for a region.
  - Parameters: `name` (string), `price` (number) - The region name and rent price.
  - Returns: None.

- `!region setSaleType <name> <saleType>`
  - Description: Sets the sale type for a region.
  - Parameters: `name` (string), `saleType` (string) - The region name and sale type.
  - Returns: None.

- `!region remove <name>`
  - Description: Removes a region.
  - Parameters: `name` (string) - The region name.
  - Returns: None.

- `!region list`
  - Description: Lists all regions.
  - Parameters: None.
  - Returns: None.

- `!region info <regionName>`
  - Description: Displays information about a region.
  - Parameters: `regionName` (string) - The name of the region.
  - Returns: None.

- `!region unpaid [...matches]`
  - Description: Lists unpaid regions.
  - Parameters: `matches` (array) - The matches array.
  - Returns: None.

- `!region buy <name>`
  - Description: Buys a region.
  - Parameters: `name` (string) - The region name.
  - Returns: None.

- `!region rent [name] [...matches]`
  - Description: Rents a region.
  - Parameters: `name` (string), `matches` (array) - The region name and matches array.
  - Returns: None.

- `!myRegions [...matches]`
  - Description: Lists the player's regions.
  - Parameters: `matches` (array) - The matches array.
  - Returns: None.

## Classes

### Region

- `Region(name)`
  - Description: Represents a region.
  - Parameters: `name` (string) - The name of the region.
  - Methods:
    - `init(data)`
      - Description: Initializes the region with data.
      - Parameters: `data` (object) - The data object.
      - Returns: The initialized region.
    - `load(data)`
      - Description: Loads the region data.
      - Parameters: `data` (object) - The data object.
      - Returns: None.
    - `save(data)`
      - Description: Saves the region data.
      - Parameters: `data` (object) - The data object.
      - Returns: None.
    - `remove(data)`
      - Description: Removes the region.
      - Parameters: `data` (object) - The data object.
      - Returns: None.
    - `set(key, value)`
      - Description: Sets a property of the region.
      - Parameters: `key` (string), `value` (any) - The property key and value.
      - Returns: The region.
    - `getRentTimeLeft()`
      - Description: Gets the remaining rent time.
      - Parameters: None.
      - Returns: The remaining rent time.
    - `getAllDataEntries(data)`
      - Description: Gets all data entries for the region.
      - Parameters: `data` (object) - The data object.
      - Returns: An array of data entries.
    - `getAllDataIds(data)`
      - Description: Gets all data IDs for the region.
      - Parameters: `data` (object) - The data object.
      - Returns: An array of data IDs.
    - `addCoord(pos)`
      - Description: Adds a coordinate to the region.
      - Parameters: `pos` (Position) - The position.
      - Returns: The region.
    - `hasCoord(pos)`
      - Description: Checks if the region has a specific coordinate.
      - Parameters: `pos` (Position) - The position.
      - Returns: Boolean indicating if the region has the coordinate.
    - `getPermission()`
      - Description: Gets the region's permission.
      - Parameters: None.
      - Returns: The permission object.

### Player

- `Player(name)`
  - Description: Represents a player.
  - Parameters: `name` (string) - The name of the player.
  - Methods:
    - `init(data)`
      - Description: Initializes the player with data.
      - Parameters: `data` (object) - The data object.
      - Returns: The initialized player.
    - `save(data)`
      - Description: Saves the player data.
      - Parameters: `data` (object) - The data object.
      - Returns: None.

## Constants

- `SCRIPT_VERSION`
  - Description: The version of the script.
  - Value: "%__FILENAME__%"

- `SLOWTICK_TIMER_ID`
  - Description: The ID for the slow tick timer.
  - Value: 1

- `SLOWTICK_TIMER`
  - Description: The interval for the slow tick timer.
  - Value: 100

## External Integrations

- `ScriptHooks`
  - Description: Hooks for external scripts.
  - Value: `Java.type('com.gramdatis.server.script.ScriptHooks').INSTANCE`

## Error Handling

- `try...catch`
  - Description: Handles errors in script execution.
  - Parameters: `e` (Error) - The error object.
  - Returns: None.

## Usage

To use this script, place it in the appropriate directory and ensure it is loaded by the server. The script provides various commands and event handlers to manage regions, players, and interactions on the server. Refer to the function and command descriptions for detailed usage information.

## Example

```javascript
// Example of creating a region
!region create MyRegion

// Example of setting a region for sale
!region setForSale MyRegion true

// Example of renting a region
!region rent MyRegion

// Example of listing all regions
!region list
```

