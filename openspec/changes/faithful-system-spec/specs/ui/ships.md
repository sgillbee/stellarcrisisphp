# Ships View (UI)

Source: `game/ships.php`

Purpose

Describe the in-game `Ships` page the player uses to view and manage individual ships.

Main elements

- **Name:** editable input per ship (`<input name="ship_name[ID]">`) stored to `ships.name` on submit.
- **Current BR:** shown as `br` (hidden as `'---'` for ships with `orders == 'build'`).
- **Next BR:** calculated client-side/server-side as `next_br = min(br * player.mineral_ratio, max_br)` and displayed to indicate the expected post-maintenance value.
- **Max BR:** static `max_br` column.
- **Location:** localized coordinates via `xlateToLocal(ship.location)`.
- **Orders:** dropdown from `getValidOrders()` / `fixOrders()` (selected value posted as `ship_orders[ID]`).
- **Type:** ship type string; `morpher` ships render type italicized.

Actions and behavior

- Submitting the form updates `ships.name` and `ships.orders`/`order_arguments` in the DB.
- If `orders` include coordinates, the UI shows localized coords while the backend stores galactic coords (`xlateToGalactic()` / `xlateToLocal()` conversions).
- The `Cancel All Builds` control removes ships with `orders='build'` and restores affected `systems.population` for `Colony` ships.
- Name edits are sanitized before persisting with `sanitizeString()`.

Validation and helper logic

- `getValidOrders($series,$game,$ship,$player)` prepares the valid options; `fixOrders()` formats/normalizes them for presentation.
- Fleet assignment uses order `fleet:ID` to set `fleet_id` on the ship row.

Display hints

- Use color helper `brColor(current, max)` for `Current BR` and `Next BR` to indicate health/efficiency.
- Build rows are separated visually; builds show `Current BR` as `---` and keep `Next BR` to indicate post-build value.
