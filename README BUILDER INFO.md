# Building in Gramados Server

Welcome to the Gramados Server, a modern RP (Role-Playing) environment where players can start their journey with simple jobs, earn cash, and eventually own industries or farms. Established in 2015 and continuously developed since 2017, Gramados offers a stable and long-term platform for building, exploring, and enjoying the game.

## Becoming a Gramados Builder

If you're interested in building and are a trustworthy player, you can become a Gramados Builder. Here's what you can do:

- Construct various buildings in existing towns, villages, and countryside areas.
- Build new roads to expand the map.
- Populate roads with gas stations, hotels, farms, and other structures.

### Gramados Builder Lord

For those with grander ambitions, you can become a Gramados Builder Lord, creating your own town with your own rules, as long as they are conventional*.

## Building Guidelines

### Roads

- **No Dead Ends:** Ensure roads have a purpose and destination. Avoid ending roads abruptly in the middle of nowhere. Consider looping roads back onto themselves or connecting them to a structure.
- **Clean Roads:** Avoid floating roads. Except for bridges, solidify the base with retaining walls. For curved roads, use retaining walls on the sides.
- **Road Convention:** Use the FVTM mod for road construction unless building grids or driveways. Common road types include:
  - **Standard Road:** 5-block wide lanes with white lines between lanes and on each side. Add a gravel layer on each side if there are no sidewalks or walls.
  - **Thin Roads:** (Specific details to be confirmed)

### Map Respect

- **Respect the Topology:** Avoid large-scale flattening of terrain. Build on flat ground if needed. If terraforming is necessary, ensure it is well-crafted and blends naturally.
- **Retaining Walls:** For flat land on steep surfaces, build retaining walls that are visually appealing and fitting to the environment.

### Other Guidelines

- **Approval for Big Projects:** Obtain approval for large structures or projects.
- **Navigable and Presentable:** Ensure unfinished areas remain navigable and visually appealing. If you leave a building incomplete, cover facades with black blocks and add roofs to avoid open interiors.
- **Dynmap Updates:** Notify @theoddlyseagull about new government, cultural, service centers, shops, garages, and restaurants to update the dynmap, even if interiors are not yet completed.

## Gramados Builder Lords

For those creating their own towns or villages, follow these guidelines:

### Mandatory Requirements

- **Free Area:** Confirm the area is available for building to avoid conflicts with planned developments.
- **Road Link:** Ensure your town is connected to the existing road network. If necessary, build a connecting road.
- **Government Approval:** Plan or build a town hall for your new settlement.
- **Local Services:** For settlements larger than a hamlet, build a multi-service center with a fire department, police station, and healthcare facility. This can be a compact structure accommodating at least one vehicle per service.

### Recommendations

- **Minimum Services:** For settlements larger than a hamlet, include the following:
  - Fuel station
  - Restaurant
  - Furniture shop
  - Garage
  - Post office

- **Lore:** Adding lore to your settlement enhances the experience for players, giving your town or village a rich history and depth.

By following these guidelines, you'll contribute to the vibrant and dynamic world of Gramados, making it a better place for everyone. Happy building!

# Renovation in Gramados Server

As a builder in the Gramados Server, you have the opportunity to renovate existing structures. A house or building owner may request a renovation, here's what the owner can ask for:
- replacement of the color palette of a structures
- replacement of windows
- replacement of doors
In a renovation, you need to keep the original chiseled variant of the block, and you can't change the structure's shape.
The renovation has a price:
- for each block replaced, the builder receives 100 grons
- for each window replaced, the builder receives 200 grons
- for each door replaced, the builder receives 1000 grons
Over a rnovation price of 50000 grons, the door replacement is free.
The builder is responsible for the renovation, and may get sued if the renovation is not according to the rules above.




# Setting Up a new Region in Gramados Server

A region in gramados is an area of the map that can be owned by aplayer. A region can be a house, a building, a factory, a field, or even a garden. A region can be given a price, and a sale type (rent or buy).
To set up a new region, here are the steps:

