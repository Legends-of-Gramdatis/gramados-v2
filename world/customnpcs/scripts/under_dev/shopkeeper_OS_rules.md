# Shop

## Rules:

### shop open
When a shop is open, NPCs will buy items from the shop at listed prices. If some stock is empty, the NPCs will get upset and the shop's reputation will lower.

A player can open the shop if:
- The palyer has correct permission to open the shop
- The shop is closed
- The player doesn't have another shop of similar type and region and subregion open
- The shop's intergity is valid (has a name, region, subregion, type, stock_room and main_room)

### shop close
When a shop is closed, NPCs will not buy items from the shop. If you are out of stock, the reputation will not lower.

A player can close the shop if:
- The player has correct permission to close the shop
- The shop is open

### shop type switch
The shop type dictates what items the shop can sell. Switching type will empty the stock and reset the prices.

A player can switch the shop type if:  
- The player has correct permission to switch the shop type
- The shop is closed
- The stock must be empty

### shop stock add
A player can restock the shop with items he has in his inventory. The items will be transferred from the player's inventory to the shop's stock room. The stocked items will not be for sale until the player sets the price.

A player can restock the shop if:
- The player has correct permission to restock the shop
- The player has valid items in his inventory (items compatible with the shop type)
- The stock room has enough space for the items

### shop stock remove
A player can remove items from the shop's stock room and put them in his inventory. The items will be removed from the shop's stock room and will not be for sale anymore.

A player can remove items from the shop's stock room if:
- The player has correct permission to remove items from the stock room
- The stock room has the items

### shop price set
A player can set the price of an item if that item is compatible with the shop type. Prices can be set even if stock is empty. The reference prices are stored in the server's backend, but readable by shop owners. If your prices are above the reference prices, the shop might have difficulty selling the items, except if it has a good reputation. Priced under the reference prices will make the shop sell the items faster, and the reputation will increase. Excessively overpriced items will make the reputation decrease.

A player can set the price of an item if:
- The player has correct permission to set prices
- The item is compatible with the shop type

### shop money take
A player can take money from the shop's cash register. The cash register is filled with the money from the sales. The money is Gramados' currency.

A player can take money from the shop's cash register if:
- The player has correct permission to take money
- The cash register has over 0 grons.

### shop money put
A player can put money in the shop's cash register. The money is Gramados' currency.

A player can put money in the shop's cash register if:
- The player has correct permission to put money

### shop sell
A player can sell the shop to another player. The shop will be sold with all its stock, prices, reputation, and permissions. The shop's price will be proportional to the shop's reputation and stock.

A player can sell the shop if:
- The player has correct permission to sell the shop
- The shop is closed

### (READ) shop stock list
The player can see the shop's stock list. The stock list will show the items in the stock room, the quantity, and their value or price if they have one.

### (READ) shop price list
The player can see the shop type's price list. This is not linked to the shop directly, but it is a reference for the player to set the prices.

### (READ) shop info
The player can see the shop's info. The info will show the shop's name, type, location, region, sub-region, reputation, owner, and more.

### (ADMIN) shop property set
Change-able properties are: location, region, sub-region, stock room, and main room.
Changing the shop's properties is only possible by an admin.

### (ADMIN) shop create
Creating a shop is only possible by an admin.

### (ADMIN) shop delete
Deleting a shop is only possible by an admin.

## JSON Data:
### Roles:
```json
"roles": {
    "enabled": false,
    "owner": "TheOddlySeagull",
    "managers": [],
    "cashiers": [],
    "stock_keepers": [],
    "assistants": []
}
```
#### enabled (bool):
If roles are disabled, only the owner can do everything.

#### owner (string):
The name of the owner of the shop.  
The owner has all permissions on "roles", "inventory" and "shop" data.  
He doesn't have permission to change "property" nor "reputation_data" data.  
- ✅ All permissions

#### managers (string[]):
A list of players that have the "Managing" permissions.  
- ✅ Open/close the shop
- ✅ Set prices
- ✅ Manage permissions (except owner)
- ✅ Take money from the cash register
- ❌ Cannot switch shop type
- ❌ Cannot sell the shop

