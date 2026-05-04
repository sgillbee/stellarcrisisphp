# Update Loop (faithful spec)

Source: `update.php`, helpers in `update/moveship.php`, and supporting DB tables in `sc.sql`.

Purpose: Provide a step-by-step, testable pseudocode description of the per-update processing performed by `update_game()` in the existing system.

High-level phases

1. Preparation & locking
   - Mark game as `processing=1` / `updating='1'` to prevent concurrent updates.
   - Read game, series and per-player ratios (fuel_ratio, mineral_ratio) and global options (e.g., `visible_builds`, `diplomacy`, `team_game`).

2. Load orders & state
   - Load all `ships` and `fleets` for the game with their `orders` and `order_arguments`.
   - Load `systems`, `explored`, and `players` rows required for processing.

3. Movement phase
   - For each mobile ship/fleet with a `move` or `explore` order, call `move()` (see `update/moveship.php`) to validate destination, deduct fuel, update `location`, and insert `explored` rows when exploration occurs.
   - Handle cloaking/visibility rules: cloaked ships are excluded from enemy counts unless series options permit.

4. Build / construct phase
   - Process `build` orders (ships with `orders='build'`), applying `build_cost` and creating new `ships` rows where appropriate (series/game options may override costs). Visibility rules (`visible_builds`) affect UI display but not server processing.

5. Special action resolution (pre-combat)
   - Resolve immediate, non-combat actions that can affect system state: open/close stargates/jumpgates, lay minefields, minesweeper actions, engineer builds/dismantles.

6. Combat detection and grouping
   - For each system where opposing empires' visible (to the current perspective) ships co-exist and diplomacy state indicates hostility, group ships into combatants by side (attacker(s) vs defender(s)).

7. Combat resolution
   - For each contested system, execute combat algorithm (see `combat.md`) which:
     - Computes per-side power using SUM(POW(br,2)) and applies fuel_ratio/tech modifiers.
     - Iteratively selects ships (randomized order) and determines destruction using a threshold test derived from pow(ship.br,2) vs computed damage pool.
     - Scales surviving ships' `br` values by a damage_ratio (UPDATE ships SET br = br * damage_ratio) to reflect partial damage.
     - Writes `history` entries describing losses and results.

8. Post-combat special actions
   - Handle invasion/colonization/terraforming results, troop transport offloads, colony creation or system ownership changes.
   - Apply nukes: set `systems.annihilated = '1'`, zero population, remove ships; increment player `nukes`/`nuked` counters and write `history` events.

9. Cleanup & persistence
   - Remove destroyed ships and empty fleets; update `systems.population`, `players.population`, `players.mineral`/`fuel` adjustments; write per-player maintenance/fuel bookkeeping.
   - Insert `history` rows and push `messages` to affected players (annihilations, eliminations, diplomatic changes).

10. End-of-update tasks
   - Increment `games.update_count`, `games.last_update`, clear `processing` flag.
   - Run endgame detection: check for eliminated players, compute winners/draws (respect `series.can_draw`, `games.diplomacy`), and set `games.closed` as needed; write `gamelog` entries.

   Concurrency and consistency caveats

   - The implementation contains commented-out `LOCK TABLES` and explicit transaction markers; in practice the game often runs on non-transactional storage engines and without enforced table locking. The spec therefore documents that `update_game()` is not guaranteed to be atomic across all deployments and that external coordination (a single update worker, cron job, or application-level semaphore) is recommended to prevent concurrent updates.

   Edge behavior notes

   - Because the codebase uses `ORDER BY RAND()` in some selection paths and seeds the PRNG with time, results for combat and destruction order are non-deterministic. Tests should assert properties rather than exact identities unless a test harness enforces a fixed `srand()` seed.

Acceptance tests (high-level)

- Movement acceptance: Given a `ships` row with `orders='move'` and valid destination, after update the `ships.location` equals destination and `player.fuel` decreased by `fuel_cost`.
- Combat acceptance: Given two ships A (br=10) and B (br=10) from hostile empires at same location, after update at least one ship is destroyed or both have reduced `br` and a `history` event recorded.
- Nuke acceptance: When a nuke action is executed on a populated system, `systems.annihilated` becomes '1', `systems.population` becomes 0, and `ships` at that system are deleted.

Edge cases

- Shared HQ / diplomacy: If `games.diplomacy` or `series.team_game` change alliance behavior, the grouping logic must respect alliance/team membership.
- Visibility: cloaked ships and scouting reports impact whether ships are counted for combat from a given player's perspective; update engine uses full-state but writes scouting/history appropriately.
