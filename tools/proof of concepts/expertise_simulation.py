import json
import random
import os
import pandas as pd
from statistics import median

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
    "minecraft:dye:4": ["purity", "weight", "color_grade"],  # lapis lazuli
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
def roll_purity(): return round(random.uniform(0.25, 1.0), 2)
def roll_clarity(): return round(random.uniform(1.0, 10.0), 2)
def roll_weight(): return round(random.uniform(1.0, 10.0), 2)
def roll_color_grade(): return round(random.uniform(0.5, 1.0), 2)
def roll_lightness(): return round(random.uniform(1.0, 100.0), 2)
def roll_resonance(): return round(random.uniform(1.0, 100.0), 2)

def swing():
    return round(random.uniform(0.8, 1.2), 3) if random.random() < 0.9 else round(random.uniform(0.5, 1.5), 3)

def evaluate_item(item_id, variables, base_price):
    values = {}
    q_score = 0
    weight_sum = 0

    for var in variables:
        if var == "purity":
            v = roll_purity()
            q_score += v
            weight_sum += 0.2
        elif var == "clarity":
            v = roll_clarity()
            q_score += v
            weight_sum += 5
        elif var == "weight":
            v = roll_weight()
            q_score += v
            weight_sum += 4
        elif var == "color_grade":
            v = roll_color_grade()
            q_score += v
            weight_sum += 0.25
        elif var == "lightness":
            v = roll_lightness()
            q_score += v
            weight_sum += 20
        elif var == "resonance":
            v = roll_resonance()
            q_score += v
            weight_sum += 20
        else:
            v = None
        values[var] = v

    q_score = q_score / weight_sum if weight_sum > 0 else 1.0
    random_swing = swing()
    final_value = int(base_price * q_score * random_swing)

    expertise_cost = max(int(base_price * 0.05), 500)  # at least 5g

    final_profit = final_value - expertise_cost - base_price

    return values, q_score, random_swing, final_value, expertise_cost, final_profit

# Run evaluations with multiple rolls
NUM_ROLLS = 1000

results = []
for item_id, vars in item_variables.items():
    base_price = price_data.get(item_id, {}).get("value", DEFAULT_BASE_PRICE)
    total_quality = 0
    total_swing = 0
    total_value = 0
    total_profit = 0
    profit_list = []
    quality_list = []

    for _ in range(NUM_ROLLS):
        qualities, q_score, rng, final_val, cost, profit = evaluate_item(item_id, vars, base_price)
        total_quality += q_score
        total_swing += rng
        total_value += final_val
        total_profit += profit
        profit_list.append(profit)
        quality_list.append(q_score)

    avg_quality = round(total_quality / NUM_ROLLS, 3)
    avg_swing = round(total_swing / NUM_ROLLS, 3)
    avg_value = int(total_value / NUM_ROLLS)
    avg_profit = int(total_profit / NUM_ROLLS)
    median_profit = int(median(profit_list))
    max_profit = max(profit_list)
    min_profit = min(profit_list)
    max_quality = max(quality_list)
    min_quality = min(quality_list)

    results.append({
        "item": item_id,
        "reference": base_price / 100,
        "avg_profit": avg_profit / 100,
        "max_profit": max_profit / 100,
        "min_profit": min_profit / 100,
        # "avg_value": avg_value / 100,
        # "avg_quality": avg_quality,
        # "max_quality": max_quality,
        # "min_quality": min_quality,
        # "expertise": cost / 100
        # "swing": avg_swing,
        # "median_profit": median_profit,
    })

# Create DataFrame and print results
df = pd.DataFrame(results)
print(df.to_string(index=False))
print("\nTotal evatuation runs:", NUM_ROLLS)