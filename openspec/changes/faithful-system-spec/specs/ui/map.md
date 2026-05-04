# Map View (UI)

Source: `game/map.php`, `game/makemap.php` (map helpers)

Purpose

Describe the in-game Map view and Mini-Map used by players to inspect explored systems, view ship counts, and navigate to system detail screens.

Main elements

- **Map grid:** HTML table rendering a rectangular portion of the galactic map based on the player's explored systems or a 10x10 zoom region.
- **Icons:** per-system icons depend on `systems.owner` and `systems.annihilated` (unowned, annihilated, owner icon from `empires.icon`). 40x40 assets used for the main map; 20x20 for mini-map.
- **System data cells:** show `mineral`, `agriculture`, `fuel`, localized ship counts (friendly/enemy) and population (with build adjustments) when explored.
- **Jumps visualization:** simple vertical/horizontal 1-pixel GIF lines are drawn between adjacent systems when `systems.jumps` indicate a link.
- **Zooming:** Clicking a system triggers `mapScreen_processing()` which sets `zoomed_planet` and renders a 10x10 area centered on the selected system.

Data sources and queries

- Explored systems and scouting reports are read via a `UNION` of `explored INNER JOIN systems` and `scouting_reports` (only visible planets are shown).
- Ship counts are aggregated via `SELECT ... FROM ships INNER JOIN explored` grouped by `location`, computing `friendly`, `enemy`, and `population_adjustment` using `SUM(IF(...))` constructs.

Presentation rules

- If a system is not `explored` the UI shows question marks for ship counts and renders system name greyed out.
- Borders around icons may indicate ownership color via `systemNameColor()` and `empire.icon` is used for owner visualization.
- Jumps are drawn when the `jump_presence` cross-links indicate adjacency between displayed cells.

Interactions

- Clicking a planet image posts `system:<local_coords>` to the server; the processing routine translates to galactic coordinates and sets `zoomed_planet`.
- Minimap and Map show coordinate offsets relative to the player's `map_origin` via `xlateToLocal()`/`xlateToGalactic()`.

Performance notes

- Map rendering depends on pre-aggregated `explored` and `scouting_reports` for the player — computing ship counts uses a single grouped query to avoid per-cell queries.

Acceptance tests

1) Zoomed view: clicking a system with `mapScreen_processing()` populates `zoomed_planet` and the subsequent render shows the 10x10 centered area.
2) Ownership icons: systems owned by the player show the player's `empires.icon`; other owned systems show cached owner icons.
