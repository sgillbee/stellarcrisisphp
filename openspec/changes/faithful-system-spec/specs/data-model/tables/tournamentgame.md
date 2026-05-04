# Table: `tournamentgame`

Source DDL: [sc.sql](sc.sql#L531-L547)

## Purpose

Associates a `tournament` with created `games`, recording round, slot and eventual winner information.

## Columns (selected)

- `id` int(11) NOT NULL AUTO_INCREMENT — PK.
- `tournament_id` int(11) NOT NULL DEFAULT '0' — FK to `tournament.id`.
- `game_id` int(11) NOT NULL DEFAULT '0' — FK to `games.id`.
- `round` int(11) NOT NULL DEFAULT '0'
- `slot` int(11) NOT NULL DEFAULT '0'
- `winner` varchar(40) NOT NULL DEFAULT ''

## Application mappings

- Created at tournament setup and updated when games complete to record winners and bracket progress.
