import { useState } from 'react'
import LoginForm from './forms/LoginForm'
import RegisterForm from './forms/RegisterForm'
import './Auth.css'

const Auth = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implement actual login API call
      console.log('Logging in with:', email, password)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // For now, just show success
      alert('Login successful! (This is a placeholder)')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (email: string, password: string, confirmPassword: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // TODO: Implement actual register API call
      console.log('Registering with:', email, password, confirmPassword)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // For now, just show success
      alert('Registration successful! (This is a placeholder)')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-tabs">
        <button
          className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => setActiveTab('login')}
        >
          Login
        </button>
        <button
          className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          Register
        </button>
      </div>

      {activeTab === 'login' ? (
        <LoginForm onLogin={handleLogin} isLoading={isLoading} error={error} />
      ) : (
        <RegisterForm onRegister={handleRegister} isLoading={isLoading} error={error} />
      )}
    </div>
  )
}

export default Auth