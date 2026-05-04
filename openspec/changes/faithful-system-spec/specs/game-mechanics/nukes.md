# Nukes & Annihilation

Source: `update.php` (nuke and annihilate sections)

Purpose

- Document how nuclear and doomsday-style annihilation actions are processed and their effects on systems and players.

Processing summary (faithful)

- `nuke` actions are collected into the `$nuke[$location]` array during per-ship processing.
- During the nuke phase, for each `$location` and `ship_id`:
  - Load the ship and the target system via `getShipByID()` and `getSystem()`.
  - Verify diplomatic state via `getDiplomacyWithOpponent($game_id, ship.owner, system.owner)` — nukes only proceed when `diplomacy['status'] == 2` (hostile/war state).
  - Record history and missive entries describing the nuke.
  - If the system's `homeworld` is set, mark the owning empire for elimination (handled later in the eliminated post-processing).
  - Update the system: set `population = 0`, `owner = ''`, `homeworld = ''`, half `mineral`, half `fuel`, half `agriculture`, and halve `max_population` (GREATEST(1, max_population/2)).
  - Only the first valid nuke for a given system in an update is applied (the code `break`s after processing a nuke for that system).

- `annihilate` (Doomsday) actions behave similarly but are more extreme — they set minerals/fuel/agriculture/population/max_population to zero and set `annihilated = '1'` on the system.

Player elimination consequences

- Systems belonging to eliminated players are reset (ownership cleared, population zeroed) and their `players` rows are deleted (or `team` negated for team games). All associated `ships`, `fleets`, `explored`, `scouting_reports`, `messages`, and `diplomacies` rows are removed.

Acceptance checks

- Given a valid nuke action targeting a system with population > 0, after `update_game()` that system's `population` is zero and `owner` and `homeworld` are cleared; `mineral` and `fuel` are halved.
- Given a doomsday/annihilate action, the system's resource and population fields are zeroed and `annihilated` is set to `'1'`.
# Nukes

Source: `update.php` (nuke processing block)

Purpose

Document the `nuke` order semantics and the exact system-state changes performed when a nuke succeeds.

Behavior

- `nuke` orders are queued per-ship during order processing and resolved after battles.
- For each nuke at `location`, the engine checks the performing ship (via `getShipByID`) and validates the diplomatic state with the system owner using `getDiplomacyWithOpponent($game_id, ship.owner, system.owner)`. Only when `diplomacy['status'] == 2` (at war) will the nuke proceed.
- On success, the engine:
  - Records a missive: `<system name> (*coord*) was nuked by <ship or owner>.` and writes a history entry `['location', ship.owner, 'nuked', ship.name]`.
  - If `system.homeworld` is set, queue elimination for the homeworld owner (`$eliminated[] = array('victim' => homeworld, 'doer' => ship.owner, 'method' => 'nuked')`).
  - Updates the system row: sets `population = 0`, `owner = ''`, `homeworld = ''`, halves `mineral`, `fuel`, and `agriculture` (each assigned to their current value divided by 2), and sets `max_population = GREATEST(1, max_population/2)`.
  - The loop breaks after the first successful nuke for that location, so only one nuke is applied per system per update.

Notes and edge cases

- If the diplomatic check fails (not at war), the nuke order is ignored.
- The halfing of resources is integer division per the DB expression `(mineral/2)` etc.; reimplementations should match integer or float semantics depending on target DB behavior.

Acceptance tests

1) Successful nuke
  - When a warship with `orders='nuke'` attacks a system owned by an enemy with `diplomacy.status == 2`, after update the system should have `population=0`, `owner=''`, `homeworld=''`, resources halved, `max_population` reduced to GREATEST(1, old/2), and proper missive/history entries created.

2) Nuke rejected when not at war
  - When a ship attempts to nuke a system but diplomatic status is not `2`, the system is unchanged and no history/missive is recorded for the nuke.
