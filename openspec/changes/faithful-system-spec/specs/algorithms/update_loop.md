# Update Loop (update_game)

Source code: `update.php`

## Purpose

Formalizes the per-update resolution sequence: player processing, order application, movement, combat resolution, special actions (mines, stargates, nukes, invasions, colonization, terraform), messaging and end-game checks.

## High-level steps

1. Increment `game.update_count` and set `last_update`.
2. Initialize working buffers: `$history`, `$missive`, `$saved_map`, `$destroyed`, and action buckets (`$nuke`, `$colonize`, `$annihilate`, `$terraform`, `$invade`, `$send`, `$open`, `$close`, etc.).
3. Check for team draws/surrenders and possibly end the game immediately.
4. For each active player:
   a. Load and record homeworld coordinates for localization.
   b. Update `player.ended_turn` based on idle thresholds and apply `tech_development` to `tech_level`.
   c. Process diplomacy rows for the player and reconcile `offer`/`status` fields; record surrenders in `$eliminated`.
   d. Update planetary `population` using `agriculture_ratio`.
   e. Build arrays to collect built ships, dismantled ships and explored planets for the player.
   f. Query all player's ships (randomized order) and for each ship:
      - Cache the system record to avoid repeated lookups.
      - Apply maintenance: `ship.br = min(ship.max_br, ship.br * player.mineral_ratio)`.
      - Parse `orders` and `order_arguments`. Default to `standby` when appropriate.
      - Fleet orders: derive ship behavior from fleet orders (move coordinates or site actions like `colonize`/`terraform`/`invade`/`nuke`).
      - Queue send/open/close/explore/move orders into the corresponding action buckets or invoke `move()` immediately for move/explore.
      - Handle `build` and `dismantle` by incrementing counters or deleting ships and marking missives.
      - For `cloak`/`uncloak`, toggle `ship.cloaked` and prepare missives as required.
      - Update DB row for the ship unless dismantled.
   g. Process `built_ships` into player-specific build missives.
   h. Process `dismantled_ships` into missives.
   i. Process `explored_planets` and add exploration lines to buffered missives.
   j. Persist `player.tech_level` and `player.ended_turn` to `players` table.
   k. Update fleet `location` and reset fleet orders to `standby` for the player.

5. Battle resolution (per-system):
   a. For each system, collect non-cloaked ships grouped by owner.
   b. Compute `battle_points[owner] = SUM(br^2)` (SQL uses `SUM(br*br)`).
   c. Determine `allegiances` via `allegiances()` which either returns enemies and allies based on `diplomacies` and team rules.
   d. Allocate damage: for each owner A, distribute A's battle points proportionally across enemies based on their battle points. Damage accumulation is stored in `damage_received[owner]`.
   e. Apply damage to each owner's ships:
      - Compute `dest = damage_received[owner] / 2` (the destructive energy to spend against this owner).
      - Iterate ships in random order; if `pow(ship.br,2) * fuel_ratio <= dest` then the ship is destroyed, `dest` reduced by `pow(br,2) * fuel_ratio`, and a DB delete is issued.
      - After consuming discrete ship destruction, recompute remaining battle points `BP_remaining` using `SUM(br^2)` and adjust survivors by `damage_ratio = 1 - ((damage_received/2 + dest) / BP_remaining)`.
      - If `damage_ratio <= 0`, all surviving ships at that location for that owner are deleted; otherwise `br` of surviving ships is scaled by `damage_ratio` via `UPDATE ships SET br = br * damage_ratio`.
   f. Track destroyed counts per type for history/missive construction; special-case `Minefield` (immune to DEST) and `Minesweeper` (can mark `swept`).

