import { useState, useEffect, useMemo } from 'react'
import './AllUsers.css'
import { Users, Handshake, Factory } from 'lucide-react'
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
import { API_BASE_URL } from "../../lib/apiHelpers"

function AllUsers() {
  const [users, setUsers] = useState([])
  const [brokers, setBrokers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // 'all', 'user', 'broker', 'supplier'

  // Table state
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem('adminToken')

        // Fetch users (buyers)
        const usersResponse = await fetch(`${API_BASE_URL}/buyers?includeProperties=true`, {
          headers: {
            'Authorization': `Bearer ${token || ''}`
          }
        })
        const usersData = await usersResponse.json()
        if (usersData.success && usersData.data) {
          const mappedUsers = usersData.data.map(user => ({
            id: user._id || user.id,
            name: user.name || 'N/A',
            email: user.email || 'N/A',
            phone: user.phone || 'N/A',
            type: 'user',
            joinDate: user.createdAt 
              ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'N/A',
            status: 'Active',
            address: user.address ? 
              `${user.address.line1 || ''} ${user.address.city || ''} ${user.address.state || ''}`.trim() 
              : 'N/A'
          }))
          setUsers(mappedUsers)
        }

        // Fetch brokers
        const brokersResponse = await fetch(`${API_BASE_URL}/brokers`, {
          headers: {
            'Authorization': `Bearer ${token || ''}`
          }
        })
        const brokersData = await brokersResponse.json()
        if (brokersData.success && brokersData.data) {
          const mappedBrokers = brokersData.data.map(broker => ({
            id: broker._id || broker.id,
            name: broker.name || 'N/A',
            email: broker.email || 'N/A',
            phone: broker.phone || 'N/A',
            company: broker.company || '',
            type: 'broker',
            joinDate: broker.createdAt 
              ? new Date(broker.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'N/A',
            status: broker.status || 'Active',
            address: broker.address || 'N/A'
          }))
          setBrokers(mappedBrokers)
        }

        // Fetch suppliers
        const suppliersResponse = await fetch(`${API_BASE_URL}/suppliers`, {
          headers: {
            'Authorization': `Bearer ${token || ''}`
          }
        })
        const suppliersData = await suppliersResponse.json()
        if (suppliersData.success && suppliersData.data) {
          const mappedSuppliers = suppliersData.data.map(supplier => ({
            id: supplier._id || supplier.id,
            name: supplier.name || supplier.company || 'N/A',
            email: supplier.email || 'N/A',
            phone: supplier.phone || 'N/A',
            company: supplier.company || supplier.name || '',
            type: 'supplier',
            joinDate: supplier.createdAt 
              ? new Date(supplier.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'N/A',
            status: supplier.status || 'Active',
            address: supplier.address || 'N/A'
          }))
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
  }, [])

  // Combine all data into a single array
  const allData = useMemo(() => {
    return [...users, ...brokers, ...suppliers]
  }, [users, brokers, suppliers])

  // Filter data based on type filter and search query
  const filteredData = useMemo(() => {
    let filtered = allData

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter)
    }

    // Apply search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.email.toLowerCase().includes(searchLower) ||
        item.phone.includes(searchQuery) ||
        (item.company && item.company.toLowerCase().includes(searchLower)) ||
        (item.address && item.address.toLowerCase().includes(searchLower))
      )
    }

    return filtered
  }, [allData, typeFilter, searchQuery])

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

  return (
    <div className="all-users-page">
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
            <p className="stat-value-all">{users.length}</p>
          </div>
        </div>
        <div className="stat-card-all">
          <div className="stat-icon-all"><Handshake size={24} /></div>
          <div>
            <h3>Total Brokers</h3>
            <p className="stat-value-all">{brokers.length}</p>
          </div>
        </div>
        <div className="stat-card-all">
          <div className="stat-icon-all"><Factory size={24} /></div>
          <div>
            <h3>Total Suppliers</h3>
            <p className="stat-value-all">{suppliers.length}</p>
          </div>
        </div>
        <div className="stat-card-all">
          <div className="stat-icon-all"><Users size={24} /></div>
          <div>
            <h3>Total Accounts</h3>
            <p className="stat-value-all">{users.length + brokers.length + suppliers.length}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card filters-section">
        <div className="filters-grid">
          <input 
            type="text" 
            placeholder="Search by name, email, phone, company, address..."
            className="search-input-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="user">Users</option>
            <option value="broker">Brokers</option>
            <option value="supplier">Suppliers</option>
          </select>
          <button 
            className="btn btn-outline clear-filters-btn" 
            onClick={() => {
              setSearchQuery('')
              setTypeFilter('all')
            }}
          >
            Clear Filters
          </button>
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

