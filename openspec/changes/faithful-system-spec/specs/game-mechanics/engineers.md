# Engineers: Open & Close Jumps

Source: `update.php` (open/close processing loops), `game/makemap.php` (helper `array_remove`) 

Purpose

Document how `Engineer` ships `open` and `close` jump orders, the `systems.jumps` field semantics, and the BR cost / consumption rules for engineers.

Key concepts

- `systems.jumps` is a space-separated adjacency list stored on each `systems` row. Opening/closing a jump mutates both systems' `jumps` fields to maintain symmetric adjacency.
- Engineers pay a BR cost `server.engineer_br_loss` when opening or closing a jump:
  - Compute `new_maxbr = ship.max_br - server.engineer_br_loss`.
  - If `new_maxbr < server.engineer_br_loss` then the engineer is consumed and deleted.
  - Otherwise the engineer is crippled: `br` is reduced by `server.engineer_br_loss` and `max_br` set to `new_maxbr`.

Close behavior

- For each `close` order at `location`:
  - Load the system's current `jumps` array (explode on space).
  - If the ship exists, has `br >= server.engineer_br_loss` and the jump to close exists in the list:
    - Load the remote system (`system2`) and its jumps (explode).
    - Remove each side's coordinate from the other using `array_remove()` and persist both `systems.jumps` fields.
    - Apply the engineer BR cost (possibly consuming or crippling the ship). If consumed, delete it; otherwise update `br` and `max_br`.
    - Add a `close` action to `$missive[$location]['neer']` describing the event and push a history entry: `['location', ship.owner, 'closed', '<target_coord>/<ship_name>/<yes|no>']` where `yes` indicates the engineer was consumed.

Open behavior

- For each `open` order at `location`:
  - Load the system `jumps` and verify the requested remote coordinate is not already present and ship has sufficient BR.
  - Fetch the remote system, append each other's coordinates to the respective `jumps` arrays, and persist both systems.
  - Apply engineer BR cost as in `close` (consume or cripple), and record the `open` action in `missive` and history with `opened` tag and consumed flag.

Edge cases and limits

- The UI limits a system to 4 jumps; `getValidOrders()` prevents opening new jumps if `count($jumps) >= 4`.
- The code uses `array_remove()` (defined in `sc.php`) to remove adjacency entries; maintain exact string-space semantics when reimplementing.

Acceptance tests

1) Close an existing jump
  - Given two systems A and B with mutual adjacency in `systems.jumps`, an engineer at A with `br >= engineeer_br_loss` sends `close` for B.
  - Expect: Both `systems.jumps` fields no longer contain each other's coordinates; engineer's `br`/`max_br` updated or engineer removed depending on `max_br` after cost; history and missive created.

2) Open a new jump
  - Given two non-adjacent systems A and B and an engineer at A with sufficient BR, after update both systems list each other in `systems.jumps` and engineer is consumed or crippled accordingly.
