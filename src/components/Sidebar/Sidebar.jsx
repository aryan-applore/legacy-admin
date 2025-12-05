import { NavLink } from 'react-router-dom'
import { useMemo } from 'react'
import { 
  BarChart3, 
  Users, 
  Home, 
  Handshake, 
  Factory, 
  FileText, 
  Headphones,
  Code,
  Building2,
  Package,
  ShoppingCart,
  UserCheck
} from 'lucide-react'
import './Sidebar.css'

function Sidebar({ isOpen, onClose }) {
  // Get current user from localStorage
  const currentUser = useMemo(() => {
    try {
      const userStr = localStorage.getItem('adminUser')
      return userStr ? JSON.parse(userStr) : null
    } catch (err) {
      console.error('Error parsing user:', err)
      return null
    }
  }, [])

  // Check if user is admin (admins have access to everything)
  const isAdmin = currentUser?.role === 'admin'

  // Get user permissions
  const userPermissions = useMemo(() => {
    if (isAdmin) {
      // Admins have access to all sections
      return ['dashboard', 'user-management', 'all-users', 'property-management', 'broker-management', 'supplier-management', 'product-management', 'order-management', 'project-management', 'documents', 'support', 'app-api-test', 'support-api-test']
    }
    return currentUser?.permissions || []
  }, [currentUser, isAdmin])

  const allMenuItems = [
    {
      path: '/',
      name: 'Dashboard',
      icon: <BarChart3 size={20} />,
      permissionId: 'dashboard'
    },
    {
      path: '/user-management',
      name: 'User Management',
      icon: <Users size={20} />,
      permissionId: 'user-management'
    },
    {
      path: '/all-users',
      name: 'All Users',
      icon: <UserCheck size={20} />,
      permissionId: 'all-users'
    },
    {
      path: '/property-management',
      name: 'Property Management',
      icon: <Home size={20} />,
      permissionId: 'property-management'
    },
    {
      path: '/broker-management',
      name: 'Broker Management',
      icon: <Handshake size={20} />,
      permissionId: 'broker-management'
    },
    {
      path: '/supplier-management',
      name: 'Supplier Management',
      icon: <Factory size={20} />,
      permissionId: 'supplier-management'
    },
    {
      path: '/product-management',
      name: 'Product Management',
      icon: <Package size={20} />,
      permissionId: 'product-management'
    },
    {
      path: '/order-management',
      name: 'Order Management',
      icon: <ShoppingCart size={20} />,
      permissionId: 'order-management'
    },
    {
      path: '/project-management',
      name: 'Project Management',
      icon: <Building2 size={20} />,
      permissionId: 'project-management'
    },
    {
      path: '/documents',
      name: 'Documents',
      icon: <FileText size={20} />,
      permissionId: 'documents'
    },
    {
      path: '/support',
      name: 'Support',
      icon: <Headphones size={20} />,
      permissionId: 'support'
    },
    {
      path: '/app-api-test',
      name: 'App API Test',
      icon: <Code size={20} />,
      permissionId: 'app-api-test'
    },
    {
      path: '/support-api-test',
      name: 'Support API Test',
      icon: <Code size={20} />,
      permissionId: 'support-api-test'
    }
  ]

  // Filter menu items based on user permissions
  const menuItems = useMemo(() => {
    return allMenuItems.filter(item => 
      userPermissions.includes(item.permissionId)
    )
  }, [userPermissions])

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <button className="close-sidebar-btn" onClick={onClose}>×</button>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => 
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
            onClick={onClose}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-text">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar

