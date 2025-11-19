import { useState, useMemo, useEffect } from 'react'
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api'

// DRY: Reusable notification helper
const useNotification = () => {
  const [notification, setNotification] = useState(null)
  
  const show = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }
  
  return [notification, show]
}

// DRY: Reusable API fetch helper
const useApiFetch = () => {
  const fetchData = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
      })
      const data = await response.json()
      return { success: data.success, data: data.data || data, error: data.error }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
  
  return { fetchData }
}

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
  
  // Get unique buyers from projects
  const allBuyerIds = new Set(projects.flatMap(p => p.buyers?.map(b => b.id || b._id) || []))
  
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

// DRY: Get brokers for a project (aggregated from properties)
const getProjectBrokers = (projectId, properties) => {
  const projectProperties = properties.filter(p => {
    const propProjectId = p.projectId?.id || p.projectId?._id || p.projectId
    return propProjectId === projectId
  })
  
  const brokerMap = new Map()
  projectProperties.forEach(prop => {
    const brokers = prop.brokers || (prop.broker ? [prop.broker] : [])
    brokers.forEach(broker => {
      const id = broker.id || broker._id
      if (id && !brokerMap.has(id)) {
        brokerMap.set(id, broker)
      }
    })
  })
  
  return Array.from(brokerMap.values())
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
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false)
  const [availableBuyers, setAvailableBuyers] = useState([])
  const [availableBrokers, setAvailableBrokers] = useState([])
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
        
        const [projectsRes, propertiesRes, buyersRes, brokersRes] = await Promise.all([
          fetchData('/projects'),
          fetchData('/admin/properties'),
          fetchData('/buyers'),
          fetchData('/brokers'),
        ])
        
        if (projectsRes.success) {
          const projectsData = projectsRes.data || []
          setProjects(Array.isArray(projectsData) ? projectsData : [])
          console.log('Projects loaded:', projectsData.length)
        } else {
          console.error('Failed to load projects:', projectsRes.error)
          setProjects([])
        }
        
        if (propertiesRes.success) {
          // Handle different response structures
          const propsData = propertiesRes.data?.properties || propertiesRes.data || []
          const propsArray = Array.isArray(propsData) ? propsData : []
          setProperties(propsArray)
          console.log('Properties loaded:', propsArray.length)
        } else {
          console.error('Failed to load properties:', propertiesRes.error)
          setProperties([])
        }
        
        if (buyersRes.success) {
          const buyersData = buyersRes.data || []
          setAvailableBuyers(Array.isArray(buyersData) ? buyersData : [])
          console.log('Buyers loaded:', buyersData.length)
        } else {
          console.error('Failed to load buyers:', buyersRes.error)
          setAvailableBuyers([])
        }
        
        if (brokersRes.success) {
          const brokersData = brokersRes.data || []
          setAvailableBrokers(Array.isArray(brokersData) ? brokersData : [])
          console.log('Brokers loaded:', brokersData.length)
        } else {
          console.error('Failed to load brokers:', brokersRes.error)
          setAvailableBrokers([])
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
      currentStage: formData.get('currentStage'),
      location: {
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        pincode: formData.get('pincode')
      },
      expectedHandoverDate: formData.get('expectedHandoverDate') || undefined,
      buyers: Array.from(document.querySelectorAll('input[name="buyers"]:checked')).map(cb => cb.value)
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
      // Reload data
      const [projectsRes, propertiesRes] = await Promise.all([
        fetchData('/projects'),
        fetchData('/admin/properties'),
      ])
      if (projectsRes.success) setProjects(projectsRes.data || [])
      if (propertiesRes.success) setProperties(propertiesRes.data || [])
      
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

  // DRY: Save assignments handler
  const handleSaveAssignments = async (e) => {
    e.preventDefault()
    const selectedBuyers = Array.from(document.querySelectorAll('input[name="buyers"]:checked'))
      .map(cb => cb.value)

    const result = await fetchData(`/projects/${selectedProject.id}`, {
      method: 'PUT',
      body: JSON.stringify({ buyers: selectedBuyers })
    })
    
    if (result.success) {
      showNotification('Assignments updated successfully!', 'success')
      const projectsRes = await fetchData('/projects')
      if (projectsRes.success) setProjects(projectsRes.data || [])
      setShowAssignmentsModal(false)
      setSelectedProject(null)
    } else {
      showNotification(result.error || 'Failed to update assignments', 'error')
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
    assign: (project) => {
      setSelectedProject(project)
      setShowAssignmentsModal(true)
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
      id: "buyers",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Buyers" />
      ),
      cell: ({ row }) => {
        const buyers = row.original.buyers || []
        return (
          <div className="assignees-cell">
            {buyers.length > 0 ? (
              <>
                <div className="assignees-avatars">
                  {buyers.slice(0, 3).map((buyer, idx) => (
                    <div key={buyer.id || buyer._id || idx} className="assignee-avatar">
                      {buyer.name?.charAt(0) || '?'}
                    </div>
                  ))}
                </div>
                <span className="assignees-count">{buyers.length}</span>
              </>
            ) : (
              <span className="no-assignees">None</span>
            )}
          </div>
        )
      },
    },
    {
      id: "brokers",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Brokers" />
      ),
      cell: ({ row }) => {
        const brokers = getProjectBrokers(row.original.id, properties)
        return (
          <div className="assignees-cell">
            {brokers.length > 0 ? (
              <>
                <div className="assignees-avatars">
                  {brokers.slice(0, 3).map((broker, idx) => (
                    <div key={broker.id || broker._id || idx} className="assignee-avatar broker-avatar">
                      {broker.name?.charAt(0) || '?'}
                    </div>
                  ))}
                </div>
                <span className="assignees-count">{brokers.length}</span>
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
              <DropdownMenuItem onClick={() => actions.assign(project)}>
                <Users className="mr-2 h-4 w-4" />
                Manage Assignments
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
        )
      },
    },
  ], [properties])

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
          <Input
            placeholder="Filter projects..."
            value={(table.getColumn("name")?.getFilterValue() ?? "")}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
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
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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

              <div className="form-group">
                <label>Current Stage</label>
                <input name="currentStage" defaultValue={selectedProject?.currentStage} />
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
                    <label>Current Stage</label>
                    <p>{selectedProject.currentStage || 'N/A'}</p>
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
                <h4>Assigned Buyers ({selectedProject.buyers?.length || 0})</h4>
                {selectedProject.buyers && selectedProject.buyers.length > 0 ? (
                  <div className="assignments-list">
                    {selectedProject.buyers.map((buyer, idx) => (
                      <div key={buyer.id || buyer._id || idx} className="assignment-item">
                        <span>👤 {buyer.name}</span>
                        <span className="assignment-meta">{buyer.email || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-assignments">No buyers assigned</p>
                )}
              </div>

              <div className="details-section">
                <h4>Associated Brokers ({getProjectBrokers(selectedProject.id, properties).length})</h4>
                {getProjectBrokers(selectedProject.id, properties).length > 0 ? (
                  <div className="assignments-list">
                    {getProjectBrokers(selectedProject.id, properties).map((broker, idx) => (
                      <div key={broker.id || broker._id || idx} className="assignment-item">
                        <span>🤝 {broker.name}</span>
                        <span className="assignment-meta">{broker.email || 'N/A'} {broker.company ? `- ${broker.company}` : ''}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-assignments">No brokers associated (brokers are assigned at property level)</p>
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

      {/* Assignments Modal */}
      {showAssignmentsModal && selectedProject && (
        <div className="modal-overlay" onClick={() => { setShowAssignmentsModal(false); setSelectedProject(null); }}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Assignments - {selectedProject.name}</h2>
              <button className="close-btn" onClick={() => { setShowAssignmentsModal(false); setSelectedProject(null); }}>×</button>
            </div>
            <form onSubmit={handleSaveAssignments} className="assignment-form">
              <div className="assignment-section">
                <h3 className="section-title">Assign Buyers ({availableBuyers.length} available)</h3>
                {availableBuyers.length > 0 ? (
                  <div className="assignment-checkboxes">
                    {availableBuyers.map(buyer => {
                      const buyerId = buyer.id || buyer._id
                      const isChecked = selectedProject.buyers?.some(b => (b.id || b._id) === buyerId)
                      return (
                        <label key={buyerId} className="assignment-checkbox-label">
                          <input 
                            type="checkbox" 
                            name="buyers"
                            value={buyerId}
                            defaultChecked={isChecked}
                          />
                          <div className="assignment-info">
                            <span className="assignment-name">👤 {buyer.name}</span>
                            <span className="assignment-details">{buyer.email || 'N/A'}</span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <p className="no-assignments">No buyers available</p>
                )}
              </div>

              <div className="form-actions">
                <Button type="button" variant="outline" onClick={() => { setShowAssignmentsModal(false); setSelectedProject(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="btn btn-primary">
                  Save Assignments
                </Button>
              </div>
            </form>
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