#### cashiers (string[]):
A list of players that have the "Cashier" permissions.  
- ✅ Open/close the shop
- ✅ Take money from the cash register
- ❌ No stock refill
- ❌ No price setting
- ❌ No permissions management
- ❌ No shop type switching

#### stock_keepers (string[]):
A list of players that have the "Stock Keeper" permissions.  
- ✅ Open/close the shop
- ✅ Add stock
- ❌ No price setting
- ❌ No money handling
- ❌ No permissions management

#### assistants (string[]):
A list of players that have the "Assistant" permissions.  
- ✅ Open/close the shop
- ❌ No stock refill
- ❌ No price setting
- ❌ No money handling
- ❌ No permissions management

### Inventory
```json
"inventory": {
    "stock": {
        "max_capacity": 100,
        "items": [
            {
                "item_id": "harvestcraft:cuttingboarditem:0",
                "quantity": 10
            },
            {
                "item_id": "minecraft:potion:0",
                "nbt": {
                    "Potion": "minecraft:long_leaping"
                },
                "quantity": 10
            }
        ]
    },
    "listed_items": [
        {
            "item_id": "harvestcraft:cuttingboarditem:0",
            "price": 5000
        },
        {
            "item_id": "minecraft:potion:0",
            "nbt": {
                "Potion": "minecraft:long_leaping"
            },
            "price": 14000
        }
    ],
    "stored_cash": 54100
}
```
#### stock (object):
- max_capacity (int): The maximum capacity of the stock room.
- items (object[]): A list of items in the stock room.
  - item_id (string): The item's ID.
  - nbt (object): The item's NBT data (optional).
  - quantity (int): The item's quantity.

#### listed_items (object[]):
- item_id (string): The item's ID.
- nbt (object): The item's NBT data (optional).
- price (int): The item's price. (in cents)

#### stored_cash (int):
The amount of money stored in the cash register.

### Shop
```json
"shop": {
    "display_name": "Seagull's Test Shop",
    "type": "essential_goods_food_drinks",
    "is_open": false,
    "is_for_sale": false
}
```
#### display_name (string):
The shop's display name.

#### type (string):
The shop's type. Must be one of the valid shop types.

#### is_open (bool):
If the shop is open.

#### is_for_sale (bool):
If the shop is for sale.

### Reputation Data
```json
"reputation_data": {
    "reputation": 6512,
    "reputation_history": [
        {
            "date": "2021-08-01",
            "reputation": 0
        },
        {
            "date": "2021-08-02",
            "reputation": 65
        },
        {
            "date": "2021-08-03",
            "reputation": 142
        }
        // ...
    ]
}
```
#### reputation (int):
The shop's reputation.

#### reputation_history (object[]):
- date (string): The date of the reputation save.
- reputation (int): The reputation value.

### Property
```json
"location": {
    "x": 0,
    "y": 0,
    "z": 0
    // Cashier location: heart of the shop
},
"stock_room": [
    "region_name_1",
    "region_name_2",
    "region_name_3"
    // ...
],
"main_room": [
    "region_name_1",
    "region_name_2",
    "region_name_3"
    // ...
],
"region": "Gramados",
"sub_region": "Gramados_City"
```
#### location (object):
- x (int): The X coordinate of the shop.
- y (int): The Y coordinate of the shop.
- z (int): The Z coordinate of the shop.
Those coordinates are the heart of the shop. (the cashier location)

#### stock_room (string[]):
A list of regions representing the space the stock room occupies.  
The size of all those regions will define the stock size, at a default of 27 stacks (1728 items) per block.  
Upgrades can be bought to increase the stock size.

#### main_room (string[]):
A list of regions representing the space the main room occupies.  
The larger this space is, the more customers can be in the shop at the same time.

#### region (string):
The region (Island) where the shop is located.

#### sub_region (string):
The sub-region (town or district) where the shop is located.
