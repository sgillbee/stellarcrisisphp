# Movement & First Contact

Source: `update/moveship.php`, callers in `update.php`, helpers in `sql.php` (`getDiplomacyWithOpponent`).

Purpose

Precisely document the `move()` behavior (applies to both `move` and `explore` orders) and the `checkForFirstContact()` side-effects so the update flow can be replicated or reimplemented.

Function signature

function move(&$series, &$game, &$explored_planets, &$history, &$missive, &$player, &$ship, &$destinationCoordinates, &$action)

Overview

- `move()` updates the in-memory `ship['location']` to `destinationCoordinates`.
- If `$action == 'explore'` and the player hasn't already explored the coordinates, `move()` inserts an `explored` row, removes any stale `scouting_reports` for that player/coord, and sets a local `explored_planets[coord] = 1` flag used by the update report.
- `move()` always invokes `checkForFirstContact()` which may insert diplomacy rows and add history/missive entries if the destination system is owned by another empire and no diplomacy record exists yet.
- IMPORTANT: `move()` mutates the PHP `$ship` structure (so `location` is updated in-memory). Persisting the ship record to the DB is performed later in the update loop (`update.php` issues `UPDATE ships SET ... WHERE id = ...`).

Detailed behavior and DB side-effects

- Set in-memory location:
  - `$ship['location'] = $destinationCoordinates;`

- Explore handling (only when `$action == 'explore'` and not already explored):
  - Delete any existing `explored` rows for this `player_id` and `coordinates`:
    - `DELETE FROM explored WHERE player_id = "{$player['id']}" AND coordinates = "{$destinationCoordinates}"`
  - INSERT new `explored` row with fields:
    - `series_id = $series['id']`
    - `game_number = $game['game_number']`
    - `game_id = $game['id']`
    - `empire = "$player['name']"`
    - `player_id = "$player['id']"`
    - `coordinates = "$destinationCoordinates"`
    - `update_explored = "{$game['update_count']}"`
  - If `$series['diplomacy'] == 6` (Shared HQ variant): call `addExploredToFriends($player, $mysqli->insert_id)` to duplicate the explored row for teammates/friends.
  - Delete matching scouting reports for the player & coordinate:
    - `DELETE FROM scouting_reports WHERE player_id = "{$player['id']}" AND coordinates = "{$destinationCoordinates}"`
  - Flag `$explored_planets[$destinationCoordinates] = 1` for the turn report.

- First contact detection (`checkForFirstContact()`):
  - Resolve destination system via `getSystem($game['id'], $destinationCoordinates)`.
  - If `destination.owner` is non-empty and not equal to `$playerName`:
    - If no diplomacy exists between the two empires (`getDiplomacyWithOpponent($game['id'], $playerName, $destination['owner'])` returns falsy):
      - INSERT two `diplomacies` rows (one for each direction) with `series_id`, `game_number`, `game_id`, `empire`, `opponent`.
      - Append: `$history[] = array($destination['coordinates'], $playerName, 'ship to system', $destination['owner']);`
      - Add missives for both players:
        - `$missive[$coord]['first_contact'][$playerName][] = 'You have had first contact with {owner} in {name} (*coord*) (ship to system).'`
        - And reciprocal message for the system owner (`system to ship`).

Pseudocode (concise)

```
// Called during order processing for 'move' and 'explore'
ship.location = destinationCoordinates

if action == 'explore' and not explored(player, destinationCoordinates):
    DELETE FROM explored WHERE player_id=player.id AND coordinates=destinationCoordinates
    INSERT INTO explored (series_id, game_number, game_id, empire, player_id, coordinates, update_explored)
    if series.diplomacy == 6: addExploredToFriends(player, last_insert_id)
    DELETE FROM scouting_reports WHERE player_id=player.id AND coordinates=destinationCoordinates
    explored_planets[destinationCoordinates] = true

checkForFirstContact(series, game, player.name, destinationCoordinates, history, missive)
```

Edge cases and notes

