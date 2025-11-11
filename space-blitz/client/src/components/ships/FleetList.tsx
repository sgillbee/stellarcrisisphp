import React, { useState, useEffect } from 'react';
import { Ship } from '../../types/game';
import ShipCard from './ShipCard';
import './FleetList.css';

interface FleetListProps {
  ships: Ship[];
  onShipOrderChange: (shipId: string, orders: string, orderArguments?: string) => void;
  availableSystems?: string[];
  isEditable?: boolean;
}

const FleetList: React.FC<FleetListProps> = ({
  ships,
  onShipOrderChange,
  availableSystems = [],
  isEditable = true
}) => {
  const [filter, setFilter] = useState<'all' | 'military' | 'civilian'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'fuel'>('name');

  const filteredShips = ships.filter(ship => {
    if (filter === 'all') return true;
    return ship.type === filter;
  });

  const sortedShips = [...filteredShips].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'type':
        return a.type.localeCompare(b.type);
      case 'fuel':
        return b.fuel - a.fuel;
      default:
        return 0;
    }
  });

  const militaryShips = ships.filter(ship => ship.type === 'military');
  const civilianShips = ships.filter(ship => ship.type === 'civilian');

  return (
    <div className="fleet-list">
      <div className="fleet-header">
        <h3>Fleet Overview</h3>
        <div className="fleet-stats">
          <span className="stat-item">
            Total Ships: {ships.length}
          </span>
          <span className="stat-item">
            Military: {militaryShips.length}
          </span>
          <span className="stat-item">
            Civilian: {civilianShips.length}
          </span>
        </div>
      </div>

      <div className="fleet-controls">
        <div className="filter-controls">
          <label>
            Filter:
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
            >
              <option value="all">All Ships</option>
              <option value="military">Military Only</option>
              <option value="civilian">Civilian Only</option>
            </select>
          </label>
        </div>

        <div className="sort-controls">
          <label>
            Sort by:
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="name">Name</option>
              <option value="type">Type</option>
              <option value="fuel">Fuel Level</option>
            </select>
          </label>
        </div>
      </div>

      <div className="ships-grid">
        {sortedShips.length === 0 ? (
          <div className="no-ships">
            <p>No ships found matching the current filter.</p>
          </div>
        ) : (
          sortedShips.map(ship => (
            <ShipCard
              key={ship._id}
              ship={ship}
              onOrderChange={isEditable ? onShipOrderChange : undefined}
              availableSystems={availableSystems}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FleetList;