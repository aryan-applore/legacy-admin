import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading, user } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      window.location.href = '/'
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
      // Redirect to dashboard on successful login
      window.location.href = '/'
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to connect to server. Please check if the backend is running.')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Legacy Admin Panel</h1>
          <p>Sign in to access the admin dashboard</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p className="help-text">
            Default credentials: aryan.garg@applore.in / password123
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

