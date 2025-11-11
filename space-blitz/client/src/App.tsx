import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WebSocketProvider } from './contexts/WebSocketContext'
import Layout from './components/Layout'
import Auth from './components/Auth'
import GameList from './components/games/GameList'
import GameDetail from './components/games/GameDetail'
import CreateGameForm from './components/games/CreateGameForm'
import { TournamentList, TournamentCreateForm, TournamentBracket } from './components/tournaments'
import { SeriesAdmin, UserAdmin } from './components/admin'
import './App.css'

// Placeholder components - will be implemented in subsequent tasks
const Home = () => (
  <div>
    <h1>Space Blitz</h1>
    <p>Welcome to the modern web-based strategy game</p>
    <p>Navigate using the menu above to explore games, tournaments, and administration.</p>
  </div>
)

const Games = () => {
  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleGameCreated = (newGame: any) => {
    console.log('Game created:', newGame)
    setShowCreateForm(false)
    // TODO: Refresh game list or navigate to game detail
  }

  return (
    <div>
      <div className="page-header">
        <h1>Games</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Create New Game
        </button>
      </div>

      {showCreateForm ? (
        <CreateGameForm
          onGameCreated={handleGameCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : (
        <GameList />
      )}
    </div>
  )
}

const Tournaments = () => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null)

  const handleTournamentCreated = (tournament: any) => {
    console.log('Tournament created:', tournament)
    setShowCreateForm(false)
    // TODO: Refresh tournament list
  }

  const handleTournamentSelect = (tournamentId: string) => {
    setSelectedTournament(tournamentId)
  }

  if (selectedTournament) {
    return (
      <div>
        <button
          className="btn btn-secondary"
          onClick={() => setSelectedTournament(null)}
          style={{ marginBottom: '1rem' }}
        >
          ← Back to Tournaments
        </button>
        <TournamentBracket
          tournament={{
            _id: selectedTournament,
            name: 'Sample Tournament',
            series: 'Championship Series',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            maxPlayers: 8,
            currentPlayers: 6,
            prizePool: 500,
            createdAt: new Date(),
            updatedAt: new Date()
          }}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Tournaments</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Create Tournament
        </button>
      </div>

      {showCreateForm ? (
        <TournamentCreateForm
          onTournamentCreated={handleTournamentCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : (
        <TournamentList
          onTournamentSelect={handleTournamentSelect}
          onCreateTournament={() => setShowCreateForm(true)}
        />
      )}
    </div>
  )
}

const Admin = () => {
  const [activeTab, setActiveTab] = useState<'series' | 'users'>('series')

  return (
    <div>
      <div className="page-header">
        <h1>Administration</h1>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'series' ? 'active' : ''}`}
          onClick={() => setActiveTab('series')}
        >
          Series Management
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'series' && <SeriesAdmin />}
        {activeTab === 'users' && <UserAdmin />}
      </div>
    </div>
  )
}

function App() {
  return (
    <WebSocketProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/:gameId" element={<GameDetail />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
      </Router>
    </WebSocketProvider>
  )
}

export default App