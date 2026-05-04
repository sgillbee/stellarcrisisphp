# System Detail View (UI)

Source: `game/system.php`, `game/map.php` (map actions), and helper functions (`scfunctions.php`).

Purpose

- Provide a complete specification for the single-system detail screen shown when players click a planet on the map. This view is used for local orders (build, invade, colonize, terraform), viewing ship lists, and inspecting system attributes.

Main elements

- **Header:** system name and coordinates (localized via `xlateToLocal()`), border color indicating ownership via `systemNameColor()`.
- **Owner badge:** icon from `empires.icon` if owned, or neutral/planet image if unowned.
- **Resource panel:** shows `mineral`, `agriculture`, `fuel` and `max_population`.
- **Population & status:** shows `population` and `annihilated` state; if annihilated, display prominent "Remains of" label and disable build/invade controls.
- **Ship list:** table of ships present at the system (joined from `ships`), showing `name`, `type`, `br`, `orders`, `owner`, and controls to give orders or join fleets.
- **Fleet summary:** aggregated BR (sqrt(sum(br^2))) and counts for friendly vs enemy ships (as computed in `map.php` queries).
- **Action controls:** forms/buttons for valid actions depending on player rights and series settings: `build`, `colonize`, `terraform`, `nuke` (admin), `open/close` stargate/jumpgate, `send` ships, `create fleet`.

Data sources

- Primary select: `systems` row for the coordinates and `explored`/`scouting_reports` to determine explored status and visibility.
- Ships query: `SELECT * FROM ships WHERE game_id = ? AND location = ?` joined with `players`/`fleets` as needed.
- Message/history: recent `history` entries filtered by `coordinates` to show recent local events.

Presentation rules

- If `explored` is `no` or absent, sensitive details (exact ship BR) are hidden or obfuscated; show `?` for unknown ship counts.
- If `system.annihilated == '1'`, show ruins image and disable build/colony/terraform actions.

Interactions and form behavior

- Order submission flows via the system-specific processing functions in `game/system.php` (or `sc.php` dispatcher) and stores orders in `ships.orders` or `fleets.orders`.
- Clicking a ship row opens the ship detail/edit dialog (rename, change orders).

Acceptance tests

1) Visibility: Unexplored system shows `?` for ship counts and hides owner-specific icons.
2) Build control: With adequate `player.build` and `series.build_cloakers_cloaked` settings, clicking `build` creates a `ships` row with `orders='build'` and correct `build_cost` deducted after update.
