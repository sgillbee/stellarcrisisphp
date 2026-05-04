# Map Generation

Source code: `game/makemap.php`

## Overview

Map generation produces a set of `systems` records keyed by galactic coordinates ("x,y"). Each system contains resources (`mineral`, `fuel`, `agriculture`), `population` and an adjacency list stored in `jumps` (space-separated coordinates). The generator exposes several map types: `standard`, `prebuilt`, `balanced`, `twisted`, `mirror` and `balanced`-style variants.

Core data structure: `big_map` — an associative array keyed by coordinate strings where each entry includes fields: `jumps`, `mineral`, `fuel`, `agriculture`, `population`, `max_population`, `name`, `coordinates`, `player_number`, `owner`, `homeworld`, `system_active`.

## Parameters (series-level)

- `systems_per_player` — number of systems per player.
- `avg_min`, `avg_ag`, `avg_fuel` — average resources used for randomized distribution.
- `max_players` — players per game.
- `map_compression` — affects map size bounds.
- `map_type` — one of `prebuilt`, `balanced`, `twisted`, `mirror`, `standard`.

## Key functions and algorithms

- `createPrebuiltMap($series,$game)`
  - Builds per-player chains (calling `buildPlayerChain`) for each player slot.
  - Picks a homeworld using `selectHW()` for each chain and assigns resources via `assignResources()`.
  - Names non-home systems with `nameSystem()` and fixes adjacency with `fixJumps()`.
  - Saves the map via `saveMap()` and sets `system_active = 0` for prebuilt sections.

- `createBalancedMap($series,$game)`
  - Builds two chains, calculates pairwise distances between all systems (`measure_map_from()` uses BFS), and chooses homeworld pair that balances territory counts and dispersion.

- `createTwistedMap()` and `twistMap()`
  - Create a half-map and then rotate/reflect it to connect edges in a way that maximizes cross-player interconnections.
  - `twistMap()` analyzes four edges (north,east,south,west), scores candidate alignments by how many players and planets would be connected, then uses `copyMap()` and string-transform `flipCoord()` to materialize the rotated half.

- `createMirrorMap()` / `mirrorMap()`
  - Mirror a half-map along a picked edge and create buffer planets with randomized small resources to smooth edges.

- `createMapSide()`
  - Helper used for split-map variants; builds half the map by repeatedly calling `buildPlayerChain()`.

- `buildPlayerChain($nplanets, &$big_map, $lower_limit, $upper_limit)` / `addChain()`
  - Recursive generator that constructs a connected chain of `nplanets` coordinates.
  - For each new coordinate `(x,y)` it enumerates legal cardinal neighbours within bounds, chooses a random subset as `jumps`, commits the `jumps` string and recursively grows destinations that are not already present in `chain` or `big_map`.

- `selectHW($player_name, &$chain, &$big_map)`
  - Randomly selects a candidate planet within the chain as homeworld, rejects choices adjacent to other existing homeworlds (in `big_map`) to avoid immediate adjacency.
  - Sets homeworld fields to deterministic start values (100 each for `mineral`, `fuel`, `agriculture`, `population`, `max_population`).

- `assignResources($series, &$chain, $home, $indexes)`
  - Splits the remaining resource totals across non-homeworld planets using randomized allocation: totals derived from series averages and `systems_per_player`, distributing random chunks so sums match series-level targets.

- `saveMap($series,$game,$map)`
  - Persists each system as a row in the `systems` table (writes fields and `jumps` string) and inserts initial `explored` rows for homeworlds.

- `nameSystem(&$big_map)`
  - Returns a name for a system. If `server.systemNameSource == 'random'` it uses `randomName()`; otherwise it queries the configured words table and picks a random id (COUNT + random id) to avoid `ORDER BY RAND()` on large tables.

## Output and storage

- Systems are saved to the `systems` table: adjacency list stored in `jumps` as a space-separated list of coordinate strings.
- Prebuilt maps keep `system_active = 0` for inactive sections until players join.

## Performance and behavior notes

- The generator uses recursion and randomized choices; deterministic reproduction requires the same seed and series parameters.
- `assignResources` uses `rand()`-based splits and may create variable distribution patterns; balanced maps use BFS distance metrics to improve fairness for two-player scenarios.
- `fixJumps()` ensures adjacency is bidirectional by verifying reciprocal membership and writing updates to `systems.jumps`.

## Implementation caveats

- `jumps` is a denormalized adjacency field. Map topologies are encoded as space-separated coordinate strings rather than normalized edges.
- `saveMap()` inserts many rows individually; for large maps this is IO heavy but simple. The name selection avoids `ORDER BY RAND()` by selecting by random `id`.
