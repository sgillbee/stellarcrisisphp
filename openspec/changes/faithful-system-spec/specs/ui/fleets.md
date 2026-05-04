# Fleets View (UI)

Source: `game/ships.php` (fleets section)

Purpose

Describe the `Fleets` table view summarizing fleets, their aggregate strength, inventory, and fleet-level orders.

Main elements

- **Fleet Name:** editable input field stored in `fleets.name`.
- **Current BR:** computed as `sqrt(SUM( POW(br,2) ))` for ships with `fleet_id = this_fleet` (SQL uses `SUM(POW(br,2)) AS fleetStrength`).
- **Next BR:** computed using `br` adjusted by `player.mineral_ratio` in the same squared-sum manner.
- **Max BR:** `sqrt(SUM(POW(max_br,2)))`.
- **Location:** localized coordinate string for `fleets.location` with system name and annihilated marker.
- **Orders:** dropdown populated by `getFleetOrders()`; option labels map to user-friendly strings (move => direction + destination name; terraform/colonize/nuke/invade/pickup/disband/standby).
- **Inventory:** line(s) listing ship types and counts within the fleet (query groups `SELECT type, COUNT(*) FROM ships WHERE fleet_id = X GROUP BY type`).

Calculations

- Fleet strength calculation is intentionally Euclidean: combine ship BRs by square-summing then square-rooting. This makes larger ships contribute quadratically to fleet BP.

Behavior

- Selecting `move` shows destination coordinates read from `fleet.order_arguments` and renders readable destination via `getSystem()` or cached `system_cache` lookup.
- `disband` vs `disbandall`: `disband` keeps ships but removes fleet wrapper; `disbandall` removes fleet and ships (implementation details in fleetsScreen_processing()).
- Fleet orders are persisted to the `fleets` table and processed during the update loop; fleet-level moves will override member ship movement where applicable.
