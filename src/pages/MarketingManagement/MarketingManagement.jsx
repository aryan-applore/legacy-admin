import { useState, useEffect } from 'react'
import { useApiFetch, useNotification } from '../../lib/apiHelpers'
import './MarketingManagement.css'

function MarketingManagement() {
  const { fetchData } = useApiFetch()
  const [notification, showNotification] = useNotification()
  const [collaterals, setCollaterals] = useState([])
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [filters, setFilters] = useState({
    projectId: '',
    type: '',
    isActive: ''
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    projectId: '',
    type: 'brochure',
    title: '',
    description: '',
    fileUrl: '',
    thumbnailUrl: '',
    fileName: '',
    fileSize: 0,
    mimeType: '',
    videoUrl: '',
    duration: 0,
    isActive: true
  })

  useEffect(() => {
    fetchCollaterals()
  }, [filters])

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true)
      const result = await fetchData('/projects?simple=true&status=construction')
      if (result.success && result.data) {
        const projectsList = Array.isArray(result.data) ? result.data : []
        setProjects(projectsList)
      } else {
        console.error('Failed to fetch projects:', result.error)
        setProjects([])
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      setProjects([])
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleOpenCreateModal = () => {
    setShowCreateModal(true)
    fetchProjects()
  }

  const fetchCollaterals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.projectId) params.append('projectId', filters.projectId)
      if (filters.type) params.append('type', filters.type)
      if (filters.isActive !== '') params.append('isActive', filters.isActive)
      params.append('page', '1')
      params.append('limit', '50')

      const result = await fetchData(`/marketing?${params.toString()}`)
      if (result.success) {
        setCollaterals(result.data || [])
      } else {
        showNotification(result.error || 'Failed to load marketing collaterals', 'error')
      }
    } catch (error) {
      console.error('Error fetching collaterals:', error)
      showNotification('Failed to load marketing collaterals', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.projectId || !formData.title) {
      showNotification('Please fill all required fields', 'error')
      return
    }

    try {
      const result = await fetchData('/marketing', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      if (result.success) {
        showNotification('Marketing collateral created successfully', 'success')
        setShowCreateModal(false)
        resetForm()
        fetchCollaterals()
      } else {
        showNotification(result.error || 'Failed to create marketing collateral', 'error')
      }
    } catch (error) {
      console.error('Error creating collateral:', error)
      showNotification('Failed to create marketing collateral', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this marketing collateral?')) {
      return
    }

    try {
      const result = await fetchData(`/marketing/${id}`, {
        method: 'DELETE'
      })
      if (result.success) {
        showNotification('Marketing collateral deleted successfully', 'success')
        fetchCollaterals()
      } else {
        showNotification(result.error || 'Failed to delete marketing collateral', 'error')
      }
    } catch (error) {
      console.error('Error deleting collateral:', error)
      showNotification('Failed to delete marketing collateral', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      projectId: '',
      type: 'brochure',
      title: '',
      description: '',
      fileUrl: '',
      thumbnailUrl: '',
      fileName: '',
      fileSize: 0,
      mimeType: '',
      videoUrl: '',
      duration: 0,
      isActive: true
    })
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="marketing-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-white">Marketing Collateral</h1>
          <p className="page-subtitle">Manage marketing materials for projects</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleOpenCreateModal}
        >
          + Create Collateral
        </button>
      </div>

      <div className="card filters-section">
        <div className="filters-grid">
          <input 
            type="text" 
            placeholder="Search by project ID..." 
            className="search-input-full"
            value={filters.projectId}
            onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
          />
          <select 
            className="filter-select"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="brochure">Brochure</option>
            <option value="video">Video</option>
            <option value="priceList">Price List</option>
          </select>
          <select 
            className="filter-select"
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading collaterals...</div>
      ) : collaterals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>No marketing collaterals found</div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="marketing-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Description</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {collaterals.map((item) => (
                  <tr key={item._id || item.id}>
                    <td>
                      <span className="type-icon">
                        {item.type === 'video' ? '🎥' : item.type === 'priceList' ? '💰' : '📄'}
                      </span>
                      <span className="type-badge">{item.type || 'N/A'}</span>
                    </td>
                    <td className="title-cell">{item.title || 'Untitled'}</td>
                    <td>{item.projectId?.name || 'N/A'}</td>
                    <td className="description-cell">
                      {item.description ? (
                        <span title={item.description}>
                          {item.description.length > 50 
                            ? `${item.description.substring(0, 50)}...` 
                            : item.description}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>{item.fileSize ? formatFileSize(item.fileSize) : 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${item.isActive ? 'status-success' : 'status-error'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {item.fileUrl && (
                          <a 
                            href={item.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="action-btn"
                            title="View File"
                          >
                            👁️
                          </a>
                        )}
                        {item.videoUrl && (
                          <a 
                            href={item.videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="action-btn"
                            title="Watch Video"
                          >
                            ▶️
                          </a>
                        )}
                        <button 
                          className="action-btn"
                          onClick={() => handleDelete(item._id || item.id)}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Marketing Collateral</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate} className="modal-body">
              <div className="form-group">
                <label>Project *</label>
                {loadingProjects ? (
                  <div style={{ padding: '8px', color: 'var(--text-secondary)' }}>Loading projects...</div>
                ) : (
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project._id || project.id} value={project._id || project.id}>
                        {project.name || 'Unnamed Project'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="brochure">Brochure</option>
                  <option value="video">Video</option>
                  <option value="priceList">Price List</option>
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
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              {formData.type === 'video' ? (
                <>
                  <div className="form-group">
                    <label>Video URL *</label>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration (seconds)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>File URL *</label>
                    <input
                      type="url"
                      value={formData.fileUrl}
                      onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>File Name</label>
                    <input
                      type="text"
                      value={formData.fileName}
                      onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="form-group">
                <label>Thumbnail URL</label>
                <input
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active
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

      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default MarketingManagement

