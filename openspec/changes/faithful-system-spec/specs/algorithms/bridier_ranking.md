# Bridier Ranking System

Source code: `sc.php` (`calculateBridier()`), `update.php` (end-game Bridier application), `game/makemap.php` (Bridier row creation at join), `main/gameList.php` (`bridierEstimate()`).

## Overview

Bridier is an optional 1v1 ranking system (based on the French Bridier chess-like rating system) that tracks empire skill over time. It is enabled per series (`series.bridier_allowed = 1`) and applies only to **2-player games**.

Each empire has two persistent scores in the `empires` table:
- `bridier_rank` — the main rating score (default 500; higher is better)
- `bridier_index` — a volatility index (default 500; decreases as more games are played, capping at 100; lower = more stable rank)

---

## Data flow

### Game creation and join

When a Bridier-eligible game is created and a second player joins, the following records are written to the `bridier` table (via `game/makemap.php`):

```
bridier row:
  game_id         = game.id
  empire1         = first player name
  empire2         = second player name
  starting_rank1  = empire1.bridier_rank   // snapshot at game start
  starting_rank2  = empire2.bridier_rank
  starting_index1 = empire1.bridier_index
  starting_index2 = empire2.bridier_index
  winner          = NULL                   // filled at end
  ending_rank1    = NULL
  ending_rank2    = NULL
  end_time        = NULL
```

The `games.bridier` field holds the minimum points the game winner must gain (0 = play anyone; -1 = not a Bridier game).

---

## `calculateBridier(winner_rank, winner_index, loser_rank, loser_index)`

Returns `(win_points, lose_points)` — the number of Bridier rank points awarded to the winner and deducted from the loser.

### Stake table (based on rank advantage)

```
rank_delta = winner_rank - loser_rank

if   rank_delta <= 0:   stake = 10   // underdog wins get maximum points
elif rank_delta <= 10:  stake = 9
elif rank_delta <= 20:  stake = 8
elif rank_delta <= 30:  stake = 7
elif rank_delta <= 40:  stake = 6
elif rank_delta <= 60:  stake = 5
elif rank_delta <= 80:  stake = 4
elif rank_delta <= 100: stake = 3
elif rank_delta <= 140: stake = 2
elif rank_delta <= 200: stake = 1
else:                   stake = 0    // extreme favourite gets nothing
```

### Points calculation

```
wi = winner_index / 100
li = loser_index  / 100

win_points  = round((1 + 19*wi - li - 3*wi*li) * stake / 16)
lose_points = round((1 + 19*li - wi - 3*li*wi) * stake / 16)
```

Both formulas are symmetric in structure but use opposing index roles:
- Higher `winner_index` → more points awarded (volatile winner earned more)
- Higher `loser_index` → more points lost by loser (volatile loser loses more)

---

## End-game application (in `update.php`)

When a winner is determined in a Bridier game:

```
bdata = SELECT * FROM bridier WHERE game_id = game.id

if winner == bdata.empire1:
  opponent = getEmpire(bdata.empire2)
  // Calculate winner gain using winner's CURRENT rank vs opponent's STARTING rank
  (win, _) = calculateBridier(empire.bridier_rank, empire.bridier_index,
                               bdata.starting_rank2, bdata.starting_index2)
  // Calculate loser deduction using opponent's STARTING rank vs winner's STARTING rank
  (_, lose) = calculateBridier(bdata.starting_rank1, bdata.starting_index1,
                                opponent.bridier_rank, opponent.bridier_index)
  winner_slot = 1; loser_slot = 2

else:  // winner == bdata.empire2
  opponent = getEmpire(bdata.empire1)
  (win, _) = calculateBridier(empire.bridier_rank, empire.bridier_index,
                               bdata.starting_rank1, bdata.starting_index1)
  (_, lose) = calculateBridier(bdata.starting_rank2, bdata.starting_index2,
                                opponent.bridier_rank, opponent.bridier_index)
  winner_slot = 2; loser_slot = 1

// Update bridier results table
UPDATE bridier SET
  winner         = winner_slot,
  ending_rank{winner_slot} = empire.bridier_rank + win,
  ending_rank{loser_slot}  = opponent.bridier_rank - lose,
  end_time       = time()
WHERE game_id = game.id

// Update winner's empire record
new_winner_index = empire.bridier_index - (win > 25 ? 50 : 2 * win)
UPDATE empires SET
  bridier_rank  = empire.bridier_rank + win,
  bridier_index = MAX(100, new_winner_index),
  bridier_update = time(),
  bridier_delta  = win
WHERE id = empire.id

// Update loser's empire record
new_loser_index = opponent.bridier_index - (lose > 25 ? 50 : 2 * lose)
UPDATE empires SET
  bridier_rank  = opponent.bridier_rank - lose,
  bridier_index = MAX(100, new_loser_index),
  bridier_update = time(),
  bridier_delta  = -lose
WHERE id = opponent.id

// Write history entries for both players
```

### Index decay

Each game result decrements the `bridier_index`:
- Normal game: `new_index = current_index - 2 * points_exchanged`
- High-stakes game (points > 25): `new_index = current_index - 50`
- Floor: `bridier_index` cannot go below 100

As `bridier_index` decreases, the multiplier in `calculateBridier` shrinks, meaning a veteran with index = 100 gains/loses far fewer points per game than a newcomer with index = 500.

---

## Minimum gain requirement (`games.bridier`)

When `games.bridier > 0`, a player can only join if their potential win (calculated using `calculateBridier`) meets or exceeds the required minimum. This prevents high-ranked players from farming easy wins against weaker opponents (as a weak opponent cannot offer enough points to satisfy the minimum).

---

## `bridier` table schema (from `sc.sql`)

```sql
CREATE TABLE bridier (
  id             INT AUTO_INCREMENT,
  game_id        INT,
  empire1        VARCHAR(20),
  empire2        VARCHAR(20),
  starting_rank1  SMALLINT,
  starting_rank2  SMALLINT,
  starting_index1 SMALLINT,
  starting_index2 SMALLINT,
  winner          TINYINT,
  ending_rank1    SMALLINT,
  ending_rank2    SMALLINT,
  end_time        INT,
  PRIMARY KEY (id)
)
```

---

## Notes

- Bridier is only applied for 2-player non-team games; team games are excluded.
- Rank is never decremented below its floor implicitly; the formula can theoretically produce large losses for a volatile loser.
- Points are calculated using a snapshot of starting ranks to prevent rank-manipulation mid-game (a player gaining rank elsewhere cannot inflate their end-game calculation).
- A draw does not trigger Bridier update; only a clear winner triggers rank changes.
- `bridier_delta` on `empires` records the most recent change (positive for win, negative for loss) for display purposes.
