import { useState, useEffect, useMemo } from 'react'
import { useApiFetch, useNotification } from '../../lib/apiHelpers'
import { useConfirmation } from '../../hooks/useConfirmation'
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal'
import './Documents.css'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Download, Trash2, Plus, Edit } from 'lucide-react'

function Documents() {
  const { fetchData } = useApiFetch()
  const [notification, showNotification] = useNotification()
  const { confirmation, confirm, close, handleConfirm, handleCancel } = useConfirmation()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState([])
  const [loadingProperties, setLoadingProperties] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [addForm, setAddForm] = useState({
    documentTitle: '',
    documentType: '',
    documentNumber: '',
    description: '',
    propertyId: '',
    document: null,
  })
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    propertyId: ''
  })
  const [stats, setStats] = useState({
    overview: { total: 0, totalSize: 0, totalSizeMB: '0' },
    byType: {}
  })
  const documentTypeOptions = useMemo(
    () => ([
      { value: 'agreement', label: 'Agreement' },
      { value: 'invoice', label: 'Invoice' },
      { value: 'letter', label: 'Letter' },
    ]),
    []
  )

  useEffect(() => {
    fetchDocuments()
    fetchStats()
    fetchProperties()
  }, [filters])

  const fetchProperties = async () => {
    try {
      setLoadingProperties(true)
      const res = await fetchData('/properties')
      if (res.success && Array.isArray(res.data)) {
        setProperties(res.data)
      } else if (res.success && Array.isArray(res.data?.properties)) {
        setProperties(res.data.properties)
      } else {
        setProperties([])
      }
    } catch (err) {
      console.error('Error fetching properties:', err)
      setProperties([])
    } finally {
      setLoadingProperties(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.propertyId) params.append('propertyId', filters.propertyId)
      if (filters.type) params.append('documentType', filters.type)
      params.append('page', '1')
      params.append('limit', '50')

      const result = await fetchData(`/documents?${params.toString()}`)
      if (result.success) {
        setDocuments(result.data || [])
      } else {
        showNotification(result.error || 'Failed to load documents', 'error')
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      showNotification('Failed to load documents', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const result = await fetchData('/documents/stats')
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching document stats:', error)
    }
  }

  const handleDelete = async (documentId) => {
    const confirmed = await confirm({
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document? This action cannot be undone.',
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      const result = await fetchData(`/documents/${documentId}`, {
        method: 'DELETE'
      })
      if (result.success) {
        showNotification('Document deleted successfully', 'success')
        fetchDocuments()
        fetchStats()
      } else {
        showNotification(result.error || 'Failed to delete document', 'error')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      showNotification('Failed to delete document', 'error')
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        return (
          doc.documentTitle?.toLowerCase().includes(searchLower) ||
          doc.name?.toLowerCase().includes(searchLower) || // fallback for old data
          doc.documentNumber?.toLowerCase().includes(searchLower) ||
          doc.propertyId?.flatNo?.toLowerCase().includes(searchLower)
        )
      }
      return true
    })
  }, [documents, filters])

  const handleAddDocument = async (e) => {
    e.preventDefault()
    if (!addForm.documentType || !addForm.documentTitle || !addForm.propertyId) {
      showNotification('Document title, type, and property are required', 'error')
      return
    }
    if (!isEditing && !addForm.document) {
      showNotification('File is required for new documents', 'error')
      return
    }
    try {
      setAdding(true)
      const formData = new FormData()
      formData.append('documentTitle', addForm.documentTitle)
      formData.append('documentType', addForm.documentType)
      formData.append('propertyId', addForm.propertyId)
      if (addForm.documentNumber) formData.append('documentNumber', addForm.documentNumber)
      if (addForm.description) formData.append('description', addForm.description)
      if (addForm.document) formData.append('document', addForm.document)

      const endpoint = isEditing && editingId ? `/documents/${editingId}` : '/documents'
      const method = isEditing ? 'PUT' : 'POST'

      const result = await fetchData(endpoint, {
        method,
        body: formData,
        headers: {}, // let browser set multipart boundary
      })

      if (result.success) {
        showNotification(isEditing ? 'Document updated successfully' : 'Document added successfully', 'success')
        handleCloseModal()
        fetchDocuments()
        fetchStats()
      } else {
        showNotification(result.error || `Failed to ${isEditing ? 'update' : 'add'} document`, 'error')
      }
    } catch (error) {
      console.error('Error saving document:', error)
      showNotification(`Failed to ${isEditing ? 'update' : 'add'} document`, 'error')
    } finally {
      setAdding(false)
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setIsEditing(false)
    setEditingId(null)
    setAddForm({
      documentTitle: '',
      documentType: '',
      documentNumber: '',
      description: '',
      propertyId: '',
      document: null,
    })
  }

  const handleEditClick = (doc) => {
    setIsEditing(true)
    setEditingId(doc._id || doc.id)
    setAddForm({
      documentTitle: doc.documentTitle || doc.name || '',
      documentType: (doc.documentType || doc.type || '').toLowerCase(),
      documentNumber: doc.documentNumber || '',
      description: doc.description || '',
      propertyId: doc.propertyId?._id || doc.propertyId?.id || doc.propertyId || '',
      document: null, // File is optional for edit
    })
    setShowAddModal(true)
  }

  const columns = useMemo(() => [
    {
      accessorKey: "documentTitle",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => <span className="name-cell">{row.original.documentTitle || row.original.name || 'Untitled Document'}</span>,
    },
    {
      accessorKey: "documentType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => <span className="type-badge">{row.original.documentType || row.original.type || 'N/A'}</span>,
    },
    {
      accessorKey: "documentNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Document #" />
      ),
      cell: ({ row }) => row.original.documentNumber || 'N/A',
    },
    {
      id: "property",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Property" />
      ),
      cell: ({ row }) => {
        const prop = row.original.propertyId
        return prop?.flatNo
          ? `${prop.flatNo}${prop.buildingName ? ` - ${prop.buildingName}` : ''}`
          : 'N/A'
      },
    },
    {
      id: "size",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Size" />
      ),
      cell: ({ row }) => formatFileSize(row.original.fileSize),
    },
    {
      id: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actions" />
      ),
      cell: ({ row }) => {
        const doc = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {doc.fileUrl && (
                <>
                  <DropdownMenuItem onClick={() => window.open(doc.fileUrl, '_blank')}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={doc.fileUrl} download={doc.fileName || doc.name} className="dropdown-link">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={() => handleEditClick(doc)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(doc._id || doc.id)}
              >
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
    data: filteredDocuments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="documents-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-white">Documents</h1>
          <p className="page-subtitle">Total: {stats.overview?.total || 0} documents</p>
        </div>
        <Button className="btn-primary" onClick={() => handleCloseModal() || setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </div>

      <div className="documents-filter card">
        <input 
          type="text" 
          placeholder="Search documents..." 
          className="search-input-full"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select 
          className="filter-select"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          {documentTypeOptions.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading documents...</div>
      ) : filteredDocuments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>No documents found</div>
      ) : (
        <div className="properties-table-card">
          <div className="table-container">
            <table className="properties-table-pm documents-table">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DataTablePagination table={table} />
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Document' : 'Add Document'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
                </div>
            <form className="modal-body" onSubmit={handleAddDocument}>
              <div className="form-group">
                <label>Document Title *</label>
                <input
                  type="text"
                  value={addForm.documentTitle}
                  onChange={(e) => setAddForm({ ...addForm, documentTitle: e.target.value })}
                  placeholder="e.g., Welcome Letter - 2024"
                  required
                />
                </div>
              <div className="form-group">
                <label>Document Type *</label>
                <select
                  value={addForm.documentType}
                  onChange={(e) => setAddForm({ ...addForm, documentType: e.target.value })}
                  required
                >
                  <option value="">Select type</option>
                {documentTypeOptions.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
                </select>
                </div>
              <div className="form-group">
                <label>Property *</label>
                <select
                  value={addForm.propertyId}
                  onChange={(e) => setAddForm({ ...addForm, propertyId: e.target.value })}
                  disabled={loadingProperties}
                  required
                >
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.flatNo || 'Unit'}{p.buildingName ? ` - ${p.buildingName}` : ''} {p.project?.name ? `(${p.project.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Document #</label>
                <input
                  type="text"
                  value={addForm.documentNumber}
                  onChange={(e) => setAddForm({ ...addForm, documentNumber: e.target.value })}
                  placeholder="Optional document number"
                />
                </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder="Add any notes or description about this document"
                  rows="3"
                />
                </div>
              <div className="form-group">
                <label>File {!isEditing && '*'}</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setAddForm({ ...addForm, document: e.target.files?.[0] || null })}
                  required={!isEditing}
                />
                <small style={{ display: 'block', marginTop: '4px', color: 'hsl(var(--muted-foreground))' }}>
                  {isEditing ? 'Leave empty to keep existing file' : 'Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)'}
                </small>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary" disabled={adding}>
                  {adding ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Document' : 'Add Document')}
                </Button>
            </div>
            </form>
          </div>
        </div>
      )}

      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
      </div>
      )}

      <ConfirmationModal
        isOpen={confirmation.show}
        onClose={close}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={confirmation.title}
        message={confirmation.message}
        variant={confirmation.variant}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}

export default Documents

