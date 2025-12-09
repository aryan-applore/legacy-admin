import { useState } from 'react'
import { useApiFetch } from '../../lib/apiHelpers'
import './Login.css'

// API Base URL


function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { fetchData } = useApiFetch()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await fetchData('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password
        })
      })

      if (data.success && data.data.token) {
        // Allow admin, buyer, broker, and supplier roles
        const allowedRoles = ['admin', 'buyer', 'broker', 'supplier']
        if (data.data.account && allowedRoles.includes(data.data.account.role)) {
          // Store token in localStorage
          localStorage.setItem('adminToken', data.data.token)
          localStorage.setItem('adminUser', JSON.stringify(data.data.account))
          
          // Call onLogin callback
          if (onLogin) {
            onLogin(data.data.token, data.data.account)
          }
        } else {
          setError('Access denied. Invalid account type.')
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

