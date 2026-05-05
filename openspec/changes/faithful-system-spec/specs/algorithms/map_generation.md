# Map Generation

Source code: `game/makemap.php`

## Overview

Map generation produces a set of `systems` records keyed by galactic coordinates ("x,y"). Each system contains resources (`mineral`, `fuel`, `agriculture`), `population` and an adjacency list stored in `jumps` (space-separated coordinate strings). The generator exposes several map types: `prebuilt`, `balanced`, `twisted`, `mirror`, and `standard`.

Core data structure: `big_map` — an associative array keyed by coordinate strings where each entry includes fields: `jumps`, `mineral`, `fuel`, `agriculture`, `population`, `max_population`, `name`, `coordinates`, `player_number`, `owner`, `homeworld`, `system_active`.

## Parameters (series-level)

- `systems_per_player` — number of systems per player.
- `avg_min`, `avg_ag`, `avg_fuel` — average resources used for randomized distribution.
- `max_players` — players per game.
- `map_compression` — affects map size (spacing); lower compression = larger map.
- `map_type` — one of `prebuilt`, `balanced`, `twisted`, `mirror`, `standard`.

## Coordinate system

Coordinates are integer grid positions stored as `"x,y"` strings. Bounds:

```
lower_limit = max_players * systems_per_player
upper_limit = floor(lower_limit + sqrt((max_players / 2) * systems_per_player / map_compression))
```

For twisted/mirror maps the half-map factor is `max_players/2`; for prebuilt/balanced maps the full player count is used in the sqrt.

## Top-level map type dispatch

```
switch (series.map_type):
  'prebuilt'  -> createPrebuiltMap(series, game)
  'balanced'  -> createBalancedMap(series, game)
  'twisted'   -> createTwistedMap(series, game)
  'mirror'    -> createMirrorMap(series, game)
  default     -> createPrebuiltMap(series, game)  // standard uses prebuilt logic
```

---

## `buildPlayerChain(nplanets, &big_map, lower_limit, upper_limit)`

Generates a connected chain of exactly `nplanets` systems that does not overlap `big_map`. Returns the chain as an associative array keyed by coordinate strings.

```
repeat:
  chain = {}

  if big_map is empty:
    dx = dy = floor((lower_limit + upper_limit) / 2)
    sx = sy = 0   // no source system
  else:
    // Find a system in big_map that has at least one unused cardinal neighbor
    repeat:
      s_sys = random key from big_map
      (sx, sy) = parse s_sys
      j_list = [cardinal neighbors of (sx,sy) within bounds]
      s_j    = split(big_map[s_sys].jumps)
    until len(s_j) < len(j_list)

    // Find a neighbor of s_sys not yet in big_map
    repeat:
      d_sys = random choice from j_list
    until d_sys not in s_j
    until d_sys not in big_map      // outer loop

    (dx, dy) = parse d_sys

  chain = addChain(chain, big_map, nplanets, dx, dy, sx, sy, lower_limit, upper_limit)

until len(chain) == nplanets

return chain
```

### `addChain(&chain, &big_map, nplanets, x, y, xin, yin, lower, upper)` (recursive)

```
if len(chain) >= nplanets: return chain

chain["x,y"] = {}

j_list = [cardinal neighbors of (x,y) within [lower,upper] bounds]

// Decide how many jumps to add (1..len(j_list)-1).
// Lower values produce more maze-like maps; higher values produce more open maps.
j = rand(1, len(j_list) - 1)

jump = []
if xin != 0 and yin != 0:
  // Include back-link to source system
  remove "xin,yin" from j_list
  jump.append("xin,yin")
  j -= 1

while j > 0:
  j_to = random index into j_list
  if j_list[j_to] not in jump:
    jump.append(j_list[j_to])
    j -= 1

chain["x,y"].jumps = join(jump, " ")

for each dest_coord in jump:
  if dest_coord not in chain and dest_coord not in big_map:
    (dx, dy) = parse dest_coord
    chain = addChain(chain, big_map, nplanets, dx, dy, x, y, lower, upper)

return chain
```

