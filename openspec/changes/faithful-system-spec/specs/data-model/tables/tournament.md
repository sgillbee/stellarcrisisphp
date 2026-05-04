# Table: `tournament`

Source DDL: [sc.sql](sc.sql#L500-L515)

## Purpose

Stores tournament metadata: name, schedule, configuration and references to games created for the tournament.

## Columns (selected)

- `id` int(11) NOT NULL AUTO_INCREMENT — PK.
- `name` varchar(80) NOT NULL DEFAULT '' — Tournament name.
- `created_at` int(11) NOT NULL DEFAULT '0'
- `start_at` int(11) DEFAULT NULL — Scheduled start timestamp.
- `status` varchar(20) NOT NULL DEFAULT '' — `pending`, `running`, `completed`.

## Application mappings

- Admin and user-facing tournament pages live under `tournaments/` and use this table to drive scheduling and game assignments.
