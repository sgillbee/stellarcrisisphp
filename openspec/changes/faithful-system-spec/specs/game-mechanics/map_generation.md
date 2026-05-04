# Map Generation

Source: `game/makemap.php` and helper functions called therein.

Purpose

- Describe how maps are generated for `standard`, `prebuilt`, `balanced`, `twisted`, and `mirror` map types and how systems/jumps/resources are persisted to the `systems` table.

High-level flow

- Map generation runs when a player joins a new game (see `joinRegularGame()` and `joinTeamGame()` in `game/makemap.php`). Depending on `series.map_type`, one of several generation functions is called:
  - `createPrebuiltMap()` — builds a full map from player chains, saves it to `systems`, then marks non-active systems with `system_active = '0'` until players join.
  - `createBalancedMap()` — builds two chains and selects balanced homeworld pairs based on map distance metrics.
  - `createTwistedMap()` and `createMirrorMap()` — create half-maps, then twist/mirror them to build the full map.
  - `generateMapForPlayer()` — used for `standard` maps to create a per-player segment and immediately persist it.

Key building blocks

- `buildPlayerChain(n, big_map, lower_limit, upper_limit)` — generates a connected chain of planets with `n` systems for a player's neighborhood.
- `selectHW(player_name, chain, big_map)` — selects a homeworld coordinate within the generated chain.
- `assignResources(series, chain, home, coordinates)` — assigns `mineral`, `fuel`, `agriculture`, `population`, `max_population` resource values to systems in a chain.
- `fixJumps($big_map)` / `fixPrebuiltLinks()` — ensure bidirectional jump links and remove links to inactive systems for prebuilt maps.
- `saveMap($series, $game, $big_map)` — persists the map into the `systems` table (`INSERT`/`UPDATE` for coordinates, jumps, resources, names, player numbers, homeworld flags, and `system_active` status).

Data model notes

- `systems.jumps` stores space-separated coordinates of adjacent systems (denormalized adjacency list). Map-gen updates the `jumps` field and ensures reciprocity.
- `system_active` is used for prebuilt maps to defer activation of player slots until real players join the game.

Acceptance checks

- For a newly created `standard` map: after `generateMapForPlayer()` runs, `systems` should have new rows for the created coordinates, `homeworld` should be set for the assigned homeworld, and `explored` rows should be assigned to the initial player's `player_id`.
- For `prebuilt` maps: `systems.system_active` should be `0` for inactive slots until `joinPrebuiltGame()` activates them.

Notes & modernization hints

- Because `systems.jumps` is a denormalized string, querying adjacency is expensive and updates are string-based. Introducing a `system_jumps(game_id, from_coord, to_coord)` table would simplify queries and indexing.
