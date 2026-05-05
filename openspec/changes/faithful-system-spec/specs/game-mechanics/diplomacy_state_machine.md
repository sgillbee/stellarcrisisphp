# Diplomacy State Machine

Source code: `game/diplomacy.php`, `game/game.php` (`diplomacyString()`), `update.php` (diplomacy transition loop), `update/moveship.php` (`checkForFirstContact()`), `sc.sql` (`diplomacies` table).

## Overview

Every pair of empires in a game shares a pair of `diplomacies` rows (one per direction). Each row tracks the current `status` (the agreed relationship) and the `offer` that empire is making. During the per-turn update, offers are compared and status is advanced or changed.

---

## Status values

| Value | Name | Combat allowed |
|-------|------|---------------|
| 0 | Surrender | — (special; ends game) |
| 1 | Draw | — (special; ends game) |
| 2 | War | Yes |
| 3 | Truce | No |
| 4 | Trade | No |
| 5 | Alliance | No |
| 6 | Shared HQ | No |

Both `status` and `offer` are ENUM columns defaulting to `'2'` (War).

---

## First contact

When a ship enters a system owned by another empire for the first time, `checkForFirstContact()` is called from `move()` in `update/moveship.php`:

```
if destination.owner != '' and destination.owner != mover.name:
  if no diplomacies row exists for (game_id, mover, destination.owner):
    INSERT INTO diplomacies (empire=mover,    opponent=destination.owner, status=2, offer=2)
    INSERT INTO diplomacies (empire=dest.owner, opponent=mover,          status=2, offer=2)
    // Write history and missive entries for both players
```

Both rows are created simultaneously with `status = 2` (War).

---

## Offer constraints per status

The diplomacy UI restricts which offers a player can make based on the current `status`. The rules from `game/diplomacy.php`:

| Current status | Allowed offers |
|----------------|---------------|
| 2 (War)        | 0, 1, 2, 3    |
| 3 (Truce)      | 2, 3, 4       |
| 4 (Trade)      | 3, 4, 5       |
| 5 (Alliance)   | 4, 5, 6       |
| 6 (Shared HQ)  | 5, 6          |

Additionally:
- `offer = 0` (Surrender) and `offer = 1` (Draw) are only available if `series.can_surrender` / `series.can_draw` are enabled and `game.player_count == 2`.
- `series.diplomacy` acts as a ceiling on the maximum allowed status/offer (e.g., `series.diplomacy = 4` caps at Trade).
- In team games, offer 6 (Shared HQ) is only available between players on the same team.

---

## Status transition algorithm (per-update)

Executed in `update.php` for each player's diplomatic relationships:

```
for each diplomacy row D for empire E:
  if opponent is a team sentinel (=TeamN=): skip

  opponent_row = getDiplomacyWithOpponent(game_id, D.opponent, E)
  if opponent_row not found:
    DELETE D       // opponent was eliminated
    continue

  // Mutual surrender → revert both to War
  if D.offer == 0 and opponent_row.offer == 0:
    UPDATE diplomacies SET status = 2 WHERE id = D.id
    continue

  // Unilateral surrender → eliminate the surrendering empire
  if D.offer == 0:
    eliminated.append({victim: E, doer: D.opponent, method: 'surrender'})
    continue

  // Compute new status
  if D.offer == 1 and opponent_row.offer == 1:
    new_status = 1     // mutual draw
  else if D.offer == 1 or opponent_row.offer == 1:
    new_status = D.status   // one-sided draw offer → no change
  else:
    new_status = min(D.offer, opponent_row.offer)  // meet at the lower offer

  if new_status > 1 and new_status != D.status:
    // Log the change
    history.append({empire: E, event: diplomacyString(new_status), opponent: D.opponent})

    // Special transitions:
    if new_status == 6:
      importExplored(E, opponent)      // share full map at Shared HQ entry
    else if D.status == 6 and new_status == 5:
      convertSharedHQToScoutingReports(...)  // demote shared map to scouting reports

    UPDATE diplomacies SET status = new_status WHERE id = D.id
    // Notify player via buffered_missive
```

Key rule: **status can only be set to the lower of the two offers**. An empire cannot unilaterally raise the status — both must agree (or one must offer higher than the other, in which case the lower offer wins).

---

## Shared HQ effects

When status reaches 6 (Shared HQ):
- `importExplored(player_A, player_B)` is called, copying all of B's explored records to A's view (and vice versa).
- Subsequently, each new `explored` insertion calls `addExploredToFriends()` to propagate the sighting in real-time.

When status drops from 6 to 5 (Alliance):
- `convertSharedHQToScoutingReports()` converts the formerly shared map data into read-only scouting reports for each player. The live sharing stops.

---

## Team game diplomacy

In team games, special sentinel opponents `=Team1=` and `=Team2=` are used to represent inter-team offers. These rows are processed separately from individual diplomacy:

- `getTeamDiplomacy($game)` reads these sentinel rows to determine the current inter-team offer.
- The diplomacy transition for team sentinels is NOT processed in the per-empire diplomacy loop (the loop skips rows where `opponent` starts with `=Team`).
- Individual intra-team relationships follow the normal rules but `offer = 6` is only presented to teammates.

---

## `diplomacies` table schema

```sql
CREATE TABLE diplomacies (
  id         INT AUTO_INCREMENT,
  series_id  INT,
  game_number INT,
  game_id    INT,
  empire     VARCHAR(20),   -- owning empire
  opponent   VARCHAR(20),   -- opposing empire (or =TeamN= sentinel)
  offer      ENUM('0','1','2','3','4','5','6') DEFAULT '2',
  status     ENUM('0','1','2','3','4','5','6') DEFAULT '2',
  PRIMARY KEY (game_id, empire, opponent)
)
```

---

## Notes

- There is no `ceasefire` or intermediate combat-allowed state between War and Truce; Truce immediately stops combat.
- `status = 0` (Surrender) and `status = 1` (Draw) represent end-game outcomes, not persistent relationship states; they trigger elimination or draw-processing in the update loop and are not expected to persist across turns.
- Diplomacy rows are deleted when a player is eliminated (`update.php` line ~131 and ~1311).
- The `series.diplomacy` field restricts the ceiling — e.g., a "blood game" series with `diplomacy = 2` means only War status is possible and no offers above War are shown in the UI.
