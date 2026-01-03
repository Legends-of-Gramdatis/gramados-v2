#!/usr/bin/env python3
"""Vehicle Price Updater (Gramados)

Scans crafttweaker.log for Trin vehicles from configured modids, computes a price:
- base_price from trinCarModels.json (best-fit match)
- + factory paint price (factoryColors.json)
- + interior price (interiorColors.json)
- + polychrome extra (config.parsing.polychrome_extra) when paint is split on 'and'

Then appends missing entries to global_prices.json (without rewriting the whole file).

Usage:
  python3 scripts_backend/vehicle_price_updater.py --dry-run
  python3 scripts_backend/vehicle_price_updater.py

Interactive mode (default) will ask for input when parsing/matching is ambiguous.
Use --non-interactive to skip unresolved items and write a report.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple


TRIM_DEFAULT = {"comfort", "root", "substantial", "tq1", "tq2", "tq3"}


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def _load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def _load_overrides(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    return _load_json(path) or {}


def _save_overrides(path: Path, data: Dict[str, Any]) -> None:
    _save_json(path, data)


@dataclass(frozen=True)
class FoundVehicle:
    full_id: str  # e.g. mts:iv_tcp_v3_civil.trin_heavorum_crewcab_dually_appleford_g
    modid: str    # e.g. iv_tcp_v3_civil
    suffix: str   # e.g. trin_heavorum_crewcab_dually_appleford_g


@dataclass(frozen=True)
class ParsedVehicleId:
    model_key: str           # e.g. trin_heavorum_crewcab_dually
    paint_key: Optional[str] # e.g. appleford OR tungstenandelectricblue
    interior_key: Optional[str]  # e.g. g OR gray_blue


@dataclass(frozen=True)
class PricedVehicle:
    full_id: str
    value: int
    details: Dict[str, Any]


def load_config(config_path: Path) -> Dict[str, Any]:
    return _load_json(config_path)


def scan_crafttweaker_log(log_path: Path, namespace: str, modids: Sequence[str], only_trin: bool) -> List[FoundVehicle]:
    # Matches patterns like:
    #   <mts:iv_tcp_v3_civil.trin_heavorum_crewcab_dually_appleford_g>
    # Also tolerates the id appearing without angle brackets.
    modid_group = "|".join(re.escape(m) for m in modids)
    prefix = re.escape(namespace) + r":"
    trin_part = r"trin_[a-z0-9_]+" if only_trin else r"[a-z0-9_]+"

    pattern = re.compile(rf"<?({prefix}(({modid_group}))\.({trin_part}))>?", re.IGNORECASE)

    found: Dict[str, FoundVehicle] = {}
    with log_path.open("r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            for m in pattern.finditer(line):
                full_id = m.group(1)
                modid = m.group(3)
                suffix = m.group(4)
                found[full_id] = FoundVehicle(full_id=full_id, modid=modid, suffix=suffix)

    return sorted(found.values(), key=lambda v: v.full_id)


def build_factory_color_map(factory_colors: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    by_norm: Dict[str, Dict[str, Any]] = {}
    for entry in factory_colors:
        if not entry or "name" not in entry:
            continue
        by_norm[_norm(entry["name"])] = entry
    return by_norm


def build_interior_color_map(interior_colors: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    by_norm: Dict[str, Dict[str, Any]] = {}
    for entry in interior_colors:
        if not entry or "name" not in entry:
            continue
        by_norm[_norm(entry["name"])] = entry
    return by_norm


def _detect_interior(tokens: List[str], interior_aliases: Dict[str, str], interior_by_norm: Dict[str, Dict[str, Any]]) -> Tuple[Optional[str], int]:
    # Return (interior_key, consumed_tokens)
    if not tokens:
        return None, 0

    # Try 2-token suffix first (e.g. gray_blue)
    if len(tokens) >= 2:
        two = tokens[-2] + "_" + tokens[-1]
        two_norm = _norm(two)
        if two_norm in (_norm(k) for k in interior_aliases.keys()):
            return two, 2
        if two_norm in interior_by_norm:
            return two, 2

    one = tokens[-1]
    one_norm = _norm(one)
    # Accept explicit aliases like g, bl, gb
    for k in interior_aliases.keys():
        if one_norm == _norm(k):
            return one, 1
    if one_norm in interior_by_norm:
        return one, 1

    return None, 0


def _detect_paint(tokens: List[str], factory_by_norm: Dict[str, Dict[str, Any]]) -> Tuple[Optional[str], int]:
    # Return (paint_key, consumed_tokens)
    if not tokens:
        return None, 0

    max_n = min(5, len(tokens))
    # Prefer longest suffix match
    for n in range(max_n, 0, -1):
        cand = "_".join(tokens[-n:])
        cand_norm = _norm(cand)
        if cand_norm in factory_by_norm:
            return cand, n

        # Sometimes ids omit separators; try concatenated
        cand2_norm = _norm("".join(tokens[-n:]))
        if cand2_norm in factory_by_norm:
            return "".join(tokens[-n:]), n

    # No direct paint match
    return None, 0


def parse_vehicle_suffix(suffix: str, trim_tokens: Iterable[str], interior_aliases: Dict[str, str], interior_by_norm: Dict[str, Dict[str, Any]], factory_by_norm: Dict[str, Dict[str, Any]],
                         *, interactive: bool) -> ParsedVehicleId:
    tokens = [t for t in suffix.lower().split("_") if t]
    if not tokens or tokens[0] != "trin":
        raise ValueError(f"Not a Trin vehicle suffix: {suffix}")

    interior_key, interior_consumed = _detect_interior(tokens, interior_aliases, interior_by_norm)
    if interior_consumed:
        tokens_wo_interior = tokens[:-interior_consumed]
    else:
        tokens_wo_interior = tokens

    paint_key, paint_consumed = _detect_paint(tokens_wo_interior, factory_by_norm)
    if paint_consumed:
        core = tokens_wo_interior[:-paint_consumed]
    else:
        # No known factory paint matched. Most of the time the last token is still the paint key
        # (e.g. pureblack, shagbark, customlivery1). Keep it as an unknown paint so the pricing
        # step can ask once and then remember it.
        if len(tokens_wo_interior) >= 3:
            paint_key = tokens_wo_interior[-1]
            paint_consumed = 1
            core = tokens_wo_interior[:-1]
        else:
            core = tokens_wo_interior

    # Remove trim tokens from the core (but keep order)
    trim_set = {t.lower() for t in trim_tokens}
    core_no_trim = [t for t in core if t not in trim_set]

    if len(core_no_trim) < 2:
        raise ValueError(f"Could not extract model from suffix: {suffix}")

    model_key = "_".join(core_no_trim)

    # If interior missing, allow it (some items skip interior).
    if interior_key is None and interactive:
        # don't force; just inform
        pass

    return ParsedVehicleId(model_key=model_key, paint_key=paint_key, interior_key=interior_key)


def _tokenize_words_from_id(model_key: str) -> List[str]:
    # model_key like trin_heavorum_crewcab_dually
    return [t for t in model_key.split("_") if t]


def match_car_model(model_key: str, car_models: List[Dict[str, Any]], *, interactive: bool) -> Dict[str, Any]:
    def _norm_nover(s: str) -> str:
        # Many Trin entries include (V3)/(V4) in the display name; item ids usually don't.
        return re.sub(r"v\d+", "", _norm(s))

    id_norm = _norm_nover(model_key)
    words = _tokenize_words_from_id(model_key)

    candidates: List[Tuple[int, Dict[str, Any]]] = []
    for entry in car_models:
        if not entry or "name" not in entry or "base_price" not in entry:
            continue
        name = entry.get("name", "")
        variant = entry.get("variant", "")
        name_norm = _norm_nover(name)
        variant_norm = _norm_nover(variant)

        score = 0
        if id_norm.startswith(name_norm):
            score += 100
        elif name_norm and name_norm in id_norm:
            score += 50

        # Strongly favor matching the model family (e.g. urlon, heavorum)
        if len(words) >= 2:
            family = _norm_nover(words[1])
            if family and family in name_norm:
                score += 40

        if variant_norm and variant_norm in id_norm:
            score += 30

        # word overlap with variant
        variant_words = re.findall(r"[a-z0-9]+", variant.lower())
        score += 2 * sum(1 for w in variant_words if w in words)

        if score > 0:
            candidates.append((score, entry))

    if not candidates:
        raise ValueError(f"No matching car model found for model_key={model_key}")

    candidates.sort(key=lambda x: x[0], reverse=True)
    best_score, best = candidates[0]

    # Ambiguity check: multiple close candidates
    close = [c for c in candidates[:5] if c[0] >= best_score - 3]
    if interactive and len(close) > 1:
        print("\n[vehicle_price_updater] Ambiguous model match for:")
        print(f"  model_key: {model_key}")
        for i, (sc, e) in enumerate(close, start=1):
            print(f"  {i}) score={sc} | {e.get('name')} | {e.get('variant')} | base_price={e.get('base_price')}")
        print("Choose a number, or press Enter to accept #1.")
        ans = input("> choice: ").strip()
        if ans:
            try:
                idx = int(ans)
                if 1 <= idx <= len(close):
                    best = close[idx - 1][1]
                    best_score = close[idx - 1][0]
            except ValueError:
                pass

    # Threshold: if score is too low, probably wrong.
    if best_score < 50:
        raise ValueError(f"Low-confidence model match for {model_key}: score={best_score}, picked={best.get('name')} {best.get('variant')}")

    return best


def match_car_model_with_memory(
    model_key: str,
    car_models: List[Dict[str, Any]],
    overrides: Dict[str, Any],
    overrides_path: Optional[Path],
    model_memory: Dict[str, Dict[str, Any]],
    *,
    interactive: bool,
) -> Dict[str, Any]:
    """Match a vehicle model, remembering user choices for ambiguous matches.

    - In-run cache: model_memory
    - Persisted overrides: overrides['model_key_overrides']
    """
    key_norm = _norm(model_key)

    # 1) In-run memory cache
    memo = model_memory.get(key_norm)
    if isinstance(memo, dict) and memo.get("name") and memo.get("variant"):
        wanted_name = _norm(str(memo["name"]))
        wanted_variant = _norm(str(memo["variant"]))
        for entry in car_models:
            if not entry:
                continue
            if _norm(str(entry.get("name", ""))) == wanted_name and _norm(str(entry.get("variant", ""))) == wanted_variant:
                return entry

    # 2) Persisted overrides
    model_overrides = overrides.get("model_key_overrides", {})
    ov = model_overrides.get(key_norm)
    if isinstance(ov, dict) and ov.get("name") and ov.get("variant"):
        wanted_name = _norm(str(ov["name"]))
        wanted_variant = _norm(str(ov["variant"]))
        for entry in car_models:
            if not entry:
                continue
            if _norm(str(entry.get("name", ""))) == wanted_name and _norm(str(entry.get("variant", ""))) == wanted_variant:
                model_memory[key_norm] = {"name": entry.get("name"), "variant": entry.get("variant")}
                return entry

    # 3) Compute candidates via the same logic as match_car_model
    def _norm_nover(s: str) -> str:
        return re.sub(r"v\d+", "", _norm(s))

    id_norm = _norm_nover(model_key)
    words = _tokenize_words_from_id(model_key)

    candidates: List[Tuple[int, Dict[str, Any]]] = []
    for entry in car_models:
        if not entry or "name" not in entry or "base_price" not in entry:
            continue
        name = entry.get("name", "")
        variant = entry.get("variant", "")
        name_norm = _norm_nover(name)
        variant_norm = _norm_nover(variant)

        score = 0
        if id_norm.startswith(name_norm):
            score += 100
        elif name_norm and name_norm in id_norm:
            score += 50

        if len(words) >= 2:
            family = _norm_nover(words[1])
            if family and family in name_norm:
                score += 40

        if variant_norm and variant_norm in id_norm:
            score += 30

        variant_words = re.findall(r"[a-z0-9]+", str(variant).lower())
        score += 2 * sum(1 for w in variant_words if w in words)

        if score > 0:
            candidates.append((score, entry))

    if not candidates:
        raise ValueError(f"No matching car model found for model_key={model_key}")

    candidates.sort(key=lambda x: x[0], reverse=True)
    best_score, best = candidates[0]

    close = [c for c in candidates[:5] if c[0] >= best_score - 3]
    if interactive and len(close) > 1:
        print("\n[vehicle_price_updater] Ambiguous model match for:")
        print(f"  model_key: {model_key}")
        for i, (sc, e) in enumerate(close, start=1):
            print(f"  {i}) score={sc} | {e.get('name')} | {e.get('variant')} | base_price={e.get('base_price')}")
        print("Choose a number, or press Enter to accept #1.")
        ans = input("> choice: ").strip()
        if ans:
            try:
                idx = int(ans)
                if 1 <= idx <= len(close):
                    best = close[idx - 1][1]
                    best_score = close[idx - 1][0]
            except ValueError:
                pass

        # Remember/persist the chosen match so the next occurrence won't ask again.
        model_memory[key_norm] = {"name": best.get("name"), "variant": best.get("variant")}
        if overrides_path:
            overrides.setdefault("model_key_overrides", {})
            overrides["model_key_overrides"][key_norm] = {"name": best.get("name"), "variant": best.get("variant")}
            _save_overrides(overrides_path, overrides)

    if best_score < 50:
        raise ValueError(
            f"Low-confidence model match for {model_key}: score={best_score}, picked={best.get('name')} {best.get('variant')}"
        )

    return best


def resolve_paint_price(
    paint_key: Optional[str],
    factory_by_norm: Dict[str, Dict[str, Any]],
    polychrome_extra: int,
    *,
    interactive: bool,
    context: Optional[Dict[str, str]] = None,
) -> Tuple[int, Dict[str, Any]]:
    if not paint_key:
        return 0, {"paint": None, "paint_price": 0, "polychrome": False}

    key_norm = _norm(paint_key)
    if key_norm in factory_by_norm:
        price = int(factory_by_norm[key_norm].get("price", 0))
        return price, {"paint": factory_by_norm[key_norm]["name"], "paint_price": price, "polychrome": False}

    # polychrome: split on 'and'
    if "and" in key_norm:
        parts = re.split(r"and", key_norm)
        parts = [p for p in parts if p]
        if len(parts) == 2 and parts[0] in factory_by_norm and parts[1] in factory_by_norm:
            p1 = int(factory_by_norm[parts[0]].get("price", 0))
            p2 = int(factory_by_norm[parts[1]].get("price", 0))
            total = p1 + p2 + int(polychrome_extra)
            return total, {
                "paint": [factory_by_norm[parts[0]]["name"], factory_by_norm[parts[1]]["name"]],
                "paint_price": p1 + p2,
                "polychrome": True,
                "polychrome_extra": int(polychrome_extra),
            }

    if interactive:
        print("\n[vehicle_price_updater] Unknown paint key:")
        if context:
            if context.get("full_id"):
                print(f"  item: {context['full_id']}")
            if context.get("model_key"):
                print(f"  model_key: {context['model_key']}")
            if context.get("suffix"):
                print(f"  suffix: {context['suffix']}")
        print(f"  paint_key: {paint_key}")
        print("Enter a factory color name (exactly as in factoryColors.json),")
        print("or enter two names separated by comma for polychrome, or leave empty to set paint price to 0.")
        ans = input("> paint override: ").strip()
        if not ans:
            return 0, {"paint": paint_key, "paint_price": 0, "polychrome": False, "note": "unknown paint treated as 0"}

        chosen = [a.strip() for a in ans.split(",") if a.strip()]
        if len(chosen) == 1:
            cn = _norm(chosen[0])
            if cn in factory_by_norm:
                price = int(factory_by_norm[cn].get("price", 0))
                return price, {"paint": factory_by_norm[cn]["name"], "paint_price": price, "polychrome": False, "override": True}
        if len(chosen) == 2:
            c1 = _norm(chosen[0])
            c2 = _norm(chosen[1])
            if c1 in factory_by_norm and c2 in factory_by_norm:
                p1 = int(factory_by_norm[c1].get("price", 0))
                p2 = int(factory_by_norm[c2].get("price", 0))
                total = p1 + p2 + int(polychrome_extra)
                return total, {
                    "paint": [factory_by_norm[c1]["name"], factory_by_norm[c2]["name"]],
                    "paint_price": p1 + p2,
                    "polychrome": True,
                    "polychrome_extra": int(polychrome_extra),
                    "override": True,
                }

        print("  Could not resolve your override; paint price set to 0.")
        return 0, {"paint": paint_key, "paint_price": 0, "polychrome": False, "note": "override failed"}

    # Non-interactive mode can't prompt; treat as 0 and annotate.
    return 0, {"paint": paint_key, "paint_price": 0, "polychrome": False, "note": "unknown paint (non-interactive)"}


def resolve_paint_price_with_memory(
    paint_key: Optional[str],
    factory_by_norm: Dict[str, Dict[str, Any]],
    polychrome_extra: int,
    overrides: Dict[str, Any],
    overrides_path: Path,
    paint_memory: Dict[str, Dict[str, Any]],
    context: Optional[Dict[str, str]] = None,
    *,
    interactive: bool,
) -> Tuple[int, Dict[str, Any]]:
    """Resolve paint price, using both persisted overrides and in-run memory.

    When interactive user provides an override, it is remembered for the remainder
    of the run and persisted to overrides JSON for future runs.
    """
    if not paint_key:
        return resolve_paint_price(paint_key, factory_by_norm, polychrome_extra, interactive=interactive, context=context)

    key_norm = _norm(paint_key)

    # 1) In-run memory cache
    if key_norm in paint_memory:
        memo = paint_memory[key_norm]
        return int(memo["total"]), dict(memo["details"])

    # 2) Persisted overrides
    paint_overrides = overrides.get("paint_key_overrides", {})
    ov = paint_overrides.get(key_norm)
    if isinstance(ov, dict) and isinstance(ov.get("colors"), list):
        colors = [str(c) for c in ov.get("colors", [])]
        colors_norm = [_norm(c) for c in colors]
        if len(colors_norm) == 1 and colors_norm[0] in factory_by_norm:
            price = int(factory_by_norm[colors_norm[0]].get("price", 0))
            details = {"paint": factory_by_norm[colors_norm[0]]["name"], "paint_price": price, "polychrome": False, "override": True}
            paint_memory[key_norm] = {"total": price, "details": details}
            return price, dict(details)
        if len(colors_norm) == 2 and colors_norm[0] in factory_by_norm and colors_norm[1] in factory_by_norm:
            p1 = int(factory_by_norm[colors_norm[0]].get("price", 0))
            p2 = int(factory_by_norm[colors_norm[1]].get("price", 0))
            total = p1 + p2 + int(polychrome_extra)
            details = {
                "paint": [factory_by_norm[colors_norm[0]]["name"], factory_by_norm[colors_norm[1]]["name"]],
                "paint_price": p1 + p2,
                "polychrome": True,
                "polychrome_extra": int(polychrome_extra),
                "override": True,
            }
            paint_memory[key_norm] = {"total": total, "details": details}
            return total, dict(details)

    # 3) Normal resolver (may prompt)
    total, details = resolve_paint_price(paint_key, factory_by_norm, polychrome_extra, interactive=interactive, context=context)

    # 4) If user provided an override interactively, persist it
    if interactive and details.get("override"):
        # Normalize to the canonical display name(s) we computed.
        colors: List[str] = []
        if details.get("polychrome") and isinstance(details.get("paint"), list):
            colors = [str(c) for c in details.get("paint")]
        elif isinstance(details.get("paint"), str):
            colors = [details.get("paint")]

        overrides.setdefault("paint_key_overrides", {})
        overrides["paint_key_overrides"][key_norm] = {
            "colors": colors,
            "polychrome": bool(details.get("polychrome")),
        }
        _save_overrides(overrides_path, overrides)

    # Always remember for the remainder of the run
    paint_memory[key_norm] = {"total": int(total), "details": dict(details)}
    return int(total), dict(details)


def resolve_interior_price(interior_key: Optional[str], interior_aliases: Dict[str, str], interior_by_norm: Dict[str, Dict[str, Any]], *, interactive: bool) -> Tuple[int, Dict[str, Any]]:
    if not interior_key:
        return 0, {"interior": None, "interior_price": 0}

    # alias mapping like g -> Gray
    key_norm = _norm(interior_key)
    chosen_name: Optional[str] = None
    for k, v in interior_aliases.items():
        if key_norm == _norm(k):
            chosen_name = v
            break

    if chosen_name is None:
        # maybe the key itself is a name
        if key_norm in interior_by_norm:
            chosen_name = interior_by_norm[key_norm]["name"]

    if chosen_name is not None:
        cn = _norm(chosen_name)
        if cn in interior_by_norm:
            price = int(interior_by_norm[cn].get("price", 0))
            return price, {"interior": interior_by_norm[cn]["name"], "interior_price": price}

    if interactive:
        print("\n[vehicle_price_updater] Unknown interior key:")
        print(f"  interior_key: {interior_key}")
        print("Enter an interior name (exactly as in interiorColors.json), or leave empty to set interior price to 0.")
        ans = input("> interior override: ").strip()
        if not ans:
            return 0, {"interior": interior_key, "interior_price": 0, "note": "unknown interior treated as 0"}
        cn = _norm(ans)
        if cn in interior_by_norm:
            price = int(interior_by_norm[cn].get("price", 0))
            return price, {"interior": interior_by_norm[cn]["name"], "interior_price": price, "override": True}
        print("  Could not resolve your override; interior price set to 0.")
        return 0, {"interior": interior_key, "interior_price": 0, "note": "override failed"}

    raise ValueError(f"Unknown interior key (non-interactive): {interior_key}")


def load_global_prices(path: Path) -> Dict[str, Any]:
    return _load_json(path)


def append_entries_minimal_json(path: Path, new_entries: Dict[str, Dict[str, Any]]) -> None:
    # Append to the root JSON object without reformatting the entire file.
    text = path.read_text(encoding="utf-8")
    stripped = text.rstrip()
    if not stripped.endswith("}"):
        raise ValueError(f"global_prices file does not end with '}}': {path}")

    # Find the last closing brace of the root object
    last_brace = stripped.rfind("}")
    before = stripped[:last_brace]
    after = stripped[last_brace:]

    # Determine if we need a comma before adding new keys
    # Look for last non-whitespace character before the final '}'
    j = len(before) - 1
    while j >= 0 and before[j].isspace():
        j -= 1
    if j < 0 or before[j] != "}":
        # edge case; treat as needs comma if not empty object
        needs_comma = True
    else:
        # if the object is empty: '{\n}' then before[j] would be '{', not '}'
        # better: check if there's any ':' in the file
        needs_comma = ":" in before

    lines: List[str] = []
    if needs_comma:
        lines.append(",")

    # Append entries in a stable order
    items = sorted(new_entries.items(), key=lambda kv: kv[0])
    for idx, (k, v) in enumerate(items):
        entry = json.dumps({k: v}, ensure_ascii=False, indent=4)
        # entry is like '{\n    "k": { ... }\n}' - we want only the inside lines
        entry_lines = entry.splitlines()
        inner = entry_lines[1:-1]
        if idx > 0:
            lines.append(",")
        lines.extend(inner)

    # Ensure file ends with newline
    out = before.rstrip() + "\n" + "\n".join(lines) + "\n" + after + "\n"
    path.write_text(out, encoding="utf-8")


def price_vehicles(found: List[FoundVehicle], config: Dict[str, Any], *, interactive: bool) -> Tuple[List[PricedVehicle], List[Dict[str, Any]]]:
    paths = {k: Path(v) for k, v in config["paths"].items()}
    car_models = _load_json(paths["trin_car_models"])
    factory_colors = _load_json(paths["factory_colors"])
    interior_colors = _load_json(paths["interior_colors"])

    overrides_path = paths.get("overrides")
    overrides = _load_overrides(overrides_path) if overrides_path else {}
    paint_memory: Dict[str, Dict[str, Any]] = {}
    model_memory: Dict[str, Dict[str, Any]] = {}

    factory_by_norm = build_factory_color_map(factory_colors)
    interior_by_norm = build_interior_color_map(interior_colors)

    trim_tokens = config.get("parsing", {}).get("trim_tokens", sorted(TRIM_DEFAULT))
    polychrome_extra = int(config.get("parsing", {}).get("polychrome_extra", 1000))
    interior_aliases = config.get("interior_aliases", {})

    priced: List[PricedVehicle] = []
    errors: List[Dict[str, Any]] = []

    for fv in found:
        try:
            parsed = parse_vehicle_suffix(
                fv.suffix,
                trim_tokens=trim_tokens,
                interior_aliases=interior_aliases,
                interior_by_norm=interior_by_norm,
                factory_by_norm=factory_by_norm,
                interactive=interactive,
            )

            model_entry = match_car_model_with_memory(
                parsed.model_key,
                car_models,
                overrides,
                overrides_path,
                model_memory,
                interactive=interactive,
            )
            base_price = int(model_entry.get("base_price", 0))

            paint_price, paint_details = resolve_paint_price_with_memory(
                parsed.paint_key,
                factory_by_norm,
                polychrome_extra,
                overrides,
                overrides_path,
                paint_memory,
                context={"full_id": fv.full_id, "suffix": fv.suffix, "model_key": parsed.model_key},
                interactive=interactive,
            )
            interior_price, interior_details = resolve_interior_price(parsed.interior_key, interior_aliases, interior_by_norm, interactive=interactive)

            value = int((base_price + paint_price + interior_price) * 100) # final value in cents

            details = {
                "suffix": fv.suffix,
                "model_key": parsed.model_key,
                "paint_key": parsed.paint_key,
                "interior_key": parsed.interior_key,
                "matched_model": {"name": model_entry.get("name"), "variant": model_entry.get("variant"), "base_price": base_price},
                **paint_details,
                **interior_details,
                "final_value": value,
            }

            priced.append(PricedVehicle(full_id=fv.full_id+":0", value=value, details=details))

        except Exception as e:
            errors.append({"full_id": fv.full_id, "suffix": fv.suffix, "error": str(e)})

    return priced, errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="/home/mouette/gramados-v2/scripts_backend/vehicle_price_config.json")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--non-interactive", action="store_true")
    parser.add_argument("--update-existing", action="store_true", help="Overwrite entries already present in global_prices.json")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of vehicles processed (debug)")
    args = parser.parse_args()

    config = load_config(Path(args.config))
    paths = {k: Path(v) for k, v in config["paths"].items()}

    found = scan_crafttweaker_log(
        paths["crafttweaker_log"],
        namespace=config["scan"]["namespace"],
        modids=config["scan"]["modids"],
        only_trin=bool(config["scan"].get("only_trin", True)),
    )

    if args.limit and args.limit > 0:
        found = found[: args.limit]

    interactive = not args.non_interactive

    priced, errors = price_vehicles(found, config, interactive=interactive)

    global_prices = load_global_prices(paths["global_prices"])

    to_add: Dict[str, Dict[str, Any]] = {}
    updated: Dict[str, Dict[str, Any]] = {}

    for pv in priced:
        entry = {"value": int(pv.value)}
        if pv.full_id in global_prices:
            if args.update_existing:
                updated[pv.full_id] = entry
        else:
            to_add[pv.full_id] = entry

    report = {
        "found_count": len(found),
        "priced_count": len(priced),
        "errors_count": len(errors),
        "would_add": len(to_add),
        "would_update": len(updated),
        "errors": errors,
        "sample_priced": [p.details for p in priced[:10]],
    }
    _save_json(paths["report_out"], report)

    print("[vehicle_price_updater] Found vehicles:", len(found))
    print("[vehicle_price_updater] Priced vehicles:", len(priced))
    print("[vehicle_price_updater] Errors:", len(errors), f"(report: {paths['report_out']})")
    print("[vehicle_price_updater] Would add:", len(to_add))
    print("[vehicle_price_updater] Would update:", len(updated))

    if args.dry_run:
        print("[vehicle_price_updater] Dry-run: no files modified.")
        return 0

    # Apply updates
    if updated:
        for k, v in updated.items():
            global_prices[k] = v
        # Note: updating existing entries would require rewriting the full file to keep it valid.
        # We do the minimal-diff append for additions only. For updates, we fall back to full rewrite.
        # This is intentionally opt-in via --update-existing.
        with paths["global_prices"].open("w", encoding="utf-8") as f:
            json.dump(global_prices, f, ensure_ascii=False, indent=4)
            f.write("\n")
        print("[vehicle_price_updater] Updated existing entries by rewriting global_prices.json")

    if to_add:
        append_entries_minimal_json(paths["global_prices"], to_add)
        print("[vehicle_price_updater] Appended new entries to global_prices.json")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
