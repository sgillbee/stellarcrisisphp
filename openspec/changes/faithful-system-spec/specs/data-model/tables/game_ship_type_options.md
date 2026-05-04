# Table: `game_ship_type_options`

Source DDL: [sc.sql](sc.sql#L391-L404)

## Purpose

Game-scoped overrides for ship types. Overrides in this table take precedence over `series_ship_type_options` and allow per-game tuning of movement loss, range multipliers and build costs for specific ship types.

## Columns (typical)

- `id` int(11) NOT NULL AUTO_INCREMENT — PK.
- `game_id` int(11) NOT NULL DEFAULT '0' — FK to `games.id`.
- `ship_type` varchar(40) NOT NULL DEFAULT ''
- `range_multiplier` float NOT NULL DEFAULT '1'
- `loss` float NOT NULL DEFAULT '0'
- `build_cost_override` smallint(6) DEFAULT NULL

## Application mappings

- Read by movement and send logic (jumpgate/stargate) in `update.php` and `update/moveship.php` to compute losses and allowable range.

## Notes

- Use these overrides to create special-case game rules (e.g., reduced jump loss, extended range).
