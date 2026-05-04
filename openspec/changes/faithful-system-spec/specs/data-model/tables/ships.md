# Table: `ships`

Source DDL: [sc.sql](sc.sql#L405-L436)

## Purpose

Represents individual ships (mobile and immobile), their combat rating (BR), ownership, orders, and location. Used by the UI for listing/editing ships and by the update loop for movement, combat and build/dismantle processing.

## Columns

- `id` int(11) NOT NULL AUTO_INCREMENT — Primary key.
- `br` float NOT NULL DEFAULT '0' — Current battle rating (BR).
- `build_cost` smallint(6) NOT NULL DEFAULT '0' — Build cost (series/game overrides may apply).
- `cloaked` enum('1','0') NOT NULL DEFAULT '0' — Cloak flag.
- `fleet_id` int(11) NOT NULL DEFAULT '0' — If non-zero, ship belongs to this fleet.
- `fuel_cost` smallint(6) NOT NULL DEFAULT '0' — Fuel cost to move/build.
- `game_id` int(11) NOT NULL DEFAULT '0' — Foreign key to `games.id`.
- `game_number` smallint(6) NOT NULL DEFAULT '0' — Redundant game number for convenience.
- `location` varchar(20) NOT NULL DEFAULT '' — Galactic coordinates string ("x,y").
- `maintenance_cost` smallint(6) NOT NULL DEFAULT '0' — Per-turn maintenance.
- `max_br` float NOT NULL DEFAULT '0' — Maximum BR for the ship type.
- `name` varchar(20) NOT NULL DEFAULT '' — Player-assigned ship name.
- `order_arguments` varchar(20) NOT NULL DEFAULT '' — Argument for orders (coordinates, fleet id, etc.).
- `orders` varchar(20) NOT NULL DEFAULT '' — Current order (move, build, fleet, send, etc.).
- `owner` varchar(20) NOT NULL DEFAULT '' — Empire/player name who owns the ship.
- `player_id` int(11) NOT NULL DEFAULT '0' — FK to `players.id`.
- `series_id` int(11) NOT NULL DEFAULT '0' — FK to `series.id` (for type/versioning).
- `type` varchar(20) NOT NULL DEFAULT '' — Ship type name (Attack, Science, Colony, ...).

## Indexes

- UNIQUE KEY `id` (`id`)
- KEY `series_id` (`series_id`,`game_number`)
- KEY `owner` (`game_id`,`owner`)
- KEY `location` (`game_id`,`location`)
- KEY `type` (`fleet_id`,`type`)

## Application mappings

- UI: `game/ships.php` (listing, naming, orders), `game/fleets.php` (fleet composition).
- Update loop: `update.php` and `update/moveship.php` (movement, explore, send, stargate/jumpgate handling, combat interactions).
- Order validation: `getValidOrders()`, `fixOrders()` in `game/ships.php`.
- Utility functions: `getShipByID()`, fleet strength calculations (SUM(br^2)).

## Notes / Implementation details

- BR math: update and fleet UI use sqrt(SUM(br^2)) to compute fleet BR.
- Location values are stored in galactic coordinates; UI shows localized coordinates via `xlateToLocal()`/`xlateToGalactic()`.
- Some ship behavior depends on `series`/`game` ship-type overrides (see `series_ship_type_options`, `game_ship_type_options`).