### Step 1: finding a name
Each region has a name, usually based on its adress, but it could also be a lieu-dit.
The region name is unique, and can't be changed once set.
Usually, this is how a region name is set:
Region_Town/Independent_Street_HouseNumber(_Extra)
For example, an appartment in the town of Gramados, on the street of GrolaSTreet, in the appartment 3 of the floor 2 of the building number 12, would be named:
Gramados_GramadosCity_GrolaStreet_12_F2A3

### Step 2: setting the region
First, now that you have the name, you need to create the region. To do so, use the command:
```
!region create <regionName>
```
Then, in the apartment, you will have to manually set the region, using the command:
```
!region select <regionName>
```
The region is selected in multiple cuboids, you have to run the command in both opposite corners of the cuboids. The script will automatically consider the second command as the second corner of the cuboid. You can then select another cuboid for teh same area. Repeat the process until the whole region is selected, including exteriors.
When selecting cuboids, here are rules to follos:
- Inner walls of the region are selected
- Outer walls of the region are not selected
- Floors are selected
  - If between 2 stories of a building is a 1 block thickness (ceiling of the story beneath, and floor of the story above are the same block), you shouldn't select the floor.
  - If between 2 stories of a building is a 2 block thickness (ceiling of the story beneath, and floor of the story above are different blocks), you should select the floor.

### Step 3: setting the region types
In one region, sometimes you might have multiple cuboids with different types, for example, have a cuboid that is part of garden, one that is a field, and one that is the standard interior.
This can be done either by directly using teh commands, or using the clickable chat. It's easier and recommended to use the clickable chat.
Start by running the command:
```
!region info <regionName>
```
Here you will have this in chat:
```
Region ID: <regionName>
Permission ID: <regionPermission>
Owner: Gramados
Priority: 0 [EDIT]
Sale Info [Sale Settings]
Open Interact: X No [Enable]
Open Build: X No [Enable]
Position List: [Show List]
```
Click on the [Show List] button, and you will have this in chat:
```
[...]
Position List: (Clear)
- #0 [Info] [X Remove]
- #1 [Info] [X Remove]
- #2 [Info] [X Remove]
- #3 [Info] [X Remove]
- ...
```
Here, you can easily edit every cuboid of the region, by clicking on the [Info] button. You will have this in chat:
```
[...]
Num: #0
- XYZ1: [...] [Teleport]
- XYZ2: [...] [Teleport]
- Type: none [Set]
```
Click on the [Set] button, and it will prefill your chat line with the command to set the type of the region. You can then change the type of the region, by running the command. Here are the types of regions:
- none: standard interior
- garden: a garden
  - A garden is a region that is outside. It only lets exterior furniture and machinery to be placed.
- field: a field
  - A field is a region that is outside. It only lets crops or saplings to be placed.
- lumber: a lumber area
  - A lumber area is a region that is outside. It only lets saplings to be placed, and tree related blocks.
- hotel: a hotel room 
  - A hotel room is a region that is inside. It prevents the owner / renter to place anything, but allows any access to the room and storage.

### Step 4: setting the region priority
The region priority is the priority of the region in the list of regions. The higher the priority, the higher the region will be in the list. The priority is used to determine which region is selected when 2 regions overlap.
To set the priority of a region, you can also use the clickable chat. Like previously, run the command:
```
!region info <regionName>
```
Then click on the [EDIT] button after the Priority line, and it will prefill your chat line with the command to set the priority of the region. You can then change the priority of the region, by running the command. It is recommended to set the priority of the region to 2, unless you have a good reason to set it otherwise.

### Step 5: setting the region sale price and type
The region can be sold or rented. To set the sale price and type of the region, you can also use the clickable chat. Like previously, run the command:
```
!region info <regionName>
```
Then click on the [Sale Settings] button, and you should see this in chat:
```
[...]
Sale Type: buy [Switch to rent]
For Sale: [X No] [Enable]
Sale Price: 0 [Change]
```
Click on the [Change] button after the Sale Price line, and it will prefill your chat line with the command to set the sale price of the region. You can then change the sale price of the region, by running the command.
Then, click on the [Enable] button after the For Sale line, it will allow any player to buy or rent the region. If you want to rent the region, click on the [Switch to rent] button after the Sale Type line, it will change the sale type to rent.