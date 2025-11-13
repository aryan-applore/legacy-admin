import { useState, useMemo, useEffect } from 'react'
import './SupplierManagement.css'

function SupplierManagement() {
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [notification, setNotification] = useState(null)

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('All Categories')
  const [filterStatus, setFilterStatus] = useState('All Status')
  const [filterVerification, setFilterVerification] = useState('Verification Status')

  // Suppliers State - Load from localStorage
  const [suppliers, setSuppliers] = useState(() => {
    const savedSuppliers = localStorage.getItem('legacy-admin-suppliers')
    return savedSuppliers ? JSON.parse(savedSuppliers) : []
  })

  // Store uploaded documents
  const [supplierDocuments, setSupplierDocuments] = useState(() => {
    const savedDocs = localStorage.getItem('legacy-admin-supplier-documents')
    return savedDocs ? JSON.parse(savedDocs) : {}
  })

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('legacy-admin-suppliers', JSON.stringify(suppliers))
  }, [suppliers])

  useEffect(() => {
    localStorage.setItem('legacy-admin-supplier-documents', JSON.stringify(supplierDocuments))
  }, [supplierDocuments])

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        supplier.companyName.toLowerCase().includes(searchLower) ||
        supplier.email.toLowerCase().includes(searchLower) ||
        supplier.phone.includes(searchQuery) ||
        supplier.gstNumber?.toLowerCase().includes(searchLower) ||
        supplier.contactPerson.toLowerCase().includes(searchLower) ||
        supplier.location?.toLowerCase().includes(searchLower)

      const matchesCategory = 
        filterCategory === 'All Categories' || supplier.category === filterCategory

      const matchesStatus = 
        filterStatus === 'All Status' || supplier.status === filterStatus

      const matchesVerification = 
        filterVerification === 'Verification Status' || supplier.verificationStatus === filterVerification

      return matchesSearch && matchesCategory && matchesStatus && matchesVerification
    })
  }, [suppliers, searchQuery, filterCategory, filterStatus, filterVerification])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSaveSupplier = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const supplierData = {
      id: selectedSupplier ? selectedSupplier.id : Date.now(),
      companyName: formData.get('companyName'),
      contactPerson: formData.get('contactPerson'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      category: formData.get('category'),
      materialType: formData.get('materialType'),
      gstNumber: formData.get('gstNumber'),
      panNumber: formData.get('panNumber'),
      location: formData.get('location'),
      address: formData.get('address'),
      status: formData.get('status'),
      verificationStatus: selectedSupplier ? selectedSupplier.verificationStatus : 'Pending',
      joinDate: selectedSupplier ? selectedSupplier.joinDate : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      documents: selectedSupplier ? selectedSupplier.documents : 0
    }

    if (selectedSupplier) {
      setSuppliers(suppliers.map(s => s.id === selectedSupplier.id ? supplierData : s))
      showNotification('Supplier updated successfully!', 'success')
    } else {
      setSuppliers([...suppliers, supplierData])
      showNotification('Supplier created successfully!', 'success')
    }

    setShowSupplierModal(false)
    setSelectedSupplier(null)
  }

  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier)
    setShowDetailsModal(true)
  }

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier)
    setShowSupplierModal(true)
  }

  const handleDeleteSupplier = (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      setSuppliers(suppliers.filter(s => s.id !== supplierId))
      showNotification('Supplier deleted successfully!', 'success')
    }
  }

  const handleApproveSupplier = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (window.confirm(`Approve ${supplier.companyName} for onboarding?`)) {
      setSuppliers(suppliers.map(s => 
        s.id === supplierId 
          ? { ...s, verificationStatus: 'Approved', status: 'Active' }
          : s
      ))
      showNotification(`${supplier.companyName} has been approved!`, 'success')
    }
  }

  const handleRejectSupplier = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (window.confirm(`Reject ${supplier.companyName}'s onboarding application?`)) {
      setSuppliers(suppliers.map(s => 
        s.id === supplierId 
          ? { ...s, verificationStatus: 'Rejected', status: 'Inactive' }
          : s
      ))
      showNotification(`${supplier.companyName} has been rejected.`, 'success')
    }
  }

  const handleActivateSupplier = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (window.confirm(`Activate ${supplier.companyName}'s account?`)) {
      setSuppliers(suppliers.map(s => 
        s.id === supplierId 
          ? { ...s, status: 'Active' }
          : s
      ))
      showNotification(`${supplier.companyName} activated!`, 'success')
    }
  }

  const handleDeactivateSupplier = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (window.confirm(`Deactivate ${supplier.companyName}'s account?`)) {
      setSuppliers(suppliers.map(s => 
        s.id === supplierId 
          ? { ...s, status: 'Inactive' }
          : s
      ))
      showNotification(`${supplier.companyName} deactivated!`, 'success')
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilterCategory('All Categories')
    setFilterStatus('All Status')
    setFilterVerification('Verification Status')
    showNotification('Filters cleared!', 'info')
  }

  const handleManageDocuments = (supplier) => {
    setSelectedSupplier(supplier)
    setShowDocumentsModal(true)
  }

  const handleUploadDocument = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const documentType = formData.get('documentType')
    const file = formData.get('document')
    
    if (file && file.size > 0) {
      const documentData = {
        id: Date.now(),
        name: documentType,
        type: documentType,
        file: file,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadDate: new Date().toLocaleString(),
        verified: false
      }
      
      setSupplierDocuments(prev => ({
        ...prev,
        [selectedSupplier.id]: [...(prev[selectedSupplier.id] || []), documentData]
      }))
      
      setSuppliers(suppliers.map(s => 
        s.id === selectedSupplier.id 
          ? { ...s, documents: (s.documents || 0) + 1 }
          : s
      ))
      
      showNotification(`${documentType} uploaded successfully!`, 'success')
      e.target.reset()
    }
  }

  const handleVerifyDocument = (docId) => {
    setSupplierDocuments(prev => ({
      ...prev,
      [selectedSupplier.id]: prev[selectedSupplier.id].map(doc =>
        doc.id === docId ? { ...doc, verified: true } : doc
      )
    }))
    showNotification('Document verified successfully!', 'success')
  }

  const handleDownloadDocument = (documentData) => {
    try {
      showNotification(`Downloading "${documentData.name}"...`, 'info')
      
      if (documentData.file) {
        const url = window.URL.createObjectURL(documentData.file)
        const link = document.createElement('a')
        link.href = url
        link.download = documentData.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        showNotification(`"${documentData.name}" downloaded!`, 'success')
      }
    } catch (error) {
      showNotification('Failed to download document.', 'error')
    }
  }

  return (
    <div className="supplier-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-main">Supplier Management</h1>
          <p className="page-subtitle">Manage supplier accounts, verify documents, and approve onboarding</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelectedSupplier(null); setShowSupplierModal(true); }}>
          + Create New Supplier
        </button>
      </div>

      {/* Stats */}
      <div className="supplier-stats-grid">
        <div className="stat-card-sm">
          <div className="stat-icon-sm">🏭</div>
          <div>
            <h3>Total Suppliers</h3>
            <p className="stat-value-sm">{suppliers.length}</p>
            <span className="stat-label">{filteredSuppliers.length} shown</span>
          </div>
        </div>
        <div className="stat-card-sm">
          <div className="stat-icon-sm">✅</div>
          <div>
            <h3>Approved</h3>
            <p className="stat-value-sm">{suppliers.filter(s => s.verificationStatus === 'Approved').length}</p>
            <span className="stat-label">Verified suppliers</span>
          </div>
        </div>
        <div className="stat-card-sm">
          <div className="stat-icon-sm">⏳</div>
          <div>
            <h3>Pending</h3>
            <p className="stat-value-sm">{suppliers.filter(s => s.verificationStatus === 'Pending').length}</p>
            <span className="stat-label">Awaiting approval</span>
          </div>
        </div>
        <div className="stat-card-sm">
          <div className="stat-icon-sm">🟢</div>
          <div>
            <h3>Active</h3>
            <p className="stat-value-sm">{suppliers.filter(s => s.status === 'Active').length}</p>
            <span className="stat-label">{suppliers.length > 0 ? Math.round((suppliers.filter(s => s.status === 'Active').length / suppliers.length) * 100) : 0}% active</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card filters-section">
        <div className="filters-grid">
          <input 
            type="text" 
            placeholder="Search by company, GST, contact, location..." 
            className="search-input-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option>All Categories</option>
            <option>Building Materials</option>
            <option>Cement & Concrete</option>
            <option>Steel & Metal</option>
            <option>Electrical</option>
            <option>Plumbing</option>
            <option>Paint</option>
            <option>Hardware</option>
          </select>
          <select 
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <select 
            className="filter-select"
            value={filterVerification}
            onChange={(e) => setFilterVerification(e.target.value)}
          >
            <option>Verification Status</option>
            <option>Approved</option>
            <option>Pending</option>
            <option>Rejected</option>
          </select>
          <button className="btn btn-outline clear-filters-btn" onClick={handleClearFilters}>
            Clear
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="card suppliers-table-card">
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact Person</th>
              <th>Category</th>
              <th>Material Type</th>
              <th>GST Number</th>
              <th>Location</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Docs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  {suppliers.length === 0 ? 'No suppliers yet. Click "Create New Supplier" to add your first supplier.' : 'No suppliers found matching your criteria'}
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>
                  <div className="supplier-cell">
                    <div className="supplier-avatar">
                      {supplier.companyName.charAt(0)}
                    </div>
                    <div>
                      <div className="supplier-name">{supplier.companyName}</div>
                      <div className="supplier-meta">{supplier.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div>
                    <div className="contact-name">{supplier.contactPerson}</div>
                    <div className="supplier-meta">{supplier.phone}</div>
                  </div>
                </td>
                <td>{supplier.category}</td>
                <td>{supplier.materialType || 'Various'}</td>
                <td><span className="gst-text">{supplier.gstNumber || 'N/A'}</span></td>
                <td>{supplier.location || 'N/A'}</td>
                <td>
                  <span className={`status-badge ${supplier.status === 'Active' ? 'status-success' : 'status-error'}`}>
                    {supplier.status}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${
                    supplier.verificationStatus === 'Approved' ? 'status-success' : 
                    supplier.verificationStatus === 'Pending' ? 'status-warning' : 
                    'status-error'
                  }`}>
                    {supplier.verificationStatus}
                  </span>
                </td>
                <td><span className="docs-count">{supplier.documents || 0}</span></td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn" title="View Details" onClick={() => handleViewDetails(supplier)}>👁️</button>
                    <button className="action-btn" title="Edit" onClick={() => handleEditSupplier(supplier)}>✏️</button>
                    {supplier.verificationStatus === 'Pending' && (
                      <>
                        <button className="action-btn" title="Approve" onClick={() => handleApproveSupplier(supplier.id)}>✅</button>
                        <button className="action-btn" title="Reject" onClick={() => handleRejectSupplier(supplier.id)}>❌</button>
                      </>
                    )}
                    <button className="action-btn" title={supplier.status === 'Active' ? 'Deactivate' : 'Activate'} onClick={() => supplier.status === 'Active' ? handleDeactivateSupplier(supplier.id) : handleActivateSupplier(supplier.id)}>
                      {supplier.status === 'Active' ? '⏸️' : '▶️'}
                    </button>
                    <button className="action-btn" title="Documents" onClick={() => handleManageDocuments(supplier)}>📄</button>
                    <button className="action-btn" title="Delete" onClick={() => handleDeleteSupplier(supplier.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Mobile Card View */}
        {filteredSuppliers.length === 0 ? (
          <div className="no-results-mobile">
            <p>{suppliers.length === 0 ? 'No suppliers yet. Click "Create New Supplier" to add your first supplier.' : 'No suppliers found'}</p>
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="supplier-card-mobile">
            <div className="supplier-card-header">
              <div className="supplier-cell">
                <div className="supplier-avatar">
                  {supplier.companyName.charAt(0)}
                </div>
                <div>
                  <div className="supplier-name">{supplier.companyName}</div>
                  <div className="supplier-meta">{supplier.email}</div>
                </div>
              </div>
              <div className="badges-group">
                <span className={`status-badge ${supplier.status === 'Active' ? 'status-success' : 'status-error'}`}>
                  {supplier.status}
                </span>
                <span className={`status-badge ${
                  supplier.verificationStatus === 'Approved' ? 'status-success' : 
                  supplier.verificationStatus === 'Pending' ? 'status-warning' : 
                  'status-error'
                }`}>
                  {supplier.verificationStatus}
                </span>
              </div>
            </div>
            
            <div className="supplier-card-body">
              <div className="card-info-row">
                <span className="card-label">👤 Contact:</span>
                <span>{supplier.contactPerson}</span>
              </div>
              <div className="card-info-row">
                <span className="card-label">📞 Phone:</span>
                <span>{supplier.phone}</span>
              </div>
              <div className="card-info-row">
                <span className="card-label">🏢 Category:</span>
                <span>{supplier.category}</span>
              </div>
              <div className="card-info-row">
                <span className="card-label">📦 Material:</span>
                <span>{supplier.materialType || 'Various'}</span>
              </div>
              <div className="card-info-row">
                <span className="card-label">📋 GST:</span>
                <span>{supplier.gstNumber || 'N/A'}</span>
              </div>
              <div className="card-info-row">
                <span className="card-label">📍 Location:</span>
                <span>{supplier.location || 'N/A'}</span>
              </div>
              <div className="card-info-row">
                <span className="card-label">📄 Docs:</span>
                <span className="docs-count">{supplier.documents || 0}</span>
              </div>
            </div>

            <div className="supplier-card-actions">
              <button className="btn btn-outline" onClick={() => handleViewDetails(supplier)}>👁️ View</button>
              <button className="btn btn-primary" onClick={() => handleEditSupplier(supplier)}>✏️ Edit</button>
            </div>
            
            {supplier.verificationStatus === 'Pending' && (
              <div className="supplier-card-actions" style={{ marginTop: '8px' }}>
                <button className="btn btn-success" onClick={() => handleApproveSupplier(supplier.id)}>✅ Approve</button>
                <button className="btn btn-warning" onClick={() => handleRejectSupplier(supplier.id)}>❌ Reject</button>
              </div>
            )}
            
            <div className="supplier-card-actions" style={{ marginTop: '8px' }}>
              {supplier.status === 'Active' ? (
                <button className="btn btn-warning" onClick={() => handleDeactivateSupplier(supplier.id)}>⏸️ Deactivate</button>
              ) : (
                <button className="btn btn-success" onClick={() => handleActivateSupplier(supplier.id)}>▶️ Activate</button>
              )}
              <button className="btn btn-outline" onClick={() => handleManageDocuments(supplier)}>📄 Documents</button>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Supplier Details Modal */}
      {showDetailsModal && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Supplier Details</h2>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="supplier-profile-section">
                <div className="profile-avatar-large">{selectedSupplier.companyName.charAt(0)}</div>
                <h3>{selectedSupplier.companyName}</h3>
                <div className="badges-group">
                  <span className={`status-badge ${selectedSupplier.status === 'Active' ? 'status-success' : 'status-error'}`}>
                    {selectedSupplier.status}
                  </span>
                  <span className={`status-badge ${
                    selectedSupplier.verificationStatus === 'Approved' ? 'status-success' : 
                    selectedSupplier.verificationStatus === 'Pending' ? 'status-warning' : 
                    'status-error'
                  }`}>
                    {selectedSupplier.verificationStatus}
                  </span>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <label>Contact Person</label>
                  <p>{selectedSupplier.contactPerson}</p>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <p>{selectedSupplier.email}</p>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <p>{selectedSupplier.phone}</p>
                </div>
                <div className="detail-item">
                  <label>Category</label>
                  <p>{selectedSupplier.category}</p>
                </div>
                <div className="detail-item">
                  <label>Material Type</label>
                  <p>{selectedSupplier.materialType || 'Various'}</p>
                </div>
                <div className="detail-item">
                  <label>Location</label>
                  <p>{selectedSupplier.location || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>GST Number</label>
                  <p>{selectedSupplier.gstNumber || 'Not Provided'}</p>
                </div>
                <div className="detail-item">
                  <label>PAN Number</label>
                  <p>{selectedSupplier.panNumber || 'Not Provided'}</p>
                </div>
                <div className="detail-item">
                  <label>Join Date</label>
                  <p>{selectedSupplier.joinDate}</p>
                </div>
                <div className="detail-item">
                  <label>Documents</label>
                  <p>{selectedSupplier.documents || 0} uploaded</p>
                </div>
              </div>

              {selectedSupplier.address && (
                <div className="address-section">
                  <label>Address</label>
                  <p>{selectedSupplier.address}</p>
                </div>
              )}

              <div className="account-actions-section">
                <h4>Supplier Actions</h4>
                <div className="account-actions-grid">
                  {selectedSupplier.verificationStatus === 'Pending' && (
                    <>
                      <button className="btn btn-success" onClick={() => { setShowDetailsModal(false); handleApproveSupplier(selectedSupplier.id); }}>
                        ✅ Approve
                      </button>
                      <button className="btn btn-warning" onClick={() => { setShowDetailsModal(false); handleRejectSupplier(selectedSupplier.id); }}>
                        ❌ Reject
                      </button>
                    </>
                  )}
                  {selectedSupplier.status === 'Active' ? (
                    <button className="btn btn-warning" onClick={() => { setShowDetailsModal(false); handleDeactivateSupplier(selectedSupplier.id); }}>
                      ⏸️ Deactivate
                    </button>
                  ) : (
                    <button className="btn btn-success" onClick={() => { setShowDetailsModal(false); handleActivateSupplier(selectedSupplier.id); }}>
                      ▶️ Activate
                    </button>
                  )}
                  <button className="btn btn-outline" onClick={() => { setShowDetailsModal(false); handleManageDocuments(selectedSupplier); }}>
                    📄 Verify Documents
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowDetailsModal(false)}>Close</button>
                <button className="btn btn-primary" onClick={() => { setShowDetailsModal(false); handleEditSupplier(selectedSupplier); }}>Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showSupplierModal && (
        <div className="modal-overlay" onClick={() => setShowSupplierModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedSupplier ? 'Edit Supplier' : 'Create New Supplier'}</h2>
              <button className="close-btn" onClick={() => setShowSupplierModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form className="supplier-form" onSubmit={handleSaveSupplier}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input type="text" name="companyName" placeholder="Company name" defaultValue={selectedSupplier?.companyName} required />
                  </div>
                  <div className="form-group">
                    <label>Contact Person *</label>
                    <input type="text" name="contactPerson" placeholder="Contact person" defaultValue={selectedSupplier?.contactPerson} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" name="email" placeholder="company@example.com" defaultValue={selectedSupplier?.email} required />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input type="tel" name="phone" placeholder="Phone number" defaultValue={selectedSupplier?.phone} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select name="category" defaultValue={selectedSupplier?.category || ''} required>
                      <option value="">Select Category</option>
                      <option>Building Materials</option>
                      <option>Cement & Concrete</option>
                      <option>Steel & Metal</option>
                      <option>Electrical</option>
                      <option>Plumbing</option>
                      <option>Paint</option>
                      <option>Hardware</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Material Type</label>
                    <input type="text" name="materialType" placeholder="e.g., TMT Bars" defaultValue={selectedSupplier?.materialType} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>GST Number *</label>
                    <input type="text" name="gstNumber" placeholder="22AAAAA0000A1Z5" defaultValue={selectedSupplier?.gstNumber} required />
                  </div>
                  <div className="form-group">
                    <label>PAN Number</label>
                    <input type="text" name="panNumber" placeholder="AAAAA0000A" defaultValue={selectedSupplier?.panNumber} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Location *</label>
                    <input type="text" name="location" placeholder="City, State" defaultValue={selectedSupplier?.location} required />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" defaultValue={selectedSupplier?.status || 'Inactive'}>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea name="address" rows="3" placeholder="Full address" defaultValue={selectedSupplier?.address || ''}></textarea>
                </div>

                {!selectedSupplier && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Password *</label>
                      <input type="password" name="password" placeholder="Password" required />
                    </div>
                    <div className="form-group">
                      <label>Confirm Password *</label>
                      <input type="password" name="confirmPassword" placeholder="Confirm password" required />
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowSupplierModal(false); setSelectedSupplier(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{selectedSupplier ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setShowDocumentsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Verify Documents - {selectedSupplier.companyName}</h2>
              <button className="close-btn" onClick={() => setShowDocumentsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="documents-summary">
                <p className="summary-text">Company: <strong>{selectedSupplier.companyName}</strong></p>
                <p className="summary-text">Verification: <strong>{selectedSupplier.verificationStatus}</strong></p>
                <p className="summary-text">Documents: <strong>{selectedSupplier.documents || 0} uploaded</strong></p>
              </div>

              <h3 className="section-title">Upload Document</h3>
              <form className="document-form" onSubmit={handleUploadDocument}>
                <div className="form-group">
                  <label>Document Type *</label>
                  <select name="documentType" required>
                    <option value="">Select Type</option>
                    <option>GST Certificate</option>
                    <option>PAN Card</option>
                    <option>Company Registration</option>
                    <option>Trade License</option>
                    <option>Quality Certificate</option>
                    <option>ISO Certificate</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Upload File *</label>
                  <input type="file" name="document" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" required className="file-input" />
                  <small>PDF, DOC, DOCX, JPG, PNG (Max 10MB)</small>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowDocumentsModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Upload</button>
                </div>
              </form>

              <h3 className="section-title" style={{ marginTop: '30px' }}>Uploaded Documents</h3>
              <div className="documents-list">
                {supplierDocuments[selectedSupplier.id] && supplierDocuments[selectedSupplier.id].length > 0 ? (
                  supplierDocuments[selectedSupplier.id].map((doc) => (
                    <div key={doc.id} className="document-item">
                      <div className="document-icon">📄</div>
                      <div className="document-info">
                        <div className="document-name">{doc.name}</div>
                        <div className="document-meta">{doc.uploadDate} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      <div className="document-actions-group">
                        {!doc.verified && (
                          <button className="action-btn verify-btn" onClick={() => handleVerifyDocument(doc.id)} title="Verify">✅</button>
                        )}
                        {doc.verified && <span className="verified-badge">✓ Verified</span>}
                        <button className="action-btn download-btn" onClick={() => handleDownloadDocument(doc)} title="Download">⬇️</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-documents">No documents uploaded yet.</p>
                )}
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

export default SupplierManagement

