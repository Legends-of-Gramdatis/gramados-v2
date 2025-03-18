# Lumberyard Module

This module is an unfinished project aimed at creating a new, engaging starter job for the Gramados modded Minecraft RP server (1.12.2). The goal is to rework the current lumberyard system to provide a dynamic and immersive experience for players.

## Current State

The module currently includes a script (`tree_generator.js`) that allows for the generation of various tree types. The script includes functionality for:

- **Tree Generation**: Randomly spawns different types of trees (e.g., tall oak, pine, sequoia, cedar) based on predefined algorithms.
- **Custom Terrain Interaction**: Placeholder logic for interacting with the terrain where trees are grown.
- **Dynamic Tree Growth**: Trees are generated with varying sizes and shapes based on quality parameters.
- **Scripted Interactions**: Players can interact with scripted blocks or items to trigger tree generation.

While the script provides a foundation for tree generation, it lacks integration with the broader job system and terrain management features.

## Future Plans

The Lumberyard module aims to introduce a more complex and rewarding gameplay loop for the Lumberjack starter job. Key features planned for future development include:

1. **Dynamic Terrain Management**:
   - Introduce local terrain variables such as acidity, fertility, and other soil properties.
   - Allow trees to consume or produce these variables, dynamically altering the land's quality.

2. **Tree Growth Conditions**:
   - Implement species-specific growth requirements based on terrain variables.
   - Design trees with high tolerance for starter jobs but reward players with massive trees when the land is optimized for specific species.

3. **Chemical Integration**:
   - Explore the possibility of adding chemicals to modify terrain variables.
   - Allow players to strategically enhance or degrade the land to grow specific tree types.

4. **Job Integration**:
   - Connect the Lumberyard module to the Gramados job system for seamless job assignment and progression.
   - Track player contributions to the lumberyard and reward them accordingly.

5. **Visual and Gameplay Enhancements**:
   - Add visual indicators for terrain quality and tree growth stages.
   - Create a more interactive and visually appealing lumberyard environment.

6. **Expanded Tree Generation**:
   - Introduce more tree generation types to diversify gameplay.
   - Adopt a **data-driven approach** for tree generation:
     - Separate "trunk" and "leaf" generation functions to allow modularity.
     - Define new tree species in a JSON format, specifying trunk and leaf generation functions.
     - Allow manual selection of Minecraft log and leaf block types (vanilla or modded) for each species.
     - Enable easy modification for the soil quality requirements of each species.

## How It Will Work

1. **Terrain Initialization**:
   - Each lumberyard will have predefined terrain variables that players can view and manage.

2. **Tree Planting and Growth**:
   - Players will plant trees that interact with the terrain variables.
   - Trees will grow dynamically based on the terrain's suitability for their species.

3. **Resource Management**:
   - Players will need to balance tree planting with terrain management to maximize productivity.
   - Chemicals or other tools may be introduced to aid in terrain optimization.

4. **Job Rewards**:
   - Players will earn rewards based on their contributions to the lumberyard and the quality of trees grown.

5. **Data-Driven Tree Generation**:
   - Tree species will be defined in JSON, allowing easy customization and addition of new species.
   - Modular trunk and leaf generation functions will enable flexible combinations for unique tree designs.

## Challenges and Considerations

- Balancing the complexity of terrain variables to ensure the system remains accessible to new players.
- Ensuring compatibility with the existing job system and server mechanics.
- Providing clear feedback to players about terrain quality and tree growth conditions.
- Designing a user-friendly JSON structure for defining tree species.

## Future Improvements

- Add support for advanced tree species and rare rewards for optimized terrain.
- Implement a GUI for managing terrain variables and tracking progress.
- Introduce multiplayer collaboration features for shared lumberyards.

## Credits

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