---

## `selectHW(player_name, &chain, &big_map)`

Randomly picks a homeworld within the player's chain, avoiding systems adjacent to existing homeworlds in `big_map`.

```
repeat:
  home = random key from chain
  fail = false
  for each neighbor in split(chain[home].jumps):
    if neighbor not in chain and neighbor in big_map:
      if big_map[neighbor].homeworld != '': fail = true
until not fail

chain[home].homeworld = player_name
chain[home].owner     = player_name
chain[home].name      = player_name
chain[home].mineral   = 100
chain[home].fuel      = 100
chain[home].agriculture = 100
chain[home].population  = 100
chain[home].max_population = 100
chain[home].coordinates = home

return home
```

---

## `assignResources(series, &chain, home, indexes)`

Distributes resources across non-homeworld systems so the total matches series targets.

```
count = len(indexes)

// Targets for the non-homeworld systems (homeworld already set to 100)
min_total  = (systems_per_player - 1) * avg_min
ag_total   = (systems_per_player - 1) * avg_ag
fuel_total = (systems_per_player - 1) * avg_fuel

for each coord in indexes:
  if coord == home: continue
  count -= 1

  if count > 1:
    // Each planet gets a random slice up to 2× its equal share of the remaining total
    m = rand(0, round(min_total  * 2 / count))
    a = rand(0, round(ag_total   * 2 / count))
    f = rand(0, round(fuel_total * 2 / count))
    chain[coord].mineral     = m;  min_total  -= m
    chain[coord].agriculture = a;  ag_total   -= a
    chain[coord].fuel        = f;  fuel_total -= f
  else:
    // Last system gets whatever is left (may exceed 2× average)
    chain[coord].mineral     = min_total
    chain[coord].agriculture = ag_total
    chain[coord].fuel        = fuel_total

  chain[coord].population     = 0
  chain[coord].max_population = max(chain[coord].mineral, chain[coord].fuel)
  chain[coord].owner          = ''
  chain[coord].homeworld      = ''
  chain[coord].coordinates    = coord
```

---

## `fixJumps(&map)`

Ensures all jump links are bidirectional and removes dangling references.

```
for each coord ixa in map:
  jump = []
  for each ixb in split(map[ixa].jumps):
    if ixb in map:
      jump.append(ixb)
      // Add reciprocal link if missing
      if ixa not in split(map[ixb].jumps):
        map[ixb].jumps += " " + ixa
  map[ixa].jumps = join(jump, " ")
```

---

## `measure_map_from(possible_hw, big_map)`

BFS from `possible_hw`; returns a dict mapping every reachable coordinate to its jump-distance from `possible_hw`.

```
map_dist = {}
distance = 0
sys_list = [possible_hw]

while len(sys_list) > 0:
  new_list = []
  for each sys in sys_list:
    map_dist[sys] = distance
    for each neighbor in split(big_map[sys].jumps):
      if neighbor not in map_dist and neighbor not in new_list:
        new_list.append(neighbor)
  distance += 1
  sys_list = new_list

return map_dist
```

---

## `createBalancedMap(series, game)`

Builds two independent player chains then selects the homeworld pair that produces the most evenly divided territory.

