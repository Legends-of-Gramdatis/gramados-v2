import json
import random
import os
import pandas as pd

# Path to global prices JSON
PRICE_PATH = "/home/mouette/gramados-v2/world/customnpcs/scripts/globals/global_prices.json"

# Fallback base price in cents if not found in JSON
DEFAULT_BASE_PRICE = 100000  # 1000g

# Item-to-variable map
item_variables = {
    "variedcommodities:gem_amethyst:0": ["clarity", "purity", "weight", "color_grade"],
    "variedcommodities:gem_ruby:0": ["clarity", "purity", "weight", "color_grade"],
    "variedcommodities:gem_sapphire:0": ["clarity", "purity", "weight", "color_grade"],
    "variedcommodities:crystal:0": ["clarity", "purity", "weight"],
    "minecraft:diamond:0": ["clarity", "purity", "weight", "color_grade"],
    "minecraft:emerald:0": ["clarity", "purity", "weight", "color_grade"],
    "forestry:apatite:0": ["clarity", "purity", "weight"],
    "minecraft:dye:4": ["clarity", "purity", "weight"],  # lapis lazuli
    "forestry:ingot_tin:0": ["purity", "weight"],
    "forestry:ingot_copper:0": ["purity", "weight"],
    "variedcommodities:ingot_bronze:0": ["purity", "weight"],
    "minecraft:gold_ingot:0": ["purity", "weight", "color_grade"],
    "immersiveengineering:metal:3": ["purity", "weight"],  # steel
    "variedcommodities:ingot_mithril:0": ["lightness", "purity"],
    "variedcommodities:ingot_demonic:0": ["resonance", "purity"]
}

# Load price JSON
if os.path.exists(PRICE_PATH):
    with open(PRICE_PATH, "r") as f:
        price_data = json.load(f)
else:
    price_data = {}

# Variable generators
def roll_purity(): return round(random.uniform(0.5, 1.0), 2)
def roll_clarity(): return round(random.uniform(6.0, 10.0), 2)
def roll_weight(): return round(random.uniform(0.2, 1.7), 2)
def roll_color_grade(): return random.choice([1.0, 0.95, 0.9, 0.85])
def roll_lightness(): return round(random.uniform(0.25, 1.0), 2)
def roll_resonance(): return round(random.uniform(0.5, 1.0), 2)

def swing():
    return round(random.uniform(0.8, 1.2), 3) if random.random() < 0.9 else round(random.uniform(0.5, 1.5), 3)

def evaluate_item(item_id, variables, base_price):
    values = {}
    q_score = 0
    weight_sum = 0

    for var in variables:
        if var == "purity":
            v = roll_purity()
            q_score += v * 0.5
            weight_sum += 0.4
        elif var == "clarity":
            v = roll_clarity() / 10
            q_score += v * 0.4
            weight_sum += 0.3
        elif var == "weight":
            v = roll_weight()
            q_score += v
            weight_sum += 0.5
        elif var == "color_grade":
            v = roll_color_grade()
            q_score += v * 0.3
            weight_sum += 0.1
        elif var == "lightness":
            v = roll_lightness()
            q_score += v
            weight_sum += 0.5
        elif var == "resonance":
            v = roll_resonance()
            q_score += v * 0.7
            weight_sum += 0.5
        else:
            v = None
        values[var] = v

    q_score = q_score / weight_sum if weight_sum > 0 else 1.0
    q_score = max(min(q_score, 1.25), 0.6)
    random_swing = swing()
    final_value = int(base_price * q_score * random_swing)

    expertise_cost = max(int(base_price * 0.05), 500)  # at least 5g

    final_profit = final_value - expertise_cost - base_price

    return values, q_score, random_swing, final_value, expertise_cost, final_profit

# Run evaluations
results = []
for item_id, vars in item_variables.items():
    base_price = price_data.get(item_id, {}).get("value", DEFAULT_BASE_PRICE)
    qualities, q_score, rng, final_val, cost, profit = evaluate_item(item_id, vars, base_price)
    results.append({
        "item": item_id,
        "base_price": base_price,
        "expertise_cost": cost,
        # "variables": qualities,
        "quality_score": round(q_score, 3),
        "swing": rng,
        "estimated_value": final_val,
        "profit": profit
    })

# Create DataFrame and print results
df = pd.DataFrame(results)
print(df.to_string(index=False))