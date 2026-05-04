# Table: `systems`

Source DDL: [sc.sql](sc.sql#L471-L499)

## Purpose

Represents star systems (map nodes) including coordinates, resources, owner, population and jump-links. Central to map generation, exploration, battle resolution and UI map display.

## Columns

- `id` int(11) NOT NULL AUTO_INCREMENT — surrogate primary key.
- `agriculture` int(11) NOT NULL DEFAULT '0' — agriculture resource level.
- `annihilated` enum('1','0') NOT NULL DEFAULT '0' — planet destroyed flag.
- `coordinates` varchar(11) NOT NULL DEFAULT '' — galactic coordinate string ("x,y").
- `fuel` int(11) NOT NULL DEFAULT '0' — fuel resource level.
- `game_id` int(11) NOT NULL DEFAULT '0' — FK to `games.id`.
- `game_number` smallint(6) NOT NULL DEFAULT '0' — redundant game number.
- `homeworld` varchar(20) NOT NULL DEFAULT '' — owner name if this is a homeworld.
- `jumps` varchar(47) NOT NULL DEFAULT '' — space-separated coordinates reachable from this system.
- `max_population` int(11) NOT NULL DEFAULT '0' — maximum population allowed.
- `mineral` int(11) NOT NULL DEFAULT '0' — mineral resource level.
- `name` varchar(20) NOT NULL DEFAULT '' — system name.
- `owner` varchar(20) NOT NULL DEFAULT '' — owning empire name.
- `player_number` smallint(6) NOT NULL DEFAULT '0' — player slot number (optional).
- `population` int(11) NOT NULL DEFAULT '0' — current population.
- `series_id` int(11) NOT NULL DEFAULT '0' — FK to `series.id`.
- `system_active` enum('0','1') NOT NULL DEFAULT '1' — flag for prebuilt maps to indicate used systems.

## Keys

- PRIMARY KEY (`game_id`,`coordinates`) — composite natural key.
- UNIQUE KEY `id` (`id`)
- KEY `series_id` (`series_id`,`game_number`)

## Application mappings

- Map generation and naming: `game/makemap.php` (`createPrebuiltMap`, `createBalancedMap`, `mirrorMap`, etc.).
- Map UI: `game/map.php`, `game/info.php`.
- Update loop: `update.php` (battle resolution, colonize, terraform, invade, nukes) uses `getSystem()`.

## Notes

- `jumps` stores adjacency as a space-separated list of coordinates; `potentialJumps()` and `getDirection()` operate on these strings.

