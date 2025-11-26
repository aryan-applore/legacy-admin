import { useState, useMemo, useEffect } from 'react'
import './PropertyManagement.css'
import { 
  Home, 
  DollarSign, 
  Search,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Plus,
  MoreHorizontal,
  Building2,
  Calendar,
  Percent,
  Layers,
  User,
  Briefcase,
  Image as ImageIcon,
  Hash,
  FileText,
  ExternalLink
} from 'lucide-react'
import PropertyForm from '../../components/PropertyForm/PropertyForm'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
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
import { SearchableSelect } from "@/components/ui/searchable-select"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"

// Utilities
import {
  formatLocation,
  getStatus,
  getProgress,
  getDisplayStage,
  getStageColorClass,
  getInstalmentsProgress,
  formatCurrency,
  formatDate,
  getPerson
} from './utils'

// Components
import { ProgressCircle } from './components/ProgressCircle'
import { PersonCell } from './components/PersonCell'
import { StatusBadge } from './components/StatusBadge'
import { 
  DetailSection, 
  DetailGrid, 
  DetailItem, 
  PersonDetailCard 
} from './components/DetailSection'

// Constants
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api'

function PropertyManagement() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditProgressModal, setShowEditProgressModal] = useState(false)
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false)
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false)
  const [editPropertyData, setEditPropertyData] = useState(null)
  const [addPropertyData, setAddPropertyData] = useState(null)
  const [progressData, setProgressData] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [loadingProgress, setLoadingProgress] = useState(false)
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [savingProperty, setSavingProperty] = useState(false)
  const [documents, setDocuments] = useState([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [showInstalmentsModal, setShowInstalmentsModal] = useState(false)
  const [instalmentsData, setInstalmentsData] = useState(null)
  const [loadingInstalments, setLoadingInstalments] = useState(false)
  const [editingInstalment, setEditingInstalment] = useState(null)
  const [newInstalment, setNewInstalment] = useState({ number: '', dueDate: '', amount: '' })
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateData, setGenerateData] = useState({ count: 5, startDate: '', intervalDays: 30 })
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignData, setAssignData] = useState({ buyerId: '', brokerId: '' })
  const [availableBuyers, setAvailableBuyers] = useState([])
  const [availableBrokers, setAvailableBrokers] = useState([])
  const [loadingAssign, setLoadingAssign] = useState(false)
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProject, setFilterProject] = useState('All Projects')
  const [filterStatus, setFilterStatus] = useState('All Status')
  const [notification, setNotification] = useState(null)

  // Projects list for filter (extracted from properties)
  const [projects, setProjects] = useState([])

  // Helper function to get project name from property
  const getProjectName = (property) => {
    if (property.project?.name) return property.project.name
    if (!property.projectId) return 'N/A'
    const project = projects.find(p => p.id === property.projectId || p._id === property.projectId)
    return project?.name || 'N/A'
  }

  // Extract unique projects from properties list for filter
  useEffect(() => {
    if (properties.length > 0) {
      const projectMap = new Map()
      properties.forEach(property => {
        if (property.project && property.project.id) {
          if (!projectMap.has(property.project.id)) {
            projectMap.set(property.project.id, {
              id: property.project.id,
              name: property.project.name
            })
          }
        }
      })
      setProjects(Array.from(projectMap.values()))
    }
  }, [properties])

  // Fetch properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${API_BASE_URL}/admin/properties`)
        const data = await response.json()
        
        if (data.success && data.data) {
          const propertiesList = data.data.properties || []
          setProperties(propertiesList)
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

  // Fetch buyers and brokers for assignment
  useEffect(() => {
    const fetchBuyersAndBrokers = async () => {
      try {
        const [buyersRes, brokersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/buyers`),
          fetch(`${API_BASE_URL}/brokers`)
        ])
        
        const buyersData = await buyersRes.json()
        const brokersData = await brokersRes.json()
        
        if (buyersData.success && buyersData.data) {
          setAvailableBuyers(buyersData.data || [])
        }
        
        if (brokersData.success && brokersData.data) {
          setAvailableBrokers(brokersData.data || [])
        }
      } catch (err) {
        console.error('Error fetching buyers/brokers:', err)
      }
    }

    fetchBuyersAndBrokers()
  }, [])

  // Filtered and Searched Properties
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const locationStr = formatLocation(property.location)
      const projectName = property.project?.name || getProjectName(property)
      const matchesSearch = 
        property.flatNo?.toLowerCase().includes(searchLower) ||
        projectName?.toLowerCase().includes(searchLower) ||
        (() => {
          const buyer = getPerson(property, 'buyer')
          const broker = getPerson(property, 'broker')
          return (
            (buyer && (
              buyer?.name?.toLowerCase().includes(searchLower) ||
              buyer?.email?.toLowerCase().includes(searchLower)
            )) ||
            (broker && (
              broker?.name?.toLowerCase().includes(searchLower) ||
              broker?.email?.toLowerCase().includes(searchLower)
            ))
          )
        })() ||
        locationStr?.toLowerCase().includes(searchLower)

      // Project filter
      const matchesProject = 
        filterProject === 'All Projects' || projectName === filterProject

      // Status filter
      const status = getStatus(property)
      const matchesStatus = 
        filterStatus === 'All Status' || status === filterStatus.toLowerCase()

      return matchesSearch && matchesProject && matchesStatus
    })
  }, [properties, searchQuery, filterProject, filterStatus, projects])

  // Table state
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleViewDetails = async (property) => {
    setSelectedProperty(property)
    setShowDetailsModal(true)
    
    // Fetch detailed progress data (with stages) - still needed for edit modal
    await fetchPropertyProgress(property.id)
    
    // Use images from property if available, otherwise fetch
    if (property.images && property.images.length > 0) {
      // Images are already in property, but we need signed URLs for display
      // Fetch gallery to get signed URLs
      await fetchPropertyGallery(property.id)
    } else {
      setGalleryImages([])
    }
    
    // Fetch documents
    await fetchPropertyDocuments(property.id)
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

  const fetchPropertyDocuments = async (propertyId) => {
    try {
      setLoadingDocuments(true)
      const propertyResponse = await fetch(`${API_BASE_URL}/admin/properties/${propertyId}`)
      const propertyData = await propertyResponse.json()
      
      if (propertyData.success && propertyData.data) {
        const property = propertyData.data
        const buyerId = property.buyerId || property.buyer?.id || property.buyer?._id
        
        if (buyerId) {
          const token = localStorage.getItem('adminToken')
          const documentsResponse = await fetch(
            `${API_BASE_URL}/documents?buyerId=${buyerId}&propertyId=${propertyId}&all=true`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          )
          const documentsData = await documentsResponse.json()
          
          if (documentsData.success && documentsData.data) {
            const docs = documentsData.data.documents || documentsData.data || []
            setDocuments(docs.map(doc => ({
              id: doc.id || doc._id,
              name: doc.name,
              type: doc.type,
              fileName: doc.fileName,
              fileSize: doc.fileSize,
              downloadUrl: doc.downloadUrl || `/api/documents/${doc.id || doc._id}/download`,
              uploadedAt: doc.uploadedAt || doc.createdAt
            })))
          } else {
            setDocuments([])
          }
        } else {
          setDocuments([])
        }
      }
    } catch (err) {
      console.error('Error fetching documents:', err)
      setDocuments([])
    } finally {
      setLoadingDocuments(false)
    }
  }

  const handleEditProgress = () => {
    setShowEditProgressModal(true)
  }

  const handleEditProperty = async (property) => {
    setSelectedProperty(property)
    
    // Get progress data (handle both old and new format)
    const progress = getProgress(property)
    
    // Normalize currentStage value to match radio button options (same logic as getDisplayStage)
    let normalizedStage = ''
    if (progress.stage && progress.stage.trim() !== '') {
      const stageLower = progress.stage.toLowerCase()
      if (stageLower.includes('foundation')) {
        normalizedStage = 'foundation'
      } else if (stageLower.includes('structure')) {
        normalizedStage = 'structure'
      } else if (stageLower.includes('finishing')) {
        normalizedStage = 'finishing'
      } else {
        // If it doesn't match known stages, keep empty to show "None"
        normalizedStage = ''
      }
    }
    
    // Initialize edit data with current property values
    setEditPropertyData({
      flatNo: property.flatNo || '',
      buildingName: property.buildingName || '',
      specifications: {
        area: property.specifications?.area || '',
        bedrooms: property.specifications?.bedrooms || '',
        bathrooms: property.specifications?.bathrooms || '',
        balconies: property.specifications?.balconies || '',
        floor: property.specifications?.floor || '',
        facing: property.specifications?.facing || ''
      },
      pricing: {
        totalPrice: property.pricing?.totalPrice || '',
        pricePerSqft: property.pricing?.pricePerSqft || '',
        bookingAmount: property.pricing?.bookingAmount || ''
      },
      status: getStatus(property),
      possessionDate: property.possessionDate ? new Date(property.possessionDate).toISOString().split('T')[0] : '',
      progressPercentage: progress.percentage || 0,
      currentStage: normalizedStage
    })
    
    // Use images from property if available, otherwise fetch
    if (property.images && property.images.length > 0) {
      // Images are already in property, but we need signed URLs for display
      // Fetch gallery to get signed URLs
      await fetchPropertyGallery(property.id)
    } else {
      setGalleryImages([])
    }
    
    // Fetch documents
    await fetchPropertyDocuments(property.id)
    
    setShowEditPropertyModal(true)
  }

  // Helper function to prepare property payload
  const preparePropertyPayload = (propertyData, isEdit = false) => {
    const payload = {
      flatNo: propertyData.flatNo,
      buildingName: propertyData.buildingName !== undefined ? propertyData.buildingName : undefined,
      specifications: {
        area: propertyData.specifications?.area !== undefined && propertyData.specifications?.area !== '' ? parseFloat(propertyData.specifications.area) : undefined,
        bedrooms: propertyData.specifications?.bedrooms !== undefined && propertyData.specifications?.bedrooms !== '' ? parseInt(propertyData.specifications.bedrooms) : undefined,
        bathrooms: propertyData.specifications?.bathrooms !== undefined && propertyData.specifications?.bathrooms !== '' ? parseInt(propertyData.specifications.bathrooms) : undefined,
        balconies: propertyData.specifications?.balconies !== undefined && propertyData.specifications?.balconies !== '' ? parseInt(propertyData.specifications.balconies) : undefined,
        floor: propertyData.specifications?.floor !== undefined && propertyData.specifications?.floor !== '' ? parseInt(propertyData.specifications.floor) : undefined,
        facing: propertyData.specifications?.facing !== undefined && propertyData.specifications?.facing !== '' ? propertyData.specifications.facing : undefined
      },
      pricing: {
        totalPrice: propertyData.pricing?.totalPrice !== undefined && propertyData.pricing?.totalPrice !== '' ? parseFloat(propertyData.pricing.totalPrice) : undefined,
        pricePerSqft: propertyData.pricing?.pricePerSqft !== undefined && propertyData.pricing?.pricePerSqft !== '' ? parseFloat(propertyData.pricing.pricePerSqft) : undefined,
        bookingAmount: propertyData.pricing?.bookingAmount !== undefined && propertyData.pricing?.bookingAmount !== '' ? parseFloat(propertyData.pricing.bookingAmount) : undefined
      },
      status: propertyData.status || 'active',
      possessionDate: propertyData.possessionDate ? new Date(propertyData.possessionDate) : undefined,
      progressPercentage: propertyData.progressPercentage !== undefined ? (propertyData.progressPercentage === '' ? 0 : parseFloat(propertyData.progressPercentage) || 0) : undefined,
      currentStage: propertyData.currentStage !== undefined && propertyData.currentStage !== '' ? propertyData.currentStage : undefined
    }

    // Add projectId for create mode
    if (!isEdit && propertyData.projectId) {
      payload.projectId = propertyData.projectId
    }

    // Remove undefined values
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key]
      }
    })
    if (payload.specifications) {
      Object.keys(payload.specifications).forEach(key => {
        if (payload.specifications[key] === undefined) {
          delete payload.specifications[key]
        }
      })
      if (Object.keys(payload.specifications).length === 0) {
        delete payload.specifications
      }
    }
    if (payload.pricing) {
      Object.keys(payload.pricing).forEach(key => {
        if (payload.pricing[key] === undefined) {
          delete payload.pricing[key]
        }
      })
      if (Object.keys(payload.pricing).length === 0) {
        delete payload.pricing
      }
    }

    return payload
  }

  const handleSaveProperty = async () => {
    if (!selectedProperty || !editPropertyData) return

    try {
      setSavingProperty(true)
      const updatePayload = preparePropertyPayload(editPropertyData, true)

      const response = await fetch(`${API_BASE_URL}/admin/properties/${selectedProperty.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Property updated successfully!', 'success')
        setShowEditPropertyModal(false)
        setEditPropertyData(null)
        setSelectedProperty(null)
        // Refresh properties list
        window.location.reload()
      } else {
        showNotification(data.error || 'Failed to update property', 'error')
      }
    } catch (err) {
      console.error('Error updating property:', err)
      showNotification('Failed to update property', 'error')
    } finally {
      setSavingProperty(false)
    }
  }

  const handleAddProperty = async () => {
    if (!addPropertyData || !addPropertyData.projectId) {
      showNotification('Please select a project', 'error')
      return
    }

    try {
      setSavingProperty(true)
      const createPayload = preparePropertyPayload(addPropertyData, false)

      const response = await fetch(`${API_BASE_URL}/admin/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createPayload)
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Property created successfully!', 'success')
        setShowAddPropertyModal(false)
        setAddPropertyData(null)
        // Refresh properties list
        window.location.reload()
      } else {
        showNotification(data.error || 'Failed to create property', 'error')
      }
    } catch (err) {
      console.error('Error creating property:', err)
      showNotification('Failed to create property', 'error')
    } finally {
      setSavingProperty(false)
    }
  }

  const handleOpenAddProperty = () => {
    setAddPropertyData({
      flatNo: '',
      buildingName: '',
      projectId: '',
      specifications: {
        area: '',
        bedrooms: '',
        bathrooms: '',
        balconies: '',
        floor: '',
        facing: ''
      },
      pricing: {
        totalPrice: '',
        pricePerSqft: '',
        bookingAmount: ''
      },
      status: 'active',
      possessionDate: '',
      progressPercentage: 0,
      currentStage: ''
    })
    setShowAddPropertyModal(true)
  }

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone and will also delete all related documents and payments.')) {
      return
    }

    try {
      showNotification('Deleting property...', 'info')
      const response = await fetch(`${API_BASE_URL}/admin/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Property deleted successfully!', 'success')
        // Refresh properties list
        window.location.reload()
      } else {
        showNotification(data.error || 'Failed to delete property', 'error')
      }
    } catch (err) {
      console.error('Error deleting property:', err)
      showNotification('Failed to delete property', 'error')
    }
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

  const handleUploadGalleryImage = async (file, caption) => {
    if (!selectedProperty || !file) return

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('image', file)
      if (caption) {
        formData.append('caption', caption)
      }

      const response = await fetch(`${API_BASE_URL}/admin/properties/${selectedProperty.id}/gallery`, {
        method: 'POST',
        body: formData
        // Don't set Content-Type header - browser will set it automatically with boundary for FormData
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

  const handleUploadDocument = async (file, documentType, documentTitle, description) => {
    if (!selectedProperty || !file) return

    try {
      const propertyResponse = await fetch(`${API_BASE_URL}/admin/properties/${selectedProperty.id}`)
      const propertyData = await propertyResponse.json()
      
      if (!propertyData.success || !propertyData.data) {
        showNotification('Failed to get property information', 'error')
        return
      }
      
      const property = propertyData.data
      const buyerId = property.buyerId || property.buyer?.id || property.buyer?._id
      
      if (!buyerId) {
        showNotification('Property must have an assigned buyer to upload documents', 'error')
        return
      }

      const formData = new FormData()
      formData.append('document', file)
      formData.append('documentType', documentType)
      formData.append('documentTitle', documentTitle)
      formData.append('propertyId', selectedProperty.id)
      formData.append('buyerId', buyerId)
      if (description) {
        formData.append('description', description)
      }

      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Document uploaded successfully!', 'success')
        await fetchPropertyDocuments(selectedProperty.id)
      } else {
        showNotification(data.error || 'Failed to upload document', 'error')
      }
    } catch (err) {
      console.error('Error uploading document:', err)
      showNotification('Failed to upload document', 'error')
    }
  }

  const handleDeleteDocument = async (documentId) => {
    if (!selectedProperty || !documentId) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Document deleted successfully!', 'success')
        await fetchPropertyDocuments(selectedProperty.id)
      } else {
        showNotification(data.error || 'Failed to delete document', 'error')
      }
    } catch (err) {
      console.error('Error deleting document:', err)
      showNotification('Failed to delete document', 'error')
    }
  }

  const handleAssignBuyerBroker = (property) => {
    setSelectedProperty(property)
    // Set current buyer and broker if they exist
    // Handle both array format (buyers/brokers) and direct format (buyerId/brokerId)
    const currentBuyer = getPerson(property, 'buyer') || (property.buyerId ? { id: property.buyerId, _id: property.buyerId } : null)
    const currentBroker = getPerson(property, 'broker') || (property.brokerId ? { id: property.brokerId, _id: property.brokerId } : null)
    setAssignData({
      buyerId: currentBuyer?.id || currentBuyer?._id || '',
      brokerId: currentBroker?.id || currentBroker?._id || ''
    })
    setShowAssignModal(true)
  }

  const handleSaveAssignment = async () => {
    if (!selectedProperty || !assignData.buyerId) {
      showNotification('Please select a buyer', 'error')
      return
    }

    try {
      setLoadingAssign(true)
      const response = await fetch(`${API_BASE_URL}/admin/properties/${selectedProperty.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buyerId: assignData.buyerId,
          brokerId: assignData.brokerId || null
        })
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Buyer and broker assigned successfully!', 'success')
        setShowAssignModal(false)
        setAssignData({ buyerId: '', brokerId: '' })
        setSelectedProperty(null)
        // Refresh properties list
        window.location.reload()
      } else {
        showNotification(data.error || 'Failed to assign buyer and broker', 'error')
      }
    } catch (err) {
      console.error('Error assigning buyer and broker:', err)
      showNotification('Failed to assign buyer and broker', 'error')
    } finally {
      setLoadingAssign(false)
    }
  }

  const handleManageInstalments = async (property) => {
    setSelectedProperty(property)
    setShowInstalmentsModal(true)
    
    // Use instalments directly from property
    const instalments = property.instalments || []
    
    if (instalments.length > 0) {
      // Calculate summary from property.instalments
      const totalAmount = instalments.reduce((sum, inst) => sum + (inst.amount || 0), 0)
      const totalPaid = instalments
        .filter(inst => inst.status === 'paid')
        .reduce((sum, inst) => sum + (inst.amount || 0), 0)
      const totalPending = totalAmount - totalPaid
      
      setInstalmentsData({
        instalments: instalments,
        summary: {
          totalAmount,
          totalPaid,
          totalPending
        }
      })
      setLoadingInstalments(false)
    } else {
      // Only fetch if property doesn't have instalments
      await fetchPropertyInstalments(property.id)
    }
  }

  const fetchPropertyInstalments = async (propertyId) => {
    try {
      setLoadingInstalments(true)
      const response = await fetch(`${API_BASE_URL}/admin/properties/${propertyId}/instalments`)
      const data = await response.json()
      if (data.success) {
        setInstalmentsData(data.data)
      } else {
        showNotification('Failed to load instalments', 'error')
      }
    } catch (err) {
      console.error('Error fetching instalments:', err)
      showNotification('Failed to load instalments', 'error')
    } finally {
      setLoadingInstalments(false)
    }
  }

  const handleAddInstalment = async () => {
    if (!newInstalment.number || !newInstalment.dueDate || !newInstalment.amount) {
      showNotification('Please fill all fields', 'error')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/properties/${selectedProperty.id}/instalments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instalments: [{
            number: parseInt(newInstalment.number),
            dueDate: newInstalment.dueDate,
            amount: parseFloat(newInstalment.amount),
            status: 'pending'
          }]
        })
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Instalment added successfully!', 'success')
        setNewInstalment({ number: '', dueDate: '', amount: '' })
        await fetchPropertyInstalments(selectedProperty.id)
        // Refresh properties to get updated instalments
        window.location.reload()
      } else {
        showNotification(data.error || 'Failed to add instalment', 'error')
      }
    } catch (err) {
      console.error('Error adding instalment:', err)
      showNotification('Failed to add instalment', 'error')
    }
  }

  const handleUpdateInstalment = async (instalmentId, updateData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/properties/${selectedProperty.id}/instalments/${instalmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Instalment updated successfully!', 'success')
        setEditingInstalment(null)
        await fetchPropertyInstalments(selectedProperty.id)
        // Refresh properties to get updated instalments
        window.location.reload()
      } else {
        showNotification(data.error || 'Failed to update instalment', 'error')
      }
    } catch (err) {
      console.error('Error updating instalment:', err)
      showNotification('Failed to update instalment', 'error')
    }
  }

  const handleDeleteInstalment = async (instalmentId) => {
    if (!window.confirm('Are you sure you want to delete this instalment?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/properties/${selectedProperty.id}/instalments/${instalmentId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Instalment deleted successfully!', 'success')
        await fetchPropertyInstalments(selectedProperty.id)
        // Refresh properties to get updated instalments
        window.location.reload()
      } else {
        showNotification(data.error || 'Failed to delete instalment', 'error')
      }
    } catch (err) {
      console.error('Error deleting instalment:', err)
      showNotification('Failed to delete instalment', 'error')
    }
  }

  const handleMarkPaid = async (instalmentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/properties/${selectedProperty.id}/instalments/${instalmentId}/mark-paid`, {
        method: 'POST'
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Instalment marked as paid!', 'success')
        await fetchPropertyInstalments(selectedProperty.id)
        // Refresh properties to get updated instalments
        window.location.reload()
      } else {
        showNotification(data.error || 'Failed to mark instalment as paid', 'error')
      }
    } catch (err) {
      console.error('Error marking instalment as paid:', err)
      showNotification('Failed to mark instalment as paid', 'error')
    }
  }

  const handleGenerateInstalments = async () => {
    if (!generateData.count || !generateData.startDate) {
      showNotification('Please fill all required fields', 'error')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/properties/${selectedProperty.id}/instalments/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: parseInt(generateData.count),
          startDate: generateData.startDate,
          intervalDays: parseInt(generateData.intervalDays) || 30
        })
      })

      const data = await response.json()
      if (data.success) {
        showNotification('Instalments generated successfully!', 'success')
        setShowGenerateModal(false)
        setGenerateData({ count: 5, startDate: '', intervalDays: 30 })
        await fetchPropertyInstalments(selectedProperty.id)
        // Refresh properties to get updated instalments
        window.location.reload()
      } else {
        showNotification(data.error || 'Failed to generate instalments', 'error')
      }
    } catch (err) {
      console.error('Error generating instalments:', err)
      showNotification('Failed to generate instalments', 'error')
    }
  }

  // Get unique project names for filter
  const uniqueProjects = useMemo(() => {
    const projectNames = properties
      .map(p => p.project?.name || getProjectName(p))
      .filter((name, index, self) => name && name !== 'N/A' && self.indexOf(name) === index)
    return projectNames.sort()
  }, [properties, projects])

  // Define columns
  const columns = useMemo(() => {
    return [
    {
      id: "propertyDetails",
      size: 260,
      minSize: 240,
      maxSize: 320,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Property Details" />
      ),
      cell: ({ row }) => {
        const property = row.original
        return (
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
                {formatLocation(property.location)}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      id: "project",
      size: 180,
      minSize: 140,
      maxSize: 220,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Project" />
      ),
      cell: ({ row }) => {
        const property = row.original
        // Use project name from property response if available, otherwise lookup
        const projectName = property.project?.name || getProjectName(property)
        return (
          <div className="project-info-pm">
            {projectName}
          </div>
        )
      },
    },
    {
      id: "buyer",
      size: 160,
      minSize: 140,
      maxSize: 200,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Buyer" />
      ),
      cell: ({ row }) => <PersonCell person={getPerson(row.original, 'buyer')} type="buyer" />,
    },
    {
      id: "broker",
      size: 160,
      minSize: 140,
      maxSize: 200,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Broker" />
      ),
      cell: ({ row }) => <PersonCell person={getPerson(row.original, 'broker')} type="broker" />,
    },
    {
      id: "currentStage",
      size: 140,
      minSize: 110,
      maxSize: 160,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Current Stage" />
      ),
      cell: ({ row }) => {
        const progress = getProgress(row.original)
        const stage = getDisplayStage(progress.stage)
        return <StatusBadge status={stage} type="stage" />
      },
    },
    {
      id: "progressPercentage",
      size: 80,
      minSize: 70,
      maxSize: 90,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Progress" />
      ),
      cell: ({ row }) => {
        const percentage = getProgress(row.original).percentage || 0
        return <ProgressCircle percentage={percentage} />
      },
    },
    {
      id: "instalmentsProgress",
      size: 80,
      minSize: 70,
      maxSize: 90,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Instalments" />
      ),
      cell: ({ row }) => {
        const percentage = getInstalmentsProgress(row.original).percentage || 0
        return <ProgressCircle percentage={percentage} />
      },
    },
    {
      accessorKey: "status",
      size: 110,
      minSize: 90,
      maxSize: 130,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <StatusBadge status={getStatus(row.original)} type="status" />,
    },
    {
      id: "actions",
      size: 60,
      minSize: 50,
      maxSize: 70,
      enableHiding: false,
      cell: ({ row }) => {
        const property = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewDetails(property)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditProperty(property)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Property
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleManageInstalments(property)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Manage Instalments
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAssignBuyerBroker(property)}>
                <User className="mr-2 h-4 w-4" />
                Assign Buyer and Broker
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteProperty(property.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
    ]
  }, [])

  const table = useReactTable({
    data: filteredProperties,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  return (
    <div className="property-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-main">Property Management</h1>
          <p className="page-subtitle">Manage all properties and their assignments</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddProperty}>
          <Plus size={18} style={{ marginRight: '8px' }} />
          Add Property
        </button>
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
          <>
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
                          <TableCell key={cell.id} onClick={(e) => {
                            // Prevent row click when clicking on actions dropdown
                            if (cell.column.id === 'actions') {
                              e.stopPropagation()
                            }
                          }}>
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
                        {properties.length === 0 ? 'No properties found. Properties will appear here when users are assigned to projects.' : 'No properties found matching your criteria'}
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
      </div>

      {/* Property Details Modal */}
      {showDetailsModal && selectedProperty && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-large property-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="property-details-header">
                <div className="property-details-title-section">
                  <div className="property-icon-large">
                    <Home size={24} />
                  </div>
                  <div>
                    <h2>Property Details</h2>
                    <p className="property-subtitle">Flat {selectedProperty.flatNo}</p>
                  </div>
                </div>
                <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
              </div>
            </div>
            <div className="modal-body property-details-body">
              {/* Property Overview Card */}
              <div className="property-detail-card">
                <div className="property-detail-card-header">
                  <Building2 size={18} />
                  <h3>Property Overview</h3>
                </div>
                <div className="property-detail-card-content">
                  <div className="property-overview-grid">
                    <div className="property-overview-item">
                      <div className="property-overview-label">
                        <Hash size={14} />
                        <span>Property ID</span>
                      </div>
                      <div className="property-overview-value property-id-value">
                        {selectedProperty.id}
                      </div>
                    </div>
                    <div className="property-overview-item">
                      <div className="property-overview-label">
                        <Home size={14} />
                        <span>Flat/Unit Number</span>
                      </div>
                      <div className="property-overview-value">
                        {selectedProperty.flatNo}
                      </div>
                    </div>
                    <div className="property-overview-item">
                      <div className="property-overview-label">
                        <Building2 size={14} />
                        <span>Building Name</span>
                      </div>
                      <div className="property-overview-value">
                        {selectedProperty.buildingName || 'N/A'}
                      </div>
                    </div>
                    <div className="property-overview-item">
                      <div className="property-overview-label">
                        <Layers size={14} />
                        <span>Project</span>
                      </div>
                      <div className="property-overview-value">
                        {selectedProperty.project?.name || getProjectName(selectedProperty)}
                      </div>
                    </div>
                    <div className="property-overview-item">
                      <div className="property-overview-label">
                        <MapPin size={14} />
                        <span>Location</span>
                      </div>
                      <div className="property-overview-value">
                        {selectedProperty.location?.address && `${selectedProperty.location.address}, `}
                        {formatLocation(selectedProperty.location)}
                        {selectedProperty.location?.pincode && ` - ${selectedProperty.location.pincode}`}
                      </div>
                    </div>
                    <div className="property-overview-item">
                      <div className="property-overview-label">
                        <span>Status</span>
                      </div>
                      <div className="property-overview-value">
                        <StatusBadge status={getStatus(selectedProperty)} type="status" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress & Timeline Card */}
              <div className="property-detail-card">
                <div className="property-detail-card-header">
                  <Percent size={18} />
                  <h3>Progress & Timeline</h3>
                </div>
                <div className="property-detail-card-content">
                  <div className="progress-timeline-grid">
                    <div className="progress-item">
                      <div className="progress-item-label">
                        <Percent size={14} />
                        <span>Progress Percentage</span>
                      </div>
                      <div className="progress-item-content">
                        <div className="progress-display">
                          <span className="progress-percentage">
                            {getProgress(selectedProperty).percentage || 0}%
                          </span>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar-fill"
                              style={{ 
                                width: `${Math.min(getProgress(selectedProperty).percentage || 0, 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="progress-item">
                      <div className="progress-item-label">
                        <Layers size={14} />
                        <span>Current Stage</span>
                      </div>
                      <div className="progress-item-value">
                        {getDisplayStage(getProgress(selectedProperty).stage)}
                      </div>
                    </div>
                    <div className="progress-item">
                      <div className="progress-item-label">
                        <Calendar size={14} />
                        <span>Possession Date</span>
                      </div>
                      <div className="progress-item-value">
                        {formatDate(selectedProperty.possessionDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specifications Card */}
              <div className="property-detail-card">
                <div className="property-detail-card-header">
                  <Home size={18} />
                  <h3>Specifications</h3>
                </div>
                <div className="property-detail-card-content">
                  <div className="specs-grid">
                    <div className="spec-item">
                      <div className="spec-label">Area</div>
                      <div className="spec-value">
                        {selectedProperty.specifications?.area 
                          ? `${selectedProperty.specifications.area} ${selectedProperty.specifications?.areaUnit || 'sqft'}`
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="spec-item">
                      <div className="spec-label">Bedrooms</div>
                      <div className="spec-value">{selectedProperty.specifications?.bedrooms || 'N/A'}</div>
                    </div>
                    <div className="spec-item">
                      <div className="spec-label">Bathrooms</div>
                      <div className="spec-value">{selectedProperty.specifications?.bathrooms || 'N/A'}</div>
                    </div>
                    <div className="spec-item">
                      <div className="spec-label">Balconies</div>
                      <div className="spec-value">{selectedProperty.specifications?.balconies || 'N/A'}</div>
                    </div>
                    <div className="spec-item">
                      <div className="spec-label">Floor</div>
                      <div className="spec-value">{selectedProperty.specifications?.floor || 'N/A'}</div>
                    </div>
                    <div className="spec-item">
                      <div className="spec-label">Facing</div>
                      <div className="spec-value">{selectedProperty.specifications?.facing || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="property-detail-card">
                <div className="property-detail-card-header">
                  <DollarSign size={18} />
                  <h3>Pricing</h3>
                </div>
                <div className="property-detail-card-content">
                  <div className="pricing-grid">
                    <div className="pricing-item">
                      <div className="pricing-label">Currency</div>
                      <div className="pricing-value">{selectedProperty.pricing?.currency || 'INR'}</div>
                    </div>
                    <div className="pricing-item pricing-item-highlight">
                      <div className="pricing-label">Total Price</div>
                      <div className="pricing-value pricing-value-large">
                        {selectedProperty.pricing?.totalPrice ? formatCurrency(selectedProperty.pricing.totalPrice) : 'N/A'}
                      </div>
                    </div>
                    <div className="pricing-item">
                      <div className="pricing-label">Price Per Sqft</div>
                      <div className="pricing-value">
                        {selectedProperty.pricing?.pricePerSqft 
                          ? formatCurrency(selectedProperty.pricing.pricePerSqft)
                          : selectedProperty.pricing?.totalPrice && selectedProperty.specifications?.area
                          ? formatCurrency(Math.round(selectedProperty.pricing.totalPrice / selectedProperty.specifications.area))
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="pricing-item">
                      <div className="pricing-label">Booking Amount</div>
                      <div className="pricing-value">
                        {selectedProperty.pricing?.bookingAmount ? formatCurrency(selectedProperty.pricing.bookingAmount) : 'N/A'}
                      </div>
                    </div>
                    {selectedProperty.pricing?.paidAmount !== undefined && (
                      <div className="pricing-item">
                        <div className="pricing-label">Paid Amount</div>
                        <div className="pricing-value pricing-value-success">
                          {formatCurrency(selectedProperty.pricing.paidAmount)}
                        </div>
                      </div>
                    )}
                    {selectedProperty.pricing?.pendingAmount !== undefined && (
                      <div className="pricing-item">
                        <div className="pricing-label">Pending Amount</div>
                        <div className="pricing-value pricing-value-warning">
                          {formatCurrency(selectedProperty.pricing.pendingAmount)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instalments Summary Card */}
              {selectedProperty.instalments && selectedProperty.instalments.length > 0 && (
                <div className="property-detail-card">
                  <div className="property-detail-card-header">
                    <DollarSign size={18} />
                    <h3>Instalments Summary</h3>
                  </div>
                  <div className="property-detail-card-content">
                    <div className="instalments-summary-grid">
                      <div className="instalments-summary-item">
                        <div className="instalments-summary-label">Total Instalments</div>
                        <div className="instalments-summary-value">{selectedProperty.instalments.length}</div>
                      </div>
                      <div className="instalments-summary-item">
                        <div className="instalments-summary-label">Total Amount</div>
                        <div className="instalments-summary-value instalments-summary-value-large">
                          {formatCurrency(
                            selectedProperty.instalments.reduce((sum, inst) => sum + (inst.amount || 0), 0)
                          )}
                        </div>
                      </div>
                      <div className="instalments-summary-item instalments-summary-item-success">
                        <div className="instalments-summary-label">Paid</div>
                        <div className="instalments-summary-value instalments-summary-value-success">
                          {formatCurrency(
                            selectedProperty.instalments
                              .filter(inst => inst.status === 'paid')
                              .reduce((sum, inst) => sum + (inst.amount || 0), 0)
                          )}
                        </div>
                      </div>
                      <div className="instalments-summary-item instalments-summary-item-warning">
                        <div className="instalments-summary-label">Pending</div>
                        <div className="instalments-summary-value instalments-summary-value-warning">
                          {formatCurrency(
                            selectedProperty.instalments.reduce((sum, inst) => sum + (inst.amount || 0), 0) -
                            selectedProperty.instalments
                              .filter(inst => inst.status === 'paid')
                              .reduce((sum, inst) => sum + (inst.amount || 0), 0)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Assigned People Cards */}
              <div className="assigned-people-grid">
                <div className="property-detail-card">
                  <div className="property-detail-card-header">
                    <User size={18} />
                    <h3>Assigned Buyer</h3>
                  </div>
                  <div className="property-detail-card-content">
                    <PersonDetailCard person={getPerson(selectedProperty, 'buyer')} type="buyer" />
                  </div>
                </div>

                <div className="property-detail-card">
                  <div className="property-detail-card-header">
                    <Briefcase size={18} />
                    <h3>Assigned Broker</h3>
                  </div>
                  <div className="property-detail-card-content">
                    <PersonDetailCard person={getPerson(selectedProperty, 'broker')} type="broker" />
                  </div>
                </div>
              </div>

              {/* Project Gallery Card */}
              <div className="property-detail-card">
                <div className="property-detail-card-header">
                  <ImageIcon size={18} />
                  <h3>Project Gallery</h3>
                </div>
                <div className="property-detail-card-content">
                  {loadingGallery ? (
                    <div className="gallery-loading">
                      <p>Loading gallery...</p>
                    </div>
                  ) : galleryImages.length > 0 ? (
                    <div className="gallery-grid-modern">
                      {galleryImages.map((img) => (
                        <div key={img.id} className="gallery-item-modern">
                          <img 
                            src={img.url} 
                            alt={img.caption || 'Gallery image'} 
                            className="gallery-image"
                            onClick={() => window.open(img.url, '_blank')}
                          />
                          {img.caption && (
                            <p className="gallery-caption">{img.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="gallery-empty">
                      <ImageIcon size={32} />
                      <p>No gallery images yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents Card */}
              <div className="property-detail-card">
                <div className="property-detail-card-header">
                  <FileText size={18} />
                  <h3>Documents</h3>
                </div>
                <div className="property-detail-card-content">
                  {loadingDocuments ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                      <p>Loading documents...</p>
                    </div>
                  ) : documents.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {documents.map((doc) => (
                        <div key={doc.id || doc._id} style={{ 
                          padding: '12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <FileText size={16} style={{ color: '#6b7280' }} />
                              <p style={{ fontWeight: '500', margin: 0 }}>
                                {doc.name || doc.fileName || 'Document'}
                              </p>
                            </div>
                            <div style={{ fontSize: '0.875em', color: 'var(--text-secondary)', marginLeft: '24px' }}>
                              {doc.type && <span style={{ textTransform: 'capitalize' }}>{doc.type}</span>}
                              {doc.fileSize && <span> • {(doc.fileSize / 1024).toFixed(2)} KB</span>}
                              {doc.uploadedAt && <span> • {new Date(doc.uploadedAt).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          {doc.downloadUrl && (
                            <a
                              href={doc.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline"
                              style={{ padding: '6px 12px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <ExternalLink size={14} />
                              View
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                      <FileText size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                      <p>No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => {
                  setShowDetailsModal(false)
                  setProgressData(null)
                  setGalleryImages([])
                  setDocuments([])
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

      {/* Add Property Modal */}
      {showAddPropertyModal && addPropertyData && (
        <div className="modal-overlay" onClick={() => setShowAddPropertyModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Property</h2>
              <button className="close-btn" onClick={() => {
                setShowAddPropertyModal(false)
                setAddPropertyData(null)
              }}>×</button>
            </div>
            <div className="modal-body">
              <PropertyForm
                propertyData={addPropertyData}
                onChange={setAddPropertyData}
                projects={projects}
                isEditMode={false}
                showGallery={false}
              />
              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => {
                    setShowAddPropertyModal(false)
                    setAddPropertyData(null)
                  }}
                  disabled={savingProperty}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleAddProperty}
                  disabled={savingProperty}
                >
                  {savingProperty ? 'Creating...' : 'Create Property'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {showEditPropertyModal && editPropertyData && selectedProperty && (
        <div className="modal-overlay" onClick={() => setShowEditPropertyModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Property Details</h2>
              <button className="close-btn" onClick={() => {
                setShowEditPropertyModal(false)
                setGalleryImages([])
                setDocuments([])
                setEditPropertyData(null)
                setSelectedProperty(null)
              }}>×</button>
            </div>
            <div className="modal-body">
              <PropertyForm
                propertyData={editPropertyData}
                onChange={setEditPropertyData}
                projects={projects}
                isEditMode={true}
                showGallery={true}
                galleryImages={galleryImages}
                loadingGallery={loadingGallery}
                onUploadGalleryImage={handleUploadGalleryImage}
                documents={documents}
                loadingDocuments={loadingDocuments}
                onUploadDocument={handleUploadDocument}
                onDeleteDocument={handleDeleteDocument}
              />
              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => {
                    setShowEditPropertyModal(false)
                    setGalleryImages([])
                    setDocuments([])
                    setEditPropertyData(null)
                    setSelectedProperty(null)
                  }}
                  disabled={savingProperty}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveProperty}
                  disabled={savingProperty}
                >
                  {savingProperty ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instalments Management Modal */}
      {showInstalmentsModal && selectedProperty && (
        <div className="modal-overlay" onClick={() => setShowInstalmentsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h2>Manage Instalments - {selectedProperty.flatNo}</h2>
              <button className="close-btn" onClick={() => {
                setShowInstalmentsModal(false)
                setInstalmentsData(null)
                setEditingInstalment(null)
                setNewInstalment({ number: '', dueDate: '', amount: '' })
              }}>×</button>
            </div>
            <div className="modal-body">
              {loadingInstalments ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>Loading instalments...</p>
                </div>
              ) : instalmentsData ? (
                <>
                  {/* Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                      <div style={{ fontSize: '0.875rem', color: '#0369a1', marginBottom: '4px' }}>Total Amount</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#0c4a6e' }}>
                        ₹{instalmentsData.summary?.totalAmount?.toLocaleString('en-IN') || '0'}
                      </div>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '4px' }}>Total Paid</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#14532d' }}>
                        ₹{instalmentsData.summary?.totalPaid?.toLocaleString('en-IN') || '0'}
                      </div>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
                      <div style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '4px' }}>Total Pending</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#78350f' }}>
                        ₹{instalmentsData.summary?.totalPending?.toLocaleString('en-IN') || '0'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setShowGenerateModal(true)}
                    >
                      <Plus size={16} style={{ marginRight: '8px' }} />
                      Auto-Generate Instalments
                    </button>
                  </div>

                  {/* Add New Instalment Form */}
                  <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '12px' }}>Add New Instalment</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                          Number
                        </label>
                        <input
                          type="number"
                          value={newInstalment.number}
                          onChange={(e) => setNewInstalment({ ...newInstalment, number: e.target.value })}
                          placeholder="1"
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={newInstalment.dueDate}
                          onChange={(e) => setNewInstalment({ ...newInstalment, dueDate: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          value={newInstalment.amount}
                          onChange={(e) => setNewInstalment({ ...newInstalment, amount: e.target.value })}
                          placeholder="500000"
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                      <button 
                        className="btn btn-primary" 
                        onClick={handleAddInstalment}
                        style={{ height: '38px' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Instalments Table */}
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '12px' }}>Instalments List</h4>
                    {instalmentsData.instalments && instalmentsData.instalments.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>#</th>
                              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Due Date</th>
                              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Status</th>
                              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Paid Date</th>
                              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {instalmentsData.instalments.map((instalment) => (
                              <tr key={instalment._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '12px' }}>{instalment.number}</td>
                                <td style={{ padding: '12px' }}>
                                  {new Date(instalment.dueDate).toLocaleDateString('en-IN')}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>
                                  ₹{instalment.amount?.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                  <span className={`status-badge ${
                                    instalment.status === 'paid' ? 'status-success' : 'status-error'
                                  }`}>
                                    {instalment.status}
                                  </span>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', fontSize: '0.875rem' }}>
                                  {instalment.paidAt ? new Date(instalment.paidAt).toLocaleDateString('en-IN') : '-'}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    {instalment.status === 'pending' && (
                                      <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleMarkPaid(instalment._id)}
                                        style={{ padding: '4px 12px', fontSize: '0.875rem' }}
                                      >
                                        Mark Paid
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-sm btn-outline"
                                      onClick={() => setEditingInstalment(instalment)}
                                      style={{ padding: '4px 12px', fontSize: '0.875rem' }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline"
                                      onClick={() => handleDeleteInstalment(instalment._id)}
                                      style={{ padding: '4px 12px', fontSize: '0.875rem', color: '#dc2626' }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        No instalments found. Add instalments manually or use auto-generate.
                      </p>
                    )}
                  </div>

                  {/* Edit Instalment Modal */}
                  {editingInstalment && (
                    <div style={{ 
                      position: 'fixed', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      backgroundColor: 'rgba(0,0,0,0.5)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      zIndex: 1000
                    }}>
                      <div style={{ 
                        backgroundColor: 'white', 
                        padding: '24px', 
                        borderRadius: '8px', 
                        width: '90%', 
                        maxWidth: '500px' 
                      }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '16px' }}>Edit Instalment</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                              Number
                            </label>
                            <input
                              type="number"
                              value={editingInstalment.number}
                              onChange={(e) => setEditingInstalment({ ...editingInstalment, number: parseInt(e.target.value) })}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                              Due Date
                            </label>
                            <input
                              type="date"
                              value={editingInstalment.dueDate ? new Date(editingInstalment.dueDate).toISOString().split('T')[0] : ''}
                              onChange={(e) => setEditingInstalment({ ...editingInstalment, dueDate: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                              Amount (₹)
                            </label>
                            <input
                              type="number"
                              value={editingInstalment.amount}
                              onChange={(e) => setEditingInstalment({ ...editingInstalment, amount: parseFloat(e.target.value) })}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button
                              className="btn btn-outline"
                              onClick={() => setEditingInstalment(null)}
                              style={{ flex: 1 }}
                            >
                              Cancel
                            </button>
                            <button
                              className="btn btn-primary"
                              onClick={() => {
                                handleUpdateInstalment(editingInstalment._id, {
                                  number: editingInstalment.number,
                                  dueDate: editingInstalment.dueDate,
                                  amount: editingInstalment.amount
                                })
                              }}
                              style={{ flex: 1 }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Generate Instalments Modal */}
                  {showGenerateModal && (
                    <div style={{ 
                      position: 'fixed', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      backgroundColor: 'rgba(0,0,0,0.5)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      zIndex: 1000
                    }}>
                      <div style={{ 
                        backgroundColor: 'white', 
                        padding: '24px', 
                        borderRadius: '8px', 
                        width: '90%', 
                        maxWidth: '500px' 
                      }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '16px' }}>Auto-Generate Instalments</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                              Number of Instalments
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={generateData.count}
                              onChange={(e) => setGenerateData({ ...generateData, count: parseInt(e.target.value) })}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={generateData.startDate}
                              onChange={(e) => setGenerateData({ ...generateData, startDate: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: '500' }}>
                              Interval (Days)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={generateData.intervalDays}
                              onChange={(e) => setGenerateData({ ...generateData, intervalDays: parseInt(e.target.value) })}
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                              }}
                            />
                          </div>
                          <div style={{ 
                            padding: '12px', 
                            backgroundColor: '#fef3c7', 
                            borderRadius: '4px', 
                            fontSize: '0.875rem',
                            color: '#92400e'
                          }}>
                            <strong>Note:</strong> This will replace all existing instalments. The first instalment will use the booking amount (if set), and the remaining amount will be divided equally.
                          </div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button
                              className="btn btn-outline"
                              onClick={() => setShowGenerateModal(false)}
                              style={{ flex: 1 }}
                            >
                              Cancel
                            </button>
                            <button
                              className="btn btn-primary"
                              onClick={handleGenerateInstalments}
                              style={{ flex: 1 }}
                            >
                              Generate
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="modal-actions">
                    <button className="btn btn-outline" onClick={() => {
                      setShowInstalmentsModal(false)
                      setInstalmentsData(null)
                      setEditingInstalment(null)
                      setNewInstalment({ number: '', dueDate: '', amount: '' })
                    }}>
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p>No instalments data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Buyer and Broker Modal */}
      {showAssignModal && selectedProperty && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Assign Buyer and Broker</h2>
              <button className="close-btn" onClick={() => {
                setShowAssignModal(false)
                setAssignData({ buyerId: '', brokerId: '' })
                setSelectedProperty(null)
              }}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Property: <strong>Flat {selectedProperty.flatNo}</strong>
                  {selectedProperty.buildingName && ` - ${selectedProperty.buildingName}`}
                </div>
                {selectedProperty.project?.name && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Project: <strong>{selectedProperty.project.name}</strong>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Buyer <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <SearchableSelect
                  value={assignData.buyerId}
                  onChange={(value) => setAssignData({ ...assignData, buyerId: value })}
                  options={availableBuyers}
                  placeholder="Select a buyer"
                  required
                  getOptionLabel={(buyer) => {
                    const name = buyer.name || buyer.email || 'Unknown'
                    const email = buyer.email && buyer.name ? ` (${buyer.email})` : ''
                    return `${name}${email}`
                  }}
                  getOptionValue={(buyer) => buyer.id || buyer._id}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Broker
                </label>
                <SearchableSelect
                  value={assignData.brokerId || ''}
                  onChange={(value) => setAssignData({ ...assignData, brokerId: value || '' })}
                  options={[{ id: '', name: 'No broker (optional)', _id: '' }, ...availableBrokers]}
                  placeholder="No broker (optional)"
                  getOptionLabel={(broker) => {
                    if (!broker.id && !broker._id) return 'No broker (optional)'
                    const name = broker.name || broker.email || 'Unknown'
                    const company = broker.company ? ` (${broker.company})` : ''
                    const email = broker.email && (broker.name || broker.company) ? ` - ${broker.email}` : (broker.email ? ` (${broker.email})` : '')
                    return `${name}${company}${email}`
                  }}
                  getOptionValue={(broker) => {
                    if (!broker.id && !broker._id) return ''
                    return broker.id || broker._id || ''
                  }}
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="btn btn-outline" 
                  onClick={() => {
                    setShowAssignModal(false)
                    setAssignData({ buyerId: '', brokerId: '' })
                    setSelectedProperty(null)
                  }}
                  disabled={loadingAssign}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveAssignment}
                  disabled={loadingAssign || !assignData.buyerId}
                >
                  {loadingAssign ? 'Assigning...' : 'Assign'}
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

