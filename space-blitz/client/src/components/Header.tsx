import { Link } from 'react-router-dom'
import { useWebSocketContext } from '../contexts/WebSocketContext'
import './Header.css'

const Header = () => {
  const { isConnected, error } = useWebSocketContext()

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">
          <Link to="/">Space Blitz</Link>
        </h1>
        <nav className="main-nav">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/auth">Login</Link></li>
            <li><Link to="/games">Games</Link></li>
            <li><Link to="/tournaments">Tournaments</Link></li>
            <li><Link to="/admin">Admin</Link></li>
          </ul>
        </nav>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢' : '🔴'}
          </span>
          <span className="status-text">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {error && <span className="error-text">({error})</span>}
        </div>
      </div>
    </header>
  )
}

export default Header