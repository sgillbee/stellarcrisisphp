# Colony

Source: `game/ships.php` (orders), `update.php` (colonize handling)

Summary

- `Colony` ships execute `colonize` orders to establish ownership of an unowned system.

Behavior

- `colonize` is only available on non-annihilated, unowned systems.
- On colonization the system's `population` is set to `initial_population = max(pow(ship.br, 2), 1)` and `owner` is set to the ship owner; `max_population` is set to `max(1, max(mineral, fuel))`.
- The colony ship is deleted after colonization and Shared HQ players receive explored rows for the system.

Acceptance tests

1) Colonize: system owner set to ship.owner and population initialized to pow(br,2) (min 1).
