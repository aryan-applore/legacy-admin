import { useState } from 'react'
import './Login.css'

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password
        })
      })

      const data = await response.json()

      if (data.success && data.token) {
        // Check if user has admin role
        if (data.user && data.user.role === 'admin') {
          // Store token in localStorage
          localStorage.setItem('adminToken', data.token)
          localStorage.setItem('adminUser', JSON.stringify(data.user))
          
          // Call onLogin callback
          if (onLogin) {
            onLogin(data.token, data.user)
          }
        } else {
          setError('Access denied. Admin role required.')
          setLoading(false)
        }
      } else {
        setError(data.error || 'Invalid email or password')
        setLoading(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Failed to connect to server. Please check if the backend is running.')
      setLoading(false)
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

