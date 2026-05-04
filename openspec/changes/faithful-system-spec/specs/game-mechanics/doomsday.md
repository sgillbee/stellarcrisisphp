# Doomsday (Destroy)

Source: `game/ships.php` (orders), `update.php` (annihilate/doomsday block)

Summary

- `Doomsday` class ships may issue a `destroy` order (also referred to as `annihilate`). This is a system-level obliteration action.

Behavior

- Valid `destroy` targets: non-annihilated systems which are either unowned or where the ship's owner is at war (dip_status == 2).
- On a successful `destroy` the engine:
  - Writes a system-level missive and history entry.
  - If the system has `homeworld` set, queues elimination for that homeworld's owner.
  - Updates the system row to wipe resources and population: `mineral=0`, `fuel=0`, `agriculture=0`, `max_population=0`, `population=0`, `owner=''`, `annihilated='1'`, `homeworld=''`.
  - Breaks further doomsday processing for that system in the same update (one doomsday per system per update).

Notes

- This is an irreversible, high-impact action. Implementations must preserve the exact DB writes to keep historical compatibility.

Acceptance tests

1) Execute `destroy` on a valid system: after update the system is flagged `annihilated=1` and cleared of owner/resources/population.
