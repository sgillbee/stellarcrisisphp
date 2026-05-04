# Recap & Next Steps

Recap

- Extracted per-table data-model specs for all tables in `sc.sql` (no bulky seed embedding; `words` seed referenced only).
- Created game mechanics specs: update loop, combat, movement, jumpgates, mines, nukes, invasion/colonize/terraform, map generation.
- Added UI specs for Map, System, Ships, Fleets and supporting UI behaviors.
- Added backend endpoints mapping and a consolidated final spec (`final_spec.md`).
- Wrote initial acceptance tests and a small CLI runner `tools/run_update.php` to invoke `update_game()` for a series/game.

Next steps (pick one)

- Generate an automated PHP acceptance test harness that applies SQL fixtures, runs `tools/run_update.php`, and asserts postconditions. (I can implement this next.)
- Propose and implement a migration plan to normalize `systems.jumps` into `system_jumps` with a migration script and code updates.
- Produce a developer-friendly API layer (`api/`) to expose read endpoints for map and ship data for client-side decoupling.

Tell me which of the next steps to take and I'll proceed without further prompts.
