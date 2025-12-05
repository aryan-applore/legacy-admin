import { useState } from 'react'
import './SupportApiTest.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api'

function SupportApiTest() {
  // Buyer login
  const [buyerEmail, setBuyerEmail] = useState('buyer@example.com')
  const [buyerPassword, setBuyerPassword] = useState('password123')
  const [buyerToken, setBuyerToken] = useState(localStorage.getItem('buyerToken') || '')

  // Admin login
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || '')

  // Form inputs
  const [ticketId, setTicketId] = useState('')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState('1')
  const [limit, setLimit] = useState('20')
  
  // Create ticket inputs
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketCategory, setTicketCategory] = useState('general')
  const [ticketDescription, setTicketDescription] = useState('')
  const [ticketPropertyId, setTicketPropertyId] = useState('')
  const [ticketPriority, setTicketPriority] = useState('medium')
  
  // Update ticket inputs
  const [updateStatus, setUpdateStatus] = useState('')
  const [updatePriority, setUpdatePriority] = useState('')
  const [updateMessage, setUpdateMessage] = useState('')
  
  // Reply message
  const [replyMessage, setReplyMessage] = useState('')

  const [loading, setLoading] = useState({})
  const [responses, setResponses] = useState({})

  const setLoadingState = (key, value) => {
    setLoading(prev => ({ ...prev, [key]: value }))
  }

  const setResponse = (key, data) => {
    setResponses(prev => ({ ...prev, [key]: data }))
  }

  // Helper function to handle API responses with better error handling
  const handleApiResponse = async (response, responseKey) => {
    let data
    try {
      const text = await response.text()
      if (text) {
        try {
          data = JSON.parse(text)
        } catch (jsonError) {
          data = { 
            error: 'Invalid JSON response', 
            rawResponse: text.substring(0, 200) 
          }
        }
      } else {
        data = { error: 'Empty response from server' }
      }
    } catch (error) {
      data = { error: `Failed to read response: ${error.message}` }
    }

    setResponse(responseKey, {
      status: response.status,
      statusText: response.statusText,
      data: data,
      headers: Object.fromEntries(response.headers.entries())
    })
    
    return data // Return parsed data for use in calling function
  }

  // Buyer Login
  const handleBuyerLogin = async () => {
    setLoadingState('buyerLogin', true)
    setResponse('buyerLogin', null)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: buyerEmail.trim().toLowerCase(),
          password: buyerPassword
        })
      })

      const data = await handleApiResponse(response, 'buyerLogin')
      
      // Extract token if login successful
      if (data && data.success && data.token) {
        setBuyerToken(data.token)
        localStorage.setItem('buyerToken', data.token)
      }
    } catch (error) {
      setResponse('buyerLogin', {
        error: error.message,
        details: 'Network error - Check if backend server is running',
        type: 'NetworkError'
      })
    } finally {
      setLoadingState('buyerLogin', false)
    }
  }

  // Admin Login
  const handleAdminLogin = async () => {
    setLoadingState('adminLogin', true)
    setResponse('adminLogin', null)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: adminEmail.trim().toLowerCase(),
          password: adminPassword
        })
      })

      const data = await handleApiResponse(response, 'adminLogin')
      
      // Extract token if login successful
      if (data && data.success && data.token) {
        setAdminToken(data.token)
        localStorage.setItem('adminToken', data.token)
      }
    } catch (error) {
      setResponse('adminLogin', {
        error: error.message,
        details: 'Network error - Check if backend server is running',
        type: 'NetworkError'
      })
    } finally {
      setLoadingState('adminLogin', false)
    }
  }

  // Buyer APIs
  const testGetSupportContact = async () => {
    if (!buyerToken) {
      setResponse('contact', { error: 'Please login as buyer first' })
      return
    }

    setLoadingState('contact', true)
    setResponse('contact', null)

    try {
      const response = await fetch(`${API_BASE_URL}/app/support/contact`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${buyerToken}`,
          'Content-Type': 'application/json'
        }
      })

      await handleApiResponse(response, 'contact')
    } catch (error) {
      setResponse('contact', {
        error: error.message,
        details: 'Network error - Check if backend server is running and CORS is configured',
        type: 'NetworkError'
      })
    } finally {
      setLoadingState('contact', false)
    }
  }

  const testGetTickets = async () => {
    if (!buyerToken) {
      setResponse('getTickets', { error: 'Please login as buyer first' })
      return
    }

    setLoadingState('getTickets', true)
    setResponse('getTickets', null)

    try {
      const params = new URLSearchParams()
      if (status !== 'all') params.append('status', status)
      if (page) params.append('page', page)
      if (limit) params.append('limit', limit)

      const url = `${API_BASE_URL}/app/support/tickets${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${buyerToken}`,
          'Content-Type': 'application/json'
        }
      })

      await handleApiResponse(response, 'getTickets')
    } catch (error) {
      setResponse('getTickets', {
        error: error.message,
        details: 'Network error - Check if backend server is running',
        type: 'NetworkError'
      })
    } finally {
      setLoadingState('getTickets', false)
    }
  }

  const testCreateTicket = async () => {
    if (!buyerToken) {
      setResponse('createTicket', { error: 'Please login as buyer first' })
      return
    }

    if (!ticketSubject || !ticketDescription) {
      setResponse('createTicket', { error: 'Subject and description are required' })
      return
    }

    setLoadingState('createTicket', true)
    setResponse('createTicket', null)

    try {
      const body = {
        subject: ticketSubject,
        category: ticketCategory,
        description: ticketDescription,
        priority: ticketPriority
      }
      if (ticketPropertyId) body.propertyId = ticketPropertyId

      const response = await fetch(`${API_BASE_URL}/app/support/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${buyerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const data = await handleApiResponse(response, 'createTicket')
      
      // Auto-fill ticket ID if created successfully
      if (data && data.success && data.data?.id) {
        setTicketId(data.data.id)
      }
    } catch (error) {
      setResponse('createTicket', {
        error: error.message,
        details: 'Network error - Check if backend server is running',
        type: 'NetworkError'
      })
    } finally {
      setLoadingState('createTicket', false)
    }
  }

  const testGetTicket = async () => {
    if (!buyerToken) {
      setResponse('getTicket', { error: 'Please login as buyer first' })
      return
    }

    if (!ticketId) {
      setResponse('getTicket', { error: 'Please enter ticket ID' })
      return
    }

    setLoadingState('getTicket', true)
    setResponse('getTicket', null)

    try {
      const response = await fetch(`${API_BASE_URL}/app/support/tickets/${ticketId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${buyerToken}`,
          'Content-Type': 'application/json'
        }
      })

      await handleApiResponse(response, 'getTicket')
    } catch (error) {
      setResponse('getTicket', {
        error: error.message,
        details: 'Network error - Check if backend server is running',
        type: 'NetworkError'
      })
    } finally {
      setLoadingState('getTicket', false)
    }
  }

  const testUpdateTicket = async () => {
    if (!buyerToken) {
      setResponse('updateTicket', { error: 'Please login as buyer first' })
      return
    }

    if (!ticketId) {
      setResponse('updateTicket', { error: 'Please enter ticket ID' })
      return
    }

    setLoadingState('updateTicket', true)
    setResponse('updateTicket', null)

    try {
      const body = {}
      if (updateStatus) body.status = updateStatus
      if (updateMessage) body.message = updateMessage

      const response = await fetch(`${API_BASE_URL}/app/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${buyerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      await handleApiResponse(response, 'updateTicket')
    } catch (error) {
      setResponse('updateTicket', {
        error: error.message,
        details: 'Network error - Check if backend server is running',
        type: 'NetworkError'
      })
    } finally {
      setLoadingState('updateTicket', false)
    }
  }

  // Admin APIs
  const testGetTicketStats = async () => {
    if (!adminToken) {
      setResponse('stats', { error: 'Please login as admin first' })
      return
    }

    setLoadingState('stats', true)
    setResponse('stats', null)

    try {
      const response = await fetch(`${API_BASE_URL}/admin/support/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      })

      await handleApiResponse(response, 'stats')
    } catch (error) {
      setResponse('stats', {
        error: error.message,
        details: 'Network error - Check if backend server is running',
        type: 'NetworkError'
      })
    } finally {
      setLoadingState('stats', false)
    }
  }

  const testGetAllTickets = async () => {
    if (!adminToken) {
      setResponse('getAllTickets', { error: 'Please login as admin first' })
      return
    }

    setLoadingState('getAllTickets', true)
    setResponse('getAllTickets', null)

    try {
      const params = new URLSearchParams()
      if (status !== 'all') params.append('status', status)
      if (priority) params.append('priority', priority)
      if (category) params.append('category', category)
      if (search) params.append('search', search)
      if (page) params.append('page', page)
      if (limit) params.append('limit', limit)

      const url = `${API_BASE_URL}/admin/support/tickets${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      })

      await handleApiResponse(response, 'getAllTickets')
    } catch (error) {
      setResponse('getAllTickets', {
        error: error.message,
        details: 'Network error - Check if backend server is running',
        type: 'NetworkError'
      })
    } finally {
      setLoadingState('getAllTickets', false)
    }
  }

  const testGetTicketById = async () => {
    if (!adminToken) {
      setResponse('getTicketById', { error: 'Please login as admin first' })
      return
    }

    if (!ticketId) {
      setResponse('getTicketById', { error: 'Please enter ticket ID' })
      return
    }

    setLoadingState('getTicketById', true)
    setResponse('getTicketById', null)

    try {
      const response = await fetch(`${API_BASE_URL}/admin/support/tickets/${ticketId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      })

      await handleApiResponse(response, 'getTicketById')
    } catch (error) {
      setResponse('getTicketById', {
        error: error.message,
        details: 'Network error - Check if backend server is running',
        type: 'NetworkError'
      })
    } finally {
      setLoadingState('getTicketById', false)
    }
  }

  const testAdminUpdateTicket = async () => {
    if (!adminToken) {
      setResponse('adminUpdateTicket', { error: 'Please login as admin first' })
      return
    }

    if (!ticketId) {
      setResponse('adminUpdateTicket', { error: 'Please enter ticket ID' })
      return
    }

    setLoadingState('adminUpdateTicket', true)
    setResponse('adminUpdateTicket', null)

    try {
      const body = {}
      if (updateStatus) body.status = updateStatus
      if (updatePriority) body.priority = updatePriority
      if (updateMessage) body.message = updateMessage

      const response = await fetch(`${API_BASE_URL}/admin/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      await handleApiResponse(response, 'adminUpdateTicket')
    } catch (error) {
      setResponse('adminUpdateTicket', {
        error: error.message,
        details: 'Network error - Check if backend server is running',
        type: 'NetworkError'
      })
    } finally {
      setLoadingState('adminUpdateTicket', false)
    }
  }

  const testAddReply = async () => {
    if (!adminToken) {
      setResponse('addReply', { error: 'Please login as admin first' })
      return
    }

    if (!ticketId) {
      setResponse('addReply', { error: 'Please enter ticket ID' })
      return
    }

    if (!replyMessage) {
      setResponse('addReply', { error: 'Please enter a message' })
      return
    }

    setLoadingState('addReply', true)
    setResponse('addReply', null)

    try {
      const response = await fetch(`${API_BASE_URL}/admin/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: replyMessage
        })
      })

      await handleApiResponse(response, 'addReply')
    } catch (error) {
      setResponse('addReply', {
        error: error.message,
        details: 'Network error - Check if backend server is running',
        type: 'NetworkError'
      })
    } finally {
      setLoadingState('addReply', false)
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
    <div className="support-api-test">
      <h1 className="page-title">Support Ticket API Tester</h1>

      {/* Buyer Login Section */}
      <div className="test-section">
        <h2>1. Buyer Login</h2>
        <div className="test-controls">
          <div className="input-group">
            <label>Email:</label>
            <input
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="buyer@example.com"
            />
          </div>
          <div className="input-group">
            <label>Password:</label>
            <input
              type="password"
              value={buyerPassword}
              onChange={(e) => setBuyerPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <button
            onClick={handleBuyerLogin}
            disabled={loading.buyerLogin}
            className="test-button"
          >
            {loading.buyerLogin ? 'Logging in...' : 'Login as Buyer'}
          </button>
        </div>
        {buyerToken && (
          <div className="token-display">
            <strong>Buyer Token:</strong> <span className="token-value">{buyerToken.substring(0, 50)}...</span>
          </div>
        )}
        {renderJsonResponse(responses.buyerLogin)}
      </div>

      {/* Admin Login Section */}
      <div className="test-section">
        <h2>2. Admin Login</h2>
        <div className="test-controls">
          <div className="input-group">
            <label>Email:</label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div className="input-group">
            <label>Password:</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <button
            onClick={handleAdminLogin}
            disabled={loading.adminLogin}
            className="test-button"
          >
            {loading.adminLogin ? 'Logging in...' : 'Login as Admin'}
          </button>
        </div>
        {adminToken && (
          <div className="token-display">
            <strong>Admin Token:</strong> <span className="token-value">{adminToken.substring(0, 50)}...</span>
          </div>
        )}
        {renderJsonResponse(responses.adminLogin)}
      </div>

      {/* Buyer APIs Section */}
      <div className="test-section">
        <h2 className="section-title">Buyer/Mobile App APIs</h2>
      </div>
      
      {/* Get Support Contact */}
      <div className="test-section">
        <h2>3. Get Support Contact</h2>
        <div className="test-controls">
          <button
            onClick={testGetSupportContact}
            disabled={loading.contact || !buyerToken}
            className="test-button"
          >
            {loading.contact ? 'Loading...' : 'GET /api/app/support/contact'}
          </button>
        </div>
        {renderJsonResponse(responses.contact)}
      </div>

      {/* Get All Tickets */}
      <div className="test-section">
        <h2>4. Get All Tickets</h2>
        <div className="test-controls">
          <div className="input-group">
            <label>Status:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="input-group">
            <label>Page:</label>
            <input
              type="number"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              min="1"
            />
          </div>
          <div className="input-group">
            <label>Limit:</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              min="1"
            />
          </div>
          <button
            onClick={testGetTickets}
            disabled={loading.getTickets || !buyerToken}
            className="test-button"
          >
            {loading.getTickets ? 'Loading...' : 'GET /api/app/support/tickets'}
          </button>
        </div>
        {renderJsonResponse(responses.getTickets)}
      </div>

      {/* Create Ticket */}
      <div className="test-section">
        <h2>5. Create Ticket</h2>
        <div className="test-controls">
          <div className="input-group">
            <label>Subject:</label>
            <input
              type="text"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="Ticket subject"
            />
          </div>
          <div className="input-group">
            <label>Category:</label>
            <select value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}>
              <option value="maintenance">Maintenance</option>
              <option value="payment">Payment</option>
              <option value="document">Document</option>
              <option value="general">General</option>
              <option value="construction">Construction</option>
              <option value="facilities">Facilities</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="input-group">
            <label>Priority:</label>
            <select value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="input-group">
            <label>Property ID (optional):</label>
            <input
              type="text"
              value={ticketPropertyId}
              onChange={(e) => setTicketPropertyId(e.target.value)}
              placeholder="Leave empty or enter valid MongoDB ObjectId"
            />
            <small style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Must be a valid MongoDB ObjectId (24 hex characters) or leave empty
            </small>
          </div>
        </div>
        <div className="test-controls">
          <div className="input-group full-width">
            <label>Description:</label>
            <textarea
              value={ticketDescription}
              onChange={(e) => setTicketDescription(e.target.value)}
              placeholder="Ticket description"
              rows="3"
            />
          </div>
        </div>
        <div className="test-controls">
          <button
            onClick={testCreateTicket}
            disabled={loading.createTicket || !buyerToken}
            className="test-button"
          >
            {loading.createTicket ? 'Creating...' : 'POST /api/app/support/tickets'}
          </button>
        </div>
        {renderJsonResponse(responses.createTicket)}
      </div>

      {/* Get Ticket Details */}
      <div className="test-section">
        <h2>6. Get Ticket Details</h2>
        <div className="test-controls">
          <div className="input-group">
            <label>Ticket ID:</label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Enter ticket ID"
            />
          </div>
          <button
            onClick={testGetTicket}
            disabled={loading.getTicket || !buyerToken}
            className="test-button"
          >
            {loading.getTicket ? 'Loading...' : 'GET /api/app/support/tickets/:ticketId'}
          </button>
        </div>
        {renderJsonResponse(responses.getTicket)}
      </div>

      {/* Update Ticket */}
      <div className="test-section">
        <h2>7. Update Ticket / Add Message</h2>
        <div className="test-controls">
          <div className="input-group">
            <label>Ticket ID:</label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Enter ticket ID"
            />
          </div>
          <div className="input-group">
            <label>Status (optional):</label>
            <select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)}>
              <option value="">No change</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
        <div className="test-controls">
          <div className="input-group full-width">
            <label>Message (optional):</label>
            <textarea
              value={updateMessage}
              onChange={(e) => setUpdateMessage(e.target.value)}
              placeholder="Add a message"
              rows="2"
            />
          </div>
        </div>
        <div className="test-controls">
          <button
            onClick={testUpdateTicket}
            disabled={loading.updateTicket || !buyerToken}
            className="test-button"
          >
            {loading.updateTicket ? 'Updating...' : 'PUT /api/app/support/tickets/:ticketId'}
          </button>
        </div>
        {renderJsonResponse(responses.updateTicket)}
      </div>

      {/* Admin APIs Section */}
      <div className="test-section">
        <h2 className="section-title">Admin Panel APIs</h2>
      </div>

      {/* Get Ticket Statistics */}
      <div className="test-section">
        <h2>8. Get Ticket Statistics</h2>
        <div className="test-controls">
          <button
            onClick={testGetTicketStats}
            disabled={loading.stats || !adminToken}
            className="test-button"
          >
            {loading.stats ? 'Loading...' : 'GET /api/admin/support/stats'}
          </button>
        </div>
        {renderJsonResponse(responses.stats)}
      </div>

      {/* Get All Tickets (Admin View) */}
      <div className="test-section">
        <h2>9. Get All Tickets (Admin View)</h2>
        <div className="test-controls">
          <div className="input-group">
            <label>Status:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="input-group">
            <label>Priority:</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="input-group">
            <label>Category:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All</option>
              <option value="maintenance">Maintenance</option>
              <option value="payment">Payment</option>
              <option value="document">Document</option>
              <option value="general">General</option>
              <option value="construction">Construction</option>
              <option value="facilities">Facilities</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="input-group">
            <label>Search:</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ticket number or subject"
            />
          </div>
          <div className="input-group">
            <label>Page:</label>
            <input
              type="number"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              min="1"
            />
          </div>
          <div className="input-group">
            <label>Limit:</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              min="1"
            />
          </div>
          <button
            onClick={testGetAllTickets}
            disabled={loading.getAllTickets || !adminToken}
            className="test-button"
          >
            {loading.getAllTickets ? 'Loading...' : 'GET /api/admin/support/tickets'}
          </button>
        </div>
        {renderJsonResponse(responses.getAllTickets)}
      </div>

      {/* Get Ticket Details (Admin View) */}
      <div className="test-section">
        <h2>10. Get Ticket Details (Admin View)</h2>
        <div className="test-controls">
          <div className="input-group">
            <label>Ticket ID:</label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Enter ticket ID"
            />
          </div>
          <button
            onClick={testGetTicketById}
            disabled={loading.getTicketById || !adminToken}
            className="test-button"
          >
            {loading.getTicketById ? 'Loading...' : 'GET /api/admin/support/tickets/:ticketId'}
          </button>
        </div>
        {renderJsonResponse(responses.getTicketById)}
      </div>

      {/* Update Ticket (Admin) */}
      <div className="test-section">
        <h2>11. Update Ticket (Admin)</h2>
        <div className="test-controls">
          <div className="input-group">
            <label>Ticket ID:</label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Enter ticket ID"
            />
          </div>
          <div className="input-group">
            <label>Status (optional):</label>
            <select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)}>
              <option value="">No change</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="input-group">
            <label>Priority (optional):</label>
            <select value={updatePriority} onChange={(e) => setUpdatePriority(e.target.value)}>
              <option value="">No change</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div className="test-controls">
          <div className="input-group full-width">
            <label>Message (optional):</label>
            <textarea
              value={updateMessage}
              onChange={(e) => setUpdateMessage(e.target.value)}
              placeholder="Add a message"
              rows="2"
            />
          </div>
        </div>
        <div className="test-controls">
          <button
            onClick={testAdminUpdateTicket}
            disabled={loading.adminUpdateTicket || !adminToken}
            className="test-button"
          >
            {loading.adminUpdateTicket ? 'Updating...' : 'PUT /api/admin/support/tickets/:ticketId'}
          </button>
        </div>
        {renderJsonResponse(responses.adminUpdateTicket)}
      </div>

      {/* Add Reply to Ticket */}
      <div className="test-section">
        <h2>12. Add Reply to Ticket</h2>
        <div className="test-controls">
          <div className="input-group">
            <label>Ticket ID:</label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="Enter ticket ID"
            />
          </div>
        </div>
        <div className="test-controls">
          <div className="input-group full-width">
            <label>Message:</label>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Enter your reply message"
              rows="3"
            />
          </div>
        </div>
        <div className="test-controls">
          <button
            onClick={testAddReply}
            disabled={loading.addReply || !adminToken}
            className="test-button"
          >
            {loading.addReply ? 'Sending...' : 'POST /api/admin/support/tickets/:ticketId/reply'}
          </button>
        </div>
        {renderJsonResponse(responses.addReply)}
      </div>
    </div>
  )
}

export default SupportApiTest

