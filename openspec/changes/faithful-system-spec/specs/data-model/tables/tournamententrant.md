# Table: `tournamententrant`

Source DDL: [sc.sql](sc.sql#L516-L530)

## Purpose

Represents a player's entry into a tournament including seed, elimination status and progress through rounds.

## Columns (selected)

- `id` int(11) NOT NULL AUTO_INCREMENT — PK.
- `tournament_id` int(11) NOT NULL DEFAULT '0' — FK to `tournament.id`.
- `empire` varchar(40) NOT NULL DEFAULT '' — Entrant empire name.
- `seed` int(11) DEFAULT NULL
- `eliminated` enum('1','0') NOT NULL DEFAULT '0'
- `created_at` int(11) NOT NULL DEFAULT '0'

## Application mappings

- Used by tournament management pages to schedule matches and advance winners to subsequent rounds.
