# Stargates & Jumpgates (Send)

Source: `update.php` (send processing), `game/ships.php` (`getValidOrders`), `admin/jumpgatefunctions.php`.

Purpose

Document the semantics of the `send` order (used by `Stargate` and `Jumpgate` ship types): how ships and fleets are transported, what types are excluded, first-contact behavior, and the `Jumpgate` durability (`loss`) mechanics.

Overview

- Players issue a `send` order from a gate ship. `getValidOrders()` builds the available `send` destinations differently depending on gate type:
  - `Stargate`: destination list is systems owned by the gate owner (and friends in Shared HQ games).
  - `Jumpgate`: destination list includes explored systems within a computed square range based on `floor(max_br * range_multiplier)` where `range_multiplier` comes from the game's `Jumpgate` ship type options.
- During the update, `send` orders are queued as `$send[origin][destination] = ship_id` (the gate ship id). Later the update loop processes each origin→destination mapping and uses the referenced ship record as the `stargate` to perform transport.

Transport rules (exact behavior from `update.php`)

1. For each `$origin` in keys of `$send` and each `$destination` in keys of `$send[$origin]`:
   - Resolve `$stargate = getShipByID($send[$origin][$destination])`.
   - If `$stargate` exists, execute:
     - Move all ships that satisfy ALL of:
       - `game_id = $game['id']`
       - `location = $stargate['location']` (origin coordinate)
       - `FIND_IN_SET(type, "Stargate,Minefield,Satellite,Jumpgate") = 0` (i.e., exclude types: `Stargate`, `Minefield`, `Satellite`, `Jumpgate`)
     - The SQL used in the code is equivalent to:
       - `UPDATE ships SET location = "<destination>" WHERE game_id = <game.id> AND location = "<stargate.location>" AND FIND_IN_SET(type, "Stargate,Minefield,Satellite,Jumpgate") = 0`.
     - Transport fleets owned by the gate owner that are at the origin:
       - `UPDATE fleets SET location = "<destination>" WHERE game_id = <game.id> AND owner = "<stargate.owner>" AND location = "<stargate.location>"`.
     - Call `checkForFirstContact($series, $game, $stargate['owner'], $destination, $history, $missive)` to register first-contact if applicable.

Jumpgate durability / loss

- After transport, if the `$stargate['type'] == 'Jumpgate'`, the code processes a configured `loss` value (from `$game['ship_type_options']['Jumpgate']['loss']`):
  - Let `jumpgate_loss = $game['ship_type_options']['Jumpgate']['loss']`.
  - If `jumpgate_loss > 0`:
    - If `jumpgate_loss >= $stargate['br']` OR `($stargate['max_br'] - $jumpgate_loss) < $jumpgate_loss` then the gate is consumed (deleted from `ships`). The code records a `send` action with `consumed = TRUE` in `$missive` and appends an entry into `$history` indicating the gate was consumed.
    - Else the gate is damaged: `UPDATE ships SET br = br - <jumpgate_loss>, max_br = max_br - <jumpgate_loss> WHERE id = <stargate.id>`.

Notes on queueing and collision semantics

- The `$send` queue uses assignment (`$send[origin][destination] = ship_id`), so if multiple ships at the origin issue `send` to the same destination, the last assignment wins: the gate referenced will be the last ship id written to that slot. The update code then uses that single gate record to move the ships at the origin.
- `getValidOrders()` restricts send destinations available to `Stargate` and `Jumpgate` types; in practice, UI-level validation prevents most invalid send attempts. The send processing itself does not re-check range or ownership beyond using the stored `$stargate` and SQL filter above.
- Excluded types: `Stargate`, `Minefield`, `Satellite`, `Jumpgate` are never transported by a send — they remain at origin.
- Fleets moved are filtered by ownership equal to `$stargate['owner']`, so only the gate-owner's fleets are transported.

Acceptance tests (spec-style)

1) Stargate transports ships and fleets
  - Setup: System A at coords `1,1` contains a `Stargate` (id G) owned by `Alice`, plus several ships of various movable types owned by various empires, and fleets belonging to `Alice`. `send[A][B] = G` queued.
  - When: update processes send queue with destination `B`.
  - Expect:
    - All ships at `1,1` except types `Stargate`, `Minefield`, `Satellite`, `Jumpgate` have `location = B` after update.
    - Fleets with `owner = 'Alice'` and `location = '1,1'` have `location = B` after update.
    - `checkForFirstContact()` was invoked for `Alice` at `B` (missive/history entries exist if the system is owned by another empire with no diplomacy).

2) Jumpgate applies loss correctly
  - Setup: Jumpgate `J` at origin with `br=10`, `max_br=12`. `game.ship_type_options['Jumpgate']['loss'] = 3`.
  - When: `send` processed using `J`.
  - Expect:
    - If `3 >= 10` (false) and `(12 - 3) < 3` → `(9 < 3)` (false), so gate is NOT consumed.
    - `J.br` becomes `7`, `J.max_br` becomes `9` after update.
  - If loss >= br or (max_br - loss) < loss then `J` is deleted and missive/history includes a consumed/send entry.

3) Jumpgate range and order generation
  - `Jumpgate` valid `send` destinations are computed in `getValidOrders()` and include only explored systems and (if configured) those within the computed square range `floor(max_br * range_multiplier)`.
  - `Stargate` destinations are systems owned by the gate owner (and their friends in Shared HQ games).

Implementation notes for reimplementation

- Preserve the SQL exclusion list exactly to match prior behavior: `FIND_IN_SET(type, "Stargate,Minefield,Satellite,Jumpgate") = 0`.
- Preserve the `jumpgate_loss` consumption threshold logic to keep parity with historical behavior (the two-condition check for deletion vs damage).
- Consider making `$send[origin][destination]` a list in a future refactor to allow multiple gates to participate deterministically.
