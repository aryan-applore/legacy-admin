import React, { useState, useEffect, useMemo } from 'react';
import { ORDER_STATUS, PAYMENT_STATUS, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../../constants/orderConstants';
import './OrderManagement.css'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, ShoppingCart, Plus, Edit, Trash2, Truck, Eye } from "lucide-react"
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
import { useApiFetch, useNotification, API_BASE_URL } from '../../lib/apiHelpers'

function OrderManagement() {
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [notification, showNotification] = useNotification()
  const { fetchData } = useApiFetch()

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('All Suppliers')
  const [filterStatus, setFilterStatus] = useState('All Status')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('All Payment Status')

  // Table state
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})

  // Load orders, suppliers, and products
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [ordersRes, usersRes, propertiesRes] = await Promise.all([
          fetchData('/supplier-orders'),
          fetchData('/users'),
          fetchData('/properties')
        ])
        if (ordersRes.success) {
          setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : [])
        }
        if (usersRes.success && usersRes.data) {
          // Filter suppliers from unified users response
          const suppliersData = usersRes.data.filter(user =>
            user.type === 'supplier' || user.role === 'supplier'
          )
          setSuppliers(Array.isArray(suppliersData) ? suppliersData : [])
        }
        if (propertiesRes.success) {
          const propertiesData = propertiesRes.data?.properties || propertiesRes.data || []
          setProperties(Array.isArray(propertiesData) ? propertiesData : [])
        }

      } catch (error) {
        setError('Failed to load data')
        showNotification('Failed to load data', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.notes?.toLowerCase().includes(searchLower)

      const supplierId = order.supplierId?._id || order.supplierId
      const supplier = suppliers.find(s => (s._id || s.id) === supplierId)
      const supplierName = supplier?.company || supplier?.name || 'N/A'
      const matchesSupplier =
        filterSupplier === 'All Suppliers' || supplierName === filterSupplier

      const matchesStatus =
        filterStatus === 'All Status' ||
        order.status === filterStatus.toLowerCase()

      const matchesPaymentStatus =
        filterPaymentStatus === 'All Payment Status' ||
        order.paymentStatus === filterPaymentStatus.toLowerCase()

      return matchesSearch && matchesSupplier && matchesStatus && matchesPaymentStatus
    })
  }, [orders, searchQuery, filterSupplier, filterStatus, filterPaymentStatus, suppliers])

  // Handlers
  const handleAddOrder = () => {
    setSelectedOrder(null)
    setShowAddModal(true)
  }

  const handleEditOrder = (order) => {
    setSelectedOrder(order)
    setShowEditModal(true)
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  const handleUpdateDelivery = (order) => {
    setSelectedOrder(order)
    setShowDeliveryModal(true)
  }

  const handleSupplierChange = async (supplierId) => {
    setSelectedOrder(prev => ({
      ...prev,
      supplierId,
      items: (prev?.items || []).map(item => ({
        ...item,
        productId: '',
        unitPrice: 0
      }))
    }))

    if (supplierId) {
      try {
        const result = await fetchData(`/products?supplierId=${supplierId}`)
        if (result.success) {
          setProducts(Array.isArray(result.data) ? result.data : [])
        } else {
          showNotification('Failed to load products for this supplier', 'error')
          setProducts([])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts([])
      }
    } else {
      setProducts([])
    }
  }

  const handleSaveOrder = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)

    // Get the items from the hidden input which is already in JSON format
    const items = selectedOrder?.items || []

    if (items.length === 0) {
      showNotification('Please add at least one item to the order', 'error')
      return
    }

    // Validate all items have required fields
    const invalidItems = items.some(item => !item.productId || !item.quantity || item.quantity <= 0 || !item.unitPrice || item.unitPrice < 0)
    if (invalidItems) {
      showNotification('Please fill all required fields for all items', 'error')
      return
    }

    // Format the order data
    const orderData = {
      supplierId: formData.get('supplierId'),
      propertyId: formData.get('propertyId'),
      status: formData.get('status') || 'pending',
      expectedDelivery: formData.get('expectedDelivery') || undefined,
      items: items.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        receivedQuantity: Number(item.receivedQuantity || 0),
        notes: item.notes || ''
      })),
      paymentStatus: formData.get('paymentStatus') || 'pending',
      notes: formData.get('notes')
    }

    const endpoint = showEditModal ? `/supplier-orders/${selectedOrder._id || selectedOrder.id}` : '/supplier-orders'
    const method = showEditModal ? 'PUT' : 'POST'

    const result = await fetchData(endpoint, {
      method,
      body: JSON.stringify(orderData)
    })

    if (result.success) {
      showNotification(showEditModal ? 'Order updated successfully!' : 'Order created successfully!', 'success')
      const ordersRes = await fetchData('/supplier-orders')
      if (ordersRes.success) {
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : [])
      }
      setShowAddModal(false)
      setShowEditModal(false)
      setSelectedOrder(null)
    } else {
      showNotification(result.error || 'Failed to save order', 'error')
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      const result = await fetchData(`/supplier-orders/${orderId}`, { method: 'DELETE' })
      if (result.success) {
        showNotification('Order deleted successfully!', 'success')
        const ordersRes = await fetchData('/supplier-orders')
        if (ordersRes.success) {
          setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : [])
        }
      } else {
        showNotification(result.error || 'Failed to delete order', 'error')
      }
    }
  }

  const handleUpdateOrderStatus = async (orderId, status, cancellationReason) => {
    const result = await fetchData(`/supplier-orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, cancellationReason })
    })

    if (result.success) {
      showNotification('Order status updated successfully!', 'success')
      const ordersRes = await fetchData('/supplier-orders')
      if (ordersRes.success) {
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : [])
      }
    } else {
      showNotification(result.error || 'Failed to update order status', 'error')
    }
  }

  const handleSaveDeliveryUpdate = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const receivedQuantities = {}

    const itemInputs = formData.getAll('receivedQuantity')
    const itemIds = formData.getAll('itemId')
    itemIds.forEach((id, index) => {
      receivedQuantities[id] = parseInt(itemInputs[index]) || 0
    })

    const result = await fetchData(`/supplier-orders/${selectedOrder._id || selectedOrder.id}/delivery`, {
      method: 'PUT',
      body: JSON.stringify({
        actualDelivery: formData.get('actualDelivery') || undefined,
        receivedQuantities
      })
    })

    if (result.success) {
      showNotification('Delivery updated successfully!', 'success')
      const ordersRes = await fetchData('/supplier-orders')
      if (ordersRes.success) {
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : [])
      }
      setShowDeliveryModal(false)
      setSelectedOrder(null)
    } else {
      showNotification(result.error || 'Failed to update delivery', 'error')
    }
  }

  // Define columns
  const columns = useMemo(() => [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      cell: ({ row }) => {
        const order = row.original
        const supplierId = order.supplierId?._id || order.supplierId
        const supplier = suppliers.find(s => (s._id || s.id) === supplierId)
        return (
          <div className="order-cell">
            <div className="order-icon">
              <ShoppingCart size={20} />
            </div>
            <div>
              <div className="order-name">{order.orderNumber}</div>
              <div className="order-meta">{supplier?.company || supplier?.name || 'N/A'}</div>
              <div className="order-meta">{new Date(order.createdAt).toLocaleDateString()}</div>
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
        const statusMap = {
          pending: { label: 'Pending', class: 'status-info' },
          confirmed: { label: 'Confirmed', class: 'status-info' },
          in_transit: { label: 'In Transit', class: 'status-info' },
          delivered: { label: 'Delivered', class: 'status-success' },
          cancelled: { label: 'Cancelled', class: 'status-error' }
        }
        const statusInfo = statusMap[status] || { label: status, class: 'status-info' }
        return (
          <span className={`status-badge ${statusInfo.class}`}>
            {statusInfo.label}
          </span>
        )
      },
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Amount" />
      ),
      cell: ({ row }) => `₹${(row.original.totalAmount || 0).toLocaleString()}`,
    },
    {
      accessorKey: "items",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Items" />
      ),
      cell: ({ row }) => `${row.original.items?.length || 0} items`,
    },
    {
      accessorKey: "paymentStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment" />
      ),
      cell: ({ row }) => {
        const paymentStatus = row.original.paymentStatus
        const paymentMap = {
          pending: { label: 'Pending', class: 'status-info' },
          partial: { label: 'Partial', class: 'status-warning' },
          paid: { label: 'Paid', class: 'status-success' },
          overdue: { label: 'Overdue', class: 'status-error' }
        }
        const paymentInfo = paymentMap[paymentStatus] || { label: paymentStatus, class: 'status-info' }
        return (
          <span className={`status-badge ${paymentInfo.class}`}>
            {paymentInfo.label}
          </span>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original
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
              <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateDelivery(order)}>
                <Truck className="mr-2 h-4 w-4" />
                Update Delivery
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteOrder(order._id || order.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [suppliers])

  const table = useReactTable({
    data: filteredOrders,
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

  // Stats
  const stats = useMemo(() => {
    const total = orders.length
    const pending = orders.filter(o => o.status === 'pending').length
    const delivered = orders.filter(o => o.status === 'delivered').length
    const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    return { total, pending, delivered, totalAmount }
  }, [orders])

  if (loading) {
    return <div className="loading-state">Loading orders...</div>
  }

  return (
    <div className="order-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-main">Order Management</h1>
          <p className="page-subtitle">Manage purchase orders and track deliveries</p>
        </div>
        <Button onClick={handleAddOrder}>
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Button>
      </div>

      {/* Stats */}
      <div className="order-stats-grid">
        <div className="stat-card-pm">
          <div className="stat-icon-pm">🛒</div>
          <div>
            <h3>Total Orders</h3>
            <p className="stat-value-pm">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card-pm">
          <div className="stat-icon-pm">⏳</div>
          <div>
            <h3>Pending</h3>
            <p className="stat-value-pm">{stats.pending}</p>
          </div>
        </div>
        <div className="stat-card-pm">
          <div className="stat-icon-pm">✅</div>
          <div>
            <h3>Delivered</h3>
            <p className="stat-value-pm" style={{ color: 'var(--success)' }}>{stats.delivered}</p>
          </div>
        </div>
        <div className="stat-card-pm">
          <div className="stat-icon-pm">💰</div>
          <div>
            <h3>Total Value</h3>
            <p className="stat-value-pm">₹{stats.totalAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card filters-section">
        <div className="filters-grid">
          <Input
            placeholder="Search by order number, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-full"
          />
          <select
            className="filter-select"
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
          >
            <option>All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s._id || s.id}>{s.company || s.name}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option>All Status</option>
            {ORDER_STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
          >
            <option>All Payment Status</option>
            {PAYMENT_STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card orders-table-card">
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter by order number..."
            value={(table.getColumn("orderNumber")?.getFilterValue() ?? "")}
            onChange={(event) =>
              table.getColumn("orderNumber")?.setFilterValue(event.target.value)
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
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No orders found.
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

      {/* Add/Edit Order Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedOrder(null); }}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showEditModal ? 'Edit Order' : 'Create Purchase Order'}</h2>
              <button className="close-btn" onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedOrder(null); }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveOrder}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Supplier *</label>
                    <select
                      name="supplierId"
                      required
                      defaultValue={selectedOrder?.supplierId?._id || selectedOrder?.supplierId}
                      onChange={(e) => handleSupplierChange(e.target.value)}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((s) => (
                        <option key={s._id || s.id} value={s._id || s.id}>{s.company || s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Property *</label>
                    <select
                      name="propertyId"
                      required
                      defaultValue={selectedOrder?.propertyId?._id || selectedOrder?.propertyId}
                    >
                      <option value="">Select Property</option>
                      {properties.map((p) => {
                        const displayName = p.title || p.name || `${p.flatNo}${p.buildingName ? ` - ${p.buildingName}` : ''}` || 'Unnamed Property';
                        return (
                          <option key={p._id || p.id} value={p._id || p.id}>{displayName}</option>
                        )
                      })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" defaultValue={selectedOrder?.status || ORDER_STATUS.PLACED}>
                      {ORDER_STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expected Delivery *</label>
                    <input
                      type="date"
                      name="expectedDelivery"
                      required
                      defaultValue={selectedOrder?.expectedDelivery ? new Date(selectedOrder.expectedDelivery).toISOString().split('T')[0] : ''}
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Status</label>
                    <select name="paymentStatus" defaultValue={selectedOrder?.paymentStatus || PAYMENT_STATUS.PENDING}>
                      {PAYMENT_STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <div className="flex justify-between items-center mb-3">
                    <label>Order Items *</label>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        const newItem = {
                          productId: '',
                          quantity: 1,
                          unitPrice: 0,
                          receivedQuantity: 0,
                          notes: ''
                        };
                        setSelectedOrder(prev => ({
                          ...prev,
                          items: [...(prev?.items || []), newItem]
                        }));
                      }}
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedOrder?.items?.map((item, index) => {
                      const product = products.find(p => (p._id || p.id) === (item.productId?._id || item.productId));
                      return (
                        <div key={index} className="item-card relative p-4">
                          <button
                            type="button"
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                            onClick={() => {
                              setSelectedOrder(prev => ({
                                ...prev,
                                items: prev.items.filter((_, i) => i !== index)
                              }));
                            }}
                          >
                            ×
                          </button>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                              <label>Product *</label>
                              <select
                                className="w-full"
                                value={item.productId?._id || item.productId || ''}
                                onChange={(e) => {
                                  const newItems = [...selectedOrder.items];
                                  newItems[index] = {
                                    ...newItems[index],
                                    productId: e.target.value,
                                    unitPrice: products.find(p => (p._id || p.id) === e.target.value)?.price || 0
                                  };
                                  setSelectedOrder(prev => ({
                                    ...prev,
                                    items: newItems
                                  }));
                                }}
                                required
                              >
                                <option value="">Select Product</option>
                                {products.map((product) => (
                                  <option key={product._id || product.id} value={product._id || product.id}>
                                    {product.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="form-group">
                              <label>Quantity *</label>
                              <input
                                type="number"
                                min="1"
                                className="w-full"
                                value={item.quantity || ''}
                                onChange={(e) => {
                                  const newItems = [...selectedOrder.items];
                                  newItems[index] = {
                                    ...newItems[index],
                                    quantity: parseInt(e.target.value) || 0
                                  };
                                  setSelectedOrder(prev => ({
                                    ...prev,
                                    items: newItems
                                  }));
                                }}
                                required
                              />
                            </div>

                            <div className="form-group">
                              <label>Unit Price *</label>
                              <div className="input-wrapper-relative">
                                <span className="input-prefix-icon">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="w-full input-with-icon"
                                  value={item.unitPrice || ''}
                                  onChange={(e) => {
                                    const newItems = [...selectedOrder.items];
                                    newItems[index] = {
                                      ...newItems[index],
                                      unitPrice: parseFloat(e.target.value) || 0
                                    };
                                    setSelectedOrder(prev => ({
                                      ...prev,
                                      items: newItems
                                    }));
                                  }}
                                  required
                                />
                              </div>
                            </div>

                            <div className="form-group">
                              <label>Received Quantity</label>
                              <input
                                type="number"
                                min="0"
                                className="w-full"
                                value={item.receivedQuantity || ''}
                                onChange={(e) => {
                                  const newItems = [...selectedOrder.items];
                                  newItems[index] = {
                                    ...newItems[index],
                                    receivedQuantity: parseInt(e.target.value) || 0
                                  };
                                  setSelectedOrder(prev => ({
                                    ...prev,
                                    items: newItems
                                  }));
                                }}
                              />
                            </div>

                            <div className="form-group md:col-span-2">
                              <label>Notes</label>
                              <input
                                type="text"
                                className="w-full"
                                value={item.notes || ''}
                                onChange={(e) => {
                                  const newItems = [...selectedOrder.items];
                                  newItems[index] = {
                                    ...newItems[index],
                                    notes: e.target.value
                                  };
                                  setSelectedOrder(prev => ({
                                    ...prev,
                                    items: newItems
                                  }));
                                }}
                                placeholder="Any additional notes"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {(!selectedOrder?.items || selectedOrder.items.length === 0) && (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                        <p>No items added yet. Click "Add Item" to get started.</p>
                      </div>
                    )}
                  </div>

                  {/* Hidden input to maintain form submission compatibility */}
                  <input
                    type="hidden"
                    name="items"
                    value={JSON.stringify(selectedOrder?.items || [])}
                  />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea name="notes" rows="3" defaultValue={selectedOrder?.notes}></textarea>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedOrder(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Order</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => { setShowDetailsModal(false); setSelectedOrder(null); }}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details - {selectedOrder.orderNumber}</h2>
              <button className="close-btn" onClick={() => { setShowDetailsModal(false); setSelectedOrder(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Order Number</label>
                  <p>{selectedOrder.orderNumber}</p>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <p>{selectedOrder.status}</p>
                </div>
                <div className="detail-item">
                  <label>Total Amount</label>
                  <p>₹{selectedOrder.totalAmount?.toLocaleString() || '0'}</p>
                </div>
                <div className="detail-item">
                  <label>Payment Status</label>
                  <p>{selectedOrder.paymentStatus}</p>
                </div>
                <div className="detail-item">
                  <label>Expected Delivery</label>
                  <p>{selectedOrder.expectedDelivery ? new Date(selectedOrder.expectedDelivery).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="detail-item">
                  <label>Actual Delivery</label>
                  <p>{selectedOrder.actualDelivery ? new Date(selectedOrder.actualDelivery).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              <h3 className="section-title">Order Items</h3>
              <div className="items-list">
                {selectedOrder.items?.map((item, index) => {
                  const product = products.find(p => (p._id || p.id) === (item.productId?._id || item.productId));
                  const totalAmount = item.quantity * item.unitPrice;
                  const isFullyReceived = item.receivedQuantity >= item.quantity;
                  const isPartiallyReceived = item.receivedQuantity > 0 && item.receivedQuantity < item.quantity;
                  const status = isFullyReceived ? 'completed' : (isPartiallyReceived ? 'partial' : 'pending');

                  return (
                    <div key={index} className="item-card">
                      <div className="item-card-header">
                        <h3 className="item-name">{product?.name || 'Unnamed Product'}</h3>
                        <span className={`item-status ${status}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                      <div className="item-details">
                        <div className="detail-row">
                          <span className="detail-label">Quantity:</span>
                          <span>{item.quantity} {product?.unit || 'units'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Received:</span>
                          <span>{item.receivedQuantity || 0} {product?.unit || 'units'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Unit Price:</span>
                          <span>₹{item.unitPrice?.toLocaleString() || '0.00'}</span>
                        </div>
                        <div className="detail-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed hsl(var(--border))' }}>
                          <span className="detail-label" style={{ fontWeight: '600' }}>Total:</span>
                          <span style={{ fontWeight: '600', color: 'hsl(var(--primary))' }}>₹{totalAmount.toLocaleString()}</span>
                        </div>
                        {item.notes && (
                          <div className="detail-row" style={{ marginTop: '8px', fontStyle: 'italic' }}>
                            <span className="detail-label">Notes:</span>
                            <span>{item.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={() => { setShowDetailsModal(false); setSelectedOrder(null); }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Update Modal */}
      {showDeliveryModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => { setShowDeliveryModal(false); setSelectedOrder(null); }}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Delivery - {selectedOrder.orderNumber}</h2>
              <button className="close-btn" onClick={() => { setShowDeliveryModal(false); setSelectedOrder(null); }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveDeliveryUpdate}>
                <div className="form-group">
                  <label>Actual Delivery Date</label>
                  <input
                    type="date"
                    name="actualDelivery"
                    defaultValue={selectedOrder?.actualDelivery ? new Date(selectedOrder.actualDelivery).toISOString().split('T')[0] : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Received Quantities</label>
                  {selectedOrder.items?.map((item, index) => {
                    const product = products.find(p => (p._id || p.id) === (item.productId?._id || item.productId))
                    return (
                      <div key={index} style={{ marginBottom: '15px', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                        <input type="hidden" name="itemId" value={item._id || item.id} />
                        <div style={{ marginBottom: '8px' }}>
                          <strong>{product?.name || 'Product'}</strong> - Ordered: {item.quantity}
                        </div>
                        <input
                          type="number"
                          name="receivedQuantity"
                          min="0"
                          max={item.quantity}
                          defaultValue={item.receivedQuantity || 0}
                          placeholder="Received quantity"
                        />
                      </div>
                    )
                  })}
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowDeliveryModal(false); setSelectedOrder(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update Delivery</button>
                </div>
              </form>
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

export default OrderManagement

