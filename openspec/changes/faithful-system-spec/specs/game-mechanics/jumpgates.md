# Stargates & Jumpgates

Source: `update.php` (stargate/jumpgate processing and jumpgate loss logic)

Purpose

- Describe how `send` orders are executed using `Stargate` and `Jumpgate` ships, and how jumpgate range and jumpgate loss are applied.

Processing steps (faithful)

1. The `update_game()` loop collects `send[origin][destination] = stargate_ship_id` during the per-ship order pass.
2. For each origin→destination entry, the engine loads the stargate ship via `getShipByID()`.
3. Range check (Jumpgate only):
   - If the stargate's `type` == `Jumpgate`, compute `$range = floor($stargate['br'] * getJumpgateRangeMultiplier($game))` when a multiplier is present (>0).
   - Compare destination coordinates to stargate coordinates; if outside the square range, the send is cancelled.
4. Teleportation:
   - If in-range (or the facility is a `Stargate`), run an `UPDATE ships SET location = destination` for all ships matching `game_id`, `owner = stargate.owner`, `location = stargate.location`, and excluding `FIND_IN_SET(type, "Stargate,Minefield,Satellite,Jumpgate") = 0`.
   - Update fleets' `location` the same way.
   - Call `checkForFirstContact()` for the destination to possibly create diplomacies/history for first contact.
5. Jumpgate loss (Jumpgate only):
   - Lookup `jumpgate_loss = $game['ship_type_options']['Jumpgate']['loss']`.
   - If `jumpgate_loss > 0` then:
     - If `jumpgate_loss >= $stargate.br` OR `(stargate.max_br - jumpgate_loss) < jumpgate_loss` then the jumpgate is consumed (DELETE FROM ships where id = stargate.id) and a missive/history entry for the consumed gate is recorded.
     - Otherwise, decrement the jumpgate's `br` and `max_br` by `jumpgate_loss` (UPDATE ships SET br = br - loss, max_br = max_br - loss).

Notes

- `Stargate` appears to allow transport without an explicit range check (the code only checks range for `Jumpgate`).
- The exclusion list prevents immobile infrastructure (stargates/jumpgates/satellites) and minefields from being teleported.

Acceptance checks

- When a valid `send` uses a `Stargate` at origin, ships owned by the stargate owner that are at the stargate's location are moved to the destination and fleets are moved too.
- When a `send` uses a `Jumpgate` with configured `loss`, the gate's `br` and `max_br` are decremented by `loss`, or the gate is deleted if consumed.
