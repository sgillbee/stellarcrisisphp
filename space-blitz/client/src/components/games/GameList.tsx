import { useState, useEffect } from 'react'
import GameCard, { Game } from './GameCard'
import './GameList.css'

interface GameListProps {
  filter?: 'all' | 'waiting' | 'active' | 'completed'
}

const GameList: React.FC<GameListProps> = ({ filter = 'all' }) => {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGames()
  }, [filter])

  const fetchGames = async () => {
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/games')
      // const data = await response.json()

      // Mock data for now
      const mockGames: Game[] = [
        {
          _id: 'game1',
          name: 'Galactic Conquest',
          seriesId: 'series1',
          seriesName: 'Beginner Series',
          status: 'waiting',
          currentPlayers: 2,
          maxPlayers: 4,
          createdAt: '2025-11-10T10:00:00Z',
        },
        {
          _id: 'game2',
          name: 'Star Empire Wars',
          seriesId: 'series1',
          seriesName: 'Beginner Series',
          status: 'active',
          currentPlayers: 4,
          maxPlayers: 4,
          createdAt: '2025-11-09T15:30:00Z',
          lastUpdate: '2025-11-11T08:45:00Z',
        },
        {
          _id: 'game3',
          name: 'Cosmic Dominion',
          seriesId: 'series2',
          seriesName: 'Advanced Series',
          status: 'completed',
          currentPlayers: 3,
          maxPlayers: 3,
          createdAt: '2025-11-08T12:00:00Z',
          lastUpdate: '2025-11-10T16:20:00Z',
        },
      ]

      // Filter games based on the filter prop
      const filteredGames = filter === 'all'
        ? mockGames
        : mockGames.filter(game => game.status === filter)

      setGames(filteredGames)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading games...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  if (games.length === 0) {
    return (
      <div className="no-games">
        <p>No games found.</p>
        {filter !== 'all' && (
          <p>Try changing the filter or create a new game.</p>
        )}
      </div>
    )
  }

  return (
    <div className="game-list">
      {games.map(game => (
        <GameCard key={game._id} game={game} />
      ))}
    </div>
  )
}

export default GameList