```
big_map = {}
lower_limit = max_players * systems_per_player
upper_limit = floor(lower_limit + sqrt(max_players * systems_per_player / map_compression))

chain1 = buildPlayerChain(systems_per_player, big_map, lower_limit, upper_limit)
// Add chain1 to big_map with player_number=1
fixJumps(big_map)

chain2 = buildPlayerChain(systems_per_player, big_map, lower_limit, upper_limit)
// Add chain2 to big_map with player_number=2
fixJumps(big_map)

// BFS from every system to get full distance matrix
for each coord in big_map:
  map_distances[coord] = measure_map_from(coord, big_map)

// --- Phase 1: find homeworld pairs with minimum territory imbalance ---
min_diff = 10000
candidates = []

for each hw1 in chain1:
  for each hw2 in chain2:
    if hw2 adjacent to hw1: skip   // don't place homeworlds next to each other

    count1 = count2 = 0
    dist1  = dist2  = 0

    for each sys in big_map:
      d1 = map_distances[hw1][sys]
      d2 = map_distances[hw2][sys]
      if d1 < d2:  count1++; dist1 += d1
      if d1 > d2:  count2++; dist2 += d2
      // ties → neither player

    diff = abs(count1 - count2)    // balance score; lower is better

    if diff < min_diff:
      min_diff = diff
      candidates = []

    if diff == min_diff:
      candidates.append({hw1, hw2, dist1, dist2})

// --- Phase 2: among tied candidates, find closest dispersion match ---
min_disp_diff = 10000
final_candidates = []

for each c in candidates:
  d = abs(c.dist1 - c.dist2)
  if d < min_disp_diff:
    min_disp_diff = d
    final_candidates = []
  if d == min_disp_diff:
    final_candidates.append(c)

pick = random choice from final_candidates

// Assign homeworlds and resources
set big_map[pick.hw1]: homeworld/owner/name='=Player 1=', mineral=fuel=agriculture=population=max_population=100
assignResources(series, big_map, pick.hw1, keys(chain1))

set big_map[pick.hw2]: homeworld/owner/name='=Player 2=', mineral=fuel=agriculture=population=max_population=100
assignResources(series, big_map, pick.hw2, keys(chain2))

saveMap(series, game, big_map)
```

---

## `createPrebuiltMap(series, game)`

Builds all player chains up-front and marks everything inactive.

```
big_map = {}
lower_limit = max_players * systems_per_player
upper_limit = floor(lower_limit + sqrt(max_players * systems_per_player / map_compression))

for player = 1 to max_players:
  player_name = "=Player {player}="
  chain = buildPlayerChain(systems_per_player, big_map, lower_limit, upper_limit)
  home  = selectHW(player_name, chain, big_map)
  assignResources(series, chain, home, keys(chain))
  // Merge chain into big_map; name non-homeworld systems
  fixJumps(big_map)

saveMap(series, game, big_map)
UPDATE systems SET system_active = '0' WHERE game_id = game.id
```

When a new player joins, `fillPlayerPosition()` is called to activate that player's systems and update ownership, then `fixPrebuiltLinks()` restores jump links between active sections.

---

## `createTwistedMap(series, game)` / `createMirrorMap(series, game)`

Both use a half-map approach:

```
big_map = {}
lower_limit = max_players * systems_per_player
upper_limit = floor(lower_limit + sqrt((max_players / 2) * systems_per_player / map_compression))

createMapSide(series, big_map, lower_limit, upper_limit)   // builds half the map

// Then either:
twistMap(big_map, max_players, lower_limit, upper_limit)   // for twisted
// or:
mirrorMap(big_map, max_players, lower_limit, upper_limit)  // for mirror

saveMap(series, game, big_map)
```

### `createMapSide(series, &big_map, lower_limit, upper_limit)`

```
for player = 1 to max_players / 2:
  player_name = "=Player {player}="
  chain = buildPlayerChain(systems_per_player, big_map, lower_limit, upper_limit)
  home  = selectHW(player_name, chain, big_map)
  assignResources(series, chain, home, keys(chain))
  // Merge chain into big_map, assign player_number = player; name non-HW systems
  fixJumps(big_map)
```

---

## `flipCoord(coord, xval, yval)`

Utility: reflects a coordinate through a point `(xval/2, yval/2)`.

```
(x, y) = parse coord
new_x = (xval != 0) ? (xval - x) : x
new_y = (yval != 0) ? (yval - y) : y
return "new_x,new_y"
```

---

## `copyMap(&big_map, n_players, xval, yval)`

Duplicates every system in `big_map` through the `flipCoord` transform. Used by both `twistMap` and `mirrorMap`.

