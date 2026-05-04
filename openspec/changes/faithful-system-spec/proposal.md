# Proposal: Faithful System Specification for StellarCrisisPHP

## Why

Create a faithful, comprehensive specification of the existing StellarCrisisPHP application so future redesigns can be anchored to an authoritative, testable specification. This spec will be the single source of truth for behavior, data, and algorithms implemented today.

## What

- Inventory UI views and interactions
- Extract the full data model from `sc.sql`
- Document core game mechanics: map generation, ship types, movement, combat, scoring, turn resolution
- Document backend controllers, APIs, and integration points (RSS feeds, email notifications)
- Produce acceptance criteria and testable scenarios for each feature

## Scope

- Faithful reproduction: capture current behavior as implemented in the repository.
- This change does NOT redesign or refactor the system; it documents current behavior. Improvements can be proposed later in a separate change.

## Sources

Primary sources for reverse-engineering:

- `sc.sql`, `sc.php`, `scfunctions.php`, `ship_types.php`
- Files under `game/`, `main/`, and `admin/`
- Root PHP pages and utility scripts

## Deliverables

- OpenSpec artifacts in this change folder (specs split by feature)
- Machine-readable DB schema and mapping to application models
- Pseudocode for core algorithms (map generation, turn resolution, combat)
- Acceptance criteria and scenario tests for each major capability

---

Next steps: inventory codebase files and extract table list from `sc.sql`.
