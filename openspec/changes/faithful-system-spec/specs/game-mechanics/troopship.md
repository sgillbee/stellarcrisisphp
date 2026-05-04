# Troopship

Source: `game/ships.php` (orders), `update.php` (invade handling)

Summary

- `Troopship` carries out `invade` orders to attempt ground invasions.

Behavior

- `invade` is available only when diplomatic status `dip_status == 2` (at war) for the system.
- Invasion success condition: `ship.br * 10 > system.population`.
- On success the system is transferred to the invader with `population = round(system.population/2)`; history/missives created and the ship deleted. Shared HQ explores the system for the invader.
- On failure the system loses `floor(2 * ship.br)` population and the ship is deleted; missive/history records unsuccessful invasion.

Acceptance tests

1) Successful invasion: system owner becomes invader and population halves (rounded).
2) Failed invasion: ship deleted and system.population reduced by `floor(2 * br)`.
