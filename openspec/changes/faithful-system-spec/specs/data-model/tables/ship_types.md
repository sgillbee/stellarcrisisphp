# Table: `ship_types`

Source DDL: [sc.sql](sc.sql#L437-L470)

## Purpose

Defines canonical ship types (Attack, Science, Colony, Stargate, etc.), whether they are mobile and the version group (v2/v3). The application loads these rows at runtime (`ship_types.php`) to derive available types and moving-ship lists.

## Columns

- `id` int(11) NOT NULL AUTO_INCREMENT — PK.
- `type` varchar(20) NOT NULL DEFAULT '' — canonical type name.
- `mobile` enum('1','0') NOT NULL DEFAULT '1' — whether the type appears in `moving_ships`.
- `version` varchar(20) NOT NULL DEFAULT 'v2' — version bucket (v2/v3) to support multiple rule sets.

## Indexes / Data

- PRIMARY KEY (`id`)
- UNIQUE KEY `type` (`type`)

Example rows (from dump): Attack, Science, Colony, Stargate, Cloaker, Satellite, Terraformer, Troopship, Doomsday, Minefield, Minesweeper, Engineer, Jumpgate (v3)

## Application mappings

- Loaded by `ship_types.php` at runtime to build `$ship_types`, `$moving_ships`, `$v3_ship_types`, and `$v3_moving_ships`.
- Ship behavior and order validation references these types (e.g. `getValidOrders()` tests `type` values).
