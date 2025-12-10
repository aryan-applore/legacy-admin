import { useState, useEffect } from 'react'
import './Support.css'
import { useApiFetch } from '../../lib/apiHelpers'

function Support() {
  const { fetchData } = useApiFetch()
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTickets()
    fetchStats()
  }, [statusFilter])

  const fetchTickets = async () => {
    setLoading(true)
    const statusParam = statusFilter === 'all' ? '' : `&status=${statusFilter}`
    const result = await fetchData(`/support/tickets?${statusParam}&limit=50`)
    if (result.success) {
      setTickets(result.data || [])
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    const result = await fetchData('/support/stats')
    if (result.success && result.data) {
      setStats(result.data.overview || {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        open: 0
      })
    }
  }

  const fetchTicketDetails = async (ticketId) => {
    const result = await fetchData(`/support/tickets/${ticketId}`)
    if (result.success) {
      setSelectedTicket(result.data)
      setShowModal(true)
    }
  }

  const handleStatusUpdate = async (ticketId, newStatus, priority) => {
    const updateData = { status: newStatus }
    if (priority) {
      updateData.priority = priority
    }
    
    const result = await fetchData(`/support/tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    })
    
    if (result.success) {
      await fetchTickets()
      await fetchStats()
      if (selectedTicket && selectedTicket.id === ticketId) {
        await fetchTicketDetails(ticketId)
      }
    }
  }

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyMessage.trim() || !selectedTicket) return

    setSubmitting(true)
    const result = await fetchData(`/support/tickets/${selectedTicket.id}`, {
      method: 'PUT',
      body: JSON.stringify({ message: replyMessage })
    })
    
    if (result.success) {
      setReplyMessage('')
      await fetchTicketDetails(selectedTicket.id)
      await fetchTickets()
      await fetchStats()
    }
    setSubmitting(false)
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-warning'
      case 'in-progress':
        return 'status-info'
      case 'resolved':
        return 'status-success'
      case 'closed':
        return 'status-secondary'
      default:
        return ''
    }
  }

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'priority-high'
      case 'medium':
        return 'priority-medium'
      case 'low':
        return 'priority-low'
      default:
        return ''
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedTicket(null)
    setReplyMessage('')
  }

  return (
    <div className="support-page">
      <div className="page-header">
        <h1 className="page-title-white">Support & Queries</h1>
      </div>

      <div className="support-stats">
        <div className="support-stat-card card">
          <div className="support-stat-icon">📥</div>
          <div>
            <h3>Total Queries</h3>
            <p className="support-stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="support-stat-card card">
          <div className="support-stat-icon">⏳</div>
          <div>
            <h3>Pending</h3>
            <p className="support-stat-value">{stats.pending}</p>
          </div>
        </div>
        <div className="support-stat-card card">
          <div className="support-stat-icon">🔄</div>
          <div>
            <h3>In Progress</h3>
            <p className="support-stat-value">{stats.inProgress}</p>
          </div>
        </div>
        <div className="support-stat-card card">
          <div className="support-stat-icon">✅</div>
          <div>
            <h3>Resolved</h3>
            <p className="support-stat-value">{stats.resolved}</p>
          </div>
        </div>
      </div>

      <div className="card queries-table-container">
        <div className="table-header">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-tab ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              Pending
            </button>
            <button 
              className={`filter-tab ${statusFilter === 'in-progress' ? 'active' : ''}`}
              onClick={() => setStatusFilter('in-progress')}
            >
              In Progress
            </button>
            <button 
              className={`filter-tab ${statusFilter === 'resolved' ? 'active' : ''}`}
              onClick={() => setStatusFilter('resolved')}
            >
              Resolved
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">No tickets found</div>
        ) : (
          <table className="queries-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>User</th>
                <th>Property</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="query-id">{ticket.ticketNumber}</td>
                  <td>{ticket.buyer?.name || 'N/A'}</td>
                  <td>{ticket.property?.flatNo ? `${ticket.property.flatNo}${ticket.property.buildingName ? ` - ${ticket.property.buildingName}` : ''}` : 'N/A'}</td>
                  <td className="query-subject">{ticket.subject}</td>
                  <td className="capitalize">{ticket.category || 'N/A'}</td>
                  <td>
                    <span className={`priority-badge ${getPriorityClass(ticket.priority)}`}>
                      {ticket.priority || 'medium'}
                    </span>
                  </td>
                  <td>
                    <select 
                      className={`status-select ${getStatusClass(ticket.status)}`}
                      value={ticket.status}
                      onChange={(e) => handleStatusUpdate(ticket.id, e.target.value, ticket.priority)}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td>{ticket.createdAt ? formatDate(ticket.createdAt) : 'N/A'}</td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="action-btn"
                        onClick={() => fetchTicketDetails(ticket.id)}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => fetchTicketDetails(ticket.id)}
                        title="Reply"
                      >
                        💬
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ticket Details Modal */}
      {showModal && selectedTicket && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ticket Details - {selectedTicket.ticketNumber}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="ticket-info">
                <div className="info-row">
                  <div className="info-item">
                    <label>User:</label>
                    <span>{selectedTicket.buyer?.name || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{selectedTicket.buyer?.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone:</label>
                    <span>{selectedTicket.buyer?.phone || 'N/A'}</span>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-item">
                    <label>Property:</label>
                    <span>{selectedTicket.property?.flatNo ? `${selectedTicket.property.flatNo}${selectedTicket.property.buildingName ? ` - ${selectedTicket.property.buildingName}` : ''}` : 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Category:</label>
                    <span className="capitalize">{selectedTicket.category || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Priority:</label>
                    <span className={`priority-badge ${getPriorityClass(selectedTicket.priority)}`}>
                      {selectedTicket.priority || 'medium'}
                    </span>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-item full-width">
                    <label>Subject:</label>
                    <span>{selectedTicket.subject}</span>
                  </div>
                </div>
                {selectedTicket.description && (
                  <div className="info-row">
                    <div className="info-item full-width">
                      <label>Description:</label>
                      <span>{selectedTicket.description}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="conversation-container">
                <h3>Conversation</h3>
                <div className="messages-list">
                  {selectedTicket.conversation && selectedTicket.conversation.length > 0 ? (
                    selectedTicket.conversation.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`message ${msg.sender === 'user' ? 'message-user' : 'message-admin'}`}
                      >
                        <div className="message-header">
                          <span className="message-sender">{msg.senderName}</span>
                          <span className="message-time">{formatDateTime(msg.timestamp)}</span>
                        </div>
                        <div className="message-content">{msg.message}</div>
                      </div>
                    ))
                  ) : (
                    <div className="no-messages">No messages yet</div>
                  )}
                </div>
              </div>

              <form className="reply-form" onSubmit={handleSendReply}>
                <textarea
                  className="reply-textarea"
                  placeholder="Type your reply here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                  disabled={submitting}
                />
                <div className="reply-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={!replyMessage.trim() || submitting}
                  >
                    {submitting ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Support

