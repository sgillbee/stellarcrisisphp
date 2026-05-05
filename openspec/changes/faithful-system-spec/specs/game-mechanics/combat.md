# Combat: math and resolution

Source: `update.php` (combat section) and fleet power calculations used across UI (`game/ships.php` and update code).

Overview

- Ships have a per-ship battle rating (`ships.br`). Combined fleet strength is shown in the UI as the Euclidean norm: `fleet_BR = sqrt(SUM(br_i^2))`. The update engine uses raw squared-BR sums (`SUM(br^2)`) as the primary power metric during resolution.

Primary quantities

- For a side S with ships s_i: `power_S = SUM_i POW(s_i.br, 2)`.
- The `fuel_ratio` of the defending empire scales both their offensive contribution and damage absorption.

Resolution algorithm (faithful pseudocode)

```
// Step 1 — Group ships by allegiance at this system
for each empire at location:
  battle_points[empire] = SUM(POW(br, 2)) for all non-cloaked, non-Minefield ships

  if empire.fuel_ratio < 1.0 and fuel_ratio > 0:
    battle_points[empire] *= fuel_ratio      // deficit reduces offensive power

// Step 2 — Allocate damage to each empire from its enemies
for each empire at location:
  (enemies, allies) = allegiances(empire)

  if no enemies: continue

  opposing_bp = SUM(battle_points[enemy] for enemy in enemies)

  for each enemy in enemies:
    // Damage is distributed proportionally to each enemy's share of opposing power
    damage_received[enemy] += battle_points[empire] * (battle_points[enemy] / opposing_bp)

// Step 3 — Each empire takes damage
for each empire at location:

  dest = damage_received[empire] / 2     // damage pool = half of total damage received

  // Fuel deficit also reduces ability to absorb damage
  fuel_ratio = 1.0
  if empire.fuel_ratio < 1.0 and fuel_ratio > 0:
    fuel_ratio = empire.fuel_ratio

  // Randomize evaluation order (ORDER BY RAND())
  ships = SELECT * FROM ships WHERE location = loc AND owner = empire
          AND cloaked = '0' AND type <> 'Minefield'
          ORDER BY RAND()

  // Discrete destruction loop
  for each ship in randomized order:
    if POW(ship.br, 2) * fuel_ratio <= dest:
      mark ship as destroyed
      dest -= POW(ship.br, 2) * fuel_ratio      // consumed damage
    // Ships not destroyed survive (with reduced BR — see step 4)

  // Step 4 — Scale surviving ships' BR by damage_ratio
  BP_remaining = SUM(POW(surviving_br, 2)) * fuel_ratio

  if BP_remaining > 0:
    // remaining_dest = portion of the half-damage pool not consumed by destroyed ships
    damage_ratio = 1 - ((damage_received[empire] / 2 + remaining_dest) / BP_remaining)

    // damage_received/2 + remaining_dest = total_damage - power_absorbed_by_destroyed_ships
    // When all damage was absorbed by destroyed ships: damage_ratio → 1.0 (no BR reduction)
    // When surviving ships took excess damage: damage_ratio < 1.0

    if damage_ratio <= 0:
      // Remaining surviving ships are also wiped out (total annihilation)
      DELETE FROM ships WHERE location = loc AND owner = empire AND cloaked = '0'
    else:
      UPDATE ships SET br = br * damage_ratio
      WHERE location = loc AND owner = empire AND cloaked = '0'

// Step 5 — Record history and messages
// Insert history rows for destroyed ships; send missive notifications to affected players
```

Notes on `damage_ratio` formula

```
damage_ratio = 1 - ((damage_received[empire] / 2 + remaining_dest) / BP_remaining)
```

Algebraically, `damage_received/2 + remaining_dest` simplifies to:

```
initial_dest + (initial_dest - power_absorbed_by_destroyed_ships)
= total_damage_received - power_absorbed_by_destroyed_ships
```

This is the net unabsorbed damage. Dividing by `BP_remaining` (the surviving power) gives the fraction of surviving power that the leftover damage represents; the complement is the BR scale factor.

Notes and rationale

- Using `POW(br, 2)` gives larger ships disproportionately more effect; this is intentional (matches original SC3.x design).
- The randomization of evaluation order prevents deterministic targeting of small ships.
- Minefields (`type = 'Minefield'`) are immune to the destruction loop; they detonate separately and destroy all ships in the system if no Minesweeper is present.
- Cloaked ships (`cloaked = '1'`) are excluded from combat entirely.

Acceptance example (numeric)

- Attacker ships: A1(br=10), A2(br=5) → power_att = 100 + 25 = 125.
- Defender ships: D1(br=12) → power_def = 144.
- damage_received[attacker] from defender = 144 (if no allies or fuel deficit).
- damage_received[defender] from attacker = 125.
- dest for attacker = 72; dest for defender = 62.5.
- Defender D1 (pow = 144): 144 * 1.0 = 144 > 62.5 → survives.
- Attacker A1 (pow = 100): 100 > 72 → survives; A2 (pow = 25): 25 ≤ 47 (after A1 not destroyed, dest still 72) → A2 destroyed if 25 ≤ 72.
- (Exact results depend on ORDER BY RAND() evaluation order.)

Test assertions (example SQL)

- Before update: `SELECT SUM(POW(br,2)) FROM ships WHERE location='10,5' AND owner='Attacker'` → 125
- After update: `SELECT COUNT(*) FROM ships WHERE location='10,5' AND owner='Defender'` → expected <= 1 (defender losses may occur)
