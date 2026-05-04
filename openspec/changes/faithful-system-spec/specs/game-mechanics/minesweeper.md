# Minesweeper

Source: `game/ships.php` (orders), `update.php` (combat/mine processing)

Summary

- `Minesweeper` ships clear minefields during the same update they are present and survive the combat scaling phase.

Behavior

- During the combat scaling phase, surviving `Minesweeper` ships cause the engine to set `swept[location] = 1`.
- If a minefield exploded at the location (`mined[location] = 1`) but `swept[location]` is true, the mine explosion step is skipped and ships are not mass-deleted.

Acceptance tests

1) Minesweeper present prevents minefield explosion at same location in same update.
