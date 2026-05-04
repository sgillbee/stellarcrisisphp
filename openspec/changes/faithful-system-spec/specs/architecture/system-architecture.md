# System Architecture

Scope: high-level architecture, runtime model, major components, data flow, and integration points for the existing monolithic PHP application.

## Overview

- Deployment: LAMP-style monolithic web application (PHP 5.x, MySQL 5.6, Apache / nginx). Single repo entry point is `sc.php` which includes core modules.
- Runtime model: Request-driven PHP scripts. The app is not a background service; updates occur when users submit forms or when scheduled processes call `sc.php` to run `update_game()`.

## Major components

- Entrypoint: `sc.php` — dispatches requests (main, admin, game, tournaments) and runs `checkForUpdates()` / `checkForTournamentUpdates()` to trigger game updates.
- Routing / UI files: `main/`, `game/`, `admin/` — individual pages and screens (`game/ships.php`, `game/map.php`, `main/main.php`, etc.).
- Core services and helpers: `scfunctions.php`, `sql.php`, `server.php`, `debug.php`, `history.php`, `ship_types.php`.
- Update engine: `update.php` — contains `update_game()` loop implementing per-turn processing: order handling, movement, combat, actions (mines, stargates, nukes, invade/colonize/terraform), messaging, and endgame logic.
- Movement helpers: `update/moveship.php` — `move()` and `checkForFirstContact()`.
- Map generation: `game/makemap.php` — map-building algorithms (standard, balanced, twisted, mirror, prebuilt) and `saveMap` persistence.
- Data model: `sc.sql` — canonical schema. Core tables include `ships`, `systems`, `players`, `games`, `series`, `fleets`, `messages`, `history`, `diplomacies`, `ship_types`, and per-series/game ship-type options.

## Data flow

- UI submits orders via forms to `sc.php` which calls page-specific processing functions (`shipsScreen_processing`, `mapScreen_processing`, etc.).
- Orders are stored in `ships.orders` and `ships.order_arguments` (and `fleets.orders`) and persisted to MySQL.
- The update engine (`update_game`) reads orders, processes them in phases (collect, combat, special actions, finalize), writes history/messages, deletes/updates ship and system rows, and may call `endGame()`.

## Integration points

- Database: MySQL 5.6 (DDL in `sc.sql`). All DB access uses `sc_query()` wrapper which retries transient MySQL errors and triggers `sqlError()` on unrecoverable failures.
- Email / notifications: `sendEmpireMessage()` uses per-empire contact fields (email) to notify players of eliminations and other significant events.
- Static assets: `images/` icons referenced by the UI (planet, aliens icons per empire), JavaScript `sc.js` for client behaviors.

## Configurable options and extensibility

- Series/game-level ship-type options: `series_ship_type_options` and `game_ship_type_options` allow per-series or per-game overrides for `Jumpgate` range, loss, build/maintenance costs and status.
- Diplomacy modes: `series.diplomacy` (values 0..6) change Shared HQ and alliance semantics; the update engine includes code paths for `diplomacy==6` and `team_game` support.

## Observations & technical debt

- Single-threaded update loop with heavy queries and `ORDER BY RAND()` usage can become expensive at scale.
- `systems.jumps` is a space-separated adjacency string — practical but non-relational; opening/closing jumps mutates strings and requires careful locking/concurrency handling.
- Several actions perform immediate `INSERT`/`DELETE` operations mid-update (e.g., `explored`, `diplomacies`) — these are safe inside the process transaction but require care if the system is parallelized.

## Recommended modernization opportunities (non-breaking paths)

- Replace `FIND_IN_SET` and `systems.jumps` with a normalized `system_jumps` join table to improve queryability and indexing.
- Replace `ORDER BY RAND()` with application-level shuffling or a random selection algorithm for large datasets.
- Add an update worker (daemon) or cron job to run `update_game()` out-of-band and switch `sc.php` to preflight-only for UI; this prevents long HTTP requests.
- Introduce unit tests / integration tests around `update_game()` with a snapshot DB fixture to capture expected changes per update.
