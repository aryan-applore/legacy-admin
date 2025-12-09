import { useState, useEffect, useMemo } from 'react'
import { useApiFetch } from '../../lib/apiHelpers'
import './AllUsers.css'
import { Users, Handshake, Factory, Shield } from 'lucide-react'
import PermissionManager from '../../components/PermissionManager/PermissionManager'
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
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options"


function AllUsers() {
  const { fetchData } = useApiFetch()
  const [users, setUsers] = useState([])
  const [brokers, setBrokers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    breakdown: {
      buyers: { total: 0, active: 0, pending: 0 },
      brokers: { total: 0 },
      suppliers: { total: 0 }
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // 'all', 'user', 'broker', 'supplier'
  const [isActiveFilter, setIsActiveFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showPermissionManager, setShowPermissionManager] = useState(false)

  // Table state
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})

  // Fetch all data with query parameters
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch user stats
        const statsData = await fetchData('/users/stats')
        if (statsData.success && statsData.data) {
          setStats(statsData.data)
        }

        // Build query parameters
        const params = new URLSearchParams()
        if (typeFilter !== 'all') {
          // Map filter values to API role values
          const roleMap = {
            'user': 'buyer',
            'broker': 'broker',
            'supplier': 'supplier'
          }
          params.append('role', roleMap[typeFilter] || typeFilter)
        }
        if (isActiveFilter !== '') {
          params.append('isActive', isActiveFilter)
        }
        if (cityFilter) {
          params.append('city', cityFilter)
        }
        if (stateFilter) {
          params.append('state', stateFilter)
        }
        if (searchQuery) {
          params.append('search', searchQuery)
        }
        params.append('page', page.toString())
        params.append('limit', limit.toString())

        // Fetch users with query parameters
        const allUsersData = await fetchData(`/users?${params.toString()}`)
        if (allUsersData.success && allUsersData.data) {
          const allUsers = Array.isArray(allUsersData.data) ? allUsersData.data : []
          
          // Update total count from meta if available
          if (allUsersData.total !== undefined) {
            setTotalCount(allUsersData.total)
          } else if (allUsersData.meta?.total !== undefined) {
            setTotalCount(allUsersData.meta.total)
          } else {
            setTotalCount(allUsers.length)
          }
          
          // Separate users by type
          const mappedUsers = []
          const mappedBrokers = []
          const mappedSuppliers = []

          allUsers.forEach(user => {
            const baseData = {
              id: user.id || user._id,
              name: user.name || 'N/A',
              email: user.email || 'N/A',
              phone: user.phone || 'N/A',
              company: user.company || '',
              joinDate: user.createdAt 
                ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'N/A',
              status: user.isActive !== false ? 'Active' : 'Inactive',
              address: user.address 
                ? (typeof user.address === 'string' 
                  ? user.address 
                  : `${user.address.line1 || ''} ${user.address.city || ''} ${user.address.state || ''}`.trim())
                : 'N/A'
            }

            if (user.role === 'buyer') {
              mappedUsers.push({
                ...baseData,
                type: 'user'
              })
            } else if (user.role === 'broker') {
              mappedBrokers.push({
                ...baseData,
                type: 'broker'
              })
            } else if (user.role === 'supplier') {
              mappedSuppliers.push({
                ...baseData,
                type: 'supplier'
              })
            }
          })

          setUsers(mappedUsers)
          setBrokers(mappedBrokers)
          setSuppliers(mappedSuppliers)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load users. Please check if the backend server is running.')
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [typeFilter, isActiveFilter, cityFilter, stateFilter, searchQuery, page, limit])

  // Combine all data into a single array (filtering is done server-side)
  const allData = useMemo(() => {
    return [...users, ...brokers, ...suppliers]
  }, [users, brokers, suppliers])

  // Use allData directly since filtering is done server-side
  const filteredData = allData

  // Define columns
  const columns = useMemo(() => [
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.original.type
        const typeLabels = {
          user: 'User',
          broker: 'Broker',
          supplier: 'Supplier'
        }
        const typeColors = {
          user: 'type-user',
          broker: 'type-broker',
          supplier: 'type-supplier'
        }
        return (
          <span className={`type-badge ${typeColors[type] || ''}`}>
            {typeLabels[type] || type}
          </span>
        )
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const item = row.original
        // For suppliers, prefer company name for avatar, otherwise use name
        // For brokers, prefer company name if available, otherwise use name
        // For users, use name
        let avatarText = ''
        if (item.type === 'supplier') {
          avatarText = (item.company && item.company.trim()) 
            ? item.company.charAt(0).toUpperCase() 
            : item.name.charAt(0).toUpperCase()
        } else if (item.type === 'broker') {
          avatarText = (item.company && item.company.trim()) 
            ? item.company.charAt(0).toUpperCase() 
            : item.name.charAt(0).toUpperCase()
        } else {
          avatarText = item.name.charAt(0).toUpperCase()
        }
        
        return (
          <div className="user-cell-all">
            {/* <div className={`user-avatar-all avatar-${item.type}`}>
              {avatarText}
            </div> */}
            <div>
              <div className="user-name-all">{item.name}</div>
              {item.company && item.company !== item.name && (
                <div className="user-meta-all">{item.company}</div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => row.original.email,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => row.original.phone,
    },
    {
      accessorKey: "address",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Address" />
      ),
      cell: ({ row }) => row.original.address || 'N/A',
    },
    {
      accessorKey: "joinDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Join Date" />
      ),
      cell: ({ row }) => row.original.joinDate,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <span className={`status-badge ${row.original.status === 'Active' ? 'status-success' : 'status-error'}`}>
          {row.original.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Permissions",
      cell: ({ row }) => {
        const item = row.original
        return (
          <button
            className="btn-permissions"
            onClick={() => {
              setSelectedUser(item)
              setShowPermissionManager(true)
            }}
            title="Manage Permissions"
          >
            <Shield size={16} />
            <span>Manage</span>
          </button>
        )
      },
    },
  ], [])

  const table = useReactTable({
    data: filteredData,
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

  const handlePermissionUpdate = (updatedUser) => {
    // Refresh the data after permission update
    // You can either refetch or update the local state
    console.log('Permissions updated for user:', updatedUser)
  }

  return (
    <div className="all-users-page">
      {showPermissionManager && selectedUser && (
        <PermissionManager
          user={selectedUser}
          onClose={() => {
            setShowPermissionManager(false)
            setSelectedUser(null)
          }}
          onUpdate={handlePermissionUpdate}
        />
      )}
      <div className="page-header">
        <div>
          <h1 className="page-title-main">All Users</h1>
          <p className="page-subtitle">View and manage all users, brokers, and suppliers</p>
        </div>
      </div>


      {/* Stats Overview */}
      <div className="stats-grid-all">
        <div className="stat-card-all">
          <div className="stat-icon-all"><Users size={24} /></div>
          <div>
            <h3>Total Users</h3>
            <p className="stat-value-all">{stats.breakdown?.buyers?.total || 0}</p>
            {stats.breakdown?.buyers && (
              <p className="stat-subtitle-all">
                {stats.breakdown.buyers.active || 0} Active, {stats.breakdown.buyers.pending || 0} Pending
              </p>
            )}
          </div>
        </div>
        <div className="stat-card-all">
          <div className="stat-icon-all"><Handshake size={24} /></div>
          <div>
            <h3>Total Brokers</h3>
            <p className="stat-value-all">{stats.breakdown?.brokers?.total || 0}</p>
          </div>
        </div>
        <div className="stat-card-all">
          <div className="stat-icon-all"><Factory size={24} /></div>
          <div>
            <h3>Total Suppliers</h3>
            <p className="stat-value-all">{stats.breakdown?.suppliers?.total || 0}</p>
          </div>
        </div>
        <div className="stat-card-all">
          <div className="stat-icon-all"><Users size={24} /></div>
          <div>
            <h3>Total Accounts</h3>
            <p className="stat-value-all">{stats.total || 0}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card filters-section">
        <div className="filters-grid">
          <input 
            type="text" 
            placeholder="Search by name, email, phone..."
            className="search-input-full"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1) // Reset to first page on search
            }}
          />
          <select 
            className="filter-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1) // Reset to first page on filter change
            }}
          >
            <option value="all">All Types</option>
            <option value="user">Users</option>
            <option value="broker">Brokers</option>
            <option value="supplier">Suppliers</option>
          </select>
          {typeFilter === 'user' && (
            <select 
              className="filter-select"
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          )}
          <input 
            type="text" 
            placeholder="Filter by city..."
            className="filter-select"
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value)
              setPage(1)
            }}
          />
          <input 
            type="text" 
            placeholder="Filter by state..."
            className="filter-select"
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value)
              setPage(1)
            }}
          />
          <button 
            className="btn btn-outline clear-filters-btn" 
            onClick={() => {
              setSearchQuery('')
              setTypeFilter('all')
              setIsActiveFilter('')
              setCityFilter('')
              setStateFilter('')
              setPage(1)
            }}
          >
            Clear Filters
          </button>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Showing {filteredData.length} of {totalCount} users
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '14px' }}>Items per page:</label>
            <select 
              className="filter-select"
              style={{ minWidth: '80px' }}
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className="btn btn-outline"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                style={{ padding: '6px 12px' }}
              >
                Previous
              </button>
              <span style={{ padding: '6px 12px', display: 'flex', alignItems: 'center' }}>
                Page {page} of {Math.ceil(totalCount / limit) || 1}
              </span>
              <button 
                className="btn btn-outline"
                onClick={() => setPage(prev => prev + 1)}
                disabled={page >= Math.ceil(totalCount / limit)}
                style={{ padding: '6px 12px' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card users-table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>Loading all users...</p>
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
                placeholder="Filter by name..."
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
                        {allData.length === 0 
                          ? 'No users found.' 
                          : 'No results found matching your search criteria'}
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
    </div>
  )
}

export default AllUsers

