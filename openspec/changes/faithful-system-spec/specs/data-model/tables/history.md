# Table: `history`

Source DDL: [sc.sql](sc.sql#L219-L237)

## Purpose

Stores human-readable event history entries for empires and coordinates: battle reports, colony changes, diplomacy notes and other historic events persisted for player review and archive.

## Columns

- `id` int(11) NOT NULL AUTO_INCREMENT — PK.
- `game_id` int(11) NOT NULL DEFAULT '0' — FK to `games.id`.
- `coordinates` varchar(11) NOT NULL DEFAULT '' — Location for the event ("x,y").
- `empire` varchar(20) NOT NULL DEFAULT '' — Owner/display empire for the message.
- `message` text NOT NULL — Human-readable description of the event.
- `created_at` int(11) NOT NULL DEFAULT '0' — Timestamp.

## Indexes

- KEY `game_coord` (`game_id`,`coordinates`)

## Application mappings

- Written by `update.php` and helper `write_history()` during battles, invasions, colonization and end-game events.
- Displayed in `game/history.php` and archived in `history/` HTML exports.

## Notes

- Messages may be aggregated into `history` for both per-player and public archives depending on series/game settings.
