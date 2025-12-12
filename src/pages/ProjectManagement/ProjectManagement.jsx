import { useState, useMemo, useEffect } from 'react'
import { useApiFetch, useNotification } from '../../lib/apiHelpers'
import './ProjectManagement.css'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { 
  MoreHorizontal, 
  Building2, 
  Users, 
  Handshake, 
  MapPin, 
  Calendar,
  TrendingUp,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react"
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



// DRY: Reusable stats calculation
const calculateStats = (projects, properties) => {
  const total = projects.length
  const byStatus = {
    planning: projects.filter(p => p.status === 'planning').length,
    construction: projects.filter(p => p.status === 'construction').length,
    completed: projects.filter(p => p.status === 'completed').length,
  }
  const avgProgress = total > 0
    ? Math.round(projects.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / total)
    : 0
  
  // Get unique buyers from properties (not from projects)
  const allBuyerIds = new Set(properties.flatMap(p => {
    const buyers = p.buyers || (p.buyer ? [p.buyer] : [])
    return buyers.map(b => b.id || b._id).filter(Boolean)
  }))
  
  // Get unique brokers from properties
  const allBrokerIds = new Set(properties.flatMap(p => {
    const brokers = p.brokers || (p.broker ? [p.broker] : [])
    return brokers.map(b => b.id || b._id).filter(Boolean)
  }))
  
  return {
    total,
    ...byStatus,
    avgProgress,
    totalBuyers: allBuyerIds.size,
    totalBrokers: allBrokerIds.size,
  }
}

// DRY: Get properties for a project (supports properties array and project embed)
const getProjectProperties = (projectId, properties, projects) => {
  // First, try to get full property objects from properties array
  const fromProperties = properties.filter(p => {
    const propProjectId = p.projectId?.id || p.projectId?._id || p.projectId
    return propProjectId === projectId
  })

  if (fromProperties.length > 0) return fromProperties

  // Fallback to properties embedded in project response
  const project = projects.find(p => (p.id || p._id) === projectId)
  const embeddedProperties = Array.isArray(project?.properties) ? project.properties : []
  
  // Enrich embedded properties with full property data if available
  return embeddedProperties.map(embeddedProp => {
    const fullProperty = properties.find(p => 
      (p.id || p._id) === (embeddedProp.id || embeddedProp._id)
    )
    // Merge embedded property data with full property data
    return fullProperty ? { ...fullProperty, ...embeddedProp } : embeddedProp
  })
}

// DRY: Status configuration
const STATUS_CONFIG = {
  planning: { label: 'Planning', color: 'status-info', icon: Clock },
  construction: { label: 'Construction', color: 'status-warning', icon: TrendingUp },
  completed: { label: 'Completed', color: 'status-success', icon: CheckCircle2 },
}

function ProjectManagement() {
  const [projects, setProjects] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [notification, showNotification] = useNotification()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('All Status')
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  
  const { fetchData } = useApiFetch()

  // DRY: Load all data
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const projectsRes = await fetchData('/projects')
        
        if (projectsRes.success) {
          const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : []
          setProjects(projectsData)

          // Derive properties from embedded project data (new API response)
          const derivedProperties = projectsData.flatMap(p =>
            Array.isArray(p.properties)
              ? p.properties.map(prop => ({
                  ...prop,
                  projectId: prop.projectId || p.id || p._id, // ensure projectId present
                }))
              : []
          )
          setProperties(derivedProperties)
          console.log('Projects loaded:', projectsData.length, 'Properties derived:', derivedProperties.length)
        } else {
          console.error('Failed to load projects:', projectsRes.error)
          setProjects([])
          setProperties([])
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load data. Please check if the backend server is running.')
        showNotification('Failed to load data', 'error')
      } finally {
        setLoading(false)
      }
    }
    
    loadAllData()
  }, [])

  // DRY: Save project handler
  const handleSave = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const projectData = {
      name: formData.get('name'),
      status: formData.get('status'),
      progressPercentage: parseInt(formData.get('progressPercentage')) || 0,
      location: {
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        pincode: formData.get('pincode')
      },
      expectedHandoverDate: formData.get('expectedHandoverDate') || undefined
    }

    const endpoint = selectedProject ? `/projects/${selectedProject.id}` : '/projects'
    const method = selectedProject ? 'PUT' : 'POST'
    
    const result = await fetchData(endpoint, {
      method,
      body: JSON.stringify(projectData)
    })
    
    if (result.success) {
      showNotification(
        selectedProject ? 'Project updated successfully!' : 'Project created successfully!',
        'success'
      )
      // Reload data (projects now include embedded properties)
      const projectsRes = await fetchData('/projects')
      if (projectsRes.success) {
        const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : []
        setProjects(projectsData)
        const derivedProperties = projectsData.flatMap(p =>
          Array.isArray(p.properties)
            ? p.properties.map(prop => ({
                ...prop,
                projectId: prop.projectId || p.id || p._id,
              }))
            : []
        )
        setProperties(derivedProperties)
      }
      
      setShowModal(false)
      setSelectedProject(null)
    } else {
      showNotification(result.error || 'Failed to save project', 'error')
    }
  }

  // DRY: Delete handler
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return
    
    const result = await fetchData(`/projects/${id}`, { method: 'DELETE' })
    
    if (result.success) {
      showNotification('Project deleted successfully!', 'success')
      const projectsRes = await fetchData('/projects')
      if (projectsRes.success) setProjects(projectsRes.data || [])
    } else {
      showNotification(result.error || 'Failed to delete project', 'error')
    }
  }


  // DRY: Action handlers
  const actions = {
    view: (project) => {
      setSelectedProject(project)
      setShowDetailsModal(true)
    },
    edit: (project) => {
      setSelectedProject(project)
      setShowModal(true)
    },
    delete: handleDelete,
  }

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = !searchQuery || 
        project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location?.city?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = filterStatus === 'All Status' || 
        project.status === filterStatus.toLowerCase()
      
      return matchesSearch && matchesStatus
    })
  }, [projects, searchQuery, filterStatus])

  // Calculate stats
  const stats = useMemo(() => calculateStats(projects, properties), [projects, properties])

  // Table columns
  const columns = useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Project" />
      ),
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="project-cell">
            <div className="project-avatar">
              <Building2 size={20} />
            </div>
            <div>
              <div className="project-name">{project.name || 'N/A'}</div>
              <div className="project-meta">
                <MapPin size={12} /> {project.location?.city || 'Location N/A'}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.status
        const config = STATUS_CONFIG[status] || { label: status, color: 'status-info' }
        return (
          <span className={`status-badge ${config.color}`}>
            {config.label}
          </span>
        )
      },
    },
    {
      accessorKey: "progressPercentage",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Progress" />
      ),
      cell: ({ row }) => {
        const progress = row.original.progressPercentage || 0
        return (
          <div className="progress-cell">
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
        )
      },
    },
    {
      id: "properties",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Properties" />
      ),
      cell: ({ row }) => {
        const projectProps = getProjectProperties(row.original.id, properties, projects)
        return (
          <div className="assignees-cell">
            {projectProps.length > 0 ? (
              <>
                <div className="assignees-avatars">
                  {projectProps.slice(0, 3).map((prop, idx) => (
                    <div key={prop.id || prop._id || idx} className="assignee-avatar">
                      {(prop.id || prop._id || '').toString().slice(0, 2).toUpperCase() || 'P'}
                    </div>
                  ))}
                </div>
                <span className="assignees-count">{projectProps.length}</span>
              </>
            ) : (
              <span className="no-assignees">None</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "expectedHandoverDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Handover" />
      ),
      cell: ({ row }) => {
        const date = row.original.expectedHandoverDate
        return date ? (
          <div className="date-cell">
            <Calendar size={14} />
            <span>{new Date(date).toLocaleDateString()}</span>
          </div>
        ) : (
          <span className="no-date">Not set</span>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const project = row.original
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => actions.view(project)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.edit(project)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => actions.delete(project.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ], [properties, projects])

  const table = useReactTable({
    data: filteredProjects,
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

  // DRY: Stats cards configuration
  const statsCards = [
    { 
      label: 'Total Projects', 
      value: stats.total, 
      sublabel: `${filteredProjects.length} shown`,
      icon: Building2,
      className: 'stat-card-primary'
    },
    { 
      label: 'Completed', 
      value: stats.completed, 
      sublabel: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion rate`,
      icon: CheckCircle2,
      className: 'stat-card-success'
    },
    { 
      label: 'In Progress', 
      value: stats.construction, 
      sublabel: 'Under construction',
      icon: Clock,
      className: 'stat-card-warning'
    },
    { 
      label: 'Avg Progress', 
      value: `${stats.avgProgress}%`, 
      sublabel: 'Across all projects',
      icon: TrendingUp,
      className: 'stat-card-info'
    },
    { 
      label: 'Total Buyers', 
      value: stats.totalBuyers, 
      sublabel: 'Assigned to projects',
      icon: Users,
      className: 'stat-card-secondary'
    },
    { 
      label: 'Total Brokers', 
      value: stats.totalBrokers, 
      sublabel: 'Working on projects',
      icon: Handshake,
      className: 'stat-card-accent'
    },
  ]

  if (loading) {
    return (
      <div className="project-management-page">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="project-management-page">
        <div className="error-state">
          <AlertCircle size={48} />
          <h2>Error Loading Projects</h2>
          <p>{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="project-management-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title-main">Project Management</h1>
          <p className="page-subtitle">Manage projects, track progress, and assign buyers & brokers</p>
        </div>
        <Button 
          className="btn btn-primary" 
          onClick={() => { setSelectedProject(null); setShowModal(true); }}
        >
          <Plus size={18} />
          Create Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="project-stats-grid">
        {statsCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className={`stat-card ${stat.className}`}>
              <div className="stat-icon">
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <h3>{stat.label}</h3>
                <p className="stat-value">{stat.value}</p>
                <span className="stat-label">{stat.sublabel}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="card filters-section">
        <div className="filters-grid">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <Input
              placeholder="Search projects by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <select 
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>All Status</option>
            <option>planning</option>
            <option>construction</option>
            <option>completed</option>
          </select>
          <Button 
            variant="outline" 
            onClick={() => { setSearchQuery(''); setFilterStatus('All Status'); }}
            className="clear-filters-btn"
          >
            <X size={16} />
            Clear
          </Button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="card projects-table-card">
        <div className="flex items-center justify-between py-4 px-4">
          <DataTableViewOptions table={table} />
        </div>
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow 
                    key={row.id} 
                    data-state={row.getIsSelected() && "selected"}
                    onClick={(e) => {
                      // Don't open dialog if clicking on actions dropdown or its trigger
                      if (e.target.closest('[role="menuitem"]') || e.target.closest('button')) {
                        return
                      }
                      actions.view(row.original)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {projects.length === 0 
                      ? 'No projects yet. Click "Create Project" to add your first project.' 
                      : 'No projects found matching your criteria'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="py-4">
          <DataTablePagination table={table} />
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setSelectedProject(null); }}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProject ? 'Edit Project' : 'Create New Project'}</h2>
              <button className="close-btn" onClick={() => { setShowModal(false); setSelectedProject(null); }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave} className="project-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Project Name *</label>
                  <input name="name" defaultValue={selectedProject?.name} required />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" defaultValue={selectedProject?.status || 'construction'}>
                    <option value="planning">Planning</option>
                    <option value="construction">Construction</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input name="city" defaultValue={selectedProject?.location?.city} />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input name="state" defaultValue={selectedProject?.location?.state} />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input name="address" defaultValue={selectedProject?.location?.address} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Progress %</label>
                  <input 
                    type="number" 
                    name="progressPercentage" 
                    min="0" 
                    max="100" 
                    defaultValue={selectedProject?.progressPercentage || 0} 
                  />
                </div>
                <div className="form-group">
                  <label>Expected Handover Date</label>
                  <input 
                    type="date" 
                    name="expectedHandoverDate" 
                    defaultValue={selectedProject?.expectedHandoverDate ? 
                      new Date(selectedProject.expectedHandoverDate).toISOString().split('T')[0] : ''} 
                  />
                </div>
              </div>

              <div className="form-actions">
                <Button type="button" variant="outline" onClick={() => { setShowModal(false); setSelectedProject(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="btn btn-primary">
                  {selectedProject ? 'Update Project' : 'Create Project'}
                </Button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedProject && (
        <div className="modal-overlay" onClick={() => { setShowDetailsModal(false); setSelectedProject(null); }}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Project Details</h2>
              <button className="close-btn" onClick={() => { setShowDetailsModal(false); setSelectedProject(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="project-profile-section">
                <div className="profile-avatar-large">
                  <Building2 size={32} />
                </div>
                <h3>{selectedProject.name}</h3>
                <span className={`status-badge ${STATUS_CONFIG[selectedProject.status]?.color || 'status-info'}`}>
                  {STATUS_CONFIG[selectedProject.status]?.label || selectedProject.status}
                </span>
              </div>

              <div className="details-section">
                <h4>Project Information</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Status</label>
                    <p>{STATUS_CONFIG[selectedProject.status]?.label || selectedProject.status}</p>
                  </div>
                  <div className="detail-item">
                    <label>Progress</label>
                    <p>{selectedProject.progressPercentage || 0}%</p>
                  </div>
                  <div className="detail-item">
                    <label>Expected Handover</label>
                    <p>{selectedProject.expectedHandoverDate ? 
                      new Date(selectedProject.expectedHandoverDate).toLocaleDateString() : 'Not set'}</p>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4>Location</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>City</label>
                    <p>{selectedProject.location?.city || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label>State</label>
                    <p>{selectedProject.location?.state || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Address</label>
                    <p>{selectedProject.location?.address || 'N/A'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Pincode</label>
                    <p>{selectedProject.location?.pincode || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4>Properties ({getProjectProperties(selectedProject.id, properties, projects).length})</h4>
                {getProjectProperties(selectedProject.id, properties, projects).length > 0 ? (
                  <div className="assignments-list">
                    {getProjectProperties(selectedProject.id, properties, projects).map((prop, idx) => {
                      const propertyId = prop.id || prop._id
                      const flatNo = prop.flatNo || 'N/A'
                      const buildingName = prop.buildingName || ''
                      const totalPrice = prop.pricing?.totalPrice 
                        ? `₹${parseFloat(prop.pricing.totalPrice).toLocaleString('en-IN')}` 
                        : prop.soldPrice 
                          ? `₹${parseFloat(prop.soldPrice).toLocaleString('en-IN')}` 
                          : 'N/A'
                      const area = prop.specifications?.area 
                        ? `${prop.specifications.area} sq.ft` 
                        : ''
                      const bedrooms = prop.specifications?.bedrooms || ''
                      const hasBuyer = !!(prop.buyer || prop.buyerId)
                      const status = hasBuyer ? 'sold' : (prop.status || 'active')
                      
                      // Buyer and brokers from property/project data
                      const buyerId = prop.buyerId
                      const brokerId = prop.brokerId
                      const buyer = selectedProject.buyers?.find(b => (b.id || b._id) === buyerId) || prop.buyer
                      const brokerPrimary = selectedProject.brokers?.find(b => (b.id || b._id) === brokerId) || prop.broker
                      const brokerList = Array.isArray(prop.brokers) ? prop.brokers : []
                      
                      return (
                        <div key={propertyId || idx} className="assignment-item property-detail-item">
                          <div className="property-main-info">
                            <span className="property-icon">🏠</span>
                            <div className="property-info">
                              <div className="property-title">
                                {flatNo !== 'N/A' ? `Flat ${flatNo}` : `Property ${propertyId?.slice(-6) || idx + 1}`}
                                {buildingName && <span className="property-building"> - {buildingName}</span>}
                                <span className={`property-status ${status}`}>{status}</span>
                              </div>
                              <div className="property-details">
                                {totalPrice !== 'N/A' && <span>Price: {totalPrice}</span>}
                                {area && <span>Area: {area}</span>}
                                {bedrooms && <span>{bedrooms} BHK</span>}
                              </div>
                            </div>
                          </div>
                          <div className="property-assignments">
                            {buyer ? (
                              <>
                                <span className="assignment-badge buyer">👤 Buyer: {buyer.name}</span>
                                {brokerPrimary && (
                                  <span className="assignment-badge broker">🤝 Broker: {brokerPrimary.name}</span>
                                )}
                              </>
                            ) : brokerList.length > 0 || brokerPrimary ? (
                              <>
                                {(brokerPrimary ? [brokerPrimary] : brokerList).map((bk, i) => (
                                  <span key={bk.id || bk._id || i} className="assignment-badge broker">
                                    🤝 Broker: {bk.name}
                                  </span>
                                ))}
                              </>
                            ) : (
                              <span className="assignment-badge unassigned">Unassigned</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="no-assignments">No properties linked to this project</p>
                )}
              </div>

              <div className="modal-actions">
                <Button variant="outline" onClick={() => { setShowDetailsModal(false); setSelectedProject(null); }}>
                  Close
                </Button>
                <Button onClick={() => { setShowDetailsModal(false); actions.edit(selectedProject); }}>
                  Edit Project
                </Button>
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

export default ProjectManagement

