import { NavLink, useLocation } from 'react-router-dom'
import { useMemo, useState, useEffect } from 'react'
import {
  BarChart3,
  Users,
  Home,
  Handshake,
  Factory,
  FileText,
  Headphones,
  Building2,
  Package,
  ShoppingCart,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Bell,
  Megaphone,
  User
} from 'lucide-react'
import './Sidebar.css'

function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState(() => {
    // Auto-expand menus if on any of their sub-routes
    const usersRoutes = ['/users']
    const projectsRoutes = ['/projects']
    const expanded = []
    if (usersRoutes.some(route => location.pathname.startsWith(route))) expanded.push('users')
    if (projectsRoutes.some(route => location.pathname.startsWith(route))) expanded.push('projects')
    return expanded
  })

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
      return ['dashboard', 'users', 'buyers', 'brokers', 'suppliers', 'property-management', 'product-management', 'order-management', 'project-management', 'documents', 'support', 'notifications', 'marketing', 'profile']
    }
    return currentUser?.permissions || []
  }, [currentUser, isAdmin])

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

  // Close submenus when navigating to a different route
  useEffect(() => {
    const isOnUsersRoute = location.pathname === '/users' || location.pathname.startsWith('/users/')
    const isOnProjectsRoute = location.pathname === '/projects' || location.pathname.startsWith('/projects/')

    // Handle Users menu
    if (!isOnUsersRoute && expandedMenus.includes('users')) {
      setExpandedMenus(prev => prev.filter(id => id !== 'users'))
    } else if (isOnUsersRoute && !expandedMenus.includes('users')) {
      setExpandedMenus(prev => [...prev, 'users'])
    }

    // Handle Projects menu
    if (!isOnProjectsRoute && expandedMenus.includes('projects')) {
      setExpandedMenus(prev => prev.filter(id => id !== 'projects'))
    } else if (isOnProjectsRoute && !expandedMenus.includes('projects')) {
      setExpandedMenus(prev => [...prev, 'projects'])
    }
  }, [location.pathname, expandedMenus])

  const allMenuItems = [
    {
      path: '/',
      name: 'Dashboard',
      icon: <BarChart3 size={20} />,
      permissionId: 'dashboard'
    },
    {
      id: 'users',
      path: '/users',
      name: 'Users',
      icon: <UserCheck size={20} />,
      permissionId: 'users',
      subItems: [
        {
          path: '/users/buyers',
          name: 'Buyers',
          icon: <Users size={18} />,
          permissionId: 'buyers'
        },
        {
          path: '/users/brokers',
          name: 'Brokers',
          icon: <Handshake size={18} />,
          permissionId: 'brokers'
        },
        {
          path: '/users/suppliers',
          name: 'Suppliers',
          icon: <Factory size={18} />,
          permissionId: 'suppliers'
        }
      ]
    },
    {
      id: 'projects',
      path: '/projects',
      name: 'Projects',
      icon: <Building2 size={20} />,
      permissionId: 'project-management',
      subItems: [
        {
          path: '/projects/properties',
          name: 'Properties',
          icon: <Home size={18} />,
          permissionId: 'property-management'
        },
        {
          path: '/projects/marketing',
          name: 'Marketing',
          icon: <Megaphone size={18} />,
          permissionId: 'marketing'
        },
        {
          path: '/projects/documents',
          name: 'Documents',
          icon: <FileText size={18} />,
          permissionId: 'documents'
        }
      ]
    },
    {
      path: '/product',
      name: 'Product',
      icon: <Package size={20} />,
      permissionId: 'product-management'
    },
    {
      path: '/order',
      name: 'Order',
      icon: <ShoppingCart size={20} />,
      permissionId: 'order-management'
    },
    {
      path: '/support',
      name: 'Support',
      icon: <Headphones size={20} />,
      permissionId: 'support'
    },
    {
      path: '/notifications',
      name: 'Notifications',
      icon: <Bell size={20} />,
      permissionId: 'notifications'
    },
    {
      path: '/profile',
      name: 'Profile',
      icon: <User size={20} />,
      permissionId: 'profile'
    }
  ]

  // Filter menu items based on user permissions
  const menuItems = useMemo(() => {
    return allMenuItems.filter(item => {
      if (item.subItems) {
        // Show parent if user has permission to any sub-item
        return userPermissions.includes(item.permissionId) ||
          item.subItems.some(subItem => userPermissions.includes(subItem.permissionId))
      }
      return userPermissions.includes(item.permissionId)
    }).map(item => {
      if (item.subItems) {
        // Filter sub-items based on permissions
        return {
          ...item,
          subItems: item.subItems.filter(subItem =>
            userPermissions.includes(subItem.permissionId)
          )
        }
      }
      return item
    })
  }, [userPermissions])

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <button className="close-sidebar-btn" onClick={onClose}>×</button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          if (item.subItems && item.subItems.length > 0) {
            const isExpanded = expandedMenus.includes(item.id)
            const hasActiveChild = location.pathname === item.path ||
              item.subItems.some(subItem =>
                location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/')
              )

            return (
              <div key={item.id} className="sidebar-menu-group">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link sidebar-menu-parent ${isActive || hasActiveChild ? 'active' : ''}`
                  }
                  onClick={(e) => {
                    toggleMenu(item.id)
                    onClose()
                  }}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-text">{item.name}</span>
                  <span className="sidebar-chevron">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                </NavLink>
                {isExpanded && (
                  <div className="sidebar-submenu">
                    {item.subItems.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        className={({ isActive }) =>
                          isActive ? 'sidebar-link sidebar-submenu-link active' : 'sidebar-link sidebar-submenu-link'
                        }
                        onClick={onClose}
                      >
                        <span className="sidebar-icon">{subItem.icon}</span>
                        <span className="sidebar-text">{subItem.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
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
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar

