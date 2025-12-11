import { useState, useEffect, useMemo } from 'react'
import { useApiFetch, useNotification } from '../../lib/apiHelpers'
import { useAuth } from '../../contexts/AuthContext'
import { useConfirmation } from '../../hooks/useConfirmation'
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal'
import PermissionAssignmentForm from '../../components/PermissionAssignmentForm/PermissionAssignmentForm'
import './AdminManagement.css'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
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
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Shield, Key, Eye, EyeOff } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from 'lucide-react'

function AdminManagement() {
  const { fetchData } = useApiFetch()
  const { user: currentUser } = useAuth()
  const [notification, showNotification] = useNotification()
  const { confirmation, confirm, close, handleConfirm, handleCancel } = useConfirmation()
  
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isActiveFilter, setIsActiveFilter] = useState('all')
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    isActive: true
  })
  const [showPassword, setShowPassword] = useState(false)

  // Table state
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})

  // Fetch admins
  useEffect(() => {
    loadAdmins()
  }, [roleFilter, isActiveFilter])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (roleFilter !== 'all') {
        params.append('role', roleFilter)
      }
      if (isActiveFilter !== 'all') {
        params.append('isActive', isActiveFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetchData(`/admins${params.toString() ? `?${params.toString()}` : ''}`)
      
      if (response.success) {
        setAdmins(Array.isArray(response.data) ? response.data : [])
      } else {
        setError(response.error || 'Failed to load admins')
        showNotification(response.error || 'Failed to load admins', 'error')
      }
    } catch (err) {
      console.error('Error loading admins:', err)
      setError(err.message)
      showNotification('Error loading admins', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      isActive: true
    })
    setSelectedAdmin(null)
    setShowCreateModal(true)
  }

  const handleEdit = (admin) => {
    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      password: '',
      isActive: admin.isActive !== false
    })
    setSelectedAdmin(admin)
    setShowEditModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    try {
      const isEdit = !!selectedAdmin
      const endpoint = isEdit ? `/admins/${selectedAdmin.id}` : '/admins'
      const method = isEdit ? 'PUT' : 'POST'
      
      const payload = {
        name: formData.name,
        email: formData.email,
        isActive: formData.isActive
      }
      
      // Only include password if creating or if user wants to change it
      if (!isEdit || formData.password) {
        if (!formData.password) {
          showNotification('Password is required', 'error')
          return
        }
        payload.password = formData.password
      }

      const response = await fetchData(endpoint, {
        method,
        body: JSON.stringify(payload)
      })

      if (response.success) {
        showNotification(
          isEdit ? 'Admin updated successfully' : 'Admin created successfully',
          'success'
        )
        setShowCreateModal(false)
        setShowEditModal(false)
        setFormData({ name: '', email: '', password: '', isActive: true })
        setSelectedAdmin(null)
        loadAdmins()
      } else {
        showNotification(response.error || 'Failed to save admin', 'error')
      }
    } catch (err) {
      console.error('Error saving admin:', err)
      showNotification('Error saving admin', 'error')
    }
  }

  const handleDelete = async (admin) => {
    // Prevent deleting own account
    if (admin.id === currentUser?.id) {
      showNotification('You cannot delete your own account', 'error')
      return
    }

    // Prevent deleting superadmin
    if (admin.role === 'superadmin') {
      showNotification('Cannot delete superadmin account', 'error')
      return
    }

    const confirmed = await confirm({
      title: 'Delete Admin',
      message: `Are you sure you want to delete ${admin.name}? This action cannot be undone.`,
      variant: 'danger'
    })

    if (confirmed) {
      try {
        const response = await fetchData(`/admins/${admin.id}`, {
          method: 'DELETE'
        })

        if (response.success) {
          showNotification('Admin deleted successfully', 'success')
          loadAdmins()
        } else {
          showNotification(response.error || 'Failed to delete admin', 'error')
        }
      } catch (err) {
        console.error('Error deleting admin:', err)
        showNotification('Error deleting admin', 'error')
      }
    }
  }

  const handleAssignPermissions = (admin) => {
    setSelectedAdmin(admin)
    setShowPermissionModal(true)
  }

  const handleSavePermissions = async (permissions) => {
    try {
      const response = await fetchData(`/admins/${selectedAdmin.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions })
      })

      if (response.success) {
        showNotification('Permissions updated successfully', 'success')
        setShowPermissionModal(false)
        setSelectedAdmin(null)
        loadAdmins()
      } else {
        showNotification(response.error || 'Failed to update permissions', 'error')
      }
    } catch (err) {
      console.error('Error updating permissions:', err)
      showNotification('Error updating permissions', 'error')
    }
  }

  const handleUpdatePassword = (admin) => {
    setSelectedAdmin(admin)
    setFormData({ ...formData, password: '' })
    setShowPasswordModal(true)
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    
    if (!formData.password) {
      showNotification('Password is required', 'error')
      return
    }

    try {
      const response = await fetchData(`/admins/${selectedAdmin.id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password: formData.password })
      })

      if (response.success) {
        showNotification('Password updated successfully', 'success')
        setShowPasswordModal(false)
        setFormData({ ...formData, password: '' })
        setSelectedAdmin(null)
      } else {
        showNotification(response.error || 'Failed to update password', 'error')
      }
    } catch (err) {
      console.error('Error updating password:', err)
      showNotification('Error updating password', 'error')
    }
  }

  // Table columns
  const columns = useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.original.role
        return (
          <span className={`role-badge ${role === 'superadmin' ? 'superadmin' : 'admin'}`}>
            {role === 'superadmin' ? 'Superadmin' : 'Admin'}
          </span>
        )
      },
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const isActive = row.original.isActive !== false
        return (
          <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        )
      },
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: ({ row }) => {
        const admin = row.original
        if (admin.role === 'superadmin' || admin.permissions === 'all') {
          return <span className="permissions-text">All Permissions</span>
        }
        const permCount = admin.permissions?.length || 0
        return (
          <span className="permissions-text">
            {permCount} {permCount === 1 ? 'Permission' : 'Permissions'}
          </span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const admin = row.original
        const isOwnAccount = admin.id === currentUser?.id
        const isSuperadmin = admin.role === 'superadmin'

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(admin)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAssignPermissions(admin)}>
                <Shield className="mr-2 h-4 w-4" />
                Assign Permissions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdatePassword(admin)}>
                <Key className="mr-2 h-4 w-4" />
                Update Password
              </DropdownMenuItem>
              {!isOwnAccount && !isSuperadmin && (
                <DropdownMenuItem
                  onClick={() => handleDelete(admin)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [currentUser])

  // Filtered admins
  const filteredAdmins = useMemo(() => {
    let filtered = admins

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(admin =>
        admin.name?.toLowerCase().includes(query) ||
        admin.email?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [admins, searchQuery])

  const table = useReactTable({
    data: filteredAdmins,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  if (loading && admins.length === 0) {
    return (
      <div className="admin-management">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading admins...</p>
        </div>
      </div>
    )
  }

  if (error && admins.length === 0) {
    return (
      <div className="admin-management">
        <div className="error-state">
          <p>Error: {error}</p>
          <Button onClick={loadAdmins}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-management">
      <div className="page-header">
        <div>
          <h1>Admin Management</h1>
          <p className="page-subtitle">Manage admin accounts and permissions</p>
        </div>
        <Button onClick={handleCreate} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Create Admin
        </Button>
      </div>

      <div className="filters-section">
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Roles</option>
          <option value="superadmin">Superadmin</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={isActiveFilter}
          onChange={(e) => setIsActiveFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="table-container">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                <TableCell colSpan={columns.length} className="text-center">
                  No admins found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false)
          setShowEditModal(false)
          setFormData({ name: '', email: '', password: '', isActive: true })
          setSelectedAdmin(null)
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showCreateModal ? 'Create Admin' : 'Edit Admin'}</h2>
              <button className="close-btn" onClick={() => {
                setShowCreateModal(false)
                setShowEditModal(false)
                setFormData({ name: '', email: '', password: '', isActive: true })
                setSelectedAdmin(null)
              }}>×</button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-group">
                <label>Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Password {showEditModal ? '(leave blank to keep current)' : '*'}
                </label>
                <div className="password-input-wrapper">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!showEditModal}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div className="form-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setShowEditModal(false)
                    setFormData({ name: '', email: '', password: '', isActive: true })
                    setSelectedAdmin(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary">
                  {showCreateModal ? 'Create' : 'Update'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permission Assignment Modal */}
      {showPermissionModal && selectedAdmin && (
        <div className="modal-overlay" onClick={() => {
          setShowPermissionModal(false)
          setSelectedAdmin(null)
        }}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Permissions - {selectedAdmin.name}</h2>
              <button className="close-btn" onClick={() => {
                setShowPermissionModal(false)
                setSelectedAdmin(null)
              }}>×</button>
            </div>
            <PermissionAssignmentForm
              currentPermissions={selectedAdmin.permissions || []}
              onSubmit={handleSavePermissions}
              onCancel={() => {
                setShowPermissionModal(false)
                setSelectedAdmin(null)
              }}
            />
          </div>
        </div>
      )}

      {/* Password Update Modal */}
      {showPasswordModal && selectedAdmin && (
        <div className="modal-overlay" onClick={() => {
          setShowPasswordModal(false)
          setSelectedAdmin(null)
          setFormData({ ...formData, password: '' })
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Password - {selectedAdmin.name}</h2>
              <button className="close-btn" onClick={() => {
                setShowPasswordModal(false)
                setSelectedAdmin(null)
                setFormData({ ...formData, password: '' })
              }}>×</button>
            </div>
            <form onSubmit={handleSavePassword} className="admin-form">
              <div className="form-group">
                <label>New Password *</label>
                <div className="password-input-wrapper">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="form-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setSelectedAdmin(null)
                    setFormData({ ...formData, password: '' })
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary">
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmation.show && (
        <ConfirmationModal
          isOpen={confirmation.show}
          title={confirmation.title}
          message={confirmation.message}
          variant={confirmation.variant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onClose={close}
        />
      )}

      {/* Notification */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

export default AdminManagement

