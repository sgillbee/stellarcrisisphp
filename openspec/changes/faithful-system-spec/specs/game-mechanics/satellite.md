# Satellite

Source: `game/ships.php` (orders), `update.php` (send transport exclusion)

Summary

- `Satellite` is a non-transportable, likely stationary unit; it is explicitly excluded from `send` transport via `FIND_IN_SET(type, "Stargate,Minefield,Satellite,Jumpgate") = 0` in the send implementation.

Behavior

- `Satellite` has no special runtime actions in `update.php`; it is treated as a ship for persistence and inventory counts, but is not moved by stargates/jumpgates.

Acceptance tests

1) Ensure satellites remain at origin after a `send` event that transports other ships.
