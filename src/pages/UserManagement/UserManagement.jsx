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
  ExternalLink,
  Phone,
  Building,
  Home,
  DollarSign,
  MapPin,
  Check,
  Mail,
  MoreVertical,
  Plus,
  X,
  MoreHorizontal
} from 'lucide-react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api'

// Property Assignment Form Component
function PropertyAssignmentForm({ projects, properties, brokers, onAdd }) {
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [selectedBrokerId, setSelectedBrokerId] = useState('')

  const getFilteredProperties = () => {
    if (!selectedProjectId) return []
    return properties.filter(property => {
      const propProjectId = property.projectId || property.project?._id || property.project?.id
      const projectIdStr = typeof propProjectId === 'object' && propProjectId?._id 
        ? propProjectId._id.toString() 
        : propProjectId?.toString()
      return projectIdStr === selectedProjectId.toString()
    })
  }

  const handleAdd = () => {
    if (!selectedProjectId || !selectedPropertyId) {
      alert('Please select both project and property')
      return
    }
    onAdd({
      projectId: selectedProjectId,
      propertyId: selectedPropertyId,
      brokerId: selectedBrokerId || undefined
    })
    // Reset form
    setSelectedProjectId('')
    setSelectedPropertyId('')
    setSelectedBrokerId('')
  }

  return (
    <div>
      <div className="form-row">
        <div className="form-group">
          <label>Select Project *</label>
          <select 
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value)
              setSelectedPropertyId('')
            }}
          >
            <option value="">Select Project</option>
            {projects.map(project => (
              <option key={project._id || project.id} value={project._id || project.id}>
                {project.name} {project.location?.city ? ` - ${project.location.city}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Select Property *</label>
          <select 
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            disabled={!selectedProjectId}
          >
            <option value="">{selectedProjectId ? 'Select Property' : 'Select Project First'}</option>
            {getFilteredProperties().map(property => (
              <option key={property.id || property._id} value={property.id || property._id}>
                {property.flatNo} {property.buildingName ? `- ${property.buildingName}` : ''}
                {property.specifications?.area ? ` - ${property.specifications.area} sqft` : ''}
                {property.pricing?.totalPrice ? ` - ₹${property.pricing.totalPrice.toLocaleString('en-IN')}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Assign Broker (Optional)</label>
          <select 
            value={selectedBrokerId}
            onChange={(e) => setSelectedBrokerId(e.target.value)}
          >
            <option value="">No Broker</option>
            {brokers.map(broker => (
              <option key={broker._id || broker.id} value={broker._id || broker.id}>
                {broker.name} {broker.company ? `- ${broker.company}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedProjectId || !selectedPropertyId}
            style={{
              marginTop: '24px',
              padding: '10px',
              backgroundColor: selectedProjectId && selectedPropertyId ? '#2A669B' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedProjectId && selectedPropertyId ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              height: '44px'
            }}
            title="Add property assignment"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

function UserManagement() {
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [openMenuId, setOpenMenuId] = useState(null)
  
  // Form Validation States
  const [formErrors, setFormErrors] = useState({})
  
  // Property Assignment State - Support multiple properties
  const [propertyAssignments, setPropertyAssignments] = useState([]) // Array of {projectId, propertyId, brokerId}
  
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
  
  // Projects, Brokers, and Properties State
  const [projects, setProjects] = useState([])
  const [brokers, setBrokers] = useState([])
  const [properties, setProperties] = useState([])
  
  // Store uploaded documents with their file data (for backward compatibility)
  const [userDocuments, setUserDocuments] = useState(() => {
    const savedDocs = localStorage.getItem('legacy-admin-documents')
    return savedDocs ? JSON.parse(savedDocs) : {}
  })
  
  // Store documents fetched from API
  const [apiDocuments, setApiDocuments] = useState({})
  const [loadingDocuments, setLoadingDocuments] = useState(false)

  // Fetch projects, brokers, and properties
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

        // Fetch properties
        const propertiesResponse = await fetch(`${API_BASE_URL}/admin/properties`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
          }
        })
        const propertiesData = await propertiesResponse.json()
        if (propertiesData.success && propertiesData.data) {
          setProperties(propertiesData.data.properties || [])
          console.log('Properties loaded:', propertiesData.data.properties?.length || 0)
        } else {
          console.error('Failed to load properties:', propertiesData.error)
        }
      } catch (err) {
        console.error('Error fetching projects/brokers/properties:', err)
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
        const response = await fetch(`${API_BASE_URL}/buyers?includeProperties=true`)
        const data = await response.json()
        
        if (data.success && data.data) {
          // Map backend user data to frontend format
          const mappedUsers = data.data.map(user => {
            // Get all properties if available
            const userProperties = user.properties && user.properties.length > 0 ? user.properties : []
            
            // Format properties for display
            const propertiesDisplay = userProperties.length > 0 
              ? userProperties.map(prop => `${prop.flatNo || 'N/A'}${prop.buildingName ? ` - ${prop.buildingName}` : ''}`).join(', ')
              : 'N/A'
            
            // Get unique projects
            const projectsDisplay = userProperties.length > 0
              ? [...new Set(userProperties.map(prop => prop.projectName || 'N/A').filter(p => p !== 'N/A'))].join(', ')
              : 'N/A'
            
            // Get brokers (can be multiple, one per property)
            // Handle both old format (brokerName, brokerCompany) and new format (broker object)
            const brokersDisplay = userProperties.length > 0
              ? userProperties
                  .map(prop => {
                    // New format: broker object
                    if (prop.broker && prop.broker.name) {
                      return `${prop.broker.name}${prop.broker.company ? ` (${prop.broker.company})` : ''}`
                    }
                    // Old format: brokerName and brokerCompany
                    if (prop.brokerName) {
                      return `${prop.brokerName}${prop.brokerCompany ? ` (${prop.brokerCompany})` : ''}`
                    }
                    return null
                  })
                  .filter(b => b !== null)
                  .join(', ') || 'N/A'
              : 'N/A'
            
            return {
              id: user._id || user.id,
              name: user.name || 'N/A',
              email: user.email || 'N/A',
              phone: user.phone || 'N/A',
              status: 'Active', // Default status, can be updated later
              project: projectsDisplay,
              property: propertiesDisplay,
              propertyId: userProperties.length > 0 ? userProperties[0]?.id || null : null,
              projectId: userProperties.length > 0 ? userProperties[0]?.projectId || null : null,
              brokerId: userProperties.length > 0 ? (userProperties[0]?.broker?.id || userProperties[0]?.brokerId || null) : null,
              broker: brokersDisplay,
              address: user.address ? 
                `${user.address.line1 || ''} ${user.address.line2 || ''} ${user.address.city || ''} ${user.address.state || ''} ${user.address.pincode || ''}`.trim() 
                : '',
              paymentStatus: 'Up to Date', // Default, should be fetched from payments
              joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              documents: 0, // Should be fetched from documents
              tickets: 0, // Should be fetched from tickets
              role: user.role || 'user',
              properties: userProperties // Store all properties
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.action-menu-container')) {
        setOpenMenuId(null)
      }
    }

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [openMenuId])


  // Filtered and Searched Users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.phone.includes(searchQuery) ||
        (user.project && user.project.toLowerCase().includes(searchLower)) ||
        (user.property && user.property.toLowerCase().includes(searchLower))

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

  // Table state
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})

  const handleViewDetails = (user) => {
    setSelectedUser(user)
    setShowDetailsModal(true)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    
    // Load existing property assignments from user's properties
    if (user.properties && user.properties.length > 0) {
      const assignments = user.properties.map(prop => ({
        projectId: prop.projectId || prop.project?._id || prop.project?.id,
        propertyId: prop.id || prop._id,
        // Handle both old format (brokerId) and new format (broker object with id)
        brokerId: prop.broker?.id || prop.broker?._id || prop.brokerId || null
      })).filter(a => a.projectId && a.propertyId) // Filter out invalid assignments
      setPropertyAssignments(assignments)
    } else {
      setPropertyAssignments([])
    }
    
    setShowUserModal(true)
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const validateForm = (formData, isNewUser) => {
    const errors = {}
    
    // Validate name
    const name = formData.get('name')?.trim()
    if (!name) {
      errors.name = 'Full name is required'
    } else if (name.length < 3) {
      errors.name = 'Name must be at least 3 characters'
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
      errors.name = 'Name can only contain letters and spaces'
    }
    
    // Validate email
    const email = formData.get('email')?.trim()
    if (!email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    // Validate phone
    const phone = formData.get('phone')?.trim()
    if (!phone) {
      errors.phone = 'Phone number is required'
    } else if (!/^[6-9][0-9]{9}$/.test(phone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number starting with 6-9'
    }
    
    // Note: Property assignments are validated separately via propertyAssignments state
    // They are optional - user can be created without properties
    
    // Validate password for new users
    if (isNewUser) {
      const password = formData.get('password')
      const confirmPassword = formData.get('confirmPassword')
      
      if (!password) {
        errors.password = 'Password is required'
      } else if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters'
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        errors.password = 'Password must contain uppercase, lowercase, and a number'
      }
      
      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
    }
    
    return errors
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
        response = await fetch(`${API_BASE_URL}/buyers/${selectedUser.id}`, {
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
        response = await fetch(`${API_BASE_URL}/buyers`, {
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
        
        // Assign multiple properties to user if any are selected
        if (propertyAssignments && propertyAssignments.length > 0) {
          try {
            // Get the admin token
            const adminToken = localStorage.getItem('adminToken') || ''
            
            if (!adminToken) {
              showNotification(`${selectedUser ? 'User updated' : 'User created'} but property assignment failed: Authentication required. Please log in as admin.`, 'error')
            } else {
              // Use the new assign-properties endpoint for multiple assignments
              const assignResponse = await fetch(`${API_BASE_URL}/buyers/${userId}/assign-properties`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                  propertyAssignments: propertyAssignments
                })
              })

              const assignData = await assignResponse.json()
              if (!assignData.success) {
                console.error('Failed to assign properties:', assignData.error)
                if (assignResponse.status === 401 || assignResponse.status === 403) {
                  showNotification(`${selectedUser ? 'User updated' : 'User created'} but property assignment failed: Authentication error. Please log in as admin.`, 'error')
                } else {
                  showNotification(`${selectedUser ? 'User updated' : 'User created'} but property assignment failed: ${assignData.error}`, 'error')
                }
              } else {
                const successCount = assignData.data?.totalAssigned || 0
                const errorCount = assignData.data?.errors?.length || 0
                if (errorCount > 0) {
                  showNotification(`${selectedUser ? 'User updated' : 'User created'}. ${successCount} property/properties assigned successfully, ${errorCount} failed.`, 'warning')
                } else {
                  showNotification(`${selectedUser ? 'User updated' : 'User created'} and ${successCount} property/properties assigned successfully`, 'success')
                }
              }
            }
          } catch (assignErr) {
            console.error('Error assigning properties:', assignErr)
            showNotification(`${selectedUser ? 'User updated' : 'User created'} but property assignment failed: ${assignErr.message}`, 'error')
          }
        } else {
          showNotification(`${selectedUser ? 'User updated' : 'User created'} successfully`, 'success')
        }
        
        // Refresh users list
        const fetchResponse = await fetch(`${API_BASE_URL}/buyers?includeProperties=true`)
        const fetchData = await fetchResponse.json()
        
        if (fetchData.success && fetchData.data) {
          const mappedUsers = fetchData.data.map(user => {
            // Get all properties if available
            const userProperties = user.properties && user.properties.length > 0 ? user.properties : []
            
            // Format properties for display
            const propertiesDisplay = userProperties.length > 0 
              ? userProperties.map(prop => `${prop.flatNo || 'N/A'}${prop.buildingName ? ` - ${prop.buildingName}` : ''}`).join(', ')
              : 'N/A'
            
            // Get unique projects
            const projectsDisplay = userProperties.length > 0
              ? [...new Set(userProperties.map(prop => prop.projectName || 'N/A').filter(p => p !== 'N/A'))].join(', ')
              : 'N/A'
            
            // Get brokers (can be multiple, one per property)
            // Handle both old format (brokerName, brokerCompany) and new format (broker object)
            const brokersDisplay = userProperties.length > 0
              ? userProperties
                  .map(prop => {
                    // New format: broker object
                    if (prop.broker && prop.broker.name) {
                      return `${prop.broker.name}${prop.broker.company ? ` (${prop.broker.company})` : ''}`
                    }
                    // Old format: brokerName and brokerCompany
                    if (prop.brokerName) {
                      return `${prop.brokerName}${prop.brokerCompany ? ` (${prop.brokerCompany})` : ''}`
                    }
                    return null
                  })
                  .filter(b => b !== null)
                  .join(', ') || 'N/A'
              : 'N/A'
            
            return {
              id: user._id || user.id,
              name: user.name || 'N/A',
              email: user.email || 'N/A',
              phone: user.phone || 'N/A',
              status: 'Active',
              project: projectsDisplay,
              property: propertiesDisplay,
              propertyId: userProperties.length > 0 ? userProperties[0]?.id || null : null,
              projectId: userProperties.length > 0 ? userProperties[0]?.projectId || null : null,
              brokerId: userProperties.length > 0 ? (userProperties[0]?.broker?.id || userProperties[0]?.brokerId || null) : null,
              broker: brokersDisplay,
              address: user.address ? 
                `${user.address.line1 || ''} ${user.address.line2 || ''} ${user.address.city || ''} ${user.address.state || ''} ${user.address.pincode || ''}`.trim() 
                : '',
              paymentStatus: 'Up to Date',
              joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              documents: 0,
              tickets: 0,
              role: user.role || 'user',
              properties: userProperties
            }
          })
          setUsers(mappedUsers)
        }
        
        // Close modal and reset form
        setShowUserModal(false)
        setSelectedUser(null)
        setPropertyAssignments([])
        setFormErrors({})
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
        const response = await fetch(`${API_BASE_URL}/buyers/${userId}`, {
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

  const handleManageDocuments = async (user) => {
    setSelectedUser(user)
    setShowDocumentsModal(true)
    
    // Fetch documents from API for this user
    try {
      setLoadingDocuments(true)
      // Note: The API endpoint uses /api/documents?buyerId=... for admin users
      // The API filters documents by buyerId query parameter (for admin) or authenticated buyer
      const token = localStorage.getItem('adminToken')
      if (!token) {
        showNotification('Please log in to view documents', 'error')
        return
      }
      // For admin users, fetch documents for the selected buyer
      const url = `${API_BASE_URL}/documents${user.id ? `?buyerId=${user.id}` : ''}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data && data.data.documents) {
          // The API filters documents by buyerId query parameter (for admin) or authenticated buyer
          // Map documents to ensure correct format
          const userDocs = data.data.documents.map(doc => ({
            ...doc,
            // Ensure we have the correct ID format
            id: doc.id || doc._id,
            // Map uploadedAt to uploadedAt for consistency
            uploadedAt: doc.uploadedAt || doc.createdAt
          }))
          setApiDocuments(prev => ({
            ...prev,
            [user.id]: userDocs
          }))
        } else {
          // No documents found for this user
          setApiDocuments(prev => ({
            ...prev,
            [user.id]: []
          }))
        }
      } else {
        // If unauthorized, might need to handle differently
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch documents:', errorData)
        // If 401, show message about authentication
        if (response.status === 401) {
          showNotification('Please log in to view documents', 'error')
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoadingDocuments(false)
    }
  }

  const handleUploadDocument = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const documentType = formData.get('documentType')
    const documentTitle = formData.get('documentTitle')
    const file = formData.get('document')
    const description = formData.get('description')
    
    if (!file || file.size === 0) {
      showNotification('Please select a file to upload', 'error')
      return
    }
    
    if (!documentType || !documentTitle) {
      showNotification('Document type and title are required', 'error')
      return
    }
    
    try {
      // Create FormData for API upload
      const uploadFormData = new FormData()
      uploadFormData.append('document', file)
      uploadFormData.append('documentType', documentType)
      uploadFormData.append('documentTitle', documentTitle)
      // For admin users, include the selected user's ID
      if (selectedUser && selectedUser.id) {
        uploadFormData.append('buyerId', selectedUser.id)
      }
      if (description) {
        uploadFormData.append('description', description)
      }
      
      const token = localStorage.getItem('adminToken')
      if (!token) {
        showNotification('Please log in to upload documents', 'error')
        return
      }
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        showNotification(`${documentType} uploaded successfully!`, 'success')
        
        // Refresh documents list
        await handleManageDocuments(selectedUser)
        
        // Update user's document count
        setUsers(users.map(u => 
          u.id === selectedUser.id 
            ? { ...u, documents: (u.documents || 0) + 1 }
            : u
        ))
        
        e.target.reset()
      } else {
        showNotification(data.error || 'Failed to upload document', 'error')
      }
    } catch (error) {
      console.error('Upload error:', error)
      showNotification('Failed to upload document. Please try again.', 'error')
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

  const handleViewInBrowser = async (documentData) => {
    try {
      showNotification(`Opening "${documentData.name}" in browser...`, 'info')
      
      // If document has an ID, it's from the API - fetch presigned URL
      if (documentData.id) {
        const token = localStorage.getItem('adminToken')
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.')
        }
        
        const response = await fetch(`${API_BASE_URL}/documents/${documentData.id}/download`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data && data.data.downloadUrl) {
            // Open the presigned URL in a new tab
            window.open(data.data.downloadUrl, '_blank')
            showNotification(`"${documentData.name}" opened in browser!`, 'success')
            return
          } else {
            throw new Error(data.error || 'Failed to get view URL')
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to open document`)
        }
      } else if (documentData.file) {
        // For localStorage documents, create object URL and open it
        const url = window.URL.createObjectURL(documentData.file)
        window.open(url, '_blank')
        // Clean up after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
        showNotification(`"${documentData.name}" opened in browser!`, 'success')
      } else {
        throw new Error('Document file not available')
      }
    } catch (error) {
      console.error('View error:', error)
      showNotification('Failed to open document in browser. Please try again.', 'error')
    }
  }

  const handleDeleteDocument = async (documentData) => {
    if (!window.confirm(`Are you sure you want to delete "${documentData.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      showNotification(`Deleting "${documentData.name}"...`, 'info')
      
      // Check if this is a localStorage document (has file property or numeric/timestamp ID)
      const isLocalStorageDoc = documentData.file || 
                                 (documentData.id && typeof documentData.id === 'number') ||
                                 (documentData.id && typeof documentData.id === 'string' && /^\d+$/.test(documentData.id) && documentData.id.length > 10)
      
      // Check if this is a MongoDB ObjectId (24 hex characters)
      const isMongoId = documentData.id && 
                       typeof documentData.id === 'string' && 
                       /^[0-9a-fA-F]{24}$/.test(documentData.id)
      
      if (isLocalStorageDoc) {
        // For localStorage documents, remove from state
        setUserDocuments(prev => {
          const userDocs = prev[selectedUser.id] || []
          return {
            ...prev,
            [selectedUser.id]: userDocs.filter(doc => doc.id !== documentData.id)
          }
        })
        
        // Update user's document count
        setUsers(users.map(u => 
          u.id === selectedUser.id 
            ? { ...u, documents: Math.max(0, (u.documents || 0) - 1) }
            : u
        ))
        
        showNotification(`"${documentData.name}" deleted successfully!`, 'success')
      } else if (isMongoId) {
        // For API documents with MongoDB ObjectId, delete via API
        const token = localStorage.getItem('adminToken')
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.')
        }
        
        const response = await fetch(`${API_BASE_URL}/documents/${documentData.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            showNotification(`"${documentData.name}" deleted successfully!`, 'success')
            
            // Refresh documents list
            await handleManageDocuments(selectedUser)
            
            // Update user's document count
            setUsers(users.map(u => 
              u.id === selectedUser.id 
                ? { ...u, documents: Math.max(0, (u.documents || 0) - 1) }
                : u
            ))
            return
          } else {
            throw new Error(data.error || 'Failed to delete document')
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete document`)
        }
      } else {
        // Sample/demo documents - just show message
        showNotification('This is a sample document and cannot be deleted.', 'info')
      }
    } catch (error) {
      console.error('Delete error:', error)
      showNotification(error.message || 'Failed to delete document. Please try again.', 'error')
    }
  }

  const handleDownloadDocument = async (documentData) => {
    try {
      showNotification(`Downloading "${documentData.name}"...`, 'info')
      
      // If document has an ID, it's from the API - fetch presigned URL
      if (documentData.id) {
        const token = localStorage.getItem('adminToken')
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.')
        }
        
        const response = await fetch(`${API_BASE_URL}/documents/${documentData.id}/download`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data && data.data.downloadUrl) {
            // Use the presigned URL to download
            const link = document.createElement('a')
            link.href = data.data.downloadUrl
            link.download = data.data.fileName || documentData.name
            link.target = '_blank'
            
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            showNotification(`"${documentData.name}" downloaded successfully!`, 'success')
            return
          } else {
            throw new Error(data.error || 'Failed to get download URL')
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to download document`)
        }
      }
      
      // If the document has actual file data (localStorage fallback)
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

  // Define columns
  const columns = useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User Details" />
      ),
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="user-cell-um">
            <div className="user-avatar-um">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="user-name-um">{user.name}</div>
              <div className="user-meta">Joined: {user.joinDate}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="contact-info">
            <div>{user.email}</div>
            <div className="user-meta">{user.phone}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "project",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Project / Property" />
      ),
      cell: ({ row }) => {
        const user = row.original
        return (
          <div>
            <div className="project-name" style={{ marginBottom: user.properties && user.properties.length > 1 ? '8px' : '4px' }}>
              {user.project}
            </div>
            <div className="user-meta" style={{ fontSize: '13px', lineHeight: '1.5' }}>
              {user.property}
            </div>
            {user.properties && user.properties.length > 1 && (
              <div className="user-meta" style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px', fontStyle: 'italic' }}>
                {user.properties.length} properties
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "broker",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Broker" />
      ),
      cell: ({ row }) => {
        const user = row.original
        return (
          <div>
            {user.broker !== 'N/A' ? (
              <div className="broker-name" style={{ fontSize: '13px', lineHeight: '1.5' }}>{user.broker}</div>
            ) : (
              <span className="no-broker">No Broker</span>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.status)}>
                {user.status === 'Active' ? <PauseCircle className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                {user.status === 'Active' ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                <Key className="mr-2 h-4 w-4" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleManageDocuments(user)}>
                <FileText className="mr-2 h-4 w-4" />
                Documents
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleManageNotifications(user)}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDeleteUser(user.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [])

  const table = useReactTable({
    data: filteredUsers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  return (
    <div className="user-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-main">User Management (Buyers)</h1>
          <p className="page-subtitle">Manage all buyer accounts and their details</p>
        </div>
        <button className="btn btn-primary" onClick={() => { 
          setSelectedUser(null)
          setPropertyAssignments([])
          setShowUserModal(true)
        }}>
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
          <>
            <div className="flex items-center py-4">
              <Input
                placeholder="Filter by name or email..."
                value={(table.getColumn("name")?.getFilterValue() ?? "")}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <DataTableViewOptions table={table} />
            </div>
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        {users.length === 0 ? 'No users yet. Click "Create New User" to add your first user.' : 'No users found matching your criteria'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="py-4">
              <DataTablePagination table={table} />
            </div>
          </>
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
        <div className="modal-overlay" onClick={() => {
          setShowUserModal(false)
          setSelectedProjectId(null)
          setSelectedPropertyId(null)
          setFormErrors({})
        }}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedUser ? 'Edit User' : 'Create New User'}</h2>
              <button className="close-btn" onClick={() => { 
                setShowUserModal(false)
                setFormErrors({})
                setSelectedProjectId(null)
                setSelectedPropertyId(null)
              }}>×</button>
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

                {/* Property Assignment Section - Multiple Properties */}
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #e0e0e0' }}>
                  <h3 style={{ marginBottom: '16px', color: '#2A669B', fontSize: '18px', fontWeight: '600' }}>
                    Property Assignment
                  </h3>
                  <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
                    Assign multiple properties to this user. Properties can be from different projects. Each property can have its own broker.
                  </p>
                  
                  {/* List of assigned properties */}
                  {propertyAssignments.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        Assigned Properties ({propertyAssignments.length})
                      </h4>
                      {propertyAssignments.map((assignment, index) => {
                        const project = projects.find(p => (p._id || p.id) === assignment.projectId)
                        const property = properties.find(p => (p.id || p._id) === assignment.propertyId)
                        const broker = brokers.find(b => (b._id || b.id) === assignment.brokerId)
                        return (
                          <div key={index} style={{ 
                            padding: '12px', 
                            marginBottom: '8px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '6px',
                            border: '1px solid #e0e0e0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                {property?.flatNo || 'N/A'} - {project?.name || 'N/A'}
                              </div>
                              {broker && (
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  Broker: {broker.name} {broker.company ? `(${broker.company})` : ''}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPropertyAssignments(propertyAssignments.filter((_, i) => i !== index))
                              }}
                              style={{
                                padding: '6px',
                                backgroundColor: 'transparent',
                                color: '#e74c3c',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Remove property"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Add new property assignment */}
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                      Add Property Assignment
                    </h4>
                    <PropertyAssignmentForm
                      projects={projects}
                      properties={properties}
                      brokers={brokers}
                      onAdd={(assignment) => {
                        // Check if property is already assigned
                        const exists = propertyAssignments.some(
                          a => a.propertyId === assignment.propertyId
                        )
                        if (exists) {
                          showNotification('This property is already assigned', 'error')
                          return
                        }
                        setPropertyAssignments([...propertyAssignments, assignment])
                      }}
                    />
                  </div>
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
                  <button type="button" className="btn btn-outline" onClick={() => { 
                    setShowUserModal(false)
                    setSelectedUser(null)
                    setPropertyAssignments([])
                    setFormErrors({})
                  }}>Cancel</button>
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
                {loadingDocuments ? (
                  <p className="no-documents">Loading documents...</p>
                ) : (apiDocuments[selectedUser.id] && apiDocuments[selectedUser.id].length > 0) ? (
                  apiDocuments[selectedUser.id].map((doc) => {
                    const uploadDate = doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'Unknown date'
                    const fileType = doc.mimeType || 'application/pdf'
                    const fileSize = doc.fileSize ? (doc.fileSize / 1024 / 1024).toFixed(2) : '0.00'
                    
                    return (
                      <div key={doc.id} className="document-item">
                        <div className="document-icon">
                          {fileType.includes('pdf') ? <FileText size={20} /> : 
                           fileType.includes('image') ? <ImageIcon size={20} /> : 
                           fileType.includes('word') || fileType.includes('document') ? <File size={20} /> : <FileText size={20} />}
                        </div>
                        <div className="document-info">
                          <div className="document-name">{doc.name}</div>
                          <div className="document-meta">
                            {uploadDate} • {fileType.split('/')[1]?.toUpperCase() || 'FILE'} • 
                            {fileSize} MB
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="action-btn-um download-btn"
                            onClick={() => handleViewInBrowser(doc)}
                            title="View in Browser"
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button 
                            className="action-btn-um download-btn"
                            onClick={() => handleDownloadDocument(doc)}
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            className="action-btn-um download-btn"
                            onClick={() => handleDeleteDocument(doc)}
                            title="Delete"
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })
                ) : (userDocuments[selectedUser.id] && userDocuments[selectedUser.id].length > 0) ? (
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="action-btn-um download-btn"
                          onClick={() => handleViewInBrowser(doc)}
                          title="View in Browser"
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button 
                          className="action-btn-um download-btn"
                          onClick={() => handleDownloadDocument(doc)}
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          className="action-btn-um download-btn"
                          onClick={() => handleDeleteDocument(doc)}
                          title="Delete"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="action-btn-um download-btn"
                          onClick={() => handleViewInBrowser({
                            name: 'Welcome_Letter',
                            fileName: 'Welcome_Letter.pdf',
                            fileType: 'application/pdf'
                          })}
                          title="View in Browser"
                        >
                          <ExternalLink size={16} />
                        </button>
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
                        <button 
                          className="action-btn-um download-btn"
                          onClick={() => handleDeleteDocument({
                            name: 'Welcome_Letter',
                            fileName: 'Welcome_Letter.pdf',
                            fileType: 'application/pdf',
                            id: 'sample-welcome-letter'
                          })}
                          title="Delete"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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

