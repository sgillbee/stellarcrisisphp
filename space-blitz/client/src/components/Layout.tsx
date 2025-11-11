import { ReactNode } from 'react'
import Header from './Header'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2025 Space Blitz. A modern web-based strategy game.</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout