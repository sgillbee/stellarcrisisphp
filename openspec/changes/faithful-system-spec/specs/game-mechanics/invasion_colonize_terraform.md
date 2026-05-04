# Invasion, Colonization, Terraforming

Source: `update.php` (invade/colonize/terraform sections)

Purpose

- Describe how troopship invasions, colony ship colonization, and terraformer actions are resolved in the update.

Invasion (Troopship)

- Collected during the per-ship phase into `$invade[$location][]` for ships with `orders='invade'` (or fleets with `orders='invade'`).
- For each invading ship:
  - Verify war state: `getDiplomacyWithOpponent()` must return `status == 2`.
  - Success condition: `if ($ship['br'] * 10 > $system['population'])` then invasion succeeds:
    - Insert a `history` and `missive` entry, if `homeworld` set mark elimination, set `owner = ship.owner`, set `population = round(system.population / 2)`, and (if Shared HQ) add `explored` for the invader's player.
    - Delete the invading ship and stop processing further invading ships for that system.
  - Failure: record unsuccessful invasion, reduce `system.population -= floor(2 * $ship['br'])`, delete the invading ship.

Colonization (Colony ship)

- Collected into `$colonize[$location]` and processed per-location.
- For each colony ship: if the system is not `annihilated`:
  - Compute `initial_population = max(pow(ship.br, 2), 1)`.
  - Set `owner = ship.owner`, `population = initial_population`, `max_population = max( system.mineral, system.fuel )`.
  - If `series.diplomacy == 6`, ensure the colonizer's player has the system in `explored` and, if appropriate, call `addExploredToFriends()`.
  - Delete the colony ship and stop further colonization processing for that system.

Terraforming (Terraformer)

- Processed per `terraform[$location]` list.
- For each terraformer ship:
  - Increase `system.agriculture` by `floor(ship.br * 10)`, capped at `max(system.mineral, system.fuel)`.
  - Record a `history` entry, delete the terraformer ship.
  - Stop processing once `system.agriculture` reaches `max(mineral,fuel)`.

Notes

- All three actions consume the acting ship(s).
- Shared HQ (`series.diplomacy == 6`) has special handling to ensure explorers/colonizers/invaders get `explored` rows added to the player's map so the new owner can see the planet immediately.

Acceptance checks

- Invasion: a Troopship with sufficiently high BR should change the system owner and reduce population accordingly.
- Colonize: a Colony ship should create a new owner and set population to pow(br,2).
- Terraform: a Terraformer should increase `agriculture` up to the system's resource cap and be removed from `ships`.
