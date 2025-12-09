import { useState, useEffect } from 'react'
import { useApiFetch, useNotification } from '../../lib/apiHelpers'
import './Documents.css'

function Documents() {
  const { fetchData } = useApiFetch()
  const [notification, showNotification] = useNotification()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    buyerId: '',
    propertyId: ''
  })
  const [stats, setStats] = useState({
    overview: { total: 0, totalSize: 0, totalSizeMB: '0' },
    byType: {}
  })

  useEffect(() => {
    fetchDocuments()
    fetchStats()
  }, [filters])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.buyerId) params.append('buyerId', filters.buyerId)
      if (filters.propertyId) params.append('propertyId', filters.propertyId)
      if (filters.type) params.append('type', filters.type)
      params.append('page', '1')
      params.append('limit', '50')

      const result = await fetchData(`/documents?${params.toString()}`)
      if (result.success) {
        setDocuments(result.data || [])
      } else {
        showNotification(result.error || 'Failed to load documents', 'error')
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      showNotification('Failed to load documents', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const result = await fetchData('/documents/stats')
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching document stats:', error)
    }
  }

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      const result = await fetchData(`/documents/${documentId}`, {
        method: 'DELETE'
      })
      if (result.success) {
        showNotification('Document deleted successfully', 'success')
        fetchDocuments()
        fetchStats()
      } else {
        showNotification(result.error || 'Failed to delete document', 'error')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      showNotification('Failed to delete document', 'error')
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const filteredDocuments = documents.filter(doc => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        doc.name?.toLowerCase().includes(searchLower) ||
        doc.documentNumber?.toLowerCase().includes(searchLower) ||
        doc.buyerId?.name?.toLowerCase().includes(searchLower) ||
        doc.propertyId?.flatNo?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <div className="documents-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-white">Documents</h1>
          <p className="page-subtitle">Total: {stats.overview?.total || 0} documents</p>
        </div>
      </div>

      <div className="documents-filter card">
        <input 
          type="text" 
          placeholder="Search documents..." 
          className="search-input-full"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select 
          className="filter-select"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="agreement">Agreement</option>
          <option value="invoice">Invoice</option>
          <option value="letter">Letter</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading documents...</div>
      ) : filteredDocuments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>No documents found</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Document #</th>
                  <th>Property</th>
                  <th>Buyer</th>
                  <th>Size</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc._id || doc.id}>
                    <td className="name-cell">{doc.name || 'Untitled Document'}</td>
                    <td>
                      <span className="type-badge">{doc.type || 'N/A'}</span>
                    </td>
                    <td>{doc.documentNumber || 'N/A'}</td>
                    <td>
                      {doc.propertyId?.flatNo ? 
                        `${doc.propertyId.flatNo}${doc.propertyId.buildingName ? ` - ${doc.propertyId.buildingName}` : ''}` : 
                        'N/A'}
                    </td>
                    <td>
                      {doc.buyerId ? (doc.buyerId.name || doc.buyerId.email || 'N/A') : 'N/A'}
                    </td>
                    <td>{formatFileSize(doc.fileSize)}</td>
                    <td>{formatDate(doc.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        {doc.fileUrl && (
                          <>
                            <button 
                              className="action-btn"
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                              title="Preview"
                            >
                              👁️
                            </button>
                            <a 
                              href={doc.fileUrl} 
                              download={doc.fileName || doc.name}
                              className="action-btn"
                              title="Download"
                            >
                              ⬇️
                            </a>
                          </>
                        )}
                        <button 
                          className="action-btn"
                          onClick={() => handleDelete(doc._id || doc.id)}
                          title="Delete"
                          style={{ color: '#dc2626' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default Documents

