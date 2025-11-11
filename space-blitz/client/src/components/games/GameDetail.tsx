import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import GameBoard, { System, Connection } from './GameBoard'
import { FleetList } from '../ships'
import { Ship } from '../../types/game'
import './GameDetail.css'

const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>()
  const [game, setGame] = useState<any>(null)
  const [systems, setSystems] = useState<System[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [ships, setShips] = useState<Ship[]>([])
  const [selectedSystem, setSelectedSystem] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (gameId) {
      fetchGameData(gameId)
    }
  }, [gameId])

  const fetchGameData = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual API calls
      // const gameResponse = await fetch(`/api/games/${id}`)
      // const gameData = await gameResponse.json()
      // const systemsResponse = await fetch(`/api/games/${id}/systems`)
      // const systemsData = await systemsResponse.json()

      // Mock data for now
      const mockGame = {
        _id: id,
        name: 'Sample Game',
        status: 'active',
        currentPlayers: 3,
        maxPlayers: 4,
      }

      const mockSystems: System[] = [
        { _id: 'sys1', name: 'Alpha Centauri', x: 100, y: 100, owner: 'Player1', population: 5, mineral: 3, fuel: 4, agriculture: 2 },
        { _id: 'sys2', name: 'Sirius', x: 300, y: 150, owner: 'Player2', population: 3, mineral: 4, fuel: 2, agriculture: 3 },
        { _id: 'sys3', name: 'Vega', x: 500, y: 200, population: 0, mineral: 2, fuel: 3, agriculture: 1 },
        { _id: 'sys4', name: 'Betelgeuse', x: 200, y: 300, owner: 'Player1', population: 2, mineral: 1, fuel: 4, agriculture: 2 },
        { _id: 'sys5', name: 'Rigel', x: 400, y: 350, population: 0, mineral: 3, fuel: 1, agriculture: 3 },
        { _id: 'sys6', name: 'Polaris', x: 600, y: 100, owner: 'Player2', population: 4, mineral: 2, fuel: 3, agriculture: 1 },
      ]

      const mockConnections: Connection[] = [
        { from: 'sys1', to: 'sys2' },
        { from: 'sys2', to: 'sys3' },
        { from: 'sys1', to: 'sys4' },
        { from: 'sys4', to: 'sys5' },
        { from: 'sys3', to: 'sys6' },
        { from: 'sys2', to: 'sys5' },
      ]

      const mockShips: Ship[] = [
        {
          _id: 'ship1',
          name: 'USS Enterprise',
          type: 'military',
          location: 'sys1',
          orders: 'hold',
          fuel: 8,
          maxFuel: 10,
          br: 5,
          owner: 'Player1'
        },
        {
          _id: 'ship2',
          name: 'USS Voyager',
          type: 'military',
          location: 'sys4',
          orders: 'move',
          orderArguments: 'sys2',
          fuel: 6,
          maxFuel: 10,
          br: 4,
          owner: 'Player1'
        },
        {
          _id: 'ship3',
          name: 'Colony Ship Alpha',
          type: 'civilian',
          location: 'sys1',
          orders: 'colonize',
          orderArguments: 'sys3',
          fuel: 9,
          maxFuel: 10,
          br: 1,
          owner: 'Player1'
        },
        {
          _id: 'ship4',
          name: 'Mining Vessel 1',
          type: 'civilian',
          location: 'sys2',
          orders: 'hold',
          fuel: 7,
          maxFuel: 8,
          br: 0,
          owner: 'Player2'
        }
      ]

      setGame(mockGame)
      setSystems(mockSystems)
      setConnections(mockConnections)
      setShips(mockShips)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game data')
    } finally {
      setLoading(false)
    }
  }

  const handleSystemClick = (systemId: string) => {
    setSelectedSystem(selectedSystem === systemId ? '' : systemId)
  }

  const handleShipOrderChange = (shipId: string, orders: string, orderArguments?: string) => {
    setShips(prevShips =>
      prevShips.map(ship =>
        ship._id === shipId
          ? { ...ship, orders, orderArguments: orderArguments || '' }
          : ship
      )
    )
    // TODO: Send order change to server
    console.log(`Ship ${shipId} order changed to ${orders}${orderArguments ? ` (${orderArguments})` : ''}`)
  }

  if (loading) {
    return <div className="loading">Loading game...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  if (!game) {
    return <div className="error">Game not found</div>
  }

  return (
    <div className="game-detail">
      <div className="game-header">
        <h1>{game.name}</h1>
        <div className="game-info">
          <span className={`status ${game.status}`}>{game.status}</span>
          <span>{game.currentPlayers}/{game.maxPlayers} players</span>
        </div>
      </div>

      <div className="game-content">
        <div className="game-sidebar">
          <div className="game-actions">
            <h3>Actions</h3>
            <button className="btn btn-primary">End Turn</button>
            <button className="btn btn-secondary">View Messages</button>
            <button className="btn btn-secondary">Diplomacy</button>
          </div>

          <div className="game-players">
            <h3>Players</h3>
            <div className="player-list">
              {/* TODO: Add player list */}
              <p>Player list will be displayed here</p>
            </div>
          </div>

          <div className="game-ships">
            <FleetList
              ships={ships}
              onShipOrderChange={handleShipOrderChange}
              availableSystems={systems.map(s => s.name)}
            />
          </div>
        </div>

        <div className="game-board-section">
          <GameBoard
            systems={systems}
            connections={connections}
            selectedSystem={selectedSystem}
            onSystemClick={handleSystemClick}
            width={700}
            height={500}
          />
        </div>
      </div>
    </div>
  )
}

export default GameDetail