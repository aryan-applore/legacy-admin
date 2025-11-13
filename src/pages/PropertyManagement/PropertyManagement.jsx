import { useState, useMemo, useEffect } from 'react'
import './PropertyManagement.css'
import { 
  Home, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Search,
  Eye,
  Edit,
  Trash2,
  Building,
  User,
  MapPin
} from 'lucide-react'

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api'

function PropertyManagement() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditProgressModal, setShowEditProgressModal] = useState(false)
  const [progressData, setProgressData] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [loadingProgress, setLoadingProgress] = useState(false)
  const [loadingGallery, setLoadingGallery] = useState(false)
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProject, setFilterProject] = useState('All Projects')
  const [filterStatus, setFilterStatus] = useState('All Status')
  const [notification, setNotification] = useState(null)

  // Projects list for filter
  const [projects, setProjects] = useState([])

  // Fetch projects for filter
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/projects`)
        const data = await response.json()
        if (data.success) {
          setProjects(data.data || [])
        }
      } catch (err) {
        console.error('Error fetching projects:', err)
      }
    }
    fetchProjects()
  }, [])

  // Fetch properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${API_BASE_URL}/admin/properties`)
        const data = await response.json()
        
        if (data.success && data.data) {
          setProperties(data.data.properties || [])
        } else {
          setError('Failed to fetch properties')
          setProperties([])
        }
      } catch (err) {
        console.error('Error fetching properties:', err)
        setError('Failed to load properties. Please check if the backend server is running.')
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

  // Filtered and Searched Properties
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        property.flatNo?.toLowerCase().includes(searchLower) ||
        property.projectName?.toLowerCase().includes(searchLower) ||
        (property.users && property.users.some(u => 
          u?.name?.toLowerCase().includes(searchLower) || 
          u?.email?.toLowerCase().includes(searchLower)
        )) ||
        (property.user && (
          property.user?.name?.toLowerCase().includes(searchLower) ||
          property.user?.email?.toLowerCase().includes(searchLower)
        )) ||
        property.location?.toLowerCase().includes(searchLower)

      // Project filter
      const matchesProject = 
        filterProject === 'All Projects' || property.projectName === filterProject

      // Status filter
      const matchesStatus = 
        filterStatus === 'All Status' || property.status === filterStatus

      return matchesSearch && matchesProject && matchesStatus
    })
  }, [properties, searchQuery, filterProject, filterStatus])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleViewDetails = async (property) => {
    setSelectedProperty(property)
    setShowDetailsModal(true)
    
    // Fetch progress and gallery data
    await fetchPropertyProgress(property.id)
    await fetchPropertyGallery(property.id)
  }

  const fetchPropertyProgress = async (propertyId) => {
    try {
      setLoadingProgress(true)
      const response = await fetch(`${API_BASE_URL}/admin/properties/${propertyId}/progress`)
      const data = await response.json()
      if (data.success) {
        setProgressData(data.data)
      }
    } catch (err) {
      console.error('Error fetching progress:', err)
    } finally {
      setLoadingProgress(false)
    }
  }

  const fetchPropertyGallery = async (propertyId) => {
    try {
      setLoadingGallery(true)
      const response = await fetch(`${API_BASE_URL}/admin/properties/${propertyId}/gallery`)
      const data = await response.json()
      if (data.success) {
        setGalleryImages(data.data.images || [])
      }
    } catch (err) {
      console.error('Error fetching gallery:', err)
      setGalleryImages([])
    } finally {
      setLoadingGallery(false)
    }
  }

  const handleEditProgress = () => {
    setShowEditProgressModal(true)
  }

  const handleSaveProgress = async () => {
    if (!selectedProperty || !progressData) return

    try {
      const response = await fetch(`${API_BASE_URL}/admin/properties/${selectedProperty.id}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          overallProgress: progressData.overallProgress,
          currentStage: progressData.currentStage,
          stages: progressData.stages
        })
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Progress updated successfully!', 'success')
        setShowEditProgressModal(false)
        // Refresh property data
        await fetchPropertyProgress(selectedProperty.id)
        // Refresh properties list
        window.location.reload()
      } else {
        showNotification(data.error || 'Failed to update progress', 'error')
      }
    } catch (err) {
      console.error('Error updating progress:', err)
      showNotification('Failed to update progress', 'error')
    }
  }

  const handleStageToggle = (stageName) => {
    if (!progressData) return
    
    const updatedStages = progressData.stages.map(stage => {
      if (stage.name === stageName) {
        return {
          ...stage,
          completed: !stage.completed,
          status: !stage.completed ? 'completed' : 'pending'
        }
      }
      return stage
    })
    
    setProgressData({
      ...progressData,
      stages: updatedStages
    })
  }

  const handleUploadGalleryImage = async (url, caption) => {
    if (!selectedProperty || !url) return

    try {
      const response = await fetch(`${API_BASE_URL}/admin/properties/${selectedProperty.id}/gallery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          caption: caption || ''
        })
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Image uploaded successfully!', 'success')
        await fetchPropertyGallery(selectedProperty.id)
      } else {
        showNotification(data.error || 'Failed to upload image', 'error')
      }
    } catch (err) {
      console.error('Error uploading image:', err)
      showNotification('Failed to upload image', 'error')
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilterProject('All Projects')
    setFilterStatus('All Status')
    showNotification('Filters cleared!', 'info')
  }

  // Get unique project names for filter
  const uniqueProjects = useMemo(() => {
    const projectNames = properties
      .map(p => p.projectName)
      .filter((name, index, self) => name && self.indexOf(name) === index)
    return projectNames.sort()
  }, [properties])

  return (
    <div className="property-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-main">Property Management</h1>
          <p className="page-subtitle">Manage all properties and their assignments</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="property-stats-grid">
        <div className="stat-card-pm">
          <div className="stat-icon-pm"><Home size={24} /></div>
          <div>
            <h3>Total Properties</h3>
            <p className="stat-value-pm">{properties.length}</p>
            <span className="stat-label">{filteredProperties.length} shown</span>
          </div>
        </div>
        <div className="stat-card-pm">
          <div className="stat-icon-pm"><CheckCircle size={24} /></div>
          <div>
            <h3>Active Properties</h3>
            <p className="stat-value-pm">{properties.filter(p => p.status === 'active').length}</p>
            <span className="stat-label">{properties.length > 0 ? Math.round((properties.filter(p => p.status === 'active').length / properties.length) * 100) : 0}% active</span>
          </div>
        </div>
        <div className="stat-card-pm">
          <div className="stat-icon-pm"><XCircle size={24} /></div>
          <div>
            <h3>Completed</h3>
            <p className="stat-value-pm">{properties.filter(p => p.status === 'completed').length}</p>
            <span className="stat-label">{properties.length > 0 ? Math.round((properties.filter(p => p.status === 'completed').length / properties.length) * 100) : 0}% completed</span>
          </div>
        </div>
        <div className="stat-card-pm">
          <div className="stat-icon-pm"><DollarSign size={24} /></div>
          <div>
            <h3>Total Value</h3>
            <p className="stat-value-pm">
              ₹{properties.reduce((sum, p) => sum + (p.pricing?.totalPrice || 0), 0).toLocaleString('en-IN')}
            </p>
            <span className="stat-label">All properties combined</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card filters-section">
        <div className="filters-grid">
          <input 
            type="text" 
            placeholder="Search by flat number, project, user, location..." 
            className="search-input-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="filter-select"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          >
            <option>All Projects</option>
            {uniqueProjects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
          <select 
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-outline clear-filters-btn" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Properties Table */}
      <div className="card properties-table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>Loading properties...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--error-color, #e74c3c)' }}>
            <p>{error}</p>
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.reload()}
              style={{ marginTop: '10px' }}
            >
              Retry
            </button>
          </div>
        ) : (
        <table className="properties-table-pm">
          <thead>
            <tr>
              <th>Property Details</th>
              <th>Project</th>
              <th>Assigned User</th>
              <th>Broker</th>
              <th>Specifications</th>
              <th>Pricing</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProperties.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  {properties.length === 0 ? 'No properties found. Properties will appear here when users are assigned to projects.' : 'No properties found matching your criteria'}
                </td>
              </tr>
            ) : (
              filteredProperties.map((property) => (
              <tr key={property.id}>
                <td>
                  <div className="property-cell-pm">
                    <div className="property-icon-pm">
                      <Home size={20} />
                    </div>
                    <div>
                      <div className="property-name-pm">Flat {property.flatNo}</div>
                      {property.buildingName && (
                        <div className="property-meta">{property.buildingName}</div>
                      )}
                      <div className="property-meta">
                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {property.location}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="project-info-pm">
                    <Building size={16} style={{ marginRight: '4px', color: 'var(--primary-color)' }} />
                    {property.projectName || 'N/A'}
                  </div>
                </td>
                <td>
                  {property.users && property.users.length > 0 ? (
                    <div className="users-list-pm">
                      {property.users.map((user, idx) => (
                        <div key={user.id || idx} className="user-info-pm" style={{ marginBottom: idx < property.users.length - 1 ? '8px' : '0' }}>
                          <User size={16} style={{ marginRight: '4px', color: 'var(--primary-color)' }} />
                          <div>
                            <div className="user-name-pm">{user.name}</div>
                            <div className="user-meta">{user.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : property.user ? (
                    <div className="user-info-pm">
                      <User size={16} style={{ marginRight: '4px', color: 'var(--primary-color)' }} />
                      <div>
                        <div className="user-name-pm">{property.user.name}</div>
                        <div className="user-meta">{property.user.email}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="no-assignment">Not Assigned</span>
                  )}
                </td>
                <td>
                  {property.brokers && property.brokers.length > 0 ? (
                    <div className="brokers-list-pm">
                      {property.brokers.map((broker, idx) => (
                        <div key={broker.id || idx} style={{ marginBottom: idx < property.brokers.length - 1 ? '8px' : '0' }}>
                          <div className="broker-name-pm">{broker.name}</div>
                          <div className="broker-meta">{broker.company}</div>
                        </div>
                      ))}
                    </div>
                  ) : property.broker ? (
                    <div>
                      <div className="broker-name-pm">{property.broker.name}</div>
                      <div className="broker-meta">{property.broker.company}</div>
                    </div>
                  ) : (
                    <span className="no-assignment">No Broker</span>
                  )}
                </td>
                <td>
                  <div className="specs-info-pm">
                    {property.specifications?.area && (
                      <div>{property.specifications.area} sqft</div>
                    )}
                    {property.specifications?.bedrooms && (
                      <div className="specs-meta">{property.specifications.bedrooms} BHK</div>
                    )}
                  </div>
                </td>
                <td>
                  {property.pricing?.totalPrice ? (
                    <div>
                      <div className="price-pm">₹{property.pricing.totalPrice.toLocaleString('en-IN')}</div>
                      {property.pricing?.pricePerSqft && (
                        <div className="price-meta">₹{property.pricing.pricePerSqft.toLocaleString('en-IN')}/sqft</div>
                      )}
                    </div>
                  ) : (
                    <span className="no-assignment">N/A</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${
                    property.status === 'active' ? 'status-success' : 
                    property.status === 'completed' ? 'status-info' : 
                    'status-error'
                  }`}>
                    {property.status || 'active'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="action-btn-pm" 
                      title="View Details"
                      onClick={() => handleViewDetails(property)}
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      className="action-btn-pm" 
                      title="Edit Progress"
                      onClick={() => {
                        setSelectedProperty(property)
                        fetchPropertyProgress(property.id).then(() => {
                          setShowEditProgressModal(true)
                        })
                      }}
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
        )}
      </div>

      {/* Property Details Modal */}
      {showDetailsModal && selectedProperty && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Property Details</h2>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Property ID</label>
                  <p style={{ fontFamily: 'monospace', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                    {selectedProperty.id}
                  </p>
                </div>
                <div className="detail-item">
                  <label>Flat/Unit Number</label>
                  <p>{selectedProperty.flatNo}</p>
                </div>
                <div className="detail-item">
                  <label>Building Name</label>
                  <p>{selectedProperty.buildingName || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Project</label>
                  <p>{selectedProperty.projectName || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Location</label>
                  <p>{selectedProperty.location || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <p>
                    <span className={`status-badge ${
                      selectedProperty.status === 'active' ? 'status-success' : 
                      selectedProperty.status === 'completed' ? 'status-info' : 
                      'status-error'
                    }`}>
                      {selectedProperty.status || 'active'}
                    </span>
                  </p>
                </div>
                <div className="detail-item">
                  <label>Progress</label>
                  <p>{selectedProperty.progressPercentage || 0}%</p>
                </div>
                <div className="detail-item">
                  <label>Current Stage</label>
                  <p>{selectedProperty.currentStage || progressData?.currentStage || 'N/A'}</p>
                </div>
                {selectedProperty.specifications?.area && (
                  <div className="detail-item">
                    <label>Area</label>
                    <p>{selectedProperty.specifications.area} sqft</p>
                  </div>
                )}
                {selectedProperty.specifications?.bedrooms && (
                  <div className="detail-item">
                    <label>Bedrooms</label>
                    <p>{selectedProperty.specifications.bedrooms}</p>
                  </div>
                )}
                {selectedProperty.specifications?.bathrooms && (
                  <div className="detail-item">
                    <label>Bathrooms</label>
                    <p>{selectedProperty.specifications.bathrooms}</p>
                  </div>
                )}
                {selectedProperty.pricing?.totalPrice && (
                  <div className="detail-item">
                    <label>Total Price</label>
                    <p>₹{selectedProperty.pricing.totalPrice.toLocaleString('en-IN')}</p>
                  </div>
                )}
                {selectedProperty.pricing?.bookingAmount && (
                  <div className="detail-item">
                    <label>Booking Amount</label>
                    <p>₹{selectedProperty.pricing.bookingAmount.toLocaleString('en-IN')}</p>
                  </div>
                )}
                {selectedProperty.possessionDate && (
                  <div className="detail-item">
                    <label>Possession Date</label>
                    <p>{new Date(selectedProperty.possessionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                )}
              </div>

              {((selectedProperty.users && selectedProperty.users.length > 0) || selectedProperty.user) && (
                <div className="details-section" style={{ marginTop: '24px' }}>
                  <h4>Assigned Users</h4>
                  {(selectedProperty.users && selectedProperty.users.length > 0 ? selectedProperty.users : [selectedProperty.user]).map((user, idx) => (
                    <div key={user?.id || idx} style={{ marginBottom: idx < (selectedProperty.users?.length || 1) - 1 ? '20px' : '0', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                      <div className="details-grid">
                        <div className="detail-item">
                          <label>Name</label>
                          <p>{user?.name}</p>
                        </div>
                        <div className="detail-item">
                          <label>Email</label>
                          <p>{user?.email}</p>
                        </div>
                        {user?.phone && (
                          <div className="detail-item">
                            <label>Phone</label>
                            <p>{user.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {((selectedProperty.brokers && selectedProperty.brokers.length > 0) || selectedProperty.broker) && (
                <div className="details-section" style={{ marginTop: '24px' }}>
                  <h4>Assigned Brokers</h4>
                  {(selectedProperty.brokers && selectedProperty.brokers.length > 0 ? selectedProperty.brokers : (selectedProperty.broker ? [selectedProperty.broker] : [])).map((broker, idx) => (
                    <div key={broker?.id || idx} style={{ marginBottom: idx < (selectedProperty.brokers?.length || 1) - 1 ? '20px' : '0', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                      <div className="details-grid">
                        <div className="detail-item">
                          <label>Name</label>
                          <p>{broker?.name}</p>
                        </div>
                        <div className="detail-item">
                          <label>Company</label>
                          <p>{broker?.company || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Construction Progress Section */}
              <div className="details-section" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4>Construction Progress</h4>
                  <button className="btn btn-primary btn-sm" onClick={handleEditProgress}>
                    <Edit size={14} style={{ marginRight: '4px' }} />
                    Edit Progress
                  </button>
                </div>
                {loadingProgress ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Loading progress...</p>
                ) : progressData ? (
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Overall Progress</span>
                        <span style={{ fontWeight: '600' }}>{progressData.overallProgress}%</span>
                      </div>
                      <div className="progress-bar" style={{ height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${progressData.overallProgress}%`, 
                            height: '100%', 
                            backgroundColor: 'var(--primary-color)',
                            transition: 'width 0.3s ease'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <h5 style={{ marginBottom: '12px', fontSize: '0.9em', color: 'var(--text-secondary)' }}>Construction Stages</h5>
                      <div className="stages-list">
                        {progressData.stages && progressData.stages.length > 0 ? (
                          progressData.stages.map((stage, index) => (
                            <div key={index} className="stage-item" style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              padding: '8px 0',
                              borderBottom: index < progressData.stages.length - 1 ? '1px solid #e0e0e0' : 'none'
                            }}>
                              <div style={{ marginRight: '12px' }}>
                                {stage.completed ? (
                                  <CheckCircle size={20} style={{ color: 'var(--success-color, #28a745)' }} />
                                ) : (
                                  <div style={{ width: '20px', height: '20px', border: '2px solid #ccc', borderRadius: '50%' }}></div>
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '500' }}>{stage.name}</div>
                                {stage.percentageComplete > 0 && (
                                  <div style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                                    {stage.percentageComplete}% complete
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className={`status-badge ${
                                  stage.status === 'completed' ? 'status-success' :
                                  stage.status === 'in-progress' ? 'status-info' :
                                  'status-warning'
                                }`} style={{ fontSize: '0.75em', padding: '2px 8px' }}>
                                  {stage.status || 'pending'}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p style={{ color: 'var(--text-secondary)' }}>No stages defined</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>No progress data available</p>
                )}
              </div>

              {/* Project Gallery Section */}
              <div className="details-section" style={{ marginTop: '24px' }}>
                <h4>Project Gallery</h4>
                {loadingGallery ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Loading gallery...</p>
                ) : galleryImages.length > 0 ? (
                  <div className="gallery-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                    gap: '12px',
                    marginTop: '12px'
                  }}>
                    {galleryImages.map((img) => (
                      <div key={img.id} className="gallery-item" style={{ position: 'relative' }}>
                        <img 
                          src={img.url} 
                          alt={img.caption || 'Gallery image'} 
                          style={{ 
                            width: '100%', 
                            height: '120px', 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                          onClick={() => window.open(img.url, '_blank')}
                        />
                        {img.caption && (
                          <p style={{ 
                            fontSize: '0.75em', 
                            color: 'var(--text-secondary)', 
                            marginTop: '4px',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}>
                            {img.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>No gallery images yet</p>
                )}
                <div style={{ marginTop: '12px' }}>
                  <input
                    type="text"
                    placeholder="Image URL"
                    id="gallery-url-input"
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      marginBottom: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    id="gallery-caption-input"
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      marginBottom: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      const urlInput = document.getElementById('gallery-url-input')
                      const captionInput = document.getElementById('gallery-caption-input')
                      if (urlInput.value) {
                        handleUploadGalleryImage(urlInput.value, captionInput.value)
                        urlInput.value = ''
                        captionInput.value = ''
                      } else {
                        showNotification('Please enter an image URL', 'error')
                      }
                    }}
                  >
                    Upload Gallery Image
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => {
                  setShowDetailsModal(false)
                  setProgressData(null)
                  setGalleryImages([])
                }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Progress Modal */}
      {showEditProgressModal && progressData && (
        <div className="modal-overlay" onClick={() => setShowEditProgressModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Construction Progress</h2>
              <button className="close-btn" onClick={() => setShowEditProgressModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Overall Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progressData.overallProgress || 0}
                  onChange={(e) => setProgressData({
                    ...progressData,
                    overallProgress: parseInt(e.target.value) || 0
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Current Stage
                </label>
                <input
                  type="text"
                  value={progressData.currentStage || ''}
                  onChange={(e) => setProgressData({
                    ...progressData,
                    currentStage: e.target.value
                  })}
                  placeholder="e.g., Structure Work"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500' }}>
                  Construction Stages
                </label>
                {progressData.stages && progressData.stages.length > 0 ? (
                  <div className="stages-list">
                    {progressData.stages.map((stage, index) => (
                      <div key={index} className="stage-item" style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        marginBottom: '8px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        backgroundColor: '#f9f9f9'
                      }}>
                        <input
                          type="checkbox"
                          checked={stage.completed || false}
                          onChange={() => {
                            const updatedStages = [...progressData.stages]
                            updatedStages[index] = {
                              ...updatedStages[index],
                              completed: !updatedStages[index].completed,
                              status: !updatedStages[index].completed ? 'completed' : 'pending'
                            }
                            setProgressData({
                              ...progressData,
                              stages: updatedStages
                            })
                          }}
                          style={{ marginRight: '12px', width: '18px', height: '18px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                            {stage.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>
                              Percentage:
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={stage.percentageComplete || 0}
                              onChange={(e) => {
                                const updatedStages = [...progressData.stages]
                                updatedStages[index] = {
                                  ...updatedStages[index],
                                  percentageComplete: parseInt(e.target.value) || 0
                                }
                                setProgressData({
                                  ...progressData,
                                  stages: updatedStages
                                })
                              }}
                              style={{
                                width: '80px',
                                padding: '4px 8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                              }}
                            />
                            <span style={{ fontSize: '0.85em', color: 'var(--text-secondary)' }}>%</span>
                            <select
                              value={stage.status || 'pending'}
                              onChange={(e) => {
                                const updatedStages = [...progressData.stages]
                                updatedStages[index] = {
                                  ...updatedStages[index],
                                  status: e.target.value,
                                  completed: e.target.value === 'completed'
                                }
                                setProgressData({
                                  ...progressData,
                                  stages: updatedStages
                                })
                              }}
                              style={{
                                marginLeft: '12px',
                                padding: '4px 8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>No stages defined</p>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button className="btn btn-outline" onClick={() => setShowEditProgressModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveProgress}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default PropertyManagement

