import { useState, useMemo, useEffect } from 'react'
import './ProductManagement.css'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, Package, Plus, Edit, Trash2, TrendingDown } from "lucide-react"
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

function ProductManagement() {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [notification, showNotification] = useNotification()
  const { fetchData } = useApiFetch()

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('All Suppliers')
  const [filterCategory, setFilterCategory] = useState('All Categories')
  const [filterLowStock, setFilterLowStock] = useState(false)

  // Table state
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})

  // Load products and suppliers
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [productsRes, suppliersRes] = await Promise.all([
          fetchData('/products'),
          fetchData('/suppliers')
        ])
        if (productsRes.success) {
          setProducts(Array.isArray(productsRes.data) ? productsRes.data : [])
        }
        if (suppliersRes.success) {
          setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : [])
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

  // Get unique categories
  const categories = useMemo(() => {
    const cats = products
      .map(p => p.category)
      .filter((cat, index, self) => cat && self.indexOf(cat) === index)
    return cats.sort()
  }, [products])

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = 
        product.name?.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)

      const supplierId = product.supplierId?._id || product.supplierId
      const supplier = suppliers.find(s => (s._id || s.id) === supplierId)
      const supplierName = supplier?.company || supplier?.name || 'N/A'
      const matchesSupplier = 
        filterSupplier === 'All Suppliers' || supplierName === filterSupplier

      const matchesCategory = 
        filterCategory === 'All Categories' || product.category === filterCategory

      const matchesLowStock = 
        !filterLowStock || (product.currentStock <= product.lowStockThreshold)

      return matchesSearch && matchesSupplier && matchesCategory && matchesLowStock
    })
  }, [products, searchQuery, filterSupplier, filterCategory, filterLowStock, suppliers])

  // Handlers
  const handleAddProduct = () => {
    setSelectedProduct(null)
    setShowAddModal(true)
  }

  const handleEditProduct = (product) => {
    setSelectedProduct(product)
    setShowEditModal(true)
  }

  const handleUpdateStock = (product) => {
    setSelectedProduct(product)
    setShowStockModal(true)
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const productData = {
      sku: formData.get('sku'),
      name: formData.get('name'),
      description: formData.get('description'),
      supplierId: formData.get('supplierId'),
      category: formData.get('category'),
      unit: formData.get('unit') || 'pieces',
      currentStock: parseInt(formData.get('currentStock')) || 0,
      lowStockThreshold: parseInt(formData.get('lowStockThreshold')) || 0
    }

    const endpoint = selectedProduct ? `/products/${selectedProduct._id || selectedProduct.id}` : '/products'
    const method = selectedProduct ? 'PUT' : 'POST'
    
    const result = await fetchData(endpoint, {
      method,
      body: JSON.stringify(productData)
    })
    
    if (result.success) {
      showNotification(selectedProduct ? 'Product updated successfully!' : 'Product created successfully!', 'success')
      const productsRes = await fetchData('/products')
      if (productsRes.success) {
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : [])
      }
      setShowAddModal(false)
      setShowEditModal(false)
      setSelectedProduct(null)
    } else {
      showNotification(result.error || 'Failed to save product', 'error')
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const result = await fetchData(`/products/${productId}`, { method: 'DELETE' })
      if (result.success) {
        showNotification('Product deleted successfully!', 'success')
        const productsRes = await fetchData('/products')
        if (productsRes.success) {
          setProducts(Array.isArray(productsRes.data) ? productsRes.data : [])
        }
      } else {
        showNotification(result.error || 'Failed to delete product', 'error')
      }
    }
  }

  const handleSaveStockUpdate = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const quantity = parseInt(formData.get('quantity'))
    const operation = formData.get('operation')

    const result = await fetchData(`/products/${selectedProduct._id || selectedProduct.id}/stock`, {
      method: 'PUT',
      body: JSON.stringify({ quantity, operation })
    })
    
    if (result.success) {
      showNotification('Stock updated successfully!', 'success')
      const productsRes = await fetchData('/products')
      if (productsRes.success) {
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : [])
      }
      setShowStockModal(false)
      setSelectedProduct(null)
    } else {
      showNotification(result.error || 'Failed to update stock', 'error')
    }
  }

  // Define columns
  const columns = useMemo(() => [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      cell: ({ row }) => {
        const product = row.original
        const supplierId = product.supplierId?._id || product.supplierId
        const supplier = suppliers.find(s => (s._id || s.id) === supplierId)
        return (
          <div className="product-cell">
            <div className="product-icon">
              <Package size={20} />
            </div>
            <div>
              <div className="product-name">{product.name}</div>
              <div className="product-meta">SKU: {product.sku}</div>
              <div className="product-meta">{supplier?.company || supplier?.name || 'N/A'}</div>
            </div>
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
      accessorKey: "currentStock",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stock" />
      ),
      cell: ({ row }) => {
        const product = row.original
        const isLowStock = product.currentStock <= product.lowStockThreshold
        return (
          <div>
            <div className={isLowStock ? 'stock-low' : 'stock-normal'}>
              {product.currentStock} {product.unit}
            </div>
            {isLowStock && (
              <div className="stock-warning">⚠️ Low Stock</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "lowStockThreshold",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Threshold" />
      ),
      cell: ({ row }) => `${row.original.lowStockThreshold} ${row.original.unit}`,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original
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
              <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleUpdateStock(product)}>
                <TrendingDown className="mr-2 h-4 w-4" />
                Update Stock
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteProduct(product._id || product.id)}
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
    data: filteredProducts,
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
    const total = products.length
    const lowStock = products.filter(p => p.currentStock <= p.lowStockThreshold).length
    const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0)
    return { total, lowStock, totalStock }
  }, [products])

  if (loading) {
    return <div className="loading-state">Loading products...</div>
  }

  return (
    <div className="product-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title-main">Product Management</h1>
          <p className="page-subtitle">Manage product inventory and stock levels</p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="product-stats-grid">
        <div className="stat-card-pm">
          <div className="stat-icon-pm">📦</div>
          <div>
            <h3>Total Products</h3>
            <p className="stat-value-pm">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card-pm">
          <div className="stat-icon-pm">⚠️</div>
          <div>
            <h3>Low Stock</h3>
            <p className="stat-value-pm" style={{ color: 'var(--error)' }}>{stats.lowStock}</p>
          </div>
        </div>
        <div className="stat-card-pm">
          <div className="stat-icon-pm">📊</div>
          <div>
            <h3>Total Stock</h3>
            <p className="stat-value-pm">{stats.totalStock.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card filters-section">
        <div className="filters-grid">
          <Input
            placeholder="Search by name, SKU, description..."
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
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option>All Categories</option>
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
          <label className="filter-checkbox">
            <input 
              type="checkbox" 
              checked={filterLowStock}
              onChange={(e) => setFilterLowStock(e.target.checked)}
            />
            Low Stock Only
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="card products-table-card">
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter by product name..."
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
                    No products found.
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

      {/* Add/Edit Product Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedProduct(null); }}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="close-btn" onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedProduct(null); }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveProduct}>
                <div className="form-row">
                  <div className="form-group">
                    <label>SKU *</label>
                    <input type="text" name="sku" defaultValue={selectedProduct?.sku} required />
                  </div>
                  <div className="form-group">
                    <label>Name *</label>
                    <input type="text" name="name" defaultValue={selectedProduct?.name} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" rows="3" defaultValue={selectedProduct?.description}></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Supplier *</label>
                    <select name="supplierId" required defaultValue={selectedProduct?.supplierId?._id || selectedProduct?.supplierId}>
                      <option value="">Select Supplier</option>
                      {suppliers.map((s) => (
                        <option key={s._id || s.id} value={s._id || s.id}>{s.company || s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input type="text" name="category" list="categories" defaultValue={selectedProduct?.category} />
                    <datalist id="categories">
                      {categories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Unit</label>
                    <input type="text" name="unit" defaultValue={selectedProduct?.unit || 'pieces'} />
                  </div>
                  <div className="form-group">
                    <label>Current Stock</label>
                    <input type="number" name="currentStock" min="0" defaultValue={selectedProduct?.currentStock || 0} />
                  </div>
                  <div className="form-group">
                    <label>Low Stock Threshold</label>
                    <input type="number" name="lowStockThreshold" min="0" defaultValue={selectedProduct?.lowStockThreshold || 0} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedProduct(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Product</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {showStockModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => { setShowStockModal(false); setSelectedProduct(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Stock - {selectedProduct.name}</h2>
              <button className="close-btn" onClick={() => { setShowStockModal(false); setSelectedProduct(null); }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveStockUpdate}>
                <div className="form-group">
                  <label>Current Stock: {selectedProduct.currentStock} {selectedProduct.unit}</label>
                </div>
                <div className="form-group">
                  <label>Operation *</label>
                  <select name="operation" required>
                    <option value="set">Set to</option>
                    <option value="add">Add</option>
                    <option value="subtract">Subtract</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input type="number" name="quantity" min="0" required />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowStockModal(false); setSelectedProduct(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update Stock</button>
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

export default ProductManagement