- `move()` does NOT validate move range, fuel, gate range, or adjacency — that validation is handled elsewhere prior to choosing the `move` order (or by `update.php` when interpreting fleet orders). `move()` is a state mutator and explorer notifier.
- `move()` does perform DB writes for `explored` and `scouting_reports` and triggers diplomacy inserts via `checkForFirstContact()`; these are immediate and not deferred.
- `checkForFirstContact()` uses `getDiplomacyWithOpponent()` which returns an associative row if a diplomacy exists; if none, two new `diplomacies` rows are created.
- The update loop persists `ship.location` and other ship fields after `move()` returns (see `update.php` which executes `UPDATE ships SET location = ... WHERE id = ...`).
- Race conditions: simultaneous moves by multiple ships into the same system during the same update are resolved within the same update transaction; `checkForFirstContact()` checks for an existing diplomacy row and inserts if absent — since the update loop runs inside a DB transaction and the code checks/creates rows, the first insertion wins for that update.

Acceptance tests (spec-style, SQL assertions)

1) Explore an unexplored unowned system
  - Given: `systems` has a row at `coords='10,10'` with `owner=''`. Player A has a ship S with `orders='explore'` and `order_arguments='10,10'`. No `explored` row exists for A/10,10.
  - When: one update iteration runs and the ship processes `explore`.
  - Expect:
    - `explored` contains a new row with `player_id = A.id` and `coordinates = '10,10'` and `update_explored = game.update_count`.
    - Any `scouting_reports` rows for A and '10,10' are deleted.
    - `$explored_planets['10,10']` was set (turn report contains an exploration line for A).

2) Move into another player's system with no diplomacy (first contact)
  - Given: System at `coords='5,5'` has `owner='B'`. Player A has no diplomacy row with B.
  - When: Ship owned by A issues `move` to '5,5' and update executes.
  - Expect:
    - Two new rows in `diplomacies`: (empire='A',opponent='B') and (empire='B',opponent='A') for this game/series.
    - History array includes an entry: `[ '5,5', 'A', 'ship to system', 'B' ]`.
    - `messages`/`missive` buffers include a `first_contact` string for both A and B describing the contact.

3) Move into a system owned by same player or already-diplomatic opponent
  - Given: destination owner == playerName, or `diplomacies` already has a row for (A,B).
  - Expect: `checkForFirstContact()` performs no inserts; no `first_contact` missives are generated.

4) Idempotency: repeated `explore` on already-explored planet
  - Given: `explored` contains a row for A/'X'. Ship S issues `explore` to X.
  - Expect: No new `explored` rows inserted and no `scouting_reports` deletion occurs (or no-op), i.e. observed state unchanged.

Implementation notes for reimplementation

- When reimplementing movement semantics, replicate the immediate DB writes for `explored` and `diplomacies` while remembering that `ship.location` is only persisted by the surrounding update loop.
- Keep the exact missive strings and history tuple shapes if preserving UX parity matters.
# Movement & Exploration

Source code: `update/moveship.php`

## Purpose

Describes how the system processes `move` and `explore` orders for individual ships, and how first contact is detected.

## Function: `move()`

Signature: `move(&$series, &$game, &$explored_planets, &$history, &$missive, &$player, &$ship, &$destinationCoordinates, &$action)`

Behavior (step-by-step):

1. Set the ship's runtime `location` to `destinationCoordinates`.
2. If `action == 'explore'` and the player hasn't explored the coordinates yet:
   - Delete any stale `explored` row for this player/coords.
   - INSERT a new `explored` row with `series_id`, `game_number`, `game_id`, `empire` (player name), `player_id`, `coordinates`, and `update_explored = game.update_count`.
   - If the series uses Shared HQ (`series['diplomacy'] == 6`), call `addExploredToFriends()` to replicate explored data to allied players.
   - Delete any `scouting_reports` for this player and coordinates.
   - Mark the coordinates in the local `$explored_planets` array for the per-player update report.
3. Call `checkForFirstContact()` to detect and record first-contact diplomacy and to populate `$history` and `$missive` entries.

## Function: `checkForFirstContact()`

Purpose: When a ship arrives at a system, check whether the system has an owner different from the arriving player. If so, and no diplomacy row exists between them, insert reciprocal `diplomacies` rows, add a `history` entry, and add `first_contact` messages to the `$missive` buffer for both empires.

Triggers: called from `move()` and also from `update.php` when stargate/jumpgate sends occur.

Notes/Edge cases:
- Cloaked ships are still subject to move/explore orders; visibility of exploration to other players is governed by `explored()` checks and `scouting_reports`.
- `explore` inserts are idempotent: existing rows are removed first to avoid duplicates (Shared HQ interactions require this).