```
for each coord in big_map (snapshot of original keys):
  new_coord = flipCoord(coord, xval, yval)
  player    = n_players - big_map[coord].player_number + 1   // mirrors player assignment

  big_map[new_coord].coordinates  = new_coord
  big_map[new_coord].jumps        = join([flipCoord(j, xval, yval) for j in split(jumps)], " ")
  big_map[new_coord].mineral      = big_map[coord].mineral
  big_map[new_coord].fuel         = big_map[coord].fuel
  big_map[new_coord].agriculture  = big_map[coord].agriculture
  big_map[new_coord].population   = big_map[coord].population
  big_map[new_coord].max_population = big_map[coord].max_population
  big_map[new_coord].player_number  = player

  if big_map[coord].homeworld == '':
    big_map[new_coord].owner = big_map[new_coord].homeworld = ''
    big_map[new_coord].name  = nameSystem(big_map)
  else:
    big_map[new_coord].owner = big_map[new_coord].homeworld = big_map[new_coord].name = "=Player {player}="
```

---

## `twistMap(&big_map, n_players, lower_limit, upper_limit)`

Rotates the half-map 180° and joins it to itself via the edge that enables the most cross-player connections.

### Step 1 — Find bounding box

```
(left, right, bottom, top) = bounding box of big_map coordinates
```

### Step 2 — Classify closest system to each edge per row/column

```
// For each y-row: find the system closest to the west edge and the east edge
// For each x-column: find the system closest to the north edge and the south edge
// Store: boundaries[edge][row_or_col] = {dist, player, coord}
// dist = distance from that system to the edge (e.g. west dist = x - left)
```

### Step 3 — Score all alignment offsets for each of the 4 edges

For each edge, try all possible sliding alignments of the edge matched against its 180°-rotated self:

```
for each edge in [north, south, east, west]:
  sort boundary entries by coordinate (ascending)
  rows = sorted index list

  best_players = 0
  best_links   = []

  // Two-pass sweep (start fixed at 0, vary end; then end fixed, vary start)
  for (start, end) sweeping all offsets:
    // "target" = minimum sum of (dist_i + dist_j) over the paired positions
    target = min over paired (i,j) of (boundaries[edge][rows[i]].dist + boundaries[edge][rows[j]].dist)

    p = set of distinct player numbers that would be connected
    links = []

    for (i, j) paired positions:
      if (n_players == 2 OR players_i != players_j)    // different players (or 2P game)
         AND (dist_i + dist_j) == target               // at the matching distance
         AND NOT (both are homeworlds):
           links.append(coord_i + " " + coord_j)
           add player_i, player_j to p

    if len(p) > best_players OR (len(p) == best_players AND len(links) > len(best_links)):
      best_players = len(p)
      best_links   = links
      best_offset  = current offset
      best_target  = target
```

### Step 4 — Pick the best edge

```
picked_boundary = edge with highest best_players; tie-break: most links
```

### Step 5 — Compute transform

```
switch picked_boundary:
  'north': xval = left + right + offset;  yval = 2*top   - (target - 1)
  'south': xval = left + right + offset;  yval = 2*bottom + (target - 1)
  'east':  xval = 2*right  - (target - 1); yval = top + bottom + offset
  'west':  xval = 2*left   + (target - 1); yval = top + bottom + offset
```

### Step 6 — Apply transform and add seam links

```
copyMap(big_map, n_players, xval, yval)

for each (from, to) in best_links:
  to_transformed = flipCoord(to, xval, yval)
  big_map[from].jumps += " " + to_transformed
  big_map[to_transformed].jumps += " " + from
```

---

## `mirrorMap(&big_map, n_players, lower_limit, upper_limit)`

Reflects the half-map through a seam and inserts a row/column of neutral buffer systems at the seam.

### Step 1 — Count systems at each extreme edge

```
(left, right, bottom, top) = bounding box
edge_counts = {top: N, bottom: N, left: N, right: N}  // count systems exactly AT each extreme
```

### Step 2 — Pick edge with most systems

```
picked_edge = argmax(edge_counts)
```

### Step 3 — (2-player game only) Try to move homeworld off the seam edge

