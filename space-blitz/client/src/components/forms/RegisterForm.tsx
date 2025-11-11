import { useState } from 'react'
import './AuthForms.css'

interface RegisterFormProps {
  onRegister: (email: string, password: string, confirmPassword: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, isLoading, error }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password && confirmPassword && password === confirmPassword) {
      await onRegister(email, password, confirmPassword)
    }
  }

  const passwordsMatch = password === confirmPassword

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Register for Space Blitz</h2>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="register-email">Email</label>
          <input
            type="email"
            id="register-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="register-password">Password</label>
          <input
            type="password"
            id="register-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            className={!passwordsMatch && confirmPassword ? 'error' : ''}
          />
          {!passwordsMatch && confirmPassword && (
            <span className="field-error">Passwords do not match</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !email || !password || !confirmPassword || !passwordsMatch}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  )
}

export default RegisterForm