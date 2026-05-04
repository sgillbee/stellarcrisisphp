# Table: `invitations`

Source DDL: [sc.sql](sc.sql#L238-L256)

## Purpose

Tracks invitations to series/games: who invited whom, message, team assignments and acceptance state.

## Columns

- `id` int(11) NOT NULL AUTO_INCREMENT — PK.
- `series_id` int(11) NOT NULL DEFAULT '0' — Series context for the invite.
- `game_id` int(11) NOT NULL DEFAULT '0' — Optional game context.
- `from_empire` varchar(20) NOT NULL DEFAULT ''
- `to_empire` varchar(20) NOT NULL DEFAULT ''
- `team` tinyint(4) NOT NULL DEFAULT '0'
- `message` text — Optional invite message.
- `accepted` enum('1','0') NOT NULL DEFAULT '0'
- `created_at` int(11) NOT NULL DEFAULT '0'

## Indexes

- KEY `series_to` (`series_id`,`to_empire`)

## Application mappings

- UI: `game/invite.php` and related admin flows.
- Update and player acceptance flows update `accepted` and possibly create `players` rows.