```
if n_players == 2:
  if homeworld is on the picked_edge:
    try up to 2 random swaps to move it one step away from the edge
```

### Step 4 — Compute mirror transform and buffer line

```
switch picked_edge:
  'top':    xval=0,             yval=2*(top+1),    buffer=top+1
  'bottom': xval=0,             yval=2*(bottom-1), buffer=bottom-1
  'left':   xval=2*(left-1),    yval=0,            buffer=left-1
  'right':  xval=2*(right+1),   yval=0,            buffer=right+1
```

### Step 5 — Add seam links and buffer positions

```
for each system at the picked edge:
  buffer_coord = (x, buffer) or (buffer, y) depending on edge orientation
  buffer_planets.append(buffer_coord)
  big_map[system].jumps += " " + buffer_coord
```

### Step 6 — Mirror the half-map

```
copyMap(big_map, n_players, xval, yval)
// All jump strings are also mirrored via flipCoord
```

### Step 7 — Insert buffer planets with neutral resources

```
for each buffer_coord in buffer_planets:
  big_map[buffer_coord].jumps = "<north_neighbor> <south_neighbor>"   // or E/W equivalents
  // 25% chance: add cross-links to adjacent existing buffer planets
  big_map[buffer_coord].mineral     = rand(0, 25) + 25
  big_map[buffer_coord].fuel        = rand(0, 25) + 25
  big_map[buffer_coord].agriculture = rand(0, 25) + 25
  big_map[buffer_coord].population  = 0
  big_map[buffer_coord].max_population = max(mineral, fuel)
  big_map[buffer_coord].player_number  = 0    // neutral
  big_map[buffer_coord].homeworld = big_map[buffer_coord].owner = ''
  big_map[buffer_coord].name = nameSystem(big_map)
```

---

## `saveMap(series, game, map)`

Persists each system as a row in the `systems` table and creates initial `explored` rows for homeworlds.

```
for each coord in map:
  INSERT INTO systems SET series_id, game_number, game_id, coordinates, owner, homeworld,
                           name, jumps, mineral, fuel, agriculture, population,
                           max_population, player_number, system_active, ...

  if map[coord].homeworld != '':
    INSERT INTO explored SET series_id, game_number, game_id,
                              empire = map[coord].homeworld,
                              coordinates = coord,
                              update_explored = 0
```

Note: homeworld `empire` values at creation time are placeholder strings like `=Player 1=`; `fillPlayerPosition()` replaces them when an empire joins.

---

## `nameSystem(&big_map)`

- If `server.systemNameSource == 'random'`: calls `randomName()`.
- Otherwise: queries the configured words table for `COUNT(*)`, picks a random integer id offset, and returns that word. This avoids `ORDER BY RAND()` for performance.

---

## Output and storage

- Systems are saved to the `systems` table; adjacency list stored in `jumps` as a space-separated list of coordinate strings.
- Prebuilt maps keep `system_active = '0'` for inactive sections until players join.
- Homeworld name/owner/explored records use sentinel values (`=Player N=`) until replaced by real empire names.

## Performance and behavior notes

- The generator uses recursion (`addChain`) and `rand()`-based choices; results are non-deterministic without a fixed seed.
- `assignResources` ensures that the sum of non-homeworld resources equals the series target totals (`(systems_per_player - 1) * avg_*`), but individual planet values vary freely within the random allocation.
- `fixJumps()` enforces bidirectional adjacency across the whole `big_map` after each player's chain is added.
- The balanced map selects for minimum territory imbalance first, then minimum dispersion imbalance. A random tie-break applies when multiple pairs score equally.

## Implementation caveats

- `jumps` is a denormalized adjacency field stored as a space-separated string; not normalized.
- `saveMap()` inserts each system individually; for large maps this is I/O-heavy.
- The `addChain` recursion may occasionally fail to produce exactly `nplanets` systems (chain collision with `big_map`); `buildPlayerChain` retries with a fresh `chain` in a `do ... while` outer loop until `count(chain) == nplanets`.
