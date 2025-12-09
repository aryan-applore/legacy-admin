import { useState, useEffect } from 'react'
import { useApiFetch, useNotification } from '../../lib/apiHelpers'
import './NotificationManagement.css'

function NotificationManagement() {
  const { fetchData } = useApiFetch()
  const [notification, showNotification] = useNotification()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    overview: { total: 0, read: 0, unread: 0, readRate: '0' },
    byType: {}
  })
  const [filters, setFilters] = useState({
    buyerId: '',
    type: '',
    isRead: ''
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [formData, setFormData] = useState({
    buyerId: '',
    type: 'general',
    title: '',
    message: '',
    propertyId: '',
    actionUrl: ''
  })
  const [bulkFormData, setBulkFormData] = useState({
    buyerIds: [],
    type: 'general',
    title: '',
    message: '',
    actionUrl: ''
  })

  useEffect(() => {
    fetchNotifications()
    fetchStats()
  }, [filters])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.buyerId) params.append('buyerId', filters.buyerId)
      if (filters.type) params.append('type', filters.type)
      if (filters.isRead !== '') params.append('isRead', filters.isRead)
      params.append('page', '1')
      params.append('limit', '50')

      const result = await fetchData(`/notifications?${params.toString()}`)
      if (result.success) {
        setNotifications(result.data || [])
      } else {
        showNotification(result.error || 'Failed to load notifications', 'error')
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      showNotification('Failed to load notifications', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const result = await fetchData('/notifications/stats')
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error)
    }
  }

  const handleCreateNotification = async (e) => {
    e.preventDefault()
    if (!formData.buyerId || !formData.title || !formData.message) {
      showNotification('Please fill all required fields', 'error')
      return
    }

    try {
      const result = await fetchData('/notifications', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      if (result.success) {
        showNotification('Notification created successfully', 'success')
        setShowCreateModal(false)
        setFormData({
          buyerId: '',
          type: 'general',
          title: '',
          message: '',
          propertyId: '',
          actionUrl: ''
        })
        fetchNotifications()
        fetchStats()
      } else {
        showNotification(result.error || 'Failed to create notification', 'error')
      }
    } catch (error) {
      console.error('Error creating notification:', error)
      showNotification('Failed to create notification', 'error')
    }
  }

  const handleBulkNotification = async (e) => {
    e.preventDefault()
    if (!bulkFormData.buyerIds.length || !bulkFormData.title || !bulkFormData.message) {
      showNotification('Please fill all required fields', 'error')
      return
    }

    try {
      const result = await fetchData('/notifications/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkFormData)
      })
      if (result.success) {
        showNotification(`Bulk notification sent to ${result.data?.count || 0} users`, 'success')
        setShowBulkModal(false)
        setBulkFormData({
          buyerIds: [],
          type: 'general',
          title: '',
          message: '',
          actionUrl: ''
        })
        fetchNotifications()
        fetchStats()
      } else {
        showNotification(result.error || 'Failed to send bulk notification', 'error')
      }
    } catch (error) {
      console.error('Error sending bulk notification:', error)
      showNotification('Failed to send bulk notification', 'error')
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="notification-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-white">Notifications</h1>
          <p className="page-subtitle">
            Total: {stats.overview?.total || 0} | 
            Read: {stats.overview?.read || 0} | 
            Unread: {stats.overview?.unread || 0}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-outline"
            onClick={() => setShowBulkModal(true)}
          >
            Bulk Send
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Notification
          </button>
        </div>
      </div>

      <div className="card filters-section">
        <div className="filters-grid">
          <input 
            type="text" 
            placeholder="Search by buyer ID..." 
            className="search-input-full"
            value={filters.buyerId}
            onChange={(e) => setFilters({ ...filters, buyerId: e.target.value })}
          />
          <select 
            className="filter-select"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="payment_due">Payment Due</option>
            <option value="payment_received">Payment Received</option>
            <option value="progress_update">Progress Update</option>
            <option value="document_uploaded">Document Uploaded</option>
            <option value="ticket_update">Ticket Update</option>
            <option value="general">General</option>
          </select>
          <select 
            className="filter-select"
            value={filters.isRead}
            onChange={(e) => setFilters({ ...filters, isRead: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>No notifications found</div>
      ) : (
        <div className="card">
          <table className="notifications-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Message</th>
                <th>Buyer</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notif) => (
                <tr key={notif._id || notif.id}>
                  <td>{notif.title}</td>
                  <td>
                    <span className="type-badge">{notif.type || 'general'}</span>
                  </td>
                  <td className="message-cell">{notif.message}</td>
                  <td>{notif.buyerId || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${notif.isRead ? 'status-success' : 'status-warning'}`}>
                      {notif.isRead ? 'Read' : 'Unread'}
                    </span>
                  </td>
                  <td>{formatDate(notif.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Notification</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateNotification} className="modal-body">
              <div className="form-group">
                <label>Buyer ID *</label>
                <input
                  type="text"
                  value={formData.buyerId}
                  onChange={(e) => setFormData({ ...formData, buyerId: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="general">General</option>
                  <option value="payment_due">Payment Due</option>
                  <option value="payment_received">Payment Received</option>
                  <option value="progress_update">Progress Update</option>
                  <option value="document_uploaded">Document Uploaded</option>
                  <option value="ticket_update">Ticket Update</option>
                </select>
              </div>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Message *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div className="form-group">
                <label>Property ID</label>
                <input
                  type="text"
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Action URL</label>
                <input
                  type="text"
                  value={formData.actionUrl}
                  onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Notification Modal */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Bulk Notification</h2>
              <button className="close-btn" onClick={() => setShowBulkModal(false)}>×</button>
            </div>
            <form onSubmit={handleBulkNotification} className="modal-body">
              <div className="form-group">
                <label>Buyer IDs (comma-separated) *</label>
                <input
                  type="text"
                  placeholder="buyer_id1, buyer_id2, buyer_id3"
                  value={bulkFormData.buyerIds.join(', ')}
                  onChange={(e) => setBulkFormData({ 
                    ...bulkFormData, 
                    buyerIds: e.target.value.split(',').map(id => id.trim()).filter(id => id) 
                  })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={bulkFormData.type}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, type: e.target.value })}
                  required
                >
                  <option value="general">General</option>
                  <option value="payment_due">Payment Due</option>
                  <option value="payment_received">Payment Received</option>
                  <option value="progress_update">Progress Update</option>
                  <option value="document_uploaded">Document Uploaded</option>
                  <option value="ticket_update">Ticket Update</option>
                </select>
              </div>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={bulkFormData.title}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Message *</label>
                <textarea
                  value={bulkFormData.message}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, message: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div className="form-group">
                <label>Action URL</label>
                <input
                  type="text"
                  value={bulkFormData.actionUrl}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, actionUrl: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowBulkModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Send Bulk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default NotificationManagement

