# Table: `series_ship_type_options`

Source DDL: [sc.sql](sc.sql#L381-L390)

## Purpose

Series-scoped overrides for ship types: allows a `series` to change `range_multiplier`, `loss`, `build_cost` and similar per-type tuning that affect movement, jumpgates, and combat balance.

## Columns (typical)

- `id` int(11) NOT NULL AUTO_INCREMENT — PK.
- `series_id` int(11) NOT NULL DEFAULT '0' — FK to `series.id`.
- `ship_type` varchar(40) NOT NULL DEFAULT '' — e.g., `Jumpgate`, `Attack`.
- `range_multiplier` float NOT NULL DEFAULT '1'
- `loss` float NOT NULL DEFAULT '0' — % loss when performing actions like jumping.
- `build_cost_override` smallint(6) DEFAULT NULL

## Application mappings

- Referenced when the update loop applies movement loss (jumpgate or stargate losses) and when computing ship build costs under series rules.

## Notes

- Game-level overrides exist in `game_ship_type_options` which override these per-game.
