# Table: `players`

Source DDL: [sc.sql](sc.sql#L279-L320)

## Purpose

Represents a player's per-game state (resources, tech, ratios, turn state). This row is the canonical in-game profile used by the update loop, UI and game-management code.

## Columns

- `id` int(11) NOT NULL AUTO_INCREMENT — surrogate primary key.
- `name` varchar(20) NOT NULL DEFAULT '' — empire/player name.
- `series_id` int(11) NOT NULL DEFAULT '0' — FK to `series.id`.
- `game_number` smallint(6) NOT NULL DEFAULT '0' — game number within series.
- `game_id` int(11) NOT NULL DEFAULT '0' — FK to `games.id`.
- `agriculture` int(11) NOT NULL DEFAULT '0' — per-player agriculture stat.
- `agriculture_ratio` float NOT NULL DEFAULT '1' — applied multiplier for agriculture growth.
- `build` int(11) NOT NULL DEFAULT '0' — build queue / available build points.
- `economic_power` int(11) NOT NULL DEFAULT '0' — derived economic power.
- `ended_turn` enum('1','0') NOT NULL DEFAULT '0' — whether player ended turn.
- `fuel` int(11) NOT NULL DEFAULT '0' — fuel stock.
- `fuel_ratio` float DEFAULT NULL — fuel maintenance multiplier.
- `fuel_use` smallint(6) NOT NULL DEFAULT '0' — per-turn fuel used.
- `ip` varchar(15) NOT NULL DEFAULT '' — last seen IP.
- `last_access` int(11) NOT NULL DEFAULT '0' — timestamp of last access.
- `last_update` smallint(6) NOT NULL DEFAULT '0' — last update number seen.
- `maintenance` int(11) NOT NULL DEFAULT '0' — maintenance cost.
- `map_origin` varchar(11) NOT NULL DEFAULT '0,0' — origin offset for local coords.
- `max_population` int(11) NOT NULL DEFAULT '0'
- `military_power` int(11) NOT NULL DEFAULT '0'
- `mineral` int(11) NOT NULL DEFAULT '0'
- `mineral_ratio` float DEFAULT NULL
- `notes` text — player notes.
- `population` int(11) NOT NULL DEFAULT '0'
- `team` tinyint(4) NOT NULL DEFAULT '0'
- `team_spot` varchar(20) NOT NULL DEFAULT ''
- `tech_development` float NOT NULL DEFAULT '0'
- `tech_level` float NOT NULL DEFAULT '0'
- `techs` text NOT NULL — space-separated tech list.
- `traded_in` smallint(6) NOT NULL DEFAULT '0'

## Keys

- PRIMARY KEY (`series_id`,`game_number`,`name`) — natural key used by app routing.
- UNIQUE KEY `id` (`id`)
- KEY `game_id` (`game_id`,`name`)

## Application mappings

- Update loop: `update.php` reads/writes player fields (`fuel_ratio`, `mineral_ratio`, `ended_turn`, `tech_level`, etc.).
- UI: player screens under `main/` and `game/` use columns like `map_origin`, `techs` and `notes`.

## Notes

- `techs` is used by `getValidOrders()` for morpher/morph logic and to present available morph targets.
