import { useState, useMemo, useEffect } from 'react'
import { useApiFetch, useNotification } from '../../lib/apiHelpers'
import './SupplierManagement.css'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
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



function SupplierManagement() {
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [showBrokerAssignmentModal, setShowBrokerAssignmentModal] = useState(false)
  const [showPerformanceModal, setShowPerformanceModal] = useState(false)
  const [showFulfillmentModal, setShowFulfillmentModal] = useState(false)
  const [notification, showNotification] = useNotification()
  const { fetchData } = useApiFetch()

  // Form Validation States
  const [formErrors, setFormErrors] = useState({})

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')

  // Suppliers State - Load from API
  const [suppliers, setSuppliers] = useState([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)

  // Store uploaded documents
  const [supplierDocuments, setSupplierDocuments] = useState(() => {
    const savedDocs = localStorage.getItem('legacy-admin-supplier-documents')
    return savedDocs ? JSON.parse(savedDocs) : {}
  })

  // Load brokers from Broker Management
  const [availableBrokers, setAvailableBrokers] = useState(() => {
    const savedBrokers = localStorage.getItem('legacy-admin-brokers')
    return savedBrokers ? JSON.parse(savedBrokers) : []
  })

  // Store broker assignments for suppliers
  const [supplierBrokerAssignments, setSupplierBrokerAssignments] = useState(() => {
    const savedAssignments = localStorage.getItem('legacy-admin-supplier-broker-assignments')
    return savedAssignments ? JSON.parse(savedAssignments) : {}
  })

  // Store supplier performance data
  const [supplierPerformance, setSupplierPerformance] = useState(() => {
    const savedPerformance = localStorage.getItem('legacy-admin-supplier-performance')
    return savedPerformance ? JSON.parse(savedPerformance) : {}
  })

  // Note: Suppliers are now loaded from API, not localStorage

  useEffect(() => {
    localStorage.setItem('legacy-admin-supplier-documents', JSON.stringify(supplierDocuments))
  }, [supplierDocuments])

  useEffect(() => {
    localStorage.setItem('legacy-admin-supplier-broker-assignments', JSON.stringify(supplierBrokerAssignments))
  }, [supplierBrokerAssignments])

  useEffect(() => {
    localStorage.setItem('legacy-admin-supplier-performance', JSON.stringify(supplierPerformance))
  }, [supplierPerformance])

  // Listen for changes in Broker Management and update available brokers
  useEffect(() => {
    const handleStorageChange = () => {
      const savedBrokers = localStorage.getItem('legacy-admin-brokers')
      if (savedBrokers) {
        setAvailableBrokers(JSON.parse(savedBrokers))
      }
    }

    window.addEventListener('storage', handleStorageChange)

    const interval = setInterval(() => {
      const savedBrokers = localStorage.getItem('legacy-admin-brokers')
      const currentBrokers = JSON.stringify(availableBrokers)
      if (savedBrokers && savedBrokers !== currentBrokers) {
        setAvailableBrokers(JSON.parse(savedBrokers))
      }
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [availableBrokers])

  // Helper function to fetch suppliers using role filter
  const fetchSuppliers = async () => {
    const suppliersRes = await fetchData('/suppliers')
    if (suppliersRes.success && suppliersRes.data) {
      setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : [])
      return true
    }
    return false
  }

  // Load suppliers from API
  useEffect(() => {
    const loadData = async () => {
      setLoadingSuppliers(true)
      try {
        const suppliersRes = await fetchData('/users?role=supplier')
        if (suppliersRes.success && suppliersRes.data) {
          setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
        showNotification('Failed to load data', 'error')
      } finally {
        setLoadingSuppliers(false)
      }
    }
    loadData()
  }, [])

  // Helper to normalize supplier data (API format to UI format)
  const normalizeSupplier = (supplier) => {
    return {
      ...supplier,
      id: supplier._id || supplier.id,
      companyName: supplier.company || supplier.companyName || '',
      contactPerson: supplier.name || supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || ''
    }
  }

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.map(normalizeSupplier).filter(supplier => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        supplier.companyName?.toLowerCase().includes(searchLower) ||
        supplier.email?.toLowerCase().includes(searchLower) ||
        supplier.phone?.includes(searchQuery) ||
        supplier.contactPerson?.toLowerCase().includes(searchLower) ||
        supplier.address?.toLowerCase().includes(searchLower)

      return matchesSearch
    })
  }, [suppliers, searchQuery])

  // Table state
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})



  // Validation Functions
  const validateSupplierForm = (formData, isNewSupplier) => {
    const errors = {}
    
    // Company Name Validation
    const companyName = formData.get('companyName').trim()
    if (!companyName) {
      errors.companyName = 'Company name is required'
    } else if (companyName.length < 3) {
      errors.companyName = 'Company name must be at least 3 characters long'
    }
    
    // Contact Person Validation
    const contactPerson = formData.get('contactPerson').trim()
    if (!contactPerson) {
      errors.contactPerson = 'Contact person is required'
    } else if (contactPerson.length < 3) {
      errors.contactPerson = 'Contact person name must be at least 3 characters long'
    } else if (!/^[a-zA-Z\s]+$/.test(contactPerson)) {
      errors.contactPerson = 'Contact person can only contain letters and spaces'
    }
    
    // Email Validation
    const email = formData.get('email').trim()
    if (!email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    } else {
      // Check for duplicate email
      const isDuplicate = suppliers.some(s => 
        s.email.toLowerCase() === email.toLowerCase() && 
        (!selectedSupplier || s.id !== selectedSupplier.id)
      )
      if (isDuplicate) {
        errors.email = 'This email is already registered'
      }
    }
    
    // Phone Validation
    const phone = formData.get('phone').trim()
    if (!phone) {
      errors.phone = 'Phone number is required'
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      errors.phone = 'Please enter a valid 10-digit Indian mobile number'
    }
    
    // Address Validation (optional)
    const address = formData.get('address')?.trim() || ''
    
    // Password Validation (only for new suppliers)
    if (isNewSupplier) {
      const password = formData.get('password')
      const confirmPassword = formData.get('confirmPassword')
      
      if (!password) {
        errors.password = 'Password is required'
      } else if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters long'
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        errors.password = 'Password must contain uppercase, lowercase, and number'
      }
      
      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
    }
    
    return errors
  }

  const handleSaveSupplier = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    // Validate form
    const errors = validateSupplierForm(formData, !selectedSupplier)
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      showNotification('Please fix the validation errors', 'error')
      return
    }
    
    // Clear errors if validation passes
    setFormErrors({})
    
    // Map form data to API format
    const supplierData = {
      name: formData.get('contactPerson').trim(),
      email: formData.get('email').trim().toLowerCase(),
      phone: formData.get('phone').trim(),
      company: formData.get('companyName').trim(),
      address: formData.get('address').trim(),
      password: selectedSupplier ? undefined : '12345678' // Default password for new suppliers
    }

    const endpoint = selectedSupplier ? `/suppliers/${selectedSupplier._id || selectedSupplier.id}` : '/suppliers'
    const method = selectedSupplier ? 'PUT' : 'POST'
    
    const result = await fetchData(endpoint, {
      method,
      body: JSON.stringify(supplierData)
    })
    
    if (result.success) {
      showNotification(selectedSupplier ? 'Supplier updated successfully!' : 'Supplier created successfully!', 'success')
      // Reload suppliers from API
      await fetchSuppliers()
      setShowSupplierModal(false)
      setSelectedSupplier(null)
      setFormErrors({})
    } else {
      showNotification(result.error || 'Failed to save supplier', 'error')
    }
  }

  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier)
    setShowDetailsModal(true)
  }

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier)
    setShowSupplierModal(true)
  }

  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      const result = await fetchData(`/suppliers/${supplierId}`, { method: 'DELETE' })
      if (result.success) {
        showNotification('Supplier deleted successfully!', 'success')
        // Reload suppliers from API
        await fetchSuppliers()
      } else {
        showNotification(result.error || 'Failed to delete supplier', 'error')
      }
    }
  }

  const handleApproveSupplier = async (supplierId) => {
    const supplier = suppliers.find(s => (s._id || s.id) === supplierId)
    const supplierName = supplier?.company || supplier?.companyName || 'Supplier'
    if (window.confirm(`Approve ${supplierName} for onboarding?`)) {
      // Note: API doesn't have verification status, so we'll just show notification
      // In a real implementation, you'd add a verificationStatus field to the Supplier model
      showNotification(`${supplierName} has been approved!`, 'success')
      // Reload suppliers
      await fetchSuppliers()
    }
  }

  const handleRejectSupplier = async (supplierId) => {
    const supplier = suppliers.find(s => (s._id || s.id) === supplierId)
    const supplierName = supplier?.company || supplier?.companyName || 'Supplier'
    if (window.confirm(`Reject ${supplierName}'s onboarding application?`)) {
      // Note: API doesn't have verification status, so we'll just show notification
      showNotification(`${supplierName} has been rejected.`, 'success')
      // Reload suppliers
      await fetchSuppliers()
    }
  }

  const handleActivateSupplier = async (supplierId) => {
    const supplier = suppliers.find(s => (s._id || s.id) === supplierId)
    const supplierName = supplier?.company || supplier?.companyName || 'Supplier'
    if (window.confirm(`Activate ${supplierName}'s account?`)) {
      // Note: API doesn't have status field, so we'll just show notification
      showNotification(`${supplierName} activated!`, 'success')
      // Reload suppliers
      await fetchSuppliers()
    }
  }

  const handleDeactivateSupplier = async (supplierId) => {
    const supplier = suppliers.find(s => (s._id || s.id) === supplierId)
    const supplierName = supplier?.company || supplier?.companyName || 'Supplier'
    if (window.confirm(`Deactivate ${supplierName}'s account?`)) {
      // Note: API doesn't have status field, so we'll just show notification
      showNotification(`${supplierName} deactivated!`, 'success')
      // Reload suppliers
      await fetchSuppliers()
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
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
    // Update document verified status
    const updatedDocs = {
      ...supplierDocuments,
      [selectedSupplier.id]: supplierDocuments[selectedSupplier.id].map(doc =>
        doc.id === docId ? { ...doc, verified: true } : doc
      )
    }
    
    setSupplierDocuments(updatedDocs)
    
    // Check if all documents are now verified
    const allVerified = updatedDocs[selectedSupplier.id].every(doc => doc.verified)
    
    // If all documents are verified, update supplier verification status
    if (allVerified && updatedDocs[selectedSupplier.id].length > 0) {
      const updatedSupplier = {
        ...selectedSupplier,
        verificationStatus: 'Approved',
        status: selectedSupplier.status === 'Inactive' ? 'Active' : selectedSupplier.status
      }
      
      setSuppliers(suppliers.map(s => 
        s.id === selectedSupplier.id ? updatedSupplier : s
      ))
      
      // Update the selected supplier state to reflect changes in the modal
      setSelectedSupplier(updatedSupplier)
      
      showNotification('All documents verified! Supplier approved.', 'success')
    } else {
      showNotification('Document verified successfully!', 'success')
    }
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

  // Broker Assignment Handlers
  const handleManageBrokers = (supplier) => {
    setSelectedSupplier(supplier)
    setShowBrokerAssignmentModal(true)
  }

  const handleSaveBrokerAssignments = (e) => {
    e.preventDefault()
    
    const brokerCheckboxes = document.querySelectorAll('input[name="brokers"]:checked')
    const selectedBrokers = Array.from(brokerCheckboxes).map(cb => parseInt(cb.value))
    
    setSupplierBrokerAssignments(prev => ({
      ...prev,
      [selectedSupplier.id]: selectedBrokers
    }))

    showNotification(`Brokers assigned to ${selectedSupplier.companyName}!`, 'success')
    setShowBrokerAssignmentModal(false)
    setSelectedSupplier(null)
  }

  const getAssignedBrokers = (supplierId) => {
    const assignments = supplierBrokerAssignments[supplierId]
    if (!assignments) return []
    return availableBrokers.filter(b => assignments.includes(b.id))
  }

  // Performance History Handlers
  const handleViewPerformance = (supplier) => {
    setSelectedSupplier(supplier)
    setShowPerformanceModal(true)
    
    // Initialize performance data if not exists
    if (!supplierPerformance[supplier.id]) {
      setSupplierPerformance(prev => ({
        ...prev,
        [supplier.id]: {
          totalBids: 0,
          wonBids: 0,
          lostBids: 0,
          pendingBids: 0,
          totalRevenue: 0,
          averageBidValue: 0,
          winRate: 0,
          bidsHistory: []
        }
      }))
    }
  }

  // Fulfillment Record Handlers
  const handleViewFulfillment = (supplier) => {
    setSelectedSupplier(supplier)
    setShowFulfillmentModal(true)
  }

  // Calculate fulfillment stats from real orders
  const getFulfillmentStats = (supplierId) => {
    // Note: Orders functionality has been removed
    // Returning empty stats structure for compatibility
    const supplierOrders = []
    const totalOrders = supplierOrders.length
    const completedOrders = supplierOrders.filter(o => o.status === 'delivered').length
    const cancelledOrders = supplierOrders.filter(o => o.status === 'cancelled').length
    
    const deliveredOrders = supplierOrders.filter(o => o.status === 'delivered' && o.expectedDelivery && o.actualDelivery)
    const onTimeDeliveries = deliveredOrders.filter(o => {
      const expected = new Date(o.expectedDelivery)
      const actual = new Date(o.actualDelivery)
      return actual <= expected
    }).length
    const lateDeliveries = deliveredOrders.length - onTimeDeliveries
    
    const deliverySuccessRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
    const onTimeRate = deliveredOrders.length > 0 ? Math.round((onTimeDeliveries / deliveredOrders.length) * 100) : 0
    
    // Calculate average delivery time
    let totalDays = 0
    let count = 0
    deliveredOrders.forEach(order => {
      if (order.createdAt && order.actualDelivery) {
        const created = new Date(order.createdAt)
        const delivered = new Date(order.actualDelivery)
        const days = Math.round((delivered - created) / (1000 * 60 * 60 * 24))
        totalDays += days
        count++
      }
    })
    const averageDeliveryTime = count > 0 ? Math.round(totalDays / count) : 0
    
    // Recent orders (last 10)
    const recentOrders = supplierOrders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(order => ({
        orderId: order.orderNumber,
        orderDate: new Date(order.createdAt).toLocaleDateString(),
        deliveryDate: order.actualDelivery ? new Date(order.actualDelivery).toLocaleDateString() : null,
        deliveryTime: order.createdAt && order.actualDelivery 
          ? Math.round((new Date(order.actualDelivery) - new Date(order.createdAt)) / (1000 * 60 * 60 * 24))
          : null,
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' '),
        onTime: order.expectedDelivery && order.actualDelivery 
          ? new Date(order.actualDelivery) <= new Date(order.expectedDelivery)
          : undefined
      }))
    
    return {
      totalOrders,
      completedOrders,
      onTimeDeliveries,
      lateDeliveries,
      cancelledOrders,
      deliverySuccessRate,
      onTimeRate,
      averageDeliveryTime,
      recentOrders
    }
  }

  // Reset Password Handler
  const handleResetPassword = (supplier) => {
    if (window.confirm(`Send password reset link to ${supplier.email}?`)) {
      showNotification(`Password reset link sent to ${supplier.email}`, 'success')
    }
  }


  // Define columns
  const columns = useMemo(() => [
    {
      accessorKey: "companyName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Company" />
      ),
      cell: ({ row }) => {
        const supplier = row.original
        return (
          <div className="supplier-cell">
            <div className="supplier-avatar">
              {(supplier.companyName || supplier.company || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="supplier-name">{supplier.companyName || supplier.company || 'N/A'}</div>
              <div className="supplier-meta">{supplier.email || 'N/A'}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "contactPerson",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact Person" />
      ),
      cell: ({ row }) => {
        const supplier = row.original
        return (
            <div>
              <div className="contact-name">{supplier.contactPerson || supplier.name || 'N/A'}</div>
              <div className="supplier-meta">{supplier.phone || 'N/A'}</div>
            </div>
        )
      },
    },
    {
      accessorKey: "address",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Address" />
      ),
      cell: ({ row }) => row.original.address || 'N/A',
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const supplier = row.original
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
              <DropdownMenuItem onClick={() => handleViewDetails(supplier)}>
                👁️ View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditSupplier(supplier)}>
                ✏️ Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleManageBrokers(supplier)}>
                🤝 Assign Brokers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewPerformance(supplier)}>
                📊 Performance History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewFulfillment(supplier)}>
                🚚 Fulfillment Record
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleResetPassword(supplier)}>
                🔑 Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDeleteSupplier(supplier.id || supplier._id)}>
                🗑️ Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [])

  const table = useReactTable({
    data: filteredSuppliers,
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

  if (loadingSuppliers) {
    return <div className="loading-state">Loading suppliers...</div>
  }

  return (
    <div className="supplier-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-main">Supplier Management</h1>
          <p className="page-subtitle">Manage supplier accounts and information</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => { setSelectedSupplier(null); setShowSupplierModal(true); }}>
            + Create New Supplier
          </button>
        </div>
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
      </div>

      {/* Filters */}
      <div className="card filters-section">
        <div className="filters-grid">
          <input 
            type="text" 
            placeholder="Search by company, contact, email, phone, address..." 
            className="search-input-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-outline clear-filters-btn" onClick={handleClearFilters}>
            Clear
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="card suppliers-table-card">
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter by company name..."
            value={(table.getColumn("companyName")?.getFilterValue() ?? "")}
            onChange={(event) =>
              table.getColumn("companyName")?.setFilterValue(event.target.value)
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
                    {suppliers.length === 0 ? 'No suppliers yet. Click "Create New Supplier" to add your first supplier.' : 'No suppliers found matching your criteria'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="py-4">
          <DataTablePagination table={table} />
        </div>

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
            </div>
            
            <div className="supplier-card-body">
              <div className="card-info-row">
                <span className="card-label">👤 Contact:</span>
                <span>{supplier.contactPerson || supplier.name || 'N/A'}</span>
              </div>
              <div className="card-info-row">
                <span className="card-label">📞 Phone:</span>
                <span>{supplier.phone || 'N/A'}</span>
              </div>
              <div className="card-info-row">
                <span className="card-label">📍 Address:</span>
                <span>{supplier.address || 'N/A'}</span>
              </div>
            </div>

            <div className="supplier-card-actions">
              <button className="btn btn-outline" onClick={() => handleViewDetails(supplier)}>👁️ View</button>
              <button className="btn btn-primary" onClick={() => handleEditSupplier(supplier)}>✏️ Edit</button>
            </div>
            
            <div className="supplier-card-actions" style={{ marginTop: '8px' }}>
              <button className="btn btn-outline" onClick={() => handleManageBrokers(supplier)}>🤝 Brokers</button>
              <button className="btn btn-outline" onClick={() => handleViewPerformance(supplier)}>📊 Performance</button>
            </div>
            
            <div className="supplier-card-actions" style={{ marginTop: '8px' }}>
              <button className="btn btn-outline" onClick={() => handleViewFulfillment(supplier)}>🚚 Fulfillment</button>
              <button className="btn btn-outline" onClick={() => handleResetPassword(supplier)}>🔑 Reset Password</button>
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
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <label>Contact Person</label>
                  <p>{selectedSupplier.contactPerson || selectedSupplier.name || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <p>{selectedSupplier.email || 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <p>{selectedSupplier.phone || 'N/A'}</p>
                </div>
              </div>

              {selectedSupplier.address && (
                <div className="address-section">
                  <label>Address</label>
                  <p>{selectedSupplier.address}</p>
                </div>
              )}

              {/* Assigned Brokers Section */}
              <div className="details-section">
                <h4>Assigned Brokers ({getAssignedBrokers(selectedSupplier.id).length})</h4>
                {getAssignedBrokers(selectedSupplier.id).length > 0 ? (
                  <div className="assignments-list">
                    {getAssignedBrokers(selectedSupplier.id).map(broker => (
                      <div key={broker.id} className="assignment-item">
                        <span>🤝 {broker.name}</span>
                        <span className="assignment-meta">{broker.email} - {broker.phone}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-assignments">No brokers assigned yet</p>
                )}
              </div>

              <div className="account-actions-section">
                <h4>Supplier Actions</h4>
                <div className="account-actions-grid">
                  <button className="btn btn-outline" onClick={() => { setShowDetailsModal(false); handleManageBrokers(selectedSupplier); }}>
                    🤝 Assign Brokers
                  </button>
                  <button className="btn btn-outline" onClick={() => { setShowDetailsModal(false); handleViewPerformance(selectedSupplier); }}>
                    📊 View Performance
                  </button>
                  <button className="btn btn-outline" onClick={() => { setShowDetailsModal(false); handleViewFulfillment(selectedSupplier); }}>
                    🚚 Fulfillment Record
                  </button>
                  <button className="btn btn-outline" onClick={() => { setShowDetailsModal(false); handleResetPassword(selectedSupplier); }}>
                    🔑 Reset Password
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
              <button className="close-btn" onClick={() => { setShowSupplierModal(false); setFormErrors({}); }}>×</button>
            </div>
            <div className="modal-body">
              <form className="supplier-form" onSubmit={handleSaveSupplier}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input 
                      type="text" 
                      name="companyName" 
                      placeholder="Company name" 
                      defaultValue={selectedSupplier?.companyName}
                      minLength="3"
                      required 
                      className={formErrors.companyName ? 'error' : ''}
                    />
                    {formErrors.companyName && <span className="error-message">{formErrors.companyName}</span>}
                  </div>
                  <div className="form-group">
                    <label>Contact Person *</label>
                    <input 
                      type="text" 
                      name="contactPerson" 
                      placeholder="Contact person" 
                      defaultValue={selectedSupplier?.contactPerson}
                      minLength="3"
                      pattern="[a-zA-Z\s]+"
                      title="Contact person can only contain letters and spaces"
                      required 
                      className={formErrors.contactPerson ? 'error' : ''}
                    />
                    {formErrors.contactPerson && <span className="error-message">{formErrors.contactPerson}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email *</label>
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="company@example.com" 
                      defaultValue={selectedSupplier?.email}
                      pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                      title="Please enter a valid email address"
                      required 
                      className={formErrors.email ? 'error' : ''}
                    />
                    {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      placeholder="Phone number" 
                      defaultValue={selectedSupplier?.phone}
                      pattern="[6-9][0-9]{9}"
                      maxLength="10"
                      title="Please enter a valid 10-digit Indian mobile number starting with 6-9"
                      required 
                      className={formErrors.phone ? 'error' : ''}
                    />
                    {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
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
                      <input 
                        type="password" 
                        name="password" 
                        placeholder="Password"
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
                  <button type="button" className="btn btn-outline" onClick={() => { setShowSupplierModal(false); setSelectedSupplier(null); setFormErrors({}); }}>Cancel</button>
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

      {/* Broker Assignment Modal */}
      {showBrokerAssignmentModal && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setShowBrokerAssignmentModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Brokers - {selectedSupplier.companyName}</h2>
              <button className="close-btn" onClick={() => setShowBrokerAssignmentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="documents-summary">
                <p className="summary-text">
                  Supplier: <strong>{selectedSupplier.companyName}</strong>
                </p>
                <p className="summary-text">
                  Current Assignments: <strong>{getAssignedBrokers(selectedSupplier.id).length} Brokers</strong>
                </p>
                {availableBrokers.length > 0 && (
                  <p className="summary-text" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                    💡 Brokers synced from Broker Management
                  </p>
                )}
              </div>

              <form className="assignment-form" onSubmit={handleSaveBrokerAssignments}>
                <div className="assignment-section">
                  <h3 className="section-title">Assign Brokers ({availableBrokers.length} available)</h3>
                  {availableBrokers.length > 0 ? (
                    <div className="assignment-checkboxes">
                      {availableBrokers.map(broker => (
                        <label key={broker.id} className="assignment-checkbox-label">
                          <input 
                            type="checkbox" 
                            name="brokers"
                            value={broker.id}
                            defaultChecked={supplierBrokerAssignments[selectedSupplier.id]?.includes(broker.id)}
                          />
                          <div className="assignment-info">
                            <span className="assignment-name">🤝 {broker.name}</span>
                            <span className="assignment-details">{broker.email} - {broker.phone}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="no-buyers-available">
                      <p>No brokers available. Please create brokers in Broker Management first.</p>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowBrokerAssignmentModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Assignments</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Performance History Modal */}
      {showPerformanceModal && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setShowPerformanceModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Performance History - {selectedSupplier.companyName}</h2>
              <button className="close-btn" onClick={() => setShowPerformanceModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="documents-summary">
                <p className="summary-text">
                  Supplier: <strong>{selectedSupplier.companyName}</strong>
                </p>
                <p className="summary-text">
                  Status: <strong>{selectedSupplier.verificationStatus}</strong>
                </p>
              </div>

              <h3 className="section-title">Bidding Performance</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Total Bids</label>
                  <p className="stat-value-sm">{supplierPerformance[selectedSupplier.id]?.totalBids || 0}</p>
                </div>
                <div className="detail-item">
                  <label>Won Bids</label>
                  <p className="stat-value-sm" style={{ color: 'var(--success)' }}>{supplierPerformance[selectedSupplier.id]?.wonBids || 0}</p>
                </div>
                <div className="detail-item">
                  <label>Lost Bids</label>
                  <p className="stat-value-sm" style={{ color: 'var(--error)' }}>{supplierPerformance[selectedSupplier.id]?.lostBids || 0}</p>
                </div>
                <div className="detail-item">
                  <label>Pending Bids</label>
                  <p className="stat-value-sm" style={{ color: 'var(--warning)' }}>{supplierPerformance[selectedSupplier.id]?.pendingBids || 0}</p>
                </div>
                <div className="detail-item">
                  <label>Win Rate</label>
                  <p className="stat-value-sm">{supplierPerformance[selectedSupplier.id]?.winRate || 0}%</p>
                </div>
                <div className="detail-item">
                  <label>Total Revenue</label>
                  <p className="stat-value-sm">₹{(supplierPerformance[selectedSupplier.id]?.totalRevenue || 0).toLocaleString()}</p>
                </div>
                <div className="detail-item">
                  <label>Average Bid Value</label>
                  <p className="stat-value-sm">₹{(supplierPerformance[selectedSupplier.id]?.averageBidValue || 0).toLocaleString()}</p>
                </div>
              </div>

              <h3 className="section-title" style={{ marginTop: '30px' }}>Recent Bids</h3>
              <div className="documents-list">
                {supplierPerformance[selectedSupplier.id]?.bidsHistory?.length > 0 ? (
                  supplierPerformance[selectedSupplier.id].bidsHistory.map((bid, index) => (
                    <div key={index} className="document-item">
                      <div className="document-icon">{bid.status === 'Won' ? '✅' : bid.status === 'Lost' ? '❌' : '⏳'}</div>
                      <div className="document-info">
                        <div className="document-name">{bid.projectName}</div>
                        <div className="document-meta">{bid.date} • ₹{bid.amount.toLocaleString()}</div>
                      </div>
                      <span className={`status-badge ${
                        bid.status === 'Won' ? 'status-success' : 
                        bid.status === 'Lost' ? 'status-error' : 
                        'status-warning'
                      }`}>
                        {bid.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="no-documents">No bidding history available yet.</p>
                )}
              </div>

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowPerformanceModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fulfillment Record Modal */}
      {showFulfillmentModal && selectedSupplier && (
        <div className="modal-overlay" onClick={() => setShowFulfillmentModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Fulfillment Record - {selectedSupplier.companyName}</h2>
              <button className="close-btn" onClick={() => setShowFulfillmentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="documents-summary">
                <p className="summary-text">
                  Supplier: <strong>{selectedSupplier.companyName}</strong>
                </p>
                <p className="summary-text">
                  Category: <strong>{selectedSupplier.category}</strong>
                </p>
              </div>

              <h3 className="section-title">Delivery Performance</h3>
              {(() => {
                const stats = getFulfillmentStats(selectedSupplier.id || selectedSupplier._id)
                return (
                  <>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Total Orders</label>
                        <p className="stat-value-sm">{stats.totalOrders}</p>
                </div>
                <div className="detail-item">
                  <label>Completed Orders</label>
                        <p className="stat-value-sm" style={{ color: 'var(--success)' }}>{stats.completedOrders}</p>
                </div>
                <div className="detail-item">
                  <label>On-Time Deliveries</label>
                        <p className="stat-value-sm" style={{ color: 'var(--success)' }}>{stats.onTimeDeliveries}</p>
                </div>
                <div className="detail-item">
                  <label>Late Deliveries</label>
                        <p className="stat-value-sm" style={{ color: 'var(--warning)' }}>{stats.lateDeliveries}</p>
                </div>
                <div className="detail-item">
                  <label>Cancelled Orders</label>
                        <p className="stat-value-sm" style={{ color: 'var(--error)' }}>{stats.cancelledOrders}</p>
                </div>
                <div className="detail-item">
                  <label>Success Rate</label>
                        <p className="stat-value-sm">{stats.deliverySuccessRate}%</p>
                </div>
                <div className="detail-item">
                  <label>On-Time Rate</label>
                        <p className="stat-value-sm">{stats.onTimeRate}%</p>
                </div>
                <div className="detail-item">
                  <label>Avg. Delivery Time</label>
                        <p className="stat-value-sm">{stats.averageDeliveryTime} days</p>
                </div>
              </div>

              <h3 className="section-title" style={{ marginTop: '30px' }}>Recent Orders</h3>
              <div className="documents-list">
                      {stats.recentOrders.length > 0 ? (
                        stats.recentOrders.map((order, index) => (
                    <div key={index} className="document-item">
                      <div className="document-icon">
                        {order.status === 'Delivered' ? '🚚' : order.status === 'Cancelled' ? '❌' : '⏳'}
                      </div>
                      <div className="document-info">
                        <div className="document-name">Order #{order.orderId}</div>
                        <div className="document-meta">
                                {order.orderDate} • Delivered: {order.deliveryDate || 'Pending'} • {order.deliveryTime ? `${order.deliveryTime} days` : 'N/A'}
                        </div>
                      </div>
                      <span className={`status-badge ${
                        order.status === 'Delivered' && order.onTime ? 'status-success' : 
                        order.status === 'Delivered' && !order.onTime ? 'status-warning' :
                        order.status === 'Cancelled' ? 'status-error' : 
                        'status-info'
                      }`}>
                        {order.status} {order.onTime !== undefined && (order.onTime ? '✓' : '⚠️')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="no-documents">No order history available yet.</p>
                )}
              </div>
                  </>
                )
              })()}

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowFulfillmentModal(false)}>Close</button>
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



