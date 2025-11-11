import { useState } from 'react'
import { Ship } from '../../types/game'
import './ShipCard.css'

interface ShipCardProps {
  ship: Ship
  onOrderChange?: (shipId: string, orders: string, orderArguments?: string) => void
  availableSystems?: string[]
}

const ShipCard: React.FC<ShipCardProps> = ({ ship, onOrderChange, availableSystems = [] }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(ship.orders)
  const [orderArguments, setOrderArguments] = useState(ship.orderArguments || '')

  const orderOptions = [
    { value: 'hold', label: 'Hold Position' },
    { value: 'move', label: 'Move to System' },
    { value: 'colonize', label: 'Colonize System' },
    { value: 'build', label: 'Build Ships' },
  ]

  const handleSaveOrder = () => {
    if (onOrderChange) {
      onOrderChange(ship._id, selectedOrder, orderArguments)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setSelectedOrder(ship.orders)
    setOrderArguments(ship.orderArguments || '')
    setIsEditing(false)
  }

  const getFuelPercentage = () => {
    return (ship.fuel / ship.maxFuel) * 100
  }

  const getFuelColor = () => {
    const percentage = getFuelPercentage()
    if (percentage > 50) return '#4caf50'
    if (percentage > 25) return '#ff9800'
    return '#f44336'
  }

  return (
    <div className="ship-card">
      <div className="ship-header">
        <h4 className="ship-name">{ship.name}</h4>
        <span className="ship-type">{ship.type}</span>
      </div>

      <div className="ship-stats">
        <div className="stat">
          <label>Location:</label>
          <span>{ship.location}</span>
        </div>
        <div className="stat">
          <label>Battle Rating:</label>
          <span>{ship.br}</span>
        </div>
        <div className="stat">
          <label>Fuel:</label>
          <div className="fuel-bar">
            <div
              className="fuel-fill"
              style={{
                width: `${getFuelPercentage()}%`,
                backgroundColor: getFuelColor()
              }}
            />
            <span className="fuel-text">{ship.fuel}/{ship.maxFuel}</span>
          </div>
        </div>
      </div>

      <div className="ship-orders">
        {!isEditing ? (
          <div className="current-order">
            <span className="order-label">Current Order:</span>
            <span className="order-value">
              {orderOptions.find(o => o.value === ship.orders)?.label || ship.orders}
              {ship.orderArguments && ` → ${ship.orderArguments}`}
            </span>
            {onOrderChange && (
              <button
                className="btn btn-small btn-secondary"
                onClick={() => setIsEditing(true)}
              >
                Change
              </button>
            )}
          </div>
        ) : (
          <div className="order-editor">
            <div className="form-group">
              <label>Order:</label>
              <select
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value)}
              >
                {orderOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {(selectedOrder === 'move' || selectedOrder === 'colonize') && (
              <div className="form-group">
                <label>Target System:</label>
                <select
                  value={orderArguments}
                  onChange={(e) => setOrderArguments(e.target.value)}
                >
                  <option value="">Select system...</option>
                  {availableSystems.map(system => (
                    <option key={system} value={system}>
                      {system}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="order-actions">
              <button className="btn btn-small btn-primary" onClick={handleSaveOrder}>
                Save
              </button>
              <button className="btn btn-small btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShipCard