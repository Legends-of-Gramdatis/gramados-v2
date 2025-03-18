# Gramados Stock Exchange System

This module implements a dynamic stock exchange system for the Gramados modded Minecraft RP server (1.12.2). It allows players to sell items, influence prices through supply and demand, and earn in-game currency (**Grons**). The system is designed to simulate real-world market behavior with regional variations and random fluctuations.

## Features

- **Dynamic Pricing**: Item prices fluctuate based on sales volume, time since the last sale, and regional factors.
- **Regional Markets**: Each region has unique economic traits, such as stock multipliers, flexibility, and variety bonuses.
- **Variety Bonuses**: Incentives for selling diverse items in specific regions.
- **Random Market Fluctuations**: Adds unpredictability to price changes.
- **Bulk Sales**: Players can sell large quantities of items, impacting market prices.
- **Domain Reputation**: Reputation for wine domains affects the value of aged products.

## Files

- **`stock_exchange_world.js`**: Handles global stock updates, including price adjustments during server restarts.
- **`stock_exchange_delivery_npc.js`**: Manages player interactions with NPCs for selling items and updating stock prices.
- **`stock_exchange.json`**: Stores stock data, including item prices, quantities, and regional settings.
- **`domains.json`**: Stores domain-specific data, such as wine domain reputation and bottle variety.

## How It Works

### Stock Price Updates

1. **Time Since Last Sale**:
   - Prices increase for items not sold for a long time (scarcity).
   - Frequent sales decrease prices (abundance).

2. **Quantity Sold**:
   - Large sales reduce prices proportionally to the quantity sold.

3. **Random Fluctuations**:
   - Prices may randomly increase or decrease to simulate market unpredictability.

4. **Regional Effects**:
   - Each region has unique multipliers and flexibility settings that influence price changes.

### Selling Items

1. **Crates and Barrels**:
   - Players deliver items in crates or barrels to NPCs.
   - The system calculates earnings based on item prices and regional bonuses.

2. **Variety Bonus**:
   - Selling diverse items in a single delivery may yield higher earnings in certain regions.

3. **Domain Reputation**:
   - For aged products (e.g., wine), domain reputation and aging time affect the final price.

### Bulk Sales

- Selling large quantities of items impacts the market price significantly.
- Players must strategize to maximize profits while minimizing price drops.

## Configuration

### Stock Data

Stock data is stored in `stock_exchange.json`. Example:

```json
{
    "Gramados Farming": {
        "wheat:0": {
            "current_price": 100,
            "reference_price": 120,
            "min_price": 50,
            "max_price": 200,
            "quantity_sold": 0,
            "quantity_factor": 100,
            "last_sold_time": 0
        }
    },
    "Region Generals": {
        "Gramados Farming": {
            "stock_multiplier": 1.2,
            "stock_flexibility": 0.8,
            "variety_bonus": 0.1
        }
    }
}
```

### Domain Data

Domain data is stored in `domains.json`. Example:

```json
{
    "domains": {
        "Gramados Vineyard": {
            "display_name": "Gramados Vineyard",
            "reputation": 1.5,
            "last_sale_date": 0,
            "bottle_variety": []
        }
    }
}
```

## Commands and Debugging

- **Broadcast Messages**: The scripts use `world.broadcast` for debugging and notifications.
- **Error Handling**: Errors such as missing stock data or invalid deliveries are communicated to players.

## Future Improvements

- Add support for custom regional events affecting stock prices.
- Implement a GUI for stock market management.
- Enhance domain reputation tracking with more detailed statistics.

## Credits

Developed for the Gramados Minecraft RP server. Special thanks to the server community for their feedback and support.
