import { useState } from 'react'
import './AppApiTest.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api'

function AppApiTest() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '')
  const [loading, setLoading] = useState({})
  const [responses, setResponses] = useState({})

  const setLoadingState = (key, value) => {
    setLoading(prev => ({ ...prev, [key]: value }))
  }

  const setResponse = (key, data) => {
    setResponses(prev => ({ ...prev, [key]: data }))
  }

  // Login
  const handleLogin = async () => {
    setLoadingState('login', true)
    setResponse('login', null)

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
      setResponse('login', {
        status: response.status,
        statusText: response.statusText,
        data: data
      })

      if (data.success && data.token) {
        setToken(data.token)
        localStorage.setItem('adminToken', data.token)
        if (data.user) {
          localStorage.setItem('adminUser', JSON.stringify(data.user))
        }
      }
    } catch (error) {
      setResponse('login', {
        error: error.message
      })
    } finally {
      setLoadingState('login', false)
    }
  }

  // Test Buyer Dashboard
  const testBuyerDashboard = async () => {
    if (!token) {
      setResponse('dashboard', { error: 'Please login first to get a token' })
      return
    }

    setLoadingState('dashboard', true)
    setResponse('dashboard', null)

    try {
      const response = await fetch(`${API_BASE_URL}/app/buyer-dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      setResponse('dashboard', {
        status: response.status,
        statusText: response.statusText,
        data: data
      })
    } catch (error) {
      setResponse('dashboard', {
        error: error.message
      })
    } finally {
      setLoadingState('dashboard', false)
    }
  }

  // Test Clients (GET)
  const testClients = async () => {
    if (!token) {
      setResponse('clients', { error: 'Please login first to get a token' })
      return
    }

    setLoadingState('clients', true)
    setResponse('clients', null)

    try {
      const response = await fetch(`${API_BASE_URL}/app/clients`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      setResponse('clients', {
        status: response.status,
        statusText: response.statusText,
        data: data
      })
    } catch (error) {
      setResponse('clients', {
        error: error.message
      })
    } finally {
      setLoadingState('clients', false)
    }
  }

  // Test Broker Dashboard
  const testBrokerDashboard = async () => {
    if (!token) {
      setResponse('brokerDashboard', { error: 'Please login first to get a token' })
      return
    }

    setLoadingState('brokerDashboard', true)
    setResponse('brokerDashboard', null)

    try {
      const response = await fetch(`${API_BASE_URL}/app/broker-dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      setResponse('brokerDashboard', {
        status: response.status,
        statusText: response.statusText,
        data: data
      })
    } catch (error) {
      setResponse('brokerDashboard', {
        error: error.message
      })
    } finally {
      setLoadingState('brokerDashboard', false)
    }
  }

  // Test Properties
  const testProperties = async () => {
    if (!token) {
      setResponse('properties', { error: 'Please login first to get a token' })
      return
    }

    setLoadingState('properties', true)
    setResponse('properties', null)

    try {
      const response = await fetch(`${API_BASE_URL}/app/properties`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      setResponse('properties', {
        status: response.status,
        statusText: response.statusText,
        data: data
      })
    } catch (error) {
      setResponse('properties', {
        error: error.message
      })
    } finally {
      setLoadingState('properties', false)
    }
  }

  // Test Documents
  const testDocuments = async () => {
    if (!token) {
      setResponse('documents', { error: 'Please login first to get a token' })
      return
    }

    setLoadingState('documents', true)
    setResponse('documents', null)

    try {
      const response = await fetch(`${API_BASE_URL}/app/documents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      setResponse('documents', {
        status: response.status,
        statusText: response.statusText,
        data: data
      })
    } catch (error) {
      setResponse('documents', {
        error: error.message
      })
    } finally {
      setLoadingState('documents', false)
    }
  }

  const renderJsonResponse = (response) => {
    if (!response) return null

    return (
      <div className="json-response">
        <pre>{JSON.stringify(response, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div className="app-api-test">
      <h1 className="page-title">App API Tester</h1>

      {/* Login Section */}
      <div className="test-section">
        <h2>1. Login</h2>
        <div className="test-controls">
          <div className="input-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>
          <div className="input-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading.login}
            className="test-button"
          >
            {loading.login ? 'Logging in...' : 'Login'}
          </button>
        </div>
        {token && (
          <div className="token-display">
            <strong>Token:</strong> <span className="token-value">{token.substring(0, 50)}...</span>
          </div>
        )}
        {renderJsonResponse(responses.login)}
      </div>

      {/* Dashboard Section */}
      <div className="test-section">
        <h2>2. Buyer Dashboard</h2>
        <div className="test-controls">
          <button
            onClick={testBuyerDashboard}
            disabled={loading.dashboard || !token}
            className="test-button"
          >
            {loading.dashboard ? 'Loading...' : 'GET /api/app/buyer-dashboard'}
          </button>
        </div>
        {renderJsonResponse(responses.dashboard)}
      </div>

      {/* Broker Dashboard Section */}
      <div className="test-section">
        <h2>3. Broker Dashboard</h2>
        <div className="test-controls">
          <button
            onClick={testBrokerDashboard}
            disabled={loading.brokerDashboard || !token}
            className="test-button"
          >
            {loading.brokerDashboard ? 'Loading...' : 'GET /api/app/broker-dashboard'}
          </button>
        </div>
        {renderJsonResponse(responses.brokerDashboard)}
      </div>

      {/* Clients Section */}
      <div className="test-section">
        <h2>4. Clients</h2>
        <div className="test-controls">
          <button
            onClick={testClients}
            disabled={loading.clients || !token}
            className="test-button"
          >
            {loading.clients ? 'Loading...' : 'GET /api/app/clients'}
          </button>
        </div>
        {renderJsonResponse(responses.clients)}
      </div>

      {/* Properties Section */}
      <div className="test-section">
        <h2>5. Properties</h2>
        <div className="test-controls">
          <button
            onClick={testProperties}
            disabled={loading.properties || !token}
            className="test-button"
          >
            {loading.properties ? 'Loading...' : 'GET /api/app/properties'}
          </button>
        </div>
        {renderJsonResponse(responses.properties)}
      </div>

      {/* Documents Section */}
      <div className="test-section">
        <h2>6. Documents</h2>
        <div className="test-controls">
          <button
            onClick={testDocuments}
            disabled={loading.documents || !token}
            className="test-button"
          >
            {loading.documents ? 'Loading...' : 'GET /api/app/documents'}
          </button>
        </div>
        {renderJsonResponse(responses.documents)}
      </div>
    </div>
  )
}

export default AppApiTest

