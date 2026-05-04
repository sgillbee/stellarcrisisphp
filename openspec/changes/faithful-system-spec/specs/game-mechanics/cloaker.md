# Cloaker

Source: `game/ships.php` (valid orders), `update.php` (order processing)

Summary

- `Cloaker` ships can toggle stealth via the `cloak` and `uncloak` orders.

Behavior

- `cloak` sets `ship.cloaked = 1` and the update loop marks the ship as ignored for further processing that update (the code sets `ignore_this_ship = 1`). Cloaked ships are excluded from battle SQL queries (`WHERE cloaked = "0"`).
- `uncloak` sets `ship.cloaked = 0` and the ship is processed normally; when `series.cloakers_as_attacks` is true, an `uncloak` generates an `uncloak` missive visible to players at the system.
- The UI exposes `cloak`/`uncloak` via `getValidOrders()`.

Interactions

- Cloaked ships cannot be targeted by the battle allocation phase because they are filtered out of `SELECT ... WHERE cloaked = "0"` queries.
- Cloak status also affects available orders (e.g., moving nukes or invasion options are only offered when not cloaked).

Acceptance tests

1) Cloaking hides ship from battle selection: set `ship.cloaked = 1`, run update, assert ship is not included in `SUM(br*br)` calculations for its system.
2) Uncloak generates missive when `series.cloakers_as_attacks` is enabled.
