import React, { useState } from 'react';
import { Ship, System } from '../../types/game';
import './ShipMovement.css';

interface ShipMovementProps {
  ship: Ship;
  systems: System[];
  onMoveOrder: (shipId: string, targetSystem: string) => void;
  onCancel: () => void;
}

const ShipMovement: React.FC<ShipMovementProps> = ({
  ship,
  systems,
  onMoveOrder,
  onCancel
}) => {
  const [selectedSystem, setSelectedSystem] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Filter out the current system
  const availableSystems = systems.filter(sys => sys._id !== ship.location);

  // Calculate fuel cost for movement (simplified)
  const calculateFuelCost = (targetSystemId: string) => {
    const targetSystem = systems.find(sys => sys._id === targetSystemId);
    if (!targetSystem) return 0;

    // Simple distance-based fuel calculation
    const currentSystem = systems.find(sys => sys._id === ship.location);
    if (!currentSystem) return 0;

    const distance = Math.sqrt(
      Math.pow(targetSystem.x - currentSystem.x, 2) +
      Math.pow(targetSystem.y - currentSystem.y, 2)
    );

    return Math.ceil(distance / 10); // 1 fuel per 10 units distance
  };

  const fuelCost = calculateFuelCost(selectedSystem);
  const canAfford = ship.fuel >= fuelCost;

  const handleMove = () => {
    if (selectedSystem && canAfford) {
      onMoveOrder(ship._id, selectedSystem);
    }
  };

  const handleConfirm = () => {
    setShowConfirm(true);
  };

  return (
    <div className="ship-movement">
      <div className="movement-header">
        <h4>Move {ship.name}</h4>
        <button className="btn btn-secondary btn-small" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <div className="current-location">
        <p><strong>Current Location:</strong> {systems.find(s => s._id === ship.location)?.name || ship.location}</p>
        <p><strong>Fuel:</strong> {ship.fuel}/{ship.maxFuel}</p>
      </div>

      <div className="movement-form">
        <div className="form-group">
          <label htmlFor="target-system">Target System:</label>
          <select
            id="target-system"
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
          >
            <option value="">Select a system...</option>
            {availableSystems.map(system => (
              <option key={system._id} value={system._id}>
                {system.name} (Distance: ~{Math.ceil(Math.sqrt(
                  Math.pow(system.x - (systems.find(s => s._id === ship.location)?.x || 0), 2) +
                  Math.pow(system.y - (systems.find(s => s._id === ship.location)?.y || 0), 2)
                ))} units)
              </option>
            ))}
          </select>
        </div>

        {selectedSystem && (
          <div className="movement-cost">
            <div className="cost-item">
              <span>Fuel Cost:</span>
              <span className={canAfford ? 'cost-affordable' : 'cost-expensive'}>
                {fuelCost}
              </span>
            </div>
            <div className="cost-item">
              <span>Turns to Arrive:</span>
              <span>1</span>
            </div>
          </div>
        )}

        <div className="movement-actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!selectedSystem || !canAfford}
          >
            Move Ship
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="confirm-dialog">
          <div className="confirm-content">
            <h5>Confirm Movement</h5>
            <p>
              Move {ship.name} to {systems.find(s => s._id === selectedSystem)?.name}?
            </p>
            <p>This will cost {fuelCost} fuel and take 1 turn.</p>
            <div className="confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirm(false)}
              >
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleMove}
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipMovement;