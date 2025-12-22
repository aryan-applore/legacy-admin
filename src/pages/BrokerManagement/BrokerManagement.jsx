import { useState, useMemo, useEffect } from 'react'
import { useApiFetch, useNotification } from '../../lib/apiHelpers'
import './BrokerManagement.css'
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Award,
  DollarSign,
  Calendar,
  FileText,
  Users,
  MapPin,
  Hash,
  Edit
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
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"



function BrokerManagement() {
  const [showBrokerModal, setShowBrokerModal] = useState(false)
  const [selectedBroker, setSelectedBroker] = useState(null)
  const [modalMode, setModalMode] = useState('view') // 'view', 'edit', or 'create'
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showCommissionModal, setShowCommissionModal] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState(null)

  // Form Validation States
  const [formErrors, setFormErrors] = useState({})

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('Sort By')

  const [notification, showNotification] = useNotification()
  const { fetchData } = useApiFetch()

  // Profile Image State
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Brokers State - Load from API
  const [brokers, setBrokers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Store uploaded documents with their file data
  const [brokerDocuments, setBrokerDocuments] = useState(() => {
    const savedDocs = localStorage.getItem('legacy-admin-broker-documents')
    return savedDocs ? JSON.parse(savedDocs) : {}
  })

  // Store broker clients from API (actual data from database)
  const [brokerClients, setBrokerClients] = useState({})
  const [loadingClients, setLoadingClients] = useState({})

  // Store broker assignments (buyers and suppliers) - kept for backward compatibility
  const [brokerAssignments, setBrokerAssignments] = useState(() => {
    const savedAssignments = localStorage.getItem('legacy-admin-broker-assignments')
    return savedAssignments ? JSON.parse(savedAssignments) : {}
  })

  // Load actual users from User Management (buyers)
  const [availableBuyers, setAvailableBuyers] = useState(() => {
    const savedUsers = localStorage.getItem('legacy-admin-users')
    return savedUsers ? JSON.parse(savedUsers) : []
  })

  // Load actual suppliers from Supplier Management
  const [availableSuppliers, setAvailableSuppliers] = useState(() => {
    const savedSuppliers = localStorage.getItem('legacy-admin-suppliers')
    return savedSuppliers ? JSON.parse(savedSuppliers) : []
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.menu-button-container')) {
        setOpenDropdownId(null)
      }
    }

    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdownId])

  // Listen for changes in User Management and update available buyers
  useEffect(() => {
    const handleStorageChange = () => {
      const savedUsers = localStorage.getItem('legacy-admin-users')
      if (savedUsers) {
        setAvailableBuyers(JSON.parse(savedUsers))
      }

      const savedSuppliers = localStorage.getItem('legacy-admin-suppliers')
      if (savedSuppliers) {
        setAvailableSuppliers(JSON.parse(savedSuppliers))
      }
    }

    // Listen for storage events (when localStorage changes in other tabs)
    window.addEventListener('storage', handleStorageChange)

    // Also check periodically for updates in same tab
    const interval = setInterval(() => {
      const savedUsers = localStorage.getItem('legacy-admin-users')
      const currentUsers = JSON.stringify(availableBuyers)
      if (savedUsers && savedUsers !== currentUsers) {
        setAvailableBuyers(JSON.parse(savedUsers))
      }

      const savedSuppliers = localStorage.getItem('legacy-admin-suppliers')
      const currentSuppliers = JSON.stringify(availableSuppliers)
      if (savedSuppliers && savedSuppliers !== currentSuppliers) {
        setAvailableSuppliers(JSON.parse(savedSuppliers))
      }
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [availableBuyers, availableSuppliers])



  // Fetch broker clients from API
  const fetchBrokerClients = async (brokerId) => {
    if (!brokerId || loadingClients[brokerId]) return

    try {

      setLoadingClients(prev => ({ ...prev, [brokerId]: true }))

      const data = await fetchData(`/brokers/${brokerId}/clients`)

      if (data.success && data.data) {
        setBrokerClients(prev => ({
          ...prev,
          [brokerId]: data.data
        }))

        // Update broker's client count
        setBrokers(prevBrokers =>
          prevBrokers.map(b =>
            b.id === brokerId
              ? { ...b, clientsManaged: data.count || data.data.length }
              : b
          )
        )
      } else {
        console.error('Failed to fetch broker clients:', data.error)
        setBrokerClients(prev => ({
          ...prev,
          [brokerId]: []
        }))
      }
    } catch (err) {
      console.error('Error fetching broker clients:', err)
      setBrokerClients(prev => ({
        ...prev,
        [brokerId]: []
      }))
    } finally {
      setLoadingClients(prev => ({ ...prev, [brokerId]: false }))
    }
  }

  // Fetch brokers from API
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await fetchData('/brokers')

        if (data.success && data.data) {
          // Map backend broker data to frontend format
          const mappedBrokers = await Promise.all(data.data.map(async (broker) => {
            const brokerId = broker._id || broker.id

            // Fetch clients count for each broker
            let clientsCount = 0
            try {
              const clientsData = await fetchData(`/brokers/${brokerId}/clients`)
              if (clientsData.success) {
                clientsCount = clientsData.count || 0
              }
            } catch (err) {
              console.error(`Error fetching clients for broker ${brokerId}:`, err)
            }

            return {
              id: brokerId,
              name: broker.name || 'N/A',
              email: broker.email || 'N/A',
              phone: broker.phone || 'N/A',
              company: broker.company || '',
              licenseNumber: broker.licenseNumber || '',
              status: broker.status || 'Active',
              commission: broker.commission || 'N/A',
              performance: broker.performance || 'Good',
              clientsManaged: clientsCount, // Use actual count from API
              joinDate: broker.createdAt
                ? new Date(broker.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              documents: broker.documents || 0,
              address: broker.address || '',
              notes: broker.notes || '',
              profilePicture: broker.image || broker.profilePicture || null
            }
          }))

          setBrokers(mappedBrokers)
        } else {
          setError(data.error || 'Failed to fetch brokers')
          showNotification('Failed to load brokers: ' + (data.error || 'Unknown error'), 'error')
        }
      } catch (err) {
        console.error('Error fetching brokers:', err)
        setError(err.message)
        showNotification('Error loading brokers: ' + err.message, 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchBrokers()
  }, [])

  // Save documents to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('legacy-admin-broker-documents', JSON.stringify(brokerDocuments))
  }, [brokerDocuments])

  // Save assignments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('legacy-admin-broker-assignments', JSON.stringify(brokerAssignments))
  }, [brokerAssignments])

  // Filtered and Searched Brokers
  const filteredBrokers = useMemo(() => {
    let filtered = brokers.filter(broker => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        (broker.name && broker.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (broker.email && broker.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (broker.phone && broker.phone.toString().includes(searchQuery))

      return matchesSearch
    })

    // Sorting
    if (sortBy === 'Most Clients') {
      filtered.sort((a, b) => b.clientsManaged - a.clientsManaged)
    } else if (sortBy === 'Newest First') {
      filtered.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
    }

    return filtered
  }, [brokers, searchQuery, sortBy])

  // Table state
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})

  const handleViewDetails = (broker) => {
    setSelectedBroker(broker)
    setModalMode('view')
    setShowBrokerModal(true)
    // Fetch broker clients when viewing details
    if (broker.id) {
      fetchBrokerClients(broker.id)
    }
  }

  const handleEditBroker = (broker) => {
    setSelectedBroker(broker)
    setImagePreview(broker.profilePicture || null)
    setImageFile(null)
    setModalMode('edit')
    setShowBrokerModal(true)
  }

  const handleCreateBroker = () => {
    setSelectedBroker(null)
    setImagePreview(null)
    setImageFile(null)
    setModalMode('create')
    setShowBrokerModal(true)
  }

  const handleCloseModal = () => {
    setShowBrokerModal(false)
    setSelectedBroker(null)
    setModalMode('view')
    setFormErrors({})
    setImageFile(null)
    setImagePreview(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size should be less than 5MB', 'error')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSaveBroker = async (e) => {
    e.preventDefault()
    setUploadingImage(true)
    const formData = new FormData(e.target)

    let imageUrl = selectedBroker?.profilePicture || ''

    // 1. Upload image if a new file is selected
    if (imageFile && imageFile instanceof File) {
      const uploadFormData = new FormData()
      uploadFormData.append('file', imageFile)

      const uploadRes = await fetchData('/upload/file', {
        method: 'POST',
        body: uploadFormData
      })

      if (uploadRes.success) {
        imageUrl = uploadRes.data?.url || uploadRes.data
      } else {
        showNotification('Failed to upload image: ' + (uploadRes.error || 'Unknown error'), 'error')
        setUploadingImage(false)
        return
      }
    }

    // Core broker data (matches backend model)
    const brokerData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      company: formData.get('company') || '',
      licenseNumber: formData.get('licenseNumber') || '',
      profilePicture: imageUrl
    }

    // Add password for new brokers
    if (!selectedBroker) {
      const password = formData.get('password')
      const confirmPassword = formData.get('confirmPassword')
      if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error')
        return
      }
      brokerData.password = password
    }

    // Additional fields (if backend supports them, otherwise they'll be ignored)
    const additionalFields = {
      status: formData.get('status'),
      commission: formData.get('commission').trim(),
      performance: formData.get('performance'),
      address: formData.get('address').trim(),
      notes: formData.get('notes').trim(),
      clientsManaged: selectedBroker ? selectedBroker.clientsManaged : 0,
      documents: selectedBroker ? selectedBroker.documents : 0
    }

    // Merge all fields
    const fullBrokerData = { ...brokerData, ...additionalFields }

    try {
      let data
      if (selectedBroker) {
        // Update existing broker
        data = await fetchData(`/brokers/${selectedBroker.id}`, {
          method: 'PUT',
          body: JSON.stringify(fullBrokerData)
        })
      } else {
        // Create new broker
        data = await fetchData('/brokers', {
          method: 'POST',
          body: JSON.stringify(fullBrokerData)
        })
      }

      if (data.success) {
        showNotification(selectedBroker ? 'Broker updated successfully!' : 'Broker created successfully!', 'success')
        handleCloseModal()

        // Refresh brokers list
        const fetchDataResponse = await fetchData('/brokers')
        if (fetchDataResponse.success && fetchDataResponse.data) {
          const mappedBrokers = fetchDataResponse.data.map(broker => ({
            id: broker._id || broker.id,
            name: broker.name || 'N/A',
            email: broker.email || 'N/A',
            phone: broker.phone || 'N/A',
            company: broker.company || '',
            licenseNumber: broker.licenseNumber || '',
            status: broker.status || 'Active',
            commission: broker.commission || 'N/A',
            performance: broker.performance || 'Good',
            clientsManaged: broker.clientsManaged || 0,
            joinDate: broker.createdAt
              ? new Date(broker.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            documents: broker.documents || 0,
            address: broker.address || '',
            notes: broker.notes || '',
            profilePicture: broker.image || broker.profilePicture || null
          }))
          setBrokers(mappedBrokers)
        }
      } else {
        showNotification('Error: ' + (data.error || 'Failed to save broker'), 'error')
      }
    } catch (err) {
      console.error('Error saving broker:', err)
      showNotification('Error saving broker: ' + err.message, 'error')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDeleteBroker = async (brokerId) => {
    if (window.confirm('Are you sure you want to delete this broker?')) {
      try {
        const data = await fetchData(`/brokers/${brokerId}`, {
          method: 'DELETE'
        })

        if (data.success) {
          setBrokers(brokers.filter(b => b.id !== brokerId))
          showNotification('Broker deleted successfully!', 'success')
        } else {
          showNotification('Error: ' + (data.error || 'Failed to delete broker'), 'error')
        }
      } catch (err) {
        console.error('Error deleting broker:', err)
        showNotification('Error deleting broker: ' + err.message, 'error')
      }
    }
  }

  const handleResetPassword = (broker) => {
    showNotification(`Password reset link sent to ${broker.email}`, 'info')
  }

  const handleActivateBroker = (brokerId) => {
    const broker = brokers.find(b => b.id === brokerId)
    if (window.confirm(`Activate ${broker.name}'s account? They will regain access to the system.`)) {
      setBrokers(brokers.map(b =>
        b.id === brokerId
          ? { ...b, status: 'Active' }
          : b
      ))
      showNotification(`${broker.name}'s account has been activated!`, 'success')
    }
  }

  const handleDeactivateBroker = (brokerId) => {
    const broker = brokers.find(b => b.id === brokerId)
    if (window.confirm(`Deactivate ${broker.name}'s account? They will lose access to the system.`)) {
      setBrokers(brokers.map(b =>
        b.id === brokerId
          ? { ...b, status: 'Inactive' }
          : b
      ))
      showNotification(`${broker.name}'s account has been deactivated!`, 'success')
    }
  }

  const handleToggleStatus = async (brokerId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'
    const action = newStatus === 'Active' ? 'activate' : 'deactivate'
    const broker = brokers.find(b => b.id === brokerId)

    if (window.confirm(`Are you sure you want to ${action} ${broker.name}'s account?`)) {
      try {
        const data = await fetchData(`/brokers/${brokerId}`, {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus })
        })

        if (data.success) {
          setBrokers(brokers.map(b =>
            b.id === brokerId
              ? { ...b, status: newStatus }
              : b
          ))
          showNotification(`Broker account ${action}d successfully!`, 'success')
        } else {
          showNotification('Error: ' + (data.error || 'Failed to update status'), 'error')
        }
      } catch (err) {
        console.error('Error updating status:', err)
        showNotification('Error updating status: ' + err.message, 'error')
      }
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSortBy('Sort By')
    showNotification('Filters cleared!', 'info')
  }

  const handleManageDocuments = (broker) => {
    setSelectedBroker(broker)
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
        brokerId: selectedBroker.id
      }

      // Update brokerDocuments state
      setBrokerDocuments(prev => ({
        ...prev,
        [selectedBroker.id]: [...(prev[selectedBroker.id] || []), documentData]
      }))

      // Update broker's document count
      setBrokers(brokers.map(b =>
        b.id === selectedBroker.id
          ? { ...b, documents: (b.documents || 0) + 1 }
          : b
      ))

      showNotification(`${documentType} uploaded successfully!`, 'success')
      e.target.reset()
    }
  }

  const handleManageNotifications = (broker) => {
    setSelectedBroker(broker)
    setShowNotificationsModal(true)
  }

  const handleSendNotification = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const title = formData.get('notificationTitle')

    showNotification(`Notification "${title}" sent to ${selectedBroker.name}!`, 'success')
    setShowNotificationsModal(false)
    setSelectedBroker(null)
    e.target.reset()
  }

  const handleManageAssignments = (broker) => {
    setSelectedBroker(broker)
    setShowAssignmentModal(true)
  }

  const handleManageCommission = (broker) => {
    setSelectedBroker(broker)
    setShowCommissionModal(true)
  }

  const handleSaveCommission = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const commission = formData.get('commission').trim()

    // Validate commission format
    if (!commission) {
      showNotification('Please enter a commission rate', 'error')
      return
    }

    // Validate commission is a valid number/percentage
    const commissionMatch = commission.match(/^(\d+(?:\.\d{1,2})?)%?$/)
    if (!commissionMatch) {
      showNotification('Please enter a valid commission rate (e.g., 2.5% or 2.5)', 'error')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/brokers/${selectedBroker.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commission: commission })
      })
      const data = await response.json()

      if (data.success) {
        // Update local state
        setBrokers(brokers.map(b =>
          b.id === selectedBroker.id
            ? { ...b, commission: commission }
            : b
        ))
        showNotification(`Commission updated for ${selectedBroker.name}!`, 'success')
        setShowCommissionModal(false)
        setSelectedBroker(null)
      } else {
        showNotification('Error: ' + (data.error || 'Failed to update commission'), 'error')
      }
    } catch (err) {
      console.error('Error updating commission:', err)
      showNotification('Error updating commission: ' + err.message, 'error')
    }
  }

  const handleSaveAssignments = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    // Get selected buyers
    const buyerCheckboxes = document.querySelectorAll('input[name="buyers"]:checked')
    const selectedBuyers = Array.from(buyerCheckboxes).map(cb => parseInt(cb.value))

    // Get selected suppliers
    const supplierCheckboxes = document.querySelectorAll('input[name="suppliers"]:checked')
    const selectedSuppliers = Array.from(supplierCheckboxes).map(cb => parseInt(cb.value))

    // Update assignments
    setBrokerAssignments(prev => ({
      ...prev,
      [selectedBroker.id]: {
        buyers: selectedBuyers,
        suppliers: selectedSuppliers
      }
    }))

    // Update broker's client count (buyers + suppliers)
    setBrokers(brokers.map(b =>
      b.id === selectedBroker.id
        ? { ...b, clientsManaged: selectedBuyers.length + selectedSuppliers.length }
        : b
    ))

    showNotification(`Assignments updated for ${selectedBroker.name}!`, 'success')
    setShowAssignmentModal(false)
    setSelectedBroker(null)
  }

  const getAssignedBuyers = (brokerId) => {
    // First try to get from API (actual data)
    if (brokerClients[brokerId] && brokerClients[brokerId].length > 0) {
      return brokerClients[brokerId].map(client => ({
        id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        properties: client.properties || [],
        project: client.properties && client.properties.length > 0
          ? client.properties.map(p => `${p.flatNo} - ${p.buildingName}`).join(', ')
          : 'N/A',
        property: client.properties && client.properties.length > 0
          ? client.properties.map(p => `${p.flatNo} - ${p.buildingName}`).join(', ')
          : 'N/A'
      }))
    }

    // Fallback to localStorage (for backward compatibility)
    const assignments = brokerAssignments[brokerId]
    if (!assignments || !assignments.buyers) return []
    // Filter buyers that still exist in the system
    return availableBuyers.filter(b => assignments.buyers.includes(b.id))
  }

  const getAssignedSuppliers = (brokerId) => {
    const assignments = brokerAssignments[brokerId]
    if (!assignments || !assignments.suppliers) return []
    // Filter suppliers that still exist in the system
    return availableSuppliers.filter(s => assignments.suppliers.includes(s.id))
  }

  const handleDownloadDocument = (documentData) => {
    try {
      showNotification(`Downloading "${documentData.name}"...`, 'info')

      if (documentData.file) {
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
        const mimeType = documentData.fileType || 'application/pdf'
        const extension = documentData.fileName ? documentData.fileName.split('.').pop() : 'pdf'

        let blob
        if (mimeType.includes('pdf') || extension === 'pdf') {
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
(Broker: ${selectedBroker?.name || 'N/A'}) Tj
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
          const textContent = `Document: ${documentData.name}
Broker: ${selectedBroker?.name || 'N/A'}
Email: ${selectedBroker?.email || 'N/A'}
Date: ${new Date().toLocaleString()}`
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

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'Outstanding':
        return 'perf-outstanding'
      case 'Excellent':
        return 'perf-excellent'
      case 'Good':
        return 'perf-good'
      default:
        return 'perf-average'
    }
  }

  // Define columns
  const columns = useMemo(() => [
    {
      accessorKey: "profilePicture",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Profile" />
      ),
      cell: ({ row }) => {
        const broker = row.original
        return (
          <div className="broker-avatar-bm">
            {broker.profilePicture ? (
              <img src={broker.profilePicture} alt={broker.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              broker.name ? broker.name.charAt(0).toUpperCase() : '?'
            )}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const broker = row.original
        return (
          <div>
            <div className="broker-name-bm">{broker.name || 'N/A'}</div>
            <div className="broker-meta">Joined: {broker.joinDate || 'N/A'}</div>
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
        const broker = row.original
        return (
          <div className="contact-info-bm">
            <div>{broker.email || 'N/A'}</div>
            <div className="broker-meta">{broker.phone || 'N/A'}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "company",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Company" />
      ),
      cell: ({ row }) => (
        <span>{row.original.company || 'N/A'}</span>
      ),
    },
    {
      accessorKey: "licenseNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="License Number" />
      ),
      cell: ({ row }) => (
        <span>{row.original.licenseNumber || 'N/A'}</span>
      ),
    },
    {
      accessorKey: "clientsManaged",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Clients" />
      ),
      cell: ({ row }) => (
        <span className="metric-value">{row.original.clientsManaged || 0}</span>
      ),
    },
    {
      accessorKey: "commission",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Commission" />
      ),
      cell: ({ row }) => (
        <span className="commission-badge">{row.original.commission || 'N/A'}</span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const broker = row.original
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleEditBroker(broker)
            }}
          >
            Edit
          </Button>
        )
      },
    },
  ], [])

  const table = useReactTable({
    data: filteredBrokers,
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
    <div className="broker-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-main">Broker Management</h1>
          <p className="page-subtitle">Manage broker accounts and track their performance</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateBroker}>
          + Create New Broker
        </button>
      </div>

      {/* Stats Overview */}
      <div className="broker-stats-grid">
        <div className="stat-card-bm">
          <div className="stat-icon-bm">🤝</div>
          <div>
            <h3>Total Brokers</h3>
            <p className="stat-value-bm">{brokers.length}</p>
            <span className="stat-label">{filteredBrokers.length} shown</span>
          </div>
        </div>
        <div className="stat-card-bm">
          <div className="stat-icon-bm">✅</div>
          <div>
            <h3>Active Brokers</h3>
            <p className="stat-value-bm">{brokers.filter(b => b.status === 'Active').length}</p>
            <span className="stat-label">{brokers.length > 0 ? Math.round((brokers.filter(b => b.status === 'Active').length / brokers.length) * 100) : 0}% active rate</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card filters-section">
        <div className="filters-grid">
          <input
            type="text"
            placeholder="Search by broker name or email..."
            className="search-input-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option>Sort By</option>
            <option>Most Clients</option>
            <option>Newest First</option>
          </select>
          <button className="btn btn-outline clear-filters-btn" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Brokers Table */}
      <div className="card brokers-table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Loading brokers...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--error)' }}>
            Error: {error}
          </div>
        ) : (
          <>
            <div className="flex items-center py-4">
              <Input
                placeholder="Filter by broker name..."
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
                        onClick={() => handleViewDetails(row.original)}
                        style={{ cursor: 'pointer' }}
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
                        {brokers.length === 0 ? 'No brokers yet. Click "Create New Broker" to add your first broker.' : 'No brokers found matching your criteria'}
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
        {filteredBrokers.length === 0 ? (
          <div className="no-results-mobile">
            <p>{brokers.length === 0 ? 'No brokers yet. Click "Create New Broker" to add your first broker.' : 'No brokers found matching your criteria'}</p>
          </div>
        ) : (
          filteredBrokers.map((broker) => (
            <div key={broker.id} className="broker-card-mobile">
              <div className="broker-card-header">
                <div className="broker-cell-bm">
                  <div className="broker-avatar-bm">
                    {broker.profilePicture ? (
                      <img src={broker.profilePicture} alt={broker.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      broker.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="broker-name-bm">{broker.name}</div>
                    <div className="broker-meta">{broker.email}</div>
                  </div>
                </div>
                <span className={`status-badge ${broker.status === 'Active' ? 'status-success' : 'status-error'}`}>
                  {broker.status}
                </span>
              </div>

              <div className="broker-card-body">
                <div className="card-info-row">
                  <span className="card-label">📞 Phone:</span>
                  <span>{broker.phone}</span>
                </div>
                <div className="card-info-row">
                  <span className="card-label">🏢 Company:</span>
                  <span>{broker.company || 'N/A'}</span>
                </div>
                <div className="card-info-row">
                  <span className="card-label">📜 License:</span>
                  <span>{broker.licenseNumber || 'N/A'}</span>
                </div>
                <div className="card-info-row">
                  <span className="card-label">👥 Clients:</span>
                  <span className="metric-value">{broker.clientsManaged}</span>
                </div>
                <div className="card-info-row">
                  <span className="card-label">💰 Commission:</span>
                  <span className="commission-badge">{broker.commission}</span>
                </div>
                <div className="card-info-row">
                  <span className="card-label">⭐ Performance:</span>
                  <span className={`performance-badge ${getPerformanceColor(broker.performance)}`}>
                    {broker.performance}
                  </span>
                </div>
              </div>

              <div className="broker-card-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => handleViewDetails(broker)}
                >
                  View Details
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleEditBroker(broker)}
                >
                  Edit Broker
                </button>
              </div>
              <div className="broker-card-actions" style={{ marginTop: '8px' }}>
                {broker.status === 'Active' ? (
                  <button
                    className="btn btn-warning"
                    onClick={() => handleDeactivateBroker(broker.id)}
                  >
                    ⏸️ Deactivate
                  </button>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={() => handleActivateBroker(broker.id)}
                  >
                    ▶️ Activate
                  </button>
                )}
                <button
                  className="btn btn-outline"
                  onClick={() => handleManageAssignments(broker)}
                >
                  👥 Assign
                </button>
              </div>
              <div className="broker-card-actions" style={{ marginTop: '8px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => handleManageDocuments(broker)}
                >
                  📄 Documents
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => handleManageCommission(broker)}
                >
                  💰 Commission
                </button>
              </div>
              <div className="broker-card-actions" style={{ marginTop: '8px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => handleManageNotifications(broker)}
                >
                  🔔 Notify
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Unified Broker Modal (View/Edit/Create) */}
      {showBrokerModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modal-large broker-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="broker-details-header">
                <div className="broker-details-title-section">
                  <div className="broker-icon-large">
                    {modalMode === 'view' ? <User size={24} /> : <Edit size={24} />}
                  </div>
                  <div>
                    <h2>
                      {modalMode === 'view' ? 'Broker Details' :
                        modalMode === 'edit' ? 'Edit Broker' :
                          'Create New Broker'}
                    </h2>
                    <p className="broker-subtitle">
                      {modalMode === 'view' && selectedBroker ? selectedBroker.name :
                        modalMode === 'edit' && selectedBroker ? selectedBroker.name :
                          'Add a new broker to the system'}
                    </p>
                  </div>
                </div>
                <button className="close-btn" onClick={handleCloseModal}>×</button>
              </div>
            </div>
            <div className="modal-body broker-details-body">
              {modalMode === 'view' && selectedBroker ? (
                <>
                  {/* Broker Overview Card */}
                  <div className="broker-detail-card">
                    <div className="broker-detail-card-header">
                      <User size={18} />
                      <h3>Broker Overview</h3>
                    </div>
                    <div className="broker-detail-card-content">
                      <div className="broker-overview-grid">
                        <div className="broker-overview-item">
                          <div className="broker-overview-label">
                            <Hash size={14} />
                            <span>Broker ID</span>
                          </div>
                          <div className="broker-overview-value broker-id-value">
                            {selectedBroker.id}
                          </div>
                        </div>
                        <div className="broker-overview-item">
                          <div className="broker-overview-label">
                            <User size={14} />
                            <span>Full Name</span>
                          </div>
                          <div className="broker-overview-value">
                            {selectedBroker.name}
                          </div>
                        </div>
                        <div className="broker-overview-item">
                          <div className="broker-overview-label">
                            <Mail size={14} />
                            <span>Email</span>
                          </div>
                          <div className="broker-overview-value">
                            {selectedBroker.email}
                          </div>
                        </div>
                        <div className="broker-overview-item">
                          <div className="broker-overview-label">
                            <Phone size={14} />
                            <span>Phone</span>
                          </div>
                          <div className="broker-overview-value">
                            {selectedBroker.phone}
                          </div>
                        </div>
                        <div className="broker-overview-item">
                          <div className="broker-overview-label">
                            <Building2 size={14} />
                            <span>Company</span>
                          </div>
                          <div className="broker-overview-value">
                            {selectedBroker.company || 'N/A'}
                          </div>
                        </div>
                        <div className="broker-overview-item">
                          <div className="broker-overview-label">
                            <Award size={14} />
                            <span>License Number</span>
                          </div>
                          <div className="broker-overview-value">
                            {selectedBroker.licenseNumber || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information Card */}
                  {selectedBroker.address && (
                    <div className="broker-detail-card">
                      <div className="broker-detail-card-header">
                        <MapPin size={18} />
                        <h3>Address</h3>
                      </div>
                      <div className="broker-detail-card-content">
                        <div className="broker-address-content">
                          {selectedBroker.address}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assigned Clients Card */}
                  <div className="broker-detail-card">
                    <div className="broker-detail-card-header">
                      <Users size={18} />
                      <h3>Assigned Clients ({getAssignedBuyers(selectedBroker.id).length})</h3>
                      <button
                        className="btn btn-outline"
                        onClick={() => fetchBrokerClients(selectedBroker.id)}
                        disabled={loadingClients[selectedBroker.id]}
                        style={{ marginLeft: 'auto', fontSize: '12px', padding: '4px 8px' }}
                      >
                        {loadingClients[selectedBroker.id] ? 'Loading...' : '🔄 Refresh'}
                      </button>
                    </div>
                    <div className="broker-detail-card-content">
                      {loadingClients[selectedBroker.id] ? (
                        <p className="broker-empty-state">Loading clients...</p>
                      ) : getAssignedBuyers(selectedBroker.id).length > 0 ? (
                        <div className="broker-clients-list">
                          {getAssignedBuyers(selectedBroker.id).map(buyer => (
                            <div key={buyer.id} className="broker-client-item">
                              <div className="broker-client-header">
                                <User size={16} />
                                <span className="broker-client-name">{buyer.name}</span>
                              </div>
                              <div className="broker-client-details">
                                <div className="broker-client-detail-row">
                                  <Mail size={12} />
                                  <span>{buyer.email}</span>
                                </div>
                                {buyer.phone && (
                                  <div className="broker-client-detail-row">
                                    <Phone size={12} />
                                    <span>{buyer.phone}</span>
                                  </div>
                                )}
                                {buyer.properties && buyer.properties.length > 0 && (
                                  <div className="broker-client-properties">
                                    <div className="broker-client-properties-label">Properties ({buyer.properties.length}):</div>
                                    {buyer.properties.map((prop, idx) => (
                                      <div key={idx} className="broker-client-property-item">
                                        • {prop.flatNo} - {prop.buildingName}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="broker-empty-state">No clients assigned yet</p>
                      )}
                    </div>
                  </div>

                  {/* Assigned Suppliers Card */}
                  {getAssignedSuppliers(selectedBroker.id).length > 0 && (
                    <div className="broker-detail-card">
                      <div className="broker-detail-card-header">
                        <Building2 size={18} />
                        <h3>Assigned Suppliers ({getAssignedSuppliers(selectedBroker.id).length})</h3>
                      </div>
                      <div className="broker-detail-card-content">
                        <div className="broker-suppliers-list">
                          {getAssignedSuppliers(selectedBroker.id).map(supplier => (
                            <div key={supplier.id} className="broker-supplier-item">
                              <Building2 size={16} />
                              <div>
                                <span className="broker-supplier-name">{supplier.companyName}</span>
                                <span className="broker-supplier-meta">{supplier.category} - {supplier.location || 'Location N/A'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="broker-modal-actions">
                    <button className="btn btn-outline" onClick={handleCloseModal}>Close</button>
                    <button className="btn btn-primary" onClick={() => { setModalMode('edit'); }}>Edit Broker</button>
                  </div>
                </>
              ) : (
                <form className="broker-form" onSubmit={handleSaveBroker}>
                  <div className="form-row">
                    <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
                      <label>Profile Image (Optional)</label>
                      <div className="image-upload-container">
                        <div className="image-preview-large">
                          {imagePreview ? (
                            <img src={imagePreview} alt="Preview" />
                          ) : (
                            <div className="no-image">
                              <Users size={40} />
                              <span>No image</span>
                            </div>
                          )}
                        </div>
                        <div className="image-upload-controls">
                          <Input
                            type="file"
                            accept=".png,.jpg,.jpeg"
                            onChange={handleImageChange}
                            className="file-input"
                          />
                          <p className="upload-tip">PNG, JPG or JPEG (Max 5MB)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter full name"
                        defaultValue={selectedBroker?.name}
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
                        defaultValue={selectedBroker?.email}
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
                        defaultValue={selectedBroker?.phone}
                        pattern="[6-9][0-9]{9}"
                        maxLength="10"
                        title="Please enter a valid 10-digit Indian mobile number starting with 6-9"
                        required
                        className={formErrors.phone ? 'error' : ''}
                      />
                      {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Company</label>
                      <input
                        type="text"
                        name="company"
                        placeholder="Enter company name"
                        defaultValue={selectedBroker?.company}
                      />
                    </div>
                    <div className="form-group">
                      <label>License Number</label>
                      <input
                        type="text"
                        name="licenseNumber"
                        placeholder="Enter license number"
                        defaultValue={selectedBroker?.licenseNumber}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Commission Rate</label>
                      <input
                        type="text"
                        name="commission"
                        placeholder="e.g., 2.5%"
                        defaultValue={selectedBroker?.commission}
                        pattern="[0-9]+(\.[0-9]{1,2})?%?"
                        title="Enter a valid commission rate (e.g., 2.5% or 2.5)"
                        className={formErrors.commission ? 'error' : ''}
                      />
                      {formErrors.commission && <span className="error-message">{formErrors.commission}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Address</label>
                    <textarea
                      name="address"
                      rows="3"
                      placeholder="Enter full address"
                      defaultValue={selectedBroker?.address || ''}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      rows="3"
                      placeholder="Add any additional notes or comments"
                      defaultValue={selectedBroker?.notes || ''}
                    ></textarea>
                  </div>

                  {!selectedBroker && (
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

                  <div className="broker-modal-actions">
                    <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={uploadingImage}>
                      {uploadingImage ? 'Uploading Image...' : (modalMode === 'edit' ? 'Update Broker' : 'Create Broker')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Documents Management Modal */}
      {showDocumentsModal && selectedBroker && (
        <div className="modal-overlay" onClick={() => setShowDocumentsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Documents - {selectedBroker.name}</h2>
              <button className="close-btn" onClick={() => setShowDocumentsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="documents-summary">
                <p className="summary-text">
                  Current Documents: <strong>{selectedBroker.documents || 0}</strong>
                </p>
                <p className="summary-text">
                  Broker Email: <strong>{selectedBroker.email}</strong>
                </p>
              </div>

              <h3 className="section-title">Upload New Document</h3>
              <form className="document-form" onSubmit={handleUploadDocument}>
                <div className="form-group">
                  <label>Document Type *</label>
                  <select name="documentType" required>
                    <option value="">Select Document Type</option>
                    <option>Contract Agreement</option>
                    <option>Commission Document</option>
                    <option>Client Assignment</option>
                    <option>Performance Report</option>
                    <option>KYC Documents</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Document Title *</label>
                  <input
                    type="text"
                    name="documentTitle"
                    placeholder="e.g., Q4 Performance Report"
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
                {brokerDocuments[selectedBroker.id] && brokerDocuments[selectedBroker.id].length > 0 ? (
                  brokerDocuments[selectedBroker.id].map((doc) => (
                    <div key={doc.id} className="document-item">
                      <div className="document-icon">
                        {doc.fileType?.includes('pdf') ? '📄' :
                          doc.fileType?.includes('image') ? '🖼️' :
                            doc.fileType?.includes('word') ? '📝' : '📄'}
                      </div>
                      <div className="document-info">
                        <div className="document-name">{doc.name}</div>
                        <div className="document-meta">
                          {doc.uploadDate} • {doc.fileType?.split('/')[1]?.toUpperCase() || 'FILE'} •
                          {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <button
                        className="action-btn-bm download-btn"
                        onClick={() => handleDownloadDocument(doc)}
                        title="Download"
                      >
                        ⬇️
                      </button>
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

      {/* Notifications Management Modal */}
      {showNotificationsModal && selectedBroker && (
        <div className="modal-overlay" onClick={() => setShowNotificationsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Notification - {selectedBroker.name}</h2>
              <button className="close-btn" onClick={() => setShowNotificationsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="documents-summary">
                <p className="summary-text">
                  Broker Email: <strong>{selectedBroker.email}</strong>
                </p>
                <p className="summary-text">
                  Phone: <strong>{selectedBroker.phone}</strong>
                </p>
              </div>

              <h3 className="section-title">Create New Notification</h3>
              <form className="notification-form" onSubmit={handleSendNotification}>
                <div className="form-group">
                  <label>Notification Type *</label>
                  <select name="notificationType" required>
                    <option value="">Select Type</option>
                    <option>New Client Assignment</option>
                    <option>Commission Update</option>
                    <option>Performance Review</option>
                    <option>Meeting Scheduled</option>
                    <option>Document Request</option>
                    <option>General Announcement</option>
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
                    placeholder="e.g., New Client Assigned"
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
                  <div className="notification-icon success">✓</div>
                  <div className="notification-info">
                    <div className="notification-title">Commission Update Sent</div>
                    <div className="notification-meta">Sent 1 day ago • Read</div>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-icon pending">📧</div>
                  <div className="notification-info">
                    <div className="notification-title">New Client Assignment</div>
                    <div className="notification-meta">Sent 3 days ago • Delivered</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Buyers/Suppliers Modal */}
      {showAssignmentModal && selectedBroker && (
        <div className="modal-overlay" onClick={() => setShowAssignmentModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Buyers & Suppliers - {selectedBroker.name}</h2>
              <button className="close-btn" onClick={() => setShowAssignmentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="documents-summary">
                <p className="summary-text">
                  Broker: <strong>{selectedBroker.name}</strong>
                </p>
                <p className="summary-text">
                  Current Assignments: <strong>{getAssignedBuyers(selectedBroker.id).length} Buyers, {getAssignedSuppliers(selectedBroker.id).length} Suppliers</strong>
                </p>
                {(availableBuyers.length > 0 || availableSuppliers.length > 0) && (
                  <p className="summary-text" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                    💡 Buyers synced from User Management, Suppliers from Supplier Management
                  </p>
                )}
              </div>

              <form className="assignment-form" onSubmit={handleSaveAssignments}>
                <div className="assignment-section">
                  <h3 className="section-title">Assign Buyers ({availableBuyers.length} available)</h3>
                  {availableBuyers.length > 0 ? (
                    <div className="assignment-checkboxes">
                      {availableBuyers.map(buyer => (
                        <label key={buyer.id} className="assignment-checkbox-label">
                          <input
                            type="checkbox"
                            name="buyers"
                            value={buyer.id}
                            defaultChecked={brokerAssignments[selectedBroker.id]?.buyers?.includes(buyer.id)}
                          />
                          <div className="assignment-info">
                            <span className="assignment-name">👤 {buyer.name}</span>
                            <span className="assignment-details">{buyer.project} - {buyer.property}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="no-buyers-available">
                      <p>No buyers available. Please create users in User Management first.</p>
                    </div>
                  )}
                </div>

                <div className="assignment-section">
                  <h3 className="section-title">Assign Suppliers ({availableSuppliers.length} available)</h3>
                  {availableSuppliers.length > 0 ? (
                    <div className="assignment-checkboxes">
                      {availableSuppliers.map(supplier => (
                        <label key={supplier.id} className="assignment-checkbox-label">
                          <input
                            type="checkbox"
                            name="suppliers"
                            value={supplier.id}
                            defaultChecked={brokerAssignments[selectedBroker.id]?.suppliers?.includes(supplier.id)}
                          />
                          <div className="assignment-info">
                            <span className="assignment-name">🏭 {supplier.companyName}</span>
                            <span className="assignment-details">{supplier.category} - {supplier.location || 'Location N/A'}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="no-buyers-available">
                      <p>No suppliers available. Please create suppliers in Supplier Management first.</p>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowAssignmentModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Assignments</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Commission Management Modal */}
      {showCommissionModal && selectedBroker && (
        <div className="modal-overlay" onClick={() => setShowCommissionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Commission - {selectedBroker.name}</h2>
              <button className="close-btn" onClick={() => setShowCommissionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="documents-summary">
                <p className="summary-text">
                  Broker: <strong>{selectedBroker.name}</strong>
                </p>
                <p className="summary-text">
                  Email: <strong>{selectedBroker.email}</strong>
                </p>
                <p className="summary-text">
                  Current Commission Rate: <strong>{selectedBroker.commission || 'N/A'}</strong>
                </p>
              </div>

              <h3 className="section-title">Update Commission Rate</h3>
              <form className="commission-form" onSubmit={handleSaveCommission}>
                <div className="form-group">
                  <label>Commission Rate *</label>
                  <input
                    type="text"
                    name="commission"
                    placeholder="e.g., 2.5% or 2.5"
                    defaultValue={selectedBroker.commission && selectedBroker.commission !== 'N/A' ? selectedBroker.commission : ''}
                    pattern="[0-9]+(\.[0-9]{1,2})?%?"
                    title="Enter a valid commission rate (e.g., 2.5% or 2.5)"
                    required
                  />
                  <small style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                    Enter commission as percentage (e.g., 2.5% or 2.5). This rate will be applied to all deals.
                  </small>
                </div>

                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    name="commissionNotes"
                    rows="3"
                    placeholder="Add any notes about this commission rate change..."
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowCommissionModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update Commission</button>
                </div>
              </form>

              <h3 className="section-title" style={{ marginTop: '30px' }}>Commission Information</h3>
              <div className="commission-info-section">
                <div className="info-item">
                  <span className="info-label">📊 Performance:</span>
                  <span className={`performance-badge ${getPerformanceColor(selectedBroker.performance || 'Average')}`}>
                    {selectedBroker.performance || 'Average'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">💰 Total Commission Earned:</span>
                  <span className="info-value">Calculated based on deals</span>
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

export default BrokerManagement

