import { useRef, useEffect, useState } from 'react'
import './GameBoard.css'

export interface System {
  _id: string
  name: string
  x: number
  y: number
  owner?: string
  population: number
  mineral: number
  fuel: number
  agriculture: number
}

export interface Connection {
  from: string
  to: string
}

interface GameBoardProps {
  systems: System[]
  connections: Connection[]
  selectedSystem?: string
  onSystemClick?: (systemId: string) => void
  width?: number
  height?: number
}

const GameBoard: React.FC<GameBoardProps> = ({
  systems,
  connections,
  selectedSystem,
  onSystemClick,
  width = 800,
  height = 600
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null)

  useEffect(() => {
    drawBoard()
  }, [systems, connections, selectedSystem, hoveredSystem])

  const drawBoard = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Draw connections first (behind systems)
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 1
    connections.forEach(connection => {
      const fromSystem = systems.find(s => s._id === connection.from)
      const toSystem = systems.find(s => s._id === connection.to)

      if (fromSystem && toSystem) {
        ctx.beginPath()
        ctx.moveTo(fromSystem.x, fromSystem.y)
        ctx.lineTo(toSystem.x, toSystem.y)
        ctx.stroke()
      }
    })

    // Draw systems
    systems.forEach(system => {
      const isSelected = selectedSystem === system._id
      const isHovered = hoveredSystem === system._id

      // Draw system circle
      ctx.beginPath()
      ctx.arc(system.x, system.y, 15, 0, 2 * Math.PI)

      // Set fill color based on owner and state
      if (isSelected) {
        ctx.fillStyle = '#646cff'
      } else if (isHovered) {
        ctx.fillStyle = '#535bf2'
      } else if (system.owner) {
        ctx.fillStyle = '#4caf50' // Has owner
      } else {
        ctx.fillStyle = '#9e9e9e' // Neutral
      }

      ctx.fill()

      // Draw border
      ctx.strokeStyle = isSelected || isHovered ? '#ffffff' : '#333'
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.stroke()

      // Draw system name
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(system.name, system.x, system.y + 25)

      // Draw population indicator
      if (system.population > 0) {
        ctx.fillStyle = '#ff9800'
        ctx.beginPath()
        ctx.arc(system.x + 12, system.y - 12, 4, 0, 2 * Math.PI)
        ctx.fill()
      }
    })
  }

  const getSystemAtPosition = (x: number, y: number): string | null => {
    for (const system of systems) {
      const distance = Math.sqrt((x - system.x) ** 2 + (y - system.y) ** 2)
      if (distance <= 15) {
        return system._id
      }
    }
    return null
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const systemId = getSystemAtPosition(x, y)
    if (systemId && onSystemClick) {
      onSystemClick(systemId)
    }
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const systemId = getSystemAtPosition(x, y)
    setHoveredSystem(systemId)
  }

  const handleMouseLeave = () => {
    setHoveredSystem(null)
  }

  return (
    <div className="game-board-container">
      <canvas
        ref={canvasRef}
        className="game-board-canvas"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: hoveredSystem ? 'pointer' : 'default' }}
      />

      <div className="board-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#9e9e9e' }}></div>
          <span>Neutral System</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#4caf50' }}></div>
          <span>Owned System</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#646cff' }}></div>
          <span>Selected System</span>
        </div>
        <div className="legend-item">
          <div className="legend-indicator"></div>
          <span>Population</span>
        </div>
      </div>

      {selectedSystem && (
        <SystemDetails
          system={systems.find(s => s._id === selectedSystem)!}
          onClose={() => onSystemClick?.('')}
        />
      )}
    </div>
  )
}

interface SystemDetailsProps {
  system: System
  onClose: () => void
}

const SystemDetails: React.FC<SystemDetailsProps> = ({ system, onClose }) => {
  return (
    <div className="system-details">
      <div className="system-details-header">
        <h3>{system.name}</h3>
        <button onClick={onClose} className="close-btn">&times;</button>
      </div>

      <div className="system-stats">
        <div className="stat">
          <label>Population:</label>
          <span>{system.population}</span>
        </div>
        <div className="stat">
          <label>Mineral:</label>
          <span>{system.mineral}</span>
        </div>
        <div className="stat">
          <label>Fuel:</label>
          <span>{system.fuel}</span>
        </div>
        <div className="stat">
          <label>Agriculture:</label>
          <span>{system.agriculture}</span>
        </div>
        {system.owner && (
          <div className="stat">
            <label>Owner:</label>
            <span>{system.owner}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default GameBoard