# Movement & Exploration

Source: `update/moveship.php`, `update.php`

Purpose

- Describe how movement, exploration, fleet movement and "send" (stargate/jumpgate transport) orders are processed by the existing server code.

Key functions and call sites

- `move(&$series, &$game, &$explored_planets, &$history, &$missive, &$player, &$ship, &$destinationCoordinates, &$action)` (in `update/moveship.php`) — single-ship movement and exploration processing.
- `update_game()` (in `update.php`) — orchestrates per-player loops, uses `move()` when processing `move` and `explore` orders and collects `send`/`open`/`close`/`fleet` actions for later phases.

Behavior (faithful description)

- Single-ship move/explore:
  - `move()` sets `$ship['location'] = $destinationCoordinates`.
  - If `$action == 'explore'` and the player has not previously explored the coordinates, `move()`:
    - Deletes any existing `explored` rows for that player/coordinates (cleanup for shared-HQ edge cases).
    - Inserts a new `explored` row with `series_id`, `game_number`, `game_id`, `empire = player.name`, `player_id`, `coordinates`, `update_explored = game.update_count`.
    - If `series.diplomacy == 6` (Shared HQ) calls `addExploredToFriends()` to propagate exploration.
    - Deletes any scouting report row for that player/coordinates.
    - Records the location in `$explored_planets` for later missives.
  - After exploration work, `move()` calls `checkForFirstContact()` which:
    - Loads the destination system via `getSystem()`.
    - If the destination has an `owner` different from the moving ship's empire and there is no existing `diplomacies` row between the two empires, inserts two reciprocal `diplomacies` rows and records history/missives for "first contact".

- Fleet movement and fleet orders:
  - If a ship is attached to a fleet, `update_game()` copies fleet orders to ships; when the fleet has movement coordinates the ships' `location` is set to `fleet.order_arguments`.
  - Fleet-level orders like `colonize`, `terraform`, `invade`, and `nuke` are converted into per-location arrays (`$colonize`, `$terraform`, `$invade`, `$nuke`) keyed by the fleet location for later processing.

- Send (stargate/jumpgate transport):
  - During the per-ship pass, `update_game()` collects `send[origin][destination] = ship.id` entries.
  - Actual teleportation is done later in the update (stargate/jumpgate processing): ships owned by the stargate owner at the stargate's location are moved to the destination by SQL `UPDATE` (excluding special types like `Stargate`, `Minefield`, `Satellite`, `Jumpgate`). Fleets are moved similarly.

Notes & implementation details

- `move()` itself updates in-memory `$ship` and exploration tables but does not perform additional fuel accounting; fuel/maintenance bookkeeping occurs elsewhere in the update flow.
- The code seeds the random number generator (`srand(time())`) and uses `ORDER BY RAND()` for randomized evaluation order of certain lists (e.g., ship processing and combat target selection).

Acceptance checks

- Given a ship with `orders='move'` and valid destination, after `update_game()` the `ships.location` should equal the destination.
- Given an unexplored destination and a ship with `orders='explore'`, `explored` should have a new row for that player and `scouting_reports` for that coordinate should be deleted.
