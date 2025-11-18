import { useState, useEffect } from 'react'
import './Header.css'
import { Menu, Search, Bell, LogOut } from 'lucide-react'

function Header({ onMenuClick, onLogout }) {
  const [adminUser, setAdminUser] = useState(null)

  useEffect(() => {
    const userStr = localStorage.getItem('adminUser')
    if (userStr) {
      try {
        setAdminUser(JSON.parse(userStr))
      } catch (err) {
        console.error('Error parsing admin user:', err)
      }
    }
  }, [])

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      if (onLogout) {
        onLogout()
      }
    }
  }

  const userInitial = adminUser?.name?.charAt(0)?.toUpperCase() || 'A'
  const userName = adminUser?.name || 'Admin'
  const userEmail = adminUser?.email || 'admin@applore.in'

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <button className="menu-toggle" onClick={onMenuClick}>
            <Menu size={20} />
          </button>
          <span className="page-title">Legacy Admin</span>
        </div>
        
        <div className="header-right">
          <button className="search-btn-mobile">
            <Search size={18} />
          </button>
          
          <button className="notification-btn">
            <Bell size={18} />
            <span className="notification-badge">3</span>
          </button>
          
          <div className="user-profile">
            <div className="user-avatar">{userInitial}</div>
            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">{userEmail}</span>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header

