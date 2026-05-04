# Combat: math and resolution

Source: `update.php` (combat section) and fleet power calculations used across UI (`game/ships.php` and update code).

Overview

- Ships have a per-ship battle rating (`ships.br`). Combined fleet strength is computed using the Euclidean norm over BRs: fleet_BR = sqrt(sum_i br_i^2) (used in UI). The update engine uses squared BR sums (SUM(br^2)) as the primary power metric during resolution.

Primary quantities

- For a side S with ships s_i, compute power P_S = SUM_i POW(s_i.br, 2).
- Damage pools and modifiers incorporate per-player `fuel_ratio` and series/game-level `loss`/`range_multiplier` overrides.

Resolution algorithm (faithful pseudocode)

1. Compute P_att, P_def for the two sides.
2. Determine net damage pools based on opposing power and fuel ratios.
   - The code compares ship squared-BR against the damage threshold when deciding destruction (see discrete destruction test below).
3. Randomize an ordered list of candidate ships (the original code uses an ORDER BY RAND() style approach for selection fairness).
4. For each candidate ship in randomized order, evaluate:
     if ( POW(candidate.br, 2) * fuel_ratio <= dest ) then
         mark ship as destroyed (remove later)
         subtract POW(candidate.br, 2) from dest
     end

   - `dest` is the remaining damage pool available to remove enemy ships; the inequality above is the discrete destruction test observed in the codebase.

5. After the destruction loop, compute surviving power and damage_ratio = sqrt(remaining_power / initial_power) and update surviving ships' `br` values:
     UPDATE ships SET br = br * damage_ratio WHERE ship_survives

6. Record combat events in `history` and `messages` describing destroyed ships and outcome.

Notes and rationale

- Using POW(br,2) gives larger ships disproportionately more effect; this matches the code's use of squared BR to aggregate and to decide destruction thresholds.
- The randomization of evaluation order prevents deterministic targetting of small ships first and approximates simultaneous engagements.

Acceptance example (numeric)

- Given attacker ships: A1(br=10), A2(br=5) -> P_att = 100 + 25 = 125.
- Given defender ships: D1(br=12) -> P_def = 144.
- Damage allocation will compare POW(ship.br,2) against damage pool slices; outcomes should reflect at least one of the above being destroyed or reduced BR.

Test assertions (example SQL)

- Before update: `SELECT SUM(POW(br,2)) FROM ships WHERE location='10,5' AND owner='Attacker'` -> 125
- After update: `SELECT COUNT(*) FROM ships WHERE location='10,5' AND owner='Defender'` -> expected <= 1 (defender losses may occur)
