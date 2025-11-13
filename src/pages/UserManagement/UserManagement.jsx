import { useState, useMemo, useEffect } from 'react'
import './UserManagement.css'
import { 
  Users, 
  CheckCircle, 
  PauseCircle, 
  Ticket, 
  Eye, 
  Pencil, 
  PlayCircle, 
  Key, 
  FileText, 
  Bell, 
  Trash2, 
  Download,
  Image as ImageIcon,
  File,
  Phone,
  Building,
  Home,
  DollarSign,
  MapPin,
  Check,
  Mail
} from 'lucide-react'

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api'

function UserManagement() {
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  
  // Form Validation States
  const [formErrors, setFormErrors] = useState({})
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProject, setFilterProject] = useState('All Projects')
  const [filterStatus, setFilterStatus] = useState('All Status')
  const [filterPayment, setFilterPayment] = useState('Payment Status')
  const [notification, setNotification] = useState(null)

  // Users State
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Projects and Brokers State
  const [projects, setProjects] = useState([])
  const [brokers, setBrokers] = useState([])
  
  // Store uploaded documents with their file data
  const [userDocuments, setUserDocuments] = useState(() => {
    const savedDocs = localStorage.getItem('legacy-admin-documents')
    return savedDocs ? JSON.parse(savedDocs) : {}
  })

  // Fetch projects and brokers
  useEffect(() => {
    const fetchProjectsAndBrokers = async () => {
      try {
        // Fetch projects
        const projectsResponse = await fetch(`${API_BASE_URL}/projects`)
        const projectsData = await projectsResponse.json()
        if (projectsData.success) {
          setProjects(projectsData.data || [])
          console.log('Projects loaded:', projectsData.data?.length || 0)
        } else {
          console.error('Failed to load projects:', projectsData.error)
        }

        // Fetch brokers
        const brokersResponse = await fetch(`${API_BASE_URL}/brokers`)
        const brokersData = await brokersResponse.json()
        if (brokersData.success) {
          setBrokers(brokersData.data || [])
          console.log('Brokers loaded:', brokersData.data?.length || 0)
        } else {
          console.error('Failed to load brokers:', brokersData.error)
        }
      } catch (err) {
        console.error('Error fetching projects/brokers:', err)
        // Note: showNotification is defined later, so we'll just log for now
        // The error will be visible in console
      }
    }

    fetchProjectsAndBrokers()
  }, [])

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        // Fetch users with properties included
        const response = await fetch(`${API_BASE_URL}/users?includeProperties=true`)
        const data = await response.json()
        
        if (data.success && data.data) {
          // Map backend user data to frontend format
          const mappedUsers = data.data.map(user => {
            // Get first property if available
            const firstProperty = user.properties && user.properties.length > 0 ? user.properties[0] : null
            
            return {
              id: user._id || user.id,
              name: user.name || 'N/A',
              email: user.email || 'N/A',
              phone: user.phone || 'N/A',
              status: 'Active', // Default status, can be updated later
              project: firstProperty?.projectName || 'N/A',
              property: firstProperty ? `${firstProperty.flatNo}${firstProperty.buildingName ? ` - ${firstProperty.buildingName}` : ''}` : 'N/A',
              propertyId: firstProperty?.id || null,
              projectId: firstProperty?.projectId || null,
              brokerId: firstProperty?.brokerId || null,
              broker: firstProperty?.brokerName ? `${firstProperty.brokerName}${firstProperty.brokerCompany ? ` (${firstProperty.brokerCompany})` : ''}` : 'N/A',
              address: user.address ? 
                `${user.address.line1 || ''} ${user.address.line2 || ''} ${user.address.city || ''} ${user.address.state || ''} ${user.address.pincode || ''}`.trim() 
                : '',
              paymentStatus: 'Up to Date', // Default, should be fetched from payments
              joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              documents: 0, // Should be fetched from documents
              tickets: 0, // Should be fetched from tickets
              role: user.role || 'user',
              properties: user.properties || [] // Store all properties
            }
          })
          setUsers(mappedUsers)
        } else {
          setError('Failed to fetch users')
          setUsers([])
        }
      } catch (err) {
        console.error('Error fetching users:', err)
        setError('Failed to load users. Please check if the backend server is running.')
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Save documents to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('legacy-admin-documents', JSON.stringify(userDocuments))
  }, [userDocuments])

  // Filtered and Searched Users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.includes(searchQuery) ||
        user.project.toLowerCase().includes(searchLower) ||
        user.property.toLowerCase().includes(searchLower)

      // Project filter
      const matchesProject = 
        filterProject === 'All Projects' || user.project === filterProject

      // Status filter
      const matchesStatus = 
        filterStatus === 'All Status' || user.status === filterStatus

      // Payment filter
      const matchesPayment = 
        filterPayment === 'Payment Status' || user.paymentStatus === filterPayment

      return matchesSearch && matchesProject && matchesStatus && matchesPayment
    })
  }, [users, searchQuery, filterProject, filterStatus, filterPayment])

  const handleViewDetails = (user) => {
    setSelectedUser(user)
    setShowDetailsModal(true)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSaveUser = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    // Validate form
    const errors = validateForm(formData, !selectedUser)
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      showNotification('Please fix the validation errors', 'error')
      return
    }
    
    // Clear errors if validation passes
    setFormErrors({})
    
    try {
      const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password') || undefined,
        role: 'user',
        address: formData.get('address') ? {
          line1: formData.get('address'),
          city: '',
          state: '',
          pincode: ''
        } : undefined
      }

      let userId
      let response
      if (selectedUser) {
        // Update existing user
        userId = selectedUser.id
        response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        })
      } else {
        // Create new user
        if (!formData.get('password')) {
          showNotification('Password is required for new users', 'error')
          return
        }
        response = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        })
      }

      const data = await response.json()
      
      if (data.success) {
        userId = userId || data.data._id || data.data.id
        
        // Assign user to property if project and property data provided
        const projectId = formData.get('projectId')
        const flatNo = formData.get('flatNo')
        const brokerId = formData.get('brokerId') || null
        
        if (projectId && flatNo) {
          const propertyData = {
            flatNo: flatNo,
            buildingName: formData.get('buildingName') || undefined,
            location: formData.get('address') ? {
              address: formData.get('address')
            } : undefined,
            specifications: {
              area: formData.get('area') ? parseFloat(formData.get('area')) : undefined,
              bedrooms: formData.get('bedrooms') ? parseInt(formData.get('bedrooms')) : undefined,
              bathrooms: formData.get('bathrooms') ? parseInt(formData.get('bathrooms')) : undefined
            },
            pricing: {
              totalPrice: formData.get('totalPrice') ? parseFloat(formData.get('totalPrice')) : undefined,
              bookingAmount: formData.get('bookingAmount') ? parseFloat(formData.get('bookingAmount')) : undefined
            }
          }

          try {
            const assignResponse = await fetch(`${API_BASE_URL}/users/${userId}/assign-property`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
              },
              body: JSON.stringify({
                projectId,
                propertyData,
                brokerId: brokerId || undefined
              })
            })

            const assignData = await assignResponse.json()
            if (!assignData.success) {
              console.error('Failed to assign property:', assignData.error)
              showNotification('User created but property assignment failed: ' + assignData.error, 'error')
            }
          } catch (assignErr) {
            console.error('Error assigning property:', assignErr)
            showNotification('User created but property assignment failed', 'error')
          }
        }
        
        // Refresh users list
        const fetchResponse = await fetch(`${API_BASE_URL}/users?includeProperties=true`)
        const fetchData = await fetchResponse.json()
        
        if (fetchData.success && fetchData.data) {
          const mappedUsers = fetchData.data.map(user => {
            // Get first property if available
            const firstProperty = user.properties && user.properties.length > 0 ? user.properties[0] : null
            
            return {
              id: user._id || user.id,
              name: user.name || 'N/A',
              email: user.email || 'N/A',
              phone: user.phone || 'N/A',
              status: 'Active',
              project: firstProperty?.projectName || 'N/A',
              property: firstProperty ? `${firstProperty.flatNo}${firstProperty.buildingName ? ` - ${firstProperty.buildingName}` : ''}` : 'N/A',
              propertyId: firstProperty?.id || null,
              projectId: firstProperty?.projectId || null,
              brokerId: firstProperty?.brokerId || null,
              broker: firstProperty?.brokerName ? `${firstProperty.brokerName}${firstProperty.brokerCompany ? ` (${firstProperty.brokerCompany})` : ''}` : 'N/A',
              address: user.address ? 
                `${user.address.line1 || ''} ${user.address.line2 || ''} ${user.address.city || ''} ${user.address.state || ''} ${user.address.pincode || ''}`.trim() 
                : '',
              paymentStatus: 'Up to Date',
              joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              documents: 0,
              tickets: 0,
              role: user.role || 'user',
              properties: user.properties || []
            }
          })
          setUsers(mappedUsers)
        }
        
        showNotification(selectedUser ? 'User updated successfully!' : 'User created successfully!', 'success')
        setShowUserModal(false)
        setSelectedUser(null)
      } else {
        showNotification(data.error || 'Failed to save user', 'error')
      }
    } catch (err) {
      console.error('Error saving user:', err)
      showNotification('Failed to save user. Please try again.', 'error')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          method: 'DELETE'
        })
        
        const data = await response.json()
        
        if (data.success) {
          // Remove user from local state
          setUsers(users.filter(u => u.id !== userId))
          showNotification('User deleted successfully!', 'success')
        } else {
          showNotification(data.error || 'Failed to delete user', 'error')
        }
      } catch (err) {
        console.error('Error deleting user:', err)
        showNotification('Failed to delete user. Please try again.', 'error')
      }
    }
  }

  const handleResetPassword = (user) => {
    showNotification(`Password reset link sent to ${user.email}`, 'info')
  }

  const handleToggleStatus = (userId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
    const action = newStatus === 'Active' ? 'activate' : 'deactivate'
    const user = users.find(u => u.id === userId)
    
    if (window.confirm(`Are you sure you want to ${action} ${user.name}'s account?`)) {
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, status: newStatus }
          : u
      ))
      showNotification(`User account ${action}d successfully!`, 'success')
    }
  }

  const handleActivateUser = (userId) => {
    const user = users.find(u => u.id === userId)
    if (window.confirm(`Activate ${user.name}'s account? They will regain access to the system.`)) {
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, status: 'Active' }
          : u
      ))
      showNotification(`${user.name}'s account has been activated!`, 'success')
    }
  }

  const handleDeactivateUser = (userId) => {
    const user = users.find(u => u.id === userId)
    if (window.confirm(`Deactivate ${user.name}'s account? They will lose access to the system.`)) {
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, status: 'Inactive' }
          : u
      ))
      showNotification(`${user.name}'s account has been deactivated!`, 'success')
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilterProject('All Projects')
    setFilterStatus('All Status')
    setFilterPayment('Payment Status')
    showNotification('Filters cleared!', 'info')
  }

  const handleManageDocuments = (user) => {
    setSelectedUser(user)
    setShowDocumentsModal(true)
  }

  const handleUploadDocument = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const documentType = formData.get('documentType')
    const documentTitle = formData.get('documentTitle')
    const file = formData.get('document')
    const description = formData.get('description')
    
    if (file && file.size > 0) {
      // Store the document with file data
      const documentData = {
        id: Date.now(),
        name: documentTitle || documentType,
        type: documentType,
        file: file,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        description: description,
        uploadDate: new Date().toLocaleString(),
        userId: selectedUser.id
      }
      
      // Update userDocuments state
      setUserDocuments(prev => ({
        ...prev,
        [selectedUser.id]: [...(prev[selectedUser.id] || []), documentData]
      }))
      
      // Update user's document count
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, documents: u.documents + 1 }
          : u
      ))
      
      showNotification(`${documentType} uploaded successfully!`, 'success')
      e.target.reset()
    }
  }

  const handleManageNotifications = (user) => {
    setSelectedUser(user)
    setShowNotificationsModal(true)
  }

  const handleSendNotification = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const title = formData.get('notificationTitle')
    const message = formData.get('notificationMessage')
    
    showNotification(`Notification "${title}" sent to ${selectedUser.name}!`, 'success')
    setShowNotificationsModal(false)
    setSelectedUser(null)
    e.target.reset()
  }

  const handleDownloadDocument = (documentData) => {
    try {
      showNotification(`Downloading "${documentData.name}"...`, 'info')
      
      // If the document has actual file data (uploaded file)
      if (documentData.file) {
        // Create a download link with the actual file
        const url = window.URL.createObjectURL(documentData.file)
        const link = document.createElement('a')
        link.href = url
        link.download = documentData.fileName || documentData.name
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        window.URL.revokeObjectURL(url)
        showNotification(`"${documentData.name}" downloaded successfully!`, 'success')
      } else {
        // For sample/demo documents, create a sample PDF-like content
        const mimeType = documentData.fileType || 'application/pdf'
        const extension = documentData.fileName ? documentData.fileName.split('.').pop() : 'pdf'
        
        // Create sample content based on file type
        let blob
        if (mimeType.includes('pdf') || extension === 'pdf') {
          // Create a simple PDF structure
          const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
50 700 Td
(${documentData.name}) Tj
0 -20 Td
(User: ${selectedUser?.name || 'N/A'}) Tj
0 -20 Td
(Date: ${new Date().toLocaleString()}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
466
%%EOF`
          blob = new Blob([pdfContent], { type: 'application/pdf' })
        } else {
          // For other file types, create text content
          const textContent = `Document: ${documentData.name}
User: ${selectedUser?.name || 'N/A'}
Email: ${selectedUser?.email || 'N/A'}
Date: ${new Date().toLocaleString()}

This is a sample document for demonstration purposes.`
          blob = new Blob([textContent], { type: mimeType })
        }
        
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${documentData.name.replace(/\s+/g, '_')}.${extension}`
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        window.URL.revokeObjectURL(url)
        showNotification(`"${documentData.name}" downloaded successfully!`, 'success')
      }
    } catch (error) {
      console.error('Download error:', error)
      showNotification('Failed to download document. Please try again.', 'error')
    }
  }

  return (
    <div className="user-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-main">User Management (Buyers)</h1>
          <p className="page-subtitle">Manage all buyer accounts and their details</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelectedUser(null); setShowUserModal(true); }}>
          + Create New User
        </button>
      </div>

      {/* Stats Overview */}
      <div className="user-stats-grid">
        <div className="stat-card-um">
          <div className="stat-icon-um"><Users size={24} /></div>
          <div>
            <h3>Total Users</h3>
            <p className="stat-value-um">{users.length}</p>
            <span className="stat-label">{filteredUsers.length} shown</span>
          </div>
        </div>
        <div className="stat-card-um">
          <div className="stat-icon-um"><CheckCircle size={24} /></div>
          <div>
            <h3>Active Users</h3>
            <p className="stat-value-um">{users.filter(u => u.status === 'Active').length}</p>
            <span className="stat-label">{users.length > 0 ? Math.round((users.filter(u => u.status === 'Active').length / users.length) * 100) : 0}% active rate</span>
          </div>
        </div>
        <div className="stat-card-um">
          <div className="stat-icon-um"><PauseCircle size={24} /></div>
          <div>
            <h3>Inactive Users</h3>
            <p className="stat-value-um">{users.filter(u => u.status === 'Inactive').length}</p>
            <span className="stat-label">{users.length > 0 ? Math.round((users.filter(u => u.status === 'Inactive').length / users.length) * 100) : 0}% inactive</span>
          </div>
        </div>
        <div className="stat-card-um">
          <div className="stat-icon-um"><Ticket size={24} /></div>
          <div>
            <h3>Open Tickets</h3>
            <p className="stat-value-um">{users.reduce((sum, u) => sum + u.tickets, 0)}</p>
            <span className="stat-label">From {users.filter(u => u.tickets > 0).length} users</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card filters-section">
        <div className="filters-grid">
          <input 
            type="text" 
            placeholder="Search by name, email, phone..." 
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
            <option>Legacy Heights</option>
            <option>Legacy Gardens</option>
            <option>Legacy Towers</option>
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
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
          >
            <option>Payment Status</option>
            <option>Up to Date</option>
            <option>Pending</option>
            <option>Overdue</option>
          </select>
          <button className="btn btn-outline clear-filters-btn" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card users-table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>Loading users...</p>
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
        <table className="users-table-um">
          <thead>
            <tr>
              <th>User Details</th>
              <th>Contact</th>
              <th>Project / Property</th>
              <th>Broker</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Documents</th>
              <th>Tickets</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  {users.length === 0 ? 'No users yet. Click "Create New User" to add your first user.' : 'No users found matching your criteria'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell-um">
                    <div className="user-avatar-um">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="user-name-um">{user.name}</div>
                      <div className="user-meta">Joined: {user.joinDate}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div>{user.email}</div>
                    <div className="user-meta">{user.phone}</div>
                  </div>
                </td>
                <td>
                  <div>
                    <div className="project-name">{user.project}</div>
                    <div className="user-meta">{user.property}</div>
                  </div>
                </td>
                <td>
                  <div>
                    {user.broker !== 'N/A' ? (
                      <div className="broker-name">{user.broker}</div>
                    ) : (
                      <span className="no-broker">No Broker</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${user.status === 'Active' ? 'status-success' : 'status-error'}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <span className={`payment-badge ${
                    user.paymentStatus === 'Up to Date' ? 'payment-success' : 
                    user.paymentStatus === 'Pending' ? 'payment-warning' : 
                    'payment-error'
                  }`}>
                    {user.paymentStatus}
                  </span>
                </td>
                <td>
                  <span className="docs-count">{user.documents} docs</span>
                </td>
                <td>
                  <span className="tickets-count">{user.tickets}</span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="action-btn-um" 
                      title="View Details"
                      onClick={() => handleViewDetails(user)}
                    >
                      View
                    </button>
                    <button 
                      className="action-btn-um" 
                      title="Edit User"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </button>
                    <button 
                      className="action-btn-um" 
                      title={user.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                      onClick={() => handleToggleStatus(user.id, user.status)}
                    >
                      {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      className="action-btn-um" 
                      title="Reset Password"
                      onClick={() => handleResetPassword(user)}
                    >
                      Reset
                    </button>
                    <button 
                      className="action-btn-um" 
                      title="Manage Documents"
                      onClick={() => handleManageDocuments(user)}
                    >
                      Docs
                    </button>
                    <button 
                      className="action-btn-um" 
                      title="Manage Notifications"
                      onClick={() => handleManageNotifications(user)}
                    >
                      Notify
                    </button>
                    <button 
                      className="action-btn-um" 
                      title="Delete User"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
        )}

        {/* Mobile Card View */}
        {!loading && !error && (
          filteredUsers.length === 0 ? (
            <div className="no-results-mobile">
              <p>{users.length === 0 ? 'No users yet. Click "Create New User" to add your first user.' : 'No users found matching your criteria'}</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
          <div key={user.id} className="user-card-mobile">
            <div className="user-card-header">
              <div className="user-cell-um">
                <div className="user-avatar-um">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="user-name-um">{user.name}</div>
                  <div className="user-meta">{user.email}</div>
                </div>
              </div>
              <span className={`status-badge ${user.status === 'Active' ? 'status-success' : 'status-error'}`}>
                {user.status}
              </span>
            </div>
            
            <div className="user-card-body">
              <div className="card-info-row">
                <span className="card-label">Phone:</span>
                <span>{user.phone}</span>
              </div>
              <div className="card-info-row">
                <span className="card-label">Project:</span>
                <span>{user.project}</span>
              </div>
              <div className="card-info-row">
                <span className="card-label">Property:</span>
                <span>{user.property}</span>
              </div>
              <div className="card-info-row">
                <span className="card-label">Broker:</span>
                <span>{user.broker !== 'N/A' ? user.broker : 'No Broker'}</span>
              </div>
              <div className="card-info-row">
                <span className="card-label">Payment:</span>
                <span className={`payment-badge ${
                  user.paymentStatus === 'Up to Date' ? 'payment-success' : 
                  user.paymentStatus === 'Pending' ? 'payment-warning' : 
                  'payment-error'
                }`}>
                  {user.paymentStatus}
                </span>
              </div>
              <div className="card-info-row">
                <span className="card-label">Documents:</span>
                <span className="docs-count">{user.documents} docs</span>
              </div>
              <div className="card-info-row">
                <span className="card-label">Tickets:</span>
                <span className="tickets-count">{user.tickets}</span>
              </div>
              {user.address && (
                <div className="card-info-row">
                  <span className="card-label">Address:</span>
                  <span>{user.address}</span>
                </div>
              )}
            </div>

            <div className="user-card-actions">
              <button 
                className="btn btn-outline"
                onClick={() => handleViewDetails(user)}
              >
                <Eye size={16} style={{ marginRight: '4px' }} /> View
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleEditUser(user)}
              >
                <Pencil size={16} style={{ marginRight: '4px' }} /> Edit
              </button>
            </div>
            <div className="user-card-actions" style={{ marginTop: '8px' }}>
              {user.status === 'Active' ? (
                <button 
                  className="btn btn-warning"
                  onClick={() => handleDeactivateUser(user.id)}
                >
                  <PauseCircle size={16} style={{ marginRight: '4px' }} /> Deactivate
                </button>
              ) : (
                <button 
                  className="btn btn-success"
                  onClick={() => handleActivateUser(user.id)}
                >
                  <PlayCircle size={16} style={{ marginRight: '4px' }} /> Activate
                </button>
              )}
              <button 
                className="btn btn-outline"
                onClick={() => handleManageDocuments(user)}
              >
                <FileText size={16} style={{ marginRight: '4px' }} /> Documents
              </button>
            </div>
            <div className="user-card-actions" style={{ marginTop: '8px' }}>
              <button 
                className="btn btn-outline"
                onClick={() => handleManageNotifications(user)}
              >
                <Bell size={16} style={{ marginRight: '4px' }} /> Notify
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => handleResetPassword(user)}
              >
                <Key size={16} style={{ marginRight: '4px' }} /> Reset Password
              </button>
            </div>
          </div>
            ))
          )
        )}
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Profile Details</h2>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="user-profile-section">
                <div className="profile-avatar-large">
                  {selectedUser.name.charAt(0)}
                </div>
                <h3>{selectedUser.name}</h3>
                <span className={`status-badge ${selectedUser.status === 'Active' ? 'status-success' : 'status-error'}`}>
                  {selectedUser.status}
                </span>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <label>Email</label>
                  <p>{selectedUser.email}</p>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <p>{selectedUser.phone}</p>
                </div>
                <div className="detail-item">
                  <label>Project</label>
                  <p>{selectedUser.project}</p>
                </div>
                <div className="detail-item">
                  <label>Property</label>
                  <p>{selectedUser.property}</p>
                </div>
                <div className="detail-item">
                  <label>Broker</label>
                  <p>{selectedUser.broker !== 'N/A' ? selectedUser.broker : 'No Broker Assigned'}</p>
                </div>
                <div className="detail-item">
                  <label>Payment Status</label>
                  <p>{selectedUser.paymentStatus}</p>
                </div>
                <div className="detail-item">
                  <label>Join Date</label>
                  <p>{selectedUser.joinDate}</p>
                </div>
                <div className="detail-item">
                  <label>Documents</label>
                  <p>{selectedUser.documents} uploaded</p>
                </div>
                <div className="detail-item">
                  <label>Support Tickets</label>
                  <p>{selectedUser.tickets} open</p>
                </div>
              </div>

              {selectedUser.address && (
                <div className="address-section">
                  <label>Address</label>
                  <p>{selectedUser.address}</p>
                </div>
              )}

              <div className="account-actions-section">
                <h4>Account Actions</h4>
                <div className="account-actions-grid">
                  {selectedUser.status === 'Active' ? (
                    <button 
                      className="btn btn-warning"
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleDeactivateUser(selectedUser.id);
                      }}
                    >
                      <PauseCircle size={16} style={{ marginRight: '4px' }} /> Deactivate Account
                    </button>
                  ) : (
                    <button 
                      className="btn btn-success"
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleActivateUser(selectedUser.id);
                      }}
                    >
                      <PlayCircle size={16} style={{ marginRight: '4px' }} /> Activate Account
                    </button>
                  )}
                  <button 
                    className="btn btn-outline"
                    onClick={() => handleResetPassword(selectedUser)}
                  >
                    <Key size={16} style={{ marginRight: '4px' }} /> Reset Password
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleManageDocuments(selectedUser);
                    }}
                  >
                    <FileText size={16} style={{ marginRight: '4px' }} /> Manage Documents
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleManageNotifications(selectedUser);
                    }}
                  >
                    <Bell size={16} style={{ marginRight: '4px' }} /> Send Notification
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowDetailsModal(false)}>Close</button>
                <button className="btn btn-primary" onClick={() => { setShowDetailsModal(false); handleEditUser(selectedUser); }}>Edit User</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedUser ? 'Edit User' : 'Create New User'}</h2>
              <button className="close-btn" onClick={() => { setShowUserModal(false); setFormErrors({}); }}>×</button>
            </div>
            <div className="modal-body">
              <form className="user-form" onSubmit={handleSaveUser}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input 
                      type="text" 
                      name="name"
                      placeholder="Enter full name" 
                      defaultValue={selectedUser?.name}
                      minLength="3"
                      pattern="[a-zA-Z\s]+"
                      title="Name can only contain letters and spaces"
                      required 
                      className={formErrors.name ? 'error' : ''}
                    />
                    {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input 
                      type="email"
                      name="email" 
                      placeholder="Enter email" 
                      defaultValue={selectedUser?.email}
                      pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                      title="Please enter a valid email address"
                      required 
                      className={formErrors.email ? 'error' : ''}
                    />
                    {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input 
                      type="tel"
                      name="phone" 
                      placeholder="Enter phone number" 
                      defaultValue={selectedUser?.phone}
                      pattern="[6-9][0-9]{9}"
                      maxLength="10"
                      title="Please enter a valid 10-digit Indian mobile number starting with 6-9"
                      required 
                      className={formErrors.phone ? 'error' : ''}
                    />
                    {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select 
                      name="status"
                      defaultValue={selectedUser?.status || 'Active'}
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Property Assignment Section */}
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #e0e0e0' }}>
                  <h3 style={{ marginBottom: '16px', color: '#2A669B', fontSize: '18px', fontWeight: '600' }}>
                    Property Assignment
                  </h3>
                  <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
                    Assign this user to a property/project. This will allow them to view project details, documents, and payment schedules.
                  </p>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Assign Project *</label>
                      <select 
                        name="projectId"
                        defaultValue={selectedUser?.projectId || ''}
                        required
                      >
                        <option value="">Select Project</option>
                        {projects.length > 0 ? (
                          projects.map(project => (
                            <option key={project._id || project.id} value={project._id || project.id}>
                              {project.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No projects available. Please create a project first.</option>
                        )}
                      </select>
                      {projects.length === 0 && (
                        <small style={{ color: '#e74c3c', display: 'block', marginTop: '4px' }}>
                          No projects found. Projects need to be created first.
                        </small>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Flat/Unit Number *</label>
                      <input 
                        type="text"
                        name="flatNo" 
                        placeholder="e.g., A-1203" 
                        defaultValue={selectedUser?.flatNo}
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Building Name</label>
                      <input 
                        type="text"
                        name="buildingName" 
                        placeholder="e.g., Tower A" 
                        defaultValue={selectedUser?.buildingName}
                      />
                    </div>
                    <div className="form-group">
                      <label>Assign Broker (Optional)</label>
                      <select 
                        name="brokerId"
                        defaultValue={selectedUser?.brokerId || ''}
                      >
                        <option value="">No Broker</option>
                        {brokers.length > 0 ? (
                          brokers.map(broker => (
                            <option key={broker._id || broker.id} value={broker._id || broker.id}>
                              {broker.name} {broker.company ? `- ${broker.company}` : ''}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No brokers available</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Area (sqft)</label>
                      <input 
                        type="number"
                        name="area" 
                        placeholder="e.g., 1200" 
                        defaultValue={selectedUser?.area}
                        step="0.01"
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Price (INR)</label>
                      <input 
                        type="number"
                        name="totalPrice" 
                        placeholder="e.g., 5000000" 
                        defaultValue={selectedUser?.totalPrice}
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Bedrooms</label>
                      <input 
                        type="number"
                        name="bedrooms" 
                        placeholder="e.g., 2" 
                        defaultValue={selectedUser?.bedrooms}
                      />
                    </div>
                    <div className="form-group">
                      <label>Bathrooms</label>
                      <input 
                        type="number"
                        name="bathrooms" 
                        placeholder="e.g., 2" 
                        defaultValue={selectedUser?.bathrooms}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Booking Amount (INR)</label>
                      <input 
                        type="number"
                        name="bookingAmount" 
                        placeholder="e.g., 500000" 
                        defaultValue={selectedUser?.bookingAmount}
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea 
                    name="address"
                    rows="3" 
                    placeholder="Enter full address"
                    defaultValue={selectedUser?.address || ''}
                  ></textarea>
                </div>

                {!selectedUser && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Password *</label>
                      <input 
                        type="password"
                        name="password" 
                        placeholder="Enter password"
                        minLength="8"
                        title="Password must be at least 8 characters with uppercase, lowercase, and number"
                        required 
                        className={formErrors.password ? 'error' : ''}
                      />
                      {formErrors.password && <span className="error-message">{formErrors.password}</span>}
                      <small style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                        Min 8 characters with uppercase, lowercase, and number
                      </small>
                    </div>
                    <div className="form-group">
                      <label>Confirm Password *</label>
                      <input 
                        type="password"
                        name="confirmPassword" 
                        placeholder="Confirm password"
                        required 
                        className={formErrors.confirmPassword ? 'error' : ''}
                      />
                      {formErrors.confirmPassword && <span className="error-message">{formErrors.confirmPassword}</span>}
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowUserModal(false); setSelectedUser(null); setFormErrors({}); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {selectedUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Documents Management Modal */}
      {showDocumentsModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDocumentsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Documents - {selectedUser.name}</h2>
              <button className="close-btn" onClick={() => setShowDocumentsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="documents-summary">
                <p className="summary-text">
                  Current Documents: <strong>{selectedUser.documents}</strong>
                </p>
                <p className="summary-text">
                  User Email: <strong>{selectedUser.email}</strong>
                </p>
              </div>

              <h3 className="section-title">Upload New Document</h3>
              <form className="document-form" onSubmit={handleUploadDocument}>
                <div className="form-group">
                  <label>Document Type *</label>
                  <select name="documentType" required>
                    <option value="">Select Document Type</option>
                    <option>Welcome Letter</option>
                    <option>Sale Agreement</option>
                    <option>Payment Receipt</option>
                    <option>Invoice</option>
                    <option>Floor Plan</option>
                    <option>Construction Update</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Document Title *</label>
                  <input 
                    type="text" 
                    name="documentTitle"
                    placeholder="e.g., Welcome Letter - 2024"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Upload File *</label>
                  <input 
                    type="file" 
                    name="document"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    required
                    className="file-input"
                  />
                  <small>Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</small>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    name="description"
                    rows="3"
                    placeholder="Add any notes or description about this document"
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowDocumentsModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Upload Document</button>
                </div>
              </form>

              <h3 className="section-title" style={{ marginTop: '30px' }}>Recent Documents</h3>
              <div className="recent-documents-list">
                {userDocuments[selectedUser.id] && userDocuments[selectedUser.id].length > 0 ? (
                  userDocuments[selectedUser.id].map((doc) => (
                    <div key={doc.id} className="document-item">
                      <div className="document-icon">
                        {doc.fileType?.includes('pdf') ? <FileText size={20} /> : 
                         doc.fileType?.includes('image') ? <ImageIcon size={20} /> : 
                         doc.fileType?.includes('word') ? <File size={20} /> : <FileText size={20} />}
                      </div>
                      <div className="document-info">
                        <div className="document-name">{doc.name}</div>
                        <div className="document-meta">
                          {doc.uploadDate} • {doc.fileType?.split('/')[1]?.toUpperCase() || 'FILE'} • 
                          {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <button 
                        className="action-btn-um download-btn"
                        onClick={() => handleDownloadDocument(doc)}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  ))
                ) : selectedUser.documents > 0 ? (
                  // Show sample documents for demo users
                  <>
                    <div className="document-item">
                      <div className="document-icon"><FileText size={20} /></div>
                      <div className="document-info">
                        <div className="document-name">Welcome Letter</div>
                        <div className="document-meta">Uploaded on {selectedUser.joinDate} • PDF • 2.3 MB</div>
                      </div>
                      <button 
                        className="action-btn-um download-btn"
                        onClick={() => handleDownloadDocument({
                          name: 'Welcome_Letter',
                          fileName: 'Welcome_Letter.pdf',
                          fileType: 'application/pdf'
                        })}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="no-documents">No documents uploaded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Management Modal */}
      {showNotificationsModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowNotificationsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Notification - {selectedUser.name}</h2>
              <button className="close-btn" onClick={() => setShowNotificationsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="documents-summary">
                <p className="summary-text">
                  User Email: <strong>{selectedUser.email}</strong>
                </p>
                <p className="summary-text">
                  Phone: <strong>{selectedUser.phone}</strong>
                </p>
              </div>

              <h3 className="section-title">Create New Notification</h3>
              <form className="notification-form" onSubmit={handleSendNotification}>
                <div className="form-group">
                  <label>Notification Type *</label>
                  <select name="notificationType" required>
                    <option value="">Select Type</option>
                    <option>Payment Reminder</option>
                    <option>Construction Update</option>
                    <option>Document Available</option>
                    <option>Meeting Scheduled</option>
                    <option>General Announcement</option>
                    <option>Urgent Alert</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notification Channel *</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input type="checkbox" name="channelApp" defaultChecked />
                      <span>Mobile App Push</span>
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" name="channelEmail" defaultChecked />
                      <span>Email</span>
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" name="channelSMS" />
                      <span>SMS</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notification Title *</label>
                  <input 
                    type="text" 
                    name="notificationTitle"
                    placeholder="e.g., Payment Due Reminder"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea 
                    name="notificationMessage"
                    rows="4"
                    placeholder="Enter your notification message here..."
                    required
                  ></textarea>
                  <small>Character count: 0/500</small>
                </div>

                <div className="form-group">
                  <label>Schedule</label>
                  <select name="schedule">
                    <option>Send Immediately</option>
                    <option>Schedule for Later</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowNotificationsModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Send Notification</button>
                </div>
              </form>

              <h3 className="section-title" style={{ marginTop: '30px' }}>Recent Notifications</h3>
              <div className="recent-notifications-list">
                <div className="notification-item">
                  <div className="notification-icon success"><Check size={16} /></div>
                  <div className="notification-info">
                    <div className="notification-title">Payment Received Confirmation</div>
                    <div className="notification-meta">Sent 2 days ago • Read</div>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-icon pending"><Mail size={16} /></div>
                  <div className="notification-info">
                    <div className="notification-title">Construction Progress Update</div>
                    <div className="notification-meta">Sent 5 days ago • Delivered</div>
                  </div>
                </div>
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

export default UserManagement

