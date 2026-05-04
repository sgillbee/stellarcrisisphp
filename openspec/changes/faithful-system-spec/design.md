## Design: Approach for creating the faithful spec

### Goal

Produce an accurate, structured specification of the current application that is sufficient for reimplementation or verification.

### Approach

- Automated inventory: extract DB schema from `sc.sql`, list of pages/controllers from `main/`, `game/`, `admin/`, and utilities.
- Code reading: extract algorithmic behavior from key scripts (map generation, turn processing, combat resolution).
- Spec composition: split artifacts by feature area (UI, game mechanics, data model, API, integrations) using testable WHEN/THEN scenarios.

### Non-Goals

- Not performing code refactors or runtime changes.
- Not proposing redesigned architectures (that will be separate follow-up work).
