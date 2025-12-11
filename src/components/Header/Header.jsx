import { useNavigate } from 'react-router-dom'
import './Header.css'
import { Menu, Search, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useConfirmation } from '../../hooks/useConfirmation'
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal'

function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { confirmation, confirm, close, handleConfirm, handleCancel } = useConfirmation()

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      variant: 'default'
    })
    
    if (confirmed) {
      await logout()
      navigate('/login')
    }
  }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'A'
  const userName = user?.name || 'Admin'
  const userEmail = user?.email || 'admin@applore.in'
  const userRole = user?.role === 'superadmin' ? 'Superadmin' : 'Admin'

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
          
          <div
            className="user-profile"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/profile')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate('/profile')
              }
            }}
          >
            <div className="user-avatar">{userInitial}</div>
            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">{userRole}</span>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
      {confirmation.show && (
        <ConfirmationModal
          isOpen={confirmation.show}
          title={confirmation.title}
          message={confirmation.message}
          variant={confirmation.variant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onClose={close}
        />
      )}
    </header>
  )
}

export default Header

