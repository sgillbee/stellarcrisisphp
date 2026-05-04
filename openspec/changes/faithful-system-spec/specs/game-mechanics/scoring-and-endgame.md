# Scoring & Endgame

Source code: `update.php`, `sc.php` (`calculateBridier`)

## Game end detection

- `update_game()` computes two flags: `$game_over` and `$draw`. They start true and are invalidated by checks during the per-player diplomacy scan.
- Early exits: team-game draws and team surrenders are checked before the main loop. If both teams choose draw, `endGame()` is called immediately.
- Per-player checks:
  - Each player must have diplomacy records with every other active player (count check). If not, the game cannot end.
  - Diplomacy `status` values are inspected; `draw` remains true only if all statuses indicate a mutual draw/alliance state (code checks `status == 1`), and `game_over` requires statuses above a configured threshold (code checks `status >= 5` in places for Shared-HQ semantics).
- If `$game['closed']` and `$draw` true, the game is ended with a draw; if `$game['closed']` and `$game_over` true, winners are awarded and the game finalizes.

## Bridier scoring (ELO-like system)

Function: `calculateBridier($winner_rank, $winner_index, $loser_rank, $loser_index)` in `sc.php`.

Algorithm summary:

1. Compute `rank_delta = winner_rank - loser_rank` and map it to a `stake` (0..10) via descending buckets (if rank_delta <=0 stake=10; <=10 stake=9; ... else stake=0).
2. Normalize indices: `winner_index /= 100; loser_index /= 100;` (index appears to be a percentage-like modifier).
3. Compute:
   - `winner_result = round((1 + 19*winner_index - loser_index - 3*winner_index*loser_index) * stake / 16)`
   - `loser_result  = round((1 + 19*loser_index - winner_index - 3*loser_index*winner_index) * stake / 16)`
4. The calling code (in `update.php`) applies these adjustments to bridier tables and updates `empires.bridier_rank` and `bridier_index` accordingly.

Notes:
- This is not a pure Elo implementation; it uses a stake that depends on rank difference and a multiplicative index term to scale gains/losses.

## Post-game processing

- When a game is finalized (`endGame()`), the code writes `history`, `gamelog` entries, updates `empires` stats (`wins`, `nukes`, `ruined`, `bridier_*` fields) and removes or flags players in `players` table depending on `team_game` settings.
- The update loop also cleans up `ships`, `fleets`, `explored`, `scouting_reports`, `messages` and `diplomacies` rows for eliminated players.
