# Ships & Combat

Source code: `game/ships.php`, `update.php`, `update/moveship.php`

## Purpose

Document ship state, orders and combat resolution used by the update loop and UI.

## Ship model (fields)

- `id`, `type` — canonical ship type.
- `owner`, `player_id`, `game_id`, `series_id` — ownership and scoping.
- `br` (float) — current Battle Rating.
- `max_br` (float) — maximum BR for ship (scaled down when damaged by engineers/jump loss).
- `orders`, `order_arguments` — current order and argument (coordinates/fleet ids).
- `location` — galactic coord string "x,y".
- `fleet_id` — non-zero if part of a fleet.
- `cloaked` — boolean flag.

## BR maintenance and presentation

- At the start of each update, ship BR is adjusted by maintenance/fleet modifiers in code:
  - `ship.br = min(ship.max_br, ship.br * player.mineral_ratio)` — applies mineral maintenance multiplier.
- UI shows `current BR` and `next BR` where `next BR = min(ship.br * player.mineral_ratio, ship.max_br)` to indicate expected post-maintenance value.

## Fleet strength

- Fleet/owner combat strength is computed as:
  - `BP_owner = SUM(ship.br^2)` (SQL: `SUM(br*br)`)
  - Displayed fleet BR = `sqrt(BP_owner)` (i.e., sqrt of summed squares).
- This makes combining ships produce Euclidean growth, not linear aggregation.

## Orders and processing

- Orders include: `move`, `explore`, `build`, `dismantle`, `send` (stargate/jumpgate), `open`/`close` (engineer), `colonize`, `terraform`, `invade`, `nuke`, `cloak`/`uncloak`, `morph`.
- Fleet orders cascade to member ships (fleet-level `order_arguments` may be coordinates or action keywords); fleet screen shows aggregated fleet BR and inventory.
- `build` increments `built_ships` during ship loop; `dismantle` removes ships immediately and adjusts population if applicable.

## Build / Dismantle impacts

- Building a `Colony` ship reduces the location's population by one at order time; cancelling builds restores population.
- `Cancel All Builds` flow: finds ships with `orders='build'` and owner, counts colony builds and increments the corresponding system population by the canceled count, then deletes building ships.

## Cloaking

- `cloak` sets `ship.cloaked = 1`; cloaked ships are excluded from sight/battle queries (`cloaked = '0'` used in selects).
- `uncloak` clears cloaking and can produce a missive to nearby players if `series.cloakers_as_attacks` is enabled.

## Combat resolution (summary)

1. For each system, collect non-cloaked ships grouped by owner.
2. Compute each owner's battle points: `BP_owner = SUM(br^2)`.
3. Determine allegiances (enemies/allies) via `allegiances()` using `diplomacies` and team rules.
4. For each owner A, allocate its BP proportionally against enemy owners; accumulate `damage_received[owner]`.
5. For each owner, compute `dest = damage_received[owner] / 2` (energy to destroy ships).
6. Iterate ships in random order; if `pow(ship.br,2) * fuel_ratio <= dest` then destroy ship (DELETE), subtract used energy from `dest`.
7. Recompute remaining BP and derive `damage_ratio = 1 - ((damage_received/2 + dest) / BP_remaining)`.
   - If `damage_ratio <= 0` delete all survivors; else scale survivor `br = br * damage_ratio` (SQL `UPDATE ships SET br = br*damage_ratio`).

Notes:
- `fuel_ratio` reduces effective BR when less than 1; used in damage and BR calculations.
- `Minefield` ships are immune to DEST but explode if certain conditions met; `Minesweeper` marks sweeping.

## Jumpgates / Stargates (send)

- `send[origin][dest] = stargate_ship_id` queue processed after battles.
- For `Jumpgate` type: compute range = floor(stargate.br * jumpgate_range_multiplier) (multiplier from `game_ship_type_options` or `series_ship_type_options`). If dest within square bounds, move ships; then apply `loss` value to the gate (`game_ship_type_options['Jumpgate']['loss']`): either reduce `br`/`max_br` or consume gate (DELETE) if loss >= br or remaining max_br < loss.

## Engineers open/close

- `open` adds remote adjacency by appending coordinates into `systems.jumps` on both systems; `close` removes the adjacency.
- Engineers expend BR equal to `server.engineer_br_loss`; if remaining `max_br` < `engineer_br_loss` the engineer is consumed; otherwise `br` and `max_br` are reduced.

## Order validation and UI

- `getValidOrders()` and `fixOrders()` in `game/ships.php` produce per-ship and per-fleet valid order lists used by the UI dropdowns.
- Coordinates presented to users are localized with `xlateToLocal()`; backend stores `orders` and `order_arguments` in galactic coord space.
