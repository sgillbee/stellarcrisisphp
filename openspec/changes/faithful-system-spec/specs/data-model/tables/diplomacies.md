# Table: `diplomacies`

Source DDL: [sc.sql](sc.sql#L57-L75)

## Purpose

Represents diplomatic relationships between empires within a game: offers, current status (peace/war/alliance), and team assignments. The table drives permissions (attack/transfer) and UI displays for diplomacy.

## Columns

- `id` int(11) NOT NULL AUTO_INCREMENT — Primary key.
- `game_id` int(11) NOT NULL DEFAULT '0' — FK to `games.id`.
- `from_empire` varchar(20) NOT NULL DEFAULT '' — Proposing empire.
- `to_empire` varchar(20) NOT NULL DEFAULT '' — Target empire.
- `status` varchar(20) NOT NULL DEFAULT 'neutral' — e.g., `neutral`, `war`, `allied`, `offer_pending`.
- `since` int(11) NOT NULL DEFAULT '0' — Unix timestamp when the status started.
- `offer_text` text — Optional message accompanying an offer.
- `team` tinyint(4) NOT NULL DEFAULT '0' — Team number when allied.
- `created_at` int(11) NOT NULL DEFAULT '0'

## Indexes

- UNIQUE KEY `pair` (`game_id`,`from_empire`,`to_empire`)

## Application mappings

- Created/updated by `update/moveship.php` (`checkForFirstContact()`), diplomacy UI and invite flows.
- Used during movement/combat checks to decide whether attacks are permitted.

## Notes

- Treat `status` as authoritative for permission checks; update logic creates default `diplomacies` on first contact.
