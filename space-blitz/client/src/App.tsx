import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WebSocketProvider } from './contexts/WebSocketContext'
import Layout from './components/Layout'
import Auth from './components/Auth'
import GameList from './components/games/GameList'
import GameDetail from './components/games/GameDetail'
import CreateGameForm from './components/games/CreateGameForm'
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

const Tournaments = () => (
  <div>
    <h1>Tournaments</h1>
    <p>Tournament management</p>
    <p>View ongoing tournaments, join competitions, or create new tournament series.</p>
  </div>
)

const Admin = () => (
  <div>
    <h1>Admin</h1>
    <p>Administrative tools</p>
    <p>Manage game series, users, and system settings.</p>
  </div>
)

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