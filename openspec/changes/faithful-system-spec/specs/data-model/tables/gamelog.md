# Table: `gamelog`

Source DDL: [sc.sql](sc.sql#L167-L183)

## Purpose

Stores high-level game log entries, end-of-game results and bridier scoring summaries. Used for audit, reporting and tournament summaries.

## Columns

- `id` int(11) NOT NULL AUTO_INCREMENT — PK.
- `game_id` int(11) NOT NULL DEFAULT '0' — FK to `games.id`.
- `event_type` varchar(40) NOT NULL DEFAULT '' — e.g., `bridier_result`, `game_start`, `game_end`.
- `payload` text NOT NULL — JSON/text details of the event.
- `recorded_at` int(11) NOT NULL DEFAULT '0'

## Indexes

- KEY `game_event` (`game_id`,`event_type`)

## Application mappings

- Written by `update.php` during end-of-game and bridier calculations, and by admin/tournament flows.

## Notes

- `payload` may contain structured data used by tooling to generate reports.
