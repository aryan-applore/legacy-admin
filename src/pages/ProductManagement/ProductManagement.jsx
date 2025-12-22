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
import { useConfirmation } from '../../hooks/useConfirmation'
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal'

function ProductManagement() {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showCategoryFormModal, setShowCategoryFormModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [notification, showNotification] = useNotification()
  const { fetchData } = useApiFetch()
  const { confirmation, confirm, close, handleConfirm, handleCancel } = useConfirmation()

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('All Suppliers')
  const [filterCategory, setFilterCategory] = useState('All Categories')
  const [filterLowStock, setFilterLowStock] = useState(false)

  // Table state
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})

  const [categories, setCategories] = useState([])
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Load products, suppliers, and categories
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [productsRes, usersRes, categoriesRes] = await Promise.all([
          fetchData('/products'),
          fetchData('/users'),
          fetchData('/products/categories')
        ])
        if (productsRes.success) {
          setProducts(Array.isArray(productsRes.data) ? productsRes.data : [])
        }
        if (usersRes.success && usersRes.data) {
          // Filter suppliers from unified users response
          const suppliersData = usersRes.data.filter(user =>
            user.type === 'supplier' || user.role === 'supplier'
          )
          setSuppliers(Array.isArray(suppliersData) ? suppliersData : [])
        }
        if (categoriesRes.success) {
          setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : [])
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

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)

      const supplier = product.supplierId
      const supplierName = supplier?.company || supplier?.name || 'N/A'
      const matchesSupplier =
        filterSupplier === 'All Suppliers' || supplierName === filterSupplier

      const categoryName = product.categoryId?.name || product.category?.name || product.category
      const matchesCategory =
        filterCategory === 'All Categories' || categoryName === filterCategory

      const matchesLowStock =
        !filterLowStock || (product.quantity <= product.lowStockThreshold)

      return matchesSearch && matchesSupplier && matchesCategory && matchesLowStock
    })
  }, [products, searchQuery, filterSupplier, filterCategory, filterLowStock, suppliers])

  // Handlers
  const handleAddProduct = () => {
    setSelectedProduct(null)
    setImagePreview(null)
    setImageFile(null)
    setShowAddModal(true)
  }

  const handleEditProduct = (product) => {
    setSelectedProduct(product)
    setImagePreview(product.image)
    setImageFile(null)
    setShowEditModal(true)
  }

  const handleUpdateStock = (product) => {
    setSelectedProduct(product)
    setShowStockModal(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size should be less than 5MB', 'error')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setUploading(true)

    try {
      const formData = new FormData(e.target)
      let imageUrl = selectedProduct?.image || ''

      // 1. Upload image if a new file is selected
      if (imageFile && imageFile instanceof File) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', imageFile)

        const uploadRes = await fetchData('/upload/file', {
          method: 'POST',
          body: uploadFormData
        })

        if (uploadRes.success) {
          imageUrl = uploadRes.data?.url || uploadRes.data
        } else {
          showNotification('Failed to upload image: ' + (uploadRes.error || 'Unknown error'), 'error')
          setUploading(false)
          return
        }
      }

      const productData = {
        name: formData.get('name'),
        description: formData.get('description'),
        supplierId: formData.get('supplierId'),
        categoryId: formData.get('categoryId'),
        unit: formData.get('unit') || 'pieces',
        quantity: parseInt(formData.get('quantity')) || 0,
        lowStockThreshold: parseInt(formData.get('lowStockThreshold')) || 0,
        pricePerUnit: parseFloat(formData.get('pricePerUnit')) || 0,
        image: imageUrl
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
        setImageFile(null)
        setImagePreview(null)
      } else {
        showNotification(result.error || 'Failed to save product', 'error')
      }
    } catch (err) {
      console.error('Error saving product:', err)
      showNotification('An unexpected error occurred', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteProduct = async (productId) => {
    try {
      const confirmed = await confirm({
        title: 'Delete Product',
        message: 'Are you sure you want to delete this product?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      })
      if (confirmed) {
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
    } catch {
      // User cancelled
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

  // Category Management Handlers
  const handleSaveCategory = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const categoryData = {
      name: formData.get('name'),
      description: formData.get('description') || ''
    }

    const endpoint = selectedCategory
      ? `/products/categories/${selectedCategory._id || selectedCategory.id}`
      : '/products/categories'
    const method = selectedCategory ? 'PUT' : 'POST'

    try {
      const result = await fetchData(endpoint, {
        method,
        body: JSON.stringify(categoryData)
      })

      if (result.success) {
        showNotification(
          selectedCategory ? 'Category updated successfully!' : 'Category created successfully!',
          'success'
        )
        // Refresh categories
        const categoriesRes = await fetchData('/products/categories')
        if (categoriesRes.success) {
          setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : [])
        }
        setShowCategoryFormModal(false)
        setSelectedCategory(null)
      } else {
        showNotification(result.error || 'Failed to save category', 'error')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      showNotification('Failed to save category', 'error')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    const category = categories.find(c => (c._id || c.id) === categoryId)
    if (!category) return

    try {
      const confirmed = await confirm({
        title: 'Delete Category',
        message: `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      })
      if (confirmed) {
        try {
          const result = await fetchData(`/products/categories/${categoryId}`, {
            method: 'DELETE'
          })

          if (result.success) {
            showNotification('Category deleted successfully!', 'success')
            // Refresh categories
            const categoriesRes = await fetchData('/products/categories')
            if (categoriesRes.success) {
              setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : [])
            }
          } else {
            showNotification(result.error || 'Failed to delete category', 'error')
          }
        } catch (error) {
          console.error('Error deleting category:', error)
          showNotification('Failed to delete category', 'error')
        }
      }
    } catch {
      // User cancelled
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
        const supplier = product.supplierId
        return (
          <div className="product-cell">
            <div className="product-image-container">
              {product.image ? (
                <img src={product.image} alt={product.name} className="product-table-img" />
              ) : (
                <div className="product-icon">
                  <Package size={20} />
                </div>
              )}
            </div>
            <div>
              <div className="product-name">{product.name}</div>
              <div className="product-meta">{supplier?.company || supplier?.name || 'N/A'}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "categoryId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => {
        const cat = row.original.categoryId
        return cat?.name || row.original.category?.name || row.original.category || 'N/A'
      }
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stock" />
      ),
      cell: ({ row }) => {
        const product = row.original
        const isLowStock = (product.quantity || 0) <= (product.lowStockThreshold || 0)
        return (
          <div>
            <div className={isLowStock ? 'stock-low' : 'stock-normal'}>
              {product.quantity || 0} {product.unit}
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
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) => {
        const p = row.original
        const price = p.pricePerUnit || p.price || 0
        return `₹${price.toLocaleString()}`
      },
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
    const lowStock = products.filter(p => (p.quantity || 0) <= (p.lowStockThreshold || 0)).length
    const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0)
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button onClick={() => setShowCategoryModal(true)} variant="outline">
            Manage Categories
          </Button>
          <Button onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
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
            placeholder="Search by name, description..."
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
              <option key={cat._id} value={cat.name}>{cat.name}</option>
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
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedProduct(null); setImageFile(null); setImagePreview(null); }}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="close-btn" onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedProduct(null); setImageFile(null); setImagePreview(null); }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveProduct}>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Product Image</label>
                    <div className="image-upload-container">
                      <div className="image-preview-large">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" />
                        ) : (
                          <div className="no-image">
                            <Package size={40} />
                            <span>No image selected</span>
                          </div>
                        )}
                      </div>
                      <div className="image-upload-controls">
                        <Input
                          type="file"
                          accept=".png,.jpg,.jpeg"
                          onChange={handleImageChange}
                          className="file-input"
                        />
                        <p className="upload-tip">PNG, JPG or JPEG (Max 5MB)</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-row">
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
                    <select name="categoryId" defaultValue={selectedProduct?.categoryId?._id || selectedProduct?.category?._id || selectedProduct?.category} className="w-full p-2 border rounded">
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price Per Unit *</label>
                    <div className="input-wrapper-relative">
                      <span className="input-prefix-icon">₹</span>
                      <input
                        type="number"
                        name="pricePerUnit"
                        className="input-with-icon"
                        defaultValue={selectedProduct?.pricePerUnit || selectedProduct?.price || 0}
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <select
                      name="unit"
                      defaultValue={selectedProduct?.unit || 'pieces'}
                      className="w-full p-2 border rounded"
                    >
                      {[
                        'units',
                        'pieces',
                        'kg',
                        'grams',
                        'tons',
                        'liters',
                        'milliliters',
                        'bags',
                        'boxes',
                        'cubic meters',
                        'square meters',
                        'meters',
                        'feet',
                        'inches',
                        'gallons',
                        'quintals',
                      ].map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input type="number" name="quantity" min="0" defaultValue={selectedProduct?.quantity || 0} />
                  </div>
                  <div className="form-group">
                    <label>Low Stock Threshold</label>
                    <input type="number" name="lowStockThreshold" min="0" defaultValue={selectedProduct?.lowStockThreshold || 0} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedProduct(null); setImageFile(null); setImagePreview(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={uploading}>
                    {uploading ? 'Processing...' : (selectedProduct ? 'Update Product' : 'Save Product')}
                  </button>
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
                  <label>Current Stock: {selectedProduct.quantity || 0} {selectedProduct.unit}</label>
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

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Categories</h2>
              <button className="close-btn" onClick={() => setShowCategoryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <Button onClick={() => {
                  setSelectedCategory(null)
                  setShowCategoryFormModal(true)
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Category
                </Button>
              </div>
              <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                          No categories found. Click "Add New Category" to create one.
                        </td>
                      </tr>
                    ) : (
                      categories.map((category) => (
                        <tr key={category._id || category.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px' }}>{category.name}</td>
                          <td style={{ padding: '12px' }}>{category.description || 'N/A'}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCategory(category)
                                  setShowCategoryFormModal(true)
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCategory(category._id || category.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Form Modal (Create/Edit) */}
      {showCategoryFormModal && (
        <div className="modal-overlay" onClick={() => {
          setShowCategoryFormModal(false)
          setSelectedCategory(null)
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button className="close-btn" onClick={() => {
                setShowCategoryFormModal(false)
                setSelectedCategory(null)
              }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveCategory}>
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedCategory?.name || ''}
                    placeholder="Enter category name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    defaultValue={selectedCategory?.description || ''}
                    placeholder="Enter category description (optional)"
                  ></textarea>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setShowCategoryFormModal(false)
                      setSelectedCategory(null)
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {selectedCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={close}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        variant={confirmation.variant}
      />

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

