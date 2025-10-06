I am working on the 10h onboarding process - the first 10h of Gramados for new players. Here is the phase 0:

Phase 0 : Immigrant Office - DONE

Phase 1 : State Hotel
Phase 1 happens inside the State Hotel. The player moves from guided exploration to complete freedom.

- Arrival at the State Hotel
  - Player appears in the hotel’s entrance hall.
  - Chat hint about how you have been assigned a room. Find it to settle in.
  - Player is confined within the hotel (-1858 72 -175 to -1934 108 -214), free to explore the corridors and floors.
  - Every 10 minutes (configurable), a reminder displays the assigned room number.

- Finding the Room
  - Player explores until entering their personal room (region).
  - Upon entry, confinement activates — player cannot leave the room until setup is complete.

- Initial Setup
  - Player receives basic random furniture (bed, storage, table - random colors/materials - from loot table).
  - Chat message asking him to place his furniture and make the space his.

- Home Registration
  - After a 20 second timer, chat prompt asking the player to run `!setHome` to register the room as home.
  - Player runs `!setHome`.
  - Message confirms registration of home.
  - Confinement is lifted.

- The Lost Moment – !home Tutorial
  - Player is teleported to a remote roadside area or near a broken hut. (configurable coordinates)
  - A confined radius prevents wandering away.
  - Chat prompt he got lost and lost all notion of direction. He must use !home to return to his room.
  - Reminder repeats every 10 minutes (same config as previous) until the command is used.
  - Player runs `!home` → teleported back home (for free).

- Completion
  - Final message about how he can also run !myHomes to view his list of homes. By default, he can set up to 2 homes.
  - All confinement lifted.
  - **End of Phase 1.**
