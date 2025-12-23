import { useState, useEffect, useMemo } from 'react'
import { useApiFetch, useNotification } from '../../lib/apiHelpers'
import { MultiSelect } from '../../components/ui/multi-select'
import './NotificationManagement.css'

function NotificationManagement() {
  const { fetchData } = useApiFetch()
  const [notification, showNotification] = useNotification()
  const [notifications, setNotifications] = useState([])
  const [users, setUsers] = useState({ buyers: [], brokers: [], suppliers: [] })
  const [properties, setProperties] = useState([])
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

  // Single Notification Form State
  const [formData, setFormData] = useState({
    recipientId: '',
    recipientModel: 'Buyer', // Default to Buyer
    type: 'general',
    title: '',
    message: '',
    propertyId: '',
    actionUrl: '',
    sendPush: true
  })

  // Bulk Notification Form State
  const [bulkFormData, setBulkFormData] = useState({
    buyerIds: [],
    brokerIds: [],
    supplierIds: [],
    type: 'general',
    title: '',
    message: '',
    propertyId: '', // Added propertyId
    actionUrl: '',
    sendPush: true
  })

  useEffect(() => {
    fetchNotifications()
    fetchStats()
    fetchUsers()
    fetchProperties()
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

  const fetchUsers = async () => {
    try {
      const result = await fetchData('/users')
      if (result.success && result.data) {
        const allUsers = result.data
        setUsers({
          buyers: allUsers.filter(u => u.role === 'buyer'),
          brokers: allUsers.filter(u => u.role === 'broker'),
          suppliers: allUsers.filter(u => u.role === 'supplier')
        })
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchProperties = async () => {
    try {
      const result = await fetchData('/properties')
      if (result.success) {
        setProperties(Array.isArray(result.data?.properties) ? result.data.properties : (Array.isArray(result.data) ? result.data : []))
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }

  const handleCreateNotification = async (e) => {
    e.preventDefault()
    if (!formData.recipientId || !formData.title || !formData.message) {
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
          recipientId: '',
          recipientModel: 'Buyer',
          type: 'general',
          title: '',
          message: '',
          propertyId: '',
          actionUrl: '',
          sendPush: true
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
    const hasRecipients = bulkFormData.buyerIds.length > 0 || bulkFormData.brokerIds.length > 0 || bulkFormData.supplierIds.length > 0

    if (!hasRecipients || !bulkFormData.title || !bulkFormData.message) {
      showNotification('Please select at least one recipient and fill required fields', 'error')
      return
    }

    try {
      const result = await fetchData('/notifications/bulk', {
        method: 'POST',
        body: JSON.stringify(bulkFormData)
      })
      if (result.success) {
        showNotification(`Bulk notification sent successfully`, 'success')
        setShowBulkModal(false)
        setBulkFormData({
          buyerIds: [],
          brokerIds: [],
          supplierIds: [],
          type: 'general',
          title: '',
          message: '',
          propertyId: '',
          actionUrl: '',
          sendPush: true
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


  const availableProperties = useMemo(() => {
    if (!formData.recipientId) return []

    return properties.filter(p => {
      // Helper to match ID safely
      const matchesId = (id) => id === formData.recipientId

      if (formData.recipientModel === 'Buyer') {
        if (matchesId(p.buyerId) || matchesId(p.buyer?._id) || matchesId(p.buyer?.id)) return true
        if (p.buyers && Array.isArray(p.buyers) && p.buyers.some(b => matchesId(b._id) || matchesId(b.id))) return true
      }

      if (formData.recipientModel === 'Broker') {
        if (matchesId(p.brokerId) || matchesId(p.broker?._id) || matchesId(p.broker?.id)) return true
        if (p.brokers && Array.isArray(p.brokers) && p.brokers.some(b => matchesId(b._id) || matchesId(b.id))) return true
      }

      return false
    })
  }, [properties, formData.recipientId, formData.recipientModel])

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
            placeholder="Search by User ID..."
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
                <th>Recipient</th>
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
                  <td>
                    {notif.recipientModel || 'User'} <br />
                    <small className="text-muted-foreground">{notif.recipientId?.name || notif.recipientId || 'N/A'}</small>
                  </td>
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
              <div className="form-row">
                <div className="form-group">
                  <label>Recipient Type *</label>
                  <select
                    value={formData.recipientModel}
                    onChange={(e) => setFormData({ ...formData, recipientModel: e.target.value, recipientId: '', propertyId: '' })}
                    required
                  >
                    <option value="Buyer">Buyer</option>
                    <option value="Broker">Broker</option>
                    <option value="Supplier">Supplier</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Recipient *</label>
                  <select
                    value={formData.recipientId}
                    onChange={(e) => setFormData({ ...formData, recipientId: e.target.value, propertyId: '' })}
                    required
                  >
                    <option value="">Select User</option>
                    {(formData.recipientModel === 'Buyer' ? users.buyers :
                      formData.recipientModel === 'Broker' ? users.brokers :
                        users.suppliers).map(user => (
                          <option key={user._id || user.id} value={user._id || user.id}>
                            {user.name || user.company || 'Unnamed User'}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="general">General</option>
                  <option value="alert">Alert</option>
                  <option value="offer">Offer</option>
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
              <div className="form-row">
                <div className="form-group">
                  <label>Property (Optional)</label>
                  <select
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  >
                    <option value="">Select Property</option>
                    {availableProperties.map(p => {
                      const displayName = p.title || p.name || `${p.flatNo}${p.buildingName ? ` - ${p.buildingName}` : ''}` || 'Unnamed Property';
                      return (
                        <option key={p._id || p.id} value={p._id || p.id}>{displayName}</option>
                      )
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Action URL</label>
                  <input
                    type="text"
                    value={formData.actionUrl}
                    onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.sendPush}
                    onChange={(e) => setFormData({ ...formData, sendPush: e.target.checked })}
                  />
                  Send Push Notification
                </label>
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
                <label>Select Buyers</label>
                <MultiSelect
                  value={bulkFormData.buyerIds}
                  onChange={(selected) => setBulkFormData({ ...bulkFormData, buyerIds: selected })}
                  options={users.buyers}
                  getOptionLabel={(u) => u.name || u.email || 'Unnamed Buyer'}
                  getOptionValue={(u) => u._id || u.id}
                  placeholder="Select buyers..."
                />
              </div>

              <div className="form-group">
                <label>Select Brokers</label>
                <MultiSelect
                  value={bulkFormData.brokerIds}
                  onChange={(selected) => setBulkFormData({ ...bulkFormData, brokerIds: selected })}
                  options={users.brokers}
                  getOptionLabel={(u) => u.name || u.company || u.email || 'Unnamed Broker'}
                  getOptionValue={(u) => u._id || u.id}
                  placeholder="Select brokers..."
                />
              </div>

              <div className="form-group">
                <label>Select Suppliers</label>
                <MultiSelect
                  value={bulkFormData.supplierIds}
                  onChange={(selected) => setBulkFormData({ ...bulkFormData, supplierIds: selected })}
                  options={users.suppliers}
                  getOptionLabel={(u) => u.name || u.company || u.email || 'Unnamed Supplier'}
                  getOptionValue={(u) => u._id || u.id}
                  placeholder="Select suppliers..."
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
                  <option value="alert">Alert</option>
                  <option value="offer">Offer</option>
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
              <div className="form-row">
                <div className="form-group">
                  <label>Property (Optional)</label>
                  <select
                    value={bulkFormData.propertyId}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, propertyId: e.target.value })}
                  >
                    <option value="">Select Property</option>
                    {properties.map(p => {
                      const displayName = p.title || p.name || `${p.flatNo}${p.buildingName ? ` - ${p.buildingName}` : ''}` || 'Unnamed Property';
                      return (
                        <option key={p._id || p.id} value={p._id || p.id}>{displayName}</option>
                      )
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Action URL</label>
                  <input
                    type="text"
                    value={bulkFormData.actionUrl}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, actionUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={bulkFormData.sendPush}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, sendPush: e.target.checked })}
                  />
                  Send Push Notification
                </label>
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
        </div >
      )
      }

      {
        notification && (
          <div className={`notification-toast ${notification.type}`}>
            {notification.message}
          </div>
        )
      }
    </div >
  )
}

export default NotificationManagement

