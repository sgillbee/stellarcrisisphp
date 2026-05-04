# Table: `series`

Source DDL: [sc.sql](sc.sql#L345-L380)

## Purpose

Defines series-level configuration and presets used when creating games: resource averages, map type, diplomacy defaults, builder rules and other global options.

## Columns (selected)

- `id` int(11) NOT NULL AUTO_INCREMENT — PK.
- `name` varchar(40) NOT NULL DEFAULT '' — series name (unique key).
- `game_type` varchar(3) NOT NULL DEFAULT 'v2' — base rule set.
- `average_resources`, `avg_ag`, `avg_fuel`, `avg_min` — map/resource tuning values.
- `bridier_allowed` enum('1','0') — allow bridier scoring.
- `map_type` enum('standard','prebuilt','twisted','mirror','balanced') — map generation algorithm.
- `diplomacy` enum('6','5','4','3','2','1','0') — diplomacy default for series.
- `team_game` enum('1','0') — whether team rules apply.
- `update_time` int(11) — preferred update schedule.
- several toggles: `build_cloakers_cloaked`, `can_draw`, `can_surrender`, `cloakers_as_attacks`, etc.

## Keys

- PRIMARY KEY (`name`)
- UNIQUE KEY `id` (`id`)

## Application mappings

- Series configuration is read during game creation and by UI pages such as `main/customSeries.php`, `admin/createSeries.php`.
- Map generation functions (`game/makemap.php`) reference `map_type` and average resource fields.
