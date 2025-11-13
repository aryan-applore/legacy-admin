import { NavLink } from 'react-router-dom'
import './Sidebar.css'

function Sidebar({ isOpen, onClose }) {
  const menuItems = [
    {
      path: '/',
      name: 'Dashboard',
      icon: '📊'
    },
    {
      path: '/user-management',
      name: 'User Management',
      icon: '👥'
    },
    {
      path: '/broker-management',
      name: 'Broker Management',
      icon: '🤝'
    },
    {
      path: '/supplier-management',
      name: 'Supplier Management',
      icon: '🏭'
    },
    {
      path: '/documents',
      name: 'Documents',
      icon: '📄'
    },
    {
      path: '/support',
      name: 'Support',
      icon: '🎧'
    }
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-logo">Legacy Admin</h2>
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

