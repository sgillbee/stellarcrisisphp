# Terraformer

Source: `game/ships.php` (orders), `update.php` (terraform handling)

Summary

- `Terraformer` ships perform `terraform` orders to increase a system's `agriculture` value.

Behavior

- Each terraformer increases `system.agriculture` by `floor(ship.br * 10)` on use, capped at `max(system.mineral, system.fuel)`.
- After applying its effect, the terraformer ship is deleted. Multiple terraformers may act in one update until the cap is reached.
- The update loop records history and a system-level missive describing how many times terraforming occurred that update.

Acceptance tests

1) Terraform increases agriculture by `floor(br*10)` and deletes terraformer ships; stops when agriculture reaches cap.
