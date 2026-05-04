# Invasion, Colonization & Terraforming

Source: `update.php` (invade, colonize, terraform blocks)

Purpose

Capture the exact success/failure rules and DB mutations for `invade`, `colonize`, and `terraform` orders.

Invade

- Success condition: `if ($ship['br']*10 > $system['population'])` then invasion succeeds.
- On success:
  - Add missive and history entries indicating the successful invasion.
  - If `system.homeworld` is not empty, queue elimination for that homeworld owner for post-update cleanup.
  - Update system fields:
    - `homeworld = ''`
    - `owner = <ship.owner>`
    - `population = round(system.population / 2)`
  - In `Shared HQ` series (`$series['diplomacy'] == 6`) the invader gets an `explored` row for the system (delete any existing explored row for the player/coords, insert new `explored` and call `addExploredToFriends()`).
  - The invading ship is deleted (`DELETE FROM ships WHERE id = <ship.id>`).
  - The update loop breaks for the system on successful invasion (no further invaders processed for that system in this update).
- On failure:
  - Add missive/history for unsuccessful invasion.
  - Reduce `system.population` by `floor(2 * $ship['br'])` and persist it.
  - The invading ship is deleted.

Colonize

- On colonize orders, for the first eligible `Colony` ship at the location:
  - Missive and history entry recorded.
  - Compute initial population: `initial_population = max(pow((float)$ship['br'], 2), 1)`.
  - Compute new max population: `max_pop = max(1, max($system['mineral'], $system['fuel']))`.
  - Update `systems` row: set `population = initial_population`, `owner = ship.owner`, `max_population = max_pop`.
  - In Shared HQ, insert `explored` and call `addExploredToFriends()` as with invasion.
  - Delete the colony ship and stop processing more colonizes at that location.

Terraform

- For each `Terraformer` ship at the location, in turn:
  - Increase `system.agriculture` by `floor($ship['br'] * 10)` but cap at `max($system['mineral'], $system['fuel'])`.
  - Record a `terraformed` history entry and delete the terraformer ship.
  - Stop processing further terraformers for the system once agriculture reaches the cap.
  - After processing, the code composes a `missive` describing how many times it was terraformed and by whom.

Acceptance tests

1) Successful invasion
  - Given a ship with `br` such that `br*10 > population`, after update the system owner must be the ship owner and population must equal `round(old_population/2)`.

2) Failed invasion
  - Given a ship with `br*10 <= population`, the ship is removed and the system population reduced by `floor(2*br)`.

3) Colonization sets initial population and max_population
  - Colony ship with given BR results in population `max(pow(br,2),1)` and `max_population = max(1, max(mineral,fuel))`.

4) Terraforming increments agriculture and deletes terraformers
  - Each terraformer increases `agriculture` by `floor(br*10)` and is removed; stops when agriculture reaches the cap.
