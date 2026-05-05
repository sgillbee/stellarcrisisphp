# Resource Ratio Calculation

Source code: `sc.php` — function `recalculateRatios($series_name, $game_number, $empire)`

## Purpose

Called once per empire after each turn update (and on-demand from certain UI actions). Computes the empire's current resource production and consumption figures, derives ratio values that scale ship performance and construction, and updates the `players` row.

## Inputs

- `series_name`, `game_number`, `empire` — identify the `players` row to update.
- `players` row (the empire's current record).
- `ships` rows for the empire in this game.
- `systems` rows owned by the empire in this game.
- `diplomacies` rows for this empire (to calculate trade bonuses).
- `series` row (for `tech_multiple`).

---

## Algorithm (pseudocode)

### Step 1 — Compute ship-based consumption

```
build_cost        = SUM(ships.build_cost       WHERE ships.orders = 'build')
maintenance_cost  = SUM(ships.maintenance_cost WHERE ships.orders <> 'build')
fuel_cost         = SUM(ships.fuel_cost        WHERE ships.orders <> 'build')
```

Ships with `orders = 'build'` contribute only to `build_cost`.  
All other ships (flying, orbiting, etc.) contribute `maintenance_cost` and `fuel_cost`.

### Step 2 — Compute system-based production

```
mineral     = SUM(MIN(systems.population, systems.mineral)    WHERE owner = empire)
fuel        = SUM(MIN(systems.population, systems.fuel)       WHERE owner = empire)
agriculture = SUM(systems.agriculture                         WHERE owner = empire)
population  = SUM(systems.population                          WHERE owner = empire)
max_pop     = SUM(systems.max_population                      WHERE owner = empire)
```

Production is capped per system at `MIN(population, mineral)` for minerals (and similarly for fuel). Agriculture is not capped by population at the per-system level.

### Step 3 — Apply trade bonus

```
trade_count = COUNT(diplomacies WHERE game_id = game AND empire = empire AND status > 3)
trade_multiplier = 1.0 + (trade_count * 0.10)

mineral     *= trade_multiplier
fuel        *= trade_multiplier
agriculture *= trade_multiplier
```

The trade bonus is additive (10% per trade partner) and is applied equally to all three production values.

### Step 4 — Compute consumption totals

```
mineral_use = build_cost + maintenance_cost
fuel_use    = fuel_cost
```

### Step 5 — Compute ratios

```
if mineral_use > 0:
  mineral_ratio = mineral / mineral_use
else:
  mineral_ratio = NULL   // no consumption; ratio is undefined

if fuel_use > 0:
  fuel_ratio = fuel / fuel_use
else:
  fuel_ratio = NULL      // no consumption; ratio is undefined

if population > 0:
  agriculture_ratio = agriculture / population
else:
  agriculture_ratio = 1.0
```

Ratios > 1.0 indicate surplus; ratios < 1.0 indicate deficit and reduce ship effectiveness.

### Step 6 — Compute tech development

```
total_production  = mineral + fuel
total_consumption = build_cost + maintenance_cost + fuel_use   // build + maint + fuel

if total_production > 0:
  tech_development = ((total_production - total_consumption) / total_production) * series.tech_multiple
else:
  tech_development = series.tech_multiple    // baseline if no production
```

`tech_development` represents the surplus fraction of production, scaled by the series tech multiplier. It accumulates in `players.tech_level` each update turn.

### Step 7 — Write back to `players`

```
UPDATE players SET
  mineral            = mineral,
  fuel               = fuel,
  agriculture        = agriculture,
  population         = population,
  max_population     = max_pop,
  build              = build_cost,
  maintenance        = maintenance_cost,
  fuel_use           = fuel_cost,
  mineral_use        = mineral_use,
  mineral_ratio      = mineral_ratio,
  fuel_ratio         = fuel_ratio,
  agriculture_ratio  = agriculture_ratio,
  tech_development   = tech_development
WHERE series_name = series_name AND game_number = game_number AND name = empire
```

### Step 8 — Update empire peak power records

```
economic_power = getEconomicPower(series_name, game_number, empire)
military_power = getMilitaryPower(series_name, game_number, empire)

if economic_power > empires.max_economic_power:
  UPDATE empires SET max_economic_power = economic_power WHERE name = empire

if military_power > empires.max_military_power:
  UPDATE empires SET max_military_power = military_power WHERE name = empire
```

Only the high-water mark is updated (never decremented).

---

## Effect on gameplay

| Ratio | Effect when < 1.0 |
|-------|-------------------|
| `mineral_ratio` | Scales down ship combat power (`br`) and build throughput |
| `fuel_ratio` | Reduces a ship's ability to absorb damage in combat; ships in deficit are more vulnerable |
| `agriculture_ratio` | Affects population growth rate (population above `agriculture` cannot grow) |

A `NULL` ratio (zero consumption) is treated as fully satisfied (ratio = 1.0) by the combat and movement engines.

---

## Notes

- `recalculateRatios` is called from `update.php` after each turn for every active player.
- Production is not stored directly — only the ratio values are persistent and used downstream.
- The trade bonus (`+10% per partner`) rewards diplomacy but is not compounding (it is additive: 3 trade partners = 30% bonus, not 33.1%).
- Tech development can be negative if an empire is running a heavy deficit, though `players.tech_level` is never decremented below 1.0 (the decrement guard is in the update loop, not in `recalculateRatios` itself).
