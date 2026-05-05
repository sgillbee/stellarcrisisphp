# Faithful System Spec — Index

This change contains a set of faithful specification artifacts derived from the existing PHP implementation.

Top-level folders and key artifacts

- **Data Model**: tables and relationships
  - `specs/data-model/tables/` — per-table descriptions (ships.md, systems.md, players.md, ...)
  - `specs/data-model/relationships.md` — relationship map and normalization suggestions
- **Game Mechanics**:
  - `specs/game-mechanics/update_loop.md` — stepwise update processing (nuke vs annihilate distinction corrected)
  - `specs/game-mechanics/combat.md` — combat math and resolution (damage_ratio formula corrected with full pseudocode)
  - `specs/game-mechanics/diplomacy_state_machine.md` — status values, offer rules, transition algorithm, team diplomacy, Shared HQ effects
  - (other mechanics files live in `specs/game-mechanics/`)
- **Algorithms** (detailed pseudocode):
  - `specs/algorithms/map_generation.md` — all map generation functions with full pseudocode (buildPlayerChain, addChain, selectHW, assignResources, fixJumps, measure_map_from, createBalancedMap, twistMap, mirrorMap, copyMap, flipCoord, saveMap)
  - `specs/algorithms/resource_ratios.md` — recalculateRatios() algorithm with pseudocode (ship consumption, system production, trade bonus, ratio formulas, tech development)
  - `specs/algorithms/bridier_ranking.md` — Bridier 1v1 ranking system (stake table, calculateBridier formula, index decay, end-game application)
  - `specs/algorithms/update_loop.md` — legacy update loop algorithm file
  - `specs/algorithms/jumpgates.md` — jumpgate open/close mechanics
  - `specs/algorithms/movement.md` — ship movement mechanics
- **UI**:
  - `specs/ui/map.md` — map view (created)
  - `specs/ui/ships.md` — ships listing (created)
  - `specs/ui/fleets.md` — fleet UI (created)
  - `specs/ui/system.md` — system detail (created)
- **Acceptance Tests**:
  - `specs/acceptance-tests/update_acceptance_tests.md`

Usage

- Use the `specs/specification-index.md` as a table of contents when reviewing or exporting the change.
- Each spec file references the canonical DDL in `sc.sql` when needed.
