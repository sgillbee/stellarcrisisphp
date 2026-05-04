# Table: `explored`

Source DDL: [sc.sql](sc.sql#L122-L143)

## Purpose

Tracks which systems (or coordinates) a player has explored/discovered. Used to limit visible map data and enable scouting reports.

## Columns

- `id` int(11) NOT NULL AUTO_INCREMENT — PK.
- `game_id` int(11) NOT NULL DEFAULT '0' — FK to `games.id`.
- `player_id` int(11) NOT NULL DEFAULT '0' — FK to `players.id`.
- `coordinates` varchar(11) NOT NULL DEFAULT '' — System coordinates string ("x,y").
- `system_name` varchar(40) NOT NULL DEFAULT '' — Cached system name at time of discovery.
- `discovered_at` int(11) NOT NULL DEFAULT '0' — Unix timestamp.

## Indexes

- KEY `player_game` (`game_id`,`player_id`)
- KEY `coord` (`game_id`,`coordinates`)

## Application mappings

- Written during movement/exploration (`update/moveship.php`) when a ship explores an unvisited system.
- Read by map UI to show discovered systems and by `game/scouting.php` for scouting reports.

## Notes

- The `explored` table is intentionally denormalized (caching system name and time) to avoid repeated joins during map rendering.
