# Update Acceptance Tests

These tests are intended to be runnable SQL state assertions executed against a snapshot of the game's database before and after a single `update_game()` invocation. Tests are described as preconditions -> action -> postconditions.

1) Movement test

- Preconditions:
  - Insert ship S with `owner='Alice'`, `player_id` pointing to Alice, `orders='move'`, `order_arguments='10,5'`, `location='8,5'`, `fuel_cost=1`.
  - Alice has `fuel >= fuel_cost`.
- Action: Run `update_game()` for the game.
- Postconditions:
  - `SELECT location FROM ships WHERE id=S.id` -> `'10,5'`.
  - Note (implementation detail): the current implementation does not necessarily decrement `players.fuel` inside `move()`.
    Fuel accounting is performed by `recalculateRatios()` (see `sc.php`), which computes `players.fuel_use` and `players.fuel_ratio` from ships' `fuel_cost` totals.
    For acceptance checks, assert either:
    - `players.fuel` decreased by at least `fuel_cost`, or
    - `players.fuel_use` increased by at least `fuel_cost` and `players.fuel_ratio` changed accordingly.
  - Recommendation: capture `players.fuel_use` (and `players.fuel`) before and after the update and compare; this documents the code's actual behavior without requiring source changes.

2) Simple combat test

- Preconditions:
  - Ship A (owner=Attacker) at `1,1` with `br=10`.
  - Ship B (owner=Defender) at `1,1` with `br=10`.
- Action: Run `update_game()`.
- Postconditions (one of these should be true):
  - `COUNT(*) FROM ships WHERE location='1,1' AND owner='Attacker'` decreased OR
  - `UPDATE ships SET br < original` for at least one surviving ship OR
  - A new `history` row referencing `1,1` describing battle losses.

3) Nuke test

- Preconditions:
  - System at `5,5` has `population > 0` and ships present.
  - Player X triggers nuke action targeting `5,5`.
- Action: Run `update_game()`.
- Postconditions (implementation-accurate):
  - `SELECT population FROM systems WHERE coordinates='5,5'` -> `0` (population zeroed).
  - `SELECT owner FROM systems WHERE coordinates='5,5'` -> `''` (owner cleared) and homeworld cleared if applicable.
  - `SELECT mineral, fuel, agriculture FROM systems WHERE coordinates='5,5'` -> values reduced (the code halves mineral/fuel/agriculture for a nuke).
  - `SELECT COUNT(*) FROM ships WHERE location='5,5'` -> `0` (ships removed by the nuke handler).
  - Note: `annihilated = '1'` is set only by the annihilation/doomsday code path (doomsday/annihilate), not by the regular nuke handler; tests that expect `annihilated=1` should use the annihilate/doomsday precondition.

4) Colonize test

- Preconditions:
  - Colony ship at empty system `7,7` with `orders='colonize'`.
- Action: Run `update_game()`.
- Postconditions:
  - `SELECT owner FROM systems WHERE coordinates='7,7'` equals colony ship owner.
  - `SELECT population FROM systems WHERE coordinates='7,7'` increased to expected colony population.

Running the tests

- Create a fresh DB snapshot of the game state, apply precondition SQL, run the update binary or PHP `update.php` invocation for that `game_id`, then run postcondition queries to assert expected changes.

Determinism note

- Combat resolution and some selection logic use `ORDER BY RAND()` and the code seeds PRNG with time (`srand(time())`), so single-run results can be non-deterministic.
- Acceptance checks should therefore assert invariant properties (BR decreases, at least one loss OR BR reduction, history entries exist) rather than exact survivor identities.
- If deterministic verification is required, run the update in a controlled sandbox where you call `srand()` with a fixed seed before invoking `update_game()` (test-harness-only; the production code itself is unchanged).  This is a testing recommendation only — the spec documents the current runtime behaviour.
