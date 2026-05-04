# Builder

Source: `game/ships.php` (orders), `game/makemap.php` (map creation helpers)

Summary

- `Builder` ships are offered `create` orders to create a new system at an adjacent coordinate via the UI. The game's map generation routines live in `game/makemap.php`.

Behavior and implementation note

- `getValidOrders()` presents `create` options for `Builder` ships when potential empty adjacent coordinates exist.
- In the repository scan for the update loop, there is no `create` order handler in `update.php` that performs a dynamic `INSERT INTO systems` for a player-issued `create` order; the only `INSERT INTO systems` found is in `game/makemap.php` used for map generation.
- Conclusion: the `create` UI option is available, but there is no evidence of server-side runtime `create` processing during `update()` in the current codebase. If on-purpose dynamic system creation is required during updates, implement a handler that validates adjacency, consumes builder BR, and inserts a `systems` row (use `game/makemap.php` as a reference for required fields).

Acceptance tests

1) UI shows `create` when potential jumps exist; no `systems` row is added after a standard update in current codebase (explicit test to assert no new system rows appear).
