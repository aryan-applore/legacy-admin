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
  User,
  Shield
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import './Sidebar.css'

function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { user, hasPermission, isSuperAdmin } = useAuth()
  const [expandedMenus, setExpandedMenus] = useState(() => {
    // Auto-expand menus if on any of their sub-routes
    const usersRoutes = ['/users']
    const projectsRoutes = ['/projects']
    const expanded = []
    if (usersRoutes.some(route => location.pathname.startsWith(route))) expanded.push('users')
    if (projectsRoutes.some(route => location.pathname.startsWith(route))) expanded.push('projects')
    return expanded
  })

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
      resource: 'dashboard',
      action: 'read'
    },
    {
      id: 'users',
      path: '/users',
      name: 'Users',
      icon: <UserCheck size={20} />,
      resource: 'users',
      action: 'read',
      subItems: [
        {
          path: '/users/buyers',
          name: 'Buyers',
          icon: <Users size={18} />,
          resource: 'buyers',
          action: 'read'
        },
        {
          path: '/users/brokers',
          name: 'Brokers',
          icon: <Handshake size={18} />,
          resource: 'brokers',
          action: 'read'
        },
        {
          path: '/users/suppliers',
          name: 'Suppliers',
          icon: <Factory size={18} />,
          resource: 'suppliers',
          action: 'read'
        }
      ]
    },
    {
      id: 'projects',
      path: '/projects',
      name: 'Projects',
      icon: <Building2 size={20} />,
      resource: 'projects',
      action: 'read',
      subItems: [
        {
          path: '/projects/properties',
          name: 'Properties',
          icon: <Home size={18} />,
          resource: 'properties',
          action: 'read'
        },
        {
          path: '/projects/marketing',
          name: 'Marketing',
          icon: <Megaphone size={18} />,
          resource: 'marketing',
          action: 'read'
        },
        {
          path: '/projects/documents',
          name: 'Documents',
          icon: <FileText size={18} />,
          resource: 'documents',
          action: 'read'
        }
      ]
    },
    {
      path: '/product',
      name: 'Product',
      icon: <Package size={20} />,
      resource: 'products',
      action: 'read'
    },
    {
      path: '/order',
      name: 'Order',
      icon: <ShoppingCart size={20} />,
      resource: 'supplier-orders',
      action: 'read'
    },
    {
      path: '/support',
      name: 'Support',
      icon: <Headphones size={20} />,
      resource: 'support',
      action: 'read'
    },
    {
      path: '/notifications',
      name: 'Notifications',
      icon: <Bell size={20} />,
      resource: 'notifications',
      action: 'read'
    },
    {
      path: '/admins',
      name: 'Admin Management',
      icon: <Shield size={20} />,
      resource: 'admins',
      action: 'read',
      superadminOnly: true
    },
    {
      path: '/profile',
      name: 'Profile',
      icon: <User size={20} />,
      resource: null, // Profile is accessible to all authenticated users
      action: null
    }
  ]

  // Filter menu items based on user permissions
  const menuItems = useMemo(() => {
    return allMenuItems.filter(item => {
      // Superadmin only items
      if (item.superadminOnly && !isSuperAdmin()) {
        return false
      }
      
      // Profile is accessible to all authenticated users
      if (!item.resource && !item.action) {
        return true
      }
      
      if (item.subItems) {
        // Show parent if user has permission to any sub-item
        return hasPermission(item.resource, item.action) ||
          item.subItems.some(subItem => hasPermission(subItem.resource, subItem.action))
      }
      return hasPermission(item.resource, item.action)
    }).map(item => {
      if (item.subItems) {
        // Filter sub-items based on permissions
        return {
          ...item,
          subItems: item.subItems.filter(subItem =>
            hasPermission(subItem.resource, subItem.action)
          )
        }
      }
      return item
    })
  }, [user, hasPermission, isSuperAdmin])

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

