import { NavLink } from 'react-router-dom'
import { 
  BarChart3, 
  Users, 
  Home, 
  Handshake, 
  Factory, 
  FileText, 
  Headphones,
  Code
} from 'lucide-react'
import './Sidebar.css'

function Sidebar({ isOpen, onClose }) {
  const menuItems = [
    {
      path: '/',
      name: 'Dashboard',
      icon: <BarChart3 size={20} />
    },
    {
      path: '/user-management',
      name: 'User Management',
      icon: <Users size={20} />
    },
    {
      path: '/property-management',
      name: 'Property Management',
      icon: <Home size={20} />
    },
    {
      path: '/broker-management',
      name: 'Broker Management',
      icon: <Handshake size={20} />
    },
    {
      path: '/supplier-management',
      name: 'Supplier Management',
      icon: <Factory size={20} />
    },
    {
      path: '/documents',
      name: 'Documents',
      icon: <FileText size={20} />
    },
    {
      path: '/support',
      name: 'Support',
      icon: <Headphones size={20} />
    },
    {
      path: '/app-api-test',
      name: 'App API Test',
      icon: <Code size={20} />
    }
  ]

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