6. Special action processing (after battle):
   - Mines: exploded minefields that weren't swept delete all ships in the system and halve population.
   - Stargate/Jumpgate sends: move eligible ships (exclude Stargate/Minefield/Satellite/Jumpgate types), move fleets, call `checkForFirstContact()` at destination. For `Jumpgate` types apply configured `loss` (from `game_ship_type_options`), consuming or damaging the gate per rules.
   - Nukes, Annihilate (Doomsday), Invade, Colonize, Terraform: each action has its own success rules in code (e.g., `invade` checks `ship.br*10 > system.population`; colonize sets initial population to `max(1, pow(br,2))`). Actions may delete the performing ship and change `systems` rows.
   - Engineers open/close jumps by editing the space-separated `systems.jumps` field and consuming engineer BR (or deleting the ship if consumed).

7. Finalize missives and messaging:
   - Consolidate buffered messages per player into an `update` message inserted into `messages` table.`
   - Recalculate player ratios and persistent state via `recalculateRatios()`.

8. Post-update checks:
   - Process eliminated players (surrenders/nuked) including cleaning up `players`, `ships`, `fleets`, `explored`, `scouting_reports`, `messages`, and `diplomacies`.
   - Award wins, bridier updates, and team notifications as appropriate.
   - Determine `game_over` or `draw` based on diplomacy and remaining players; call `endGame()` if terminal.
   - Close games automatically after configured update thresholds and remove unused prebuilt systems.

## Key formulas and rules

- Fleet/owner combat strength: BP_owner = SUM(ship.br^2) over non-cloaked ships.
- Damage allocation: for each pair of opposing sets, damage proportionally distributed using BP fractions.
- Destruction check for a ship: if pow(ship.br,2)*fuel_ratio <= available_dest then ship is destroyed and available_dest reduced.
- Remaining ships scale: surviving ships have `br` scaled by computed `damage_ratio`.

## Related functions

- `move()` / `checkForFirstContact()` (movement and contact detection) — `update/moveship.php`.
- `allegiances()` (determine enemies/allies) — `update.php`.
- `getJumpgateRangeMultiplier()` and reads of `game_ship_type_options`/`series_ship_type_options` for movement loss and range tuning.

## Implementation notes and risks

- Many actions are implemented as multi-step: queueing during ship processing, then resolving in dedicated phases. This design avoids order-dependency but requires careful state tracking.
- `ORDER BY RAND()` is used to randomize ship processing; this is expensive for large ship counts and seeded via `srand(time())` in older code.
- The `systems.jumps` field is an ad-hoc space-separated adjacency list; opening/closing jumps mutates the string directly.

## Detailed pseudocode

The pseudocode below mirrors the intent and order of `update.php`. Variable names follow the original code where practical.

```
function update_game(game_id):
   load game, series, server settings
   increment game.update_count and set last_update timestamp

   init buffers: history=[], missive={}, saved_map={}, destroyed={}, mined={}, swept={}
   init action buckets: send_queue={}, open_queue={}, close_queue={}, nuke_queue={}, invade_queue={}, terraform_queue={}, colonize_queue={}, built_ships=[], dismantled_ships=[]

   players = SELECT active players for game_id
   for player in players:
      recalc per-player ratios (mineral_ratio, fuel_ratio) if needed
      preload player homeworld coords for localization

   // Phase A: Collect and queue ship actions
   select all ships for game_id ordered in a stable/randomized way
   for ship in ships:
      if ship.cloaked then continue when appropriate
      apply maintenance estimate: next_br = min(ship.br * player.mineral_ratio, ship.max_br)

      switch ship.orders:
         case 'build': add to built_ships; continue
         case 'dismantle': delete ship; record in dismantled_ships; continue
         case 'move'|'explore':
            result = move(ship)        // update/moveship.php: moves ship, handles fuel and location
            if result.moved: mark moved and potentially checkForFirstContact later
            if order was 'explore': reveal to player via missive
         case 'send':
            send_queue[ship.location][ship.order_arguments].append(ship.id)
         case 'open': open_queue.append(ship.id)
         case 'close': close_queue.append(ship.id)
         case 'cloak'|'uncloak': toggle ship.cloaked and possibly generate missive
         default: leave at standby

   // Phase B: Combat resolution per system
   systems_with_ships = keys of saved_map or SELECT DISTINCT location FROM ships WHERE game_id
   for system_coord in systems_with_ships:
      owners = SELECT DISTINCT owner FROM ships WHERE location=system_coord AND cloaked=0
      if owners empty: continue

      for owner in owners:
         battle_points[owner] = SELECT SUM(br*br) FROM ships WHERE owner=owner AND location=system_coord AND cloaked=0
         damage_received[owner] = 0
         apply fuel_ratio: if player.fuel_ratio < 1 then battle_points[owner] *= player.fuel_ratio
         allegiances[owner] = allegiances(owners, system, series, game, owner)

      // allocate damage proportionally across enemies
      for attacker in owners:
         enemies = allegiances[attacker].enemies
         if enemies empty: continue
         opposing_bp = sum(battle_points[e] for e in enemies)
         for enemy in enemies:
            damage_received[enemy] += battle_points[attacker] * (battle_points[enemy] / opposing_bp)

      // apply damage to each owner
      for owner in owners:
         dest = damage_received[owner] / 2
         fuel_ratio = clamp(player.fuel_ratio, 0, 1) or 1.0

         // Destroy discrete ships while dest remains
         select ships_for_owner = SELECT * FROM ships WHERE owner=owner AND location=system_coord AND cloaked=0 AND type<>'Minefield' ORDER BY RAND()
         for ship in ships_for_owner:
            if pow(ship.br,2) * fuel_ratio <= dest:
               record destroyed ship in destroyed[system_coord][owner][type]
               dest -= pow(ship.br,2) * fuel_ratio
               DELETE ship from DB

         // Recompute remaining battle power (after deletions)
         BP_remaining = SELECT SUM(br*br) FROM ships WHERE owner=owner AND location=system_coord AND cloaked=0
         if BP_remaining:
            BP_remaining *= fuel_ratio
            damage_ratio = 1 - ((damage_received[owner]/2 + dest) / BP_remaining)
            if damage_ratio <= 0:
               // wipe remaining ships
               SELECT remaining ships and add to destroyed count
               DELETE remaining ships
            else:
               UPDATE ships SET br = br * damage_ratio WHERE owner=owner AND location=system_coord AND cloaked=0

      // After owner-loop: mark mined/swept flags and collect missive entries for destroyed/sighted

   // Phase C: Resolve minefields, stargates/jumpgates, and other queued actions
   for location in mined keys:
      if mined[location] and not swept[location]:
         SELECT * FROM ships WHERE location=location and game_id=game_id and (no minefield exception)
         add names to missive; DELETE all ships at location; systems.population = max(population/2, 1)

   // Process send_queue (stargates/jumpgates)
   for origin in send_queue keys:
      for dest in send_queue[origin] keys:
         ship_ids = send_queue[origin][dest]
         eligible_ships = filter out Gate/Minefield/Satellite/Jumpgate types
         move eligible_ships to dest (UPDATE ships SET location=dest)
         for ship moved: call checkForFirstContact(dest, ship_owner, history, missive)
         if jumpgate: apply configured loss (reduce gate.br/max_br or DELETE gate when exhausted)

   // Phase D: Special actions (nuke, invade, colonize, terraform, annihilate)
   for pending action in respective queues:
      apply per-action rules (population checks, BR consumption, system.owner changes, ship deletions)
      record history and missives for players

   // Phase E: Finalize
   persist missives into messages table per player
   recalc ratios via recalculateRatios(vars)
   cleanup eliminated players and award bridier via calculateBridier
   if game over or draw: call endGame(); persist final history and close game
   commit DB transaction
```

Notes:
- The code intentionally breaks combat into discrete destruction then scaling phases to preserve deterministic rounding characteristics and to reflect the original implementation's balance choices.
- Randomization is introduced via `ORDER BY RAND()` when selecting ships to be destroyed first.

