# Table: `games`

Source DDL: [sc.sql](sc.sql#L184-L218)

## Purpose

Represents a game instance: which series it belongs to, players count, update state, closure flags and other per-game runtime metadata. The update loop reads and writes `games` to track update counts and closure.

## Columns (selected)

- `id` int(11) NOT NULL AUTO_INCREMENT — surrogate primary key.
- `game_type` varchar(3) NOT NULL DEFAULT 'v2' — ruleset version.
- `series_id` int(11) NOT NULL DEFAULT '0' — FK to `series.id`.
- `game_number` smallint(6) NOT NULL DEFAULT '0' — series-scoped game number.
- `bridier` tinyint(4) NOT NULL DEFAULT '-1' — bridier mode flag/value.
- `closed` enum('1','0') NOT NULL DEFAULT '0' — closed flag.
- `created_at` int(11) NOT NULL DEFAULT '0' — creation timestamp.
- `created_by` varchar(20) NOT NULL DEFAULT '' — creator empire.
- `diplomacy` enum('6','5','4','3','2','1','0') NOT NULL DEFAULT '2' — diplomacy mode for the game.
- `last_update` int(11) NOT NULL DEFAULT '0' — last update timestamp.
- `player_count` int(11) NOT NULL DEFAULT '0'
- `processing` tinyint(4) NOT NULL DEFAULT '0' — processing semaphore.
- `update_count` int(11) NOT NULL DEFAULT '0' — number of updates run.
- `updating` enum('0','1') NOT NULL DEFAULT '0' — update-in-progress flag.
- `version` varchar(20) NOT NULL DEFAULT '' — server/version string.
- `weekend_updates` enum('1','0') NOT NULL DEFAULT '1'

## Keys

- PRIMARY KEY (`series_id`,`game_number`)
- UNIQUE KEY `id` (`id`)

## Application mappings

- Game lifecycle: creation in admin/main pages, listing in `main/gameList.php`.
- Update orchestration: `update.php` increments `update_count`, sets `last_update`, and checks `closed`/`updating` flags.
- Concurrency: `processing`/`updating` fields are used as semaphores to avoid concurrent updates.
