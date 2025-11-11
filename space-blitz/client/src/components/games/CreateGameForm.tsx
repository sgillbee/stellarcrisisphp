import { useState, useEffect } from 'react'
import './CreateGameForm.css'

interface Series {
  _id: string
  name: string
  description: string
  maxPlayers: number
}

interface CreateGameFormProps {
  onGameCreated: (game: any) => void
  onCancel: () => void
}

const CreateGameForm: React.FC<CreateGameFormProps> = ({ onGameCreated, onCancel }) => {
  const [name, setName] = useState('')
  const [selectedSeries, setSelectedSeries] = useState('')
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSeries()
  }, [])

  const fetchSeries = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/series')
      // const data = await response.json()

      // Mock data for now
      const mockSeries: Series[] = [
        {
          _id: 'series1',
          name: 'Beginner Series',
          description: 'Perfect for new players learning the game',
          maxPlayers: 4,
        },
        {
          _id: 'series2',
          name: 'Advanced Series',
          description: 'For experienced players seeking a challenge',
          maxPlayers: 6,
        },
        {
          _id: 'series3',
          name: 'Tournament Series',
          description: 'Official tournament games with special rules',
          maxPlayers: 8,
        },
      ]

      setSeries(mockSeries)
    } catch (err) {
      setError('Failed to load game series')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !selectedSeries) return

    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/games', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name: name.trim(), seriesId: selectedSeries })
      // })
      // const newGame = await response.json()

      // Mock response for now
      const selectedSeriesData = series.find(s => s._id === selectedSeries)
      const newGame = {
        _id: `game_${Date.now()}`,
        name: name.trim(),
        seriesId: selectedSeries,
        seriesName: selectedSeriesData?.name || 'Unknown Series',
        status: 'waiting',
        currentPlayers: 1,
        maxPlayers: selectedSeriesData?.maxPlayers || 4,
        createdAt: new Date().toISOString(),
      }

      onGameCreated(newGame)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game')
    } finally {
      setLoading(false)
    }
  }

  const selectedSeriesData = series.find(s => s._id === selectedSeries)

  return (
    <div className="create-game-form-container">
      <form className="create-game-form" onSubmit={handleSubmit}>
        <h3>Create New Game</h3>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="game-name">Game Name</label>
          <input
            type="text"
            id="game-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name for your game"
            required
            disabled={loading}
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label htmlFor="game-series">Game Series</label>
          <select
            id="game-series"
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">Select a series...</option>
            {series.map(seriesItem => (
              <option key={seriesItem._id} value={seriesItem._id}>
                {seriesItem.name} (Max {seriesItem.maxPlayers} players)
              </option>
            ))}
          </select>
        </div>

        {selectedSeriesData && (
          <div className="series-info">
            <h4>{selectedSeriesData.name}</h4>
            <p>{selectedSeriesData.description}</p>
            <p><strong>Max Players:</strong> {selectedSeriesData.maxPlayers}</p>
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading || !name.trim() || !selectedSeries}>
            {loading ? 'Creating...' : 'Create Game'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateGameForm