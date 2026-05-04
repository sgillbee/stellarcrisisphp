# Minefields & Minesweepers

Source: `update.php` (combat post-processing and mine handling)

Purpose

- Describe minefield behavior: immunity to DEST, explosion logic, and interaction with `Minesweeper` ships.

Behavior (faithful)

- In combat, `Minefield` ships are excluded from the destruction-selection query (the code uses `type <> "Minefield"` when iterating ships to be destroyed), so they are immune to the DEST algorithm.
- If combat destroys a `Minefield`, the `$mined[$location]` flag is set.
- After combat, the update processes mined locations:
  - If `$mined[$location]` and `!$swept[$location]` (no `Minesweeper` present), then all ships at the location are destroyed (rows deleted), the system population is halved (but at least 1), a mine explosion missive is recorded, and a history entry `minefield` is inserted.
  - If a `Minesweeper` survived the battle, `$swept[$location]` is set and the minefield does not explode.

Notes

- `Minesweeper` is a ship type checked in the surviving-ship pass (presence sets `$swept[$system] = 1`).
- Minefields are immobile (`ship_types.mobile = '0'` in `sc.sql`), and are typically created via `build` orders (server-side build processing groups `built_ships`).

Acceptance checks

- If a `Minefield` is destroyed in combat and there is no `Minesweeper` present, then after the update all non-mine ships at that system are removed and the system population is halved.
# Minefields

Source: `update.php` (combat resolution and mine processing)

Purpose

Describe how `Minefield` and `Minesweeper` ship types interact with battle resolution and system-wide explosions.

Behavior summary

- During combat, `Minefield` ships are immune to the discrete-destruction phase (`DEST`) — the code excludes `type = 'Minefield'` from the immediate per-ship destruction test (the `pow(br,2) * fuel_ratio <= dest` check).
- If the final damage-scaling phase results in `damage_ratio <= 0` (all survivors wiped), the code collects all surviving ships for the owner(s) and deletes them; when iterating the survivors it flags if any destroyed ship `type == 'Minefield'` and sets `mined[system_coordinates] = 1`.
- After all battles are processed, the engine processes mined systems: for each location where `mined[location]` is true and `swept[location]` is false, the engine:
  - Selects every ship at that location, records their names into the missive, increments destroyed counters, and deletes them all (`DELETE FROM ships WHERE game_id = X AND location = Y`).
  - Updates the system population to `max(system.population/2, 1)`.
  - Adds a system-level missive: "A minefield exploded in <system> (*coord*)."
- If any surviving ship at the location has type `Minesweeper` the code sets `swept[location] = 1` during sighting/scaling, preventing the minefield explosion.

Key implementation notes

- Immunity to the DEST loop but inclusion in the final-all-wipe phase is a deliberate two-step design. When reimplementing, preserve this distinction for behavioral parity.
- The explode step occurs only when `mined` is set (by a destroyed minefield) and no sweeper saved the location (`!swept`). Sweeping requires a surviving `Minesweeper` registered in the same update.
- Population halving uses floating division and is wrapped with `max(..., 1)` in the code to ensure at least 1 population remains.

Acceptance tests

1) Minefield explosion without sweeper
  - Given: A system with a `Minefield` that is destroyed in the final destroy-phase and no `Minesweeper` survivors.
  - Expect: All ships at the system are deleted and system.population updated to `max(previous_population/2, 1)`.

2) Minesweeper prevents explosion
  - Given: A system with a `Minefield` destroyed but at least one surviving `Minesweeper` in the same update.
  - Expect: The `mined` flag remains true but because `swept[location]` is true, the explosion is skipped and ships are not mass-deleted.
