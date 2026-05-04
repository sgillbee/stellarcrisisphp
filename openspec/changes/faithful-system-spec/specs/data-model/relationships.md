# Data Model Relationships

Source DDL: [sc.sql](sc.sql)

This document records the primary logical relationships between the main tables in the system. The original schema uses many textual owner fields (varchar) rather than enforced foreign keys; the relationships below are therefore "logical" references used by application code.

Core relationships

- `ships.player_id` -> `players.id` (ownership by player record).
- `ships.owner` (varchar) -> `players.name` / `empires.name` (textual owner field used widely in UI and queries).
- `ships.game_id` -> `games.id` and `ships.series_id` -> `series.id` (scoping by game/series/version).
- `fleets.game_id` -> `games.id`; `fleets.owner` -> `players.name` (textual); `fleets.player_id` -> `players.id`.
- `systems.game_id` -> `games.id`. Primary key: (`game_id`,`coordinates`). `systems.owner` -> `players.name` / `empires.name` (text reference to the owning empire).
- `explored.player_id` -> `players.id` and `explored.coordinates` -> `systems.coordinates` (combines with `game_id` to identify which system the player has explored).
- `players.game_id` -> `games.id` and `players.series_id` -> `series.id` (player is scoped to a game and series).
- `scouting_reports.player_id` -> `players.id` (scout snapshot associated with a particular player).
- `diplomacies.game_id` -> `games.id`; `diplomacies.empire`/`opponent` -> `players.name` (textual relationship to empires/players controlling diplomacy state).
- `series_ship_type_options.series_id` -> `series.id`; `game_ship_type_options.game_id` -> `games.id` (per-series/game overrides for ship types).
- `ship_types.type` (varchar) referenced in `ships.type` and in ship-options tables.
- `history.game_id` -> `games.id` (chronological events per game).

Notes about denormalized/textual references

- Many cross-row references are textual (`owner`, `empire`) rather than integer foreign keys. This simplifies migration of names but means renaming an empire requires updating multiple tables.
- `systems.jumps` stores space-separated coordinate tokens for adjacency (non-normalized). Consider migrating to `system_jumps(game_id, from_coord, to_coord)` for relational queries and consistent indexing.

Suggested normalization tasks (refactor notes)

- Add a `system_jumps` table to replace `systems.jumps` and update map generation and update code to use it.
- Replace textual `owner` fields with integer `owner_player_id` while keeping `owner_name` for backward-compatibility; update UI helper functions accordingly.
