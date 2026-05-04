# Faithful System Specification — Consolidated Deliverable

This document collects the key specification artifacts derived from the existing codebase and provides instructions for review and acceptance testing.

1) What this change contains

- Per-table data-model descriptions: `specs/data-model/tables/` (one file per table).
- Data relationships: `specs/data-model/relationships.md`.
- Game mechanics: `specs/game-mechanics/` (update loop, combat, movement, jumpgates, mines, nukes, invasion/colonize/terraform, map generation).
- UI views: `specs/ui/` (map, system, ships, fleets and related UI behavior).
- Backend endpoints and action mapping: `specs/backend/api_endpoints.md`.
- Acceptance tests: `specs/acceptance-tests/update_acceptance_tests.md`.
- Specification index: `specs/specification-index.md` (TOC).

2) How to review

- Open the index: `specs/specification-index.md` to navigate artifacts.
- For data-model parity, use `sc.sql` as the canonical DDL and compare each `specs/data-model/tables/<table>.md` to the CREATE TABLE definition in `sc.sql`.

3) Acceptance testing (manual run)

- Create a fresh copy of the MySQL database from `sc.sql` (or a trimmed snapshot containing only the game you intend to test).
- Apply the preconditions from `specs/acceptance-tests/update_acceptance_tests.md` by inserting the test rows described.
- Run the update function by invoking the PHP update entrypoint used in your deployment (e.g., spawn a worker that calls `update_game()` or run the appropriate `sc.php` trigger).
- After the update completes, run the postcondition SQL queries in the acceptance-tests file to verify behavior.

4) Next steps recommended

- Create a small automated test harness (PHP or SQL script) that applies precondition fixtures, calls the update flow, and asserts postconditions.
- Normalize `systems.jumps` into a `system_jumps` table as a follow-up refactor to improve queryability.
- Consider running `update_game()` out-of-band (cron/worker) instead of within HTTP requests to avoid long-running web executions.

6) Implementation caveats (faithful-to-source)

- Concurrency & locking: The current `update_game()` contains commented-out `LOCK TABLES` / transaction statements. In practice the codebase relies on MySQL table-level locking patterns and application-level sequencing rather than full transactional semantics. The spec therefore documents that concurrent update invocations can cause race conditions; callers should treat `update_game()` as non-atomic unless the deployment provides external coordination.
- Storage engine and rollbacks: The repository's DDL and `create_database.php` historically use `MyISAM` (non-transactional) in places. Because of this, the `sc_query()` attempt to `ROLLBACK` on error is limited — the database engine may not support true rollbacks. The spec treats rollback attempts as best-effort and documents that some partial changes may persist on error.
- Randomness and determinism: The update loop seeds the PRNG (`srand(time())`) and uses `ORDER BY RAND()` in selection paths (combat ship selection). Tests and acceptance checks must therefore allow for non-deterministic outcomes unless a deterministic test harness calls `srand()` with a fixed seed before `update_game()`.
- Nuke vs annihilate: The code distinguishes a regular `nuke` (zero population, halve resources, clear owner) from a total `annihilate`/doomsday (sets `annihilated = '1'` and zeroes resources fully). Acceptance tests and documentation reference the correct code path.
- `tools/run_update.php` prerequisites: The helper is a convenience runner that loads `server.php`/`serverconfig.php` to obtain DB credentials and requires a populated database (for example restored from `sc.sql`). The spec documents these prerequisites; no production code changes are made.

5) Where to find everything

- Top-level index: `specs/specification-index.md`
- Canonical DDL: `sc.sql`

If you'd like, I can now:
- generate the automated test harness (PHP) that runs the acceptance tests, or
- start a proposed normalization patch for `systems.jumps` and a migration plan.
