import { useState, useMemo, useEffect } from 'react'
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
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [notification, setNotification] = useState(null)

  // Form Validation States
  const [formErrors, setFormErrors] = useState({})

  // Categories and Material Types Management
  const [categories, setCategories] = useState(() => {
    const savedCategories = localStorage.getItem('legacy-admin-supplier-categories')
    return savedCategories ? JSON.parse(savedCategories) : [
      'Building Materials',
      'Cement & Concrete',
      'Steel & Metal',
      'Electrical',
      'Plumbing',
      'Paint & Coating',
      'Hardware'
    ]
  })

  const [materialTypes, setMaterialTypes] = useState(() => {
    const savedMaterials = localStorage.getItem('legacy-admin-material-types')
    return savedMaterials ? JSON.parse(savedMaterials) : [
      'TMT Bars',
      'Cement Bags',
      'Sand',
      'Aggregates',
      'Paint',
      'Pipes',
      'Fittings',
      'Wires & Cables'
    ]
  })

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

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('legacy-admin-suppliers', JSON.stringify(suppliers))
  }, [suppliers])

  useEffect(() => {
    localStorage.setItem('legacy-admin-supplier-documents', JSON.stringify(supplierDocuments))
  }, [supplierDocuments])

  useEffect(() => {
    localStorage.setItem('legacy-admin-supplier-broker-assignments', JSON.stringify(supplierBrokerAssignments))
  }, [supplierBrokerAssignments])

  useEffect(() => {
    localStorage.setItem('legacy-admin-supplier-performance', JSON.stringify(supplierPerformance))
  }, [supplierPerformance])

  useEffect(() => {
    localStorage.setItem('legacy-admin-supplier-categories', JSON.stringify(categories))
  }, [categories])

  useEffect(() => {
    localStorage.setItem('legacy-admin-material-types', JSON.stringify(materialTypes))
  }, [materialTypes])

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

  // Table state
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

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
    
    // Category Validation
    const category = formData.get('category')
    if (!category || category === '') {
      errors.category = 'Please select a category'
    }
    
    // GST Number Validation
    const gstNumber = formData.get('gstNumber').trim()
    if (!gstNumber) {
      errors.gstNumber = 'GST number is required'
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
      errors.gstNumber = 'Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)'
    }
    
    // PAN Number Validation (optional but validate if provided)
    const panNumber = formData.get('panNumber').trim()
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      errors.panNumber = 'Please enter a valid PAN number (e.g., AAAAA0000A)'
    }
    
    // Location Validation
    const location = formData.get('location').trim()
    if (!location) {
      errors.location = 'Location is required'
    } else if (location.length < 2) {
      errors.location = 'Location must be at least 2 characters'
    }
    
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

  const handleSaveSupplier = (e) => {
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
    
    const supplierData = {
      id: selectedSupplier ? selectedSupplier.id : Date.now(),
      companyName: formData.get('companyName').trim(),
      contactPerson: formData.get('contactPerson').trim(),
      email: formData.get('email').trim(),
      phone: formData.get('phone').trim(),
      category: formData.get('category'),
      materialType: formData.get('materialType'),
      gstNumber: formData.get('gstNumber').trim(),
      panNumber: formData.get('panNumber').trim(),
      location: formData.get('location').trim(),
      address: formData.get('address').trim(),
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
    setFormErrors({})
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
    
    // Initialize fulfillment data if not exists
    if (!supplierPerformance[supplier.id]?.fulfillment) {
      setSupplierPerformance(prev => ({
        ...prev,
        [supplier.id]: {
          ...prev[supplier.id],
          fulfillment: {
            totalOrders: 0,
            completedOrders: 0,
            onTimeDeliveries: 0,
            lateDeliveries: 0,
            cancelledOrders: 0,
            deliverySuccessRate: 0,
            onTimeRate: 0,
            averageDeliveryTime: 0,
            recentOrders: []
          }
        }
      }))
    }
  }

  // Reset Password Handler
  const handleResetPassword = (supplier) => {
    if (window.confirm(`Send password reset link to ${supplier.email}?`)) {
      showNotification(`Password reset link sent to ${supplier.email}`, 'success')
    }
  }

  // Categories Management Handlers
  const handleAddCategory = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const newCategory = formData.get('newCategory').trim()
    
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory])
      showNotification(`Category "${newCategory}" added!`, 'success')
      e.target.reset()
    } else if (categories.includes(newCategory)) {
      showNotification('Category already exists!', 'error')
    }
  }

  const handleRemoveCategory = (category) => {
    if (window.confirm(`Remove category "${category}"? Suppliers with this category will need to be updated.`)) {
      setCategories(categories.filter(c => c !== category))
      showNotification(`Category "${category}" removed!`, 'success')
    }
  }

  const handleAddMaterialType = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const newMaterial = formData.get('newMaterial').trim()
    
    if (newMaterial && !materialTypes.includes(newMaterial)) {
      setMaterialTypes([...materialTypes, newMaterial])
      showNotification(`Material type "${newMaterial}" added!`, 'success')
      e.target.reset()
    } else if (materialTypes.includes(newMaterial)) {
      showNotification('Material type already exists!', 'error')
    }
  }

  const handleRemoveMaterialType = (material) => {
    if (window.confirm(`Remove material type "${material}"?`)) {
      setMaterialTypes(materialTypes.filter(m => m !== material))
      showNotification(`Material type "${material}" removed!`, 'success')
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
              {supplier.companyName.charAt(0)}
            </div>
            <div>
              <div className="supplier-name">{supplier.companyName}</div>
              <div className="supplier-meta">{supplier.email}</div>
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
            <div className="contact-name">{supplier.contactPerson}</div>
            <div className="supplier-meta">{supplier.phone}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
    },
    {
      accessorKey: "materialType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Material Type" />
      ),
      cell: ({ row }) => row.original.materialType || 'Various',
    },
    {
      accessorKey: "gstNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="GST Number" />
      ),
      cell: ({ row }) => (
        <span className="gst-text">{row.original.gstNumber || 'N/A'}</span>
      ),
    },
    {
      accessorKey: "location",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) => row.original.location || 'N/A',
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <span className={`status-badge ${status === 'Active' ? 'status-success' : 'status-error'}`}>
            {status}
          </span>
        )
      },
    },
    {
      accessorKey: "verificationStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Verification" />
      ),
      cell: ({ row }) => {
        const status = row.original.verificationStatus
        return (
          <span className={`status-badge ${
            status === 'Approved' ? 'status-success' : 
            status === 'Pending' ? 'status-warning' : 
            'status-error'
          }`}>
            {status}
          </span>
        )
      },
    },
    {
      accessorKey: "documents",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Docs" />
      ),
      cell: ({ row }) => (
        <span className="docs-count">{row.original.documents || 0}</span>
      ),
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
              {supplier.verificationStatus === 'Pending' && (
                <>
                  <DropdownMenuItem onClick={() => handleApproveSupplier(supplier.id)}>
                    ✅ Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRejectSupplier(supplier.id)}>
                    ❌ Reject
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => supplier.status === 'Active' ? handleDeactivateSupplier(supplier.id) : handleActivateSupplier(supplier.id)}>
                {supplier.status === 'Active' ? '⏸️ Deactivate' : '▶️ Activate'}
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
              <DropdownMenuItem onClick={() => handleManageDocuments(supplier)}>
                📄 Documents
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDeleteSupplier(supplier.id)}>
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

  return (
    <div className="supplier-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-main">Supplier Management</h1>
          <p className="page-subtitle">Manage supplier accounts, verify documents, and approve onboarding</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => setShowCategoriesModal(true)}>
            🏷️ Manage Categories
          </button>
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
            {categories.map((cat, index) => (
              <option key={index}>{cat}</option>
            ))}
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
            {/* <option>Rejected</option> */}
          </select>
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

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select 
                      name="category" 
                      defaultValue={selectedSupplier?.category || ''} 
                      required
                      className={formErrors.category ? 'error' : ''}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat, index) => (
                        <option key={index} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {formErrors.category && <span className="error-message">{formErrors.category}</span>}
                  </div>
                  <div className="form-group">
                    <label>Material Type</label>
                    <select name="materialType" defaultValue={selectedSupplier?.materialType || ''}>
                      <option value="">Select Material Type</option>
                      {materialTypes.map((material, index) => (
                        <option key={index} value={material}>{material}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>GST Number *</label>
                    <input 
                      type="text" 
                      name="gstNumber" 
                      placeholder="22AAAAA0000A1Z5" 
                      defaultValue={selectedSupplier?.gstNumber}
                      pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"
                      maxLength="15"
                      title="Please enter a valid 15-character GST number"
                      required 
                      className={formErrors.gstNumber ? 'error' : ''}
                    />
                    {formErrors.gstNumber && <span className="error-message">{formErrors.gstNumber}</span>}
                    <small style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                      Format: 22AAAAA0000A1Z5 (15 characters)
                    </small>
                  </div>
                  <div className="form-group">
                    <label>PAN Number</label>
                    <input 
                      type="text" 
                      name="panNumber" 
                      placeholder="AAAAA0000A" 
                      defaultValue={selectedSupplier?.panNumber}
                      pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                      maxLength="10"
                      title="Please enter a valid 10-character PAN number"
                      className={formErrors.panNumber ? 'error' : ''}
                    />
                    {formErrors.panNumber && <span className="error-message">{formErrors.panNumber}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Location *</label>
                    <input 
                      type="text" 
                      name="location" 
                      placeholder="City, State" 
                      defaultValue={selectedSupplier?.location}
                      minLength="2"
                      required 
                      className={formErrors.location ? 'error' : ''}
                    />
                    {formErrors.location && <span className="error-message">{formErrors.location}</span>}
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
              <div className="details-grid">
                <div className="detail-item">
                  <label>Total Orders</label>
                  <p className="stat-value-sm">{supplierPerformance[selectedSupplier.id]?.fulfillment?.totalOrders || 0}</p>
                </div>
                <div className="detail-item">
                  <label>Completed Orders</label>
                  <p className="stat-value-sm" style={{ color: 'var(--success)' }}>{supplierPerformance[selectedSupplier.id]?.fulfillment?.completedOrders || 0}</p>
                </div>
                <div className="detail-item">
                  <label>On-Time Deliveries</label>
                  <p className="stat-value-sm" style={{ color: 'var(--success)' }}>{supplierPerformance[selectedSupplier.id]?.fulfillment?.onTimeDeliveries || 0}</p>
                </div>
                <div className="detail-item">
                  <label>Late Deliveries</label>
                  <p className="stat-value-sm" style={{ color: 'var(--warning)' }}>{supplierPerformance[selectedSupplier.id]?.fulfillment?.lateDeliveries || 0}</p>
                </div>
                <div className="detail-item">
                  <label>Cancelled Orders</label>
                  <p className="stat-value-sm" style={{ color: 'var(--error)' }}>{supplierPerformance[selectedSupplier.id]?.fulfillment?.cancelledOrders || 0}</p>
                </div>
                <div className="detail-item">
                  <label>Success Rate</label>
                  <p className="stat-value-sm">{supplierPerformance[selectedSupplier.id]?.fulfillment?.deliverySuccessRate || 0}%</p>
                </div>
                <div className="detail-item">
                  <label>On-Time Rate</label>
                  <p className="stat-value-sm">{supplierPerformance[selectedSupplier.id]?.fulfillment?.onTimeRate || 0}%</p>
                </div>
                <div className="detail-item">
                  <label>Avg. Delivery Time</label>
                  <p className="stat-value-sm">{supplierPerformance[selectedSupplier.id]?.fulfillment?.averageDeliveryTime || 0} days</p>
                </div>
              </div>

              <h3 className="section-title" style={{ marginTop: '30px' }}>Recent Orders</h3>
              <div className="documents-list">
                {supplierPerformance[selectedSupplier.id]?.fulfillment?.recentOrders?.length > 0 ? (
                  supplierPerformance[selectedSupplier.id].fulfillment.recentOrders.map((order, index) => (
                    <div key={index} className="document-item">
                      <div className="document-icon">
                        {order.status === 'Delivered' ? '🚚' : order.status === 'Cancelled' ? '❌' : '⏳'}
                      </div>
                      <div className="document-info">
                        <div className="document-name">Order #{order.orderId}</div>
                        <div className="document-meta">
                          {order.orderDate} • Delivered: {order.deliveryDate || 'Pending'} • {order.deliveryTime} days
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

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowFulfillmentModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Management Modal */}
      {showCategoriesModal && (
        <div className="modal-overlay" onClick={() => setShowCategoriesModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Categories & Material Types</h2>
              <button className="close-btn" onClick={() => setShowCategoriesModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="documents-summary">
                <p className="summary-text">
                  Manage supplier categories and material types for the entire system
                </p>
              </div>

              {/* Categories Section */}
              <div className="assignment-section">
                <h3 className="section-title">Supplier Categories ({categories.length})</h3>
                
                <form onSubmit={handleAddCategory} style={{ marginBottom: '20px' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Add New Category</label>
                      <input 
                        type="text" 
                        name="newCategory"
                        placeholder="e.g., Wood & Timber"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', marginTop: '28px' }}>
                      Add Category
                    </button>
                  </div>
                </form>

                <div className="documents-list">
                  {categories.map((category, index) => (
                    <div key={index} className="document-item">
                      <div className="document-icon">🏷️</div>
                      <div className="document-info">
                        <div className="document-name">{category}</div>
                        <div className="document-meta">Category #{index + 1}</div>
                      </div>
                      <button 
                        className="action-btn" 
                        title="Remove Category"
                        onClick={() => handleRemoveCategory(category)}
                        style={{ padding: '8px 12px', background: 'var(--error)', color: 'white', borderRadius: '6px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Material Types Section */}
              <div className="assignment-section" style={{ marginTop: '30px' }}>
                <h3 className="section-title">Material Types ({materialTypes.length})</h3>
                
                <form onSubmit={handleAddMaterialType} style={{ marginBottom: '20px' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Add New Material Type</label>
                      <input 
                        type="text" 
                        name="newMaterial"
                        placeholder="e.g., Ceramic Tiles"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', marginTop: '28px' }}>
                      Add Material
                    </button>
                  </div>
                </form>

                <div className="documents-list">
                  {materialTypes.map((material, index) => (
                    <div key={index} className="document-item">
                      <div className="document-icon">📦</div>
                      <div className="document-info">
                        <div className="document-name">{material}</div>
                        <div className="document-meta">Material Type #{index + 1}</div>
                      </div>
                      <button 
                        className="action-btn" 
                        title="Remove Material Type"
                        onClick={() => handleRemoveMaterialType(material)}
                        style={{ padding: '8px 12px', background: 'var(--error)', color: 'white', borderRadius: '6px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-primary" onClick={() => setShowCategoriesModal(false)}>Done</button>
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



