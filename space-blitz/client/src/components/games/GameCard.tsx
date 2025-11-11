import { Link } from 'react-router-dom'
import './GameCard.css'

export interface Game {
  _id: string
  name: string
  seriesId: string
  seriesName: string
  status: 'waiting' | 'active' | 'completed'
  currentPlayers: number
  maxPlayers: number
  createdAt: string
  lastUpdate?: string
}

interface GameCardProps {
  game: Game
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const getStatusColor = (status: Game['status']) => {
    switch (status) {
      case 'waiting': return '#ff9800'
      case 'active': return '#4caf50'
      case 'completed': return '#9e9e9e'
      default: return '#666'
    }
  }

  const getStatusText = (status: Game['status']) => {
    switch (status) {
      case 'waiting': return 'Waiting for Players'
      case 'active': return 'In Progress'
      case 'completed': return 'Completed'
      default: return status
    }
  }

  return (
    <div className="game-card">
      <div className="game-header">
        <h3 className="game-name">{game.name}</h3>
        <span
          className="game-status"
          style={{ backgroundColor: getStatusColor(game.status) }}
        >
          {getStatusText(game.status)}
        </span>
      </div>

      <div className="game-info">
        <p className="game-series">Series: {game.seriesName}</p>
        <p className="game-players">
          Players: {game.currentPlayers}/{game.maxPlayers}
        </p>
        <p className="game-created">
          Created: {new Date(game.createdAt).toLocaleDateString()}
        </p>
        {game.lastUpdate && (
          <p className="game-updated">
            Last Update: {new Date(game.lastUpdate).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="game-actions">
        <Link to={`/games/${game._id}`} className="btn btn-primary">
          View Details
        </Link>
        {game.status === 'waiting' && game.currentPlayers < game.maxPlayers && (
          <button className="btn btn-secondary">Join Game</button>
        )}
      </div>
    </div>
  )
}

export default GameCard