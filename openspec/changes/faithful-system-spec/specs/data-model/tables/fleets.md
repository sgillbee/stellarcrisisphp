# Table: `fleets`

Source DDL: [sc.sql](sc.sql#L144-L166)

## Purpose

Represents named groups of ships (fleets). Stores fleet-level orders, location, owner and metadata used by the UI and update loop when applying fleet orders or moving grouped ships.

## Columns

- `id` int(11) NOT NULL AUTO_INCREMENT — PK.
- `game_id` int(11) NOT NULL DEFAULT '0' — FK to `games.id`.
- `owner` varchar(20) NOT NULL DEFAULT '' — Empire name owning the fleet.
- `name` varchar(40) NOT NULL DEFAULT '' — Fleet name.
- `location` varchar(20) NOT NULL DEFAULT '' — Galactic coordinates ("x,y").
- `orders` varchar(20) NOT NULL DEFAULT '' — Fleet-wide order (move, hold, split, send).
- `order_arguments` varchar(255) NOT NULL DEFAULT '' — Extra args for orders (dest coords, fleet id).
- `created_at` int(11) NOT NULL DEFAULT '0'
- `updated_at` int(11) NOT NULL DEFAULT '0'

## Indexes

- KEY `game_owner` (`game_id`,`owner`)
- KEY `location` (`game_id`,`location`)

## Application mappings

- UI: `game/fleets.php`, fleet composition and naming.
- Orders processed by `game/ships.php` helpers (`getFleetOrders()`) and by the update loop which expands fleet orders to individual ship actions.

## Notes

- Fleets are a convenience grouping; movement and BR calculations still operate on ships. Fleet BR is computed from member ships in `ships` (sqrt(SUM(br^2))).
