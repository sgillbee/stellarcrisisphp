# Table: `messages`

Source DDL: [sc.sql](sc.sql#L257-L278)

## Purpose

In-application messaging table for player-to-player messages, system missives (update reports), MOTD and admin broadcasts.

## Columns

- `id` int(11) NOT NULL AUTO_INCREMENT — PK.
- `game_id` int(11) NOT NULL DEFAULT '0' — FK to `games.id` where applicable.
- `from_empire` varchar(20) NOT NULL DEFAULT '' — Sender empire or system name (e.g., `system`).
- `to_empire` varchar(20) NOT NULL DEFAULT '' — Recipient empire (empty or special value for broadcast).
- `subject` varchar(255) NOT NULL DEFAULT ''
- `body` text NOT NULL — Message payload (may include HTML/simple markup).
- `is_motd` enum('1','0') NOT NULL DEFAULT '0' — Message of the day flag.
- `created_at` int(11) NOT NULL DEFAULT '0'
- `read` enum('1','0') NOT NULL DEFAULT '0'

## Indexes

- KEY `game_to` (`game_id`,`to_empire`)

## Application mappings

- Missives constructed during the update cycle are buffered and written into `messages` for players to read.
- UI: `main/`, `game/messageHistory.php`, and `admin/` message tools.

## Notes

- `messages` is used both for player-sent mail and system-generated update/missive messages; clients may filter by `is_motd` or `to_empire`.
