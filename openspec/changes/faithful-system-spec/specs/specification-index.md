# Faithful System Spec — Index

This change contains a set of faithful specification artifacts derived from the existing PHP implementation.

Top-level folders and key artifacts

- **Data Model**: tables and relationships
  - `specs/data-model/tables/` — per-table descriptions (ships.md, systems.md, players.md, ...)
  - `specs/data-model/relationships.md` — relationship map and normalization suggestions
- **Game Mechanics**:
  - `specs/game-mechanics/update_loop.md` — stepwise update processing
  - `specs/game-mechanics/combat.md` — combat math and resolution
  - (other mechanics files live in `specs/game-mechanics/`)
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
