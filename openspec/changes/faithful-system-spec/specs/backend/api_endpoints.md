# Backend Endpoints & Server Actions

Purpose

- Catalog the primary server-side entry points, their responsibilities, and how they map to database changes in the existing monolithic PHP codebase.

Main dispatcher

- `sc.php` — primary request dispatcher used by the UI. Loads environment, identifies user/session/series/game context, and calls page-specific screen and processing functions (e.g., `mapScreen`, `shipsScreen_processing`). Many UI pages are implemented as paired `*_screen()` and `*_screen_processing()` functions.

Update engine / background actions

- `update.php` — `update_game($series, &$game, $update_time)` is the update engine. It is invoked by `sc.php` on demand (or cron/worker in some deployments). Responsibilities:
  - Per-player order collection and processing
  - Movement, exploration, fleet processing
  - Combat resolution, mines, stargate/jumpgate transport
  - Colonization, invasion, terraforming, nukes/annihilation
  - Cleanup, history/message generation, endgame detection

Movement helper

- `update/moveship.php` — contains `move()` and `checkForFirstContact()`.

Game UI endpoints (examples)

- `game/map.php` — Map rendering and minimap; reads `explored`, `systems`, aggregated `ships` counts and returns HTML table fragments.
- `game/ships.php` — Ship listing and order submission; writes to `ships.orders` and `ships.order_arguments`.
- `game/fleets.php` — Fleet composition UI; writes `fleets.orders` and `fleets.order_arguments`.
- `game/makemap.php` — Map creation and join-time processing (creates `systems` rows for new games or prebuilt maps).

Admin endpoints

- Files under `admin/` provide administrative operations (create series, start/kill game, cleanup DB). Examples: `admin/killGame.php`, `admin/startSeries.php`, `admin/dbCleanup.php`.

Data access wrapper

- `sql.php` / `sc_query()` — central DB wrapper used for all queries. Calls to `sc_query()` are annotated with `__FILE__.'*'.__LINE__` in most places to facilitate troubleshooting.

Integration & side effects

- Many endpoints produce side effects by writing to multiple tables in a single update: `ships`, `fleets`, `systems`, `explored`, `diplomacies`, `players`, `history`, and `messages`.
- Because the app relies on text-based owner references (`owner`, `empire` fields) rather than strict foreign keys, many endpoints update multiple tables to reflect a single user action (e.g., eliminating a player requires deleting rows across `players`, `ships`, `fleets`, `explored`, etc.).

Notes for API extraction

- To extract a stable HTTP API, consider:
  - Creating small JSON endpoints (e.g., `api/ship/{id}` GET/PUT for orders) that wrap existing DB logic while keeping `update_game()` unchanged.
  - Adding read-only endpoints that return `explored`+`systems`+`ship_counts` for map rendering, so client-side map improvements can be decoupled.
