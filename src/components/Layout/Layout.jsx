import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../Sidebar/Sidebar'
import Header from '../Header/Header'
import './Layout.css'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  const handleLogout = async () => {
    // Logout is handled by Header component using AuthContext
    navigate('/login')
  }

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="main-content">
        <Header onMenuClick={toggleSidebar} />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
      {sidebarOpen && <div className="overlay" onClick={closeSidebar}></div>}
    </div>
  )
}

export default Layout

